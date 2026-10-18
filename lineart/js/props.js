// 道具：都返回部件列表（交给 inkParts 一笔笔画），坐标是画面坐标或调用者分组里的坐标

// 他的线圈速写本（合着）：左上角 (x, y)，宽 w 高 h；顶上一排线圈
function sketchbook(x, y, w, h, o = {}) {
  const out = [part(A.rrect(x, y, w, h, 8), 5, { fill: PAPER })];
  if (o.cover !== false) out.push(part(A.poly([[x + w - 40, y + h], [x + w, y + h - 40]]), 3));   // 封面右下角折起来一点
  out.push(...rings(x, y, w));
  return out;
}
// 线圈：沿着 (x, y) 开始、宽 w 的上边，一个个小圈
function rings(x, y, w, n = Math.max(4, Math.round(w / 34))) {
  const out = [];
  for (let i = 0; i < n; i++) { const cx = x + (i + .5) * w / n; out.push(part(A.ell(cx, y, 5, 11), 3.5, { fill: PAPER })); }
  return out;
}
// 摊开的一页（回忆就画在这上面）：纸页 + 下面一层淡影子 + 顶上的线圈
function sketchPage(x, y, w, h) {
  return [part(A.rect(x + 12, y + 14, w, h), 0, { fill: INK, op: .1 }), part(A.rect(x, y, w, h), 4, { fill: PAGE }), ...rings(x, y, w)];
}
// 铅笔：笔尖在 (x, y)，朝 ang 度方向伸出去（笔身往反方向），长 len。六棱笔身 + 削好的木头 + 笔芯 + 橡皮头
function pencilParts(len = 230, wd = 16) {
  const cone = 36, body = len - cone;
  return [
    part(A.poly([[cone, -wd / 2], [len, -wd / 2], [len, wd / 2], [cone, wd / 2]], true), 4, { fill: PAPER }),
    part(A.line(cone, 0, len - 26, 0), 2),
    part(A.poly([[0, 0], [cone, -wd / 2], [cone, wd / 2]], true), 4, { fill: PAGE }),
    part(A.poly([[0, 0], [11, -3], [11, 3]], true), 0, { fill: INK }),
    part(A.rect(len - 26, -wd / 2, 26, wd), 4, { fill: PAPER }), part(A.line(len - 20, -wd / 2, len - 20, wd / 2), 2.5),
  ];
}
function drawPencil(x, y, ang = -50, o = {}) { G({ x, y, r: 180 + ang, s: o.s ?? 1 }, () => inkParts(pencilParts(o.len, o.wd), o.draw ?? 1)); }

// 她的本子：小一号、侧面缝线装订；封面上画着一副圆眼镜，角上一个小小的红发夹签名
function herNotebook(x, y, w, h, o = {}) {
  const cx = x + w * .55, cy = y + h * .45, r = w * .13;
  return [
    part(A.rrect(x, y, w, h, 6), 5, { fill: PAPER }),
    part(A.line(x + 14, y + 6, x + 14, y + h - 6), 2.5, { dash: '8 7' }),
    part(A.circ(cx - r * 1.25, cy, r), 4), part(A.circ(cx + r * 1.25, cy, r), 4),
    part(A.smooth([[cx - r * .3, cy - 2], [cx, cy - r * .35], [cx + r * .3, cy - 2]]), 3.5),
    part(A.poly([[x + w - 34, y + h - 22], [x + w - 14, y + h - 30], [x + w - 12, y + h - 25], [x + w - 32, y + h - 17]], true), 2, { fill: RED }),
  ];
}
