from gevent import monkey
monkey.patch_all()

from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import db, migrate, jwt, socketio

def create_app(config_class=Config):
    # Setup static folder explicitly to serve our QR codes
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    app.config.from_object(config_class)

    # Robust CORS for development + Deployment
    CORS(app, resources={r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }}, supports_credentials=True)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    socketio.init_app(app)

    # Initialise structured JSON logging for payment events
    from utils.logger import get_payment_logger
    get_payment_logger()

    # Import all models so Flask-Migrate detects them
    with app.app_context():
        from models import (User, Restaurant, RestaurantTable, MenuCategory,
                            MenuItem, Order, OrderItem, Payment, WebhookEvent)  # noqa: F401

    # Register Blueprints
    from routes.menu import menu_bp
    from routes.orders import orders_bp
    from routes.payments import payments_bp
    from routes.auth import auth_bp
    from routes.chef import chef_bp
    from routes.owner import owner_bp
    
    app.register_blueprint(menu_bp, url_prefix='/api')
    app.register_blueprint(orders_bp, url_prefix='/api')
    app.register_blueprint(payments_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(chef_bp, url_prefix='/api')
    app.register_blueprint(owner_bp, url_prefix='/api')

    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy"})

    return app

if __name__ == '__main__':
    app = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
