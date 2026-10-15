// mfx.js: manga effects and panels. Light (glowW, beam) is ADDED, so it only shows on dark ground, like real light.
// Screen-space helpers (focusLines, speedLines, flashScreen) are meant to be called outside a camera.

function glowW(x, y, r, a = 1, col = '#FFFFFF') {
  if (a <= 0 || r < 1) return;
  const g = X.createRadialGradient(x, y, 0, x, y, r), c = col.match(/\w\w/g).map(h => parseInt(h, 16)).join(',');
  [[0, .9], [.2, .55], [.5, .18], [1, 0]].forEach(([s, k]) => g.addColorStop(s, `rgba(${c},${k * clamp(a)})`));
  X.save(); X.globalCompositeOperation = 'lighter'; X.fillStyle = g; X.fillRect(x - r, y - r, 2 * r, 2 * r); X.restore();
}
// a cone of light from (x, y) spreading to width w at distance len, along angle ang (radians, 0 = right, PI/2 = down)
function beam(x, y, ang, len, w0, w, a = .5, col = '#FFFFFF') {
  if (a <= 0) return;
  const c = Math.cos(ang), s = Math.sin(ang), px = -s, py = c, ex = x + c * len, ey = y + s * len;
  const g = X.createLinearGradient(x, y, ex, ey), cc = col.match(/\w\w/g).map(h => parseInt(h, 16)).join(',');
  g.addColorStop(0, `rgba(${cc},${a})`); g.addColorStop(1, `rgba(${cc},0)`);
  X.save(); X.globalCompositeOperation = 'lighter'; X.fillStyle = g;
  X.fill(pathOf([[x + px * w0 / 2, y + py * w0 / 2], [ex + px * w / 2, ey + py * w / 2], [ex - px * w / 2, ey - py * w / 2], [x - px * w0 / 2, y - py * w0 / 2]]));
  X.restore();
}
function flashScreen(k, col = WHITE) { if (k <= .005) return; X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = clamp(k); X.fillStyle = col; X.fillRect(-10, -10, W + 20, H + 20); X.restore(); }
function fillScreen(fill) { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); fillPath(pathOf(rectPts(-10, -10, W + 20, H + 20)), fill); X.restore(); }

// 集中线: wedges from beyond the frame toward (cx, cy), stopping around radius rIn. o.n, o.col, o.w (outer width), o.key
function focusLines(cx, cy, rIn, o = {}) {
  boilSeed('focus' + (o.key || ''));
  const n = o.n || 90, R = 2600, p = new Path2D();
  for (let i = 0; i < n; i++) {
    const a = (i + rnd() * .8) / n * TAU, r = rIn * (.85 + rnd() * .6) * (rnd() < .15 ? 1.4 : 1), w = (o.w || 26) * (.3 + rnd());
    const c = Math.cos(a), s = Math.sin(a), px = -s, py = c;
    p.moveTo(cx + c * R + px * w, cy + s * R + py * w); p.lineTo(cx + c * r, cy + s * r); p.lineTo(cx + c * R - px * w, cy + s * R - py * w); p.closePath();
  }
  X.fillStyle = o.col || INK; X.globalAlpha = o.a ?? 1; X.fill(p); X.globalAlpha = 1;
}
// 速度线: parallel streaks along angle a over the whole screen (or o.rect = [x, y, w, h]); o.n, o.col, o.len, o.key
function speedLines(a, o = {}) {
  boilSeed('speed' + (o.key || ''));
  const [rx, ry, rw, rh] = o.rect || [0, 0, W, H], n = o.n || 50, c = Math.cos(a), s = Math.sin(a), D = Math.hypot(rw, rh);
  X.save(); X.beginPath(); X.rect(rx, ry, rw, rh); X.clip();
  for (let i = 0; i < n; i++) {
    const d = (rnd() - .5) * D, mx = rx + rw / 2 - s * d + c * (rnd() - .5) * D * .6, my = ry + rh / 2 + c * d + s * (rnd() - .5) * D * .6;
    const l = D * (o.len || .35) * (.4 + rnd()), w = (o.w || 5) * (.4 + rnd());
    pen([[mx - c * l / 2, my - s * l / 2], [mx + c * l / 2, my + s * l / 2]], w, { taper: [.5, .5], smooth: false, j: 0, col: o.col });
  }
  X.restore();
}
// 少女漫画 sparkle: a thin four-point star with a white body
function sparkle(x, y, r, o = {}) {
  if (r < 1) return;
  const P = starPts(x, y, r, .16, 4, o.rot ?? -Math.PI / 2);
  X.fillStyle = o.fill || WHITE; X.fill(pathOf(P));
  if (o.lw !== 0) { X.lineWidth = o.lw || Math.max(1, r * .05); X.strokeStyle = o.line || INK; X.lineJoin = 'miter'; X.stroke(pathOf(P)); }
  if (o.glow) glowW(x, y, r * 1.2, o.glow);
}
// floating bubbles behind a shoujo close-up: white circles with an ink rim and a highlight
function bubbles(cx, cy, R, n, t, key = 'bub') {
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 7.3 + key.length), h2 = hash(i * 3.1 + 2), r = 10 + 40 * hash(i * 5.7);
    const x = cx + (h1 - .5) * 2 * R, y = cy + (h2 - .5) * 2 * R * .6 - ((t * (20 + 30 * h1)) % (R * 1.2));
    boilSeed(key + i);
    shape(ellPts(x, y, r, r, 16), { fill: 'rgba(255,253,247,.55)', lw: 1.6, j: .4 });
    shape(ellPts(x - r * .35, y - r * .35, r * .18, r * .12, 10), { fill: WHITE, lw: 0, j: 0 });
  }
}
// rain: slanted strokes over a rect, falling with t
function rain(t, o = {}) {
  const [rx, ry, rw, rh] = o.rect || [-100, -100, W + 200, H + 200], n = o.n || 160, a = o.a ?? 1.35, c = Math.cos(a), s = Math.sin(a);
  for (let i = 0; i < n; i++) {
    const sp = 1400 + 600 * hash(i * 1.3), l = (o.len || 70) * (.6 + .8 * hash(i * 2.9));
    const x = rx + hash(i * 9.7) * rw, y0 = ry + ((hash(i * 4.1) * rh + t * sp) % rh);
    pen([[x, y0], [x + c * l, y0 + s * l]], (o.w || 2.2) * (.6 + hash(i)), { taper: [.4, .2], smooth: false, j: 0, col: o.col || INK });
  }
}
// 石化 cracks: branching zigzags from (x, y), grown by k 0..1
function cracks(x, y, r, k, o = {}) {
  boilSeed('crack' + (o.key || ''));
  const grow = (px, py, a, len, depth) => {
    const pts = [[px, py]]; let cx = px, cy = py, step = len / 5;
    for (let i = 0; i < 5 * k; i++) { a += jit(.6); cx += Math.cos(a) * step; cy += Math.sin(a) * step; pts.push([cx, cy]); }
    pen(pts, (o.w || 3) * (depth ? .6 : 1), { smooth: false, taper: [0, .5], col: o.col });
    if (depth < 2) for (let b = 0; b < 2; b++) { const i = 1 + Math.floor(rnd() * (pts.length - 1)); if (pts[i]) grow(pts[i][0], pts[i][1], a + jit(1.2), len * .5, depth + 1); }
  };
  for (let i = 0; i < (o.n || 6); i++) grow(x, y, i / (o.n || 6) * TAU + jit(.4), r, 0);
}
// a blob of ink (splashes, wipes): a lumpy circle with droplets
function inkBlob(x, y, r, key = 'blob', col = INK) {
  boilSeed(key);
  const P = []; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, q = r * (.75 + .5 * rnd()); P.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); }
  shape(P, { fill: col, lw: 0, j: 0 });
  for (let i = 0; i < 9; i++) { const a = rnd() * TAU, d = r * (1.1 + rnd() * .7), q = r * (.04 + rnd() * .1); shape(ellPts(x + Math.cos(a) * d, y + Math.sin(a) * d, q, q, 10), { fill: col, lw: 0, j: 0 }); }
}

// ---------- panels ----------
// panel(poly, fn, o): clip to the polygon, draw fn() inside (it paints the whole panel, background included), then the
// border. o.lw border weight (default 7), o.slam 0..1 slams the panel in from o.from = [dx, dy] with a little overshoot,
// o.bg fills first. The paper outside the panels is the gutter.
function panel(poly, fn, o = {}) {
  let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
  const k = o.slam == null ? 1 : o.slam; if (k <= 0) return;
  const [fx, fy] = o.from || [0, 0], e = backOut(k), sc = lerp(o.zoomFrom ?? 1.15, 1, e);
  X.save();
  X.translate(fx * (1 - e), fy * (1 - e)); X.translate(cx, cy); X.scale(sc, sc); X.rotate((o.rot || 0) * (1 - e)); X.translate(-cx, -cy);
  const path = pathOf(poly);
  if (o.shadow !== false) { X.save(); X.translate(10, 12); X.fillStyle = 'rgba(20,18,22,.35)'; X.fill(path); X.restore(); }
  X.save(); X.clip(path);
  if (o.bg) fillPath(path, o.bg);
  fn();
  X.restore();
  X.lineWidth = o.lw ?? 7; X.strokeStyle = o.line || INK; X.lineJoin = 'miter'; X.stroke(path);
  X.restore();
}
// a page of paper with nothing on it (behind panels)
function page(col = PAPER) { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.fillStyle = col; X.fillRect(-10, -10, W + 20, H + 20); X.drawImage(PAPER_C, 0, 0); X.restore(); }
