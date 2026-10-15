// outfit.js: clothes, and person(), which stands a whole character up.
//
// person(x, y, s, spec, P, o): feet at (x, y), s px per head unit (a 600 px tall figure: s = 1).
//   P.v body yaw -1..1 (0 front; negative mirrors the drawing), P.hv head yaw (default P.v), P.side profile head,
//   P.rear back view, P.lean torso tilt (radians, about the hips), P.dy bob, P.hd [dx, dy] head offset, P.tilt head tilt,
//   P.aR / P.aL arm angles [upper, fore] (see body.js), P.kR / P.kL arm foreshortening, P.lR / P.lL legs, P.kLR / P.kLL,
//   P.hR / P.hL hand kinds, P.ex expression (face.js), P.skirt hem flutter.
//   o.t time, o.key boil key, o.holdR / o.holdL: fn() drawn in that hand's frame (x along the fingers... see handFrame)
let LASTP = {};
const DEF_POSE = { aR: [.12, .04], aL: [.12, .04], lR: [.03, .01], lL: [.03, .01], hR: 'relax', hL: 'relax' };

function person(x, y, s, spec, P = {}, o = {}) {
  P = { ...DEF_POSE, ...P };
  const B = bodyOf(spec), vv = P.v || 0, flip = vv < 0, v = Math.abs(vv), rear = !!P.rear, bx = bxOf(v), O = spec.outfit, t = o.t || 0;
  const key = (o.key || '') + spec.name;
  // LASTP: where the head and hands landed, in the caller's coordinates (to put props on them)
  const lc = Math.cos(P.lean || 0), ls = Math.sin(P.lean || 0), B0 = bodyOf(spec);
  const toC = (px, py, up = true) => { if (up) { const dy = py - B0.hipY; [px, py] = [px * lc - dy * ls, B0.hipY + px * ls + dy * lc]; } return [x + (flip ? -1 : 1) * s * px, y + (P.dy || 0) * s + s * py]; };
  LASTP = { s, flip };
  at(x, y + (P.dy || 0) * s, s, 0, flip, () => {
    FS = Math.hypot(X.getTransform().a, X.getTransform().b);
    const U = fn => { X.save(); X.translate(0, B.hipY); X.rotate(P.lean || 0); X.translate(0, -B.hipY); fn(); X.restore(); };
    const hv = (P.hv ?? vv) * (flip ? -1 : 1), hx = bx(0) + (P.hd ? P.hd[0] : 0), hy = -547 + (P.hd ? P.hd[1] : 0), HS = 1.1;   // heads a touch big, as in manga
    const G = { B, bx, v, rear, P, spec, t, key };
    const ho = { v: hv, side: P.side, tilt: P.tilt, t, key };
    LASTP.head = toC(hx, hy); LASTP.hs = HS * s;
    // arms: the character's right is on screen-left in a front view, screen-right from behind
    const arm = (sd, part = 'both') => {   // sd: 'R' | 'L'; the upper arm goes behind the torso, the forearm in front
      const sg = (sd === 'R' ? -1 : 1) * (rear ? -1 : 1), J = joints([bx(sg * B.sh), B.armY], P['a' + sd], [B.up, B.fore], P['k' + sd] || [1, 1], sg);
      boilSeed(key + 'arm' + sd);
      if (part !== 'lo') O.arm(sd, J, G, 'up');
      if (part === 'up') return;
      O.arm(sd, J, G, 'lo');
      const fx = J[2][0] - J[1][0], fy = J[2][1] - J[1][1], ang = Math.atan2(fy, fx);
      LASTP['h' + sd] = toC(J[2][0] + Math.cos(ang) * B.hand * .45, J[2][1] + Math.sin(ang) * B.hand * .45); LASTP['e' + sd] = toC(J[1][0], J[1][1]);
      boilSeed(key + 'hand' + sd);
      hand(J[2][0] - Math.cos(ang) * 4, J[2][1] - Math.sin(ang) * 4, ang, P['h' + sd], B.hand, -sg * (rear ? -1 : 1), spec.male ? .9 : .78);
      const hold = o['hold' + sd]; if (hold) { X.save(); X.translate(J[2][0], J[2][1]); X.rotate(ang); hold(); X.restore(); }
    };
    const leg = sd => {
      const sg = (sd === 'R' ? -1 : 1) * (rear ? -1 : 1), J = joints([bx(sg * B.hipJ), B.hipY], P['l' + sd], [B.thigh, B.shin], P['kL' + sd] || [1, 1], sg);
      boilSeed(key + 'leg' + sd); O.leg(sd, J, G, sg);
    };
    const far = v > .25 ? (rear ? 'R' : 'L') : null, near = far ? (far === 'R' ? 'L' : 'R') : null;
    if (!rear) U(() => { boilSeed(key + 'hb'); head(hx, hy, HS, spec, P.ex, { ...ho, part: 'back' }); });
    if (far) U(() => arm(far));
    if (P.legs !== false) { if (far) { leg(far); leg(near); } else { leg('R'); leg('L'); } }
    U(() => {
      if (far) arm(near, 'up'); else { arm('R', 'up'); arm('L', 'up'); }
      boilSeed(key + 'neck'); neck(G);
      boilSeed(key + 'torso'); O.bottom && O.bottom(G); O.top(G);
      boilSeed(key + 'over'); O.over && O.over(G);
      head(hx, hy, HS, spec, P.ex, rear ? { ...ho, rear: true } : { ...ho, part: 'front' });
      if (far) arm(near, 'lo'); else { arm('R', 'lo'); arm('L', 'lo'); }
    });
  });
}

function torsoPts(G, cut = 99) {
  const H = (G.spec.male ? TORSO_M : TORSO_F).filter(p => p[1] <= cut + 1e-6), b = G.bx;
  return H.map(([x, y]) => [b(-x), y]).concat(H.slice().reverse().map(([x, y]) => [b(x), y]));
}
function neck(G) {
  const n = G.B.neck, b = G.bx, P = [[b(-n), -515], [b(n), -515], [b(n * 1.1), -462], [b(-n * 1.1), -462]];
  shape(P, { fill: WHITE, lw: 0, j: .2 });
  pen([[b(-n), -506], [b(-n * 1.1), -464]], lw(1.8), { j: .2 }); pen([[b(n), -506], [b(n * 1.1), -464]], lw(1.8), { j: .2 });
  X.save(); X.clip(pathOf(P)); fillPath(pathOf([[b(-n * 1.2), -515], [b(n * 1.2), -515], [b(n * 1.2), -496], [b(0), -488], [b(-n * 1.2), -496]]), 'tone:.2'); X.restore();
}
// skin arms and legs
const back = (J, d = 9) => { const dx = J[1][0] - J[0][0], dy = J[1][1] - J[0][1], l = Math.hypot(dx, dy) || 1; return [J[1][0] - dx / l * d, J[1][1] - dy / l * d]; };
function bareArm(J, G, part) { const w = G.B.aw; if (part === 'up') limb([J[0], J[1]], [w[0], w[1]]); else limb([back(J), J[1], J[2]], [w[1], w[1], w[2]], { bulge: [0, 2.5], open: true }); }
function bareLeg(J, G) { limb(J, G.B.legw, { bulge: [0, G.B.calf] }); }
function sleeveArm(J, G, part, fill, tone, extra = 7) { const w = G.B.aw; if (part === 'up') limb([J[0], J[1]], [w[0] + extra, w[1] + extra], { fill, tone }); else limb([back(J), J[1], J[2]], [w[1] + extra, w[1] + extra, w[2] + extra - 2], { fill, tone, bulge: [0, 1], open: true }); }
function cuff(J, col = WHITE, w = 18) {   // a line across the wrist end of a sleeve
  const [a, b] = [J[1], J[2]], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), cx = b[0] - Math.cos(ang) * 8, cy = b[1] - Math.sin(ang) * 8, px = -Math.sin(ang), py = Math.cos(ang);
  pen([[cx - px * w / 2, cy - py * w / 2], [cx + px * w / 2, cy + py * w / 2]], lw(1.6), { col, taper: [.2, .2], j: .2 });
}
const ankle = J => J[2];

// ---------- 小鹿, before: a white dress with a round collar, puff sleeves, an A-line skirt; white socks, canvas shoes ----------
const OUT_LU = {
  leg(sd, J, G) { bareLeg(J, G); const [x, y] = ankle(J); band(x, y - 12, 18, 14); shoe(x, y + 12, 'canvas', 0, G.rear); },
  arm(sd, J, G, part) {
    bareArm(J, G, part);
    if (part !== 'up') return;
    const [a, b] = J, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), c = [lerp(a[0], b[0], .2), lerp(a[1], b[1], .2)];
    shape(ellR(c[0], c[1], 25, 17, ang, 20), { fill: WHITE, lw: lw(2), j: .3 });
    const e = [c[0] + Math.cos(ang) * 22, c[1] + Math.sin(ang) * 22], px = -Math.sin(ang), py = Math.cos(ang);
    for (const k of [-6, 0, 6]) pen([[c[0] + px * k, c[1] + py * k], [e[0] + px * k * 1.2, e[1] + py * k * 1.2]], lw(.9), { taper: [.6, .3], j: .2 });
  },
  bottom(G) {
    const b = G.bx, fl = G.P.skirt || 0, P = [[b(-35), -334], [b(-48), -292]];
    for (let i = 0; i <= 8; i++) { const x = lerp(-84, 84, i / 8); P.push([b(x + fl * 6 * Math.sin(i + G.t * 5)), -170 + (i % 2 ? 3 : -1)]); }
    P.push([b(48), -292], [b(35), -334]);
    const S = shape(P, { fill: WHITE, lw: lw(2.4), j: .4 });
    X.save(); X.clip(pathOf(S)); fillPath(pathOf([[b(30), -340], [b(120), -340], [b(120), -150], [b(52), -150]]), 'tone:.12'); X.restore();
    for (const x of [-30, -9, 13, 32]) pen([[b(x * .9), -300], [b(x * 1.9), -176]], lw(1.1), { taper: [.5, .2], j: .3 });
  },
  top(G) {
    const b = G.bx, T = torsoPts(G, -332);
    shape(T, { fill: WHITE, lw: lw(2.2), j: .3 });
    pen([[b(-35), -334], [b(35), -334]], lw(1.6), { j: .3 });                                  // the waist seam
    if (G.rear) { pen([[b(0), -466], [b(0), -340]], lw(1), { j: .2 }); return; }
    pen([[b(-13), -470], [b(0), -458], [b(13), -470]], lw(1.6), { j: .2 });
    for (const sd of [-1, 1]) shape([[b(sd * 2), -460], [b(sd * 14), -471], [b(sd * 27), -466], [b(sd * 26), -452], [b(sd * 12), -448]], { fill: WHITE, lw: lw(1.8), j: .25 });
  },
};

// ---------- 小鹿, after: a black slip dress, bare shoulders, a choker, black heels ----------
const OUT_LU_BAD = {
  leg(sd, J, G) { bareLeg(J, G); const [x, y] = ankle(J); shoe(x, y + 12, 'heels', 0, G.rear); },
  arm(sd, J, G, part) { bareArm(J, G, part); },
  top(G) {
    const b = G.bx;
    shape(torsoPts(G, -300), { fill: WHITE, lw: lw(2.2), j: .3 });                            // bare shoulders, the skin under the dress
    if (!G.rear) for (const sd of [-1, 1]) pen([[b(sd * 8), -458], [b(sd * 22), -455], [b(sd * 34), -459]], lw(1.1), { taper: [.4, .4], j: .2 });   // collarbones
    const D = [[b(-46), -398], [b(-22), -404], [b(0), -396], [b(22), -404], [b(46), -398], [b(43), -366], [b(35), -332], [b(44), -300], [b(54), -276], [b(60), -236], [b(63), -194],
      [b(20), -192], [b(-20), -192], [b(-63), -194], [b(-60), -236], [b(-54), -276], [b(-44), -300], [b(-35), -332], [b(-43), -366]];
    shape(D, { fill: INK, lw: lw(2), j: .3 });
    for (const sd of [-1, 1]) pen([[b(sd * 30), -468], [b(sd * 38), -400]], lw(2.2), { taper: [.1, .1], j: .2 });   // straps
    for (const [p, q, r] of [[[-40, -380], [-30, -330], [-44, -240]], [[22, -370], [16, -320], [30, -230]], [[-8, -300], [-4, -260], [-10, -205]]])
      pen([[b(p[0]), p[1]], [b(q[0]), q[1]], [b(r[0]), r[1]]], lw(1.6), { col: WHITE, taper: [.5, .5], j: .3 });  // satin sheen
  },
  over(G) { const b = G.bx, n = G.B.neck; shape([[b(-n - 1), -492], [b(n + 1), -492], [b(n + 1.5), -481], [b(-n - 1.5), -481]], { fill: INK, lw: lw(1), j: .2 }); },
};

// ---------- 阿飞, before: black jacket open over a white tee, skinny jeans, canvas shoes, MP3 earbuds round his neck ----------
const OUT_FEI = {
  leg(sd, J, G) { const w = G.B.legw; limb(J, [w[0] + 6, w[1] + 4, w[2] + 5], { fill: WHITE, tone: .3, bulge: [0, 2] }); const [x, y] = ankle(J); shoe(x, y + 12, 'canvas', 0, G.rear); },
  arm(sd, J, G, part) { sleeveArm(J, G, part, INK); if (part === 'lo') cuff(J, WHITE, 26); },
  top(G) {
    const b = G.bx, T = torsoPts(G).concat([]);
    shape(T, { fill: WHITE, lw: lw(2.2), j: .3 });                                             // the tee
    if (G.rear) { shape(jacketPts(G, 0), { fill: INK, lw: lw(2.2), j: .3 }); pen([[b(0), -460], [b(0), -250]], lw(1.2), { col: WHITE, j: .2 }); return; }
    for (const sd of [-1, 1]) {
      shape(jacketPts(G, sd), { fill: INK, lw: lw(2.2), j: .3 });
      pen([[b(sd * 16), -468], [b(sd * 30), -420], [b(sd * 22), -380], [b(sd * 24), -252]], lw(1.4), { col: WHITE, taper: [.2, .2], j: .2 });   // lapel edge
      pen([[b(sd * 36), -310], [b(sd * 52), -308]], lw(1.2), { col: WHITE, j: .2 });                                                    // pocket
    }
    pen([[b(-14), -472], [b(0), -452], [b(14), -472]], lw(1.4), { j: .2 });                   // the tee's neckline
  },
  over(G) {
    if (G.rear) return;
    const b = G.bx;
    for (const [P, end] of [[[[-34, -528], [-26, -490], [-14, -440], [-8, -418]], [-8, -418]], [[[34, -528], [24, -490], [12, -444], [8, -420]], [8, -420]]]) {
      const Q = P.map(([x, y]) => [b(x), y]); pen(Q, lw(3.4), { taper: [0, 0] }); pen(Q, lw(1.6), { col: WHITE, taper: [0, 0] });
      shape(ellPts(b(end[0]), end[1] + 5, 4.5, 6, 10), { fill: WHITE, lw: lw(1.4), j: .2 });
    }
  },
};
function jacketPts(G, sd) {   // one front panel of the jacket (sd = -1 / +1), or the whole back (sd = 0)
  const b = G.bx, H = TORSO_M.map(([x, y]) => [x + 4, y]).concat([[52, -244]]);
  if (!sd) { const P = H.map(([x, y]) => [b(-x), y]).concat(H.slice().reverse().map(([x, y]) => [b(x), y])); P.unshift([b(0), -476]); return P; }
  return [[b(sd * 15), -474]].concat(H.map(([x, y]) => [b(sd * x), y]), [[b(sd * 24), -244], [b(sd * 22), -380], [b(sd * 30), -420]]);
}

// ---------- 阿飞, at the end: a white shirt, sleeves rolled to the elbow, the same jeans ----------
const OUT_FEI_NEW = {
  leg: OUT_FEI.leg,
  arm(sd, J, G, part) {
    const w = G.B.aw, m = [lerp(J[1][0], J[2][0], .3), lerp(J[1][1], J[2][1], .3)];
    if (part === 'up') { limb([J[0], J[1]], [w[0] + 7, w[1] + 7], { fill: WHITE }); return; }
    bareArm(J, G, 'lo');
    limb([J[1], m], [w[1] + 8, w[1] + 7], { fill: WHITE });                                   // the rolled cuff
    const ang = Math.atan2(m[1] - J[1][1], m[0] - J[1][0]), px = -Math.sin(ang), py = Math.cos(ang), q = [lerp(J[1][0], m[0], .55), lerp(J[1][1], m[1], .55)];
    pen([[q[0] - px * 13, q[1] - py * 13], [q[0] + px * 13, q[1] + py * 13]], lw(1.3), { j: .2 });
  },
  top(G) {
    const b = G.bx, T = torsoPts(G).concat([]);
    const S = shape(T.map(([x, y]) => [x, y > -260 ? y + 12 : y]), { fill: WHITE, lw: lw(2.2), j: .3 });
    X.save(); X.clip(pathOf(S)); fillPath(pathOf([[b(36), -480], [b(90), -480], [b(90), -230], [b(40), -230]]), 'tone:.14'); X.restore();
    if (G.rear) { pen([[b(-30), -440], [b(0), -430], [b(30), -440]], lw(1.2), { j: .2 }); return; }
    pen([[b(0), -460], [b(0), -246]], lw(1.4), { j: .2 });
    for (let i = 0; i < 4; i++) shape(ellPts(b(4), -440 + i * 52, 2.4, 2.4, 8), { fill: WHITE, lw: lw(1), j: 0 });
    for (const sd of [-1, 1]) shape([[b(sd * 2), -462], [b(sd * 15), -480], [b(sd * 26), -470], [b(sd * 18), -444]], { fill: WHITE, lw: lw(1.8), j: .25 });
  },
};

// ---------- the rink queen: black crop top, bare midriff, black mini skirt, roller skates ----------
const OUT_QUEEN = {
  leg(sd, J, G) { bareLeg(J, G); const [x, y] = ankle(J); shoe(x, y + 12, 'skate', 0, G.rear); },
  arm(sd, J, G, part) { bareArm(J, G, part); },
  bottom(G) {
    const b = G.bx, P = [[b(-36), -336], [b(36), -336], [b(52), -280], [b(66), -232], [b(0), -228], [b(-66), -232], [b(-52), -280]];
    shape(P, { fill: INK, lw: lw(2), j: .3 });
    for (const x of [-30, 0, 30]) pen([[b(x * .6), -330], [b(x), -236]], lw(1.1), { col: WHITE, j: .2 });
  },
  top(G) {
    const b = G.bx;
    shape(torsoPts(G, -330), { fill: WHITE, lw: lw(2.2), j: .3 });
    shape([[b(-46), -404], [b(0), -412], [b(46), -404], [b(46), -366], [b(40), -352], [b(-40), -352], [b(-46), -366]], { fill: INK, lw: lw(2), j: .3 });
    for (const sd of [-1, 1]) pen([[b(sd * 26), -468], [b(sd * 36), -404]], lw(3), { taper: [.1, .1], j: .2 });
    pen([[b(-6), -326], [b(-4), -322]], lw(1.4), { j: .1 });                                   // navel
  },
  over: OUT_LU_BAD.over,
};

// ---------- the stranger: a leather jacket zipped up, a fat gold chain, dark trousers ----------
const OUT_STRANGER = {
  leg(sd, J, G) { const w = G.B.legw; limb(J, [w[0] + 8, w[1] + 6, w[2] + 7], { fill: WHITE, tone: .55 }); const [x, y] = ankle(J); shoe(x, y + 12, 'boot', 0, G.rear); },
  arm(sd, J, G, part) { sleeveArm(J, G, part, INK, 0, 9); if (part === 'lo') cuff(J, WHITE, 28); },
  top(G) {
    const b = G.bx;
    shape(jacketPts(G, 0), { fill: INK, lw: lw(2.2), j: .3 });
    if (G.rear) return;
    pen([[b(0), -470], [b(2), -248]], lw(1.4), { col: WHITE, j: .2 });
    for (const sd of [-1, 1]) pen([[b(sd * 14), -478], [b(sd * 30), -450], [b(sd * 18), -420]], lw(1.4), { col: WHITE, j: .2 });
    for (let i = 0; i < 12; i++) { const a = Math.PI * (.12 + .76 * i / 11); shape(ellR(b(Math.cos(a) * 30), -472 + Math.sin(a) * 42, 4.4, 2.8, a + Math.PI / 2, 10), { fill: WHITE, lw: lw(1.2), j: 0 }); }
  },
};

LU.outfit = OUT_LU; LU_BAD.outfit = OUT_LU_BAD; FEI.outfit = OUT_FEI; FEI_NEW.outfit = OUT_FEI_NEW; QUEEN.outfit = OUT_QUEEN; STRANGER.outfit = OUT_STRANGER;
