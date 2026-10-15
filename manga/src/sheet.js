// sheet.js: model sheets (standalone loops). node render.mjs --loop=faces --size=2880x2700 --stills=0.5 --out=out/check/faces
LOOPS.faces = t => {
  const rows = [
    [LU, [[{}, {}], [{ mouth: 'smile', eyes: 'happy', blush: .8 }, {}], [{ mouth: 'smile', look: [.6, -.3] }, { v: .9 }], [{ mouth: 'tremble', tears: 1, cry: 1, brow: 1 }, {}], [{}, { side: true }], [{ eyes: 'shock', mouth: 'o', mo: .6 }, { v: -.9 }]]],
    [LU_BAD, [[{}, {}], [{ mouth: 'smirk', look: [.5, 0], open: .75 }, {}], [{ mouth: 'smile', open: .8 }, { v: .9 }], [{ eyes: 'closed' }, {}], [{ mouth: 'smirk' }, { side: true }], [{ tears: 1, cry: .6, brow: .8, mouth: 'part' }, { v: -.9 }]]],
    [FEI, [[{}, {}], [{ mouth: 'grin', eyes: 'happy' }, {}], [{ look: [.7, 0] }, { v: .9 }], [{ eyes: 'shock', mouth: 'open', mo: 1, sweat: 1 }, {}], [{}, { side: true }], [{ mouth: 'open', mo: .9, brow: -1 }, { v: -.9 }]]],
    [FEI_NEW, [[{ mouth: 'line' }, {}], [{ mouth: 'smile', brow: .6 }, {}], [{ look: [.6, 0], brow: .5 }, { v: .9 }], [{ eyes: 'closed', cry: 1, brow: 1, mouth: 'tremble' }, {}], [{ brow: .6 }, { side: true }], [{ brow: 1, tears: 1, mouth: 'frown' }, { v: -.9 }]]],
    [QUEEN, [[{}, {}], [{ mouth: 'smirk', gum: 1 }, {}], [{ look: [.6, 0], mouth: 'smirk' }, { v: .9 }], [{ eyes: 'closed', mouth: 'part' }, {}], [{ gum: .6 }, { side: true }], [{ mouth: 'smile', open: .7 }, { v: -.9 }]]],
  ];
  const cw = W / 6, ch = H / rows.length, s = ch * .62 / 120;
  rows.forEach(([spec, cells], r) => cells.forEach(([ex, o], c) => {
    X.save(); X.beginPath(); X.rect(cw * c, ch * r, cw, ch); X.clip();
    head(cw * (c + .5), ch * (r + .4), s, spec, ex, { t, key: r + '_' + c, ...o });
    X.restore();
  }));
};
LOOPS.faces.len = 2;

// the cast standing up: node render.mjs --loop=cast --size=4320x1640 --stills=0.5 --out=out/check/cast
LOOPS.cast = t => {
  const F = [
    [LU, { ex: { mouth: 'smile' } }],
    [LU, { v: .8, aL: [2.55, 2.95], hL: 'open', ex: { mouth: 'grin', eyes: 'happy', blush: .7 } }],
    [LU_BAD, { aR: [.55, -1.25], hR: 'fist', ex: { mouth: 'smirk', open: .8 } }],
    [LU_BAD, { v: -.8, hv: -.9, aL: [.2, .1], ex: { mouth: 'part', look: [.4, 0] } }],
    [FEI, { aR: [.1, .05], aL: [.14, .02], hR: 'fist', hL: 'fist', ex: { mouth: 'smirk', open: .8 } }],
    [FEI, { rear: true, aR: [2.7, 3.05], hR: 'open' }],
    [FEI_NEW, { v: .5, aR: [.5, 1.35], hR: 'open', kR: [1, .8], ex: { brow: .7, tears: .8 } }],
    [QUEEN, { v: .8, lean: -.08, aR: [.7, .5], aL: [.25, .4], lL: [.3, .05], ex: { mouth: 'smirk', gum: .7 } }],
    [STRANGER, { aR: [.15, .1], aL: [.15, .1], hR: 'fist', hL: 'fist' }],
  ];
  const cw = W / F.length, s = H * .9 / 640;
  F.forEach(([spec, P], i) => person(cw * (i + .5), H * .96, s, spec, P, { t, key: 'c' + i }));
};
LOOPS.cast.len = 2;

// the design sheet, laid out as a manga page: node render.mjs --loop=lookbook --size=3840x2160 --stills=0.4 --out=out/check/lookbook
function label(txt, x, y, size = 40) { X.save(); X.font = `bold ${size}px "Noto Sans CJK SC", sans-serif`; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillStyle = INK; X.fillText(txt, x, y); X.restore(); }
LOOPS.lookbook = t => {
  const g = 26, top = 60, bh = 1180, cw = (W - g * 5) / 4;
  const bust = (i, spec, P, bg, cap) => {
    const x0 = g + i * (cw + g), poly = rectPts(x0, top, cw, bh), cx = x0 + cw / 2, s = 4.1;
    panel(poly, () => { bg(cx, x0); person(cx, top + 330 + 550 * s, s, spec, P, { t, key: 'lb' + i }); }, { lw: 8 });
    label(cap, cx, top + bh + 44);
  };
  bust(0, LU, { v: .45, hv: .55, aR: [.15, .1], aL: [.25, .9], hL: 'relax', ex: { mouth: 'smile', blush: .7, look: [-.4, -.1] } }, (cx, x0) => {
    fillScreen(PAPER); bubbles(cx, top + 500, 420, 14, t, 'lb'); for (let i = 0; i < 7; i++) sparkle(x0 + 80 + hash(i) * (cw - 160), top + 100 + hash(i * 3) * 700, 18 + 30 * hash(i * 7));
  }, '小鹿 · 从前');
  bust(1, LU_BAD, { v: -.35, hv: -.5, aR: [.2, .1], aL: [.2, .1], ex: { mouth: 'smirk', open: .78, look: [.5, 0] } }, (cx, x0) => {
    fillScreen(INK); glowW(cx, top + 380, 700, .35); beam(cx, top - 50, Math.PI / 2, 1300, 120, 900, .22);
  }, '小鹿 · 后来');
  bust(2, FEI, { v: .4, hv: .5, aR: [.1, .05], aL: [.1, .05], hR: 'fist', ex: { mouth: 'smirk', open: .8, look: [-.3, 0] } }, (cx, x0) => {
    fillScreen('tone:.12'); X.save(); X.beginPath(); X.rect(x0, top, cw, bh); X.clip(); speedLines(-.25, { n: 60, len: .5, key: 'lb', rect: [x0, top, cw, bh] }); X.restore();
  }, '阿飞 · 从前');
  bust(3, FEI_NEW, { v: -.3, hv: -.35, aR: [.1, .05], aL: [.1, .05], ex: { brow: .8, tears: 1, mouth: 'line' } }, (cx, x0) => {
    X.save(); X.beginPath(); X.rect(x0, top, cw, bh); X.clip(); toneGrad(pathOf(rectPts(x0, top, cw, bh)), cx, top, cx, top + bh, .05, .45); X.restore();
  }, '阿飞 · 结尾');
  // the line-up
  const y1 = top + bh + 110, h2 = H - y1 - 30, F = [[LU, { ex: { mouth: 'smile' } }], [LU_BAD, { aR: [.55, -1.25], hR: 'fist', ex: { mouth: 'smirk', open: .8 } }],
    [FEI, { hR: 'fist', hL: 'fist', ex: { mouth: 'smirk', open: .8 } }], [FEI_NEW, { ex: { mouth: 'line', brow: .5 } }],
    [QUEEN, { v: .6, lean: -.05, aR: [.6, .4], lL: [.25, .05], ex: { mouth: 'smirk', gum: .7 } }], [STRANGER, { hR: 'fist', hL: 'fist' }]];
  panel(rectPts(g, y1, W - 2 * g, h2), () => {
    fillScreen(PAPER);
    const s = (h2 - 40) / 640, cw2 = (W - 2 * g) / F.length;
    F.forEach(([spec, P], i) => person(g + cw2 * (i + .5), y1 + h2 - 20, s, spec, P, { t, key: 'lu' + i }));
  }, { lw: 8 });
  ['小鹿·从前', '小鹿·后来', '阿飞·从前', '阿飞·结尾', '溜冰场女王', '陌生人'].forEach((c, i) => label(c, g + (W - 2 * g) / 6 * (i + .5) + 170, y1 + 40, 30));
};
LOOPS.lookbook.len = 2;
