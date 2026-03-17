import os
import qrcode
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, url_for, current_app
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from extensions import db
from models import Order, MenuItem, MenuCategory, RestaurantTable, Restaurant
from sqlalchemy import func
from utils import role_required

owner_bp = Blueprint('owner_bp', __name__)

@owner_bp.route('/owner/analytics/today', methods=['GET'])
@role_required('owner', 'admin')
def get_today_analytics():
    claims = get_jwt()
    restaurant_id = claims.get('restaurant_id')
    
    today = datetime.utcnow().date()
    # Simple bounds for sqlite/postgres compatibility without complex timezone casting for now
    start_of_day = datetime(today.year, today.month, today.day)
    
    orders_today = Order.query.filter(
        Order.restaurant_id == restaurant_id,
        Order.created_at >= start_of_day
    ).all()

    total_revenue = sum(float(o.total_price) for o in orders_today if o.status in ['paid', 'served'])
    completed_orders = len([o for o in orders_today if o.status in ['paid', 'served']])
    active_orders = len([o for o in orders_today if o.status not in ['paid', 'served', 'cancelled']])

    # Hourly orders for chart
    hourly_counts = {str(i).zfill(2)+":00": 0 for i in range(10, 24)} # Example 10am to 11pm
    for o in orders_today:
        hour_str = o.created_at.strftime("%H:00")
        if hour_str in hourly_counts:
            hourly_counts[hour_str] += 1

    chart_data = [{"time": k, "orders": v} for k, v in hourly_counts.items()]

    return jsonify({
        "revenue": total_revenue,
        "completed": completed_orders,
        "active": active_orders,
        "hourly_chart": chart_data
    }), 200

@owner_bp.route('/owner/menu', methods=['GET'])
@role_required('owner', 'admin')
def get_owner_menu():
    claims = get_jwt()
    restaurant_id = claims.get('restaurant_id')

    categories = MenuCategory.query.filter_by(restaurant_id=restaurant_id).order_by(MenuCategory.sort_order).all()
    
    res = []
    for cat in categories:
        items = MenuItem.query.filter_by(category_id=cat.id).all()
        res.append({
            "id": str(cat.id),
            "name": cat.name,
            "icon": cat.icon,
            "items": [{
                "id": str(i.id),
                "name": i.name,
                "price": float(i.price),
                "is_available": i.is_available,
                "is_veg": i.is_veg
            } for i in items]
        })
    return jsonify(res), 200

@owner_bp.route('/owner/menu/items/<item_id>', methods=['PUT', 'DELETE'])
@role_required('owner', 'admin')
def update_menu_item(item_id):
    item = MenuItem.query.get_or_404(item_id)
    
    # Needs auth check against restaurant_id via category
    claims = get_jwt()
    
    if request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return jsonify(msg="Item deleted"), 200
        
    data = request.json
    if 'is_available' in data:
        item.is_available = data['is_available']
    if 'price' in data:
        item.price = data['price']
    if 'name' in data:
        item.name = data['name']

    db.session.commit()
    return jsonify(msg="Item updated"), 200

@owner_bp.route('/owner/tables', methods=['GET'])
@role_required('owner', 'admin')
def get_tables():
    claims = get_jwt()
    tables = RestaurantTable.query.filter_by(restaurant_id=claims.get('restaurant_id')).order_by(RestaurantTable.table_number).all()
    return jsonify([{
        "id": str(t.id),
        "table_number": t.table_number,
        "qr_code_url": t.qr_code_url
    } for t in tables]), 200

@owner_bp.route('/owner/tables/<table_id>/qr', methods=['POST'])
@role_required('owner', 'admin')
def generate_qr(table_id):
    table = RestaurantTable.query.get_or_404(table_id)
    restaurant = Restaurant.query.get(table.restaurant_id)
    
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    
    # URL encoded in the QR code
    data_url = f"{frontend_url}/menu?restaurant={restaurant.slug}&table={table.table_number}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    filename = f"qr_{restaurant.slug}_table_{table.table_number}.png"
    filepath = os.path.join(current_app.root_path, 'static', 'qrcodes', filename)
    img.save(filepath)
    
    # Store the static path in DB
    qr_image_url = f"/static/qrcodes/{filename}"
    table.qr_code_url = qr_image_url
    db.session.commit()
    
    return jsonify(msg="QR Code generated successfully", url=qr_image_url), 200
