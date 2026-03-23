from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db, limiter
from utils.order_utils import generate_unique_window_code
from models import Order, OrderItem

window_bp = Blueprint('window_bp', __name__)

@window_bp.route('/order', methods=['POST'])
@limiter.limit("12 per minute")
def create_window_order():
    data = request.get_json() or {}
    restaurant_id = data.get('restaurant_id')
    items_data = data.get('items', [])

    if not restaurant_id or not items_data:
        return jsonify({"success": False, "error": "Missing restaurant_id or items"}), 400

    try:
        # Use nested transaction / savepoint for safety
        with db.session.begin_nested():
            # We NO LONGER generate code here for 'payment-first' flow
            # code = generate_unique_window_code(db.session)
            
            new_order = Order(
                restaurant_id=data['restaurant_id'],
                table_number=0, 
                order_type='window',
                status='pending',
                total_price=float(data.get('total', 0)),
                customer_name=data.get('customer_name', 'Walk-in'),
                pickup_code=None # Code generated only after payment
            )
            
            db.session.add(new_order)
            db.session.flush() 

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

        # NO SOCKET EMIT HERE anymore for window orders.
        # Kitchen only sees it after payment success.
            
        return jsonify({
            "success": True,
            "order_id": new_order.id,
            "message": "✅ Order received! Please proceed to payment to start preparation.",
            "customer_message": "Payment required to generate pickup code"
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
