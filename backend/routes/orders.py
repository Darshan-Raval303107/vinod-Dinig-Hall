from flask import Blueprint, request, jsonify
from extensions import db, socketio
from models import Order, OrderItem, MenuItem
import uuid

orders_bp = Blueprint('orders_bp', __name__)

@orders_bp.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    restaurant_id = data.get('restaurant_id')
    table_number = data.get('table_number')
    items = data.get('items') # list of dicts: { menu_item_id, quantity }

    if not restaurant_id or not table_number or not items:
        return jsonify(msg="Missing required fields"), 400

    try:
        new_order = Order(
            restaurant_id=restaurant_id,
            table_number=table_number,
            status='pending',
            total_price=0
        )
        db.session.add(new_order)
        db.session.flush() # get ID

        total_price = 0
        for item in items:
            menu_item = MenuItem.query.get(item['menu_item_id'])
            if not menu_item:
                continue

            order_item = OrderItem(
                order_id=new_order.id,
                menu_item_id=menu_item.id,
                quantity=item['quantity'],
                unit_price=menu_item.price
            )
            db.session.add(order_item)
            total_price += float(menu_item.price) * item['quantity']
        
        new_order.total_price = total_price
        db.session.commit()

        # Emit to chef room for this restaurant
        socketio.emit('order:new', {
            'order_id': str(new_order.id),
            'table_number': new_order.table_number,
            'status': new_order.status,
            'total_price': float(new_order.total_price),
            'items_count': len(items)
        }, room=str(restaurant_id))

        return jsonify({
            'msg': 'Order created',
            'order_id': new_order.id,
            'status': new_order.status
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify(msg=str(e)), 500

@orders_bp.route('/orders/<order_id>/status', methods=['GET'])
def get_order_status(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify(msg="Order not found"), 404
    
    return jsonify({
        'order_id': order.id,
        'status': order.status,
        'table_number': order.table_number,
        'total_price': float(order.total_price)
    }), 200
