// 第 5 镜（20.53–25.64 s）「忘了是非 没有伤悲 / 无怨无悔」第二遍：纸船·橘粉黄昏海。
// 两人坐着一只折纸船出海，四层浪每拍起伏（后面的浪先动、前面的晚一点）；第 50、52、54 拍纸鱼跳出水面（最高点压拍）；
// 第 56 拍彩虹纸带升起来变成船帆；「无怨无悔」月亮从海平线升起越来越大，第 60 拍钻进月亮
'use strict';
const SEA_SKY = ['#ffb3a7', '#ffc1a3', '#ffd0a6', '#ffdfb0', '#ffecc0'];
const S_WAVES = [[585, 18, 150, '#9edcec'], [660, 22, 190, '#7fcbe6'], [760, 26, 230, '#5fb6df'], [822, 30, 270, '#4aa3d6']];
const S_FISH = [[50, 380, 700, '#ff8a7a'], [52, 1560, 1240, '#ffd23f'], [54, 520, 880, '#ff9fc2']];

function waveShape(y0, amp, wl, seed) {
  const p = [];
  for (let x = -wl * 2; x <= W + wl * 2; x += 16) p.push([x, y0 - amp * Math.abs(Math.sin(Math.PI * x / wl + seed))]);
  p.push([W + wl * 2, H + 80], [-wl * 2, H + 80]);
  return p;
}
function drawWave(ctx, k, t) {
  const [y0, amp, wl, col] = S_WAVES[k], dir = k % 2 ? 1 : -1;
  const sx = ((t * (22 + k * 10) * dir) % wl + wl) % wl - wl;            // 横着慢慢流
  const by = -10 * bump(t, bt(Math.round((t - BO) / BP)) + k * .05, .16) * ECHO(t) - Math.sin(t * 1.3 + k) * 4;
  ctx.save(); ctx.translate(sx, by); pc(ctx, 's-wave' + k, () => waveShape(y0, amp, wl, k * .7), col, { lift: 1.2 + k * .2, step: 12 }); ctx.restore();
}
const BOAT_SAIL = () => [[-120, -64], [120, -64], [0, -330]];
function paperBoat(ctx, t, bp) {
  const roll = Math.sin(t * 1.6) * .025 + .02 * bp * (Math.round((t - BO) / BP) % 2 ? 1 : -1);
  ctx.save(); ctx.translate(930, 742 - 10 * bp + Math.sin(t * 1.6) * 5); ctx.rotate(roll);
  // 船帆：白纸三角，第 56 拍彩虹纸带从下往上铺满
  pc(ctx, 's-sail', BOAT_SAIL, '#fffaf0', { lift: 1.4 });
  pc(ctx, 's-sailS', () => [[0, -64], [120, -64], [0, -330]], '#f1e5cf', { lift: 0, edge: false });
  const ks = popK(t, bt(56), .18);
  if (ks > .01) stand(ctx, -64, ks, () => {
    ctx.save(); ctx.clip(pathOf(cut('s-sail', BOAT_SAIL)));
    RAINBOW.forEach((c, i) => pc(ctx, 's-band' + i, () => rect(-140, -330 + i * 45, 280, 47), c, { lift: 0, edge: false }));
    ctx.restore();
  });
  // 两个人坐在船里（腿被船身挡住）
  drawYue(ctx, { x: -105, y: 40, s: .78, id: 'ySea', look: 1, open: 1, mouth: 'grin', armL: 20 + 40 * bump(t, bt(52), .3), armR: 30, sq: bp * .6, hair: Math.sin(t * 2.5) * 5 + 4 });
  drawQing(ctx, { x: 105, y: 40, s: .78, t, id: 'qSea', look: -1, sq: bp, mouth: 'grin', armL: 30, armR: 20 + 130 * popK(t, bt(56) - .05) * (1 - ramp(t, bt(57), bt(58))) });
  // 船身：折纸船的梯形 + 两边的折角
  pc(ctx, 's-hull', () => [[-330, -70], [330, -70], [230, 50], [-230, 50]], '#fff6e6', { lift: 1.8 });
  pc(ctx, 's-hullF', () => [[-330, -70], [-150, -70], [-200, 50], [-230, 50]], '#efe1c7', { lift: .2, edge: false });
  pc(ctx, 's-hullF2', () => [[330, -70], [150, -70], [200, 50], [230, 50]], '#efe1c7', { lift: .2, edge: false });
  pc(ctx, 's-hullL', () => ribbon(line([[-300, -50], [0, -42], [300, -50]]), 6), '#e3d2b4', { lift: 0, edge: false });
  ctx.restore();
}
function drawFish(ctx, key, col) {
  pc(ctx, key + 'b', () => ell(0, 0, 54, 26, 24), col, { lift: 1 });
  pc(ctx, key + 't', () => [[-44, 0], [-84, -26], [-76, 0], [-84, 26]], col, { lift: .9 });
  pc(ctx, key + 'f', () => [[0, -22], [18, -40], [24, -20]], col, { lift: .6 });
  ctx.fillStyle = '#3b2a22'; ctx.beginPath(); ctx.arc(30, -6, 5, 0, 6.283); ctx.fill();
}

function seaScene(ctx, t) {
  const bp = beatPulse(t);
  sky(ctx, SEA_SKY, t, 'sband', [-40, 150, 270, 380, 480]);
  // 夕阳慢慢沉下去
  ctx.save(); ctx.translate(430, 560 + seg(t, bt(48), bt(60)) * 70); paperSun(ctx, 's-sun', 120, t * .4, '#ffb347', '#ff9a4d'); ctx.restore();
  // 月亮：第 57 拍起从海平线升起来，越来越大（第 60 拍钻进去）
  const mf = ease(seg(t, bt(56.5), bt(59.6)));
  if (mf > 0) { ctx.save(); ctx.translate(1450, lerp(640, 330, mf)); ctx.scale(lerp(.55, 1.15, mf) * (1 + .05 * bp), lerp(.55, 1.15, mf) * (1 + .05 * bp)); ctx.rotate(-.5); pc(ctx, 's-moon', () => crescent(120, 50, 110), '#ffe58f', { lift: 1.6, step: 8 }); ctx.restore(); }
  // 两只纸海鸥
  [[700, 200], [820, 150]].forEach(([x, y], i) => { const f = Math.sin(t * 9 + i) * .4; ctx.save(); ctx.translate(x + (t - bt(48)) * 40, y + Math.sin(t + i) * 8);
    ctx.save(); ctx.rotate(-f * .4); pc(ctx, 's-gullL', () => [[0, 0], [-40, -16], [-30, 3]], '#fffaf0', { lift: .6, step: 5 }); ctx.restore();
    ctx.save(); ctx.rotate(f * .4); pc(ctx, 's-gullR', () => [[0, 0], [40, -16], [30, 3]], '#fffaf0', { lift: .6, step: 5 }); ctx.restore(); ctx.restore(); });
  drawWave(ctx, 0, t); drawWave(ctx, 1, t);
  // 纸鱼：起跳 → 最高点压拍 → 落回水里，前后溅两圈水花
  S_FISH.forEach(([n, x0, x1, col], i) => {
    const f = seg(t, bt(n) - .38, bt(n) + .38); if (f <= 0 || f >= 1) return;
    const x = lerp(x0, x1, f), y = 690 - 4 * 260 * f * (1 - f), dir = x1 > x0 ? 1 : -1;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.rotate((f - .5) * 1.6); drawFish(ctx, 's-fish' + i, col); ctx.restore();
  });
  S_FISH.forEach(([n, x0, x1], i) => [[x0, bt(n) - .38], [x1, bt(n) + .38]].forEach(([x, t0], j) => {
    const u = t - t0; if (u < 0 || u > .5) return;
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * .45; ctx.save(); ctx.globalAlpha = 1 - u / .5; ctx.translate(x + Math.cos(a) * u * 260, 690 + Math.sin(a) * u * 300 + u * u * 600); pc(ctx, 's-spl', () => ell(0, 0, 9, 9, 10), '#eaf8ff', { lift: .4, step: 4 }); ctx.restore(); }
  }));
  drawWave(ctx, 2, t);
  paperBoat(ctx, t, bp);
  drawWave(ctx, 3, t);
}
