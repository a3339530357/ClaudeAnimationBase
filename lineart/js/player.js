// 播放条：播放/暂停键、进度条（点哪跳哪）、时间。双击 index.html 就能看（file:// 也行）。空格 = 播放/暂停
// 音乐读 config.js 的 AUDIO；文件不在（资源库里不放原曲）就用时钟走，静音放画面
function initPlayer(t0 = 0) {
  const au = new Audio(typeof AUDIO !== 'undefined' ? AUDIO : 'assets/music.m4a');
  let t = t0, playing = false, clock = null;   // clock：没有音乐时用 performance.now() 计时
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:54px;display:flex;align-items:center;gap:14px;padding:0 18px;background:#f4eee0;border-top:2px solid #d9cfb9;color:#2b2724;font:16px/1 system-ui,sans-serif;z-index:10;user-select:none';
  bar.innerHTML = '<button id="pp" style="width:44px;height:36px;border:0;border-radius:8px;background:#c8382a;color:#fbf8f1;font-size:20px;cursor:pointer">▶</button>' +
    '<div id="track" style="flex:1;height:10px;border-radius:5px;background:rgba(43,39,36,.14);cursor:pointer;position:relative"><div id="fill" style="position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:#c8382a;width:0"></div></div>' +
    '<span id="tm" style="width:96px;text-align:right;font-variant-numeric:tabular-nums">0.00 / 8.00</span>';
  document.body.appendChild(bar);
  const pp = bar.querySelector('#pp'), track = bar.querySelector('#track'), fill = bar.querySelector('#fill'), tm = bar.querySelector('#tm');
  const show = () => { seek(Math.min(t, DUR - 1 / FPS)); fill.style.width = (t / DUR * 100) + '%'; tm.textContent = `${t.toFixed(2)} / ${DUR.toFixed(2)}`; pp.textContent = playing ? '❚❚' : '▶'; };
  const loop = () => {
    if (!playing) return;
    t = clock ? clock.t0 + (performance.now() - clock.p0) / 1000 : au.currentTime;
    if (t >= DUR - .01 || (!clock && au.ended)) { playing = false; au.pause(); t = DUR; }
    show();
    if (playing) requestAnimationFrame(loop);
  };
  const toggle = () => {
    if (playing) { playing = false; au.pause(); show(); return; }
    if (t >= DUR - .02) t = 0;
    playing = true; clock = null;
    const silent = () => { clock = { t0: t, p0: performance.now() }; loop(); };
    if (au.error) return silent();
    au.currentTime = t;
    au.play().then(loop).catch(silent);
  };
  pp.onclick = toggle;
  document.getElementById('stage').addEventListener('click', toggle);
  addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); toggle(); } });
  track.onclick = e => { const r = track.getBoundingClientRect(); t = clamp((e.clientX - r.left) / r.width) * DUR; if (playing) { if (clock) clock = { t0: t, p0: performance.now() }; else au.currentTime = t; } show(); };
  show();
}
