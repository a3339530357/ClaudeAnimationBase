// body.js: bodies about six heads tall, in head units (the head is 100; see face.js). person() in outfit.js assembles
// a character from these parts; here are the skeleton, limbs, hands and shoes.
//
// Local frame: feet on y = 0, up is negative; the head centre sits at y = -550. Limbs are named by the CHARACTER's side
// (R = their right, which is the viewer's left in a front view) and their angles are symmetric: 0 hangs straight down,
// + swings outward away from the body, - swings across it; π points straight up. A limb is [upper, lower] angles plus
// optional foreshortening [k1, k2] (1 = full length): a forearm pointing at the camera is short.

const BODY_F = { neck: 10, sh: 54, armY: -452, up: 105, fore: 95, hand: 46, hipJ: 25, hipY: -262, thigh: 128, shin: 122, aw: [21, 16, 12], legw: [46, 27, 14], calf: 4 };
const BODY_M = { neck: 12.5, sh: 64, armY: -454, up: 112, fore: 100, hand: 52, hipJ: 24, hipY: -258, thigh: 132, shin: 124, aw: [27, 21, 15], legw: [50, 31, 16], calf: 4 };
const bodyOf = spec => spec.male ? BODY_M : BODY_F;
// torso half-outlines (x > 0 side, top to bottom); the other side mirrors
const TORSO_F = [[12, -480], [30, -471], [46, -463], [59, -451], [57, -430], [50, -410], [47, -388], [43, -366], [34, -332], [42, -302], [51, -280], [50, -262]];
const TORSO_M = [[14, -482], [36, -473], [56, -464], [71, -452], [68, -430], [63, -405], [57, -380], [50, -350], [43, -320], [45, -290], [47, -268], [46, -255]];
// body yaw: like wx for faces but milder (a body is deeper than it is turned)
const bxOf = v => x => 7 * v + x * (x < 0 ? 1 + .07 * v : 1 - .3 * v);

// a limb's joints from its root, two angles and lengths; sgn = which way "outward" is on screen (-1 left, +1 right)
function joints(root, ang, len, k = [1, 1], sgn = 1) {
  const [a, b] = ang, j1 = [root[0] + sgn * Math.sin(a) * len[0] * k[0], root[1] + Math.cos(a) * len[0] * k[0]];
  return [root, j1, [j1[0] + sgn * Math.sin(b) * len[1] * k[1], j1[1] + Math.cos(b) * len[1] * k[1]]];
}
// limb(J, W): a tube through joints J with widths W at each joint; o.bulge adds width mid-segment (calf, forearm)
function limb(J, W, o = {}) {
  const S = [], Wd = [];
  for (let i = 0; i < J.length - 1; i++) for (let k = 0; k < 7; k++) {
    const u = k / 7; S.push([lerp(J[i][0], J[i + 1][0], u), lerp(J[i][1], J[i + 1][1], u)]);
    Wd.push(lerp(W[i], W[i + 1], u) + (o.bulge ? (o.bulge[i] || 0) * Math.sin(Math.PI * clamp(u / .8)) : 0));
  }
  S.push(J[J.length - 1]); Wd.push(W[W.length - 1]);
  const L = [], R = [], n = S.length;
  for (let i = 0; i < n; i++) {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = Wd[i] / 2;
    L.push([S[i][0] - dy / d * w, S[i][1] + dx / d * w]); R.push([S[i][0] + dy / d * w, S[i][1] - dx / d * w]);
  }
  if (!o.open) return shape(L.concat(R.reverse()), { fill: o.fill || WHITE, tone: o.tone, lw: lw(o.lw ?? 2.2), j: o.j ?? .3, n: 2 });
  // open at the root: filled, but the outline runs down one side, round the end and back up the other (no seam line
  // where it joins the part above it)
  const P = through(boil(L.concat(R.reverse()), o.j ?? .3), 2, true).slice(0, -1);
  fillPath(pathOf(P), o.fill || WHITE); if (o.tone) fillPath(pathOf(P), 'tone:' + o.tone);
  pen(P, lw(o.lw ?? 2.2), { smooth: false, taper: [.04, .04], j: 0, press: [1, 1] });
  return P;
}

// ---------- hands ----------
// hand(x, y, ang, kind, L, th): at the wrist (x, y), fingers along screen angle ang (atan2 convention: 0 = right,
// π/2 = down), L long; th = ±1 puts the thumb on one side. kinds: open, fist, point, relax, hold (a loose C round
// something), peace. Returns nothing; draw what it holds afterwards, in the same frame (see person's o.hold).
function hand(x, y, ang, kind = 'relax', L = 46, th = 1, wf = .8) {
  X.save(); X.translate(x, y); X.rotate(ang - Math.PI / 2); X.scale(L / 46 * th * wf, L / 46);
  const ln = lw(1.8) * 46 / L, fine = lw(1.1) * 46 / L;
  if (kind === 'fist' || kind === 'point' || kind === 'hold' || kind === 'peace') {
    shape([[-8, -2], [8, -2], [11, 10], [12, 24], [8, 32], [-5, 34], [-11, 28], [-10, 10]], { fill: WHITE, lw: ln, j: .2 });
    if (kind !== 'hold') for (const y of [18, 25]) pen([[-10, y], [9, y + 1]], fine, { taper: [.3, .3], j: .2 });
    pen([[11, 8], [6, 18], [-2, 20]], fine, { taper: [.2, .5], j: .2 });                    // the thumb across
    if (kind === 'point') shape([[-11, 22], [-4, 22], [-4, 48], [-7.5, 51], [-11, 48]], { fill: WHITE, lw: ln, j: .2 });
    if (kind === 'peace') { shape([[-11, 22], [-5, 22], [-6, 48], [-9, 51], [-12, 47]], { fill: WHITE, lw: ln, j: .2 }); shape([[-4, 22], [2, 22], [5, 47], [2, 50], [-1, 47]], { fill: WHITE, lw: ln, j: .2 }); }
  } else {
    const curl = kind === 'relax' ? 9 : 0;
    shape([[-8, -2], [8, -2], [10, 10], [17, 20], [16, 27], [11, 24], [11, 34], [9, 47 - curl], [3, 50 - curl], [-3, 50 - curl], [-9, 47 - curl], [-11, 34], [-11, 14]], { fill: WHITE, lw: ln, j: .2 });
    for (const x of [-4.5, 0, 4.5]) pen([[x, 32], [x + .3, 46 - curl]], fine, { taper: [.2, .5], j: .2 });
  }
  X.restore();
}

// ---------- shoes ----------
// front view at the ankle (x, y = the ground), toes pointing out by ang; kinds: canvas (white sneakers), heels, skate, boot
function shoe(x, y, kind, sd, rear = false) {
  const w = kind === 'heels' ? 15 : 19, h = kind === 'heels' ? 13 : 17;
  if (kind === 'skate') {
    shape([[x - 16, y - 34], [x + 16, y - 34], [x + 19, y - 8], [x - 19, y - 8]], { fill: WHITE, lw: lw(2), j: .3 });
    for (const dx of [-11, 11]) shape(ellPts(x + dx, y - 2, 6, 6, 12), { fill: INK, lw: 0, j: 0 });
    pen([[x - 12, y - 26], [x + 12, y - 24]], lw(1), { j: .2 }); pen([[x - 12, y - 18], [x + 12, y - 16]], lw(1), { j: .2 });
    return;
  }
  const P = [[x - w, y - 2], [x - w + 2, y - h + 4], [x - 6, y - h], [x + 6, y - h], [x + w - 2, y - h + 4], [x + w, y - 2], [x + w * .5, y + 2], [x - w * .5, y + 2]];
  shape(P, { fill: kind === 'canvas' ? WHITE : INK, lw: lw(2), j: .3 });
  if (kind === 'canvas') {
    pen([[x - w + 1, y - 5], [x + w - 1, y - 5]], lw(1.4), { taper: [.1, .1], j: .2 });        // the rubber sole
    if (!rear) for (let i = 0; i < 2; i++) pen([[x - 5, y - h + 3 + i * 4], [x + 5, y - h + 5 + i * 4]], lw(1), { j: .2 });
  } else if (kind === 'heels') { shape([[x - 3, y - 3], [x + 3, y - 3], [x + 2, y + 1], [x - 2, y + 1]], { fill: INK, lw: 0, j: 0 }); pen([[x - 8, y - h + 3], [x + 2, y - h + 1]], lw(1), { col: WHITE, taper: [.4, .4], j: .2 }); }
}
// a sock or a cuff ring round a leg at (x, y), w wide
function band(x, y, w, h, fill = WHITE) { shape([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2 + 1], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2 - 1]], { fill, lw: lw(1.6), j: .2 }); }
