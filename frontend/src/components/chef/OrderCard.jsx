import { useEffect, useState } from 'react';
import { ChefHat } from 'lucide-react';

const KitchenTimer = ({ createdAt, status }) => {
  const [elapsed, setElapsed] = useState('');
  
  useEffect(() => {
    // Only tick if not served/cancelled
    if (status === 'served' || status === 'cancelled' || status === 'paid') {
      return; 
    }

    const start = new Date(createdAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = now - start;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      setElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  const isOverdue = parseInt(elapsed.split(':')[0]) > 15 && status !== 'ready';

  return (
    <div className={`flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded bg-black/20 ${isOverdue ? 'text-red-400 font-bold bg-red-900/30' : 'text-gray-400'}`}>
      <ChefHat size={12} />
      {status === 'ready' ? 'Ready' : elapsed || '00:00'}
    </div>
  );
};

const OrderCard = ({ order, onUpdateStatus }) => {
  const isCooking = order.status === 'cooking' || order.status === 'accepted';
  const isReady = order.status === 'ready';

  return (
    <div className={`bg-chef-surface border rounded-xl p-4 shadow-sm transition-all
      ${order.status === 'pending' ? 'border-dashed border-gray-600' : ''}
      ${isCooking ? 'border-chef-cooking shadow-[0_0_15px_rgba(245,158,11,0.1)]' : ''}
      ${isReady ? 'border-chef-ready shadow-[0_0_15px_rgba(59,130,246,0.1)]' : ''}
    `}>
      <div className="flex justify-between items-start border-b border-gray-800 pb-3 mb-3">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Table {order.table_number}</h3>
          <p className="text-xs text-gray-500 font-mono">#{order.order_id.substring(0,6).toUpperCase()}</p>
        </div>
        <KitchenTimer createdAt={order.created_at} status={order.status} />
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-gray-300">
              <span className="text-gray-500 mr-2">{item.quantity}x</span> 
              {item.name}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-auto">
        {order.status === 'pending' && (
          <button 
            onClick={() => onUpdateStatus(order.order_id, 'accepted')}
            className="flex-1 bg-chef-accepted text-black py-2 rounded-lg text-sm font-bold hover:bg-green-400 transition-colors"
          >
            ACCEPT
          </button>
        )}
        
        {(order.status === 'accepted' || order.status === 'cooking') && (
          <>
            {order.status === 'accepted' && (
              <button 
                onClick={() => onUpdateStatus(order.order_id, 'cooking')}
                className="flex-1 bg-chef-surface border border-chef-cooking text-chef-cooking py-2 rounded-lg text-sm font-bold hover:bg-chef-cooking hover:text-black transition-colors"
              >
                COOKING
              </button>
            )}
            <button 
              onClick={() => onUpdateStatus(order.order_id, 'ready')}
              className="flex-1 bg-chef-ready text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-400 hover:text-black transition-colors"
            >
              READY
            </button>
          </>
        )}

        {order.status === 'ready' && (
          <button 
            onClick={() => onUpdateStatus(order.order_id, 'served')}
            className="flex-1 bg-gray-700 text-white border border-gray-600 py-2 rounded-lg text-sm font-bold hover:bg-gray-600 transition-colors"
          >
            SERVE
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
