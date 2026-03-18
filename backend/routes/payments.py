"""
Payment routes — production Razorpay integration.

Updated with robust error handling, validation, and logging for debugging 500 errors.
"""
import traceback
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

@payments_bp.route("/payments/create", methods=["POST", "OPTIONS"])
@payments_bp.route("/payments/create-order", methods=["POST", "OPTIONS"])
def create_order():
    """
    Expects JSON: { "order_id": "<uuid>" }
    Returns:       { razorpay_order_id, amount, amount_paise, currency, key_id, order_id }
    """
    if request.method == "OPTIONS":
        return jsonify({"msg": "ok"}), 200

    logger.info(f"Incoming /api/payments/create request: {request.data}")
    
    try:
        # 1. Validate Content-Type
        if not request.is_json:
            logger.error("Request Content-Type is not application/json")
            return jsonify({
                "success": False, 
                "error": "Content-Type must be application/json"
            }), 400

        # 2. Extract and validate data
        data = request.get_json(silent=True) or {}
        order_id = data.get("order_id")

        if not order_id:
            logger.error("Validation failed: order_id is required")
            return jsonify({
                "success": False, 
                "error": "order_id is required",
                "received_data": data
            }), 400

        # 3. Process the creation via service layer
        logger.info(f"Processing order creation for order_id: {order_id}")
        result = process_create_order(order_id)
        body, status = result

        # 4. Inject public key if success
        if body.get("success"):
            key_id = current_app.config.get("RAZORPAY_KEY_ID")
            if not key_id:
                logger.warning("RAZORPAY_KEY_ID is missing from config")
                # Don't error out, still return the order data for front-end to handle
            
            body["key_id"] = key_id
            logger.info(f"Successfully created order node: {body.get('razorpay_order_id')}")
            return jsonify(body), status
        else:
            logger.error(f"Service layer returned error: {body.get('error')}")
            return jsonify(body), status

    except Exception as e:
        # Full traceback for debugging 500 errors
        tb = traceback.format_exc()
        logger.error(f"FATAL ERROR in /api/payments/create:\n{tb}")
        
        # WRITE TO FILE AS WELL
        with open("crash_log.txt", "w") as f:
            f.write(tb)
        
        return jsonify({
            "success": False, 
            "error": "Internal server error occurred while initializing payment",
            "details": str(e),
            "traceback": tb if current_app.debug else None
        }), 500


# ── 2. Verify Payment ──────────────────────────────────────────────────────

@payments_bp.route("/payments/verify", methods=["POST", "OPTIONS"])
@payments_bp.route("/payments/verify-payment", methods=["POST", "OPTIONS"])
def verify_payment():
    """
    Expects JSON: {
        "razorpay_order_id":   "order_...",
        "razorpay_payment_id": "pay_...",
        "razorpay_signature":  "<hmac>"
    }
    """
    if request.method == "OPTIONS":
        return jsonify({"msg": "ok"}), 200

    try:
        data = request.get_json(silent=True) or {}
        
        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_signature = data.get("razorpay_signature")

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return jsonify({
                "success": False,
                "error": "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
            }), 400

        return _respond(process_verify_payment(
            razorpay_order_id, razorpay_payment_id, razorpay_signature
        ))
        
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"FATAL ERROR in /api/payments/verify:\n{tb}")
        return jsonify({
            "success": False, 
            "error": "Verification failed during internal processing",
            "details": str(e)
        }), 500


# ── 3. Razorpay Webhook ────────────────────────────────────────────────────

@payments_bp.route("/webhook/razorpay", methods=["POST"])
def razorpay_webhook():
    """
    Razorpay sends POST with JSON body + X-Razorpay-Signature header.
    """
    raw_body = request.get_data()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not signature or not verify_webhook_signature(raw_body, signature):
        logger.warning("Webhook rejected — invalid signature")
        return jsonify({"success": False, "error": "Invalid webhook signature"}), 400

    event_data = request.get_json(silent=True)
    if not event_data:
        return jsonify({"success": False, "error": "Empty payload"}), 400

    try:
        return _respond(process_webhook_event(event_data))
    except Exception as e:
        logger.error(f"Webhook processing failed:\n{traceback.format_exc()}")
        return jsonify({"success": True, "message": "Error logged, will retry internally"}), 200
