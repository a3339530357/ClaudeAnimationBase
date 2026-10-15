// world_city.js: the neon city at night, painted in four moods, plus the beat grammar every shot uses.
//
// Beat grammar (STORYBOARD.md, "每拍都动"): even beats are the kick, odd beats the clap.
//   kickK(t): 1 on each kick, decaying over two beats: the camera dips, bodies squat.
//   clapK(t): 1 on each clap: neon, lamps and strobes flash.
const kickK = t => { const b = bpOf(t); return b < -.5 ? 0 : Math.exp(-(((b % 2) + 2) % 2) * 5); };
const clapK = t => { const b = bpOf(t) - 1; return b < -.5 ? 0 : Math.exp(-(((b % 2) + 2) % 2) * 7); };
// camBegin with the kick in it: the frame dips a few px and pushes in a hair on every kick.
const camKick = (cx, cy, zoom, t, amt = 1, rot = 0) => camBegin(cx, cy - 6 * amt * kickK(t), zoom * (1 + .012 * amt * kickK(t)), rot);

// ---------- moods ----------
// warm: the past (deep blue, her pink still in the neon) · cold: the rain after she's gone · club: the bar ·
// fade: her side of the chorus, the neon drained to grey-violet. palMix(a, b, k) blends two of them.
const NITE = {
  warm: { sky: ['#0C0E2C', '#17184A', '#2A2460', '#46306E'], far: '#221E4C', near: '#16143A', win: '#FFD38A', neon: '#FF5FA8', street: '#1B1934', walk: '#2A2648', line: '#C9B8E8', lamp: '#FFD9A0', wall: '#2B2450' },
  cold: { sky: ['#06121D', '#0B2131', '#113044', '#1A4056'], far: '#10283A', near: '#0A1B29', win: '#9FE3FF', neon: '#38E1D0', street: '#0D1C28', walk: '#16303F', line: '#9CC8D8', lamp: '#C8F0FF', wall: '#14303F' },
  club: { sky: ['#11061E', '#230938', '#380E50', '#561664'], far: '#2A0C3E', near: '#1A0828', win: '#FF8AD8', neon: '#FF3DB8', street: '#1D0A29', walk: '#2C1238', line: '#E7A8F0', lamp: '#FFB0E8', wall: '#2A0E3A' },
  fade: { sky: ['#141219', '#1F1C27', '#2B2835', '#373343'], far: '#24212D', near: '#191720', win: '#B8B0C8', neon: '#B49AC6', street: '#1B1921', walk: '#25222D', line: '#8E88A0', lamp: '#D8D0E0', wall: '#2A2732' },
};
function palMix(a, b, k) {
  const o = {}; for (const key in a) o[key] = Array.isArray(a[key]) ? a[key].map((c, i) => mixCol(c, b[key][i], k)) : mixCol(a[key], b[key], k);
  return o;
}

// ---------- sky and skyline ----------
function skyNight(P, y1 = H, o = {}) {
  boilSeed('sky');
  const n = P.sky.length, x0 = -900, w = W + 1800, t = o.t ?? T;
  for (let i = 0; i < n; i++) paint(rectPts(x0, -500 + (y1 + 500) * i / n, w, (y1 + 500) / n + 6), { wash: P.sky[i], ink: null });
  if (o.stars !== false) for (let i = 0; i < 28; i++) {
    const tw = .5 + .5 * Math.sin(t * (1 + hash(i) * 2) + i * 2);
    paint(ellPts(hash(i * 3.1) * (W + 600) - 300, hash(i * 7.7) * y1 * .5, 2 + 2 * hash(i * 9), 2 + 2 * hash(i * 9), 6), { wash: '#FFF6E0', washOp: 90 + 140 * tw, ink: null });
  }
}
// Buildings standing on baseY from x0 to x1: flat washes, a few lit windows, now and then a rooftop neon bar that
// flashes on the clap (no lettering anywhere).
function skyline(P, baseY, o = {}) {
  const sd = o.seed || 0, far = !!o.far, t = o.t ?? T, x1 = o.x1 ?? W + 700;
  boilSeed('skyline' + sd + far);
  let x = o.x0 ?? -700, i = 0;
  while (x < x1) {
    const w = (far ? 120 : 170) + hash(sd + i * 1.9) * (far ? 140 : 220), h = (far ? 250 : 190) + hash(sd + i * 3.3) * (far ? 360 : 340);
    paint(rectPts(x, baseY - h, w - 6, h + 10), { wash: far ? P.far : P.near, ink: far ? null : mixCol(P.near, PAL.ink, .5), sw: .8 });
    for (let k = 0; k < (far ? 3 : 5); k++) {
      if (hash(sd + i * 17 + k) < .3) continue;
      const wx = x + 14 + hash(sd + i * 11 + k * 1.3) * (w - 40), wy = baseY - h + 20 + hash(sd + i * 13 + k * 2.7) * (h - 60);
      paint(rectPts(wx, wy, far ? 9 : 14, far ? 11 : 18), { wash: P.win, washOp: far ? 130 : 200, ink: null });
    }
    if (!far && o.neon !== false && hash(sd + i * 5.5) > .6) {
      const nc = [P.neon, '#5FE3FF', '#FFD34F', '#B66BFF'][Math.floor(hash(sd + i * 8.1) * 4)];
      const nx = x + w * .2, ny = baseY - h - 26, nw = w * .55, on = .65 + .35 * clapK(t) * (hash(sd + i) > .5 ? 1 : .3);
      glow(nx + nw / 2, ny + 8, nw * .7, nc, .5 * on);
      paint(rrPts(nx, ny, nw, 16, 8), { wash: mixCol('#2A2030', nc, .4 + .6 * on), ink: null });
      paint(rrPts(nx + 5, ny + 5, nw - 10, 6, 3), { wash: mixCol(nc, '#FFFFFF', .6), ink: null });
    }
    x += w; i++;
  }
}

// ---------- the street ----------
// A far kerb at roadY, the road, the near pavement from walkY down. o.wet: neon smears in the puddles. o.lanes.
function street(P, roadY, walkY, o = {}) {
  boilSeed('street');
  const x0 = o.x0 ?? -900, w = (o.x1 ?? W + 900) - x0;
  paint(rectPts(x0, roadY - 30, w, 34), { wash: P.walk, ink: null });
  paint(rectPts(x0, roadY, w, walkY - roadY), { wash: P.street, ink: null });
  if (o.lanes !== false) for (let i = 0; i < 16; i++) paint(rectPts(x0 + i * 280 + 40, (roadY + walkY) / 2 - 5, 130, 10), { wash: P.line, washOp: 150, ink: null });
  if (o.wet) for (let i = 0; i < 14; i++) {
    const c = [P.neon, P.win, '#5FE3FF', P.lamp][i % 4];
    paint(rectPts(hash(i * 4.2) * (W + 400) - 200, roadY + 20, 10 + 18 * hash(i), (walkY - roadY) * (.5 + .4 * hash(i * 2))), { fill: c, fillOp: 45, bleed: .3, ink: null });
  }
  paint(rectPts(x0, walkY, w, H - walkY + 300), { wash: P.walk, ink: null });
  inkLine([[x0, walkY], [x0 + w, walkY]], 1.4, mixCol(P.walk, '#000000', .5), 'inkfine', 0);
}
function streetLamp(x, yG, h, o = {}) {
  const on = clamp(o.on ?? 1), col = o.col || '#FFD9A0', hx = x + h * .16, hy = yG - h;
  boilSeed('lamp' + (o.key ?? x));
  if (on > .02) {
    paint([[hx - 18, hy + 18], [hx + 18, hy + 18], [hx + h * .42, yG], [hx - h * .42, yG]], { fill: col, fillOp: 46 * on, bleed: .3, tex: .2, ink: null });
    paint(ellPts(hx, yG + 6, h * .46, h * .085, 24), { fill: col, fillOp: 90 * on, bleed: .25, ink: null });
  }
  paint(rectPts(x - 7, hy, 14, h), { wash: '#2A2634', ink: PAL.ink, sw: 1.4 });
  inkLine([[x, hy + 6], [x + h * .08, hy - 14], [hx, hy - 2]], 3, '#2A2634', 'ink', .5);
  paint(rrPts(hx - 28, hy - 8, 56, 22, 8), { wash: '#2A2634', ink: PAL.ink, sw: 1.4 });
  paint(ellPts(hx, hy + 16, 22, 8, 12), { wash: mixCol('#4A4440', col, on), ink: null });
  if (on > .02) glow(hx, hy + 22, 170, col, on);
}

// ---------- the bus stop and the bus ----------
function busStop(x, yG, s = 1, P = NITE.warm) {
  boilSeed('busstop');
  const w = 640 * s, h = 380 * s, top = yG - h;
  paint(rectPts(x - w / 2, top + 6 * s, w, h * .62), { wash: '#9FC4E0', washOp: 34, ink: '#9FC4E0', sw: .8 });   // back glass
  inkLine([[x - w * .3, top + 40 * s], [x - w * .12, top + 140 * s]], 1, '#CFE6F6', 'inkfine', 0);
  paint(rectPts(x + w * .5 - 150 * s, top + 20 * s, 130 * s, 220 * s), { wash: mixCol(P.neon, '#FFFFFF', .35), ink: PAL.ink, sw: 1 });   // the lit ad panel
  glow(x + w * .5 - 85 * s, top + 130 * s, 200 * s, P.neon, .5);
  for (const px of [x - w / 2, x + w / 2 - 12 * s]) paint(rectPts(px, top, 12 * s, h), { wash: '#2A2634', ink: PAL.ink, sw: 1 });
  paint(rectPts(x - w / 2 - 20 * s, top - 34 * s, w + 40 * s, 36 * s), { wash: '#3A3650', ink: PAL.ink, sw: 1.4 });   // roof
  paint(rectPts(x - w * .34, yG - 112 * s, w * .6, 18 * s), { wash: '#4A4258', ink: PAL.ink, sw: 1 });              // bench
  for (const lx of [-.3, .2]) paint(rectPts(x + lx * w, yG - 94 * s, 12 * s, 94 * s), { wash: '#2A2634', ink: null });
  // the stop sign: a round plate on a pole with a little bus on it
  const sx = x - w / 2 - 70 * s;
  paint(rectPts(sx - 5 * s, top - 40 * s, 10 * s, h + 40 * s), { wash: '#2A2634', ink: PAL.ink, sw: 1 });
  paint(ellPts(sx, top - 40 * s, 44 * s, 44 * s, 18), { wash: '#3F6FB0', ink: PAL.ink, sw: 1.2 });
  paint(rrPts(sx - 22 * s, top - 56 * s, 44 * s, 26 * s, 6 * s), { wash: '#F3EBDC', ink: null });
  for (const wx of [-12, 12]) paint(ellPts(sx + wx * s, top - 28 * s, 6 * s, 6 * s, 8), { wash: '#F3EBDC', ink: null });
}
// A city bus seen side-on, nose to the LEFT (flip with o.flip), centred on x, wheels on yG. o.lights 0..1.
function bus(x, yG, s, o = {}) {
  boilSeed('bus' + (o.key ?? ''));
  push(); translate(x, 0); if (o.flip) scale(-1, 1); translate(-x, 0);
  const L = 900 * s, Hh = 300 * s, x0 = x - L / 2, top = yG - Hh - 50 * s;
  paint(rrPts(x0, top, L, Hh, 34 * s), { wash: o.col || '#3F6FB0', ink: PAL.ink, sw: 2 });
  paint(rectPts(x0 + 4 * s, top + Hh * .64, L - 8 * s, 26 * s), { wash: '#F2C53D', ink: null });
  paint(rrPts(x0 + 14 * s, top + 26 * s, 84 * s, 150 * s, 14 * s), { wash: '#9FC4E0', washOp: 220, ink: PAL.ink, sw: 1 });
  for (let i = 0; i < 6; i++) paint(rrPts(x0 + 130 * s + i * 124 * s, top + 30 * s, 100 * s, 106 * s, 10 * s), { wash: '#FFE9B0', washOp: 225, ink: PAL.ink, sw: 1 });
  for (const wx of [x0 + 180 * s, x0 + L - 170 * s]) {
    paint(ellPts(wx, yG - 42 * s, 54 * s, 54 * s, 16), { wash: '#1A1820', ink: PAL.ink, sw: 1.4 });
    paint(ellPts(wx, yG - 42 * s, 20 * s, 20 * s, 10), { wash: '#8A8698', ink: null });
  }
  paint(ellPts(x0 + 16 * s, yG - 96 * s, 14 * s, 18 * s, 10), { wash: '#FFF6D8', ink: null });
  pop();
  if ((o.lights ?? 1) > .02) glow(o.flip ? x + L / 2 - 16 * s : x0 + 16 * s, yG - 96 * s, 280 * s, '#FFF2C8', o.lights ?? 1);
}
// The electric skateboard, side-on, centred at (x, y) (y = the wheels' bottom), s = its length / 2. o.glow underglow.
function eBoard(x, y, s, o = {}) {
  boilSeed('eboard');
  if ((o.glow ?? 1) > .02) glow(x, y - s * .05, s * 1.6, '#5FE3FF', o.glow ?? 1);
  paint(rrPts(x - s, y - s * .32, 2 * s, s * .12, s * .05), { wash: '#2A2634', ink: PAL.ink, sw: 1.2 });
  inkLine([[x - s, y - s * .3], [x - s * 1.12, y - s * .4]], 2, '#2A2634', 'ink', 0);
  for (const wx of [-.68, .68]) paint(ellPts(x + wx * s, y - s * .1, s * .1, s * .1, 10), { wash: '#5FE3FF', ink: PAL.ink, sw: .8 });
}

// ---------- the footbridge ----------
// The highway far below, light streaks running both ways (y0..y1), and the railing he leans on (in front, at railY).
function highway(y0, y1, t) {
  boilSeed('highway');
  paint(rectPts(-900, y0, W + 1800, y1 - y0), { wash: '#110F24', ink: null });
  for (let i = 0; i < 12; i++) {
    const lane = i % 2, yy = y0 + (y1 - y0) * (.18 + .64 * hash(i * 2.3)), sp = (lane ? -1 : 1) * (500 + 300 * hash(i)), len = 160 + 160 * hash(i * 5);
    const xx = ((hash(i * 7) * (W + 800) + t * sp) % (W + 800) + (W + 800)) % (W + 800) - 400;
    const c = lane ? '#FF5A4A' : '#FFF2C8';
    paint(rrPts(xx, yy, len, 6, 3), { wash: c, ink: null });
    if (i % 3 === 0) glow(xx + len / 2, yy, 90, c, .5);
  }
}
function railing(railY, P, x0 = -900, x1 = W + 900) {
  boilSeed('railing');
  for (let x = x0; x < x1; x += 150) paint(rectPts(x, railY, 14, H - railY + 200), { wash: '#2C2840', ink: PAL.ink, sw: 1 });
  paint(rectPts(x0, railY + 90, x1 - x0, 10), { wash: '#2C2840', ink: PAL.ink, sw: 1 });
  paint(rectPts(x0, railY - 14, x1 - x0, 22), { wash: '#3A3654', ink: PAL.ink, sw: 1.4 });
  inkLine([[x0, railY - 10], [x1, railY - 10]], 1, mixCol(P.lamp, '#FFFFFF', .3), 'inkfine', 0);
}

// ---------- the crossing in the rain ----------
// Seen from a little above: the road falls away from the camera, the zebra bars cross it, nearer = bigger.
const depthS = y => lerp(.42, 1.05, clamp((y - 430) / 600));
function crossing(P, t, light) {
  boilSeed('crossing');
  paint(rectPts(-900, 300, W + 1800, H), { wash: P.street, ink: null });
  for (let i = 0; i < 7; i++) {   // zebra bars, perspective-spaced
    const y = 460 + 600 * Math.pow(i / 6, 1.5), hh = 14 + 40 * Math.pow(i / 6, 1.4);
    paint(rectPts(-900, y, W + 1800, hh), { wash: '#C8D6E0', washOp: 150, ink: null });
  }
  for (const [px, py, rx] of [[480, 900, 220], [1420, 640, 170], [900, 540, 120]]) {   // puddles, holding the light's colour
    paint(ellPts(px, py, rx, rx * .18, 20), { wash: mixCol(P.street, '#0A1018', .4), ink: null });
    paint(ellPts(px + rx * .2, py, rx * .25, rx * .05, 12), { fill: light, fillOp: 140, bleed: .3, ink: null });
  }
}
// A walker under an umbrella (nearly all of them are just an umbrella and legs), at (x, y) scaled by depthS.
function umbrellaWalker(x, y, col, t, k = 0, dir = 1) {
  const s = depthS(y), step = Math.sin(t * 9 + k * 2.1), r = 95 * s;
  boilSeed('umb' + k);
  for (const lx of [-1, 1]) paint(rectPts(x + lx * 14 * s - 6 * s + step * lx * 5 * s, y - 70 * s, 12 * s, 70 * s), { wash: '#141822', ink: null });
  paint(rectPts(x - 28 * s, y - 150 * s, 56 * s, 85 * s, 3 * s), { wash: '#232A38', ink: null });
  inkLine([[x, y - 150 * s], [x, y - 200 * s]], 1.2, '#2A2634', 'inkfine', 0);
  const C = []; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; C.push([x + Math.cos(a) * r, y - 200 * s + Math.sin(a) * r * .55]); }
  for (let i = 4; i >= 0; i--) C.push([x - r + (i + .5) * r * .4, y - 200 * s + 10 * s * (i % 2 ? 1 : 0)]);
  paint(C, { wash: col, ink: PAL.ink, sw: .9 * s + .3 });
  for (const f of [-.5, 0, .5]) inkLine([[x + f * r * .3, y - 200 * s - r * .53], [x + f * r, y - 196 * s]], .6, mixCol(col, '#000000', .35), 'inkfine', .4);
}
function rain(t, P, n = 46, sl = .35) {
  boilSeed('rain');
  for (let i = 0; i < n; i++) {
    const x = ((hash(i * 3.7) * (W + 300) + t * 260 * sl) % (W + 300)) - 150, y = ((hash(i * 9.1) * H + t * 1400) % (H + 200)) - 100;
    inkLine([[x, y], [x - 28 * sl, y + 46]], .8, mixCol(P.line, '#FFFFFF', .2), 'inkfine', 0);
  }
}
function trafficLight(x, yG, h, state) {
  boilSeed('tlight');
  paint(rectPts(x - 7, yG - h, 14, h), { wash: '#2A2634', ink: PAL.ink, sw: 1 });
  paint(rrPts(x - 34, yG - h - 150, 68, 150, 14), { wash: '#1C1A24', ink: PAL.ink, sw: 1.2 });
  const cols = [['#FF4A3A', state === 'red'], ['#3DE08A', state === 'green']];
  cols.forEach(([c, on], i) => {
    paint(ellPts(x, yG - h - 110 + i * 70, 22, 22, 14), { wash: on ? c : mixCol(c, '#1C1A24', .8), ink: null });
    if (on) glow(x, yG - h - 110 + i * 70, 140, c, .9);
  });
}

// ---------- the two rooms of S6 ----------
// His: a dark flat, the window with the moon crossing it (mk 0..1), the sofa, the low table.
function hisRoom(x0, x1, P, mk) {
  boilSeed('hisroom');
  const w = x1 - x0;
  paint(rectPts(x0, -60, w, H + 120), { wash: P.wall, ink: null });
  const wx = x0 + w * .12, wy = 120, ww = w * .5, wh = 330;
  paint(rectPts(wx, wy, ww, wh), { wash: P.sky[1], ink: PAL.ink, sw: 2 });
  skylineMini(wx, wy + wh, ww, P);
  const mx = wx + 40 + (ww - 80) * mk, my = wy + 90 - 40 * Math.sin(mk * Math.PI);
  glow(mx, my, 120, '#FFF2C8', .7);
  paint(ellPts(mx, my, 34, 34, 18), { wash: '#FFF2C8', ink: null });
  inkLine([[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 2, PAL.ink, 'ink', 0);
  inkLine([[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], 2, PAL.ink, 'ink', 0);
  paint(rectPts(x0, 860, w, 240), { wash: mixCol(P.wall, '#000000', .35), ink: null });   // floor
}
function skylineMini(x, baseY, w, P) {
  for (let i = 0; i < 6; i++) { const bw = w / 6, bh = 60 + 120 * hash(i * 2.2); paint(rectPts(x + i * bw, baseY - bh, bw - 3, bh), { wash: P.far, ink: null }); if (hash(i * 5) > .4) paint(rectPts(x + i * bw + bw * .4, baseY - bh + 20, 8, 10), { wash: P.win, ink: null }); }
}
function sofa(x, yG, w, col) {
  boilSeed('sofa' + x);
  paint(rrPts(x - w / 2, yG - 250, w, 170, 30), { wash: col, ink: PAL.ink, sw: 1.6 });
  paint(rrPts(x - w / 2 + 20, yG - 120, w - 40, 90, 20), { wash: mixCol(col, '#FFFFFF', .12), ink: PAL.ink, sw: 1.2 });
  for (const s of [-1, 1]) paint(rrPts(x + s * (w / 2 - 30) - 40, yG - 170, 80, 150, 24), { wash: mixCol(col, '#000000', .15), ink: PAL.ink, sw: 1.4 });
}
// Hers: we are the vanity mirror, looking out at her. Bulbs run round the panel's edges and glow on the clap.
function vanityFrame(x0, x1, t) {
  boilSeed('vanity');
  paint(rectPts(x0, -60, x1 - x0, H + 120), { wash: '#4A2E48', ink: null });
  paint(ellPts((x0 + x1) / 2, 480, (x1 - x0) * .5, 420, 24), { fill: '#FFC8A0', fillOp: 80, bleed: .35, ink: null });
  paint(rectPts(x0, 830, x1 - x0, 300), { wash: '#6A4054', ink: PAL.ink, sw: 1.4 });   // the dressing table
  const n = 7, on = .7 + .3 * clapK(t);
  for (let i = 0; i < n; i++) for (const [bx, by] of [[x0 + 40 + i * (x1 - x0 - 80) / (n - 1), 40], [x0 + 30, 120 + i * 110], [x1 - 30, 120 + i * 110]]) {
    if (by > 800) continue;
    glow(bx, by, 60, '#FFE7B0', on * .8);
    paint(ellPts(bx, by, 16, 16, 12), { wash: mixCol('#C8B080', '#FFF6E0', on), ink: PAL.ink, sw: .8 });
  }
}
