import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCartStore } from '../store';
import { ChefHat, ArrowRight, ShieldAlert, Star, MapPin, Info, Smartphone, Clock, Zap, RotateCcw } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const navigate = useNavigate();
  const { tableNumber } = useParams();
  const isTableOrder = !!tableNumber;
  const menuPath = '/menu';
  const [isLoginEnabled, setIsLoginEnabled] = useState(true);
  const canvasRef = useRef(null);
  const heroScrollRef = useRef(null);

  const { isSessionValid, activeOrders, restaurantSlug, tableNumber: sessionTable, destroySession, setContext } = useCartStore();
  const hasValidSession = isSessionValid();
  const hasActiveOrder = hasValidSession && activeOrders && activeOrders.length > 0;

  // Pre-populate session with table number if arriving from QR
  useEffect(() => {
    if (tableNumber) {
      setContext(null, tableNumber);
    }
  }, [tableNumber, setContext]);

  // Auto-destroy expired sessions on mount
  useEffect(() => {
    const { sessionCreatedAt, restaurantId } = useCartStore.getState();
    if (sessionCreatedAt && restaurantId && !isSessionValid()) {
      destroySession();
    }
  }, []);

  // Status Check
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/auth/settings/user-login?restaurant=vinnod');
        setIsLoginEnabled(res.data.enabled !== false);
      } catch (err) {
        setIsLoginEnabled(true);
      }
    };
    fetchStatus();
  }, []);

  // GSAP Animations
  useEffect(() => {
    gsap.utils.toArray('.stagger-reveal').forEach((el) => {
      gsap.fromTo(el, 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  }, []);

  // Frame Sequence Logic 
  useEffect(() => {
    const canvas = canvasRef.current;
    const heroScroll = heroScrollRef.current;
    if (!(canvas instanceof HTMLCanvasElement) || !heroScroll) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const FRAME_COUNT = 192;
    const FRAME_PATH = (i) => `/hero_images/ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
    const frames = Array.from({ length: FRAME_COUNT }, () => null);

    let lastDrawn = -1;
    const clamp01 = (n) => Math.max(0, Math.min(1, n));

    function resizeCanvas() {
      const w = Math.floor(canvas.clientWidth * window.devicePixelRatio);
      const h = Math.floor(canvas.clientHeight * window.devicePixelRatio);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
    }

    function drawFrame(idx) {
      if (idx === lastDrawn) return;
      const img = frames[idx];
      if (!img) return;
      const cw = canvas.width, ch = canvas.height;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = cw < ch ? (cw / iw) * 1.5 : Math.max(cw / iw, ch / ih);
      const dw = Math.ceil(iw * scale), dh = Math.ceil(ih * scale);
      const dx = Math.floor((cw - dw) / 2), dy = Math.floor((ch - dh) / 2);
      ctx.fillStyle = '#FBF9F7';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
      lastDrawn = idx;
    }

    // Prefetch
    for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src = FRAME_PATH(i);
        img.onload = () => {
            frames[i - 1] = img;
            if (i === 1) drawFrame(0);
        };
    }

    let smoothY = window.scrollY;
    let targetY = window.scrollY;
    let rafId;

    function tick() {
      targetY = window.scrollY;
      smoothY += (targetY - smoothY) * 0.12;

      const heroTop = heroScroll.getBoundingClientRect().top + window.scrollY;
      const scrollable = heroScroll.offsetHeight - window.innerHeight;
      const progress = scrollable <= 0 ? 0 : clamp01((smoothY - heroTop) / scrollable);
      
      const frameIdx = Math.floor(progress * (FRAME_COUNT - 1));
      drawFrame(frameIdx);

      rafId = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(canvas);
    window.addEventListener('resize', resizeCanvas);
    
    resizeCanvas();
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="bg-[#FBF9F7] text-[#1C1917] font-jakarta selection:bg-[#C85C1A] selection:text-white pb-32">
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between md:justify-between items-center mix-blend-difference text-white">
        <div className="w-full flex justify-center md:justify-start">
            <a href="#top" className="font-fraunces text-2xl tracking-tight italic font-black hover:text-[#C85C1A] transition-colors">Vinnod</a>
        </div>
        <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[0.3em]">
            <a href="#experience" className="hover:text-[#C85C1A] transition-colors">About Us</a>
            <a href="#menu" className="hover:text-[#C85C1A] transition-colors">Menu</a>
            <Link to="/login" className="hover:text-[#C85C1A] transition-colors">Staff Portal</Link>
        </div>
      </nav>

      <main id="top">
        {/* ── Cinematic Scroll Hero ── */}
        <section ref={heroScrollRef} className="h-[250vh] md:h-[300vh] relative w-full">
          <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col justify-between py-12 md:py-24 px-8 md:px-24">
            
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover -z-10 mix-blend-multiply opacity-95" />
            
            <div className="stagger-reveal text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4 md:mb-6 select-none">
                    <div className="w-8 md:w-12 h-[1px] bg-[#1C1917]/30"></div>
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-[#C85C1A]">Est. 2007</span>
                </div>
                <h1 className="font-fraunces text-4xl sm:text-5xl md:text-[8rem] font-black leading-[0.9] tracking-tighter mb-4 md:mb-6 drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] select-none">
                    <span className="inline-block bg-[linear-gradient(110deg,#FBF9F7,45%,#C85C1A,55%,#FBF9F7)] bg-[length:200%_100%] bg-clip-text text-transparent animate-text-shine">The ritual of</span> <span className="italic text-[#FBF9F7] bg-clip-text bg-gradient-to-r from-[#C85C1A] to-[#E85C1A] text-transparent drop-shadow-xl">dining.</span>
                </h1>
                {!isLoginEnabled && (
                  <div className="mt-6 inline-flex items-center gap-3 bg-red-50 text-red-700 px-6 py-4 rounded-full border border-red-100 shadow-sm">
                    <ShieldAlert size={16} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Currently Closed</span>
                  </div>
                )}
            </div>

            <div className="w-full flex flex-col items-center gap-8 md:gap-12 stagger-reveal">
                <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto justify-center">
                    {isLoginEnabled ? (
                      <>
                        {/* Primary CTA — session-aware */}
                        {hasActiveOrder ? (
                          <button 
                            onClick={() => navigate(`/order-status/${activeOrders[0]}`)} 
                            className="group flex items-center justify-center gap-6 bg-[#C85C1A] text-[#FBF9F7] px-16 py-6 rounded-full text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#1C1917] transition-all hover:shadow-[0_20px_40px_rgba(200,92,26,0.3)] active:scale-95"
                          >
                            Resume Your Order <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                          </button>
                        ) : hasValidSession ? (
                          <Link to={`/menu`} className="group flex items-center justify-center gap-6 bg-[#1C1917] text-[#FBF9F7] px-16 py-6 rounded-full text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#C85C1A] transition-all hover:shadow-[0_20px_40px_rgba(200,92,26,0.3)] active:scale-95">
                            Continue to Menu <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                          </Link>
                        ) : (
                          <Link to={menuPath} className="group flex items-center justify-center gap-6 bg-[#1C1917] text-[#FBF9F7] px-16 py-6 rounded-full text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#C85C1A] transition-all hover:shadow-[0_20px_40px_rgba(200,92,26,0.3)] active:scale-95">
                            Order Online <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                          </Link>
                        )}

                        {/* Secondary: New Session (only if session exists) */}
                        {hasValidSession && (
                          <button 
                            onClick={() => { destroySession(); navigate(menuPath); }}
                            className="group flex items-center justify-center gap-4 bg-[#C85C1A] text-[#FBF9F7] border-2 border-[#1C1917]/10 text-[#1C1917]/50 px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:border-[#C85C1A]/30 hover:text-[#C85C1A] transition-all active:scale-95"
                          >
                            <RotateCcw size={14} /> New Session
                          </button>
                        )}
                      </>
                    ) : (
                        <button disabled className="flex items-center justify-center bg-gray-100 text-gray-400 px-16 py-6 rounded-full text-[11px] font-black uppercase tracking-[0.4em] cursor-not-allowed">
                            We're Closed
                        </button>
                    )}
                </div>

                <div className="w-full flex justify-between items-end pb-4 pointer-events-none">
                    <div className="flex flex-col items-center gap-4 animate-bounce">
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] rotate-180" style={{ writingMode: 'vertical-rl' }}>
                          Scroll
                      </span>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] font-black uppercase tracking-[0.4em] mb-2 text-[#C85C1A]/60">Est. 2007</div>
                        <div className="font-fraunces italic font-black text-xs md:text-base">Upleta, Gujarat</div>
                    </div>
                </div>
            </div>

          </div>
        </section>

        {/* ── Signature Curations (Featured Menu) ── */}
        <section id="menu" className="py-24 md:py-40 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-20 stagger-reveal text-center md:text-left">
              <div className="flex flex-col items-center md:items-start">
                <h2 className="font-fraunces text-5xl md:text-[6.5rem] font-black tracking-tighter text-[#1C1917] leading-[0.9] mb-8">
                  Our <br/><span className="italic text-[#C85C1A]">Specialties.</span>
                </h2>
                <div className="w-24 h-[1.5px] bg-[#C85C1A]"></div>
              </div>
              <p className="max-w-[280px] md:max-w-md text-[10px] md:text-sm font-black uppercase tracking-[0.3em] text-[#1C1917]/40 leading-relaxed mt-10 md:mt-0">
                Fresh, hand-picked ingredients prepared daily 
                with love and tradition for your table.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16">
              {[
                { name: "Mango Lassi", img: "/images/mango_lassi.png", cat: "Beverages" },
                { name: "Garlic Naan", img: "/images/garlic_naan.png", cat: "Mains" },
                { name: "Signature Special", img: "/images/live_item.png", cat: "Live Selection" }
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer stagger-reveal">
                  <div className="aspect-[4/5] overflow-hidden rounded-[2.5rem] mb-8 relative shadow-sm transition-shadow hover:shadow-2xl">
                    <img 
                      src={item.img} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/40 to-transparent opacity-60"></div>
                    <div className="absolute top-8 left-8 px-5 py-2 bg-white/95 backdrop-blur rounded-full text-[8px] font-black uppercase tracking-[0.3em] shadow-lg">
                      {item.cat}
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="font-fraunces text-3xl font-black italic tracking-tight text-[#1C1917] group-hover:text-[#C85C1A] transition-colors leading-none">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-4 text-[9px] font-black uppercase tracking-[0.4em] text-[#1C1917]/20">
                      <Zap size={10} className="text-[#C85C1A] opacity-50" /> Chef's Pick
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── Ritual Schedule (Opening Times) ── */}
        <section className="py-24 md:py-40 px-6 md:px-12 bg-[#FBF9F7] border-t border-[#1C1917]/5 overflow-hidden">
           <div className="max-w-5xl mx-auto text-center stagger-reveal">
              <div className="flex items-center justify-center gap-6 mb-12">
                 <div className="w-12 h-[1px] bg-[#C85C1A]/25"></div>
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#C85C1A]">Our Hours</span>
                 <div className="w-12 h-[1px] bg-[#C85C1A]/25"></div>
              </div>
              <h2 className="font-fraunces text-6xl md:text-[9rem] font-black italic tracking-tighter text-[#1C1917] mb-12 md:mb-20 leading-[0.85]">
                 Opening <br/>Hours.
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                 <div className="p-10 md:p-14 bg-white rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.02)] border border-[#1C1917]/5 relative group">
                    <div className="absolute top-10 right-10 text-zinc-100 group-hover:text-indigo-500/10 transition-colors">
                      <Clock size={80} strokeWidth={1} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1C1917]/20 mb-10 text-left relative z-10">Weekly Schedule</div>
                    <div className="space-y-6 relative z-10">
                       <div className="flex justify-between items-center border-b border-[#1C1917]/5 pb-6">
                          <span className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Weekdays</span>
                          <span className="font-fraunces italic font-black text-xl md:text-2xl text-[#1C1917]">11:00 — 23:00</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-[#1C1917]/5 pb-6">
                          <span className="font-black text-[10px] uppercase tracking-widest text-[#C85C1A]/60">Weekend</span>
                          <span className="font-fraunces italic font-black text-xl md:text-2xl text-[#1C1917]">10:00 — 00:00</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-10 md:p-14 bg-[#1C1917] text-[#FBF9F7] rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] relative overflow-hidden group min-h-[320px] flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#C85C1A]/10 rounded-full blur-[100px] group-hover:bg-[#C85C1A]/20 transition-all duration-700"></div>
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FBF9F7]/20 mb-10 text-center relative z-10">Restaurant Status</div>
                    <div className="flex flex-col items-center gap-6 relative z-10">
                       <div className="w-5 h-5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.6)]"></div>
                       <div className="font-fraunces text-4xl md:text-5xl font-black italic tracking-tighter">Now Open</div>
                       <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FBF9F7]/40 leading-relaxed max-w-[200px] text-center">
                          We are currently welcoming guests.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

      </main>
    </div>
  );
}