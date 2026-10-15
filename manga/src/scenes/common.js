// common.js: camera, transitions and small shared pieces for the shots.

// cam(t, cx, cy, z, r): a camera that dips a little on every kick (even beats), the film's pulse
function cam(t, cx = W / 2, cy = H / 2, z = 1, r = 0, o = {}) {
  const k = kick(t) * (o.kick ?? 1), [sx, sy] = o.shake ? shakeXY(t, o.shake) : [0, 0];
  camBegin(cx + sx / z, cy - 5 * k / z + sy / z, z * (1 + .014 * k), r);
}
const beatT = n => bt(n);
const since = (t, n) => t - bt(n);                       // seconds since beat n
const hitK = (t, n, d = .18) => seg(t, bt(n) - .02, bt(n) + d);   // 0 → 1 over a short attack after beat n
const decay = (t, n, k = 6) => t < bt(n) ? 0 : Math.exp(-(t - bt(n)) * k);

// draw shot i (the index in SHOTS) as it looks at time t: transitions that need the previous or next picture
function drawShot(i, t) {
  if (i < 0 || i >= SHOTS.length) return;
  const t0 = SHOTS[i][0], end = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DUR;
  X.save(); SHOTS[i][1](t, t - t0, end - t0); X.restore(); CAM = null;
}
const shotAt = t => { let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++; return i; };
const drawPrevEnd = t0 => drawShot(shotAt(t0) - 1, t0 - 1 / 30);   // the last frame of the shot before the one starting at t0
const drawNextStart = t1 => drawShot(shotAt(t1), t1);              // the first frame of the shot starting at t1

// ---------- transitions ----------
// a page turned right to left, like a manga page: k 0..1; under = what's revealed (the next page), over = the old page
function pageTurn(k, over, under) {
  under();
  if (k >= 1) return;
  const e = ease(k), sl = 120, xf = lerp(W + sl, -W * .15, e);           // the fold line runs from (xf + sl, 0) to (xf - sl, H)
  const w = Math.max(0, W + sl - xf);                                    // how much of the page has turned
  const oldP = pathOf([[-10, -10], [xf + sl - w, -10], [xf - sl - w * .9, H + 10], [-10, H + 10]]);
  X.save(); X.clip(oldP); over(); X.restore();
  // the back of the turned page, shaded toward the fold, and its shadow on the new page
  const flap = [[xf + sl - w, -10], [xf + sl, -10], [xf - sl, H + 10], [xf - sl - w * .9, H + 10]];
  X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
  const g = X.createLinearGradient(xf + sl, 0, xf + sl + 160, 0); g.addColorStop(0, 'rgba(20,18,22,.45)'); g.addColorStop(1, 'rgba(20,18,22,0)');
  X.fillStyle = g; X.fill(pathOf([[xf + sl, -10], [xf + sl + 160, -10], [xf - sl + 160, H + 10], [xf - sl, H + 10]]));
  X.fillStyle = PAPER; X.fill(pathOf(flap)); toneGrad(pathOf(flap), xf, H / 2, xf - w * .5, H / 2, .35, 0);
  loop(flap, 3, { smooth: false }); X.restore();
}
// the old picture torn off along a ragged diagonal, flying up-left
function tearOff(k, over, under, seed = 1) {
  under();
  if (k >= 1) return;
  const e = easeIn(k), dx = -W * 1.2 * e, dy = -H * .5 * e, r = -.35 * e, P = [[-20, -20], [W + 20, -20]];
  for (let i = 0; i <= 12; i++) P.push([W + 20 - i / 12 * (W + 40) + (hash(i * 3 + seed) - .5) * 40, H * (.95 - .55 * i / 12) + (hash(i * 7 + seed) - .5) * 50]);
  X.save(); X.translate(dx, dy); X.rotate(r);
  X.save(); X.translate(14, 16); X.fillStyle = 'rgba(20,18,22,.35)'; X.fill(pathOf(P)); X.restore();
  X.save(); X.clip(pathOf(P)); over(); X.restore();
  pen(P.slice(2), 4, { smooth: false, taper: [0, 0], j: 0 });
  X.restore();
}
// ink spreading over the frame from (cx, cy): k 0..1 covers, then recedes from the middle if o.out
function inkFlood(k, cx, cy, key = 'flood') {
  if (k <= 0) return;
  boilSeed(key); const R = Math.hypot(W, H) * easeIn(k) * 1.1, P = [];
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, q = R * (.78 + .44 * hash(i * 5.3 + key.length)); P.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); }
  X.save(); X.setTransform(1, 0, 0, 1, 0, 0); shape(P, { fill: INK, lw: 0, j: R * .02 });
  for (let i = 0; i < 14; i++) { const a = hash(i * 9.1) * TAU, d = R * (1 + .25 * hash(i)), q = 6 + R * .03 * hash(i * 2); shape(ellPts(cx + Math.cos(a) * d, cy + Math.sin(a) * d, q, q, 10), { fill: INK, lw: 0, j: 0 }); }
  X.restore();
}
// rain ripples spreading on glass: rings from a few drops
function ripples(k, pts, key = 'rip') {
  X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
  pts.forEach(([x, y, d], i) => {
    const q = clamp(k * 1.3 - d); if (q <= 0) return;
    for (let r = 0; r < 4; r++) { const rr = (q * 900 - r * 70); if (rr <= 4) continue; X.globalAlpha = clamp(1 - q) * (1 - r * .2); boilSeed(key + i + r); shape(ellPts(x, y, rr, rr * .9, 48), { fill: null, lw: 3 - r * .5, j: 1 }); }
  });
  X.restore();
}
// white panel gutter: a slanted band from (x0, top) to (x1, bottom), w wide; k 0..1 slashes it down from the top
function gutter(x0, x1, w, k = 1) {
  if (k <= 0) return;
  const yb = lerp(-10, H + 10, easeOut(k)), xb = lerp(x0, x1, (yb + 10) / (H + 20));
  X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
  const P = [[x0 - w / 2, -10], [x0 + w / 2, -10], [xb + w / 2, yb], [xb - w / 2, yb]];
  X.fillStyle = PAPER; X.fill(pathOf(P));
  pen([[x0 - w / 2, -10], [xb - w / 2, yb]], 7, { smooth: false, taper: [0, 0], j: 0 });
  pen([[x0 + w / 2, -10], [xb + w / 2, yb]], 7, { smooth: false, taper: [0, 0], j: 0 });
  X.restore();
}
// a two-panel split by a slanted gutter: left(), right() each draw a full frame
function split2(x0, x1, w, left, right, o = {}) {
  const L = [[-20, -20], [x0 - w / 2, -20], [x1 - w / 2, H + 20], [-20, H + 20]], R = [[x0 + w / 2, -20], [W + 20, -20], [W + 20, H + 20], [x1 + w / 2, H + 20]];
  const [ldx, rdx] = o.apart || [0, 0];
  X.save(); X.setTransform(1, 0, 0, 1, ldx, 0); X.clip(pathOf(L)); left(); X.restore();
  X.save(); X.setTransform(1, 0, 0, 1, rdx, 0); X.clip(pathOf(R)); right(); X.restore();
  gutter(x0 + (ldx + rdx) / 2, x1 + (ldx + rdx) / 2, w + rdx - ldx, 1);
}
// the strobe: black and white flip on claps (POST.invert), faster when rate > 1
function strobe(t, rate = 1, duty = .14) { const b = sbeat(t) * rate, n = Math.floor(b); if ((n % 2 || rate > 1) && frac(b) < duty * rate) POST.invert = true; }

// ---------- motion ----------
// walking: ph = steps taken (a float), amp 0..1. For a 3/4 view facing screen right (mirror for left);
// rear: walking away (legs swing in depth: the lifted one foreshortens). Spread into person()'s pose.
function walkPose(ph, amp = 1, rear = false) {
  const s = Math.sin(ph * Math.PI), c = Math.cos(ph * Math.PI), a = .32 * amp * s, lift = Math.max(0, c) * .5 * amp, lift2 = Math.max(0, -c) * .5 * amp;
  if (rear) return { lR: [.03, .03 + lift * .6], lL: [.03, .03 + lift2 * .6], kLR: [1 - lift * .25, 1], kLL: [1 - lift2 * .25, 1], aR: [.1, .05 + .1 * s * amp], aL: [.1, .05 - .1 * s * amp], dy: -Math.abs(s) * 6 * amp };
  return { lR: [-a, -a + lift * .9], lL: [a, a - lift2 * .9], aR: [a * .7, a * .7 + .15], aL: [-a * .7, -a * .7 + .15], dy: -Math.abs(c) * 8 * amp };
}

// ---------- crowd ----------
// a dancer silhouette: ink body, white rim light on one side. feet at (x, y), s px per head unit (a 600-unit figure).
// Kinds by seed: hair (short, bob, ponytail, spiky), arms up / down / one up; they bounce on kicks, out of step.
function fig(x, y, s, seed, t, o = {}) {
  const h = k => hash(seed * 13.7 + k), hair = Math.floor(h(1) * 4), arms = Math.floor(h(2) * 3), slow = o.slow || 1;
  const b = sbeat(t * slow + h(3) * .3), bounce = Math.exp(-frac(b) * 5) * (o.jump ? 45 : 14), ph = h(4) * TAU;
  const fill = o.fill || INK, rim = o.rim || WHITE;
  at(x, y - bounce * s, s * (o.k || 1), Math.sin(t * 2 + ph) * .04, h(5) < .5, () => {
    FS = s; boilSeed('fig' + seed);
    const up = o.jump ? Math.max(arms, 1) : arms, armUp = sd => (up === 1 && sd > 0) || up === 2;
    for (const sd of [-1, 1]) {   // arms
      const ax = sd * 52, P = armUp(sd) ? [[ax, -440], [ax + sd * 40, -560], [ax + sd * 30 + Math.sin(t * 6 + ph) * 15, -660]] : [[ax, -440], [ax + sd * 30, -330], [ax + sd * 20, -250]];
      pen(P, 34, { col: fill, taper: [0, .3], j: .5 }); pen(P.map(([px, py]) => [px + sd * 13, py]), 2.5, { col: rim, taper: [.2, .5], j: .5 });
    }
    shape([[-58, -455], [58, -455], [48, -250], [44, 0], [10, 0], [0, -200], [-10, 0], [-44, 0], [-48, -250]], { fill, lw: 0, j: 1 });
    shape(ellPts(0, -545, 40, 50, 18), { fill, lw: 0, j: .5 });
    if (hair === 1) shape([[-46, -560], [-50, -490], [-30, -495], [30, -495], [50, -490], [46, -560], [0, -600]], { fill, lw: 0, j: .5 });
    if (hair === 2) pen([[38, -560], [70, -540], [80, -490]], 22, { col: fill, taper: [0, .8], j: .5 });
    if (hair === 3) for (let i = 0; i < 5; i++) pen([[(i - 2) * 16, -580], [(i - 2) * 28, -625]], 14, { col: fill, taper: [0, 1], j: .5 });
    pen([[44, -580], [52, -530], [44, -500]], 3, { col: rim, taper: [.3, .3], j: .4 });
    pen([[58, -450], [50, -320], [46, -10]], 3, { col: rim, taper: [.3, .6], j: .5 });
    if (o.eyes) { const lx = o.eyes; for (const sd of [-1, 1]) shape(ellPts(sd * 14 + lx * 10, -548, 5, 7, 8), { fill: WHITE, lw: 0, j: 0 }); }
  });
}

// ---------- painted marks (no letters) ----------
function bang(x, y, s = 1, r = 0) {   // a "!" shape: a tapered wedge and a dot
  at(x, y, s, r, false, () => { shape([[-14, -90], [14, -90], [5, 10], [-5, 10]], { fill: WHITE, lw: 5, j: 1 }); shape(ellPts(0, 40, 11, 11, 12), { fill: WHITE, lw: 5, j: 1 }); });
}
function sweat(x, y, s = 1) { shape([[x, y - 22 * s], [x + 11 * s, y + 4 * s], [x, y + 13 * s], [x - 11 * s, y + 4 * s]], { fill: WHITE, lw: 3 * s, j: .5 }); }
// shoujo flowers/sparkles behind a figure: o.n, o.r radius
function sparkleBurst(cx, cy, R, k, n = 10, key = 'sb') {
  if (k <= 0) return;
  for (let i = 0; i < n; i++) { const a = i / n * TAU + hash(i + key.length), d = R * (.4 + .7 * hash(i * 3.3)) * easeOut(k), r = (14 + 30 * hash(i * 5.1)) * Math.sin(Math.PI * clamp(k * 1.2)); sparkle(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8, r); }
}
