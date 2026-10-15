// cast_robots.js: 大坏蛋 (the big boxy villain robot) and the little machines from the capsule (gear, drone, dog, can).
// Flat washes and ink only, like the heroes.

const RB = { body: '#6A5F86', dark: '#4B4263', light: '#8E84A8', steel: '#A9AFBF', visor: '#E2492F' };

// ---------- 大坏蛋 ----------
// About 3x Clawd's height. (x, y) = ground point between the feet; u as for Clawd (its body is ~11u wide, ~19u tall).
// o: dy, sq, rot, flip, mood ('angry' | 'cry' | 'love' | 'dizzy' | 'off'), arms ([left, right] raise -1..1.5),
// claws (0 closed .. 1 open), steam (0..1), lean, shake (px of trembling), boilKey.
function villain(x, y, u, o = {}) {
  const t = T, id = o.boilKey ?? 'villain', rs = p => boilSeed(`vil ${id} ${p}`), sw = clamp(u / 13, .6, 2.6);
  const mood = o.mood || 'angry', tr = o.shake ? [jit(o.shake), jit(o.shake)] : [0, 0];
  rs('shadow'); paint(ellPts(x, y + u * .2, u * 8, u * 1.1, 20), { wash: PAL.ink, washOp: 70, ink: null });
  push(); translate(x + tr[0], y + (o.dy || 0) * u + tr[1]); if (o.rot) rotate(o.rot);
  scale((o.flip ? -1 : 1) * (1 + (o.sq || 0) * .5), 1 - (o.sq || 0)); if (o.lean) shearX(o.lean);
  const [aL, aR] = o.arms || [-.6, -.6], cl = o.claws ?? .4;
  const arm = (s, a) => {   // a long jointed arm ending in a pincer claw
    rs('arm' + s); push(); translate(s * 5.6 * u, -13.2 * u); rotate(Math.PI / 2 - s * (.2 + a * 1.2));   // a = 0 hangs down and out, 1.5 is up
    paint(rectPts(0, -.8 * u, 6.5 * u, 1.6 * u, u * .1), { wash: RB.dark, ink: PAL.ink, sw: sw * .8 });
    paint(ellPts(6.5 * u, 0, 1.1 * u, 1.1 * u, 12), { wash: RB.steel, ink: PAL.ink, sw: sw * .7 });
    translate(7.2 * u, 0);
    for (const k of [-1, 1]) {
      push(); rotate(k * (.25 + cl * .55));
      paint([[0, -.5 * u], [3 * u, -.9 * u], [3.6 * u, 0], [2.8 * u, .2 * u], [.2 * u, .5 * u]].map(([a, b]) => [a, b * k]), { wash: RB.steel, ink: PAL.ink, sw: sw * .7 });
      pop();
    }
    pop();
  };
  arm(-1, aL);
  rs('legs');
  for (const s of [-1, 1]) {
    paint(rectPts(s * 3.2 * u - 1.4 * u, -4.4 * u, 2.8 * u, 4.4 * u), { wash: RB.dark, ink: PAL.ink, sw: sw * .8 });
    paint(rrPts(s * 3.2 * u - 2.2 * u, -1.1 * u, 4.4 * u, 1.3 * u, .5 * u), { wash: RB.steel, ink: PAL.ink, sw: sw * .8 });
  }
  rs('body');
  paint(rectPts(-5.6 * u, -14.4 * u, 11.2 * u, 10.2 * u, u * .12), { wash: RB.body, ink: PAL.ink, sw });
  paint(rectPts(-3.6 * u, -11.6 * u, 7.2 * u, 4.6 * u, u * .1), { wash: RB.dark, ink: PAL.ink, sw: sw * .7 });
  for (let i = 0; i < 3; i++) paint(ellPts((-1.8 + i * 1.8) * u, -9.3 * u, .55 * u, .55 * u, 10), { wash: [EL.yellow, EL.cyan, RB.visor][i], washOp: 140 + 115 * (0.5 + 0.5 * Math.sin(t * 6 + i * 2)), ink: PAL.ink, sw: sw * .5 });
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) inkLine([[s * 4.6 * u, (-13.4 + i * .9) * u], [s * 5.2 * u, (-13.4 + i * .9) * u]], sw * .5, PAL.ink, 'inkfine', 0);
  rs('head');
  paint(rectPts(-3.6 * u, -19.2 * u, 7.2 * u, 4.9 * u, u * .1), { wash: RB.light, ink: PAL.ink, sw });
  paint(rectPts(2 * u, -21.6 * u, 1.3 * u, 2.5 * u), { wash: RB.dark, ink: PAL.ink, sw: sw * .7 });   // the chimney
  rs('steam');
  const st = o.steam ?? .5;
  for (let i = 0; i < 4; i++) {
    const age = frac(t * .8 + i / 4), r = (.5 + age * 1.6) * u;
    if (st > .02) paint(ellPts(2.65 * u + Math.sin(age * 5 + i) * .8 * u, (-22.2 - age * 4.5) * u, r, r * .8, 12), { wash: PAL.cream, washOp: 200 * st * (1 - age), ink: null });
  }
  rs('face');
  const vy = -17.2 * u;
  if (mood === 'love') for (const s of [-1, 1]) paint(heartPts(s * 1.6 * u, vy, u * .95), { wash: '#E2476E', ink: PAL.ink, sw: sw * .6 });
  else if (mood === 'off') paint(rectPts(-3 * u, vy - .6 * u, 6 * u, 1.2 * u), { wash: '#3B3550', ink: PAL.ink, sw: sw * .6 });
  else if (mood === 'dizzy') for (const s of [-1, 1]) inkLine(Array.from({ length: 14 }, (_, i) => { const a = i * .7 + t * 8 * s, r = i * .07 * u; return [s * 1.6 * u + Math.cos(a) * r, vy + Math.sin(a) * r]; }), sw * .8, PAL.ink, 'ink', .6);
  else {
    if (mood === 'angry') glow(0, vy, 6 * u, RB.visor, .7 + .3 * Math.sin(t * 9));
    const tilt = mood === 'cry' ? -.5 : .55;
    for (const s of [-1, 1]) paint([[s * .5 * u, vy - .7 * u + (mood === 'angry' ? .45 * u : 0)], [s * 3 * u, vy - .7 * u - s * s * tilt * u], [s * 3 * u, vy + .6 * u], [s * .5 * u, vy + .6 * u]], { wash: RB.visor, ink: PAL.ink, sw: sw * .6 });
    if (mood === 'cry') for (const s of [-1, 1]) {   // two streams of tears
      const P = []; for (let i = 0; i <= 5; i++) P.push([s * (1.7 + i * .5) * u, vy + (.7 + i * 1.3) * u + Math.sin(t * 10 + i) * .15 * u]);
      paint(ribbon(P, .5 * u, .9 * u), { wash: PAL.sky, ink: PAL.ink, sw: sw * .5 });
    }
  }
  arm(1, aR);
  if (o.draw) o.draw(u, sw);
  pop();
  rs('after');
}

// ---------- the little machines ----------
// kind: 'gear' | 'drone' | 'dog' | 'can'. (x, y) = ground point (a drone hovers above it); u: each is ~4u tall.
// o: evil (red eyes), dy, hop (0..1 squash-and-stretch), flip, rot, boilKey.
function minion(kind, x, y, u, o = {}) {
  const t = T, id = o.boilKey ?? kind, rs = p => boilSeed(`min ${id} ${p}`), sw = clamp(u / 9, .5, 1.6);
  const eyeCol = o.evil ? RB.visor : PAL.ink, hop = o.hop || 0;
  rs('shadow'); paint(ellPts(x, y, u * 1.8, u * .35, 12), { wash: PAL.ink, washOp: 55, ink: null });
  push(); translate(x, y + (o.dy || 0) * u - (kind === 'drone' ? (3 + Math.sin(t * 5) * .3) * u : 0)); if (o.rot) rotate(o.rot);
  scale((o.flip ? -1 : 1) * (1 + hop * .15), 1 - hop * .15);
  rs('body');
  const eyes = (cx, cy, r) => { for (const s of [-1, 1]) { paint(ellPts(cx + s * r * 1.3, cy, r, r * 1.2, 10), { wash: eyeCol, ink: null }); if (o.evil) glow(cx + s * r * 1.3, cy, r * 4, RB.visor, .5); } };
  if (kind === 'gear') {
    paint(rectPts(-1 * u, -1.6 * u, 2 * u, 1.6 * u), { wash: RB.steel, ink: PAL.ink, sw: sw * .7 });
    const G = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + t * 1.5, r = (i % 3 === 0 ? 1.9 : 1.55) * u; G.push([Math.cos(a) * r, -3.3 * u + Math.sin(a) * r]); }
    paint(G, { wash: '#D9A21F', ink: PAL.ink, sw: sw * .8 });
    eyes(0, -3.3 * u, .28 * u);
  } else if (kind === 'drone') {
    paint(ellPts(0, 0, 1.6 * u, 1 * u, 16), { wash: EL.cyan, ink: PAL.ink, sw: sw * .8 });
    for (const s of [-1, 1]) {
      inkLine([[s * 1.2 * u, -.6 * u], [s * 1.9 * u, -1.5 * u]], sw * .8, PAL.ink, 'ink', 0);
      const w = Math.abs(Math.cos(t * 40 + s)) * 1.3 * u;
      paint(ellPts(s * 1.9 * u, -1.6 * u, w + .1 * u, .2 * u, 10), { wash: PAL.ink, washOp: 160, ink: null });
    }
    eyes(0, 0, .25 * u);
  } else if (kind === 'dog') {
    for (const lx of [-1.3, -.6, .6, 1.3]) paint(rectPts(lx * u - .2 * u, -1 * u, .4 * u, 1 * u), { wash: RB.dark, ink: PAL.ink, sw: sw * .6 });
    paint(rrPts(-1.7 * u, -2.3 * u, 3.4 * u, 1.5 * u, .4 * u), { wash: RB.steel, ink: PAL.ink, sw: sw * .8 });
    inkLine([[-1.7 * u, -2 * u], [-2.4 * u, -2.6 * u - Math.abs(Math.sin(t * 12)) * .4 * u]], sw, PAL.ink, 'ink', 0);
    paint(rrPts(.9 * u, -3.6 * u, 1.8 * u, 1.5 * u, .4 * u), { wash: RB.steel, ink: PAL.ink, sw: sw * .8 });
    paint([[1.1 * u, -3.5 * u], [1.3 * u, -4.4 * u], [1.7 * u, -3.5 * u]], { wash: RB.dark, ink: PAL.ink, sw: sw * .5 });
    eyes(1.8 * u, -2.9 * u, .2 * u);
  } else {   // can
    paint(rrPts(-1.3 * u, -3.4 * u, 2.6 * u, 3.4 * u, .3 * u), { wash: '#C9CED8', ink: PAL.ink, sw: sw * .8 });
    for (const yy of [-2.6, -1]) inkLine([[-1.3 * u, yy * u], [1.3 * u, yy * u]], sw * .5, PAL.ink, 'inkfine', 0);
    inkLine([[0, -3.4 * u], [.2 * u, -4.5 * u]], sw * .8, PAL.ink, 'ink', 0);
    paint(ellPts(.2 * u, -4.7 * u, .3 * u, .3 * u, 8), { wash: o.evil ? RB.visor : EL.yellow, ink: PAL.ink, sw: sw * .5 });
    eyes(0, -1.8 * u, .25 * u);
  }
  pop();
  rs('after');
}
