// cast_head.js: the small heads of the full-body puppets (about 15 px). head(hx, hy, P, o) is called by person().
//   o.view 'front' | 'side' | 'back', o.dir, o.ex expression:
//     'n' neutral, 'smile', 'laugh', 'sad', 'cry', 'shock', 'closed' (eyes shut, calm), 'sleep', 'talk' (o.talk = 0..1
//     mouth open), 'tense' (lips pressed), 'teary' (eyes wet, smiling)
//   o.blink (true / false / undefined = automatic), o.blush, o.look [dx, dy], o.tear (0..1 tear stream length)

const EYES = {          // left eye; e = iris, h = highlight, l = lid / lash (outline), w = wet shine
  n: ['lh', 'ee'],
  smile: ['.l.', 'l.l'],
  laugh: ['.l.', 'l.l'],
  sad: ['ll', 'he'],
  cry: ['ll', 'hw'],
  teary: ['.l.', 'lwl'],
  shock: ['he', 'ee', 'ee'],
  closed: ['..', 'll'],
  sleep: ['..', 'll'],
  tense: ['ll', 'ee'],
};
const MOUTHS = {
  n: ['ss'], smile: ['s..s', '.ss.'], laugh: ['oooo', 'mmmm', '.mm.'], sad: ['.ss.', 's..s'], cry: ['.oo.', 'ommo'],
  teary: ['s..s', '.ss.'], shock: ['oo', 'mm'], closed: ['.ss.'], sleep: ['s'], tense: ['sss'], talk: ['oo', 'mm'],
};
function head(hx, hy, P, o = {}) {
  hx = Math.round(hx); hy = Math.round(hy);
  const view = o.view || 'front', dir = o.dir || 1, isHer = P.hairStyle ? P.hairStyle === 'bob' : P === HER, glasses = P.glasses ?? P === HIM;
  const [h1, h2, h3, h4] = P.hair, [s0, s1, s2] = P.skin;
  let ex = o.ex || 'n';
  if (ex === 'talk' && !(o.talk > .5)) ex = 'n';
  const blink = o.blink ?? (['n', 'sad', 'tense', 'talk'].includes(ex) && blinkAt(T, isHer ? 1 : 2));
  const eyeKey = blink ? 'closed' : ex === 'talk' ? 'n' : ex;
  const mouthKey = o.ex === 'talk' ? (o.talk > .5 ? 'talk' : 'n') : ex;
  const [lx, ly] = o.look || [0, 0];
  const key = { l: C.OL, e: C.E1, h: C.WH, w: C.NB, s: C.S3, o: C.OL, m: C.MD, '.': -1 };
  if (view === 'back') {
    if (isHer) { ellipse(hx, hy, 8, 8, h2); rect(hx - 8, hy, 17, 7, h2); pset(hx - 9, hy + 6, h2); pset(hx + 9, hy + 6, h2); hline(hx - 7, hx + 7, hy + 6, h1); line(hx - 4, hy - 5, hx - 1, hy - 7, h3); }
    else { ellipse(hx, hy - 1, 8, 7.5, h1); rect(hx - 7, hy, 15, 4, h1); pset(hx - 1, hy - 9, h1); pset(hx + 2, hy - 9, h1); line(hx - 4, hy - 5, hx - 1, hy - 7, h2); }
    if (P === HER) { pset(hx + 6 * dir, hy - 3, C.M1); pset(hx + 6 * dir, hy - 4, C.M2); }
    return;
  }
  const side = view === 'side', fx = side ? hx + dir : hx;           // face centre
  // ---------- hair behind the face ----------
  if (isHer) {
    const bx = side ? hx - dir * 2 : hx;
    ellipse(bx, hy - 1, 8, 8, h2);
    rect(bx - 8, hy - 1, 17, 8, h2);
    pset(bx - 9, hy + 6, h2); pset(bx + 9, hy + 6, h2);
    hline(bx - 8, bx + 8, hy + 6, h1);
  } else {
    ellipse(side ? hx - dir : hx, hy - 1, 8, 7.5, h1);
    rect((side ? hx - dir : hx) - 8, hy - 1, 16, 4, h1);
  }
  // ---------- face ----------
  ellipse(fx, hy + 1, side ? 6 : 6.5, 7, s1);
  // jaw shade on the far side
  if (side) { for (let j = 0; j < 6; j++) pset(fx - dir * 5 + (j > 3 ? dir : 0), hy + 1 + j, s2); }
  // ear (side)
  if (side) { rect(hx - dir * 3 - (dir > 0 ? 1 : 0), hy + 1, 2, 3, s2); }
  // ---------- eyes ----------
  const E = EYES[eyeKey] || EYES.n, ew = E[0].length;
  const eyeL = side ? [fx + dir * 3 - (dir > 0 ? 0 : ew - 1), hy + 1] : [hx - 4, hy + 1];
  const eyeR = side ? [fx - dir * 2 - (dir > 0 ? ew - 1 : 0), hy + 1] : [hx + 2 + (ew > 2 ? -1 : 0) + 1 - (ew > 2 ? 0 : 0), hy + 1];
  const dy0 = E.length > 2 ? -1 : 0;
  if (!side || true) {
    sprite(E, eyeL[0] + lx, eyeL[1] + ly + dy0, key, side ? dir < 0 : false);
    if (side) { const far = E.map(r => r.slice(0, 1)); sprite(far, eyeR[0] + lx + (dir > 0 ? ew - 1 : 0), eyeR[1] + ly + dy0, key); }
    else sprite(E, eyeR[0] + lx, eyeR[1] + ly + dy0, key, true);
  }
  // ---------- mouth ----------
  const M = MOUTHS[mouthKey] || MOUTHS.n, mw = M[0].length;
  const mx = side ? fx + dir * 3 - Math.floor(mw / 2) : hx - Math.floor(mw / 2) + (mw % 2 ? 0 : 0), my = hy + 5;
  sprite(M, mx, my, { s: C.S3, o: C.OL, m: C.MD });
  if (side) pset(fx + dir * 6, hy + 3, s2);                            // nose tip
  // ---------- cheeks / tears ----------
  if (o.blush || ex === 'laugh' || ex === 'smile' && isHer) {
    if (side) hline(fx + dir * 1, fx + dir * 2, hy + 3, C.BL);
    else { hline(hx - 6, hx - 5, hy + 3, C.BL); hline(hx + 4, hx + 5, hy + 3, C.BL); }
  }
  const tear = o.tear ?? (ex === 'cry' ? 1 : 0);
  if (tear > 0) {
    const n = Math.round(tear * 6), ph = Math.floor(T * 10) % 3;
    const cols = side ? [eyeL[0] + (dir > 0 ? 0 : ew - 1)] : [hx - 4, hx + 3];
    for (const cx of cols) for (let i = 0; i < n; i++) if ((i + ph) % 3 !== 0 || i < 2) pset(cx, hy + 3 + i, C.NB);
  }
  // ---------- hair in front ----------
  if (isHer) {
    if (side) {
      poly([[hx - dir * 7, hy - 8], [hx + dir * 8, hy - 7], [hx + dir * 8, hy - 2], [hx + dir * 5, hy - 3], [hx + dir * 2, hy - 1], [hx - dir * 2, hy - 2]].map(([a, b]) => [a + (dir < 0 ? 1 : 0), b]), h2);
      rect(hx - dir * 4 - (dir > 0 ? 3 : 0), hy - 3, 4, 9, h2);                      // hair over the ear, falling to the jaw
      line(hx - dir * 3, hy - 6, hx + dir * 3, hy - 7, h3);
    } else {
      poly([[hx - 8, hy - 8], [hx + 8, hy - 8], [hx + 8, hy - 1], [hx + 5, hy - 3], [hx + 1, hy - 2], [hx - 3, hy - 1], [hx - 6, hy + 1], [hx - 8, hy + 1]], h2);
      rect(hx - 8, hy - 2, 2, 9, h2); rect(hx + 7, hy - 2, 2, 9, h2);                  // side locks to the jaw
      line(hx - 5, hy - 6, hx - 1, hy - 7, h3); pset(hx - 6, hy - 5, h3); pset(hx + 4, hy - 6, h4);
      line(hx + 2, hy - 3, hx + 5, hy - 4, h1);                                        // bang shadow
    }
    // the yellow star clip (on her left = viewer's right in front view)
    const cx = side ? hx - dir * 1 : hx + 6, cy = hy - 4;
    if (P === HER) { pset(cx, cy - 1, C.M1); pset(cx - 1, cy, C.M1); pset(cx, cy, C.NY); pset(cx + 1, cy, C.M1); pset(cx, cy + 1, C.M2); }
  } else {
    if (side) {
      poly([[hx - dir * 7, hy - 7], [hx + dir * 7, hy - 7], [hx + dir * 8, hy - 3], [hx + dir * 5, hy - 2], [hx + dir * 4, hy - 4], [hx + dir * 2, hy - 1], [hx, hy - 3], [hx - dir * 4, hy - 1]].map(([a, b]) => [a + (dir < 0 ? 1 : 0), b]), h1);
      rect(hx - dir * 5 - (dir > 0 ? 3 : 0), hy - 2, 4, 3, h1);
    } else {
      poly([[hx - 8, hy - 6], [hx + 8, hy - 6], [hx + 8, hy - 1], [hx + 6, hy - 3], [hx + 4, hy - 1], [hx + 2, hy - 3], [hx, hy - 1], [hx - 2, hy - 3], [hx - 4, hy - 1], [hx - 6, hy - 3], [hx - 8, hy]], h1);
      rect(hx - 8, hy - 2, 2, 4, h1); rect(hx + 7, hy - 2, 2, 4, h1);
    }
    pset(hx - 1, hy - 9, h1); pset(hx + 2, hy - 9, h1); pset(hx + 3, hy - 10, h1); pset(hx, hy - 8, h1);   // tufts
    line(hx - 4, hy - 6, hx, hy - 7, h2); pset(hx + 3, hy - 7, h3);
    // round glasses
    if (glasses) {
    const lens = (cx, cy) => { hline(cx - 1, cx + 2, cy - 2, C.OL); hline(cx - 1, cx + 2, cy + 2, C.OL); vline(cx - 2, cy - 1, cy + 1, C.OL); vline(cx + 3, cy - 1, cy + 1, C.OL); };
    if (side) { lens(fx + dir * 3 - (dir > 0 ? 0 : 1), hy + 1); pset(fx + dir * 3 + (dir > 0 ? 2 : -2), hy - 1, C.WH); line(fx + dir * 1, hy, hx - dir * 3, hy, C.OL); }
    else { lens(hx - 4, hy + 1); lens(hx + 2, hy + 1); pset(hx - 2 + 1, hy + 1, C.OL); pset(hx - 1, hy + 1, C.OL); pset(hx + 3, hy - 1 + 1, C.WH); pset(hx - 3, hy, C.WH); }
    }
  }
}
