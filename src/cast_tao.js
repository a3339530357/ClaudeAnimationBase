// cast_tao.js: 小桃 and the instant camera: the two crabs and the things they carry. Clawd is the stock clawd(); 小桃 is the same body in peach pink
// with a big red bow ('bigbow' in clawd.js). Both own an instant camera, and every memory in the film is a polaroid.

// ---------- 小桃 ----------
// Her colours ride along in every emotion key, so emotions() cross-fades pink to pink (its default base is Clawd's clay).
const TAOC = { col: '#F4A3B6', dk: '#CF6F8B', lt: '#FCD6DF' };
const tfeel = (name, t, over = {}) => feel(name, t, { ...TAOC, ...over });
const temo = (t, keys, o) => emotions(t, keys.map(([t0, n, ov]) => [t0, n, { ...TAOC, ...(ov || {}) }]), o);
function tao(x, y, u, o = {}) { clawd(x, y, u, { ...TAOC, hat: 'bigbow', ...o }); }

// ---------- the instant camera ----------
// polaCam(x, y, s, o): centred at (x, y), 5s wide. o.view: 'front' (lens to us), 'side' (lens to the right; flip with
// o.flip), 'back' (we're behind it: the viewfinder). o.flash 0..1 fires the flash; o.rot tilts it.
const CAM_COL = { body: '#F1EBDF', top: '#3A3340', lens: '#2B2233' };
function polaCam(x, y, s, o = {}) {
  const v = o.view || 'front', sw = clamp(s / 9, .35, 1.4);
  push(); translate(x, y); if (o.rot) rotate(o.rot); if (o.flip) scale(-1, 1);
  boilSeed('cam' + (o.key ?? ''));
  if (v === 'side') {
    paint(rrPts(-1.5 * s, -1.6 * s, 3 * s, 3.3 * s, .4 * s), { wash: CAM_COL.body, ink: PAL.ink, sw });
    paint(rectPts(1.4 * s, -.7 * s, 1.1 * s, 1.6 * s), { wash: CAM_COL.lens, ink: PAL.ink, sw: sw * .8 });
    paint(rrPts(-1.3 * s, -2.3 * s, 2.4 * s, .8 * s, .2 * s), { wash: CAM_COL.top, ink: PAL.ink, sw: sw * .7 });
    paint(rectPts(.5 * s, -2.2 * s, .5 * s, .55 * s), { wash: '#FFF6D2', ink: null });
    for (let i = 0; i < 4; i++) paint(rectPts(-1.5 * s, (-.9 + i * .35) * s, 3 * s, .2 * s), { wash: ['#E2492F', '#F2A23A', '#F6D44A', '#5BA86A'][i], ink: null });
  } else if (v === 'back') {
    paint(rrPts(-2.5 * s, -1.6 * s, 5 * s, 3.3 * s, .5 * s), { wash: mixCol(CAM_COL.body, '#B8AE9E', .3), ink: PAL.ink, sw });
    paint(rrPts(-2.2 * s, -2.3 * s, 2.4 * s, .9 * s, .25 * s), { wash: CAM_COL.top, ink: PAL.ink, sw: sw * .7 });
    paint(rrPts(-1.7 * s, -2.1 * s, .9 * s, .55 * s, .15 * s), { wash: '#6E7FA8', ink: null });
    paint(ellPts(1.9 * s, -1.9 * s, .35 * s, .35 * s, 10), { wash: '#E2492F', ink: PAL.ink, sw: sw * .5 });
  } else {
    paint(rrPts(-2.5 * s, -1.6 * s, 5 * s, 3.3 * s, .5 * s), { wash: CAM_COL.body, ink: PAL.ink, sw });
    for (let i = 0; i < 4; i++) paint(rectPts((-.95 + i * .2) * s, -1.6 * s, .2 * s, 3.3 * s), { wash: ['#E2492F', '#F2A23A', '#F6D44A', '#5BA86A'][i], ink: null });
    paint(rrPts(-2.2 * s, -2.3 * s, 2.6 * s, .9 * s, .25 * s), { wash: CAM_COL.top, ink: PAL.ink, sw: sw * .7 });
    paint(rectPts(-2 * s, -2.15 * s, 1.1 * s, .55 * s), { wash: '#FFF6D2', ink: null });
    paint(ellPts(1.05 * s, .05 * s, 1.15 * s, 1.15 * s, 18), { wash: CAM_COL.lens, ink: PAL.ink, sw: sw * .8 });
    paint(ellPts(1.05 * s, .05 * s, .62 * s, .62 * s, 14), { wash: '#46578A', ink: null });
    paint(ellPts(.8 * s, -.2 * s, .2 * s, .2 * s, 8), { wash: PAL.cream, ink: null });
    paint(ellPts(1.9 * s, -1.9 * s, .35 * s, .35 * s, 10), { wash: '#E2492F', ink: PAL.ink, sw: sw * .5 });
    paint(rectPts(-1.9 * s, 1.35 * s, 3.8 * s, .16 * s), { wash: PAL.ink, ink: null });
  }
  pop();
  if (o.flash > .01) {   // the flash window, in world space
    const [fx, fy] = v === 'side' ? [x + (o.flip ? -1 : 1) * .75 * s, y - 1.95 * s] : [x - 1.45 * s, y - 1.9 * s];
    flashBurst(fx, fy, s * 4, o.flash);
  }
}
// A flash going off at (x, y): a light bloom and a painted starburst. k 0..1 (1 = the instant it fires).
function flashBurst(x, y, r, k) {
  if (k <= .01) return;
  glow(x, y, r * (2 + 3 * k), '#FFF4D6', clamp(k * 1.2));
  boilSeed('burst');
  paint(starPts(x, y, r * (.6 + .9 * k), .22, 8, k * .4), { wash: '#FFFBEA', washOp: 255 * clamp(k * 1.4), ink: null });
}

// Hold-the-camera poses, spread into clawd()/tao() AFTER the emotion so the arms win:
//   camShoot(o)  side view, facing right (flip to face left): the near arm holds it up in front of the eye.
//   camRaise(o)  front or q view: the right arm holds it up and out (a selfie, or snapping something off to the side).
//   camHang(o)   front view: it hangs on its strap in front of the body.
// o.flash fires it, o.cv: which face of the camera we see.
const camShoot = (o = {}) => ({ view: 'side', aL: .75, armL: (u) => { push(); rotate(-(.7 - .75)); polaCam(.6 * u, -.4 * u, .62 * u, { view: 'side', flash: o.flash, key: o.key }); pop(); } });
const camRaise = (o = {}) => ({ aR: o.a ?? 1.05, armR: (u) => { push(); rotate(o.a ?? 1.05); polaCam(.2 * u, -2 * u, .55 * u, { view: o.cv || 'back', flash: o.flash, key: o.key }); pop(); } });
const camHang = (o = {}) => ({ draw: (u, sw) => {
  for (const s of [-1, 1]) inkLine([[s * 1.4 * u, -3.6 * u], [s * 3.6 * u, -5.2 * u], [s * 4.9 * u, -5.8 * u]], sw * .7, '#6B4A3A', 'ink', .4);
  polaCam(0, -2.4 * u, .58 * u, { view: 'front', flash: o.flash, key: o.key });
} });

// ---------- polaroids ----------
// polaroid(x, y, w, o): a photo centred at (x, y), w wide (the picture is a square, the bottom margin is the wide one).
// o.pic(x0, y0, s): paints the picture into the square at (x0, y0), s on a side, in world space. o.dev 0..1: how far it
// has developed (0 = milky blank). o.rot, o.back (the dark back of the photo), o.shadow, o.key (boil seed), o.t (the
// picture's own time, default the video's), o.caption(x, y, w, h): paints into the bottom margin, in photo space.
const PHOTO = { frame: '#FBF6EA', milk: '#E7E2D2' };
function polaroid(x, y, w, o = {}) {
  const h = w * 1.2, m = w * .07, s = w - 2 * m, key = o.key ?? 'p';
  push(); translate(x, y); if (o.rot) rotate(o.rot);
  boilSeed('ph ' + key);
  if (o.shadow !== false) paint(rectPts(-w / 2 + w * .04, -h / 2 + w * .05, w, h), { wash: PAL.ink, washOp: 60, ink: null });
  if (o.back) { paint(rectPts(-w / 2, -h / 2, w, h), { wash: '#3A3340', ink: PAL.ink, sw: clamp(w / 200, .3, 1) }); pop(); return; }
  paint(rectPts(-w / 2, -h / 2, w, h), { wash: PHOTO.frame, ink: PAL.ink, sw: clamp(w / 220, .3, 1) });
  const dev = o.dev ?? 1, x0 = -w / 2 + m, y0 = -h / 2 + m;
  if (o.pic && dev > .02) {
    boilSeed('pic ' + key); o.pic(x0, y0, s, o.t ?? T);
    // the picture may spill past its square: paint the white border back over it
    boilSeed('ph2 ' + key);
    for (const r of [[-w / 2, -h / 2, w, m], [-w / 2, -h / 2, m, h], [w / 2 - m, -h / 2, m, h], [-w / 2, y0 + s, w, h / 2 - y0 - s]]) paint(rectPts(...r), { wash: PHOTO.frame, ink: null });
    paint(rectPts(-w / 2, -h / 2, w, h), { ink: PAL.ink, sw: clamp(w / 220, .3, 1) });
  }
  boilSeed('ph3 ' + key);
  if (dev < .98) paint(rectPts(x0, y0, s, s), { wash: PHOTO.milk, washOp: 255 * (1 - ease(dev)), ink: null });
  else paint(rectPts(x0, y0, s, s), { ink: mixCol(PAL.ink, PHOTO.frame, .5), sw: clamp(w / 400, .2, .6) });
  if (o.caption) o.caption(-w / 2, y0 + s, w, h / 2 - y0 - s);
  pop();
}

// ---------- props ----------
// The red pillar postbox Clawd hides behind. (x, y) = ground point, s = scale (the box is 4s wide, 9s tall).
function postbox(x, y, s) {
  boilSeed('postbox');
  const sw = clamp(s / 10, .5, 1.6);
  paint(ellPts(x, y + .2 * s, 2.8 * s, .5 * s, 18), { fill: PAL.ink, fillOp: 80, bleed: .2, ink: null });
  paint(rrPts(x - 2 * s, y - 7.4 * s, 4 * s, 7.4 * s, .3 * s), { wash: '#D8394E', fill: '#A82238', fillOp: 50, tex: .5, ink: PAL.ink, sw });
  const dome = []; for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI; dome.push([x + Math.cos(a) * 2.25 * s, y - 7.4 * s + Math.sin(a) * 1.5 * s]); }
  paint(dome, { wash: '#C22F45', ink: PAL.ink, sw });
  paint(rectPts(x - 2.3 * s, y - 7.7 * s, 4.6 * s, .55 * s), { wash: '#B02A3F', ink: PAL.ink, sw: sw * .7 });
  paint(rectPts(x - 1.3 * s, y - 5.9 * s, 2.6 * s, .35 * s), { wash: PAL.ink, ink: null });
  paint(rectPts(x - 1.1 * s, y - 4.6 * s, 2.2 * s, 1.4 * s), { wash: PAL.cream, ink: PAL.ink, sw: sw * .4 });
  paint(rectPts(x - 2.2 * s, y - 1 * s, 4.4 * s, 1 * s), { wash: '#8E2234', ink: PAL.ink, sw: sw * .7 });
}
// A grasshopper facing right (flip: left) at (x, y) = its feet, s = scale (about 5s long). o.hop 0..1 lifts the legs.
function grasshopper(x, y, s, o = {}) {
  push(); translate(x, y); if (o.flip) scale(-1, 1); if (o.rot) rotate(o.rot);
  boilSeed('hopper' + (o.key ?? ''));
  const sw = clamp(s / 8, .35, 1.2), hop = o.hop || 0, G = '#7DB04A', Gd = '#4E7E2E';
  inkLine([[-1.2 * s, -1.2 * s], [-.2 * s, -3.2 * s + hop * s], [.6 * s, -.1 * s]], sw * 2.2, Gd, 'ink', 0);   // the big back leg
  paint(ellPts(0, -1.5 * s, 2.5 * s, .9 * s, 16, 0, -.12), { wash: G, fill: Gd, fillOp: 60, ink: PAL.ink, sw });
  paint(ellPts(2.3 * s, -1.9 * s, .85 * s, .75 * s, 12), { wash: G, ink: PAL.ink, sw });
  paint(ellPts(2.6 * s, -2.1 * s, .22 * s, .22 * s, 8), { wash: PAL.ink, ink: null });
  for (const k of [0, 1]) inkLine([[2.6 * s, -2.5 * s], [3.4 * s + k * .6 * s, -4.4 * s + k * .5 * s], [4.4 * s + k * .4 * s, -4.9 * s + k * .8 * s]], sw * .5, PAL.ink, 'inkfine', .5);
  for (const lx of [.6, 1.4]) inkLine([[lx * s, -1 * s], [(lx + .3) * s, 0]], sw * .8, Gd, 'ink', 0);
  pop();
}

// ---------- model sheet: studio.html?loop=cast, or node render.mjs --loop=cast --sheet=1 ----------
LOOPS.cast = t => {
  paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#F6E4CF', ink: null });
  paint(rectPts(-60, 560, W + 120, 600), { wash: '#F2D6C6', ink: null });
  // Clawd: shy · snapping a photo · overheated · peeking out from behind the postbox
  clawd(240, 470, 24, { ...feel('shy', t), ...camHang() });
  clawd(700, 470, 24, { ...feel('determined', t, { eyes: ['narrow', 'normal'] }), ...camShoot({ flash: Math.max(0, 1 - frac(t / 2) * 4) }) });
  clawd(1180, 470, 24, { ...feel('love', t, { tint: 'flush', tintK: .7, emote: 'steam', blush: 1 }) });
  clawd(1640, 430, 24, { ...feel('nervous', t), view: 'q', ...camRaise({ a: .4, cv: 'side' }), boilKey: 'peek' });
  postbox(1630, 470, 26);
  // 小桃: laughing · a grasshopper on her bow · daydreaming · the selfie with Clawd
  tao(240, 1010, 24, { ...tfeel('laugh', t) });
  tao(700, 1010, 24, { ...tfeel('scared', t) });
  grasshopper(745, 1010 - 8.6 * 24 - 10, 9, { rot: -.15 });
  tao(1180, 1010, 24, { ...tfeel('hopeful', t, { eyes: 'look', lookX: .3, lookY: -1 }), emote: 'dots', emoteK: 1 });
  clawd(1540, 1010, 22, { ...feel('love', t), view: 'q', boilKey: 'c2' });
  tao(1740, 1010, 22, { ...tfeel('happy', t), view: 'q', flip: true, ...camRaise({ a: 1.15 }), boilKey: 't2' });
  polaroid(1560, 160, 180, { rot: .08, key: 'demo', pic: (x0, y0, s) => {
    paint(rectPts(x0, y0, s, s * .62), { wash: '#F2A86E', ink: null });
    paint(rectPts(x0, y0 + s * .62, s, s * .38), { wash: '#5A7FB0', ink: null });
    paint(ellPts(x0 + s * .5, y0 + s * .6, s * .16, s * .16, 16), { wash: '#FFE2A0', ink: null });
    clawd(x0 + s * .38, y0 + s * .95, s * .028, { noShadow: true, view: 'back', boilKey: 'ph1' });
    tao(x0 + s * .62, y0 + s * .95, s * .028, { noShadow: true, view: 'back', boilKey: 'ph2' });
  } });
};
LOOPS.cast.len = 4;
