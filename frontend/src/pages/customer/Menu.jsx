import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store';
import api from '../../api/axios';
import { ShoppingBag, ChevronRight, Leaf, Info, Star, Plus } from 'lucide-react';

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-customer-bg">
      <div className="w-16 h-16 border-4 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-fraunces text-xl text-customer-accent animate-pulse">Designing your menu...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-customer-bg p-8 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <Info size={40} className="text-red-500" />
      </div>
      <h2 className="text-2xl font-fraunces font-bold mb-2">Something went wrong</h2>
      <p className="text-customer-text/60 mb-8">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-customer-text text-white rounded-2xl">Try Again</button>
    </div>
  );

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="theme-customer min-h-screen pb-32 font-jakarta bg-[#FBF7F0]/80">
      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-customer-surface/30 px-6 pt-12 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-fraunces text-4xl font-extrabold tracking-tight text-customer-accent leading-none">
              {menuData.restaurant.name}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-customer-text/50 font-medium">
              <span className="bg-customer-accent/10 px-2 py-0.5 rounded text-customer-accent">Table {table}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Star size={14} className="fill-customer-accent text-customer-accent" /> 4.9 (120+)</span>
            </div>
          </div>
          <button 
            onClick={() => setVegOnly(!vegOnly)}
            className={`p-3 rounded-2xl transition-all border shadow-sm ${
              vegOnly ? 'bg-green-600 border-green-500 text-white shadow-green-200' : 'bg-white border-customer-surface text-customer-text/40'
            }`}
            title={vegOnly ? "Show All" : "Vegetarian Only"}
          >
            <Leaf size={24} className={vegOnly ? 'fill-white' : ''} />
          </button>
        </div>

        {/* Categories Nav - Animated Scroll Indicator */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mt-8 pb-1">
          {menuData.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                document.getElementById(`category-${cat.id}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border-2 flex items-center gap-2 ${
                activeCategory === cat.id 
                  ? 'bg-customer-text border-customer-text text-white shadow-xl translate-y-[-2px]' 
                  : 'bg-white border-customer-surface/30 text-customer-text/60 hover:border-customer-surface'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Hero-like Message */}
      <div className="px-6 py-8">
        <h2 className="font-fraunces text-2xl font-semibold opacity-30 text-center tracking-wide uppercase text-xs mb-8">
          Crafted Menu for Today
        </h2>
      </div>

      {/* Menu List */}
      <div className="px-6 space-y-16">
        {menuData.categories.map(cat => {
          const visibleItems = cat.items.filter(item => !vegOnly || item.is_veg);
          if (visibleItems.length === 0) return null;

          return (
            <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-60">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-customer-surface/40"></div>
                <h3 className="font-fraunces text-3xl font-bold italic text-customer-text/80">{cat.name}</h3>
                <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-customer-surface/40"></div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {visibleItems.map(item => (
                  <div key={item.id} className="group relative flex gap-5 p-5 rounded-[2.5rem] bg-white border border-customer-surface/20 shadow-sm transition-all duration-500 hover:shadow-[0_20px_50px_rgba(200,92,26,0.1)] hover:-translate-y-1 overflow-hidden">
                    {/* Item Image with Premium Aspect Ratio */}
                    <div className="w-28 h-28 flex-shrink-0 rounded-[2rem] bg-customer-surface/10 overflow-hidden relative shadow-inner">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-customer-accent/20 bg-customer-accent/5">
                          {cat.icon}
                        </div>
                      )}
                      
                      {/* Veg/Non-veg Dot Overlay */}
                      <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-md">
                        <span className={`w-2.5 h-2.5 rounded-[1px] border flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                          <span className={`w-1 h-1 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-lg text-customer-text group-hover:text-customer-accent transition-colors">{item.name}</h4>
                        </div>
                        <p className="text-xs text-customer-text/40 leading-relaxed line-clamp-2 pr-2">{item.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xl font-extrabold text-customer-text">₹{item.price}</span>
                        <button 
                          onClick={() => addItem(item)}
                          className="flex items-center gap-2 pl-6 pr-4 py-2 bg-customer-accent text-white rounded-2xl font-bold text-xs shadow-lg shadow-customer-accent/20 hover:bg-customer-text hover:shadow-customer-text/20 transition-all active:scale-95 group/btn"
                        >
                          ADD <Plus size={16} className="group-hover/btn:rotate-90 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart FAB - Ultra Premium Design */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-10 left-0 right-0 px-8 z-50">
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => navigate('/cart')}
              className="group relative w-full h-18 bg-customer-text text-white rounded-[2.2rem] shadow-[0_25px_60px_rgba(0,0,0,0.3)] flex items-center justify-between px-2 overflow-hidden"
            >
              {/* Animated background pulse */}
              <div className="absolute inset-0 bg-gradient-to-r from-customer-accent/0 via-white/5 to-customer-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              
              <div className="flex items-center gap-2 h-14 bg-white/10 rounded-[1.8rem] px-6">
                <div className="relative">
                  <ShoppingBag size={22} />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-customer-accent rounded-full border-2 border-customer-text animate-ping"></span>
                </div>
                <div className="flex flex-col items-start leading-none ml-2">
                  <span className="text-sm font-black">{totalCartItems} Items</span>
                  <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-1">Ready for checkout</span>
                </div>
              </div>

              <div className="flex items-center gap-1 font-fraunces italic text-lg pr-6">
                PROCEED <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
