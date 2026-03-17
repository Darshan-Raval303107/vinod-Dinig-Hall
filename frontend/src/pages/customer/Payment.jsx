import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ShieldCheck, CreditCard, ArrowLeft, ArrowRight, Loader2, Lock, Smartphone, Globe, Info } from 'lucide-react';

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
        setError(err.response?.data?.msg || 'Payment node initialization failed.');
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
      setError('Transaction validation failure.');
      setLoading(false);
    });
  };

  if (loading && !paymentData) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-8">
      <div className="w-12 h-12 border-4 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-customer-accent uppercase tracking-widest animate-pulse">Establishing Secure Transaction</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-8 text-center">
       <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center mb-8 text-red-500">
          <Lock size={32} />
       </div>
       <h1 className="font-fraunces text-3xl font-black italic text-customer-text mb-2">Access Restricted</h1>
       <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">{error}</p>
       <button 
         onClick={() => navigate(-1)}
         className="mt-12 text-[10px] font-black text-customer-text uppercase tracking-widest underline underline-offset-8 italic"
       >
         Return to Status Matrix
       </button>
    </div>
  );

  return (
    <div className="theme-customer min-h-screen bg-[#FBF7F0] font-jakarta pb-32 animate-in fade-in duration-1000">
      <header className="px-8 pt-16 pb-12 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-customer-surface/30 text-customer-text/40 hover:text-customer-accent transition-all active:scale-90 shadow-sm"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
           <h1 className="font-fraunces text-4xl font-black text-customer-text italic tracking-tighter leading-none">Settlement</h1>
           <p className="text-[10px] font-black text-customer-text/30 uppercase tracking-[0.2em] mt-2">Secure Payment Interface v1.0</p>
        </div>
      </header>

      <div className="px-8 space-y-8 max-w-lg mx-auto">
        {/* SUMMARY CARD */}
        <div className="bg-white rounded-[3rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] border border-customer-surface/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-customer-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-customer-accent/10 transition-colors duration-700"></div>
          
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-xl bg-customer-accent/5 flex items-center justify-center text-customer-accent">
                <Smartphone size={20} />
             </div>
             <span className="text-[10px] font-black text-customer-text/30 uppercase tracking-[0.3em]">Transaction Summary</span>
          </div>

          <div className="space-y-6">
             <div className="flex justify-between items-end">
                <div className="flex flex-col">
                   <h2 className="text-sm font-black text-customer-text uppercase tracking-widest italic leading-none">Order Valuation</h2>
                   <span className="text-[9px] font-bold text-customer-text/20 uppercase tracking-[0.2em] mt-1.5">Inc. taxes & service provision</span>
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="font-fraunces text-5xl font-black text-customer-text italic">₹{paymentData.amount.toFixed(0)}</span>
                </div>
             </div>

             <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-customer-surface/40 to-transparent"></div>

             <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-customer-text/40 italic">
                <span>Network Reference</span>
                <span className="font-mono text-zinc-400">{paymentData.razorpay_order_id.toUpperCase()}</span>
             </div>
          </div>
        </div>

        {/* MOCK ALERT */}
        <div className="p-6 bg-customer-accent/5 border border-customer-accent/10 rounded-[2rem] flex items-start gap-4">
           <Info size={20} className="text-customer-accent flex-shrink-0" />
           <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-widest italic">
             The system is currently in <span className="text-customer-accent">MOCK-BYPASS</span> mode. No real credit will be deducted. Verification is instant via local loopback.
           </p>
        </div>

        {/* PAYMENT OPTIONS AREA */}
        <div className="space-y-4 pt-4">
           <button 
            onClick={handleMockPayment}
            disabled={loading}
            className="group relative w-full h-20 bg-customer-text text-white rounded-[2.5rem] shadow-2xl flex items-center justify-between px-3 overflow-hidden transition-all active:scale-[0.98] border border-white/5 disabled:opacity-50"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

             <div className="h-14 bg-[#3395FF] text-white rounded-[2rem] px-8 flex items-center gap-3">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                <span className="text-xs font-black uppercase tracking-[0.2em] italic">{loading ? 'Processing...' : 'Pay with Razorpay'}</span>
             </div>
             
             <div className="flex items-center gap-2 font-fraunces italic text-xl pr-6 transition-all group-hover:translate-x-1">
                EXECUTE <ArrowRight size={22} />
             </div>
          </button>

          <button 
            onClick={() => navigate(-1)}
            className="w-full h-16 rounded-[2rem] bg-white border border-customer-surface/30 text-[10px] font-black uppercase tracking-widest text-customer-text/40 hover:bg-zinc-50 transition-all font-jakarta shadow-sm"
          >
            Return to Tracker
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 pt-12">
           <div className="flex items-center gap-3 opacity-20">
              <ShieldCheck size={16} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">PCI-DSS ENCRYPTED NODE</span>
              <Globe size={16} />
           </div>
           <p className="text-[8px] text-zinc-300 font-medium uppercase tracking-[0.4em]">Integrated Settlement Engine v4.11</p>
        </div>
      </div>
    </div>
  );
};

export default Payment;
