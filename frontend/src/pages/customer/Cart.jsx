import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store';
import api from '../../api/axios';
import { ArrowLeft, Plus, Minus, Info, ShoppingBag, CreditCard, Trash2, ArrowRight } from 'lucide-react';
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
      const payload = {
        restaurant_id: restaurantId,
        table_number: parseInt(tableNumber, 10),
        items: items.map(i => ({ menu_item_id: i.id, quantity: i.quantity }))
      };

      const res = await api.post('/orders', payload);
      clearCart();
      navigate(`/order-status/${res.data.order_id}`);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="theme-customer min-h-screen p-8 bg-[#FBF7F0] flex flex-col items-center justify-center animate-in fade-in duration-700">
        <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(200,92,26,0.1)] border border-customer-surface/30 flex items-center justify-center mb-8 relative">
          <ShoppingBag size={48} className="text-customer-accent/20" />
          <div className="absolute inset-0 border-2 border-dashed border-customer-accent/10 rounded-[2.5rem] animate-[spin_10s_linear_infinite]"></div>
        </div>
        <h2 className="font-fraunces text-4xl font-bold mb-3 text-customer-accent tracking-tight italic">Cart is empty</h2>
        <p className="text-customer-text/40 mb-10 text-center font-medium max-w-xs leading-relaxed uppercase text-[10px] tracking-widest">
          Your selection is currently void. Return to the menu to explore our culinary creations.
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 px-10 py-5 bg-customer-text text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
        >
          Explore Menu <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="theme-customer min-h-screen pb-36 font-jakarta bg-[#FBF7F0]/60 selection:bg-customer-accent/10">
      {/* Premium Header */}
      <header className="px-8 pt-16 pb-8 flex items-center justify-between sticky top-0 backdrop-blur-3xl bg-white/80 z-50 border-b border-customer-surface/20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-customer-surface/30 text-customer-text/60 hover:text-customer-accent hover:border-customer-accent transition-all active:scale-90 shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-fraunces text-3xl font-black text-customer-text leading-none italic">Checkout</h1>
            <p className="text-[10px] font-black text-customer-text/30 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-customer-accent animate-pulse"></span> Table {tableNumber}
            </p>
          </div>
        </div>
        
        <button 
          onClick={clearCart}
          className="w-12 h-12 flex items-center justify-center rounded-2xl text-customer-text/20 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
          title="Clear Cart"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <div className="px-8 mt-10 space-y-10 animate-in slide-in-from-bottom-6 duration-700">
        {error && (
          <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 italic">
            <Info size={16} /> Order Alert: {error}
          </div>
        )}

        {/* Item List with Premium Elevation */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-customer-text/30 uppercase tracking-[0.3em] ml-2 mb-6 italic">Selected Items</h3>
          
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="group relative flex items-center gap-5 p-5 rounded-[2.5rem] bg-white border border-customer-surface/20 shadow-sm transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="w-20 h-20 flex-shrink-0 rounded-[1.8rem] bg-customer-surface/10 overflow-hidden relative shadow-inner">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-customer-accent/20 font-black text-lg">
                      {item.is_veg ? 'V' : 'M'}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-[1px] border flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                      <span className={`w-1 h-1 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                    </span>
                    <h4 className="font-bold text-md text-customer-text leading-tight">{item.name}</h4>
                  </div>
                  <div className="font-fraunces italic font-bold text-lg text-customer-accent leading-none mt-1">₹{item.price}</div>
                </div>

                <div className="flex items-center gap-4 bg-[#FBF7F0] border border-customer-surface/20 rounded-[1.5rem] p-1.5 shadow-inner">
                  <button 
                    onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-customer-surface/20 text-customer-text/40 hover:text-customer-accent hover:border-customer-accent transition-all active:scale-90 shadow-sm"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-black text-xs text-customer-text">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-customer-surface/20 text-customer-text/40 hover:text-customer-accent hover:border-customer-accent transition-all active:scale-90 shadow-sm"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="group bg-white rounded-[2.5rem] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-customer-surface/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-customer-accent/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform">
              <span className="text-[10px] font-black text-customer-text/30 uppercase tracking-[0.2em]">Merchandise Subtotal</span>
              <span className="font-bold text-md text-customer-text">₹{totalAmount.toFixed(0)}</span>
            </div>
            
            <div className="flex justify-between items-start pb-8 border-b border-dashed border-customer-surface/40 group-hover:translate-x-1 transition-transform">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-customer-text/30 uppercase tracking-[0.2em]">Service Protocol</span>
                <span className="text-[10px] font-medium text-customer-accent italic mt-1 uppercase tracking-widest">Calculated at final billing</span>
              </div>
              <span className="text-[10px] font-black text-customer-text/20 uppercase tracking-widest">TBD</span>
            </div>

            <div className="flex justify-between items-end pt-2">
              <div className="flex flex-col">
                <span className="text-sm font-fraunces font-bold italic text-customer-accent">Total Valuation</span>
                <span className="text-[9px] font-black text-customer-text/20 uppercase tracking-[0.2em]">Estimated payable</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-fraunces text-4xl font-black text-customer-text italic">₹{totalAmount.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Info Badge */}
        <div className="flex flex-col items-center gap-4 text-center px-10">
          <div className="flex items-center gap-2 opacity-30">
            <CreditCard size={14} className="text-customer-text" />
            <span className="text-[9px] font-black text-customer-text uppercase tracking-widest">Encrypted Local Ordering Network</span>
          </div>
          <p className="text-[9px] text-customer-text/30 font-medium leading-relaxed uppercase tracking-wider">
            By placing this order, you authorize the kitchen to begin prep immediately. Status updates will be broadcast to your device.
          </p>
        </div>
      </div>

      {/* FIXED ACTION BAR — Ultra Modern */}
      <div className="fixed bottom-10 left-0 right-0 px-8 z-[100] animate-in slide-in-from-bottom-10 duration-1000 delay-300">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="group relative w-full h-20 bg-customer-text text-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] flex items-center justify-between px-3 overflow-hidden transition-all active:scale-[0.98] active:shadow-none disabled:opacity-50"
          >
            {/* Animated shine line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

            <div className="h-14 bg-white/10 rounded-[2rem] px-8 flex items-center gap-3">
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <div className="relative">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-customer-accent rounded-full border-2 border-customer-text"></span>
                </div>
              )}
              <span className="text-xs font-black uppercase tracking-[0.2em]">{isSubmitting ? 'Syncing...' : 'Place Order'}</span>
            </div>

            <div className="flex items-center gap-2 font-fraunces italic text-xl pr-6 transition-all group-hover:translate-x-1">
              PROCEED <ArrowRight size={22} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
