import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { socket } from '../../api/socket';
import { CheckCircle2, Clock, ChefHat, CheckSquare, CreditCard, ChevronRight, Activity, Bell, Info, ArrowLeft, Trash2, Ticket } from 'lucide-react';

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Received', icon: Clock, desc: 'Kitchen has received your order' },
  { id: 'accepted', label: 'Chef Confirmed', icon: CheckSquare, desc: 'Your order is confirmed' },
  { id: 'cooking', label: 'Being Prepared', icon: ChefHat, desc: 'Chef is preparing your meal' },
  { id: 'ready', label: 'Ready', icon: Bell, desc: 'Your meal is ready!' },
  { id: 'served', label: 'Delivered', icon: CheckCircle2, desc: 'Enjoy your meal!' },
  { id: 'paid', label: 'Paid', icon: CreditCard, desc: 'Thank you for dining!' },
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

    socket.on('payment:success', (data) => {
      if (data.order_id === orderId) {
        fetchStatus();
      }
    });

    const interval = setInterval(fetchStatus, 12000);

    return () => {
      clearInterval(interval);
      socket.off('order:status_update');
      socket.off('payment:success');
      socket.disconnect();
    };
  }, [orderId]);

  if (loading || !order) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBF7F0] p-6 text-center">
      <div className="w-12 h-12 border-3 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[9px] font-black text-customer-accent uppercase tracking-widest animate-pulse">Loading order...</p>
    </div>
  );

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  const isPaid = order.payment_status === 'success' || order.status === 'paid';

  return (
    <div className="theme-customer min-h-screen font-jakarta bg-[#FBF7F0] flex flex-col pb-36 px-4 md:px-6 animate-in fade-in duration-1000"
         style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pt-2">
        {!(order.order_type === 'window' && !order.pickup_code) ? (
          <button
            onClick={() => navigate('/menu')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-customer-surface/20 text-customer-text/60 shadow-sm active:scale-95 transition-all"
          >
            <ArrowLeft size={16} />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
        <div className="flex flex-col items-end">
          <span className="text-[7px] md:text-[8px] font-black text-customer-text/20 uppercase tracking-widest">Order Tracking</span>
          <span className="text-[9px] font-bold text-customer-accent italic">Live Update</span>
        </div>
      </div>

      {/* Title Section */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-customer-surface/30 rounded-full shadow-sm mb-4 relative overflow-hidden">
          <Activity size={12} className="text-customer-accent animate-pulse" />
          <span className="text-[8px] md:text-[9px] font-black text-customer-text/40 uppercase tracking-wider">Preparing your meal</span>
        </div>

        <h1 className="font-fraunces text-3xl md:text-5xl font-black italic text-customer-text tracking-tighter leading-tight mb-1.5 uppercase">Your Order</h1>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[9px] md:text-[10px] font-black text-customer-text/30 uppercase tracking-wider italic">Ref: #{order.order_id.substring(0, 8).toUpperCase()}</span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {order.table_number !== 0 && (
              <span className="text-[9px] font-bold text-customer-accent bg-customer-accent/5 px-2.5 py-0.5 rounded-lg uppercase tracking-widest leading-none">TABLE {order.table_number}</span>
            )}
            {order.pickup_code ? (
              <span className="text-[10px] font-black text-white bg-customer-accent px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                <Ticket size={12} /> CODE: {order.pickup_code}
              </span>
            ) : (
              <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-100 animate-pulse">GENERATING...</span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.06)] border border-customer-surface/20 relative mb-6 flex flex-col gap-4 md:gap-6 overflow-hidden">
        {/* Track line */}
        <div className="absolute left-9 md:left-12 top-10 bottom-10 w-0.5 bg-customer-surface/20 -z-0">
          <div className="absolute top-0 left-0 w-full bg-customer-accent transition-all duration-[2000ms] shadow-[0_0_12px_rgba(200,92,26,0.3)]" style={{ height: `${((isPaid && currentStepIndex === 4 ? 5 : currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}%` }}></div>
        </div>

        {STATUS_STEPS.map((step, index) => {
          let isCompleted = currentStepIndex >= index;
          let isActive = currentStepIndex === index;
          let isFuture = currentStepIndex < index;

          if (step.id === 'paid' && isPaid) {
            isCompleted = true;
            isActive = false;
            isFuture = false;
          }
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex gap-4 md:gap-6 relative z-10 transition-all duration-700 items-center">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-1000 border
                ${isCompleted ? 'bg-customer-accent text-white shadow-lg shadow-customer-accent/30 border-customer-accent' :
                  isActive ? 'bg-white text-customer-accent border-customer-accent animate-[pulse_2s_infinite] shadow-md' :
                    'bg-[#FBF7F0] text-customer-text/20 border-customer-surface/30'}
              `}>
                <Icon size={14} className={`${isCompleted ? 'animate-[bounce_1s_ease-out]' : ''}`} />
              </div>

              <div className={`flex flex-col gap-0 flex-1 transition-opacity duration-700 ${isFuture ? 'opacity-30' : 'opacity-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-fraunces italic text-sm md:text-lg font-bold tracking-tight text-customer-text transition-colors ${isActive ? 'text-customer-accent' : ''}`}>
                    {step.label}
                  </span>
                  {isCompleted && !isActive && <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={10} /></div>}
                </div>
                <p className="text-[8px] md:text-[9px] font-bold text-customer-text/30 uppercase tracking-wider">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Items */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-customer-accent/30"></div>
          <h3 className="text-[9px] font-black text-customer-text/30 uppercase tracking-widest">Your Items</h3>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white/60 border border-white rounded-xl shadow-sm">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className="text-xs font-bold text-customer-text uppercase tracking-tight truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-black text-customer-text/20 uppercase tracking-wider">Qty.</span>
                  <span className="font-fraunces italic font-bold text-customer-accent">{item.quantity}</span>
                </div>
                
                {order.status === 'pending' && (
                  <button 
                    onClick={() => {
                      if(confirm(`Remove ${item.name}?`)) {
                        api.delete(`/orders/${orderId}/items/${item.menu_item_id}`)
                          .then(() => fetchStatus())
                          .catch(err => alert(err.response?.data?.msg || "Failed to remove item"));
                      }
                    }}
                    className="p-1.5 text-red-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 md:p-6 bg-white border border-customer-surface/40 rounded-2xl shadow-sm flex items-start gap-3 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-customer-accent/5 rounded-full blur-3xl -mr-8 -mt-8"></div>
        <div className="w-9 h-9 md:w-10 md:h-10 bg-customer-accent/5 rounded-xl flex items-center justify-center flex-shrink-0 text-customer-accent relative z-10">
          <Info size={16} />
        </div>
        <div className="flex-1 relative z-10">
          <h4 className="text-xs font-bold text-customer-text italic font-fraunces mb-0.5">Good to Know</h4>
          <p className="text-[8px] md:text-[9px] text-customer-text/40 font-medium uppercase tracking-wider leading-relaxed">
            Quality takes time. Your meal is freshly prepared by our team.
          </p>
        </div>
      </div>

      {/* Need Help */}
      <div className="bg-white/40 border border-white p-4 md:p-5 rounded-2xl flex items-center justify-between mb-16 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-customer-text rounded-xl flex items-center justify-center text-white">
            <Bell size={16} />
          </div>
          <div>
            <h4 className="text-[9px] font-black text-customer-text uppercase tracking-widest">Need Help?</h4>
            <p className="text-[8px] font-bold text-customer-text/40 uppercase tracking-wider">Call Restaurant</p>
          </div>
        </div>
        <a href="tel:+919999999999" className="h-8 px-4 bg-white border border-customer-surface/30 rounded-full flex items-center justify-center text-[8px] font-black text-customer-accent uppercase tracking-wider shadow-sm active:scale-95 transition-all">
          Contact
        </a>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-[90] animate-in slide-in-from-bottom-10 duration-1000 delay-500">
        <div className="max-w-md mx-auto">
          {isPaid ? (
            <button
              onClick={() => navigate(`/bill/${orderId}`)}
              className="w-full h-14 bg-emerald-600/10 border-2 border-emerald-500/20 text-emerald-600 rounded-2xl flex items-center justify-between gap-2 px-4 shadow-xl backdrop-blur-md active:scale-95 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 size={16} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">Payment Complete</span>
                  <span className="text-[7px] font-bold text-emerald-600/60 uppercase tracking-wider mt-0.5">Thank you!</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-fraunces italic text-xs md:text-sm pr-1 group-hover:translate-x-1 transition-transform">
                INVOICE <ChevronRight size={16} />
              </div>
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              {order.status !== 'served' && (
                <div className="flex justify-center">
                  <button
                    onClick={() => navigate(`/payment/${orderId}`)}
                    className="text-[8px] font-black text-customer-accent uppercase tracking-wider italic hover:underline underline-offset-4 opacity-60 hover:opacity-100 transition-all"
                  >
                    Want to pay now?
                  </button>
                </div>
              )}

              <button
                onClick={() => navigate(`/payment/${orderId}`)}
                className={`group relative w-full h-14 md:h-16 rounded-2xl shadow-[0_20px_50px_-15px_rgba(31,31,31,0.2)] flex items-center justify-between px-2 overflow-hidden transition-all active:scale-[0.98] border border-white/5 
                  ${order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'bg-customer-text text-white' : 'bg-white border-customer-surface/30'}`}
              >
                <div className={`h-10 md:h-12 rounded-xl md:rounded-2xl px-4 md:px-6 flex items-center gap-2 transition-all ${order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'bg-customer-accent shadow-lg' : 'bg-[#FBF7F0] border border-customer-surface/10'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'bg-white/20 animate-bounce text-white' : 'bg-customer-accent/10 text-customer-accent'}`}>
                    <CreditCard size={12} />
                  </div>
                  <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-wider italic ${order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'text-white' : 'text-customer-text/40'}`}>
                    {order.status === 'served' ? 'Pay Now' : (order.table_number === 0 && !order.pickup_code) ? 'Pay to Start' : 'Pay Early'}
                  </span>
                </div>

                <div className={`flex items-center gap-1.5 font-fraunces italic text-base md:text-xl pr-3 md:pr-6 transition-all group-hover:translate-x-1 ${order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'text-white' : 'text-customer-text'}`}>
                  ₹{order.total_price.toFixed(0)} <ChevronRight size={18} className={order.status === 'served' || (order.order_type === 'window' && !order.pickup_code) ? 'text-white' : 'text-customer-accent'} />
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
