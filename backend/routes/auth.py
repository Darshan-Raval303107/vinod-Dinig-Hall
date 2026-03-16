from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import User
from utils import check_password

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not check_password(password, user.password_hash):
        return jsonify({"msg": "Bad email or password"}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "restaurant_id": str(user.restaurant_id) if user.restaurant_id else None
        }
    )
    
    return jsonify(
        access_token=access_token,
        user={
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "restaurant_id": user.restaurant_id
        }
    ), 200
