import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  Smartphone, 
  Calendar, 
  Hash, 
  ArrowDownToLine,
  Share2,
  Utensils,
  Ticket
} from 'lucide-react';
import gsap from 'gsap';

const Bill = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const urlPickupCode = searchParams.get('code');
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const billRef = useRef(null);

  useEffect(() => {
    api.get(`/orders/${orderId}/status`)
      .then(res => {
        setOrder(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch bill data", err);
        setLoading(false);
      });
  }, [orderId]);

  useEffect(() => {
    if (!loading && order) {
      gsap.fromTo(".receipt-reveal", 
        { y: 80, opacity: 0, scale: 0.95 }, 
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power4.out", stagger: 0.1 }
      );
    }
  }, [loading, order]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-10 h-10 border-3 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 font-fraunces text-xl text-customer-accent animate-pulse font-bold italic">Loading Invoice...</p>
    </div>
  );

  const subtotal = order?.items?.reduce((acc, item) => acc + (Number(item.unit_price || 0) * (item.quantity || 0)), 0) || 0;
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  const orderDate = order?.created_at ? new Date(order.created_at) : new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="theme-customer min-h-screen bg-[#FBF9F7] font-jakarta pb-12 selection:bg-customer-accent/10">
      
      {/* HEADER */}
      <header className="px-4 md:px-6 pt-6 md:pt-12 pb-4 md:pb-8 flex items-center justify-between sticky top-0 backdrop-blur-xl bg-white/60 z-50 print:hidden"
              style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-zinc-100 text-customer-text/60 active:scale-90 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-fraunces text-xl md:text-2xl font-black text-customer-text italic leading-none">Invoice</h1>
            <p className="text-[8px] font-black text-zinc-300 uppercase tracking-wider mt-1 flex items-center gap-1 leading-none">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Paid
            </p>
          </div>
        </div>
        
        <button onClick={handlePrint} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-zinc-100 text-customer-text shadow-sm active:scale-95 transition-all">
          <Printer size={16} />
        </button>
      </header>

      <main className="px-4 md:px-6 max-w-lg mx-auto">
        
        {/* SUCCESS BADGE */}
        <div className="flex flex-col items-center mb-8 receipt-reveal print:hidden text-center">
          <div className="w-14 h-14 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-3 shadow-lg shadow-emerald-500/5">
            <CheckCircle2 size={28} />
          </div>
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest italic">Payment Successful</p>
             
          {/* Pickup Code Display */}
          {(urlPickupCode || order?.pickup_code) && (
            <div className="mt-6 p-6 md:p-8 bg-customer-accent text-white rounded-2xl shadow-xl shadow-customer-accent/20 relative overflow-hidden group w-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="relative z-10 text-center">
                <span className="text-[8px] font-black uppercase tracking-widest block mb-2 text-white/60 leading-none">Your Pickup Code</span>
                <span className="font-fraunces text-4xl md:text-6xl font-black italic tracking-tighter leading-none block">{urlPickupCode || order.pickup_code}</span>
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <Ticket size={10} className="text-white/40" />
                  <p className="text-[7px] font-bold uppercase tracking-widest text-white/60">Collect at the counter</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RECEIPT BOX */}
        <div 
          ref={billRef}
          className="receipt-reveal relative bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-zinc-100/50 print:shadow-none print:border-none print:rounded-none"
        >
          <div className="p-6 md:p-10 pt-8 md:pt-14">
            {/* Branding */}
            <div className="text-center mb-8 md:mb-14">
              <h2 className="font-fraunces text-3xl md:text-4xl font-black text-customer-text italic tracking-tighter leading-none mb-3">Vinnod.</h2>
              <div className="flex items-center justify-center gap-1.5 text-[7px] md:text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                <Utensils size={8} strokeWidth={3} /> Fine Dining
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-y-6 md:gap-y-10 mb-8 md:mb-12 border-y border-zinc-100/50 py-6 md:py-10">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest block">Restaurant</span>
                <span className="font-bold text-xs text-customer-text">Vinod Dining Hall</span>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest block">Reference</span>
                <span className="font-bold text-xs text-customer-accent uppercase italic">Table {order.table_number}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest block">Date</span>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-customer-text">{orderDate.toLocaleDateString('en-GB')}</span>
                  <span className="text-[8px] font-bold text-zinc-400 font-mono mt-0.5">{orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest block">Order ID</span>
                <span className="font-bold text-xs text-customer-text uppercase font-mono">#{order.order_id.slice(-8).toUpperCase()}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-5 md:space-y-8 mb-8 md:mb-12">
              <div className="flex text-[8px] font-black text-zinc-300 uppercase tracking-widest pb-3 border-b border-zinc-100/50">
                <div className="flex-1">Items</div>
                <div className="w-10 text-center">Qty</div>
                <div className="w-16 md:w-24 text-right">Amount</div>
              </div>
              
              {order.items.map((item, i) => (
                <div key={i} className="flex items-start text-xs md:text-sm" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-customer-text leading-tight mb-0.5 capitalize italic tracking-tight truncate">{item.name}</h4>
                    <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-wider leading-none">@ ₹{item.unit_price}</span>
                  </div>
                  <div className="w-10 text-center font-fraunces italic font-bold text-zinc-400 leading-none pt-1">
                    x{item.quantity}
                  </div>
                  <div className="w-16 md:w-24 text-right font-fraunces font-black italic text-customer-text leading-none pt-1 text-sm md:text-base">
                    ₹{(item.unit_price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Section */}
            <div className="space-y-3 pt-6 md:pt-10 border-t-2 border-dashed border-zinc-100">
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                <span>Subtotal</span>
                <span className="text-customer-text">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                <span>GST (5%)</span>
                <span className="text-customer-text">₹{gst.toFixed(2)}</span>
              </div>
              
              <div className="pt-4 mt-3 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-customer-accent uppercase tracking-widest italic leading-none mb-1">Total</span>
                  <span className="text-[7px] font-bold text-zinc-300 uppercase tracking-wider leading-none">Paid</span>
                </div>
                <span className="font-fraunces text-3xl md:text-4xl font-black italic text-customer-text tracking-tighter leading-none">
                  ₹{total.toFixed(0)}
                </span>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="mt-10 md:mt-16 pt-6 md:pt-10 border-t border-zinc-100 flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mb-4 opacity-30 grayscale print:hidden">
                <Smartphone size={28} strokeWidth={1} />
              </div>
              <p className="text-[7px] font-black text-zinc-200 uppercase tracking-widest text-center leading-relaxed">
                Digital Receipt<br />
                Vinod Dining Hall<br />
                Thank You
              </p>
            </div>
          </div>

          {/* Bottom Pattern */}
          <div className="h-4 bg-[radial-gradient(circle,transparent_4px,#F5F5F5_4px)] bg-[length:12px_12px] bg-repeat-x opacity-20"></div>
        </div>

        {/* ACTIONS */}
        <div className="mt-8 space-y-3 receipt-reveal print:hidden">
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/menu')}
              className="flex-1 h-12 md:h-14 bg-customer-text text-white rounded-xl font-black text-[9px] uppercase tracking-wider italic flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
            >
              Return to Menu <ArrowLeft size={12} />
            </button>
            <button className="w-12 h-12 md:w-14 md:h-14 bg-white border border-zinc-100 rounded-xl flex items-center justify-center text-customer-text active:scale-95 transition-all shadow-sm">
              <Share2 size={16} />
            </button>
          </div>
          
          <button className="w-full py-3 text-[8px] font-black text-zinc-300 uppercase tracking-widest hover:text-customer-accent transition-colors">
            Receipt Saved
          </button>
        </div>

      </main>

      {/* Style for print */}
      <style>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .theme-customer {
             background: white !important;
             padding-bottom: 0 !important;
          }
        }
      `}</style>

    </div>
  );
};

export default Bill;
