// face.js: manga heads. Local units: the head is 100 tall (crown y = -50, chin y = +50), x = 0 down the middle of a
// front view. head(x, y, s, spec, ex, o) draws one at (x, y) = head centre, s px per unit (a 400 px head: s = 4).
//   o.v   yaw, -1..1: 0 = front, ±1 = three-quarter (right / left); o.side = true for a profile (facing o.v sign)
//   o.tilt radians, o.t time (tears fall, hair sways), o.cut = true skips everything above the eyes (a panel crop)
// A turn uses the drawn key views (front, 3/4, profile) like an anime turn; between front and 3/4 the features slide
// (wx), the near half of the face widening and the far half narrowing, so in-betweens read as a head turning.
// ex (expression): { eyes: 'open'|'closed'|'happy'|'shock', open 0..1, look [x, y], brow -1 (angry) .. 1 (worried),
//   mouth: 'line'|'smile'|'grin'|'open'|'frown'|'tremble'|'smirk'|'o'|'part', mo 0..1 (how open), blush, tears (welling),
//   cry (streams), sweat }

let FS = 1;                                    // px per unit of the head being drawn (keeps hairlines from vanishing)
const lw = w => Math.max(w, 1.15 / FS);
const wx = (x, v) => 11 * v + x * (x < 0 ? 1 + .35 * v : 1 - .47 * v);     // a front-view x, turned by v (0..1)

// skull + face outline, front and 3/4 (same point count, so in-betweens are a lerp); jaw rows 4..8 differ for boys
const FACE0 = [[-37, -14], [-37, 2], [-35, 14], [-30, 27], [-22, 38], [-11, 47], [0, 51], [11, 47], [22, 38], [30, 27], [35, 14], [37, 2], [37, -14], [34, -32], [22, -46], [0, -51], [-22, -46], [-34, -32]];
const FACE1 = [[-37, -14], [-37, 2], [-35, 14], [-31, 27], [-22, 39], [-8, 48], [6, 51], [16, 46], [24, 36], [29, 24], [31, 12], [29, 3], [31, -6], [31, -14], [29, -32], [17, -46], [-5, -51], [-26, -45]];
// boys: a longer face and a firmer jaw, chin at 56
const FACEM0 = [[-37, -14], [-37, 2], [-36, 14], [-33, 28], [-25, 41], [-13, 51], [0, 56], [13, 51], [25, 41], [33, 28], [36, 14], [37, 2], [37, -14], [34, -32], [22, -46], [0, -51], [-22, -46], [-34, -32]];
const FACEM1 = [[-37, -14], [-37, 2], [-36, 14], [-33, 28], [-24, 42], [-9, 52], [6, 56], [17, 51], [26, 40], [30, 27], [31, 14], [29, 4], [31, -6], [31, -14], [29, -32], [17, -46], [-5, -51], [-26, -45]];
// profile, facing right: back of the skull, nape, jaw, chin, lips, nose, brow, forehead
const SIDE = [[-38, -14], [-39, 4], [-34, 18], [-24, 30], [-14, 38], [2, 46], [18, 50], [27, 46], [30, 40], [29, 36], [32, 33.5], [31, 30.5], [33, 27.5], [32, 23], [38, 17], [32, 7], [30, -3], [31, -14], [27, -32], [14, -46], [-8, -51], [-28, -44]];

const SIDEM = SIDE.map(([x, y], i) => i >= 3 && i <= 9 ? [x, y + (i === 3 ? 2 : 5)] : [x, y]);   // a longer chin
function faceOutline(v, male) {
  const A = male ? FACEM0 : FACE0, B = male ? FACEM1 : FACE1;
  return A.map((p, i) => [lerp(p[0], B[i][0], v), lerp(p[1], B[i][1], v)]);
}

function head(x, y, s, spec, ex = {}, o = {}) {
  const side = !!o.side, flip = (o.v || 0) < 0 || (side && o.flipSide), v = side ? 1 : Math.min(1, Math.abs(o.v || 0));
  const key = 'head' + (spec.name || '') + (o.key || '');
  at(x, y, s, o.tilt || 0, flip, () => {
    FS = Math.hypot(X.getTransform().a, X.getTransform().b);
    const E = { open: 1, look: [0, 0], brow: 0, mouth: 'line', mo: 0, ...spec.ex0, ...ex, t: o.t || 0 };
    if (o.rear) { if (o.part !== 'back') rearHead(spec, E); return; }
    if (!side && o.part !== 'front') { boilSeed(key + 'hb'); spec.hair.back && spec.hair.back(v, side, E, spec); }
    if (o.part === 'back') return;
    // the face: paper-white skin, inked outline (the top of the skull is under the hair anyway)
    boilSeed(key + 'f');
    const F = side ? (spec.male ? SIDEM : SIDE) : faceOutline(v, spec.male);
    const P = through(boil(F, .35), 6, true);
    X.fillStyle = WHITE; X.fill(pathOf(P));
    if (spec.shadeFace && !side) { X.save(); X.clip(pathOf(P)); fillPath(pathOf([[wx(14, v), -60], [60, -60], [60, 60], [wx(20, v), 60]]), 'tone:.12'); X.restore(); }
    loop(P, lw(2.2), { smooth: false, heavy: Math.PI * .35 });
    if (side) { boilSeed(key + 'hb'); spec.hair.back && spec.hair.back(v, side, E, spec); }
    if (side) sideFeatures(E, spec); else frontFeatures(v, E, spec);
    boilSeed(key + 'hf'); spec.hair.front && spec.hair.front(v, side, E, spec);
    browsOver(v, side, E, spec);
    boilSeed(key + 'acc'); spec.acc && spec.acc(v, side, E, spec);
  });
}

// the back of the head: the hair seen from behind (ears showing on boys), the nape locks from the hairstyle's back layer
function rearHead(spec, E) {
  boilSeed('rear' + spec.name);
  const light = spec.male && spec.name !== 'stranger', fill = { fill: light || spec.name === 'stranger' ? WHITE : INK, tone: light ? FEI_TONE : spec.name === 'stranger' ? .55 : 0 };
  if (spec.ears) for (const sd of [-1, 1]) shape([[sd * 36, -2], [sd * 43, -4], [sd * 44, 8], [sd * 40, 18], [sd * 35, 16]], { fill: WHITE, lw: lw(1.6), j: .2 });
  if (spec.name === 'lubad') { spec.hair.back(0, false, E, spec); }
  shape([[0, -59], [28, -54], [43, -36], [46, -10], [42, 14], [30, 32], [12, 42], [-12, 42], [-30, 32], [-42, 14], [-46, -10], [-43, -36], [-28, -54]], { ...fill, lw: lw(2), j: .4 });
  if (fill.fill === INK) sheen(0, -20, 30, 24, -2.6, -.5, 10, 9, 2);
  else for (const [a, b] of [[[-20, -50], [-26, 20]], [[0, -56], [-2, 30]], [[20, -50], [24, 22]]]) pen([a, b], lw(1), { taper: [.4, .5] });
  if (spec.name === 'fei') locks([[[[-26, 20], [-30, 40], [-28, 54]], 13, {}], [[[0, 30], [0, 48], [-2, 60]], 13, {}], [[[26, 20], [30, 40], [28, 54]], 13, {}]], 0, FEIO);
  if (spec.name === 'lu' && spec.tie !== false) hairTie(-30, 40, 1, E.tieSnap || 0);
}

// ---------- front / three-quarter features ----------
function frontFeatures(v, E, spec) {
  const ey = spec.eyeY ?? 6;
  // ears (a girl's are under her hair; a boy's show, with an earring if he has one)
  if (spec.ears) for (const sd of [-1, 1]) {
    if (sd > 0 && v > .55) continue;
    const ex = sd < 0 ? lerp(-37, -36, v) : lerp(37, 31, v), w = sd < 0 ? 1 : 1 - .6 * v;
    shape([[ex, ey - 4], [ex + sd * 6 * w, ey - 6], [ex + sd * 7 * w, ey + 4], [ex + sd * 4 * w, ey + 14], [ex, ey + 15]], { fill: WHITE, lw: lw(1.6), j: .2 });
    pen([[ex + sd * 2 * w, ey], [ex + sd * 4.5 * w, ey + 2], [ex + sd * 3 * w, ey + 8]], lw(1), { j: .2 });
    if (spec.earring && sd === 1) { X.lineWidth = lw(1.4); X.strokeStyle = INK; X.beginPath(); X.arc(ex + 3.5 * w, ey + 17, 2.4, 0, TAU); X.stroke(); }
  }
  for (const sd of [-1, 1]) {
    const far = sd > 0, sc = far ? 1 - .38 * v : 1 + .08 * v;
    eye(wx(sd * (spec.eyeX ?? 17), v), ey, sc, sd, E, spec, far && v > .2);
  }
  nose(v, E, spec);
  mouth(wx(0, v) + (spec.mouthX || 0), spec.mouthY ?? 35, 1 - .25 * v, E, spec);
  cheeks(v, E, spec);
}

// sd = -1 for the eye on the viewer's left. far: the narrowed far eye of a 3/4 view.
function eye(cx, cy, sc, sd, E, spec) {
  const m = spec.male, hw = (m ? 9.5 : 10.5), lid = m ? 7.5 : 11, f = x => cx + sd * x * sc;   // f: x outward from the eye centre
  const op = clamp(E.open) * (E.eyes === 'closed' || E.eyes === 'happy' ? 0 : 1);
  if (op < .12) {   // closed: a soft curve with lashes (∪ calm, ∩ happy)
    const up = E.eyes === 'happy' ? -1 : 1;
    pen([[f(-hw), cy + 1], [f(0), cy + 1 + up * 4], [f(hw + 1), cy - (up < 0 ? -1 : 1)]], lw(m ? 2.2 : 2.8), { press: [.5, 1.4] });
    if (!m) for (let i = 0; i < 2; i++) pen([[f(hw - 2 + i * 2.5), cy + .5], [f(hw + 1 + i * 3.5), cy + 3 + i * 2.5]], lw(1.1), { taper: [0, .7] });
    return;
  }
  const yl = y => lerp(cy + 6, y, op);   // upper lid points close down toward the lower lid
  const U = m ? [[-hw, cy + .5], [-5, cy - 4.5], [3, cy - 6.2], [hw + 1.5, cy - 4.5]] : [[-hw, cy - 1.5], [-5, cy - 9], [2, cy - 11], [8, cy - 8.8], [hw + 1, cy - 4.5]];
  const Lo = m ? [[hw + 1.5, cy - 4.5], [5, cy + 4], [-3, cy + 5], [-hw, cy + .5]] : [[hw + 1, cy - 4.5], [8, cy + 6.5], [1, cy + 10], [-6, cy + 8.5], [-hw, cy - 1.5]];
  const up = U.map(([x, y]) => [f(x), yl(y)]), lo = Lo.map(([x, y]) => [f(x), y]);
  const open = through(up, 5).concat(through(lo, 5));
  X.save(); X.clip(pathOf(open));
  X.fillStyle = WHITE; X.fill(pathOf(open));
  // the iris: ink, a lighter crescent below, the pupil, two highlights
  const shock = E.eyes === 'shock', ix = cx + E.look[0] * 3.2 * sc, iy = cy + 1 + E.look[1] * 2.2, rx = (m ? 5 : 6.8) * sc * (shock ? .55 : 1), ry = (m ? 6.4 : 9.6) * (shock ? .55 : 1);
  X.fillStyle = INK; X.fill(pathOf(ellPts(ix, iy, rx, ry, 24)));
  if (!shock) {
    fillPath(pathOf(ellPts(ix, iy + ry * .38, rx * .72, ry * .45, 20)), 'tone:.4');
    X.fillStyle = INK; X.fill(pathOf(ellPts(ix, iy + ry * .05, rx * .38, ry * .42, 16)));
    X.fillStyle = WHITE; X.fill(pathOf(ellPts(ix - rx * .38 * sd, iy - ry * .42, rx * .36, ry * .3, 14)));
    X.fill(pathOf(ellPts(ix + rx * .35 * sd, iy + ry * .45, rx * .14, ry * .12, 10)));
    if (E.tears > 0) {   // welling: a wobbling shine along the bottom of the iris
      X.globalAlpha = clamp(E.tears); X.fill(pathOf(through([[ix - rx * .8, iy + ry * .5], [ix - rx * .3, iy + ry * .38 + wob(E.t, 3) * .6], [ix + rx * .3, iy + ry * .44], [ix + rx * .8, iy + ry * .3]], 4).concat([[ix + rx, iy + ry], [ix - rx, iy + ry]])));
      X.globalAlpha = 1;
    }
  } else { X.fillStyle = WHITE; X.fill(pathOf(ellPts(ix - rx * .3, iy - ry * .3, rx * .25, ry * .25, 8))); }
  X.restore();
  // the upper lid: heavy toward the outer corner, lashes flicking out; a crease above
  const lidW = lw((m ? 2.4 : 3.2) * (E.liner ? 1.5 : 1));
  pen(through(up, 5), lidW, { press: [.45, 1.5], taper: [.15, .05], smooth: false });
  if (!m) {
    const [ox, oy] = up[up.length - 1];
    pen([[ox - sd * 1.5 * sc, oy + .5], [ox + sd * 2.6 * sc, oy - 2.6]], lw(1.6), { taper: [0, .8] });
    pen([[f(5), yl(cy - 10)], [f(7.5), yl(cy - 13.2)]], lw(1.2), { taper: [0, .8] });
  }
  if (op > .5) pen([[f(-5), cy - 12.5 - (m ? -3 : 0)], [f(2), cy - 14.5 - (m ? -3.5 : 0)], [f(8), cy - 12 - (m ? -3 : 0)]], lw(.9), { taper: [.4, .4] });
  // lower lid: only the outer half, thin
  pen([[f(1), cy + (m ? 5 : 9.6)], [f(6), cy + (m ? 3.6 : 7.8)], [f(hw - 1), cy + (m ? .2 : 3)]], lw(m ? 1.1 : 1.2), { taper: [.5, .3] });
  // cat-eye liner: the wing out and up past the corner, and the lower line at the outer third; smoky = toned lid
  if (E.liner) {
    const [ox, oy] = up[up.length - 1];
    pen([[ox - sd * 3 * sc, oy + 1], [ox + sd * 4 * sc, oy - 2.6], [ox + sd * 9.5 * sc, oy - 6.5]], lw(3), { press: [1.3, .2], taper: [0, .6] });
    pen([[f(2), cy + 9.2], [f(7), cy + 6.5], [f(hw + 1.5), cy - 3.5]], lw(1.6), { taper: [.4, 0] });
  }
  if (E.smoky) {
    X.save(); X.globalCompositeOperation = 'multiply';
    fillPath(pathOf(through([[f(-hw - 1), cy - 2], [f(-4), cy - 15], [f(6), cy - 16], [f(hw + 6), cy - 8], [f(hw + 2), cy - 4], [f(2), yl(cy - 11)], [f(-hw), cy - 1.5]], 4, true)), 'tone:.3');
    X.restore();
  }
}

// brows go over the bangs (manga convention: they read through the hair)
function browsOver(v, side, E, spec) {
  const ey = spec.eyeY ?? 6, m = spec.male, by = ey - (m ? 12 : 15.5) - (E.browUp || 0);
  boilSeed('brows' + (spec.name || ''));
  const halo = (P, w, o) => { if (spec.browHalo) pen(P, w + lw(2.6), { ...o, col: WHITE }); pen(P, w, o); };
  if (side) { halo([[16, by + 1 + E.brow * 1.5], [22, by - 1], [27, by + .5]], lw(m ? 2.6 : 1.6), { taper: [.3, .5] }); return; }
  for (const sd of [-1, 1]) {
    const sc = sd > 0 ? 1 - .38 * v : 1 + .08 * v, cx = wx(sd * (spec.eyeX ?? 17), v), f = x => cx + sd * x * sc;
    const inner = by + 1 - E.brow * 3.5, outer = by + 1.5 + E.brow * 1;
    halo([[f(-8), inner], [f(0), by - 1.5 - (E.brow > 0 ? 0 : -E.brow * 1.2)], [f(9), outer]], lw(m ? 2.8 : 1.7), { taper: [.25, .5], press: [m ? 1.2 : 1, .7] });
  }
}

function nose(v, E, spec) {
  const nx = wx(1, v), ny = spec.noseY ?? 23;
  if (v < .3) pen([[nx + .5, ny - 2], [nx + 1.8, ny + 1]], lw(1.2), { taper: [.5, .2] });
  else { pen([[nx - 3, ny - 11], [nx + 1, ny - 2], [nx + 4, ny + 1.5], [nx + 1, ny + 2.6]], lw(1.3), { taper: [.6, .3] }); }
  if (spec.male && v < .3) pen([[nx - 3, ny + 2], [nx - 1, ny + 2.5]], lw(.9), { taper: [.5, .5] });
}

// mouth at (mx, my); w squeezes it in a 3/4 view. Red lips / dark lips are shapes; otherwise ink marks.
function mouth(mx, my, w, E, spec) {
  const K = E.mouth, k = E.smirk ?? (K === 'smirk' ? 1 : 0), x = d => mx + d * w;
  if (E.lips) return lips(mx, my, w, E);
  if (K === 'grin' || K === 'open' || K === 'o') {
    const mo = Math.max(.3, E.mo || 1);
    const P = K === 'grin' ? [[x(-8), my - 1], [x(0), my - .2], [x(8), my - 1], [x(5), my + 4 * mo], [x(0), my + 7 * mo], [x(-5), my + 4 * mo]]
            : ellPts(mx, my + 2, (K === 'o' ? 2.8 : 4.6) * w * (.6 + .4 * mo), (K === 'o' ? 3.2 : 6.5) * mo, 14);
    const S = shape(P, { fill: INK, lw: lw(1.4), j: .25 });
    if (K !== 'o') { X.save(); X.clip(pathOf(S)); fillPath(pathOf(ellPts(mx, my + (K === 'grin' ? 7 : 8) * mo, 5 * w, 3.5 * mo, 12)), 'tone:.35'); X.restore(); }
    return;
  }
  const lines = {
    line: [[-5, 0], [0, .4], [5, 0]], smile: [[-7, -1.2], [0, 2.2], [7, -1.2]], frown: [[-6, 2], [0, -.8], [6, 2]],
    smirk: [[-6, 1], [1, 1.2], [7, -2.6]], part: [[-5, 0], [0, .6], [5, 0]],
    tremble: [[-6, 1], [-3, -.6], [0, 1], [3, -.6], [6, 1]],
  }[K] || [[-5, 0], [0, .4], [5, 0]];
  pen(lines.map(([dx, dy]) => [x(dx), my + dy + (K === 'tremble' ? wob(E.t, 9) * .5 : 0)]), lw(spec.male ? 1.7 : 1.5), { taper: [.35, .35] });
  if (K === 'part') pen([[x(-2), my + 3], [x(2), my + 3.2]], lw(.9), { taper: [.5, .5] });
}
// lips: upper with a cupid's bow, fuller lower with a highlight. E.lips = RED or INK. E.smirk lifts the right corner,
// E.mouth 'smile' lifts both, 'part' opens them a little.
function lips(mx, my, w, E) {
  const k = E.mouth === 'smirk' ? 1 : 0, sm = E.mouth === 'smile' ? 1 : 0, gap = E.mouth === 'part' ? 1.6 : 0;
  const lift = (dx) => -(sm * Math.pow(Math.abs(dx) / 9, 2) * 2.5) - (k * Math.max(0, dx) / 9 * 3.2);
  const p = (dx, dy) => [mx + dx * w, my + dy + lift(dx)];
  const upper = [p(-9, 0), p(-5, -2.8), p(-1.2, -2.4), p(0, -1.6), p(1.2, -2.4), p(5, -2.8), p(9, 0), p(4, .5), p(0, .2), p(-4, .5)];
  const lower = [p(-8, .6 + gap), p(-4, 1 + gap), p(4, 1 + gap), p(8, .6 + gap), p(5, 4.8 + gap), p(0, 6 + gap), p(-5, 4.8 + gap)];
  const col = E.lips, dk = col === RED ? REDDK : INK;
  for (const L of [upper, lower]) shape(L, { fill: col, lw: lw(.8), line: dk, j: .15 });
  if (gap) shape([p(-7, .5), p(0, 1.2), p(7, .5), p(0, gap + 1.2)], { fill: INK, lw: 0, j: 0 });
  pen([p(-9, 0), p(-4, .7), p(0, .5), p(4, .7), p(9, 0)], lw(1), { col: dk, taper: [.3, .3] });
  X.fillStyle = 'rgba(255,253,247,.85)'; X.fill(pathOf(ellPts(mx + 1.5 * w, my + 2.8 + gap + lift(1.5), 2.6 * w, .9, 10)));
}

function cheeks(v, E, spec) {
  if (E.blush > 0) for (const sd of [-1, 1]) {
    if (sd > 0 && v > .7) continue;
    const cx = wx(sd * 21, v), cy = (spec.eyeY ?? 6) + 15;
    X.globalAlpha = clamp(E.blush);
    for (let i = 0; i < 4; i++) pen([[cx - 4 + i * 2.6, cy + 2], [cx - 2.2 + i * 2.6, cy - 2]], lw(1), { taper: [.4, .4], j: .2 });
    X.globalAlpha = 1;
  }
  if (E.cry > 0) for (const sd of [-1, 1]) {   // streams down the cheeks, drops falling off the chin
    if (sd > 0 && v > .7) continue;
    const cx = wx(sd * 20, v), y0 = (spec.eyeY ?? 6) + 9, L = 34 * clamp(E.cry);
    const P = []; for (let i = 0; i <= 6; i++) P.push([cx + sd * (i * .6) + Math.sin(i * 1.3 + E.t * 7) * .9, y0 + L * i / 6]);
    const R = []; for (let i = 6; i >= 0; i--) R.push([P[i][0] + sd * (1.6 + i * .25), P[i][1]]);
    shape(P.concat(R), { fill: WHITE, lw: lw(1), j: .2 });
    for (let d = 0; d < 2; d++) { const ph = frac(E.t * 1.6 + d * .5 + (sd > 0 ? .25 : 0)), dy = y0 + L + ph * 30; shape(ellPts(cx + sd * 4, dy, 1.6, 2.2, 10), { fill: WHITE, lw: lw(.9), j: 0 }); }
  }
  if (E.smear > 0) {   // a tear has run the liner of her right eye (viewer's left) down her cheek
    const cx = wx(-18, v), y0 = (spec.eyeY ?? 6) + 8, L = 30 * clamp(E.smear);
    const P = []; for (let i = 0; i <= 6; i++) P.push([cx + Math.sin(i * 1.7) * 1.2 - i * .3, y0 + L * i / 6]);
    pen(P, lw(2.6), { press: [1.4, .3], taper: [0, .4], j: .3 });
    pen(P.map(([x, y]) => [x + 2.5, y]), lw(1), { taper: [.2, .6], j: .3 });
  }
  if (E.sweat > 0) {
    const sx = wx(30, v), sy = -16;
    shape([[sx, sy - 7 * E.sweat], [sx + 3.5 * E.sweat, sy + 1], [sx, sy + 4 * E.sweat], [sx - 3.5 * E.sweat, sy + 1]], { fill: WHITE, lw: lw(1.3), j: .2 });
  }
}

// ---------- profile features (facing right) ----------
function sideFeatures(E, spec) {
  const ey = spec.eyeY ?? 6, m = spec.male;
  if (spec.ears) { shape([[-8, ey - 4], [-1, ey - 5], [1, ey + 6], [-3, ey + 15], [-8, ey + 13]], { fill: WHITE, lw: lw(1.6), j: .2 }); if (spec.earring) { X.lineWidth = lw(1.4); X.strokeStyle = INK; X.beginPath(); X.arc(-4, ey + 18, 2.4, 0, TAU); X.stroke(); } }
  const op = clamp(E.open) * (E.eyes === 'closed' || E.eyes === 'happy' ? 0 : 1);
  if (op < .12) pen([[16, ey + 1], [21, ey + 3.5], [26, ey + 1]], lw(2.4), { press: [.5, 1.3] });
  else {
    const U = [[14, ey - 2], [20, ey - (m ? 5.5 : 8) * op], [26, ey - 3 * op]], Lo = [[26, ey - 3 * op], [24.5, ey + (m ? 4 : 7)], [17, ey + 4]];
    const open = through(U, 4).concat(through(Lo, 4));
    X.save(); X.clip(pathOf(open)); X.fillStyle = WHITE; X.fill(pathOf(open));
    X.fillStyle = INK; X.fill(pathOf(ellPts(23 + E.look[0], ey + 1, m ? 2.6 : 3.2, m ? 5.5 : 8, 14)));
    X.fillStyle = WHITE; X.fill(pathOf(ellPts(23.6, ey - 2.5, 1, 1.6, 8)));
    X.restore();
    pen(through(U, 4), lw((m ? 2.4 : 3) * (E.liner ? 1.4 : 1)), { press: [.5, 1.4], smooth: false });
    if (!m) pen([[26, ey - 3], [29, ey - 6.5]], lw(1.5), { taper: [0, .8] });
    if (E.liner) pen([[24, ey - 3.5], [28, ey - 6], [32, ey - 9.5]], lw(2.4), { press: [1.2, .2], taper: [0, .6] });
  }
  // lips sit on the outline; a mouth corner line runs back from them
  if (E.lips) {
    shape([[33.2, 27.4], [31, 28.6], [29, 30.2], [31.6, 30.5]], { fill: E.lips, lw: lw(.7), line: E.lips === RED ? REDDK : INK, j: .1 });
    shape([[31.6, 30.9], [29, 31], [30, 33], [32.3, 33.6]], { fill: E.lips, lw: lw(.7), line: E.lips === RED ? REDDK : INK, j: .1 });
    pen([[31.4, 30.7], [27.5, 30.6 - (E.mouth === 'smirk' || E.mouth === 'smile' ? 1.6 : 0)]], lw(1), { col: E.lips === RED ? REDDK : INK, taper: [.2, .6] });
  } else pen([[31.2, 30.7], [27, 30.8 - (E.mouth === 'smile' || E.mouth === 'smirk' ? 1.6 : E.mouth === 'frown' ? -1 : 0)]], lw(1.4), { taper: [.2, .6] });
  if (E.cry > 0) { const L = 30 * E.cry; shape([[22, ey + 7], [23.5, ey + 7], [24 + Math.sin(E.t * 7) * .6, ey + 7 + L], [22, ey + 7 + L]], { fill: WHITE, lw: lw(1), j: .2 }); }
}
