import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store';
import api, { resolveAssetUrl } from '../../api/axios';
import { ShoppingBag, ChevronRight, Leaf, Info, Star, Plus, Search, Minus, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Menu = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { items: cartItems, addItem, updateQuantity, setContext, startSession, isSessionValid, destroySession, tableNumber: sessionTable, activeOrders = [] } = useCartStore();
  const restaurantSlug = searchParams.get('restaurant') || 'vinnod';
  const table = searchParams.get('table') || sessionTable || '0';
  
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const containerRef = useRef(null);
  const categoryScrollRef = useRef(null);


  useEffect(() => {
    // Auto-destroy expired session
    if (!isSessionValid() && useCartStore.getState().sessionCreatedAt) {
      destroySession();
    }

    setLoading(true);

    api.get(`/menu?restaurant=${restaurantSlug}&table=${table}`)
      .then(res => {
        setMenuData(res.data);
        // Start or refresh session with full context
        startSession(res.data.restaurant.id, table, restaurantSlug);
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
      // Entrance Animation
      gsap.fromTo(".menu-item-card", 
        { opacity: 0, scale: 0.95, y: 30 },
        { 
          opacity: 1, 
          scale: 1,
          y: 0, 
          duration: 0.8, 
          stagger: 0.05,
          ease: "expo.out",
          scrollTrigger: {
            trigger: ".menu-list-container",
            start: "top 85%",
          }
        }
      );

      // Scroll Observer for Active Category
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const catId = entry.target.id.replace('category-', '');
            setActiveCategory(catId);
            // Auto-scroll category pill into view
            const pill = document.getElementById(`pill-${catId}`);
            if (pill && categoryScrollRef.current) {
              pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
          }
        });
      }, {
        threshold: 0.2,
        rootMargin: '-20% 0px -60% 0px'
      });

      menuData.categories.forEach(cat => {
        const el = document.getElementById(`category-${cat.id}`);
        if (el) observer.observe(el);
      });

      return () => observer.disconnect();
    }
  }, [loading, menuData, searchQuery, vegOnly]);

  // Helper: get quantity of item in cart
  const getCartQty = (itemId) => {
    const found = cartItems.find(i => i.id === itemId);
    return found ? found.quantity : 0;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-10 h-10 border-3 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 font-fraunces text-xl text-customer-accent animate-pulse font-bold italic">Loading Menu...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <Info size={28} className="text-red-500" />
      </div>
      <h2 className="text-2xl font-fraunces font-black italic mb-3 text-customer-text">Something Went Wrong</h2>
      <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 mb-8 max-w-xs">{error}</p>
      <button onClick={() => window.location.reload()} className="px-8 py-3 bg-customer-text text-white rounded-2xl font-black text-[9px] uppercase tracking-widest italic shadow-xl active:scale-95 transition-all">Try Again</button>
    </div>
  );

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div ref={containerRef} className="theme-customer min-h-screen pb-40 font-jakarta bg-[#FAFAF8] selection:bg-customer-accent/10">
      
      {/* ══════════ COMPACT MOBILE HEADER ══════════ */}
      <header className="sticky top-0 z-[60] backdrop-blur-2xl bg-white/85 border-b border-zinc-100/80 shadow-sm"
              style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}>
        
        {/* Row 1: Title + Location Badge */}
        <div className="px-4 pt-2 pb-2 md:px-8 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-fraunces text-xl md:text-3xl font-black tracking-tight text-customer-text leading-none italic truncate">
              Menu
            </h1>
          </div>
          
          <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-50 px-3 py-1.5 md:px-5 md:py-3 rounded-full border border-zinc-100 flex-shrink-0">
            <span className="text-customer-accent leading-none">
              {table === '0' ? 'Pickup' : `T-${table.padStart(2, '0')}`}
            </span>
            <span className="w-px h-3 bg-zinc-200"></span>
            <span className="flex items-center gap-0.5"><Star size={8} className="fill-customer-accent text-customer-accent" />4.9</span>
          </div>
        </div>
        
        {/* Row 2: Search + Veg Toggle */}
        <div className="px-4 pb-2 md:px-8 flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-customer-accent transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              className="w-full h-9 md:h-11 bg-zinc-50 border border-zinc-100 rounded-xl pl-9 pr-8 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-customer-accent/10 focus:border-customer-accent/30 transition-all placeholder:text-zinc-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 active:scale-90">
                <X size={10} strokeWidth={3} />
              </button>
            )}
          </div>
          
          {/* Veg Toggle */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-1.5 h-9 md:h-11 px-3 md:px-4 rounded-xl border text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex-shrink-0 ${
              vegOnly 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-white border-zinc-100 text-zinc-400'
            }`}
          >
            <Leaf size={12} />
            <span className="hidden sm:inline">Veg</span>
          </button>
        </div>

        {/* Row 3: Category Pills */}
        <div ref={categoryScrollRef} className="flex overflow-x-auto hide-scrollbar gap-1.5 pb-2.5 px-4 md:px-8">
          {menuData.categories.map(cat => (
            <button
              id={`pill-${cat.id}`}
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                const el = document.getElementById(`category-${cat.id}`);
                if (el) {
                  const headerOffset = 180;
                  const elementPosition = el.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 md:px-5 md:py-2.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border flex items-center gap-1.5 flex-shrink-0 ${
                activeCategory === cat.id 
                  ? 'bg-customer-text border-customer-text text-white shadow-md' 
                  : 'bg-white border-zinc-100 text-zinc-400'
              }`}
            >
              <span className={`text-xs transition-transform duration-300 ${activeCategory === cat.id ? '' : 'grayscale opacity-50'}`}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="max-w-7xl mx-auto px-3 md:px-8 mt-4 flex flex-col md:flex-row gap-8">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:block w-56 flex-shrink-0 sticky top-44 h-fit space-y-1">
          <div className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-4 px-3 italic">Categories</div>
          {menuData.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                const el = document.getElementById(`category-${cat.id}`);
                if (el) {
                  const headerOffset = 180;
                  const elementPosition = el.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                activeCategory === cat.id 
                  ? 'bg-customer-text text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-customer-text hover:bg-zinc-50'
              }`}
            >
              <span className={`text-sm transition-transform duration-300 ${activeCategory === cat.id ? 'scale-110' : 'grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100'}`}>{cat.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">{cat.name}</span>
              {activeCategory === cat.id && <ChevronRight size={12} className="ml-auto opacity-40" />}
            </button>
          ))}
        </aside>

        {/* ══════════ MENU LIST ══════════ */}
        <div className="flex-1 menu-list-container space-y-8 md:space-y-16">
          {(() => {
             let totalVisible = 0;
             const sections = menuData.categories.map(cat => {
                const visibleItems = cat.items.filter(item => {
                    const matchesVeg = !vegOnly || item.is_veg;
                    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesVeg && matchesSearch;
                });
                totalVisible += visibleItems.length;
                
                if (visibleItems.length === 0) return null;

                return (
                  <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-48 group/section">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-4 md:mb-8">
                      <div className="flex flex-col">
                         <span className="text-[8px] md:text-[9px] font-black text-customer-accent uppercase tracking-widest mb-0.5">{visibleItems.length} items</span>
                         <h3 className="font-fraunces text-xl md:text-3xl font-black italic text-customer-text leading-none">{cat.name}</h3>
                      </div>
                      <div className="h-px flex-1 bg-zinc-100"></div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-5">
                      {visibleItems.map((item) => {
                        const qty = getCartQty(item.id);
                        return (
                          <div 
                            key={item.id} 
                            className="menu-item-card relative flex flex-row gap-3 p-3 md:p-4 rounded-2xl bg-white border border-zinc-100 hover:border-customer-accent/15 shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.99] overflow-hidden"
                          >
                            {/* Image */}
                            <div className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0 rounded-xl bg-zinc-50 overflow-hidden relative border border-zinc-50 group/media">
                              {item.image_url ? (
                                <img 
                                    src={resolveAssetUrl(item.image_url)} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-700" 
                                    loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl opacity-20 grayscale">
                                  {cat.icon}
                                </div>
                              )}
                              
                              {/* Veg/Non-veg badge */}
                              <div className="absolute top-1.5 left-1.5 flex items-center justify-center w-4 h-4 md:w-5 md:h-5 bg-white/90 backdrop-blur-sm rounded-md border border-zinc-100">
                                <div className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                              <div>
                                <h4 className="font-bold text-sm md:text-base text-customer-text leading-tight tracking-tight line-clamp-1">{item.name}</h4>
                                <p className="text-[10px] md:text-xs text-zinc-400 leading-snug mt-0.5 line-clamp-2 italic">{item.description}</p>
                              </div>
                              
                              {/* Price + Add Button */}
                              <div className="flex items-end justify-between mt-2">
                                <span className="text-lg md:text-xl font-fraunces font-black italic text-customer-text leading-none">₹{item.price}</span>
                                
                                {qty === 0 ? (
                                  <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addItem(item);
                                        gsap.fromTo(e.currentTarget, { scale: 0.8 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
                                    }}
                                    className="h-8 w-8 md:h-10 md:w-10 bg-customer-text text-white rounded-xl flex items-center justify-center shadow-md active:bg-customer-accent transition-all active:scale-90"
                                  >
                                    <Plus size={16} strokeWidth={3} />
                                  </button>
                                ) : (
                                  <div className="flex items-center bg-customer-text rounded-xl overflow-hidden shadow-md">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, qty - 1); }}
                                      className="w-7 h-8 md:w-8 md:h-9 flex items-center justify-center text-white/70 active:text-white active:bg-white/10 transition-colors"
                                    >
                                      <Minus size={12} strokeWidth={3} />
                                    </button>
                                    <span className="w-5 text-center text-xs font-black text-white">{qty}</span>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); addItem(item); }}
                                      className="w-7 h-8 md:w-8 md:h-9 flex items-center justify-center text-white/70 active:text-white active:bg-white/10 transition-colors"
                                    >
                                      <Plus size={12} strokeWidth={3} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
             });

             if (totalVisible === 0) {
                return (
                  <div className="flex flex-col items-center justify-center p-12 md:p-20 border-2 border-dashed border-zinc-100 rounded-2xl opacity-40 text-center">
                     <Search size={36} className="mb-4 text-zinc-300" strokeWidth={1} />
                     <h4 className="font-fraunces text-xl font-black italic mb-2">No dishes found</h4>
                     <p className="text-[9px] font-black uppercase tracking-wider mb-6">Try a different search</p>
                     <button onClick={() => setSearchQuery('')} className="px-6 py-2.5 bg-customer-text text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Clear Search</button>
                  </div>
                );
             }
             return sections;
          })()}
        </div>
      </div>

      {/* ══════════ ACTIVE ORDERS PILLS ══════════ */}
      {activeOrders.length > 0 && (
        <div className={`fixed ${totalCartItems > 0 ? 'bottom-44' : 'bottom-28'} left-0 right-0 px-4 z-[60] flex flex-col items-end gap-2 pointer-events-none`}>
          {activeOrders.map((orderId) => (
             <button 
                key={orderId} 
                onClick={() => navigate(`/order-status/${orderId}`)}
                className="pointer-events-auto bg-white border border-zinc-200 text-customer-text px-4 py-3 rounded-2xl shadow-xl font-black text-[9px] uppercase tracking-wider flex items-center justify-between gap-3 w-full max-w-xs active:scale-95 transition-all"
             >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <div className="flex flex-col items-start gap-0.5">
                     <span className="leading-none text-[7px] opacity-40 italic">Active Order</span>
                     <span>#{orderId.substring(0,6).toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-40">
                  <span className="text-[8px] tracking-wide italic">View</span>
                  <ChevronRight size={12} />
                </div>
             </button>
          ))}
        </div>
      )}

      {/* ══════════ FLOATING CART BAR ══════════ */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-[70] animate-in slide-in-from-bottom-10 duration-700">
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => navigate('/cart')}
              className="group relative w-full h-14 md:h-16 bg-customer-text text-white rounded-2xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.25)] flex items-center justify-between px-2 overflow-hidden transition-all active:scale-[0.98]"
            >
              <div className="h-10 md:h-12 bg-white/10 rounded-xl px-4 md:px-6 flex items-center gap-2.5">
                <div className="relative">
                  <ShoppingBag size={16} />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-customer-accent rounded-full border border-customer-text"></span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-wider leading-none">{totalCartItems} Items</span>
                  <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-wider opacity-30 italic">View Cart</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-fraunces italic text-base md:text-lg pr-3 md:pr-4">
                CHECKOUT <ChevronRight size={18} className="text-customer-accent" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
