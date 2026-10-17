// timeline.js: the shot list and standalone loops.
// shots([[t0, fn, { tr, d, ...}], ...]): fn(t, lt, dur) paints the whole buffer (t = song time, lt = time in the shot);
// the optional third item is the transition INTO this shot (see TR in frame.js: cut, dither, blocks, diamond, iris, irisIn,
// wipeL, wipeR, wipeD, blinds, split, push, flash, dip) lasting d seconds from t0.
// LOOPS.name = fn(t) with LOOPS.name.len = seconds; open studio.html?loop=name to see one.
const SHOTS = [];
function shots(list) { SHOTS.push(...list); SHOTS.sort((a, b) => a[0] - b[0]); }
const LOOPS = {};
