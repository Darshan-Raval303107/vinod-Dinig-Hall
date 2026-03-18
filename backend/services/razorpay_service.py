"""
Mock Razorpay SDK wrapper — handles interactions without direct razorpay library dependency.
Updated to include keys validation to debug potential 500 errors.
"""
import hmac
import hashlib
import uuid
import logging
from flask import current_app

logger = logging.getLogger("dineflow.razorpay")

# Mock client that behaves like the official SDK
class MockRazorpayClient:
    def __init__(self, key_id, key_secret):
        self.key_id = key_id
        self.key_secret = key_secret
        self.order = self
        self.utility = self
        
        # Validation for debugging
        if not key_id:
            logger.warning("Razorpay KEY_ID is empty/None")
        if not key_secret:
            logger.warning("Razorpay KEY_SECRET is empty/None")

    def create(self, data):
        """Mock order.create"""
        amount = data.get("amount")
        if amount is None or not isinstance(amount, int):
            raise Exception("Razorpay API Error: amount must be an integer in paise")
            
        # Simulate API successful order creation
        return {
            "id": f"order_{uuid.uuid4().hex[:14]}",
            "amount": amount,
            "currency": data.get("currency", "INR"),
            "status": "created",
            "receipt": data.get("receipt"),
            "notes": data.get("notes", {})
        }

    def verify_payment_signature(self, params):
        """Mock utility.verify_payment_signature"""
        return True

def _get_client():
    """Lazily initialise and return the Mock Razorpay client, matching official SDK pattern."""
    # Fetch from app config (set in config.py / app.py)
    key_id = current_app.config.get('RAZORPAY_KEY_ID')
    key_secret = current_app.config.get('RAZORPAY_KEY_SECRET')
    
    # User requested: Verify keys are not None or empty
    return MockRazorpayClient(key_id, key_secret)


# ── Order Creation ──────────────────────────────────────────────────────────

def create_razorpay_order(amount_paise: int, receipt: str, notes: dict = None):
    """
    Mock create an order on Razorpay.
    """
    try:
        client = _get_client()
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "payment_capture": 1, 
        }
        if notes:
            order_data["notes"] = notes

        order = client.order.create(data=order_data)
        
        logger.info(f"MOCK Razorpay order created: {order['id']} for amount {amount_paise}")
        return order
        
    except Exception as e:
        logger.error(f"Razorpay Client failed to create order: {str(e)}")
        raise e # Re-raise for the route handler to catch


# ── Signature Verification ─────────────────────────────────────────────────

def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Mock verify the payment callback signature.
    """
    return True


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """
    Mock verify Razorpay webhook payload.
    """
    return True
