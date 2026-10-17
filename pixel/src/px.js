// px.js: the pixel layer. Everything is painted into a 480x270 buffer of palette indices (no colours, no alpha, so no
// anti-aliasing can sneak in), then frame.js grades it, mixes shots for transitions and blows it up 4x (nearest).
//
// Paint = a palette index, or a function (x, y) => index | -1 (for dithers and gradients). Coordinates are buffer pixels;
// shapes round to whole pixels. begin() / end(outline, alpha) draw a group on its own layer and stamp it down with a 1px
// outline around its silhouette (and optionally see-through, as an ordered dither): every sprite gets its contour that way.

// ?size=1920x1440 (render.mjs --size, for the 4:3 cover) makes the buffer 480x360; the film itself is always 480x270
const SIZE = (typeof location !== 'undefined' && (new URLSearchParams(location.search).get('size') || '').match(/^(\d+)x(\d+)$/)) || null;
const PW = 480, PH = SIZE ? Math.round(480 * SIZE[2] / SIZE[1]) : 270, SC = 4;
const W = PW * SC, H = PH * SC;
const BPM = PROJECT.bpm, BEAT = 60 / BPM, OFF = PROJECT.offset || 0, DUR = PROJECT.duration;
const TAU = Math.PI * 2;
let T = 0, POST = {};

// ---------- palette ----------
const PAL_HEX = {
  OL: '#2a1a2e', OL2: '#4a3450', BK: '#120d18',                        // outline (never pure black), soft inner line, near-black
  WH: '#fff8ec', W2: '#e8e0d8', W3: '#c9bfc0',                         // whites
  S0: '#ffe6d2', S1: '#f9cdb0', S2: '#e5a08a', S3: '#c07470', BL: '#f2949a',   // skin, blush
  E1: '#3a2230', LP: '#d9606c', MD: '#7a2a3a',                         // iris, lips, mouth inside
  R1: '#4a2a22', R2: '#6e3e2c', R3: '#9a5a3a', R4: '#c08050',          // her chestnut hair
  H1: '#22202e', H2: '#3a3650', H3: '#5c5878',                         // his black hair
  M1: '#f6cd5a', M2: '#d9a12e', M3: '#a8701c',                         // her mustard (cardigan, coat, star clip)
  N1: '#46558a', N2: '#2c3660',                                        // her navy skirt
  B1: '#7a4a2e', B2: '#53301e',                                        // boots, leather
  U0: '#d2ecfa', U1: '#a9d4f0', U2: '#74aedb', U3: '#4a7fb0',          // his sky blue (sweater, scarf)
  V1: '#3e4a6c', V2: '#283049',                                        // his navy coat
  Q1: '#cdb98e', Q2: '#9a865e',                                        // his khaki trousers
  P0: '#4a2418', P1: '#6e3a22', P2: '#94572f', P3: '#b8784a',          // piano wood
  NY: '#ffd65a', NP: '#ff98b0', NM: '#86dcb8', NB: '#8cc4f4',          // sticky notes (NB is also tears)
  A0: '#f3dfb0', A1: '#d8aa74', A2: '#b8865a', A3: '#8e6244', A4: '#5e3e2c',   // station stone, walls, floor
  L1: '#ffe9a8', L2: '#ffbe6a', L3: '#ff9a4a',                         // warm light
  K0: '#0c1230', K1: '#1a2450', K2: '#2c3a72', K3: '#485a98', K4: '#7a8cc8', K5: '#b6c4ec',   // night blues
  G1: '#33363f', G2: '#555a68', G3: '#858b9a', G4: '#b9bec8', G5: '#e2e4ea',   // greys (rain, steel, concrete)
  Y1: '#fff3cc', Y2: '#ffdc8e',                                        // spring sky
  T1: '#b4e0a0', T2: '#72b46c', T3: '#3e7a4e', T4: '#24503a',          // leaves
  PK1: '#ffd6e0', PK2: '#f4a0b8',                                      // blossoms
  SE1: '#86d0e6', SE2: '#4a9ac4', SE3: '#2a6492', SE4: '#1a3e66',      // sea
  O1: '#ffd690', O2: '#ff9e5e', O3: '#e8664c', O4: '#a8405a', O5: '#5a2a5a',   // sunset
  RD: '#e5414c', RD2: '#a32a3a',                                       // red (heart, train stripe)
  PA1: '#fbf3e0', PA2: '#e8d9b8', PA3: '#c4ae88',                      // paper (the song sheet)
  CF1: '#8a5a3a', CF2: '#5a3a26',                                      // coffee
  SC1: '#d8eeff', SC2: '#9cc8f0',                                      // phone screen glow
  CR1: '#efe6d0', CR2: '#cfc2a4',                                      // train cream body
};
const C = {}, PAL = [];
Object.entries(PAL_HEX).forEach(([k, h], i) => { C[k] = i; PAL.push([1, 3, 5].map(j => parseInt(h.slice(j, j + 2), 16))); });
const NONE = 255;

// ---------- buffers ----------
let BUF = new Uint8Array(PW * PH), CUR = BUF;
const STACK = [];
let OX = 0, OY = 0;                                         // integer translation (camera / sprite origin)
let CLIP = null;                                            // [x0, y0, x1, y1) in buffer pixels, or null
function clip(x, y, w, h) { CLIP = x == null ? null : [x, y, x + w, y + h]; }
function clear(c) { CUR.fill(c); }
function shift(dx, dy) { OX += Math.round(dx); OY += Math.round(dy); }
function at(x, y) { x = Math.floor(x + OX); y = Math.floor(y + OY); return x < 0 || y < 0 || x >= PW || y >= PH ? NONE : CUR[y * PW + x]; }
// push / pop the translation (sprites drawn relative to an origin)
const XF = [];
function save() { XF.push([OX, OY, CLIP]); }
function restore() { [OX, OY, CLIP] = XF.pop(); }

// ---------- paints ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16;
const resolve = (p, x, y) => typeof p === 'function' ? p(x, y) : p;
// dith(a, b, k): b over a with coverage k (0..1), ordered dither
const dith = (a, b, k) => (x, y) => bayer(x, y) < k ? resolve(b, x, y) : resolve(a, x, y);
// see-through paint: only coverage k of the pixels are painted
const thin = (p, k) => (x, y) => bayer(x, y) < k ? resolve(p, x, y) : -1;
// vertical / horizontal ramps through colours cs, dithered at the seams
const vramp = (cs, y0, y1) => (x, y) => { const f = Math.max(0, Math.min(.9999, (y - y0) / (y1 - y0))) * (cs.length - 1), i = Math.floor(f); return bayer(x, y) < f - i ? cs[Math.min(i + 1, cs.length - 1)] : cs[i]; };
const hramp = (cs, x0, x1) => (x, y) => { const f = Math.max(0, Math.min(.9999, (x - x0) / (x1 - x0))) * (cs.length - 1), i = Math.floor(f); return bayer(x, y) < f - i ? cs[Math.min(i + 1, cs.length - 1)] : cs[i]; };
const radial = (cs, cx, cy, r) => (x, y) => { const f = Math.max(0, Math.min(.9999, Math.hypot(x - cx, y - cy) / r)) * (cs.length - 1), i = Math.floor(f); return bayer(x, y) < f - i ? cs[Math.min(i + 1, cs.length - 1)] : cs[i]; };
// NB: ramps get absolute buffer coords; pass y0 / cx etc. already offset by OX / OY if you drew inside a shift().

function pset(x, y, p) {
  x = Math.floor(x + OX); y = Math.floor(y + OY);
  if (x < 0 || y < 0 || x >= PW || y >= PH) return;
  if (CLIP && (x < CLIP[0] || y < CLIP[1] || x >= CLIP[2] || y >= CLIP[3])) return;
  const c = typeof p === 'function' ? p(x, y) : p;
  if (c >= 0 && c !== NONE) CUR[y * PW + x] = c;
}
function rect(x, y, w, h, p) { x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pset(x + i, y + j, p); }
function hline(x0, x1, y, p) { for (let x = Math.round(Math.min(x0, x1)); x <= Math.round(Math.max(x0, x1)); x++) pset(x, y, p); }
function vline(x, y0, y1, p) { for (let y = Math.round(Math.min(y0, y1)); y <= Math.round(Math.max(y0, y1)); y++) pset(x, y, p); }
function line(x0, y0, x1, y1, p) {                           // Bresenham, both ends included
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (;;) { pset(x0, y0, p); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
// thick line: a square brush of side w walked along the line (limbs, scarves, umbrella shafts)
function tline(x0, y0, x1, y1, w, p) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))), o = Math.floor((w - 1) / 2);
  for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n) - o, y = Math.round(y0 + (y1 - y0) * i / n) - o; rect(x, y, w, w, p); }
}
function ellipse(cx, cy, rx, ry, p) {                        // filled, sampled at pixel centres
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry; if (u * u + v * v <= 1) pset(x, y, p);
  }
}
function ring(cx, cy, r, p) {                                // 1px circle outline
  for (let a = 0, n = Math.max(12, Math.ceil(r * 7)); a < n; a++) pset(Math.round(cx + Math.cos(a / n * TAU) * r), Math.round(cy + Math.sin(a / n * TAU) * r), p);
}
function poly(pts, p) {                                     // filled polygon [[x,y],...], even-odd at pixel centres
  const ys = pts.map(q => q[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y <= y1; y++) {
    const yc = y + .5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= yc) !== (by <= yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) pset(x, y, p);
  }
}
// sprite(rows, x, y, key, flip): rows are strings, key maps a character to an index (or paint); '.' and ' ' are holes
function sprite(rows, x, y, key, flip = false) {
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '.' || ch === ' ' || key[ch] == null) continue; pset(x + (flip ? r.length - 1 - i : i), y + j, key[ch]); } });
}

// ---------- groups with an auto outline ----------
function begin() { STACK.push(CUR); CUR = new Uint8Array(PW * PH).fill(NONE); }
// end(ol, alpha): stamps the group onto the layer below with a 1px outline ol (null = none); alpha < 1 = see-through
// (ordered dither), alpha 0 = nothing. Outline pixels obey the same alpha.
function end(ol = C.OL, alpha = 1) {
  const g = CUR; CUR = STACK.pop();
  if (alpha <= 0) return;
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const i = y * PW + x, v = g[i];
    if (alpha < 1 && bayer(x, y) >= alpha) continue;
    if (CLIP && (x < CLIP[0] || y < CLIP[1] || x >= CLIP[2] || y >= CLIP[3])) continue;
    if (v !== NONE) { CUR[i] = v; continue; }
    if (ol == null) continue;
    if ((x > 0 && g[i - 1] !== NONE) || (x < PW - 1 && g[i + 1] !== NONE) || (y > 0 && g[i - PW] !== NONE) || (y < PH - 1 && g[i + PW] !== NONE)) CUR[i] = ol;
  }
}
// recolour every pixel of colour a inside a box (for shading passes on an already painted area)
function swap(x, y, w, h, a, p) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (at(x + i, y + j) === a) pset(x + i, y + j, p); }
// recolour the whole buffer through a map {from: to} (night versions of a set, fading a room's colours ...)
function remap(m, x = 0, y = 0, w = PW, h = PH, k = 1) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    if (i < 0 || j < 0 || i >= PW || j >= PH || (k < 1 && bayer(i, j) >= k)) continue;
    const q = j * PW + i, to = m[CUR[q]]; if (to != null) CUR[q] = to;
  }
}

// ---------- time helpers (same names as the other kits) ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const easeOut = k => 1 - Math.pow(1 - k, 3);
const easeIn = k => k * k * k;
const back = k => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);     // overshoot ease-out
const hop = k => Math.sin(Math.PI * clamp(k));                                  // 0 -> 1 -> 0
const step = (v, n) => Math.floor(v * n) / n;                                   // quantise (choppy pixel motion)
const bt = n => OFF + n * BEAT;
const sbeat = t => (t - OFF) / BEAT;                                            // beat number (fractional) at time t
// pulse(t, n, len): 1 right on beat n, decaying to 0 over len seconds
const pulse = (t, n, len = .25) => { const d = t - bt(n); return d < 0 || d > len ? 0 : 1 - d / len; };
// beatPulse(t): pulse on every beat (for the choruses); downbeats only with every = 4
const beatPulse = (t, len = .2, every = 1) => { const b = Math.floor(sbeat(t) / every) * every; return pulse(t, b, len); };
// deterministic noise
const hash = (a, b = 0) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const lcg = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
