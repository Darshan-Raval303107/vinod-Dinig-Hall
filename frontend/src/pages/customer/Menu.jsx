import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store';
import api from '../../api/axios';
import { ShoppingBag, ChevronRight, Leaf, Info, Star, Plus, Search } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Menu = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const restaurantSlug = searchParams.get('restaurant') || 'spice-lounge';
  const table = searchParams.get('table') || '0';
  
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vegOnly, setVegOnly] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const containerRef = useRef(null);
  const { items: cartItems, addItem, setContext } = useCartStore();

  useEffect(() => {
    // Default context set via searchParams logic above
    setLoading(true); // Ensure loading state is reset on re-mount if needed

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
        setError(err.response?.data?.msg || 'Unable to load the menu. Please try again.');
        setLoading(false);
      });
  }, [restaurantSlug, table, setContext]);

  useEffect(() => {
    if (!loading && menuData) {
      gsap.fromTo(".menu-item-card", 
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1, 
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".menu-list-container",
            start: "top 90%",
          }
        }
      );
    }
  }, [loading, menuData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-12 border-4 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-8 font-fraunces text-2xl text-customer-accent animate-pulse font-bold italic">Loading Menu...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-vh-100 bg-white p-8 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8">
        <Info size={32} className="text-red-500" />
      </div>
      <h2 className="text-3xl font-fraunces font-black italic mb-4 text-customer-text">Something Went Wrong</h2>
      <p className="text-[10px] font-black uppercase tracking-widest text-red-500/60 mb-10 max-w-xs">{error}</p>
      <button onClick={() => window.location.reload()} className="px-10 py-4 bg-customer-text text-white rounded-2xl font-black text-[10px] uppercase tracking-widest italic shadow-xl active:scale-95 transition-all">Try Again</button>
    </div>
  );

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div ref={containerRef} className="theme-customer min-h-screen pb-48 font-jakarta bg-white selection:bg-customer-accent/10">
      
      {/* MOBILE-FIRST HEADER: Optimized for one-hand use & safe areas */}
      <header className="sticky top-0 z-[60] backdrop-blur-2xl bg-white/90 border-b border-zinc-100 px-6 pb-6 shadow-sm overflow-hidden" 
              style={{ paddingTop: 'calc(var(--safe-top) + 2rem)' }}>
        
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h1 className="font-fraunces text-4xl font-black tracking-tighter text-customer-text leading-tight italic">
              {menuData.restaurant.name}
            </h1>
            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300">
              <span className="text-customer-accent font-black">
                {table === '0' ? 'Window Pickup' : `Table ${table}`}
              </span>
              <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
              <span className="flex items-center gap-1"><Star size={10} className="fill-customer-accent text-customer-accent" /> 4.9</span>
              <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
              <span>LIVE MENU</span>
            </div>
          </div>
          
          {/* Vegetarian Toggle Hidden per request */}
        </div>

        {/* SEARCH: Deeply set for easy thumb reach */}
        <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
            <input 
                type="text" 
                placeholder="Search dishes..." 
                className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-customer-accent/5 focus:border-customer-accent/30 transition-all placeholder:text-zinc-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {/* CATEGORIES: Horizontal Pill Layout */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 -mx-2 px-2">
          {menuData.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                const el = document.getElementById(`category-${cat.id}`);
                if (el) {
                  const headerOffset = 220;
                  const elementPosition = el.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
              }}
              className={`whitespace-nowrap px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 border flex items-center gap-2 ${
                activeCategory === cat.id 
                  ? 'bg-customer-text border-customer-text text-white shadow-lg -translate-y-0.5' 
                  : 'bg-white border-zinc-100 text-zinc-400'
              }`}
            >
              <span className="text-base grayscale-[0.5]">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* MENU LIST: Designed for vertical scroll flow */}
      <div className="px-6 mt-8 menu-list-container space-y-12">
        {menuData.categories.map(cat => {
          const visibleItems = cat.items.filter(item => {
              const matchesVeg = !vegOnly || item.is_veg;
              const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
              return matchesVeg && matchesSearch;
          });
          
          if (visibleItems.length === 0) return null;

          return (
            <div key={cat.id} id={`category-${cat.id}`}>
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-fraunces text-2xl font-black italic text-customer-text leading-none">{cat.name}</h3>
                <div className="h-[1px] flex-1 bg-zinc-100"></div>
              </div>

              <div className="grid gap-6">
                {visibleItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="menu-item-card relative flex gap-4 p-4 rounded-[2rem] bg-zinc-50/50 border border-zinc-100 transition-all active:scale-[0.98]"
                  >
                    {/* Item Media Container */}
                    <div className="w-28 h-28 flex-shrink-0 rounded-[1.8rem] bg-white overflow-hidden relative border border-zinc-100 shadow-sm">
                      {item.image_url ? (
                        <img 
                            src={item.image_url.startsWith('http') ? item.image_url : `${api.defaults.baseURL.replace('/api', '')}${item.image_url}`} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-10">
                          {cat.icon}
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-white/90 backdrop-blur-sm rounded-lg border border-zinc-100 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-base text-customer-text leading-tight mb-1">{item.name}</h4>
                        <p className="text-[10px] font-medium text-zinc-400 leading-relaxed line-clamp-2 italic uppercase tracking-wider">{item.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xl font-fraunces font-black italic text-customer-text">₹{item.price}</span>
                        <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              addItem(item);
                              gsap.fromTo(e.currentTarget, { scale: 0.8 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
                          }}
                          className="w-12 h-12 bg-customer-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-customer-accent/10 active:bg-customer-text transition-colors"
                        >
                          <Plus size={22} strokeWidth={3} />
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

      {/* MOBILE STICKY CART ACTION - Matches Cart & Payment style */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-6 z-[70] animate-in slide-in-from-bottom-10 duration-700">
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => navigate('/cart')}
              className="group relative w-full h-20 bg-customer-text text-white rounded-[2.2rem] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.3)] flex items-center justify-between px-3 overflow-hidden transition-all active:scale-[0.98]"
            >
              <div className="h-14 bg-white/10 rounded-[1.8rem] px-8 flex items-center gap-4">
                <div className="relative">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-customer-accent rounded-full border-2 border-customer-text"></span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-black uppercase tracking-widest">{totalCartItems} Items</span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-30 italic">View Cart</span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-fraunces italic text-lg pr-6">
                CHECKOUT <ChevronRight size={20} className="text-customer-accent" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
