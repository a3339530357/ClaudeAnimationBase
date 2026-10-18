// 样片 B：照歌词逐句画，0–8 秒三句。每拍都有一件事发生，小节第一拍（第 4、8、16 拍）换画面更重一点。
//   S1 第 0–4 拍「还有什么等待」：盛夏的公交站，她挡着太阳往路那头望。太阳一拍一闪、站牌上的钟一拍跳一格、热浪升起来、冰棍往下滴
//   S2 第 4–8 拍「还有什么悲哀」：镜头一路推到她脸上，头顶画出一朵乌云 → 下雨、她垮下脸 → 冰棍化掉掉了 → 打雷、哭出来
//   S3 第 8 拍起「这故事中的人不太精彩」：镜头拉远，原来刚才是一本故事书里的一格。右页一拍画一格她无聊的日常（等车/发呆/看雨），
//      再一拍擦淡一格；唱到「精彩」一朵小烟花哑火；第 16 拍翻页
const GIRL_X = 1180, GIRL_S = 2.6, POLE_X = 1560;
const S2_CAM = [1030, 380, 2.0];                       // S1 结尾推到的位置 = S2 开头的镜头
const PANEL_L = [230, 175, 660], PANEL_SC = 660 / 1920;   // 左页那一格：放的就是 S2 的整个画面（缩小）
const PANELS_R = [160, 375, 590].map(y => [1010, y, 700, 190]);

// ---------- 开局弹入：放大 + 回弹，回弹最高点正好压在第 n 拍上，拍点上一圈冲击线 ----------
const backC = (p, c) => { p = clamp(p); return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
function popIn(t, n, px, py, fn, o = {}) {
  const tb = bt(n), c = o.c ?? 2.2, D = o.d ?? .32, t0 = tb - (1 - 2 * c / (3 * (c + 1))) * D;   // (1 - 2c/3(c+1)) 是回弹到最高点的进度
  if (t < t0) return;
  let ret;
  G({ x: px, y: py }, () => G({ s: Math.max(.001, backC((t - t0) / D, c)) }, () => G({ x: -px, y: -py }, () => { ret = fn(); })));
  if (o.burst !== false) burst(o.bx ?? px, o.by ?? py, seg(t, tb, tb + .28), o.r ?? 60, 10);
  return ret;
}

// ---------- 公交站（S1、S2 共用的世界，画面坐标 1920×1080，地面 GY） ----------
function stopClock(x, y, r, t) {
  inkParts([part(A.circ(x, y, r), 5, { fill: PAGE })]);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P(A.line(x + Math.cos(a) * r * .74, y + Math.sin(a) * r * .74, x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9), { w: i % 3 ? 2.5 : 4 }); }
  const sb = sbeat(t), n = Math.floor(sb), f = sb - n;
  const am = (-60 + 30 * (n + E.outBack(clamp(f / .12)))) * Math.PI / 180, ah = 30 * Math.PI / 180;   // 分针每拍跳一格（带回弹）
  P(A.line(x, y, x + Math.cos(ah) * r * .45, y + Math.sin(ah) * r * .45), { w: 6 });
  P(A.line(x, y, x + Math.cos(am) * r * .78, y + Math.sin(am) * r * .78), { w: 4.5 });
  P(A.circ(x, y, 5), { fill: INK });
  if (n >= 2) burst(x, y, seg(t, bt(n), bt(n) + .22), r + 6, 10);   // 第 1 拍弹进来，之后每拍一圈
}
function busSign(x, y, r) {
  inkParts([part(A.circ(x, y, r), 5, { fill: PAGE }), part(A.rrect(x - 42, y - 26, 84, 44, 9), 3.5, { fill: PAPER }),
    part(A.line(x - 42, y - 4, x + 42, y - 4), 2.5), part(A.line(x - 14, y - 26, x - 14, y - 4), 2.5), part(A.line(x + 14, y - 26, x + 14, y - 4), 2.5),
    part(A.circ(x - 24, y + 22, 8), 3.5, { fill: PAGE }), part(A.circ(x + 24, y + 22, 8), 3.5, { fill: PAGE })]);
}
function cicada(x, y, t) {
  inkParts([part(A.ell(x, y, 11, 20), 3.5, { fill: PAPER }), part(A.ell(x - 8, y + 8, 7, 22), 2.5, { fill: PAGE }), part(A.ell(x + 8, y + 8, 7, 22), 2.5, { fill: PAGE }),
    part(A.circ(x, y - 18, 7), 3, { fill: PAPER })]);
  const on = Math.floor(sbeat(t)) % 2 === 0 ? 1 : .35;   // 一拍响一拍轻
  for (let k = 0; k < 3; k++) P(A.arc(x + 6, y - 6, 34 + k * 18, 30 + k * 16, -50, 30), { w: 3, op: on * (1 - k * .22) });
}
// 热浪：从路面升起的几条波浪线，一直往上飘
function heat(t, k) {
  if (k <= 0) return;
  [620, 800, 960].forEach((x0, i) => {
    const ph = (t * 1.2 + hash(i) ) % 1, pts = [];
    for (let j = 0; j <= 10; j++) { const yy = GY - 30 - j * 15 - ph * 60; pts.push([x0 + Math.sin(yy / 22 + t * 6 + i) * 9, yy]); }
    P(A.smooth(pts), { w: 3, op: .75 * Math.sin(Math.PI * clamp(ph * 1.2)) , draw: k });
  });
}
// 她（站着）。st: { face, look, L, R, tears, sweat }；返回手和头的位置
function stopGirl(t, st) {
  return drawPerson(GIRL_X, GY, { who: 'girl', s: GIRL_S, face: st.face, look: st.look, hands: { L: st.L, R: st.R }, tears: st.tears, sweat: st.sweat,
    dy: -5 * pulse(t, 7), r: 1.2 * Math.sin(sbeat(t) * Math.PI) });
}
// 西瓜冰棍：stick 在手里，top 掉了以后只剩棍
const LS = 1.6;   // 冰棍大小
function iceLolly(hx, hy, o = {}) {
  const top = hy - 20 * LS;
  P(A.line(hx, top, hx, top + 42 * LS), { w: 9 });
  if (!o.gone) G({ x: hx + (o.dx || 0), y: top + (o.dy || 0), r: o.r || 0 }, () => {
    P(A.rrect(-18 * LS, -70 * LS, 36 * LS, 72 * LS, 14 * LS), { w: 8, fill: RED, fillOp: .8 });
    P(A.line(-11 * LS, -58 * LS, 11 * LS, -58 * LS), { w: 4, c: PAGE });
  });
  P(A.circ(hx, hy, 8.5 * GIRL_S), { w: 4 * GIRL_S * .72, fill: PAPER });   // 手压在棍子上面
}
function drop(x, y, s = 1) { P(A.smooth([[x, y - 12 * s], [x + 6 * s, y], [x, y + 6 * s], [x - 6 * s, y]], true), { w: 2.5, fill: PAGE }); }

function stopWorld(t, st) {
  // 第 0 拍：地面、马路、电线
  popIn(t, 0, 1100, GY, () => { inkParts(ground(-300, 2300)); P(A.line(-300, 1010, 2300, 1010), { w: 4, dash: '70 46' }); }, { r: 90 });
  popIn(t, 0, 900, 290, () => { P(A.smooth([[-80, 210], [600, 300], [POLE_X, 268]]), { w: 3 }); P(A.smooth([[-80, 250], [700, 352], [POLE_X, 300]]), { w: 2.5 }); }, { burst: false });
  // 第 3 拍：太阳、树和蝉
  popIn(t, 3, 1790, 290, () => inkParts(sun(1790, 290, 62, .55 + .45 * pulse(t, 5))), { r: 80 });
  popIn(t, 3, 420, GY, () => { inkParts(tree(420, GY, 2.4)); cicada(446, 800, t); }, { bx: 420, by: 600, r: 120 });
  heat(t, seg(t, bt(3), bt(3) + .25));
  // 第 1 拍：站牌和钟（从地上弹起来）
  popIn(t, 1, POLE_X, GY, () => {
    inkParts([part(A.rect(POLE_X - 9, 400, 18, GY - 400), 4, { fill: PAPER }), part(A.ell(POLE_X, GY, 40, 9), 3.5, { fill: PAPER })]);
    busSign(POLE_X, 330, 74);
    stopClock(POLE_X, 560, 56, t);
  }, { bx: POLE_X, by: 450, r: 110 });
  // 第 2 拍：她（回弹最大）
  return popIn(t, 2, GIRL_X, GY, () => {
    const g = stopGirl(t, st), [hx, hy] = g.R;
    iceLolly(hx, hy, st.lolly || {});
    if (!(st.lolly && st.lolly.gone)) for (let k = 3; k <= Math.floor(sbeat(t)) && k < 8; k++) {   // 第 3 拍起，一拍滴一滴
      const dt = t - bt(k); if (dt < 0 || dt > .6) continue;
      drop(hx + 2, hy + 24 * LS + 900 * dt * dt + 120 * dt, 1.8);
    }
    return g;
  }, { c: 3.5, d: .36, bx: GIRL_X, by: GY - 330, r: 230 });
}

// ---------- S1：还有什么等待 ----------
function s1(t, lt) {
  const p = E.in(seg(t, bt(4) - .22, bt(4)));   // 最后一下推到她脸上（接 S2）
  const z0 = 1.25 + .03 * t + .014 * pulse(t, 9), cx0 = 1100 + 8 * t;
  CAM(lerp(cx0, S2_CAM[0], p), lerp(610, S2_CAM[1], p), lerp(z0, S2_CAM[2], p), 0, () => {
    stopWorld(t, { face: 'normal', look: [-1, -.2], L: [-34, -214, -66, -158], R: [70, -92], sweat: t > bt(3) });
  });
}
shot(0, 'S1 等车', s1, { tint: ['#f7d6a0', .08] });

// ---------- S2：还有什么悲哀 ----------
function s2View(t) {
  const lt = Math.min(t, bt(8)) - bt(4), d = E.out(seg(t, bt(4), bt(4) + .3));
  const cry = t >= bt(7), sad = t >= bt(5);
  const L = [lerp(-34, -44, d), lerp(-214, -72, d), lerp(-66, -40, d), lerp(-158, -110, d)];
  const fall = t - bt(6), lolly = fall < 0 ? {} : fall > .5 ? { gone: true } : { dy: 2400 * fall * fall + 100 * fall, dx: 60 * fall, r: 260 * fall };
  CAM(S2_CAM[0] + 8 * lt, S2_CAM[1] - 6 * lt, S2_CAM[2] + .07 * lt + .03 * pulse(t, 9), 0, () => {
    const g = stopWorld(t, { face: cry ? 'cry' : sad ? 'sad' : 'normal', look: sad ? [-.2, .5] : [-.6, 0], L, R: [70, -92],
      tears: cry ? E.out(seg(t, bt(7), bt(7) + .4)) : 0, sweat: !sad, lolly });
    // 头顶的乌云：第 4 拍画出来，第 5 拍下雨，第 7 拍打雷
    const [cx, cy] = [g.head[0] - 10, g.head[1] - 46 * GIRL_S - 92 + 4 * Math.sin(t * 5)], k = seg(t, bt(4), bt(4) + .28);
    if (k > 0) {
      const blob = A.smooth([[cx - 150, cy + 20], [cx - 128, cy - 22], [cx - 70, cy - 36], [cx - 20, cy - 66], [cx + 50, cy - 46], [cx + 110, cy - 30], [cx + 156, cy + 20]], true);
      P(blob, { fill: PAGE, op: k });
      if (cry) G({ clip: blob }, () => { for (let i = 0; i < 9; i++) P(A.line(cx - 170 + i * 42, cy + 30, cx - 130 + i * 42, cy - 70), { w: 3, op: .55 }); });
      inkParts(A.cloud(cx, cy, 1).map(d => part(d, 5)), k);
      if (t > bt(4) && t < bt(4) + .3) burst(cx, cy - 20, seg(t, bt(4) + .1, bt(4) + .35), 150, 12);
    }
    if (t >= bt(5)) for (let i = 0; i < 16; i++) {   // 雨
      const t0 = bt(5) + hash(i) * .25; if (t < t0) continue;
      const ph = ((t - t0) * 1.7 + hash(i + 9)) % 1, x = cx - 150 + hash(i * 3.1) * 300, y = cy + 26 + ph * 520;
      P(A.line(x, y, x - 6, y + 34), { w: 3.5, op: 1 - ph * .5 });
    }
    if (cry && t < bt(7) + .32) {   // 打雷
      const q = seg(t, bt(7), bt(7) + .08);
      P(A.poly([[cx + 70, cy + 18], [cx + 44, cy + 92], [cx + 76, cy + 88], [cx + 40, cy + 178], [cx + 112, cy + 74], [cx + 80, cy + 78], [cx + 104, cy + 18]], true), { w: 4.5, fill: PAGE, draw: q });
    }
  });
  if (cry) flash(.45 * (1 - seg(t, bt(7), bt(7) + .2)) * (t >= bt(7) ? 1 : 0));
}
function s2(t) { s2View(t); flash(.5 * (1 - seg(t, bt(4), bt(4) + .18))); }
shot(4, 'S2 悲哀', s2, { tint: t => [mixCol('#f7d6a0', '#dbe4f2', seg(t, bt(4), bt(5))), .08] });   // 只留很淡的一层冷色，纸面保持亮；情绪靠乌云、雨线、表情

// ---------- S3：这故事中的人不太精彩 ----------
function bookSpread(t) {
  P(A.rrect(124, 100, 1672, 760, 18), { w: 5, fill: PAPER });                                        // 封皮
  P(A.rect(150, 142, 1630, 700), { fill: INK, op: .08 });                                            // 页下的影子
  for (const [x0, x1] of [[150, 955], [965, 1770]]) {
    const mid = (x0 + x1) / 2, sp = x0 < 960 ? x1 : x0;
    P(A.smooth([[x0, 132], [mid, 118], [sp, 140], [sp, 838], [mid, 824], [x0, 832]], true), { w: 4, fill: PAGE });
  }
  P(A.line(960, 140, 960, 836), { w: 4 });
  P(A.line(952, 150, 952, 826), { w: 2, op: .4 }); P(A.line(968, 150, 968, 826), { w: 2, op: .4 });
}
// 左页：那一格（S2 的画面缩小进来）+ 下面几行"故事文字"（波浪线代替）
function leftPage(t) {
  const [px, py, pw] = PANEL_L, ph = 1080 * PANEL_SC;
  G({ x: px, y: py, s: PANEL_SC }, () => G({ clip: A.rect(0, 0, 1920, 1080) }, () => { P(A.rect(-10, -10, 1940, 1100), { fill: PAPER }); s2View(t); }));
  P(A.rect(px, py, pw, ph), { w: 5 });
  for (let i = 0; i < 5; i++) P(A.wave(px + 10, py + ph + 62 + i * 44, px + pw - (i === 4 ? 260 : 20), 3, 46), { w: 3, op: .55 });
}
// 右页三格：她的日常（局部坐标 1920 × 521，地面 y=470）
const PSC = 700 / 1920, LG = 470;
const panelArt = [
  k => {   // 等车
    let tip = inkParts([part(A.line(-50, LG, 1970, LG), 4), part(A.rect(1310, 120, 14, LG - 120), 3.5, { fill: PAPER }), part(A.circ(1317, 110, 46), 4.5, { fill: PAGE }),
      ...sun(300, 120, 44, .6)], clamp(k * 2), { tip: true });
    const g = drawPerson(900, LG, { who: 'girl', s: 1.3, face: 'normal', look: [-1, -.2], hands: { L: [-34, -214, -66, -158], R: [30, -112] }, draw: clamp(k * 2 - 1) });
    return k < .5 ? tip : g.tip;
  },
  k => {   // 托腮发呆
    let tip = inkParts([...win(1150, 70, 300, 250), part(A.line(-50, LG, 1970, LG), 4)], clamp(k * 2), { tip: true });
    const g = drawPerson(820, 420, { who: 'girl', s: 1.3, sit: true, face: 'dreamy', look: [.6, -.4], hands: 'chin', draw: clamp(k * 2 - 1) });
    const tip2 = inkParts(desk(820, 400, 420, LG), clamp(k * 2 - 1.2), { tip: true });
    return k < .5 ? tip : (tip2 || g.tip);
  },
  k => {   // 背对着看窗外下雨
    const rain = []; for (let i = 0; i < 9; i++) { const x = 1040 + i * 40, y = 90 + hash(i) * 150; rain.push(part(A.line(x, y, x - 8, y + 50), 2.5)); }
    let tip = inkParts([...win(960, 60, 480, 330, { fill: PAGE }), ...rain, part(A.line(-50, LG, 1970, LG), 4)], clamp(k * 2), { tip: true });
    const g = drawPerson(760, LG, { who: 'girl', s: 1.3, back: true, hands: 'down', draw: clamp(k * 2 - 1) });
    return k < .5 ? tip : g.tip;
  },
];
function rightPage(t) {
  let tip = null;
  PANELS_R.forEach(([px, py, pw, ph], i) => {
    const b = 9 + i, k = seg(t, bt(b) - .08, bt(b) + .3);
    if (k <= 0) return;
    const fade = E.out(seg(t, bt(12 + i), bt(12 + i) + .3));          // 第 12、13、14 拍各擦淡一格
    G({ op: 1 - .74 * fade }, () => G({ x: px, y: py, s: PSC }, () => G({ clip: A.rect(0, 0, 1920, 521) }, () => {
      const tp = panelArt[i](k);
      if (k < 1 && tp) tip = [px + tp[0] * PSC, py + tp[1] * PSC];
    })));
    inkParts([roughRect(px, py, pw, ph, i + 3)], clamp(k * 3));
    const e = seg(t, bt(12 + i) - .02, bt(12 + i) + .3);
    if (e > 0 && e < 1) eraser(px + pw * (.12 + .76 * e), py + ph * (.5 + .28 * Math.sin(e * Math.PI * 6)), 2.4, -20 + 30 * Math.sin(e * 20));
  });
  if (tip) drawPencil(tip[0], tip[1], -55 + Math.sin(t * 40) * 3, { s: .75 });
  // 唱到「精彩」：一朵小烟花哑火
  const x = 1365, top = 300, a = bt(15) - .2, b = bt(15);
  if (t > a && t < b + .6) {
    const up = E.out(seg(t, a, b)), y = lerp(800, top, up), fd = 1 - seg(t, b + .35, b + .6);
    if (t < b + .1) P(A.line(x, 800, x, y), { w: 3, dash: '10 12', op: fd });
    if (t < b) P(A.circ(x, y, 7), { w: 3, fill: PAGE });
    else {
      const dt = t - b, r = 70 * E.out(seg(t, b, b + .14));
      for (let i = 0; i < 10; i++) {
        const an = i / 10 * Math.PI * 2, ex = x + Math.cos(an) * r, ey = top + Math.sin(an) * r + 240 * dt * dt * 2;
        P(A.smooth([[x + Math.cos(an) * r * .45, top + Math.sin(an) * r * .45], [ex, ey - 20 * dt], [ex + Math.cos(an) * 6, ey + 40 * dt]]), { w: 3.5, op: fd });
      }
      if (dt > .14) P(A.spiral(x + 6, top - 6 - 30 * dt, 22, 1.5, 1, 90), { w: 3, op: fd * .8 });
    }
  }
}
function s3(t, lt) {
  const rv = E.inOut(seg(t, bt(8), bt(8) + .55));   // 拉远：从"左页那一格占满画面"拉到整本书
  const pc = [PANEL_L[0] + PANEL_L[2] / 2, PANEL_L[1] + 1080 * PANEL_SC / 2], z0 = 1 / PANEL_SC;
  const z1 = 1 + .012 * pulse(t, 9) + .008 * Math.max(0, t - bt(9));
  const z = Math.exp(lerp(Math.log(z0), Math.log(z1), rv));
  const fk = seg(t, bt(16), bt(17));                // 第 16 拍翻页，第 17 拍落下
  CAM(lerp(pc[0], 960, rv), lerp(pc[1], 470, rv), z, 0, () => {
    bookSpread(t);
    if (fk < 1) leftPage(t);
    if (fk <= 0) { rightPage(t); return; }
    const c = Math.cos(Math.PI * E.inOut(fk));
    P(A.rect(965, 125, 805, 705), { fill: PAGE });                          // 翻出来的新一页（空白）
    P(A.rect(965, 125, 805 * Math.max(0, c) + 20, 705), { fill: INK, op: .1 * (1 - fk) });
    G({ x: 960 }, () => G({ sx: flipS(c) }, () => G({ x: -960 }, () => {
      if (c > 0) rightPage(t); else P(A.smooth([[965, 140], [1367, 118], [1770, 132], [1770, 832], [1367, 824], [965, 838]], true), { w: 4, fill: PAGE });
    })));
  });
  flash(.35 * (1 - seg(t, bt(16), bt(16) + .15)) * (t >= bt(16) ? 1 : 0));
}
shot(8, 'S3 故事书', s3, { tint: t => ['#dbe4f2', .08 * (1 - seg(t, bt(8), bt(8) + .5))] });
