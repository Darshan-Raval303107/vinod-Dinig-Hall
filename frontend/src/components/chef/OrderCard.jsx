import { useEffect, useState } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, User } from 'lucide-react';

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
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${
      isCritical ? 'bg-red-500 text-white animate-pulse' : 
      isOverdue ? 'bg-orange-500 text-white' : 
      'bg-zinc-100 text-zinc-400'
    }`}>
      <Clock size={12} strokeWidth={3} />
      {status === 'ready' ? 'READY' : elapsed || '00:00'}
    </div>
  );
};

const OrderCard = ({ order, onUpdateStatus }) => {
  const isPending = order.status === 'pending';
  const isCooking = order.status === 'cooking' || order.status === 'accepted';
  const isReady = order.status === 'ready';

  return (
    <div className="group relative bg-white border border-zinc-100 overflow-hidden rounded-[2.5rem] transition-all duration-300 active:scale-[0.98] shadow-sm">
      {/* Status Bar */}
      <div className={`h-2 ${
        isPending ? 'bg-zinc-200' : 
        isCooking ? 'bg-emerald-500' : 
        isReady ? 'bg-sky-500' : 
        'bg-zinc-100'
      }`} />

      <div className="p-6">
        <header className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <span className="text-4xl font-black text-slate-900 tracking-tighter italic">T{order.table_number}</span>
            <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mt-1">REF: {order.order_id.substring(0,8).toUpperCase()}</span>
          </div>
          <KitchenTimer createdAt={order.created_at} status={order.status} />
        </header>

        {/* ITEMS LIST - High Density */}
        <div className="space-y-3 mb-8">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                {item.quantity}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-slate-900 truncate block">{item.name}</span>
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">KITCHEN PROTOCOL</span>
              </div>
            </div>
          ))}
        </div>

        {/* DYNAMIC ACTION BUTTONS */}
        <div className="grid grid-cols-1 gap-2">
          {isPending && (
            <button 
              onClick={() => onUpdateStatus(order.order_id, 'accepted')}
              className="w-full h-16 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
            >
              <ChefHat size={18} /> START PREP
            </button>
          )}
          
          {isCooking && (
            <button 
              onClick={() => onUpdateStatus(order.order_id, 'ready')}
              className="w-full h-16 bg-emerald-500 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
            >
              <Flame size={18} /> DISPATCH TO QUEUE
            </button>
          )}

          {isReady && (
            <button 
              onClick={() => onUpdateStatus(order.order_id, 'served')}
              className="w-full h-16 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <CheckCircle2 size={18} /> CONFIRM SERVICE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
