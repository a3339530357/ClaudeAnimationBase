// 第 1 镜（0–7.32 s）和第 6 镜（25.64–29.05 s）：月亮船·紫粉夜空，还有第 6 镜末尾合上的两扇封面。样片 D 原样保留，补了第 13–16 拍的彩虹纸带
'use strict';
// ---------- 梦里（段 1 和段 2 鼓回之前）----------
// 每样东西：第几拍立起来（up，null = 一开始就在），第几拍折回去（down）
const DREAM = { stars: [3, 62], cloudL: [1, 65], cloudR: [2, 66], him: [6, 66], house: [8, 64], rbow: [12, 63], hills: [null, 67] };
const dk = (name, t) => { const [u, d] = DREAM[name]; return (u == null ? 1 : popK(t, bt(u))) * (d == null ? 1 : foldK(t, bt(d))); };

function dreamScene(ctx, t) {
  const bp = beatPulse(t);
  sky(ctx, DREAM_SKY, t);
  // 星星（第 3 拍一起蹦出来，第 11 拍再闪一下；第 62 拍折回去）
  const ks = dk('stars', t), tw = bump(t, bt(11), .16);
  STARS.forEach(([x, y, r], i) => {
    const k = ks * (1 + .45 * tw * (i % 2 ? 1 : .7) + .12 * bp * (i % 3 === 0));
    popAt(ctx, x, y + Math.sin(t * 1.5 + i) * 4, k, () => { ctx.rotate(Math.sin(t + i) * .2); pc(ctx, 'st' + (i % 4), () => star(r, r * .45), i % 3 ? '#ffe27a' : '#fff4bd', { lift: .8, step: 5 }); });
  });
  // 第 9 拍：一颗流星划过去
  const sf = seg(t, bt(9) - .16, bt(9) + .45);
  if (sf > 0 && sf < 1 && t < 26) {
    const x = lerp(1800, 1000, easeOut(sf)), y = lerp(70, 250, easeOut(sf));
    ctx.save(); ctx.globalAlpha = 1 - seg(sf, .75, 1);
    ctx.translate(x, y); pc(ctx, 'meteorTail', () => ribbon(line([[0, 0], [120, -28], [280, -64]]), 26, 2), '#fff4bd', { lift: .4 });
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 1 - seg(sf, .75, 1); ctx.translate(x, y); ctx.rotate(t * 6);
    pc(ctx, 'meteor', () => star(44, 19), '#ffe27a', { lift: 1, step: 5 }); ctx.restore();
  }
  // 远处小山（一开始就在，第 67 拍折回去）
  const kh = dk('hills', t);
  stand(ctx, H + 40, kh, () => {
    ctx.save(); ctx.translate(0, bp * -4);
    pc(ctx, 'dh1', () => hills(800, 60, 3, 1.2), '#c4ade6', { lift: 1.6, step: 14, amp: 2 });
    ctx.restore();
  });
  stand(ctx, H + 40, popK(t, bt(0), .3) * foldK(t, bt(67)), () => pc(ctx, 'dh2', () => hills(905, 40, 5, .4), '#f3bfd8', { lift: 1.8, step: 14, amp: 2 }));
  // 左边的云（第 1 拍）
  stand(ctx, 360, dk('cloudL', t), () => {
    ctx.save(); ctx.translate(320 + Math.sin(t * .7) * 8, 300);
    pc(ctx, 'cL2', () => cloud(330, 130, 2), '#ffd9e6', { lift: 1 }); ctx.translate(30, 20);
    pc(ctx, 'cL1', () => cloud(300, 120, 5), '#fffaf3', { lift: 1.4 });
    ctx.restore();
  });
  // 右边的云：阿晴和小房子站在上面（第 2 拍云，第 6 拍他，第 8 拍房子）
  const kR = dk('cloudR', t);
  stand(ctx, 870, kR, () => {
    ctx.save(); ctx.translate(Math.sin(t * .6) * 6, 0);
    ctx.save(); ctx.translate(1440, 800); pc(ctx, 'cR2', () => cloud(660, 170, 7), '#ffd9e6', { lift: 1.2 }); ctx.restore();
    // 房子
    stand(ctx, 772, dk('house', t), () => {
      const lit = t < 20 ? popK(t, bt(10), .35) : 1;
      ctx.save(); ctx.translate(1655, 772); ctx.scale(1.2, 1.2); ctx.translate(-1610, -712);
      house(ctx, 'h1', 1610, 712, lit);
      // 烟囱冒烟：第 10 拍起一串小圆片往上飘
      if (t > bt(10) - .1 && t < 20) for (let i = 0; i < 4; i++) {
        const u = ((t - bt(10) + .1) * .9 + i * .25) % 1, k = Math.min(1, (t - bt(10) + .1) * 4 - i * .5);
        if (k <= 0) continue;
        ctx.save(); ctx.globalAlpha = (1 - u) * .9; ctx.translate(1643 + Math.sin(u * 6 + i) * 12, 560 - u * 120);
        ctx.scale(.5 + u, .5 + u); pc(ctx, 'smoke' + (i % 2), () => cloud(34, 24, i), '#fffaf3', { lift: .4, step: 5 }); ctx.restore();
      }
      ctx.restore();
    });
    // 阿晴
    const kHim = dk('him', t);
    stand(ctx, 772, kHim, () => {
      const wave = popK(t, bt(7)) * (1 - ramp(t, bt(9), bt(10)));
      const reach = t > 20 ? popK(t, bt(64)) : 0;
      const rb = t < 20 ? popK(t, bt(12)) : foldK(t, bt(63));
      // 第 13 拍：把手里的小彩虹抛出去，变成一条长纸带
      const thr = t < 20 ? popK(t, bt(13), .3) * (1 - .45 * ramp(t, bt(15), bt(16))) : 0;
      const gone = t < 20 ? seg(t, bt(13) - .12, bt(13) + .05) : 0;
      drawQing(ctx, { x: 1330, y: 772, s: 1.3, t, look: -1, sq: bp, mouth: wave > .5 || thr > .5 ? 'grin' : 'smile',
        armR: 6 + 140 * wave, waveR: wave * Math.sin(t * 17) * 16, armL: 6 + 70 * rb * (t < 20 ? 1 : 0) * (1 - Math.min(1, thr)) + 112 * thr + 42 * reach, rainbow: t < 20 ? rb * (1 - gone) : 0, brow: wave * .5 });
    });
    ctx.save(); ctx.translate(1420, 862); pc(ctx, 'cR1', () => cloud(600, 130, 9), '#fffaf3', { lift: 1.5 }); ctx.restore();
    ctx.restore();
  });
  // 她想他：第 5 拍一串小星星从她那边连到他那边；第 7 拍她头上冒一颗小心
  if (t < 20) {
    const k5 = popK(t, bt(5));
    // 一串越来越大的小星星，从她这边一路连到他那边（第 5 拍依次蹦出来）
    [[850, 410], [940, 365], [1030, 340], [1120, 335], [1205, 350]].forEach(([x, y], i) => popAt(ctx, x, y + Math.sin(t * 3 + i) * 5, popK(t, bt(5) - .1 + i * .05) * (1 + .3 * bump(t, bt(11))),
      () => { ctx.rotate(Math.sin(t * 2 + i) * .3); pc(ctx, 'trail' + i, () => star(20 + i * 4, 9 + i * 1.6), i % 2 ? '#fff4bd' : '#ffe27a', { lift: 1, step: 5 }); }));
    const k7 = popK(t, bt(7), .35);
    popAt(ctx, 790, 300 - seg(t, bt(7), bt(13)) * 50, k7 * (1 + .25 * bump(t, bt(8)) + .2 * bump(t, bt(12))), () => heartPiece(ctx, 'smallHeart', 44));
    void k5;
  }
  if (t < 20 && t > bt(13) - .15) dreamRibbon(ctx, t, bp);
  // 月亮船 + 月芽 + 被子
  moonBoat(ctx, t, bp);
}

// 第 13 拍阿晴抛出的彩虹纸带：第 14 拍落到月芽手里，之后两头一人拉一头，拍上抖一下
function dreamRibbon(ctx, t, bp) {
  const sx = 1122 + Math.sin(t * .6) * 6, sy = 520 - 6 * bp;     // 阿晴左手
  const ex = 826, ey = 562 - 5 * bp;                              // 月芽右手
  const f = easeOut(seg(t, bt(13) - .12, bt(14)));
  const shake = bump(t, bt(14), .2) + .7 * bump(t, bt(15), .16) + .7 * bump(t, bt(16), .16);
  let pts;
  if (f < 1) { const hx = lerp(sx, ex, f), hy = lerp(sy, ey, f) - Math.sin(f * Math.PI) * 170; pts = sagLine(sx, sy, hx, hy, -60 * f, t, 6 * f); }
  else pts = sagLine(sx, sy, ex, ey, 55 + 18 * shake, t, 7 + 12 * shake);
  rainbowStrip(ctx, pts, 30, { lift: 1.2 });
}

function moonBoat(ctx, t, bp) {
  const { x, y, R } = MOON, d = .42 * R, r = .92 * R;
  const rock = Math.sin(t * 1.6) * 2.5 + (t < 20 ? 6 * popK(t, bt(12), .4) * Math.exp(-Math.max(0, t - bt(12)) * 2) : 0);
  ctx.save(); ctx.translate(MOONAT.x, MOONAT.y); ctx.scale(MOONAT.s, MOONAT.s); ctx.translate(-x, -y);
  ctx.save(); ctx.translate(x, y + bp * -5); ctx.rotate(rad(rock)); ctx.translate(-x, -y);
  // 枕头
  pc(ctx, 'pillow', () => smooth([[x - 220, y + 105], [x - 130, y + 92], [x - 110, y + 130], [x - 215, y + 140]], 5), '#fffaf3', { lift: .8 });
  pc(ctx, 'moon', () => crescent(R, d, r).map(([a, b]) => [x + a, y + b]), '#ffe58f', { lift: 2, step: 12, amp: 1.5 });
  pc(ctx, 'moonRim', () => ribbon(arcPts(x, y - d, r + 6, Math.PI * .12, Math.PI * .88, 30), 10), '#ffd35c', { lift: .2, edge: false });
  [[x + 120, y + 150, 16], [x - 60, y + 190, 11], [x + 30, y + 205, 8]].forEach(([cx, cy, cr], i) => pc(ctx, 'crater' + i, () => ell(cx, cy, cr, cr * .8, 16), '#f7d56b', { lift: 0, step: 5 }));
  // 月芽：一开始躺着睡，第 3 拍睁眼，第 4 拍坐起来，第 5 拍看向他；段 2：第 65 拍闭眼抱紧，第 66 拍怀里多一颗心
  const pre = t < 20;
  const sit = pre ? popK(t, bt(4), .12) : 1;
  const open = pre ? popK(t, bt(3), .3) : foldK(t, bt(65), .16) > .5 ? 1 : 0;
  const look = pre ? Math.min(1, popK(t, bt(5))) : (1 - ramp(t, bt(65) - .15, bt(65)));
  const hug = pre ? 0 : popK(t, bt(65), .15);
  const heart = pre ? 0 : popK(t, bt(66), .3) * (1 + .15 * bump(t, bt(67), .2));
  drawYue(ctx, { x, y: y + .5 * R + 20 + 110 * 1.15, s: 1.15, id: 'yueD', rot: -72 * (1 - sit), open: open > .35 ? open : 0,
    look, mouth: !pre ? 'smile' : sit < .5 ? 'sleep' : open > 1.1 ? 'o' : t > bt(14) ? 'grin' : 'smile', armL: 8 - 42 * hug + 20 * (pre ? bump(t, bt(4), .25) : 0),
    armR: 8 - 42 * hug + (pre ? 95 * popK(t, bt(14) - .06, .25) : 0),
    heart, hair: Math.sin(t * 2.2) * 3 + bp * 4, sq: bp * .6, clip: pre ? bump(t, bt(4), .2) : 0, noLegs: true });
  // 被子：塞在月亮船里，顶边一道翻边，上面几颗纸星星
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, R - 2, 0, Math.PI * 2); ctx.clip();
  pc(ctx, 'blanket', () => {
    const p = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16, bx = x - 250 + 500 * u; p.push([bx, y + 128 + 18 * Math.sin(u * 9) + (u < .3 ? (0.3 - u) * 90 : 0)]); }
    p.push([x + 260, y + 300], [x - 260, y + 300]); return p;
  }, '#ffc2d1', { lift: 1.6, step: 10 });
  pc(ctx, 'blanketFold', () => ribbon(Array.from({ length: 17 }, (_, i) => { const u = i / 16; return [x - 250 + 500 * u, y + 138 + 18 * Math.sin(u * 9) + (u < .3 ? (0.3 - u) * 90 : 0)]; }), 22), '#ffe0e8', { lift: .4 });
  [[x - 80, y + 190], [x + 40, y + 175], [x + 150, y + 200], [x - 10, y + 225]].forEach(([sx, sy], i) => {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(i); pc(ctx, 'bstar' + i, () => star(13, 6), '#ffe27a', { lift: .3, step: 4 }); ctx.restore();
  });
  ctx.restore();
  ctx.restore();
  // 睡着时冒出来的 z（第 0、1、2 拍各冒一个，睁眼就散了）
  if (t < 3) {
    for (let i = 0; i < 4; i++) {
      const tb = bt(i) - .25 + (i === 0 ? -.4 : 0), u = t - tb; if (u < 0) continue;
      const fade = 1 - seg(t, bt(3) - .05, bt(3) + .15);
      const k = Math.min(1.2, popK(t, tb + RISE, .3)) * fade; if (k <= .01) continue;
      ctx.save(); ctx.translate(500 + u * 70 + i * 14, 545 - u * 80 - i * 8); ctx.rotate(-.25 + Math.sin(u * 3 + i) * .15); ctx.scale(k * (1.2 + i * .2), k * (1.2 + i * .2));
      pc(ctx, 'z' + (i % 2), () => zShape().map(([a, b]) => [a - 15, b - 18]), '#fffaf3', { lift: .8, step: 6 }); ctx.restore();
    }
  }
  ctx.restore();
}

// ---------- 书的两扇封面：第 67 拍开始合上，29.05 s 弹开 ----------
function covers(ctx, t) {
  let k = 0;
  if (t < B68) k = Math.min(1.05, popK(t, bt(67), .1)) * .55 + .3 * ease(seg(t, bt(67) + .05, B68 - .04));
  else k = .85 * (1 - easeOut(seg(t, B68, B68 + .2)));
  if (k <= .005) return;
  const panel = (side, col, hole) => {
    ctx.save();
    const hx = side < 0 ? 0 : W; ctx.translate(hx, 0); ctx.scale(k, 1); ctx.translate(-hx, 0);
    ctx.filter = `brightness(${(.86 + .14 * k).toFixed(3)})`;
    pc(ctx, 'cover' + side, () => {
      const p = [], x0 = side < 0 ? -40 : W / 2, x1 = side < 0 ? W / 2 : W + 40, edge = side < 0 ? x1 : x0;
      if (side < 0) { p.push([x0, -40]); for (let i = 0; i <= 18; i++) p.push([edge + Math.sin(i * 1.7) * 14, -40 + (H + 80) * i / 18]); p.push([x0, H + 40]); }
      else { p.push([x1, -40], [x1, H + 40]); for (let i = 18; i >= 0; i--) p.push([edge + Math.sin(i * 1.3) * 14, -40 + (H + 80) * i / 18]); }
      const holes = [];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) {
        const cx = (side < 0 ? 140 : W / 2 + 160) + i * 260 + (j % 2) * 120, cy = 140 + j * 260;
        holes.push(hole === 'star' ? star(46, 20).map(([a, b]) => [cx + a, cy + b]) : ell(cx, cy, 34, 34, 24));
      }
      return [p, ...holes];
    }, col, { lift: 3, step: 16, amp: 2 });
    ctx.restore();
  };
  panel(-1, '#f47c6a', 'star'); panel(1, '#4dbfb0', 'dot');
}
