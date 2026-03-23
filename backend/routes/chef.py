from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from extensions import db, socketio
from models import Order, OrderItem
from utils import role_required

chef_bp = Blueprint('chef_bp', __name__)

@chef_bp.route('/chef/orders', methods=['GET'])
@role_required('chef', 'owner')
def get_chef_orders():
    claims = get_jwt()
    restaurant_id = claims.get('restaurant_id')

    if not restaurant_id:
        return jsonify(msg="No restaurant assigned to this user"), 400

    # Fetch active orders (not served, cancelled, or paid unless we want paid to show up)
    # usually paid orders that are not served yet should still be in the kitchen.
    active_statuses = ['pending', 'accepted', 'cooking', 'ready', 'paid']
    
    orders = Order.query.filter(
        Order.restaurant_id == restaurant_id,
        Order.status.in_(active_statuses)
    ).order_by(Order.created_at.asc()).all()

    response = []
    for order in orders:
        items = []
        for oi in order.items:
            items.append({
                'menu_item_id': str(oi.menu_item_id),
                'name': oi.menu_item.name,
                'quantity': oi.quantity
            })
            
        response.append({
            'order_id': str(order.id),
            'table_number': order.table_number,
            'status': order.status,
            'order_type': order.order_type,
            'pickup_code': order.pickup_code,
            'payment_status': order.payment.status if order.payment else 'pending',
            'created_at': order.created_at.isoformat(),
            'items': items
        })

    return jsonify(response), 200

@chef_bp.route('/chef/orders/<order_id>/status', methods=['PUT'])
@role_required('chef', 'owner')
def update_order_status(order_id):
    data = request.json
    new_status = data.get('status')
    
    claims = get_jwt()
    restaurant_id = claims.get('restaurant_id')

    valid_statuses = ['pending', 'accepted', 'cooking', 'ready', 'served', 'cancelled', 'paid']
    if new_status not in valid_statuses:
        return jsonify(msg="Invalid status"), 400

    order = Order.query.get(order_id)
    if not order:
        return jsonify(msg="Order not found"), 404
        
    if str(order.restaurant_id) != restaurant_id and claims.get('role') != 'admin':
        return jsonify(msg="Unauthorized to modify this order"), 403

    order.status = new_status
    db.session.commit()

    # Emit to customer tracking room
    socketio.emit('order:status_update', {
        'orderId': str(order.id),
        'status': order.status
    }, room=f"order_{order.id}")
    
    # Emit to chef dashboard room to update across multiple chef screens
    socketio.emit('order:status_update_chef', {
        'orderId': str(order.id),
        'status': order.status
    }, room=str(restaurant_id))

    return jsonify(msg="Order updated", status=order.status), 200
