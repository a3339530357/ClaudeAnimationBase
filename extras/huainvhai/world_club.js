// world_club.js: the bar and the rest of the indoors (and the shop fronts of the billboard street).
// Everything is flat wash and ink; light is glow(), flashing on the clap (clapK) and dipping on the kick (kickK).

// ---------- neon signs ----------
// A neon martini glass outline (the bar's sign, next to the heart), about 2r wide. on 0..1.
function neonGlass(x, y, r, on = 1, col = '#5FE3FF') {
  boilSeed('neonglass' + x);
  const segs = [[[x - r, y - r * .8], [x + r, y - r * .8], [x, y + r * .2]], [[x, y + r * .2], [x, y + r]], [[x - r * .45, y + r], [x + r * .45, y + r]]];
  const tube = mixCol('#3A3448', col, .25 + .75 * on);
  for (const S of segs) {
    if (on > .02) for (const p of S) glow(p[0], p[1], r * .9, col, on * .5);
    paint(ribbon(S, r * .1, r * .1), { wash: tube, ink: null });
    if (on > .02) paint(ribbon(S, r * .035, r * .035), { wash: mixCol(tube, '#FFFFFF', .7 * on), ink: null });
  }
}
// The bar's front: a dark brick wall, the black door (open 0..1 swings it in, spilling magenta light), and the sign
// above it (signOn 0..1): a neon heart and a neon glass. o.half kills half the heart (the last shot).
function barFront(x, yG, P, t, o = {}) {
  boilSeed('barfront');
  paint(rectPts(-900, -60, W + 1800, yG + 60), { wash: mixCol(P.wall, '#000000', .25), ink: null });
  for (let r = 0; r < 14; r++) for (let c = 0; c < 9; c++) {   // a few brick lines, not a whole wall of them
    if (hash(r * 13 + c * 7) < .55) continue;
    const bx = x - 900 + c * 220 + (r % 2) * 110, by = 60 + r * 64;
    inkLine([[bx, by], [bx + 200, by]], .6, mixCol(P.wall, '#000000', .55), 'inkfine', 0);
  }
  const dw = 300, dh = 460, dx = x - dw / 2, dy = yG - dh, open = clamp(o.open || 0);
  paint(rectPts(dx - 26, dy - 26, dw + 52, dh + 26), { wash: '#141018', ink: PAL.ink, sw: 2 });
  if (open > .01) {
    paint(rectPts(dx, dy, dw, dh), { wash: mixCol('#3A0A3A', '#FF4FC0', .4 + .3 * clapK(t)), ink: null });
    glow(x, dy + dh * .5, 420, '#FF4FC0', open);
    for (let i = 0; i < 4; i++) crowdSil(dx + 60 + i * 60, yG - 10, 4.2, i + 3, t, { dark: .7 });
  }
  paint([[dx, dy], [dx + dw * (1 - .85 * open), dy + 20 * open], [dx + dw * (1 - .85 * open), yG - 20 * open], [dx, yG]], { wash: '#0E0B12', ink: PAL.ink, sw: 1.4 });
  paint(ellPts(dx + dw * (1 - .85 * open) - 30, dy + dh * .52, 9, 9, 10), { wash: '#B8A890', ink: null });
  const on = clamp(o.signOn ?? 1);
  neonHeart(x - 90, dy - 150, 70, { on: on * (.75 + .25 * clapK(t)), half: o.half || 0, key: 'bar' });
  neonGlass(x + 110, dy - 150, 62, on * (.75 + .25 * clapK(t)));
  paint(ellPts(x, yG + 20, 700, 50, 24), { fill: mixCol(P.walk, '#000000', .3), fillOp: 160, ink: null });
}

// ---------- the dance floor ----------
// The room behind the crowd: a dark wall, the DJ's glow, light beams swinging from the ceiling (they flash on the clap
// and change colour every bar), a disco ball, and a floor of tiles lighting up in a pattern that steps on every beat.
function danceRoom(P, t, o = {}) {
  boilSeed('danceroom');
  const fy = o.floorY ?? 640, b = bpOf(t), bar = Math.floor(b / 4), dim = o.dim ?? 1;
  paint(rectPts(-900, -60, W + 1800, fy + 60), { wash: mixCol(P.near, '#000000', .2), ink: null });
  glow(960, fy - 120, 520, P.neon, .45 * dim);
  // the floor: three rows of tiles in perspective, lit in a beat-stepped checker
  for (let r = 0; r < 4; r++) {
    const y0 = fy + r * (r + 1) * 22, y1 = fy + (r + 1) * (r + 2) * 22, n = 10;
    for (let c = -2; c < n + 2; c++) {
      const xa = 960 + (c - n / 2) * (150 + r * 70), xb = xa + 150 + r * 70, lit = ((c + r + Math.floor(b)) % 3 === 0);
      const col = lit ? mixCol(P.neon, '#FFFFFF', .2 * clapK(t)) : mixCol(P.street, '#000000', .2);
      paint([[xa, y0], [xb, y0], [xb + (xb - 960) * .12, y1], [xa + (xa - 960) * .12, y1]], { wash: col, washOp: lit ? 150 * dim + 40 : 255, ink: mixCol(P.street, '#000000', .5), sw: .6 });
    }
  }
  paint(rectPts(-900, fy + 4 * 5 * 22, W + 1800, H), { wash: mixCol(P.street, '#000000', .3), ink: null });
  // beams from four lamps on the ceiling
  const cols = [P.neon, '#5FE3FF', '#FFD34F', '#B66BFF'];
  for (let i = 0; i < 4; i++) {
    const lx = 260 + i * 470, a = Math.sin(t * (.9 + .2 * i) + i * 1.7) * .55, len = 1100, col = cols[(i + bar) % 4];
    const k = (.35 + .65 * clapK(t)) * dim, ex = lx + Math.sin(a) * len, ey = -40 + Math.cos(a) * len;
    paint([[lx - 10, -40], [lx + 10, -40], [ex + 120, ey], [ex - 120, ey]], { fill: col, fillOp: 70 * k, bleed: .35, tex: .2, ink: null });
    glow(lx, -20, 120, col, k);
  }
  if (o.ball !== false) {   // the disco ball
    const bx = 960, by = 90;
    inkLine([[bx, -60], [bx, by - 40]], 1, '#8A8698', 'inkfine', 0);
    paint(ellPts(bx, by, 42, 42, 18), { wash: '#B8B4C8', ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + b * .5; paint(rectPts(bx + Math.cos(a) * 24 - 5, by + Math.sin(a) * 18 - 5, 10, 10), { wash: '#FFFFFF', ink: null }); }
    glow(bx, by, 150 * dim, '#FFFFFF', .4 + .5 * clapK(t));
  }
}
// The strobe: the whole frame flashes white on each clap (amt scales it). Call it after camEnd().
function strobe(t, amt = 1) { const k = clapK(t); if (k > .05) cover('#FFF6FF', .22 * amt * Math.pow(k, 3)); }

// ---------- the booth ----------
function booth(P, t, o = {}) {
  boilSeed('booth');
  paint(rectPts(-900, -60, W + 1800, H + 120), { wash: mixCol(P.wall, '#000000', .1), ink: null });
  const ny = 230, on = .65 + .35 * clapK(t);   // a neon strip running along the wall
  for (let i = 0; i < 6; i++) glow(-100 + i * 420, ny, 220, P.neon, .5 * on);
  paint(rrPts(-900, ny - 8, W + 1800, 16, 8), { wash: mixCol(P.neon, '#FFFFFF', .3 * on), ink: null });
  // the curved sofa: a tall red back, a seat, round arms
  const sx = o.x ?? 1060, sw = 1180, sy = o.seatY ?? 760;
  paint(rrPts(sx - sw / 2, sy - 380, sw, 330, 80), { wash: '#7A1830', fill: '#A82848', fillOp: 90, ink: PAL.ink, sw: 2 });
  for (let i = 1; i < 5; i++) inkLine([[sx - sw / 2 + i * sw / 5, sy - 360], [sx - sw / 2 + i * sw / 5, sy - 80]], .8, '#5A1024', 'inkfine', 0);
  paint(rrPts(sx - sw / 2 - 20, sy - 60, sw + 40, 120, 30), { wash: '#8E1E3A', ink: PAL.ink, sw: 2 });
  paint(rectPts(-900, sy + 60, W + 1800, H), { wash: mixCol(P.street, '#000000', .25), ink: null });
}
// The low table in front of the booth with a candle (glow) on it.
function boothTable(x, y, t) {
  boilSeed('btable');
  paint(ellPts(x, y, 260, 46, 22), { wash: '#2A1E2E', ink: PAL.ink, sw: 1.6 });
  paint(rectPts(x - 18, y, 36, 150), { wash: '#1E1622', ink: null });
  paint(rectPts(x - 60, y - 52, 22, 44), { wash: '#F6E8D0', ink: PAL.ink, sw: .8 });
  glow(x - 49, y - 62, 120, '#FFC870', .8 + .2 * Math.sin(t * 13));
  paint(ellPts(x - 49, y - 62, 6, 10, 8), { wash: '#FFE8A0', ink: null });
}

// ---------- the bar counter ----------
function barCounter(P, t, o = {}) {
  boilSeed('barcounter');
  const cy = o.y ?? 700, on = .7 + .3 * clapK(t);
  paint(rectPts(-900, -60, W + 1800, H + 120), { wash: mixCol(P.wall, '#000000', .2), ink: null });
  for (let s = 0; s < 2; s++) {   // two back shelves of bottles, lit from below
    const sy = 230 + s * 190;
    paint(rectPts(-900, sy, W + 1800, 14), { wash: '#3A2A3A', ink: null });
    glow(960, sy + 10, 700, P.neon, .35 * on);
    for (let i = 0; i < 22; i++) {
      const bx = -200 + i * 110 + 30 * hash(i + s), bh = 70 + 50 * hash(i * 3 + s), c = ['#3FA36A', '#C8622E', '#5E7FCB', '#D9A23E', '#B65FA8'][(i + s) % 5];
      paint(rrPts(bx, sy - bh, 34, bh, 8), { wash: c, washOp: 210, ink: PAL.ink, sw: .8 });
      paint(rectPts(bx + 11, sy - bh - 26, 12, 28), { wash: c, ink: PAL.ink, sw: .6 });
      inkLine([[bx + 8, sy - bh + 10], [bx + 8, sy - 12]], .8, '#FFFFFF', 'inkfine', 0);
    }
  }
  for (const lx of [380, 960, 1540]) {   // pendant lamps
    inkLine([[lx, -60], [lx, 90]], 1, '#2A2634', 'inkfine', 0);
    paint([[lx - 50, 130], [lx + 50, 130], [lx + 26, 86], [lx - 26, 86]], { wash: '#2A2634', ink: PAL.ink, sw: 1 });
    glow(lx, 150, 260, '#FFD9A0', .7);
  }
  if (o.top !== false) barTop(P, t, cy);
}
// The counter itself, drawn after whoever sits behind it.
function barTop(P, t, cy) {
  boilSeed('bartop');
  paint(rectPts(-900, cy, W + 1800, 40), { wash: '#5A3A2E', ink: PAL.ink, sw: 2 });
  paint(rectPts(-900, cy + 40, W + 1800, H), { wash: '#2E1E24', ink: null });
  inkLine([[-900, cy + 6], [W + 900, cy + 6]], 1, '#C8906A', 'inkfine', 0);
  glow(960, cy + 60, 900, P.neon, .25 * (.7 + .3 * clapK(t)));
}

// ---------- the washroom ----------
// Grey-green tiles, a mirror (its glass at mx..mx+mw, my..my+mh), a sink, a buzzing tube light above.
const WR = { mx: 820, my: 150, mw: 820, mh: 560 };
function washroom(P, t, o = {}) {
  boilSeed('washroom');
  paint(rectPts(-900, -60, W + 1800, H + 120), { wash: '#2E3A3A', ink: null });
  for (let i = 0; i < 18; i++) inkLine([[-100 + i * 120, -60], [-100 + i * 120, H]], .6, '#243030', 'inkfine', 0);
  for (let j = 0; j < 10; j++) inkLine([[-900, j * 120], [W + 900, j * 120]], .6, '#243030', 'inkfine', 0);
  const buzz = .8 + .2 * Math.sin(t * 50) * (hash(Math.floor(t * 8)) > .8 ? 1 : 0);
  paint(rrPts(WR.mx + 140, WR.my - 70, WR.mw - 280, 18, 9), { wash: mixCol('#C8F0E0', '#FFFFFF', .5 * buzz), ink: PAL.ink, sw: 1 });
  glow(WR.mx + WR.mw / 2, WR.my - 60, 520, '#D8FFF0', .6 * buzz);
  paint(rectPts(WR.mx - 20, WR.my - 20, WR.mw + 40, WR.mh + 40), { wash: '#A8B4B8', ink: PAL.ink, sw: 2 });
  paint(rectPts(WR.mx, WR.my, WR.mw, WR.mh), { wash: o.glass || '#3E4C52', ink: null });
}
// Glass over the reflection: a cool tint and two glints. Call after drawing whatever is in the mirror.
function mirrorGlass() {
  boilSeed('mirrorglass');
  paint(rectPts(WR.mx, WR.my, WR.mw, WR.mh), { fill: '#BFE8F0', fillOp: 40, bleed: .1, ink: null });
  for (const k of [.2, .3]) inkLine([[WR.mx + WR.mw * k, WR.my + 40], [WR.mx + WR.mw * (k + .14), WR.my + 260]], 2, '#E8FFFF', 'inkfine', 0);
}
function sink(P) {
  boilSeed('sink');
  paint(rectPts(WR.mx - 60, 800, WR.mw + 120, 50), { wash: '#C8D0D4', ink: PAL.ink, sw: 1.6 });
  paint(rectPts(WR.mx - 60, 850, WR.mw + 120, 300), { wash: '#56646A', ink: PAL.ink, sw: 1.2 });
}

// ---------- the billboard street ----------
// Shop fronts along the pavement: lit windows, awnings in neon colours, flashing on the clap. No lettering.
function shopFronts(P, t, yG) {
  boilSeed('shops');
  for (let i = 0; i < 9; i++) {
    const x = -300 + i * 330, w = 300, c = [P.neon, '#5FE3FF', '#FFD34F', '#B66BFF'][i % 4], on = .6 + .4 * clapK(t + i * .07);
    paint(rectPts(x, yG - 420, w, 420), { wash: mixCol(P.near, P.far, .5), ink: PAL.ink, sw: 1.2 });
    paint(rectPts(x + 30, yG - 270, w - 60, 200), { wash: mixCol(P.win, '#FFFFFF', .2), washOp: 200, ink: PAL.ink, sw: 1 });
    glow(x + w / 2, yG - 170, 200, P.win, .45);
    paint([[x + 10, yG - 330], [x + w - 10, yG - 330], [x + w + 10, yG - 290], [x - 10, yG - 290]], { wash: mixCol('#2A2030', c, on), ink: PAL.ink, sw: 1 });
    glow(x + w / 2, yG - 310, 160, c, .4 * on);
  }
}
