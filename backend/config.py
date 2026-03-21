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
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
    RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')
