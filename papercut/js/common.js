// 全片共用：时间曲线（弹起 / 折回 / 拍上脉冲）、立体书的一层、常用纸形状、天空纸带、纸屑、彩虹纸带、转场工具。画面只由时间 t 决定。
'use strict';
ST.k = 1.6;                            // 投影大小（paper.js）

// ---------- 时间曲线 ----------
const RISE = .17;
// 弹起：在拍点 tb 正好到回弹顶点（1 + amp），之后晃两下停在 1
function popK(t, tb, amp = .22) {
  const s = t - (tb - RISE);
  if (s <= 0) return 0;
  if (s < RISE) return (1 + amp) * Math.sin(s / RISE * Math.PI / 2);
  const u = s - RISE; return 1 + amp * Math.exp(-u * 9) * Math.cos(u * 22);
}
// 折回去：在拍点 tb 正好拍平，落下去再轻轻弹一下
function foldK(t, tb, d = .2) {
  const s = (t - (tb - d)) / d;
  if (s <= 0) return 1;
  if (s < 1) return 1 - s * s;
  const u = t - tb; return .08 * Math.abs(Math.sin(u * 22)) * Math.exp(-u * 12);
}
// 拍上的一下脉冲：拍前 0.07 s 起势，拍上最高，之后衰减
function bump(t, tb, tau = .14) { const d = t - tb; return d < -.07 ? 0 : d < 0 ? 1 + d / .07 : Math.exp(-d / tau); }
// 音乐 42.61 s 断掉以后只剩回声：拍上的脉冲跟着回声一拍比一拍轻
const ECHO = tb => tb < MUSIC_END ? 1 : .55 * Math.exp(-(tb - MUSIC_END) / .9);
function beatPulse(t, tau = .13) { const n = Math.round((t - BO) / BP); return n < 0 ? 0 : bump(t, bt(n), tau) * ECHO(bt(n)); }
function downPulse(t) { const n = Math.round((t - BO) / BP / 4) * 4; return n < 0 ? 0 : bump(t, bt(n), .22) * ECHO(bt(n)); }
const ramp = (t, a, b) => ease(seg(t, a, b));

// ---------- 立体书的一层：底边是折痕（hy），k = 立起来多少（0 平躺，1 立直，>1 回弹）----------
function stand(ctx, hy, k, fn) {
  if (k <= .004) return;
  ctx.save();
  ctx.translate(0, hy); ctx.scale(1 + (k - 1) * .12, k); ctx.translate(0, -hy);
  if (k < .97) ctx.filter = `brightness(${(.78 + .22 * Math.max(0, k)).toFixed(3)})`;   // 躺下去的纸背光，暗一点
  fn();
  ctx.restore();
}
function popAt(ctx, x, y, k, fn) {       // 整片放大弹出来（星星、花、心）
  if (k <= .004) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); fn(); ctx.restore();
}

// ---------- 形状 ----------
function band(y0, seed) {           // 一条手撕的天空纸带：上沿起伏，一直盖到画面底下
  const r = mulberry(seed), p = [];
  for (let i = 0; i <= 24; i++) p.push([-60 + (W + 120) * i / 24, y0 + Math.sin(i * .9 + seed) * 10 + (r() - .5) * 8]);
  p.push([W + 60, H + 60], [-60, H + 60]);
  return p;
}
function hills(base, amp, n, seed) {   // 一排小山：圆鼓鼓的顶
  const p = [];
  for (let i = 0; i <= 60; i++) {
    const x = -60 + (W + 120) * i / 60;
    p.push([x, base - amp * Math.abs(Math.sin(x / W * Math.PI * n + seed)) - amp * .25 * Math.sin(x * .01 + seed * 3)]);
  }
  p.push([W + 60, H + 60], [-60, H + 60]);
  return p;
}
function cloud(w, h, seed) {
  const p = [], N = 44;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    if (s < 0) { const b = 1 + .2 * Math.abs(Math.sin(a * 3.2 + seed)); p.push([c * w / 2 * b, s * h / 2 * b * 1.25]); }
    else p.push([c * w / 2, s * h / 2 * .45]);
  }
  return p;
}
function crescent(R, d, r) {           // 月亮船：大圆挖掉往上挪的小圆，剩下一只碗
  const p = [], q = [];
  for (let i = 0; i <= 120; i++) {
    const a = -Math.PI / 2 + i / 120 * Math.PI * 2, x = Math.cos(a) * R, y = Math.sin(a) * R;
    if (Math.hypot(x, y + d) > r) p.push([x, y]);
  }
  for (let i = 120; i >= 0; i--) {
    const b = i / 120 * Math.PI, x = Math.cos(b) * r, y = -d + Math.sin(b) * r;
    if (Math.hypot(x, y) < R) q.push([x, y]);
  }
  return p.concat(q);
}
function zShape() { return [[0, 0], [30, 0], [30, 7], [9, 29], [30, 29], [30, 36], [0, 36], [0, 29], [21, 7], [0, 7]]; }
function flower(ctx, key, col) {
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.rotate(i * Math.PI * 2 / 5);
    pc(ctx, key + 'p', () => ell(0, -15, 9, 14, 16), col, { lift: .5, step: 5 });
    ctx.restore();
  }
  pc(ctx, key + 'c', () => ell(0, 0, 8, 8, 14), '#ffd23f', { lift: .4, step: 5 });
}
function house(ctx, key, x, y, lit, roof = '#ef7a5a') {    // (x, y) = 房子底边中点
  ctx.save(); ctx.translate(x, y);
  pc(ctx, key + 'chim', () => rect(22, -150, 22, 50), '#d9a07a', { lift: .6 });
  pc(ctx, key + 'body', () => rect(-60, -92, 120, 92), '#fff1d6', { lift: 1 });
  pc(ctx, key + 'roof', () => [[-76, -88], [0, -158], [76, -88]], roof, { lift: 1.1 });
  const win = lit > .5 ? '#ffd84a' : '#a9b7e0';
  if (lit > .01) { ctx.save(); ctx.globalAlpha = Math.min(1, lit) * .55; const g = ctx.createRadialGradient(-24, -52, 0, -24, -52, 70 * Math.min(1.3, lit)); g.addColorStop(0, '#fff3a0'); g.addColorStop(1, 'rgba(255,240,160,0)'); ctx.fillStyle = g; ctx.fillRect(-100, -130, 160, 160); ctx.restore(); }
  ctx.save(); ctx.translate(-24, -52); const ws = 1 + .3 * Math.max(0, lit - 1) * 3; ctx.scale(ws, ws);
  pc(ctx, key + 'win', () => rect(-17, -17, 34, 34), win, { lift: .3 });
  ctx.restore();
  pc(ctx, key + 'door', () => smooth([[16, 0], [16, -42], [30, -54], [44, -42], [44, 0]], 4), '#7cc6f0', { lift: .4 });
  ctx.restore();
}
function heartPiece(ctx, key, r) { pc(ctx, key, () => heartShape(r), '#ff5a6e', { lift: 1.2, step: 6 }); pc(ctx, key + 'hi', () => ell(-r * .38, -r * .28, r * .18, r * .11, 12), '#ffb3bd', { lift: 0 }); }

// ---------- 预先摆好的东西 ----------
const STARS = [[180, 120, 22], [470, 90, 16], [760, 150, 26], [1010, 90, 18], [1230, 170, 22], [1480, 100, 17], [1760, 150, 24],
  [330, 230, 13], [1120, 270, 14], [1650, 290, 15], [900, 260, 12], [80, 330, 14], [1850, 420, 13], [1340, 400, 12]];
const DREAM_SKY = ['#cbbcf0', '#dcc2f0', '#efc5e3', '#fbcdd6', '#ffdcc8'];
const WAKE_SKY = ['#8fd0f7', '#a7dbf9', '#c1e7fb', '#daf2fc', '#f1fbf3'];
const BANDS = [-40, 170, 320, 460, 590];
const MOON = { x: 600, y: 560, R: 240 }, MOONAT = { x: 650, y: 540, s: 1.26 };   // 月亮船在局部坐标里画，MOONAT 把它放到画面上
const CONF = Array.from({ length: 90 }, (_, i) => {
  const r = mulberry(i * 7919 + 13), a = r() * Math.PI * 2, v = 700 + r() * 1300;
  return { a, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .8 - 500, s: 9 + r() * 15, kind: Math.floor(r() * 3),
           col: [...RAINBOW, '#fffaf0', '#ffc2d1'][Math.floor(r() * 8)], spin: (r() - .5) * 14, ph: r() * 6.28 };
});

function confetti(ctx, t, t0, amount, ox, oy) {
  const u = t - t0; if (u < 0 || u > 2.6) return;
  const n = Math.round(CONF.length * amount);
  for (let i = 0; i < n; i++) {
    const c = CONF[i], dr = 2.6, sp = amount < 1 ? .55 : 1;
    const x = ox + c.vx * sp * (1 - Math.exp(-u * dr)) / dr + Math.sin(u * 4 + c.ph) * 12 * u;
    const y = oy + c.vy * sp * (1 - Math.exp(-u * dr)) / dr + 260 * u * u;
    if (y > H + 40) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(c.spin * u + c.ph); ctx.scale(1, Math.cos(u * 6 + c.ph));
    const key = 'cf' + c.kind + '_' + (i % 5);
    pc(ctx, key, () => c.kind === 0 ? rect(-c.s / 2, -c.s * .3, c.s, c.s * .6) : c.kind === 1 ? [[0, -c.s * .6], [c.s * .55, c.s * .4], [-c.s * .55, c.s * .4]] : ell(0, 0, c.s * .42, c.s * .42, 12), c.col, { lift: .5, step: 5, grain: false });
    ctx.restore();
  }
}


// 天空：几条手撕纸带从上往下叠（cols 从上到下），key 区分不同页的纸带形状，ys 是每条的上沿
function sky(ctx, cols, t, key = 'band', ys = BANDS) {
  cols.forEach((c, i) => { ctx.save(); ctx.translate(0, Math.sin(t * .8 + i) * 3); pc(ctx, key + i, () => band(ys[i], i * 31 + 5 + (key === 'band' ? 0 : hstr(key) % 97)), c, { lift: i ? 1.4 : 0, step: 14, amp: 2 }); ctx.restore(); });
  // 书脊：中间一道很淡的折痕
  const g = ctx.createLinearGradient(W / 2 - 60, 0, W / 2 + 60, 0);
  g.addColorStop(0, 'rgba(120,80,60,0)'); g.addColorStop(.5, 'rgba(120,80,60,.10)'); g.addColorStop(1, 'rgba(120,80,60,0)');
  ctx.fillStyle = g; ctx.fillRect(W / 2 - 60, -60, 120, H + 120);
}

// ---------- 会动的形状（每帧形状不一样，不进剪纸缓存，直接贴）----------
// 中心线 → 法线方向偏移
function offsetLine(c, d) {
  const n = c.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    out.push([c[i][0] - dy * d, c[i][1] + dx * d]);
  }
  return out;
}
// 彩虹纸带：沿中心线 c 贴六条彩色窄纸条，总宽 w；先垫一条带投影的底
function rainbowStrip(ctx, c, w, o = {}) {
  if (c.length < 2) return;
  const n = RAINBOW.length, sw = w / n;
  paper(ctx, [ribbon(c, w + 4)], '#fffaf0', { lift: o.lift ?? 1, grain: false });
  RAINBOW.forEach((col, k) => {
    const d = -w / 2 + sw * (k + .5), cc = offsetLine(c, d);
    paper(ctx, [ribbon(cc, sw + 1.2)], col, { lift: 0, edge: false });
  });
}
// 两点之间一条下垂（sag>0）或上拱的曲线，wave 让它飘
function sagLine(x0, y0, x1, y1, sag, t = 0, wave = 0, n = 26) {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, s = Math.sin(u * Math.PI);
    p.push([lerp(x0, x1, u), lerp(y0, y1, u) + sag * s + wave * s * Math.sin(u * 9 - t * 7)]);
  }
  return p;
}
// 一个圆环（evenodd 挖洞）
function ringPts(cx, cy, rx, ry, w, n = 48) { return [ell(cx, cy, rx + w / 2, ry + w / 2, n), ell(cx, cy, Math.max(1, rx - w / 2), Math.max(1, ry - w / 2), n)]; }
// 跳起来的高度：从 t0 起跳、t1 落地，最高 h（落地正好压在拍上）
function hop(t, t0, t1, h) { const f = seg(t, t0, t1); return f <= 0 || f >= 1 ? 0 : 4 * h * f * (1 - f); }
// 一步一步转（每拍一下，回弹顶点压拍）：beats 里每个拍点加一步
function steps(t, beats, d = .2) {
  let s = 0;
  for (const b of beats) { const f = seg(t, b - d, b); if (f <= 0) break; s += f >= 1 ? 1 + .12 * Math.exp(-(t - b) * 9) * Math.cos((t - b) * 22) : backOut(f); }
  return s;
}
// 纸太阳（一圈三角光芒）
function paperSun(ctx, key, r, t, col = '#ffd23f', ray = '#ffb84d') {
  ctx.save(); ctx.rotate(t * .5);
  for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * Math.PI / 6); pc(ctx, key + 'ray' + (i % 2), () => [[-r * .15, -r * 1.17], [0, -r * 1.56 - (i % 2) * r * .19], [r * .15, -r * 1.17]], ray, { lift: .6, step: 6 }); ctx.restore(); }
  ctx.restore();
  pc(ctx, key, () => ell(0, 0, r, r, 40), col, { lift: 1.2 });
}
// 小星星闪一下
function sparkle(ctx, key, x, y, k, r = 16, col = '#fff4bd') { popAt(ctx, x, y, k, () => pc(ctx, key, () => star(r, r * .42, 4), col, { lift: .6, step: 4 })); }
