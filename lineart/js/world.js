// 场景和小物件：全部返回部件列表（交给 inkParts 画，可以一笔笔画出来）。地面统一在 y = GY（人物脚底）。
const GY = 930;
const ground = (x0 = -900, x1 = W + 900, y = GY) => [part(A.wave(x0, y, x1, 4, 320), 4)];
const grass = (x, y = GY, s = 1) => part(`M${x - 12 * s} ${y}Q${x - 10 * s} ${y - 14 * s} ${x - 16 * s} ${y - 22 * s}` +
  `M${x} ${y}Q${x} ${y - 18 * s} ${x + 2 * s} ${y - 28 * s}M${x + 12 * s} ${y}Q${x + 12 * s} ${y - 12 * s} ${x + 20 * s} ${y - 20 * s}`, 3);
const tree = (x, y = GY, s = 1) => [
  part(A.smooth([[x - 8 * s, y], [x - 4 * s, y - 60 * s], [x - 10 * s, y - 100 * s]]), 5),
  part(A.smooth([[x + 8 * s, y], [x + 6 * s, y - 60 * s], [x + 14 * s, y - 96 * s]]), 5),
  part(A.smooth([[x - 60 * s, y - 100 * s], [x - 70 * s, y - 150 * s], [x - 30 * s, y - 190 * s], [x + 20 * s, y - 196 * s],
    [x + 66 * s, y - 160 * s], [x + 60 * s, y - 110 * s], [x, y - 90 * s]], true), 4.5, { fill: PAPER }),
];
// 太阳：rays 0..1 光芒长出来
function sun(cx, cy, r, rays = 0) {
  const out = [part(A.circ(cx, cy, r), 5, { fill: PAPER })];
  if (rays > 0) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r0 = r + 16, r1 = r0 + 40 * rays; out.push(part(A.line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1), 4)); }
  return out;
}
const moon = (cx, cy, r) => [part(`M${R(cx)} ${R(cy - r)}A${r} ${r} 0 1 0 ${R(cx)} ${R(cy + r)}A${R(r * .72)} ${r} 0 1 1 ${R(cx)} ${R(cy - r)}Z`, 4.5, { fill: PAPER })];
const star = (x, y, r) => part(A.sparkle(x, y, r), 3, { fill: PAPER });
// 窗户：外框 + 十字窗棂 + 窗台
function win(x, y, w, h, o = {}) {
  const out = [part(A.rect(x, y, w, h), 5, o.fill ? { fill: o.fill } : {}), part(A.line(x + w / 2, y, x + w / 2, y + h), 3.5), part(A.line(x, y + h * .42, x + w, y + h * .42), 3.5)];
  if (o.sill !== false) out.push(part(A.rect(x - 16, y + h, w + 32, 14), 4, { fill: PAPER }));
  return out;
}
// 课桌（正面）：桌面 + 抽屉板 + 两条腿；y 是桌面，g 是地面（腿画到这里）
function desk(x, y = 820, w = 170, g = GY) {
  return [part(A.rect(x - w / 2, y - 12, w, 14), 4.5, { fill: PAPER }), part(A.rect(x - w / 2 + 10, y + 2, w - 20, Math.min(50, g - y - 10)), 4, { fill: PAPER }),
    part(A.line(x - w / 2 + 16, y + 52, x - w / 2 + 16, g), 4.5), part(A.line(x + w / 2 - 16, y + 52, x + w / 2 - 16, g), 4.5)];
}
// 门：门框 + 门板（open 0..1 往里开，门板变窄）+ 门把手
function door(x, y, w, h, open = 0) {
  const dw = w * (1 - .8 * open);
  return [part(A.rect(x - 10, y - 10, w + 20, h + 10), 4.5), part(A.rect(x, y, dw, h), 4, { fill: PAPER }), part(A.circ(x + dw - 18, y + h * .52, 6), 3, { fill: PAPER })];
}
function blackboard(x, y, w, h) { return [part(A.rect(x, y, w, h), 5), part(A.rect(x + 12, y + 12, w - 24, h - 24), 2.5), part(A.line(x + 20, y + h + 10, x + w - 20, y + h + 10), 4)]; }
// 台灯：灯座、弯杆、灯罩；on 时画几道光
function lamp(x, y, on = 1) {
  const out = [part(A.ell(x, y, 34, 8), 4, { fill: PAPER }), part(A.smooth([[x, y - 6], [x + 6, y - 90], [x + 50, y - 130]]), 4.5),
    part(A.poly([[x + 30, y - 150], [x + 82, y - 128], [x + 70, y - 96], [x + 20, y - 116]], true), 4.5, { fill: PAPER })];
  if (on) for (const a of [-.2, .15, .5]) out.push(part(A.line(x + 64 + a * 20, y - 100, x + 100 + a * 160, y - 10), 2.5, { op: .5 * on, dash: '10 12' }));
  return out;
}
// 他房间里的小画架：两条腿撑着一本速写本（页面朝我们）；返回 [部件, 页面矩形]
function easel(x, y, w = 260, h = 190) {
  const top = y - h - 30;
  return { parts: [part(A.line(x - w * .3, y, x - w * .2, top + 40), 4), part(A.line(x + w * .3, y, x + w * .2, top + 40), 4),
    ...sketchPage(x - w / 2, top, w, h)], page: [x - w / 2, top, w, h] };
}
function bed(x, y = GY, w = 420) { return [part(A.rect(x, y - 110, w, 70), 4.5, { fill: PAPER }), part(A.rrect(x + 16, y - 140, 110, 34, 14), 4, { fill: PAPER }), part(A.line(x + 8, y - 40, x + 8, y), 4.5), part(A.line(x + w - 8, y - 40, x + w - 8, y), 4.5), part(A.rect(x - 10, y - 200, 18, 200), 4, { fill: PAPER })]; }
// 路灯
function streetlamp(x, y = GY, h = 380, on = 0) {
  const out = [part(A.line(x, y, x, y - h), 5), part(A.smooth([[x, y - h], [x + 30, y - h - 24], [x + 70, y - h - 10]]), 4.5), part(A.poly([[x + 50, y - h - 14], [x + 92, y - h - 4], [x + 82, y - h + 12], [x + 58, y - h + 6]], true), 4, { fill: PAPER })];
  if (on) for (const d of [-60, 0, 60]) out.push(part(A.line(x + 72, y - h + 14, x + 72 + d, y - h + 140), 2.5, { op: .45 * on, dash: '8 10' }));
  return out;
}
const puddle = (x, y = GY, w = 120) => [part(A.ell(x, y + 10, w / 2, 9), 3.5), part(A.ell(x - w * .1, y + 10, w * .22, 4), 2)];
// 自行车（rider 另画）
function bicycle(x, y = GY, s = 1, spin = 0) {
  const r = 42 * s, a = spin, out = [];
  for (const cx of [x - 70 * s, x + 70 * s]) { out.push(part(A.circ(cx, y - r, r), 4, { fill: 'none' })); for (let k = 0; k < 3; k++) { const b = a + k * Math.PI / 3; out.push(part(A.line(cx - Math.cos(b) * r, y - r - Math.sin(b) * r, cx + Math.cos(b) * r, y - r + Math.sin(b) * r), 1.8)); } }
  out.push(part(A.poly([[x - 70 * s, y - r], [x - 10 * s, y - r - 54 * s], [x + 50 * s, y - r - 54 * s], [x + 70 * s, y - r], [x + 6 * s, y - r], [x - 10 * s, y - r - 54 * s]]), 4));
  out.push(part(A.line(x - 18 * s, y - r - 54 * s, x - 26 * s, y - r - 74 * s), 4), part(A.line(x - 40 * s, y - r - 76 * s, x - 10 * s, y - r - 76 * s), 4.5));
  out.push(part(A.line(x + 50 * s, y - r - 54 * s, x + 56 * s, y - r - 84 * s), 4), part(A.line(x + 46 * s, y - r - 86 * s, x + 70 * s, y - r - 82 * s), 4));
  return out;
}
// 天桥：桥面、栏杆、两头的楼梯（从 x0 到 x1，桥面高 y）
function footbridge(x0, x1, y = 600) {
  const out = [part(A.rect(x0, y, x1 - x0, 26), 4.5, { fill: PAPER }), part(A.line(x0, y - 60, x1, y - 60), 4)];
  for (let x = x0 + 30; x < x1; x += 60) out.push(part(A.line(x, y - 60, x, y), 2.5));
  for (const [sx, dir] of [[x0, -1], [x1, 1]]) {
    const pts = []; for (let k = 0; k <= 8; k++) { const xx = sx + dir * k * 40, yy = y + 26 + k * ((GY - y - 26) / 8); pts.push([xx, yy - (GY - y - 26) / 8], [xx, yy]); }
    out.push(part(A.poly(pts), 4), part(A.line(sx, y - 60, sx + dir * 320, GY - 60), 4));
  }
  for (const x of [x0 + 200, x1 - 200]) out.push(part(A.rect(x - 14, y + 26, 28, GY - y - 26), 4, { fill: PAPER }));
  return out;
}
// 校门：两根门柱（左边那根挂一块空白的牌子）+ 推拉门的轨道
function schoolGate(x, y = GY) {
  const out = [];
  for (const cx of [x - 260, x + 260]) out.push(part(A.rect(cx - 50, y - 420, 100, 420), 5, { fill: PAPER }), part(A.rect(cx - 62, y - 446, 124, 30), 4.5, { fill: PAPER }));
  out.push(part(A.rect(x - 296, y - 360, 72, 220), 4, { fill: PAGE }), part(A.line(x - 210, y - 8, x + 210, y - 8), 3, { dash: '14 10' }));
  return out;
}
// 小卖部：条纹雨棚、柜台、冰柜、货架上的瓶子
function shopFront(x, y = GY) {
  const out = [part(A.rect(x, y - 520, 640, 520), 5, { fill: PAPER })];
  const aw = []; for (let k = 0; k <= 8; k++) aw.push([x - 30 + k * 87.5, y - 520 + (k % 2 ? 60 : 40)]);
  out.push(part(A.poly([[x - 30, y - 560], [x + 670, y - 560], ...aw.reverse()], true), 4.5, { fill: PAPER }));
  for (let k = 1; k < 8; k++) out.push(part(A.line(x - 30 + k * 87.5, y - 560, x - 30 + k * 87.5, y - 480 + (k % 2 ? 0 : -20)), 3));
  for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) out.push(part(A.rrect(x + 40 + k * 96, y - 440 + r * 100, 40, 70, 10), 3, { fill: PAPER }));
  out.push(part(A.rect(x + 20, y - 230, 600, 230), 5, { fill: PAPER }), part(A.rect(x + 360, y - 300, 240, 70), 4, { fill: PAGE }), part(A.line(x + 380, y - 266, x + 580, y - 266), 2.5));
  return out;
}
// 走廊的柱子
const pillar = (x, y = GY, h = 760) => [part(A.rect(x - 46, y - h, 92, h), 5, { fill: PAPER }), part(A.rect(x - 60, y - 24, 120, 24), 4.5, { fill: PAPER }), part(A.rect(x - 60, y - h, 120, 24), 4.5, { fill: PAPER })];
// 跳房子的格子（画在地面线下面一点）
function hopscotch(x0, n = 4, cell = 150, y = GY) { const out = []; for (let k = 0; k < n; k++) out.push(part(A.poly([[x0 + k * cell, y + 4], [x0 + (k + 1) * cell, y + 4], [x0 + (k + 1) * cell + 18, y + 30], [x0 + k * cell + 18, y + 30]], true), 3.5)); return out; }

// ---------- 小物件 ----------
// 邮票：带齿孔的小方块，里面一个小图案（kind 0 太阳 / 1 花 / 2 小船）
function stamp(x, y, s = 1, kind = 0) {
  const w = 34 * s, h = 42 * s, out = [part(A.zig(x - w / 2, y - h / 2, x + w / 2, 2.5 * s, 7 * s) + A.zig(x - w / 2, y + h / 2, x + w / 2, 2.5 * s, 7 * s).replace('M', 'M'), 2.5), part(A.rect(x - w / 2, y - h / 2, w, h), 3, { fill: PAGE })];
  if (kind === 0) out.push(part(A.circ(x, y, 8 * s), 2.5));
  else if (kind === 1) out.push(part(A.circ(x, y - 4 * s, 5 * s), 2.5), part(A.line(x, y + 1 * s, x, y + 13 * s), 2.5));
  else out.push(part(A.poly([[x - 11 * s, y + 4 * s], [x + 11 * s, y + 4 * s], [x + 6 * s, y + 11 * s], [x - 6 * s, y + 11 * s]], true), 2.5), part(A.line(x, y + 4 * s, x, y - 12 * s), 2.5));
  return out;
}
// 集邮册（摊开）：两页，每页几枚邮票
function stampAlbum(x, y, s = 1) {
  const out = [part(A.rect(x - 90 * s, y - 60 * s, 180 * s, 120 * s), 4, { fill: PAPER }), part(A.line(x, y - 60 * s, x, y + 60 * s), 3)];
  for (const [dx, dy, k] of [[-58, -28, 0], [-28, -28, 1], [-58, 22, 2], [32, -28, 1], [62, -28, 2]]) out.push(...stamp(x + dx * s, y + dy * s, .7 * s, k));
  return out;
}
// 蚱蜢（朝右）：kick 0..1 后腿蹬直
function grasshopper(x, y, s = 1, kick = 0) {
  const k = kick, knee = [x - 14 * s, y - 26 * s + 18 * k * s], foot = [x - 34 * s - 20 * k * s, y + 4 * s];
  return [part(A.ell(x, y - 12 * s, 26 * s, 10 * s), 3.5, { fill: PAPER }), part(A.circ(x + 26 * s, y - 16 * s, 8 * s), 3.5, { fill: PAPER }),
    part(A.circ(x + 28 * s, y - 18 * s, 2 * s), 0, { fill: INK }), part(A.poly([[x + 2 * s, y - 14 * s], knee, foot]), 3),
    part(A.smooth([[x + 30 * s, y - 22 * s], [x + 44 * s, y - 46 * s], [x + 58 * s, y - 50 * s]]), 2.5), part(A.smooth([[x + 26 * s, y - 24 * s], [x + 30 * s, y - 50 * s], [x + 40 * s, y - 62 * s]]), 2.5),
    part(A.line(x + 12 * s, y - 4 * s, x + 16 * s, y + 6 * s), 2.5), part(A.line(x + 2 * s, y - 2 * s, x + 2 * s, y + 6 * s), 2.5)];
}
// 手电筒：灯头朝 ang 度；on 时一束光（几条虚线组成的锥形）
function flashlight(x, y, ang = 0, s = 1, on = 0) {
  const out = [];
  G({ x, y, r: ang, s }, () => {
    inkParts([part(A.rect(-50, -9, 46, 18), 3.5, { fill: PAPER }), part(A.poly([[-4, -9], [12, -16], [12, 16], [-4, 9]], true), 3.5, { fill: PAPER })]);
    if (on > 0) { P(A.poly([[12, -14], [12 + 420 * on, -120 * on], [12 + 420 * on, 120 * on], [12, 14]], true), { fill: PAGE, op: .55 }); for (const d of [-110, 0, 110]) P(A.line(16, 0, 12 + 420 * on, d * on), { w: 2.5, dash: '10 10', op: .7 }); }
  });
  return out;
}
// 冰棍：bite 0..1 咬掉一角，drip 化了往下滴
function popsicle(x, y, s = 1, bite = 0) {
  const top = y - 70 * s, out = [part(A.line(x, y, x, y + 34 * s), 5), part(A.rrect(x - 18 * s, top, 36 * s, 72 * s, 14 * s), 4, { fill: PAPER })];
  if (bite > 0) out.push(part(A.circ(x + 14 * s, top + 6 * s, 10 * s * bite), 0, { fill: PAPER }));
  return out;
}
// 闹钟：两个铃铛、钟面、指针；ring 0..1 抖 + 响声线
function alarmClock(x, y, s = 1, ring = 0) {
  const j = ring ? Math.sin(ring * 60) * 4 * s : 0, cx = x + j, cy = y - 50 * s, out = [];
  out.push(part(A.circ(cx - 26 * s, cy - 38 * s, 14 * s), 4, { fill: PAPER }), part(A.circ(cx + 26 * s, cy - 38 * s, 14 * s), 4, { fill: PAPER }));
  out.push(part(A.circ(cx, cy, 40 * s), 5, { fill: PAPER }), part(A.line(cx, cy, cx, cy - 26 * s), 3.5), part(A.line(cx, cy, cx + 18 * s, cy + 6 * s), 3.5));
  out.push(part(A.line(cx - 24 * s, cy + 34 * s, cx - 32 * s, y), 4), part(A.line(cx + 24 * s, cy + 34 * s, cx + 32 * s, y), 4));
  if (ring) for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) out.push(part(A.arc(cx, cy - 10 * s, (64 + k * 16) * s, (58 + k * 14) * s, sd > 0 ? -50 : 230, sd > 0 ? -10 : 190), 3, { op: .5 + .5 * Math.sin(ring * 40 + k) }));
  return out;
}
const eraser = (x, y, s = 1, r = 0) => { G({ x, y, r }, () => inkParts([part(A.rrect(-22 * s, -12 * s, 44 * s, 24 * s, 5), 3.5, { fill: PAPER }), part(A.line(-6 * s, -12 * s, -6 * s, 12 * s), 2.5)])); };
// 透明胶带：一条半透明的纸色长条，两头剪成锯齿
function tape(x, y, w, ang = 0, k = 1) {
  if (k <= 0) return;
  G({ x, y, r: ang, sx: E.outBack(k) }, () => P(A.zig(-w / 2, -14, w / 2, 3, 10).replace(/^M/, 'M') + 'L' + (w / 2) + ' 14' + A.zig(w / 2, 14, -w / 2, 3, 10).replace(/^M[^L]*/, '') + 'Z', { w: 2.5, fill: PAGE, fillOp: .75 }));
}
// 一片碎纸：不规则四边形，上面有一小段铅笔线（seed 决定形状）
function scrap(x, y, s = 1, r = 0, seed = 1) {
  const q = i => hash(seed * 9.1 + i), pts = [[-30 + q(1) * 12, -26 + q(2) * 10], [26 + q(3) * 10, -30 + q(4) * 12], [30 - q(5) * 8, 24 + q(6) * 10], [-26 - q(7) * 8, 28 - q(8) * 10]];
  G({ x, y, r, s }, () => { P(A.poly(pts, true), { w: 3, fill: PAGE }); P(A.smooth([[-16, 6 - q(9) * 14], [0, -8 + q(10) * 16], [14, 4 - q(11) * 12]]), { w: 2.5 }); });
}
// 停在窗台上的小鸟（朝左）：peck 0..1 低头啄
function birdSit(x, y, s = 1, peck = 0, flap = 0) {
  const hy = y - 40 * s + 14 * peck * s, out = [part(A.ell(x, y - 22 * s, 24 * s, 20 * s), 4, { fill: PAPER }), part(A.circ(x - 16 * s, hy, 13 * s), 4, { fill: PAPER }),
    part(A.circ(x - 20 * s, hy - 3 * s, 2.4 * s), 0, { fill: INK }), part(A.poly([[x - 28 * s, hy], [x - 40 * s, hy + 4 * s], [x - 28 * s, hy + 6 * s]], true), 3, { fill: PAPER }),
    part(A.poly([[x + 20 * s, y - 28 * s], [x + 44 * s, y - 40 * s], [x + 40 * s, y - 22 * s]], true), 3.5, { fill: PAPER }),
    part(A.line(x - 4 * s, y - 3 * s, x - 6 * s, y + 4 * s), 3), part(A.line(x + 6 * s, y - 3 * s, x + 6 * s, y + 4 * s), 3)];
  out.push(part(A.smooth([[x - 6 * s, y - 30 * s], [x + 12 * s, y - 34 * s - 26 * flap * s], [x + 22 * s, y - 20 * s]]), 3.5));
  return out;
}
const heart = (x, y, s = 1) => `M${R(x)} ${R(y + 40 * s)}C${R(x - 60 * s)} ${R(y)} ${R(x - 50 * s)} ${R(y - 46 * s)} ${R(x)} ${R(y - 20 * s)}C${R(x + 50 * s)} ${R(y - 46 * s)} ${R(x + 60 * s)} ${R(y)} ${R(x)} ${R(y + 40 * s)}Z`;
