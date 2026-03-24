from app import create_app
from extensions import db
from models import Restaurant, MenuCategory, MenuItem, RestaurantTable, User
from werkzeug.security import generate_password_hash
from decimal import Decimal

app = create_app()

def seed():
    with app.app_context():
        print("🌱 Starting Idempotent Seed...")

        # 1. Create Restaurant
        vinnod = Restaurant.query.filter_by(slug="vinnod").first()
        if not vinnod:
            vinnod = Restaurant(name="Vinnod Dining Hall", slug="vinnod", user_login_enabled=True)
            db.session.add(vinnod)
            print("Created Vinnod Restaurant")
        
        db.session.commit() # Save to get ID

        # 2. Create Tables
        existing_tables = RestaurantTable.query.filter_by(restaurant_id=vinnod.id).all()
        if not existing_tables:
            for i in range(1, 11):
                db.session.add(RestaurantTable(restaurant_id=vinnod.id, table_number=i))
            db.session.add(RestaurantTable(restaurant_id=vinnod.id, table_number=0))
            print("Created Tables 0-10")

        # 3. Create Categories
        cats_to_create = [
            ("Starters", "🥗"), ("Main Course", "🍛"), ("Desserts", "🍰"), ("Drinks", "🥤")
        ]
        
        for name, icon in cats_to_create:
            cat = MenuCategory.query.filter_by(restaurant_id=vinnod.id, name=name).first()
            if not cat:
                cat = MenuCategory(restaurant_id=vinnod.id, name=name, icon=icon)
                db.session.add(cat)
                db.session.commit()
                print(f"Created Category: {name}")

            # 4. Create Menu Items
            if name == "Starters":
                items = [("Paneer Tikka", "Grilled cottage cheese", 240, True), ("Veg Crispy", "Crispy mixed vegetables", 180, True)]
            elif name == "Main Course":
                items = [("Butter Chicken", "Rich creamy tomato gravy with chicken", 350, False), ("Dal Tadka", "Tempered yellow lentils", 210, True)]
            else:
                items = [("Gulab Jamun", "Sweet milk solids in syrup", 90, True), ("Fresh Lime Soda", "Refreshing citrus drink", 60, True)]

            for i_name, desc, price, is_veg in items:
                item = MenuItem.query.filter_by(category_id=cat.id, name=i_name).first()
                if not item:
                    db.session.add(MenuItem(
                        category_id=cat.id, name=i_name, description=desc, 
                        price=Decimal(str(price)), is_veg=is_veg, is_available=True
                    ))
                    print(f"  - Created Item: {i_name}")

        # 5. Create Staff Users
        staff = [
            ("Super Admin", "admin@vinnod.com", "admin123", "admin"),
            ("Chef Vinod", "chef@vinnod.core", "chef123", "chef"),
            ("Owner Vinod", "owner@vinnod.core", "owner123", "owner")
        ]

        for s_name, s_email, s_pass, s_role in staff:
            u = User.query.filter_by(email=s_email).first()
            if not u:
                db.session.add(User(
                    name=s_name, email=s_email, 
                    password_hash=generate_password_hash(s_pass), 
                    role=s_role, restaurant_id=vinnod.id
                ))
                print(f"Created User: {s_email} ({s_role})")

        db.session.commit()
        print("✅ Database seeding complete!")

if __name__ == "__main__":
    seed()
