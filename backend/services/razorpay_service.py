"""
Real Razorpay SDK integration (Production-ready)
Replaces the old mock version completely
"""

import logging
import hmac
import hashlib
from typing import Dict, Optional
from flask import current_app
import razorpay  # ← Official library - make sure pip install razorpay

logger = logging.getLogger("razorpay_real")
logger.setLevel(logging.INFO)


def get_client():
    """
    Returns real Razorpay client.
    Raises error if keys are missing.
    """
    key_id = current_app.config.get("RAZORPAY_KEY_ID")
    key_secret = current_app.config.get("RAZORPAY_KEY_SECRET")

    if not key_id or not key_secret:
        logger.error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in config")
        raise RuntimeError("Razorpay keys are not configured properly")

    logger.info(f"Using Razorpay key: {key_id[:10]}...")

    return razorpay.Client(auth=(key_id, key_secret))


def create_razorpay_order(
    amount_paise: int,
    receipt: str,
    notes: Optional[Dict] = None
) -> Dict:
    """
    Creates a REAL Razorpay order.
    Returns the order object from Razorpay API.
    """
    try:
        client = get_client()

        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "payment_capture": 1,  # auto-capture (recommended for most cases)
        }

        if notes:
            order_data["notes"] = notes

        rz_order = client.order.create(order_data)

        logger.info(f"Real Razorpay order created: {rz_order['id']} | Amount: ₹{amount_paise/100}")

        # Return only what frontend needs (no qr_code, no payment_url)
        return {
            "id": rz_order["id"],
            "amount": rz_order["amount"],
            "amount_paid": rz_order.get("amount_paid", 0),
            "amount_due": rz_order.get("amount_due", rz_order["amount"]),
            "currency": rz_order["currency"],
            "status": rz_order["status"],
            "receipt": rz_order.get("receipt"),
        }

    except razorpay.errors.BadRequestError as e:
        logger.error(f"Razorpay BadRequest: {e.error}")
        raise RuntimeError(f"Razorpay error: {e.error.get('description', str(e))}")
    except Exception as e:
        logger.exception("Failed to create Razorpay order")
        raise RuntimeError(f"Order creation failed: {str(e)}")


def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> bool:
    """
    Verifies Razorpay payment signature using official method.
    Returns True if valid, False otherwise.
    """
    try:
        client = get_client()
        params = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        }
        is_valid = client.utility.verify_payment_signature(params)
        logger.info(f"Signature verification: {'VALID' if is_valid else 'INVALID'}")
        return is_valid
    except Exception as e:
        logger.exception("Signature verification failed")
        return False


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """
    Verifies Razorpay webhook signature using HMAC-SHA256.
    Requires RAZORPAY_WEBHOOK_SECRET in config.
    """
    webhook_secret = current_app.config.get("RAZORPAY_WEBHOOK_SECRET")
    if not webhook_secret:
        logger.warning("RAZORPAY_WEBHOOK_SECRET not set → webhook verification disabled")
        return False

    try:
        expected = hmac.new(
            webhook_secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()

        is_valid = hmac.compare_digest(expected, signature)
        logger.info(f"Webhook signature: {'VALID' if is_valid else 'INVALID'}")
        return is_valid
    except Exception as e:
        logger.exception("Webhook signature verification error")
        return False