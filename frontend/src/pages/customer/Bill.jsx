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
        { y: 100, opacity: 0, scale: 0.95 }, 
        { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power4.out", stagger: 0.1 }
      );
    }
  }, [loading, order]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-vh-100 bg-white">
      <div className="w-12 h-12 border-4 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-8 font-fraunces text-2xl text-customer-accent animate-pulse font-bold italic">Loading Invoice...</p>
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
    <div className="theme-customer min-h-screen bg-[#FBF9F7] font-jakarta pb-20 selection:bg-customer-accent/10">
      
      {/* HEADER */}
      <header className="px-6 pt-12 pb-8 flex items-center justify-between sticky top-0 backdrop-blur-xl bg-white/60 z-50 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-100 text-customer-text/60 active:scale-90 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-fraunces text-2xl font-black text-customer-text italic leading-none">Invoice</h1>
            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5 leading-none">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Paid
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
            <button onClick={handlePrint} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-100 text-customer-text shadow-sm active:scale-95 transition-all">
                <Printer size={18} />
            </button>
        </div>
      </header>

      <main className="px-6 max-w-lg mx-auto">
        
        {/* SUCCESS BADGE */}
        <div className="flex flex-col items-center mb-10 receipt-reveal print:hidden text-center">
             <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-4 shadow-xl shadow-emerald-500/5">
                <CheckCircle2 size={32} />
             </div>
             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] italic">Payment Successful</p>
             
             {/* Pickup Code Display */}
             {(urlPickupCode || order?.pickup_code) && (
               <div className="mt-8 p-8 bg-customer-accent text-white rounded-[2.5rem] shadow-2xl shadow-customer-accent/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                  <div className="relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] block mb-3 text-white/60 leading-none">Your Pickup Code</span>
                    <span className="font-fraunces text-6xl font-black italic tracking-tighter leading-none block">{urlPickupCode || order.pickup_code}</span>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <Ticket size={12} className="text-white/40" />
                        <p className="text-[8px] font-bold uppercase tracking-widest text-white/60">Collect at the counter</p>
                    </div>
                  </div>
               </div>
             )}
        </div>

        {/* RECEIPT BOX */}
        <div 
            ref={billRef}
            className="receipt-reveal relative bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden border border-zinc-100/50 print:shadow-none print:border-none print:rounded-none"
        >
            {/* Top Zig-Zag or Pattern */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_4px,white_4px)] bg-[length:12px_8px] bg-repeat-x rotate-180 opacity-5"></div>
            
            <div className="p-10 pt-14">
                {/* Branding */}
                <div className="text-center mb-14">
                    <h2 className="font-fraunces text-4xl font-black text-customer-text italic tracking-tighter leading-none mb-4">Vinnod.</h2>
                    <div className="flex items-center justify-center gap-2 text-[8px] font-black text-zinc-300 uppercase tracking-[0.4em]">
                        <Utensils size={10} strokeWidth={3} /> Fine Dining Experience
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-y-10 mb-12 border-y border-zinc-100/50 py-10">
                    <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block">Restaurant</span>
                        <span className="font-bold text-xs text-customer-text">Vinod Dining Hall</span>
                    </div>
                    <div className="space-y-1.5 text-right">
                        <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block">Reference</span>
                        <span className="font-bold text-xs text-customer-accent uppercase italic">Table {order.table_number}</span>
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block">Date</span>
                        <div className="flex flex-col">
                            <span className="font-bold text-xs text-customer-text">{orderDate.toLocaleDateString('en-GB')}</span>
                            <span className="text-[9px] font-bold text-zinc-400 font-mono mt-1">{orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                    </div>
                    <div className="space-y-1.5 text-right">
                        <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block">Order ID</span>
                        <span className="font-bold text-xs text-customer-text uppercase font-mono">#{order.order_id.slice(-8).toUpperCase()}</span>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-8 mb-12">
                    <div className="flex text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] pb-4 border-b border-zinc-100/50">
                        <div className="flex-1">Items Ordered</div>
                        <div className="w-12 text-center">Qty</div>
                        <div className="w-24 text-right">Amount</div>
                    </div>
                    
                    {order.items.map((item, i) => (
                        <div key={i} className="flex items-start text-sm group animate-in slide-in-from-left-5 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex-1">
                                <h4 className="font-bold text-customer-text leading-tight mb-1 capitalize italic tracking-tight">{item.name}</h4>
                                <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest leading-none">@ ₹{item.unit_price} / unit</span>
                            </div>
                            <div className="w-12 text-center font-fraunces italic font-bold text-zinc-400 leading-none pt-2">
                                x{item.quantity}
                            </div>
                            <div className="w-24 text-right font-fraunces font-black italic text-customer-text leading-none pt-2 text-base">
                                ₹{(item.unit_price * item.quantity).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals Section */}
                <div className="space-y-4 pt-10 border-t-2 border-dashed border-zinc-100">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <span>Subtotal</span>
                        <span className="text-customer-text">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <span>Central Tax (GST 5%)</span>
                        <span className="text-customer-text">₹{gst.toFixed(2)}</span>
                    </div>
                    
                    <div className="pt-6 mt-4 flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-customer-accent uppercase tracking-[0.3em] italic leading-none mb-2">Total Payable</span>
                            <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest leading-none">Paid</span>
                        </div>
                        <span className="font-fraunces text-4xl font-black italic text-customer-text tracking-tighter leading-none">
                            ₹{total.toFixed(0)}
                        </span>
                    </div>
                </div>

                {/* QR Code / Security Placeholder */}
                <div className="mt-16 pt-10 border-t border-zinc-100 flex flex-col items-center">
                    <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center mb-6 opacity-30 grayscale print:hidden">
                        <Smartphone size={32} strokeWidth={1} />
                    </div>
                    <p className="text-[8px] font-black text-zinc-200 uppercase tracking-[0.5em] text-center leading-relaxed">
                        THIS IS A DIGITAL RECEIPT.<br />
                        VINOD DINING HALL<br />
                        THANK YOU FOR DINING WITH US
                    </p>
                </div>
            </div>

            {/* Bottom Zig-Zag */}
            <div className="h-6 bg-[radial-gradient(circle,transparent_4px,#F5F5F5_4px)] bg-[length:12px_12px] bg-repeat-x opacity-20"></div>
        </div>

        {/* ACTIONS */}
        <div className="mt-12 space-y-4 receipt-reveal print:hidden">
            <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/menu?restaurant=vinnod&table=1')}
                  className="flex-1 h-16 bg-customer-text text-white rounded-2xl font-black text-[10px] uppercase tracking-widest italic flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-customer-text/10"
                >
                   Return to Menu <ArrowLeft size={14} />
                </button>
                <button className="w-16 h-16 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-customer-text active:scale-95 transition-all shadow-sm">
                   <Share2 size={18} />
                </button>
            </div>
            
            <button className="w-full py-4 text-[9px] font-black text-zinc-300 uppercase tracking-[0.3em] hover:text-customer-accent transition-colors">
                Order Receipt Saved
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
