from flask import Blueprint, request, jsonify
from app import db
from models import Order, Payment

payments_bp = Blueprint('payments_bp', __name__)

@payments_bp.route('/payments/create', methods=['POST'])
def create_payment():
    data = request.json
    order_id = data.get('order_id')

    order = Order.query.get(order_id)
    if not order:
        return jsonify(msg="Order not found"), 404

    # Dummy Razorpay Order ID for Phase 2
    mock_razorpay_order_id = f"order_mock_{order.id.hex[:8]}"

    # Check if pending payment exists
    payment = Payment.query.filter_by(order_id=order.id).first()
    if not payment:
        payment = Payment(
            order_id=order.id,
            amount=order.total_price,
            payment_method='razorpay',
            status='pending',
            razorpay_order_id=mock_razorpay_order_id
        )
        db.session.add(payment)
        db.session.commit()

    return jsonify({
        'razorpay_order_id': payment.razorpay_order_id,
        'amount': float(payment.amount),
        'currency': 'INR'
    }), 200

@payments_bp.route('/payments/verify', methods=['POST'])
def verify_payment():
    data = request.json
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_signature = data.get('razorpay_signature')

    payment = Payment.query.filter_by(razorpay_order_id=razorpay_order_id).first()
    if not payment:
        return jsonify(msg="Payment record not found"), 404

    # Mock signature verification
    if razorpay_payment_id and razorpay_signature:
        payment.status = 'success'
        
        # Update order status
        order = Order.query.get(payment.order_id)
        if order:
            order.status = 'paid'
            
        db.session.commit()
        return jsonify(msg="Payment verified successfully"), 200
    
    return jsonify(msg="Invalid payment details"), 400
