import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { socket } from '../../api/socket';
import { CheckCircle2, Clock, ChefHat, CheckSquare, CreditCard, ChevronRight } from 'lucide-react';

const STATUS_STEPS = [
  { id: 'pending', label: 'Placed', icon: Clock },
  { id: 'accepted', label: 'Accepted', icon: CheckSquare },
  { id: 'cooking', label: 'Cooking', icon: ChefHat },
  { id: 'ready', label: 'Ready', icon: CheckCircle2 },
  { id: 'served', label: 'Served', icon: CheckCircle2 },
  { id: 'paid', label: 'Paid', icon: CreditCard },
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

    // Fallback polling every 10 seconds if sockets drop
    const interval = setInterval(fetchStatus, 10000);

    return () => {
      clearInterval(interval);
      socket.off('order:status_update');
      socket.disconnect();
    };
  }, [orderId]);

  if (loading || !order) return <div className="p-8 theme-customer min-h-screen">Loading status...</div>;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  
  return (
    <div className="theme-customer min-h-screen font-jakarta flex flex-col pt-12 pb-24 px-6">
      <div className="text-center mb-10">
        <div className="inline-block px-4 py-1.5 bg-customer-surface/50 rounded-full font-mono text-sm mb-4 border border-customer-surface">
          Order #{order.order_id.substring(0,8).toUpperCase()}
        </div>
        <h1 className="font-fraunces text-3xl font-semibold mb-2">Track Order</h1>
        <p className="text-customer-text/70">Table {order.table_number}</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-customer-surface/30 relative mb-8">
        <div className="absolute left-10 top-10 bottom-10 w-[2px] bg-customer-surface/50 -z-0"></div>
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = currentStepIndex >= index;
          const isActive = currentStepIndex === index;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex gap-6 relative z-10 mb-8 last:mb-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-500
                ${isCompleted ? 'bg-customer-accent text-white shadow-md shadow-customer-accent/20' : 'bg-customer-bg text-customer-text/30 border-2 border-customer-surface/50'}
              `}>
                <Icon size={16} className={isCompleted ? '' : 'opacity-50'} />
              </div>
              <div className={`flex flex-col justify-center ${isActive ? 'scale-105 origin-left transition-transform' : ''}`}>
                <span className={`font-semibold ${isCompleted ? 'text-customer-text' : 'text-customer-text/40'}`}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-xs text-customer-accent font-medium mt-0.5 animate-pulse">
                    Currently actively tracking...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {order.status === 'served' && (
        <button 
          onClick={() => navigate(`/payment/${orderId}`)}
          className="w-full bg-customer-text text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-semibold mt-auto animate-[bounce_2s_infinite]"
        >
          <span>Pay Bill: ₹{order.total_price.toFixed(2)}</span>
          <ChevronRight />
        </button>
      )}

      {order.status === 'paid' && (
        <div className="mt-auto bg-green-50 text-green-800 p-4 rounded-2xl border border-green-200 text-center font-medium">
          Payment successful. Thank you for dining with us!
        </div>
      )}
    </div>
  );
};

export default OrderStatus;
