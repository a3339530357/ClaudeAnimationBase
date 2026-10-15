// world.js: the seaside town, painted at five times of day. Skies are flat wash bands (cheap everywhere) with a few soft
// watercolour clouds; the sea, the sand, the town, the pier and the lighthouse are flat washes and ink.

// ---------- time of day ----------
// sky: four stops from the top of the frame down to the horizon. The film runs dusk → night → dawn → day → gold.
const TOD = {
  dusk:  { sky: ['#4E3F7E', '#A8608A', '#EE8A6A', '#F8C47A'], sea: '#4C5E9C', seaLt: '#F2B07A', sand: '#E8C49A', sandDk: '#C99A72', town: '#5A4470', win: '#FFD98A' },
  night: { sky: ['#0F1338', '#1B2150', '#29306A', '#39407E'], sea: '#151C42', seaLt: '#6E7AB8', sand: '#4E4A70', sandDk: '#3A3658', town: '#1C1E44', win: '#FFD98A' },
  dawn:  { sky: ['#2F3C7A', '#7A5C9A', '#E9878F', '#F7D79A'], sea: '#3D4F8E', seaLt: '#F4B98A', sand: '#D9B79A', sandDk: '#B28E78', town: '#4A3E6A', win: '#FFE2A0' },
  day:   { sky: ['#5FA8DC', '#86BFE6', '#B2DAEE', '#DCEFF2'], sea: '#3A93B8', seaLt: '#C4EAF0', sand: '#F0D9AE', sandDk: '#D4B486', town: '#E8D6C0', win: '#7FA8C8' },
  gold:  { sky: ['#6A4E8E', '#D0708A', '#F49A6A', '#FBD58A'], sea: '#56609E', seaLt: '#FFC98A', sand: '#EEC596', sandDk: '#CC9C70', town: '#7A5070', win: '#FFE2A0' },
};
// A palette between two times of day (k = 0 → a, 1 → b).
function todMix(a, b, k) {
  const A = TOD[a] || a, B = TOD[b] || b, o = {};
  for (const key in A) o[key] = Array.isArray(A[key]) ? A[key].map((c, i) => mixCol(c, B[key][i], k)) : mixCol(A[key], B[key], k);
  return o;
}
const skyAt = (P, f) => { const s = P.sky, x = clamp(f) * (s.length - 1), i = Math.min(s.length - 2, Math.floor(x)); return mixCol(s[i], s[i + 1], x - i); };

// Sky from y0 down to the horizon y1, in flat bands. o.clouds: how many soft clouds (they drift with t).
function skyFill(P, y1 = 600, o = {}) {
  const y0 = o.y0 ?? -300, n = o.n ?? 20, h = (y1 - y0) / n;
  boilSeed('sky');
  for (let i = 0; i < n; i++) paint(rectPts(-2400, y0 + i * h - 2, W + 4800, h + 4), { wash: skyAt(P, (i + .5) / n), ink: null });
  for (let i = 0; i < (o.clouds ?? 0); i++) {
    const cx = frac(hash(i * 3.1) + (o.t || 0) * .006 * (1 + hash(i))) * (W + 600) - 300, cy = y0 + 200 + hash(i * 7.7) * (y1 - y0 - 340);
    cloud(cx, cy, 70 + 60 * hash(i * 2.3), mixCol(skyAt(P, (cy - y0) / (y1 - y0)), o.cloudCol || '#FFF2E2', .35), 'cl' + i);
  }
}
function cloud(x, y, s, col, key = 'c') {
  boilSeed('cloud ' + key);
  const P = []; for (let i = 0; i < 30; i++) { const a = i / 30 * TAU, up = Math.sin(a) < 0, r = up ? 1 + .3 * Math.abs(Math.sin(a * 2.5)) : .9; P.push([x + Math.cos(a) * s * 2.2 * r, y + Math.sin(a) * s * (up ? .9 : .4) * r]); }
  paint(P, { wash: col, ink: null, curv: .4 });
}
function sunDisc(x, y, r, col = '#FFE2A0', g = 1) {
  glow(x, y, r * 5, mixCol(col, '#FFB070', .4), .8 * g);
  boilSeed('sun'); paint(ellPts(x, y, r, r, 40), { wash: col, ink: null });
}
function moon(x, y, r) { glow(x, y, r * 4, '#E8ECFF', .6); boilSeed('moon'); paint(ellPts(x, y, r, r, 30), { wash: '#F4EFD8', ink: null }); paint(ellPts(x + r * .3, y - r * .2, r * .22, r * .22, 12), { wash: '#E2DCC0', ink: null }); }
function stars(t, n, rect = [0, -200, W, 700], key = 's') {
  boilSeed('stars ' + key);
  for (let i = 0; i < n; i++) {
    const x = rect[0] + hash(i * 1.37 + 3) * rect[2], y = rect[1] + hash(i * 2.71 + 5) * rect[3], tw = .6 + .4 * Math.sin(t * (1 + hash(i)) * 3 + i), r = (1.5 + 3 * hash(i * 5.3)) * tw;
    paint(starPts(x, y, r * 2.2, .35, 4), { wash: '#FFF6DA', washOp: 200 + 55 * tw, ink: null });
  }
}

// ---------- sea and sand ----------
// The sea from the horizon y0 down. o.sunX: a glittering reflection column under the sun. Waves drift with t.
function sea(P, y0, t, o = {}) {
  boilSeed('sea');
  paint(rectPts(-2400, y0, W + 4800, H + 600 - y0), { wash: P.sea, ink: null });
  paint(rectPts(-2400, y0, W + 4800, 40), { wash: mixCol(P.sea, P.seaLt, .35), ink: null });
  if (o.sunX != null) for (let i = 0; i < 16; i++) {
    const yy = y0 + 14 + i * i * 2.4, w = (40 + i * 9) * (.7 + .3 * Math.sin(t * 3 + i * 1.7)), xx = o.sunX + Math.sin(i * 2.1 + t * 1.5) * (8 + i * 2);
    paint(rectPts(xx - w / 2, yy, w, 4 + i * .4), { wash: P.seaLt, washOp: 230, ink: null });
  }
  for (let i = 0; i < (o.waves ?? 22); i++) {
    const row = hash(i * 4.1), yy = y0 + 30 + row * row * (H - y0 + 60), sc = .4 + row * 1.2, xx = frac(hash(i * 7.3) + t * .015 * (1 + row)) * (W + 400) - 200;
    inkLine([[xx - 30 * sc, yy], [xx, yy - 6 * sc], [xx + 30 * sc, yy]], .5 + .5 * sc, mixCol(P.sea, P.seaLt, .55), 'inkfine', .6);
  }
}
// Sand from a wavy edge at y down. o.wet: the darker wet band and a foam line that washes in and out with t.
function sand(P, y, t, o = {}) {
  boilSeed('sand');
  const edge = []; for (let i = 0; i <= 12; i++) edge.push([-400 + i * (W + 800) / 12, y + Math.sin(i * 1.3 + (o.ph || 0)) * 10]);
  if (o.wet !== false) {
    const sw = Math.sin(t * 1.6) * 14;
    paint([...edge.map(([x, yy]) => [x, yy - 26 + sw]), [W + 400, H + 400], [-400, H + 400]], { wash: mixCol(P.sand, P.sea, .35), ink: null });
    inkLine(edge.map(([x, yy], i) => [x, yy - 24 + sw + Math.sin(i * 2.2 + t * 2) * 5]), 2.2, mixCol(PAL.cream, P.seaLt, .3), 'dry', .5);
  }
  paint([...edge, [W + 400, H + 400], [-400, H + 400]], { wash: P.sand, ink: null });
  for (let i = 0; i < 26; i++) { const x = hash(i * 3.3) * W, yy = y + 40 + hash(i * 6.1) * (H - y); paint(ellPts(x, yy, 4 + 6 * hash(i), 2 + 2 * hash(i), 8), { wash: P.sandDk, washOp: 160, ink: null }); }
}

// ---------- the town ----------
// One house: (x, y) = bottom-left. o.lit: window glow 0..1; o.door.
function house(x, y, w, h, col, roof, o = {}) {
  paint(rectPts(x, y - h, w, h), { wash: col, ink: o.ink ?? PAL.ink, sw: o.sw ?? .6 });
  paint([[x - w * .08, y - h], [x + w / 2, y - h - w * .45], [x + w * 1.08, y - h]], { wash: roof, ink: o.ink ?? PAL.ink, sw: o.sw ?? .6 });
  const nw = Math.max(1, Math.round(w / 70));
  for (let i = 0; i < nw; i++) {
    const wx = x + (i + .5) * w / nw - w * .1, wy = y - h * .72, ww = w * .2 / Math.max(1, nw * .6), lit = o.lit ?? 0;
    if (lit > .02) glow(wx + ww / 2, wy + ww * .6, ww * 2.2, o.win || '#FFD98A', lit * .7);
    paint(rectPts(wx, wy, ww, ww * 1.2), { wash: lit > .02 ? mixCol('#3A3350', o.win || '#FFD98A', lit) : mixCol(col, PAL.ink, .45), ink: null });
  }
}
// A row of houses along y (their bottoms), seeded by key. o.sc scales them, o.lit lights windows.
function townRow(P, y, o = {}) {
  boilSeed('town ' + (o.key || ''));
  const sc = o.sc ?? 1, cols = o.cols || [P.town, mixCol(P.town, '#FFFFFF', .12), mixCol(P.town, PAL.ink, .12)];
  let x = o.x0 ?? -120, i = 0;
  while (x < (o.x1 ?? W + 120)) {
    const w = (90 + 70 * hash(i * 3.7 + (o.seed || 0))) * sc, h = (80 + 90 * hash(i * 5.9 + (o.seed || 0))) * sc;
    house(x, y + hash(i * 2.2) * 8 * sc, w, h, cols[i % cols.length], mixCol(cols[(i + 1) % cols.length], '#B4505A', o.roofK ?? .35), { lit: (o.lit ?? 0) * (hash(i * 9.1) > .3 ? 1 : .2), win: P.win, ink: o.ink, sw: .5 * sc });
    x += w + 8 * sc; i++;
  }
}
// The lighthouse: (x, y) = its foot, s = scale (it's about 30s tall). o.beam 0..1 lights the lamp.
function lighthouse(x, y, s, o = {}) {
  boilSeed('lighthouse');
  const sw = clamp(s / 10, .4, 1.4), top = y - 26 * s;
  paint([[x - 4 * s, y], [x - 2.6 * s, top], [x + 2.6 * s, top], [x + 4 * s, y]], { wash: '#F4EEE2', ink: PAL.ink, sw });
  for (let k = 0; k < 3; k++) {   // red bands
    const y0 = y - (5 + k * 7.5) * s, y1 = y0 - 3.4 * s, w0 = lerp(4, 2.6, (y - y0) / (26 * s)), w1 = lerp(4, 2.6, (y - y1) / (26 * s));
    paint([[x - w0 * s, y0], [x - w1 * s, y1], [x + w1 * s, y1], [x + w0 * s, y0]], { wash: '#D8394E', ink: null });
  }
  paint(rectPts(x - 3.6 * s, top - .8 * s, 7.2 * s, .9 * s), { wash: '#3A3340', ink: PAL.ink, sw: sw * .7 });
  if (o.beam) glow(x, top - 2.6 * s, 14 * s, '#FFE9A8', o.beam);
  paint(rectPts(x - 1.8 * s, top - 4.4 * s, 3.6 * s, 3.6 * s), { wash: o.beam ? '#FFF0B0' : '#CFE4EA', ink: PAL.ink, sw: sw * .7 });
  paint([[x - 2.6 * s, top - 4.4 * s], [x, top - 6.6 * s], [x + 2.6 * s, top - 4.4 * s]], { wash: '#D8394E', ink: PAL.ink, sw: sw * .7 });
  paint(rectPts(x - .7 * s, y - 3 * s, 1.4 * s, 3 * s), { wash: '#5A4A60', ink: PAL.ink, sw: sw * .6 });
}
// A wooden pier from x0 to x1 with its deck top at y; posts go down into the water to yb.
function pier(x0, x1, y, yb, o = {}) {
  boilSeed('pier ' + (o.key || ''));
  const th = o.th ?? 34, wood = o.wood || '#9A6A4A', dk = mixCol(wood, PAL.ink, .35);
  for (let x = x0 + 30; x < x1; x += o.step ?? 150) paint(rectPts(x, y + th - 4, 22, yb - y - th), { wash: dk, ink: PAL.ink, sw: .5 });
  paint(rectPts(x0, y, x1 - x0, th), { wash: wood, ink: PAL.ink, sw: .8 });
  for (let x = x0 + 40; x < x1; x += 46) inkLine([[x, y + 3], [x + 2, y + th - 3]], .5, dk, 'inkfine', 0);
  if (o.rail !== false) {
    inkLine([[x0, y - 70], [x1, y - 70]], 2.2, dk, 'ink', 0);
    for (let x = x0 + 20; x < x1; x += 120) paint(rectPts(x, y - 76, 10, 76), { wash: dk, ink: null });
  }
}
// A street lamp: (x, y) = foot, h tall. on 0..1.
function lampPost(x, y, h, on = 1) {
  boilSeed('lamp' + x);
  paint(rectPts(x - 6, y - h, 12, h), { wash: '#3A3340', ink: null });
  inkLine([[x, y - h], [x + 40, y - h - 20], [x + 70, y - h + 4]], 3, '#3A3340', 'ink', .5);
  if (on > .01) glow(x + 70, y - h + 20, 260, '#FFD98A', on);
  paint([[x + 50, y - h + 4], [x + 90, y - h + 4], [x + 80, y - h + 26], [x + 60, y - h + 26]], { wash: on > .01 ? '#FFF0B8' : '#9A93A8', ink: PAL.ink, sw: .6 });
}
// A round tree: (x, y) = foot of the trunk, s = scale.
function tree(x, y, s, col = '#6E9F58', key = 't') {
  boilSeed('tree ' + key);
  paint(rectPts(x - 1.2 * s, y - 14 * s, 2.4 * s, 14 * s), { wash: '#7A5A44', ink: PAL.ink, sw: .7 });
  for (const [dx, dy, r] of [[-5, -18, 6], [5, -19, 6.5], [0, -25, 7], [-1, -15, 5.5]]) paint(ellPts(x + dx * s, y + dy * s, r * s, r * s * .85, 18), { wash: col, ink: null });
  for (const [dx, dy, r] of [[-3, -24, 2.2], [4, -21, 1.8]]) paint(ellPts(x + dx * s, y + dy * s, r * s, r * s * .7, 12), { wash: mixCol(col, '#FFFFFF', .2), ink: null });
}

// ---------- creatures ----------
// A seagull facing right (flip: left). (x, y) = body centre, s = scale (wingspan ~10s). o.flap: wing phase (0..1 cycle),
// o.tired: droopy wings and half-closed eye, o.hold(x, y): something in its beak (a photo).
function seagull(x, y, s, o = {}) {
  push(); translate(x, y); if (o.flip) scale(-1, 1); if (o.rot) rotate(o.rot);
  boilSeed('gull' + (o.key ?? ''));
  const sw = clamp(s / 9, .35, 1.3), f = Math.sin((o.flap ?? .25) * TAU), droop = o.tired ? .6 : 0;
  const tipY = -f * 3.4 * s + droop * 2.4 * s, mid = -f * 1.6 * s + droop * s;
  const wing = (dx, col, k) => paint([[dx + .8 * s, -.3 * s], [dx - .6 * s, mid - .6 * s], [dx - 4.4 * s * k, tipY * k], [dx - 1.8 * s * k, mid + .6 * s], [dx - .4 * s, .3 * s]], { wash: col, ink: PAL.ink, sw: sw * .7, curv: .2 });
  wing(.6 * s, '#CFCAC0', .8);   // the far wing, behind the body
  paint(ellPts(0, 0, 2.2 * s, 1.05 * s, 16), { wash: '#FBF8F2', ink: PAL.ink, sw });
  paint(ellPts(2.1 * s, -.8 * s, .95 * s, .85 * s, 12), { wash: '#FBF8F2', ink: PAL.ink, sw });
  paint([[2.9 * s, -.8 * s], [4 * s, -.5 * s], [2.9 * s, -.35 * s]], { wash: '#F2B23A', ink: PAL.ink, sw: sw * .6 });
  if (o.tired) inkLine([[2.15 * s, -1 * s], [2.55 * s, -.95 * s]], sw * .8, PAL.ink, 'inkfine', 0);
  else paint(ellPts(2.35 * s, -1 * s, .16 * s, .2 * s, 8), { wash: PAL.ink, ink: null });
  paint([[-2 * s, -.3 * s], [-3.1 * s, -.6 * s], [-2.9 * s, .3 * s]], { wash: '#3A3340', ink: null });
  wing(0, '#F4F1EA', 1);
  if (o.hold) o.hold(3.7 * s, -.4 * s);
  pop();
}
// A little fish leaping: (x, y) = centre, s = scale, rot.
function fish(x, y, s, rot = 0, col = '#F2A23A') {
  push(); translate(x, y); rotate(rot); boilSeed('fish');
  paint(ellPts(0, 0, 2.2 * s, s, 14), { wash: col, ink: PAL.ink, sw: .6 });
  paint([[-1.8 * s, 0], [-3.2 * s, -1 * s], [-3.2 * s, 1 * s]], { wash: col, ink: PAL.ink, sw: .6 });
  paint(ellPts(1.2 * s, -.2 * s, .2 * s, .2 * s, 8), { wash: PAL.ink, ink: null });
  pop();
}

// ---------- sets the chapters come back to ----------
// The post office front (S2, S13): a cream wall, a blue door with an envelope sign, a board of stamps, a window with a
// flower box, the pavement from y = 880.
function postOffice() {
  boilSeed('po wall'); paint(rectPts(-2000, -200, W + 2600, 1090), { wash: '#F3E3C8', ink: null });
  paint(rectPts(-2000, -200, W + 2600, 260), { wash: '#B8324A', ink: null });
  for (let x = -1880; x < W + 200; x += 120) paint([[x, 60], [x + 60, 110], [x + 120, 60]], { wash: '#F3E3C8', ink: null });
  paint(rectPts(180, 380, 230, 510), { wash: '#5A7FB0', ink: PAL.ink, sw: .9 });
  paint(ellPts(295, 470, 52, 52, 20), { wash: '#BFD8EA', ink: PAL.ink, sw: .6 });
  paint(rectPts(240, 250, 110, 76), { wash: PAL.cream, ink: PAL.ink, sw: .7 }); inkLine([[242, 252], [295, 294], [348, 252]], 1, PAL.ink, 'ink', 0);
  paint(rectPts(1060, 250, 300, 300), { wash: '#A8C8E0', ink: PAL.ink, sw: .9 }); inkLine([[1210, 250], [1210, 550]], 2, PAL.ink, 'ink', 0);
  paint(rectPts(1040, 550, 340, 40), { wash: '#9A6A4A', ink: PAL.ink, sw: .6 });
  for (let i = 0; i < 7; i++) paint(ellPts(1065 + i * 48, 540, 20, 18, 10), { wash: ['#E27A92', '#F2A23A', '#FFF5E2'][i % 3], ink: null });
  boilSeed('stampboard'); paint(rectPts(520, 300, 380, 260), { wash: '#C9A070', ink: PAL.ink, sw: .8 });
  for (let i = 0; i < 12; i++) paint(rectPts(545 + (i % 4) * 88, 322 + Math.floor(i / 4) * 78, 60, 62), { wash: ['#E2492F', '#5BA86A', '#5A7FB0', '#F2A23A', '#7B5CA8', '#E27A92'][i % 6], ink: PAL.ink, sw: .4 });
  boilSeed('pavement'); paint(rectPts(-2000, 880, W + 2600, 400), { wash: '#D9C7AE', ink: null }); inkLine([[-200, 884], [W + 200, 884]], 1.4, '#B8A68E', 'ink', 0);
}
// The dune grass (S3, S14): sky, a strip of sea, the sand hill with grass along its ridge. dunesFront(t): the tall
// grass in front of everything, drawn last.
const grassTuft = (x, y, h, n, col, key, sway = 0) => {
  boilSeed('tuft ' + key);
  for (let i = 0; i < n; i++) { const dx = (i - n / 2) * 9, lean = (hash(i * 3.1 + x) - .5) * 40 + sway; paint(ribbon([[x + dx, y], [x + dx + lean * .4, y - h * .5], [x + dx + lean, y - h * (.7 + .3 * hash(i + x))]], 10, 1), { wash: col, ink: null }); }
};
function dunes(P, t) {
  skyFill(P, 520, { clouds: 3, t });
  sea(P, 520, t, { waves: 6 });
  boilSeed('dune'); paint(through([[-300, 700], [300, 600], [900, 640], [1500, 590], [2200, 660], [2200, 1300], [-300, 1300]], 4), { wash: '#E2BC8C', ink: null });
  for (let i = 0; i < 8; i++) grassTuft(100 + i * 250 + 60 * hash(i), 640 + 30 * hash(i * 2), 120, 7, '#8AA860', 'bg' + i, 10 * Math.sin(t * 2 + i));
}
function dunesFront(t, edges = false) { for (let i = 0; i < 9; i++) if (!edges || i < 1 || i > 7) grassTuft(-60 + i * 260 + 90 * hash(i * 5), 1100, 260 + 120 * hash(i), 9, i % 2 ? '#5E8F48' : '#6E9F58', 'fg' + i, 14 * Math.sin(t * 2.4 + i)); }
