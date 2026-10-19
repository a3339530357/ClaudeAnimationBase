// 第 4 镜（13.71–20.53 s）「忘了是非 没有伤悲 / 无怨无悔」：云上·粉黄白天。
// 13.71 s 鼓回：画面往上一冲，云朵全立起来，两人从天上落到云朵蹦床上；之后一人一拍轮流蹦（落地压在拍上）；
// 第 36 拍一朵小灰雨云（伤悲）飘进来，第 38 拍阿晴蹦到最高一拳把它顶飞、变成粉云；第 40 拍两人手拉手落地；
// 「无怨无悔」第 44 拍彩虹纸带在两人头顶绕成一颗心，之后每拍心跳一下、旁边闪星星
'use strict';
const CLOUD_SKY = ['#b9e1ff', '#cfe9ff', '#ffe2ef', '#ffd6e2', '#ffe9c9'];
const K_FEET = 800, K_HER = 790, K_HIM = 1130;
// 谁在哪几拍之间腾空：[起跳拍, 落地拍, 高度]
const K_JUMPS = {
  her: [[32, 34, 150], [34, 36, 150], [36, 38, 150], [38, 40, 160]],
  him: [[31, 33, 150], [33, 35, 150], [35, 37, 150], [37, 39, 330]],
};
const K_BG = [[220, 300, 330, 120, 0], [1720, 260, 360, 130, .05], [640, 180, 240, 90, .1], [1260, 150, 260, 95, .15], [1500, 520, 300, 100, .08], [380, 560, 280, 95, .12]];
const kAir = (who, t) => { for (const [a, b, h] of K_JUMPS[who]) if (t > bt(a) && t < bt(b)) return { h: hop(t, bt(a), bt(b), h), f: seg(t, bt(a), bt(b)) }; return null; };
const kLand = (who, t) => K_JUMPS[who].reduce((s, [, b]) => s + bump(t, bt(b), .16), 0);

function cloudScene(ctx, t) {
  const bp = beatPulse(t), k0 = popK(t, bt(32), .35);
  sky(ctx, CLOUD_SKY, t, 'kband', [-40, 210, 370, 510, 630]);
  // 背景的云：鼓回一起立起来（一朵比一朵晚一点点）
  K_BG.forEach(([x, y, w, h, d], i) => stand(ctx, y + h * .3, popK(t, bt(32) + d, .3), () => {
    ctx.save(); ctx.translate(x + Math.sin(t * .5 + i) * 14, y - 4 * bp * (i % 2)); pc(ctx, 'k-bg' + i, () => cloud(w, h, i + 21), i % 2 ? '#ffffff' : '#fff4f8', { lift: 1.2 }); ctx.restore();
  }));
  // 停在左上的热气球（上一镜坐来的）
  ctx.save(); ctx.translate(250, 360 + Math.sin(t * 1.4) * 10); ctx.scale(.42, .42); ctx.rotate(Math.sin(t) * .03); drawBalloon(ctx, 'c-b', t, null); ctx.restore();
  // 小灰雨云：第 36 拍飘进来，第 38 拍被顶飞，变成粉云带一道小彩虹
  if (t > bt(35)) {
    const inF = ease(seg(t, bt(36) - .25, bt(36) + .3)), hit = t - bt(38);
    let x = lerp(2150, 1220, inF), y = 330, rot = Math.sin(t * 2) * .03, col = '#b9b4c9';
    if (hit > 0) { x += hit * 900; y -= hit * 620 - hit * hit * 120; rot += hit * 2.2; col = hit > .08 ? '#ffc2d1' : '#fffaf0'; }
    if (y > -200 && x < W + 300) {
      if (hit < 0) for (let k = 0; k < 7; k++) {          // 纸雨点
        const u = (t * 1.6 + k * .37) % 1, dx = -90 + k * 30;
        ctx.save(); ctx.globalAlpha = 1 - u; ctx.translate(x + dx, y + 50 + u * 170); pc(ctx, 'k-drop', () => smooth([[0, -14], [7, 2], [0, 9], [-7, 2]], 4), '#9fc4ef', { lift: .4, step: 5 }); ctx.restore();
      }
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 + .2 * bump(t, bt(38), .12), 1 - .15 * bump(t, bt(38), .12));
      pc(ctx, 'k-gray', () => cloud(260, 110, 31), col, { lift: 1.3 });
      if (hit > .08) RAINBOW.slice(0, 4).forEach((c, i) => pc(ctx, 'k-mini' + i, () => ribbon(arcPts(0, 30, 120 - i * 14, Math.PI, 2 * Math.PI, 20), 14), c, { lift: .4, step: 6 }));
      else { ctx.fillStyle = '#6e6680'; [-34, 30].forEach(ex => { ctx.beginPath(); ctx.arc(ex, -4, 6, 0, 6.283); ctx.fill(); }); ctx.strokeStyle = '#6e6680'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 26, 14, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
      ctx.restore();
    }
  }
  // 彩虹纸带心：第 44 拍在两人头顶绕出来，之后每拍跳一下
  const kh = popK(t, bt(44), .3);
  if (kh > .01) {
    ctx.save(); ctx.translate(K_HER / 2 + K_HIM / 2, 330 + Math.sin(t * 2) * 6); ctx.scale(kh * (1 + .08 * bp), kh * (1 + .08 * bp));
    const hp = heartShape(150); hp.push(hp[0], hp[1]); rainbowStrip(ctx, hp, 34, { lift: 1.4 });
    ctx.restore();
  }
  [[700, 260], [1220, 230], [960, 150], [620, 420], [1300, 420]].forEach(([x, y], i) => sparkle(ctx, 'k-sp', x, y, popK(t, bt(45 + (i % 3)) + i * .03, .4) * (1 - seg(t, bt(45 + (i % 3)) + .4, bt(46 + (i % 3)))) * 1.4));
  // 蹦床：一朵长长的大云，谁落地它就往下一压
  const press = kLand('her', t) + kLand('him', t);
  stand(ctx, H, k0, () => {
    ctx.save(); ctx.translate(960, 850); ctx.scale(1 + .03 * press, 1 - .07 * press);
    pc(ctx, 'k-bedB', () => cloud(1180, 210, 41), '#ffe0ec', { lift: 1.4 });
    ctx.translate(0, 18); pc(ctx, 'k-bed', () => cloud(1080, 190, 43), '#fffaf3', { lift: 1.6 });
    ctx.restore();
  });
  // 两个人：从天上落下来，一拍一拍轮流蹦；第 40 拍以后手拉手，拍上一起压一下
  const together = t > bt(40) - .02, dip = 18 * press;
  const ah = kAir('her', t), aq = kAir('him', t);
  const hy = K_FEET + dip - (ah ? ah.h : 0), qy = K_FEET + dip - (aq ? aq.h : 0);
  const hitArm = 160 * bump(t, bt(38), .25);
  drawQing(ctx, { x: K_HIM, y: qy, s: 1.0, t, id: 'qCloud', look: together ? -1 : (aq ? 0 : -1), sq: kLand('him', t) + (together ? bp : 0), mouth: aq || together ? 'grin' : 'smile',
    armL: together ? 46 : aq ? 120 : 20, armR: aq ? 120 + hitArm * .2 : 20, brow: .3 });
  drawYue(ctx, { x: K_HER, y: hy, s: 1.0, id: 'yCloud', look: together ? 1 : 0, sq: kLand('her', t) + (together ? bp * .7 : 0), open: 1, mouth: ah || together ? 'grin' : 'smile',
    armR: together ? 46 : ah ? 130 : 20, armL: ah ? 130 : 20, hair: (ah ? ah.h * .06 : 0) + Math.sin(t * 2.4) * 3, clip: kLand('her', t) * .6 });
  // 落地的地方蹦出一颗小星星，往上飘
  for (const who of ['her', 'him']) for (const [, b] of K_JUMPS[who]) {
    const u = t - bt(b); if (u < -.05 || u > .7) continue;
    const x = who === 'her' ? K_HER : K_HIM;
    sparkle(ctx, 'k-land', x + (who === 'her' ? -70 : 70), K_FEET - 20 - u * 160, popK(t, bt(b), .4) * (1 - seg(u, .4, .7)), 22, '#ffe27a');
  }
  // 云朵前沿盖住脚
  stand(ctx, H, k0, () => { ctx.save(); ctx.translate(960, 900); ctx.scale(1 + .03 * press, 1 - .05 * press); pc(ctx, 'k-bedF', () => cloud(1200, 120, 47), '#ffffff', { lift: 1.4 }); ctx.restore(); });
}
