"""
Razorpay SDK wrapper — handles all direct interactions with the Razorpay API.
"""
import hmac
import hashlib
import razorpay
from flask import current_app
from utils.logger import get_payment_logger

logger = get_payment_logger("dineflow.razorpay")


def _get_client():
    """Lazily initialise and return the Razorpay client."""
    key_id = current_app.config["RAZORPAY_KEY_ID"]
    key_secret = current_app.config["RAZORPAY_KEY_SECRET"]
    if not key_id or not key_secret:
        raise RuntimeError(
            "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables"
        )
    return razorpay.Client(auth=(key_id, key_secret))


# ── Order Creation ──────────────────────────────────────────────────────────

def create_razorpay_order(amount_paise: int, receipt: str, notes: dict = None):
    """
    Create an order on Razorpay.

    Args:
        amount_paise: Amount in *paise* (₹1 = 100 paise).
        receipt:      A short identifier stored with Razorpay (e.g. order UUID).
        notes:        Optional dict of key-value metadata.

    Returns:
        dict – Razorpay order object (contains 'id', 'amount', 'status', etc.)
    """
    client = _get_client()
    order_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt,
        "payment_capture": 1,  # auto-capture
    }
    if notes:
        order_data["notes"] = notes

    order = client.order.create(data=order_data)
    logger.info(
        "Razorpay order created",
        extra={"extra_data": {
            "razorpay_order_id": order["id"],
            "amount_paise": amount_paise,
            "receipt": receipt,
        }},
    )
    return order


# ── Payment Signature Verification ─────────────────────────────────────────

def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Verify the payment callback signature using HMAC-SHA256.

    Returns True if valid, False otherwise.
    """
    client = _get_client()
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        })
        logger.info(
            "Payment signature verified",
            extra={"extra_data": {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
            }},
        )
        return True
    except razorpay.errors.SignatureVerificationError:
        logger.warning(
            "Payment signature verification FAILED — possible fraud attempt",
            extra={"extra_data": {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
            }},
        )
        return False


# ── Webhook Signature Verification ─────────────────────────────────────────

def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """
    Verify Razorpay webhook payload using the webhook secret.

    Args:
        body:      Raw request body (bytes).
        signature: Value of the X-Razorpay-Signature header.

    Returns True if valid.
    """
    webhook_secret = current_app.config["RAZORPAY_WEBHOOK_SECRET"]
    if not webhook_secret:
        logger.error("RAZORPAY_WEBHOOK_SECRET is not configured")
        return False

    expected = hmac.new(
        webhook_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()

    is_valid = hmac.compare_digest(expected, signature)
    if not is_valid:
        logger.warning("Webhook signature verification FAILED")
    return is_valid
