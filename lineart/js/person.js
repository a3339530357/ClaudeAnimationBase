// 人物：Q 版大头小人（五千年的画法），她和他。原点在两脚中间，向上为负；成人头心在 (0,-188)，半径 46。
// person(o) 返回部件列表 [{d, w, fill, c, op}]，按"铅笔先画哪笔"的顺序排好，交给 inkParts() 一笔笔画出来。
//   o.who 'girl' | 'boy'，o.face 表情（见 FACE），o.look [x, y] -1..1 眼睛嘴巴往哪边偏（转头的意思）
//   o.hands { L: [x, y], R: [x, y] } 或姿势名（见 POSE）；L 是画面左边那只手
//   o.walk 走路相位（每 1.0 迈一步）, o.step 0..1 步子大小, o.jump 0..1 双脚离地收起, o.sit 坐着（不画腿）
//   o.blush 0..1 脸红, o.tears 0..1 眼泪, o.sweat 冒汗, o.back 背影, o.kid 七岁的她
//   她：o.bag 斜挎包；他：o.slip 0..1 眼镜滑下来, o.glint 0..1 镜片反光, o.earPencil 耳朵上夹铅笔（默认有）

// ---------- 姿势：两只手的位置（可以带肘 [hx, hy, ex, ey]） ----------
const POSE = {
  down:  { L: [-44, -72], R: [44, -72] },
  hold:  { L: [-26, -104], R: [26, -104] },        // 两手在胸前（抱本子、捧东西）
  chest: { L: [-14, -116], R: [14, -116] },
  up:    { L: [-60, -236], R: [60, -236] },
  wave:  { L: [-44, -72], R: [66, -226] },
  point: { L: [-44, -72], R: [92, -150] },
  give:  { L: [-20, -122, -36, -110], R: [20, -122, 36, -110] },   // 双手往前递
  cover: { L: [-30, -176, -42, -140], R: [30, -176, 42, -140] },   // 捂脸 / 抱头
  hips:  { L: [-30, -94, -60, -114], R: [30, -94, 60, -114] },
  write: { L: [-34, -100], R: [52, -108] },
  chin:  { L: [-44, -72], R: [36, -158, 52, -118] },               // 托腮（手贴在脸颊边）
  run:   { L: [-50, -96, -44, -128], R: [48, -150, 50, -118] },
};

// ---------- 表情：头的局部坐标（头心 0,0，半径 46；眼睛在 y=-2，嘴在 y=+20） ----------
// 每个函数用 a(d, w, extra) 加部件；ex/ey 是眼睛跟着 look 的偏移，C 把局部点换成画面坐标
const FACE = {
  normal: (a, C) => { a(C.dot(-16, -2, 4.8)); a(C.dot(16, -2, 4.8)); a(C.sm([[-10, 18], [0, 24], [10, 18]]), 3.5); },
  smile: (a, C) => { a(C.dot(-16, -2, 4.8)); a(C.dot(16, -2, 4.8)); a(C.sm([[-14, 15], [0, 26], [14, 15]]), 3.5); },
  happy: (a, C, o) => {
    a(C.pl([[-23, 1], [-16, -8], [-9, 1]]), 3.5); a(C.pl([[9, 1], [16, -8], [23, 1]]), 3.5);
    a(C.raw('M-14 16Q0 38 14 16Z'), 3.5, { fill: o.who === 'girl' ? RED : PAPER, fillOp: o.who === 'girl' ? .85 : 1 });
  },
  laugh: (a, C, o) => {
    a(C.pl([[-23, -8], [-12, -2], [-23, 4]]), 3.5); a(C.pl([[23, -8], [12, -2], [23, 4]]), 3.5);
    a(C.raw('M-17 13Q0 44 17 13Z'), 3.5, { fill: o.who === 'girl' ? RED : PAPER, fillOp: o.who === 'girl' ? .85 : 1 });
  },
  dreamy: (a, C) => {   // 发呆：眼睛往上飘，嘴巴一个小圆
    a(C.dot(-15, -7, 4.2)); a(C.dot(17, -7, 4.2));
    a(C.sm([[-24, -4], [-16, -1], [-8, -4]]), 2.5); a(C.sm([[8, -4], [16, -1], [24, -4]]), 2.5);
    a(C.pl([[-4, 21], [6, 20]]), 3);
  },
  scared: (a, C) => {   // > <
    a(C.pl([[-24, -9], [-12, -2], [-24, 5]]), 3.5); a(C.pl([[24, -9], [12, -2], [24, 5]]), 3.5);
    a(C.pl([[-12, 20], [-6, 16], [0, 20], [6, 16], [12, 20]]), 3);
  },
  cry: (a, C) => {
    a(C.sm([[-24, -2], [-16, 3], [-8, -2]]), 3.5); a(C.sm([[8, -2], [16, 3], [24, -2]]), 3.5);
    a(C.sm([[-12, 22], [-4, 17], [4, 19], [12, 16]]), 3.5);
  },
  surprised: (a, C) => {
    a(C.circ(-16, -4, 7), 3); a(C.circ(16, -4, 7), 3); a(C.dot(-16, -4, 2.6)); a(C.dot(16, -4, 2.6));
    a(C.ell(0, 22, 6, 8), 3.5);
  },
  shy: (a, C) => {      // 不敢看：眼睛往下，嘴巴抿成波浪
    a(C.dot(-15, 3, 4.2)); a(C.dot(17, 3, 4.2));
    a(C.pl([[-8, 22], [-3, 19], [2, 22], [7, 19]]), 3);
  },
  sleep: (a, C) => {
    a(C.sm([[-23, -2], [-16, 3], [-9, -2]]), 3.5); a(C.sm([[9, -2], [16, 3], [23, -2]]), 3.5);
    a(C.circ(0, 21, 4.5), 3);
  },
  panic: (a, C) => {    // 慌：眼睛瞪圆，嘴巴张开抖
    a(C.circ(-16, -3, 8), 3); a(C.circ(16, -3, 8), 3); a(C.dot(-15, -2, 3)); a(C.dot(17, -2, 3));
    a(C.raw('M-12 24L-6 16L0 22L6 15L12 23Q0 34 -12 24Z'), 3, { fill: PAPER });
  },
  determined: (a, C) => {   // 下定决心：眉毛压下来，嘴抿成一条线
    a(C.dot(-16, -1, 4.6)); a(C.dot(16, -1, 4.6));
    a(C.pl([[-26, -16], [-8, -10]]), 3.5); a(C.pl([[26, -16], [8, -10]]), 3.5);
    a(C.pl([[-9, 20], [9, 20]]), 3.5);
  },
  sad: (a, C) => {
    a(C.dot(-16, 0, 4.5)); a(C.dot(16, 0, 4.5));
    a(C.pl([[-25, -11], [-10, -17]]), 3); a(C.pl([[25, -11], [10, -17]]), 3);
    a(C.sm([[-10, 25], [0, 19], [10, 25]]), 3.5);
  },
  pout: (a, C) => {     // 嘟嘴（被吓到又不服气、冰棍化了）
    a(C.dot(-16, -2, 4.6)); a(C.dot(16, -2, 4.6));
    a(C.sm([[-5, 18], [0, 22], [5, 18]]), 3); a(C.sm([[-5, 22], [0, 18], [5, 22]]), 3);
  },
};

// 头部坐标换算：把头局部坐标 (x, y) 放到画面上的 (hx + (x + lx) * s, hy + (y + ly) * s)
function headC(hx, hy, s, lx = 0, ly = 0) {
  const p = ([x, y]) => [hx + (x + lx) * s, hy + (y + ly) * s];
  const C = {
    s, p, pl: pts => A.poly(pts.map(p)), sm: pts => A.smooth(pts.map(p)), smz: pts => A.smooth(pts.map(p), true),
    dot: (x, y, r) => ({ d: A.circ(...p([x, y]), r * s), fill: INK, w: 0 }),
    circ: (x, y, r) => A.circ(...p([x, y]), r * s), ell: (x, y, rx, ry) => A.ell(...p([x, y]), rx * s, ry * s),
    // 原始 path（只认 M/L/Q/Z 和绝对坐标）：逐对数字换算
    raw: d => d.replace(/(-?\d+\.?\d*)[ ,](-?\d+\.?\d*)/g, (_, x, y) => p([+x, +y]).map(R).join(' ')),
  };
  return C;
}

// ---------- 头 ----------
function headParts(o, hx, hy, s) {
  const out = [], add = (d, w = 5, x = {}) => out.push(typeof d === 'object' ? { ...d, ...x } : { d, w, ...x });
  const [lx, ly] = o.look || [0, 0], girl = o.who === 'girl';
  const F = headC(hx, hy, s), C = headC(hx, hy, s, lx * 10, ly * 6);
  add(F.circ(0, 0, 46), 5, { fill: PAPER });
  if (o.top) {    // 低头鞠躬：看见头顶（发旋），脸藏在下面，只露一点眼镜框
    if (girl) { add(F.smz([[-52, 34], [-56, -2], [-46, -40], [-22, -56], [0, -58], [22, -56], [46, -40], [56, -2], [52, 34], [0, 44]]), 4, { fill: HAIR }); add(F.raw(`M18 30L40 22L42 27L20 35Z`), 2.5, { fill: RED }); }
    else {
      add(F.smz([[-47, 20], [-48, -16], [-34, -46], [-6, -58], [24, -52], [44, -30], [48, 4], [44, 24], [20, 34], [-20, 34]]), 4.5, { fill: PAPER });
      add(F.raw('M-2 -8') + A.spiral(...F.p([-2, -8]), 16 * F.s, 1.6).slice(1).replace(/^[^C]*/, 'L' + F.p([-2, -8]).map(R).join(' ')), 3);
      for (const sd of [-1, 1]) add(A.arc(...F.p([sd * 17, 40]), 13 * F.s, 7 * F.s, 200, 340), 3.5);   // 眼镜框露出一点
      add(F.sm([[-20, -50], [-30, -64], [-22, -75]]), 3.5); add(F.sm([[18, -52], [30, -65], [42, -63]]), 3.5); add(F.sm([[2, -57], [-1, -77], [10, -87], [17, -81]]), 3.5);
    }
  } else if (o.back) {   // 背影：头发盖住整个后脑勺
    if (girl) add(F.smz([[-52, 38], [-56, 0], [-46, -40], [-22, -56], [0, -58], [22, -56], [46, -40], [56, 0], [52, 38], [20, 44], [-20, 44]]), 4, { fill: HAIR });
    else { add(F.smz([[-47, 6], [-46, -30], [-22, -54], [8, -56], [36, -42], [47, -8], [44, 14], [0, 20]]), 4.5, { fill: PAPER });
      for (const x of [-16, 14]) add(F.sm([[x, -44], [x + 3, -24]]), 2.5);
      add(F.sm([[-22, -54], [-32, -68], [-24, -79]]), 3.5); add(F.sm([[18, -57], [30, -70], [42, -68]]), 3.5); add(F.sm([[2, -60], [-1, -80], [10, -90], [17, -84]]), 3.5); }
  } else {
    (FACE[o.face || 'normal'] || FACE.normal)(add, C, o);
    if (o.blush) {
      if (girl) for (const x of [-28, 28]) add(C.ell(x, 12, 9, 5.5), 0, { fill: RED, fillOp: .3 * o.blush });
      else for (const x of [-30, 22]) for (let k = 0; k < 3; k++) add(C.pl([[x + k * 6, 16], [x + k * 6 + 5, 8]]), 2.2, { op: o.blush });
    }
    if (o.tears) for (const sd of [-1, 1]) add(C.sm([[sd * 16, 6], [sd * 18, 6 + 30 * o.tears], [sd * 17, 10 + 46 * o.tears]]), 3);
    if (o.sweat) add(F.smz([[44, -38], [50, -24], [44, -18], [38, -24]]), 2.5, { fill: PAPER });
    if (girl) hairGirl(add, F, C, lx, o);
    else if (o.who === 'other') add(F.smz([[-47, -2], [-46, -30], [-24, -54], [8, -56], [36, -42], [47, -6], [30, -22], [-30, -20]]), 4.5, { fill: PAPER });   // 路人：普通短发
    else hairBoy(add, F, C, o, lx);
  }
  return out;
}

// 她：黑色短发齐刘海（盖住额头和两边，下摆到下巴），左边（画面右边）一枚红发夹
function hairGirl(add, F, C, lx, o = {}) {
  const b = lx * 6;   // 刘海跟着转头偏一点
  add(F.smz([[-52, 38], [-56, 0], [-47, -38], [-23, -55], [0, -58], [23, -55], [47, -38], [56, 0], [52, 38],
    [41, 36], [42, 8], [37 + b, -12], [-37 + b, -12], [-42, 8], [-41, 36]]), 4, { fill: HAIR });
  add(F.sm([[-26, -44], [-8, -50], [8, -50]]), 3, { c: PAPER });                      // 头顶的一道高光
  const cx = 30 + b, cy = -20, ck = o.clipK ?? 1;                                    // 红发夹：别在刘海上的小发卡；clipK 0..1 弹出来
  if (ck > 0) { const q = (dx, dy) => `${cx + dx * ck} ${cy + dy * ck}`; add(F.raw(`M${q(-12, 4)}L${q(11, -6)}L${q(13, -1)}L${q(-10, 9)}Z`), 2.5, { fill: RED }); }
}

// 他：浅色乱翘的头发（纸色填充 + 几根发丝），圆眼镜（会滑下来），耳朵上夹一支铅笔
function hairBoy(add, F, C, o, lx) {
  const b = lx * 6;
  if (o.earPencil !== false) {   // 铅笔先画，压在头发下面：横着夹在右耳后面
    add(F.pl([[30, -2], [62, -20]]), 9); add(F.pl([[30, -2], [62, -20]]), 4.5, { c: PAPER });
    add(F.raw('M62 -20L71 -26L68 -15Z'), 2.5, { fill: PAPER });
  }
  add(F.smz([[-47, -4], [-48, -26], [-40, -44], [-26, -55], [-6, -60], [14, -59], [32, -51], [44, -38], [48, -18], [47, -4],
    [40, -14], [37 + b, -27], [28 + b, -17], [21 + b, -33], [10 + b, -20], [1 + b, -35], [-9 + b, -21], [-17 + b, -33], [-27 + b, -18], [-33 + b, -30], [-41, -14]]), 4.5, { fill: PAPER });
  add(F.sm([[-22, -54], [-32, -68], [-24, -79]]), 3.5); add(F.sm([[18, -57], [30, -70], [42, -68]]), 3.5);   // 乱翘的发丝
  add(F.sm([[2, -60], [-1, -80], [10, -90], [17, -84]]), 3.5);                                                // 一根呆毛
  for (const x of [-28, 22]) add(F.sm([[x, -50], [x + 5, -38]]), 2.5);
  // 圆眼镜：跟着眼睛走，往下滑 slip
  const sl = (o.slip || 0) * 12, gl = ([x, y]) => C.p([x, y + sl]);
  for (const sd of [-1, 1]) add(A.circ(...gl([sd * 17, -2]), 14 * F.s), 3.5);
  add(A.smooth([gl([-4, -3]), gl([0, -6]), gl([4, -3])]), 3);
  add(A.poly([gl([-31, -4]), F.p([-46, -8])]), 3); add(A.poly([gl([31, -4]), F.p([46, -8])]), 3);
  if (o.glint) for (const sd of [-1, 1]) {   // 镜片反光：两道斜白线
    const [x, y] = gl([sd * 17, -2]);
    add(A.line(x - 9, y + 5, x + 5, y - 9), 5.5, { c: PAPER, op: o.glint }); add(A.line(x - 3, y + 10, x + 10, y - 3), 3, { c: PAPER, op: o.glint });
  }
  if (o.glint > .5) add(A.sparkle(...gl([42, -26]), 10), 2.5, { fill: PAPER, op: o.glint });
}

// ---------- 身体 ----------
// 腿：走路相位 walk、步子 step、跳 jump；返回两只脚的位置
function feet(o) {
  const w = o.walk ?? 0, st = o.walk == null ? 0 : (o.step ?? 1), sw = Math.sin(w * Math.PI) * 14 * st;
  const j = o.jump || 0, liftL = Math.max(0, Math.cos(w * Math.PI)) * 9 * st + 14 * j, liftR = Math.max(0, -Math.cos(w * Math.PI)) * 9 * st + 14 * j;
  return { L: [-15 + sw + 5 * j, -4 - liftL], R: [15 - sw - 5 * j, -4 - liftR] };
}
// 下半身的部件标 low（弯腰时不动），上半身绕腰转
function bodyGirl(add, o, Y, X) {
  const f = feet(o), lo = (d, w, x = {}) => add(d, w, { ...x, low: true });
  if (!o.sit) for (const [sd, [fx, fy]] of [[-1, f.L], [1, f.R]]) {
    lo(A.poly([[X(sd * 12), Y(-48)], [fx, fy]]), 5);
    lo(A.line(fx - 6, fy - 13, fx + 6, fy - 13), 3);                                    // 白袜口
    lo(A.ell(fx + sd * 3, fy + 1, 10, 5.5), 0, { fill: INK });                            // 黑皮鞋
  }
  lo(A.smooth([[X(-27), Y(-99)], [X(-48), Y(-46)], [X(-24), Y(-42)], [0, Y(-41)], [X(24), Y(-42)], [X(48), Y(-46)], [X(27), Y(-99)]], true), 5, { fill: PAPER });
  for (const x of [-13, 0, 13]) lo(A.line(X(x * .8), Y(-96), X(x * 1.5), Y(-45)), 2.5);    // 百褶裙的褶
  add(A.smooth([[X(-21), Y(-141)], [X(-26), Y(-118)], [X(-28), Y(-97)], [0, Y(-95)], [X(28), Y(-97)], [X(26), Y(-118)], [X(21), Y(-141)]], true), 5, { fill: PAPER });
  if (!o.back) { add(A.poly([[X(-17), Y(-139)], [0, Y(-119)], [X(17), Y(-139)]]), 3.5); add(A.circ(0, Y(-117), 4), 0, { fill: INK }); }
  else add(A.poly([[X(-19), Y(-138)], [X(-19), Y(-122)], [X(19), Y(-122)], [X(19), Y(-138)]]), 3);   // 背后的方领
}
function bodyBoy(add, o, Y, X) {
  const f = feet(o), lo = (d, w, x = {}) => add(d, w, { ...x, low: true });
  if (!o.sit) for (const [sd, [fx, fy]] of [[-1, f.L], [1, f.R]]) {
    lo(A.poly([[X(sd * 30), Y(-75)], [X(sd * 3), Y(-75)], [fx - sd * 8, fy - 4], [fx + sd * 8, fy - 4]], true), 5, { fill: PAPER });
    lo(A.ell(fx + sd * 3, fy, 13, 6.5), 4, { fill: PAPER });                              // 球鞋
  }
  add(A.smooth([[X(-24), Y(-142)], [X(-30), Y(-110)], [X(-34), Y(-74)], [0, Y(-72)], [X(34), Y(-74)], [X(30), Y(-110)], [X(24), Y(-142)]], true), 5, { fill: PAPER });
  if (!o.back) {
    add(A.line(0, Y(-134), 0, Y(-76)), 2.5);                                              // 拉链
    for (const sd of [-1, 1]) { add(A.poly([[X(sd * 18), Y(-141)], [X(sd * 8), Y(-127)], [0, Y(-140)]]), 3.5); add(A.line(X(sd * 26), Y(-92), X(sd * 14), Y(-92)), 2.5); }
  }
}
// 手臂：肩 → 肘 → 手；肘不给就自动往外弯一点。她短袖（肩下一道袖口），他长袖（手腕一道袖口）
function arm(add, sh, hand, sd, sleeve) {
  const [hx, hy, ex0, ey0] = hand;
  const ex = ex0 ?? (sh[0] + hx) / 2 + sd * 10, ey = ey0 ?? (sh[1] + hy) / 2 + 6;
  add(A.smooth([sh, [ex, ey], [hx, hy]]), 5);
  if (!sleeve) return;
  const q = sleeve === 'short' ? .3 : .86, a = sleeve === 'short' ? sh : [ex, ey], b = sleeve === 'short' ? [ex, ey] : [hx, hy];
  const mx = lerp(a[0], b[0], q), my = lerp(a[1], b[1], q), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  add(A.line(mx - dy / L * 8, my + dx / L * 8, mx + dy / L * 8, my - dx / L * 8), 3);
}

// 组装一个人。返回部件列表，列表上挂着 .L/.R（两只手在哪）和 .head（[头心 x, y, 缩放]），给道具定位用
function person(o = {}) {
  const out = [], add = (d, w = 5, x = {}) => out.push(typeof d === 'object' ? { ...d, ...x } : { d, w, ...x });
  const girl = o.who === 'girl', kid = !!o.kid;
  const bk = kid ? .74 : 1, hs = kid ? 1.14 : 1, Y = y => y * bk, X = x => x * (kid ? .9 : 1);
  const bow = o.bow || 0, hy = Y(-140) - 48 * hs + 40 * bow;   // o.bow 0..1 低头鞠躬：头往下沉，看见头顶
  const head = headParts({ ...o, top: bow > .5 }, 0, hy, hs);
  if (bow <= .5) out.push(...head);
  (girl ? bodyGirl : bodyBoy)(add, o, Y, X);
  if (bow > .5) out.push(...head);
  const pose = typeof o.hands === 'string' ? POSE[o.hands] : o.hands || POSE.down;
  const hands = {};
  for (const [side, sd] of [['L', -1], ['R', 1]]) {
    const h = pose[side] || POSE.down[side], sh = [X(sd * (girl ? 21 : 25)), Y(girl ? -134 : -136)];
    const hand = [h[0], Y(h[1]), h[2], h[3] != null ? Y(h[3]) : undefined];
    arm(add, sh, hand, sd, girl ? null : 'long');
    hands[side] = [hand[0], hand[1]];
  }
  for (const s of ['L', 'R']) add(A.circ(...hands[s], 8.5), 4, { fill: PAPER });
  if (girl && o.bag) {   // 斜挎帆布包：带子从左肩到右胯，包在画面左边（背影时在右边）
    const m = o.back ? -1 : 1;
    add(A.line(X(19 * m), Y(-138), X(-30 * m), Y(-84)), 3.5);
    if (o.bagBook && !o.back) {   // 敞开的包里露出她的本子，封面上一副小圆眼镜（伏笔）
      add(A.rect(X(-57), Y(-118), 24, 22), 3, { fill: PAPER }); add(A.circ(X(-49), Y(-108), 3.6), 2); add(A.circ(X(-40), Y(-108), 3.6), 2);
    }
    add(A.rrect(X(o.back ? 28 : -60), Y(-100), 32, 26, 5), 4, { fill: PAPER }); add(A.line(X(-60 * m), Y(-92), X(-28 * m), Y(-92)), 2.5);
  }
  // 弯腰（鞠躬）：上半身绕腰转 o.bend 度，腿不动
  const rot = o.bend ? [o.bend, 0, Y(girl ? -97 : -75)] : null;
  if (rot) for (const q of out) if (!q.low) q.rot = rot;
  const rp = p => rot ? rotPt(p, rot) : p;
  out.L = rp(hands.L); out.R = rp(hands.R); out.head = [...rp([0, hy]), hs];
  return out;
}
// 画一个人：x, y 脚底位置，o.s 缩放，o.flip 镜像，o.draw 0..1 一笔笔画出来；o.dy 上下颠，o.r 整个人倾斜（度，绕脚底）
// 返回 { tip, L, R, head }（都是画面坐标），tip 是铅笔正在画的位置
function drawPerson(x, y, o = {}) {
  const parts = person(o), s = o.s ?? 1, f = o.flip ? -1 : 1, r = (o.r || 0) * Math.PI / 180;
  const toW = ([px, py]) => { const X0 = px * f * s, Y0 = (py + (o.dy || 0)) * s; return [x + X0 * Math.cos(r) - Y0 * Math.sin(r), y + X0 * Math.sin(r) + Y0 * Math.cos(r)]; };
  let tip = null;
  const lk = LINE_K; LINE_K = o.lineK ?? .72;   // 人物线条细一点
  try { G({ x, y, r: o.r || 0, s, flip: o.flip, op: o.op }, () => G({ y: o.dy || 0 }, () => { tip = inkParts(parts, o.draw ?? 1, { tip: true }); })); } finally { LINE_K = lk; }
  return { tip: tip && toW([tip[0], tip[1] - (o.dy || 0)]), L: toW(parts.L), R: toW(parts.R), head: [...toW([parts.head[0], parts.head[1]]), parts.head[2] * s] };
}
