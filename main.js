(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const canvas = document.getElementById("heroCanvas");
  const heroScroll = document.getElementById("heroScroll");
  const heroProgress = document.getElementById("heroProgress");
  const progressBar = heroProgress?.querySelector(".hero__progressBar");
  const loading = document.getElementById("heroLoading");
  const loadingFill = document.getElementById("heroLoadingFill");
  const loadingPct = document.getElementById("heroLoadingPct");

  if (!(canvas instanceof HTMLCanvasElement) || !heroScroll) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const FRAME_COUNT = 192;
  const FRAME_PATH = (i) => {
    const n = String(i).padStart(3, "0");
    return `./hero_images/ezgif-frame-${n}.jpg`;
  };

  /** @type {(HTMLImageElement | null)[]} */
  const frames = Array.from({ length: FRAME_COUNT }, () => null);
  let loadedCount = 0;
  let lastDrawn = -1;

  const dpr = () => Math.min(2, window.devicePixelRatio || 1);

  function resizeCanvas() {
    const ratio = dpr();
    const w = Math.floor(canvas.clientWidth * ratio);
    const h = Math.floor(canvas.clientHeight * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      // Redraw current frame after resize
      drawFrame(getFrameIndex(getScrollProgress()));
    }
  }

  function getScrollProgress() {
    const rect = heroScroll.getBoundingClientRect();
    const scrollable = heroScroll.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    const passed = -rect.top;
    return clamp01(passed / scrollable);
  }

  function getFrameIndex(progress01) {
    // Map [0..1] → [1..FRAME_COUNT]
    const raw = 1 + progress01 * (FRAME_COUNT - 1);
    return clampInt(Math.round(raw), 1, FRAME_COUNT);
  }

  function clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }

  function clampInt(n, min, max) {
    return Math.max(min, Math.min(max, n | 0));
  }

  function coverDraw(img) {
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

    // Light-theme fallback behind frames (prevents dark flashes)
    ctx.fillStyle = "#f6f7fb";
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
    if (loadingPct) loadingPct.textContent = `${pct}%`;
    if (loadedCount >= FRAME_COUNT && loading) {
      loading.style.opacity = "0";
      loading.style.pointerEvents = "none";
      setTimeout(() => loading?.remove(), 400);
    }
  }

  function loadAllFrames() {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = FRAME_PATH(i);
      img.onload = () => {
        frames[i - 1] = img;
        loadedCount++;
        updateLoadingUI();
        // Draw the first frame we have (robust even if loads out-of-order)
        if (lastDrawn === -1) {
          const firstReady = frames.findIndex((f) => !!f);
          if (firstReady >= 0) drawFrame(firstReady + 1);
        }
      };
      img.onerror = () => {
        // Keep progress moving even if a file is missing
        frames[i - 1] = null;
        loadedCount++;
        updateLoadingUI();
      };
    }
  }

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Smooth scroll interpolation (feels premium even without external libs)
  let targetY = window.scrollY || 0;
  let smoothY = targetY;
  const SMOOTHING = 0.12; // 0..1 (higher = snappier)

  function tick() {
    if (prefersReducedMotion) {
      drawFrame(1);
      if (progressBar) progressBar.style.height = `0%`;
      return;
    }
    targetY = window.scrollY || 0;
    smoothY = smoothY + (targetY - smoothY) * SMOOTHING;

    // Translate smoothed scroll back into a progress value for the hero.
    const heroTop = heroScroll.getBoundingClientRect().top + (window.scrollY || 0);
    const scrollable = heroScroll.offsetHeight - window.innerHeight;
    const progress = scrollable <= 0 ? 0 : clamp01((smoothY - heroTop) / scrollable);

    const frameIdx = getFrameIndex(progress);
    drawFrame(frameIdx);

    if (progressBar) progressBar.style.height = `${Math.round(progress * 100)}%`;

    requestAnimationFrame(tick);
  }

  // Prefer crisp rendering on resize / orientation changes
  const ro = new ResizeObserver(() => resizeCanvas());
  ro.observe(canvas);
  window.addEventListener("resize", resizeCanvas, { passive: true });

  // Warm start
  resizeCanvas();
  loadAllFrames();
  requestAnimationFrame(tick);
})();