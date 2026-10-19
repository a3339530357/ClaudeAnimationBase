// 第 2 镜（7.32–10.73 s）「静闭上了眼 你却又浮现」：镜湖·淡紫夜。
// 月芽站在湖边拉着彩虹纸带（另一头垂进水里），第 18 拍闭上眼；每拍湖面一圈涟漪；
// 第 21 拍「你」湖里浮出阿晴的倒影；第 23 拍「现」他踩着荷叶从水面立起来，纸带那头到了他手里，她睁眼；第 24 拍两人中间冒心
'use strict';
const LAKE_SKY = ['#bcb2ea', '#c9bbef', '#d8c5f0', '#e6cfee', '#f1d9ec'];
const LAKE = { x: 1080, y: 790, rx: 660, ry: 150 };
const L_DROP = [880, 805], L_HIM = 1290;
const L_PADS = [[620, 842, 46], [1530, 852, 52], [1690, 778, 40], [760, 752, 34], [1110, 870, 38]];
const L_FLY = Array.from({ length: 14 }, (_, i) => { const r = mulberry(i * 131 + 7); return [120 + r() * 1700, 380 + r() * 380, r() * 6.28]; });

function lilyPad(rx, ry) { const p = [[0, 0]]; for (let i = 0; i <= 30; i++) { const a = .4 + i / 30 * (Math.PI * 2 - .8); p.push([Math.cos(a) * rx, Math.sin(a) * ry]); } return p; }
function reed(h, lean) { return ribbon(line([[0, 0], [lean * .3, -h * .4], [lean, -h]]), 14, 4); }

function lakeScene(ctx, t) {
  const bp = beatPulse(t);
  sky(ctx, LAKE_SKY, t, 'lband', [-40, 150, 290, 410, 520]);
  // 月亮和星星
  popAt(ctx, 1560, 190, 1 + .06 * bp, () => {
    pc(ctx, 'l-moon', () => ell(0, 0, 105, 105, 40), '#fff1b0', { lift: 1.2 });
    pc(ctx, 'l-moonC', () => ell(-30, -20, 18, 14, 16), '#f6e08a', { lift: 0 });
    pc(ctx, 'l-moonC2', () => ell(28, 32, 12, 10, 14), '#f6e08a', { lift: 0 });
  });
  STARS.forEach(([x, y, r], i) => {
    if (i % 2) return;
    popAt(ctx, x, y * .9 + Math.sin(t * 1.5 + i) * 4, .85 * (1 + .35 * bump(t, bt(17 + (i % 4)), .15) + .1 * bp), () => { ctx.rotate(Math.sin(t + i) * .2); pc(ctx, 'l-st' + (i % 3), () => star(r, r * .45), '#fff4bd', { lift: .8, step: 5 }); });
  });
  // 远山、岸
  ctx.save(); ctx.translate(0, -3 * bp);
  pc(ctx, 'l-hill', () => hills(690, 70, 2.5, 3.3), '#c7b5ea', { lift: 1.6, step: 14, amp: 2 });
  ctx.restore();
  pc(ctx, 'l-ground', () => hills(745, 22, 4, 1.7), '#d9c7f2', { lift: 1.8, step: 14, amp: 2 });
  // 湖：岸边一圈浅色，水两层
  pc(ctx, 'l-lake0', () => ell(LAKE.x, LAKE.y, LAKE.rx + 28, LAKE.ry + 20, 60), '#f2e6ff', { lift: .4 });
  pc(ctx, 'l-lake', () => ell(LAKE.x, LAKE.y, LAKE.rx, LAKE.ry, 60), '#8fbbea', { lift: 0 });
  pc(ctx, 'l-lake2', () => ell(LAKE.x + 40, LAKE.y + 22, LAKE.rx * .8, LAKE.ry * .66, 60), '#a6cbf2', { lift: 0 });
  ctx.save(); ctx.beginPath(); ctx.ellipse(LAKE.x, LAKE.y, LAKE.rx, LAKE.ry, 0, 0, Math.PI * 2); ctx.clip();
  // 月亮的倒影：几片晃动的黄纸
  for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(1560 + Math.sin(t * 2 + k) * 12, 690 + k * 28); pc(ctx, 'l-mr' + k, () => ell(0, 0, 72 - k * 13, 7, 16), '#fff1b0', { lift: 0, alpha: .85 }); ctx.restore(); }
  // 涟漪：每拍从纸带垂下去的地方扩开一圈；第 21、23 拍在阿晴那里扩开一大圈
  for (let n = 17; n <= 25; n++) {
    const u = t - bt(n) + .05; if (u < 0 || u > 1.3) continue;
    const big = n === 21 || n === 23, cx = big ? L_HIM : L_DROP[0], cy = big ? LAKE.y : L_DROP[1];
    if (!big && n > 22) continue;
    const r = 26 + u * (big ? 560 : 340);
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - u / 1.3) * .85;
    paper(ctx, ringPts(cx, cy, r, r * .24, big ? 12 : 8), '#e8f4ff', { lift: .4, grain: false });
    ctx.restore();
  }
  // 倒影：第 21 拍浮出来（上下颠倒、半透明，跟着水波晃）
  const kr = popK(t, bt(21), .3);
  if (kr > .01) {
    ctx.save(); ctx.globalAlpha = .5 * Math.min(1, kr);
    ctx.translate(Math.sin(t * 3) * 7, 2 * LAKE.y - 16); ctx.scale(1, -1);
    drawQing(ctx, { x: L_HIM, y: LAKE.y - 8, s: 1.05 * Math.min(1.08, kr), t, id: 'qRef', look: -1, mouth: 'smile', armL: 6 + 34 * popK(t, bt(23)) });
    ctx.restore();
  }
  ctx.restore();
  // 荷叶（第 18、19 拍）、荷花（第 22 拍）
  L_PADS.forEach(([x, y, r], i) => popAt(ctx, x, y + Math.sin(t * 2 + i) * 3, popK(t, bt(18 + (i % 2)) + i * .04, .3), () => {
    ctx.scale(1, .42); ctx.rotate(i * 1.3); pc(ctx, 'l-pad' + (i % 3), () => lilyPad(r * 1.6, r * 1.6), i % 2 ? '#7fcf8f' : '#6cc285', { lift: .6, step: 6 });
  }));
  [[620, 830], [1530, 838]].forEach(([x, y], i) => popAt(ctx, x, y, 1.1 * popK(t, bt(22) + i * .06, .35) * (1 + .1 * bp), () => {
    for (let k = 0; k < 6; k++) { ctx.save(); ctx.rotate(-Math.PI / 2 + (k - 2.5) * .42); pc(ctx, 'l-lotus', () => ell(0, -20, 10, 24, 14), k % 2 ? '#ffc2d1' : '#ff9fbf', { lift: .5, step: 5 }); ctx.restore(); }
  }));
  // 阿晴：第 23 拍踩着荷叶从水面立起来
  const kq = popK(t, bt(23), .25);
  stand(ctx, LAKE.y - 6, kq, () => {
    ctx.save(); ctx.translate(L_HIM, LAKE.y + 2); ctx.scale(1, .42); pc(ctx, 'l-padQ', () => lilyPad(110, 110), '#7fcf8f', { lift: .8, step: 6 }); ctx.restore();
    drawQing(ctx, { x: L_HIM, y: LAKE.y - 8, s: 1.05, t, id: 'qLake', look: -1, sq: bp, mouth: t > bt(24) - .1 ? 'grin' : 'smile', armL: 6 + 34 * kq, armR: 6 + 120 * popK(t, bt(24)) * (1 - ramp(t, bt(24) + .3, bt(25))), waveR: Math.sin(t * 17) * 12 });
  });
  // 彩虹纸带：月芽手里一头，另一头先垂在水里；第 23 拍那头到了阿晴手里
  const her = [448, 716 - 4 * bp], f = ease(seg(t, bt(23) - .12, bt(23) + .12));
  const end = [lerp(L_DROP[0], 1170, f), lerp(L_DROP[1], 650, f) - Math.sin(f * Math.PI) * 60];
  rainbowStrip(ctx, sagLine(her[0], her[1], end[0], end[1], lerp(34, 46, f), t, 6 + 8 * bump(t, bt(23), .2)), 26, { lift: 1 });
  // 月芽：拉着纸带，第 18 拍闭眼、左手按在胸口；第 23 拍睁眼（惊讶），第 24 拍笑
  const shut = t > bt(18) - .05 && t < bt(23) - .05, wow = popK(t, bt(23), .4);
  drawYue(ctx, { x: 330, y: 860, s: 1.12, id: 'yLake', open: shut ? 0 : t > bt(23) - .05 ? Math.max(.4, wow) : 1, look: shut ? .3 : 1, sq: bp * .6,
    mouth: shut ? 'smile' : t > bt(24) - .1 ? 'grin' : t > bt(23) - .05 ? 'o' : 'smile', armR: 48, armL: t > bt(18) - .1 && t < bt(23) ? -30 : 8 + 20 * bump(t, bt(24), .25),
    hair: Math.sin(t * 2.2) * 3 + bp * 4, clip: bump(t, bt(23), .25) });
  // 第 24 拍：两人中间冒一颗心
  popAt(ctx, 800, 430 - seg(t, bt(24), bt(25)) * 40, popK(t, bt(24), .35), () => heartPiece(ctx, 'l-heart', 46));
  // 前景芦苇（翻页进来就在，拍上晃一下）
  [[70, 1080, 330, -30], [150, 1080, 260, 20], [1790, 1080, 340, 30], [1860, 1080, 270, -25], [250, 1080, 200, 10]].forEach(([x, y, h, lean], i) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.4 + i) * .04 + .05 * bp * (i % 2 ? 1 : -1));
    pc(ctx, 'l-reed' + i, () => reed(h, lean), i % 2 ? '#9cc89a' : '#86b98c', { lift: 1.2, step: 8 });
    if (i < 4) { ctx.save(); ctx.translate(lean * .95, -h * .97); ctx.rotate(lean * .004); pc(ctx, 'l-cat', () => capsule(46, 9, 9), '#b07a52', { lift: .8, step: 5 }); ctx.restore(); }
    ctx.restore();
  });
  // 萤火虫：拍上亮一下
  L_FLY.forEach(([x, y, ph], i) => {
    const k = .55 + .45 * Math.sin(t * 3 + ph) + .6 * bp;
    ctx.save(); ctx.globalAlpha = Math.min(1, .35 + .4 * k);
    const g = ctx.createRadialGradient(x + Math.sin(t + ph) * 20, y + Math.cos(t * .8 + ph) * 14, 0, x + Math.sin(t + ph) * 20, y + Math.cos(t * .8 + ph) * 14, 16 * k + 6);
    g.addColorStop(0, '#fffbd0'); g.addColorStop(.4, 'rgba(255,240,140,.8)'); g.addColorStop(1, 'rgba(255,240,140,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 60, y - 60, 120, 120); ctx.restore();
  });
}
