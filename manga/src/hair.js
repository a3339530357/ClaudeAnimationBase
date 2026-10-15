// hair.js: hairstyles. Each is { back(v, side, E, spec), front(v, side, E, spec) } in head units (see face.js).
// back goes behind the face (in a profile, over the back of the skull), front over it: bangs, side locks, a ponytail
// over the shoulder. Hair is built from a cap plus LOCKS (tapered leaf shapes along a spine), so it has the clumps and
// points of drawn manga hair. Black hair is solid ink with white shine lines; 阿飞's dyed hair is light tone.

const warp = (P, v) => P.map(([x, y]) => [wx(x, v), y]);
const sway = (E, k = 1, ph = 0) => Math.sin((E.t || 0) * 2.1 + ph) * k;
// the cap: an arc over the skull from (-rx, cy) to (rx, cy) through the top
function capArc(rx, ry, cy, n = 14) { const P = []; for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI; P.push([Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return P; }
// a straight-cut fringe edge: tips along y = yt from x1 back to x0, notches d above them
function zig(x1, x0, n, yt, d, seed = 1, sharp = .55) {
  const P = []; for (let i = 0; i <= n; i++) {
    const x = lerp(x1, x0, i / n), h = hash(i * 7.1 + seed);
    P.push([x, yt + (h - .5) * 3]); if (i < n) P.push([lerp(x1, x0, (i + .5) / n), yt - d * (sharp + (1 - sharp) * hash(i * 3.3 + seed))]);
  }
  return P;
}
function hairFill(P, o = {}) { return shape(P, { fill: o.fill || INK, tone: o.tone, lw: lw(o.lw ?? 2), j: o.j ?? .4, line: o.line }); }
// lock(spine, w): a clump of hair from the root (first point) to a sharp tip. o.fill/o.tone as hairFill, o.shine draws
// a white line down it (black hair), o.strand an ink line (light hair). Returns the outline.
function lock(spine, w, o = {}) {
  const P = through(boil(spine, o.j ?? .3), 5), n = P.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1), a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const hw = w / 2 * (k < .18 ? lerp(.8, 1, k / .18) : Math.pow((1 - k) / .82, .85)) + .2;
    L.push([P[i][0] - dy / d * hw, P[i][1] + dx / d * hw]); R.push([P[i][0] + dy / d * hw, P[i][1] - dx / d * hw]);
  }
  const S = L.concat(R.reverse());
  if (o.fill !== null) { X.fillStyle = o.fill || INK; X.fill(pathOf(S)); }
  if (o.tone) fillPath(pathOf(S), 'tone:' + o.tone);
  pen(S, lw(o.lw ?? 1.7), { smooth: false, taper: [.08, .08], j: 0 });
  if (o.shine) pen(P.slice(Math.floor(n * .15), Math.floor(n * .75)).map(([x, y]) => [x + (o.shine === true ? 0 : o.shine), y]), lw(1.1), { col: WHITE, taper: [.5, .5], j: .2 });
  if (o.strand) pen(P.slice(Math.floor(n * .1), Math.floor(n * .8)), lw(.9), { taper: [.4, .6], j: .2 });
  return S;
}
const locks = (list, v, o) => list.forEach(([sp, w, oo]) => lock(warp(sp, v), w, { ...o, ...oo }));
// the sheen (天使环): short white strokes in an arc band around (cx, cy)
function sheen(cx, cy, rx, ry, a0, a1, n = 9, len = 7, w = 1.8, v = 0) {
  for (let i = 0; i < n; i++) {
    const a = lerp(a0, a1, (i + .5) / n), x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, l = len * (.6 + .6 * hash(i * 5.3));
    pen(warp([[x, y - l / 2], [x + (hash(i) - .5) * 2, y + l / 2]], v), lw(w), { col: WHITE, taper: [.5, .5], j: .2 });
  }
}

// ---------- 小鹿, before: straight black hair, 齐刘海, side locks, a low ponytail over her right shoulder ----------
// tied with THE red hair tie (spec.tie = false: no tie, hair loose there; E.tieSnap 0..1 the band breaking)
const HAIR_LU = {
  back(v, side, E, spec) {
    if (side) {
      hairFill([[25, -38], [12, -52], [-10, -58], [-34, -48], [-44, -24], [-43, 4], [-36, 26], [-24, 40], [-12, 38], [-8, 22], [-14, 4], [-4, -14], [12, -26]]);
      sheen(-10, -22, 26, 28, -2.7, -1.25, 8, 8, 2); return;
    }
    hairFill(warp([[0, -58], [24, -54], [40, -38], [44, -14], [43, 10], [38, 30], [24, 44], [0, 50], [-22, 50], [-34, 44], [-41, 26], [-44, 0], [-42, -28], [-28, -50]], v));
  },
  front(v, side, E, spec) {
    const tie = spec.tie !== false;
    if (side) {
      hairFill([[30, -11], [33, -22], [26, -38], [12, -51], [-6, -56], [-6, -40], [6, -30], [16, -20], [24, -9]]);
      ponytail(-12, 40, E, tie, 0); return;
    }
    ponytail(wx(-31, v), 46, E, tie, v);
    hairFill(warp(capArc(41, 50, -8).concat(zig(38, -38, 8, -9, 8, 2)), v));
    sheen(0, -26, 29, 21, -2.75, -.4, 11, 8, 2, v);
    locks([[[[-37, -14], [-40, 8], [-38, 30], [-35, 38]], 9, {}], v > .6 ? null : [[[37, -14], [40, 8], [38, 30], [35, 38]], 9, {}]].filter(Boolean), v, { shine: true });
  },
};
// the low ponytail: gathered at (gx, gy), hanging over the shoulder; the red tie wrapped round the gather
function ponytail(gx, gy, E, tie, v) {
  const s = sway(E, 2.5, .6), loose = tie ? 0 : 1;
  lock([[gx - 2, gy - 2], [gx + 1, gy + 30], [gx - 1 + s * .5, gy + 66 + loose * 6], [gx - 5 + s, gy + 104 + loose * 10], [gx - 9 + s, gy + 122 + loose * 12]], 17 + loose * 6, { shine: -2 });
  lock([[gx - 4, gy + 4], [gx - 8, gy + 40], [gx - 10 + s * .6, gy + 80], [gx - 14 + s, gy + 104]], 9, { shine: true });
  if (tie) hairTie(gx - 2, gy + 6, 1, E.tieSnap || 0);
}
// the red hair tie: a band wrapped twice with two little knots; snap 0..1 breaks it and the halves spring apart
function hairTie(x, y, k = 1, snap = 0) {
  boilSeed('tie');
  if (snap <= 0) {
    for (const dy of [-2.2, 2.2]) shape(ellPts(x, y + dy, 8.5 * k, 3 * k, 16), { fill: RED, lw: lw(1.1), j: .15 });
    shape(ellPts(x + 8.5 * k, y + 1, 2.6 * k, 2.6 * k, 10), { fill: RED, lw: lw(1), j: .1 });
    shape(ellPts(x + 10 * k, y + 5.5, 2.2 * k, 2.2 * k, 10), { fill: RED, lw: lw(1), j: .1 });
    X.fillStyle = 'rgba(255,253,247,.8)'; X.fill(pathOf(ellPts(x - 3 * k, y - 3, 3 * k, .8, 8)));
    return;
  }
  const e = easeOut(snap);
  for (const sd of [-1, 1]) {   // two curled halves flying apart
    const cx = x + sd * (6 + 26 * e), cy = y + 4 + 40 * e * e, r = sd * (.6 + 2.2 * e);
    const P = []; for (let i = 0; i <= 8; i++) { const a = r + i / 8 * 2.4 * sd; P.push([cx + Math.cos(a) * (8 - i * .4), cy + Math.sin(a) * (4 - i * .2)]); }
    pen(P, lw(3.2 * k), { col: RED, taper: [.1, .2], j: .2 });
  }
}

// ---------- 小鹿, after: the same bangs, long black hair let down in loose waves ----------
function wave(x, y0, y1, amp, ph, E, k = 1, drift = 0) { const P = []; for (let i = 0; i <= 6; i++) P.push([x + drift * i / 6 + Math.sin(i * 1.05 + ph) * amp * Math.min(1, i / 1.5) + sway(E, 1.4 * k, i * .5 + ph) * (i / 6), lerp(y0, y1, i / 6)]); return P; }
const HAIR_LU_BAD = {
  back(v, side, E) {
    if (side) {
      hairFill([[25, -38], [12, -52], [-10, -58], [-35, -47], [-46, -20], [-46, 14], [-38, 40], [-14, 40], [-8, 20], [-14, 2], [-4, -14], [12, -26]]);
      for (const [x, ph, w] of [[-42, 0, 22], [-30, 1.4, 20], [-18, 2.6, 16]]) lock(wave(x, 20, 160 - ph * 8, 5, ph, E), w, { shine: true });
      sheen(-10, -22, 26, 28, -2.7, -1.25, 8, 8, 2); return;
    }
    hairFill(warp([[0, -59], [26, -55], [42, -38], [46, -10], [47, 20], [40, 46], [20, 56], [-20, 56], [-40, 46], [-47, 20], [-46, -10], [-42, -38], [-26, -55]], v));
    const L = []; for (const [x, ph, w, end, dr] of [[-38, 0, 28, 170, -12], [-30, 2, 24, 150, -6], [-20, 3.4, 20, 118, -2], [38, 1, 28, 168, 12], [30, 2.8, 24, 148, 6], [20, 4.2, 20, 116, 2]]) L.push([wave(x, 6, end, 9, ph, E, 1, dr), w, { shine: true }]);
    locks(L, v, {});
  },
  front(v, side, E) {
    if (side) {
      hairFill([[30, -11], [33, -22], [26, -38], [12, -51], [-6, -56], [-6, -40], [6, -30], [16, -20], [24, -9]]);
      lock(wave(-8, 16, 150, 5, .8, E), 18, { shine: true }); return;
    }
    hairFill(warp(capArc(42, 51, -8).concat(zig(39, -39, 8, -9, 8, 2)), v));
    sheen(0, -26, 30, 21, -2.75, -.4, 11, 8, 2, v);
    const L = [[wave(-38, -14, 140, 7, .5, E), 15, {}]]; if (v <= .6) L.push([wave(38, -14, 138, 7, 1.9, E), 15, {}]);
    locks(L, v, { shine: true });
  },
};
