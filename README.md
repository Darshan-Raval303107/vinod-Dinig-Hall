## Vinnod Dining Hall — Premium Scroll Hero (Image Sequence)

This folder contains a premium landing page with a **scroll-driven “3D” hero** powered by your frame sequence in `hero_images/`.

### Run locally

From this folder, start any static file server:

- **Python**:

```bash
python -m http.server 5173
```

- **Node (optional)**:

```bash
npx --yes serve -l 5173 .
```

Then open `http://localhost:5173` in your browser.

### Where to tweak

- **Frame settings**: `main.js` (`FRAME_COUNT`, `FRAME_PATH`, `SMOOTHING`)
- **Hero scroll length**: `styles.css` (`.hero__scroll { height: 320vh; }`)


