// common.js: transitions and small helpers the chapters share. All screen space, called after camEnd() unless noted.

// A full-frame wash (darkness, a tint, a fade from paper or from the white of a flash).
function cover(col, a) { if (a > .005) { boilSeed('cover'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: col, washOp: 255 * clamp(a), ink: null }); } }
const FLASHW = '#FFFBF0';
// Open a shot out of the white of a camera flash (the previous shot's snap).
const whiteIn = (lt, len = .4) => cover(FLASHW, 1 - easeOut(lt / len));
// A snap: the screen flares white at t0 and fades fast.
const snapFlash = (t, t0, amt = .85) => { if (t >= t0) cover(FLASHW, amt * Math.exp(-(t - t0) * 9)); };
// Screen position of a world point under the camera that was just used (LAST_CAM survives camEnd()).
const scr = (x, y) => toScreen(x, y, LAST_CAM);

// ---------- the frame turns into a polaroid ----------
// photoBegin(k, o) before the shot paints anything (even before camBegin), photoEnd(st) after camEnd(). At k = 0 the
// frame is untouched; by k = 1 it has been cropped to a square, shrunk to o.S on a side, centred at (o.cx, o.cy),
// tilted o.rot, and framed in a white polaroid border on a flat o.bg backdrop. o.milk 0..1: an undeveloped photo's haze.
// photoEnd returns { caption: the middle of the bottom margin, w: the photo's width, rot }, in screen space.
function photoBegin(k, o = {}) {
  const e = ease(k); if (e <= .001) return null;
  const S = o.S ?? 520, sc = lerp(1, S / H, e), cx = lerp(W / 2, o.cx ?? W / 2, e), cy = lerp(H / 2, o.cy ?? H / 2 - 40, e), rot = lerp(0, o.rot ?? -.05, e);
  push(); translate(cx, cy); rotate(rot); scale(sc); translate(-W / 2, -H / 2);
  return { e, S, sc, cx, cy, rot, bg: o.bg || '#EFE4D2', key: o.key || 'pz', milk: o.milk || 0 };
}
function photoEnd(st) {
  if (!st) return;
  pop();
  const { e, sc, cx, cy, rot, S } = st, c = Math.cos(rot), s = Math.sin(rot);
  const hw = lerp(W / 2, H / 2, e) * sc, hh = H / 2 * sc, w = S / .86, m = .07 * w * e, mb = .27 * w * e;
  const X = (px, py) => [cx + c * px - s * py, cy + s * px + c * py], R = (x0, y0, x1, y1) => [X(x0, y0), X(x1, y0), X(x1, y1), X(x0, y1)];
  irisShape(R(-hw, -hh, hw, hh), st.bg);
  if (st.milk > .01) { boilSeed('milk ' + st.key); paint(R(-hw, -hh, hw, hh), { wash: PHOTO.milk, washOp: 255 * clamp(st.milk), ink: null }); }
  boilSeed('photo ' + st.key);
  const d = 10 * e;
  paint([X(hw + m, -hh - m + d), X(hw + m + d, -hh - m + d), X(hw + m + d, hh + mb + d), X(-hw - m + d, hh + mb + d), X(-hw - m + d, hh + mb), X(hw + m, hh + mb)], { wash: PAL.ink, washOp: 60, ink: null });
  for (const r of [R(-hw - m, -hh - m, hw + m, -hh), R(-hw - m, hh, hw + m, hh + mb), R(-hw - m, -hh, -hw, hh), R(hw, -hh, hw + m, hh)]) paint(r, { wash: PHOTO.frame, ink: null });
  if (e > .3) paint(R(-hw - m, -hh - m, hw + m, hh + mb), { ink: PAL.ink, sw: .8 * e });
  return { caption: X(0, hh + mb * .52), w: 2 * (hw + m), rot };
}

// ---------- a wave crashing over the screen ----------
// p 0 → .5: the wave comes down from the top and covers the frame; .5 → 1: the water drains away down the screen.
function waveWipe(p) {
  if (p <= 0 || p >= 1) return;
  boilSeed('wavewipe');
  const cover1 = p < .5, k = cover1 ? easeIn(p * 2) * .7 + .3 * (p * 2) : ease((p - .5) * 2);
  const edge = cover1 ? lerp(-260, H + 260, k) : lerp(-200, H + 300, k), n = 14, E = [];
  for (let i = 0; i <= n; i++) E.push([-100 + i * (W + 200) / n, edge + Math.sin(i * 1.7 + p * 9) * 40 + (cover1 ? 0 : -1) * Math.cos(i * 1.1) * 30]);
  const body = cover1 ? [[-100, -400], [W + 100, -400], ...E.slice().reverse()] : [...E, [W + 100, H + 600], [-100, H + 600]];
  paint(body, { wash: '#2E5C9A', ink: null });
  for (let i = 0; i < 6; i++) {   // streaks inside the water
    const yy = cover1 ? edge - 80 - i * 150 : edge + 80 + i * 150;
    inkLine([[-50, yy], [W * .4, yy + 30 * Math.sin(i)], [W + 50, yy - 20]], 4, '#4F86C0', 'dry', .5);
  }
  for (let i = 0; i <= n; i++) {   // the foam along the edge
    const [x, y] = E[i], r = 50 + 40 * hash(i * 3.3);
    paint(ellPts(x, y + (cover1 ? -10 : 10), r, r * .6, 14), { wash: '#F4F8F6', ink: PAL.ink, sw: .6 });
  }
}

// A row of polaroids pinned in a line (a corkboard, an album page). list = [[pic, rot], ...].
function photoRow(list, x0, y0, w, gap, o = {}) {
  list.forEach(([pic, rot], i) => polaroid(x0 + i * (w + gap), y0 + (o.wave ? Math.sin(i * 1.9) * o.wave : 0), w, { pic, rot, key: (o.key || 'row') + i, dev: o.dev, t: o.t }));
}

// A stack of n polaroids held in front of a crab's body (use it from clawd()'s draw hook: body space, u = body unit).
const STACK_PICS = ['sunset', 'stamp', 'hopper', 'icecream', 'waves', 'laugh'];
function photoStack(u, n, key = 'stack') {
  for (let i = 0; i < n; i++) polaroid((-.4 + .25 * Math.sin(i * 2.3)) * u, (-2.9 - i * .12) * u, 3.6 * u, { rot: .18 * Math.sin(i * 1.7), pic: i === n - 1 ? PICS[STACK_PICS[i % 6]] : null, key: key + i, shadow: i === 0 });   // only the top one shows its picture
}
