import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store';
import api from '../../api/axios';
import { ArrowLeft, Plus, Minus, Info, ShoppingBag, CreditCard, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

const Cart = () => {
  const navigate = useNavigate();
  const { items, restaurantId, tableNumber, updateQuantity, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setError('');

    try {
      const isWindow = String(tableNumber).toLowerCase() === 'window' || parseInt(tableNumber, 10) === 0 || !tableNumber;

      const payload = {
        restaurant_id: restaurantId,
        table_number: isWindow ? 0 : parseInt(tableNumber, 10),
        total: totalAmount,
        items: items.map(i => ({ menu_item_id: i.id, quantity: i.quantity, price: i.price }))
      };

      const endpoint = isWindow ? '/window/order' : '/orders';
      const res = await api.post(endpoint, payload);
      
      if (isWindow && res.data.pickup_code) {
        alert(res.data.message); // Show code immediately after ordering
      }

      clearCart();
      // Show progress first as requested
      navigate(`/order-status/${res.data.order_id}`);
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="theme-customer min-h-screen p-8 bg-white flex flex-col items-center justify-center animate-in fade-in duration-700">
        <div className="w-32 h-32 bg-zinc-50 rounded-[3rem] border border-zinc-100 flex items-center justify-center mb-8 relative">
          <ShoppingBag size={48} className="text-zinc-200" />
          <div className="absolute inset-0 border-2 border-dashed border-zinc-100 rounded-[3rem] animate-[spin_20s_linear_infinite]"></div>
        </div>
        <h2 className="font-fraunces text-4xl font-bold mb-3 text-customer-text tracking-tight italic">Cart is empty</h2>
        <p className="text-zinc-400 mb-10 text-center font-bold max-w-xs leading-relaxed uppercase text-[10px] tracking-widest italic">
          Your cart is empty. Browse the menu to add items.
        </p>
        <button 
          onClick={() => navigate('/menu?restaurant=spice-lounge&table=1')}
          className="group flex items-center gap-3 px-10 py-5 bg-customer-text text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
        >
          Explore Menu <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="theme-customer min-h-screen pb-48 font-jakarta bg-white selection:bg-customer-accent/10">
      {/* Mobile-First Sticky Header */}
      <header className="px-5 pt-10 pb-4 flex items-center justify-between sticky top-0 backdrop-blur-xl bg-white/90 z-50 border-b border-zinc-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-customer-text/40 active:scale-90 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-fraunces text-2xl font-black text-customer-text leading-none italic">Cart</h1>
            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
            </p>
          </div>
        </div>
        
        <button 
          onClick={clearCart}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <div className="px-6 mt-8 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-red-100 italic">
            <Info size={14} /> {error}
          </div>
        )}

        {/* Item List - Modern Cards */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] ml-1 mb-6 italic">Your Items</h3>
          
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="relative flex items-center gap-3 p-3 rounded-2xl bg-zinc-50/50 border border-zinc-100 shadow-sm transition-all active:scale-[0.99]">
                <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-white overflow-hidden relative shadow-inner border border-zinc-100">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-200 font-black text-xs">
                      {item.is_veg ? 'V' : 'M'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <h4 className="font-bold text-sm text-customer-text truncate uppercase tracking-tight">{item.name}</h4>
                  </div>
                  <div className="font-fraunces italic font-bold text-lg text-customer-accent leading-none">₹{item.price}</div>
                </div>

                {/* Counter Integration */}
                <div className="flex items-center bg-white border border-zinc-100 rounded-xl p-1 gap-3">
                  <button 
                    onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 active:text-customer-accent transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-4 text-center font-black text-[10px] text-customer-text">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 active:text-customer-accent transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Context */}
        <div className="bg-zinc-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-customer-accent/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-center opacity-40">
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Subtotal</span>
              <span className="font-bold text-sm">₹{totalAmount.toFixed(0)}</span>
            </div>
            
            <div className="flex justify-between items-start pb-6 border-b border-white/5 opacity-40">
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Service Charge</span>
              <span className="text-[9px] font-bold italic tracking-widest">Calculated at checkout</span>
            </div>

            <div className="flex justify-between items-end pt-2">
              <div className="flex flex-col">
                <span className="text-xs font-fraunces font-bold italic text-customer-accent">Total</span>
                <span className="text-[8px] font-black opacity-20 uppercase tracking-[0.2em]">Estimated</span>
              </div>
              <span className="font-fraunces text-4xl font-black italic">₹{totalAmount.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 text-center px-10 opacity-30">
          <div className="flex items-center gap-2">
            <CreditCard size={12} />
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">SECURE CHECKOUT</span>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY ACTION */}
      <div className="fixed bottom-24 left-0 right-0 px-6 z-[90] animate-in slide-in-from-bottom-10 duration-700">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="group relative w-full h-16 bg-customer-text text-white rounded-2xl shadow-2xl flex items-center justify-between px-2 overflow-hidden transition-all active:scale-[0.98] active:shadow-none disabled:opacity-50"
          >
            <div className="h-12 bg-white/10 rounded-xl px-6 flex items-center gap-3">
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShoppingBag size={18} />
              )}
              <span className="text-xs font-black uppercase tracking-[0.2em]">{isSubmitting ? 'Placing Order...' : 'Review & Pay'}</span>
            </div>

            <div className="flex items-center gap-2 font-fraunces italic text-lg pr-4 transition-all group-hover:translate-x-1">
              PROCEED <ArrowRight size={20} className="text-customer-accent" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
