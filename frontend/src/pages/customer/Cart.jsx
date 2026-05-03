import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store';
import api from '../../api/axios';
import { ArrowLeft, Plus, Minus, Info, ShoppingBag, CreditCard, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

const Cart = () => {
  const navigate = useNavigate();
  const { items, restaurantId, restaurantSlug, tableNumber, updateQuantity, clearCart, addActiveOrder } = useCartStore();
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
        alert(res.data.message);
      }

      addActiveOrder(res.data.order_id);
      clearCart();
      navigate(`/order-status/${res.data.order_id}`);
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="theme-customer min-h-screen p-6 bg-white flex flex-col items-center justify-center animate-in fade-in duration-700">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-center mb-6 relative">
          <ShoppingBag size={40} className="text-zinc-200" />
          <div className="absolute inset-0 border-2 border-dashed border-zinc-100 rounded-3xl animate-[spin_20s_linear_infinite]"></div>
        </div>
        <h2 className="font-fraunces text-2xl md:text-4xl font-bold mb-2 text-customer-text tracking-tight italic">Cart is empty</h2>
        
        {useCartStore.getState().isSessionValid() && useCartStore.getState().activeOrders?.length > 0 ? (
          <div className="flex flex-col items-center">
            <p className="text-zinc-400 mb-6 text-center font-bold max-w-xs leading-relaxed uppercase text-[9px] tracking-widest italic">
              You have {useCartStore.getState().activeOrders.length} active order(s) in progress.
            </p>
            <button 
              onClick={() => navigate(`/order-status/${useCartStore.getState().activeOrders[0]}`)}
              className="group flex items-center gap-2 px-8 py-4 bg-customer-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-wider shadow-xl active:scale-95 transition-all mb-3"
            >
              View Active Order <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/menu')}
              className="text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:text-customer-text transition-colors"
            >
              Back to Menu
            </button>
          </div>
        ) : (
          <>
            <p className="text-zinc-400 mb-8 text-center font-bold max-w-xs leading-relaxed uppercase text-[9px] tracking-widest italic">
              Your cart is empty. Browse the menu to add items.
            </p>
            <button 
              onClick={() => navigate('/menu')}
              className="group flex items-center gap-2 px-8 py-4 bg-customer-text text-white rounded-2xl font-black text-[10px] uppercase tracking-wider shadow-xl active:scale-95 transition-all"
            >
              Explore Menu <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="theme-customer min-h-screen pb-40 font-jakarta bg-white selection:bg-customer-accent/10">
      {/* Header */}
      <header className="px-4 md:px-6 pt-6 md:pt-10 pb-3 flex items-center justify-between sticky top-0 backdrop-blur-xl bg-white/90 z-50 border-b border-zinc-50"
              style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-customer-text/40 active:scale-90 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-fraunces text-xl md:text-2xl font-black text-customer-text leading-none italic">Cart</h1>
          </div>
        </div>
        
        <button 
          onClick={clearCart}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
        >
          <Trash2 size={16} />
        </button>
      </header>

      <div className="px-4 md:px-6 mt-4 md:mt-8 space-y-6 md:space-y-10 max-w-lg mx-auto animate-in slide-in-from-bottom-4 duration-500">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-red-100 italic">
            <Info size={12} /> {error}
          </div>
        )}

        {/* Item List */}
        <div className="space-y-3">
          <h3 className="text-[9px] font-black text-zinc-300 uppercase tracking-widest ml-1 mb-3 italic">Your Items</h3>
          
          <div className="space-y-2.5">
            {items.map(item => (
              <div key={item.id} className="relative flex items-center gap-3 p-2.5 md:p-3 rounded-xl bg-zinc-50/50 border border-zinc-100 transition-all active:scale-[0.99]">
                <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-lg bg-white overflow-hidden relative border border-zinc-100">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-200 font-black text-xs">
                      {item.is_veg ? 'V' : 'M'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <h4 className="font-bold text-xs md:text-sm text-customer-text truncate uppercase tracking-tight">{item.name}</h4>
                  </div>
                  <div className="font-fraunces italic font-bold text-base md:text-lg text-customer-accent leading-none">₹{item.price}</div>
                </div>

                {/* Counter */}
                <div className="flex items-center bg-white border border-zinc-100 rounded-lg p-0.5 gap-2">
                  <button 
                    onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 active:text-customer-accent active:bg-zinc-50 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-4 text-center font-black text-[10px] text-customer-text">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 active:text-customer-accent active:bg-zinc-50 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-zinc-950 text-white rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-customer-accent/10 rounded-full blur-3xl -mr-8 -mt-8"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center opacity-40">
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider">Subtotal</span>
              <span className="font-bold text-xs md:text-sm">₹{totalAmount.toFixed(0)}</span>
            </div>
            
            <div className="flex justify-between items-start pb-4 border-b border-white/5 opacity-40">
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider">Service Charge</span>
              <span className="text-[8px] font-bold italic tracking-wider">At checkout</span>
            </div>

            <div className="flex justify-between items-end pt-1">
              <div className="flex flex-col">
                <span className="text-xs font-fraunces font-bold italic text-customer-accent">Total</span>
                <span className="text-[7px] font-black opacity-20 uppercase tracking-wider">Estimated</span>
              </div>
              <span className="font-fraunces text-3xl md:text-4xl font-black italic">₹{totalAmount.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 text-center px-8 opacity-30">
          <div className="flex items-center gap-1.5">
            <CreditCard size={10} />
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Secure Checkout</span>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-[90] animate-in slide-in-from-bottom-10 duration-700">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="group relative w-full h-14 md:h-16 bg-customer-text text-white rounded-2xl shadow-2xl flex items-center justify-between px-2 overflow-hidden transition-all active:scale-[0.98] active:shadow-none disabled:opacity-50"
          >
            <div className="h-10 md:h-12 bg-white/10 rounded-xl px-4 md:px-6 flex items-center gap-2.5">
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShoppingBag size={16} />
              )}
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">{isSubmitting ? 'Placing...' : 'Review & Pay'}</span>
            </div>

            <div className="flex items-center gap-1.5 font-fraunces italic text-base md:text-lg pr-3 md:pr-4 transition-all group-hover:translate-x-1">
              PROCEED <ArrowRight size={18} className="text-customer-accent" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
