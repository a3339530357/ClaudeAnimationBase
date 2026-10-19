// 一帧：找到这一刻的镜头，画上去；镜头交接时两页各画一张，按转场方式拼起来；最后盖纸条字幕和片尾小卡。
// 给截图 / 渲染用的钩子：window.seek(t)、window.__ready、renderAt(t)、renderSheet(times)。?clean 不要播放条（云端渲染用）
'use strict';
ST.k = 1.6;                             // 投影大小（paper.js）

// [开始秒, 画这一镜的函数, 进这一镜用的转场, 转场时长]。转场在开始秒之前做完，新的一页正好落在拍上
const SHOTS = [
  [0, dreamScene, null, 0],             // 1 月亮船·紫粉夜空
  [bt(17), lakeScene, 'page', .38],     // 2 镜湖
  [bt(25), cliffScene, 'ripple', .36],  // 3 悬崖边·热气球
  [bt(32), cloudScene, 'rise', .26],    // 4 云上蹦床（13.71 s 鼓回）
  [bt(48), seaScene, 'slide', .3],      // 5 纸船出海
  [bt(60), dreamScene, 'iris', .42],    // 6 回到月亮船，鼓撤时折回去、封面合上
  [B68, wakeScene, null, 0],            // 7 醒来·彩虹草地（封面弹开就是转场）
  [bt(74), seasonScene, 'fold', .32],   // 8 一棵树下·四季
  [bt(81), wheelScene, 'wheel', .36],   // 9 摩天轮
  [bt(89), dayScene, 'slats', .38],     // 10 月亮船·金色白天
];
const shotAt = t => { let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++; return i; };

// 镜头：小节第一拍推一下、每小节左右轻轻歪一点；第 6 镜鼓撤时慢慢推到月芽身上，鼓回一下拉回全景
function camera(i, t) {
  const dp = downPulse(t), bar = Math.floor((t - BO) / BP / 4);
  let z = 1.03 + .03 * dp, cx = W / 2, cy = H / 2, rot = (bar % 2 ? 1 : -1) * .004;
  if (SHOTS[i][1] === dreamScene && t > 27 && t < B68) { const f = ease(seg(t, bt(66) - .1, B68 - .05)); z = lerp(1.03, 1.42, f) + .03 * dp; cx = lerp(W / 2, 650, f); cy = lerp(H / 2, 545, f); }
  if (i === 6) { const u = t - B68; z = 1.03 + .03 * dp + .12 * Math.exp(-u / .2) * Math.cos(u * 9); }
  return { z, cx, cy, rot };
}
function drawShot(ctx, i, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#f4ead8'; ctx.fillRect(0, 0, W, H);
  const c = camera(i, t);
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(c.rot); ctx.scale(c.z, c.z); ctx.translate(-c.cx, -c.cy);
  SHOTS[i][1](ctx, t);
  ctx.restore();
  if (SHOTS[i][1] === dreamScene && t > 20) covers(ctx, t);
}

// ---------- 转场：A = 旧的一页，B = 新的一页，p 从 0 到 1 ----------
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const CA = mk(), CB = mk(), AX = CA.getContext('2d'), BX = CB.getContext('2d');
const CREAM = '#f4ead8';
function pageEdge(ctx, x0, x1, dark) {       // 一条翻起来的纸边：奶白渐变 + 投影
  if (x1 - x0 < 1) return;
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, '#e9dcc3'); g.addColorStop(.55, '#fffaf0'); g.addColorStop(1, '#efe2c9');
  ctx.save(); ctx.shadowColor = `rgba(85,55,25,${.35 * dark})`; ctx.shadowBlur = 30; ctx.shadowOffsetX = -12;
  ctx.fillStyle = g; ctx.fillRect(x0, -10, x1 - x0, H + 20); ctx.restore();
}
const TRANS = {
  // 翻页：一页纸从右往左翻过去，翻起来的那一页是奶白的纸背
  page(ctx, p) {
    const e = ease(p), xb = W * (1 - e), cw = 260 * Math.sin(p * Math.PI);
    ctx.drawImage(CA, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.rect(xb, 0, W - xb, H); ctx.clip(); ctx.drawImage(CB, 0, 0); ctx.restore();
    pageEdge(ctx, xb - cw, xb, 1);
  },
  // 涟漪：从湖心扩开一圈水波
  ripple(ctx, p) {
    const r = Math.pow(ease(p), 1.3) * 2300, cx = 900, cy = 800;
    ctx.drawImage(CA, 0, 0);
    if (r < 2) return;
    const wob = a => r + Math.sin(a * 9 + p * 12) * 14 * (1 - p);
    const path = new Path2D();
    for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 2, rr = wob(a); i ? path.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .8) : path.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .8); }
    ctx.save(); ctx.clip(path); ctx.drawImage(CB, 0, 0); ctx.restore();
    ctx.save(); ctx.shadowColor = 'rgba(85,55,25,.3)'; ctx.shadowBlur = 14; ctx.lineWidth = 16; ctx.strokeStyle = '#eaf6ff'; ctx.stroke(path); ctx.restore();
  },
  // 上冲：镜头跟着气球往上冲，旧页往下掉，新页从上面落下来
  rise(ctx, p) {
    const e = Math.pow(p, 1.6);
    ctx.drawImage(CA, 0, H * e);
    ctx.drawImage(CB, 0, -H * (1 - e));
    ctx.save(); ctx.fillStyle = 'rgba(85,55,25,.18)'; ctx.fillRect(0, H * e - 2, W, 6); ctx.restore();
  },
  // 拉页：新的一页带着一个小拉条从右边推进来
  slide(ctx, p) {
    const e = ease(p), x = W * (1 - e);
    ctx.drawImage(CA, -W * .3 * e, 0);
    ctx.save(); ctx.fillStyle = `rgba(60,40,25,${.25 * e})`; ctx.fillRect(0, 0, x, H); ctx.restore();
    ctx.save(); ctx.shadowColor = 'rgba(85,55,25,.4)'; ctx.shadowBlur = 26; ctx.shadowOffsetX = -10; ctx.fillStyle = CREAM; ctx.fillRect(x, 0, W, H); ctx.restore();
    ctx.drawImage(CB, x, 0);
    ctx.save(); ctx.translate(x, H / 2); paper(ctx, [smooth([[2, -70], [-56, -58], [-64, 0], [-56, 58], [2, 70]], 5)], '#f47c6a', { lift: 1.4 }); ctx.restore();
  },
  // 钻月亮：海上的月亮放大成一扇圆窗，钻进去
  iris(ctx, p) {
    const r = Math.pow(ease(p), 2.2) * 2300, cx = 1450, cy = 330;
    ctx.drawImage(CA, 0, 0);
    if (r < 2) return;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(CB, 0, 0); ctx.restore();
    ctx.save(); ctx.shadowColor = 'rgba(85,55,25,.35)'; ctx.shadowBlur = 18; ctx.lineWidth = 22; ctx.strokeStyle = '#ffe58f';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  },
  // 折下：旧的一页像立体书的一层一样往下折平，露出后面的新页
  fold(ctx, p) {
    const e = Math.pow(p, 1.5);
    ctx.drawImage(CB, 0, 0);
    ctx.save(); ctx.fillStyle = `rgba(85,55,25,${.3 * (1 - e)})`; ctx.fillRect(0, H - 40, W, 40); ctx.restore();
    ctx.save(); ctx.translate(0, H); ctx.scale(1, Math.max(.001, 1 - e)); ctx.translate(0, -H);
    ctx.filter = `brightness(${(1 - .35 * e).toFixed(3)})`; ctx.drawImage(CA, 0, 0); ctx.restore();
  },
  // 转盘：两页绕着画面下面很远的一个点转，像立体书里的转盘
  wheel(ctx, p) {
    const e = ease(p), px = W / 2, py = H + 1500, A = .62;
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
    for (const [cv, ang] of [[CA, -A * e], [CB, A * (1 - e)]]) {
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.translate(-px, -py);
      ctx.shadowColor = 'rgba(85,55,25,.35)'; ctx.shadowBlur = 24; ctx.drawImage(cv, 0, 0); ctx.restore();
    }
  },
  // 百叶：竖条一条条翻过去
  slats(ctx, p) {
    const N = 8, sw = W / N;
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < N; k++) {
      const q = seg(p, k * .07, k * .07 + .5), cv = q < .5 ? CA : CB, sx = Math.abs(Math.cos(q * Math.PI));
      ctx.save(); ctx.translate(k * sw + sw / 2, 0); ctx.scale(Math.max(.002, sx), 1);
      ctx.filter = `brightness(${(.75 + .25 * sx).toFixed(3)})`;
      ctx.drawImage(cv, k * sw, 0, sw, H, -sw / 2, 0, sw, H); ctx.restore();
    }
  },
};

// ---------- 片尾小卡：右下角，42.95 s 从右边滑进来，两头贴胶带 ----------
function endCard(ctx, t) {
  const t0 = 42.95; if (t < t0) return;
  const k = backOut(seg(t, t0, t0 + .32)), x = lerp(W + 300, 1610, k), y = 952, w = 470, h = 158;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rad(-2.5 + 2 * (1 - k)));
  paper(ctx, [smooth([[-w / 2, -h / 2], [w / 2, -h / 2 + 4], [w / 2 - 3, h / 2], [-w / 2 + 2, h / 2 - 3]], 2)], '#fffaf0', { lift: 1.8 });
  ctx.fillStyle = '#3d2b22'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = "66px 'MaShan', serif"; ctx.fillText('最美的期待', 0, -26);
  ctx.font = "40px 'MaShan', serif"; ctx.fillStyle = '#7a5a48'; ctx.fillText('MV 制作  小冰OvO', 0, 42);
  [[-1, t0 + .3], [1, t0 + .38]].forEach(([s, tt]) => {
    const q = seg(t, tt, tt + .1); if (q <= 0) return;
    ctx.save(); ctx.translate(s * (w / 2 - 10), -h / 2 + 6); ctx.rotate(rad(s * 32)); ctx.globalAlpha = .85 * q;
    ctx.fillStyle = s < 0 ? '#ffd9a8' : '#bfe7df'; ctx.fillRect(-48, -14, 96, 28); ctx.restore();
  });
  ctx.restore();
}

// ---------- 一帧 ----------
const outC = document.getElementById('out'), X = outC.getContext('2d');
const LYC = document.createElement('canvas'); LYC.width = W; LYC.height = H; const LX = LYC.getContext('2d');
const BEATS = Array.from({ length: 106 }, (_, n) => bt(n));
function renderFrame(t) {
  ST.frame = Math.floor(t * 12);
  const i = shotAt(t), nx = SHOTS[i + 1];
  if (nx && nx[2] && t > nx[0] - nx[3]) {
    drawShot(AX, i, t); drawShot(BX, i + 1, t);
    X.setTransform(1, 0, 0, 1, 0, 0); X.filter = 'none'; X.globalAlpha = 1;
    TRANS[nx[2]](X, seg(t, nx[0] - nx[3], nx[0]));
  } else drawShot(X, i, t);
  X.setTransform(1, 0, 0, 1, 0, 0); X.filter = 'none'; X.globalAlpha = 1;
  // 纸白闪：13.71 s 和 29.05 s 两次鼓回
  for (const [tb, a] of [[bt(32), .45], [B68, .55]]) if (t >= tb && t < tb + .3) { X.fillStyle = `rgba(255,250,240,${a * Math.exp(-(t - tb) / .07)})`; X.fillRect(0, 0, W, H); }
  // 歌词：纸条贴字（全片 12 句）；最后一句在音乐断掉后撕走，给片尾小卡让位
  LX.setTransform(1, 0, 0, 1, 0, 0); LX.clearRect(0, 0, W, H);
  lyricFX(LX, t, { lines: LY, style: 'slip', W, H, beats: BEATS, ink: '#3d2b22', paper: '#fffaf0', dim: '#c9bba9', size: { slip: 94 },
                   fonts: { slip: "'MaShan',serif" }, boil: tt => Math.floor(tt * 12), ripDown: true, lastUntil: 42.78 });
  X.drawImage(LYC, 0, 0);
  endCard(X, t);
}

// ---------- 钩子 ----------
const QS = new URLSearchParams(location.search);
window.renderAt = async (t, type, q = .9) => { renderFrame(t); return type ? outC.toDataURL(type, q) : null; };
window.renderSheet = async (times, cols = 4, w = 480) => {
  const h = Math.round(w * H / W), sc = document.createElement('canvas'), ms = [];
  sc.width = cols * w; sc.height = Math.ceil(times.length / cols) * h; const c = sc.getContext('2d');
  times.forEach((t, i) => {
    const t0 = performance.now(); renderFrame(t); ms.push(Math.round(performance.now() - t0));
    const x = (i % cols) * w, y = Math.floor(i / cols) * h;
    c.drawImage(outC, x, y, w, h); c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x, y + h - 22, 76, 22); c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText(t.toFixed(2) + 's', x + 6, y + h - 6);
  });
  return { url: sc.toDataURL('image/jpeg', .88), ms };
};
window.seek = t => renderFrame(t);
(async () => {
  const ff = new FontFace('MaShan', `url(${MASHAN_URL})`); document.fonts.add(await ff.load());
  if (QS.has('clean')) document.documentElement.classList.add('clean');
  renderFrame(+(QS.get('t') || 0));
  window.__ready = window.ready = true;
})();
