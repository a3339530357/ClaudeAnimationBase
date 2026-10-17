// scenes/demo.js: a 13-second demo of the pixel kit, three shots from 《写不完的温柔》 (2026-10):
//   0-4.5   snowy coast at night, the title popping in over the train (the opening the user liked: the title on screen from
//           the first frame, characters popping in ~0.1 s apart), credits line at the bottom
//   4.5-8.5 the station hall at night: she walks to the old piano (wide, then the pixel camera closes in)
//   8.5-13  from inside the piano: four hands, a wrong note and a laugh, a pinky promise, a heart; the lyric line lights up
// plus LOOPS.cover, the 4:3 cover of that film (zoom 3, title in the buffer, singer on the full-res layer).
// Top-level names start with DEMO_ (all scene files share one global scope).
const DEMO_SPRING = () => { grade('warm', .15); POST.vig = Math.max(POST.vig || 0, .35); };
function DEMO_pop(k) { if (k <= 0) return 0; if (k >= 1) return 1; return k < .6 ? lerp(.2, 1.18, easeOut(k / .6)) : lerp(1.18, 1, ease((k - .6) / .4)); }
function DEMO_title(t) {
  const str = [...'写不完的温柔'], sc = 4, w0 = pxTextWidth('写不完的温柔', sc), ty = 18, gh = 12 * sc;
  let x = Math.round(240 - w0 / 2);
  const x0 = x;
  str.forEach((ch, k) => {
    const w = (glyph(ch).adv + 1) * sc, p = DEMO_pop((t - .1 - k * .1) / .32);
    if (p > 0) {
      // pop = draw the glyph at an integer scale that grows 1 -> 4 (-> 5 overshoot) -> 4, centred on its cell
      const s2 = Math.max(1, Math.round(sc * p)), cx = x + w / 2 - 2, cy = ty + gh / 2;
      const gx = Math.round(cx - (glyph(ch).adv + 1) * s2 / 2), gy = Math.round(cy - 12 * s2 / 2);
      pxText(ch, gx + 2, gy + 3, C.K0, { scale: s2 });
      pxText(ch, gx, gy, C.WH, { scale: s2, ol: C.OL });
    }
    x += w;
  });
  const g = seg(t, bt(1), bt(1) + .7);
  if (g > 0 && g < 1) { const gx = x0 + g * (w0 + 20); for (let y = ty; y < ty + gh; y++) for (let d = 0; d < 6; d++) { const px = Math.round(gx - d - (y - ty) * .4); if (at(px, y) === C.WH) pset(px, y, d < 3 ? C.L1 : C.Y1); } }
  for (const n of [1, 5]) { const k = pulse(t, n, .5); if (k > 0) sparkle(x0 + w0 + 4, 20, k, C.L1); }
  const sing = 'G.E.M. 邓紫棋', mk = 'MV制作　小冰OvO';
  const r1 = seg(t, .85, 1.25), r2 = seg(t, 1.15, 1.6);
  if (r1 > 0) pxText(sing, Math.round(240 - pxTextWidth(sing) / 2), 74 - Math.round((1 - easeOut(r1)) * 4), C.L1, { ol: C.OL, reveal: Math.min(1, r1 * 1.6) });
  if (r2 > 0) pxText(mk, Math.round(240 - pxTextWidth(mk) / 2), 91 - Math.round((1 - easeOut(r2)) * 4), C.K5, { ol: C.OL, reveal: Math.min(1, r2 * 1.6) });
}


function DEMO_coast(t, lt, dur) {
  sky('night', 0, 124); stars(t, 100, 50, 21); moon(444, 20, 7);
  city(118, { col: C.K1, lit: .5, h: 16, seed: 31 });                                  // the little town far off
  sea(118, t, 'night');
  for (let y = 122; y < 168; y += 2) { const w = 4 + (y - 120) * .25; if (bayer(444, y) < .8) hline(444 - w / 2 + Math.round(Math.sin(t * 2 + y) * 2), 444 + w / 2 + Math.round(Math.sin(t * 2 + y) * 2), y, (y >> 1) % 3 ? C.K4 : C.L1); }   // moonlight on the water
  // snowy embankment in front, rails on top
  const ry = 170;
  rect(0, ry + 4, PW, PH - ry - 4, vramp([C.K5, C.K4, C.K3, C.K2], ry + 4, PH));
  for (let i = 0; i < 160; i++) pset(Math.floor(hash(i, 61) * PW), ry + 6 + Math.floor(Math.pow(hash(i, 62), .7) * (PH - ry - 6)), C.WH);
  hline(0, PW, ry + 4, C.WH); hline(0, PW, ry + 5, C.K5);
  for (let x = 0; x < PW; x += 6) rect(x, ry + 1, 4, 2, C.OL2);
  hline(0, PW, ry, C.G4); hline(0, PW, ry - 3, C.G4);
  for (let x = 20; x < PW; x += 96) { vline(x, ry - 52, ry, C.G1); hline(x - 4, x + 6, ry - 52, C.G1); }
  hline(0, PW, ry - 50, thin(C.G1, .6));
  // the train: three cars running right, windows lit, headlight beam ahead
  const tx = Math.round(lerp(-200, 250, easeOut(seg(lt, 0, dur + .8)))), L = 124;
  for (let c = 0; c < 3; c++) {
    const cx = tx + c * (L + 3), top = ry - 40;
    begin(); rect(cx, top, L, 36, C.CR1); hline(cx, cx + L - 1, top, C.WH); rect(cx, ry - 12, L, 4, C.RD); rect(cx, ry - 8, L, 6, C.G2); end(C.OL);
    for (let k = 0; k < 6; k++) { rect(cx + 8 + k * 19, top + 7, 12, 11, C.L1); rect(cx + 8 + k * 19, top + 7, 12, 2, C.L2); }
    if (c === 2) { begin(); poly([[cx + L, top], [cx + L + 14, top + 12], [cx + L + 14, ry - 4], [cx + L, ry - 4]], C.CR1); end(C.OL); rect(cx + L + 4, top + 6, 6, 6, C.K3); }
  }
  const hx = tx + 3 * (L + 3) + 10, hy = ry - 14;
  poly([[hx, hy - 2], [hx + 200, hy - 34], [hx + 200, hy + 22], [hx, hy + 2]], thin(C.L1, .3));
  ellipse(hx, hy, 3, 3, C.WH);
  // light from the windows on the snow
  for (let c = 0; c < 3; c++) for (let k = 0; k < 6; k++) rect(tx + c * (L + 3) + 8 + k * 19, ry + 6, 12, 3, thin(C.L1, .4));
  snow(t, { n: 110, wind: .35, speed: 16 });
  for (let n = 5; n < 8; n += 4) { const k = pulse(t, n, .5); if (k > 0) sparkle(60 + n * 30, 108, k, C.WH); }
  DEMO_title(t);
  const g = seg(lt, dur - .7, dur);
  if (g > 0) ellipse(hx, hy, 20 + g * 420, 14 + g * 320, thin(C.WH, g));
}

function DEMO_hall(t, lt, dur) {
  const A = stationHall(t, { mood: 'night', warm: .8 });
  const [x, ph] = walk(lt, .2, dur - .6, 450, 128, 1.7);
  const walking = lt > .2 && lt < dur - .6;
  suitcase(x + 9, A.floor, { handle: 8 });
  her(x, A.floor, { view: 'side', dir: -1, pose: walking ? 'walk' : 'stand', ph, outfit: 'winter', scarf: true, arms: { far: [22, 0] }, ex: walking ? 'n' : 'sad' });
  zoomTo(lt, 1.2, dur - .4, [1, PW / 2, PH / 2], [2, x + 30, 168]);              // wide first, then in close behind her
  if (lt > 1.2 && lt < dur - .4) POST.zoom = [POST.zoom[0], lerp(PW / 2, x + 30, ease(seg(lt, 1.2, dur - .4))), POST.zoom[2]];
}

// four hands at the piano, seen from inside it (keyboard in the foreground, both facing us)
function DEMO_duet(t, lt, dur) {
  stationHall(t, { mood: 'spring', piano: false, cam: 20 });
  const fy = 187, hook = seg(lt, 2.0, 2.6), held = lt >= 2.6;
  const wrong = lt > .6 && lt < 1.4, laugh = lt > .8 && lt < 1.6;
  her(224, fy, { view: 'front', pose: 'sit', outfit: 'spring', bob: hook > 0 ? 0 : Math.round(Math.sin(t * 9) * .6), ex: laugh ? 'laugh' : held ? 'smile' : wrong ? 'shock' : 'n',
    look: held ? [1, 0] : [0, 1], blush: held, arms: { l: [10, 0], r: [lerp(10, 112, ease(hook)), lerp(0, -70, ease(hook))] } });
  him(256, fy, { view: 'front', pose: 'sit', bob: hook > 0 ? 0 : Math.round(Math.sin(t * 9 + 2) * .6), ex: laugh ? 'laugh' : held ? 'smile' : 'closed',
    look: held ? [-1, 0] : [0, 1], arms: { r: [10, 0], l: [lerp(10, 112, ease(hook)), lerp(0, -70, ease(hook))] } });
  if (held) { const k = seg(lt, 2.6, 3.1); heart(237, 150 - Math.round(easeOut(k) * 12), 1, C.RD); if (k < 1) sparkle(240, 156, 1 - k, C.L1); }
  const b = Math.floor(sbeat(t) * 2), lit = [b % 9 + 4, (b + 4) % 9 + 9];
  keyboard(150, 180, 180, 16, { kw: 10, lit, glow: false });
  begin(); rect(140, 196, 200, 80, C.P2); rect(140, 196, 200, 3, C.P1); for (let x = 160; x < 340; x += 40) rect(x, 206, 30, 50, C.P1); end(C.OL);
  begin(); rect(140, 174, 10, 100, C.P1); rect(330, 174, 10, 100, C.P1); end(C.OL);
  if (wrong) { const k = seg(lt, .6, 1.4); begin(); line(212, 160 - k * 10, 216, 156 - k * 10, C.G2); line(216, 156 - k * 10, 214, 152 - k * 10, C.G2); rect(210, 160 - k * 10, 3, 2, C.G2); end(C.OL, 1 - k); }
  zoomTo(lt, 1.9, 2.6, [2, 240, 152], [3, 240, 150]);
  DEMO_SPRING();
}

shots([
  [0, DEMO_coast],
  [4.5, DEMO_hall, { tr: 'push', d: .6, dir: 1 }],
  [8.5, DEMO_duet, { tr: 'flash', d: .6 }],
]);

// ---------- the cover (4:3): node render.mjs --page=pixel/studio.html --loop=cover --size=1920x1440 --stills=1 --out=out/cover/q ----------
// The ending in one picture: from inside the piano, the two of them side by side, smiling at each other; title in the buffer
// (pxText, zoomed with the picture), singer on the full-res layer (POST.overlay) so it can be smaller than one zoomed pixel.
LOOPS.cover = t => {
  stationHall(t, { mood: 'night', warm: 1, piano: false, cam: 20 });
  const fy = 187, cx = 238, cy = 151;
  // gold notes rising from the keys, a few hearts between them
  const notes = [[172, 132, C.L1], [190, 118, C.NY], [284, 116, C.L1], [298, 134, C.WH], [166, 112, C.WH], [302, 108, C.NY]];
  notes.forEach(([x, y, c], i) => noteIcon(x, y, c, { double: i % 3 === 0, ol: C.OL }));
  her(222, fy, { view: 'front', pose: 'sit', outfit: 'winter', scarf: true, ex: 'smile', blush: true, look: [1, 0], blink: false, arms: { l: [10, 0], r: [10, 0] } });
  him(254, fy, { view: 'front', pose: 'sit', outfit: 'winter', scarf: false, ex: 'smile', blush: true, look: [-1, 0], blink: false, arms: { l: [10, 0], r: [10, 0] } });
  heart(234, 129, 1, C.RD); heart(241, 121, 1, C.NP); sparkle(247, 129, .7, C.WH);
  // the piano in front: fallboard, keys (a chord lit), front panel, sticky notes on its frame
  keyboard(150, 180, 180, 16, { kw: 10, lit: [5, 7, 11, 13], glow: false });
  begin(); rect(140, 196, 200, 120, C.P2); rect(140, 196, 200, 3, C.P1); for (let x = 160; x < 340; x += 40) rect(x, 206, 30, 50, C.P1); end(C.OL);
  begin(); rect(140, 174, 10, 140, C.P1); rect(330, 174, 10, 140, C.P1); end(C.OL);
  stickyNote(284, 199, C.NY, {}); stickyNote(294, 201, C.NP, { mark: 'heart' }); stickyNote(178, 200, C.NM, {});
  // the title above the window light
  const title = '写不完的温柔', sc = 1, tw = pxTextWidth(title, sc), tx = Math.round(cx - tw / 2), ty = cy - 60 + 4;
  pxText(title, tx + 1, ty + 2, C.K0, { scale: sc });
  pxText(title, tx, ty, C.WH, { scale: sc, ol: C.OL });
  sparkle(tx + tw + 4, ty + 1, .7, C.L1); sparkle(tx - 5, ty + 11, .4, C.L1);
  grade('warm', .22); POST.vig = .35;
  POST.zoom = [3, cx, cy];
  // the singer under the title, on the full-res layer: one glyph pixel = 6 screen px (half a scene pixel at this zoom)
  POST.overlay = ctx => {
    const str = 'G.E.M. 邓紫棋', S = 6, w = pxTextWidth(str, S);
    let x = Math.round((ctx.canvas.width - w) / 2 / S) * S;
    for (const ch of str) { const g = glyph(ch); if (ch !== ' ') blitGlyph(ctx, g, x, 246, S, '#ffe9a8', '#2a1a2e', '#120d18'); x += (g.adv + 1) * S; }
  };
};
LOOPS.cover.len = 1;
