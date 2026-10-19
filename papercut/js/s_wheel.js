// 第 9 镜（34.59–38.00 s）「舍不得分开 在每一次醒来」：摩天轮·粉黄清晨。
// 彩虹色摩天轮一拍转一小格（回弹顶点压拍），两人坐在同一个大吊舱里；太阳每拍升一截；
// 第 85 拍吊舱转到最高、头顶冒心；第 86、87 拍纸鸟飞过；第 88 拍「醒来」太阳整个跳出来
'use strict';
const WHEEL_SKY = ['#ffd3e2', '#ffdcd5', '#ffe6c8', '#fff0cc', '#fff8e0'];
const WH = { x: 880, y: 420, R: 315 };
const CAB_COL = ['#ff6b6b', '#ffa94d', '#ffd93d', '#6bcb77', '#4d96ff', '#9b72e8', '#ff9fc2', '#4dbfb0'];

function wheelAngle(t) { return Math.PI + steps(t, [82, 83, 84, 85, 86, 87, 88].map(bt), .22) * Math.PI / 8; }
// 小吊舱：原点在挂点
function cabin(ctx, key, col) {
  pc(ctx, 'w-hang', () => rect(-3, 0, 6, 26), '#8a6a55', { lift: .3, grain: false });
  pc(ctx, key, () => smooth([[-34, 24], [34, 24], [40, 60], [30, 86], [-30, 86], [-40, 60]], 4), col, { lift: 1 });
  pc(ctx, 'w-win', () => rect(-24, 34, 48, 22), '#fffaf0', { lift: 0, edge: false });
}

function wheelScene(ctx, t) {
  const bp = beatPulse(t), ang = wheelAngle(t);
  sky(ctx, WHEEL_SKY, t, 'wband', [-40, 190, 340, 480, 610]);
  // 太阳：每拍升一截，第 88 拍整个跳出来
  const sy = 900 - steps(t, [81, 82, 83, 84, 85, 86, 87].map(bt), .2) * 70 - 90 * popK(t, bt(88), .3);
  ctx.save(); ctx.translate(1560, sy); ctx.scale(1 + .2 * bump(t, bt(88), .25), 1 + .2 * bump(t, bt(88), .25)); paperSun(ctx, 'w-sun', 110, t); ctx.restore();
  pc(ctx, 'w-far', () => hills(800, 70, 2, 2.7), '#ffd0dc', { lift: 1.4, step: 14, amp: 2 });
  // 支架
  pc(ctx, 'w-legL', () => [[WH.x - 14, WH.y], [WH.x + 6, WH.y], [WH.x - 210, 900], [WH.x - 250, 900]], '#d9c4f2', { lift: 1.2 });
  pc(ctx, 'w-legR', () => [[WH.x - 6, WH.y], [WH.x + 14, WH.y], [WH.x + 250, 900], [WH.x + 210, 900]], '#d9c4f2', { lift: 1.2 });
  // 轮子：外圈、内圈、八根辐条，跟着转
  ctx.save(); ctx.translate(WH.x, WH.y); ctx.rotate(ang);
  for (let k = 0; k < 8; k++) { ctx.save(); ctx.rotate(k * Math.PI / 4); pc(ctx, 'w-spoke', () => rect(-5, 0, 10, WH.R), '#f3e6ff', { lift: .6 }); ctx.restore(); }
  paper(ctx, cut('w-rim', () => ringPts(0, 0, WH.R, WH.R, 26, 72)), '#ffffff', { lift: 1.4 });
  paper(ctx, cut('w-rim2', () => ringPts(0, 0, WH.R * .55, WH.R * .55, 14, 56)), '#ffe0ec', { lift: .8 });
  for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; ctx.save(); ctx.translate(Math.cos(a) * WH.R, Math.sin(a) * WH.R); pc(ctx, 'w-bulb', () => ell(0, 0, 8, 8, 10), (k + Math.round((t - BO) / BP)) % 2 ? '#ffd23f' : '#fffaf0', { lift: .4, step: 4 }); ctx.restore(); }
  ctx.restore();
  pc(ctx, 'w-hub', () => ell(WH.x, WH.y, 34, 34, 24), '#ff9fc2', { lift: 1.2 });
  // 七个小吊舱（一直朝下挂着）
  for (let k = 1; k < 8; k++) {
    const a = ang + k * Math.PI / 4, x = WH.x + Math.cos(a) * WH.R, y = WH.y + Math.sin(a) * WH.R;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + k) * .04 + .05 * bp * Math.cos(a)); cabin(ctx, 'w-cab' + k, CAB_COL[k]); ctx.restore();
  }
  // 他们的大吊舱：后片 → 两个人（只露上半身）→ 前片 → 顶
  const a0 = ang, cx = WH.x + Math.cos(a0) * WH.R, cy = WH.y + Math.sin(a0) * WH.R;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t * 2) * .05 - .06 * bp); ctx.scale(1.55, 1.55);
  pc(ctx, 'w-hang', () => rect(-3, 0, 6, 26), '#8a6a55', { lift: .3, grain: false });
  pc(ctx, 'w-bigB', () => smooth([[-62, 30], [62, 30], [70, 100], [60, 168], [-60, 168], [-70, 100]], 4), '#ffe9a8', { lift: 1.2 });
  drawYue(ctx, { x: -26, y: 166, s: .32, id: 'yWheel', look: 1, open: 1, mouth: t > bt(85) - .1 ? 'grin' : 'smile', sq: bp * .6, armL: 10, armR: 10, hair: Math.sin(t * 2.4) * 3, clip: bump(t, bt(85), .25) });
  drawQing(ctx, { x: 28, y: 166, s: .32, t, id: 'qWheel', look: -1, sq: bp, mouth: 'grin', armL: 10, armR: 10 });
  pc(ctx, 'w-bigF', () => smooth([[-68, 112], [68, 112], [62, 168], [-62, 168]], 3), '#ff6b6b', { lift: 1.2 });
  pc(ctx, 'w-bigS', () => rect(-66, 124, 132, 8), '#ffd23f', { lift: .2, edge: false });
  pc(ctx, 'w-roof', () => smooth([[-70, 34], [0, 6], [70, 34], [64, 44], [-64, 44]], 4), '#ff6b6b', { lift: 1 });
  ctx.restore();
  // 第 85 拍：转到最高，头顶冒心
  popAt(ctx, cx, cy - 40 - seg(t, bt(85), bt(87)) * 40, popK(t, bt(85), .35) * (1 + .12 * bump(t, bt(86), .2)), () => heartPiece(ctx, 'w-heart', 44));
  // 地：一排小山包 + 第 86、87 拍纸鸟飞过
  pc(ctx, 'w-ground', () => hills(905, 30, 3.5, 1.4), '#bfe6a0', { lift: 1.8, step: 14, amp: 2 });
  [[86, 120], [87, 220]].forEach(([n, y], i) => { const u = t - bt(n) + .2; if (u < 0) return; const f = Math.sin(t * 12 + i) * .5;
    ctx.save(); ctx.translate(-80 + u * 900, y - u * 60); ctx.scale(1.3, 1.3);
    ctx.save(); ctx.rotate(-f * .4); pc(ctx, 'w-birdL', () => [[0, 0], [-34, -14], [-26, 2]], '#fffaf0', { lift: .6, step: 5 }); ctx.restore();
    ctx.save(); ctx.rotate(f * .4); pc(ctx, 'w-birdR', () => [[0, 0], [34, -14], [26, 2]], '#fffaf0', { lift: .6, step: 5 }); ctx.restore(); ctx.restore(); });
}
