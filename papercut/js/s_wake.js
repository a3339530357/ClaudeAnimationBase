// 第 7 镜（29.05–31.61 s）：醒来·彩虹草地。样片 D 原样保留
'use strict';
// ---------- 醒来（29.05 s 鼓回之后）----------
function wakeScene(ctx, t) {
  const bp = beatPulse(t), u = t - B68;
  sky(ctx, WAKE_SKY, t);
  // 太阳（第 69 拍）
  popAt(ctx, 1600, 200, popK(t, bt(69), .3) * (1 + .08 * bp), () => {
    ctx.save(); ctx.rotate(t * .5);
    for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * Math.PI / 6); pc(ctx, 'ray' + (i % 2), () => [[-14, -112], [0, -150 - (i % 2) * 18], [14, -112]], '#ffb84d', { lift: .6, step: 6 }); ctx.restore(); }
    ctx.restore();
    pc(ctx, 'sun', () => ell(0, 0, 96, 96, 40), '#ffd23f', { lift: 1.2 });
  });
  // 彩虹：鼓回那一下从左往右展开，第 71 拍每一道依次跳一下
  const sweep = ease(seg(t, B68 - .03, B68 + .36));
  if (sweep > 0) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(960, 905); ctx.arc(960, 905, 1000, Math.PI, Math.PI * (1 + sweep)); ctx.closePath(); ctx.clip();
    RAINBOW.forEach((c, i) => {
      const jump = 16 * bump(t, bt(71) + i * .03, .12) + 6 * bp;
      ctx.save(); ctx.translate(960, 905 - jump); ctx.scale(1 + jump * .0006, 1);
      pc(ctx, 'arch' + i, () => ribbon(arcPts(0, 0, 690 - i * 46, Math.PI, Math.PI * 2, 60), 48), c, { lift: 1.3, step: 12 });
      ctx.restore();
    });
    ctx.restore();
  }
  // 云（鼓回跟着立起来）
  stand(ctx, 360, popK(t, B68 + .05), () => { ctx.save(); ctx.translate(250 + Math.sin(t * .7) * 8, 300); pc(ctx, 'wcL2', () => cloud(340, 130, 3), '#e3f4ff', { lift: 1 }); ctx.translate(30, 18); pc(ctx, 'wcL1', () => cloud(300, 120, 4), '#ffffff', { lift: 1.4 }); ctx.restore(); });
  stand(ctx, 420, popK(t, B68 + .08), () => { ctx.save(); ctx.translate(1700 + Math.sin(t * .6) * 6, 380); pc(ctx, 'wcR', () => cloud(380, 130, 6), '#ffffff', { lift: 1.4 }); ctx.restore(); });
  // 第 71 拍：三只纸鸟
  [[400, 170], [520, 120], [640, 185]].forEach(([x, y], i) => popAt(ctx, x + u * 40, y - u * 10, 1.8 * popK(t, bt(71) + i * .05), () => {
    const f = Math.sin(t * 14 + i) * .5;
    ctx.save(); ctx.rotate(-f * .3); pc(ctx, 'birdL', () => [[0, 0], [-34, -14], [-26, 2]], '#fffaf0', { lift: .6, step: 5 }); ctx.restore();
    ctx.save(); ctx.rotate(f * .3); pc(ctx, 'birdR', () => [[0, 0], [34, -14], [26, 2]], '#fffaf0', { lift: .6, step: 5 }); ctx.restore();
  }));
  // 山：后排 → 两边的小房子 → 中间的大山包（两个人站在上面）→ 前排
  stand(ctx, H + 40, popK(t, B68), () => { ctx.save(); ctx.translate(0, -4 * bp); pc(ctx, 'wh1', () => hills(790, 70, 3, 2.1), '#a8dd8a', { lift: 1.6, step: 14, amp: 2 }); ctx.restore(); });
  stand(ctx, 790, popK(t, B68 + .06), () => { house(ctx, 'h2', 230, 790, 0, '#ff8f70'); house(ctx, 'h3', 1690, 800, 0, '#9b72e8'); });
  stand(ctx, H + 40, popK(t, B68 + .02), () => pc(ctx, 'wmound', () => smooth([[260, 1120], [400, 920], [640, 862], [960, 846], [1280, 862], [1520, 920], [1660, 1120]], 8), '#86cf6e', { lift: 2, step: 14, amp: 2 }));
  // 花：第 69、70 拍各一排
  [[[560, 885], [700, 860], [1250, 860], [1390, 885]], [[470, 935], [800, 870], [1130, 870], [1470, 935]]].forEach((row, j) => row.forEach(([x, y], i) => {
    popAt(ctx, x, y, 1.7 * popK(t, bt(69 + j) + i * .03) * (1 + .15 * bp), () => { ctx.rotate(Math.sin(t * 2 + i) * .15); flower(ctx, 'fl' + ((i + j) % 3), ['#ffc2d1', '#fffaf0', '#ffb36b'][(i + j) % 3]); });
  }));
  // 两个人：鼓回一起立起来。月芽闭着眼抱着心，「醒」（30.52 s）睁开眼；第 72 拍跳起来、心飞到两人中间；第 73 拍牵手
  const kC = popK(t, B68, .2);
  const jumpU = seg(t, bt(72) - .2, bt(72) + .22), jump = Math.sin(jumpU * Math.PI) * 70;
  const hand = popK(t, bt(73), .15);
  stand(ctx, 862, kC, () => {
    drawQing(ctx, { x: 1100, y: 862, s: 1.32, t, id: 'qW', look: -1, sq: bp, mouth: t > bt(72) - .1 ? 'grin' : 'smile',
      armR: 6 + 145 * popK(t, bt(70)) * (1 - ramp(t, bt(72), bt(72) + .25)), waveR: Math.sin(t * 17) * 14 * (t < bt(72) ? 1 : 0), armL: 6 + 46 * hand, brow: .4 });
    const open = popK(t, 30.62, .45), up = popK(t, bt(72), .2) * (1 - hand);
    drawYue(ctx, { x: 836, y: 862 - jump, s: 1.4, id: 'yW', open: open > .3 ? open : 0, look: open > .3 ? 1 : 0, sq: bp * .7,
      mouth: open > 1.15 ? 'o' : open > .3 ? 'grin' : 'smile', armL: -34 * (1 - Math.min(1, up + hand)) + 130 * up + 10 * hand,
      armR: -34 * (1 - Math.min(1, up + hand)) + 130 * up + 44 * hand, heart: t < bt(72) - .12 ? 1 : 0, hair: Math.sin(t * 2.4) * 3 + jump * .05, clip: bump(t, 30.62, .25) });
  });
  pc(ctx, 'wfront', () => hills(930, 30, 5, .7), '#b5e58f', { lift: 1.8, step: 14, amp: 2 });
  // 第 72 拍：心从她怀里飞到两个人头顶，越变越大
  if (t > bt(72) - .17) {
    const f = easeOut(seg(t, bt(72) - .17, bt(72) + .1)), k = lerp(.55, 1, f) * popK(t, bt(72), .3) + .1 * bp;
    popAt(ctx, lerp(836, 968, f), lerp(640, 255, f) + Math.sin(t * 3) * 6, Math.max(0, k), () => { ctx.rotate(Math.sin(t * 2.5) * .08); heartPiece(ctx, 'bigHeart', 78); });
  }
  // 纸屑：鼓回炸开一大把，第 73 拍再撒一小把
  confetti(ctx, t, B68, 1, 960, 560);
  confetti(ctx, t, bt(73), .35, 968, 280);
}
