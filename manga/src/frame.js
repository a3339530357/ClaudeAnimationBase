// frame.js: setup, the frame, compositing and the render hooks render.mjs calls (renderAt, renderSheet, gpuInfo).
// timeline.js decides what drawWorld(t) paints; POST.invert flips black and white for a strobe (red stays red),
// POST.overlay draws the caption box on top, after the flip, so the lyrics never invert.

let outC = null, outX = null, PAPER_C = null, GRAIN_C = null;
function lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
// manga paper: near-white with faint fibres (drawn over the base colour at low alpha)
function makePaper() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = lcg(11);
  g.lineWidth = 1;
  for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H, l = 6 + r() * 22, a = r() * TAU; g.strokeStyle = `rgba(120,105,85,${.025 + r() * .04})`; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return c;
}
// print grain, multiplied over everything (blacks get a little texture too, like ink on paper)
function makeGrain() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = lcg(5);
  const id = g.createImageData(W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = 255 - (r() < .5 ? r() * r() * 26 : 0); d[i] = v; d[i + 1] = v; d[i + 2] = v - 2; d[i + 3] = 255; }
  g.putImageData(id, 0, 0);
  const v = g.createRadialGradient(W / 2, H / 2, H * .5, W / 2, H / 2, H * 1.1); v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(1, 'rgba(90,85,80,.22)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

async function setup() {
  CV = document.createElement('canvas'); CV.width = W; CV.height = H; X = CV.getContext('2d');
  outC = document.getElementById('out'); outC.width = W; outC.height = H; outX = outC.getContext('2d');
  PAPER_C = makePaper(); GRAIN_C = makeGrain();
  if (CAPTION_CHARS) await document.fonts.load('100px "Caption"', CAPTION_CHARS).catch(() => {});   // no fonts/caption.otf: system serif
  if (CAPTION_CHARS) await Promise.all(['100px "Ma Shan Zheng"', '100px "ZCOOL KuaiLe"'].map(f => document.fonts.load(f, CAPTION_CHARS).catch(() => {})));   // lyricfx's fonts
  window.ready = true;
  if (!location.search.includes('render')) devUI();
}
function frame(t) {
  T = t; POST = {}; CAM = LAST_CAM = null; BOILN = Math.floor(t * BOIL); boilSeed('frame');
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; X.filter = 'none';
  page();
  drawWorld(t);
  X.setTransform(1, 0, 0, 1, 0, 0);
}
function composite(t) {
  const c = outX;
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.filter = POST.invert ? 'invert(1) hue-rotate(180deg)' : 'none';
  const [sx, sy] = POST.shake || [0, 0], m = Math.abs(sx) + Math.abs(sy);   // lyricfx kinetic: the page shakes (zoomed a hair so no edge shows)
  c.drawImage(CV, sx - m, sy - m * H / W, W + 2 * m, H + 2 * m * H / W);
  c.filter = 'none';
  if (POST.overlay) POST.overlay(c, t);
  c.globalCompositeOperation = 'multiply'; c.drawImage(GRAIN_C, 0, 0);
  c.globalCompositeOperation = 'source-over';
}
window.renderAt = async (t, type = 'image/png', q = .92) => { frame(t); composite(t); return outC.toDataURL(type, q); };
// Contact sheet of several times: returns { url, ms[] }. crop = [x, y, w, h] fills each cell with that region at full
// resolution; at = [x, y, w, h] crops around the WORLD point (x, y) through each frame's camera.
window.renderSheet = async (times, cols = 3, w = 640, crop = null, at = null) => {
  if (at) at = at.map((v) => typeof v === 'string' ? (0, eval)(v) : v);
  const [, , cw, ch] = at || crop || [0, 0, W, H], h = Math.round(w * ch / cw), rows = Math.ceil(times.length / cols), sc = document.createElement('canvas');
  sc.width = cols * w; sc.height = rows * h; const c = sc.getContext('2d'), ms = [];
  for (let i = 0; i < times.length; i++) {
    const t0 = performance.now(); frame(times[i]); composite(times[i]); ms.push(Math.round(performance.now() - t0));
    const x = (i % cols) * w, y = Math.floor(i / cols) * h;
    const [cx, cy] = at ? toScreen(at[0], at[1], LAST_CAM).map((v, j) => v - (j ? ch : cw) / 2) : crop || [0, 0];
    c.drawImage(outC, cx, cy, cw, ch, x, y, w, h); c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(x, y, 84, 24); c.fillStyle = '#fff'; c.font = '15px sans-serif'; c.fillText(times[i].toFixed(2) + 's', x + 6, y + 17);
  }
  return { url: sc.toDataURL('image/jpeg', .9), ms };
};
window.gpuInfo = () => '2D canvas (no WebGL)';

function devUI() {
  const s = document.getElementById('scrub'), lab = document.getElementById('tt'); s.max = window.LOOP ? window.LOOP.len : DUR;
  let busy = false, want = null;
  const go = async () => { if (busy) return; busy = true; while (want != null) { const t = want; want = null; const t0 = performance.now(); await window.renderAt(t); lab.textContent = `${t.toFixed(2)}s  ·  ${Math.round(performance.now() - t0)} ms/frame`; } busy = false; };
  s.addEventListener('input', () => { want = +s.value; go(); });
  want = +(new URLSearchParams(location.search).get('t') || 0); s.value = want; go();
}
window.addEventListener('load', setup);
