// 基础图形库：全部返回 SVG path 的 d 字符串
const R = n => Math.round(n * 10) / 10;
const A = {};

A.poly = (pts, closed = false) =>
  'M' + pts.map(p => R(p[0]) + ' ' + R(p[1])).join('L') + (closed ? 'Z' : '');

A.line = (x1, y1, x2, y2) => `M${R(x1)} ${R(y1)}L${R(x2)} ${R(y2)}`;

// Catmull-Rom 平滑曲线，穿过所有点
A.smooth = (pts, closed = false) => {
  const n = pts.length;
  if (n < 3) return A.poly(pts, closed);
  const P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${R(pts[0][0])} ${R(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${R(c1[0])} ${R(c1[1])} ${R(c2[0])} ${R(c2[1])} ${R(p2[0])} ${R(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
};

A.circ = (cx, cy, r) =>
  `M${R(cx - r)} ${R(cy)}a${R(r)} ${R(r)} 0 1 0 ${R(2 * r)} 0a${R(r)} ${R(r)} 0 1 0 ${R(-2 * r)} 0`;

A.ell = (cx, cy, rx, ry) =>
  `M${R(cx - rx)} ${R(cy)}a${R(rx)} ${R(ry)} 0 1 0 ${R(2 * rx)} 0a${R(rx)} ${R(ry)} 0 1 0 ${R(-2 * rx)} 0`;

// 椭圆弧上的点，角度用度数，0° 指向右，90° 指向下
A.arcPts = (cx, cy, rx, ry, a0, a1, n = 24) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
};
A.arc = (cx, cy, rx, ry, a0, a1) => A.smooth(A.arcPts(cx, cy, rx, ry, a0, a1));

A.rect = (x, y, w, h) => A.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true);
A.rrect = (x, y, w, h, r = 10) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}` +
  `Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}` +
  `V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

// 水平波浪线
A.wave = (x0, y, x1, amp = 10, len = 80) => {
  const pts = [];
  for (let x = x0; x <= x1 + 0.1; x += len / 4)
    pts.push([x, y + amp * Math.sin((x - x0) / len * Math.PI * 2)]);
  return A.smooth(pts);
};

// 锯齿线
A.zig = (x0, y, x1, amp = 10, len = 30) => {
  const pts = [];
  let k = 0;
  for (let x = x0; x <= x1 + 0.1; x += len / 2, k++) pts.push([x, y + (k % 2 ? -amp : amp)]);
  return A.poly(pts);
};

// 螺旋（祥云、烟雾、旋风都用它）
A.spiral = (cx, cy, r, turns = 1.6, dir = 1, a0 = 0) => {
  const pts = [], n = Math.ceil(turns * 16);
  for (let i = 0; i <= n; i++) {
    const a = (a0 + dir * i / n * turns * 360) * Math.PI / 180, rr = r * (1 - 0.85 * i / n);
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return A.smooth(pts);
};

// 祥云：一条底线 + 两个卷
A.cloud = (cx, cy, s = 1) => [
  A.smooth([[cx - 120 * s, cy + 20 * s], [cx - 90 * s, cy - 18 * s], [cx - 40 * s, cy - 30 * s],
    [cx, cy - 58 * s], [cx + 50 * s, cy - 36 * s], [cx + 100 * s, cy - 10 * s], [cx + 130 * s, cy + 20 * s]]),
  A.line(cx - 150 * s, cy + 20 * s, cx + 160 * s, cy + 20 * s),
  A.spiral(cx - 6 * s, cy - 14 * s, 26 * s, 1.4, 1, 180),
  A.spiral(cx + 78 * s, cy + 2 * s, 18 * s, 1.3, -1, 0),
];

// 山脊线：peaks = [[x, 高度], ...]
A.mount = (x0, base, x1, peaks) => {
  const pts = [[x0, base]];
  let px = x0;
  for (const [x, h] of peaks) {
    pts.push([(px + x) / 2, base - h * 0.35]);
    pts.push([x, base - h]);
    px = x;
  }
  pts.push([(px + x1) / 2, base - 20]);
  pts.push([x1, base]);
  return A.smooth(pts);
};

// 火苗（底部中心 cx,by）
A.flame = (cx, by, w, h) => A.smooth([
  [cx, by - h], [cx + w * 0.2, by - h * 0.62], [cx + w * 0.5, by - h * 0.3], [cx + w * 0.38, by - h * 0.05],
  [cx, by], [cx - w * 0.38, by - h * 0.05], [cx - w * 0.5, by - h * 0.3], [cx - w * 0.15, by - h * 0.55],
], true);

// 三瓣火焰（底部中心 cx,by）
A.fire = (cx, by, w, h) => A.flame(cx, by, w, h) +
  A.flame(cx - w * 0.32, by, w * 0.55, h * 0.62) + A.flame(cx + w * 0.32, by, w * 0.55, h * 0.66);

// 六边形（左右两个尖）
A.hex = (cx, cy, r) => A.poly(Array.from({ length: 6 }, (_, k) =>
  [cx + r * Math.cos(k * Math.PI / 3), cy + r * Math.sin(k * Math.PI / 3) * 0.86]), true);

A.star = (cx, cy, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return A.poly(pts, true);
};

// 四角闪光
A.sparkle = (cx, cy, r) =>
  `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}` +
  `Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;

// 弯箭头：从 (x1,y1) 到 (x2,y2)，bend 为弯曲量
A.arrow = (x1, y1, x2, y2, bend = 0) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - bend;
  const a = Math.atan2(y2 - my, x2 - mx), L = 22;
  const h1 = [x2 - L * Math.cos(a - 0.5), y2 - L * Math.sin(a - 0.5)];
  const h2 = [x2 - L * Math.cos(a + 0.5), y2 - L * Math.sin(a + 0.5)];
  return `M${R(x1)} ${R(y1)}Q${R(mx)} ${R(my)} ${R(x2)} ${R(y2)}` +
    `M${R(h1[0])} ${R(h1[1])}L${R(x2)} ${R(y2)}L${R(h2[0])} ${R(h2[1])}`;
};

// 点绕原点旋转（度）
A.rot = (pts, deg, ox = 0, oy = 0) => {
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c]);
};

// 可复现的伪随机数
const rng = seed => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
