// 主程序：舞台（米黄纸、线条抖动、时间染色），每一帧从头画。
//   双击 index.html 打开，点播放键（或空格）带原曲 0–8 秒播放；index.html?t=3.2 跳到某一秒；?clean 不显示播放条（截图用）
let HOLD = null;
const STAGE = {}, QS = new URLSearchParams(location.search), SHEET = QS.get('sheet');

function buildStage() {
  const svg = document.getElementById('stage');
  const PH = window.PLAYER_H || 0; svg.style.height = `calc(100vh - ${PH}px)`;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const defs = el('defs', {}, svg);
  // 线条抖动：像手绘动画那样每秒换 10 次形状（五千年的做法）
  const f = el('filter', { id: 'boil', filterUnits: 'userSpaceOnUse', x: -40, y: -40, width: W + 80, height: H + 80 }, defs);
  STAGE.turb = el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.022, numOctaves: 2, seed: 1, result: 'n' }, f);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 5, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
  DEFS = el('defs', {}, svg);                                   // 每帧的裁剪形状放这里
  el('image', { href: paperTexture(), x: 0, y: 0, width: W, height: H }, svg);
  const wrap = el('g', { filter: 'url(#boil)' }, svg);
  STAGE.frame = el('g', {}, wrap);
  STAGE.tint = el('rect', { x: 0, y: 0, width: W, height: H, fill: PAPER, opacity: 0, style: 'mix-blend-mode:multiply' }, svg);
  // 歌词层：盖在画面上面的透明 canvas（lyricfx.js 画在这里），和 SVG 画面对齐
  const cv = STAGE.lyr = document.createElement('canvas'), dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; document.body.appendChild(cv);
  const fit = () => { const ih = innerHeight - PH, s = Math.min(innerWidth / W, ih / H); Object.assign(cv.style, { position: 'fixed', pointerEvents: 'none',
    width: W * s + 'px', height: H * s + 'px', left: (innerWidth - W * s) / 2 + 'px', top: (ih - H * s) / 2 + 'px' }); };
  fit(); addEventListener('resize', fit);
}
// 米黄纸底纹：一次性用 canvas 生成（五千年的纸）
function paperTexture() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), r = rng(7);
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(90,70,40,${0.02 + r() * 0.05})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  g.strokeStyle = 'rgba(120,95,60,0.06)'; g.lineWidth = 1;
  for (let i = 0; i < 500; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, l = 8 + r() * 26; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(110,80,40,0)'); v.addColorStop(1, 'rgba(110,80,40,0.07)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c.toDataURL('image/jpeg', 0.92);
}

function seek(t) {
  NID = 0; DEFS.replaceChildren(); STAGE.frame.replaceChildren(); CUR = STAGE.frame; HOLD = null;
  let tint = null;
  if (SHEET) SHEETS[SHEET](t);
  else { tint = drawFilm(t); karaoke(t); }
  STAGE.turb.setAttribute('seed', Math.floor((HOLD ?? t) * 10) % 997 + 1);   // HOLD：镜头要求线条停止抖动（定格）
  STAGE.tint.setAttribute('fill', tint ? tint[0] : PAPER);
  STAGE.tint.setAttribute('opacity', tint ? tint[1] : 0);
}

async function init() {
  // 字体用 data URL 加载（双击打开的 file:// 页面不让读字体文件）
  for (const [fam, url] of Object.entries(FONT_DATA)) { const f = new FontFace(fam, `url(${url})`); await f.load(); document.fonts.add(f); }
  window.PLAYER_H = QS.has('clean') ? 0 : 54;
  buildStage();
  window.seek = seek;
  seek(+(QS.get('t') || 0));
  window.__ready = window.ready = true;
  if (!QS.has('clean')) initPlayer(+(QS.get('t') || 0));
}
init();
