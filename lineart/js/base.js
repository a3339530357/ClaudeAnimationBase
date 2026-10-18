// 数学小工具（时间都用秒；拍号换成秒用 bt(n)）
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, p) => a + (b - a) * p;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const frac = x => x - Math.floor(x);
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const R3 = n => Math.round(n * 1000) / 1000;
const E = {
  sine: p => 0.5 - Math.cos(Math.PI * clamp(p)) / 2,
  inOut: p => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; },
  out: p => 1 - Math.pow(1 - clamp(p), 3),
  in: p => Math.pow(clamp(p), 3),
  outBack: p => { p = clamp(p); const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
};
// 关键帧：kf(t, [[t0, v0], [t1, v1], ...], 缓动)，值可以是数字或数组
function kf(t, keys, e = E.sine) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
    const [a, va] = keys[i - 1], [b, vb] = keys[i], k = e((t - a) / (b - a));
    return Array.isArray(va) ? va.map((v, j) => lerp(v, vb[j], k)) : lerp(va, vb, k);
  }
  return keys[keys.length - 1][1];
}
// 节拍脉冲：每拍为 1，之后衰减；hop：每拍一次的小跳 0..1..0
const pulse = (t, k = 6) => t < B0 ? 0 : Math.exp(-frac(sbeat(t)) * k);
const hop = t => Math.sin(Math.PI * frac(sbeat(t)));
const spring = (t, t0, k = 6, w = 18) => t < t0 ? 0 : Math.exp(-k * (t - t0)) * Math.sin(w * (t - t0));
