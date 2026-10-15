// cast_bad.js: the cast of 《坏女孩》. Clawd plays it cool behind sunglasses (feel('cool')); 小桃 before is tao() from
// cast_tao.js; 小桃 after is the same pink body with a small black satin bow, the "B" make-up (almond eyes tilted up at
// the outer corner, a long sharp wing, a smoky violet shadow) and small glossy red lips (badTao); the stranger is a
// slate-blue crab in a fedora; the dance floor is a crowd of crabs in night colours.
//
// New faces and the bow are added WITHOUT touching clawd.js: eyes(), eye(), mouth() and hat() are wrapped, the new names
// are drawn here and everything else is handed back to the originals.
//   eyes:   catB (open), catBN (heavy-lidded: lazy, scornful), catBZ (closed, the liner riding the shut lid),
//           catBC (crying: the tear runs a thin black line down the cheek, o.cryK 0..1 is how far it has run).
//           catA* is the sweeter look she didn't get (kept for the comparison sheet).
//           shadesdown: Clawd's sunglasses slid down his nose (o.shadesDrop in u, default 1.4), his eyes over the top
//           (o.shadesEyes, default 'wide'; 'heart' when he sees the billboard).
//   mouths: lip2 (closed), lip2smile, lip2smirk (the right corner up).
//   hat:    blackbow (a small black satin bow where 小桃's big red bow used to sit, two short tails).

const LINER = '#15101A', SATIN = '#1E1824', SATIN_LT = '#56446C', LIP2 = '#D8364F', LIP2DK = '#8E1A30';

// ---------- eyes ----------
const _eyes0 = eyes;
eyes = function (u, o, sw, sides, smear = 0) {
  const k0 = Array.isArray(o.eyes) ? o.eyes[0] : o.eyes;
  if (k0 !== 'shadesdown' || smear > .5) return _eyes0(u, o, sw, sides, smear);
  _eyes0(u, { ...o, eyes: o.shadesEyes || 'wide' }, sw, sides, smear);
  push(); translate(0, (o.shadesDrop ?? 1.4) * u); _eyes0(u, { ...o, eyes: 'shades' }, sw, sides, 0); pop();
};

// One made-up eye, drawn around its centre like eye() in clawd.js. look 'A' | 'B'; lid: null (open), or how far the
// skin comes down over the eye in u (-.12 heavy-lidded, .55 shut); cry: the tear and the running liner.
function catEye(look, lid, cry, s, u, o, sw) {
  const lx = (o.lookX || 0) * u * .45, ly = (o.lookY || 0) * u * .35, shut = lid != null && lid > .3;
  const P = pts => pts.map(([a, b]) => [a * s * u, b * u]);          // +x points OUTWARD, toward the cheek, on both eyes
  const skin = tintCols(o).col;
  if (look === 'A') paint(P([[-.75, -.75], [-.1, -1.45], [.85, -1.4], [1.2, -.85], [.4, -.7]]), { fill: '#E68AAE', fillOp: 85, bleed: .35, tex: .3, ink: null, curv: .6 });
  else {
    paint(P([[-.8, -.7], [-.15, -1.65], [1.05, -1.6], [1.6, -.75], [.6, -.55]]), { fill: '#C68AC4', fillOp: 70, bleed: .35, tex: .3, ink: null, curv: .6 });
    paint(P([[-.65, -.65], [-.05, -1.25], [.9, -1.15], [1.3, -.62], [.5, -.55]]), { fill: '#6E3C82', fillOp: 120, bleed: .25, tex: .4, ink: null, curv: .6 });
  }
  if (!shut) {
    const iris = look === 'A' ? ellPts(lx, ly + .05 * u, .66 * u, .88 * u, 20)
                              : P([[-.72, .2], [-.35, -.55], [.15, -.82], [.72, -.55], [.82, -.3], [.45, .45], [-.05, .62]]).map(([a, b]) => [a + lx, b + ly]);
    paint(iris, { wash: PAL.ink, ink: null, curv: look === 'A' ? 0 : .5 });
    if (u > 9) {
      paint(ellPts(lx - .2 * u, ly - .32 * u, .24 * u, .3 * u, 10), { wash: PAL.cream, ink: null });
      paint(ellPts(lx + .22 * u, ly + .35 * u, .11 * u, .11 * u, 8), { wash: PAL.cream, washOp: 220, ink: null });
    }
    if (cry) paint(ellPts(lx, ly + .6 * u, .62 * u, .26 * u, 12), { wash: PAL.sky, washOp: 170, ink: null });
  }
  // the lid: the skin comes down over the top of the eye
  if (lid != null) paint(P([[-1, -1.6], [1.1, -1.6], [1.1, lid - .05], [.5, lid - .02], [0, lid + .05], [-.6, lid + .12], [-1, lid + .15]]), { wash: skin, ink: null });
  // the liner along the top edge of the eye (or along the lid), then the wing
  const top = lid != null ? [[-.66, lid + .14], [0, lid + .02], [.6, lid - .04]]
                          : look === 'A' ? [[-.66, -.42], [-.2, -.88], [.3, -.9], [.66, -.58]] : [[-.72, .12], [-.3, -.6], [.2, -.84], [.72, -.56]];
  const end = top[top.length - 1], wingTip = look === 'A' ? [1.15, end[1] - .42] : [1.55, end[1] - .62], wd = look === 'A' ? .2 : .24;
  paint(ribbon(P(top), .1 * u, wd * u), { wash: LINER, ink: null });
  paint(ribbon(P([end, [(end[0] + wingTip[0]) / 2 + .05, (end[1] + wingTip[1]) / 2 + .04], wingTip]), wd * u, .02 * u), { wash: LINER, ink: null });
  const lash = look === 'A' ? [[.05, -.9, .12, -1.25], [.35, -.84, .5, -1.18], [.6, -.66, .85, -.95]] : [[.4, -.78, .62, -1.08], [.66, -.6, .95, -.85]];
  if (lid == null) for (const [a, b, c, d] of lash) inkLine(P([[a, b], [c, d]]), sw * .5, LINER, 'inkfine', 0);
  else for (const [a, b, c, d] of [[.1, .02, .18, .32], [.4, -.02, .55, .26]]) inkLine(P([[a, lid + b], [c, lid + d]]), sw * .45, LINER, 'inkfine', 0);   // lashes on the lowered lid
  if (look === 'B' && lid == null) inkLine(P([[.05, .62], [.45, .45], [.8, -.28]]), sw * .35, mixCol(LINER, '#6E3C82', .4), 'inkfine', .5);
  if (cry) {
    const k = clamp(o.cryK ?? 1), R = [];
    for (let i = 0; i <= 6; i++) R.push([(.3 + Math.sin(i * 1.3 + s) * .06) * s * u, (.85 + i / 6 * 2.4 * k) * u]);
    if (k > .02) paint(ribbon(R, .12 * u, .05 * u), { wash: '#2A2030', washOp: 200, ink: null });
    paint(ellPts(R[6][0], R[6][1] + .12 * u, .15 * u, .2 * u, 10), { wash: PAL.sky, washOp: 220, ink: mixCol(PAL.sky, PAL.ink, .5), sw: sw * .3 });
  }
}
const _eye0 = eye;
eye = function (e, s, u, o, sw) {
  const m = /^cat([AB])([NZ]?)(C?)$/.exec(e);
  if (!m) return _eye0(e, s, u, o, sw);
  catEye(m[1], m[2] === 'N' ? (m[1] === 'A' ? -.1 : -.12) : m[2] === 'Z' ? .55 : null, !!m[3], s, u, o, sw);
};

// ---------- mouths ----------
const _mouth0 = mouth;
mouth = function (u, m, sw) {
  if (!['lip2', 'lip2smile', 'lip2smirk'].includes(m)) return _mouth0(u, m, sw);
  const P = pts => pts.map(([a, b]) => [a * u, b * u]), out = { ink: LIP2DK, sw: sw * .35 };
  if (m === 'lip2smile') {
    paint(P([[-.85, -4.6], [-.4, -4.42], [0, -4.38], [.4, -4.42], [.85, -4.6], [.5, -4.08], [0, -3.94], [-.5, -4.08]]), { wash: LIP2, ...out, curv: .4 });
    inkLine(P([[-.8, -4.57], [0, -4.4], [.8, -4.57]]), sw * .35, LIP2DK, 'inkfine', .5);
  } else {
    const r = m === 'lip2smirk' ? .3 : 0;   // the right corner lifts
    paint(P([[-.68, -4.36], [-.3, -4.6], [0, -4.5], [.3, -4.62 - r * .3], [.7, -4.4 - r], [0, -4.33]]), { wash: mixCol(LIP2, LIP2DK, .2), ...out, curv: .3 });
    paint(P([[-.68, -4.36], [0, -4.33], [.7, -4.4 - r], [.38, -4.06 - r * .3], [0, -3.98], [-.38, -4.06]]), { wash: LIP2, ...out, curv: .4 });
    if (r) inkLine(P([[.82, -4.45 - r], [.92, -4.62 - r]]), sw * .3, LIP2DK, 'inkfine', 0);
  }
  paint(ellPts(-.12 * u, -4.1 * u, .2 * u, .06 * u, 8), { wash: '#FFE2E6', washOp: 220, ink: null });
};

// ---------- hats ----------
const _hat0 = hat;
hat = function (u, h, sw) {
  if (h !== 'blackbow') return _hat0(u, h, sw);
  const bx = 2.6 * u, by = -8.75 * u, k = .78;   // sits on the top edge, smaller than the big red bow; short tails flick outward
  for (const s of [-1, 1]) paint(ribbon([[bx, by], [bx + s * .7 * u, by + .55 * u], [bx + s * 1.3 * u, by + .85 * u]], .45 * u, .28 * u), { wash: SATIN, ink: PAL.ink, sw: sw * .5 });
  for (const s of [-1, 1]) paint([[bx, by], [bx + s * 2.4 * k * u, by - 1.4 * k * u], [bx + s * 2.8 * k * u, by - .15 * k * u], [bx + s * 2.2 * k * u, by + 1.05 * k * u]], { wash: SATIN, fill: SATIN_LT, fillOp: 80, ink: PAL.ink, sw: sw * .7, curv: .35 });
  for (const s of [-1, 1]) inkLine([[bx + s * .6 * u, by - .3 * u], [bx + s * 1.6 * u, by - .85 * u]], sw * .45, '#9A88BC', 'inkfine', .3);   // satin sheen
  paint(ellPts(bx, by, .55 * u, .62 * u, 12), { wash: '#2C2336', ink: PAL.ink, sw: sw * .6 });
};

// Clawd's sunglasses on their own (falling off his face, in his claw): centred at (x, y), about 10u wide.
function sunglasses(x, y, u, o = {}) {
  push(); translate(x, y); if (o.rot) rotate(o.rot); boilSeed('shades' + (o.key ?? ''));
  const sw = clamp(u / 15, .45, 2.4);
  push(); translate(0, 6.2 * u); _eyes0(u, { eyes: 'shades' }, sw, [-1, 1], 0); pop();
  pop();
}

// ---------- 小桃, after ----------
// The same pink body as tao(); her make-up stays on whatever the emotion is, so moods only change the body and the emote.
const TAO_BAD = { eyes: 'catB', mouth: 'lip2smirk', hat: 'blackbow' };
const bfeel = (name, t, over = {}) => tfeel(name, t, { ...TAO_BAD, emote: null, ...over });
const bemo = (t, keys, o) => temo(t, keys.map(([t0, n, ov]) => [t0, n, { ...TAO_BAD, emote: null, ...(ov || {}) }]), o);
function badTao(x, y, u, o = {}) { clawd(x, y, u, { ...TAOC, ...TAO_BAD, ...o }); }

// ---------- the stranger and the crowd ----------
const STRC = { col: '#7D8DAA', dk: '#55627E', lt: '#AEBAD0' };
function stranger(x, y, u, o = {}) { clawd(x, y, u, { ...STRC, hat: 'fedora', eyes: 'narrow', ...o }); }
// Night-club colours for the dancers; crowdCol(i) cycles them, and a seed per dancer keeps the bounces out of step.
const CROWD = [
  { col: '#7A63C2', dk: '#4E3E8C', lt: '#A797E6' }, { col: '#3FA3A0', dk: '#28706E', lt: '#86D2CC' },
  { col: '#D9A23E', dk: '#9C6E22', lt: '#F2CC7E' }, { col: '#E06A6A', dk: '#A24046', lt: '#F4A2A0' },
  { col: '#5E7FCB', dk: '#3B5492', lt: '#9DB4EA' }, { col: '#B65FA8', dk: '#7E3C76', lt: '#DE9AD2' },
];
const crowdCol = i => CROWD[((i % CROWD.length) + CROWD.length) % CROWD.length];
function crowdCrab(x, y, u, i, t, style = 'bounce', extra = {}) {
  dancer(x, y, u, style, t, { ...crowdCol(i), seed: i * 1.37, boilKey: 'crowd' + i, eyes: ['happy', 'narrow', 'normal', 'closed'][i % 4], ...extra });
}
// A cheap dancer for the back of the crowd: a dark body and legs with a coloured rim, bouncing on the kick.
function crowdSil(x, y, u, i, t, o = {}) {
  const c = crowdCol(i), k = Math.exp(-frac(bpOf(t) + hash(i) * .3) * 5), hop = (o.hop ?? .5) * k * u;
  boilSeed('sil' + i);
  const body = mixCol(c.dk, '#120818', o.dark ?? .55), y0 = y - hop;
  for (const lx of [-3.6, -1.6, 1, 3]) paint(rectPts(x + lx * u, y0 - 2.3 * u, u * .9, 2.3 * u), { wash: mixCol(body, '#000000', .2), ink: null });
  paint(rectPts(x - 5 * u, y0 - 8 * u, 10 * u, 6 * u, u * .08), { wash: body, ink: null });
  paint(rectPts(x - 5 * u, y0 - 8 * u, 10 * u, 1.1 * u), { wash: mixCol(c.col, body, .35), washOp: 200, ink: null });   // rim light on top
  const arm = (o.arms ?? (Math.sin(bpOf(t) * Math.PI + i) > 0 ? 1.2 : .1));
  for (const s of [-1, 1]) { push(); translate(x + s * 4.9 * u, y0 - 4.5 * u); rotate(s < 0 ? arm : -arm); paint(rectPts(s < 0 ? -2.2 * u : 0, -.5 * u, 2.2 * u, u), { wash: body, ink: null }); pop(); }
}
