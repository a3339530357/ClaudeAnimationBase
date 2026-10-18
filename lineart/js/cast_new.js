// 新角色（样片 B 的线稿画风）：给用户挑人物用的设定图，不进视频。用户："每个视频的人物都一样观众不喜欢"。
// 和 person.js 的她/他（黑短发红发夹、圆眼镜铅笔）完全不同：发型、主题色、衣服、身高、手里的东西都换掉。
// castPerson(sp, o) 返回部件列表（和 person() 一样交给 inkParts 画）；castHead(sp, o, hx, hy, s) 只画头。
//   sp：CAST 里的一个角色；o.face 表情（FACE 里的名字），o.hands 姿势（POSE 名或 {L, R}），o.look 转头
// 原点在两脚中间，向上为负；头心在 (0, Y(-140) - 48)，半径 46（和 person.js 一样的大头比例）

const PAGE_W = '#fbf8f1';
const CAST = [
  { id: 'xiayou', name: '夏柚', tag: '元气体育生', who: 'girl', hk: .96,
    line: '高马尾配薄荷发带，跑得比谁都快，哭也哭得最响',
    hair: '#c98a52', accent: '#2fb5a3', top: 'tee', topC: PAGE_W, bottom: 'shorts', bottomC: '#2fb5a3', shoes: 'sneaker', socks: true,
    hands: 'wave', faces: [['laugh', '大笑'], ['determined', '认真'], ['cry', '大哭']] },
  { id: 'baizhi', name: '白栀', tag: '安静文艺', who: 'girl', hk: 1,
    line: '长直发、草帽和白裙子，书里夹着去年的花',
    hair: '#7d5f50', accent: '#5b8fd6', top: 'dress', topC: PAGE_W, shoes: 'sandal', lashes: true, avS: .78,
    hands: 'hold', faces: [['smile', '微笑'], ['dreamy', '发呆'], ['sad', '难过']] },
  { id: 'tangdou', name: '糖豆', tag: '古灵精怪', who: 'girl', hk: .9,
    line: '双丸子头、大圆眼镜和雀斑，走到哪拍到哪',
    hair: '#e0a96d', accent: '#f07f9c', top: 'tee', topC: '#fde3e8', bottom: 'overalls', bottomC: '#a9cbe8', shoes: 'sneaker', glasses: true, freckles: true,
    hands: 'hips', faces: [['happy', '开心'], ['surprised', '吃惊'], ['pout', '嘟嘴']] },
  { id: 'aye', name: '阿野', tag: '篮球少年', who: 'boy', hk: 1.12, skin: '#f0d2ad',
    line: '刺刺的短发、脸上一块创可贴，23 号，晒得黑黑的',
    hair: '#6f5240', accent: '#f2873a', top: 'tank', topC: '#f2873a', bottom: 'longshorts', bottomC: '#f2873a', shoes: 'sneaker', brows: 6, bandaid: true,
    hands: { L: [-48, -104, -50, -128], R: [44, -72] }, faces: [['laugh', '大笑'], ['determined', '认真'], ['sad', '难过']] },
  { id: 'jiangyu', name: '江屿', tag: '白衬衫', who: 'boy', hk: 1.1,
    line: '中分刘海、挂脖耳机，话很少，汽水只喝橘子味',
    hair: '#8c6a55', accent: '#4b86c9', top: 'shirt', topC: PAGE_W, bottom: 'pants', bottomC: '#dcd7cc', shoes: 'sneaker', brows: 2.5, phones: true,
    hands: { L: [-44, -72], R: [34, -122, 50, -104] }, faces: [['smile', '浅笑'], ['shy', '害羞'], ['sad', '难过']] },
  { id: 'juanjuan', name: '卷卷', tag: '滑板男孩', who: 'boy', hk: 1.04,
    line: '自然卷加反戴棒球帽，宽 T 恤，总在街角练滑板',
    hair: '#b58456', accent: '#5aaf68', top: 'oversize', topC: PAGE_W, bottom: 'shorts', bottomC: '#d9cdb4', shoes: 'sneaker', socks: true,
    hands: { L: [-58, -96, -46, -120], R: [44, -72] }, faces: [['happy', '得意'], ['scared', '摔了'], ['cry', '哭']] },
];

// ---------- 发型：back 画在头后面（马尾、长发、丸子），front 画在脸上面（刘海、帽子） ----------
const HAIRDO = {
  xiayou: {
    back(add, F, sp) {
      add(F.smz([[18, -50], [40, -68], [66, -68], [84, -48], [90, -16], [84, 18], [72, 42], [69, 14], [64, -14], [50, -38], [30, -46]]), 4, { fill: sp.hair });
      add(F.sm([[56, -52], [74, -32], [78, 2]]), 2.5); add(F.sm([[44, -56], [62, -40], [66, -10]]), 2.5);
    },
    front(add, F, sp) {
      add(F.smz([[-50, 8], [-53, -18], [-45, -40], [-25, -55], [0, -59], [25, -55], [45, -40], [53, -18], [50, 8], [45, 6], [44, -12],
        [36, -22], [14, -26], [-2, -34], [-14, -22], [-30, -24], [-42, -12], [-45, 6]]), 4, { fill: sp.hair });
      add(F.sm([[-49, -24], [-30, -42], [0, -49], [30, -42], [49, -24]]), 9, { c: sp.accent });          // 薄荷发带
      add(F.sm([[-24, -52], [-8, -55], [8, -55]]), 3, { c: PAPER });
      add(F.ell(31, -55, 7, 5), 3, { fill: sp.accent });                                                    // 马尾的发圈
    },
  },
  baizhi: {
    back(add, F, sp) {
      add(F.smz([[-50, -20], [-58, 30], [-60, 80], [-54, 116], [-30, 124], [0, 118], [30, 124], [54, 116], [60, 80], [58, 30], [50, -20], [30, -50], [0, -58], [-30, -50]]), 4, { fill: sp.hair });
      for (const x of [-46, 46]) add(F.sm([[x, 40], [x * 1.08, 80], [x, 110]]), 2.5);
    },
    front(add, F, sp) {
      add(F.smz([[-50, 36], [-54, 4], [-48, -30], [-28, -52], [0, -58], [28, -52], [48, -30], [54, 4], [50, 36], [42, 34], [40, 6],
        [32, -20], [6, -40], [0, -34], [-6, -40], [-32, -20], [-40, 6], [-42, 34]]), 4, { fill: sp.hair });
      // 草帽：帽檐、帽顶、蓝丝带和蝴蝶结
      add(F.ell(0, -44, 86, 17), 4, { fill: '#efd79b' });
      add(F.smz([[-40, -44], [-38, -70], [-20, -84], [0, -87], [20, -84], [38, -70], [40, -44]]), 4, { fill: '#efd79b' });
      for (const x of [-26, -8, 10, 28]) add(F.sm([[x, -78], [x + 2, -48]]), 1.8, { op: .5 });
      add(F.sm([[-40, -52], [0, -56], [40, -52]]), 9, { c: sp.accent });
      add(F.smz([[38, -54], [56, -64], [58, -46]]), 3, { fill: sp.accent }); add(F.sm([[40, -50], [50, -32], [58, -26]]), 4, { c: sp.accent });
    },
  },
  tangdou: {
    back(add, F, sp) {
      for (const sd of [-1, 1]) { add(F.circ(sd * 36, -52, 19), 4, { fill: sp.hair }); add(F.sm([[sd * 44, -54], [sd * 36, -62], [sd * 28, -54], [sd * 34, -48]]), 2.5); }
    },
    front(add, F, sp) {
      add(F.smz([[-50, 28], [-54, -4], [-46, -36], [-24, -54], [0, -58], [24, -54], [46, -36], [54, -4], [50, 28], [42, 26], [42, -4],
        [38, -16], [26, -10], [14, -17], [2, -10], [-10, -17], [-22, -10], [-38, -16], [-42, -4], [-42, 26]]), 4, { fill: sp.hair });
      for (const sd of [-1, 1]) add(F.sm([[sd * 50, -42], [sd * 38, -46], [sd * 24, -52]]), 7, { c: sp.accent });   // 丸子的粉色发圈
      add(F.sm([[-22, -50], [-6, -54], [10, -53]]), 3, { c: PAPER });
    },
  },
  aye: {
    front(add, F, sp) {
      const pts = [[-47, -4], [-48, -26], [-46, -42], [-54, -56], [-36, -55], [-34, -72], [-20, -61], [-12, -80], [0, -63], [10, -80], [18, -61],
        [32, -72], [34, -55], [52, -56], [46, -42], [48, -26], [47, -4], [40, -16], [30, -26], [14, -22], [0, -28], [-14, -22], [-30, -26], [-40, -16]];
      add(A.poly(pts.map(F.p), true), 4.5, { fill: sp.hair });
    },
  },
  jiangyu: {
    front(add, F, sp) {
      add(F.smz([[-48, -2], [-49, -28], [-40, -46], [-20, -58], [0, -61], [20, -58], [40, -46], [49, -28], [48, -2], [43, -10], [36, -20],
        [18, -25], [6, -35], [2, -46], [-2, -46], [-6, -35], [-18, -25], [-36, -20], [-43, -10]]), 4.5, { fill: sp.hair });
      add(F.sm([[0, -60], [-1, -47]]), 2.5); add(F.sm([[-22, -52], [-32, -32]]), 2); add(F.sm([[22, -52], [32, -32]]), 2);
    },
  },
  juanjuan: {
    back(add, F, sp) { add(F.smz([[-30, -58], [-6, -78], [24, -80], [44, -72], [24, -64], [-6, -62]]), 4, { fill: sp.accent }); },   // 反戴的帽檐从后面翘出来
    front(add, F, sp) {
      add(F.smz([[-54, 6], [-56, -26], [-44, -50], [-18, -62], [12, -62], [40, -52], [56, -28], [54, 6], [44, -14], [-44, -14]]), 0, { fill: sp.hair });
      for (let i = 0; i <= 8; i++) { const a = (190 + i * 20) * Math.PI / 180; add(F.circ(Math.cos(a) * 44, Math.sin(a) * 40 - 10, 13), 3.5, { fill: sp.hair }); }
      add(F.smz([[-44, -28], [-42, -52], [-24, -66], [0, -70], [24, -66], [42, -52], [44, -28], [0, -36]]), 4, { fill: sp.accent });  // 帽顶
      add(F.sm([[-14, -34], [-12, -48], [0, -52], [12, -48], [14, -34]]), 3.5, { c: PAGE_W });                                     // 帽子后面的调节口
      for (const [x, y] of [[-30, -26], [-14, -30], [2, -29], [18, -30], [32, -25]]) add(F.circ(x, y, 9), 3, { fill: sp.hair });     // 额前的卷
    },
  },
};

// ---------- 头 ----------
const HAS_BROWS = new Set(['determined', 'sad']);
const DOT_EYES = new Set(['normal', 'smile', 'dreamy', 'shy', 'determined', 'sad', 'pout']);
//   which：'all'（默认）、'back'（只画头后面的头发，全身像里要压在身体下面）、'front'（除了后面头发的其余部分）
function castHead(sp, o, hx, hy, s, which = 'all') {
  const out = [], add = (d, w = 5, x = {}) => out.push(typeof d === 'object' ? { ...d, ...x } : { d, w, ...x });
  const [lx, ly] = o.look || [0, 0], face = o.face || 'normal', H_ = HAIRDO[sp.id];
  const F = headC(hx, hy, s), C = headC(hx, hy, s, lx * 10, ly * 6);
  if (H_.back && which !== 'front') H_.back(add, F, sp, o);
  if (which === 'back') return out;
  add(F.circ(0, 0, 46), 5, { fill: sp.skin || PAPER });
  (FACE[face] || FACE.normal)(add, C, { who: sp.who });
  if (sp.brows && !HAS_BROWS.has(face)) for (const sd of [-1, 1]) add(C.sm([[sd * 26, -15], [sd * 17, -19], [sd * 8, -17]]), sp.brows);
  if (sp.lashes && DOT_EYES.has(face)) for (const sd of [-1, 1]) { add(C.pl([[sd * 20, -4], [sd * 25, -6]]), 2); add(C.pl([[sd * 19, -6], [sd * 23, -10]]), 2); }
  if (sp.who === 'girl') for (const x of [-29, 29]) add(C.ell(x, 12, 9, 5.5), 0, { fill: '#ef8a8a', fillOp: .3 });   // 腮红统一用粉色
  if (sp.freckles) for (const [x, y] of [[-31, 9], [-25, 13], [-33, 15], [31, 9], [25, 13], [33, 15]]) add(C.dot(x, y, 1.7));
  if (sp.bandaid) {
    const q = A.rot([[19, 8], [39, 8], [39, 17], [19, 17]], -24, 29, 12.5);
    add(A.poly(q.map(C.p), true), 2.5, { fill: '#f7e3c4' }); add(C.dot(26, 13, 1.2)); add(C.dot(32, 11, 1.2));
  }
  if (sp.glasses) {
    for (const sd of [-1, 1]) add(A.circ(...C.p([sd * 17, -2]), 15 * s), 4);
    add(C.sm([[-3, -4], [0, -7], [3, -4]]), 3); add(A.poly([C.p([-32, -4]), F.p([-46, -8])]), 3); add(A.poly([C.p([32, -4]), F.p([46, -8])]), 3);
  }
  H_.front(add, F, sp, o);
  return out;
}

// ---------- 身体 ----------
function castBody(add, sp, o, Y, X) {
  const f = feet(o), lo = (d, w, x = {}) => add(d, w, { ...x, low: true }), boy = sp.who === 'boy';
  const legTop = { shorts: boy ? -46 : -63, longshorts: -40, overalls: -62, pants: null }[sp.bottom] ?? (sp.top === 'dress' ? -32 : -48);
  // 腿和鞋
  for (const [sd, [fx, fy]] of [[-1, f.L], [1, f.R]]) {
    if (sp.bottom === 'pants') lo(A.poly([[X(sd * 30), Y(-75)], [X(sd * 3), Y(-75)], [fx - sd * 8, fy - 4], [fx + sd * 8, fy - 4]], true), 5, { fill: sp.bottomC });
    else lo(A.poly([[X(sd * (boy ? 15 : 12)), Y(legTop)], [fx, fy]]), 5);
    if (sp.socks) { lo(A.line(fx - 6, fy - 24, fx + 6, fy - 24), 3); lo(A.line(fx - 6, fy - 19, fx + 6, fy - 19), 3, { c: sp.accent }); }
    if (sp.shoes === 'sandal') { lo(A.ell(fx + sd * 3, fy + 1, 11, 4.5), 3, { fill: PAGE_W }); lo(A.line(fx - 6, fy - 5, fx + 6, fy - 5), 3, { c: sp.accent }); }
    else { lo(A.ell(fx + sd * 3, fy, boy ? 13 : 11, 6.5), 4, { fill: PAGE_W }); lo(A.line(fx + sd * 3 - (boy ? 12 : 10), fy + 3, fx + sd * 3 + (boy ? 12 : 10), fy + 3), 2.5); }
  }
  // 下装
  if (sp.bottom === 'shorts' && !boy) {
    lo(A.smooth([[X(-27), Y(-99)], [X(-32), Y(-64)], [X(-4), Y(-62)], [0, Y(-74)], [X(4), Y(-62)], [X(32), Y(-64)], [X(27), Y(-99)]], true), 5, { fill: sp.bottomC });
    for (const sd of [-1, 1]) lo(A.line(X(sd * 29), Y(-96), X(sd * 31), Y(-66)), 3, { c: PAGE_W });
  } else if (sp.bottom === 'shorts') {
    lo(A.smooth([[X(-32), Y(-70)], [X(-36), Y(-44)], [X(-5), Y(-42)], [0, Y(-54)], [X(5), Y(-42)], [X(36), Y(-44)], [X(32), Y(-70)]], true), 5, { fill: sp.bottomC });
  } else if (sp.bottom === 'longshorts') {
    lo(A.smooth([[X(-32), Y(-78)], [X(-39), Y(-40)], [X(-6), Y(-38)], [0, Y(-52)], [X(6), Y(-38)], [X(39), Y(-40)], [X(32), Y(-78)]], true), 5, { fill: sp.bottomC });
    for (const sd of [-1, 1]) lo(A.line(X(sd * 35), Y(-74), X(sd * 38), Y(-42)), 4, { c: PAGE_W });
  } else if (sp.bottom === 'overalls') {
    lo(A.smooth([[X(-27), Y(-99)], [X(-31), Y(-62)], [X(-4), Y(-60)], [0, Y(-72)], [X(4), Y(-60)], [X(31), Y(-62)], [X(27), Y(-99)]], true), 5, { fill: sp.bottomC });
    for (const sd of [-1, 1]) lo(A.line(X(sd * 27), Y(-66), X(sd * 9), Y(-65)), 2.5);   // 裤脚卷边
  }
  // 上衣
  if (sp.top === 'dress') {
    add(A.smooth([[X(-19), Y(-141)], [X(-23), Y(-114)], [X(-21), Y(-98)], [X(-46), Y(-36)], [X(-20), Y(-30)], [0, Y(-29)], [X(20), Y(-30)], [X(46), Y(-36)],
      [X(21), Y(-98)], [X(23), Y(-114)], [X(19), Y(-141)]], true), 5, { fill: sp.topC });
    add(A.smooth([[X(-22), Y(-99)], [0, Y(-96)], [X(22), Y(-99)]]), 4, { c: sp.accent });                        // 腰上的蓝丝带
    for (const [x, y] of [[-30, -60], [-12, -76], [10, -54], [28, -72], [-4, -44], [24, -42], [-26, -40]]) add(A.circ(X(x), Y(y), 3.2), 0, { fill: sp.accent, fillOp: .55 });
    add(A.arc(0, Y(-141), 11, 8, 0, 180), 3);
  } else if (!boy) {   // 女生 T 恤
    add(A.smooth([[X(-21), Y(-141)], [X(-26), Y(-118)], [X(-28), Y(-96)], [0, Y(-94)], [X(28), Y(-96)], [X(26), Y(-118)], [X(21), Y(-141)]], true), 5, { fill: sp.topC });
    add(A.arc(0, Y(-141), 10, 7, 0, 180), 3);
  } else if (sp.top === 'oversize') {
    add(A.smooth([[X(-27), Y(-143)], [X(-37), Y(-112)], [X(-38), Y(-66)], [0, Y(-64)], [X(38), Y(-66)], [X(37), Y(-112)], [X(27), Y(-143)]], true), 5, { fill: sp.topC });
    add(A.line(X(-37), Y(-102), X(37), Y(-102)), 7, { c: sp.accent }); add(A.line(X(-37), Y(-92), X(37), Y(-92)), 3, { c: sp.accent });
    add(A.arc(0, Y(-143), 11, 8, 0, 180), 3);
  } else {             // 男生：背心 / 衬衫
    add(A.smooth([[X(-24), Y(-142)], [X(-30), Y(-110)], [X(-33), Y(-76)], [0, Y(-74)], [X(33), Y(-76)], [X(30), Y(-110)], [X(24), Y(-142)]], true), 5, { fill: sp.topC });
    if (sp.top === 'tank') {
      add(A.smooth([[X(-13), Y(-142)], [0, Y(-126)], [X(13), Y(-142)]]), 4, { c: PAGE_W });
      for (const sd of [-1, 1]) add(A.smooth([[X(sd * 24), Y(-140)], [X(sd * 17), Y(-122)], [X(sd * 29), Y(-108)]]), 4, { c: PAGE_W });
    } else {
      for (const sd of [-1, 1]) add(A.poly([[X(sd * 17), Y(-142)], [X(sd * 7), Y(-128)], [0, Y(-140)]], true), 3.5, { fill: sp.topC });   // 衬衫领
      for (const y of [-124, -108, -92]) add(A.circ(0, Y(y), 2.4), 0, { fill: INK });
      add(A.rect(X(-24), Y(-122), 14, 13), 2.5);                                                                                      // 胸口小口袋
    }
  }
}

// ---------- 组装 ----------
function castPerson(sp, o = {}) {
  const out = [], add = (d, w = 5, x = {}) => out.push(typeof d === 'object' ? { ...d, ...x } : { d, w, ...x });
  const boy = sp.who === 'boy', hk = sp.hk || 1, Y = y => y * hk, X = x => x;
  const hy = Y(-140) - 48;
  out.push(...castHead(sp, o, 0, hy, 1, 'back'));   // 长发、马尾压在身体下面
  castBody(add, sp, o, Y, X);
  if (sp.phones) {   // 挂在脖子上的耳机：头带垂在锁骨前，两个耳罩搭在肩上
    add(A.smooth([[X(-27), Y(-141)], [X(-12), Y(-126)], [X(12), Y(-126)], [X(27), Y(-141)]]), 6, { c: sp.accent });
    for (const sd of [-1, 1]) add(A.ell(X(sd * 27), Y(-139), 11, 9), 3.5, { fill: sp.accent });
  }
  if (sp.top === 'tank') { add(A.rrect(X(-12), Y(-118), 24, 22, 4), 0, { fill: PAGE_W }); add(A.smooth([[X(-10), Y(-112)], [X(-5), Y(-116)], [X(-1), Y(-112)], [X(-10), Y(-100)], [X(-1), Y(-100)]]), 2.8); add(A.smooth([[X(2), Y(-114)], [X(6), Y(-116)], [X(10), Y(-112)], [X(6), Y(-108)], [X(10), Y(-104)], [X(6), Y(-100)], [X(2), Y(-102)]]), 2.8); }   // 球衣上的号码牌 23
  const pose = typeof (o.hands || sp.hands) === 'string' ? POSE[o.hands || sp.hands] : (o.hands || sp.hands || POSE.down);
  const hands = {};
  for (const [side, sd] of [['L', -1], ['R', 1]]) {
    const h = pose[side] || POSE.down[side], sh = [X(sd * (boy ? 25 : 21)), Y(boy ? -136 : -134)];
    const hand = [h[0], Y(h[1]), h[2], h[3] != null ? Y(h[3]) : undefined];
    arm(add, sh, hand, sd, sp.top === 'tank' || sp.top === 'dress' ? null : 'short');
    hands[side] = [hand[0], hand[1]];
  }
  if (sp.top === 'tank') add(A.rect(hands.R[0] - 9, hands.R[1] - 20, 18, 10), 3, { fill: PAGE_W });   // 右手护腕
  if (sp.bottom === 'overalls') {   // 背带裤的胸片和背带（压在 T 恤上）
    add(A.rect(X(-16), Y(-124), 32, 27), 4, { fill: sp.bottomC });
    for (const sd of [-1, 1]) { add(A.line(X(sd * 14), Y(-122), X(sd * 19), Y(-139)), 4); add(A.circ(X(sd * 11), Y(-118), 2.6), 0, { fill: INK }); }
  }
  const prop = PROPS_NEW[sp.id]; if (prop) prop(add, hands, Y, X, sp);
  for (const s of ['L', 'R']) add(A.circ(...hands[s], 8.5), 4, { fill: sp.skin || PAPER });
  out.push(...castHead(sp, o, 0, hy, 1, 'front'));
  out.head = [0, hy];
  return out;
}

// 手里的东西（画在手下面）
const PROPS_NEW = {
  xiayou(add, h, Y) {   // 运动水壶
    const [x, y] = h.L; add(A.rrect(x - 9, y - 4, 18, 40, 6), 3.5, { fill: '#c9eee8' }); add(A.rect(x - 6, y - 10, 12, 7), 3, { fill: '#2fb5a3' });
  },
  baizhi(add, h, Y) {   // 抱在胸前的书，夹着一朵压花
    add(A.rect(-30, Y(-130), 60, 46), 4, { fill: '#f4e7c8' }); add(A.line(0, Y(-130), 0, Y(-84)), 2.5);
    add(A.smooth([[18, Y(-132)], [24, Y(-146)], [30, Y(-150)]]), 2.5); add(A.circ(30, Y(-152), 5), 2.5, { fill: '#f07f9c' });
  },
  tangdou(add, h, Y) {  // 挂在胸前的拍立得
    add(A.smooth([[-19, Y(-138)], [-12, Y(-110)], [0, Y(-104)]]), 2.5); add(A.smooth([[19, Y(-138)], [12, Y(-110)], [0, Y(-104)]]), 2.5);
    add(A.rrect(-21, Y(-112), 42, 30, 5), 4, { fill: PAGE_W }); add(A.circ(0, Y(-97), 8), 3.5, { fill: '#cfe3f3' }); add(A.rect(10, Y(-109), 7, 5), 0, { fill: '#f07f9c' });
  },
  aye(add, h) {         // 夹在胳膊下的篮球
    const [x, y] = [h.L[0] - 14, h.L[1] + 4];
    add(A.circ(x, y, 32), 4, { fill: '#ee9a4a' }); add(A.line(x - 32, y, x + 32, y), 2.5);
    add(A.arc(x - 40, y, 30, 26, -50, 50), 2.5); add(A.arc(x + 40, y, 30, 26, 130, 230), 2.5);
  },
  jiangyu(add, h) {     // 一罐橘子汽水
    const [x, y] = h.R; add(A.rrect(x - 10, y - 30, 20, 34, 4), 3.5, { fill: '#f5a74a' }); add(A.line(x - 10, y - 24, x + 10, y - 24), 2.5); add(A.circ(x, y - 14, 4), 2, { fill: PAGE_W });
  },
  juanjuan(add, h, Y) { // 立在身边的滑板
    const x = h.L[0] - 16; add(A.rrect(x - 13, Y(-178), 26, 172, 13), 4, { fill: '#e9b44c' });
    for (const yy of [-160, -24]) for (const sd of [-1, 1]) add(A.circ(x + sd * 17, Y(yy), 6), 3, { fill: PAGE_W });
    add(A.line(x - 6, Y(-120), x + 6, Y(-70)), 3, { c: '#5aaf68' });
  },
};
