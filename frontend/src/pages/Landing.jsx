import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { ChefHat, ArrowRight, ShieldAlert, Star, MapPin, Info, Smartphone } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const [isLoginEnabled, setIsLoginEnabled] = useState(true);
  const canvasRef = useRef(null);
  const heroScrollRef = useRef(null);

  // Status Check
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/auth/settings/user-login?restaurant=spice-lounge');
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
        // Redraw current
      }
    }

    function drawFrame(idx) {
      if (idx === lastDrawn) return;
      const img = frames[idx];
      if (!img) return;
      const cw = canvas.width, ch = canvas.height;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = Math.ceil(iw * scale), dh = Math.ceil(ih * scale);
      const dx = Math.floor((cw - dw) / 2), dy = Math.floor((ch - dh) / 2);
      ctx.fillStyle = '#FBF9F7';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
      lastDrawn = idx;
    }

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
    <div className="bg-[#FBF9F7] text-[#1C1917] font-sans selection:bg-[#C85C1A] selection:text-white pb-32">
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center mix-blend-difference text-white">
        <a href="#top" className="font-fraunces text-2xl tracking-tight italic font-black hover:text-[#C85C1A] transition-colors">Vinnod</a>
        <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest">
            <a href="#experience" className="hover:text-[#C85C1A] transition-colors">Philosophy</a>
            <a href="#menu" className="hover:text-[#C85C1A] transition-colors">Curations</a>
            <Link to="/login" className="hover:text-[#C85C1A] transition-colors">Staff Portal</Link>
        </div>
      </nav>

      <main id="top">
        {/* ── Cinematic Scroll Hero ── */}
        <section ref={heroScrollRef} className="h-[300vh] relative w-full">
          <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between p-6 md:p-12">
            
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover -z-10 mix-blend-multiply opacity-90" />
            
            <div className="mt-24 md:mt-32 max-w-4xl stagger-reveal">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-[1px] bg-[#1C1917]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Est. MMXXVI</span>
                </div>
                <h1 className="font-fraunces text-6xl md:text-[8rem] font-black leading-[0.9] tracking-tighter mb-8 text-[#1C1917]">
                    The ritual of <br />
                    <span className="italic text-[#C85C1A]">dining.</span>
                </h1>
                <p className="max-w-md text-sm md:text-base font-medium leading-relaxed uppercase tracking-wider text-[#1C1917]/70">
                    A cinematic sequence of flavors. Every element perfectly choreographed. 
                    Scroll to experience the unveiling of our legendary Gujarati Thali.
                </p>

                {!isLoginEnabled && (
                  <div className="mt-12 inline-flex items-center gap-3 bg-red-50 text-red-700 px-6 py-4 rounded-full border border-red-100">
                    <ShieldAlert size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Operations Halted by Management</span>
                  </div>
                )}

                <div className="mt-12 flex flex-col md:flex-row gap-6">
                    {isLoginEnabled ? (
                        <Link to="/menu?restaurant=spice-lounge&table=1" className="group inline-flex items-center justify-center gap-4 bg-[#1C1917] text-[#FBF9F7] px-10 py-5 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:bg-[#C85C1A] transition-all interactive-element">
                            Begin Journey <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <button disabled className="inline-flex items-center justify-center bg-gray-200 text-gray-400 px-10 py-5 rounded-full text-xs font-black uppercase tracking-[0.2em] cursor-not-allowed">
                            Service Offline
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-end pb-8 stagger-reveal">
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] rotate-180" style={{ writingMode: 'vertical-rl' }}>
                    Scroll to explore
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-[0.4em] mb-2 text-[#1C1917]/50">Location</div>
                    <div className="font-fraunces italic font-bold">Center District, 0x41</div>
                </div>
            </div>

          </div>
        </section>

        {/* ── Signature Curations (Featured Menu) ── */}
        <section id="menu" className="py-32 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 stagger-reveal">
              <div>
                <h2 className="font-fraunces text-5xl md:text-7xl font-black tracking-tighter text-[#1C1917] leading-none mb-6">
                  Signature <br/><span className="italic text-[#C85C1A]">Curations.</span>
                </h2>
                <div className="w-20 h-[1.5px] bg-[#C85C1A]"></div>
              </div>
              <p className="max-w-md text-sm font-medium uppercase tracking-[0.2em] text-[#1C1917]/40 leading-relaxed mt-8 md:mt-0">
                A preview of our daily ritual. Hand-selected ingredients, 
                translated into cinematic textures. 
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[
                { name: "Mango Lassi", img: "/images/mango_lassi.png", cat: "Beverages" },
                { name: "Garlic Naan", img: "/images/garlic_naan.png", cat: "Mains" },
                { name: "Signature Special", img: "/images/live_item.png", cat: "Live Selection" }
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer stagger-reveal">
                  <div className="aspect-[4/5] overflow-hidden rounded-[2rem] mb-6 relative">
                    <img 
                      src={item.img} 
                      alt={item.name} 
                      className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/20 to-transparent"></div>
                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur rounded-full text-[8px] font-black uppercase tracking-[0.2em]">
                      {item.cat}
                    </div>
                  </div>
                  <h3 className="font-fraunces text-2xl font-black italic tracking-tight text-[#1C1917] group-hover:text-[#C85C1A] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1C1917]/30 mt-2">Chef's Select Node 0x{i+1}</p>
                </div>
              ))}
            </div>

            <div className="mt-20 flex justify-center">
               <Link to="/menu?restaurant=spice-lounge&table=1" className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[#1C1917] hover:text-[#C85C1A] transition-all">
                  Access Full Repository <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
               </Link>
            </div>
          </div>
        </section>

        {/* ── Ritual Schedule (Opening Times) ── */}
        <section className="py-32 px-6 md:px-12 bg-[#FBF9F7] border-t border-[#1C1917]/5">
           <div className="max-w-4xl mx-auto text-center stagger-reveal">
              <div className="flex items-center justify-center gap-4 mb-10">
                 <div className="w-12 h-[1px] bg-[#C85C1A]/30"></div>
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C85C1A]">Temporal Matrix</span>
                 <div className="w-12 h-[1px] bg-[#C85C1A]/30"></div>
              </div>
              <h2 className="font-fraunces text-6xl md:text-8xl font-black italic tracking-tighter text-[#1C1917] mb-16">
                 Ritual <br/>Schedule.
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24">
                 <div className="p-12 bg-white rounded-[3rem] shadow-sm border border-[#1C1917]/5 interactive-element">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1C1917]/30 mb-6">Culinary Flow</div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center border-b border-[#1C1917]/5 pb-4">
                          <span className="font-bold text-sm">Mon — Fri</span>
                          <span className="font-fraunces italic font-bold text-lg">11:00 — 23:00</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-[#1C1917]/5 pb-4">
                          <span className="font-bold text-sm">Sat — Sun</span>
                          <span className="font-fraunces italic font-bold text-lg">10:00 — 00:00</span>
                       </div>
                    </div>
                 </div>

                 <div className="p-12 bg-[#1C1917] text-[#FBF9F7] rounded-[3rem] shadow-2xl relative overflow-hidden interactive-element">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C85C1A]/10 rounded-full blur-3xl"></div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FBF9F7]/30 mb-6">Current Status</div>
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                       <div className="font-fraunces text-4xl font-black italic">Live Protocol</div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-[#FBF9F7]/40 leading-relaxed max-w-[150px]">
                          Node spice-lounge is currently operational.
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