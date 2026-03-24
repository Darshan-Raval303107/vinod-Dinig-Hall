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

        db.session.flush() # get ID

        new_total = float(order.total_price)
        items_payload = []
        for item in items:
            menu_item = MenuItem.query.get(item['menu_item_id'])
            if not menu_item:
                continue
            
            items_payload.append({
                'name': menu_item.name,
                'quantity': item['quantity'],
                'price': float(menu_item.price),
                'is_veg': menu_item.is_veg
            })

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
        
        # Ensure created_at is accessible after commit
        db.session.refresh(order)

        # Emit to chef room for this restaurant
        socketio.emit(event_type, {
            'id': str(order.id),
            'order_id': str(order.id),
            'table_number': order.table_number,
            'order_type': order.order_type,
            'status': order.status,
            'pickup_code': order.pickup_code,
            'total_price': float(order.total_price),
            'is_updated': order.is_updated,
            'payment_status': 'pending',
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'items': items_payload
        }, room=str(restaurant_id))

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
