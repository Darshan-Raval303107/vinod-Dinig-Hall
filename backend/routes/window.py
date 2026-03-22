from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db, limiter
from utils.order_utils import generate_unique_window_code
from models import Order, OrderItem

window_bp = Blueprint('window_bp', __name__)

@window_bp.route('/order', methods=['POST'])
@limiter.limit("12 per minute")
def create_window_order():
    data = request.get_json()
    try:
        # Use nested transaction / savepoint for safety
        with db.session.begin_nested():
            # 100% concurrent safe 4-digit code generation
            code = generate_unique_window_code(db.session)
            
            new_order = Order(
                restaurant_id=data['restaurant_id'],
                table_number=0, # Using 0 as identifier for window walk-ins, though order_type handles distinguishing
                order_type='window',
                status='pending',
                total_price=float(data.get('total', 0)),
                customer_name=data.get('customer_name', 'Walk-in'),
                pickup_code=code
            )
            
            db.session.add(new_order)
            db.session.flush() # flush to get the new_order.id

            # Attach the order items
            items_data = data.get('items', [])
            for item in items_data:
                order_item = OrderItem(
                    order_id=new_order.id,
                    menu_item_id=item['id'] if 'id' in item else item.get('menu_item_id'),
                    quantity=item['quantity'],
                    unit_price=item['price']
                )
                db.session.add(order_item)

        # Commit outside of the inner block (which just manages the SAVEPOINT)
        db.session.commit()

        # Emit to chef room for this restaurant so it shows up instantly on the dashboard
        from extensions import socketio
        socketio.emit('order:new', {
            'order_id': str(new_order.id),
            'table_number': new_order.table_number, # will be 0
            'status': new_order.status,
            'order_type': new_order.order_type,
            'pickup_code': new_order.pickup_code,
            'total_price': float(new_order.total_price),
            'items_count': len(items_data)
        }, room=str(new_order.restaurant_id))
            
        return jsonify({
            "success": True,
            "order_id": new_order.id,
            "pickup_code": code,
            "message": f"✅ Order placed successfully!\n\nYour Pickup Code: **{code}**\n\nShow this code at the counter to collect your order.",
            "customer_message": f"Your code is {code} - Please show to staff"
        }), 201
            
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Order failed. Please try again.",
            "details": str(e)
        }), 500

@window_bp.route('/active-window-orders', methods=['GET'])
@jwt_required()
def get_active_window_orders():
    # Only return orders that are currently active in the kitchen
    orders = Order.query.filter(
        Order.order_type == 'window',
        Order.status.in_(['pending', 'accepted', 'cooking', 'ready'])
    ).order_by(Order.created_at.desc()).limit(100).all()

    return jsonify({
        "success": True,
        "orders": [
            {
                "pickup_code": o.pickup_code,
                "customer": o.customer_name or "Walk-in",
                "items": len(o.items) if hasattr(o, 'items') else 0,
                "total": float(o.total_price),
                "status": o.status,
                "time": o.created_at.isoformat(),
                "order_id": o.id
            } for o in orders
        ]
    })

@window_bp.route('/pickup/<order_id>', methods=['PATCH'])
@jwt_required()
def mark_picked_up(order_id):
    order = Order.query.get_or_404(order_id)
    order.status = 'picked_up'
    order.pickup_code_used_at = db.func.now()
    db.session.commit()
    return jsonify({"success": True, "message": f"Order {order.pickup_code} handed over successfully ✅"})
