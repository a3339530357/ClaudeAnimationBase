// 效果：红色拟声字、速度线、闪光、全屏闪白

// 红色拟声字（"啪！""咚！"）：k 0..1 弹出，之后轻轻抖；o.rot 倾斜，o.size 字号，o.out 0..1 淡出
function pow(s, x, y, k, o = {}) {
  if (k <= 0) return;
  const sc = E.outBack(clamp(k / .35)) * (1 + .04 * Math.sin(k * 30) * (1 - clamp(k)));
  TX(s, x, y, { font: FONT_FUN, size: o.size || 92, c: RED, halo: 12, rot: o.rot ?? -8, s: Math.max(.001, sc), op: 1 - (o.out || 0) });
}
// 速度线：从画面一侧扫过的几条横线（镜头甩、人在跑）。k 0..1 扫过的进度，dir 1 往左扫
function speedLines(k, o = {}) {
  if (k <= 0 || k >= 1) return;
  const ys = o.ys || [180, 290, 420, 560, 660, 780, 860];
  ys.forEach((y, i) => { const x = W + 300 - (k + i * .07) * (W + 900); P(A.line(x, y, x + 200 + (i % 3) * 140, y), { w: 3.5, op: Math.sin(Math.PI * k) * .6 }); });
}
// 四角闪光 ✦
function sparkle(x, y, r, o = {}) { P(A.sparkle(x, y, r), { w: o.w ?? 3, fill: o.fill || PAPER, op: o.op }); }
// 全屏一层纸色（闪白）或墨色（变暗）
function flash(k, c = PAPER) { if (k > .003) P(A.rect(-10, -10, W + 20, H + 20), { fill: c, op: clamp(k) }); }
// 在 a 秒弹出、大约 2 拍后淡掉的拟声字
function powAt(s, x, y, t, a, o = {}) { if (t < a || t > a + 1.1) return; pow(s, x, y, (t - a) / .9, { ...o, out: seg(t, a + .8, a + 1.1) }); }
// 几颗小星星绕着头转（撞到柱子）
function dizzy(x, y, t, t0, r = 50) { if (t < t0 || t > t0 + 1.3) return; for (let i = 0; i < 3; i++) { const a = (t - t0) * 7 + i * 2.1; sparkle(x + Math.cos(a) * r, y + Math.sin(a) * r * .35, 12, { op: 1 - seg(t, t0 + 1, t0 + 1.3) }); } }
// 一圈短线从 (x, y) 往外炸开（东西"叮"地出现）
function burst(x, y, k, r = 30, n = 8) { if (k <= 0 || k >= 1) return; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r0 = r + 30 * E.out(k), r1 = r0 + 22 * (1 - k); P(A.line(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1), { w: 3.5 }); } }
