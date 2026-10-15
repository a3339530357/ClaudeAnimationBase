// cast_heroes.js: 电击小子 Clawd (the costume around clawd()), 小卡 the round robot sidekick, and the kitten.
// New characters are painted with flat washes and ink only (no watercolor fills), so they stay cheap on GPU-less runners.

const EL = { blue: '#2F6FD8', blueDk: '#1F4FA8', yellow: '#FFD84A', red: '#D8394E', cyan: '#5CE1E6', mars: '#E2492F' };

// ---------- 电击小子 ----------
// clawd() in the electro helmet, with a red scarf streaming behind and the transform watch on the right arm.
// o: everything clawd() takes, plus scarf (0..1 length, default 1), wind (scarf flap speed), watch (true by default),
// watchGlow (0..1), suit (false = plain Clawd with just the watch, for before the transformation).
function electro(x, y, u, o = {}) {
  const t = T, suit = o.suit !== false, sc = o.scarf ?? 1, wind = o.wind ?? 1;
  const back = suit && sc > .02 ? (uu, sw, V) => {
    for (const [k, ph, len] of [[0, 0, 1], [1, 1.7, .78]]) {   // two tails, offset so they don't flap in step
      const P = [];
      for (let i = 0; i <= 6; i++) {
        const q = i / 6, wave = Math.sin(t * 9 * wind - q * 4 + ph) * q;
        P.push([(V.L + .6 - q * 6.2 * sc * len) * uu, (-6.9 + k * .7 + q * 1.4 + wave * 1.1) * uu]);   // tied at the back edge
      }
      paint(ribbon(P, 1.3 * uu, .5 * uu), { wash: k ? mixCol(EL.red, PAL.ink, .2) : EL.red, ink: PAL.ink, sw: sw * .7 });
    }
  } : null;
  const watch = o.watch !== false ? (uu, sw) => {
    if (o.watchGlow > .02) glow(0, 0, uu * (2.5 + 3 * o.watchGlow), EL.cyan, o.watchGlow);
    paint(rrPts(-.55 * uu, -.75 * uu, 1.1 * uu, 1.5 * uu, .3 * uu), { wash: '#3B3550', ink: PAL.ink, sw: sw * .6 });
    paint(ellPts(0, 0, .48 * uu, .48 * uu, 12), { wash: o.watchGlow > .3 ? '#E9FCFF' : EL.cyan, ink: PAL.ink, sw: sw * .5 });
    if (o.armR) o.armR(uu, sw);
  } : o.armR;
  clawd(x, y, u, { ...o, hat: suit ? (o.hat ?? 'electro') : o.hat, back: o.back || back, armR: watch });
}

// ---------- 小卡 ----------
// A round white robot in a yellow dome, an antenna with a red ball, big eyes; it always hovers. (x, y) = the point on
// the ground under it; u: its body is 6u wide. o: dy (in u), sq, rot, flip, look (-1..1), eyes ('open' | 'happy' |
// 'wide' | 'closed'), mouth ('smile' | 'o' | 'laugh' | 'flat'), arms ([left, right] raise, -1..1.5), blush, boilKey.
function kaka(x, y, u, o = {}) {
  const t = T, hover = Math.sin(t * 3.1 + (o.phase || 0)) * .45 + (o.dy || 0), sq = o.sq || 0;
  const id = o.boilKey ?? 'kaka', rs = p => boilSeed(`kaka ${id} ${p}`), sw = clamp(u / 15, .45, 1.5);
  rs('shadow'); paint(ellPts(x, y, u * 2.6 * (1 - Math.min(.4, Math.abs(hover) * .05)), u * .5, 16), { wash: PAL.ink, washOp: 60, ink: null });
  push(); translate(x, y - (3.4 - hover) * u); if (o.rot) rotate(o.rot); scale((o.flip ? -1 : 1) * (1 + sq * .5), 1 - sq);
  const [aL, aR] = o.arms || [-.3, -.3];
  for (const [s, a] of [[-1, aL], [1, aR]]) {   // stubby arms behind the body
    rs('arm' + s); push(); translate(s * 2.7 * u, .4 * u); rotate(s * -a);
    paint(rrPts(s < 0 ? -1.8 * u : 0, -.45 * u, 1.8 * u, .9 * u, .4 * u), { wash: '#EDE6D6', ink: PAL.ink, sw: sw * .7 }); pop();
  }
  rs('body');
  paint(ellPts(0, 0, 3 * u, 3 * u, 26, u * .05), { wash: '#F8F3E8', ink: PAL.ink, sw });
  const dome = []; for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI; dome.push([Math.cos(a) * 2.75 * u, -1.15 * u + Math.sin(a) * 2.05 * u]); }
  paint(dome, { wash: '#F2C53D', ink: PAL.ink, sw });   // a cap on top, leaving the face open
  paint(rectPts(-2.9 * u, -1.35 * u, 5.8 * u, .5 * u), { wash: '#D9A21F', ink: PAL.ink, sw: sw * .6 });
  paint(P2(u, [[-.15, -2.75], [.55, -2.75], [.2, -2.2], [.7, -2.2], [-.1, -1.45], [.15, -1.95], [-.35, -1.95]]), { wash: '#FFF6C8', ink: PAL.ink, sw: sw * .45 });   // a bolt on the cap
  inkLine([[.4 * u, -3.1 * u], [.7 * u, -4.3 * u], [.9 * u + Math.sin(t * 6) * .2 * u, -5 * u]], sw * 1.1, PAL.ink, 'ink', .5);
  paint(ellPts(.9 * u + Math.sin(t * 6) * .2 * u, -5.3 * u, .55 * u, .55 * u, 12), { wash: EL.red, ink: PAL.ink, sw: sw * .6 });
  rs('face');
  const lx = (o.look || 0) * .5 * u, e = o.eyes || 'open', blink = frac(t * .37 + (o.phase || 0) * .1) < .04;
  for (const s of [-1, 1]) {
    const ex = s * 1.15 * u + lx, ey = .35 * u;
    if (e === 'happy' || e === 'closed' || blink) inkLine(e === 'closed' || blink ? [[ex - .45 * u, ey], [ex + .45 * u, ey]] : [[ex - .45 * u, ey + .15 * u], [ex, ey - .3 * u], [ex + .45 * u, ey + .15 * u]], sw * .85, PAL.ink, 'inkfine', .6);
    else {
      const r = e === 'wide' ? 1.15 : 1;
      paint(ellPts(ex, ey, .5 * u * r, .68 * u * r, 14), { wash: PAL.ink, ink: null });
      paint(ellPts(ex + .17 * u, ey - .25 * u, .17 * u, .2 * u, 8), { wash: '#FFFDF6', ink: null });
    }
  }
  if (o.blush) for (const s of [-1, 1]) paint(ellPts(s * 2 * u + lx, 1.25 * u, .45 * u, .22 * u, 10), { wash: PAL.rose, washOp: 200 * clamp(o.blush), ink: null });
  const m = o.mouth || 'smile', my = 1.6 * u;
  if (m === 'o') paint(ellPts(lx, my, .35 * u, .42 * u, 10), { wash: PAL.ink, ink: null });
  else if (m === 'laugh') paint([[lx - .8 * u, my - .2 * u], [lx + .8 * u, my - .2 * u], [lx, my + .7 * u]], { wash: '#B8364A', ink: PAL.ink, sw: sw * .7, curv: .5 });
  else if (m === 'flat') inkLine([[lx - .5 * u, my], [lx + .5 * u, my]], sw, PAL.ink, 'ink', 0);
  else inkLine([[lx - .6 * u, my - .1 * u], [lx, my + .35 * u], [lx + .6 * u, my - .1 * u]], sw, PAL.ink, 'ink', .7);
  if (o.draw) o.draw(u, sw);
  pop();
  rs('after');
}
const P2 = (u, pts) => pts.map(([a, b]) => [a * u, b * u]);

// ---------- the kitten ----------
// Small, round, ginger. (x, y) = ground point; u: about 4u long. o: dy, flip, sit (0 standing .. 1 sitting),
// curl (tail), eyes ('open' | 'closed' | 'wide'), boilKey.
function kitten(x, y, u, o = {}) {
  const t = T, id = o.boilKey ?? 'kitten', rs = p => boilSeed(`kitten ${id} ${p}`), sw = clamp(u / 9, .5, 1.6);
  const col = '#F0A35E', dk = '#C97A3A', sit = o.sit ?? 0;
  rs('shadow'); paint(ellPts(x, y, u * 2.4, u * .4, 14), { wash: PAL.ink, washOp: 55, ink: null });
  push(); translate(x, y + (o.dy || 0) * u); if (o.rot) rotate(o.rot); scale(o.flip ? -1 : 1, 1);
  rs('tail');
  const tw = Math.sin(t * 4) * .6 + (o.curl || 0);
  paint(ribbon([[-1.8 * u, -1.2 * u], [-2.9 * u, -1.9 * u], [-3.2 * u + tw * .4 * u, -3.1 * u], [-2.6 * u + tw * u, -3.6 * u]], .55 * u, .3 * u), { wash: dk, ink: PAL.ink, sw: sw * .7 });
  rs('body');
  if (!sit || sit < .5) for (const lx of [-1.3, -.6, .6, 1.3]) paint(rectPts(lx * u - .25 * u, -1 * u, .5 * u, 1 * u), { wash: dk, ink: PAL.ink, sw: sw * .6 });
  paint(ellPts(0, -1.4 * u - sit * .4 * u, 2.1 * u - sit * .5 * u, 1.05 * u + sit * .4 * u, 18), { wash: col, ink: PAL.ink, sw });
  const hx = 1.6 * u, hy = -2.5 * u - sit * .6 * u;
  for (const s of [-1, 1]) paint([[hx + s * .55 * u, hy - .6 * u], [hx + s * .95 * u, hy - 1.55 * u], [hx + s * .05 * u, hy - .95 * u]], { wash: col, ink: PAL.ink, sw: sw * .7 });
  paint(ellPts(hx, hy, 1.05 * u, .95 * u, 16), { wash: col, ink: PAL.ink, sw });
  rs('face');
  const e = o.eyes || 'open';
  for (const s of [-1, 1]) {
    const ex = hx + s * .42 * u, ey = hy - .05 * u;
    if (e === 'closed') inkLine([[ex - .2 * u, ey], [ex, ey + .12 * u], [ex + .2 * u, ey]], sw, PAL.ink, 'ink', .5);
    else paint(ellPts(ex, ey, .13 * u * (e === 'wide' ? 1.6 : 1), .2 * u * (e === 'wide' ? 1.5 : 1), 8), { wash: PAL.ink, ink: null });
  }
  paint([[hx - .12 * u, hy + .3 * u], [hx + .12 * u, hy + .3 * u], [hx, hy + .45 * u]], { wash: PAL.rose, ink: null });
  pop();
  rs('after');
}
