// timeline.js: the shot list and standalone loops.
//
// shots([[t0, fn], [t1, fn], ...]) registers shots in time order. Each fn(t, lt, dur) is called with t = video time,
// lt = time since the shot started, dur = the shot's length. It paints the WHOLE frame, background included, and must be
// a pure function of t.
const SHOTS = [];
function shots(list) { SHOTS.push(...list); SHOTS.sort((a, b) => a[0] - b[0]); }
// Standalone loops (model sheets, tests): window.LOOP = LOOPS[name] swaps the whole frame. LOOPS.x.len = seconds.
const LOOPS = {};

function drawWorld(t) {
  if (window.LOOP) window.LOOP(t);
  else if (SHOTS.length) {
    let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
    const t0 = SHOTS[i][0], end = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DUR;
    X.save(); SHOTS[i][1](t, t - t0, end - t0); X.restore();
    CAM = null; X.setTransform(1, 0, 0, 1, 0, 0);
  }
  if (!window.LOOP && typeof LY !== 'undefined') karaoke(t);
}
