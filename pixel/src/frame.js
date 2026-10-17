// frame.js: setup, the frame, transitions, colour grading, the 4x nearest-neighbour blow-up and the hooks render.mjs and
// player.js call (window.ready, renderAt, renderSheet, gpuInfo).
//
// Each shot paints the palette buffer and may set POST before returning:
//   POST.grade = [['gray'|'sepia'|'cold'|'warm'|'dark'|'night', k], ...]   colour grade, applied to the palette
//   POST.fade  = ['WH', k]          ordered-dither fade toward a palette colour (k = coverage)
//   POST.shake = [dx, dy]           whole-frame shake in buffer pixels
//   POST.vig   = k                  dithered dark vignette
//   POST.overlay = (ctx, t) => {}   draw on the full-res canvas after the blow-up (small pixel text over a zoomed shot)
//   POST.zoom  = [z, cx, cy]        pixel camera: show the buffer around (cx, cy) z times bigger (whole pixels grow
//                                   together; use whole numbers 2, 3, 4 for clean pixels, in-betweens only while moving)
// Transitions belong to the incoming shot in timeline.js: shots([[t0, fn, { tr: 'dither', d: .5 }], ...]).

let outC = null, outX = null, smallC = null, smallX = null, IMG = null;
const RGB_A = new Uint8ClampedArray(PW * PH * 4), RGB_B = new Uint8ClampedArray(PW * PH * 4);

function setup() {
  smallC = document.createElement('canvas'); smallC.width = PW; smallC.height = PH; smallX = smallC.getContext('2d');
  IMG = smallX.createImageData(PW, PH);
  outC = document.getElementById('out'); outC.width = W; outC.height = H; outX = outC.getContext('2d');
  const go = () => { window.ready = true; };
  (window.LYRICS_READY || Promise.resolve()).then(go, go);
}

// ---------- grading ----------
const lum = c => .299 * c[0] + .587 * c[1] + .114 * c[2];
function gradeColour(c, grades) {
  let [r, g, b] = c;
  for (const [type, k] of grades || []) {
    if (!k) continue;
    const L = lum([r, g, b]);
    let t;
    if (type === 'gray') t = [L, L, L];
    else if (type === 'sepia') t = [Math.min(255, L * 1.07 + 28), L * .9 + 12, L * .66 + 4];
    else if (type === 'cold') t = [r * .78, g * .9, Math.min(255, b * 1.08 + 18)];
    else if (type === 'warm') t = [Math.min(255, r * 1.06 + 14), g * 1.0 + 4, b * .82];
    else if (type === 'dark') t = [r * .35, g * .35, b * .42];
    else if (type === 'night') t = [r * .42, g * .48, Math.min(255, b * .7 + 30)];
    else continue;
    r += (t[0] - r) * k; g += (t[1] - g) * k; b += (t[2] - b) * k;
  }
  return [r, g, b];
}
// paint the current BUF (with POST) into an RGBA array
function toRGB(dst, post) {
  const pal = post.grade ? PAL.map(c => gradeColour(c, post.grade)) : PAL;
  const fade = post.fade && post.fade[1] > 0 ? [gradeColour(PAL[C[post.fade[0]] ?? 0], post.grade), post.fade[1]] : null;
  const [sx, sy] = post.shake ? post.shake.map(Math.round) : [0, 0], vig = post.vig || 0;
  const [z, zx, zy] = post.zoom || [1, PW / 2, PH / 2];
  const zx0 = Math.round(clamp(zx - PW / 2 / z, 0, PW - PW / z) * z) / z, zy0 = Math.round(clamp(zy - PH / 2 / z, 0, PH - PH / z) * z) / z;
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    let xs = x - sx, ys = y - sy;
    if (z !== 1) { xs = Math.floor(zx0 + xs / z); ys = Math.floor(zy0 + ys / z); }
    xs = Math.min(PW - 1, Math.max(0, xs)); ys = Math.min(PH - 1, Math.max(0, ys));
    let c = pal[BUF[ys * PW + xs]] || pal[0];
    if (fade && bayer(x, y) < fade[1]) c = fade[0];
    if (vig) { const u = (x - PW / 2) / (PW / 2), v = (y - PH / 2) / (PH / 2), d = u * u * .8 + v * v; if (bayer(x, y) < (d - .55) * vig * 1.6) c = [c[0] * .45, c[1] * .45, c[2] * .55]; }
    const j = (y * PW + x) * 4; dst[j] = c[0]; dst[j + 1] = c[1]; dst[j + 2] = c[2]; dst[j + 3] = 255;
  }
}
function paintShot(fn, t, lt, dur, dst) {
  POST = {}; OX = OY = 0; CLIP = null; CUR = BUF; STACK.length = 0; XF.length = 0;
  clear(C.BK);
  fn(t, lt, dur);
  OX = OY = 0; CLIP = null;
  toRGB(dst, POST);
}

// ---------- transitions: mask(x, y, k) true = show the new shot ----------
const TR = {
  cut: () => true,
  dither: (x, y, k) => bayer(x, y) < k,
  // chunky dither: 4x4 blocks dissolve in random order
  blocks: (x, y, k) => hash(x >> 2, y >> 2) < k,
  // diamond wipe: a grid of diamonds that grow, sweeping from left to right
  diamond: (x, y, k, o) => { const s = o.s || 16, cx = (x % s) - s / 2 + .5, cy = (y % s) - s / 2 + .5, sweep = (Math.floor(x / s) * s) / PW * .6; return Math.abs(cx) + Math.abs(cy) < s * clamp((k - sweep) / .4); },
  iris: (x, y, k, o) => Math.hypot(x - (o.x ?? PW / 2), y - (o.y ?? PH / 2)) < easeIn(k) * 560,
  irisIn: (x, y, k, o) => Math.hypot(x - (o.x ?? PW / 2), y - (o.y ?? PH / 2)) >= (1 - easeOut(k)) * 560,
  wipeL: (x, y, k) => x + (hash(y >> 1, 3) * 10) < easeInOut(k) * (PW + 10),
  wipeR: (x, y, k) => PW - x + (hash(y >> 1, 4) * 10) < easeInOut(k) * (PW + 10),
  wipeD: (x, y, k) => y + (hash(x >> 1, 5) * 10) < easeInOut(k) * (PH + 10),
  blinds: (x, y, k) => (y % 18) < k * 18,
  split: (x, y, k) => Math.abs(x - PW / 2) < easeOut(k) * PW / 2 + 1,
};
const easeInOut = ease;
// push: the old shot slides out, the new one slides in (dir = -1 left, 1 right)
function mixShots(a, b, type, k, o) {
  const d = IMG.data;
  if (type === 'push') {
    const dir = o.dir || -1, off = Math.round(easeInOut(k) * PW);
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const xa = x - dir * off, xb = x - dir * (off - PW), j = (y * PW + x) * 4;
      const src = xa >= 0 && xa < PW ? [a, xa] : [b, xb];
      const q = (y * PW + Math.min(PW - 1, Math.max(0, src[1]))) * 4;
      d[j] = src[0][q]; d[j + 1] = src[0][q + 1]; d[j + 2] = src[0][q + 2]; d[j + 3] = 255;
    }
    return;
  }
  const m = TR[type] || TR.dither;
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const j = (y * PW + x) * 4, s = m(x, y, k, o) ? b : a;
    d[j] = s[j]; d[j + 1] = s[j + 1]; d[j + 2] = s[j + 2]; d[j + 3] = 255;
  }
}
// solid flash / dip over the finished frame (dithered)
function flashOver(hex, k) {
  if (k <= 0) return; const c = PAL[C[hex] ?? C.WH], d = IMG.data;
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (bayer(x, y) < k) { const j = (y * PW + x) * 4; d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; }
}

function frame(t) {
  T = t;
  if (window.LOOP) { paintShot(window.LOOP, t, t, window.LOOP.len || 1, IMG.data); return; }
  if (!SHOTS.length) { IMG.data.fill(0); return; }
  let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
  const [t0, fn, o = {}] = SHOTS[i], end = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DUR;
  const tr = o.tr, d = o.d || .5, k = (t - t0) / d;
  if (tr && i > 0 && k < 1 && !['flash', 'dip', 'cut'].includes(tr)) {
    const [p0, pfn] = SHOTS[i - 1];
    paintShot(pfn, t, t - p0, t0 - p0, RGB_A);
    paintShot(fn, t, t - t0, end - t0, RGB_B);
    mixShots(RGB_A, RGB_B, tr, clamp(k), o);
    return;
  }
  paintShot(fn, t, t - t0, end - t0, IMG.data);
  if (tr === 'flash' && k < 1) flashOver(o.col || 'WH', Math.pow(1 - clamp(k), 1.6));
  if (tr === 'dip' && k < 1) flashOver(o.col || 'BK', 1 - clamp(k));
  // the outgoing side of a dip: the last d seconds of a shot followed by a 'dip' fade to the colour
  const nx = SHOTS[i + 1];
  if (nx && nx[2] && nx[2].tr === 'dip') { const dd = nx[2].d || .5, kk = (nx[0] - t) / dd; if (kk < 1) flashOver(nx[2].col || 'BK', 1 - clamp(kk)); }
}
function composite(t) {
  smallX.putImageData(IMG, 0, 0);
  outX.imageSmoothingEnabled = false;
  outX.drawImage(smallC, 0, 0, W, H);
  if (typeof drawLyrics === 'function' && !window.LOOP) drawLyrics(outX, t);
  if (POST.overlay) POST.overlay(outX, t);                    // full-res extras a shot / loop asks for (e.g. the cover's singer line)
}
window.renderAt = async (t, type = 'image/png', q = .92) => { frame(t); composite(t); return outC.toDataURL(type, q); };
window.renderSheet = async (times, cols = 3, w = 640, crop = null) => {
  const [, , cw, ch] = crop || [0, 0, W, H], h = Math.round(w * ch / cw), rows = Math.ceil(times.length / cols), sc = document.createElement('canvas');
  sc.width = cols * w; sc.height = rows * h; const c = sc.getContext('2d'), ms = [];
  c.imageSmoothingEnabled = false;
  for (let i = 0; i < times.length; i++) {
    const t0 = performance.now(); frame(times[i]); composite(times[i]); ms.push(Math.round(performance.now() - t0));
    const x = (i % cols) * w, y = Math.floor(i / cols) * h, [cx, cy] = crop || [0, 0];
    c.drawImage(outC, cx, cy, cw, ch, x, y, w, h); c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(x, y, 84, 24); c.fillStyle = '#fff'; c.font = '15px sans-serif'; c.fillText(times[i].toFixed(2) + 's', x + 6, y + 17);
  }
  return { url: sc.toDataURL('image/jpeg', .9), ms };
};
window.gpuInfo = () => '2D canvas, 480x270 palette buffer x4 (no WebGL)';
window.addEventListener('load', setup);
