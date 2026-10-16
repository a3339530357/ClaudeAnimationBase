// karaoke.js: the lyric band at the bottom of the frame. A painted ink pill grows in with each line of LY (music.js);
// the line, in ZCOOL KuaiLe, lights up character by character in electric yellow, each character popping as it lights.
// A line may carry each character's own [start, end] as a 4th item; then every character lights exactly as it is sung.
// The pill is painted into the scene (so impact frames and wipes treat it like everything else); the text is drawn on
// the 2D compositor through POST.overlay, under the paper grain.

const KFONT = '"ZCOOL KuaiLe", "Noto Sans CJK SC", sans-serif', KSIZE = 54, KY = 1000;
const KLIT = '#FFD84A', KDIM = '#F7EEDB';

// Or one of lyricfx's three styles (lyricfx/README.md): slip (paper strip), pop (big characters popping), kinetic
// (chunks slamming in on the beat). Define const LYRIC_FX = { style: 'slip', layout: {...} } next to LY in the project,
// or add ?ly=slip|pop|kinetic to the page URL to try one. kinetic shakes the painting as words land (POST.shake).
const LY_PICK = new URLSearchParams(location.search).get('ly');
function lyricFXOn(t) {
  const fx = LY_PICK ? { style: LY_PICK } : typeof LYRIC_FX !== 'undefined' ? LYRIC_FX : null;
  if (!fx || typeof lyricFX === 'undefined') return false;
  const o = { W, H, beats: Array.from({ length: Math.ceil(DUR / BEAT) + 2 }, (_, n) => OFF + n * BEAT), boil: t => Math.floor(t * BOIL), ...fx, lines: LY };
  POST.shake = lyricFX(null, t, o).shake;
  POST.overlay = c => lyricFX(c, t, o);
  return true;
}

function karaoke(t) {
  if (lyricFXOn(t)) return;
  const L = LY.find(l => t >= l[0] - .12 && t < l[1] + .1); if (!L) return;
  const [a, b, line] = L;
  const grow = easeOut(seg(t, a - .12, a + .06)) * (1 - ease(seg(t, b - .02, b + .1)));
  if (grow < .02) return;
  outX.font = `${KSIZE}px ${KFONT}`;
  const tw = outX.measureText(line).width, w = (tw + 120) * backOut(grow), h = 92, x0 = 960 - w / 2, y0 = KY - h / 2;
  boilSeed('karaoke');
  const pts = [[x0 + jit(6), y0 + jit(3)], [960, y0 - 5 + jit(3)], [x0 + w + jit(6), y0 + jit(3)], [x0 + w + 16 + jit(4), KY],
    [x0 + w + jit(6), y0 + h + jit(3)], [960, y0 + h + 4 + jit(3)], [x0 + jit(6), y0 + h + jit(3)], [x0 - 16 + jit(4), KY]];
  push(); resetMatrix(); translate(-W / 2, -H / 2);   // screen space, whatever the shot's camera did
  paint(pts, { wash: PAL.ink, washOp: 228, ink: null });
  pop();
  if (grow < .85) return;
  const chars = Array.from(line), sung = chars.filter(c => c !== ' ').length;
  // with per-character times (L[3]) each character lights while it is sung; without, the line lights at an even pace
  const lit = L[3] ? L[3].reduce((n, [s, e]) => n + clamp((t - s) / Math.max(.06, e - s)), 0)
                   : clamp((t - a) / Math.min(b - a - .15, .35 + sung * .2)) * sung;
  POST.overlay = c => drawKaraokeLine(c, chars, lit);
}

function drawKaraokeLine(c, chars, lit) {
  c.save(); c.font = `${KSIZE}px ${KFONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
  const ws = chars.map(ch => c.measureText(ch).width), total = ws.reduce((p, q) => p + q, 0);
  let x = 960 - total / 2, k = 0;
  chars.forEach((ch, i) => {
    if (ch !== ' ') {
      const f = clamp(lit - k), pop = f > 0 && f < 1 ? 1 + .22 * Math.sin(f * Math.PI) : 1;
      c.save(); c.translate(x + ws[i] / 2, KY + 2); c.scale(pop, pop);
      c.fillStyle = f >= 1 ? KLIT : KDIM; c.shadowColor = f >= 1 ? 'rgba(255,216,74,.85)' : 'transparent'; c.shadowBlur = f >= 1 ? 18 : 0;
      c.fillText(ch, -ws[i] / 2, 0);
      if (f > 0 && f < 1) {   // the character being sung: lit from the left
        c.beginPath(); c.rect(-ws[i] / 2 - 2, -KSIZE, ws[i] * f + 2, KSIZE * 2); c.clip();
        c.fillStyle = KLIT; c.fillText(ch, -ws[i] / 2, 0);
      }
      c.restore(); k++;
    }
    x += ws[i];
  });
  c.restore();
}
