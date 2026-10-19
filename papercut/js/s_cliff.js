// 第 3 镜（10.73–13.71 s）「带我远离寂寞的边缘」：灰紫悬崖边（寂寞，但不压黑）。
// 月芽站在崖边，纸带垂到崖下；第 26 拍热气球载着阿晴从崖下升上来（纸带那头在他手里）；第 27 拍纸带一拉；
// 第 28 拍她起跳，第 29 拍（鼓撤）落进吊篮；第 29–31 拍气球一拍升一截，悬崖第 30、31 拍一层层折下去
'use strict';
const CLIFF_SKY = ['#cdc6df', '#d5cfe5', '#ddd8eb', '#e6e1f1', '#efebf6'];
const BAL = { x: 1260, y: 300 };          // 球体中心（升上来停稳以后）；吊篮底在 y + 555

function cliffPts(xe, yt, seed) {
  const r = mulberry(seed * 77), p = [];
  for (let i = 0; i <= 8; i++) p.push([-60 + (xe + 60) * i / 8, yt + (r() - .5) * 14]);
  for (let i = 1; i <= 8; i++) p.push([xe - i * 16 + (r() - .5) * 34, yt + i * (H + 60 - yt) / 8]);
  p.push([-60, H + 60]);
  return p;
}
const BAL_ENV = () => smooth([[0, -230], [150, -195], [215, -80], [205, 40], [150, 150], [70, 215], [0, 232], [-70, 215], [-150, 150], [-205, 40], [-215, -80], [-150, -195]], 6);
// 热气球：原点在球体中心；inside(ctx) 画吊篮里的人（在吊篮后片和前片之间）
function drawBalloon(ctx, key, t, inside) {
  ctx.save(); ctx.strokeStyle = '#8a6a55'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  [[-150, 150, -82, 470], [150, 150, 82, 470], [-62, 205, -36, 470], [62, 205, 36, 470]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });
  ctx.restore();
  pc(ctx, key + 'env', BAL_ENV, '#ff8a7a', { lift: 2 });
  ctx.save(); ctx.clip(pathOf(cut(key + 'env', BAL_ENV)));
  [['#ffd23f', -128], ['#4dbfb0', -42], ['#ffd23f', 42], ['#4dbfb0', 128]].forEach(([c, x], i) => pc(ctx, key + 'gore' + i, () => ell(x, 0, 24 + Math.abs(x) * .05, 250, 30), c, { lift: .3, edge: false }));
  ctx.restore();
  pc(ctx, key + 'belt', () => ribbon(line([[-150, 150], [0, 178], [150, 150]]), 16), '#fffaf0', { lift: .4 });
  pc(ctx, key + 'back', () => rect(-92, 462, 184, 34), '#a87442', { lift: .6 });
  if (inside) inside(ctx);
  pc(ctx, key + 'bask', () => smooth([[-96, 478], [96, 478], [86, 560], [-86, 560]], 2), '#c8925a', { lift: 1.2 });
  pc(ctx, key + 'rim', () => rect(-100, 470, 200, 18), '#e0b07a', { lift: .5 });
  for (let k = 0; k < 4; k++) pc(ctx, key + 'weave' + k, () => rect(-80 + k * 46, 496, 16, 54), '#b07c48', { lift: 0, edge: false });
}

function cliffScene(ctx, t) {
  const bp = beatPulse(t);
  const lift = steps(t, [bt(29), bt(30), bt(31)], .22) * 75;          // 鼓撤：气球一拍升一截
  const rise = (1 - popK(t, bt(26), .12)) * 900;                      // 第 26 拍从崖下升上来
  const bx = BAL.x + Math.sin(t * 1.3) * 8, by = BAL.y + rise - lift + Math.sin(t * 1.7) * 6 - 5 * bp;
  sky(ctx, CLIFF_SKY, t, 'cband', [-40, 170, 320, 460, 590]);
  [[300, 220, 260, 90], [900, 130, 220, 80], [1690, 250, 300, 100]].forEach(([x, y, w, h], i) => { ctx.save(); ctx.translate(x + Math.sin(t * .5 + i) * 10, y + lift * .3); pc(ctx, 'c-cl' + i, () => cloud(w, h, i + 11), '#f6f3fa', { lift: 1 }); ctx.restore(); });
  ctx.save(); ctx.translate(0, lift * .45 - 3 * bp); pc(ctx, 'c-far', () => hills(830, 120, 2, 4.1), '#c0b6d8', { lift: 1.4, step: 14, amp: 2 }); ctx.restore();
  ctx.save(); ctx.translate(0, lift * .7); pc(ctx, 'c-mid', () => hills(930, 60, 3, 2.2), '#cfc4e3', { lift: 1.6, step: 14, amp: 2 }); ctx.restore();
  // 悬崖：后层浅、前层深，第 30、31 拍折下去
  stand(ctx, H + 40, foldK(t, bt(30), .22), () => { ctx.save(); ctx.translate(0, lift); pc(ctx, 'c-cliffB', () => cliffPts(720, 690, 1), '#b4a7cf', { lift: 1.6, step: 12, amp: 2 }); ctx.restore(); });
  stand(ctx, H + 40, foldK(t, bt(31), .22), () => {
    ctx.save(); ctx.translate(0, lift);
    pc(ctx, 'c-cliffF', () => cliffPts(630, 722, 2), '#a093c2', { lift: 2, step: 12, amp: 2 });
    // 崖上一棵光秃秃的小树
    ctx.save(); ctx.translate(150, 728); ctx.rotate(Math.sin(t * 1.2) * .02 + .03 * bp);
    pc(ctx, 'c-tree', () => ribbon(line([[0, 0], [6, -90], [-10, -170], [8, -230]]), 18, 7), '#8f7fae', { lift: 1 });
    pc(ctx, 'c-br1', () => ribbon(line([[2, -120], [40, -160], [70, -170]]), 9, 4), '#8f7fae', { lift: .8 });
    pc(ctx, 'c-br2', () => ribbon(line([[-6, -160], [-44, -200], [-60, -230]]), 9, 4), '#8f7fae', { lift: .8 });
    ctx.restore();
    ctx.restore();
  });
  // 跳：第 28 拍起跳，第 29 拍落进吊篮（缩小一点，人进了画面深处）
  const jf = seg(t, bt(28) - .06, bt(29)), inB = t >= bt(29);
  const herAt = () => {
    const sx = 520, sy = 722, tx = bx - 46, ty = by + 555, f = ease(jf);
    return { x: lerp(sx, tx, f), y: lerp(sy, ty, f) - hop(t, bt(28) - .06, bt(29), 230), s: lerp(1, .82, f) };
  };
  // 气球（阿晴在吊篮里；月芽落进来以后也在里面）
  ctx.save(); ctx.translate(bx, by);
  drawBalloon(ctx, 'c-b', t, c => {
    if (inB) drawYue(c, { x: -46, y: 555, s: .82, id: 'yBal', look: 1, open: 1, mouth: 'grin', armL: 20 + 30 * bump(t, bt(30), .2), armR: 30, sq: bp * .6, hair: Math.sin(t * 2.4) * 3 });
    drawQing(c, { x: 42, y: 555, s: .82, t, id: 'qBal', look: inB ? -1 : -1, sq: bp, mouth: 'grin', armL: inB ? 40 : 6 + 62 * popK(t, bt(27) - .1),
      armR: 6 + 150 * popK(t, bt(26)) * (1 - ramp(t, bt(27), bt(27) + .3)) + (inB ? 120 * bump(t, bt(31), .3) : 0), waveR: Math.sin(t * 17) * 14 });
  });
  ctx.restore();
  // 纸带：她手里一头，另一头在他手里（气球没上来时垂到崖下）；第 27 拍拉紧；她落进吊篮后系在吊篮绳上飘
  if (!inB) {
    const h = herAt(), hx = h.x + 116 * h.s, hy = h.y - 146 * h.s;     // 她的右手
    const qx = bx - 84, qy = by + 408;                                    // 他的左手
    const taut = popK(t, bt(27), .3), sag = lerp(90, 8, Math.min(1, taut)) - 30 * bump(t, bt(27), .15);
    rainbowStrip(ctx, sagLine(hx, hy, qx, qy, jf > 0 ? 20 : sag, t, 5 + 10 * bump(t, bt(27), .2)), 24, { lift: 1 });
  } else {
    const ax = bx - 82, ay = by + 470, wv = 14 + 10 * bp;
    const pts = []; for (let i = 0; i <= 18; i++) { const u = i / 18; pts.push([ax - u * 230, ay - 40 + u * 30 + Math.sin(u * 7 - t * 9) * wv * u]); }
    rainbowStrip(ctx, pts, 24, { lift: .9 });
  }
  // 月芽：崖边往下看；第 26 拍看见气球「哦」；第 27 拍笑；第 28 拍起跳（两手举高）
  if (!inB) {
    const h = herAt(), up = jf > 0 ? 1 : 0;
    drawYue(ctx, { x: h.x, y: h.y, s: h.s, id: 'yCliff', look: t < bt(26) ? .6 : 1, open: t > bt(26) - .05 && t < bt(27) - .05 ? 1.3 : 1,
      mouth: t < bt(26) - .05 ? 'smile' : t < bt(27) - .05 ? 'o' : 'grin', armR: up ? 150 : 60, armL: up ? 150 : 8 + 14 * bp, sq: bp * .6, hair: Math.sin(t * 2.2) * 3 + up * 10 });
  }
}
