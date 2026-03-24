import sys
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from models import Restaurant, MenuItem, MenuCategory
import json

app = create_app()

with app.app_context():
    rests = Restaurant.query.all()
    out = []
    for r in rests:
        r_data = {
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "user_login_enabled": r.user_login_enabled,
            "categories": []
        }
        cats = MenuCategory.query.filter_by(restaurant_id=r.id).all()
        for c in cats:
            c_data = {
                "id": c.id,
                "name": c.name,
                "items": []
            }
            items = MenuItem.query.filter_by(category_id=c.id).all()
            for i in items:
                c_data["items"].append({
                    "id": i.id,
                    "name": i.name,
                    "is_available": i.is_available,
                })
            r_data["categories"].append(c_data)
        out.append(r_data)
    print(json.dumps(out, indent=2))
