/**
 * Landing.jsx
 *
 * Optimized cinematic landing page.
 * Uses the same 192-frame canvas sequence for the hero.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { ChefHat, ArrowRight, ShieldAlert, Globe, Star, ArrowDown, MapPin } from 'lucide-react';
import './landing.css';

export default function Landing() {
  const [isLoginEnabled, setIsLoginEnabled] = useState(true);

  /* --- Refs --- */
  const canvasRef       = useRef(null);
  const heroScrollRef   = useRef(null);
  const heroProgressRef = useRef(null);
  const loadingRef      = useRef(null);
  const loadingFillRef  = useRef(null);
  const loadingPctRef   = useRef(null);

  /* --- Fetch Login Status --- */
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/auth/settings/user-login?restaurant=spice-lounge');
        setIsLoginEnabled(res.data.enabled !== false);
      } catch (err) {
        console.error('Failed to fetch login status');
      }
    };
    fetchStatus();
  }, []);

  /* --- Animation Effect --- */
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

    const frames     = Array.from({ length: FRAME_COUNT }, () => null);
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
      const passed = -rect.top;
      return clamp01(passed / scrollable);
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
      ctx.fillStyle = '#0a0a0b';
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
        const img    = new Image();
        img.src      = FRAME_PATH(i);
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

    let targetY   = window.scrollY || 0;
    let smoothY   = targetY;
    const SMOOTHING = 0.1;
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
      
      {/* --- Navigation --- */}
      <header className="vdh-nav">
        <div className="vdh-nav__inner">
          <a className="vdh-brand group" href="#top">
            <div className="vdh-brand__mark shadow-[0_0_20px_rgba(200,92,26,0.3)] group-hover:rotate-12 transition-transform duration-500" />
            <span>Vinnod</span>
          </a>
          <nav className="vdh-nav__links">
            <a href="#experience">Heritage</a>
            <a href="#menu">Cuisine</a>
            <a href="#gallery">Space</a>
            <div className="flex gap-4 items-center">
               <Link className="vdh-btn vdh-btn--sm" to="/login">
                  <ChefHat size={14} className="mr-2" /> Staff Dashboard
               </Link>
            </div>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* --- Hero --- */}
        <section className="vdh-hero">
          <div className="vdh-hero__scroll" id="heroScroll" ref={heroScrollRef}>
            <div className="vdh-hero__sticky">
              <canvas className="vdh-hero__canvas" ref={canvasRef} />
              <div className="vdh-hero__overlay" />

              <div className="vdh-container vdh-hero__content">
                <div className="vdh-hero__kicker flex items-center gap-3">
                   <Star size={12} fill="#C85C1A" className="text-customer-accent" />
                   ESTABLISHED MMXXVI
                </div>
                
                <h1 className="vdh-hero__title">
                  Culinary precision,<br/>
                  <span className="opacity-40">Modern hospitality.</span>
                </h1>

                {!isLoginEnabled && (
                  <div className="mb-10 flex animate-in slide-in-from-left-4 duration-1000">
                    <div className="flex items-center gap-3 bg-red-500/10 text-red-400 p-4 rounded-[1.5rem] border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                       <ShieldAlert size={20} className="animate-pulse" />
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest italic leading-none">Status: Maintenance State</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-1">Orders currently restricted by owner</span>
                       </div>
                    </div>
                  </div>
                )}

                <p className="vdh-hero__subtitle">
                  Scroll to witness the assembly of the legendary Vinnod Thali — 
                  a culinary journey rendered in cinematic frame-by-frame detail.
                </p>

                <div className="vdh-hero__cta">
                  {isLoginEnabled ? (
                    <Link className="vdh-btn group" to="/menu?restaurant=spice-lounge&table=1">
                      Begin Your Experience <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <button className="vdh-btn opacity-20 pointer-events-none grayscale" disabled>
                      Service Halted
                    </button>
                  )}
                  <a className="vdh-btn vdh-btn--ghost" href="#experience">Explore The Space</a>
                </div>
              </div>

              {/* Scroll indicators */}
              <div className="vdh-hero__progress" ref={heroProgressRef}><div className="vdh-hero__progressBar" /></div>
              <div className="vdh-hero__hint">
                <span className="vdh-hero__hintDot" />
                <span className="mt-2">Scroll To Discover</span>
              </div>

              {/* Loading sequence */}
              <div className="vdh-hero__loading" ref={loadingRef}>
                <div className="vdh-hero__loadingCard">
                   <div className="w-16 h-16 bg-white/[0.05] border border-white/[0.1] rounded-full mx-auto mb-8 flex items-center justify-center">
                      <Globe size={32} className="text-zinc-600 animate-pulse" />
                   </div>
                  <div className="vdh-hero__loadingTitle">Initializing cinematic experience</div>
                  <div className="vdh-hero__loadingBar"><div className="vdh-hero__loadingFill" ref={loadingFillRef} /></div>
                  <div className="vdh-hero__loadingPct" ref={loadingPctRef}>0%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Experience Section --- */}
        <section className="vdh-section bg-[#FBF7F0]" id="experience">
          <div className="vdh-container">
            <div className="vdh-grid">
              <div>
                <div className="flex items-center gap-2 mb-6">
                   <div className="w-1 h-5 bg-customer-accent"></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Atmosphere</span>
                </div>
                <h2 className="vdh-section__title">
                  A sanctuary for <span className="text-customer-accent">slow dining</span> in a fast world.
                </h2>
                <p className="vdh-section__copy leading-loose">
                  Our hall is designed as a digital first, hospitality always environment. 
                  Every surface, every light choice, and every digital touchpoint is tuned 
                  to provide a seamless bridge between you and our kitchen.
                </p>
                <div className="vdh-stats">
                  <div className="vdh-stat">
                    <div className="vdh-stat__num">98%</div>
                    <div className="vdh-stat__label">Freshness index</div>
                  </div>
                  <div className="vdh-stat">
                    <div className="vdh-stat__num">240+</div>
                    <div className="vdh-stat__label">Guest Capacity</div>
                  </div>
                </div>
              </div>
              
              <div className="vdh-card bg-zinc-950 text-white border-none shadow-[0_50px_100px_rgba(0,0,0,0.1)]">
                <div className="vdh-card__eyebrow mb-8 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-customer-accent animate-pulse"></div>
                   LIVE NETWORK STATUS
                </div>
                <p className="text-sm font-medium text-zinc-500 mb-8 italic">Verified Node: 0xV3-DININGHALL</p>
                <ul className="vdh-list !mb-0 border-zinc-800">
                  <li className="flex justify-between items-center px-0 border-zinc-800">
                     <span className="font-syne font-bold uppercase text-[11px] tracking-widest text-zinc-400 italic">Menu Version</span>
                     <span className="text-customer-accent font-black tracking-widest text-xs">V.4.1 LIVE</span>
                  </li>
                  <li className="flex justify-between items-center px-0 border-zinc-800">
                     <span className="font-syne font-bold uppercase text-[11px] tracking-widest text-zinc-400 italic">Order Protocol</span>
                     <span className="text-zinc-600 font-black tracking-widest text-xs">QR-AUTOSYNC</span>
                  </li>
                  <li className="flex justify-between items-center px-0 border-none">
                     <span className="font-syne font-bold uppercase text-[11px] tracking-widest text-zinc-400 italic">Latency</span>
                     <span className="text-emerald-500 font-black tracking-widest text-xs">12MS</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* --- Cuisine Section --- */}
        <section className="vdh-section vdh-section--alt" id="menu">
          <div className="vdh-container text-center flex flex-col items-center">
            <h2 className="vdh-section__title">Crafted Flavors</h2>
            <p className="vdh-section__copy vdh-section__copy--wide mx-auto">
              Our signature Gujarati thali is balanced for nutrition, variety, and the authentic taste of the region.
              Scan the QR at your table to explore the full visual menu.
            </p>
            <div className="vdh-pillRow justify-center">
              <span className="vdh-pill bg-zinc-100 hover:bg-customer-accent hover:text-white border-none shadow-sm">Vegetarian Originals</span>
              <span className="vdh-pill bg-zinc-100 hover:bg-customer-accent hover:text-white border-none shadow-sm">Regional Delicacies</span>
              <span className="vdh-pill bg-zinc-100 hover:bg-customer-accent hover:text-white border-none shadow-sm">Modern Desserts</span>
            </div>
          </div>
        </section>

        {/* --- Location Section (Simplified) --- */}
        <section className="vdh-section pb-24" id="gallery">
          <div className="vdh-container">
            <div className="p-20 bg-customer-accent text-white rounded-[4rem] text-center shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_70%)] opacity-30"></div>
               <MapPin size={48} className="mx-auto mb-8 animate-bounce" />
               <h2 className="vdh-section__title !text-white !max-w-none mb-6">Experience it live.</h2>
               <p className="text-white/60 font-bold uppercase tracking-[0.4em] text-[10px] mb-12 italic">Visit us at the heart of the city.</p>
               <div className="flex justify-center gap-12">
                  <div className="flex flex-col items-center">
                     <span className="text-xs font-black tracking-[0.2em] mb-2">WEEKDAYS</span>
                     <span className="text-2xl font-bold font-fraunces italic">11 AM — 11 PM</span>
                  </div>
                  <div className="w-[1px] h-12 bg-white/20"></div>
                  <div className="flex flex-col items-center">
                     <span className="text-xs font-black tracking-[0.2em] mb-2">WEEKENDS</span>
                     <span className="text-2xl font-bold font-fraunces italic">11 AM — 12 AM</span>
                  </div>
               </div>
            </div>
          </div>
        </section>

      </main>

      {/* --- Footer --- */}
      <footer className="vdh-footer bg-white">
        <div className="vdh-container vdh-footer__inner">
          <div className="flex items-center gap-8">
            <div className="vdh-brand vdh-brand--muted opacity-30 italic !text-sm">
               <span>Vinnod Dining Hall Network</span>
            </div>
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">© {new Date().getFullYear()} CORE SYSTEMS</span>
          </div>
          <a className="group flex items-center gap-2" href="#top">
             Back to top <ArrowDown size={14} className="rotate-180 group-hover:-translate-y-1 transition-transform" />
          </a>
        </div>
      </footer>
    </div>
  );
}
