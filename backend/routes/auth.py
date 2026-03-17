from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import User, Restaurant
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

    # ── User-login gate ───────────────────────────────────────────────────────
    # Staff (owner / admin / chef) can ALWAYS log in.
    # Regular users (role == 'user') are only allowed when the owner has enabled
    # the toggle for their restaurant. This lets the owner control access during
    # off-hours, maintenance, or testing.
    STAFF_ROLES = {'owner', 'admin', 'chef'}

    if user.role not in STAFF_ROLES:
        # Look up the restaurant's setting (if the user has one)
        if user.restaurant_id:
            restaurant = Restaurant.query.get(user.restaurant_id)
            if restaurant and not restaurant.user_login_enabled:
                return jsonify({
                    "msg": "Customer login is currently disabled by the restaurant. Please try again later."
                }), 403
        # If no restaurant_id, fall through and allow (handles edge cases)

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


@auth_bp.route('/auth/settings/user-login', methods=['GET'])
def check_user_login_status():
    """
    Public endpoint — the frontend can call this (by restaurant slug) to know
    whether the customer login / menu access is currently enabled.
    Used so the menu page can show a friendly message before the user even tries.
    """
    slug = request.args.get('restaurant')
    if not slug:
        return jsonify({"enabled": True}), 200  # default open if no context

    restaurant = Restaurant.query.filter_by(slug=slug).first()
    if not restaurant:
        return jsonify({"enabled": True}), 200

    return jsonify({"enabled": bool(restaurant.user_login_enabled)}), 200

@auth_bp.route('/auth/me', methods=['GET'])
def get_me():
    """
    Returns the current user profile from the token claims.
    Used for rehydrating store state or validating role on boot.
    """
    from flask_jwt_extended import jwt_required, get_jwt_identity
    from flask_jwt_extended import verify_jwt_in_request, get_jwt
    
    try:
        verify_jwt_in_request()
        claims = get_jwt()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify(msg="User no longer exists"), 404
            
        return jsonify({
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "restaurant_id": user.restaurant_id
        }), 200
    except Exception as e:
        return jsonify(msg="Invalid session"), 401
