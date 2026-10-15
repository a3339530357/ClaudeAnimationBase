// fx.js: the hits. Kicks, shakes and zoom punches driven by event times; impact frames; lightning; speed lines;
// shockwave rings. Everything is a pure function of t, like the rest of the kit.

// ---------- events in time ----------
// A kick at t0: 0 before, 1 at t0, then it decays (k = speed). The building block of every hit.
const kick = (t, t0, k = 8) => t < t0 ? 0 : Math.exp(-k * (t - t0));
// Camera shake from events [[t0, amplitude px, decay?], ...]: [dx, dy] to add to the camera, changing 24 times a second.
function shakes(t, list) { let a = 0; for (const [t0, amp, k = 7] of list) a += amp * kick(t, t0, k); return a > .3 ? shakeXY(t, a) : [0, 0]; }
// Zoom punch from events [[t0, amount, decay?], ...]: multiply the camera zoom by it. Fast in, eased back.
const punch = (t, list) => 1 + list.reduce((s, [t0, amt, k = 6]) => s + amt * kick(t, t0, k), 0);
// Index of the latest event time at or before t (-1 before the first): for "one thing per syllable" beats.
const stepAt = (t, t0, step, n) => t < t0 ? -1 : Math.min(n - 1, Math.floor((t - t0) / step + 1e-6));

// ---------- post effects (applied by composite() in core.js) ----------
// POST is reset every frame. impactFrame() turns the whole frame into an inverted, high-contrast ink silhouette for the
// frames it's called on (the anime "impact frame"); use it for 2-3 frames on the biggest hits only.
let POST = {};
function impactFrame(on = true) { if (on) POST.filter = 'invert(1) grayscale(1) contrast(3.2)'; }
// The whole frame drained to ink and paper (the stop-time in S13 paints Clawd back in colour on top, see mono()).
function monoFrame(k) { if (k > .01) POST.filter = `grayscale(${clamp(k).toFixed(3)}) contrast(${(1 + .25 * clamp(k)).toFixed(3)})`; }

// ---------- polyline ribbon ----------
// Like ribbon() in core.js but without smoothing, so jagged shapes (bolts, cracks) keep their corners.
function strip(P, w0, w1 = w0) {
  const n = P.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const w = lerp(w0, w1, i / Math.max(1, n - 1)) / 2;
    L.push([P[i][0] - dy / d * w, P[i][1] + dx / d * w]); R.push([P[i][0] + dy / d * w, P[i][1] - dx / d * w]);
  }
  return L.concat(R.reverse());
}

// ---------- lightning ----------
// A jagged bolt from (x0, y0) to (x1, y1) by midpoint displacement. The shape is fixed by seed; vary the seed per boil
// frame (o.flicker) for a crackling bolt.
function boltPts(x0, y0, x1, y1, seed, rough = .22, depth = 5) {
  let P = [[x0, y0], [x1, y1]];
  for (let d = 0; d < depth; d++) {
    const Q = [P[0]];
    for (let i = 0; i < P.length - 1; i++) {
      const [ax, ay] = P[i], [bx, by] = P[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
      const off = (hash(seed * 31.7 + d * 7.3 + i * 13.1) - .5) * 2 * rough * L;
      Q.push([(ax + bx) / 2 - (by - ay) / L * off, (ay + by) / 2 + (bx - ax) / L * off], P[i + 1]);
    }
    P = Q;
  }
  return P;
}
// Paint a bolt. o: k (0..1, how far it has struck from the start), fade (0..1), w (core width), seed, flicker,
// branches (count), col (core), glowCol, glows (how many glow dots along it; each costs a brush flush), rough.
function bolt(x0, y0, x1, y1, o = {}) {
  const k = clamp(o.k ?? 1), a = 1 - clamp(o.fade ?? 0);
  if (k <= .001 || a <= .001) return;
  const seed = (o.seed ?? 1) + (o.flicker ? (BOILN % 4) * 101 : 0);
  boilSeed('bolt' + (o.seed ?? 1));
  const P = boltPts(x0, y0, x1, y1, seed, o.rough ?? .22, o.depth ?? 5);
  const Q = P.slice(0, Math.max(2, Math.round(P.length * k))), w = (o.w ?? 24) * (.4 + .6 * a);
  const g = o.glows ?? 4;
  for (let i = 0; i < g; i++) { const p = Q[Math.round((i + .5) / g * (Q.length - 1))]; glow(p[0], p[1], w * 7, o.glowCol || '#FFE27A', a); }
  for (let b = 0; b < (o.branches ?? 2); b++) {   // forks leave from points along the bolt, angled away from it
    const i0 = Math.floor(lerp(.2, .75, hash(seed + b * 3.3)) * (P.length - 1)); if (i0 >= Q.length - 1) continue;
    const [px, py] = P[i0], len = Math.hypot(x1 - x0, y1 - y0) * lerp(.15, .3, hash(seed + b * 5.1)), ang = Math.atan2(y1 - y0, x1 - x0) + (b % 2 ? .7 : -.7);
    const F = boltPts(px, py, px + Math.cos(ang) * len, py + Math.sin(ang) * len, seed + b * 17, .3, 3);
    paint(strip(F.slice(0, Math.max(2, Math.round(F.length * clamp(k * 1.6 - .3)))), w * .45, w * .1), { wash: o.col || '#FFF6C8', washOp: 255 * a, ink: PAL.ink, sw: .9 });
  }
  paint(strip(Q, w, w * .3), { wash: o.col || '#FFF6C8', washOp: 255 * a, ink: PAL.ink, sw: 1.3 });
}

// ---------- speed lines (集中线) ----------
// Tapered ink wedges from outside the frame toward a clear ring of radius r around (cx, cy). k = 0..1 strength.
// Flat washes, no outlines: cheap even without a GPU. They redraw on every boil frame, like hand-drawn lines.
function speedLines(cx, cy, k, o = {}) {
  if (k <= .02) return;
  const n = o.n ?? 46, r = o.r ?? 320, col = o.col || PAL.ink;
  boilSeed('speed');
  for (let i = 0; i < n; i++) {
    const h = hash(i * 3.17 + BOILN * .71), a = (i + h * .8) / n * TAU, r1 = r + hash(i * 7.7 + BOILN) * r * .6, r2 = 1500;
    const w = (6 + hash(i * 5.3 + BOILN * .3) * 22) * k, c = Math.cos(a), s = Math.sin(a), px = -s * w, py = c * w;
    paint([[cx + c * r1, cy + s * r1], [cx + c * r2 + px, cy + s * r2 + py], [cx + c * r2 - px, cy + s * r2 - py]], { wash: col, washOp: 235 * clamp(k * 1.3), ink: null });
  }
}

// ---------- shockwave ring ----------
// A painted ring of radius r and thickness w around (cx, cy); squash it with ry for a ground ring. fade 0..1.
function shockRing(cx, cy, r, w, o = {}) {
  const a = 1 - clamp(o.fade ?? 0); if (a <= .01 || r < 2) return;
  const n = 40, ry = o.ry ?? 1, P = [];
  for (let i = 0; i <= n; i++) { const t = i / n * TAU; P.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r * ry]); }
  boilSeed('ring' + (o.key ?? 0));
  paint(strip(P, w * a, w * a), { wash: o.col || PAL.cream, washOp: 255 * a, ink: o.ink === undefined ? PAL.ink : o.ink, sw: 1 });
}

// ---------- dust cloud ----------
// Puffs bursting out of (cx, cy). k 0..1: at 1 they cover the whole frame (use it as a smoke transition).
function dust(cx, cy, k, o = {}) {
  if (k <= .01) return;
  boilSeed('dust' + (o.key ?? 0));
  const n = o.n ?? 16, reach = o.reach ?? 1400;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + hash(i * 2.3) * .5, d = reach * easeOut(k) * (.25 + hash(i * 4.7) * .5), r = (60 + 520 * k) * (.6 + hash(i * 8.1) * .6) * (o.size ?? 1);
    paint(ellPts(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .55 - k * 120, r, r * .8, 18, r * .06), { wash: mixCol('#CFC4B0', '#8E8579', hash(i * 5.5) * .6), ink: PAL.ink, sw: .7 });
  }
}
