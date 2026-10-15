// props_bad.js: the things the story runs on. The phone (her messages, the call that never comes, the call she turns
// down), the eyeliner (the billboard he fancied, her first wobbly try, the perfect wing, the tear that runs it), the
// drinks at the bar, the neon heart that keeps turning up, and the billboard girl she copies.

// ---------- the phone ----------
// phone(x, y, h, o): centred at (x, y), h tall. o.screen: off | photo | call (incoming: decline + accept, pulsing) |
// dial (outgoing: one red button, dots) | msgs (o.n bubbles, fractional n pops the newest in) | ended (hang-up glyph;
// o.text adds 「通话已结束」). o.who: whose picture is on it ('clawd' | 'tao'). o.lit 0..1 lights the room around it,
// o.ring 0..1 is the ring pulse, o.rot tilts it, o.t drives the dots.
function phone(x, y, h, o = {}) {
  const w = h * .5, r = h * .09, scr = o.screen || 'off', sw = clamp(h / 110, .5, 2.2), t = o.t ?? T;
  push(); translate(x, y); if (o.rot) rotate(o.rot);
  boilSeed('phone' + (o.key ?? ''));
  if ((o.lit || 0) > .01) glow(0, 0, h * (1.15 + .35 * (o.ring || 0)), o.glowCol || '#BFE0FF', o.lit);
  paint(rrPts(-w / 2, -h / 2, w, h, r), { wash: '#24202C', ink: PAL.ink, sw });
  const sx = -w / 2 + h * .035, sy = -h / 2 + h * .06, sW = w - h * .07, sH = h - h * .12;
  const bg = { off: '#0C0B11', ended: '#121018', msgs: '#2A2440' }[scr] || '#2F3A68';
  paint(rrPts(sx, sy, sW, sH, r * .6), { wash: bg, ink: null });
  if (scr === 'off') inkLine([[sx + sW * .15, sy + sH * .35], [sx + sW * .55, sy + sH * .12]], sw * .5, '#4A4658', 'inkfine', 0);   // glass glint
  const pic = (cy, k = 1) => {   // whose photo: a mini character on a soft blob
    paint(ellPts(0, cy - sW * .12, sW * .38 * k, sW * .34 * k, 18), { fill: o.who === 'tao' ? '#F4A3B6' : '#F2A283', fillOp: 90, bleed: .2, ink: null });
    const u = sW * .042 * k;
    if (o.who === 'tao') tao(0, cy + 2 * u, u, { ...tfeel('happy', t), noShadow: true, boilKey: 'phonepic' + (o.key ?? '') });
    else clawd(0, cy + 2 * u, u, { ...feel('cool', t), emote: null, noShadow: true, boilKey: 'phonepic' + (o.key ?? '') });
  };
  if (scr === 'photo') pic(sy + sH * .5, 1.2);
  if (scr === 'call' || scr === 'dial') {
    const ring = o.ring || 0;
    if (ring > .01) for (const k of [0, .5]) { const q = frac(ring + k); inkLine(ellPts(0, sy + sH * .3, sW * (.32 + .25 * q), sW * (.32 + .25 * q), 20), sw * .6 * (1 - q), '#BFE0FF', 'inkfine', .5); }
    pic(sy + sH * .36, 1);
    const by = sy + sH * .82, br = sW * .14;
    const btn = (bx, col, down) => { paint(ellPts(bx, by, br, br, 16), { wash: col, ink: PAL.ink, sw: sw * .6 }); handset(bx, by, br * .55, down, sw); };
    if (scr === 'call') { btn(-sW * .25, '#E0453F', true); btn(sW * .25, '#3DB86A', false); }
    else {
      btn(0, '#E0453F', true);
      for (let i = 0; i < 3; i++) paint(ellPts((i - 1) * sW * .09, sy + sH * .64, sW * .025, sW * .025, 8), { wash: '#DDE6F6', washOp: 255 * (.3 + .7 * (Math.floor(t * 3) % 3 === i)), ink: null });
    }
  }
  if (scr === 'msgs') {
    const n = o.n ?? 3, full = Math.floor(n), pk = frac(n), ICON = ['moon', 'bowl', 'heart', 'ask'];
    const bh = sH * .14, show = Math.min(6, full + (pk > 0 ? 1 : 0));
    for (let i = 0; i < show; i++) {
      const idx = full + (pk > 0 ? 1 : 0) - show + i, k = i === show - 1 && pk > 0 ? backOut(pk * 2.5) : 1;
      const by = sy + sH - (show - i) * bh * 1.12 - sH * .04, bw = sW * (.5 + .14 * hash(idx * 3.1));
      push(); translate(sx + sW * .08, by + bh / 2); scale(k); translate(-(sx + sW * .08), -(by + bh / 2));
      paint(rrPts(sx + sW * .08, by, bw, bh, bh * .45), { wash: '#F4A3B6', ink: PAL.ink, sw: sw * .4 });
      msgIcon(ICON[((idx % 4) + 4) % 4], sx + sW * .08 + bh * .62, by + bh / 2, bh * .3, sw);
      for (let j = 0; j < 2; j++) inkLine([[sx + sW * .08 + bh * 1.1, by + bh * (.38 + j * .26)], [sx + sW * .08 + bw - bh * .4 - j * bw * .2, by + bh * (.38 + j * .26)]], sw * .35, '#B25C78', 'inkfine', 0);
      pop();
    }
  }
  if (scr === 'ended') {
    const cy = sy + sH * .42, br = sW * .2;
    paint(ellPts(0, cy, br, br, 18), { wash: '#C9393A', ink: PAL.ink, sw: sw * .6 });
    handset(0, cy, br * .55, true, sw);
  }
  pop();
  if (scr === 'ended' && o.text) letter('通话已结束', x, y + h * .12, h * .075, o.textCol || '#D8D2E4', { font: `${h * .075}px "ZCOOL KuaiLe"`, ink: false, alpha: o.textAlpha ?? 1 });
}
// A telephone handset glyph (for the call buttons): a curved grip with an ear-piece and a mouth-piece. down = hung up.
function handset(x, y, r, down, sw) {
  push(); translate(x, y); rotate(down ? 2.36 : -.2);
  const C = []; for (let i = 0; i <= 8; i++) { const a = -1.15 + i / 8 * 2.3; C.push([Math.sin(a) * r, -Math.cos(a) * r * .55 + r * .35]); }
  paint(ribbon(C, r * .36, r * .36), { wash: '#FFFFFF', ink: null });
  for (const s of [-1, 1]) paint(ellPts(s * r * .95, r * .05, r * .32, r * .2, 10, 0, s * .6), { wash: '#FFFFFF', ink: null });
  pop();
}
// The little pictures in her messages: a moon (good night), a rice bowl (have you eaten?), a heart, a question mark.
function msgIcon(kind, x, y, r, sw) {
  const ink = '#7A2A48';
  if (kind === 'moon') { paint(ellPts(x, y, r, r, 14), { wash: '#FFE08A', ink: null }); paint(ellPts(x + r * .45, y - r * .3, r * .8, r * .8, 14), { wash: '#F4A3B6', ink: null }); }
  else if (kind === 'bowl') {
    paint([[x - r, y - r * .1], [x + r, y - r * .1], [x + r * .6, y + r * .8], [x - r * .6, y + r * .8]], { wash: '#FFFFFF', ink: ink, sw: sw * .3, curv: .4 });
    paint(ellPts(x, y - r * .15, r * .85, r * .4, 12), { wash: '#FFF8EC', ink: null });
    inkLine([[x + r * .1, y - r * .4], [x + r * 1.1, y - r * 1.3]], sw * .4, ink, 'inkfine', 0);
    inkLine([[x + r * .4, y - r * .4], [x + r * 1.3, y - r * 1.1]], sw * .4, ink, 'inkfine', 0);
  } else if (kind === 'heart') paint(heartPts(x, y, r), { wash: '#E2476E', ink: null });
  else { inkLine([[x - r * .45, y - r * .45], [x - r * .1, y - r * .85], [x + r * .45, y - r * .55], [x + r * .1, y - r * .05], [x, y + r * .3]], sw * .55, ink, 'ink', .5); paint(ellPts(x, y + r * .75, r * .14, r * .14, 8), { wash: ink, ink: null }); }
}

// ---------- make-up ----------
// eyelinerPen(x, y, len, o): a slim black pen, tip to the right before o.rot. o.cap: the cap is on.
function eyelinerPen(x, y, len, o = {}) {
  const d = len * .09, sw = clamp(len / 90, .5, 1.6);
  push(); translate(x, y); if (o.rot) rotate(o.rot); boilSeed('pen' + (o.key ?? ''));
  paint(rrPts(-len / 2, -d / 2, len * .78, d, d * .3), { wash: '#1E1A24', ink: PAL.ink, sw });
  paint(rectPts(len * .2, -d / 2, len * .06, d), { wash: '#C9C3D6', ink: null });                 // silver band
  inkLine([[-len * .4, -d * .22], [len * .15, -d * .22]], sw * .4, '#5A5268', 'inkfine', 0);        // sheen
  if (o.cap) paint(rrPts(len * .28 - len * .02, -d * .55, len * .24, d * 1.1, d * .3), { wash: '#2A2432', ink: PAL.ink, sw });
  else paint([[len * .28, -d * .42], [len * .28, d * .42], [len * .48, 0]], { wash: LINER, ink: PAL.ink, sw: sw * .7 });
  pop();
}

// ---------- drinks ----------
// cocktail(x, y, s, o): a martini glass standing on (x, y), the bowl about 2s wide. Magenta drink, a straw (o.stir
// swings it), a lipstick print on the rim when o.lip.
function cocktail(x, y, s, o = {}) {
  const sw = clamp(s / 30, .5, 1.6);
  push(); translate(x, y); if (o.rot) rotate(o.rot); boilSeed('cocktail' + (o.key ?? ''));
  const top = -3.2 * s;
  inkLine([[-s * .45, 0], [s * .45, 0]], sw * 1.2, '#D8E6F2', 'ink', 0);
  inkLine([[0, 0], [0, -1.5 * s]], sw * .9, '#D8E6F2', 'ink', 0);
  push(); translate(0, top + .35 * s); rotate(-.35 + .25 * (o.stir || 0));
  paint(rectPts(-.05 * s, -1.6 * s, .1 * s, 1.9 * s), { wash: '#F2F2F2', fill: '#E0453F', fillOp: 120, ink: PAL.ink, sw: sw * .4 }); pop();
  paint([[-1.05 * s, top + .3 * s], [1.05 * s, top + .3 * s], [0, -1.5 * s]], { wash: '#D2387E', fill: '#FF77B0', fillOp: 90, ink: null });
  paint([[-1.25 * s, top], [1.25 * s, top], [0, -1.5 * s]], { wash: '#CFE3F2', washOp: 70, ink: '#E6F0FA', sw: sw * .8 });
  paint(ellPts(.5 * s, top + .55 * s, .14 * s, .14 * s, 10), { wash: '#E0283F', ink: PAL.ink, sw: sw * .3 });   // cherry
  if (o.lip) paint(ellPts(-.85 * s, top + .08 * s, .26 * s, .12 * s, 10, 0, -.2), { wash: LIP2, washOp: 200, ink: null });
  pop();
}
// rocksGlass(x, y, s, o): Clawd's whisky tumbler standing on (x, y), 2s wide. o.clink 0..1 knocks the ice about;
// o.crack 0..1 runs a crack up the glass.
function rocksGlass(x, y, s, o = {}) {
  const sw = clamp(s / 30, .5, 1.6), c = o.clink || 0;
  push(); translate(x, y); if (o.rot) rotate(o.rot); boilSeed('rocks' + (o.key ?? ''));
  paint(rectPts(-s, -1.4 * s, 2 * s, 1.4 * s), { wash: '#C9822E', fill: '#E8A548', fillOp: 90, ink: null });
  for (let i = 0; i < 3; i++) {
    const ix = (-.55 + i * .55) * s + Math.sin(i * 2 + c * 9) * .08 * s * c, iy = (-1.75 + .2 * (i % 2)) * s - .15 * s * c * (i === 1);
    push(); translate(ix, iy); rotate(.2 * (i - 1) + .3 * c * Math.sin(i * 5));
    paint(rectPts(-.32 * s, -.32 * s, .64 * s, .64 * s, .03 * s), { wash: '#E8F4FF', washOp: 200, ink: '#9FC4E0', sw: sw * .4 }); pop();
  }
  paint(rectPts(-1.05 * s, -2.4 * s, 2.1 * s, 2.4 * s), { wash: '#D8EAF8', washOp: 50, ink: '#E6F0FA', sw: sw * .9 });
  paint(rectPts(-1.05 * s, -.3 * s, 2.1 * s, .3 * s), { wash: '#D8EAF8', washOp: 120, ink: null });
  const k = clamp(o.crack || 0);
  if (k > .01) inkLine([[.3 * s, -.1 * s], [.1 * s, -.7 * s], [.45 * s, -1.1 * s], [.2 * s, -1.6 * s], [.5 * s, -2.3 * s]].slice(0, 1 + Math.ceil(k * 4)), sw * .6, '#FFFFFF', 'inkfine', 0);
  pop();
}

// ---------- neon ----------
// neonHeart(x, y, r, o): a pink neon tube heart, about 2r wide. o.on 0..1 is the brightness (flicker it with the
// claps); o.half 0..1 kills the right half (the tube goes grey and dark).
function neonHeart(x, y, r, o = {}) {
  const on = clamp(o.on ?? 1), dead = clamp(o.half || 0), col = o.col || '#FF5FA8', P = heartPts(x, y, r, 40);
  boilSeed('neonheart' + (o.key ?? ''));
  const halves = [P.slice(0, 21), P.slice(20).concat([P[0]])];   // right half (top cusp → tip), left half (tip → cusp)
  halves.forEach((H, i) => {
    const k = i === 0 ? on * (1 - dead) : on, tube = mixCol('#4A3A50', col, .25 + .75 * k);
    if (k > .02) for (let j = 0; j < H.length; j += 4) glow(H[j][0], H[j][1], r * .9, col, k * .55);
    paint(ribbon(H, r * .13, r * .13), { wash: tube, ink: null });
    if (k > .02) paint(ribbon(H, r * .045, r * .045), { wash: mixCol(tube, '#FFFFFF', .7 * k), ink: null });
  });
}

// ---------- the billboard ----------
// billboard(x, y, w, o): centred at (x, y), w wide (16:10). The girl he fancies: a violet crab with the cat-eye wing, red
// lips and the small black bow, looking down at the street. o.lit 0..1; the bulbs round the frame chase on the beat.
const BBC = { col: '#8E5BC8', dk: '#5E3A92', lt: '#C29AEE' };
const BB_POSE = { eyes: 'catBN', mouth: 'lip2smirk', hat: 'blackbow', view: 'q', lookX: -.6, lookY: .5, rot: -.05, aR: 1.4 };
// where the poster girl stands, for a billboard at (x, y) w wide: [feet x, feet y, u]
const bbGirlAt = (x, y, w) => [x + w * .05, y + w * .62 * .52, w * .042];
function billboard(x, y, w, o = {}) {
  const h = w * .62, lit = clamp(o.lit ?? 1), t = o.t ?? T, sw = clamp(w / 300, .6, 2.2);
  boilSeed('billboard' + (o.key ?? ''));
  if (o.legs !== false) for (const s of [-1, 1]) paint(rectPts(x + s * w * .3 - w * .015, y + h / 2, w * .03, h * .9), { wash: '#2A2634', ink: PAL.ink, sw });   // legs
  if (lit > .02) glow(x, y, w * .75, '#FF6FC0', lit * .6);
  paint(rectPts(x - w / 2 - w * .03, y - h / 2 - w * .03, w * 1.06, h + w * .06), { wash: '#2A2634', ink: PAL.ink, sw });
  paint(rectPts(x - w / 2, y - h / 2, w, h), { wash: mixCol('#3A1E4E', '#C23A8E', .2 + .6 * lit), ink: null });
  paint(ellPts(x + w * .1, y - h * .05, w * .36, h * .42, 24), { fill: mixCol('#5A2A6E', '#FF8AC8', lit), fillOp: 130, bleed: .3, ink: null });
  const u = w * .042;
  // the girl on the poster; o.girl === 'tao' puts 小桃 in her place, in exactly her pose (the match cut in S15)
  clawd(x + w * .05, y + h * .52, u, { ...(o.girl === 'tao' ? TAOC : BBC), ...BB_POSE, noShadow: true, boilKey: 'bbgirl' + (o.key ?? '') });
  if (lit < .98) paint(rectPts(x - w / 2, y - h / 2, w, h), { wash: '#100C18', washOp: 200 * (1 - lit), ink: null });
  const n = 26, step = Math.floor(bpOf(t) * 2);
  for (let i = 0; i < n; i++) {   // bulbs round the frame, every third one bright, chasing twice a beat
    const q = i / n, per = 2 * (w + h), d = q * per;
    const bx = d < w ? x - w / 2 + d : d < w + h ? x + w / 2 : d < 2 * w + h ? x + w / 2 - (d - w - h) : x - w / 2;
    const by = d < w ? y - h / 2 : d < w + h ? y - h / 2 + (d - w) : d < 2 * w + h ? y + h / 2 : y + h / 2 - (d - 2 * w - h);
    const on = lit * ((i + step) % 3 === 0 ? 1 : .25);
    paint(ellPts(bx, by, w * .012, w * .012, 8), { wash: mixCol('#5A4A3A', '#FFE7A0', on), ink: null });
    if (on > .5) glow(bx, by, w * .04, '#FFD98A', on * .8);
  }
}
