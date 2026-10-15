// ink.js: a black-and-white manga kit on a plain 2D canvas. G-pen lines that taper and boil, solid blacks, screentone,
// hatching, and one accent red (RED: in 坏女孩 it belonged to 小鹿 alone; keep it that rare). Everything is a pure function of t: frames render in parallel
// and out of order, so nothing may carry over from one frame to the next.
//
// The world is drawn on X (the buffer canvas). camBegin/camEnd move it; line widths are in world px, so they thicken
// in a close-up like real inking. Screentone is anchored to the SCREEN, not the world (as printed tone would be), so it
// never swims when the camera moves.
const [W, H] = (new URLSearchParams(location.search).get('size') || '1920x1080').split('x').map(Number);
const BPM = PROJECT.bpm, BEAT = 60 / BPM, OFF = PROJECT.offset || 0, BOIL = 12, DUR = PROJECT.duration;
const TAU = Math.PI * 2;
const INK = '#141216', PAPER = '#F6F3EB', RED = '#D3262E', REDDK = '#8E1218', WHITE = '#FFFDF7';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, x) => a + (b - a) * x;
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const easeIn = x => Math.pow(clamp(x), 3);
const backOut = x => { x = clamp(x); const s = 1.9; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const elasticOut = x => { x = clamp(x); return x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (TAU / 3)) + 1; };
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const bpOf = t => (t - OFF) / BEAT;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const frac = x => x - Math.floor(x);
const beatN = t => Math.floor(bpOf(t));
const pulse = (t, k = 6) => Math.exp(-frac(bpOf(t)) * k);          // 1 on each beat, decays after
const wob = (t, f = 1, ph = 0) => Math.sin((t * f + ph) * TAU);
const spring = (t, t0, k = 6, w = 18) => t < t0 ? 0 : Math.exp(-k * (t - t0)) * Math.sin(w * (t - t0));
const onTwos = t => Math.floor(t * 12 + 1e-6) / 12;
// keyframes: kf(t, [[t0, v0], [t1, v1], ...], easeFn). Values may be numbers or arrays of numbers.
function kf(t, keys, e = ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) {
      const [a, va] = keys[i - 1], [b, vb] = keys[i], k = e((t - a) / (b - a));
      return Array.isArray(va) ? va.map((v, j) => lerp(v, vb[j], k)) : lerp(va, vb, k);
    }
  }
  return keys[keys.length - 1][1];
}
function mixCol(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), c = i => Math.round(lerp((pa >> i) & 255, (pb >> i) & 255, clamp(k)));
  return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
}
const shakeXY = (t, amt) => { const f = Math.floor(t * 24); return [(hash(f * 1.7) - .5) * 2 * amt, (hash(f * 2.3 + 9) - .5) * 2 * amt]; };

// ---------- boil: seeded randomness, re-drawn 12 times a second ----------
// boilSeed(key) restarts the stream from the boil frame and a key, so a still element draws the same until the next
// boil and one moving thing doesn't make everything drawn after it jitter. Call it before each separate element.
let BOILN = 0, RS = 1;
const boilSeed = key => { let h = 2166136261; for (const c of key + '|' + BOILN) h = Math.imul(h ^ c.charCodeAt(0), 16777619); RS = h >>> 0 || 1; };
const rnd = () => { RS = (RS + 0x6D2B79F5) >>> 0; let z = RS; z = Math.imul(z ^ (z >>> 15), z | 1); z ^= z + Math.imul(z ^ (z >>> 7), z | 61); return ((z ^ (z >>> 14)) >>> 0) / 4294967296; };
const jit = a => (rnd() * 2 - 1) * a;

// ---------- canvas, camera ----------
let X = null, CV = null, T = 0, POST = {};
let CAM = null, LAST_CAM = null;
function camBegin(cx = W / 2, cy = H / 2, zoom = 1, rot = 0) {
  X.save(); X.translate(W / 2, H / 2); X.rotate(rot); X.scale(zoom, zoom); X.translate(-cx, -cy);
  CAM = LAST_CAM = { cx, cy, zoom, rot };
}
function camEnd() { X.restore(); CAM = null; }
function toScreen(x, y, cam = CAM) {
  if (!cam) return [x, y];
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot), dx = (x - cam.cx) * cam.zoom, dy = (y - cam.cy) * cam.zoom;
  return [W / 2 + dx * c - dy * s, H / 2 + dx * s + dy * c];
}
// local frames: draw something at (x, y), scaled by s, rotated by r, mirrored when flip
function at(x, y, s, r, flip, fn) { X.save(); X.translate(x, y); if (r) X.rotate(r); X.scale(flip ? -s : s, s); fn(); X.restore(); }

// ---------- geometry ----------
function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function ellPts(cx, cy, rx, ry, n = 28, rot = 0) {
  const p = []; for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p;
}
// an ellipse whose axes are turned by rot (ellPts' rot only moves the start point)
function ellR(cx, cy, rx, ry, rot = 0, n = 24) {
  const c = Math.cos(rot), sn = Math.sin(rot), p = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; p.push([cx + x * c - y * sn, cy + x * sn + y * c]); }
  return p;
}
function rrPts(x, y, w, h, r) {
  const p = [], n = 5, corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
  return p;
}
function starPts(cx, cy, r, inner = .38, n = 4, rot = -Math.PI / 2) {
  const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, q = i % 2 ? r * inner : r; p.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); } return p;
}
// Catmull-Rom through the points, n samples per span; closed wraps around.
function through(P, n = 6, closed = false) {
  const m = P.length; if (m < 3) return P.slice();
  const out = [], get = i => closed ? P[(i + m) % m] : P[clamp(i, 0, m - 1)], spans = closed ? m : m - 1;
  for (let i = 0; i < spans; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let k = 0; k < n; k++) {
      const u = k / n, u2 = u * u, u3 = u2 * u;
      out.push([0, 1].map(d => .5 * (2 * p1[d] + (p2[d] - p0[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * u3)));
    }
  }
  if (!closed) out.push(P[m - 1]);
  return out;
}
const boil = (P, j) => j ? P.map(([x, y]) => [x + jit(j), y + jit(j)]) : P;
const tf = (P, x, y, s = 1, r = 0, flip = false) => {   // transform a point list (for building shapes in local units)
  const c = Math.cos(r), sn = Math.sin(r), f = flip ? -1 : 1;
  return P.map(([px, py]) => { px *= s * f; py *= s; return [x + px * c - py * sn, y + px * sn + py * c]; });
};
function pathOf(P, closed = true) { const p = new Path2D(); P.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); if (closed) p.closePath(); return p; }

// ---------- ink ----------
// pen(pts, w): one G-pen stroke through the points, swelling to w in the middle and tapering at the ends.
//   o.taper = [start, end] fraction of the length that tapers (0 = blunt), o.j = boil wobble (px), o.col, o.smooth
//   o.press = [a, b]: width multiplier at the start and end (a line that starts heavy and lifts off: [1.2, .3])
function pen(pts, w = 3, o = {}) {
  if (pts.length < 2 || w <= 0) return;
  const P = o.smooth === false ? boil(pts, o.j ?? .5) : through(boil(pts, o.j ?? .5), o.n || 6);
  const n = P.length, [ta, tb] = o.taper || [.2, .25], [pa, pb] = o.press || [1, 1];
  const L = [], R = [];
  let len = 0; const acc = [0]; for (let i = 1; i < n; i++) { len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); acc.push(len); }
  for (let i = 0; i < n; i++) {
    const k = len ? acc[i] / len : i / (n - 1), a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    let s = 1; if (ta > 0 && k < ta) s = Math.pow(k / ta, .55); if (tb > 0 && k > 1 - tb) s = Math.min(s, Math.pow((1 - k) / tb, .55));
    const hw = Math.max(.35, w * lerp(pa, pb, k) * Math.max(.12, s)) / 2;
    L.push([P[i][0] - dy / d * hw, P[i][1] + dx / d * hw]); R.push([P[i][0] + dy / d * hw, P[i][1] - dx / d * hw]);
  }
  X.fillStyle = o.col || INK; X.fill(pathOf(L.concat(R.reverse())));
}
// a closed outline of even-ish weight that swells a little where o.heavy says (an angle: the shadow side)
function loop(pts, w = 3, o = {}) {
  const P = o.smooth === false ? pts : through(pts, o.n || 6, true), n = P.length;
  let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = P[(i - 1 + n) % n], b = P[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const side = o.heavy == null ? 0 : Math.cos(Math.atan2(P[i][1] - cy, P[i][0] - cx) - o.heavy);
    const hw = w * (1 + .45 * Math.max(0, side) + .12 * Math.sin(i * 1.7 + (o.ph || 0))) / 2;
    L.push([P[i][0] - dy / d * hw, P[i][1] + dx / d * hw]); R.push([P[i][0] + dy / d * hw, P[i][1] - dx / d * hw]);
  }
  const p = pathOf(L); p.addPath(pathOf(R.reverse()));
  X.fillStyle = o.col || INK; X.fill(p, 'evenodd');
}
// shape(pts, o): one inked shape. fill: a colour, 'tone:0.3' (screentone density), or null; lw: outline (0 = none).
//   o.smooth (default true) rounds the corners through the points; o.j boils them; o.heavy thickens one side.
function shape(pts, o = {}) {
  const B = boil(pts, o.j ?? .5), P = o.smooth === false ? B : through(B, o.n || 6, true);
  if (o.fill) fillPath(pathOf(P), o.fill, o);
  if (o.tone) fillPath(pathOf(P), 'tone:' + o.tone, o);
  if ((o.lw ?? 3) > 0) loop(P, o.lw ?? 3, { smooth: false, heavy: o.heavy, col: o.line, ph: o.ph });
  return P;
}
function fillPath(path, fill, o = {}) {
  if (typeof fill === 'string' && fill.startsWith('tone:')) { X.fillStyle = tonePat(+fill.slice(5), o.toneK); }
  else X.fillStyle = fill;
  X.fill(path);
}

// ---------- screentone ----------
// A 45° dot lattice anchored to the screen. d = ink coverage 0..1 (above .5 it becomes white dots on black).
const TONES = {};
function tonePat(d, k = 1) {
  d = Math.round(clamp(d) * 40) / 40;
  const key = d + '|' + k;
  if (!TONES[key]) {
    const s = Math.round(12 * k), c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
    const inv = d > .5, dd = inv ? 1 - d : d, r = s * Math.sqrt(dd / (2 * Math.PI));
    g.fillStyle = inv ? INK : PAPER; g.fillRect(0, 0, s, s); g.fillStyle = inv ? PAPER : INK;
    if (d >= .999) { g.fillStyle = INK; g.fillRect(0, 0, s, s); }
    else if (dd > .002) for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s], [s / 2, s / 2]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    TONES[key] = X.createPattern(c, 'repeat');
  }
  const p = TONES[key]; p.setTransform(X.getTransform().inverse()); return p;
}
// Tone that fades from d0 to d1 along (x0, y0) → (x1, y1), inside path. Dots drawn one by one (one Path2D), screen-anchored.
function toneGrad(path, x0, y0, x1, y1, d0, d1, o = {}) {
  X.save(); X.clip(path);
  const m = X.getTransform(), inv = m.inverse(), s = 12 * (o.k || 1), h = s / 2;
  const [a, b] = [m.transformPoint(new DOMPoint(x0, y0)), m.transformPoint(new DOMPoint(x1, y1))];
  const vx = b.x - a.x, vy = b.y - a.y, vv = vx * vx + vy * vy || 1;
  // screen-space bounding box of the clip: use the whole screen, cheap enough for one layer
  X.setTransform(1, 0, 0, 1, 0, 0);
  const dots = new Path2D();
  for (let y = 0, row = 0; y <= H + s; y += h, row++) for (let x = (row % 2) * h; x <= W + s; x += s) {
    const k = clamp(((x - a.x) * vx + (y - a.y) * vy) / vv), d = lerp(d0, d1, k);
    if (d < .01) continue;
    const r = s * Math.sqrt(Math.min(d, .5) / (2 * Math.PI)) * (d > .5 ? 1 + (d - .5) * 1.3 : 1);
    dots.moveTo(x + r, y); dots.arc(x, y, r, 0, TAU);
  }
  X.fillStyle = o.col || INK; X.fill(dots);
  X.setTransform(m); X.restore();
}
// Parallel hatching inside path: angle a, gap px, stroke w; o.len varies the strokes (0..1 random shortening).
function hatch(path, a = -.8, gap = 10, w = 1.6, o = {}) {
  X.save(); X.clip(path);
  const m = X.getTransform(); X.setTransform(1, 0, 0, 1, 0, 0);
  const c = Math.cos(a), s = Math.sin(a), R = Math.hypot(W, H);
  for (let d = -R; d < R; d += gap) {
    const cx = W / 2 - s * d, cy = H / 2 + c * d, l = R * (1 - (o.len || 0) * hash(d * .37 + (o.seed || 0)));
    pen([[cx - c * l, cy - s * l], [cx + c * l, cy + s * l]], w, { taper: [0, 0], smooth: false, j: 0, col: o.col });
  }
  X.setTransform(m); X.restore();
}

// ---------- layers ----------
// layer(fn, alpha, o): draw fn() on an offscreen canvas with the current transform, then put it down with alpha
// (crossfades, a whole figure fading as one). o.op composite op, o.clip a Path2D in SCREEN space.
let LD = 0; const LCV = [];
function layer(fn, alpha = 1, o = {}) {
  if (alpha <= .003) return;
  if (!LCV[LD]) { const c = document.createElement('canvas'); c.width = W; c.height = H; LCV[LD] = c; }
  const c = LCV[LD++], g = c.getContext('2d'), prev = X, m = X.getTransform();
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
  X = g; X.setTransform(m);
  try { fn(); } finally { X = prev; LD--; }
  X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = clamp(alpha); if (o.op) X.globalCompositeOperation = o.op; if (o.clip) X.clip(o.clip);
  X.drawImage(c, 0, 0); X.restore();
}
// snap(fn): draw fn() (with the current transform) onto a canvas of its own and return it, for cutting into pieces
let SNAPC = null;
function snap(fn) {
  if (!SNAPC) { SNAPC = document.createElement('canvas'); SNAPC.width = W; SNAPC.height = H; }
  const g = SNAPC.getContext('2d'), prev = X, m = X.getTransform();
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); X = g; X.setTransform(m);
  try { fn(); } finally { X = prev; }
  return SNAPC;
}
