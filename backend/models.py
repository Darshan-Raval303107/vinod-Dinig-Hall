import uuid
from datetime import datetime
from extensions import db

def generate_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False) # admin/owner/chef
    restaurant_id = db.Column(db.String(36), db.ForeignKey('restaurants.id'), nullable=True)

class Restaurant(db.Model):
    __tablename__ = 'restaurants'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    owner_id = db.Column(db.String(36), db.ForeignKey('users.id', use_alter=True, name='fk_restaurant_owner'), nullable=True)
    # Owner-controlled toggle: when False, customers cannot log in or browse the menu
    user_login_enabled = db.Column(db.Boolean, nullable=False, default=True)

    # Relationships
    tables = db.relationship('RestaurantTable', backref='restaurant', lazy=True)
    users = db.relationship('User', backref='restaurant', lazy=True, foreign_keys=[User.restaurant_id])
    categories = db.relationship('MenuCategory', backref='restaurant', lazy=True)
    orders = db.relationship('Order', backref='restaurant', lazy=True)

class RestaurantTable(db.Model):
    __tablename__ = 'restaurant_tables'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    restaurant_id = db.Column(db.String(36), db.ForeignKey('restaurants.id'), nullable=False)
    table_number = db.Column(db.Integer, nullable=False)
    qr_code_url = db.Column(db.Text, nullable=True)

class MenuCategory(db.Model):
    __tablename__ = 'menu_categories'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    restaurant_id = db.Column(db.String(36), db.ForeignKey('restaurants.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(255), nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    
    items = db.relationship('MenuItem', backref='category', lazy=True)

class MenuItem(db.Model):
    __tablename__ = 'menu_items'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    category_id = db.Column(db.String(36), db.ForeignKey('menu_categories.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    is_veg = db.Column(db.Boolean, nullable=False)
    prep_time = db.Column(db.Integer, nullable=True) # minutes

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    restaurant_id = db.Column(db.String(36), db.ForeignKey('restaurants.id'), nullable=False)
    table_number = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending') # states: pending, accepted, cooking, ready, served, cancelled, paid
    total_price = db.Column(db.Numeric(10, 2), nullable=False, default=0.0)
    razorpay_payment_id = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship('OrderItem', backref='order', lazy=True)
    payment = db.relationship('Payment', backref='order', uselist=False, lazy=True)

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False)
    menu_item_id = db.Column(db.String(36), db.ForeignKey('menu_items.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)

    menu_item = db.relationship('MenuItem')

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False, default='razorpay') # razorpay/upi/cash
    method = db.Column(db.String(50), nullable=True) # upi/card/netbanking/wallet
    status = db.Column(db.String(50), nullable=False, default='pending') # pending/authorized/captured/success/failed
    razorpay_order_id = db.Column(db.String(255), nullable=True, unique=True)
    razorpay_payment_id = db.Column(db.String(255), nullable=True, unique=True)
    event_id = db.Column(db.String(255), nullable=True) # last webhook event_id for idempotency
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WebhookEvent(db.Model):
    """Tracks processed Razorpay webhook events for idempotency."""
    __tablename__ = 'webhook_events'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    event_id = db.Column(db.String(255), unique=True, nullable=False)
    event_type = db.Column(db.String(100), nullable=False)
    processed = db.Column(db.Boolean, default=False)
    payload = db.Column(db.Text, nullable=True) # raw JSON for debugging
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
