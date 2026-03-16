import os
from app import create_app, db
from models import User, Restaurant, RestaurantTable, MenuCategory, MenuItem
from utils import hash_password

app = create_app()

def seed_data():
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()

        print("Creating admin and owner...")
        admin = User(name="Admin", email="admin@dineflow.com", password_hash=hash_password("admin123"), role="admin")
        owner = User(name="Owner Name", email="owner@dineflow.com", password_hash=hash_password("owner123"), role="owner")
        
        db.session.add(admin)
        db.session.add(owner)
        db.session.commit()

        print("Creating restaurant...")
        restaurant = Restaurant(name="The Spice Lounge", slug="spice-lounge", owner_id=owner.id)
        db.session.add(restaurant)
        db.session.commit()

        # Update owner with restaurant_id
        owner.restaurant_id = restaurant.id
        db.session.commit()

        print("Creating chef...")
        chef = User(name="Chef Gordon", email="chef@dineflow.com", password_hash=hash_password("chef123"), role="chef", restaurant_id=restaurant.id)
        db.session.add(chef)
        db.session.commit()

        print("Creating tables...")
        for i in range(1, 6):
            table = RestaurantTable(restaurant_id=restaurant.id, table_number=i, qr_code_url=f"https://app.com/menu?restaurant={restaurant.slug}&table={i}")
            db.session.add(table)
        db.session.commit()

        print("Creating menu categories and items...")
        cat_starters = MenuCategory(restaurant_id=restaurant.id, name="Starters", icon="🍽️", sort_order=1)
        cat_mains = MenuCategory(restaurant_id=restaurant.id, name="Main Course", icon="🍲", sort_order=2)
        cat_drinks = MenuCategory(restaurant_id=restaurant.id, name="Beverages", icon="🥤", sort_order=3)
        db.session.add_all([cat_starters, cat_mains, cat_drinks])
        db.session.commit()

        items = [
            MenuItem(category_id=cat_starters.id, name="Paneer Tikka", description="Spicy grilled paneer cubes", price=250.00, is_veg=True, prep_time=15),
            MenuItem(category_id=cat_starters.id, name="Chicken Wings", description="BBQ chicken wings", price=350.00, is_veg=False, prep_time=20),
            MenuItem(category_id=cat_mains.id, name="Butter Chicken", description="Creamy tomato chicken curry", price=450.00, is_veg=False, prep_time=25),
            MenuItem(category_id=cat_mains.id, name="Dal Makhani", description="Slow-cooked black lentils", price=300.00, is_veg=True, prep_time=20),
            MenuItem(category_id=cat_drinks.id, name="Mango Lassi", description="Sweet mango yogurt drink", price=120.00, is_veg=True, prep_time=5),
            MenuItem(category_id=cat_drinks.id, name="Fresh Lime Soda", description="Refreshing lime soda", price=80.00, is_veg=True, prep_time=5),
        ]
        db.session.add_all(items)
        db.session.commit()

        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_data()
