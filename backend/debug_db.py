import sys
import os
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from extensions import db
from models import Restaurant, MenuItem, Order, MenuCategory, RestaurantTable

app = create_app()

with app.app_context():
    try:
        from sqlalchemy import text
        res = db.session.execute(text("SELECT 1")).fetchone()
        print(f"DB Connection Check: {res}")
        
        print(f"Restaurants: {Restaurant.query.count()}")
        print(f"Categories: {MenuCategory.query.count()}")
        print(f"Menu Items: {MenuItem.query.count()}")
        print(f"Tables: {RestaurantTable.query.count()}")
        print(f"Orders: {Order.query.count()}")
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
