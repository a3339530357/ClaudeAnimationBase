// 即时绘制：每一帧都把整张图从头画一遍，所以每个画面都只由时间 t 决定，可以任意跳帧、并行渲染。
// 画到 CUR（当前分组）里；G() 进一层分组（平移/旋转/缩放/透明度/裁剪），P() 画一条线或一块形状。
const NS = 'http://www.w3.org/2000/svg';
let CUR = null, DEFS = null, NID = 0;

function el(tag, attrs = {}, parent = CUR) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
}
// 一条线或一块形状。o.w 线宽（不给 = 只填色），o.c 线色，o.fill 填色，o.op / o.fillOp 透明度，o.dash 虚线
// o.draw 0..1：笔画只画出前面这一截（线条一笔笔画出来）；填色等这一笔画完才出现
function P(d, o = {}) {
  const dr = o.draw ?? 1;
  if (!d || dr <= 0) return null;
  const w = (o.w || 0) * LINE_K, op = o.op ?? 1;
  if (op <= 0) return null;
  const a = { d, fill: o.fill || 'none', stroke: w ? (o.c || INK) : 'none', 'stroke-width': w || null,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op < 1 ? R3(op) : null,
    'fill-opacity': o.fillOp != null && o.fillOp < 1 ? R3(o.fillOp) : null, 'stroke-dasharray': o.dash || null };
  if (dr < 1) {
    if (w) { a.pathLength = 1; a['stroke-dasharray'] = '1 1'; a['stroke-dashoffset'] = R3(1 - dr); a['fill-opacity'] = 0; }
    else a.opacity = R3(op * dr);
  }
  return el('path', a);
}
// 分组。o.x/o.y 平移，o.r 旋转（度），o.s 缩放（o.sx/o.sy 分开缩），o.flip 左右镜像，o.op 透明度，
// o.clip 裁剪形状（d 字符串，坐标在这个分组自己的坐标系里）
function G(o, fn) {
  if (o.op != null && o.op <= 0.002) return null;
  const tr = [];
  if (o.x || o.y) tr.push(`translate(${R(o.x || 0)} ${R(o.y || 0)})`);
  if (o.r) tr.push(`rotate(${R(o.r)})`);
  const sx = (o.sx ?? 1) * (o.s ?? 1) * (o.flip ? -1 : 1), sy = (o.sy ?? 1) * (o.s ?? 1);
  if (sx !== 1 || sy !== 1) tr.push(`scale(${sx.toFixed(4)} ${sy.toFixed(4)})`);
  const prev = CUR;
  const g = el('g', { transform: tr.join(' ') || null, opacity: o.op != null && o.op < 1 ? R3(o.op) : null });
  if (o.clip) {
    const id = 'k' + (++NID), cp = el('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, DEFS);
    // 裁剪形状要和分组用同一个坐标系：把它放进同样变换的路径里
    el('path', { d: o.clip }, cp);
    g.setAttribute('clip-path', `url(#${id})`);
  }
  CUR = g;
  try { fn(g); } finally { CUR = prev; }
  return g;
}
// 镜头：看向 (cx, cy)，放大 z 倍，转 r 度；fn 里用世界坐标画
function CAM(cx, cy, z, r, fn) { return G({ x: W / 2, y: H / 2 }, () => G({ s: z, r }, () => G({ x: -cx, y: -cy }, fn))); }

// 文字。o.size, o.font, o.c, o.anchor (start/middle/end), o.halo 纸色描边宽, o.rot, o.op, o.s 缩放（以文字中心为准）
function TX(s, x, y, o = {}) {
  const size = o.size || 56;
  return G({ x, y, r: o.rot || 0, s: o.s ?? 1, op: o.op }, () => {
    const te = el('text', { x: 0, y: size * 0.35, 'font-family': o.font || FONT_HAND, 'font-size': size,
      'text-anchor': o.anchor || 'middle', fill: o.c || INK, stroke: o.halo ? (o.haloC || PAPER) : null,
      'stroke-width': o.halo || null, 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
    te.textContent = s;
  });
}

// 一组部件（人物、物件）按顺序一笔笔画出来：k 0..1 是整组画到哪了。部件 {d, w, fill, c, op, fillOp}。
// 返回正在画的那一笔的笔尖位置（本分组坐标），画完了返回 null。用来让铅笔跟着笔尖走。
function inkParts(list, k = 1, o = {}) {
  const n = list.length, L = o.overlap ?? 1.6;
  let tip = null;
  list.forEach((q, i) => {
    if (!q || !q.d) return;
    const dr = k >= 1 ? 1 : clamp((k * (n + L - 1) - i) / L);
    let e = null;
    if (q.rot) G({ x: q.rot[1], y: q.rot[2], r: q.rot[0] }, () => G({ x: -q.rot[1], y: -q.rot[2] }, () => { e = P(q.d, { ...q, draw: dr }); }));
    else e = P(q.d, { ...q, draw: dr });
    if (e && dr > 0 && dr < 1 && q.w && o.tip) {
      const pt = e.getPointAtLength(e.getTotalLength() * dr);
      tip = q.rot ? rotPt([pt.x, pt.y], q.rot) : [pt.x, pt.y];
    }
  });
  return tip;
}
// 点绕 (cx, cy) 转 deg 度：rot = [deg, cx, cy]
function rotPt([x, y], [deg, cx, cy]) { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; }
const part = (d, w = 5, x = {}) => Object.assign({ d, w }, x);
