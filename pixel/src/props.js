// props.js: the shared things. Every function draws at buffer coordinates (after OX / OY) and outlines itself.
//
//   piano(x, y, o)          the station's upright, side view: x = left of the side panel, y = floor. o.dir = side the
//                           player sits on (1 = right), o.notes (sticky notes, default true), o.sheet (0..1 sheet on the
//                           stand), o.lid (0 closed .. 1 open), o.cloth (dust cloth over it). Returns { keys: [x, y], seat: [x, y] }
//   bench(x, y, w)          piano stool / bench (x = left, y = floor)
//   keyboard(x, y, w, h, o) close-up of keys from the front-top: o.lit = Set of white-key indices pressed, o.glow
//   bigHand(x, y, o)        close-up hand from above (fingers pointing up the screen), o.flip, o.sleeve [c1, c2], o.press,
//                           o.s size factor (drawn at full resolution, not pixel-doubled)
//   songSheet(x, y, w, h, o) THE SONG: o.fill 0..1 (how much is written), o.cursor 0..1 (play position) or null,
//                           o.doodles 0..1, o.blank (show the empty bars at the end) ... the written part ends at SONG_END
//   stickyNote(x, y, col, o), phone(x, y, o), ticket(x, y, o), umbrella(hx, hy, o), suitcase(x, y, o), cup(x, y, o),
//   clock(x, y, r, o), heart(x, y, s, col), noteIcon(x, y, col, o), sparkle(x, y, k, col), bulb(x, y, k), paperBall(x, y),
//   breath(x, y, t0, t), npc(x, y, seed, o)

// ---------- sticky notes ----------
function stickyNote(x, y, col, o = {}) {
  x = Math.round(x); y = Math.round(y); const s = o.s || 1, w = 6 * s, h = 6 * s;
  begin();
  rect(x, y, w, h, col);
  hline(x, x + w - 1, y, o.top ?? col);
  pset(x + w - 1, y + h - 1, C.W2);
  if (o.mark === 'heart') heart(x + w / 2 - 2, y + 1 * s, s, C.RD);
  else if (o.mark !== false) for (let j = 0; j < Math.min(3, h / 2 - 1); j++) hline(x + 1, x + w - 2 - ((j * 3 + Math.round(x)) % 3), y + 2 + j * 2 * s / s, C.OL2);
  end(o.ol ?? C.OL, o.alpha ?? 1);
}
// tiny heart (s = 1: 5x4)
function heart(x, y, s = 1, col = C.RD) {
  const rows = ['.x.x.', 'xxxxx', '.xxx.', '..x..'];
  rows.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === 'x') rect(x + i * s, y + j * s, s, s, col); });
}

// ---------- the piano ----------
const PIANO = { w: 20, h: 42, keyY: 24 };
function piano(x, y, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const dir = o.dir ?? 1, w = PIANO.w, h = PIANO.h, ky = y - PIANO.keyY;
  const front = dir > 0 ? x + w : x;                                   // the keyboard side
  begin();
  // side panel
  rect(x, y - h, w, h, C.P2);
  rect(x, y - h, w, 3, C.P1); hline(x, x + w - 1, y - h, C.P3);
  rect(x + 2, y - h + 6, w - 4, h - 12, C.P1); rect(x + 3, y - h + 7, w - 6, h - 14, C.P2);   // inset panel
  rect(x, y - 4, w, 4, C.P1);
  // the leg / toe block under the keys and the keyboard shelf
  const sx = dir > 0 ? front : front - 6;
  rect(sx, ky, 6, 4, C.P1); hline(sx, sx + 5, ky, C.P3);
  rect(dir > 0 ? sx : sx, ky + 1, 6, 1, C.WH);                         // key edge
  rect(dir > 0 ? front : front - 3, ky + 4, 3, PIANO.keyY - 6, C.P1);  // front leg
  rect(dir > 0 ? front : front - 4, y - 2, 4, 2, C.P0);
  // the lid over the keys
  const lid = o.lid ?? 1;
  if (lid < .5) rect(sx, ky - 2, 6, 2, C.P1);
  // music stand + sheet
  const stx = dir > 0 ? front : front - 2;
  rect(stx, ky - 12, 2, 10, C.P1);
  if (o.sheet) { const sh = Math.round(9 * clamp(o.sheet)); rect(dir > 0 ? front + 1 : front - 3, ky - 3 - sh, 2, sh, C.PA1); pset(dir > 0 ? front + 2 : front - 3, ky - 4 - Math.floor(sh / 2), C.OL2); }
  // pedals
  pset(dir > 0 ? front - 1 : front, y - 1, C.L2);
  end(C.OL);
  // sticky notes on the side panel (one of them is her heart)
  if (o.notes !== false) {
    const N = [[3, 9, C.NY], [11, 8, C.NP, 'heart'], [5, 17, C.NM], [12, 19, C.NB], [4, 27, C.NP], [11, 29, C.NY], [7, 35, C.NM]];
    N.slice(0, o.nNotes ?? N.length).forEach(([dx, dy, c, m], i) => {
      const f = o.fade && i !== 1 ? o.fade : 0;
      stickyNote(x + dx, y - h + dy - 2, c, { mark: m || (i % 2 ? false : undefined), alpha: 1 - f, ol: C.P0 });
    });
  }
  if (o.cloth) { begin(); poly([[x - 2, y - h - 2], [x + w + 8, y - h - 2], [x + w + 10, y - 6], [x - 3, y - 6]], C.W2); end(C.OL, o.cloth); }
  return { keys: [front + dir * 3 + OX, ky + OY], seat: [front + dir * 16 + OX, y + OY], top: [x + w / 2 + OX, y - h + OY] };
}
function bench(x, y, w = 16, o = {}) {
  begin(); rect(x, y - 15, w, 3, o.col ?? C.P1); hline(x, x + w - 1, y - 15, C.P3); rect(x + 1, y - 12, 2, 12, C.P0); rect(x + w - 3, y - 12, 2, 12, C.P0); end(C.OL);
}

// ---------- keyboard close-up (front-top view) ----------
// white keys are kw px wide; o.lit = array/Set of white-key indices currently pressed, o.dark (night tint)
function keyboard(x, y, w, h, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const kw = o.kw || 12, n = Math.ceil(w / kw), lit = new Set(o.lit || []);
  begin();
  rect(x, y - 6, w, 6, C.P1); hline(x, x + w - 1, y - 6, C.P3);           // fallboard
  for (let i = 0; i < n; i++) {
    const kx = x + i * kw, on = lit.has(i);
    rect(kx, y, kw - 1, h, on ? C.L1 : C.WH);
    rect(kx, y + h - 3, kw - 1, 3, on ? C.L2 : C.W2);
    vline(kx + kw - 1, y, y + h - 1, C.W3);
    if (on && o.glow) for (let j = 0; j < 3; j++) pset(kx + 2 + j * 3, y - 8 - ((Math.floor(T * 8) + i + j) % 4), C.L1);
  }
  for (let i = 0; i < n; i++) { const m = i % 7; if (m === 2 || m === 6) continue; const bx = x + i * kw + kw - Math.floor(kw * .3); rect(bx, y, Math.floor(kw * .6), Math.floor(h * .6), C.BK); hline(bx + 1, bx + Math.floor(kw * .6) - 2, y + Math.floor(h * .6) - 2, C.G1); }
  end(C.OL);
}
// big hand from above, wrist at the bottom (x, y = wrist centre); fingers point up. o.flip mirrors (left hand).
function bigHand(x, y, o = {}) {
  x = Math.round(x); y = Math.round(y); const f = o.flip ? -1 : 1, sl = o.sleeve || [C.M1, C.M2], pr = o.press || [], s = o.s || 1;
  const sk = [C.S0, C.S1, C.S2], R = v => Math.round(v * s);
  begin();
  rect(x - R(9), y, R(18), R(14), sl[0]); rect(x - R(9), y, R(18), Math.max(2, R(3)), sl[1]);       // sleeve cuff
  ellipse(x, y - R(8), 10 * s, 9 * s, sk[1]);                                                        // back of the hand
  const fingers = [[-7, 9], [-3, 13], [1, 14], [5, 12]];
  fingers.forEach(([dx, len], i) => {
    const px = x + R(dx) * f, down = pr.includes(i) ? R(3) : 0, fw = R(4), L = R(len);
    const lx = px - R(1) - (f < 0 ? fw - R(2) : 0);
    rect(lx, y - R(12) - L + down, fw, L, sk[1]);
    hline(lx, lx + fw - 1, y - R(12) - L + down, sk[0]);
    rect(lx + 1, y - R(12) - L + down + 1, Math.max(1, fw - 2), Math.max(1, R(1.5)), C.W2);         // nail
    if (s > 1.5) vline(lx + fw - 1, y - R(12) - L + down + 2, y - R(12) + down, sk[2]);              // finger shade
  });
  tline(x - R(9) * f, y - R(4), x - R(14) * f, y - R(12), R(4), sk[1]);                              // thumb
  line(x - R(4) * f, y - R(2), x + R(6) * f, y - R(4), sk[2]);                                       // knuckle shade
  end(C.OL);
}

// ---------- the song sheet ----------
// 4 staves, 4 bars each. The melody is fixed; SONG_END = how far it got written before they stopped (third staff, bar 2).
const SONG = (() => { const r = lcg(42), out = []; for (let s = 0; s < 4; s++) for (let b = 0; b < 4; b++) for (let k = 0; k < 3; k++) out.push({ s, b, k, p: Math.floor(r() * 9) - 1, half: r() < .2 }); return out; })();
const SONG_END = 30 / SONG.length;                                           // 30 of 48 notes were written
function songSheet(x, y, w, h, o = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const fill = o.fill ?? SONG_END, big = w >= 120;
  begin();
  rect(x, y, w, h, C.PA1);
  hline(x, x + w - 1, y + h - 1, C.PA2); vline(x + w - 1, y, y + h - 1, C.PA2);
  if (o.crease) { vline(x + Math.floor(w / 2), y, y + h - 1, C.PA2); hline(x, x + w - 1, y + Math.floor(h / 2), C.PA2); }
  end(o.ol ?? C.OL);
  const m = Math.max(2, Math.round(w * .07)), top = y + Math.round(h * .14), sg = (h - (top - y) - m) / 4;
  const ls = big ? Math.max(2, Math.floor(sg / 7)) : 1;                     // staff line spacing
  for (let s = 0; s < 4; s++) {
    const sy = Math.round(top + s * sg);
    if (big) for (let l = 0; l < 5; l++) hline(x + m, x + w - m - 1, sy + l * ls, C.PA3);
    else hline(x + m, x + w - m - 1, sy + 1, C.PA3);
    if (big) for (let b = 0; b <= 4; b++) vline(Math.round(x + m + b * (w - 2 * m - 1) / 4), sy, sy + 4 * ls, C.PA3);
  }
  // notes
  const n = Math.floor(fill * SONG.length + 1e-6), cur = o.cursor;
  for (let i = 0; i < n; i++) {
    const q = SONG[i], sy = Math.round(top + q.s * sg), bw = (w - 2 * m) / 4;
    const nx = Math.round(x + m + q.b * bw + bw * (.25 + q.k * .28)), ny = Math.round(sy + 2 * ls - q.p * ls / 2);
    const lit = cur != null && Math.abs(cur * SONG.length - i - .5) < .8;
    const col = lit ? C.L3 : C.OL;
    if (big) {
      rect(nx, ny, ls + 1, ls, col); if (q.half) rect(nx + 1, ny, ls - 1, ls - 1 > 0 ? 1 : 0, C.PA1);
      vline(nx + ls, ny - 3 * ls, ny, col);
      if (lit) { pset(nx - 1, ny - 1, C.L2); pset(nx + ls + 2, ny - 2, C.L2); }
    } else { pset(nx, ny, col); if (w >= 50) { pset(nx + 1, ny, col); pset(nx + 1, ny - 1, col); pset(nx + 1, ny - 2, col); } }
  }
  // the play cursor
  if (cur != null && big) {
    const i = clamp(cur * SONG.length, 0, SONG.length - .01), q = SONG[Math.floor(i)], sy = Math.round(top + q.s * sg), bw = (w - 2 * m) / 4;
    const cx = Math.round(x + m + q.b * bw + bw * (.25 + q.k * .28) + (i % 1) * bw * .28);
    vline(cx - 2, sy - 3, sy + 4 * ls + 3, thin(C.L2, .6)); vline(cx - 1, sy - 4, sy + 4 * ls + 4, C.L2);
  }
  // doodles: her heart, a cat face, a star in the margins
  const d = o.doodles ?? 1;
  if (d > 0 && big) {
    if (d > .05) heart(x + w - m - 8, y + 3, 1, C.RD);
    if (d > .4) { const cx = x + 4, cy = y + h - 9; hline(cx, cx + 5, cy + 3, C.OL2); pset(cx, cy + 1, C.OL2); pset(cx + 5, cy + 1, C.OL2); pset(cx + 1, cy, C.OL2); pset(cx + 4, cy, C.OL2); vline(cx, cy + 1, cy + 3, C.OL2); vline(cx + 5, cy + 1, cy + 3, C.OL2); pset(cx + 2, cy + 2, C.OL2); pset(cx + 3, cy + 2, C.OL2); }
    if (d > .75) { const sx = x + Math.round(w * .45), sy = y + 3; pset(sx, sy, C.M2); pset(sx - 1, sy + 1, C.M2); pset(sx + 1, sy + 1, C.M2); pset(sx, sy + 1, C.NY); pset(sx, sy + 2, C.M2); }
  }
  // title line (squiggle, no letters) top-left
  if (big && fill > 0) for (let i = 0; i < Math.min(26, w * .3); i++) pset(x + m + i, y + 4 + Math.round(Math.sin(i * 1.3) * .8), C.OL2);
  return { top, sg, m, ls };
}

// ---------- phone ----------
// phone(x, y, o): o.big = close-up (60x104) else in-hand size (5x8). o.screen = fn(sx, sy, sw, sh) draws the screen
// content; o.on (default 1, 0 = dark screen), o.face 'down' (back side up, with a vibrating buzz when o.buzz)
function phone(x, y, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const big = o.big, w = big ? 60 : 5, h = big ? 104 : 8;
  begin();
  rect(x, y, w, h, o.face === 'down' ? C.G2 : C.BK);
  if (o.face === 'down') { if (big) { rect(x + 6, y + 6, 10, 10, C.G1); ellipse(x + 11, y + 11, 3, 3, C.BK); } }
  else {
    const on = o.on ?? 1, sx = x + (big ? 4 : 1), sy = y + (big ? 8 : 1), sw = w - (big ? 8 : 2), sh = h - (big ? 16 : 2);
    rect(sx, sy, sw, sh, on > .5 ? C.SC1 : C.G1);
    if (on > .5 && o.screen) { save(); clip(sx + OX, sy + OY, sw, sh); o.screen(sx, sy, sw, sh); restore(); }
    if (big) { rect(x + w / 2 - 6, y + 3, 12, 2, C.G1); }
  }
  end(C.OL);
  if (o.buzz) for (const s of [-1, 1]) { const k = Math.floor(T * 14) % 2; vline(s < 0 ? x - 2 - k : x + w + 1 + k, y + 1, y + 3, C.W2); vline(s < 0 ? x - 4 - k : x + w + 3 + k, y + 2, y + 2, C.W2); }
}
// screen icons (no text anywhere): envelope, ticket, smiley bubble, avatar (glasses boy), call button, typing lines
function iconEnvelope(x, y, s = 2) { begin(); rect(x, y, 10 * s, 7 * s, C.WH); line(x, y, x + 5 * s, y + 4 * s, C.OL2); line(x + 10 * s - 1, y, x + 5 * s, y + 4 * s, C.OL2); end(C.OL); }
function iconTicket(x, y, s = 2) { begin(); rect(x, y, 12 * s, 6 * s, C.CR1); rect(x, y, 12 * s, 2 * s, C.RD); vline(x + 8 * s, y + 2 * s, y + 6 * s - 1, thin(C.OL2, .6)); hline(x + 2 * s, x + 6 * s, y + 4 * s, C.OL2); end(C.OL); }
function iconSmiley(x, y, s = 2) { begin(); ellipse(x + 4 * s, y + 4 * s, 4 * s, 4 * s, C.NY); end(C.OL); pset(x + 3 * s - 1, y + 3 * s, C.OL); pset(x + 5 * s, y + 3 * s, C.OL); hline(x + 3 * s - 1, x + 5 * s, y + 5 * s + 1, C.OL); pset(x + 2 * s, y + 5 * s, C.OL); pset(x + 6 * s - 1, y + 5 * s, C.OL); }
function iconAvatar(x, y, s = 3) {   // a round avatar of him: black hair, round glasses
  begin(); ellipse(x, y, 7 * s / 2 + 2, 7 * s / 2 + 2, C.U1); end(C.OL);
  ellipse(x, y + s, 3 * s / 2 + 1, 3 * s / 2 + 2, C.S1); ellipse(x, y - s, 3 * s / 2 + 2, 2 * s / 2 + 1, C.H1);
  ring(x - s, y + s, Math.max(1, s * .55), C.OL); ring(x + s, y + s, Math.max(1, s * .55), C.OL);
}
function iconCall(x, y, r = 6, col = C.T2) { begin(); ellipse(x, y, r, r, col); end(C.OL); line(x - 2, y + 2, x + 2, y - 2, C.WH); pset(x - 3, y + 2, C.WH); pset(x + 2, y - 3, C.WH); }
function typingLines(x, y, w, n, k = 1) { for (let i = 0; i < n; i++) { const lw = Math.round((i === n - 1 ? .6 : 1) * w * clamp(k * n - i)); if (lw > 0) hline(x, x + lw - 1, y + i * 4, C.G2); } }

// ---------- small things ----------
function ticket(x, y, o = {}) {
  x = Math.round(x); y = Math.round(y); const s = o.s || 1;
  if (o.folded) { begin(); rect(x, y, 6 * s, 4 * s, C.CR1); rect(x, y, 6 * s, s, C.RD); end(C.OL); return; }
  begin(); rect(x, y, 12 * s, 6 * s, C.CR1); rect(x, y, 12 * s, 2 * s, C.RD); vline(x + 8 * s, y + 2 * s, y + 6 * s - 1, C.OL2); hline(x + 2 * s, x + 6 * s, y + 4 * s, C.OL2); end(C.OL);
}
// umbrella held at hand (hx, hy): canopy centre above the hand, o.tilt (deg, + = toward +x), o.col [c1, c2], o.r (radius)
function umbrella(hx, hy, o = {}) {
  const r = o.r || 18, tl = rad(o.tilt || 0), L = o.len || 20, cx = hx + Math.sin(tl) * L, cy = hy - Math.cos(tl) * L, [c1, c2] = o.col || [C.U2, C.U3];
  begin();
  for (let a = -90; a <= 90; a += 2) {
    const ang = rad(a) + tl, px = cx + Math.sin(ang) * r, py = cy - Math.cos(ang) * r * .55;
    line(cx, cy, px, py, Math.floor((a + 90) / 30) % 2 ? c1 : c2);
  }
  for (let a = -90; a <= 90; a += 30) { const ang = rad(a) + tl; pset(cx + Math.sin(ang) * r, cy - Math.cos(ang) * r * .55 + 1, c2); }
  end(C.OL);
  line(hx, hy, cx, cy, C.OL); pset(cx + Math.sin(tl) * -1, cy - 1 - r * .55, C.OL);
  return [cx, cy];
}
function suitcase(x, y, o = {}) {        // x = left, y = floor; o.col
  x = Math.round(x); y = Math.round(y); const w = o.w || 12, h = o.h || 16, c = o.col || [C.RD, C.RD2];
  begin(); rect(x, y - h - 2, w, h, c[0]); rect(x, y - h - 2, w, 2, c[1]); vline(x + 3, y - h, y - 3, c[1]); vline(x + w - 4, y - h, y - 3, c[1]);
  rect(x + 1, y - 2, 2, 2, C.G1); rect(x + w - 3, y - 2, 2, 2, C.G1);
  if (o.handle) { vline(x + 2, y - h - 2 - o.handle, y - h - 2, C.G2); vline(x + w - 3, y - h - 2 - o.handle, y - h - 2, C.G2); hline(x + 2, x + w - 3, y - h - 2 - o.handle, C.G2); }
  end(C.OL);
}
function cup(x, y, o = {}) {             // x = centre, y = bottom; o.steam 0..1, o.col
  x = Math.round(x); y = Math.round(y); const c = o.col || [C.WH, C.W2];
  begin(); rect(x - 3, y - 7, 7, 7, c[0]); rect(x - 3, y - 2, 7, 2, c[1]); rect(x + 4, y - 6, 2, 1, c[0]); rect(x + 5, y - 6, 1, 4, c[0]); rect(x + 4, y - 3, 2, 1, c[0]); hline(x - 2, x + 2, y - 7, C.CF2); end(C.OL);
  const s = o.steam ?? 1;
  if (s > 0) for (let i = 0; i < 3; i++) { const k = (T * 1.2 + i / 3) % 1; if (bayer(i, Math.floor(T * 10)) < s) pset(x - 1 + i + Math.round(Math.sin(k * 6 + i) * 1.5), y - 9 - Math.round(k * 7), C.W2); }
}
function clock(x, y, r, o = {}) {        // wall clock; o.h hour hand angle (rad), o.m minute hand angle
  begin(); ellipse(x, y, r, r, C.WH); end(C.OL);
  ring(x, y, r - 1, C.OL2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; pset(Math.round(x + Math.sin(a) * (r - 3)), Math.round(y - Math.cos(a) * (r - 3)), C.OL); }
  const m = o.m ?? 0, hh = o.h ?? 0;
  line(x, y, x + Math.sin(m) * (r - 3), y - Math.cos(m) * (r - 3), C.OL);
  line(x, y, x + Math.sin(hh) * (r - 5), y - Math.cos(hh) * (r - 5), C.RD2);
  pset(x, y, C.RD);
}
function noteIcon(x, y, col = C.OL, o = {}) {   // a quaver ♪ about 5x8
  x = Math.round(x); y = Math.round(y);
  begin(); rect(x, y + 5, 3, 2, col); vline(x + 2, y, y + 5, col); pset(x + 3, y + 1, col); pset(x + 4, y + 2, col); if (o.double) { rect(x + 5, y + 5, 3, 2, col); vline(x + 7, y, y + 5, col); hline(x + 2, x + 7, y, col); } end(o.ol === undefined ? C.OL : o.ol);
}
function sparkle(x, y, k = 1, col = C.WH) {      // 4-point twinkle, k = size 0..1
  x = Math.round(x); y = Math.round(y); const r = Math.round(k * 3);
  if (r <= 0) { pset(x, y, col); return; }
  hline(x - r, x + r, y, col); vline(x, y - r, y + r, col); if (r > 1) { pset(x - 1, y - 1, col); pset(x + 1, y + 1, col); pset(x + 1, y - 1, col); pset(x - 1, y + 1, col); }
}
function bulb(x, y, k = 1) {                    // idea lightbulb, k = glow
  begin(); ellipse(x, y, 4, 4, k > .5 ? C.NY : C.W2); rect(x - 2, y + 3, 5, 3, C.G3); end(C.OL);
  if (k > .5) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; pset(Math.round(x + Math.cos(a) * 7), Math.round(y + Math.sin(a) * 7), C.L1); }
}
function paperBall(x, y, seed = 0) {
  begin(); ellipse(x, y, 3, 3, C.PA1); end(C.OL); pset(x - 1, y, C.PA3); pset(x + 1, y - 1, C.PA3); pset(x + (seed % 2), y + 1, C.PA2);
}
// breath puff from (x, y) started at t0
function breath(x, y, t0, t, dir = 1) {
  const k = (t - t0) / 1.2; if (k < 0 || k > 1) return;
  begin(); ellipse(x + dir * k * 8, y - k * 4, 2 + k * 3, 1.5 + k * 2, C.WH); end(null, (1 - k) * .8);
}

// ---------- passers-by: person() with random looks ----------
const NPC_COLS = [[C.RD, C.RD2], [C.T2, C.T3], [C.G3, C.G2], [C.O2, C.O3], [C.K3, C.K2], [C.CF1, C.CF2], [C.PK2, C.O4], [C.A2, C.A3]];
const NPC_HAIR = [[C.H1, C.H2, C.H3, C.H3], [C.R1, C.R2, C.R3, C.R3], [C.CF2, C.CF1, C.A3, C.A3], [C.G2, C.G3, C.G4, C.G4]];
const NPCS = {};
function npcSpec(seed) {
  if (NPCS[seed]) return NPCS[seed];
  const r = lcg(seed * 7919 + 13), tall = r() < .5, base = tall ? HIM : HER, top = NPC_COLS[Math.floor(r() * NPC_COLS.length)], bot = NPC_COLS[Math.floor(r() * NPC_COLS.length)];
  const legs = [C.G1, C.N2, C.CF2, C.Q2][Math.floor(r() * 4)];
  const P = { ...base, name: 'npc', hairStyle: tall ? 'short' : (r() < .7 ? 'bob' : 'short'), glasses: r() < .2, h: base.h - Math.floor(r() * 5), hair: NPC_HAIR[Math.floor(r() * NPC_HAIR.length)], npc: true,
    outfits: { any: { top: [top[0], top[1], C.OL2], inner: top[0], sleeve: top, skirt: tall ? null : (r() < .5 ? bot : null), legs, legs2: legs, shoe: C.B2, len: r() < .5 ? 'coat' : (tall ? 'pants' : 'knee') } } };
  if (!P.outfits.any.skirt && P.outfits.any.len === 'knee') P.outfits.any.len = 'pants';
  return (NPCS[seed] = P);
}
function npc(x, y, seed, o = {}) { return person(x, y, npcSpec(seed), { ...o, outfit: 'any', ex: o.ex || 'n' }); }
