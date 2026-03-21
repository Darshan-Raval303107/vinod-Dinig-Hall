from app import create_app
from extensions import db
from models import MenuItem

app = create_app()
with app.app_context():
    items = MenuItem.query.all()
    print("Menu Items in DB:")
    for item in items:
        print(f"ID: {item.id} | Name: {item.name} | Image: {item.image_url}")
