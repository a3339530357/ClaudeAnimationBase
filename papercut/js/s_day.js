// 第 10 镜（38.00–44.60 s）「不用再徘徊 你就是我最美的期待」：月亮船·金色白天，和开头同一个构图。
// 天亮了，月芽和阿晴并排坐在月亮船里；第 89–93 拍云、房子、太阳、花、蝴蝶一拍一样立起来；第 94 拍「你就是我」两人对看、冒小心；
// 第 95 拍她举起彩虹纸带，第 96 拍纸带升成一道大彩虹罩住月亮船；第 98 拍「期」头顶一颗大心 + 纸屑；第 99 拍「待」两人一起举手；
// 42.61 s 音乐断掉，之后回声每拍一下越来越轻，画面跟着越来越轻地颠；42.95 s 片尾小卡（main.js）
'use strict';
const DAY_SKY = ['#a9dcf7', '#c3e6f8', '#ffeacc', '#ffdcb5', '#fff0cf'];
const D_BUTTER = [[300, 420, 0], [1540, 360, 1], [1180, 560, 2]];

function butterfly(ctx, key, t, ph) {
  const f = .55 + .45 * Math.abs(Math.sin(t * 10 + ph));
  for (const s of [-1, 1]) { ctx.save(); ctx.scale(s * f, 1); pc(ctx, key + 'w', () => smooth([[0, 0], [26, -24], [34, -4], [18, 10], [26, 26], [6, 18]], 4), ph % 2 ? '#ffb3cc' : '#ffd23f', { lift: .7, step: 5 }); ctx.restore(); }
  pc(ctx, 'd-bb', () => ell(0, 4, 4, 16, 10), '#5a3b2a', { lift: .3, step: 4 });
}

function dayScene(ctx, t) {
  const bp = beatPulse(t), cheer = popK(t, bt(99), .25);
  sky(ctx, DAY_SKY, t);                                    // 和开头同一套天空纸带，换成白天的颜色
  // 大彩虹：第 96 拍从左往右展开（纸带变的）
  const sweep = ease(seg(t, bt(96) - .2, bt(96) + .22));
  if (sweep > 0) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(960, 1000); ctx.arc(960, 1000, 1000, Math.PI, Math.PI * (1 + sweep)); ctx.closePath(); ctx.clip();
    RAINBOW.forEach((c, i) => {
      const jump = 14 * bump(t, bt(97) + i * .03, .12) + 8 * bp;
      ctx.save(); ctx.translate(960, 1000 - jump);
      pc(ctx, 'd-arch' + i, () => ribbon(arcPts(0, 0, 790 - i * 44, Math.PI, Math.PI * 2, 64), 46), c, { lift: 1.3, step: 12 });
      ctx.restore();
    });
    ctx.restore();
  }
  // 太阳（第 91 拍）
  popAt(ctx, 1640, 190, popK(t, bt(91), .3) * (1 + .08 * bp), () => paperSun(ctx, 'd-sun', 90, t));
  // 远山（开头那两排，换成白天的颜色）
  stand(ctx, H + 40, 1, () => { ctx.save(); ctx.translate(0, bp * -4); pc(ctx, 'dh1', () => hills(800, 60, 3, 1.2), '#b9e3a0', { lift: 1.6, step: 14, amp: 2 }); ctx.restore(); });
  pc(ctx, 'dh2', () => hills(905, 40, 5, .4), '#ffd3e0', { lift: 1.8, step: 14, amp: 2 });
  // 左边的云（第 89 拍）
  stand(ctx, 360, popK(t, bt(89), .3), () => {
    ctx.save(); ctx.translate(320 + Math.sin(t * .7) * 8, 300);
    pc(ctx, 'cL2', () => cloud(330, 130, 2), '#e3f4ff', { lift: 1 }); ctx.translate(30, 20);
    pc(ctx, 'cL1', () => cloud(300, 120, 5), '#ffffff', { lift: 1.4 });
    ctx.restore();
  });
  // 右边的云 + 小房子（第 90 拍）——开头阿晴站的地方，现在空了：他到船上来了
  stand(ctx, 870, popK(t, bt(90), .3), () => {
    ctx.save(); ctx.translate(Math.sin(t * .6) * 6, 0);
    ctx.save(); ctx.translate(1440, 800); pc(ctx, 'cR2', () => cloud(660, 170, 7), '#e3f4ff', { lift: 1.2 }); ctx.restore();
    ctx.save(); ctx.translate(1655, 772); ctx.scale(1.2, 1.2); ctx.translate(-1610, -712); house(ctx, 'h1', 1610, 712, 0); ctx.restore();
    [[1330, 800], [1420, 790], [1510, 805]].forEach(([x, y], i) => popAt(ctx, x, y, 1.4 * popK(t, bt(92) + i * .04, .35) * (1 + .12 * bp), () => { ctx.rotate(Math.sin(t * 2 + i) * .15); flower(ctx, 'fl' + (i % 3), ['#ffc2d1', '#fffaf0', '#ffb36b'][i % 3]); }));
    ctx.save(); ctx.translate(1420, 862); pc(ctx, 'cR1', () => cloud(600, 130, 9), '#ffffff', { lift: 1.5 }); ctx.restore();
    ctx.restore();
  });
  // 蝴蝶（第 93 拍）
  D_BUTTER.forEach(([x, y, ph], i) => popAt(ctx, x + Math.sin(t * 1.3 + ph) * 60, y + Math.cos(t * 1.7 + ph) * 30, 1.3 * popK(t, bt(93) + i * .05, .4), () => { ctx.rotate(Math.sin(t * 2 + ph) * .2); butterfly(ctx, 'd-bf' + (i % 2), t, ph); }));
  // 第 95 拍：她把纸带往天上一抛，第 96 拍变成大彩虹（纸带在彩虹展开时收走）
  const tf = seg(t, bt(95) - .1, bt(96) - .1);
  if (tf > 0 && t < bt(96) + .1) {
    const hx = 640, hy = 470, ex = lerp(hx, 470, tf), ey = lerp(hy, 160, ease(tf));
    ctx.save(); ctx.globalAlpha = 1 - seg(t, bt(96) - .05, bt(96) + .1); rainbowStrip(ctx, sagLine(hx, hy, ex, ey, -40, t, 10), 28, { lift: 1 }); ctx.restore();
  }
  // 月亮船：两个人都坐在里面（先画人，船身挡住下半身）
  const { x, y, R } = MOON, d = .42 * R, r = .92 * R;
  const rock = Math.sin(t * 1.6) * 2.5 + 3 * bp;
  ctx.save(); ctx.translate(MOONAT.x, MOONAT.y); ctx.scale(MOONAT.s, MOONAT.s); ctx.translate(-x, -y);
  ctx.save(); ctx.translate(x, y + bp * -6); ctx.rotate(rad(rock)); ctx.translate(-x, -y);
  const face = popK(t, bt(94), .2);                         // 第 94 拍两人对看
  drawQing(ctx, { x: 718, y: 832 - 30 * cheer, s: 1.08, t, id: 'qDay', look: -1 * Math.min(1, .3 + face), sq: bp, mouth: t > bt(94) - .1 ? 'grin' : 'smile',
    armL: 8 + 140 * cheer, armR: 8 + 140 * cheer, brow: .3 * face, noLegs: true });
  drawYue(ctx, { x: 512, y: 828 - 30 * cheer, s: 1.15, id: 'yDay', look: Math.min(1, .2 + face), open: 1, mouth: t > bt(94) - .1 ? 'grin' : 'smile', sq: bp * .6,
    armL: 8 + 140 * cheer, armR: 8 + 120 * popK(t, bt(95) - .1, .25) * (1 - seg(t, bt(96), bt(97))) + 140 * cheer, hair: Math.sin(t * 2.2) * 3 + bp * 4, clip: bump(t, bt(94), .25) + bump(t, bt(98), .25), noLegs: true });
  pc(ctx, 'moon', () => crescent(R, d, r).map(([a, b]) => [x + a, y + b]), '#ffe58f', { lift: 2, step: 12, amp: 1.5 });
  pc(ctx, 'moonRim', () => ribbon(arcPts(x, y - d, r + 6, Math.PI * .12, Math.PI * .88, 30), 10), '#ffd35c', { lift: .2, edge: false });
  [[x + 120, y + 150, 16], [x - 60, y + 190, 11], [x + 30, y + 205, 8]].forEach(([cx, cy, cr], i) => pc(ctx, 'crater' + i, () => ell(cx, cy, cr, cr * .8, 16), '#f7d56b', { lift: 0, step: 5 }));
  ctx.restore();
  ctx.restore();
  // 第 94 拍小心，第 98 拍「期」大心（越变越大，拍上跳）
  popAt(ctx, 790, 300 - seg(t, bt(94), bt(97)) * 40, popK(t, bt(94), .35) * (1 - seg(t, bt(97.6), bt(98))), () => heartPiece(ctx, 'smallHeart', 44));
  popAt(ctx, 790, 250 + Math.sin(t * 3) * 6, popK(t, bt(98), .35) * (1 + .1 * bp), () => { ctx.rotate(Math.sin(t * 2.5) * .08); heartPiece(ctx, 'd-bigHeart', 86); });
  // 纸屑：第 98 拍一大把，第 99 拍再一小把
  confetti(ctx, t, bt(98), 1, 790, 320);
  confetti(ctx, t, bt(99), .4, 960, 240);
  // 白天的小亮片（拍上闪，音乐断了以后跟着回声越来越轻）
  [[200, 180], [560, 120], [1100, 150], [1350, 260], [1820, 420], [90, 520]].forEach(([sx, sy], i) => sparkle(ctx, 'd-sp', sx, sy, .5 + .6 * beatPulse(t + i * .02) + .2 * Math.sin(t * 3 + i), 15, '#fffaf0'));
}
