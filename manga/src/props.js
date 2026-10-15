// props.js: the 2009 things. All in screen/world px at (x, y) with scale s (1 = the size noted), r = rotation.
// No letters anywhere: screens and labels get icons and lines.

// the shared earbud wire, sagging from p0 to p1 (sag px), each end a little bud
function earWire(p0, p1, sag = 80, o = {}) {
  const m = [(p0[0] + p1[0]) / 2, Math.max(p0[1], p1[1]) + sag];
  const P = [p0, [lerp(p0[0], m[0], .5), lerp(p0[1], m[1], .8)], m, [lerp(p1[0], m[0], .5), lerp(p1[1], m[1], .8)], p1];
  pen(P, o.w || 5, { taper: [0, 0], j: .4 }); pen(P, (o.w || 5) * .45, { col: WHITE, taper: [0, 0], j: .4 });
  for (const p of o.buds || [p0, p1]) shape(ellPts(p[0], p[1], 7, 9, 10), { fill: WHITE, lw: 2.4, j: .2 });
}
// 大头贴: a strip of four photos, the two of them pulling faces (mini heads). wet = drops on it
function photoStrip(x, y, s, r = 0, t = 0, wet = 0) {
  at(x, y, s, r, false, () => {
    boilSeed('strip'); shape(rectPts(-60, -200, 120, 400), { fill: WHITE, lw: 3, smooth: false, j: .3 });
    const faces = [[{ mouth: 'grin', eyes: 'happy' }, { mouth: 'smirk' }], [{ mouth: 'o', mo: .7 }, { mouth: 'grin', eyes: 'happy' }], [{ mouth: 'smile', blush: 1 }, { look: [-.8, 0], mouth: 'smirk' }], [{ eyes: 'happy', mouth: 'smile', blush: 1 }, { eyes: 'happy', mouth: 'grin' }]];
    for (let i = 0; i < 4; i++) {
      const fy = -150 + i * 98, fr = rectPts(-50, fy - 42, 100, 86);
      panel(fr, () => {
        fillPath(pathOf(fr), 'tone:.1'); for (let k = 0; k < 3; k++) sparkle(-35 + k * 34, fy - 28 + (k % 2) * 50, 8);
        head(26, fy + 8, .5, FEI, faces[i][1], { t, key: 'sf' + i, v: -.35, tilt: .15 });
        head(-22, fy + 6, .5, LU, faces[i][0], { t, key: 'sl' + i, v: .35, tilt: -.15 });
      }, { lw: 2.5, shadow: false });
    }
    for (let i = 0; i < 6 * wet; i++) { const dx = (hash(i * 3.3) - .5) * 90, dy = (hash(i * 5.1) - .5) * 360, q = 6 + 6 * hash(i); shape(ellPts(dx, dy, q, q * .8, 12), { fill: 'rgba(255,253,247,.6)', lw: 1.5, j: .3 }); }
  });
}
// a glass soda bottle (s = 1: 160 tall, base at y)
function sodaBottle(x, y, s = 1, r = 0) {
  at(x, y, s, r, false, () => {
    const P = [[-20, 0], [20, 0], [22, -70], [12, -105], [9, -150], [-9, -150], [-12, -105], [-22, -70]];
    const S = shape(P, { fill: WHITE, tone: .22, lw: 3, j: .3 });
    shape(rectPts(-10, -160, 20, 12), { fill: WHITE, lw: 2.5, smooth: false, j: .2 });
    pen([[-12, -60], [-14, -20]], 4, { col: WHITE, j: .2 }); shape(rectPts(-21, -60, 42, 30), { fill: WHITE, lw: 2, smooth: false, j: .2 });
  });
}
// the white shirt as a loose cloth: k 0 folded in her hands .. 1 spread; flutter with t
function cloth(x, y, w, h, t, r = 0, o = {}) {
  at(x, y, 1, r, false, () => {
    boilSeed('cloth' + (o.key || ''));
    const P = []; for (let i = 0; i <= 8; i++) P.push([-w / 2 + w * i / 8, -h / 2 + Math.sin(t * 9 + i) * 6]);
    for (let i = 1; i <= 6; i++) P.push([w / 2 + Math.sin(t * 8 + i) * 8, -h / 2 + h * i / 6]);
    for (let i = 8; i >= 0; i--) P.push([-w / 2 + w * i / 8, h / 2 + Math.sin(t * 7 + i * 1.3) * 10]);
    for (let i = 5; i >= 1; i--) P.push([-w / 2 + Math.sin(t * 8 + i) * 8, -h / 2 + h * i / 6]);
    const S = shape(P, { fill: WHITE, lw: 3.5, smooth: false, j: .5 });
    X.save(); X.clip(pathOf(S)); for (let i = 0; i < 3; i++) pen([[-w * .3 + i * w * .3, -h * .4], [-w * .2 + i * w * .3, h * .4]], 2, { taper: [.5, .5] }); X.restore();
    if (o.collar) shape([[-30, -h / 2], [0, -h / 2 + 30], [30, -h / 2], [14, -h / 2 + 4], [0, -h / 2 + 12], [-14, -h / 2 + 4]], { fill: WHITE, lw: 2.5, j: .3 });
  });
}
// a CRT monitor seen from the front (s = 1: 360 wide); screen(xs, ys, ws, hs) draws the picture
function crt(x, y, s = 1, screen = null, o = {}) {
  at(x, y, s, 0, false, () => {
    boilSeed('crt' + (o.key || ''));
    shape([[-180, -150], [180, -150], [180, 150], [-180, 150]], { fill: WHITE, tone: .12, lw: 4, smooth: false, j: .3 });
    shape([[-60, 150], [60, 150], [90, 190], [-90, 190]], { fill: WHITE, tone: .3, lw: 3, smooth: false, j: .3 });
    const sc = [[-150, -122], [150, -122], [154, 112], [-154, 112]];
    shape(sc, { fill: o.off ? INK : WHITE, lw: 3.5, j: .4 });
    if (screen && !o.off) { X.save(); X.clip(pathOf(sc)); screen(-152, -122, 304, 234); X.restore(); }
    for (let i = 0; i < 12; i++) pen([[-150, -110 + i * 19], [150, -110 + i * 19]], 1, { col: 'rgba(20,18,22,.25)', taper: [0, 0], smooth: false, j: 0 });
    shape(ellPts(140, 132, 6, 6, 8), { fill: o.off ? INK : WHITE, lw: 2, j: 0 });
  });
}
// the dance game on a screen rect: four arrow lanes, arrows scrolling up one lane-step per beat, the combo stars at k
function danceGame(x, y, w, h, t, combo = 0) {
  fillPath(pathOf(rectPts(x, y, w, h)), 'tone:.7');
  const lanes = [Math.PI, Math.PI / 2, -Math.PI / 2, 0], lx = i => x + w * (.2 + .2 * i), ty = y + h * .18;
  for (let i = 0; i < 4; i++) arrowIcon(lx(i), ty, 22, lanes[i], null);
  const b = sbeat(t);
  for (let n = Math.floor(b) - 1; n < Math.floor(b) + 5; n++) {
    const lane = Math.floor(hash(n * 7.7) * 4), ay = ty + (n - b) * h * .2; if (ay < y - 20 || ay > y + h + 20) continue;
    arrowIcon(lx(lane), ay, 22, lanes[lane], WHITE);
  }
  if (combo > 0) for (let i = 0; i < 6; i++) sparkle(x + w * (.15 + .7 * hash(i * 2.1)), y + h * (.3 + .5 * hash(i * 4.4)), 30 * Math.sin(Math.PI * clamp(combo)), { glow: .3 });
}
function arrowIcon(x, y, r, ang, fill) {
  const P = tf([[r, 0], [0, -r], [0, -r * .45], [-r, -r * .45], [-r, r * .45], [0, r * .45], [0, r]], x, y, 1, ang);
  X.fillStyle = fill || 'rgba(0,0,0,0)'; if (fill) X.fill(pathOf(P)); X.lineWidth = 2.5; X.strokeStyle = fill ? INK : WHITE; X.lineJoin = 'round'; X.stroke(pathOf(P));
}
// the QQ window: a little framed window with a penguin icon; shake = how hard it's nudging (窗口抖动)
function qqWindow(x, y, w, h, shake = 0, t = 0) {
  const dx = Math.sin(t * 70) * 10 * shake, dy = Math.cos(t * 83) * 6 * shake;
  X.save(); X.translate(dx, dy);
  shape(rectPts(x, y, w, h), { fill: WHITE, lw: 3, smooth: false, j: .2 });
  fillPath(pathOf(rectPts(x, y, w, h * .18)), 'tone:.45');
  const px = x + w * .22, py = y + h * .55, pr = h * .22;   // the penguin: black body, white belly, two dots
  shape(ellPts(px, py, pr * .8, pr, 16), { fill: INK, lw: 0, j: .2 }); shape(ellPts(px, py + pr * .2, pr * .5, pr * .7, 14), { fill: WHITE, lw: 0, j: .2 });
  for (const sd of [-1, 1]) shape(ellPts(px + sd * pr * .25, py - pr * .5, pr * .12, pr * .16, 8), { fill: WHITE, lw: 0, j: 0 });
  for (let i = 0; i < 3; i++) pen([[x + w * .45, y + h * (.4 + i * .17)], [x + w * (.85 - i * .12), y + h * (.4 + i * .17)]], 3, { taper: [.1, .1], smooth: false, j: .3 });
  X.restore();
}
// the Nokia slider (s = 1: 220 tall). slide 0 shut .. 1 open; screen: 'off' | 'lit' | 'battery' | 'call'
function nokia(x, y, s = 1, r = 0, slide = 0, screen = 'off', t = 0) {
  at(x, y, s, r, false, () => {
    boilSeed('nokia');
    const dy = -60 * clamp(slide);
    shape(rrPts(-48, -110 + 60, 96, 170), { fill: WHITE, tone: .5, lw: 3, j: .3 });   // the keypad half underneath
    for (let i = 0; i < 9; i++) shape(rectPts(-30 + (i % 3) * 22, 10 + Math.floor(i / 3) * 20 + 30, 16, 12), { fill: WHITE, lw: 1.5, smooth: false, j: .2 });
    X.save(); X.translate(0, dy);
    shape(rrPts(-50, -110, 100, 200), { fill: INK, lw: 3, j: .3 });
    const sc = rectPts(-36, -88, 72, 92);
    if (screen === 'off') shape(sc, { fill: INK, line: '#3A3640', lw: 2, smooth: false, j: 0 });
    else {
      shape(sc, { fill: WHITE, lw: 2, smooth: false, j: 0 }); glowW(0, -42, 140, .5);
      if (screen === 'battery') {
        shape(rectPts(-22, -56, 40, 26), { fill: null, lw: 3, smooth: false, j: 0 }); shape(rectPts(18, -48, 6, 10), { fill: INK, lw: 0, smooth: false, j: 0 });
        if (frac(t * 4) < .5) shape(rectPts(-18, -52, 6, 18), { fill: INK, lw: 0, smooth: false, j: 0 });
      }
      if (screen === 'call') { shape(ellPts(0, -50, 16, 16, 14), { fill: INK, lw: 0, j: 0 }); for (let i = 0; i < 3; i++) pen([[22 + i * 8, -66], [28 + i * 8, -50], [22 + i * 8, -34]], 2, { j: .2 }); }
    }
    shape(rectPts(-14, 18, 28, 14), { fill: '#3A3640', lw: 1.5, smooth: false, j: 0 });
    X.restore();
  });
}
// a tear-off day calendar (s = 1: 240 wide); the top page flies off with k (0 attached .. 1 gone)
function calendarPage(x, y, s, fly = 0, seed = 0, r = 0) {
  at(x, y, s, r, false, () => {
    boilSeed('cal' + seed);
    const P = rectPts(-120, -150, 240, 300);
    shape(P, { fill: WHITE, lw: 3, smooth: false, j: .4 });
    fillPath(pathOf(rectPts(-120, -150, 240, 50)), 'tone:.55');
    shape([[-55, -70], [-10, -76], [-12, 60], [-56, 66]], { fill: INK, lw: 0, j: 1.5 });     // a big blocky date shape (not a numeral)
    shape([[10, -76], [60, -70], [56, 66], [12, 60]], { fill: INK, lw: 0, j: 1.5 });
    shape(ellPts(-33, -6, 8, 26, 10), { fill: WHITE, lw: 0, j: 1 }); shape(ellPts(34, -6, 8, 26, 10), { fill: WHITE, lw: 0, j: 1 });
    for (let i = 0; i < 2; i++) pen([[-80, 95 + i * 18], [80, 95 + i * 18]], 2, { j: .3 });
  });
}
function calendarBlock(x, y, s, t, gone) {   // the block on the wall, with the page that's flying this beat
  at(x, y, s, 0, false, () => { shape(rectPts(-130, -170, 260, 340), { fill: INK, lw: 3, smooth: false, j: .3 }); shape(rectPts(-124, -160, 248, 330), { fill: WHITE, lw: 2, smooth: false, j: .2 }); });
  calendarPage(x, y + 10 * s, s, 0, Math.floor(gone) + 1);
  const k = frac(gone); if (k > 0) { const e = easeOut(k); calendarPage(x + (220 + 600 * hash(Math.floor(gone))) * e * s, y - 160 * e * s + 300 * e * e * s, s * (1 - .3 * e), 0, Math.floor(gone), 1.4 * e * (hash(gone) < .5 ? -1 : 1)); }
}
// lipstick (s = 1: 120 long, along -y): out 0..1 the bullet twisted up; col = RED or a grey tone
function lipstick(x, y, s, r = 0, out = 1, col = RED) {
  at(x, y, s, r, false, () => {
    boilSeed('lipstick');
    shape(rectPts(-16, -30, 32, 60), { fill: INK, lw: 3, smooth: false, j: .2 });
    shape(rectPts(-14, -46, 28, 18), { fill: WHITE, tone: .4, lw: 2.5, smooth: false, j: .2 });
    const top = -46 - 46 * out;
    shape([[-11, -44], [11, -44], [11, top + 8], [-11, top - 6]], { fill: col === RED ? RED : WHITE, tone: col === RED ? 0 : .55, lw: 2.5, smooth: false, j: .2, line: col === RED ? REDDK : INK });
    pen([[-6, -44], [-6, top + 2]], 2, { col: 'rgba(255,253,247,.7)', taper: [.3, .3], j: .2 });
  });
}
// a curling iron with steam rising
function curler(x, y, s, r, t) {
  at(x, y, s, r, false, () => {
    boilSeed('curler');
    shape(rectPts(-16, 0, 32, 120), { fill: INK, lw: 2.5, smooth: false, j: .2 });
    shape(rrPts(-10, -170, 20, 172, 10), { fill: WHITE, tone: .3, lw: 2.5, j: .2 });
    shape([[-14, -150], [-24, -150], [-24, -30], [-14, -20]], { fill: INK, lw: 2, smooth: false, j: .2 });
    for (let i = 0; i < 3; i++) { const ph = frac(t * .8 + i / 3), yy = -180 - ph * 140; pen([[-10 + i * 10, yy + 40], [-20 + i * 10 + Math.sin(t * 3 + i) * 14, yy + 15], [-6 + i * 10, yy]], 3 * (1 - ph), { col: INK, taper: [.5, .5], j: .5 }); }
  });
}
// a dice cup upside down on the table (s = 1: 150 tall), and the dice
function diceCup(x, y, s, r = 0) {
  at(x, y, s, r, false, () => {
    boilSeed('cup');
    shape([[-62, 0], [62, 0], [48, -150], [-48, -150]], { fill: INK, lw: 3, smooth: false, j: .3 });
    shape(ellPts(0, -150, 48, 12, 18), { fill: INK, line: WHITE, lw: 2, j: .2 });
    pen([[-38, -20], [-30, -130]], 6, { col: WHITE, taper: [.5, .5], j: .3 });
    pen([[-62, 0], [62, 0]], 4, { taper: [0, 0], smooth: false, j: .2 });
  });
}
function die(x, y, s, r, face) {
  at(x, y, s, r, false, () => {
    shape(rrPts(-20, -20, 40, 40, 7), { fill: WHITE, lw: 2.5, j: .2 });
    const D = { 1: [[0, 0]], 2: [[-9, -9], [9, 9]], 3: [[-10, -10], [0, 0], [10, 10]], 4: [[-9, -9], [9, -9], [-9, 9], [9, 9]], 5: [[-10, -10], [10, -10], [0, 0], [-10, 10], [10, 10]], 6: [[-9, -11], [9, -11], [-9, 0], [9, 0], [-9, 11], [9, 11]] }[face];
    for (const [dx, dy] of D) shape(ellPts(dx, dy, 3.6, 3.6, 8), { fill: INK, lw: 0, j: 0 });
  });
}
// a beer can (s = 1: 200 tall) squeezed by crush 0..1: the waist pinches in, dents boil on it
function beerCan(x, y, s, crush = 0, r = 0) {
  at(x, y, s, r, false, () => {
    boilSeed('can' + Math.floor(crush * 8));
    const c = crush, P = [[-56, -100], [56, -100], [56 - 34 * c, -40], [56 - 46 * c, 0], [56 - 34 * c, 40], [56, 92], [-56, 92], [-56 + 34 * c, 40], [-56 + 46 * c, 0], [-56 + 34 * c, -40]];
    const S = shape(P.map(([px, py]) => [px, py * (1 - .25 * c)]), { fill: WHITE, tone: .35, lw: 3.5, j: .6 + 2 * c });
    X.save(); X.clip(pathOf(S)); fillPath(pathOf(rectPts(-60, -30, 120, 50)), INK);
    for (let i = 0; i < 6 * c; i++) pen([[-40 + hash(i) * 80, -80 + hash(i * 3) * 150], [-30 + hash(i * 5) * 60, -60 + hash(i * 7) * 120]], 2.5, { col: WHITE, taper: [.3, .3] });
    pen([[-40, -80], [-40, 70]], 7, { col: 'rgba(255,253,247,.8)', taper: [.4, .4] }); X.restore();
    shape(ellPts(0, -100 * (1 - .25 * c), 56, 12, 18), { fill: WHITE, lw: 3, j: .3 });
  });
}
function beerBottle(x, y, s, r = 0) {
  at(x, y, s, r, false, () => {
    boilSeed('bottle');
    const P = [[-26, 0], [26, 0], [28, -110], [14, -160], [11, -215], [-11, -215], [-14, -160], [-28, -110]];
    shape(P, { fill: INK, lw: 3, j: .3 });
    shape(rectPts(-24, -100, 48, 50), { fill: WHITE, lw: 2, smooth: false, j: .2 });
    pen([[-16, -150], [-18, -20]], 5, { col: WHITE, taper: [.5, .5], j: .3 });
  });
}
// a short glass with a red lip print on the rim (s = 1: 130 tall)
function lipGlass(x, y, s, print = true) {
  at(x, y, s, 0, false, () => {
    boilSeed('glass');
    shape([[-44, -130], [44, -130], [36, 0], [-36, 0]], { fill: 'rgba(255,253,247,.35)', lw: 3, smooth: false, j: .3 });
    fillPath(pathOf([[-40, -70], [40, -70], [36, 0], [-36, 0]]), 'tone:.35');
    shape(ellPts(0, -130, 44, 9, 18), { fill: null, lw: 2.5, j: .2 });
    pen([[-28, -110], [-24, -20]], 4, { col: WHITE, taper: [.5, .5] });
    if (print) { shape([[10, -132], [24, -134], [30, -129], [24, -124], [10, -125]], { fill: RED, lw: 0, j: .3 }); shape([[11, -125], [24, -124], [27, -119], [14, -119]], { fill: RED, lw: 0, j: .3 }); }
  });
}
// a white neon sign (heart + a cocktail glass) on a black wall: on 0..1 (flickers while it comes on)
function neonSign(x, y, s, on, t) {
  at(x, y, s, 0, false, () => {
    const fl = on >= 1 ? 1 : on > 0 && frac(t * 13) < .6 ? on : 0;
    const heart = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); heart.push([-110 + hx * 5, hy * 5]); }
    const glass = [[40, -70], [150, -70], [95, 0], [95, 60], [60, 70], [130, 70], [95, 60]];
    for (const [P, sm] of [[heart, false], [glass, false]]) {
      pen(P, 12, { smooth: sm, taper: [0, 0], j: 0, col: '#3A3640' });
      if (fl > 0) { pen(P, 7, { smooth: sm, taper: [0, 0], j: 0, col: WHITE }); }
    }
    if (fl > 0) { glowW(-110, 0, 260 * fl, .55 * fl); glowW(95, 0, 220 * fl, .45 * fl); }
  });
}
// IC-card phone keypad (w × h), key lit = index 0..11 (or -1), press 0..1 the fingertip on it
function keypad(x, y, w, h, lit = -1, press = 0) {
  shape(rectPts(x, y, w, h), { fill: WHITE, tone: .3, lw: 4, smooth: false, j: .3 });
  for (let i = 0; i < 12; i++) {
    const kx = x + w * (.14 + (i % 3) * .26), ky = y + h * (.12 + Math.floor(i / 3) * .2), kw = w * .2, kh = h * .14;
    shape(rrPts(kx, ky, kw, kh, 8), { fill: i === lit ? INK : WHITE, lw: 2.5, j: .2 });
    if (i === lit) glowW(kx + kw / 2, ky + kh / 2, kw, .2);
  }
}
