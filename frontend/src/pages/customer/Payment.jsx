import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Info,
  ArrowRight
} from 'lucide-react';

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch payment data on mount
  useEffect(() => {
    const initPayment = async () => {
      try {
        const res = await api.post('/payments/create', { order_id: orderId });
        setPaymentData(res.data);
        setLoading(false);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to initialize payment. Please try again.'
        );
        setLoading(false);
      }
    };

    initPayment();
  }, [orderId]);

  // Real Razorpay payment handler
  const handleRazorpayPayment = async () => {
    if (!paymentData || processing) return;

    setProcessing(true);
    setError('');

    console.log("Opening Razorpay with these params:", {
      key: paymentData.razorpay_key_id,
      amount: paymentData.amount_paise,
      order_id: paymentData.razorpay_order_id,
      currency: paymentData.currency || "INR"
    });

    const loadRazorpay = () =>
      new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load Razorpay'));
        document.body.appendChild(script);
      });

    try {
      await loadRazorpay();

      const options = {
        key: paymentData.razorpay_key_id,
        amount: paymentData.amount_paise,
        currency: paymentData.currency || 'INR',
        order_id: paymentData.razorpay_order_id,
        name: 'Vinnod Dining',
        description: `Order #${orderId}`,
        config: {
          display: {
            hide: [{ method: "paylater" }] // optional
          }
        },
        handler: async function (response) {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            setPaymentSuccess(true);
            setTimeout(() => {
              navigate(`/order-status/${orderId}`);
            }, 2500);
          } catch (verifyErr) {
            setError(
              verifyErr.response?.data?.error ||
              'Payment appears successful but verification failed. Contact support.'
            );
            setProcessing(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#000000'
        },
        modal: {
          ondismiss: () => {
            console.log("Razorpay modal dismissed by user");
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError('Failed to load payment gateway. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-8">
        <Loader2 className="w-12 h-12 text-customer-accent animate-spin" />
        <p className="mt-6 text-[10px] font-black text-customer-accent uppercase tracking-widest animate-pulse">
          Establishing Secure Transaction
        </p>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-8 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center mb-8 text-emerald-500 animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="font-fraunces text-4xl font-black italic text-customer-text mb-4">
          Payment Success
        </h1>
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">
          Redirecting to status matrix...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center mb-8 text-red-500">
          <AlertCircle size={32} />
        </div>
        <h1 className="font-fraunces text-3xl font-black italic text-customer-text mb-2">
          Payment Error
        </h1>
        <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest italic px-4 leading-relaxed">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-12 px-8 py-4 bg-customer-text text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic"
        >
          Retry Payment
        </button>
      </div>
    );
  }

  return (
    <div className="theme-customer min-h-screen bg-white font-jakarta pb-40 animate-in fade-in duration-500">
      {/* Header */}
      <header className="px-6 pt-12 pb-8 flex items-center justify-between sticky top-0 backdrop-blur-xl bg-white/90 z-50 border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-customer-text/60 active:scale-90 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-fraunces text-2xl font-black text-customer-text italic leading-none">
              Settlement
            </h1>
            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Virtual Protocol
            </p>
          </div>
        </div>
      </header>

      <div className="px-6 mt-8 space-y-6 max-w-md mx-auto">
        {/* Amount Card */}
        <div className="bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-100 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-8 opacity-40">
            <Smartphone size={16} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Billing Component</span>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic leading-none">
                  Payable Amount
                </h2>
                <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-[0.2em] mt-1.5">
                  Inclusive of GST
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-fraunces text-5xl font-black text-customer-text italic tracking-tighter">
                  ₹{paymentData?.amount?.toFixed(0) || '—'}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200/50 flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic">
                Reference ID
              </span>
              <span className="font-mono text-[9px] text-zinc-400 bg-white px-3 py-1 rounded-full border border-zinc-100">
                {paymentData?.razorpay_order_id?.slice(-12).toUpperCase() || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Real Razorpay Info */}
        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
              Secure Payment Gateway
            </h4>
            <p className="text-[9px] text-emerald-700/80 font-medium leading-relaxed uppercase tracking-wider mt-0.5">
              Powered by Razorpay • 256-bit SSL • PCI DSS Compliant
            </p>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-[100] pb-[calc(1.5rem + var(--safe-bottom))]">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleRazorpayPayment}
            disabled={processing || !paymentData}
            className={`group relative w-full h-20 rounded-[2.2rem] shadow-[0_25px_50px_-12px_rgba(200,92,26,0.25)] flex items-center justify-between px-3 overflow-hidden transition-all active:scale-[0.98] active:shadow-none bg-customer-text text-white ${processing || !paymentData ? 'opacity-60 cursor-not-allowed' : ''
              }`}
          >
            <div
              className={`absolute inset-0 bg-emerald-500 transition-transform duration-700 ${processing ? 'translate-y-0' : 'translate-y-full'
                }`}
            ></div>

            <div className="h-14 bg-white/10 rounded-[1.8rem] px-8 flex items-center gap-3 relative z-10">
              {processing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CreditCard size={18} />
              )}
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                {processing ? 'Processing...' : 'Pay Securely'}
              </span>
            </div>

            <div
              className={`flex items-center gap-2 font-fraunces italic text-xl pr-6 transition-all relative z-10 ${processing ? 'translate-x-4 opacity-0' : 'group-hover:translate-x-1'
                }`}
            >
              ₹{paymentData?.amount?.toFixed(0) || '—'} <ArrowRight size={22} className="text-customer-accent" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;