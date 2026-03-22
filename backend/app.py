import monkey  # MUST BE FIRST for Gevent patching
from flask import Flask, jsonify
from flask_cors import CORS
import logging

# Set up basic logging for production visibility
logging.basicConfig(level=logging.INFO)
from config import Config
from extensions import db, migrate, jwt, socketio, limiter
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

    # CORS – Allow Vercel domains + localhost for dev
    allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
    # Add common origins for Vercel/Localhost if not already present
    if '*' not in allowed_origins:
        additional_origins = [
            "https://*.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000"
        ]
        for origin in additional_origins:
            if origin not in allowed_origins:
                allowed_origins.append(origin)
    
    CORS(app, resources={r"/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Range", "X-Content-Range"]
    }}, supports_credentials=True)
    
    # Ratelimiter – using Redis from config
    app.config['RATELIMIT_STORAGE_URI'] = app.config.get('REDIS_URL')
    limiter.init_app(app)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # ── Auto-Migrate Database on Startup ──────────────────────────────────
    # This automatically adds new columns/tables whenever the app boots up on Render!
    with app.app_context():
        try:
            from flask_migrate import upgrade, stamp
            try:
                upgrade()
                app.logger.info("✅ Database auto-migration successful.")
            except Exception as inner_e:
                error_str = str(inner_e).lower()
                if "already exists" in error_str or "duplicatecolumn" in error_str:
                    stamp()
                    app.logger.info("✅ Database stamped to head after detecting existing schema. DuplicateColumn completely ignored.")
                else:
                    raise inner_e
        except Exception as e:
            app.logger.error(f"❌ Database auto-migration failed: {e}")

    # SocketIO init with gevent async mode + Redis message queue for scaling
    socketio.init_app(
        app, 
        async_mode="gevent", 
        cors_allowed_origins=allowed_origins,
        message_queue=app.config.get('REDIS_URL')
    )

    # ── SocketIO Room Handlers ───────────────────────────────────────────
    from flask_socketio import join_room

    @socketio.on('customer:join')
    def on_customer_join(data):
        order_id = data.get('orderId')
        if order_id:
            join_room(f"order_{order_id}")
            app.logger.info(f"Customer joined room: order_{order_id}")

    @socketio.on('chef:join')
    def on_chef_join(data):
        restaurant_id = data.get('restaurantId')
        if restaurant_id:
            join_room(str(restaurant_id))
            app.logger.info(f"Chef joined room: {restaurant_id}")


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
    from routes.window import window_bp
    
    app.register_blueprint(menu_bp, url_prefix='/api')
    app.register_blueprint(orders_bp, url_prefix='/api')
    app.register_blueprint(payments_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(chef_bp, url_prefix='/api')
    app.register_blueprint(owner_bp, url_prefix='/api')
    app.register_blueprint(window_bp, url_prefix='/api/window')

    # ── Redis Test Routes ────────────────────────────────────────────────
    @app.route('/redis/set')
    def redis_set():
        try:
            import redis
            r = redis.from_url(app.config['REDIS_URL'], decode_responses=True)
            r.set('test_key', 'Redis is working! 🚀')
            return jsonify(msg="Value set in Redis"), 200
        except Exception as e:
            return jsonify(error=str(e), source="redis_set"), 500

    @app.route('/redis/get')
    def redis_get():
        try:
            import redis
            r = redis.from_url(app.config['REDIS_URL'], decode_responses=True)
            value = r.get('test_key')
            return jsonify(msg=f"Value from Redis: {value}"), 200
        except Exception as e:
            return jsonify(error=str(e), source="redis_get"), 500

    @app.route('/setup-database-now')
    def setup_database_now():
        try:
            import subprocess
            import sys
            result = subprocess.run([sys.executable, "seed.py"], capture_output=True, text=True)
            if result.returncode == 0:
                return jsonify(msg="Database tables created and seeded successfully!", output=result.stdout.split('\n')), 200
            else:
                return jsonify(error="Failed to seed database", details=result.stderr.split('\n')), 500
        except Exception as e:
            return jsonify(error=str(e)), 500

    # ── UPDATED Health check ──────────────────────────────────────────────
    @app.route('/health')
    def health_check():
        try:
            # Check DB connection
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            return jsonify({
                "status": "healthy",
                "database": "connected"
            }), 200
        except Exception as e:
            app.logger.error(f"Health check failed: {str(e)}")
            return jsonify({
                "status": "unhealthy",
                "database": "error",
                "details": str(e) if app.debug else "Resource issue"
            }), 500

    # ── UPDATED Error Handling ──────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            "success": False,
            "error": "Not Found",
            "message": str(e.description) if hasattr(e, 'description') else str(e)
        }), 404

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            "success": False,
            "error": "Too Many Requests",
            "message": "Rate limit exceeded. Please try again later.",
            "description": str(e.description) if hasattr(e, 'description') else str(e)
        }), 429

    # ── VERY IMPORTANT: Global error handler for 500 ──────────────────────
    # This will show real error messages even when DEBUG=False later
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Werkzeug HTTP exceptions (like 404) should be handled by their specific handlers
        # or returned as is if they already have a response.
        from werkzeug.exceptions import HTTPException
        if isinstance(e, HTTPException):
            return e

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