"""
Payment routes — production Razorpay integration.

Endpoints:
    POST /payments/create-order   — Create a Razorpay order for an existing DB order
    POST /payments/verify-payment — Verify Razorpay callback signature
    POST /webhook/razorpay        — Receive & process Razorpay webhook events
"""
from flask import Blueprint, request, jsonify, current_app
from services.payment_service import (
    process_create_order,
    process_verify_payment,
    process_webhook_event,
)
from services.razorpay_service import verify_webhook_signature
from utils.logger import get_payment_logger

payments_bp = Blueprint("payments_bp", __name__)
logger = get_payment_logger("dineflow.routes.payments")


# ── Consistent response helper ──────────────────────────────────────────────

def _respond(result):
    """Unpack the (body, status_code) tuple returned by the service layer."""
    body, status = result
    return jsonify(body), status


# ── 1. Create Order ─────────────────────────────────────────────────────────

@payments_bp.route("/payments/create-order", methods=["POST"])
def create_order():
    """
    Expects JSON: { "order_id": "<uuid>" }
    Returns:       { razorpay_order_id, amount, amount_paise, currency, key_id, order_id }
    """
    data = request.get_json(silent=True) or {}
    order_id = data.get("order_id")

    if not order_id:
        return jsonify({"success": False, "error": "order_id is required"}), 400

    try:
        result = process_create_order(order_id)
        body, status = result

        # Inject the public key_id so the frontend can initialise Razorpay Checkout
        if body.get("success"):
            body["key_id"] = current_app.config["RAZORPAY_KEY_ID"]

        return jsonify(body), status

    except Exception as e:
        logger.error(
            "create-order failed",
            exc_info=True,
            extra={"extra_data": {"order_id": order_id}},
        )
        return jsonify({"success": False, "error": "Internal server error"}), 500


# ── 2. Verify Payment ──────────────────────────────────────────────────────

@payments_bp.route("/payments/verify-payment", methods=["POST"])
def verify_payment():
    """
    Expects JSON: {
        "razorpay_order_id":   "order_...",
        "razorpay_payment_id": "pay_...",
        "razorpay_signature":  "<hmac>"
    }
    """
    data = request.get_json(silent=True) or {}

    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return jsonify({
            "success": False,
            "error": "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
        }), 400

    try:
        return _respond(process_verify_payment(
            razorpay_order_id, razorpay_payment_id, razorpay_signature
        ))
    except Exception as e:
        logger.error(
            "verify-payment failed",
            exc_info=True,
            extra={"extra_data": {"razorpay_order_id": razorpay_order_id}},
        )
        return jsonify({"success": False, "error": "Internal server error"}), 500


# ── 3. Razorpay Webhook ────────────────────────────────────────────────────

@payments_bp.route("/webhook/razorpay", methods=["POST"])
def razorpay_webhook():
    """
    Razorpay sends POST with JSON body + X-Razorpay-Signature header.
    Configure this URL in Razorpay Dashboard → Webhooks:
        https://yourdomain.com/api/webhook/razorpay
    """
    # Read raw body BEFORE parsing JSON (needed for signature check)
    raw_body = request.get_data()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # Validate webhook signature
    if not signature or not verify_webhook_signature(raw_body, signature):
        logger.warning(
            "Webhook rejected — invalid signature",
            extra={"extra_data": {"ip": request.remote_addr}},
        )
        return jsonify({"success": False, "error": "Invalid webhook signature"}), 400

    # Parse payload
    event_data = request.get_json(silent=True)
    if not event_data:
        return jsonify({"success": False, "error": "Empty payload"}), 400

    try:
        return _respond(process_webhook_event(event_data))
    except Exception as e:
        logger.error(
            "Webhook processing failed",
            exc_info=True,
            extra={"extra_data": {"event": event_data.get("event")}},
        )
        # Return 200 so Razorpay doesn't endlessly retry on our bug
        return jsonify({"success": True, "message": "Error logged, will retry internally"}), 200
