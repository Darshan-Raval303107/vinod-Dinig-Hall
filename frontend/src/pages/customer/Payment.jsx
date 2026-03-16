import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    api.post('/payments/create', { order_id: orderId })
      .then(res => {
        setPaymentData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.msg || 'Failed to initialize payment');
        setLoading(false);
      });
  }, [orderId]);

  const handleMockPayment = () => {
    setLoading(true);
    api.post('/payments/verify', {
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: "pay_mock123",
      razorpay_signature: "mock_sig_321"
    })
    .then(() => {
      navigate(`/order-status/${orderId}`);
    })
    .catch(err => {
      setError('Payment verification failed');
      setLoading(false);
    });
  };

  if (loading) return <div className="p-8 theme-customer min-h-screen flex items-center justify-center">Processing...</div>;
  if (error) return <div className="p-8 theme-customer min-h-screen text-red-600 flex items-center justify-center">{error}</div>;

  return (
    <div className="theme-customer min-h-screen p-6 font-jakarta">
      <h1 className="font-fraunces text-2xl font-semibold mb-6 pt-8">Complete Payment</h1>
      
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-customer-surface/30 mb-8">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-customer-surface/40">
          <span className="text-customer-text/70">Order Amount</span>
          <span className="font-semibold text-xl">₹{paymentData.amount.toFixed(2)}</span>
        </div>
        <div className="text-sm text-customer-text/60 mb-2">
          Razorpay Order ID: <span className="font-mono">{paymentData.razorpay_order_id}</span>
        </div>
      </div>

      <div className="space-y-4">
        <button 
          onClick={handleMockPayment}
          className="w-full bg-[#3395FF] text-white p-4 rounded-xl flex items-center justify-center font-semibold shadow-md"
        >
          Pay with Razorpay (Mock Mode)
        </button>
        <button 
          onClick={() => navigate(-1)}
          className="w-full bg-customer-surface/40 text-customer-text p-4 rounded-xl flex items-center justify-center font-medium"
        >
          Cancel
        </button>
      </div>
      
      <p className="text-center text-xs text-customer-text/40 mt-8">
        This is a mock payment integration for testing.
      </p>
    </div>
  );
};

export default Payment;
