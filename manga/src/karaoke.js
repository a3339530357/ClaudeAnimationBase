// karaoke.js: the lyrics, as a manga narration box: a white box with a heavy ink border near the bottom of the frame,
// the line in a bold serif, each character going from pale grey to ink exactly as it is sung (LY's per-character
// times). Drawn on the output canvas after the strobe flip (POST.overlay), so it never inverts. No red: save it for the story.
// The font is fonts/caption.otf, a subset holding only the lyrics' characters (CI machines have no CJK fonts):
//   python -I tools/lyrics/caption_font.py work/analysis/timing.json fonts/caption.otf
// Without it the page falls back to the system's Noto Serif CJK SC (fine on this machine, tofu on CI).

const CAPTION_CHARS = typeof LY === 'undefined' ? '' : [...new Set(LY.map(l => l[2]).join(''))].join('');
const KFONT = '"Caption", "Noto Serif CJK SC", serif', KSIZE = 50, KY = 1002;
const KDIM = '#A9A49B';

function karaoke(t) {
  const L = LY.find(l => t >= l[0] - .15 && t < l[1] + .12); if (!L) return;
  const [a, b, line] = L;
  const grow = easeOut(seg(t, a - .15, a + .03)) * (1 - ease(seg(t, b, b + .12)));
  if (grow < .02) return;
  const chars = Array.from(line);
  const lit = L[3] ? L[3].reduce((n, [s, e]) => n + clamp((t - s) / Math.max(.06, e - s)), 0) : clamp((t - a) / (b - a)) * chars.length;
  const bn = Math.floor(t * BOIL);
  POST.overlay = c => drawCaption(c, chars, lit, grow, bn);
}

function drawCaption(c, chars, lit, grow, bn) {
  c.save(); c.font = `${KSIZE}px ${KFONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
  const ws = chars.map(ch => c.measureText(ch).width + 4), total = ws.reduce((p, q) => p + q, 0);
  const k = backOut(grow), w = (total + 76) * k, h = 84 * Math.min(1, k * 1.1), x0 = 960 - w / 2, y0 = KY - h / 2;
  const j = i => (hash(bn * 13.1 + i) - .5) * 2.4;     // the box boils with the rest of the drawing
  const box = [[x0 + j(1), y0 + j(2)], [x0 + w + j(3), y0 + j(4)], [x0 + w + j(5), y0 + h + j(6)], [x0 + j(7), y0 + h + j(8)]];
  c.beginPath(); box.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  c.fillStyle = 'rgba(20,18,22,.35)'; c.save(); c.translate(7, 8); c.fill(); c.restore();   // drop shadow, as on a printed page
  c.fillStyle = WHITE; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.lineJoin = 'miter'; c.stroke();
  if (grow > .85) {
    let x = 960 - total / 2;
    chars.forEach((ch, i) => {
      const f = clamp(lit - i), pop = f > 0 && f < 1 ? 1 + .16 * Math.sin(f * Math.PI) : 1;
      c.save(); c.translate(x + ws[i] / 2, KY + 2); c.scale(pop, pop);
      c.fillStyle = f >= 1 ? INK : KDIM; c.fillText(ch, -ws[i] / 2 + 2, 0);
      if (f > 0 && f < 1) { c.beginPath(); c.rect(-ws[i] / 2, -KSIZE, ws[i] * f, KSIZE * 2); c.clip(); c.fillStyle = INK; c.fillText(ch, -ws[i] / 2 + 2, 0); }
      c.restore(); x += ws[i];
    });
  }
  c.restore();
}
