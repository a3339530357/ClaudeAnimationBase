// mo.js：水墨的核心。整支片子只用墨，深浅全靠水的浓淡——所以这里没有"颜色"，
// 只有「这一笔的墨有多浓」和「纸有多湿」。
//
// 一帧怎么画出来（每一帧都从头画一遍，画面只由时间 t 决定，可以跳帧、可以多台机器分段渲染）：
//   1) 在 1/3 大小的画布上把这一帧所有的笔画画成一张「墨的浓淡图」（alpha 就是墨的浓度）
//   2) 拿两层噪声去啃它的边缘（毛边），再在边缘内侧补一圈更浓的墨（水把墨推到边上）
//   3) 把这张浓淡图当遮罩，铺一层墨色，印到纸上
//
// 随机数全部由固定种子产生：同一秒永远画出同一笔，所以本机和云端、不同机器结果一致。

const TAU = Math.PI * 2;
const clamp01 = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp01 = (a, b, k) => a + (b - a) * k;
// 固定种子的随机数（xorshift）：不能用 Math.random，否则每次渲染都不一样
function moRng(seed) {
  let s = (seed | 0) || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s |= 0; return ((s >>> 0) % 1000000) / 1000000; };
}
// 缓动
const moEase = {
  sine: p => 0.5 - Math.cos(Math.PI * clamp01(p)) / 2,
  inOut: p => { p = clamp01(p); return p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; },
  out: p => 1 - Math.pow(1 - clamp01(p), 3),
  in: p => Math.pow(clamp01(p), 3),
  soft: p => 1 - Math.pow(1 - clamp01(p), 2),
};
// 关键帧插值：moKf(t, [[t0, 值], [t1, 值], ...], 缓动)，值可以是数字或数组
function moKf(t, keys, e = moEase.sine) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) {
      const [a, va] = keys[i - 1], [b, vb] = keys[i], k = e((t - a) / (b - a));
      return Array.isArray(va) ? va.map((v, j) => lerp01(v, vb[j], k)) : lerp01(va, vb, k);
    }
  }
  return keys[keys.length - 1][1];
}
// 画一条平滑的曲线（Catmull-Rom）：给几个控制点，返回密排的路径点
function moSpline(P, n = 10) {
  if (P.length < 3) return P.slice();
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const u = k / n, u2 = u * u, u3 = u2 * u;
      out.push([0, 1].map(d => .5 * (2 * p1[d] + (p2[d] - p0[d]) * u
        + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2
        + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * u3)));
    }
  }
  out.push(P[P.length - 1]);
  return out;
}

// ---------- 一层墨 ----------
// 一帧用一层：所有笔画先落到 paintC（浓淡图，alpha = 墨的浓度），
// 最后 develop() 一次性啃边、积墨、上色，铺到主子画布上。
class MoLayer {
  // W/H 成片尺寸，R 浓淡图相对成片的比例（1/3 省 9 倍像素），cctx 主子画布上下文
  constructor(W, H, R, cctx) {
    this.W = W; this.H = H; this.R = R;
    this.w = Math.ceil(W * R); this.h = Math.ceil(H * R);
    this.cctx = cctx;
    // 浓淡图
    this.paint = document.createElement('canvas');
    this.paint.width = this.w; this.paint.height = this.h;
    this.P = this.paint.getContext('2d', { willReadFrequently: true });
    // 模糊用的副本（算边缘积墨）
    this.blur = document.createElement('canvas');
    this.blur.width = this.w; this.blur.height = this.h;
    this.B = this.blur.getContext('2d', { willReadFrequently: true });
    // 上色后的图
    this.tint = document.createElement('canvas');
    this.tint.width = this.w; this.tint.height = this.h;
    this.T = this.tint.getContext('2d');
    this.P.setTransform(R, 0, 0, R, 0, 0);      // 之后一笔都用成片坐标写字
    // 噪声（平铺，避免接缝）
    this.nb = this._noise(16, 9182);            // 大颗粒：决定边缘在哪儿被啃掉
    this.nf = this._noise(8, 4471);             // 细颗粒：毛感
  }
  _noise(n, seed) {
    const a = new Float32Array(n * n), r = moRng(seed);
    for (let i = 0; i < n * n; i++) a[i] = r();
    return a;
  }
  _s2(arr, n, u, v) {
    const x = ((u % 1) + 1) % 1 * n, y = ((v % 1) + 1) % 1 * n;
    const xi = x | 0, yi = y | 0, fx = x - xi, fy = y - yi;
    const y0 = yi % n, y1 = (yi + 1) % n, x0 = xi % n, x1 = (xi + 1) % n;
    return (arr[y0 * n + x0] * (1 - fx) + arr[y0 * n + x1] * fx) * (1 - fy)
         + (arr[y1 * n + x0] * (1 - fx) + arr[y1 * n + x1] * fx) * fy;
  }
  clear() {
    this.P.setTransform(1, 0, 0, 1, 0, 0);
    this.P.clearRect(0, 0, this.w, this.h);
    this.P.setTransform(this.R, 0, 0, this.R, 0, 0);
  }

  // ---- 一笔 ----
  // pts 是路径点（成片坐标）。o: {w 笔宽, ink 墨浓度 0..1, wet 纸湿度, dry 飞白, seed}
  stroke(pts, o = {}) {
    if (!pts || pts.length < 2) return;
    const s = this._samples(pts, o);
    this._plot(s, o);
  }
  // 曲线版本：给几个控制点，自动平滑
  curve(pts, o = {}) {
    this.stroke(moSpline(pts, o.smooth ?? 8), o);
  }
  _samples(pts, o) {
    const n = pts.length;
    const w = o.w ?? 26, ink = o.ink ?? .85, seed = o.seed ?? 1;
    const r = moRng(seed * 7919 + 13);
    // 按弧长均匀取点（按顶点取的话，拐角会挤成疙瘩）
    const segs = []; let total = 0;
    for (let i = 1; i < n; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segs.push(d); total += d;
    }
    if (total < .01) return [];
    const step = Math.max(1.5, w * .2);
    const cnt = Math.max(2, Math.ceil(total / step));
    const out = [];
    for (let k = 0; k <= cnt; k++) {
      const want = total * k / cnt;
      let acc = 0, i = 0;
      while (i < segs.length - 1 && acc + segs[i] < want) { acc += segs[i]; i++; }
      const t = segs[i] > 0 ? (want - acc) / segs[i] : 0;
      const p = [lerp01(pts[i][0], pts[i + 1][0], t), lerp01(pts[i][1], pts[i + 1][1], t)];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 2)];
      const dir = [b[0] - a[0], b[1] - a[1]];
      const dl = Math.hypot(dir[0], dir[1]) || 1;
      const kk = k / cnt;
      // 宽度：起笔略顿、行笔饱满、收笔收细
      const body = Math.pow(Math.sin(Math.PI * Math.min(1, kk * 1.05 + .05)), .42);
      const taper = o.taper ?? .5;
      let ww = w * (.30 + .70 * body) * (1 - taper * Math.max(0, kk - .55) * 2.0);
      ww *= 1 + (r() - .5) * .16;
      // 浓度：起笔重、收笔飞白变淡
      let aa = ink * (.88 + .12 * body) * (1 - (o.dry ?? .3) * Math.max(0, kk - .6) * 2.0);
      if ((o.dry ?? 0) > .45 && kk > .78 && r() < (kk - .78) * 3.2) aa *= .4 + r() * .35;
      out.push({ x: p[0], y: p[1], w: Math.max(.5, ww), ink: clamp01(aa), dir: [dir[0] / dl, dir[1] / dl] });
    }
    return out;
  }
  _plot(samples, o) {
    if (!samples.length) return;
    const C = this.P, wet = o.wet ?? .35, r = moRng((o.seed ?? 1) * 104729 + 7);
    C.lineCap = 'round'; C.lineJoin = 'round';
    for (let i = 0; i < samples.length; i++) {
      const p = samples[i];
      const spread = 1 + wet * 1.5 + r() * wet * .5;
      C.strokeStyle = `rgba(0,0,0,${p.ink})`;
      C.lineWidth = p.w * spread;
      C.beginPath();
      if (i === 0) { C.moveTo(p.x, p.y); C.lineTo(p.x + .01, p.y); }
      else { C.moveTo(samples[i - 1].x, samples[i - 1].y); C.lineTo(p.x, p.y); }
      C.stroke();
      // 湿墨在两侧留的水痕
      if (wet > .3 && r() < .2) {
        C.strokeStyle = `rgba(0,0,0,${p.ink * .2})`;
        C.lineWidth = p.w * spread * (1.6 + r() * .6);
        C.beginPath(); C.moveTo(p.x, p.y); C.lineTo(p.x + .01, p.y); C.stroke();
      }
    }
  }

  // ---- 一团墨化在纸上 ----
  // o: {ink 墨浓度, wet 湿度, age 从落纸到现在的秒数, rate 化开要几秒, R 半径}
  bleed(cx, cy, R, o = {}) {
    const age = o.age ?? 1;
    if (age <= 0) return;
    const wet = o.wet ?? .5, ink = o.ink ?? .8;
    const r = moRng((o.seed ?? 1) * 2654435761 + 11);
    const k = moEase.out(clamp01(age / (o.rate ?? 2.2)));
    const rr = R * (.22 + .78 * k);
    const NB = 34, pts = [];
    for (let i = 0; i < NB; i++) {
      const a = i / NB * TAU;
      const jr = 1 + (r() - .5) * .34 * (1 + wet);
      pts.push([cx + Math.cos(a) * rr * jr, cy + Math.sin(a) * rr * jr]);
    }
    const C = this.P;
    const path = new Path2D();
    pts.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y));
    path.closePath();
    const gr = C.createRadialGradient(cx, cy, 0, cx, cy, rr);
    gr.addColorStop(0, `rgba(0,0,0,${ink})`);
    gr.addColorStop(.5, `rgba(0,0,0,${ink * (.68 + .22 * (1 - wet))})`);
    gr.addColorStop(.86, `rgba(0,0,0,${ink * .28})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    C.save();
    C.fillStyle = gr;
    C.fill(path);
    // 湿墨的边缘更重（水把墨推到边上）
    if (wet > .05) {
      C.clip(path);
      const rim = C.createRadialGradient(cx, cy, rr * .5, cx, cy, rr);
      rim.addColorStop(0, 'rgba(0,0,0,0)');
      rim.addColorStop(.88, `rgba(0,0,0,${.32 * wet * ink})`);
      rim.addColorStop(1, 'rgba(0,0,0,0)');
      C.fillStyle = rim;
      C.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    }
    C.restore();
  }
  // 一个墨点（雨、泪、砸下来的碎点）：落纸后洇开一小团
  dot(cx, cy, R, o = {}) { this.bleed(cx, cy, R, { rate: 1.2, wet: .7, ...o }); }

  // ---- 一块实心的墨（剪影用） ----
  // pts 是形状轮廓。o: {ink 浓度, wet, soft 边缘毛糙}
  blob(pts, o = {}) {
    const C = this.P;
    const path = new Path2D();
    pts.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y));
    path.closePath();
    C.save();
    C.fillStyle = `rgba(0,0,0,${o.ink ?? .9})`;
    C.fill(path);
    C.restore();
  }

  // ---- 留缝 ----
  // 在已经画上的墨里抠掉一条细缝（把纸色让出来）。水墨人物的手、臂、腿之间全靠这个分开，
  // 不抠的话整个身子会糊成一坨。pts 是缝的路径，w 是缝的宽度。
  gap(pts, w = 6) {
    if (!pts || pts.length < 2) return;
    const C = this.P;
    C.save();
    C.globalCompositeOperation = 'destination-out';
    C.lineCap = 'round'; C.lineJoin = 'round';
    C.strokeStyle = 'rgba(0,0,0,1)';
    C.lineWidth = w;
    C.beginPath();
    pts.forEach(([x, y], i) => i ? C.lineTo(x, y) : C.moveTo(x, y));
    C.stroke();
    C.restore();
  }
  // 沿一条曲线抠缝（点少的时候用这个，会自动平滑）
  gapCurve(pts, w = 6, smooth = 6) { this.gap(moSpline(pts, smooth), w); }

  // ---- 收尾：啃边、积墨、上墨色，铺到主画布 ----
  // o: {soft 边缘毛糙, rim 边缘积墨, ink 墨色 [r,g,b], paper 纸色 [r,g,b], fade 整体透明度}
  develop(o = {}) {
    const w = this.w, h = this.h, img = this.P.getImageData(0, 0, w, h), d = img.data;
    const soft = o.soft ?? .5, rim = o.rim ?? .5, grain = o.grain ?? .08;
    // 啃边
    for (let y = 0; y < h; y++) {
      const v = y / h;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4 + 3;
        const a = d[i];
        if (!a) continue;
        const u = x / w;
        const n1 = this._s2(this.nb, 16, u * 2.1, v * 2.1);
        const n2 = this._s2(this.nf, 8, u * 9 + .37, v * 9 + .61);
        const nn = n1 * .62 + n2 * .38;
        const bite = 1 - soft * Math.max(0, .60 - nn) * 2.0;
        d[i] = a * clamp01(bite) * (1 - grain * Math.max(0, .5 - n2));
      }
    }
    this.P.putImageData(img, 0, 0);
    // 边缘积墨：把浓淡图模糊一圈，比原位还浓的地方就是笔画的内边缘
    if (rim > .01) {
      const rad = Math.max(1, Math.round(w * .006));
      this.B.setTransform(1, 0, 0, 1, 0, 0);
      this.B.clearRect(0, 0, w, h);
      this.B.filter = `blur(${rad}px)`;
      this.B.drawImage(this.paint, 0, 0);
      this.B.filter = 'none';
      const bi = this.B.getImageData(0, 0, w, h).data;
      for (let p = 3; p < d.length; p += 4) {
        const a = d[p];
        if (!a) continue;
        const b = bi[p];
        if (b > a) d[p] = Math.min(255, a + (b - a) * rim * (a / 255));
      }
      this.P.putImageData(img, 0, 0);
    }
    // 上墨色
    const inkC = o.ink || [26, 24, 21];
    this.T.setTransform(1, 0, 0, 1, 0, 0);
    this.T.globalCompositeOperation = 'source-over';
    this.T.clearRect(0, 0, w, h);
    this.T.fillStyle = `rgb(${inkC[0]},${inkC[1]},${inkC[2]})`;
    this.T.fillRect(0, 0, w, h);
    this.T.globalCompositeOperation = 'destination-in';
    this.T.drawImage(this.paint, 0, 0);
    this.T.globalCompositeOperation = 'source-over';
    // 铺到主画布
    const c = this.cctx;
    c.save();
    c.globalAlpha = o.fade ?? 1;
    c.drawImage(this.tint, 0, 0, this.W, this.H);
    c.restore();
  }
}

// ---------- 纸 ----------
// 宣纸：暖白底 + 纤维 + 四边压暗。整支片子只生成一次。
function moMakePaper(W, H, PAPER) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), r = moRng(77);
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  // 纸浆的厚薄：大块的深浅不匀
  for (let i = 0; i < 420; i++) {
    const x = r() * W, y = r() * H, rad = 60 + r() * 340;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() > .5;
    gr.addColorStop(0, `rgba(${dark ? '128,112,86' : '255,254,248'},${0.006 + r() * 0.016})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
  }
  // 纤维
  g.lineCap = 'round';
  for (let i = 0; i < 2600; i++) {
    const x = r() * W, y = r() * H, a = r() * TAU, l = 3 + r() * 15;
    g.strokeStyle = `rgba(${r() > .5 ? '118,102,76' : '255,252,244'},${0.018 + r() * 0.032})`;
    g.lineWidth = .6 + r() * .9;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // 四边压暗
  const v = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.18);
  v.addColorStop(0, 'rgba(96,78,48,0)'); v.addColorStop(1, 'rgba(104,86,54,.12)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

// ---------- 墨色 ----------
// 印在纸上的墨不是纯黑：浓的地方近黑、淡的地方偏暖褐
function moColour(a, INK = [26, 24, 21], PAPER = [242, 236, 226]) {
  const k = 1 - clamp01(a);
  return [0, 1, 2].map(i => Math.round(INK[i] * clamp01(a) + PAPER[i] * k));
}
