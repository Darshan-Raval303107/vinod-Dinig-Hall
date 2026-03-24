import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { socket } from '../../api/socket';
import { CheckCircle2, Clock, ChefHat, CheckSquare, CreditCard, ChevronRight, Activity, Bell, Info, ArrowLeft, Trash2, Ticket } from 'lucide-react';

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Received', icon: Clock, desc: 'Our kitchen has received your order' },
  { id: 'accepted', label: 'Chef Confirmed', icon: CheckSquare, desc: 'Your order has been confirmed' },
  { id: 'cooking', label: 'Being Prepared', icon: ChefHat, desc: 'Chef is preparing your meal' },
  { id: 'ready', label: 'Ready for Service', icon: Bell, desc: 'Your meal is ready!' },
  { id: 'served', label: 'Delivered', icon: CheckCircle2, desc: 'Enjoy your meal!' },
  { id: 'paid', label: 'Paid', icon: CreditCard, desc: 'Thank you for dining with us' },
];

const OrderStatus = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    api.get(`/orders/${orderId}/status`)
      .then(res => {
        setOrder(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();

    socket.connect();
    socket.emit('customer:join', { orderId });

    socket.on('order:status_update', (data) => {
      if (data.orderId === orderId) {
        setOrder(prev => ({ ...prev, status: data.status }));
      }
    });

    // Listen for payment success → refresh entire order to get pickup_code, paid status
    socket.on('payment:success', (data) => {
      if (data.order_id === orderId) {
        fetchStatus();
      }
    });

    const interval = setInterval(fetchStatus, 12000); // 12s fallback for high reliability

    return () => {
      clearInterval(interval);
      socket.off('order:status_update');
      socket.off('payment:success');
      socket.disconnect();
    };
  }, [orderId]);

  if (loading || !order) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-8 text-center">
      <div className="w-16 h-16 border-4 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black text-customer-accent uppercase tracking-widest animate-pulse">Loading your order...</p>
    </div>
  );

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);

  return (
    <div className="theme-customer min-h-screen font-jakarta bg-[#FBF7F0] flex flex-col pt-10 pb-36 px-5 animate-in fade-in duration-1000">
      {/* Top Header with Back Button */}
      <div className="flex items-center justify-between mb-8">
        {/* Dynamic Back Button - Hidden for unpaid window orders to enforce payment */}
        {!(order.order_type === 'window' && !order.pickup_code) ? (
          <button
            onClick={() => {
              const path = order.order_type === 'window' 
                ? '/menu?restaurant=spice-lounge' 
                : `/menu?restaurant=spice-lounge&table=${order.table_number}`;
              navigate(path);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-customer-surface/20 text-customer-text/60 shadow-sm active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div className="w-10 h-10" /> /* Spacer to maintain layout */
        )}
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-customer-text/20 uppercase tracking-[0.3em]">Order Tracking</span>
          <span className="text-[10px] font-bold text-customer-accent italic">Live Update</span>
        </div>
      </div>

      {/* Visual Activity Tracker */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="flex items-center gap-3 px-6 py-2.5 bg-white border border-customer-surface/30 rounded-full shadow-sm mb-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-customer-accent/5 to-transparent translate-x-[-150%] animate-[shine_3s_infinite]"></div>
          <Activity size={16} className="text-customer-accent animate-pulse" />
          <span className="text-[10px] font-black text-customer-text/40 uppercase tracking-[0.3em]">Chef is preparing your meal</span>
        </div>

        <h1 className="font-fraunces text-5xl font-black italic text-customer-text tracking-tighter leading-tight mb-2 uppercase">Your Order</h1>
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-black text-customer-text/30 uppercase tracking-[0.2em] italic underline underline-offset-4 decoration-customer-accent/20">Ref: #{order.order_id.substring(0, 8).toUpperCase()}</span>
          <div className="flex items-center gap-2">
            {order.table_number !== 0 && (
              <span className="text-xs font-bold text-customer-accent bg-customer-accent/5 px-3 py-1 rounded-lg uppercase tracking-widest leading-none">TABLE {order.table_number}</span>
            )}
            {order.pickup_code ? (
              <div className="flex flex-col items-center gap-1 scale-110">
                <span className="text-xs font-black text-white bg-customer-accent px-6 py-2 rounded-xl shadow-[0_15px_30px_rgba(200,92,26,0.3)] flex items-center gap-2">
                  <Ticket size={14} /> PICKUP CODE: {order.pickup_code}
                </span>
                {order.payment_status !== 'paid' && order.payment_status !== 'success' && (
                  <span className="text-[7px] font-black text-customer-accent uppercase tracking-widest animate-pulse">Verification Pending</span>
                )}
              </div>
            ) : (
              <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg border border-red-100 animate-pulse">GENERATING CODE...</span>
            )}
          </div>
        </div>
      </div>

      {/* Modern High-End Vertical Timeline */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.06)] border border-customer-surface/20 relative mb-8 flex flex-col gap-6 md:gap-10 overflow-hidden">
        {/* Glowing track line */}
        <div className="absolute left-12 md:left-14 top-14 bottom-14 w-0.5 bg-customer-surface/20 -z-0">
          <div className="absolute top-0 left-0 w-full bg-customer-accent transition-all duration-[2000ms] shadow-[0_0_15px_rgba(200,92,26,0.3)]" style={{ height: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}></div>
        </div>

        {STATUS_STEPS.map((step, index) => {
          const isCompleted = currentStepIndex >= index;
          const isActive = currentStepIndex === index;
          const isFuture = currentStepIndex < index;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex gap-6 md:gap-8 relative z-10 transition-all duration-700 items-center">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-1000 border
                ${isCompleted ? 'bg-customer-accent text-white shadow-xl shadow-customer-accent/30 border-customer-accent' :
                  isActive ? 'bg-white text-customer-accent border-customer-accent animate-[pulse_2s_infinite] shadow-lg' :
                    'bg-[#FBF7F0] text-customer-text/20 border-customer-surface/30'}
              `}>
                <Icon size={16} className={`${isCompleted ? 'animate-[bounce_1s_ease-out]' : ''}`} />
              </div>

              <div className={`flex flex-col gap-0.5 flex-1 transition-opacity duration-700 ${isFuture ? 'opacity-30' : 'opacity-100'}`}>
                <div className="flex items-baseline justify-between overflow-hidden">
                  <span className={`font-fraunces italic text-lg md:text-xl font-bold tracking-tight text-customer-text transition-colors ${isActive ? 'text-customer-accent' : ''}`}>
                    {step.label}
                  </span>
                  {isActive && <div className="h-1 flex-1 bg-customer-accent/10 mx-4 border-b border-dashed border-customer-accent/30 hidden sm:block"></div>}
                  {isCompleted && !isActive && <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white scale-75 animate-in zoom-in-50"><CheckCircle2 size={12} /></div>}
                </div>
                <p className="text-[9px] md:text-[10px] font-bold text-customer-text/30 uppercase tracking-widest">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Summary Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-[1.5px] bg-customer-accent/30"></div>
          <h3 className="text-[10px] font-black text-customer-text/30 uppercase tracking-[0.3em] font-syne">Your Order Items</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-white/60 border border-white rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className="text-xs font-bold text-customer-text uppercase tracking-tight">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-customer-text/20 uppercase tracking-widest leading-none">Qty.</span>
                  <span className="font-fraunces italic font-bold text-customer-accent">{item.quantity}</span>
                </div>
                
                {order.status === 'pending' && order.order_type === 'table' && (
                  <button 
                    onClick={() => {
                      if(confirm(`Remove ${item.name}?`)) {
                        api.delete(`/orders/${orderId}/items/${item.menu_item_id}`)
                          .then(() => fetchStatus())
                          .catch(err => alert(err.response?.data?.msg || "Failed to remove item"));
                      }
                    }}
                    className="p-2 text-red-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Card Overlay */}
      <div className="p-6 md:p-8 bg-white border border-customer-surface/40 rounded-[2.5rem] shadow-sm flex items-start gap-4 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-customer-accent/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="w-10 h-10 md:w-12 md:h-12 bg-customer-accent/5 rounded-2xl flex items-center justify-center flex-shrink-0 text-customer-accent relative z-10">
          <Info size={20} />
        </div>
        <div className="flex-1 relative z-10">
          <h4 className="text-sm font-bold text-customer-text italic font-fraunces mb-1">Good to Know</h4>
          <p className="text-[9px] md:text-[10px] text-customer-text/40 font-medium uppercase tracking-widest leading-relaxed">
            Quality takes time. Your meal is being freshly prepared by our kitchen team.
          </p>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="bg-white/40 border border-white p-6 rounded-[2.5rem] flex items-center justify-between mb-20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-customer-text rounded-2xl flex items-center justify-center text-white">
                <Bell size={18} />
            </div>
            <div>
                <h4 className="text-[10px] font-black text-customer-text uppercase tracking-widest">Need Help?</h4>
                <p className="text-[9px] font-bold text-customer-text/40 uppercase tracking-widest">Call Restaurant</p>
            </div>
        </div>
        <a href="tel:+919999999999" className="h-10 px-6 bg-white border border-customer-surface/30 rounded-full flex items-center justify-center text-[9px] font-black text-customer-accent uppercase tracking-widest shadow-sm active:scale-95 transition-all">
            Contact
        </a>
      </div>

      {/* Floating Dynamic Bottom Action Bar */}
      <div className="fixed bottom-24 left-0 right-0 px-6 z-[90] animate-in slide-in-from-bottom-10 duration-1000 delay-500">
        <div className="max-w-md mx-auto">
          {order.status === 'paid' ? (
            <button
              onClick={() => navigate(`/bill/${orderId}`)}
              className="w-full h-16 bg-emerald-600/10 border-2 border-emerald-500/20 text-emerald-600 rounded-2xl flex items-center justify-between gap-3 px-6 shadow-2xl backdrop-blur-md active:scale-95 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Payment Complete</span>
                  <span className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest mt-1">Thank you!</span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-fraunces italic text-[15px] pr-1 group-hover:translate-x-1 transition-transform">
                VIEW INVOICE <ChevronRight size={18} />
              </div>
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Optional: Add "Pay Early" message if status is not served */}
              {order.status !== 'served' && (
                <div className="flex justify-center">
                  <button
                    onClick={() => navigate(`/payment/${orderId}`)}
                    className="text-[9px] font-black text-customer-accent uppercase tracking-[0.2em] italic hover:underline underline-offset-4 opacity-60 hover:opacity-100 transition-all mb-1"
                  >
                    Want to pay now?
                  </button>
                </div>
              )}

              <button
                onClick={() => navigate(`/payment/${orderId}`)}
                className={`group relative w-full h-20 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(31,31,31,0.2)] flex items-center justify-between px-3 overflow-hidden transition-all active:scale-[0.98] border border-white/5 
                  ${order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'bg-customer-text text-white' : 'bg-white border-customer-surface/30'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                <div className={`h-14 rounded-[2rem] px-8 flex items-center gap-3 transition-all ${order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'bg-customer-accent shadow-[0_8px_25px_rgba(200,92,26,0.3)]' : 'bg-[#FBF7F0] border border-customer-surface/10'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'bg-white/20 animate-bounce text-white' : 'bg-customer-accent/10 text-customer-accent'}`}>
                    <CreditCard size={14} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'text-white' : 'text-customer-text/40'}`}>
                    {order.status === 'served' ? 'Final Settlement' : (order.table_number === 0 && !order.pickup_code) ? 'Pay to Start Order' : 'Pay Advance'}
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${order.status === 'served' ? 'text-white' : 'text-customer-text/40'}`}>
                      {order.status === 'served' ? 'Pay Now' : 'Pay Early'}
                    </span>
                  </span>

                </div>

                <div className={`flex items-center gap-2 font-fraunces italic text-xl pr-6 transition-all group-hover:translate-x-1 ${order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'text-white' : 'text-customer-text'}`}>
                  ₹{order.total_price.toFixed(0)} <ChevronRight size={22} className={order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'text-white' : 'text-customer-accent'} />
                </div>
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default OrderStatus;
