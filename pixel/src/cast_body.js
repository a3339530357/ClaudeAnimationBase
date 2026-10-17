// cast_body.js: the two leads as pixel puppets. person(x, y, P, o) draws one at feet (x, y) (x = centre, y = ground).
//
//   P = HER or HIM (spec below). o:
//     view   'front' | 'side' | 'back'          dir  1 = facing right, -1 = left (side / back)
//     pose   'stand' | 'walk' | 'sit' | 'piano'  ph   walk phase (cycles per 1.0)      seat  seat height (sit / piano)
//     outfit 'spring' | 'summer' | 'winter'      scarf true = the blue scarf (HIM winter has it by default)
//     arms   { near: [a1, a2], far: [a1, a2] } (side) or { l: [...], r: [...] } (front): degrees, 0 = hanging down,
//            90 = straight forward / out, a2 = forearm bend added to a1
//     ex     expression for the head (see cast_head.js), blink, talk, tear, blush, look ([dx, dy] eye shift)
//     hold   (hx, hy, side) => draws a prop in the near hand (after the body); holdFar for the far hand
//     alpha  see-through (ghosts), ol (outline colour), bob (extra y offset of the upper body)
// Returns the anchor points { head: [x, y], hand: [x, y], handFar: [x, y], top } in buffer px (after OX/OY).

const HER = {
  name: 'her', h: 54, headR: 7, sh: 38, waist: 24, hem: 15, legW: 2, upper: 8, fore: 7, thigh: 10,
  skin: [C.S0, C.S1, C.S2], hair: [C.R1, C.R2, C.R3, C.R4],
  outfits: {
    spring: { top: [C.M1, C.M2, C.M3], inner: C.WH, sleeve: [C.M1, C.M2], skirt: [C.N1, C.N2], legs: C.S1, shoe: C.B1, len: 'knee' },
    summer: { top: [C.WH, C.W2, C.W3], inner: C.WH, sleeve: [C.S1, C.S2], skirt: [C.N1, C.N2], legs: C.S1, shoe: C.B1, len: 'knee', short: true },
    winter: { top: [C.M1, C.M2, C.M3], inner: C.M1, sleeve: [C.M1, C.M2], skirt: [C.N1, C.N2], legs: C.N2, shoe: C.B1, len: 'coat', toggles: true },
  },
};
const HIM = {
  name: 'him', h: 60, headR: 7, sh: 44, waist: 26, hem: 19, legW: 3, upper: 9, fore: 8, thigh: 11,
  skin: [C.S0, C.S1, C.S2], hair: [C.H1, C.H2, C.H3, C.H3],
  outfits: {
    spring: { top: [C.U1, C.U2, C.U3], inner: C.WH, sleeve: [C.U1, C.U2], skirt: null, legs: C.Q1, legs2: C.Q2, shoe: C.B2, len: 'pants' },
    summer: { top: [C.WH, C.W2, C.W3], inner: C.WH, sleeve: [C.S1, C.S2], skirt: null, legs: C.Q1, legs2: C.Q2, shoe: C.B2, len: 'pants', short: true, over: [C.U1, C.U2] },
    winter: { top: [C.V1, C.V2, C.BK], inner: C.WH, sleeve: [C.V1, C.V2], skirt: null, legs: C.G2, legs2: C.G1, shoe: C.B2, len: 'coatLong', scarf: true },
  },
};
const rad = d => d * Math.PI / 180;

// one arm from shoulder (sx, sy): returns the hand position. fwd = +1 / -1 (screen direction of "forward")
function limbArm(sx, sy, a1, a2, up, fo, w, cols, fwd, skin, shortSleeve) {
  const ex = sx + Math.sin(rad(a1)) * up * fwd, ey = sy + Math.cos(rad(a1)) * up;
  const hx = ex + Math.sin(rad(a1 + a2)) * fo * fwd, hy = ey + Math.cos(rad(a1 + a2)) * fo;
  tline(sx, sy, ex, ey, w, cols[0]);
  if (shortSleeve) { tline(sx, sy, lerp(sx, ex, .45), lerp(sy, ey, .45), w, cols[2] ?? cols[0]); }
  tline(ex, ey, hx, hy, w, shortSleeve ? skin : cols[0]);
  // cuff shade on the lower edge of the forearm
  if (!shortSleeve) pset(Math.round(lerp(ex, hx, .7)), Math.round(lerp(ey, hy, .7)) + 1, cols[1]);
  rect(Math.round(hx) - 1, Math.round(hy) - 1, 2, 2, skin);
  return [Math.round(hx), Math.round(hy)];
}

function person(x, y, P, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const view = o.view || 'front', dir = o.dir || 1, pose = o.pose || 'stand';
  const F = { ...P.outfits[o.outfit || 'spring'] }, scarf = o.scarf ?? F.scarf;
  const ph = o.ph || 0, walking = pose === 'walk';
  const sitting = pose === 'sit' || pose === 'piano', seat = o.seat ?? (P === HER ? 13 : 15);
  let bob = (o.bob || 0) + (walking ? -Math.round(Math.abs(Math.sin(ph * TAU)) * 1) : 0);
  // seated: the hips sit on the seat, the body drops by (waist - seat)
  const drop = sitting ? P.waist - seat - 2 : 0;
  const yb = y + drop + bob;                                   // y of the "ground" for the upper body
  const shY = yb - P.sh, waistY = yb - P.waist, hemY = yb - P.hem;
  const out = { top: shY - 16 };
  const pn = o.play == null ? 0 : Math.sin(o.play * TAU) * 6;          // piano: hands rock with o.play (phase)
  const ARM = o.arms || (pose === 'piano' ? { near: [58 + pn, 34], far: [60 - pn, 32] } : {});
  const skin = P.skin[1], fwd = view === 'side' ? dir : 1;
  begin();
  // ---------- legs ----------
  const legC = F.legs, legC2 = F.legs2 ?? F.legs;
  if (sitting && view === 'side') {
    const hx = x, hy = y - seat, kx = hx + P.thigh * dir, ky = hy;
    tline(hx, hy - 1, kx, ky - 1, P.legW + 1, legC2);
    tline(kx, ky, kx + dir * 1, y - 2, P.legW, legC2);                 // far shin (hidden mostly)
    tline(hx, hy, kx + dir, ky, P.legW + 1, legC);
    tline(kx + dir, ky, kx + dir * 2, y - 2, P.legW, legC);
    rect(kx + dir * 2 - (dir < 0 ? 3 : 0), y - 2, 4, 2, F.shoe);
    if (F.len === 'knee' || F.len === 'coat') { poly([[hx - 3 * dir, hy - 4], [kx + dir * 2, ky - 2], [kx + dir * 2, ky + 3], [hx - 4 * dir, hy + 2]], F.len === 'coat' ? F.top[1] : F.skirt[0]); }
  } else if (sitting) {                                              // front view seated: knees toward us
    for (const s of [-1, 1]) { rect(x + s * 3 - (s < 0 ? P.legW : 0), y - seat, P.legW + 1, seat - 2, legC); rect(x + s * 3 - (s < 0 ? 3 : 0), y - 2, 4, 2, F.shoe); }
  } else if (view === 'side') {
    const hipX = x, hipY = waistY + 3, L = y - hipY;
    const sw = walking ? Math.sin(ph * TAU) * 24 : 5;
    for (const [s, c] of [[-1, legC2], [1, legC]]) {                 // back leg first
      const a = rad(sw * s), fx = hipX + Math.sin(a) * L * dir, fy = hipY + Math.cos(a) * L;
      const lift = walking && Math.sin(ph * TAU) * s < -.3 ? 1 : 0;
      tline(hipX, hipY, fx, fy - lift, P.legW, c);
      rect(Math.round(fx) - (dir < 0 ? 3 : 0), Math.round(fy) - 2 - lift, 4, 2, F.shoe);
    }
  } else {
    const lift = walking ? Math.round(Math.sin(ph * TAU) * 1.5) : 0;
    for (const s of [-1, 1]) {
      const lx = x + (s < 0 ? -2 - P.legW : 1), l = s * lift > 0 ? Math.abs(lift) : 0, top = F.len === 'pants' ? waistY + 1 : hemY;
      rect(lx, top, P.legW, y - top - 2 - l, legC);
      rect(lx - (s < 0 ? 1 : 0), y - 2 - l, P.legW + 1, 2, F.shoe);
    }
  }
  // ---------- far arm (behind the body) ----------
  const shoulder = view === 'side' ? [x - dir, shY + 2] : null;
  const farCols = [F.sleeve[1], F.sleeve[1], F.sleeve[1]];
  if (view === 'side') {
    const [a1, a2] = ARM.far || (walking ? [-Math.sin(ph * TAU) * 22, 10] : [6, 6]);
    out.handFar = limbArm(shoulder[0] - dir * 2, shoulder[1], a1, a2, P.upper, P.fore, 3, farCols, dir, P.skin[2], F.short);
  }
  // ---------- torso ----------
  const tw = view === 'side' ? 9 : 13, half = Math.floor(tw / 2);
  const topC = F.top;
  if (view === 'side') {
    const lean = sitting ? 0 : 0, bx = x - Math.floor(tw / 2) + lean;
    // body: shoulders to waist, plus coat skirt or skirt
    rect(bx, shY, tw, waistY - shY + 1, topC[0]);
    rect(dir > 0 ? bx : bx + tw - 2, shY + 1, 2, waistY - shY, topC[1]);            // back shade
    if (!sitting) {
      if (F.len === 'coat' || F.len === 'coatLong') { const hm = F.len === 'coat' ? hemY : yb - 17; poly([[bx, waistY], [bx + tw, waistY], [bx + tw + 2, hm], [bx - 2, hm]], topC[0]); hline(bx - 2, bx + tw + 2, hm, topC[1]); }
      if (F.skirt && F.len !== 'coat') poly([[bx, waistY], [bx + tw, waistY], [bx + tw + 3, hemY], [bx - 3, hemY]], F.skirt[0]);
      if (F.skirt && F.len === 'coat') rect(bx - 1, hemY + 1, tw + 2, 2, F.skirt[0]);
      if (!F.skirt && F.len === 'pants') rect(bx + 1, waistY, tw - 2, 3, F.legs);
    } else if (F.len === 'coat' || F.len === 'coatLong') rect(bx - 1, waistY - 1, tw + 3, 4, topC[0]);
    // collar / inner
    rect(x + dir * 2 - (dir < 0 ? 1 : 0), shY, 2, 2, F.inner);
    if (F.toggles) { pset(x + dir * 3, shY + 6, C.B1); pset(x + dir * 3, shY + 10, C.B1); }
  } else {
    const back = view === 'back';
    rect(x - half, shY, tw, waistY - shY + 1, topC[0]);
    rect(x - half, shY + 1, 2, waistY - shY, topC[1]); rect(x + half - 1, shY + 1, 2, waistY - shY, topC[1]);
    if (!back) {
      if (F.len === 'knee' && P === HER) { rect(x - 1, shY, 3, waistY - shY - 2, F.inner); pset(x, shY + 3, C.W2); }   // blouse under open cardigan
      else if (P === HIM && !F.short && !scarf) { rect(x - 2, shY, 5, 2, F.inner); }
      if (F.toggles) for (const yy of [shY + 5, shY + 9, shY + 13]) { pset(x - 2, yy, C.B1); pset(x + 2, yy, C.B1); }
      if (F.over) { rect(x - half, shY, 3, waistY - shY + 1, F.over[0]); rect(x + half - 2, shY, 3, waistY - shY + 1, F.over[0]); }
    }
    if (!sitting) {
      if (F.len === 'coat' || F.len === 'coatLong') { const hm = F.len === 'coat' ? hemY : yb - 17; poly([[x - half, waistY], [x + half + 1, waistY], [x + half + 3, hm], [x - half - 2, hm]], topC[0]); if (!back) vline(x, waistY, hm - 1, topC[1]); hline(x - half - 2, x + half + 3, hm, topC[1]); }
      if (F.skirt && F.len !== 'coat') poly([[x - half, waistY], [x + half + 1, waistY], [x + half + 4, hemY], [x - half - 3, hemY]], F.skirt[0]);
      if (F.skirt && F.len !== 'coat') hline(x - half - 3, x + half + 4, hemY - 1, F.skirt[1]);
      if (F.skirt && F.len === 'coat') rect(x - half - 1, hemY + 1, tw + 3, 2, F.skirt[0]);
    } else rect(x - half - 1, waistY - 1, tw + 2, 4, F.len === 'coat' || F.len === 'coatLong' ? topC[0] : (F.skirt ? F.skirt[0] : F.legs));
  }
  // ---------- scarf ----------
  if (scarf) {
    const sc = [C.U2, C.U1, C.U3], wind = o.wind || 0, ny = shY - 1;
    rect(x - (view === 'side' ? 4 : 6), ny, view === 'side' ? 9 : 13, 3, sc[0]);
    hline(x - (view === 'side' ? 4 : 6), x + (view === 'side' ? 4 : 6), ny, sc[1]);
    const tx = view === 'side' ? x - dir * 3 : x + 3, len = P === HIM ? 15 : 11;
    for (let i = 0; i < len; i++) {
      const sway = Math.round(Math.sin(T * 6 + i * .5) * wind * i / len * 3) - (view === 'side' ? dir * Math.round(wind * i * .6) : 0);
      rect(tx + sway, ny + 2 + i, 3, 1, i % 4 === 3 ? sc[2] : sc[0]);
    }
    for (let k = 0; k < 3; k += 2) pset(tx + k + Math.round(Math.sin(T * 6 + len * .5) * wind * 3) - (view === 'side' ? dir * Math.round(wind * len * .6) : 0), ny + 2 + len, sc[1]);
  }
  // ---------- head ----------
  const hx = view === 'side' ? x + dir : x, hy = shY - P.headR - 1;
  out.head = [hx + OX, hy + OY];
  head(hx, hy, P, { ...o, view, dir });
  // ---------- near arm(s) ----------
  if (view === 'side') {
    const [a1, a2] = ARM.near || (walking ? [Math.sin(ph * TAU) * 22, 10] : [4, 6]);
    out.hand = limbArm(shoulder[0] + dir, shoulder[1], a1, a2, P.upper, P.fore, 3, [F.sleeve[0], F.sleeve[1], F.sleeve[0]], dir, skin, F.short);
  } else {
    const L = ARM.l || (walking ? [Math.sin(ph * TAU) * 8, 0] : [8, 0]), R = ARM.r || (walking ? [-Math.sin(ph * TAU) * 8, 0] : [8, 0]);
    out.handL = limbArm(x - half - 1, shY + 2, L[0], L[1], P.upper, P.fore, 3, [F.sleeve[0], F.sleeve[1], F.sleeve[0]], -1, skin, F.short);
    out.handR = limbArm(x + half, shY + 2, R[0], R[1], P.upper, P.fore, 3, [F.sleeve[0], F.sleeve[1], F.sleeve[0]], 1, skin, F.short);
    out.hand = out.handR; out.handFar = out.handL;
  }
  end(o.ol === undefined ? C.OL : o.ol, o.alpha ?? 1);
  // props in hands go on top, with their own outline
  if (o.hold && out.hand) o.hold(out.hand[0], out.hand[1], 'near');
  if (o.holdFar && out.handFar) o.holdFar(out.handFar[0], out.handFar[1], 'far');
  if (out.hand) out.hand = [out.hand[0] + OX, out.hand[1] + OY];
  if (out.handFar) out.handFar = [out.handFar[0] + OX, out.handFar[1] + OY];
  if (out.handL) out.handL = [out.handL[0] + OX, out.handL[1] + OY];
  return out;
}
// convenience
const her = (x, y, o = {}) => person(x, y, HER, o);
const him = (x, y, o = {}) => person(x, y, HIM, o);
// blink: true for ~0.12 s every few seconds, different per character
const blinkAt = (t, seed = 0) => { const p = 2.6 + hash(seed, 9) * 1.6, k = ((t + seed * .37) % p); return k < .12; };
