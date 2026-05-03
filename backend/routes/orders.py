from flask import Blueprint, request, jsonify
from extensions import db, socketio
from models import Order, OrderItem, MenuItem
from utils.order_utils import generate_unique_window_code

orders_bp = Blueprint('orders_bp', __name__)

@orders_bp.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    restaurant_id = data.get('restaurant_id')
    table_number = data.get('table_number')
    items = data.get('items') # list of dicts: { menu_item_id, quantity }

    if not restaurant_id or not items:
        return jsonify(msg="Missing required fields"), 400

    if not table_number:
        return jsonify(msg="Table number is required for dine-in orders"), 400

    try:
        # CHECK FOR EXISTING ACTIVE TABLE ORDER
        existing_order = Order.query.filter(
            Order.restaurant_id == restaurant_id,
            Order.table_number == table_number,
            Order.order_type == 'table',
            Order.status.in_(['pending', 'accepted', 'cooking'])
        ).first()

        if existing_order:
            order = existing_order
            order.is_updated = True
            msg = "Order updated"
            event_type = 'order:updated'
        else:
            order = Order(
                restaurant_id=restaurant_id,
                table_number=table_number,
                status='pending',
                total_price=0,
                order_type='table',
                pickup_code=generate_unique_window_code(db.session) # Generate code for dine-in too
            )
            db.session.add(order)
            msg = "Order created"
            event_type = 'order:new'

        # 1. Update/Add items to DB
        new_total = float(order.total_price)
        for item in items:
            menu_item = MenuItem.query.get(item['menu_item_id'])
            if not menu_item:
                continue

            # Check if item already exists in this order to update quantity
            existing_oi = OrderItem.query.filter_by(order_id=order.id, menu_item_id=menu_item.id).first()
            if existing_oi:
                existing_oi.quantity += item['quantity']
            else:
                order_item = OrderItem(
                    order_id=order.id,
                    menu_item_id=menu_item.id,
                    quantity=item['quantity'],
                    unit_price=menu_item.price
                )
                db.session.add(order_item)
            
            new_total += float(menu_item.price) * item['quantity']
        
        order.total_price = new_total
        db.session.commit()
        db.session.refresh(order)

        # 2. Prepare full items list for socket emission
        full_items_payload = []
        for oi in order.items:
            full_items_payload.append({
                'name': oi.menu_item.name if oi.menu_item else "Unknown",
                'quantity': oi.quantity,
                'price': float(oi.unit_price),
                'is_veg': oi.menu_item.is_veg if oi.menu_item else True
            })

        # 3. Emit to chef and owner rooms
        socket_payload = {
            'id': str(order.id),
            'order_id': str(order.id),
            'table_number': order.table_number,
            'order_type': order.order_type,
            'status': order.status,
            'pickup_code': order.pickup_code,
            'total_price': float(order.total_price),
            'is_updated': order.is_updated,
            'payment_status': order.payment.status if order.payment else 'pending',
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'items': full_items_payload
        }
        
        socketio.emit(event_type, socket_payload, room=str(restaurant_id))
        socketio.emit(event_type, socket_payload, room=f"owner_{restaurant_id}") # Explicit owner room

        return jsonify({
            'msg': msg,
            'order_id': order.id,
            'status': order.status
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify(msg=str(e)), 500

@orders_bp.route('/orders/<order_id>/status', methods=['GET'])
def get_order_status(order_id):
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({
                "success": False,
                "msg": "Order not found",
                "error": "The requested order ID does not exist in the current database."
            }), 404
        
        items_data = []
        for item in order.items:
            # Safely handle missing menu items (orphaned records)
            mi_name = item.menu_item.name if item.menu_item else "Unknown Item"
            mi_veg = item.menu_item.is_veg if item.menu_item else True
            
            items_data.append({
                'menu_item_id': item.menu_item_id,
                'name': mi_name,
                'quantity': item.quantity,
                'is_veg': mi_veg,
                'unit_price': float(item.unit_price)
            })
        
        return jsonify({
            'success': True,
            'order_id': order.id,
            'status': order.status,
            'table_number': order.table_number,
            'order_type': order.order_type,
            'pickup_code': order.pickup_code,
            'payment_status': order.payment.status if order.payment else 'pending',
            'total_price': float(order.total_price),
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'items': items_data
        }), 200
    except Exception as e:
        import traceback
        current_app = __import__('flask').current_app
        current_app.logger.error(f"Error in get_order_status: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            "success": False,
            "error": str(e),
            "msg": "Internal server error while fetching order status"
        }), 500


# ── DELETE an item from a pending order (table or window) ──────────────
@orders_bp.route('/orders/<order_id>/items/<menu_item_id>', methods=['DELETE'])
def remove_order_item(order_id, menu_item_id):
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({"success": False, "msg": "Order not found"}), 404

        # Only allow removal when the order is still pending
        if order.status not in ('pending',):
            return jsonify({
                "success": False,
                "msg": f"Cannot modify order – status is '{order.status}'. Items can only be removed while the order is pending."
            }), 400

        # Find the specific OrderItem
        order_item = OrderItem.query.filter_by(
            order_id=order.id,
            menu_item_id=menu_item_id
        ).first()

        if not order_item:
            return jsonify({"success": False, "msg": "Item not found in this order"}), 404

        # Subtract cost from total
        item_cost = float(order_item.unit_price) * order_item.quantity
        order.total_price = max(0, float(order.total_price) - item_cost)

        db.session.delete(order_item)

        # If no items remain, cancel the order
        remaining_items = OrderItem.query.filter_by(order_id=order.id).filter(
            OrderItem.menu_item_id != menu_item_id
        ).count()

        if remaining_items == 0:
            order.status = 'cancelled'

        order.is_updated = True
        db.session.commit()

        # Notify chef dashboard
        socketio.emit('order:updated', {
            'order_id': str(order.id),
            'id': str(order.id),
            'table_number': order.table_number,
            'order_type': order.order_type,
            'status': order.status,
            'pickup_code': order.pickup_code,
            'total_price': float(order.total_price),
            'is_updated': True,
        }, room=str(order.restaurant_id))

        return jsonify({
            "success": True,
            "msg": "Item removed successfully",
            "order_status": order.status,
            "new_total": float(order.total_price)
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "msg": str(e)}), 500


# ── ADD more items to an existing order (table or window) ──────────────
@orders_bp.route('/orders/<order_id>/items', methods=['PUT'])
def add_items_to_order(order_id):
    try:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({"success": False, "msg": "Order not found"}), 404

        # Only allow adding items when order is still in kitchen pipeline
        if order.status not in ('pending', 'accepted', 'cooking'):
            return jsonify({
                "success": False,
                "msg": f"Cannot add items – order status is '{order.status}'."
            }), 400

        data = request.json or {}
        items = data.get('items', [])
        # 1. Update items in DB
        added_total = 0.0
        for item in items:
            mid = item.get('menu_item_id')
            qty = item.get('quantity', 1)
            menu_item = MenuItem.query.get(mid)
            if not menu_item:
                continue

            # Merge with existing item or create new
            existing_oi = OrderItem.query.filter_by(
                order_id=order.id,
                menu_item_id=menu_item.id
            ).first()

            if existing_oi:
                existing_oi.quantity += qty
            else:
                new_oi = OrderItem(
                    order_id=order.id,
                    menu_item_id=menu_item.id,
                    quantity=qty,
                    unit_price=menu_item.price
                )
                db.session.add(new_oi)

            added_total += float(menu_item.price) * qty

        order.total_price = float(order.total_price) + added_total
        order.is_updated = True
        db.session.commit()
        db.session.refresh(order)

        # 2. Prepare full items list for socket emission
        full_items_payload = []
        for oi in order.items:
            full_items_payload.append({
                'name': oi.menu_item.name if oi.menu_item else "Unknown",
                'quantity': oi.quantity,
                'price': float(oi.unit_price),
                'is_veg': oi.menu_item.is_veg if oi.menu_item else True
            })

        socket_payload = {
            'order_id': str(order.id),
            'id': str(order.id),
            'table_number': order.table_number,
            'order_type': order.order_type,
            'status': order.status,
            'pickup_code': order.pickup_code,
            'total_price': float(order.total_price),
            'is_updated': True,
            'payment_status': order.payment.status if order.payment else 'pending',
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'items': full_items_payload
        }

        # 3. Notify chef and owner
        socketio.emit('order:updated', socket_payload, room=str(order.restaurant_id))
        socketio.emit('order:updated', socket_payload, room=f"owner_{order.restaurant_id}")

        return jsonify({
            "success": True,
            "msg": "Items added to order",
            "order_id": order.id,
            "new_total": float(order.total_price)
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "msg": str(e)}), 500
