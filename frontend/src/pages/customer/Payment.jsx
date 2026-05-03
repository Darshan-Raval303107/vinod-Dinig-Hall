import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../../api/axios';
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

    const loadRazorpay = () => {
      return new Promise((resolve, reject) => {
        if (window.Razorpay) {
          resolve();
          return;
        }
        
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        
        const timeout = setTimeout(() => {
          reject(new Error("Razorpay SDK timed out."));
        }, 8000);

        script.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Razorpay SDK failed to load"));
        };
        document.body.appendChild(script);
      });
    };

    try {
      await loadRazorpay();

      if (!window.Razorpay) {
        throw new Error("Razorpay object not found.");
      }

      const options = {
        key: paymentData.razorpay_key_id,
        amount: paymentData.amount_paise,
        currency: paymentData.currency || "INR",
        name: "Vinnod Dining Hall",
        description: `Receipt #${orderId.slice(-6).toUpperCase()}`,
        order_id: paymentData.razorpay_order_id,
        handler: async function (response) {
          try {
            setProcessing(true);
            const verifyRes = await api.post('/payments/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId 
            });

            const pickup_code = verifyRes.data.pickup_code;
            const order_id = verifyRes.data.order_id || orderId;
            
            setPaymentSuccess(true);
            
            setTimeout(() => {
              const successUrl = `/success?order_id=${order_id}&code=${pickup_code || ''}`;
              window.location.replace(successUrl);
            }, 500);

          } catch (verifyErr) {
            setError(verifyErr.response?.data?.error || "Verification failed. Contact support.");
            setProcessing(false);
          }
        },
        prefill: {
          name: "Guest",
          email: "guest@vinnod.com",
          contact: ""
        },
        theme: { color: "#C85C1A" },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}`);
        setProcessing(false);
      });

      rzp.open();

    } catch (err) {
      setError(`Error: ${err.message}. Please allow popups and scripts.`);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-6">
        <Loader2 className="w-10 h-10 text-customer-accent animate-spin" />
        <p className="mt-4 text-[9px] font-black text-customer-accent uppercase tracking-widest animate-pulse">
          Preparing your bill...
        </p>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center mb-6 text-emerald-500 animate-bounce">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="font-fraunces text-3xl font-black italic text-customer-text mb-3">
          Payment Success
        </h1>
        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">
          Redirecting to receipt...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center mb-6 text-red-500">
          <AlertCircle size={28} />
        </div>
        <h1 className="font-fraunces text-2xl font-black italic text-customer-text mb-2">
          Payment Error
        </h1>
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider italic px-4 leading-relaxed max-w-xs">
          {error}
        </p>
        <button
          onClick={() => { setError(''); setLoading(true); }}
          className="mt-8 px-6 py-3 bg-customer-text text-white rounded-2xl text-[9px] font-black uppercase tracking-widest italic active:scale-95 transition-all"
        >
          Retry Payment
        </button>
      </div>
    );
  }

  return (
    <div className="theme-customer min-h-screen bg-white font-jakarta pb-32 animate-in fade-in duration-500">
      {/* Header */}
      <header className="px-4 md:px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 backdrop-blur-xl bg-white/90 z-50 border-b border-zinc-100"
              style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}>
        <div className="flex items-center gap-3">
          {paymentData?.order_type !== 'window' ? (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-customer-text/60 active:scale-90 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
          <div>
            <h1 className="font-fraunces text-xl md:text-2xl font-black text-customer-text italic leading-none">
              Payment
            </h1>
            <p className="text-[8px] font-black text-zinc-300 uppercase tracking-wider mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Secure
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 mt-4 space-y-4 max-w-md mx-auto">
        {/* Amount Card */}
        <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6 opacity-40">
            <Smartphone size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest">Bill Summary</span>
          </div>

          <div className="space-y-5">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <h2 className="text-[9px] font-black text-zinc-400 uppercase tracking-wider italic leading-none">
                  Payable Amount
                </h2>
                <span className="text-[7px] font-bold text-zinc-300 uppercase tracking-wider mt-1">
                  Inclusive of GST
                </span>
              </div>
              <span className="font-fraunces text-3xl md:text-4xl font-black text-customer-text italic tracking-tighter">
                ₹{paymentData?.amount?.toFixed(0) || '—'}
              </span>
            </div>

            <div className="pt-4 border-t border-zinc-200/50 flex justify-between items-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 italic">
                Reference ID
              </span>
              <span className="font-mono text-[8px] text-zinc-400 bg-white px-2.5 py-0.5 rounded-full border border-zinc-100">
                {paymentData?.razorpay_order_id?.slice(-12).toUpperCase() || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm flex-shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-wider text-emerald-800">
              Secure Gateway
            </h4>
            <p className="text-[8px] text-emerald-700/80 font-medium leading-relaxed uppercase tracking-wider mt-0.5">
              Razorpay • 256-bit SSL • PCI DSS
            </p>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-[100]"
           style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}>
        <div className="max-w-md mx-auto">
          <button
            onClick={handleRazorpayPayment}
            disabled={processing || !paymentData}
            className={`group relative w-full h-14 md:h-16 rounded-2xl shadow-[0_16px_40px_-10px_rgba(200,92,26,0.25)] flex items-center justify-between px-2 overflow-hidden transition-all active:scale-[0.98] active:shadow-none bg-customer-text text-white ${processing || !paymentData ? 'opacity-60 cursor-not-allowed' : ''
              }`}
          >
            <div
              className={`absolute inset-0 bg-emerald-500 transition-transform duration-700 ${processing ? 'translate-y-0' : 'translate-y-full'
                }`}
            ></div>

            <div className="h-10 md:h-12 bg-white/10 rounded-xl px-4 md:px-6 flex items-center gap-2.5 relative z-10">
              {processing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CreditCard size={14} />
              )}
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                {processing ? 'Processing...' : 'Pay Securely'}
              </span>
            </div>

            <div
              className={`flex items-center gap-1.5 font-fraunces italic text-base md:text-lg pr-3 md:pr-4 transition-all relative z-10 ${processing ? 'translate-x-4 opacity-0' : 'group-hover:translate-x-1'
                }`}
            >
              ₹{paymentData?.amount?.toFixed(0) || '—'} <ArrowRight size={18} className="text-customer-accent" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;