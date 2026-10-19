// lyricfx.js：歌词字幕特效，和画风无关。画在一张盖在画面上面的透明 canvas 上；每帧只看时间 t，所以可以随便跳着渲染、多台机器分段渲染。
// 三种样式：
//   slip     纸条贴字：每句写在一张手撕白纸条上，「啪」地拍进画面，两头贴胶带；整句先浅灰显示，唱到的字变黑、跳一下；下一句拍上来时旧纸条被撕走
//   pop      大字蹦出：不垫底，粗白描边 + 投影；唱到哪个字，哪个字从小弹出来，正在唱的字放大；整句停到下一句开始前，退场时逐字掉下去
//   kinetic  动态排版：每句拆成几块，一块块砸进画面（有逐字时间就跟唱，没有就踩拍子），关键词黑底白字、特别大；退场时甩出画面
// 用法：
//   const r = lyricFX(ctx, t, { lines: LY, style: 'slip', W: 1920, H: 1080, beats: [每拍的秒数...], layout: {...} });
//   ctx 由宿主准备好（已按 W×H 缩放好、已清空）；返回 r.shake = [dx, dy]：kinetic 砸字时建议画面跟着抖，宿主自己决定用不用
//   ctx 传 null 就只算 shake 不画字（宿主要在画画面之前知道这一帧抖多少时用）
// 歌词每句 [开始, 结束, '歌词', [[每个字开始, 结束], ...]]，第 4 项可省（省了就按拍子排字），和资源库 tools/lyrics 对齐出来的格式一样。
// 选项：
//   style     'slip' | 'pop' | 'kinetic'，或 (i, line) => 样式（混搭，比如主歌纸条、副歌动态排版）
//   beats     每拍时间（升序）。没有逐字时间的句子按半拍一个字排；不给就在句子前 75% 里匀速排
//   layout    kinetic 每句摆位 { 句号: { chunks: '回到/【七岁】/时候的小孩', at: [x, y], s: 缩放, r: 角度, stagger: 左右错开,
//                                       pos: [[x, y, 角度?, 缩放?], ...], tb: [第几拍, ...] } }
//             chunks 用 / 分块、【】标关键词（去掉符号后必须和歌词一模一样）；不给就自动拆块
//             at：整句一块块竖着叠在 (x, y) 周围；pos：每块各放各的位置（给了 pos 就不用 at）；都不给就按句号轮流摆在四个角
//             tb：每块砸在第几拍（beats 的下标），不给就跟着这块第一个字唱出来的时间
//   fonts / size / y  各样式的字体、字号、纸条和大字的中心高度（默认离底边 1/10）
//   ink / paper / dim  墨色、纸色、纸条上没唱到的字的颜色
//   lastUntil 最后一句停到什么时候（默认唱完再停 1.2 秒）
//   ripDown   true = 纸条退场时往下撕出画（默认往上撕，会从画面中间飞过去）
//   boil      线条抖动的节拍，(t) => 整数，默认每秒换 10 次形状（和手绘动画的「线条沸腾」一样）
(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const eOut = k => 1 - (1 - k) ** 3, eIn = k => k * k * k;
  const backOut = (k, s = 2.2) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2;
  const DEF = {
    fonts: { slip: "'Ma Shan Zheng',serif", pop: "'ZCOOL KuaiLe',sans-serif", kinetic: "'ZCOOL KuaiLe',sans-serif" },
    size: { slip: 86, pop: 100, kinetic: 116 },
    ink: '#2b2724', paper: '#fbf8f1', dim: '#bdb4a8',
  };

  // 每个字的 [开始, 结束]
  function charTimes(L, beats) {
    if (L[3]) return L[3];
    const n = [...L[2]].length, [a, b] = L;
    if (beats && beats.length > 1) {   // 踩半拍：从句子开始后的第一个半拍起，一个字一个半拍；唱不下就压缩
      const half = (beats[1] - beats[0]) / 2;
      let t0 = a;
      for (let k = 0; k < beats.length; k++) { if (beats[k] >= a - .06) { t0 = beats[k] - half >= a - .06 ? beats[k] - half : beats[k]; break; } }
      const step = Math.min(half, (b - t0) * .85 / n);
      return [...L[2]].map((_, i) => [t0 + step * i, t0 + step * (i + 1)]);
    }
    const span = Math.min((b - a) * .75, n * .28);
    return [...L[2]].map((_, i) => [a + span * i / n, a + span * (i + 1) / n]);
  }

  // 一行字逐个排开：返回每个字的中心 x（相对整行中心）和整行宽度
  function layoutChars(ctx, chars, size, font, gap = .04) {
    ctx.font = `${size}px ${font}`;
    const ws = chars.map(c => ctx.measureText(c).width + size * gap), tw = ws.reduce((p, q) => p + q, 0);
    let x = -tw / 2;
    return { xs: ws.map(w => { const c = x + w / 2; x += w; return c; }), tw };
  }

  // 粗白描边 + 投影的字（pop、kinetic 用）
  function outlinedChar(ctx, ch, x, y, size, font, o) {
    ctx.font = `${size}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.save();
    ctx.shadowColor = 'rgba(30,22,14,.32)'; ctx.shadowBlur = size * .12; ctx.shadowOffsetY = size * .05;
    ctx.strokeStyle = o.paper; ctx.lineWidth = size * .17; ctx.strokeText(ch, x, y);
    ctx.restore();
    ctx.fillStyle = o.ink; ctx.fillText(ch, x, y);
  }

  // 抖动的折线（闭合）：pts 每个点按 boil 节拍抖一点
  function roughPoly(ctx, pts, tick, seed, amp = 1.2) {
    ctx.beginPath();
    pts.forEach(([x, y], k) => {
      const jx = (hash(seed + k * 3.7 + tick * 1.31) - .5) * 2 * amp, jy = (hash(seed + k * 5.3 + tick * 2.17) - .5) * 2 * amp;
      k ? ctx.lineTo(x + jx, y + jy) : ctx.moveTo(x + jx, y + jy);
    });
    ctx.closePath();
  }

  // ---------- slip 纸条贴字 ----------
  function slip(ctx, t, i, L, life, o) {
    const [a] = L, S = o.size.slip, font = o.fonts.slip, chars = [...L[2]], CT = o.ct(i);
    const tIn = a - .24, land = a - .06, rip = life.gone;
    if (!ctx || t < tIn || t > rip + .45) return;
    const { xs, tw } = layoutChars(ctx, chars, S, font, .06);
    const w = tw + S * 1.1, h = S * 1.5, side = hash(i * 3.1) > .5 ? 1 : -1;
    const cx = o.W / 2 + (hash(i * 7.7) - .5) * 70, cy = o.y.slip, r0 = (hash(i * 5.3) - .5) * 4.5;
    // 进场：从「离镜头近」的大尺寸拍下来，落地瞬间压扁一下；退场：一头先掀起来，整张往上撕走
    const kIn = seg(t, tIn, land), sq = t > land ? Math.sin(seg(t, land, land + .16) * Math.PI) * (1 - seg(t, land, land + .16)) : 0;
    const kOut = eIn(seg(t, rip, rip + .42));
    const sc = 1 + .28 * (1 - eIn(kIn));
    ctx.save();
    ctx.globalAlpha = clamp(kIn * 3);
    // o.ripDown：旧纸条往下撕、直接出画（主戏在画面上半时用，免得旧纸条从画面中间飞过去抢视线）
    ctx.translate(cx + side * kOut * (o.ripDown ? 120 : 260), o.ripDown ? cy + kOut * 360 : cy - kOut * 760);
    ctx.rotate((r0 - side * 6 * (1 - kIn) + side * kOut * 28) * Math.PI / 180);
    ctx.scale(sc * (1 + .06 * sq), sc * (1 - .1 * sq));
    // 纸：上下两条边是撕出来的锯齿，左右直边
    const pts = [], step = 16, nz = Math.ceil(w / step);
    for (let k = 0; k <= nz; k++) pts.push([-w / 2 + w * k / nz, -h / 2 + (hash(i * 13 + k) - .5) * 9]);
    for (let k = nz; k >= 0; k--) pts.push([-w / 2 + w * k / nz, h / 2 + (hash(i * 17 + k * 1.9) - .5) * 9]);
    const far = 1 - kIn;   // 离得越远影子越散、越偏
    ctx.save();
    ctx.shadowColor = `rgba(30,22,14,${.26 - far * .1})`; ctx.shadowBlur = 10 + far * 30; ctx.shadowOffsetY = 6 + far * 26; ctx.shadowOffsetX = 3;
    roughPoly(ctx, pts, o.tick, i * 31, 1); ctx.fillStyle = o.paper; ctx.fill();
    ctx.restore();
    ctx.strokeStyle = o.ink; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    // 一条淡淡的横格线
    ctx.strokeStyle = o.ink; ctx.globalAlpha *= .16; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-w / 2 + 14, S * .52); ctx.lineTo(w / 2 - 14, S * .52 + (hash(i) - .5) * 4); ctx.stroke();
    ctx.globalAlpha = clamp(kIn * 3);
    // 字：没唱到浅灰，唱到变黑并跳一下
    ctx.font = `${S}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    chars.forEach((ch, j) => {
      const [cs] = CT[j], k = seg(t, cs - .03, cs + .14), hop = Math.sin(k * Math.PI);
      const jr = (hash(i * 41 + j * 7) - .5) * 6 + (hash(j + o.tick * 3.3) - .5) * 1.2, jy = (hash(i * 23 + j * 3) - .5) * 6;
      ctx.save();
      ctx.translate(xs[j] + (hash(j * 9 + o.tick) - .5) * 1.4, jy - S * .06 - hop * S * .16);
      ctx.rotate(jr * Math.PI / 180); ctx.scale(1 + hop * .28, 1 + hop * .28);
      ctx.fillStyle = k > .35 ? o.ink : o.dim; ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
    // 两头的胶带（落地后先左后右啪地贴上）
    [[-1, land + .04], [1, land + .11]].forEach(([s, t0]) => {
      const k = seg(t, t0, t0 + .1); if (k <= 0) return;
      ctx.save();
      ctx.translate(s * (w / 2 - 6), -h / 2 + 8); ctx.rotate(s * 34 * Math.PI / 180); ctx.scale(1 + .5 * (1 - eOut(k)), 1 + .5 * (1 - eOut(k)));
      ctx.globalAlpha = clamp(kIn * 3) * k;
      const tl = 118, th = 36, tp = [];
      for (let q = 0; q <= 4; q++) tp.push([-tl / 2 + (q % 2) * 6, -th / 2 + th * q / 4]);
      for (let q = 4; q >= 0; q--) tp.push([tl / 2 - (q % 2) * 6, -th / 2 + th * q / 4]);
      roughPoly(ctx, tp, o.tick, i * 7 + s, .8);
      ctx.fillStyle = o.paper; ctx.globalAlpha *= .78; ctx.fill();
      ctx.globalAlpha /= .78; ctx.strokeStyle = o.ink; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  // ---------- pop 大字蹦出 ----------
  function pop(ctx, t, i, L, life, o) {
    const S = o.size.pop, font = o.fonts.pop, chars = [...L[2]], CT = o.ct(i), n = chars.length;
    if (!ctx || t < CT[0][0] - .06 || t >= life.gone) return;
    const { xs } = layoutChars(ctx, chars, S, font, .02);
    // 退场：最后一个字唱完以后，留到下一句前 0.28 秒开始逐字掉下去
    const sungEnd = CT[n - 1][1], es = clamp(life.gone - .28, Math.min(sungEnd + .05, life.gone - .06), life.gone - .06);
    const d = Math.min(.025, Math.max(0, life.gone - es - .16) / n);
    chars.forEach((ch, j) => {
      const [cs, ce] = CT[j], k = seg(t, cs - .05, cs + .17); if (k <= 0) return;
      const sing = Math.sin(seg(t, cs - .03, Math.max(ce, cs + .2) + .06) * Math.PI);
      const ko = eIn(seg(t, es + j * d, Math.min(life.gone, es + j * d + .16)));
      if (ko >= 1) return;
      const dir = hash(i * 11 + j) > .5 ? 1 : -1, jr = (hash(i * 41 + j * 7) - .5) * 8;
      ctx.save();
      ctx.translate(o.W / 2 + xs[j] + (hash(j * 9 + o.tick) - .5) * 1.6, o.y.pop + (hash(i * 23 + j * 3) - .5) * 10 - sing * S * .12 + ko * 140 - (1 - k) * S * .3);
      ctx.rotate((jr + dir * 22 * (1 - k) + dir * ko * 35) * Math.PI / 180);
      const sc = backOut(k) * (1 + sing * .16) * (1 - ko * .6);
      ctx.scale(sc, sc);
      ctx.globalAlpha = clamp(k * 4) * (1 - ko);
      outlinedChar(ctx, ch, 0, 0, S, font, o);
      ctx.restore();
    });
  }

  // ---------- kinetic 动态排版 ----------
  const AUTO_AT = [[.27, .28], [.72, .3], [.29, .68], [.71, .7]];
  function chunksOf(i, L, lay) {
    const text = L[2];
    if (lay && lay.chunks) {
      const out = []; let c = 0;
      lay.chunks.split('/').forEach(p => {
        const key = /^【.*】$/.test(p), s = p.replace(/[【】]/g, ''), n = [...s].length;
        out.push({ c0: c, c1: c + n, key, str: s }); c += n;
      });
      if (out.map(q => q.str).join('') !== text) console.warn('lyricFX: 第', i, '句 chunks 和歌词对不上', lay.chunks, text);
      return out;
    }
    const chars = [...text], n = chars.length, m = n <= 4 ? 1 : n <= 8 ? 2 : 3, out = [];
    for (let k = 0, c = 0; k < m; k++) { const c1 = Math.round(n * (k + 1) / m); out.push({ c0: c, c1, key: false, str: chars.slice(c, c1).join('') }); c = c1; }
    return out;
  }
  function kinetic(ctx, t, i, L, life, o) {
    const lay = (o.layout && o.layout[i]) || {}, S = o.size.kinetic * (lay.s || 1), font = o.fonts.kinetic, CT = o.ct(i);
    const chunks = chunksOf(i, L, lay), shake = [0, 0];
    const ex = life.gone;
    const first = lay.tb && lay.tb[0] != null && o.beats ? Math.min(o.beats[lay.tb[0]] - .14, CT[0][0]) : CT[0][0];
    if (t < first - .06 || t > ex + .45) return shake;
    const at = lay.at || [AUTO_AT[i % 4][0] * o.W, AUTO_AT[i % 4][1] * o.H];
    const rows = chunks.map((q, k) => ({ ...q, size: S * (q.key ? 1.5 : 1) * (q.s || 1) })), lh = rows.map(q => q.size * 1.14);
    let y = at[1] - lh.reduce((p, q) => p + q, 0) / 2;
    rows.forEach((q, k) => {
      let ty = y + lh[k] / 2; y += lh[k];
      const tb = lay.tb && lay.tb[k] != null && o.beats ? o.beats[lay.tb[k]] - .14 : null;
      const tA = tb ?? CT[q.c0][0] - .02, hit = tA + .14;
      if (t < tA) return;
      const stag = (lay.stagger ?? 1) * S * .55 * (rows.length === 1 ? 0 : k % 2 ? 1 : -1) * (k === 1 && rows.length === 3 ? .4 : 1);
      let tx = at[0] + stag, rot = (lay.r ?? 0) + (k % 2 ? 3.5 : -4) + (hash(i * 9 + k) - .5) * 3;
      const P = lay.pos && lay.pos[k];
      if (P) { tx = P[0]; ty = P[1]; if (P[2] != null) rot = P[2]; if (P[3] != null) q.size *= P[3]; }
      // 砸进来：从 2.6 倍大加速缩到位，落地后弹一下；画面跟着抖
      const kIn = seg(t, tA, hit), sc = 1 + 1.6 * (1 - eIn(kIn)), bump = t > hit ? Math.sin(seg(t, hit, hit + .22) * Math.PI) * (1 - seg(t, hit, hit + .22)) : 0;
      if (t > hit && t < hit + .35) {
        const A = (q.key ? 16 : 8) * Math.exp(-(t - hit) * 13), ph = (t - hit) * 70 + i + k;
        shake[0] += A * Math.sin(ph); shake[1] += A * .7 * Math.cos(ph * 1.3);
      }
      // 退场：一块接一块往两边甩出去
      const dir = tx > o.W / 2 ? 1 : -1, kOut = eIn(seg(t, ex + k * .05, ex + k * .05 + .32));
      if (!ctx || kOut >= 1) return;
      const chars = [...q.str], { xs, tw } = layoutChars(ctx, chars, q.size, font, .02);
      ctx.save();
      ctx.translate(tx + dir * kOut * 1300, ty - kOut * 160);
      ctx.rotate((rot + dir * kOut * 40) * Math.PI / 180);
      ctx.scale(sc * (1 + bump * .08), sc * (1 + bump * .08));
      ctx.globalAlpha = clamp(kIn * 2.5);
      if (q.key) {   // 关键词：黑底白字
        const pw = tw / 2 + q.size * .2, ph = q.size * .62;
        roughPoly(ctx, [[-pw, -ph], [0, -ph - 4], [pw, -ph], [pw + 6, 0], [pw, ph], [0, ph + 3], [-pw, ph], [-pw - 5, 0]], o.tick, i * 19 + k, 2);
        ctx.save(); ctx.shadowColor = 'rgba(30,22,14,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; ctx.fillStyle = o.ink; ctx.fill(); ctx.restore();
        ctx.font = `${q.size}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.paper;
        chars.forEach((ch, j) => ctx.fillText(ch, xs[j] + (hash(j * 9 + o.tick) - .5) * 1.6, (hash(i * 23 + j * 3) - .5) * 6));
      } else {
        chars.forEach((ch, j) => {
          ctx.save(); ctx.translate(xs[j] + (hash(j * 9 + o.tick) - .5) * 1.6, (hash(i * 23 + j * 3) - .5) * 8); ctx.rotate((hash(i * 41 + j * 7) - .5) * 6 * Math.PI / 180);
          outlinedChar(ctx, ch, 0, 0, q.size, font, o); ctx.restore();
        });
      }
      // 落地瞬间四周几道速度线
      const kl = seg(t, hit - .02, hit + .2);
      if (kl > 0 && kl < 1) {
        ctx.strokeStyle = o.ink; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.globalAlpha = 1 - kl;
        const rx = tw / 2 + q.size * .35, ry = q.size * .75;
        for (let m = 0; m < 8; m++) {
          const an = m / 8 * Math.PI * 2 + hash(i * 5 + k * 3 + m) * .5, r1 = 1 + kl * .25, r2 = r1 + .18 + hash(m + k) * .12;
          ctx.beginPath(); ctx.moveTo(Math.cos(an) * rx * r1, Math.sin(an) * ry * r1); ctx.lineTo(Math.cos(an) * rx * r2, Math.sin(an) * ry * r2); ctx.stroke();
        }
      }
      ctx.restore();
    });
    return shake;
  }

  const STYLES = { slip, pop, kinetic };
  function lyricFX(ctx, t, opt) {
    const o = {
      W: 1920, H: 1080, ...DEF, ...opt,
      fonts: { ...DEF.fonts, ...(opt.fonts || {}) }, size: { ...DEF.size, ...(opt.size || {}) },
    };
    o.y = { slip: o.H * .9, pop: o.H * .9, ...(opt.y || {}) };
    o.tick = opt.boil ? opt.boil(t) : Math.floor(t * 10);
    const lines = o.lines, cache = {};
    o.ct = i => cache[i] || (cache[i] = charTimes(lines[i], o.beats));
    const styleOf = typeof o.style === 'function' ? o.style : () => o.style;
    const shake = [0, 0];
    lines.forEach((L, i) => {
      const next = lines[i + 1], life = { gone: next ? next[0] - .06 : (o.lastUntil ?? L[1] + 1.2) };
      if (next && next[0] - L[1] > 1.6) life.gone = L[1] + 1.2;
      const f = STYLES[styleOf(i, L)]; if (!f) return;
      if (ctx) ctx.save();
      const s = f(ctx, t, i, L, life, o);
      if (ctx) ctx.restore();
      if (s) { shake[0] += s[0]; shake[1] += s[1]; }
    });
    return { shake };
  }
  (typeof window !== 'undefined' ? window : globalThis).lyricFX = lyricFX;
})();
