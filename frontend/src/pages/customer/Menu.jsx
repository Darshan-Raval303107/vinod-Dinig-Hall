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
            setActiveCategory(entry.target.id.replace('category-', ''));
          }
        });
      }, {
        threshold: 0.2, // Trigger when 20% of section is visible
        rootMargin: '-20% 0px -60% 0px' // Adjust scroll window
      });

      menuData.categories.forEach(cat => {
        const el = document.getElementById(`category-${cat.id}`);
        if (el) observer.observe(el);
      });

      return () => observer.disconnect();
    }
  }, [loading, menuData, searchQuery, vegOnly]);

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
      <header className="sticky top-0 z-[60] backdrop-blur-2xl bg-white/80 border-b border-zinc-100 px-5 pb-5 shadow-sm overflow-hidden" 
              style={{ paddingTop: 'calc(var(--safe-top) + 1.5rem)' }}>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="space-y-1">
             <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-0.5 bg-customer-accent rounded-full"></span>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400">Vinod Dining Experience</span>
             </div>
             <h1 className="font-fraunces text-3xl md:text-5xl font-black tracking-tighter text-customer-text leading-tight italic">
               The <span className="text-customer-accent">Ritual</span> of Selection.
             </h1>
          </div>
          
          <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 bg-zinc-50 px-6 py-4 rounded-3xl border border-zinc-100">
             <div className="flex flex-col">
                <span className="text-zinc-400 mb-0.5 opacity-50">Location</span>
                <span className="text-customer-accent font-black">
                  {table === '0' ? 'Window Pickup' : `Station-${table.padStart(2, '0')}`}
                </span>
             </div>
             <div className="w-[1px] h-6 bg-zinc-200"></div>
             <div className="flex flex-col">
                <span className="text-zinc-400 mb-0.5 opacity-50">Rating</span>
                <span className="flex items-center gap-1 font-black text-customer-text"><Star size={10} className="fill-customer-accent text-customer-accent" /> 4.9/5</span>
             </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
           {/* SEARCH: Deeply set for easy thumb reach */}
           <div className="relative flex-1 w-full group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-customer-accent transition-colors" size={14} />
               <input 
                   type="text" 
                   placeholder="Search our culinary library..." 
                   className="w-full h-14 bg-white border border-zinc-100 rounded-2xl pl-14 pr-5 text-[11px] font-bold focus:outline-none focus:ring-8 focus:ring-customer-accent/5 focus:border-customer-accent/30 transition-all placeholder:text-zinc-200 shadow-sm"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
               />
           </div>

           {/* CATEGORIES: Horizontal Pill Layout (Hidden on Desktop Sidebar) */}
           <div className="md:hidden flex overflow-x-auto hide-scrollbar gap-2 pb-1 -mx-6 px-6 w-[100vw]">
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
                 className={`whitespace-nowrap px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 border flex items-center gap-2.5 ${
                   activeCategory === cat.id 
                     ? 'bg-customer-text border-customer-text text-white shadow-lg -translate-y-0.5' 
                     : 'bg-white border-zinc-100 text-zinc-400'
                 }`}
               >
                 <span className={`text-sm transition-transform duration-500 ${activeCategory === cat.id ? 'scale-110' : 'grayscale opacity-50'}`}>{cat.icon}</span>
                 {cat.name}
               </button>
             ))}
           </div>
        </div>
      </header>

      {/* MAIN CONTENT WORKSPACE: Sidebar + Grid */}
      <div className="max-w-7xl mx-auto px-6 mt-8 flex flex-col md:flex-row gap-12">
        
        {/* DESKTOP SIDEBAR: Sticky Category Navigation */}
        <aside className="hidden md:block w-64 flex-shrink-0 sticky top-48 h-fit space-y-2">
          <div className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-6 px-4 italic leading-none">Menu Explorer</div>
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
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group ${
                activeCategory === cat.id 
                  ? 'bg-customer-text text-white shadow-xl' 
                  : 'text-zinc-400 hover:text-customer-text hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-lg transition-transform duration-500 ${activeCategory === cat.id ? 'scale-110 rotate-12' : 'grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100'}`}>{cat.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">{cat.name}</span>
              </div>
              {activeCategory === cat.id && <ChevronRight size={14} className="opacity-40" />}
            </button>
          ))}
        </aside>

        {/* MENU LIST: Dynamic Grid Flow */}
        <div className="flex-1 menu-list-container space-y-20">
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
                    <div className="flex items-center gap-6 mb-10 overflow-hidden">
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black text-customer-accent uppercase tracking-[0.4em] mb-2">{visibleItems.length} Options</span>
                         <h3 className="font-fraunces text-3xl md:text-4xl font-black italic text-customer-text leading-none transition-transform duration-500 group-hover/section:translate-x-2">{cat.name}</h3>
                      </div>
                      <div className="h-[1px] flex-1 bg-zinc-100 relative overflow-hidden">
                         <div className="absolute inset-0 bg-customer-accent/10 translate-x-[-100%] group-hover/section:translate-x-[0%] transition-transform duration-700"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                      {visibleItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="menu-item-card premium-card relative flex flex-col sm:flex-row gap-5 p-4 rounded-3xl bg-white border border-zinc-100 hover:border-customer-accent/20 shadow-sm active:scale-[0.98] overflow-hidden"
                        >
                          {/* Item Media Container */}
                          <div className="w-full sm:w-28 lg:w-32 h-44 sm:h-28 lg:h-32 flex-shrink-0 rounded-2xl bg-zinc-50 overflow-hidden relative border border-zinc-100/50 shadow-inner group/media">
                            {item.image_url ? (
                              <img 
                                  src={item.image_url.startsWith('http') ? item.image_url : `${api.defaults.baseURL.replace('/api', '')}${item.image_url}`} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover group-hover/media:scale-110 transition-transform duration-700" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl opacity-20 group-hover/media:rotate-12 transition-transform duration-500 grayscale">
                                {cat.icon}
                              </div>
                            )}
                            
                            <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 bg-white/90 backdrop-blur-sm rounded-xl border border-zinc-100 shadow-xl">
                              <div className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_0_8px_currentColor]`}></div>
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-1 relative">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                 <h4 className="font-syne font-black text-xl text-customer-text leading-none tracking-tighter uppercase">{item.name}</h4>
                              </div>
                              <p className="text-[10px] font-medium text-zinc-400 leading-relaxed italic line-clamp-2">{item.description}</p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-50">
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">Price</span>
                                 <span className="text-2xl font-fraunces font-black italic text-customer-text">₹{item.price}</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addItem(item);
                                    gsap.fromTo(e.currentTarget, { scale: 0.8 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
                                }}
                                className="w-14 h-14 bg-customer-text text-white rounded-3xl flex items-center justify-center shadow-xl shadow-zinc-200 active:bg-customer-accent transition-all hover:-translate-y-1 hover:shadow-customer-accent/20"
                              >
                                <Plus size={24} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
             });

             if (totalVisible === 0) {
                return (
                  <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-zinc-100 rounded-[3rem] opacity-40 text-center">
                     <Search size={48} className="mb-6 text-zinc-300" strokeWidth={1} />
                     <h4 className="font-fraunces text-2xl font-black italic mb-2">No culinary matches</h4>
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-8">Try adjusting your search query</p>
                     <button onClick={() => setSearchQuery('')} className="px-8 py-3 bg-customer-text text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Clear Search</button>
                  </div>
                );
             }
             return sections;
          })()}
        </div>
      </div>

      {/* MOBILE STICKY CART ACTION - Matches Cart & Payment style */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-6 z-[70] animate-in slide-in-from-bottom-10 duration-700">
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => navigate('/cart')}
              className="group relative w-full h-16 bg-customer-text text-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] flex items-center justify-between px-2 overflow-hidden transition-all active:scale-[0.98]"
            >
              <div className="h-12 bg-white/10 rounded-xl px-6 flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag size={18} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-customer-accent rounded-full border-2 border-customer-text"></span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-black uppercase tracking-widest">{totalCartItems} Items</span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-30 italic">View Cart</span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-fraunces italic text-lg pr-4">
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
