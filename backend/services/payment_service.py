"""
Payment business-logic layer.

Sits between the routes and the database / Razorpay service so that
route handlers stay thin and testable.
"""
import json
from decimal import Decimal
from extensions import db
from models import Order, Payment, WebhookEvent
from services.razorpay_service import (
    create_razorpay_order,
    verify_payment_signature,
)
from utils.logger import get_payment_logger

logger = get_payment_logger("dineflow.payment_service")


# ── Helpers ─────────────────────────────────────────────────────────────────

def _amount_to_paise(amount: Decimal) -> int:
    """Convert a Decimal amount in ₹ to integer paise (Razorpay expects paise)."""
    return int(amount * 100)


def _ok(data: dict, status: int = 200):
    return {"success": True, **data}, status


def _err(message: str, status: int = 400):
    return {"success": False, "error": message}, status


# ── Create Order ────────────────────────────────────────────────────────────

def process_create_order(order_id: str):
    """
    1. Fetch the order from the DB and compute total server-side.
    2. If a pending Razorpay order already exists, return it (idempotent).
    3. Otherwise create a new Razorpay order and persist it.
    """
    order = Order.query.get(order_id)
    if not order:
        return _err("Order not found", 404)

    # Re-calculate total from line items (never trust frontend)
    total = sum(
        item.unit_price * item.quantity for item in order.items
    )
    if total <= 0:
        return _err("Order total must be greater than zero")

    order.total_price = total

    # Check for existing pending payment (idempotent re-creation)
    existing = Payment.query.filter_by(order_id=order.id).first()
    if existing and existing.razorpay_order_id and existing.status == "pending":
        db.session.commit()  # save recalculated total
        logger.info(
            "Returning existing Razorpay order",
            extra={"extra_data": {
                "order_id": order.id,
                "razorpay_order_id": existing.razorpay_order_id,
            }},
        )
        return _ok({
            "razorpay_order_id": existing.razorpay_order_id,
            "amount": float(total),
            "amount_paise": _amount_to_paise(total),
            "currency": "INR",
            "order_id": order.id,
        })

    # Create order on Razorpay
    rz_order = create_razorpay_order(
        amount_paise=_amount_to_paise(total),
        receipt=order.id,
        notes={"restaurant_id": order.restaurant_id, "table": order.table_number},
    )

    # Persist payment record
    if existing:
        existing.razorpay_order_id = rz_order["id"]
        existing.amount = total
        existing.status = "pending"
    else:
        payment = Payment(
            order_id=order.id,
            amount=total,
            payment_method="razorpay",
            status="pending",
            razorpay_order_id=rz_order["id"],
        )
        db.session.add(payment)

    db.session.commit()

    logger.info(
        "Order created on Razorpay",
        extra={"extra_data": {
            "order_id": order.id,
            "razorpay_order_id": rz_order["id"],
            "amount": float(total),
        }},
    )

    return _ok({
        "razorpay_order_id": rz_order["id"],
        "amount": float(total),
        "amount_paise": _amount_to_paise(total),
        "currency": "INR",
        "order_id": order.id,
    })


# ── Verify Payment (frontend callback) ─────────────────────────────────────

def process_verify_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
):
    """
    Verify the Razorpay signature after the customer completes payment on the
    frontend (Checkout / UPI intent flow).
    """
    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return _err("Missing required payment fields")

    payment = Payment.query.filter_by(razorpay_order_id=razorpay_order_id).first()
    if not payment:
        return _err("Payment record not found", 404)

    # Already verified — idempotent
    if payment.status in ("success", "captured"):
        return _ok({"message": "Payment already verified", "order_id": payment.order_id})

    is_valid = verify_payment_signature(
        razorpay_order_id, razorpay_payment_id, razorpay_signature
    )

    if not is_valid:
        logger.warning(
            "FRAUD ALERT — invalid signature submitted",
            extra={"extra_data": {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
            }},
        )
        return _err("Payment verification failed — invalid signature", 400)

    # Mark payment + order as paid
    payment.razorpay_payment_id = razorpay_payment_id
    payment.status = "success"

    order = Order.query.get(payment.order_id)
    if order:
        order.status = "paid"
        order.razorpay_payment_id = razorpay_payment_id

    db.session.commit()

    logger.info(
        "Payment verified successfully",
        extra={"extra_data": {
            "order_id": payment.order_id,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
        }},
    )

    return _ok({
        "message": "Payment verified successfully",
        "order_id": payment.order_id,
    })


# ── Webhook Event Processing ───────────────────────────────────────────────

# Allowed status transitions — prevents out-of-order downgrades
_STATUS_PRIORITY = {
    "pending": 0,
    "authorized": 1,
    "captured": 2,
    "success": 2,
    "failed": 3,   # terminal, but can still arrive after "authorized"
}


def _can_transition(current_status: str, new_status: str) -> bool:
    """Return True if the transition is allowed (forward-only, or to failed)."""
    cur = _STATUS_PRIORITY.get(current_status, -1)
    nxt = _STATUS_PRIORITY.get(new_status, -1)
    if new_status == "failed":
        return current_status not in ("success", "captured")
    return nxt > cur


def process_webhook_event(event_data: dict):
    """
    Handle a validated Razorpay webhook event.

    Idempotency:
        The event_id from Razorpay is stored in `webhook_events`.
        If the same event_id arrives again it is acknowledged (200) but skipped.

    Out-of-order handling:
        Status transitions are only applied forward (pending → authorized →
        captured).  A late "authorized" event won't overwrite a "captured" status.
    """
    event_id = event_data.get("event_id") or event_data.get("id")
    event_type = event_data.get("event")

    if not event_id or not event_type:
        return _err("Invalid webhook payload")

    # ── Idempotency check ───────────────────────────────────────────────
    existing_event = WebhookEvent.query.filter_by(event_id=event_id).first()
    if existing_event and existing_event.processed:
        logger.info(
            "Duplicate webhook event — skipping",
            extra={"extra_data": {"event_id": event_id, "event_type": event_type}},
        )
        return _ok({"message": "Event already processed"})

    # Record the event
    if not existing_event:
        existing_event = WebhookEvent(
            event_id=event_id,
            event_type=event_type,
            payload=json.dumps(event_data),
        )
        db.session.add(existing_event)

    # ── Extract payment entity ──────────────────────────────────────────
    payload = event_data.get("payload", {})
    payment_entity = payload.get("payment", {}).get("entity", {})
    rz_order_id = payment_entity.get("order_id")
    rz_payment_id = payment_entity.get("id")
    payment_method = payment_entity.get("method")  # upi, card, etc.

    if not rz_order_id:
        existing_event.processed = True
        db.session.commit()
        logger.warning(
            "Webhook event has no order_id — skipping",
            extra={"extra_data": {"event_id": event_id}},
        )
        return _ok({"message": "Event acknowledged (no order_id)"})

    payment = Payment.query.filter_by(razorpay_order_id=rz_order_id).first()
    if not payment:
        existing_event.processed = True
        db.session.commit()
        logger.warning(
            "No payment record for webhook order_id",
            extra={"extra_data": {
                "event_id": event_id,
                "razorpay_order_id": rz_order_id,
            }},
        )
        return _ok({"message": "No matching payment record"})

    # ── Determine new status ────────────────────────────────────────────
    status_map = {
        "payment.authorized": "authorized",
        "payment.captured": "captured",
        "payment.failed": "failed",
    }
    new_status = status_map.get(event_type)
    if not new_status:
        existing_event.processed = True
        db.session.commit()
        logger.info(
            "Unhandled webhook event type",
            extra={"extra_data": {"event_id": event_id, "event_type": event_type}},
        )
        return _ok({"message": f"Event type '{event_type}' acknowledged"})

    # ── Apply transition (if allowed) ───────────────────────────────────
    if _can_transition(payment.status, new_status):
        payment.status = new_status if new_status != "captured" else "success"
        payment.razorpay_payment_id = rz_payment_id or payment.razorpay_payment_id
        payment.method = payment_method or payment.method
        payment.event_id = event_id

        order = Order.query.get(payment.order_id)
        if order:
            if new_status == "captured":
                order.status = "paid"
                order.razorpay_payment_id = rz_payment_id
            elif new_status == "failed":
                # Only mark failed if not already paid
                if order.status not in ("paid",):
                    order.status = "failed"

        logger.info(
            f"Webhook processed: {event_type}",
            extra={"extra_data": {
                "event_id": event_id,
                "order_id": payment.order_id,
                "razorpay_order_id": rz_order_id,
                "old_status": payment.status,
                "new_status": new_status,
            }},
        )
    else:
        logger.info(
            f"Webhook skipped — transition {payment.status} → {new_status} not allowed",
            extra={"extra_data": {
                "event_id": event_id,
                "order_id": payment.order_id,
            }},
        )

    existing_event.processed = True
    db.session.commit()

    return _ok({"message": "Webhook processed"})
