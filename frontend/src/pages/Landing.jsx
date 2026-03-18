/**
 * Landing.jsx
 *
 * Cinematic landing page for Vinnod Dining Hall.
 * Optimized with IntersectionObserver for smooth reveals and RAF for 3D animation.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  ChefHat, 
  ArrowRight, 
  ShieldAlert, 
  Globe, 
  Star, 
  ArrowDown, 
  MapPin, 
  Smartphone,
  Info
} from 'lucide-react';
import './landing.css';

export default function Landing() {
  const [isLoginEnabled, setIsLoginEnabled] = useState(true);

  /* --- Animation Refs --- */
  const canvasRef       = useRef(null);
  const heroScrollRef   = useRef(null);
  const heroProgressRef = useRef(null);
  const loadingRef      = useRef(null);
  const loadingFillRef  = useRef(null);
  const loadingPctRef   = useRef(null);

  /* --- Intersection Observer for Smooth Section Reveals --- */
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vdh-reveal--active');
          // Scale reveals use a slightly different class
          if (entry.target.classList.contains('vdh-reveal-scale')) {
            entry.target.classList.add('vdh-reveal-scale--active');
          }
        }
      });
    }, { threshold: 0.1 });

    const revealElements = document.querySelectorAll('.vdh-reveal, .vdh-reveal-scale');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  /* --- Fetch Status --- */
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

  /* --- 3D Frame Animation Logic --- */
  useEffect(() => {
    const canvas       = canvasRef.current;
    const heroScroll   = heroScrollRef.current;
    const heroProgress = heroProgressRef.current;
    const progressBar  = heroProgress?.querySelector('.vdh-hero__progressBar');
    const loading      = loadingRef.current;
    const loadingFill  = loadingFillRef.current;
    const loadingPct   = loadingPctRef.current;

    if (!(canvas instanceof HTMLCanvasElement) || !heroScroll) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const FRAME_COUNT = 192;
    const FRAME_PATH  = (i) => {
      const n = String(i).padStart(3, '0');
      return `/hero_images/ezgif-frame-${n}.jpg`;
    };

    /** @type {(HTMLImageElement | null)[]} */
    const frames      = Array.from({ length: FRAME_COUNT }, () => null);
    let   loadedCount = 0;
    let   lastDrawn   = -1;

    const dpr = () => Math.min(2, window.devicePixelRatio || 1);
    const clamp01 = (n) => Math.max(0, Math.min(1, n));
    const clampInt = (n, lo, hi) => Math.max(lo, Math.min(hi, n | 0));

    function resizeCanvas() {
      const ratio = dpr();
      const w = Math.floor(canvas.clientWidth  * ratio);
      const h = Math.floor(canvas.clientHeight * ratio);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        drawFrame(getFrameIndex(getScrollProgress()));
      }
    }

    function getScrollProgress() {
      const rect     = heroScroll.getBoundingClientRect();
      const scrollable = heroScroll.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return clamp01(-rect.top / scrollable);
    }

    function getFrameIndex(progress01) {
      const raw = 1 + progress01 * (FRAME_COUNT - 1);
      return clampInt(Math.round(raw), 1, FRAME_COUNT);
    }

    function coverDraw(img) {
      const cw = canvas.width,  ch = canvas.height;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      if (!iw || !ih) return;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = Math.ceil(iw * scale),  dh = Math.ceil(ih * scale);
      const dx = Math.floor((cw - dw) / 2), dy = Math.floor((ch - dh) / 2);
      ctx.fillStyle = '#FBF7F0';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function drawFrame(frameIdx1Based) {
      const idx = frameIdx1Based - 1;
      if (idx === lastDrawn) return;
      const img = frames[idx];
      if (!img) return;
      coverDraw(img);
      lastDrawn = idx;
    }

    function updateLoadingUI() {
      const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
      if (loadingFill) loadingFill.style.width = `${pct}%`;
      if (loadingPct)  loadingPct.textContent  = `${pct}%`;
      if (loadedCount >= FRAME_COUNT && loading) {
        loading.style.opacity      = '0';
        loading.style.pointerEvents = 'none';
        setTimeout(() => loading?.remove(), 600);
      }
    }

    function loadAllFrames() {
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src   = FRAME_PATH(i);
        img.onload = () => {
          frames[i - 1] = img;
          loadedCount++;
          updateLoadingUI();
          if (lastDrawn === -1 && i === 1) drawFrame(1);
        };
        img.onerror = () => {
          loadedCount++;
          updateLoadingUI();
        };
      }
    }

    /* --- Smoothed Scroll Engine --- */
    let targetY   = window.scrollY || 0;
    let smoothY   = targetY;
    const SMOOTHING = 0.12; 
    let rafId;

    function tick() {
      targetY = window.scrollY || 0;
      smoothY = smoothY + (targetY - smoothY) * SMOOTHING;

      const heroTop    = heroScroll.getBoundingClientRect().top + (window.scrollY || 0);
      const scrollable = heroScroll.offsetHeight - window.innerHeight;
      const progress   = scrollable <= 0 ? 0 : clamp01((smoothY - heroTop) / scrollable);

      const frameIdx = getFrameIndex(progress);
      drawFrame(frameIdx);

      if (progressBar) progressBar.style.height = `${Math.round(progress * 100)}%`;
      rafId = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(canvas);
    window.addEventListener('resize', resizeCanvas, { passive: true });

    resizeCanvas();
    loadAllFrames();
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="landingRoot">
      
      {/* ── Navigation ────────────────────────────────────────────────── */}
      <header className="vdh-nav">
        <div className="vdh-nav__inner">
          <a className="vdh-brand group" href="#top">
            <div className="vdh-brand__mark shadow-[0_0_20px_rgba(200,92,26,0.2)] group-hover:rotate-12 transition-transform duration-500" />
            <span>Vinnod</span>
          </a>
          <nav className="vdh-nav__links">
            <a href="#experience">Heritage</a>
            <a href="#menu">Cuisine</a>
            <a href="#gallery">Space</a>
            <div className="flex gap-4 items-center pl-6 border-l border-zinc-200 ml-4">
               <Link className="vdh-btn vdh-btn--sm !bg-zinc-100 !text-zinc-950 hover:!bg-zinc-200 !shadow-none" to="/qr-preview">
                  <Smartphone size={14} className="mr-2" /> QR Preview
               </Link>
               <Link className="vdh-btn vdh-btn--sm" to="/login">
                  <ChefHat size={14} className="mr-2" /> Staff Portal
               </Link>
            </div>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ── Hero Section ───────────────────────────────────────────── */}
        <section className="vdh-hero">
          <div className="vdh-hero__scroll" id="heroScroll" ref={heroScrollRef}>
            <div className="vdh-hero__sticky">
              <canvas className="vdh-hero__canvas" ref={canvasRef} />
              <div className="vdh-hero__overlay" />

              <div className="vdh-container vdh-hero__content">
                <div className="vdh-hero__kicker flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
                   <Star size={12} fill="#C85C1A" className="text-customer-accent" />
                   ESTABLISHED MMXXVI
                </div>
                
                <h1 className="vdh-hero__title animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
                  Culinary precision,<br/>
                  <span className="opacity-40 font-fraunces">Modern hospitality.</span>
                </h1>

                {!isLoginEnabled && (
                  <div className="mb-10 flex animate-in slide-in-from-left-4 duration-1000">
                    <div className="flex items-center gap-3 bg-red-500/10 text-red-500 p-4 rounded-[1.5rem] border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                       <ShieldAlert size={20} className="animate-pulse" />
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest italic leading-none">System Status: Restricted</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-1">Orders currently disabled by management</span>
                       </div>
                    </div>
                  </div>
                )}

                <p className="vdh-hero__subtitle animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                  Witness the choreographed assembly of our legendary Gujarati Thali. 
                  A journey rendered in cinematic frame-by-frame detail.
                </p>

                <div className="vdh-hero__cta animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                  {isLoginEnabled ? (
                    <Link className="vdh-btn group" to="/menu?restaurant=spice-lounge&table=1">
                      Begin Culinary Journey <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <button className="vdh-btn opacity-20 pointer-events-none grayscale" disabled>
                      Service Halted
                    </button>
                  )}
                  <a className="vdh-btn vdh-btn--ghost !text-customer-text !border-zinc-200 hover:!bg-zinc-50" href="#experience">The Philosophy</a>
                </div>
              </div>

              <div className="vdh-hero__progress" ref={heroProgressRef}><div className="vdh-hero__progressBar" /></div>
              <div className="vdh-hero__hint">
                <span className="vdh-hero__hintDot" />
                <span className="mt-2">Scroll To Explore</span>
              </div>

              <div className="vdh-hero__loading" ref={loadingRef}>
                <div className="vdh-hero__loadingCard">
                   <div className="w-16 h-16 bg-white/[0.05] border border-white/[0.1] rounded-full mx-auto mb-8 flex items-center justify-center">
                      <Globe size={32} className="text-zinc-600 animate-pulse" />
                   </div>
                  <div className="vdh-hero__loadingTitle">Initializing cinematic reveal</div>
                  <div className="vdh-hero__loadingBar"><div className="vdh-hero__loadingFill" ref={loadingFillRef} /></div>
                  <div className="vdh-hero__loadingPct" ref={loadingPctRef}>0%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Experience Section ────────────────────────────────────────── */}
        <section className="vdh-section bg-[#FBF7F0]" id="experience">
          <div className="vdh-container">
            <div className="vdh-grid">
              <div className="vdh-reveal">
                <div className="flex items-center gap-2 mb-6">
                   <div className="w-1 h-5 bg-customer-accent"></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Environment</span>
                </div>
                <h2 className="vdh-section__title">
                  A sanctuary for <span className="text-customer-accent">intentional dining</span> in a noisy world.
                </h2>
                <p className="vdh-section__copy leading-relaxed">
                  Our architecture celebrates the ritual of the meal. Using organic materials, 
                  ambient acoustics, and a digital ordering flow designed to disappear, 
                  we ensure that the only thing requiring your attention is the food and your guests.
                </p>
                <div className="vdh-stats">
                  <div className="vdh-stat vdh-reveal vdh-delay-1">
                    <div className="vdh-stat__num">100%</div>
                    <div className="vdh-stat__label">Organic Spices</div>
                  </div>
                  <div className="vdh-stat vdh-reveal vdh-delay-2">
                    <div className="vdh-stat__num">12ms</div>
                    <div className="vdh-stat__label">Kitchen Latency</div>
                  </div>
                </div>
              </div>
              
              <div className="vdh-card bg-zinc-950 text-white border-none shadow-[0_50px_100px_rgba(0,0,0,0.15)] overflow-hidden relative vdh-reveal-scale vdh-delay-3">
                <div className="absolute top-0 right-0 w-32 h-32 bg-customer-accent/10 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
                <div className="vdh-card__eyebrow mb-8 flex items-center gap-2 text-white">
                   <div className="w-2 h-2 rounded-full bg-customer-accent animate-pulse"></div>
                   LIVE OPERATIONAL PROTOCOL
                </div>
                <ul className="vdh-list !mb-0 border-white/5">
                  <li className="flex justify-between items-center px-0 border-white/10">
                     <span className="font-syne font-bold uppercase text-[10px] tracking-widest text-zinc-500 italic">Chef In Charge</span>
                     <span className="text-customer-accent font-black tracking-widest text-xs uppercase">Gordon Matrix</span>
                  </li>
                  <li className="flex justify-between items-center px-0 border-white/10">
                     <span className="font-syne font-bold uppercase text-[10px] tracking-widest text-zinc-500 italic">Current Mood</span>
                     <span className="text-white font-black tracking-widest text-xs uppercase">Zen / Productive</span>
                  </li>
                  <li className="flex justify-between items-center px-0 border-none">
                     <span className="font-syne font-bold uppercase text-[10px] tracking-widest text-zinc-500 italic">Queue Count</span>
                     <span className="text-emerald-500 font-black tracking-widest text-xs uppercase">Optimal</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Cuisine Section ───────────────────────────────────────────── */}
        <section className="vdh-section vdh-section--alt" id="menu">
          <div className="vdh-container text-center flex flex-col items-center">
            <div className="vdh-reveal">
              <h2 className="vdh-section__title">The Assembly</h2>
              <p className="vdh-section__copy vdh-section__copy--wide mx-auto">
                Each component of the Vinnod Thali is meticulously curated to provide 
                a balance of sweet, spicy, salty, and sour. Our menu shifts with the seasons.
              </p>
            </div>
            <div className="vdh-pillRow justify-center mt-8 vdh-reveal vdh-delay-1">
              <span className="vdh-pill border-zinc-200 text-zinc-500 hover:border-customer-accent hover:text-customer-accent">Signature Entrées</span>
              <span className="vdh-pill border-zinc-200 text-zinc-500 hover:border-customer-accent hover:text-customer-accent">Regional Specialties</span>
              <span className="vdh-pill border-zinc-200 text-zinc-500 hover:border-customer-accent hover:text-customer-accent">Liquid Alchemy</span>
            </div>
          </div>
        </section>

        {/* ── Reservation & Location Section ────────────────────────────── */}
        <section className="vdh-section pb-32" id="gallery">
          <div className="vdh-container">
            <div className="vdh-reserve vdh-reveal-scale p-16 md:p-32 bg-customer-text text-white rounded-[4rem] shadow-3xl relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(200,92,26,0.15),transparent_70%)] opacity-50"></div>
               
               <div className="vdh-reveal vdh-delay-1">
                  <h2 className="vdh-section__title !text-white !max-w-none mb-8">Secure your space.</h2>
                  <p className="text-white/40 font-bold uppercase tracking-[0.4em] text-[10px] mb-12 italic">Exclusive dining slots released weekly.</p>
                  
                  <div className="flex flex-col gap-8">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-customer-accent">
                           <MapPin size={24} />
                        </div>
                        <div>
                           <div className="text-[10px] font-black tracking-widest opacity-40 uppercase mb-1">Location Node</div>
                           <div className="font-fraunces italic font-bold text-xl">Center District, 0x41 Sector</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-customer-accent">
                           <Info size={24} />
                        </div>
                        <div>
                           <div className="text-[10px] font-black tracking-widest opacity-40 uppercase mb-1">Service Window</div>
                           <div className="font-fraunces italic font-bold text-xl">11:00 — 23:00 DAILY</div>
                        </div>
                     </div>
                  </div>
               </div>

               <form className="vdh-form relative z-10 vdh-reveal vdh-delay-2" onSubmit={(e) => { e.preventDefault(); alert('Reservation protocol initiated.'); }}>
                  <label className="vdh-field">
                     <span>Guest Identity</span>
                     <input required placeholder="Your Full Name" />
                  </label>
                  <label className="vdh-field">
                     <span>Contact Node</span>
                     <input required placeholder="Phone or Email" />
                  </label>
                  <button className="vdh-btn !bg-customer-accent !text-white h-[70px] mt-4" type="submit">
                     Request Access
                  </button>
               </form>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="vdh-footer bg-white">
        <div className="vdh-container vdh-footer__inner">
          <div className="flex items-center gap-12">
            <a className="vdh-brand vdh-brand--muted opacity-20 italic !text-sm flex items-center gap-4 group" href="#top">
               <div className="w-6 h-6 bg-zinc-400 rounded-md" />
               <span className="font-fraunces">Vinnod Network</span>
            </a>
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-4">
               <span className="w-1 h-1 rounded-full bg-zinc-200"></span> 
               BY CORE SYSTEMS © {new Date().getFullYear()}
            </span>
          </div>
          <a className="group flex items-center gap-3 text-xs font-black uppercase tracking-widest italic text-zinc-400 hover:text-customer-accent transition-colors" href="#top">
             RE-ENTER FLOW <ArrowDown size={14} className="rotate-180 group-hover:-translate-y-1 transition-transform" />
          </a>
        </div>
      </footer>
    </div>
  );
}