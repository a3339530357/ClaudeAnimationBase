// photos.js: what's in the polaroids. A photo's picture is painted small and simple, the way a snapshot flattens
// everything: the crabs inside are miniCrab()s (one outline, dot eyes) instead of the full clawd().
// Every painter is PICS.name(x0, y0, S, t): the square picture at (x0, y0), S on a side; t lets a photo come alive.

// A crab inside a photo. (x, y) = ground point between the feet, s = unit (the body is 10s × 6s, like clawd()).
// o: col (default Clawd's clay), bow (小桃's bow), view ('front' | 'back'), eyes ('dot' | 'happy' | 'closed' | 'wide' |
// 'heart' | 'cry' | 'scared'), blush, arms (raise angle), armR (a different right arm), flip, dy, rot, cam (a camera held up).
function miniCrab(x, y, s, o = {}) {
  const col = o.col || PAL.clay, dk = o.dk || mixCol(col, PAL.ink, .3), sw = clamp(s / 7, .3, 1.1);
  push(); translate(x, y + (o.dy || 0) * s); if (o.rot) rotate(o.rot); if (o.flip) scale(-1, 1);
  for (const lx of [-4, -2, 1, 3]) paint(rectPts(lx * s, -2.4 * s, s, 2.4 * s), { wash: dk, ink: null });
  for (const side of [-1, 1]) {
    const a = side > 0 ? (o.armR ?? o.arms ?? .2) : (o.arms ?? .2);
    push(); translate(side * 4.8 * s, -4.5 * s); rotate(side < 0 ? a : -a);
    paint(rectPts(side < 0 ? -2.1 * s : 0, -.45 * s, 2.1 * s, .9 * s), { wash: col, ink: null }); pop();
  }
  paint(rectPts(-5 * s, -8 * s, 10 * s, 6 * s), { wash: col, ink: PAL.ink, sw });
  if (o.view !== 'back') {
    const e = o.eyes || 'dot';
    for (const ex of [-2.5, 2.5]) {
      const X = ex * s, Y = -6 * s;
      if (e === 'happy') inkLine([[X - .6 * s, Y + .3 * s], [X, Y - .5 * s], [X + .6 * s, Y + .3 * s]], sw * 1.1, PAL.ink, 'ink', .5);
      else if (e === 'closed') inkLine([[X - .6 * s, Y], [X + .6 * s, Y + .1 * s]], sw * 1.1, PAL.ink, 'ink', 0);
      else if (e === 'heart') paint(heartPts(X, Y, .9 * s, 14), { wash: '#E2476E', ink: null });
      else if (e === 'wide' || e === 'scared') { paint(ellPts(X, Y, .75 * s, .9 * s, 12), { wash: PAL.cream, ink: PAL.ink, sw: sw * .6 }); paint(ellPts(X, Y, .28 * s, .3 * s, 8), { wash: PAL.ink, ink: null }); }
      else { paint(rectPts(X - .45 * s, Y - .9 * s, .9 * s, 1.8 * s), { wash: PAL.ink, ink: null }); if (e === 'cry') paint(rectPts(X - .3 * s, Y + .9 * s, .6 * s, 2.6 * s), { wash: '#8FC4EA', washOp: 220, ink: null }); }
    }
    if (o.blush) for (const bx of [-3.6, 3.6]) paint(ellPts(bx * s, -4.5 * s, .8 * s, .4 * s, 10), { wash: '#EE7A92', washOp: 200 * o.blush, ink: null });
    if (o.mouth === 'open') paint(ellPts(0, -4.2 * s, .7 * s, .6 * s, 10), { wash: '#6A2A3A', ink: null });
    else if (o.mouth) inkLine([[-.6 * s, -4.4 * s], [0, -4 * s], [.6 * s, -4.4 * s]], sw * .8, PAL.ink, 'inkfine', .5);
  }
  if (o.bow) {
    const bx = 2.3 * s, by = -8.5 * s;
    for (const k of [-1, 1]) paint([[bx, by], [bx + k * 2.4 * s, by - 1.4 * s], [bx + k * 2.4 * s, by + 1 * s]], { wash: '#D8394E', ink: null });
    paint(ellPts(bx, by, .6 * s, .6 * s, 8), { wash: '#B82A40', ink: null });
  }
  if (o.cam) polaCam(o.view === 'back' ? 0 : -1 * s, -6.2 * s, .7 * s, { view: o.view === 'back' ? 'back' : 'front', key: 'mini' });
  pop();
}
const miniTao = (x, y, s, o = {}) => miniCrab(x, y, s, { col: TAOC.col, dk: TAOC.dk, bow: true, ...o });

// Paint inside the picture square only: anything bigger is clipped by drawing the frame back over it (polaroid()
// paints its border after the picture), so painters just keep their big shapes inside [x0, x0 + S].
const box = (x0, y0, S, fx, fy, fw, fh, col) => paint(rectPts(x0 + fx * S, y0 + fy * S, fw * S, fh * S), { wash: col, ink: null });

const PICS = {
  // 1. the sunset beach: 小桃 walking away into the sun (Clawd's first photo)
  sunset: (x0, y0, S, t = 0) => {
    box(x0, y0, S, 0, 0, 1, .2, '#7A5590'); box(x0, y0, S, 0, .2, 1, .2, '#C9708A'); box(x0, y0, S, 0, .4, 1, .2, '#F2A070');
    paint(ellPts(x0 + .5 * S, y0 + .6 * S, .13 * S, .13 * S, 20), { wash: '#FFE2A0', ink: null });
    box(x0, y0, S, 0, .6, 1, .2, '#4C5E9C'); box(x0, y0, S, 0, .8, 1, .2, '#E8C49A');
    miniTao(x0 + .66 * S, y0 + .9 * S, .028 * S, { view: 'back' });
  },
  // 2. the post office: 小桃 laughing, holding up the crab stamp
  stamp: (x0, y0, S, t = 0) => {
    box(x0, y0, S, 0, 0, 1, 1, '#F3E3C8'); box(x0, y0, S, .62, .1, .3, .6, '#5A7FB0'); box(x0, y0, S, 0, .82, 1, .18, '#D9C7AE');
    miniTao(x0 + .42 * S, y0 + .9 * S + Math.sin(t * 9) * .006 * S, .05 * S, { eyes: 'happy', mouth: 'open', armR: 1.3, blush: .8 });
    paint(rectPts(x0 + .64 * S, y0 + .3 * S, .09 * S, .11 * S), { wash: PAL.cream, ink: PAL.ink, sw: .4 });
    paint(rectPts(x0 + .66 * S, y0 + .33 * S, .05 * S, .04 * S), { wash: PAL.clay, ink: null });
  },
  // 3. the dunes: a grasshopper on her bow, 小桃 frozen
  hopper: (x0, y0, S, t = 0) => {
    box(x0, y0, S, 0, 0, 1, .55, '#F2B07A'); box(x0, y0, S, 0, .55, 1, .45, '#C9A070');
    for (let i = 0; i < 9; i++) inkLine([[x0 + (i + .5) / 9 * S, y0 + S], [x0 + (i + .5 + Math.sin(i) * .4) / 9 * S, y0 + (.62 + .1 * hash(i)) * S]], 1.4, '#6E9F58', 'ink', .4);
    miniTao(x0 + .5 * S, y0 + .9 * S + Math.sin(t * 40) * .003 * S, .05 * S, { eyes: 'scared', arms: 1 });
    grasshopper(x0 + .58 * S, y0 + .44 * S, .018 * S);
  },
  // 5. the pier: 小桃 daydreaming, the ice cream gone
  icecream: (x0, y0, S, t = 0) => {
    box(x0, y0, S, 0, 0, 1, .55, '#9ACAE8'); box(x0, y0, S, 0, .55, 1, .2, '#3A93B8'); box(x0, y0, S, 0, .75, 1, .25, '#9A6A4A');
    paint(ellPts(x0 + .3 * S, y0 + .2 * S, .14 * S, .06 * S, 14), { wash: '#F6F4EE', ink: null });
    miniTao(x0 + .5 * S, y0 + .86 * S, .05 * S, { eyes: 'dot', armR: .9 });
    paint([[x0 + .73 * S, y0 + .5 * S], [x0 + .77 * S, y0 + .5 * S], [x0 + .75 * S, y0 + .58 * S]], { wash: '#E0A860', ink: null });
  },
  // 6. the tide line: 小桃 running from the waves, laughing
  waves: (x0, y0, S, t = 0) => {
    box(x0, y0, S, 0, 0, 1, .4, '#F2A070'); box(x0, y0, S, 0, .4, 1, .25, '#4C5E9C'); box(x0, y0, S, 0, .65, 1, .35, '#E8C49A');
    inkLine([[x0, y0 + .66 * S], [x0 + .5 * S, y0 + .7 * S], [x0 + S, y0 + .66 * S]], 2, PAL.cream, 'dry', .5);
    miniTao(x0 + .45 * S, y0 + .9 * S, .05 * S, { eyes: 'happy', mouth: 'open', arms: 1.2, dy: -1.5 - Math.abs(Math.sin(t * 6)) });
  },
  // the favourite: 小桃 laughing, close (the one that drifts out to sea)
  laugh: (x0, y0, S, t = 0) => {
    box(x0, y0, S, 0, 0, 1, 1, '#F8D8A8'); paint(ellPts(x0 + .5 * S, y0 + .4 * S, .45 * S, .45 * S, 24), { wash: '#FBE6C0', ink: null });
    miniTao(x0 + .5 * S, y0 + 1.15 * S, .085 * S, { eyes: 'happy', mouth: 'open', blush: 1 });
  },
  // 小桃's photos of Clawd, taken from her side: peeking from behind the postbox, his shadow monster, crying on the pier
  cPostbox: (x0, y0, S, t = 0) => {
    box(x0, y0, S, 0, 0, 1, 1, '#F3E3C8'); box(x0, y0, S, 0, .84, 1, .16, '#D9C7AE');
    miniCrab(x0 + .6 * S, y0 + .9 * S, .045 * S, { eyes: 'dot', blush: .8, cam: true });
    paint(rrPts(x0 + .2 * S, y0 + .25 * S, .3 * S, .7 * S, .04 * S), { wash: '#D8394E', ink: PAL.ink, sw: .5 });
  },
  cShadow: (x0, y0, S, t = 0) => {
    box(x0, y0, S, 0, 0, 1, 1, '#2A2850'); box(x0, y0, S, 0, .82, 1, .18, '#1E1C3A');
    glow(x0 + .85 * S, y0 + .1 * S, .5 * S, '#FFD98A', .5);
    paint([[x0 + .1 * S, y0 + .82 * S], [x0 + .12 * S, y0 + .3 * S], [x0 + .2 * S, y0 + .12 * S], [x0 + .26 * S, y0 + .28 * S], [x0 + .38 * S, y0 + .1 * S], [x0 + .44 * S, y0 + .3 * S], [x0 + .56 * S, y0 + .16 * S], [x0 + .6 * S, y0 + .82 * S]], { wash: '#141230', ink: null });
    miniCrab(x0 + .72 * S, y0 + .9 * S, .035 * S, { eyes: 'wide', arms: 1.3, cam: true });
  },
  cCry: (x0, y0, S, t = 0) => {
    box(x0, y0, S, 0, 0, 1, .5, '#9ACAE8'); box(x0, y0, S, 0, .5, 1, .3, '#3A93B8'); box(x0, y0, S, 0, .8, 1, .2, '#9A6A4A');
    miniCrab(x0 + .5 * S, y0 + .86 * S, .05 * S, { eyes: 'cry', arms: -.6 });
  },
};
