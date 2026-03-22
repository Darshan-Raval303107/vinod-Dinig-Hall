import os
import qrcode
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, url_for, current_app
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from werkzeug.utils import secure_filename
from extensions import db
from models import Order, MenuItem, MenuCategory, RestaurantTable, Restaurant
from sqlalchemy import func
from utils import role_required

owner_bp = Blueprint('owner_bp', __name__)

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def _get_claim_restaurant_id():
    claims = get_jwt()
    return claims.get("restaurant_id")


def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def _is_allowed_image_filename(filename: str) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_IMAGE_EXTENSIONS


def _save_menu_item_image(file_storage, restaurant_id: str) -> str:
    """
    Save uploaded menu image to backend/static/uploads/menu/<restaurant_id>/.
    Returns the public URL path (starting with /static/...).
    """
    if not file_storage or not getattr(file_storage, "filename", ""):
        return None

    filename = secure_filename(file_storage.filename)
    if not filename:
        return None

    if not _is_allowed_image_filename(filename):
        raise ValueError("Unsupported image type. Use png/jpg/jpeg/webp.")

    upload_dir = os.path.join(current_app.root_path, "static", "uploads", "menu", str(restaurant_id))
    _ensure_dir(upload_dir)

    # Avoid collisions: prefix with timestamp
    name, ext = os.path.splitext(filename)
    safe_name = secure_filename(name)[:80] or "menu_item"
    final_name = f"{int(datetime.utcnow().timestamp())}_{safe_name}{ext.lower()}"
    file_path = os.path.join(upload_dir, final_name)
    file_storage.save(file_path)

    return f"/static/uploads/menu/{restaurant_id}/{final_name}"


def _require_owner_item_access(item: MenuItem, restaurant_id: str):
    # Verify item belongs to this restaurant via category.
    category = MenuCategory.query.get(item.category_id)
    if not category or str(category.restaurant_id) != str(restaurant_id):
        return False
    return True


def _require_owner_table_access(table: RestaurantTable, restaurant_id: str):
    return str(table.restaurant_id) == str(restaurant_id)


@owner_bp.route('/owner/analytics', methods=['GET'])
@role_required('owner', 'admin')
def get_analytics():
    claims = get_jwt()
    restaurant_id = claims.get('restaurant_id')
    timeframe = request.args.get('range', 'today') # today, month, year, all
    
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    
    # Base query for this restaurant
    base_query = Order.query.filter(Order.restaurant_id == restaurant_id)
    
    if timeframe == 'today':
        start_date = today_start
        orders = base_query.filter(Order.created_at >= start_date).all()
        
        # Hourly counts for today
        hourly_counts = {str(i).zfill(2)+":00": 0 for i in range(0, 24)}
        for o in orders:
            hour_str = o.created_at.strftime("%H:00")
            if hour_str in hourly_counts:
                hourly_counts[hour_str] += 1
        chart_data = [{"time": k, "orders": v} for k, v in hourly_counts.items()]
        
    elif timeframe == 'month':
        # Last 30 days
        start_date = today_start - timedelta(days=29)
        orders = base_query.filter(Order.created_at >= start_date).all()
        
        # Daily counts for last 30 days
        daily_counts = {}
        for i in range(30):
            d = (start_date + timedelta(days=i)).strftime("%b %d")
            daily_counts[d] = 0
            
        for o in orders:
            d_str = o.created_at.strftime("%b %d")
            if d_str in daily_counts:
                daily_counts[d_str] += 1
        chart_data = [{"time": k, "orders": v} for k, v in daily_counts.items()]
        
    elif timeframe == 'year':
        # Current year (last 12 months)
        start_date = datetime(now.year, 1, 1)
        orders = base_query.filter(Order.created_at >= start_date).all()
        
        # Monthly counts
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_counts = {m: 0 for m in months}
        for o in orders:
            m_str = o.created_at.strftime("%b")
            if m_str in monthly_counts:
                monthly_counts[m_str] += 1
        chart_data = [{"time": k, "orders": v} for k, v in monthly_counts.items()]
        
    else: # all-time
        orders = base_query.all()
        # Yearly counts
        yearly_counts = {}
        for o in orders:
            y_str = o.created_at.strftime("%Y")
            yearly_counts[y_str] = yearly_counts.get(y_str, 0) + 1
        
        sorted_years = sorted(yearly_counts.keys())
        chart_data = [{"time": y, "orders": yearly_counts[y]} for y in sorted_years]

    # Overall stats for the selected timeframe
    revenue = sum(float(o.total_price) for o in orders if o.status in ['paid', 'served'])
    completed = len([o for o in orders if o.status in ['paid', 'served']])
    
    # Active is always 'current' (not restricted by timeframe range, but restricted to 'not finished')
    active = base_query.filter(Order.status.notin_(['paid', 'served', 'cancelled'])).count()

    return jsonify({
        "revenue": revenue,
        "completed": completed,
        "active": active,
        "chart_data": chart_data,
        "timeframe": timeframe
    }), 200

@owner_bp.route('/owner/menu', methods=['GET'])
@role_required('owner', 'admin')
def get_owner_menu():
    restaurant_id = _get_claim_restaurant_id()

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
                "description": i.description,
                "image_url": i.image_url,
                "price": float(i.price),
                "is_available": i.is_available,
                "is_veg": i.is_veg,
                "prep_time": i.prep_time,
                "category_id": str(i.category_id),
            } for i in items]
        })
    return jsonify(res), 200

@owner_bp.route('/owner/menu/items', methods=['POST'])
@role_required('owner', 'admin')
def create_menu_item():
    restaurant_id = _get_claim_restaurant_id()
    if not restaurant_id:
        return jsonify(msg="restaurant_id missing for this user"), 400

    # multipart/form-data
    form = request.form
    category_id = form.get("category_id")
    if not category_id:
        return jsonify(msg="category_id is required"), 400

    category = MenuCategory.query.get_or_404(category_id)
    if str(category.restaurant_id) != str(restaurant_id):
        return jsonify(msg="Insufficient permissions"), 403

    name = (form.get("name") or "").strip()
    if not name:
        return jsonify(msg="name is required"), 400

    try:
        price = float(form.get("price"))
    except Exception:
        return jsonify(msg="price must be a number"), 400

    is_veg = str(form.get("is_veg", "false")).lower() in ("1", "true", "yes", "on")
    is_available = str(form.get("is_available", "true")).lower() in ("1", "true", "yes", "on")
    description = form.get("description")

    prep_time_raw = form.get("prep_time")
    prep_time = None
    if prep_time_raw not in (None, ""):
        try:
            prep_time = int(prep_time_raw)
        except Exception:
            return jsonify(msg="prep_time must be an integer"), 400

    image_url = None
    photo = request.files.get("photo")
    if photo:
        try:
            image_url = _save_menu_item_image(photo, restaurant_id)
        except ValueError as e:
            return jsonify(msg=str(e)), 400

    item = MenuItem(
        category_id=category.id,
        name=name,
        description=description,
        image_url=image_url,
        price=price,
        is_available=is_available,
        is_veg=is_veg,
        prep_time=prep_time,
    )
    db.session.add(item)
    db.session.commit()

    return jsonify(
        msg="Item created",
        item={
            "id": str(item.id),
            "name": item.name,
            "description": item.description,
            "image_url": item.image_url,
            "price": float(item.price),
            "is_available": item.is_available,
            "is_veg": item.is_veg,
            "prep_time": item.prep_time,
            "category_id": str(item.category_id),
        },
    ), 201

@owner_bp.route('/owner/menu/items/<item_id>', methods=['PUT', 'DELETE'])
@role_required('owner', 'admin')
def update_menu_item(item_id):
    item = MenuItem.query.get_or_404(item_id)
    
    restaurant_id = _get_claim_restaurant_id()
    if not _require_owner_item_access(item, restaurant_id):
        return jsonify(msg="Insufficient permissions"), 403
    
    if request.method == 'DELETE':
        from sqlalchemy.exc import IntegrityError
        try:
            db.session.delete(item)
            db.session.commit()
            return jsonify(msg="Item deleted"), 200
        except IntegrityError:
            db.session.rollback()
            return jsonify(msg="Item is locked by transaction history. Please HALT the item instead of deleting."), 400
        
    # Support both JSON updates (toggle availability) and multipart updates (full edit + photo)
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        form = request.form

        if "category_id" in form and form.get("category_id"):
            category = MenuCategory.query.get_or_404(form.get("category_id"))
            if str(category.restaurant_id) != str(restaurant_id):
                return jsonify(msg="Insufficient permissions"), 403
            item.category_id = category.id

        if "name" in form:
            name = (form.get("name") or "").strip()
            if not name:
                return jsonify(msg="name cannot be empty"), 400
            item.name = name

        if "description" in form:
            item.description = form.get("description")

        if "price" in form:
            try:
                item.price = float(form.get("price"))
            except Exception:
                return jsonify(msg="price must be a number"), 400

        if "is_veg" in form:
            item.is_veg = str(form.get("is_veg")).lower() in ("1", "true", "yes", "on")

        if "is_available" in form:
            item.is_available = str(form.get("is_available")).lower() in ("1", "true", "yes", "on")

        if "prep_time" in form:
            prep_time_raw = form.get("prep_time")
            if prep_time_raw in (None, ""):
                item.prep_time = None
            else:
                try:
                    item.prep_time = int(prep_time_raw)
                except Exception:
                    return jsonify(msg="prep_time must be an integer"), 400

        photo = request.files.get("photo")
        if photo:
            try:
                item.image_url = _save_menu_item_image(photo, restaurant_id)
            except ValueError as e:
                return jsonify(msg=str(e)), 400
    else:
        data = request.json or {}
        if 'is_available' in data:
            item.is_available = data['is_available']
        if 'price' in data:
            item.price = data['price']
        if 'name' in data:
            item.name = data['name']
        if 'description' in data:
            item.description = data['description']
        if 'prep_time' in data:
            item.prep_time = data['prep_time']
        if 'is_veg' in data:
            item.is_veg = data['is_veg']

    db.session.commit()
    return jsonify(msg="Item updated"), 200

@owner_bp.route('/owner/tables', methods=['GET'])
@role_required('owner', 'admin')
def get_tables():
    restaurant_id = _get_claim_restaurant_id()
    tables = RestaurantTable.query.filter_by(restaurant_id=restaurant_id).order_by(RestaurantTable.table_number).all()
    return jsonify([{
        "id": str(t.id),
        "table_number": t.table_number,
        "qr_code_url": t.qr_code_url,
        "is_active": t.is_active
    } for t in tables]), 200

@owner_bp.route('/owner/tables', methods=['POST'])
@role_required('owner', 'admin')
def create_table():
    restaurant_id = _get_claim_restaurant_id()
    if not restaurant_id:
        return jsonify(msg="restaurant_id missing for this user"), 400

    data = request.json or {}
    table_number = data.get("table_number")

    if table_number is None:
        # Auto-increment next available
        max_num = db.session.query(func.max(RestaurantTable.table_number)).filter_by(restaurant_id=restaurant_id).scalar()
        table_number = (max_num or 0) + 1
    else:
        try:
            table_number = int(table_number)
        except Exception:
            return jsonify(msg="table_number must be an integer"), 400

    # Prevent duplicates within same restaurant
    existing = RestaurantTable.query.filter_by(restaurant_id=restaurant_id, table_number=table_number).first()
    if existing:
        return jsonify(msg="Table number already exists"), 409

    table = RestaurantTable(restaurant_id=restaurant_id, table_number=table_number, qr_code_url=None)
    db.session.add(table)
    db.session.commit()

    # Auto-generate QR
    resp, status = generate_qr(str(table.id))
    if status != 200:
        return resp, status

    # Reload table for latest qr_code_url
    table = RestaurantTable.query.get(table.id)
    return jsonify(
        msg="Table created",
        table={
            "id": str(table.id),
            "table_number": table.table_number,
            "qr_code_url": table.qr_code_url,
            "is_active": table.is_active,
        },
    ), 201

@owner_bp.route('/owner/tables/<table_id>', methods=['DELETE'])
@role_required('owner', 'admin')
def delete_table(table_id):
    table = RestaurantTable.query.get_or_404(table_id)
    restaurant_id = _get_claim_restaurant_id()
    if not _require_owner_table_access(table, restaurant_id):
        return jsonify(msg="Insufficient permissions"), 403

    db.session.delete(table)
    db.session.commit()
    return jsonify(msg="Table deleted"), 200

@owner_bp.route('/owner/tables/<table_id>', methods=['PUT'])
@role_required('owner', 'admin')
def update_table(table_id):
    table = RestaurantTable.query.get_or_404(table_id)
    restaurant_id = _get_claim_restaurant_id()
    if not _require_owner_table_access(table, restaurant_id):
        return jsonify(msg="Insufficient permissions"), 403

    data = request.json or {}
    if 'is_active' in data:
        table.is_active = bool(data['is_active'])
    
    db.session.commit()
    return jsonify(msg="Table updated", is_active=table.is_active), 200

@owner_bp.route('/owner/tables/<table_id>/qr', methods=['POST'])
@role_required('owner', 'admin')
def generate_qr(table_id):
    table = RestaurantTable.query.get_or_404(table_id)
    restaurant_id = _get_claim_restaurant_id()
    if not _require_owner_table_access(table, restaurant_id):
        return jsonify(msg="Insufficient permissions"), 403
    restaurant = Restaurant.query.get(table.restaurant_id)
    
    frontend_url = os.environ.get('FRONTEND_URL', 'https://vinod-dinig-hall.vercel.app').rstrip('/')
    
    # URL encoded in the QR code
    if table.table_number == 0:
        data_url = f"{frontend_url}/window"
    else:
        data_url = f"{frontend_url}/menu?restaurant={restaurant.slug}&table={table.table_number}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    filename = f"qr_{secure_filename(restaurant.slug)}_table_{table.table_number}.png"
    qr_dir = os.path.join(current_app.root_path, 'static', 'qrcodes')
    _ensure_dir(qr_dir)
    filepath = os.path.join(qr_dir, filename)
    img.save(filepath)
    
    # Store the static path in DB
    qr_image_url = f"/static/qrcodes/{filename}"
    table.qr_code_url = qr_image_url
    db.session.commit()
    
    return jsonify(msg="QR Code generated successfully", url=qr_image_url), 200


@owner_bp.route('/owner/orders', methods=['GET'])
@role_required('owner', 'admin')
def get_all_orders():
    restaurant_id = _get_claim_restaurant_id()
    if not restaurant_id:
        return jsonify(msg="restaurant_id missing"), 400
    
    # Fetch orders sorted by most recent
    orders = Order.query.filter_by(restaurant_id=restaurant_id).order_by(Order.created_at.desc()).all()
    
    res = []
    for order in orders:
        items_data = []
        for item in order.items:
            items_data.append({
                "name": item.menu_item.name,
                "quantity": item.quantity,
                "price": float(item.unit_price),
                "is_veg": item.menu_item.is_veg
            })
        
        res.append({
            "id": str(order.id),
            "table_number": order.table_number,
            "order_type": order.order_type,
            "pickup_code": order.pickup_code,
            "status": order.status,
            "total_price": float(order.total_price),
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "items": items_data
        })
        
    return jsonify(res), 200


# ─── User-Login toggle (owner control) ──────────────────────────────────────

@owner_bp.route('/owner/settings/user-login', methods=['GET'])
@role_required('owner', 'admin')
def get_user_login_setting():
    """Return the current user_login_enabled flag for this restaurant."""
    restaurant_id = _get_claim_restaurant_id()
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    return jsonify({
        "user_login_enabled": bool(restaurant.user_login_enabled),
        "restaurant_name": restaurant.name
    }), 200


@owner_bp.route('/owner/settings/user-login', methods=['PUT'])
@role_required('owner', 'admin')
def set_user_login_setting():
    """
    Toggle whether customers can log in / access the menu.
    Body: { "enabled": true | false }
    """
    restaurant_id = _get_claim_restaurant_id()
    restaurant = Restaurant.query.get_or_404(restaurant_id)

    data = request.get_json(silent=True) or {}
    if 'enabled' not in data:
        return jsonify(msg="'enabled' field is required (true/false)"), 400

    restaurant.user_login_enabled = bool(data['enabled'])
    db.session.commit()

    state = "enabled" if restaurant.user_login_enabled else "disabled"
    return jsonify(
        msg=f"User login {state} successfully.",
        user_login_enabled=restaurant.user_login_enabled
    ), 200
