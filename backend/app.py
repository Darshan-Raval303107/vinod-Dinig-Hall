from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import db, migrate, jwt, socketio
import os
from dotenv import load_dotenv  # ← ADD THIS if not already

# Load .env file early (very important for keys)
load_dotenv()  # ← ADD THIS (place at top of file or here)

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    app.config.from_object(config_class)

    # Set debug and env from environment variables
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', '0') == '1'
    app.config['ENV'] = os.getenv('FLASK_ENV', 'production')

    # Even better: read from environment (safer for prod later)
    # app.config['DEBUG'] = os.getenv('FLASK_DEBUG', '1') == '1'

    # CORS – your current setup is fine, but add expose_headers if needed later
    allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
    CORS(app, resources={r"/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Range", "X-Content-Range"]  # optional
    }}, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    # SocketIO init with gevent async mode (IMPORTANT for Render gevent worker)
    socketio.init_app(app, async_mode="gevent", cors_allowed_origins=allowed_origins)

    # Logger – assuming it's ok
    from utils.logger import get_payment_logger
    get_payment_logger()

    # Models import (inside context – good)
    with app.app_context():
        from models import (User, Restaurant, RestaurantTable, MenuCategory,
                            MenuItem, Order, OrderItem, Payment, WebhookEvent)

    # Blueprints – good
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

    # Health check – good

    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy"})

    # ── VERY IMPORTANT: Global error handler for 500 ──────────────────────
    # This will show real error messages even when DEBUG=False later
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Log the full traceback
        app.logger.exception("Unhandled exception occurred")
        
        # Return meaningful JSON instead of generic HTML 500
        error_msg = str(e) if app.debug else "Internal Server Error"
        response = {
            "success": False,
            "error": error_msg,
            "message": "Internal server error – check server logs for details"
        }
        if app.debug:
            # In debug mode, also include traceback (for browser)
            import traceback
            response["traceback"] = traceback.format_exc()

        
        return jsonify(response), 500

    return app


# Instantiate the app for Gunicorn
app = create_app()

if __name__ == '__main__':
    # Use socketio.run for development if needed
    # socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
    
    # Run with Flask's built-in server for local development
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)