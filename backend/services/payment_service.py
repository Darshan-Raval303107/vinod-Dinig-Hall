"""
Payment business-logic layer.
Updated for REAL Razorpay integration (no mock, no QR code generation)
"""

import json
import logging
from decimal import Decimal
from flask import current_app
from extensions import db
from models import Order, Payment, WebhookEvent
from services.razorpay_service import (
    create_razorpay_order,
    verify_payment_signature,
)

logger = logging.getLogger("dineflow.payment_service")


# ── Helpers ─────────────────────────────────────────────────────────────────

def _amount_to_paise(amount: Decimal) -> int:
    try:
        if amount is None or amount <= 0:
            return 0
        return int(amount * 100)
    except Exception as e:
        logger.error(f"Amount conversion error: {str(e)}")
        return 0


def _ok(data: dict, status: int = 200):
    return {"success": True, **data}, status


def _err(message: str, status: int = 400):
    return {"success": False, "error": message}, status


# ── Create Order ────────────────────────────────────────────────────────────

def process_create_order(order_id: str):
    """
    Creates or reuses a Razorpay order for the given order_id.
    Returns only the fields needed for Razorpay Checkout.js
    """
    logger.info(f"Processing create order for order_id: {order_id}")

    try:
        order = Order.query.get(order_id)
        if not order:
            logger.error(f"Order not found: {order_id}")
            return _err("Order not found in database", 404)

        # Always recalculate total server-side
        total = sum(item.unit_price * item.quantity for item in order.items)
        logger.info(f"Calculated total: ₹{total} ({len(order.items)} items)")

        if total <= 0:
            return _err("Order total must be greater than zero", 400)

        order.total_price = total
        amount_paise = _amount_to_paise(total)

        # Check for existing pending payment (idempotency)
        existing = Payment.query.filter_by(order_id=order.id).first()
        if existing and existing.razorpay_order_id and existing.status in ("pending", "created"):
            db.session.commit()
            logger.info(f"Returning existing Razorpay order: {existing.razorpay_order_id}")
            return _ok({
                "razorpay_order_id": existing.razorpay_order_id,
                "amount": float(total),
                "amount_paise": amount_paise,
                "currency": "INR",
                "order_id": order.id,
                "razorpay_key_id": current_app.config.get("RAZORPAY_KEY_ID")
            })

        # Create new real Razorpay order
        rz_order = create_razorpay_order(
            amount_paise=amount_paise,
            receipt=order.id,
            notes={
                "restaurant_id": str(order.restaurant_id),
                "table": order.table_number or "N/A",
                "internal_order_id": order_id
            }
        )

        # Save payment record
        if existing:
            existing.razorpay_order_id = rz_order["id"]
            existing.amount = total
            existing.status = "created"
        else:
            payment = Payment(
                order_id=order.id,
                amount=total,
                payment_method="razorpay",
                status="created",
                razorpay_order_id=rz_order["id"],
            )
            db.session.add(payment)

        db.session.commit()
        logger.info(f"New payment record saved for order {order.id}")

        # Return minimal data for frontend Checkout
        return _ok({
            "razorpay_order_id": rz_order["id"],
            "amount": float(total),
            "amount_paise": amount_paise,
            "currency": "INR",
            "order_id": order.id,
            "razorpay_key_id": current_app.config.get("RAZORPAY_KEY_ID")
        })

    except Exception as e:
        db.session.rollback()
        logger.exception(f"Critical error in process_create_order: {str(e)}")
        raise


# ── Verify Payment ──────────────────────────────────────────────────────────

def process_verify_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
):
    logger.info(f"Verifying payment {razorpay_payment_id} for order {razorpay_order_id}")

    try:
        payment = Payment.query.filter_by(razorpay_order_id=razorpay_order_id).first()
        if not payment:
            logger.warning(f"Payment record missing for razorpay_order_id: {razorpay_order_id}")
            return _err("Payment record not found", 404)

        if payment.status in ("success", "captured", "paid"):
            return _ok({
                "message": "Payment already verified",
                "order_id": payment.order_id
            })

        is_valid = verify_payment_signature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )

        if not is_valid:
            logger.warning("Invalid payment signature")
            return _err("Invalid payment signature", 400)

        # Mark success
        payment.razorpay_payment_id = razorpay_payment_id
        payment.status = "success"

        linked_order = Order.query.get(payment.order_id)
        if linked_order:
            linked_order.status = "paid"
            linked_order.razorpay_payment_id = razorpay_payment_id

        db.session.commit()
        logger.info(f"Payment successfully verified: {payment.id}")

        return _ok({
            "message": "Payment verified successfully",
            "order_id": payment.order_id,
        })

    except Exception as e:
        db.session.rollback()
        logger.exception("Verification failed")
        return _err(f"Verification failed: {str(e)}", 500)


# ── Webhook Event Processing ───────────────────────────────────────────────

_STATUS_PRIORITY = {
    "pending": 0,
    "authorized": 1,
    "captured": 2,
    "success": 2,
    "failed": 3,
}

def _can_transition(current: str, new: str) -> bool:
    cur = _STATUS_PRIORITY.get(current, -1)
    nxt = _STATUS_PRIORITY.get(new, -1)
    if new == "failed":
        return current not in ("success", "captured")
    return nxt > cur


def process_webhook_event(event_data: dict):
    event_id = event_data.get("event_id") or event_data.get("id")
    event_type = event_data.get("event")

    if not event_id or not event_type:
        return _err("Invalid webhook payload")

    existing = WebhookEvent.query.filter_by(event_id=event_id).first()
    if existing and existing.processed:
        return _ok({"message": "Event already processed"})

    if not existing:
        existing = WebhookEvent(
            event_id=event_id,
            event_type=event_type,
            payload=json.dumps(event_data),
        )
        db.session.add(existing)

    payload = event_data.get("payload", {})
    payment_entity = payload.get("payment", {}).get("entity", {})
    rz_order_id = payment_entity.get("order_id")
    rz_payment_id = payment_entity.get("id")
    method = payment_entity.get("method")

    if not rz_order_id:
        existing.processed = True
        db.session.commit()
        return _ok({"message": "No order_id in payload"})

    payment = Payment.query.filter_by(razorpay_order_id=rz_order_id).first()
    if not payment:
        existing.processed = True
        db.session.commit()
        return _ok({"message": "No matching payment found"})

    status_map = {
        "payment.authorized": "authorized",
        "payment.captured": "captured",
        "payment.failed": "failed",
    }

    new_status = status_map.get(event_type)
    if not new_status:
        existing.processed = True
        db.session.commit()
        return _ok({"message": f"Ignored event: {event_type}"})

    if _can_transition(payment.status, new_status):
        payment.status = "success" if new_status == "captured" else new_status
        payment.razorpay_payment_id = rz_payment_id or payment.razorpay_payment_id
        payment.method = method or payment.method
        payment.event_id = event_id

        order = Order.query.get(payment.order_id)
        if order:
            if new_status in ("captured", "success"):
                order.status = "paid"
                order.razorpay_payment_id = rz_payment_id
            elif new_status == "failed" and order.status != "paid":
                order.status = "failed"

    existing.processed = True
    db.session.commit()

    return _ok({"message": "Webhook processed"})