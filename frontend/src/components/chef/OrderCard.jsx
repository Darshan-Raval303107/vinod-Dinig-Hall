import { useEffect, useState } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, AlertCircle } from 'lucide-react';

const KitchenTimer = ({ createdAt, status }) => {
  const [elapsed, setElapsed] = useState('');
  
  useEffect(() => {
    if (status === 'served' || status === 'cancelled' || status === 'paid') return; 

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

  const minutesPassed = parseInt(elapsed.split(':')[0]) || 0;
  const isOverdue = minutesPassed >= 15 && status !== 'ready';
  const isCritical = minutesPassed >= 25 && status !== 'ready';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
      isCritical ? 'bg-red-500 text-white animate-pulse' : 
      isOverdue ? 'bg-orange-100 text-orange-600 border border-orange-200' : 
      'bg-zinc-100 text-zinc-500 border border-zinc-200'
    }`}>
      <Clock size={14} />
      {status === 'ready' ? 'READY' : elapsed || '00:00'}
    </div>
  );
};

const OrderCard = ({ order, onUpdateStatus }) => {
  const isPending = order.status === 'pending';
  const isCooking = order.status === 'cooking' || order.status === 'accepted';
  const isReady = order.status === 'ready';

  return (
    <div className={`group relative bg-white border overflow-hidden rounded-[2rem] transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ${
      isPending ? 'border-dashed border-zinc-200 bg-zinc-50/50' : 
      isCooking ? 'border-orange-500/20 shadow-lg shadow-orange-500/5' : 
      isReady ? 'border-blue-500/20 shadow-lg shadow-blue-500/5' : 
      'border-zinc-200'
    }`}>
      {/* Visual Indicator Line */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${
        isPending ? 'bg-zinc-300' : 
        isCooking ? 'bg-orange-500' : 
        isReady ? 'bg-blue-500' : 
        'bg-zinc-200'
      }`} />

      <div className="p-6">
        <header className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl font-black text-zinc-900 tracking-tighter">T{order.table_number}</span>
              {isPending && <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"></span>}
            </div>
            <p className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">Order #{order.order_id.substring(0,6)}</p>
          </div>
          <KitchenTimer createdAt={order.created_at} status={order.status} />
        </header>

        <div className="space-y-4 mb-8">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 group/item">
              <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xs font-black text-zinc-500 group-hover/item:bg-zinc-100 transition-colors">
                {item.quantity}
              </div>
              <div className="flex-1">
                <span className="text-md font-bold text-zinc-800 block leading-tight">{item.name}</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Standard Prep</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {isPending && (
            <button 
              onClick={() => onUpdateStatus(order.order_id, 'accepted')}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-black transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <ChefHat size={16} /> START ORDER
            </button>
          )}
          
          {isCooking && (
            <div className="flex gap-2">
              <button 
                onClick={() => onUpdateStatus(order.order_id, 'ready')}
                className="flex-[2] bg-orange-500 text-white py-4 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-orange-400 transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Flame size={16} /> MARK READY
              </button>
            </div>
          )}

          {isReady && (
            <button 
              onClick={() => onUpdateStatus(order.order_id, 'served')}
              className="w-full bg-zinc-100 text-zinc-600 border border-zinc-200 py-4 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> COMPLETE & SERVE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
