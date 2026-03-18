"""
Payment business-logic layer.
Updated with robust logging and validation to debug 500 errors.
"""
import json
import logging
from decimal import Decimal
from extensions import db
from models import Order, Payment, WebhookEvent
from services.razorpay_service import (
    create_razorpay_order,
    verify_payment_signature,
)

logger = logging.getLogger("dineflow.payment_service")


# ── Helpers ─────────────────────────────────────────────────────────────────

def _amount_to_paise(amount: Decimal) -> int:
    """Convert a Decimal amount in ₹ to integer paise (Razorpay expects paise)."""
    # 4. Validate Amount Format
    try:
        if amount is None or amount <= 0:
            return 0
        return int(amount * 100)
    except Exception as e:
        logger.error(f"Error converting amount {amount} to paise: {str(e)}")
        return 0


def _ok(data: dict, status: int = 200):
    return {"success": True, **data}, status


def _err(message: str, status: int = 400):
    return {"success": False, "error": message}, status


# ── Create Order ────────────────────────────────────────────────────────────

def process_create_order(order_id: str):
    """
    1. Fetch the order from the DB and compute total server-side.
    2. If a pending Razorpay order already exists, return it (idempotent).
    ...
    """
    # 6. Debug Logging (Mandatory)
    logger.info(f"Looking up order_id in DB: {order_id}")
    
    try:
        order = Order.query.get(order_id)
        if not order:
            logger.error(f"Order {order_id} not found in database")
            return _err("Order not found in our database system", 404)

        # Re-calculate total from line items (never trust frontend)
        total = sum(
            item.unit_price * item.quantity for item in order.items
        )
        logger.info(f"Order total: {total} for items: {len(order.items)}")
        
        # 4. Validate Amount Format
        if total <= 0:
            logger.error(f"Invalid total amount: {total}")
            return _err("Order total must be greater than zero")

        order.total_price = total
        amount_paise = _amount_to_paise(total)
        logger.info(f"Computed amount_paise: {amount_paise}")

        # Check for existing pending payment (idempotent re-creation)
        existing = Payment.query.filter_by(order_id=order.id).first()
        if existing and existing.razorpay_order_id and existing.status == "pending":
            db.session.commit()  # save recalculated total
            logger.info(f"Returning existing payment record: {existing.razorpay_order_id}")
            return _ok({
                "razorpay_order_id": existing.razorpay_order_id,
                "amount": float(total),
                "amount_paise": amount_paise,
                "currency": "INR",
                "order_id": order.id,
            })

        # 7. Handle Razorpay API Errors (the service will raise)
        logger.info(f"Calling Razorpay API (Mock) for amount {amount_paise}")
        rz_order = create_razorpay_order(
            amount_paise=amount_paise,
            receipt=order.id,
            notes={"restaurant_id": str(order.restaurant_id), "table": order.table_number},
        )
        logger.info(f"Razorpay order result: {rz_order.get('id')} - {rz_order.get('status')}")

        # 8. Persist payment record
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
        logger.info(f"Payment record saved successfully in DB for order {order.id}")

        # 8. Return Proper Response
        return _ok({
            "razorpay_order_id": rz_order["id"],
            "amount": float(total),
            "amount_paise": amount_paise,
            "currency": "INR",
            "order_id": order.id,
        })
        
    except Exception as e:
        logger.error(f"FATAL Exception in process_create_order: {str(e)}", exc_info=True)
        # Re-raise to ensure the route handler logs the full traceback
        raise e


# ── Verify Payment ──────────────────────────────────────────────────────────

def process_verify_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
):
    """
    Verify payment signature.
    """
    try:
        logger.info(f"Verifying payment {razorpay_payment_id} for order {razorpay_order_id}")
        
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
            logger.warning("Payment signature verification failed")
            return _err("Payment verification failed — invalid signature", 400)

        # Mark payment + order as paid
        payment.razorpay_payment_id = razorpay_payment_id
        payment.status = "success"

        order = Order.query.get(payment.order_id)
        if order:
            order.status = "paid"
            order.razorpay_payment_id = razorpay_payment_id

        db.session.commit()
        logger.info(f"Payment verified successfully in DB: {payment.id}")

        return _ok({
            "message": "Payment verified successfully",
            "order_id": payment.order_id,
        })
        
    except Exception as e:
        logger.error(f"Error in process_verify_payment: {str(e)}", exc_info=True)
        raise e


# ── Webhook Event Processing ───────────────────────────────────────────────

_STATUS_PRIORITY = {
    "pending": 0,
    "authorized": 1,
    "captured": 2,
    "success": 2,
    "failed": 3,
}

def _can_transition(current_status: str, new_status: str) -> bool:
    cur = _STATUS_PRIORITY.get(current_status, -1)
    nxt = _STATUS_PRIORITY.get(new_status, -1)
    if new_status == "failed":
        return current_status not in ("success", "captured")
    return nxt > cur


def process_webhook_event(event_data: dict):
    """
    Handle validated Razorpay webhook.
    """
    event_id = event_data.get("event_id") or event_data.get("id")
    event_type = event_data.get("event")

    if not event_id or not event_type:
        return _err("Invalid webhook payload")

    existing_event = WebhookEvent.query.filter_by(event_id=event_id).first()
    if existing_event and existing_event.processed:
        return _ok({"message": "Event already processed"})

    if not existing_event:
        existing_event = WebhookEvent(
            event_id=event_id,
            event_type=event_type,
            payload=json.dumps(event_data),
        )
        db.session.add(existing_event)

    payload = event_data.get("payload", {})
    payment_entity = payload.get("payment", {}).get("entity", {})
    rz_order_id = payment_entity.get("order_id")
    rz_payment_id = payment_entity.get("id")
    payment_method = payment_entity.get("method")

    if not rz_order_id:
        existing_event.processed = True
        db.session.commit()
        return _ok({"message": "Event acknowledged (no order_id)"})

    payment = Payment.query.filter_by(razorpay_order_id=rz_order_id).first()
    if not payment:
        existing_event.processed = True
        db.session.commit()
        return _ok({"message": "No matching payment record"})

    status_map = {
        "payment.authorized": "authorized",
        "payment.captured": "captured",
        "payment.failed": "failed",
    }
    new_status = status_map.get(event_type)
    if not new_status:
        existing_event.processed = True
        db.session.commit()
        return _ok({"message": f"Event type '{event_type}' acknowledged"})

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
                if order.status not in ("paid",):
                    order.status = "failed"

    existing_event.processed = True
    db.session.commit()

    return _ok({"message": "Webhook processed"})
