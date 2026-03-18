import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store';
import api from '../../api/axios';
import { ShoppingBag, ChevronRight, Leaf, Info, Star, Plus, Search, Filter } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
  const [searchQuery, setSearchQuery] = useState('');
  
  const containerRef = useRef(null);
  const itemsRef = useRef([]);

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

  useEffect(() => {
    if (!loading && menuData) {
      // Entrance animations for items
      gsap.fromTo(".menu-item-card", 
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.1, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".menu-list-container",
            start: "top 80%",
          }
        }
      );
    }
  }, [loading, menuData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-customer-bg">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-customer-accent/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-customer-accent/10 rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="mt-8 font-fraunces text-2xl text-customer-accent animate-pulse font-bold tracking-tight italic">
        Curating Chef's Special...
      </p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-customer-bg p-8 text-center">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-red-100/50">
        <Info size={48} className="text-red-500" />
      </div>
      <h2 className="text-3xl font-fraunces font-extrabold mb-4 text-customer-text">Menu Not Available</h2>
      <p className="text-customer-text/60 mb-10 max-w-xs">{error}</p>
      <button onClick={() => window.location.reload()} className="px-10 py-4 bg-customer-accent text-white rounded-3xl font-bold shadow-lg shadow-customer-accent/30 active:scale-95 transition-all">Try Again</button>
    </div>
  );

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div ref={containerRef} className="theme-customer min-h-screen pb-40 font-jakarta bg-[#FBF7F0]/60 selection:bg-customer-accent selection:text-white">
      {/* Header with Glassmorphism */}
      <header className="sticky top-0 z-[60] backdrop-blur-2xl bg-white/90 border-b border-customer-surface/40 px-6 pt-10 pb-6 transition-all duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h1 className="font-fraunces text-4xl font-black tracking-tight text-customer-accent leading-tight">
              {menuData.restaurant.name}
            </h1>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-customer-text/40">
              <span className="bg-customer-accent text-white px-2 py-0.5 rounded-md shadow-sm">Table {table}</span>
              <span className="w-1 h-1 bg-customer-text/20 rounded-full"></span>
              <span className="flex items-center gap-1"><Star size={12} className="fill-customer-accent text-customer-accent" /> 4.9</span>
              <span className="w-1 h-1 bg-customer-text/20 rounded-full"></span>
              <span>15-20 Min Prep</span>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button 
                onClick={() => setVegOnly(!vegOnly)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border shadow-sm ${
                vegOnly ? 'bg-green-600 border-green-500 text-white shadow-green-200 scale-105' : 'bg-white border-customer-surface text-customer-text/40'
                }`}
            >
                <Leaf size={22} className={vegOnly ? 'fill-white' : ''} />
            </button>
          </div>
        </div>

        {/* Search Bar - App-like experience */}
        <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-customer-text/30" size={18} />
            <input 
                type="text" 
                placeholder="Search your favorites..." 
                className="w-full h-14 bg-customer-bg border border-customer-surface/40 rounded-[1.25rem] pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-customer-accent/20 focus:border-customer-accent/40 transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {/* Categories Nav - Dynamic Pill Design */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-2 px-2">
          {menuData.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                document.getElementById(`category-${cat.id}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`whitespace-nowrap px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 border-2 flex items-center gap-2 ${
                activeCategory === cat.id 
                  ? 'bg-customer-text border-customer-text text-white shadow-2xl scale-105' 
                  : 'bg-white border-transparent text-customer-text/40 hover:text-customer-text'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Menu Content */}
      <div className="px-6 mt-8 menu-list-container space-y-12">
        {menuData.categories.map(cat => {
          const visibleItems = cat.items.filter(item => {
              const matchesVeg = !vegOnly || item.is_veg;
              const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
              return matchesVeg && matchesSearch;
          });
          
          if (visibleItems.length === 0) return null;

          return (
            <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-64">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="font-fraunces text-2xl font-black italic text-customer-text/90 pr-4">{cat.name}</h3>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-customer-surface to-transparent rounded-full opacity-30"></div>
              </div>

              <div className="grid gap-6">
                {visibleItems.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className="menu-item-card group relative flex gap-5 p-4 rounded-[2.5rem] bg-white border border-customer-surface/10 shadow-[0_10px_30px_rgba(0,0,0,0.02)] active:scale-95 transition-all duration-300"
                  >
                    {/* Item Image */}
                    <div className="w-32 h-32 flex-shrink-0 rounded-[2.2rem] bg-customer-bg overflow-hidden relative shadow-inner border border-customer-surface/10">
                      {item.image_url ? (
                        <img 
                            src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-20 bg-gradient-to-br from-customer-accent/10 to-transparent">
                          {cat.icon}
                        </div>
                      )}
                      
                      {/* Veg Indicator */}
                      <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/20">
                        <span className={`w-3 h-3 rounded-[2px] border flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-2 pr-2">
                      <div>
                        <h4 className="font-extrabold text-xl text-customer-text mb-1 leading-tight">{item.name}</h4>
                        <p className="text-[11px] font-medium text-customer-text/40 leading-relaxed line-clamp-2">{item.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-customer-accent/40 uppercase tracking-tighter">Price</span>
                            <span className="text-2xl font-black text-customer-text tracking-tighter">₹{item.price}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              addItem(item);
                              gsap.fromTo(e.currentTarget, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.3)" });
                          }}
                          className="w-14 h-14 bg-customer-accent text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-customer-accent/20 active:bg-customer-text transition-colors group/btn"
                        >
                          <Plus size={28} className="group-hover/btn:rotate-90 transition-transform duration-500" />
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

      {/* Floating Action Button (FAB) for Cart - Refined */}
      {totalCartItems > 0 && (
        <div className="md:hidden fixed bottom-32 left-0 right-0 px-6 z-[70] animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => navigate('/cart')}
              className="group relative w-full h-20 bg-customer-text text-white rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.35)] flex items-center justify-between p-2 overflow-hidden"
            >
              <div className="flex items-center gap-4 h-full bg-white/10 rounded-[2.2rem] px-8 py-3">
                <div className="relative">
                  <ShoppingBag size={24} className="group-hover:bounce" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-customer-accent rounded-full border-2 border-customer-text animate-pulse"></span>
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-lg font-black tracking-tight">{totalCartItems} Items Selected</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mt-1">Ready to cook</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pr-8">
                <span className="font-fraunces italic text-xl font-bold">Checkout</span>
                <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform duration-500" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;

