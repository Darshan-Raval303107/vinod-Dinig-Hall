import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')
    # Default to SQLite locally, but handle Render's postgres:// prefix
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///' + os.path.join(basedir, 'dineflow.db'))
    if db_url and db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-prod')

    JWT_ACCESS_TOKEN_EXPIRES = 86400 # 24 hours
    REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
    REDIS_PORT = os.environ.get('REDIS_PORT', '6379')
    REDIS_USER = os.environ.get('REDIS_USER', 'default')
    REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', '')

    REDIS_URL = os.environ.get('REDIS_URL')
    if not REDIS_URL and REDIS_HOST:
        # Build REDIS_URL if individual components are provided
        if REDIS_PASSWORD:
            REDIS_URL = f"redis://{REDIS_USER}:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}"
        else:
            REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}"

    if REDIS_URL and not REDIS_URL.startswith(('redis://', 'rediss://')):
        REDIS_URL = 'redis://' + REDIS_URL

    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
    RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')
