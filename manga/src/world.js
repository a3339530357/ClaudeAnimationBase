// world.js: the small town in 2009, at night (and once at dawn). World px; backgrounds run wide (-700 .. W + 700) so
// cameras can move. Light is added (glowW, beam) and only reads on dark ground.

function skyNight(y1 = 700) {
  fillPath(pathOf(rectPts(-800, -600, W + 1600, y1 + 600)), INK);
  for (let i = 0; i < 70; i++) { const x = -700 + hash(i * 3.1) * (W + 1400), y = -400 + hash(i * 7.7) * (y1 + 300), r = 1.2 + 2.2 * hash(i * 9.3); X.fillStyle = WHITE; X.fill(pathOf(ellPts(x, y, r, r, 6))); }
}
function skyDawn(y1 = 700) {
  const P = pathOf(rectPts(-800, -600, W + 1600, y1 + 600)); fillPath(P, PAPER); toneGrad(P, 0, -300, 0, y1, .4, .04);
}
// a row of buildings along the skyline: night = black blocks with lit windows; dawn = grey blocks
function skyline(y, o = {}) {
  const dawn = o.dawn || 0;
  for (let i = 0; i < 14; i++) {
    const x = -700 + i * 220 + hash(i * 2.2) * 60, w = 160 + 90 * hash(i * 4.1), h = 160 + 260 * hash(i * 6.3);
    boilSeed('bld' + i);
    shape(rectPts(x, y - h, w, h + 40), { fill: dawn ? WHITE : INK, tone: dawn ? .28 : 0, lw: dawn ? 3 : 0, smooth: false, j: .4 });
    for (let r = 0; r < h / 46 - 1; r++) for (let c = 0; c < w / 40 - 1; c++) {
      const on = hash(i * 31 + r * 7 + c * 3) < (dawn ? .1 : .38) * (o.lit ?? 1); if (!on) continue;
      X.fillStyle = dawn ? INK : WHITE; X.fill(pathOf(rectPts(x + 16 + c * 40, y - h + 22 + r * 46, 18, 24)));
    }
  }
}
// the ground: pavement from y0 down, a curb, a road with lane dashes
function pavement(y0, o = {}) {
  const P = pathOf(rectPts(-800, y0, W + 1600, 1400));
  fillPath(P, o.dawn ? PAPER : INK); toneGrad(P, 0, y0, 0, y0 + 500, o.dawn ? .35 : .85, o.dawn ? .12 : .55);
  pen([[-800, y0 + 40], [W + 800, y0 + 40]], 4, { col: o.dawn ? INK : WHITE, taper: [0, 0], smooth: false, j: .3 });
  for (let i = 0; i < 12; i++) pen([[-700 + i * 300, y0 + 160], [-560 + i * 300, y0 + 160]], 8, { col: o.dawn ? INK : WHITE, taper: [.1, .1], smooth: false, j: .3 });
  if (o.wet) for (let i = 0; i < 20; i++) pen([[-600 + hash(i) * 3000, y0 + 70 + hash(i * 3) * 400], [-560 + hash(i) * 3000, y0 + 70 + hash(i * 3) * 400]], 3, { col: WHITE, taper: [.5, .5], smooth: false, j: .2 });
}
// a streetlamp: pole foot at (x, y), head reaching left to (x - reach, y - h). on 0..1
function streetlamp(x, y, h, reach, on = 1, o = {}) {
  boilSeed('lamp' + x);
  const hx = x - reach, hy = y - h;
  pen([[x, y], [x, hy + 60], [x - 20, hy + 6], [hx + 40, hy]], 16, { taper: [0, 0], col: o.col || INK, j: .3 });
  if (o.rim) pen([[x + 7, y], [x + 7, hy + 60]], 2.5, { col: WHITE, taper: [.2, .2], j: .3 });
  shape([[hx - 50, hy - 10], [hx + 50, hy - 10], [hx + 34, hy + 18], [hx - 34, hy + 18]], { fill: o.col || INK, lw: 3, line: o.rim ? WHITE : INK, smooth: false, j: .3 });
  if (on > 0) {
    shape(ellPts(hx, hy + 20, 30, 7, 14), { fill: WHITE, lw: 0, j: .2 });
    beam(hx, hy + 18, Math.PI / 2, y - hy + 60, 60, o.spread || 700, .26 * on);
    glowW(hx, hy + 22, 140 * on, .9 * on); glowW(hx, y + 10, 420 * on, .16 * on);
  }
}
// the corner shop (小卖部): front from x0, y0 (top of the awning) to the ground at yg. shutter 0 up (open) .. 1 down
function shop(x0, y0, yg, shutter = 0, o = {}) {
  const w = 680, dawn = o.dawn;
  boilSeed('shop');
  shape(rectPts(x0, y0 - 220, w, yg - y0 + 220), { fill: dawn ? WHITE : INK, tone: dawn ? .2 : 0, lw: 3, line: dawn ? INK : '#3A3640', smooth: false, j: .3 });
  shape(rectPts(x0 + 70, y0 - 190, w - 140, 120), { fill: WHITE, tone: dawn ? .1 : .25, lw: 4, smooth: false, j: .3 });    // the sign board (no letters)
  const doorX = x0 + 70, doorW = w - 140, doorY = y0 + 60, doorH = yg - doorY, sh = doorH * clamp(shutter);
  // the open door: a lit inside with shelves of bottles and boxes
  shape(rectPts(doorX, doorY, doorW, doorH), { fill: WHITE, lw: 3, smooth: false, j: .2 });
  for (let r = 0; r < 4; r++) { const sy = doorY + 40 + r * 60; pen([[doorX, sy], [doorX + doorW, sy]], 3, { taper: [0, 0], smooth: false, j: .3 });
    for (let c = 0; c < 14; c++) { const bx = doorX + 14 + c * 38, bh = 18 + 20 * hash(r * 17 + c); shape(rectPts(bx, sy - bh, 24, bh), { fill: WHITE, tone: hash(c + r) * .5, lw: 1.6, smooth: false, j: .3 }); } }
  if (!dawn && shutter < 1) glowW(doorX + doorW / 2, doorY + doorH * .5, doorW * .7, .4 * (1 - shutter));
  // the roller shutter coming down
  if (sh > 0) { shape(rectPts(doorX - 6, doorY, doorW + 12, sh), { fill: WHITE, tone: dawn ? .3 : .5, lw: 3, smooth: false, j: .2 });
    for (let y = doorY + 14; y < doorY + sh; y += 16) pen([[doorX - 6, y], [doorX + doorW + 6, y]], 2, { taper: [0, 0], smooth: false, j: .2 }); }
  // the striped awning
  for (let i = 0; i < 8; i++) shape([[x0 - 20 + i * (w + 40) / 8, y0], [x0 - 20 + (i + 1) * (w + 40) / 8, y0], [x0 - 20 + (i + 1) * (w + 40) / 8 - 6, y0 + 56], [x0 - 20 + i * (w + 40) / 8 + 6, y0 + 60]], { fill: i % 2 ? WHITE : INK, tone: i % 2 ? .15 : 0, lw: 2.5, smooth: false, j: .3 });
}
// a wooden utility pole with a crossbar and sagging wires off both sides
function utilityPole(x, y, h, o = {}) {
  boilSeed('pole' + x);
  pen([[x, y], [x + 4, y - h]], 26, { taper: [0, 0], col: o.dawn ? WHITE : INK, j: .4 }); pen([[x + 9, y], [x + 13, y - h]], 3, { col: o.dawn ? INK : WHITE, taper: [.1, .1], j: .3 });
  pen([[x - 90, y - h + 50], [x + 98, y - h + 46]], 12, { taper: [0, 0], col: o.dawn ? INK : '#3A3640', j: .3 });
  for (const [dx, dy] of [[-80, 48], [0, 46], [90, 44]]) for (const sd of [-1, 1]) {
    const x0 = x + dx, y0 = y - h + dy, x1 = x0 + sd * 1400;
    pen([[x0, y0], [lerp(x0, x1, .5), y0 + 120 + dx * .2], [x1, y0 + 40]], 2.4, { col: o.dawn ? INK : '#5A5560', taper: [0, 0], j: .3 });
  }
}
// the whole corner (S1, S16): sky, skyline, the shop, the pole, the lamp, the ground. Characters stand at y ≈ 900.
function corner(t, o = {}) {
  const dawn = o.dawn || 0;
  if (dawn) skyDawn(); else skyNight();
  skyline(640, { dawn, lit: o.lit });
  pavement(700, { dawn });
  shop(-80, 330, 760, o.shutter || 0, { dawn });
  utilityPole(1720, 760, 720, { dawn });
  streetlamp(1420, 900, 650, 260, o.lamp ?? 1, { rim: !dawn, spread: 760 });
}

// ---------- the roller rink ----------
function rink(t, o = {}) {
  fillPath(pathOf(rectPts(-800, -600, W + 1600, 2200)), INK);
  // the floor: a polished oval with reflections, the railing in front of it
  const fl = pathOf(ellPts(960, 860, 1500, 360, 48)); fillPath(fl, '#26232B'); toneGrad(fl, 960, 500, 960, 1200, .6, .95);
  for (let i = 0; i < 9; i++) pen([[200 + i * 200, 620], [120 + i * 220, 1120]], 3, { col: '#3A3640', taper: [.2, .2], j: .3 });
  // light dots from the mirror ball, one step around each beat
  const b = sbeat(t), step = Math.floor(b) + ease(frac(b) * 3);
  for (let i = 0; i < 46; i++) {
    const a = i / 46 * TAU + step * .22, rr = 500 + 700 * hash(i * 3.7), x = 960 + Math.cos(a) * rr * 1.4, y = 560 + Math.sin(a) * rr * .45;
    const q = 5 + 8 * hash(i * 5.5); X.fillStyle = WHITE; X.fill(pathOf(ellR(x, y, q * 1.6, q, a, 10))); glowW(x, y, q * 4, .25);
  }
  mirrorBall(960, 110, 80, t);
  if (o.rail !== false) railing(o.railY ?? 760);
}
function mirrorBall(x, y, r, t) {
  pen([[x, -600], [x, y - r]], 4, { col: '#5A5560', taper: [0, 0], smooth: false, j: 0 });
  shape(ellPts(x, y, r, r, 24), { fill: WHITE, tone: .35, lw: 3, j: .3 });
  X.save(); X.clip(pathOf(ellPts(x, y, r, r, 24)));
  for (let i = -3; i <= 3; i++) { pen([[x - r, y + i * r / 3.5], [x + r, y + i * r / 3.5]], 2, { taper: [0, 0], smooth: false, j: 0 }); pen([[x + i * r / 3.5 + Math.sin(t * 2) * 8, y - r], [x + i * r / 3.5 + Math.sin(t * 2) * 8, y + r]], 2, { taper: [0, 0], smooth: false, j: 0 }); }
  X.restore();
  for (let i = 0; i < 4; i++) sparkle(x + (hash(i + Math.floor(t * 6)) - .5) * r * 1.6, y + (hash(i * 3 + Math.floor(t * 6)) - .5) * r * 1.6, 16 + 10 * hash(i), { glow: .4 });
  glowW(x, y, r * 3, .35 + .3 * clap(t));
}
function railing(y) {
  for (let x = -700; x < W + 700; x += 90) pen([[x, y], [x, y + 160]], 8, { col: WHITE, taper: [0, 0], smooth: false, j: .3 });
  for (const dy of [0, 70]) { pen([[-800, y + dy], [W + 800, y + dy]], 16, { col: WHITE, taper: [0, 0], smooth: false, j: .3 }); pen([[-800, y + dy + 8], [W + 800, y + dy + 8]], 4, { taper: [0, 0], smooth: false, j: .2 }); }
}

// ---------- the net cafe: rows of monitors glowing into the dark, smoke ----------
function netcafe(t) {
  fillPath(pathOf(rectPts(-800, -600, W + 1600, 2200)), INK);
  layer(() => { for (let row = 0; row < 3; row++) {
    const y = 380 + row * 70, s = .3 + row * .12;
    for (let i = 0; i < 9; i++) { const x = -200 + i * 290 * s * 3 + row * 80; crt(x, y, s, (a, b, c, d) => { fillPath(pathOf(rectPts(a, b, c, d)), 'tone:.15'); }, { key: 'bg' + row + i }); glowW(x, y, 220 * s * 2, .2); }
    shape(rectPts(-800, y + 60 * s * 3, W + 1600, 30), { fill: WHITE, tone: .7, lw: 0, smooth: false, j: 0 });
  } }, .5);
  for (let i = 0; i < 7; i++) {   // smoke
    const x = hash(i * 3.3) * W, y = 200 + hash(i * 5.1) * 500 - (t * 20) % 200;
    pen([[x, y], [x + 60 + Math.sin(t + i) * 30, y - 80], [x + 20, y - 160], [x + 80 + Math.sin(t * 1.3 + i) * 40, y - 240]], 14, { col: 'rgba(255,253,247,.12)', taper: [.5, .5], j: 2 });
  }
}

// ---------- his room at night ----------
function room(t, o = {}) {
  const P = pathOf(rectPts(-800, -600, W + 1600, 2200)); fillPath(P, WHITE); fillPath(P, 'tone:.32');
  hatch(pathOf(rectPts(-800, -600, W + 1600, 2200)), -.9, 26, 1.2);
  // the window with the moon moving across
  const wx0 = 1180, wy0 = 120, ww = 520, wh = 380, mk = o.moon ?? .5;
  shape(rectPts(wx0, wy0, ww, wh), { fill: INK, lw: 8, smooth: false, j: .3 });
  X.save(); X.clip(pathOf(rectPts(wx0, wy0, ww, wh))); const mx = lerp(wx0 - 40, wx0 + ww + 40, mk), my = wy0 + 120 + 60 * Math.sin(mk * Math.PI) * -1 + 60;
  shape(ellPts(mx, my, 54, 54, 24), { fill: WHITE, lw: 0, j: .2 }); glowW(mx, my, 200, .5);
  for (let i = 0; i < 12; i++) { X.fillStyle = WHITE; X.fill(pathOf(ellPts(wx0 + hash(i) * ww, wy0 + hash(i * 3) * wh, 2, 2, 6))); }
  X.restore();
  pen([[wx0 + ww / 2, wy0], [wx0 + ww / 2, wy0 + wh]], 8, { taper: [0, 0], smooth: false, j: .2 }); pen([[wx0, wy0 + wh / 2], [wx0 + ww, wy0 + wh / 2]], 8, { taper: [0, 0], smooth: false, j: .2 });
  beam(mx, my, 2.3, 900, 200, 700, .08);
}

// ---------- the club: the iron door on a black brick wall; the dance floor ----------
function clubWall(t) {
  fillPath(pathOf(rectPts(-800, -600, W + 1600, 2200)), INK);
  for (let r = 0; r < 26; r++) for (let c = 0; c < 34; c++) { const x = -700 + c * 90 + (r % 2) * 45, y = -300 + r * 46; pen([[x, y], [x + 84, y]], 2, { col: '#2E2A33', taper: [0, 0], smooth: false, j: .3 }); pen([[x, y], [x, y + 46]], 2, { col: '#2E2A33', taper: [0, 0], smooth: false, j: .3 }); }
}
function clubDoor(cx, y, open, t) {   // the door's centre x, its foot y; open 0..1 swings it (it narrows, light pours out)
  const w = 360, h = 640, x0 = cx - w / 2, y0 = y - h;
  shape(rectPts(x0 - 24, y0 - 24, w + 48, h + 24), { fill: '#2E2A33', lw: 4, smooth: false, j: .3 });
  if (open > 0) { shape(rectPts(x0, y0, w, h), { fill: WHITE, lw: 0, smooth: false, j: 0 }); glowW(cx, y0 + h / 2, 500 * open, .8 * open); beam(cx, y0 + h, Math.PI / 2, 400, w, w * 2.4, .4 * open); }
  const dw = w * (1 - .85 * easeOut(open));
  shape([[x0, y0], [x0 + dw, y0 + 24 * open], [x0 + dw, y0 + h - 24 * open], [x0, y0 + h]], { fill: INK, lw: 4, line: '#5A5560', smooth: false, j: .3 });
  for (let i = 0; i < 6; i++) pen([[x0 + 20, y0 + 40 + i * 100], [x0 + dw - 20, y0 + 40 + i * 100 + 20 * open]], 3, { col: '#3A3640', taper: [0, 0], smooth: false, j: .2 });
  shape(rectPts(x0 + dw - 40, y0 + h / 2 - 8, 24, 16), { fill: WHITE, lw: 2, smooth: false, j: .1 });
}
// the dance floor: black, white laser lines swinging on the beat, the mirror ball, a crowd
function dancefloor(t, o = {}) {
  fillPath(pathOf(rectPts(-800, -600, W + 1600, 2200)), INK);
  const b = sbeat(t);
  for (let i = 0; i < 10; i++) {
    const sx = (i % 2 ? -100 : W + 100), a = Math.PI / 2 + (i % 2 ? -1 : 1) * (.35 + .4 * Math.sin(b * Math.PI / 2 + i)), L = 2600;
    X.save(); X.globalCompositeOperation = 'lighter'; pen([[sx, -60], [sx + Math.cos(a) * L, -60 + Math.sin(a) * L]], 3, { col: 'rgba(255,253,247,.55)', taper: [0, .6], smooth: false, j: 0 }); X.restore();
  }
  for (let i = 0; i < 3; i++) beam(300 + i * 660, -80, Math.PI / 2 + Math.sin(b * .5 + i * 2) * .4, 1300, 30, 520, .14 + .12 * clap(t));
  if (o.ball !== false) mirrorBall(960, 70, 60, t);
  // floor glow and the crowd in rows (back rows smaller)
  glowW(960, 1100, 1200, .12);
  const rows = o.rows ?? 3;
  for (let r = rows - 1; r >= 0; r--) { const s = .45 + r * -.1 + (rows - 1 - r) * 0, k = [.62, .5, .4][r] || .35, y = [1080, 930, 840][r] || 800;
    for (let i = 0; i < 9 + r * 3; i++) fig(-300 + i * (2500 / (9 + r * 3)) + (r % 2) * 80, y, k, r * 40 + i, t, { jump: o.jump && t > o.jump && t < o.jump + .5, slow: o.slow, fill: INK, rim: r ? '#8A8590' : WHITE }); }
}
// the bar counter along the bottom of the frame (y = its top edge)
function barCounter(y) {
  shape(rectPts(-800, y, W + 1600, 900), { fill: INK, lw: 0, smooth: false, j: 0 });
  pen([[-800, y], [W + 800, y]], 10, { col: WHITE, taper: [0, 0], smooth: false, j: .3 }); pen([[-800, y + 22], [W + 800, y + 22]], 3, { col: '#5A5560', taper: [0, 0], smooth: false, j: .3 });
}
// the booth sofa: a curved tufted back (tone), seen from the front
function sofa(cx, y, w, h = 420) {
  shape(rrPts(cx - w / 2, y - h, w, h, 60), { fill: WHITE, tone: .55, lw: 4, j: .4 });
  for (const sd of [-1, 1]) shape(rrPts(cx + sd * w / 2 - 70, y - 220, 140, 260, 50), { fill: WHITE, tone: .65, lw: 4, j: .4 });
  for (let i = 1; i < 6; i++) pen([[cx - w / 2 + i * w / 6, y - 380 + Math.abs(i - 3) * 8], [cx - w / 2 + i * w / 6, y - 40]], 3, { j: .3 });
  for (let i = 0; i < 12; i++) shape(ellPts(cx - w / 2 + (i % 6 + .5) * w / 6, y - 280 + Math.floor(i / 6) * 140, 7, 7, 8), { fill: INK, lw: 0, j: .2 });
}
