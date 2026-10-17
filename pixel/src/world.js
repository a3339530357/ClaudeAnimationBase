// world.js: skies, weather and the shared sets. All sets fill the whole buffer (call them first in a shot).
//
//   sky(mood, y0, y1)        'night' | 'day' | 'spring' | 'sunset' | 'dawn' | 'rain' | 'snowday' gradient between y0, y1
//   stars(t, y1, n), moon(x, y)
//   snow(t, o) / rain(t, o)  weather over the whole buffer: o.n density, o.wind, o.speed, o.col, o.y1 (ground)
//   sea(y, t, mood), city(y, o) skyline (o.lit windows, o.col)
//   stationHall(t, o)        the hall: o.mood 'night' | 'spring' | 'dawn' | 'evening' | 'summer', o.warm 0..1 (lamps
//                            glowing), o.piano (default true), o.clock [h, m] (radians), o.cam (x offset for pans)
//                            returns { floor, piano: { keys, seat }, door: [x, y], window: [x0, y0, x1, y1] }
//   platform(t, o)           o.mood, o.rain, o.train (train options or false) -> { floor, door }
//   train(x, y, o)           side view cars: x = left, y = rail top; o.cars, o.lit, o.door [carIndex, 0..1 open]
//   trainInside(t, o)        a seat by the window; o.outside(x0, y0, x1, y1) paints the view; o.mood
//   hisRoom(t, o), herRoom(t, o)  the two homes (o.night, o.snow) -> anchors

// ---------- skies ----------
const SKY = {
  night: [C.K0, C.K1, C.K2], day: [C.SE1, C.U0, C.WH], spring: [C.U1, C.U0, C.Y1, C.Y2], sunset: [C.O5, C.O4, C.O3, C.O2, C.O1],
  dawn: [C.K2, C.K4, C.PK1, C.O1, C.Y1], rain: [C.G1, C.G2, C.G3], snowday: [C.G3, C.G4, C.G5], evening: [C.K2, C.O4, C.O2, C.O1],
};
function sky(mood = 'night', y0 = 0, y1 = PH) { rect(0, y0 - OY, PW, y1 - y0, vramp(SKY[mood] || SKY.night, y0, y1)); }
function stars(t, y1 = 120, n = 40, seed = 3) {
  const r = lcg(seed);
  for (let i = 0; i < n; i++) { const x = Math.floor(r() * PW), y = Math.floor(r() * y1), tw = (Math.sin(t * (1 + r() * 2) + i) + 1) / 2; pset(x - OX, y - OY, tw > .7 ? C.WH : C.K4); }
}
function moon(x, y, r = 8) { begin(); ellipse(x, y, r, r, C.Y1); end(null); ellipse(x - 2, y - 2, 2, 2, C.L1); }

// ---------- weather (screen space) ----------
function snow(t, o = {}) {
  const n = o.n ?? 90, wind = o.wind ?? .3, sp = o.speed ?? 18, col = o.col ?? C.WH, y1 = o.y1 ?? PH, big = o.big ?? .25;
  for (let i = 0; i < n; i++) {
    const r1 = hash(i, 1), r2 = hash(i, 2), r3 = hash(i, 3), s = sp * (.6 + r3 * .8);
    const y = ((r2 * (y1 + 20) + t * s) % (y1 + 20)) - 10, x = ((r1 * (PW + 60) + t * s * wind + Math.sin(t * 1.3 + i) * 3) % (PW + 60)) - 30;
    const xx = Math.round(x - OX), yy = Math.round(y - OY);
    pset(xx, yy, col); if (r3 < big) { pset(xx + 1, yy, col); pset(xx, yy + 1, col); pset(xx + 1, yy + 1, col); }
  }
}
function rain(t, o = {}) {
  const n = o.n ?? 120, wind = o.wind ?? .25, sp = o.speed ?? 320, col = o.col ?? C.G4, y1 = o.y1 ?? PH, len = o.len ?? 6;
  for (let i = 0; i < n; i++) {
    const r1 = hash(i, 11), r2 = hash(i, 12), s = sp * (.8 + hash(i, 13) * .4);
    const y = ((r2 * (y1 + 40) + t * s) % (y1 + 40)) - 20, x = ((r1 * (PW + 80) + t * s * wind) % (PW + 80)) - 40;
    line(Math.round(x - OX), Math.round(y - OY), Math.round(x - OX - wind * len), Math.round(y - OY - len), col);
    if (o.splash && y > y1 - 8) pset(Math.round(x - OX) - 1, y1 - 1 - OY, col);
  }
}
// rain trickles on a window (inside a rect)
function rainGlass(t, x0, y0, x1, y1, n = 24) {
  for (let i = 0; i < n; i++) {
    const x = Math.round(x0 + hash(i, 21) * (x1 - x0)), sp = 8 + hash(i, 22) * 24, len = 3 + Math.floor(hash(i, 23) * 6);
    const y = y0 + ((hash(i, 24) * (y1 - y0) + t * sp) % (y1 - y0));
    for (let k = 0; k < len; k++) { const yy = Math.round(y - k); if (yy > y0 && yy < y1) pset(x + (k > len / 2 ? (i % 2) : 0), yy, k === 0 ? C.WH : C.G4); }
  }
}

// ---------- sea, city ----------
function sea(y, t, mood = 'day') {
  const cs = mood === 'night' ? [C.K2, C.K1, C.K0] : mood === 'sunset' ? [C.O3, C.O4, C.O5] : mood === 'dawn' ? [C.PK1, C.K4, C.K3] : [C.SE1, C.SE2, C.SE3];
  rect(0 - OX, y, PW, PH - y + OY, vramp(cs, y + OY, PH));
  const r = lcg(77);
  for (let i = 0; i < 60; i++) {
    const sx = Math.floor(r() * PW), sy = y + 2 + Math.floor(Math.pow(r(), 1.6) * (PH - y)), on = Math.sin(t * 2.2 + i * 1.7) > .55;
    if (on) hline(sx - OX, sx - OX + 1 + (i % 3), sy, mood === 'night' ? C.K4 : mood === 'sunset' ? C.O1 : C.WH);
  }
}
function city(y, o = {}) {           // skyline sitting on y
  const r = lcg(o.seed ?? 5), col = o.col ?? C.K1, win = o.win ?? C.L1, lit = o.lit ?? .35;
  let x = -10;
  while (x < PW + 10) {
    const w = 10 + Math.floor(r() * 22), h = 14 + Math.floor(r() * (o.h ?? 46));
    rect(x - OX, y - h, w, h, col);
    for (let wy = y - h + 3; wy < y - 3; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (r() < lit) pset(wx - OX, wy, win);
    x += w + Math.floor(r() * 3);
  }
}

// ---------- the station hall ----------
function stationHall(t, o = {}) {
  const mood = o.mood || 'night', warm = o.warm ?? (mood === 'night' || mood === 'evening' ? 1 : 0), cam = Math.round(o.cam || 0);
  save(); shift(-cam, 0);
  const floor = 206, wall = mood === 'night' ? [C.A2, C.A3, C.A4] : mood === 'dawn' ? [C.A1, C.A2, C.A3] : [C.A0, C.A1, C.A2];
  // wall
  rect(-40, 0, PW + 80 + 200, floor, wall[0]);
  for (let y = 20; y < floor; y += 12) hline(-40, PW + 240, y, wall[1]);
  for (let y = 20; y < floor; y += 12) for (let x = ((y / 12) % 2) * 14 - 40; x < PW + 240; x += 28) vline(x, y - 11, y, wall[1]);
  rect(-40, 0, PW + 280, 14, wall[2]); hline(-40, PW + 240, 14, wall[1]);
  // the big arched window
  const wx0 = 150, wx1 = 330, wy0 = 34, wy1 = 176, mx = (wx0 + wx1) / 2, ar = (wx1 - wx0) / 2;
  const inWin = (x, y) => x >= wx0 && x < wx1 && y < wy1 && (y >= wy0 + ar * .55 || Math.hypot((x - mx) / ar, (y - (wy0 + ar * .55)) / (ar * .55)) < 1);
  const skyM = { night: 'night', spring: 'spring', dawn: 'dawn', evening: 'evening', summer: 'day' }[mood] || 'night';
  save(); for (let y = wy0 - 2; y < wy1; y++) for (let x = wx0; x < wx1; x++) if (inWin(x, y)) pset(x, y, vramp(SKY[skyM], wy0 + OY, wy1 + OY));
  // view through the window: city line (+ snow at night)
  for (let x = wx0; x < wx1; x += 1) { const h = 10 + Math.floor(hash(Math.floor((x + 300) / 9), 31) * 22); for (let y = wy1 - h; y < wy1; y++) if (inWin(x, y)) pset(x, y, mood === 'night' ? C.K1 : mood === 'spring' ? C.T2 : mood === 'dawn' ? C.K3 : C.A3); }
  if (mood === 'night') for (let i = 0; i < 40; i++) { const x = wx0 + Math.floor(hash(i, 41) * (wx1 - wx0)), y = wy0 + ((hash(i, 42) * (wy1 - wy0) + t * (10 + hash(i, 43) * 10)) % (wy1 - wy0)); if (inWin(x, y)) pset(x, Math.round(y), C.WH); }
  if (mood === 'spring') for (let i = 0; i < 26; i++) { const x = wx0 + Math.floor(hash(i, 44) * (wx1 - wx0)), y = wy0 + 40 + ((hash(i, 45) * 100 + t * 12) % 100); if (inWin(x, y)) { pset(x + Math.round(Math.sin(t + i) * 2), Math.round(y), C.PK2); } }
  restore();
  // mullions and frame
  for (let x = wx0; x <= wx1; x += 30) for (let y = wy0; y < wy1; y++) if (inWin(x, y) || inWin(x - 1, y)) pset(x, y, wall[2]);
  for (let y = wy0 + 40; y < wy1; y += 36) for (let x = wx0; x < wx1; x++) if (inWin(x, y)) pset(x, y, wall[2]);
  for (let a = 0; a <= 180; a += 1) { const ang = rad(a), x = mx - Math.cos(ang) * (ar + 1), y = wy0 + ar * .55 - Math.sin(ang) * (ar * .55 + 1); pset(Math.round(x), Math.round(y), C.OL); pset(Math.round(x), Math.round(y) - 1, wall[2]); }
  vline(wx0 - 1, wy0 + ar * .55, wy1, C.OL); vline(wx1, wy0 + ar * .55, wy1, C.OL); rect(wx0 - 4, wy1, wx1 - wx0 + 8, 4, wall[2]); hline(wx0 - 4, wx1 + 3, wy1, C.A0);
  // light shafts from the window (day / dawn)
  if (mood === 'spring' || mood === 'dawn' || mood === 'summer') poly([[wx0 + 10, wy1], [wx1 - 10, wy1], [wx1 + 60, floor + 50], [wx0 + 40, floor + 50]], thin(C.L1, .22));
  // pillars
  for (const px of [52, 410]) { rect(px, 14, 18, floor - 14, wall[1]); rect(px + 2, 14, 4, floor - 14, C.A0); rect(px - 3, 14, 24, 6, wall[2]); rect(px - 3, floor - 8, 24, 8, wall[2]); }
  // clock on the right pillar
  const [ch, cm] = o.clock || [rad(300), rad(60)];
  clock(419, 52, 12, { h: ch, m: cm });
  // the doorway to the platforms (far right) and the departure board
  rect(440, 70, 60, floor - 70, mood === 'night' ? C.K1 : C.G3); rect(442, 72, 56, 6, C.OL2);
  rect(352, 30, 46, 22, C.BK); for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) if (hash(r * 9 + c, Math.floor(t * 1.5) % 4 === 0 && r === 1 ? 77 : 7) < .7) rect(355 + c * 5, 33 + r * 5, 3, 3, r === 0 ? C.NY : C.L2);
  // floor
  rect(-40, floor, PW + 280, PH - floor, mood === 'night' ? C.A3 : C.A2);
  for (let y = floor + 6, k = 0; y < PH; y += 6 + k * 2, k++) hline(-40, PW + 240, y, mood === 'night' ? C.A4 : C.A3);
  for (let i = -16; i < 30; i++) line(240 + i * 20, floor, 240 + i * 46, PH, mood === 'night' ? C.A4 : C.A3);
  hline(-40, PW + 240, floor, C.A4);
  // lamps
  const lamps = [110, 200, 290, 380];
  for (const lx of lamps) {
    vline(lx, 0, 40, C.OL);
    begin(); poly([[lx - 6, 46], [lx + 6, 46], [lx + 3, 40], [lx - 3, 40]], C.P1); end(C.OL);
    if (warm > 0) { ellipse(lx, 50, 22, 14, thin(C.L1, .25 * warm)); ellipse(lx, 48, 3, 2, warm > .5 ? C.WH : C.L1); }
    else ellipse(lx, 48, 3, 2, C.W3);
  }
  // benches on the right
  for (const bx of [300, 352]) { begin(); rect(bx, floor - 14, 40, 3, C.P2); rect(bx, floor - 22, 40, 3, C.P2); rect(bx + 2, floor - 11, 2, 11, C.OL2); rect(bx + 36, floor - 11, 2, 11, C.OL2); end(C.OL); }
  // the piano
  let pa = null;
  if (o.piano !== false) { pa = piano(84, floor, { dir: 1, sheet: o.sheet, lid: o.lid, cloth: o.cloth, fade: o.noteFade }); bench(pa.seat[0] - 8 - OX, floor, 16); }
  restore();
  if (warm > .2) POST.grade = [...(POST.grade || []), ['warm', .12 * warm]];
  return { floor, piano: pa, door: [470 - cam, floor], window: [wx0 - cam, wy0, wx1 - cam, wy1], lamps: lamps.map(x => x - cam) };
}

// ---------- platform ----------
function platform(t, o = {}) {
  const mood = o.mood || 'night', floor = 214, cam = Math.round(o.cam || 0);
  sky(mood === 'rain' ? 'rain' : mood, 0, 200);
  if (mood === 'night' || mood === 'rain') city(176, { col: mood === 'rain' ? C.G1 : C.K1, win: C.L2, lit: .25, h: 40, seed: 9 });
  if (mood === 'night') stars(t, 90, 30);
  // tracks bed
  rect(0, 176, PW, floor - 176, C.G1); for (let x = -cam % 12; x < PW; x += 12) rect(x, 186, 8, 2, C.OL2);
  hline(0, PW, 184, C.G3); hline(0, PW, 196, C.G3);
  let tr = null;
  if (o.train) tr = train(o.train.x ?? 20, 200, { ...o.train, cam });
  save(); shift(-cam, 0);
  // canopy
  rect(-40, 0, PW + 400, 18, C.G2); hline(-40, PW + 400, 18, C.OL); for (let x = -40; x < PW + 400; x += 16) vline(x, 0, 17, C.G1);
  for (let x = 30; x < PW + 400; x += 120) { rect(x, 18, 6, floor - 18, C.G2); rect(x + 1, 18, 2, floor - 18, C.G3); rect(x - 4, floor - 4, 14, 4, C.G1); }
  for (let x = 90; x < PW + 400; x += 120) { vline(x, 18, 30, C.OL); rect(x - 5, 30, 11, 3, C.G1); ellipse(x, 34, 12, 6, thin(C.L1, .35)); hline(x - 3, x + 3, 33, C.L1); }
  restore();
  // the platform itself
  rect(0, floor, PW, PH - floor, mood === 'rain' ? C.G2 : C.G3);
  hline(0, PW, floor, C.OL); rect(0, floor + 2, PW, 3, C.NY); for (let x = -cam % 6; x < PW; x += 6) pset(x, floor + 3, C.M2);
  for (let y = floor + 10; y < PH; y += 9) hline(0, PW, y, mood === 'rain' ? C.G1 : C.G2);
  if (mood === 'rain') for (let i = 0; i < 18; i++) { const x = Math.floor(hash(i, 51) * PW), y = floor + 8 + Math.floor(hash(i, 52) * 50); hline(x, x + 6 + (i % 4), y, C.G4); }   // puddles shine
  return { floor, train: tr };
}
// side-view train: x = left of the first car (buffer), y = rail top. o.cars (2), o.lit (windows lit), o.door [car, k] open
// amount, o.seats (fn(x, y, carIndex) for passengers in windows)
function train(x, y, o = {}) {
  x = Math.round(x - (o.cam || 0)); const cars = o.cars ?? 2, L = 170, H = 66, top = y - H;
  for (let c = 0; c < cars; c++) {
    const cx = x + c * (L + 4);
    begin();
    rect(cx, top + 4, L, H - 8, C.CR1); rect(cx + 2, top, L - 4, 6, C.CR1); hline(cx + 2, cx + L - 3, top, C.WH);
    rect(cx, y - 18, L, 4, C.RD); rect(cx, y - 14, L, 2, C.RD2);
    rect(cx, y - 8, L, 8, C.G2);
    // windows
    for (let k = 0; k < 4; k++) {
      const wx = cx + 12 + k * 40 + (k > 1 ? 14 : 0);
      rect(wx, top + 12, 26, 22, o.lit ? C.L1 : C.K3);
      if (o.lit) rect(wx, top + 12, 26, 3, C.L2);
      if (o.seats) { save(); clip(wx + OX, top + 12 + OY, 26, 22); o.seats(wx, top + 12, c, k); restore(); }
    }
    // door in the middle
    const dx = cx + L / 2 - 8, open = o.door && o.door[0] === c ? clamp(o.door[1]) : 0;
    rect(dx, top + 8, 16, H - 16, open > 0 ? C.L1 : C.CR2);
    if (open > 0) { rect(dx - Math.round(open * 8), top + 8, 8, H - 16, C.CR2); rect(dx + 8 + Math.round(open * 8), top + 8, 8, H - 16, C.CR2); rect(dx - Math.round(open * 8) + 2, top + 12, 4, 14, C.K3); rect(dx + 10 + Math.round(open * 8), top + 12, 4, 14, C.K3); }
    else { vline(dx + 8, top + 8, y - 9, C.OL2); rect(dx + 2, top + 12, 4, 14, o.lit ? C.L1 : C.K3); rect(dx + 10, top + 12, 4, 14, o.lit ? C.L1 : C.K3); }
    end(C.OL);
  }
  return { doorX: x + L / 2 + (o.door ? o.door[0] * (L + 4) : 0), top };
}
// inside a carriage by the window: the window takes the left 2/3; o.outside(x0, y0, x1, y1) paints the view
function trainInside(t, o = {}) {
  const mood = o.mood || 'night', wall = mood === 'night' ? [C.G2, C.G1] : [C.G4, C.G3];
  rect(0, 0, PW, PH, wall[0]);
  const wx0 = 40, wy0 = 40, wx1 = 360, wy1 = 170;
  save(); clip(wx0, wy0, wx1 - wx0, wy1 - wy0); if (o.outside) o.outside(wx0, wy0, wx1, wy1); restore();
  begin(); rect(wx0 - 6, wy0 - 6, wx1 - wx0 + 12, 6, wall[1]); rect(wx0 - 6, wy1, wx1 - wx0 + 12, 8, wall[1]); rect(wx0 - 6, wy0, 6, wy1 - wy0, wall[1]); rect(wx1, wy0, 6, wy1 - wy0, wall[1]); end(C.OL);
  vline(200, wy0, wy1 - 1, wall[1]);
  rect(wx0 - 6, wy1 + 8, wx1 - wx0 + 12, 4, C.G3);                  // sill
  // luggage rack
  rect(0, 18, PW, 3, C.G3); for (let x = 0; x < PW; x += 6) vline(x, 21, 26, C.G3); hline(0, PW, 26, C.G3);
  // seats (blue moquette)
  begin(); rect(370, 60, 70, 150, C.K3); rect(370, 60, 70, 8, C.K4); rect(375, 150, 105, 30, C.K3); end(C.OL);
  begin(); rect(0, 180, PW, 90, C.K2); for (let x = 0; x < PW; x += 8) vline(x, 182, 268, C.K1); end(C.OL);
  if (mood === 'night') POST.grade = [...(POST.grade || []), ['night', .15]];
}

// ---------- homes ----------
// his place: warm, wooden floor, upright piano on the left (side view, player on the right), window centre, small table
function hisRoom(t, o = {}) {
  const floor = 210, night = o.night ?? false;
  rect(0, 0, PW, floor, night ? C.A2 : C.Y1);
  for (let x = 0; x < PW; x += 24) vline(x, 0, floor, night ? C.A3 : C.A0);           // wallpaper stripes
  rect(0, floor - 14, PW, 14, night ? C.A3 : C.A1); hline(0, PW, floor - 14, C.OL2);    // wainscot
  // window
  const wx = 200, wy = 40, ww = 110, wh = 90;
  begin(); rect(wx - 4, wy - 4, ww + 8, wh + 8, C.P2); end(C.OL);
  rect(wx, wy, ww, wh, vramp(night ? SKY.night : o.rain ? SKY.rain : SKY.spring, wy + OY, wy + wh + OY));
  save(); clip(wx + OX, wy + OY, ww, wh);
  if (night) { stars(t, wy + wh, 20, 8); city(wy + wh, { col: C.K1, lit: .3, h: 30, seed: 4 }); }
  else city(wy + wh, { col: C.T2, win: C.Y1, lit: .1, h: 26, seed: 4 });
  if (o.rain) rainGlass(t, wx, wy, wx + ww, wy + wh, 18);
  restore();
  vline(wx + ww / 2, wy, wy + wh - 1, C.P2); hline(wx, wx + ww - 1, wy + wh / 2, C.P2);
  rect(wx - 8, wy + wh + 4, ww + 16, 4, C.P2);
  // curtains
  begin(); rect(wx - 18, wy - 8, 14, wh + 22, C.U2); rect(wx + ww + 4, wy - 8, 14, wh + 22, C.U2); end(C.OL);
  for (let y = wy - 6; y < wy + wh + 12; y += 2) { pset(wx - 12, y, C.U3); pset(wx + ww + 10, y, C.U3); }
  // floor
  rect(0, floor, PW, PH - floor, night ? C.P1 : C.P2); for (let y = floor + 7; y < PH; y += 7) hline(0, PW, y, night ? C.P0 : C.P1);
  for (let y = floor; y < PH; y += 7) for (let x = (y * 3) % 40; x < PW; x += 40) vline(x, y, y + 6, night ? C.P0 : C.P1);
  // lamp
  begin(); rect(388, floor - 70, 2, 70, C.OL2); poly([[378, floor - 70], [400, floor - 70], [395, floor - 84], [383, floor - 84]], C.NY); end(C.OL);
  if (night || o.lamp) ellipse(389, floor - 60, 30, 24, thin(C.L1, .25));
  // shelf with books
  begin(); rect(330, 60, 40, 4, C.P1); end(C.OL); for (let i = 0; i < 6; i++) { begin(); rect(332 + i * 6, 46 + (i % 2) * 2, 5, 14 - (i % 2) * 2, [C.RD, C.U2, C.M1, C.T2, C.NP, C.CF1][i]); end(C.OL); }
  const pa = o.piano === false ? null : piano(40, floor, { dir: 1, notes: false, sheet: o.sheet ?? .8 });
  if (pa) bench(pa.seat[0] - 8 - OX, floor, 16);
  if (night) POST.grade = [...(POST.grade || []), ['warm', .1]];
  return { floor, piano: pa, window: [wx, wy, wx + ww, wy + wh] };
}
// her new place in another city: cold, half-unpacked; desk under the window on the right, bed on the left
function herRoom(t, o = {}) {
  const floor = 212, night = o.night ?? true;
  rect(0, 0, PW, floor, night ? C.G2 : C.G4);
  for (let y = 0; y < floor; y += 3) if (y % 6 === 0) hline(0, PW, y, thin(night ? C.G1 : C.G3, .3));
  // window with snowy city
  const wx = 250, wy = 34, ww = 150, wh = 100;
  begin(); rect(wx - 3, wy - 3, ww + 6, wh + 6, C.G5); end(C.OL);
  rect(wx, wy, ww, wh, vramp(night ? SKY.night : SKY.snowday, wy + OY, wy + wh + OY));
  save(); clip(wx + OX, wy + OY, ww, wh); city(wy + wh, { col: night ? C.K2 : C.G3, lit: night ? .3 : .05, h: 50, seed: 12 }); if (o.snow !== false) snow(t, { n: 50, wind: .4, y1: wy + wh + OY }); restore();
  vline(wx + ww / 2, wy, wy + wh - 1, C.G5); rect(wx - 6, wy + wh + 3, ww + 12, 3, C.G5);
  // floor
  rect(0, floor, PW, PH - floor, night ? C.G1 : C.G3); for (let y = floor + 8; y < PH; y += 8) hline(0, PW, y, night ? C.BK : C.G2);
  // bed on the left
  begin(); rect(10, floor - 30, 150, 22, C.W2); rect(10, floor - 34, 150, 6, C.G5); rect(10, floor - 8, 150, 8, C.G2); rect(10, floor - 46, 8, 46, C.G2); end(C.OL);
  begin(); rect(22, floor - 40, 30, 8, C.WH); end(C.OL);
  // boxes
  for (const [bx, bw, bh] of [[178, 34, 26], [196, 26, 20]]) { begin(); rect(bx, floor - bh - (bx > 190 ? 26 : 0), bw, bh, C.A1); hline(bx, bx + bw - 1, floor - bh - (bx > 190 ? 26 : 0) + 4, C.A2); end(C.OL); }
  // desk (low, seated height) + lamp
  const dy = floor - 24;
  begin(); rect(244, dy, 176, 4, C.P3); hline(244, 419, dy, C.A1); rect(248, dy + 4, 4, floor - dy - 4, C.P2); rect(412, dy + 4, 4, floor - dy - 4, C.P2); rect(360, dy + 4, 52, 8, C.P2); hline(380, 392, dy + 8, C.P1); end(C.OL);
  begin(); rect(398, dy - 18, 2, 18, C.OL2); poly([[390, dy - 18], [408, dy - 18], [402, dy - 28], [396, dy - 28]], C.G5); end(C.OL);
  if (o.lamp ?? night) { ellipse(386, dy - 4, 46, 18, thin(C.L1, .3)); hline(395, 402, dy - 18, C.L1); }
  if (o.wall) o.wall();                                                    // the sheet pinned on the wall etc.
  if (night) POST.grade = [...(POST.grade || []), ['cold', .25]];
  return { floor, desk: [244, floor - 24, 420], window: [wx, wy, wx + ww, wy + wh], bed: [10, floor - 30, 160] };
}
