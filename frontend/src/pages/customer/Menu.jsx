import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store';
import api from '../../api/axios';
import { ShoppingBag, ChevronRight, Leaf } from 'lucide-react';

const Menu = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const restaurantSlug = searchParams.get('restaurant');
  const table = searchParams.get('table');
  
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const { items: cartItems, addItem, setContext } = useCartStore();

  useEffect(() => {
    if (!restaurantSlug || !table) {
      setError('Invalid QR code. Restaurant or table missing.');
      setLoading(false);
      return;
    }

    api.get(`/menu?restaurant=${restaurantSlug}&table=${table}`)
      .then(res => {
        setMenuData(res.data);
        setContext(res.data.restaurant.id, table);
        if (res.data.categories.length > 0) {
          setActiveCategory(res.data.categories[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.msg || 'Failed to load menu');
        setLoading(false);
      });
  }, [restaurantSlug, table, setContext]);

  if (loading) return <div className="p-8 theme-customer min-h-screen">Loading menu...</div>;
  if (error) return <div className="p-8 theme-customer min-h-screen text-red-600">{error}</div>;

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="theme-customer min-h-screen pb-24 font-jakarta">
      {/* Header */}
      <header className="px-6 pt-10 pb-4 sticky top-0 bg-customer-bg z-10 border-b border-customer-surface border-opacity-30">
        <h1 className="font-fraunces text-3xl font-semibold text-customer-text">{menuData.restaurant.name}</h1>
        <p className="text-sm opacity-70 mt-1">Table {table}</p>
        
        {/* Toggle */}
        <div className="flex items-center gap-2 mt-4">
          <button 
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold max-w-max transition-colors border ${vegOnly ? 'bg-green-100 text-green-800 border-green-200' : 'bg-transparent text-customer-text border-customer-surface'}`}
          >
            <Leaf size={14} className={vegOnly ? 'fill-green-600' : ''} /> 
            Veg Only
          </button>
        </div>
      </header>

      {/* Categories Nav */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 px-6 py-4 sticky top-[120px] bg-customer-bg z-10">
        {menuData.categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              document.getElementById(`category-${cat.id}`).scrollIntoView({ behavior: 'smooth' });
            }}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat.id 
                ? 'bg-customer-text text-white shadow-md' 
                : 'bg-customer-surface/30 text-customer-text/80'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Menu List */}
      <div className="px-6 space-y-8 mt-2">
        {menuData.categories.map(cat => {
          const visibleItems = cat.items.filter(item => !vegOnly || item.is_veg);
          if (visibleItems.length === 0) return null;

          return (
            <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-[190px]">
              <h2 className="font-fraunces text-xl font-semibold mb-4">{cat.name}</h2>
              <div className="grid gap-4">
                {visibleItems.map(item => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white border border-customer-surface/50 shadow-sm relative overflow-hidden">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        </span>
                        <h3 className="font-semibold text-base">{item.name}</h3>
                      </div>
                      <p className="text-xs text-customer-text/60 line-clamp-2 mb-3">{item.description}</p>
                      <div className="font-semibold">₹{item.price}</div>
                    </div>
                    
                    <div className="self-end flex-shrink-0">
                      <button 
                        onClick={() => addItem(item)}
                        className="px-6 py-2 rounded-xl bg-customer-surface/40 text-customer-text font-semibold text-sm hover:bg-customer-accent hover:text-white transition-colors"
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Cart FAB */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-6 left-6 right-6">
          <button 
            onClick={() => navigate('/cart')}
            className="w-full bg-customer-accent text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-semibold"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1 rounded-lg">
                <ShoppingBag size={18} className="inline mr-2" />
                {totalCartItems} items
              </div>
            </div>
            <div className="flex items-center gap-1">
              View Cart <ChevronRight size={20} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default Menu;
