import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './landing.css';

export default function Landing() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const heroScrollRef = useRef(null);
  const progressRef = useRef(null);
  const loadingRef = useRef(null);
  const loadingFillRef = useRef(null);
  const loadingPctRef = useRef(null);
  const yearRef = useRef(null);

  useEffect(() => {
    if (yearRef.current) yearRef.current.textContent = String(new Date().getFullYear());

    const canvas = canvasRef.current;
    const heroScroll = heroScrollRef.current;
    const heroProgress = progressRef.current;
    const progressBar = heroProgress?.querySelector?.('.hero__progressBar') || null;
    const loading = loadingRef.current;
    const loadingFill = loadingFillRef.current;
    const loadingPct = loadingPctRef.current;

    if (!(canvas instanceof HTMLCanvasElement) || !heroScroll) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const FRAME_COUNT = 192;
    const framePath = (i) => {
      const n = String(i).padStart(3, '0');
      // Served from Vite public/
      return `/hero_images/ezgif-frame-${n}.jpg`;
    };

    const frames = Array.from({ length: FRAME_COUNT }, () => null);
    let loadedCount = 0;
    let lastDrawn = -1;

    const dpr = () => Math.min(2, window.devicePixelRatio || 1);

    const clamp01 = (n) => Math.max(0, Math.min(1, n));
    const clampInt = (n, min, max) => Math.max(min, Math.min(max, n | 0));

    const getScrollProgress = () => {
      const rect = heroScroll.getBoundingClientRect();
      const scrollable = heroScroll.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      const passed = -rect.top;
      return clamp01(passed / scrollable);
    };

    const getFrameIndex = (progress01) => {
      const raw = 1 + progress01 * (FRAME_COUNT - 1);
      return clampInt(Math.round(raw), 1, FRAME_COUNT);
    };

    const coverDraw = (img) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return;

      const scale = Math.max(cw / iw, ch / ih);
      const dw = Math.ceil(iw * scale);
      const dh = Math.ceil(ih * scale);
      const dx = Math.floor((cw - dw) / 2);
      const dy = Math.floor((ch - dh) / 2);

      ctx.fillStyle = '#f6f7fb';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const drawFrame = (frameIdx1Based) => {
      const idx = frameIdx1Based - 1;
      if (idx === lastDrawn) return;
      const img = frames[idx];
      if (!img) return;
      coverDraw(img);
      lastDrawn = idx;
    };

    const updateLoadingUI = () => {
      const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
      if (loadingFill) loadingFill.style.width = `${pct}%`;
      if (loadingPct) loadingPct.textContent = `${pct}%`;
      if (loadedCount >= FRAME_COUNT && loading) {
        loading.style.opacity = '0';
        loading.style.pointerEvents = 'none';
        setTimeout(() => loading?.remove?.(), 400);
      }
    };

    const loadAllFrames = () => {
      for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = framePath(i);
        img.onload = () => {
          frames[i - 1] = img;
          loadedCount++;
          updateLoadingUI();
          if (lastDrawn === -1) {
            const firstReady = frames.findIndex((f) => !!f);
            if (firstReady >= 0) drawFrame(firstReady + 1);
          }
        };
        img.onerror = () => {
          frames[i - 1] = null;
          loadedCount++;
          updateLoadingUI();
        };
      }
    };

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    const resizeCanvas = () => {
      const ratio = dpr();
      const w = Math.floor(canvas.clientWidth * ratio);
      const h = Math.floor(canvas.clientHeight * ratio);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        drawFrame(getFrameIndex(getScrollProgress()));
      }
    };

    let targetY = window.scrollY || 0;
    let smoothY = targetY;
    const SMOOTHING = 0.12;

    const tick = () => {
      if (prefersReducedMotion) {
        drawFrame(1);
        if (progressBar) progressBar.style.height = `0%`;
        return;
      }

      targetY = window.scrollY || 0;
      smoothY = smoothY + (targetY - smoothY) * SMOOTHING;

      const heroTop = heroScroll.getBoundingClientRect().top + (window.scrollY || 0);
      const scrollable = heroScroll.offsetHeight - window.innerHeight;
      const progress = scrollable <= 0 ? 0 : clamp01((smoothY - heroTop) / scrollable);

      const frameIdx = getFrameIndex(progress);
      drawFrame(frameIdx);
      if (progressBar) progressBar.style.height = `${Math.round(progress * 100)}%`;

      rafId = requestAnimationFrame(tick);
    };

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
    <div ref={rootRef} className="landingRoot">
      <header className="nav">
        <div className="landingContainer nav__inner">
          <a className="brand" href="#top" aria-label="Vinnod Dining Hall home">
            <span className="brand__mark" aria-hidden="true"></span>
            <span className="brand__text">Vinnod</span>
          </a>
          <nav className="nav__links" aria-label="Primary navigation">
            <a href="#experience">Experience</a>
            <a href="#menu">Menu</a>
            <a href="#gallery">Gallery</a>
            <a className="btn btn--sm" href="#reserve">Reserve</a>
            <Link className="btn btn--sm btn--ghost" to="/login">Staff Login</Link>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-label="Hero">
          <div className="hero__scroll" id="heroScroll" ref={heroScrollRef}>
            <div className="hero__sticky">
              <canvas className="hero__canvas" id="heroCanvas" ref={canvasRef}></canvas>

              <div className="hero__overlay" aria-hidden="true"></div>

              <div className="landingContainer hero__content">
                <div className="hero__kicker">Vinnod Dining Hall</div>
                <h1 className="hero__title">A modern dining experience, crafted with care.</h1>
                <p className="hero__subtitle">
                  Scroll to explore the space in a smooth, cinematic reveal — then open the menu via QR or login for staff.
                </p>
                <div className="hero__cta">
                  <a className="btn" href="#reserve">Reserve a table</a>
                  <a className="btn btn--ghost" href="#experience">Explore</a>
                  <Link className="btn btn--ghost" to="/menu?restaurant=spice-lounge&table=1">Preview QR Menu</Link>
                </div>
              </div>

              <div className="hero__progress" id="heroProgress" ref={progressRef} aria-hidden="true">
                <div className="hero__progressBar"></div>
              </div>

              <div className="hero__hint" aria-hidden="true">
                <span className="hero__hintDot"></span>
                <span>Scroll</span>
              </div>

              <div className="hero__loading" id="heroLoading" ref={loadingRef} aria-live="polite">
                <div className="hero__loadingCard">
                  <div className="hero__loadingTitle">Loading experience</div>
                  <div className="hero__loadingBar">
                    <div className="hero__loadingFill" id="heroLoadingFill" ref={loadingFillRef}></div>
                  </div>
                  <div className="hero__loadingPct" id="heroLoadingPct" ref={loadingPctRef}>0%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="experience">
          <div className="landingContainer">
            <div className="grid">
              <div>
                <h2 className="section__title">Designed for comfort, built for moments.</h2>
                <p className="section__copy">
                  From warm lighting to thoughtful seating and a calm, airy layout—every detail is tuned for
                  conversation, celebration, and quiet meals alike.
                </p>
                <div className="stats">
                  <div className="stat">
                    <div className="stat__num">4.8</div>
                    <div className="stat__label">Average rating</div>
                  </div>
                  <div className="stat">
                    <div className="stat__num">120+</div>
                    <div className="stat__label">Seats</div>
                  </div>
                  <div className="stat">
                    <div className="stat__num">7</div>
                    <div className="stat__label">Days open</div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card__eyebrow">Quick links</div>
                <ul className="list">
                  <li><strong>Customer</strong>: Scan a table QR → menu opens automatically</li>
                  <li><strong>Owner/Chef</strong>: Use <Link to="/login">Staff Login</Link></li>
                  <li><strong>Demo</strong>: <Link to="/menu?restaurant=spice-lounge&table=1">Open Menu</Link></li>
                </ul>
                <div className="card__footnote">Owner tools (tables, QR, menu with photos) are in the Owner Dashboard.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--alt" id="menu">
          <div className="landingContainer">
            <h2 className="section__title">Menu built around taste + consistency.</h2>
            <p className="section__copy section__copy--wide">
              Balanced options, vegetarian friendly, and always served fresh. Add your real menu items and pricing here.
            </p>
            <div className="pillRow">
              <span className="pill">Breakfast</span>
              <span className="pill">Lunch</span>
              <span className="pill">Dinner</span>
              <span className="pill">Snacks</span>
            </div>
          </div>
        </section>

        <section className="section" id="gallery">
          <div className="landingContainer">
            <h2 className="section__title">Gallery</h2>
            <p className="section__copy">Your hero sequence already doubles as a gallery—scroll back up anytime.</p>
          </div>
        </section>

        <section className="section section--alt" id="reserve">
          <div className="landingContainer">
            <div className="reserve">
              <div>
                <h2 className="section__title">Reserve in seconds.</h2>
                <p className="section__copy">
                  Hook this up to WhatsApp / Google Forms / any booking system later—this is a polished placeholder.
                </p>
              </div>
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  // placeholder
                  alert('Reservation request sent (demo).');
                }}
              >
                <label className="field">
                  <span>Name</span>
                  <input required placeholder="Your name" />
                </label>
                <label className="field">
                  <span>Phone</span>
                  <input required placeholder="+91 XXXXX XXXXX" />
                </label>
                <button className="btn" type="submit">Request reservation</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="landingContainer footer__inner">
          <div className="footer__left">
            <div className="brand brand--muted">
              <span className="brand__mark" aria-hidden="true"></span>
              <span className="brand__text">Vinnod Dining Hall</span>
            </div>
            <div className="footer__copy">© <span ref={yearRef}></span> Vinnod. All rights reserved.</div>
          </div>
          <div className="footer__right">
            <a href="#top">Back to top</a>
          </div>
        </div>
      </footer>
    </div>
  );
}


