import os
from dotenv import load_dotenv

load_dotenv()


def _env_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise RuntimeError("DATABASE_URL environment variable is required (PostgreSQL / Neon DB)")
        
    # Normalize Neon/Heroku-style postgres:// → postgresql://
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
        
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_recycle": 300,         # Recycle connections every 5 min (Neon drops idle connections)
        "connect_args": {
            "sslmode": "require",    # Neon DB requires SSL
            "connect_timeout": 10,
        },
    }
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-prod')

    JWT_ACCESS_TOKEN_EXPIRES = 86400 # 24 hours
    USE_REDIS = _env_bool(os.environ.get('USE_REDIS'), default=False)
    REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
    REDIS_PORT = os.environ.get('REDIS_PORT', '6379')
    REDIS_USER = os.environ.get('REDIS_USER', 'default')
    REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', '')

    REDIS_URL = os.environ.get('REDIS_URL')
    if USE_REDIS and not REDIS_URL and REDIS_HOST:
        # Build REDIS_URL if individual components are provided
        if REDIS_PASSWORD:
            REDIS_URL = f"redis://{REDIS_USER}:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}"
        else:
            REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}"

    if USE_REDIS and REDIS_URL and not REDIS_URL.startswith(('redis://', 'rediss://')):
        REDIS_URL = 'redis://' + REDIS_URL

    if not USE_REDIS:
        REDIS_URL = None

    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
    RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')

    # Frontend URL for redirects
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
