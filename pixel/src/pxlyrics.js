// pxlyrics.js: pixel-font karaoke on the full-res layer (reads LY from music.js), opening credits (reads CREDITS from
// music.js), and pxText() / pxTextWidth() for writing into the pixel buffer.
//
// Font: Fusion Pixel 12px (SIL OFL, fonts/FusionPixel-OFL.txt), subset to the project's characters and embedded as a data
// URL in src/font_data.js (Chrome refuses @font-face files on a page opened from disk). Make both with
// tools/pixel_font.py whenever the lyrics / title / credits change.
// Each glyph is rasterised once at its native 12px and thresholded, so every glyph pixel is a hard square: on the
// 1920x1080 layer one glyph pixel = 8x8 screen pixels = 2x2 scene pixels, the same grid as the picture.
//
// A line shows whole (dim) a little before it is sung; each character turns bright and hops one glyph pixel as it is
// sung; the line holds until just before the next one, then drops away character by character.
// ?ly=none hides the lyrics (for checking the picture underneath).

const LYF = { S: 8, y: 972, dim: '#b3a9c6', lit: '#fff8ec', ol: '#2a1a2e', sh: '#120d18', gap: 1 };
(function () {
  const f = new FontFace('PixelLyric', `url(${PIXEL_FONT_URL})`);
  window.LYRICS_READY = f.load().then(ff => { document.fonts.add(ff); }).catch(e => console.warn('pixel font', e));
})();
const GLYPH = {};
// glyph(ch) -> { w, h, adv, m: Uint8Array(w*h) }, 1 = ink
function glyph(ch) {
  if (GLYPH[ch]) return GLYPH[ch];
  const w = 16, h = 16, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.font = "12px 'PixelLyric'"; x.textBaseline = 'top'; x.fillStyle = '#000';
  x.fillText(ch, 1, 2);
  const a = x.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = a[i * 4 + 3] >= 128 ? 1 : 0;
  const adv = Math.round(x.measureText(ch).width) || 12;
  return (GLYPH[ch] = { w, h, adv, m });
}
// draw one glyph's pixel blocks at screen (x, y) (top-left of the 16x16 cell), S screen px per glyph px
function blitGlyph(ctx, g, x, y, S, fill, ol, sh) {
  const on = (i, j) => i >= 0 && j >= 0 && i < g.w && j < g.h && g.m[j * g.w + i];
  if (sh) { ctx.fillStyle = sh; for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) if (on(i, j)) ctx.fillRect(x + (i + 1) * S, y + (j + 2) * S, S, S); }
  if (ol) {
    ctx.fillStyle = ol;
    for (let j = -1; j <= g.h; j++) for (let i = -1; i <= g.w; i++) {
      if (on(i, j)) continue;
      if (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1) || on(i - 1, j - 1) || on(i + 1, j + 1) || on(i - 1, j + 1) || on(i + 1, j - 1)) ctx.fillRect(x + i * S, y + j * S, S, S);
    }
  }
  ctx.fillStyle = fill;
  for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) if (on(i, j)) ctx.fillRect(x + i * S, y + j * S, S, S);
}

// show / hide times per line, computed once: a line leaves at least .3 s before the next one starts, the next one
// comes in no earlier than that (no two lines on screen at once)
let LYW = null;
function lineWindow(i) {
  if (!LYW) {
    LYW = []; let prevS1 = -9;
    if (typeof LY === 'undefined') window.LY = [];
    for (let k = 0; k < LY.length; k++) {
      const [a, b] = LY[k], nextA = k + 1 < LY.length ? LY[k + 1][0] : DUR + 9;
      const s0 = Math.min(a - .05, Math.max(a - .45, prevS1 + .02));
      const s1 = Math.min(b + 1.8, nextA - .3, k === LY.length - 1 ? b + 3 : 1e9);
      LYW.push([s0, s1]); prevS1 = s1;
    }
  }
  return LYW[i];
}
function drawLyrics(ctx, t) {
  if (/[?&]ly=none/.test(location.search)) return;
  drawCredits(ctx, t);
  if (typeof LY === 'undefined') return;
  const { S, y: cy } = LYF;
  for (let i = 0; i < LY.length; i++) {
    const [s0, s1] = lineWindow(i);
    if (t < s0 || t > s1) continue;
    const chars = [...LY[i][2]], times = LY[i][3], gs = chars.map(glyph);
    const tw = gs.reduce((p, g) => p + (g.adv + LYF.gap) * S, 0) - LYF.gap * S;
    let x = Math.round((W - tw) / 2 / S) * S;
    const y0 = Math.round((cy - 8 * S) / S) * S;
    chars.forEach((ch, k) => {
      const g = gs[k], w = (g.adv + LYF.gap) * S;
      if (ch === '　' || ch === ' ') { x += w; return; }
      const kin = (t - s0 - k * .025) / .14;                     // pop in, left to right
      const kout = (t - (s1 - .22) - k * .018) / .12;             // drop out, left to right
      if (kin < 0 || kout > 1) { x += w; return; }
      let dy = 0;
      if (kin < 1) dy = -Math.round((1 - kin) * 3) * S;
      if (kout > 0) dy = Math.round(kout * 4) * S;
      const [a] = times[k] || [LY[i][0]], sung = t >= a;
      if (sung && t - a < .16) dy -= S;                           // hop as it is sung
      blitGlyph(ctx, g, x, y0 + dy, S, sung ? LYF.lit : LYF.dim, LYF.ol, LYF.sh);
      x += w;
    });
  }
}

// pxText(str, x, y, paint, opt): write into the pixel buffer with the same font (x, y = top-left in buffer px).
// opt.scale (integer, default 1), opt.ol = outline palette index (or null), opt.reveal = 0..1 (characters shown so far,
// the last one wiping in from the left, like handwriting). Returns the width in buffer px.
function pxText(str, x, y, paint, opt = {}) {
  const s = opt.scale || 1, chars = [...str], rv = opt.reveal == null ? 1 : opt.reveal;
  let cx = x;
  const draw = () => chars.forEach((ch, k) => {
    const g = glyph(ch), part = clamp(rv * chars.length - k);
    if (part > 0) for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) if (g.m[j * g.w + i] && i < part * 13) rect(cx + i * s, y + j * s, s, s, paint);
    cx += (g.adv + 1) * s;
  });
  if (opt.ol != null) { begin(); draw(); end(opt.ol); } else draw();
  return cx - x;
}

// ---------- opening credits ----------
// CREDITS (in music.js): [[show, hide, centre y (screen px), [[role, name], ...]], ...]; role dim, name bright; one glyph pixel
// = 4x4 screen px (one scene pixel); same pop-in / drop-out as the lyrics. What the user liked (《写不完的温柔》): 作词 right
// after the title, then the other credits one line at a time through the intro, original MV order, bottom centre.
function pxTextWidth(str, s = 1) { return [...str].reduce((p, ch) => p + (glyph(ch).adv + 1) * s, 0) - s; }
function drawCredits(ctx, t) {
  const S = 4;
  for (const [a, b, yc, parts] of (typeof CREDITS === 'undefined' ? [] : CREDITS)) {
    if (t < a || t > b) continue;
    const chars = [], lit = [];
    parts.forEach(([role, name], i) => {
      if (i) for (const c of '　　') { chars.push(c); lit.push(false); }
      for (const c of role) { chars.push(c); lit.push(false); }
      chars.push('　'); lit.push(false);
      for (const c of name) { chars.push(c); lit.push(true); }
    });
    let x = Math.round((W - pxTextWidth(chars.join(''), S)) / 2 / S) * S;
    const y0 = Math.round((yc - 6 * S) / S) * S;
    chars.forEach((ch, k) => {
      const g = glyph(ch), w = (g.adv + 1) * S;
      const kin = (t - a - k * .02) / .14, kout = (t - (b - .25) - k * .01) / .12;
      if (ch !== '　' && ch !== ' ' && kin >= 0 && kout <= 1) {
        let dy = 0; if (kin < 1) dy = -Math.round((1 - kin) * 3) * S; if (kout > 0) dy = Math.round(kout * 4) * S;
        blitGlyph(ctx, g, x, y0 + dy, S, lit[k] ? LYF.lit : LYF.dim, LYF.ol, LYF.sh);
      }
      x += w;
    });
  }
}
