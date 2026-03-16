import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store';
import api from '../../api/axios';
import { ArrowLeft, Plus, Minus, Info } from 'lucide-react';
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
      <div className="theme-customer min-h-screen p-6 font-jakarta flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-customer-surface/50 rounded-full flex items-center justify-center mb-4">
          <Info size={32} className="text-customer-text/50" />
        </div>
        <h2 className="font-fraunces text-2xl font-semibold mb-2">Cart is empty</h2>
        <p className="text-customer-text/70 mb-8 text-center">Looks like you haven't added any items yet.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-8 py-3 bg-customer-text text-white rounded-xl font-medium"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="theme-customer min-h-screen pb-24 font-jakarta">
      <header className="px-6 py-6 flex items-center gap-4 sticky top-0 bg-customer-bg z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-customer-surface/50">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-fraunces text-2xl font-semibold">Your Order</h1>
      </header>

      <div className="px-6 space-y-6">
        {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-customer-surface/30">
          <div className="text-sm font-semibold text-customer-text/60 mb-4 pb-4 border-b border-customer-surface/40">
            Table {tableNumber}
          </div>
          
          <div className="space-y-6">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-start gap-4">
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`flex-shrink-0 w-3 h-3 rounded-sm border flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                    </span>
                    <h3 className="font-medium text-[15px] leading-tight">{item.name}</h3>
                  </div>
                  <div className="font-semibold text-sm mt-1">₹{item.price}</div>
                </div>

                <div className="flexitems-center gap-3 bg-customer-surface/30 rounded-lg p-1">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-customer-surface/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-customer-text/70">Subtotal</span>
            <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-customer-surface/40">
            <span className="text-customer-text/70">Taxes & Charges</span>
            <span className="font-medium inline-flex items-center">Calculated at payment</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-semibold text-xl">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-6 right-6">
        <button 
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="w-full bg-customer-text text-white p-4 rounded-2xl shadow-lg flex items-center justify-center font-semibold disabled:opacity-70 transition-opacity"
        >
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

export default Cart;
