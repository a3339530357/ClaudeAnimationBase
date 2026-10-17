// scenes/common.js: small helpers every chapter uses. All chapter files share one global scope: every top-level name in
// a chapter file must start with its chapter letter (A_, B_, C_, D_) so nothing gets silently overwritten.
//
//   zoom(z, cx, cy)        pixel camera (POST.zoom): z = 2 medium shot, 3 close, 4 very close; whole numbers when still
//   zoomTo(lt, t0, t1, a, b)  animate between two zoom states [z, cx, cy] (eased); snaps to whole z when it lands
//   grade(type, k)         add a colour grade ('gray', 'sepia', 'cold', 'warm', 'dark', 'night')
//   memory(k)              the "remembered" look: sepia + vignette
//   shake(k)               small random shake this frame (k = pixels)
//   walk(lt, t0, t1, x0, x1, steps)  -> [x, phase]: walk from x0 to x1 between t0 and t1 (steps per second)
//   twitch(k)              1-px tremble for trembling hands (k = 0..1 probability)
//   beatIn(lt, shotT0, n)  seconds since beat n, relative to a shot (for one-off hits inside a shot)
function zoom(z, cx = PW / 2, cy = PH / 2) { POST.zoom = [z, cx, cy]; }
function zoomTo(lt, t0, t1, a, b) {
  const k = ease(seg(lt, t0, t1));
  let z = lerp(a[0], b[0], k); if (k >= 1) z = b[0]; else if (k <= 0) z = a[0];
  POST.zoom = [z, lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
}
function grade(type, k = 1) { POST.grade = [...(POST.grade || []), [type, k]]; }
function memory(k = 1) { grade('sepia', .75 * k); POST.vig = Math.max(POST.vig || 0, .8 * k); }
function shake(k = 1) { if (k <= 0) return; POST.shake = [Math.round((hash(Math.floor(T * 30), 1) - .5) * 2 * k), Math.round((hash(Math.floor(T * 30), 2) - .5) * 2 * k)]; }
function walk(lt, t0, t1, x0, x1, steps = 1.6) { const k = seg(lt, t0, t1); return [lerp(x0, x1, k), k > 0 && k < 1 ? lt * steps : 0]; }
function twitch(k = 1) { return hash(Math.floor(T * 24), 7) < k ? (hash(Math.floor(T * 24), 8) < .5 ? -1 : 1) : 0; }
const beatIn = (t, n) => t - bt(n);
