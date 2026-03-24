from app import create_app
from extensions import db
from models import Restaurant, MenuCategory, MenuItem, RestaurantTable, User
from werkzeug.security import generate_password_hash
from decimal import Decimal

app = create_app()

def seed():
    with app.app_context():
        # Clear existing (safety)
        # db.drop_all() 
        # db.create_all()

        if Restaurant.query.first():
            print("Database already has data. Skipping seed.")
            return

        print("Seeding database...")

        # 1. Create Restaurant
        restaurant = Restaurant(
            name="Vinnod Dining Hall",
            slug="vinnod",
            user_login_enabled=True
        )
        db.session.add(restaurant)
        
        # Spice Lounge (Alternative)
        spice = Restaurant(
            name="Spice Lounge",
            slug="spice-lounge",
            user_login_enabled=True
        )
        db.session.add(spice)
        db.session.flush()

        # 2. Create Tables
        for i in range(1, 11):
            table = RestaurantTable(restaurant_id=restaurant.id, table_number=i)
            db.session.add(table)
            
        # Window Table (0)
        window = RestaurantTable(restaurant_id=restaurant.id, table_number=0)
        db.session.add(window)

        # 3. Create Categories
        cats = [
            ("Starters", "🥗"),
            ("Main Course", "🍛"),
            ("Desserts", "🍰"),
            ("Drinks", "🥤")
        ]
        
        for name, icon in cats:
            cat = MenuCategory(restaurant_id=restaurant.id, name=name, icon=icon)
            db.session.add(cat)
            db.session.flush()
            
            # 4. Create Menu Items
            if name == "Starters":
                items = [
                    ("Paneer Tikka", "Grilled cottage cheese", 240, True),
                    ("Veg Crispy", "Crispy mixed vegetables", 180, True)
                ]
            elif name == "Main Course":
                items = [
                    ("Butter Chicken", "Rich creamy tomato gravy with chicken", 350, False),
                    ("Dal Tadka", "Tempered yellow lentils", 210, True),
                    ("Veg Biryani", "Fragrant basmati rice with veggies", 280, True)
                ]
            else:
                items = [
                    ("Gulab Jamun", "Sweet milk solids in syrup", 90, True),
                    ("Fresh Lime Soda", "Refreshing citrus drink", 60, True)
                ]

            for i_name, desc, price, is_veg in items:
                item = MenuItem(
                    category_id=cat.id,
                    name=i_name,
                    description=desc,
                    price=Decimal(str(price)),
                    is_veg=is_veg,
                    is_available=True
                )
                db.session.add(item)

        # 5. Create Admin User
        admin = User(
            name="Admin User",
            email="admin@vinnod.com",
            password_hash=generate_password_hash("admin123"),
            role="admin",
            restaurant_id=restaurant.id
        )
        db.session.add(admin)

        db.session.commit()
        print("✅ Database seeded successfully!")

if __name__ == "__main__":
    seed()
