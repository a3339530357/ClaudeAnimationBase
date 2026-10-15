// demo.js: ten seconds that touch most of the kit, five shots of four beats (120 BPM, no music). From the library root:
//   node render.mjs --page=manga/studio.html --sheet=0.6,2.2,3.3,4.9,6.6,8.4,9.3 --cols=4 --out=out/check/manga_demo.jpg
//   node render.mjs --page=manga/studio.html --clip --out=out/manga_demo.mp4
// 1 rain at night, she waits under the lamp, looking one way then the other on every beat · 2 a page turn; he runs in
// (speed lines) and stops dead: his face slams in as a panel with focus lines · 3 a shoujo close-up: she turns, bubbles,
// sparkles on the beat · 4 the drop: the club, the crowd jumps, black and white flip on every clap · 5 the page tears
// off to dawn; a gutter slashes between them; ink floods the frame.

function d1(t, lt, dur) {
  const lamp = t < .3 ? 0 : t < .6 ? (frac(t * 11) < .5 ? .8 : .1) : .85 + .15 * clap(t);
  const n = Math.floor(sbeat(t)), side = n % 2 ? 1 : -1, turn = ease(seg(frac(sbeat(t)), 0, .25));
  cam(t, 1180, 560, lerp(1.25, 1.4, ease(lt / dur)));
  corner(t, { lamp });
  person(1250, 905, 1, LU, { v: -.3, hv: lerp(-side, side, turn) * .55, aR: [-.2, -.7], kR: [1, .7], hR: 'hold', aL: [.1, .05],
    ex: { look: [side * .6, 0], mouth: 'line', brow: .4 } }, { t, key: 'd1' });
  camEnd();
  rain(t, { n: 120, col: WHITE, w: 1.8 });
  flashScreen(1 - ease(seg(t, 0, .35)), INK);
}

function d2(t, lt) {
  const body = () => {
    const run = seg(t, HIT.run, HIT.stare), stop = ease(seg(t, HIT.stare - .3, HIT.stare));
    cam(t, lerp(700, 960, easeOut(run)), 560, 1.3);
    corner(t);
    person(1330, 905, 1, LU, { v: .6, hv: .8, ex: { look: [.7, 0], mouth: 'line' } }, { t, key: 'd2l' });   // facing away from him
    const P = t < HIT.stare ? { v: .5, lean: .22 * (1 - stop), ...walkPose((t - HIT.run) * 7, 1.2 * (1 - stop)), hR: 'fist', hL: 'fist', ex: { mouth: 'open', mo: .6 } }
                            : { v: .5, aR: [.2, .1], aL: [.2, .1], hR: 'open', hL: 'open', ex: { eyes: 'shock', mouth: 'o', mo: .6, sweat: 1 } };
    person(lerp(-200, 1000, easeOut(run)), 905, 1, FEI, P, { t, key: 'd2f' });
    camEnd();
    speedLines(0, { n: Math.round(50 * (1 - stop)), key: 'd2', col: WHITE, w: 4 });
    // his face, slammed in as a panel on the beat he stops
    if (t >= HIT.stare - .04) panel(rectPts(60, 60, 680, 470), () => {
      fillScreen(PAPER); focusLines(400, 300, 190, { key: 'd2p' });
      head(400, 320, 3.3, FEI, { eyes: 'shock', mouth: 'o', mo: .6, blush: .7 }, { t, v: .55, tilt: .12 * spring(t, HIT.stare, 4, 14), key: 'd2h' });
    }, { slam: seg(t, HIT.stare - .04, HIT.stare + .16), from: [-60, -40], lw: 8 });
  };
  if (lt < .4) pageTurn(lt / .4, () => drawPrevEnd(S[1]), body); else body();
}

function d3(t, lt, dur) {
  const turn = ease(seg(t, HIT.turn, HIT.turn + .45)), glad = t > HIT.sparkle + .2;
  fillScreen(PAPER); toneGrad(pathOf(rectPts(0, 0, W, H)), 0, 0, 0, H, .3, .04);
  bubbles(960, 560, 760, 18, t, 'd3');
  sparkleBurst(960, 470, 560, seg(t, HIT.sparkle - .02, HIT.sparkle + .8), 12, 'd3');
  cam(t, 960, 560, lerp(1, 1.08, lt / dur));
  head(960, 540, 5.2, LU, { mouth: glad ? 'grin' : 'smile', eyes: glad ? 'happy' : 'open', blush: .4 + .5 * turn, look: [lerp(-.8, .1, turn), 0] },
    { t, v: lerp(-1, -.25, turn), tilt: .1 * spring(t, HIT.turn + .45, 4, 12), key: 'd3' });
  camEnd();
  flashScreen(1 - ease(seg(lt, 0, .25)), WHITE);
  flashScreen(easeIn(seg(t, S[3] - .3, S[3])), INK);
}

function d4(t) {
  const n = Math.floor(sbeat(t)), up = n % 2 === 1;   // arms swap on every beat
  cam(t, 960, 560, 1.15, 0, { shake: 14 * decay(t, 12, 5) });
  dancefloor(t, { jump: HIT.drop });
  person(960, 1000, 1.05, LU_BAD, { v: up ? .2 : -.2, lean: up ? .06 : -.06, dy: -10 * kick(t),
    aR: up ? [2.6, 3.0] : [.6, .3], aL: up ? [.5, .2] : [2.5, 3.1], hR: up ? 'open' : 'relax', hL: up ? 'relax' : 'open',
    ex: { mouth: 'smirk', open: .8, look: [.3, 0] } }, { t, key: 'd4' });
  camEnd();
  if (t < HIT.drop + .35) focusLines(960, 470, 260, { key: 'd4', col: WHITE, a: 1 - seg(t, HIT.drop, HIT.drop + .35) });
  strobe(t);
  flashScreen(1 - ease(seg(t, HIT.drop, HIT.drop + .2)), WHITE);
}

function d5(t, lt) {
  const shot = (cx, who) => { cam(t, cx, 560, 1.45); corner(t, { dawn: 1, lamp: 0 }); who(); camEnd(); };   // cx: where the camera looks
  const fei = () => person(820, 905, 1, FEI_NEW, { v: .45, aR: [.12, .5], hR: 'open', ex: { brow: .6, mouth: 'line', look: [.6, 0] } }, { t, key: 'd5f' });
  const lu = () => person(1300, 905, 1, LU_BAD, { v: -.45, ex: { mouth: 'smirk', open: .8, look: [-.5, 0] } }, { t, key: 'd5l' });
  const body = () => {
    if (t < bt(17)) shot(1060, () => { fei(); lu(); });
    else { const k = easeOut(seg(t, bt(17), bt(17) + .3)) * 20; split2(1000, 920, 26, () => shot(1140, fei), () => shot(960, lu), { apart: [-k, k] }); }   // each in its own half
  };
  if (lt < .5) tearOff(lt / .5, () => drawPrevEnd(HIT.tear), body, 3); else body();
  inkFlood(seg(t, HIT.flood, DUR - .1), 960, 520, 'd5');
}

shots([[S[0], d1], [S[1], d2], [S[2], d3], [S[3], d4], [S[4], d5]]);
