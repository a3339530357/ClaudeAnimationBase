// 镜头表、转场、速写本里的铅笔。shot(b, name, fn, o)：从第 b 拍开始的镜头；fn(t, lt, dur) 画整个画面
// （t 全片时间，lt 镜头内时间，dur 镜头长度）。o.tint：[颜色, 浓度] 或 t => [颜色, 浓度]，给纸张染上时间的颜色
const SHOTS = [];
function shot(b, name, fn, o = {}) { SHOTS.push({ t0: b ? bt(b) : 0, name, fn, tint: o.tint }); SHOTS.sort((a, c) => a.t0 - c.t0); }
const shotAt = t => { let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].t0) i++; return i; };
function drawShot(i, t) {
  const S_ = SHOTS[i]; if (!S_) return null;
  const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : DUR;
  G({}, () => S_.fn(t, t - S_.t0, end - S_.t0));
  return typeof S_.tint === 'function' ? S_.tint(t) : S_.tint;
}
function drawFilm(t) { return SHOTS.length ? drawShot(shotAt(t), t) : null; }
const drawPrevEnd = t0 => drawShot(shotAt(t0) - 1, t0 - 1 / FPS);   // 从 t0 开始的镜头之前那个镜头的最后一帧
const B = n => bt(n);                                                 // 拍号 → 秒（写镜头时短一点）
const mixCol = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A_ = p(a), B_ = p(b); return '#' + A_.map((v, i) => Math.round(lerp(v, B_[i], clamp(k))).toString(16).padStart(2, '0')).join(''); };
const flipS = c => c >= 0 ? Math.max(.002, c) : Math.min(-.002, c);   // 翻页的缩放：过了 90° 变成负数（翻到另一边去）
const TINT = { dusk: ['#f2c088', .3], night: ['#7c88a8', .36], dawn: ['#f7d6a0', .2] };

// ---------- 速写本：一页纸占满画面，铅笔跟着正在画的那一笔 ----------
const PG = [110, 56, 1700, 884];   // 回忆页（S2～S5）的纸页矩形，底下留给歌词
function pageBG() { inkParts(sketchPage(...PG)); }
// items：[{a, b, draw(k) → 笔尖或 null, rest: [x, y]}]，每一项在 a..b 秒里画出来；铅笔停在正在画的那一笔的笔尖
function sketch(t, items, o = {}) {
  let tip = null, last = null;
  for (const it of items) {
    const k = it.a == null ? 1 : seg(t, it.a, it.b);
    if (k <= 0) continue;
    const tp = it.draw(k, t);
    if (k < 1 && tp) tip = tp;
    if (it.rest) last = it;
  }
  if (o.pencil === false) return;
  let at = tip, ang = -55;
  if (!at && last && last.rest) { const q = seg(t, last.b, last.b + .35); at = [last.rest[0] + 40 * E.out(q), last.rest[1] - 30 * E.out(q)]; }
  if (at) drawPencil(at[0], at[1], ang + (tip ? Math.sin(t * 40) * 3 : 0), { s: o.s || .8 });
}
// 粗糙的手画方框（速写里的小格子）
const roughRect = (x, y, w, h, seed = 1) => { const j = i => (hash(seed * 5 + i) - .5) * 8; return part(A.poly([[x + j(1), y + j(2)], [x + w + j(3), y + j(4)], [x + w + j(5), y + h + j(6)], [x + j(7), y + h + j(8)]], true), 4); };

// ---------- 转场 ----------
// 线圈本往上翻页：旧的一页绕顶边翻上去，露出底下的新页；k 0..1
function flipUp(k, over, under, top = PG[1]) {
  under();
  if (k >= 1) return;
  const c = Math.cos(Math.PI * E.inOut(k));
  P(A.rect(PG[0], top, PG[2], PG[3] * Math.max(0, c) + 30), { fill: INK, op: .12 * (1 - k) });   // 翻起来那页投下的影子
  G({ y: top }, () => G({ sy: flipS(c) }, () => G({ y: -top }, () => {
    if (c > 0) over(); else inkParts(sketchPage(...PG));
  })));
}
// 像书一样侧翻：旧页绕左边 x0 翻过去
function flipSide(k, over, under, x0 = PG[0]) {
  under();
  if (k >= 1) return;
  const c = Math.cos(Math.PI * E.inOut(k));
  G({ x: x0 }, () => G({ sx: flipS(c) }, () => G({ x: -x0 }, () => { if (c > 0) over(); else P(A.rect(...PG), { w: 4, fill: PAGE }); })));
}
// 铅笔排线涂满画面，再从中间擦开：k < .5 涂旧画面，k > .5 擦出新画面
function hatchWipe(k, over, under, seed = 1) {
  const n = 46, lines = () => { for (let i = 0; i < n; i++) { const x = -300 + i * 56, q = clamp(Math.min(k, 1 - k) * 2 * 1.6 - (hash(i + seed) * .6)); if (q > 0) P(A.line(x, -40, x + 600, H + 40), { w: 9, draw: q }); } };
  if (k < .5) { over(); flash(E.in(k * 2) * .85, PAGE); lines(); return; }
  under();
  const gap = E.out((k - .5) * 2) * (W + 400);
  for (const [x0, x1] of [[-400, W / 2 - gap / 2], [W / 2 + gap / 2, W + 400]]) if (x1 > x0) G({ clip: A.rect(x0, -50, x1 - x0, H + 100) }, () => { flash(.85, PAGE); for (let i = 0; i < n; i++) { const x = -300 + i * 56; P(A.line(x, -40, x + 600, H + 40), { w: 9 }); } });
}
// 甩镜头：画面整体往一边滑走 + 速度线；k 0..1，dir -1 往左甩
function whip(k, over, under, dir = -1) {
  const e = E.inOut(k);
  G({ x: dir * W * e }, over); G({ x: dir * W * (e - 1) }, under);
  speedLines(k);
}
