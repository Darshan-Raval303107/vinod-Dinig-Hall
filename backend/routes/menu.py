from flask import Blueprint, request, jsonify
from models import Restaurant, MenuCategory, MenuItem

menu_bp = Blueprint('menu_bp', __name__)

@menu_bp.route('/menu', methods=['GET'])
def get_menu():
    restaurant_slug = request.args.get('restaurant')
    table_number = request.args.get('table')

    if not restaurant_slug:
        return jsonify(msg="Restaurant slug is required"), 400

    restaurant = Restaurant.query.filter_by(slug=restaurant_slug).first()
    if not restaurant:
        return jsonify(msg="Restaurant not found"), 404

    categories = MenuCategory.query.filter_by(restaurant_id=restaurant.id).order_by(MenuCategory.sort_order).all()
    
    response_data = {
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name,
            'slug': restaurant.slug
        },
        'table': table_number,
        'categories': []
    }

    for category in categories:
        items = MenuItem.query.filter_by(category_id=category.id, is_available=True).all()
        items_data = [{
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'price': float(item.price),
            'is_veg': item.is_veg,
            'prep_time': item.prep_time
        } for item in items]

        if items_data:
            response_data['categories'].append({
                'id': category.id,
                'name': category.name,
                'icon': category.icon,
                'items': items_data
            })

    return jsonify(response_data), 200
