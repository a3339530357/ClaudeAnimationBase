// hair2.js: 阿飞 (before / after), the rink queen, the stranger.
const FEI_TONE = .16, FEIO = { fill: WHITE, tone: FEI_TONE, strand: true, lw: 1.6 };

// ---------- 阿飞, before: dyed light hair, messy and layered, a long fringe swept over his right eye, a wolf-tail
// nape (非主流, 2009); earring on his left ear ----------
const HAIR_FEI = {
  back(v, side, E) {
    if (side) {
      hairFill([[22, -44], [8, -58], [-16, -60], [-38, -48], [-48, -24], [-46, 4], [-36, 18], [-20, 8], [-12, -10], [4, -22]], { fill: WHITE, tone: FEI_TONE });
      locks([[[[-36, 0], [-42, 24], [-40, 50]], 16, {}], [[[-26, 4], [-28, 30], [-24, 52]], 13, {}], [[[-20, -52], [-36, -66], [-50, -70]], 14, {}], [[[-2, -58], [-10, -72], [-20, -78]], 13, {}], [[[-40, -34], [-56, -40], [-64, -36]], 13, {}]], 0, FEIO);
      return;
    }
    locks([[[[-32, 14], [-36, 32], [-35, 46]], 12, {}], [[[32, 14], [36, 30], [35, 42]], 11, {}], [[[-20, 22], [-22, 40], [-19, 52]], 10, {}]], v, FEIO);
    hairFill(warp([[-44, 4], [-46, -26], [-34, -52], [-8, -63], [20, -60], [40, -44], [46, -16], [44, 4], [30, 20], [-30, 22]], v), { fill: WHITE, tone: FEI_TONE });
    // the top: soft layered clumps falling outward over the crown, tips flicking out above the ears
    locks([[[[-4, -62], [-24, -66], [-40, -58], [-52, -42]], 17, {}], [[[-2, -57], [-20, -58], [-36, -50], [-44, -38]], 13, {}],
      [[[6, -63], [26, -64], [42, -54], [52, -38]], 17, {}], [[[8, -57], [26, -56], [40, -46], [46, -34]], 13, {}], [[[0, -60], [4, -70], [12, -74]], 10, {}]], v, FEIO);
  },
  front(v, side, E) {
    if (side) {
      locks([[[[4, -56], [20, -40], [32, -22], [38, 2]], 16, {}], [[[-8, -54], [10, -40], [22, -24], [24, -4]], 14, {}], [[[14, -50], [30, -36], [36, -24]], 10, {}]], 0, FEIO);
      return;
    }
    // side locks: the right side (viewer's left) covers the ear, the left stops above the earring
    const L = [[[[-40, -24], [-46, 0], [-44, 20], [-41, 30]], 11, {}], [[[-34, -12], [-38, 10], [-36, 26]], 9, {}]];
    if (v <= .55) L.push([[[40, -30], [46, -14], [45, -2]], 11, {}]);
    // the fringe: long clumps swept down to the left across the right eye, shorter ones on the other side
    L.push([[[6, -56], [-14, -40], [-34, -14], [-42, 6]], 15, {}], [[[22, -52], [0, -32], [-20, -6], [-32, 20 + sway(E, 1)]], 16, {}],
      [[[30, -46], [10, -26], [-8, 0], [-18, 24 + sway(E, 1.2, 1)]], 15, {}], [[[38, -38], [22, -22], [8, -4], [2, 12]], 12, {}],
      [[[42, -28], [32, -16], [26, -9]], 9, {}], [[[12, -58], [26, -46], [38, -30]], 13, {}]);
    locks(L, v, FEIO);
  },
};
// ---------- 阿飞, after: cut short and neat, the forehead and both eyes showing ----------
const HAIR_FEI_NEW = {
  back(v, side, E) {
    if (side) { hairFill([[22, -46], [6, -60], [-18, -62], [-38, -50], [-46, -26], [-44, -2], [-34, 8], [-20, 0], [-10, -16], [6, -28]], { fill: WHITE, tone: FEI_TONE }); return; }
    hairFill(warp([[-43, -2], [-47, -28], [-36, -55], [-8, -66], [20, -63], [41, -48], [47, -22], [43, -2], [30, 6], [-30, 6]], v), { fill: WHITE, tone: FEI_TONE });
    locks([[[[-30, -52], [-44, -54], [-52, -44]], 12, {}], [[[30, -52], [44, -52], [52, -40]], 12, {}], [[[-8, -64], [-14, -72], [-24, -74]], 11, {}], [[[10, -64], [18, -72], [28, -72]], 11, {}]], v, FEIO);
  },
  front(v, side, E) {
    if (side) { locks([[[[-6, -62], [12, -58], [26, -46], [33, -30]], 15, {}], [[[-12, -58], [4, -50], [18, -36], [22, -24]], 12, {}]], 0, FEIO); return; }
    // the same light hair, cut short: a side part, the top swept across, a few strands on the forehead; both eyes clear
    const L = [[[[-12, -62], [-26, -56], [-38, -42], [-43, -24]], 16, {}], [[[-14, -55], [-24, -45], [-28, -32], [-27, -20]], 12, {}],
      [[[-10, -64], [8, -63], [26, -55], [39, -38], [43, -24]], 18, {}], [[[-8, -59], [10, -54], [22, -42], [26, -26]], 15, {}],
      [[[-10, -54], [0, -46], [7, -34], [8, -18]], 11, {}], [[[4, -52], [14, -42], [18, -30], [17, -21]], 9, {}],
      [[[-40, -32], [-46, -16], [-45, -2]], 10, {}]];
    if (v <= .55) L.push([[[40, -36], [46, -20], [44, -6]], 10, {}]);
    locks(L, v, FEIO);
  },
};

// ---------- the rink queen: black bob, heavy side-swept bangs, big hoops; smoky eyes and dark lips are in her ex0 ----------
const HAIR_QUEEN = {
  back(v, side, E) {
    if (side) { hairFill([[22, -40], [2, -56], [-30, -48], [-46, -20], [-46, 20], [-40, 42], [-54, 50], [-30, 52], [-12, 44], [-10, 14], [-6, -12], [10, -26]]); sheen(-12, -24, 24, 26, -2.7, -1.3, 7, 7, 1.8); return; }
    hairFill(warp([[0, -58], [30, -52], [44, -30], [47, 0], [47, 30], [54, 47], [36, 46], [24, 40], [-24, 40], [-36, 46], [-54, 47], [-47, 30], [-47, 0], [-44, -30], [-30, -52]], v));
  },
  front(v, side, E) {
    if (side) { locks([[[[0, -54], [22, -40], [32, -22], [34, -6]], 16, {}]], 0, { shine: true }); return; }
    hairFill(warp(capArc(43, 52, -8).concat([[40, -14], [30, -24]]), v));
    // side-swept bangs: clumps from her left temple across to her right cheek
    locks([[[[40, -36], [18, -26], [-6, -14], [-28, 2]], 18, {}], [[[30, -48], [6, -32], [-18, -12], [-36, 10]], 18, {}], [[[38, -24], [20, -16], [4, -12]], 10, {}]], v, { shine: true });
    sheen(4, -28, 30, 20, -2.6, -.5, 9, 7, 1.8, v);
    for (const sd of [-1, 1]) {
      if (sd > 0 && v > .6) continue;
      lock(warp([[sd * 40, -12], [sd * 44, 16], [sd * 46, 36], [sd * 53, 48]], v), 14, { shine: true });
    }
  },
};
function hoops(v, side, E) {
  X.lineWidth = lw(1.7); X.strokeStyle = INK;
  if (side) { X.beginPath(); X.arc(-4, 26, 9, 0, TAU); X.stroke(); return; }
  for (const sd of [-1, 1]) { if (sd > 0 && v > .55) continue; X.beginPath(); X.arc(wx(sd * 38, v), 27, 9 * (sd > 0 ? 1 - .4 * v : 1), 0, TAU); X.stroke(); }
}
function gum(v, side, E) {
  if (!(E.gum > 0)) return;
  const r = 4 + 13 * E.gum, x = side ? 36 + r * .8 : wx(0, v), y = side ? 31 : 37 + r * .6;
  shape(ellPts(x, y, r, r * .95, 18), { fill: WHITE, lw: lw(1.4), j: .2 });
  X.fillStyle = INK; X.fill(pathOf(ellPts(x - r * .35, y - r * .35, r * .16, r * .1, 8)));
}

// ---------- the stranger: a buzz cut (his face is almost always cut off by the panel edge) ----------
const HAIR_STRANGER = {
  back() {},
  front(v, side) {
    if (side) { hairFill([[24, -34], [8, -52], [-20, -52], [-38, -34], [-40, -10], [-30, -6], [-20, -24], [4, -28], [18, -24]], { fill: WHITE, tone: .55, lw: 1.6 }); return; }
    hairFill(warp(capArc(40, 50, -10).concat([[38, -14], [30, -20], [0, -26], [-30, -20], [-38, -14]]), v), { fill: WHITE, tone: .55, lw: 1.6 });
  },
};
