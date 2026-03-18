"""
Mock Razorpay SDK wrapper (Production-ready structure)

Purpose:
- Simulate Razorpay order creation without real API calls
- Validate keys and inputs
- Provide clean logging and error handling
- Easy to replace with real Razorpay SDK later
"""

import uuid
import logging
from typing import Dict, Optional
from flask import current_app

# Configure logger
logger = logging.getLogger("razorpay_mock")
logger.setLevel(logging.INFO)


# ─────────────────────────────────────────────────────────────
# Mock Razorpay Client
# ─────────────────────────────────────────────────────────────

class MockRazorpayClient:
    """
    A mock version of Razorpay client that mimics:
    - order.create()
    - utility.verify_payment_signature()
    """

    def __init__(self, key_id: str, key_secret: str):
        self.key_id = key_id
        self.key_secret = key_secret

        # Mimic Razorpay SDK structure
        self.order = self
        self.utility = self

        # Validate keys
        if not self.key_id:
            logger.warning("⚠️ Razorpay KEY_ID is missing")

        if not self.key_secret:
            logger.warning("⚠️ Razorpay KEY_SECRET is missing")

    # ── Order Creation ───────────────────────────────────────

    def create(self, data: Dict) -> Dict:
        """
        Simulates Razorpay order.create()
        """

        amount = data.get("amount")

        # Validate amount
        if amount is None:
            raise ValueError("Amount is required")

        if not isinstance(amount, int):
            raise TypeError("Amount must be integer (in paise)")

        if amount <= 0:
            raise ValueError("Amount must be greater than 0")

        # Generate fake order
        order = {
            "id": f"order_{uuid.uuid4().hex[:14]}",
            "amount": amount,
            "currency": data.get("currency", "INR"),
            "status": "created",
            "receipt": data.get("receipt"),
            "notes": data.get("notes", {})
        }

        logger.info(f"✅ Mock Order Created: {order['id']} | Amount: {amount}")
        return order

    # ── Signature Verification ───────────────────────────────

    def verify_payment_signature(self, params: Dict) -> bool:
        """
        Simulates signature verification
        """
        logger.info("🔐 Mock signature verification successful")
        return True


# ─────────────────────────────────────────────────────────────
# Helper: Get Client
# ─────────────────────────────────────────────────────────────

def get_client() -> MockRazorpayClient:
    """
    Fetch Razorpay keys from Flask config
    and return mock client
    """

    key_id = current_app.config.get("RAZORPAY_KEY_ID")
    key_secret = current_app.config.get("RAZORPAY_KEY_SECRET")

    if not key_id or not key_secret:
        logger.error("❌ Razorpay keys not configured properly")

    return MockRazorpayClient(key_id, key_secret)


# ─────────────────────────────────────────────────────────────
# Create Order (Main Function)
# ─────────────────────────────────────────────────────────────

def create_razorpay_order(
    amount_paise: int,
    receipt: str,
    notes: Optional[Dict] = None
) -> Dict:
    """
    Create a mock Razorpay order

    Args:
        amount_paise (int): Amount in paise (₹100 = 10000)
        receipt (str): Unique receipt ID
        notes (dict): Optional metadata

    Returns:
        dict: Mock Razorpay order
    """

    try:
        client = get_client()

        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "payment_capture": 1
        }

        if notes:
            order_data["notes"] = notes

        order = client.order.create(order_data)

        return order

    except Exception as e:
        logger.exception("❌ Failed to create Razorpay order")
        raise RuntimeError(f"Order creation failed: {str(e)}")


# ─────────────────────────────────────────────────────────────
# Payment Signature Verification
# ─────────────────────────────────────────────────────────────

def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> bool:
    """
    Mock verification of payment signature
    """

    try:
        client = get_client()

        params = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        }

        return client.utility.verify_payment_signature(params)

    except Exception as e:
        logger.exception("❌ Signature verification failed")
        return False


# ─────────────────────────────────────────────────────────────
# Webhook Verification (Mock)
# ─────────────────────────────────────────────────────────────

def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """
    Mock webhook signature verification
    """

    try:
        # Always true (mock)
        logger.info("🔔 Webhook signature verified (mock)")
        return True

    except Exception as e:
        logger.exception("❌ Webhook verification failed")
        return False