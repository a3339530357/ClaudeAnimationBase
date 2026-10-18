// 角色设定页（cast.html）：3 个女生 + 3 个男生，每人一张全身像 + 三个表情头像。给用户挑主角用（《去年夏天》用户选了白栀和江屿）。
const CW = 1920, CH = 1440;
function castCard(sp, col, row) {
  const x0 = 30 + col * 630, y0 = 112 + row * 664, w = 600, h = 640;
  G({ x: x0 + w / 2, y: y0 + h / 2, r: (col + row) % 2 ? .5 : -.5 }, () => P(A.rect(-w / 2, -h / 2, w, h), { w: 3, fill: PAGE_W }));
  TX(sp.name, x0 + 36, y0 + 46, { anchor: 'start', size: 52, font: FONT_FUN });
  TX(sp.tag, x0 + 150, y0 + 50, { anchor: 'start', size: 30, font: FONT_FUN, c: sp.accent });
  for (const [i, c] of [[0, sp.hair], [1, sp.accent]]) P(A.circ(x0 + 528 + i * 36, y0 + 44, 13), { w: 3, fill: c });
  TX(sp.line, x0 + 36, y0 + 98, { anchor: 'start', size: 23, font: FONT_FUN, c: '#5a524a' });
  // 全身像
  const fx = x0 + 205, fy = y0 + 618, s = 1.65;
  P(A.ell(fx, fy + 4, 95, 13), { fill: INK, fillOp: .08 });
  LINE_K = .8; G({ x: fx, y: fy, s }, () => inkParts(castPerson(sp, { face: sp.faces[0][0] }))); LINE_K = 1;
  // 三个表情头像
  sp.faces.forEach(([face, label], i) => {
    const cx = x0 + 478, cy = y0 + 212 + i * 166, r = 66;
    G({ clip: A.circ(cx, cy, r) }, () => {
      P(A.circ(cx, cy, r), { fill: sp.accent, fillOp: .16 });
      P(A.smooth([[cx - 70, cy + 96], [cx - 52, cy + 58], [cx - 18, cy + 50], [cx + 18, cy + 50], [cx + 52, cy + 58], [cx + 70, cy + 96]], true), { w: 3.5, fill: sp.topC });
      LINE_K = .7; inkParts(castHead(sp, { face }, cx, cy + 6, sp.avS || .95)); LINE_K = 1;
    });
    P(A.circ(cx, cy, r), { w: 3.5 });
    TX(label, cx, cy + r + 18, { size: 22, font: FONT_FUN, c: '#5a524a' });
  });
}
async function castInit() {
  for (const [fam, url] of Object.entries(FONT_DATA_CAST)) { const f = new FontFace(fam, `url(${url})`); await f.load(); document.fonts.add(f); }
  const svg = document.getElementById('stage');
  svg.setAttribute('viewBox', `0 0 ${CW} ${CH}`);
  const defs = el('defs', {}, svg);
  const f = el('filter', { id: 'boil', filterUnits: 'userSpaceOnUse', x: -40, y: -40, width: CW + 80, height: CH + 80 }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.022, numOctaves: 2, seed: 3, result: 'n' }, f);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 4, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
  DEFS = el('defs', {}, svg);
  el('rect', { x: 0, y: 0, width: CW, height: CH, fill: PAPER }, svg);
  CUR = el('g', { filter: 'url(#boil)' }, svg);
  TX('线稿 · 角色设定', 36, 52, { anchor: 'start', size: 48, font: FONT_FUN });
  TX('挑一个女主、一个男主（也可以说想怎么改）。只是设定图，不进视频', 470, 56, { anchor: 'start', size: 26, font: FONT_FUN, c: '#7a7066' });
  CAST.forEach((sp, i) => castCard(sp, i % 3, Math.floor(i / 3)));
  window.ready = true;
}
castInit();
