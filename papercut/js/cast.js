// 两个纸片人（新角色，纸偶：每一块都是剪出来的彩纸，肩膀用小铜钉连着）
//   月芽（她）：珊瑚橘波波头 + 齐刘海，头上一颗黄星星发夹；薄荷青连衣裙、白圆领；珊瑚红小鞋。睡在月亮船里做梦
//   阿晴（他）：栗棕色蓬松短发、头顶翘一撮；芥末黄毛衣，胸前一道天蓝条；蓝裤子白球鞋。手里藏着一道纸彩虹
// 坐标：原点在两脚中间的地面，往上是负 y；s 是整体缩放
'use strict';

const INK = '#3b2a22';
const SKIN_Y = '#ffe3d1', SKIN_Q = '#f9d3b6';
const PIN = '#d9a441';

function brassPin(ctx, x, y, r = 5) {
  ctx.save(); ctx.fillStyle = PIN; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  ctx.fillStyle = 'rgba(255,245,200,.8)'; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .3, r * .35, 0, 6.283); ctx.fill(); ctx.restore();
}

// 眼睛：open = 睁开程度（0 闭眼弯弯，1 睁开，>1 瞪圆）
function eyes(ctx, ex, ey, open, look = 0) {
  ctx.save();
  for (const sx of [-1, 1]) {
    const x = sx * ex + look * 6, y = ey;
    if (open < .35) {     // 闭眼：往下弯的一道
      ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y - 4, 10, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
    } else {
      const k = Math.min(1.35, open);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y, 7.5 * Math.min(1.15, k), 10 * k, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(x + 2.5 + look * 1.5, y - 3.5 * k, 3, 0, 6.283); ctx.fill();
    }
  }
  ctx.restore();
}
function mouth(ctx, y, kind, w = 13) {
  ctx.save(); ctx.strokeStyle = '#b8443c'; ctx.fillStyle = '#c94a42'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  if (kind === 'o') { ctx.beginPath(); ctx.ellipse(0, y + 2, 7, 9, 0, 0, 6.283); ctx.fill(); }
  else if (kind === 'grin') { ctx.beginPath(); ctx.moveTo(-w, y - 3); ctx.quadraticCurveTo(0, y + 16, w, y - 3); ctx.closePath(); ctx.fill(); }
  else if (kind === 'sleep') { ctx.beginPath(); ctx.arc(0, y - 2, 6, .1 * Math.PI, .9 * Math.PI); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(0, y - 9, w, .22 * Math.PI, .78 * Math.PI); ctx.stroke(); }
  ctx.restore();
}

// ---------------- 月芽 ----------------
// o: x, y, s, rot（绕髋转，躺下 = -72）、open（睁眼）、look（-1 看左 … 1 看右）、mouth、armL/armR（往外抬的角度，负数 = 往里抱）
//    heart（怀里那颗心的大小 0..1）、hair（发尾摆动）、id（定格抖动用）、noLegs（坐在船里不画腿）
function drawYue(ctx, o) {
  const s = o.s ?? 1, hipY = -110;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s);
  wob(ctx, (o.id || 'yue') + 'all', .6);
  if (o.rot) { ctx.translate(0, hipY); ctx.rotate(rad(o.rot)); ctx.translate(0, -hipY); }
  if (o.sq) { ctx.scale(1 + o.sq * .04, 1 - o.sq * .05); }
  const armL = o.armL ?? 8, armR = o.armR ?? 8, look = o.look ?? 0;

  // 后面那只手（右手）先画，被身体挡住一点
  const arm = (side, ang) => {
    ctx.save(); ctx.translate(side * 31, -196); ctx.rotate(rad(side < 0 ? ang : -ang)); wob(ctx, 'yarm' + side, .5);
    pc(ctx, 'y-arm', () => capsule(84, 11, 10), SKIN_Y, { lift: .7 });
    pc(ctx, 'y-hand', () => ell(0, 88, 12.5, 12, 18), SKIN_Y, { lift: .6 });
    ctx.restore();
  };
  if (!o.noLegs) {
    for (const sx of [-1, 1]) {
      ctx.save(); ctx.translate(sx * 17, -108); wob(ctx, 'yleg' + sx, .4);
      pc(ctx, 'y-leg', () => capsule(96, 12.5, 11.5), SKIN_Y, { lift: .6 });
      pc(ctx, 'y-sock', () => rect(-12, 74, 24, 18), '#fffaf0', { lift: .3 });
      pc(ctx, 'y-shoe' + sx, () => ell(sx * 3, 100, 21, 11.5, 20), '#e8574f', { lift: .6 });
      ctx.restore();
    }
  }
  arm(1, armR);
  // 头发后片（波波头两侧垂下来）
  ctx.save(); ctx.translate(0, -280); ctx.rotate(rad((o.hair || 0) * .6)); ctx.translate(0, 280);
  pc(ctx, 'y-hairback', () => smooth([[-82, -300], [-80, -346], [-42, -366], [0, -370], [42, -366], [80, -346], [82, -300], [86, -232], [58, -224], [52, -262], [-52, -262], [-58, -224], [-86, -232]], 5), '#f2875f', { lift: 1 });
  ctx.restore();
  // 裙子 + 圆领
  pc(ctx, 'y-dress', () => smooth([[-28, -206], [28, -206], [44, -160], [66, -98], [30, -90], [0, -88], [-30, -90], [-66, -98], [-44, -160]], 5), '#3fb5a8', { lift: 1 });
  pc(ctx, 'y-hem', () => ribbon(line([[-64, -101], [-30, -93], [0, -91], [30, -93], [64, -101]]), 9), '#2f9a8e', { lift: .2, edge: false });
  pc(ctx, 'y-neck', () => rect(-9, -222, 18, 20), SKIN_Y, { lift: .2 });
  pc(ctx, 'y-collarL', () => ell(-13, -201, 17, 10, 20), '#fffaf0', { lift: .4 });
  pc(ctx, 'y-collarR', () => ell(13, -201, 17, 10, 20), '#fffaf0', { lift: .4 });
  // 头
  ctx.save(); ctx.translate(look * 7, 0);
  pc(ctx, 'y-ear', () => [ell(-70, -276, 11, 14, 16)], SKIN_Y, { lift: .4 });
  pc(ctx, 'y-ear2', () => [ell(70, -276, 11, 14, 16)], SKIN_Y, { lift: .4 });
  pc(ctx, 'y-head', () => ell(0, -280, 70, 66, 40), SKIN_Y, { lift: 1 });
  // 齐刘海：上面顺着头顶，下沿剪得平平的、有几个小缺口
  pc(ctx, 'y-bangs', () => {
    const p = [];
    for (let i = 0; i <= 14; i++) { const a = Math.PI * (1.04 + .92 * i / 14); p.push([Math.cos(a) * 76, -284 + Math.sin(a) * 74]); }
    p.push([66, -296], [44, -300], [36, -292], [18, -298], [0, -296], [-18, -300], [-34, -293], [-46, -300], [-66, -296]);
    return p;
  }, '#f2875f', { lift: .9 });
  ctx.save(); ctx.translate(50, -334); ctx.rotate(rad(14 + (o.clip || 0) * 20)); ctx.scale(1 + (o.clip || 0) * .5, 1 + (o.clip || 0) * .5);
  pc(ctx, 'y-star', () => star(19, 8.5), '#ffd23f', { lift: .8, step: 5 });
  ctx.restore();
  // 脸
  ctx.save(); ctx.globalAlpha = .85; ctx.fillStyle = '#ff9fb2';
  ctx.beginPath(); ctx.ellipse(-44 + look * 4, -250, 13, 8, 0, 0, 6.283); ctx.ellipse(44 + look * 4, -250, 13, 8, 0, 0, 6.283); ctx.fill(); ctx.restore();
  eyes(ctx, 25, -274, o.open ?? 1, look);
  ctx.save(); ctx.translate(look * 5, 0); mouth(ctx, -240, o.mouth || 'smile', 11); ctx.restore();
  ctx.restore();
  // 怀里抱着的心（「我拥抱着爱」）
  if (o.heart > .01) {
    ctx.save(); ctx.translate(0, -150); ctx.scale(o.heart, o.heart); ctx.rotate(rad(-6));
    pc(ctx, 'y-heart', () => heartShape(44), '#ff5a6e', { lift: 1.2, step: 6 });
    pc(ctx, 'y-heartHi', () => ell(-16, -12, 8, 5, 12), '#ffb3bd', { lift: 0 });
    ctx.restore();
  }
  arm(-1, armL);
  brassPin(ctx, -31, -196); brassPin(ctx, 31, -196);
  ctx.restore();
}

// ---------------- 阿晴 ----------------
// o: x, y, s, open, look, mouth, armL/armR, wave（挥手时小臂摆动）、rainbow（手里小彩虹 0..1）、sq（拍子上压一下）、noLegs（坐着不画腿）
function drawQing(ctx, o) {
  const s = o.s ?? 1;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s);
  wob(ctx, (o.id || 'qing') + 'all', .6);
  if (o.sq) ctx.scale(1 + o.sq * .04, 1 - o.sq * .05);
  const armL = o.armL ?? 6, armR = o.armR ?? 6, look = o.look ?? 0;
  const arm = (side, ang, wave = 0) => {
    ctx.save(); ctx.translate(side * 44, -224); ctx.rotate(rad((side < 0 ? ang : -ang) + wave * side)); wob(ctx, 'qarm' + side, .5);
    pc(ctx, 'q-arm', () => capsule(94, 15, 13), '#f5b941', { lift: .8 });
    pc(ctx, 'q-cuff', () => rect(-13, 84, 26, 12), '#7cc6f0', { lift: .3 });
    pc(ctx, 'q-hand', () => ell(0, 104, 13, 13, 18), SKIN_Q, { lift: .6 });
    if (side < 0 && o.rainbow > .01) {      // 左手举着一小道纸彩虹
      ctx.save(); ctx.translate(0, 118); ctx.rotate(rad(-(ang))); ctx.scale(o.rainbow, o.rainbow);
      RAINBOW.slice(0, 5).forEach((c, i) => pc(ctx, 'q-rb' + i, () => ribbon(arcPts(0, 0, 70 - i * 11, Math.PI, 2 * Math.PI, 18), 11), c, { lift: .5, step: 6 }));
      ctx.restore();
    }
    ctx.restore();
  };
  if (!o.noLegs) for (const sx of [-1, 1]) {        // noLegs：坐在月亮船里不画腿
    ctx.save(); ctx.translate(sx * 20, -118); wob(ctx, 'qleg' + sx, .4);
    pc(ctx, 'q-leg', () => capsule(104, 16, 15), '#5b86d6', { lift: .6 });
    pc(ctx, 'q-shoe' + sx, () => smooth([[sx * -14, 98], [sx * 6, 94], [sx * 26, 104], [sx * 26, 116], [sx * -16, 116]], 4), '#fffaf0', { lift: .6 });
    pc(ctx, 'q-shoeL' + sx, () => rect(sx > 0 ? -12 : -24, 110, 36, 5), '#f06e5a', { lift: 0, grain: false });
    ctx.restore();
  }
  arm(1, armR, o.waveR || 0);
  pc(ctx, 'q-body', () => smooth([[-40, -240], [40, -240], [58, -204], [60, -114], [0, -106], [-60, -114], [-58, -204]], 5), '#f5b941', { lift: 1 });
  pc(ctx, 'q-stripe', () => [[-55, -182], [55, -182], [56, -164], [-56, -164]], '#7cc6f0', { lift: .2 });
  pc(ctx, 'q-hemB', () => rect(-58, -122, 116, 14), '#e9a52c', { lift: .15, edge: false });
  pc(ctx, 'q-neck', () => rect(-10, -252, 20, 16), SKIN_Q, { lift: .2 });
  ctx.save(); ctx.translate(look * 7, 0);
  pc(ctx, 'q-ear', () => [ell(-67, -300, 11, 15, 16)], SKIN_Q, { lift: .4 });
  pc(ctx, 'q-ear2', () => [ell(67, -300, 11, 15, 16)], SKIN_Q, { lift: .4 });
  pc(ctx, 'q-head', () => ell(0, -304, 68, 66, 40), SKIN_Q, { lift: 1 });
  // 蓬松短发：一圈参差的毛边，前面几撮刘海
  pc(ctx, 'q-hair', () => {
    const p = [];
    for (let i = 0; i <= 22; i++) {
      const a = Math.PI * (1.02 + .96 * i / 22), r = 80 + (i % 2 ? 9 : -2);
      p.push([Math.cos(a) * r, -306 + Math.sin(a) * r * .95]);
    }
    p.push([70, -300], [56, -318], [44, -306], [26, -322], [8, -306], [-14, -324], [-32, -308], [-52, -320], [-66, -298]);
    return p;
  }, '#8d5b3b', { lift: .9 });
  ctx.save(); ctx.translate(6, -378); ctx.rotate(rad(Math.sin((o.t || 0) * 5) * 6));
  pc(ctx, 'q-curl', () => ribbon(line([[0, 6], [6, -16], [22, -26], [34, -20], [30, -10]]), 12, 5), '#8d5b3b', { lift: .7 });
  ctx.restore();
  ctx.save(); ctx.strokeStyle = '#6b4128'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 15 + look * 6, -296 - (o.brow || 0) * 6); ctx.lineTo(sx * 34 + look * 6, -299 - (o.brow || 0) * 6); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = .7; ctx.fillStyle = '#ff9f8f';
  ctx.beginPath(); ctx.ellipse(-42 + look * 4, -270, 12, 7, 0, 0, 6.283); ctx.ellipse(42 + look * 4, -270, 12, 7, 0, 0, 6.283); ctx.fill(); ctx.restore();
  eyes(ctx, 24, -282, o.open ?? 1, look);
  ctx.save(); ctx.translate(look * 5, 0); mouth(ctx, -258, o.mouth || 'smile', 14); ctx.restore();
  ctx.restore();
  arm(-1, armL, o.waveL || 0);
  brassPin(ctx, -44, -224); brassPin(ctx, 44, -224);
  ctx.restore();
}

const RAINBOW = ['#ff6b6b', '#ffa94d', '#ffd93d', '#6bcb77', '#4d96ff', '#9b72e8'];
function arcPts(cx, cy, r, a0, a1, n = 40) {
  const p = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return p;
}
