from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from flask import jsonify

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def check_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)

def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in roles and user_role != "admin":
                return jsonify(msg="Insufficient permissions"), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper
