// 剪纸引擎：每一片都是彩纸——剪刀剪出来的直线毛边、纸纹颗粒、下面浅浅一层投影。
// 画面按定格动画走：每秒 FPS 张；每一张里每片纸都轻轻挪一点，像手摆纸偶。
'use strict';
const FPS = 10;
const ST = { frame: 0, k: 1 };          // 当前定格帧号；画布每个设计单位多少像素（投影跟着缩放）

const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, f) => a + (b - a) * f;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ease = f => f < .5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f);
const easeOut = f => 1 - (1 - f) * (1 - f);
const backOut = f => { const c = 1.9; return 1 + (c + 1) * Math.pow(f - 1, 3) + c * Math.pow(f - 1, 2); };

function mulberry(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hstr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// ---------- 形状：都返回点列 [[x,y],...]（闭合轮廓） ----------
function ell(cx, cy, rx, ry, n = 32) {
  const p = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return p;
}
const cr = (p0, p1, p2, p3, t) => {
  const t2 = t * t, t3 = t2 * t;
  return [0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
};
// 闭合的平滑曲线（过每个控制点）
function smooth(c, n = 6) {
  const p = [], m = c.length;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) p.push(cr(c[(i - 1 + m) % m], c[i], c[(i + 1) % m], c[(i + 2) % m], j / n));
  return p;
}
// 不闭合的平滑线（给带子、眉毛、面条用）
function line(c, n = 6) {
  const p = [], m = c.length, g = i => c[clamp(i, 0, m - 1)];
  for (let i = 0; i < m - 1; i++) for (let j = 0; j < n; j++) p.push(cr(g(i - 1), g(i), g(i + 1), g(i + 2), j / n));
  p.push(c[m - 1]);
  return p;
}
// 一条带子：中心线 + 宽度（从 w0 渐变到 w1），两头圆一点
function ribbon(c, w0, w1 = w0) {
  const L = [], R = [], n = c.length;
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = lerp(w0, w1, n > 1 ? i / (n - 1) : 0) / 2;
    L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]);
  }
  return L.concat(R.reverse());
}
// 沿 +y 从 0 到 len 的圆头长条（四肢）
function capsule(len, r1, r2) {
  const p = [];
  for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; p.push([Math.cos(a) * r1, Math.sin(a) * r1]); }
  for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI; p.push([Math.cos(a) * r2, len + Math.sin(a) * r2]); }
  return p;
}
function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function heartShape(r) {
  const p = [];
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * Math.PI * 2, x = 16 * Math.pow(Math.sin(a), 3);
    const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    p.push([x * r / 16, (y + 2) * r / 16]);
  }
  return p;
}
function star(r1, r2, n = 5) {
  const p = [];
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r2 : r1; p.push([Math.cos(a) * r, Math.sin(a) * r]); }
  return p;
}

// 剪刀剪：沿轮廓重新取点，变成长短不一的直线段；拐角保留，其余顶点沿法线往里/往外偏一点
function scissor(pts, seed, amp = 1, step = 9) {
  const r = mulberry(seed), n = pts.length, out = [];
  const corner = i => {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    let d = Math.abs(Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]));
    if (d > Math.PI) d = 2 * Math.PI - d;
    return d > .55;
  };
  let left = step * (.4 + r());
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-6, nx = -dy / d, ny = dx / d;
    if (corner(i)) { const o = (r() - .5) * amp * .6; out.push([a[0] + nx * o, a[1] + ny * o]); left = step * (.4 + r()); }
    let pos = 0;
    while (d - pos > left) {
      pos += left; const o = (r() - .5) * 2 * amp;
      out.push([a[0] + dx * pos / d + nx * o, a[1] + dy * pos / d + ny * o]);
      left = step * (.4 + r());
    }
    left -= d - pos;
  }
  return out.length >= 3 ? out : pts.map(p => p.slice());
}

// 剪好的纸片按名字存起来（同一片纸每帧形状不变，只是位置在动）
const CUT = new Map();
function cut(key, make, amp = 1, step = 9) {
  let v = CUT.get(key);
  if (!v) {
    const m = make();
    const list = typeof m[0][0] === 'number' ? [m] : m;      // 第一条是外轮廓，后面的是挖掉的洞
    v = list.map((q, i) => scissor(q, hstr(key) + i * 977, amp, step));
    CUT.set(key, v);
  }
  return v;
}
function pathOf(list) {
  const p = new Path2D();
  for (const q of list) { p.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) p.lineTo(q[i][0], q[i][1]); p.closePath(); }
  return p;
}

// 纸纹：一张小图，上面是浅浅的颗粒和几根纤维，平铺到每片纸上
const GRAIN_IMG = (() => {
  const S = 160, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), id = g.createImageData(S, S), r = mulberry(7);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = r();
    if (v < .5) { id.data[i] = 90; id.data[i + 1] = 60; id.data[i + 2] = 30; id.data[i + 3] = (.5 - v) * 52; }
    else { id.data[i] = 255; id.data[i + 1] = 252; id.data[i + 2] = 240; id.data[i + 3] = (v - .5) * 56; }
  }
  g.putImageData(id, 0, 0);
  for (let k = 0; k < 60; k++) {
    g.strokeStyle = k % 2 ? 'rgba(255,255,255,.22)' : 'rgba(110,75,40,.10)'; g.lineWidth = .8; g.beginPath();
    let x = r() * S, y = r() * S, a = r() * 6.28; g.moveTo(x, y);
    for (let j = 0; j < 4; j++) { a += (r() - .5) * .9; x += Math.cos(a) * 5; y += Math.sin(a) * 5; g.lineTo(x, y); }
    g.stroke();
  }
  return c;
})();
const GRAIN = new WeakMap();
function grainOf(ctx) { let p = GRAIN.get(ctx); if (!p) { p = ctx.createPattern(GRAIN_IMG, 'repeat'); GRAIN.set(ctx, p); } return p; }

// 贴一片纸。o.lift：离下面一层多高（投影大小，0 = 平贴）；o.alpha：薄纸（半透明）；o.grain=false 不要纸纹
function paper(ctx, list, color, o = {}) {
  const p = pathOf(list), m = ctx.getTransform(), s = Math.hypot(m.a, m.b) || 1;
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const lift = o.lift ?? 1;
  if (lift > 0) {
    ctx.shadowColor = `rgba(85,55,25,${.34 * Math.min(1, lift)})`;
    ctx.shadowBlur = 3.5 * lift * ST.k; ctx.shadowOffsetX = 1.5 * lift * ST.k; ctx.shadowOffsetY = 2.4 * lift * ST.k;
  }
  ctx.fillStyle = color; ctx.fill(p, 'evenodd');
  ctx.shadowColor = 'transparent';
  if (o.grain !== false) {
    ctx.clip(p, 'evenodd');
    const g = grainOf(ctx); g.setTransform(new DOMMatrix().scaleSelf(1.3 / s));
    ctx.fillStyle = g; ctx.fill(p, 'evenodd');
    if (o.edge !== false) { ctx.lineWidth = 2.4 / s; ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.stroke(p); }
  }
  ctx.restore();
}
// 剪好就贴：pc(ctx, 名字, 造形状的函数, 颜色, 选项)
function pc(ctx, key, make, color, o = {}) { paper(ctx, cut(key, make, o.amp ?? 1, o.step ?? 9), color, o); }

// 定格抖动：这一张里，这片纸被手碰了一下
function wob(ctx, id, a = 1) {
  const r = mulberry(hstr(id) ^ Math.imul(ST.frame + 1, 2654435761));
  ctx.translate((r() - .5) * 1.5 * a, (r() - .5) * 1.5 * a);
  ctx.rotate((r() - .5) * .014 * a);
}

// 剪纸字：每个字一片，略歪
function paperText(ctx, str, x, y, size, color, o = {}) {
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(rad(o.rot));
  ctx.font = `${size}px "ZCOOL KuaiLe", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const r = mulberry(hstr(str) ^ (o.seed || 0)), chars = [...str], sp = o.sp ?? size * .04;
  const ws = chars.map(c => ctx.measureText(c).width), total = ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  let cx = o.align === 'left' ? 0 : -total / 2;
  const s = Math.hypot(ctx.getTransform().a, ctx.getTransform().b) || 1;
  for (let i = 0; i < chars.length; i++) {
    ctx.save(); ctx.translate(cx + ws[i] / 2, (r() - .5) * size * .06); ctx.rotate((r() - .5) * (o.wild ?? .12));
    if (o.back) {      // 每个字底下垫一小片纸
      ctx.shadowColor = 'rgba(85,55,25,.3)'; ctx.shadowBlur = 3 * ST.k; ctx.shadowOffsetX = 1.4 * ST.k; ctx.shadowOffsetY = 2.2 * ST.k;
      const h = size * .62, w = ws[i] / 2 + size * .1;
      ctx.fillStyle = o.back; ctx.beginPath(); ctx.moveTo(-w, -h); ctx.lineTo(w * .96, -h * 1.04); ctx.lineTo(w, h * .96); ctx.lineTo(-w * 1.03, h); ctx.closePath(); ctx.fill();
    }
    ctx.shadowColor = 'rgba(85,55,25,.32)'; ctx.shadowBlur = 2.5 * ST.k; ctx.shadowOffsetX = 1.2 * ST.k; ctx.shadowOffsetY = 2 * ST.k;
    if (o.outline) { ctx.lineJoin = 'round'; ctx.lineWidth = o.outline / 1; ctx.strokeStyle = o.outlineC || '#fffaf0'; ctx.strokeText(chars[i], 0, 0); ctx.shadowColor = 'transparent'; }
    ctx.fillStyle = color; ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    cx += ws[i] + sp;
  }
  ctx.restore();
}

// 数字（球衣号码）用纸剪：只要 0、1、4
function digitOutline(ch) {
  if (ch === '1') return [[[-.06, -.5], [.15, -.5], [.15, .5], [-.08, .5], [-.08, -.25], [-.25, -.18], [-.29, -.36]]];
  if (ch === '0') return [ell(0, 0, .29, .5, 26), ell(0, 0, .12, .31, 20)];
  if (ch === '4') return [[[.04, -.5], [.24, -.5], [.24, .08], [.32, .08], [.32, .26], [.24, .26], [.24, .5], [.04, .5], [.04, .26], [-.32, .26], [-.32, .08]], [[.04, -.12], [.04, .08], [-.12, .08]]];
  return [rect(-.25, -.5, .5, 1)];
}
function drawNum(ctx, str, x, y, h, color, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(h, h);
  const w = .62, n = str.length;
  for (let i = 0; i < n; i++) {
    ctx.save(); ctx.translate((i - (n - 1) / 2) * w, 0); ctx.rotate((i % 2 ? 1 : -1) * .03);
    if (o.outline) paper(ctx, cut('digO' + str[i], () => digitOutline(str[i]).map((q, j) => j ? q : q.map(([a, b]) => [a * 1.18, b * 1.12])), .006, .06), o.outline, { lift: .3 });
    paper(ctx, cut('dig' + str[i], () => digitOutline(str[i]), .006, .06), color, { lift: .5 });
    ctx.restore();
  }
  ctx.restore();
}
