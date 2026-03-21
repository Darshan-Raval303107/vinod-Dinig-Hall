import os
from app import create_app
from extensions import db
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
        admin = User(name="Admin", email="admin@vinnod.core", password_hash=hash_password("admin123"), role="admin")
        owner = User(name="Vinnod Owner", email="owner@vinnod.core", password_hash=hash_password("owner123"), role="owner")

        db.session.add(admin)
        db.session.add(owner)
        db.session.commit()

        print("Creating restaurant...")
        restaurant = Restaurant(
            name="The Spice Lounge",
            slug="spice-lounge",
            owner_id=owner.id,
            user_login_enabled=True   # customers CAN log in by default
        )
        db.session.add(restaurant)
        db.session.commit()

        # Update owner with restaurant_id
        owner.restaurant_id = restaurant.id
        db.session.commit()

        print("Creating chef...")
        chef = User(
            name="Chef Gordon",
            email="chef@vinnod.core",
            password_hash=hash_password("chef123"),
            role="chef",
            restaurant_id=restaurant.id
        )
        db.session.add(chef)
        db.session.commit()

        # ── Test customer account ─────────────────────────────────────────────
        print("Creating test customer user...")
        test_user = User(
            name="Test Customer",
            email="user@vinnod.core",
            password_hash=hash_password("user123"),
            role="user",
            restaurant_id=restaurant.id
        )
        db.session.add(test_user)
        db.session.commit()

        print("Creating tables...")
        for i in range(1, 6):
            table = RestaurantTable(
                restaurant_id=restaurant.id,
                table_number=i,
                qr_code_url=f"https://app.com/menu?restaurant={restaurant.slug}&table={i}"
            )
            db.session.add(table)
        db.session.commit()

        print("Creating menu categories and items...")
        cat_starters = MenuCategory(restaurant_id=restaurant.id, name="Starters", icon="🍽️", sort_order=1)
        cat_mains    = MenuCategory(restaurant_id=restaurant.id, name="Main Course", icon="🍲", sort_order=2)
        cat_drinks   = MenuCategory(restaurant_id=restaurant.id, name="Beverages", icon="🥤", sort_order=3)
        db.session.add_all([cat_starters, cat_mains, cat_drinks])
        db.session.commit()

        items_starters = [
            MenuItem(category_id=cat_starters.id, name="Paneer Tikka",    description="Spiced grilled cottage cheese",   price=250.00, is_veg=True,  prep_time=15, image_url="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=800"),
            MenuItem(category_id=cat_starters.id, name="Chicken Wings",   description="Crispy BBQ glazed wings",            price=350.00, is_veg=False, prep_time=20, image_url="https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=800"),
            MenuItem(category_id=cat_starters.id, name="Tandoori Broccoli", description="Charred florets in yogurt marinade", price=280.00, is_veg=True,  prep_time=12, image_url="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"),
        ]
        
        items_mains = [
            MenuItem(category_id=cat_mains.id,    name="Butter Chicken",  description="Velvety tomato cream curry",  price=450.00, is_veg=False, prep_time=25, image_url="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800"),
            MenuItem(category_id=cat_mains.id,    name="Dal Makhani",     description="24-hour slow-cooked lentils",    price=300.00, is_veg=True,  prep_time=20, image_url="https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=800"),
            MenuItem(category_id=cat_mains.id,    name="Veg Biryani",     description="Saffron infused basmati rice",   price=380.00, is_veg=True,  prep_time=25, image_url="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800"),
            MenuItem(category_id=cat_mains.id,    name="Garlic Naan",     description="Leavened clay oven bread",       price=60.00,  is_veg=True,  prep_time=8,  image_url="/images/garlic_naan.png"),
        ]

        items_drinks = [
            MenuItem(category_id=cat_drinks.id,   name="Mango Lassi",     description="Alphonso mango yogurt blend",     price=120.00, is_veg=True,  prep_time=5,  image_url="/images/mango_lassi.png"),
            MenuItem(category_id=cat_drinks.id,   name="Virgin Mojito",   description="Muddled lime and mint soda",         price=150.00, is_veg=True,  prep_time=5,  image_url="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800"),
        ]

        db.session.add_all(items_starters + items_mains + items_drinks)
        db.session.commit()

        print("\n✅ Database seeded successfully!")
        print("─────────────────────────────────────────")
        print("  Test accounts:")
        print("  Customer : user@vinnod.core  / user123")
        print("  Chef     : chef@vinnod.core  / chef123")
        print("  Owner    : owner@vinnod.core / owner123")
        print("  Admin    : admin@vinnod.core / admin123")
        print("─────────────────────────────────────────")

if __name__ == '__main__':
    seed_data()
