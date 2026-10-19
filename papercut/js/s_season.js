// 第 8 镜（31.61–34.59 s）「你执着地等待 却不曾离开」：一棵树下·四季。
// 阿晴一个人站在树下举着那道纸彩虹，看着左边（她会来的方向）；每拍换一个季节：天、树冠、地、飘的东西一起换，树冠弹一下；
// 树干上的小木牌一拍多刻一道；第 79 拍月芽从左边跑进来，第 80 拍扑进他怀里，樱花全开、冒心
'use strict';
const SEASONS = [
  { sky: ['#ffd6e4', '#ffdfe9', '#ffe8ef', '#fff0f4', '#fff7f8'], crown: ['#ffb3cc', '#ff9cbc', '#ffc9da'], ground: '#bfe6a0', p: 'petal', pc: '#ffc2d1' },
  { sky: ['#9fd8f7', '#b4e1f9', '#c8eafb', '#dcf2fc', '#eef9fd'], crown: ['#6cc46a', '#55b35a', '#86d27a'], ground: '#9fdc7f', p: 'spark', pc: '#fff4bd' },
  { sky: ['#ffcfa3', '#ffd9b3', '#ffe3c3', '#ffecd3', '#fff5e4'], crown: ['#ffa94d', '#f47c3c', '#ffc46b'], ground: '#e8c27a', p: 'leaf', pc: '#ff9f4a' },
  { sky: ['#d9defc', '#e2e6fd', '#eaeefe', '#f2f4ff', '#f9faff'], crown: ['#ffffff', '#eef3ff', '#f7f9ff'], ground: '#f4f7ff', p: 'snow', pc: '#ffffff' },
];
const SEQ = [0, 1, 2, 3, 0, 1, 0];            // 第 74–80 拍：春 夏 秋 冬 春 夏 春
const T_CROWN = [[1180, 360, 420, 230], [1040, 440, 300, 180], [1330, 450, 320, 190], [1180, 470, 380, 170]];
const T_PART = Array.from({ length: 22 }, (_, i) => { const r = mulberry(i * 911 + 3); return [r() * W, r() * 1.0, .5 + r() * .7, r() * 6.28]; });

function seasonAt(t) { const n = Math.floor((t - BO) / BP + .04); return SEQ[clamp(n - 74, 0, SEQ.length - 1)]; }

function seasonScene(ctx, t) {
  const bp = beatPulse(t), n = clamp(Math.floor((t - BO) / BP + .04), 74, 80), S = SEASONS[seasonAt(t)], nb = bt(n);
  const pop = t >= bt(74) - .05 ? popK(t, nb, .2) : 1;                 // 这一拍换季：东西从 0.85 弹到 1
  const ks = .85 + .15 * Math.min(1.25, pop);
  sky(ctx, S.sky, t, 'tband', [-40, 180, 330, 470, 600]);
  // 远处的小山和地
  pc(ctx, 't-far', () => hills(760, 60, 2.5, 5.2), S.crown[2], { lift: 1.4, step: 14, amp: 2, alpha: .6 });
  pc(ctx, 't-ground', () => hills(845, 24, 3, .9), S.ground, { lift: 1.8, step: 14, amp: 2 });
  // 树干 + 刻痕木牌
  pc(ctx, 't-trunk', () => smooth([[1150, 850], [1160, 640], [1150, 520], [1172, 470], [1196, 520], [1192, 640], [1214, 850]], 4), '#a8774f', { lift: 1.4 });
  pc(ctx, 't-br', () => ribbon(line([[1176, 560], [1240, 500], [1300, 470]]), 16, 8), '#a8774f', { lift: 1 });
  pc(ctx, 't-br2', () => ribbon(line([[1168, 590], [1100, 530], [1050, 505]]), 14, 7), '#a8774f', { lift: 1 });
  ctx.save(); ctx.translate(1182, 690); ctx.rotate(-.04);
  pc(ctx, 't-plaque', () => rect(-46, -40, 92, 80), '#f3dfb8', { lift: .8 });
  const marks = Math.min(7, n - 73);
  for (let k = 0; k < marks; k++) {
    const pk = k === marks - 1 ? popK(t, nb, .3) : 1;
    ctx.save(); ctx.globalAlpha = Math.min(1, pk);
    if (k === 4) { ctx.translate(-13, 0); ctx.rotate(-.9); ctx.scale(Math.min(1, pk), 1); pc(ctx, 't-mk5', () => rect(-36, -3, 72, 6), '#6b4128', { lift: 0, grain: false }); }   // 第五道斜着划过前四道
    else { ctx.translate(k < 4 ? -34 + k * 14 : 22 + (k - 5) * 14, 0); pc(ctx, 't-mk', () => rect(-3, -26, 6, 52), '#6b4128', { lift: 0, grain: false }); }
    ctx.restore();
  }
  ctx.restore();
  // 树冠：这一季的颜色，换季那一拍弹一下；冬天是一团团雪
  T_CROWN.forEach(([x, y, w, h], i) => { ctx.save(); ctx.translate(x, y + 30); ctx.scale(ks, ks); ctx.translate(0, -30 + Math.sin(t * 1.3 + i) * 3); pc(ctx, 't-crown' + i, () => cloud(w, h, i + 51), S.crown[i % 3], { lift: 1.5 }); ctx.restore(); });
  if (S.p === 'petal' || S.p === 'leaf') [[1080, 360], [1260, 330], [1180, 470], [1320, 430], [1040, 460]].forEach(([x, y], i) => popAt(ctx, x, y, ks, () => S.p === 'petal' ? flower(ctx, 't-fl' + (i % 2), i % 2 ? '#fffaf0' : '#ffe0ea') : pc(ctx, 't-lf' + (i % 2), () => smooth([[0, -16], [12, 0], [0, 16], [-12, 0]], 4), '#ffd23f', { lift: .5, step: 5 })));
  // 飘的东西：花瓣 / 小亮片（往上飘）/ 落叶 / 雪
  T_PART.forEach(([x0, y0, sp, ph], i) => {
    const up = S.p === 'spark', u = ((t * sp * .45 + y0) % 1), x = x0 + Math.sin(t * 1.5 + ph) * 40, y = up ? H - u * H : -40 + u * (H + 80);
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + ph);
    if (S.p === 'petal') pc(ctx, 't-pp', () => ell(0, 0, 11, 7, 12), S.pc, { lift: .5, step: 4 });
    else if (S.p === 'spark') { ctx.scale(.8 + .4 * bp, .8 + .4 * bp); pc(ctx, 't-sp', () => star(13, 5, 4), S.pc, { lift: .4, step: 4 }); }
    else if (S.p === 'leaf') pc(ctx, 't-lf', () => smooth([[0, -14], [9, 0], [0, 14], [-9, 0]], 4), i % 2 ? S.pc : '#f47c3c', { lift: .5, step: 4 });
    else pc(ctx, 't-sn', () => ell(0, 0, 8, 8, 10), S.pc, { lift: .5, step: 4 });
    ctx.restore();
  });
  // 阿晴：一直举着纸彩虹，看着左边；第 80 拍她扑过来，他张开手接住
  const hug = popK(t, bt(80), .2);
  drawQing(ctx, { x: 1000, y: 850, s: 1.15, t, id: 'qTree', look: -1, sq: bp, mouth: t > bt(79) - .1 ? 'grin' : 'smile', armL: hug > .02 ? 30 - 60 * hug : 72, armR: 8 - 30 * hug, rainbow: 1 - Math.min(1, hug), brow: .2 });
  // 月芽：第 79 拍从左边跑进来，第 80 拍扑进他怀里
  if (t > bt(78)) {
    const f = ease(seg(t, bt(78) + .05, bt(79))), g = ease(seg(t, bt(80) - .2, bt(80)));
    const x = lerp(-260, 700, f) + g * 150, run = f < 1 ? Math.abs(Math.sin(t * 16)) * 22 : 0;
    drawYue(ctx, { x, y: 850 - run - hop(t, bt(80) - .25, bt(80), 40), s: 1.08, id: 'yTree', look: 1, open: 1, mouth: 'grin', sq: bp * .6,
      armL: g > 0 ? 40 - 80 * g : 100 * (1 - f) + 30, armR: g > 0 ? 40 - 80 * g : 100 * (1 - f) + 30, hair: 8 * (1 - g) + Math.sin(t * 2.4) * 3 });
    popAt(ctx, 930, 330 - seg(t, bt(80), bt(81)) * 50, popK(t, bt(80), .35), () => heartPiece(ctx, 't-heart', 52));
  }
}
