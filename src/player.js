// player.js：studio.html 的播放器。画面居中、按窗口大小缩放，控制条贴在画面下面，和画面一样宽。
//
//   <script src="src/player.js"></script>      （放在所有脚本最后；漫画版写 ../src/player.js）
//
// 控件：播放/暂停、时间、进度条、倍速、音乐开关。键盘：空格 播放/暂停，←/→ 一秒，Shift+←/→ 一帧。
// 音乐读 PROJECT.audio（找不到就静音放画面）。播放时用音乐的时间驱动画面，所以画面和歌对得上；
// 一帧画不完就跳过中间的帧（本地只用来看内容，成片是逐帧渲的，不受影响）。
// ?t=12.5 打开时停在 12.5 秒；?play 打开就播（浏览器拦自动播放的话，点一下画面）。
(() => {
  const D = document;
  const wait = setInterval(() => { if (typeof window.renderAt === 'function' && window.ready) { clearInterval(wait); boot(); } }, 50);

  function boot() {
    const out = D.getElementById('out'); if (!out) return;
    const RATIO = out.width / out.height, DUR = PROJECT.duration, FPS = 30;
    const css = D.createElement('style');
    css.textContent = `
      html, body { margin: 0; height: 100%; background: #16141b; overflow: hidden; }
      body > main { box-sizing: border-box; height: 100vh; padding: 20px; display: flex; align-items: center; justify-content: center; }
      body > main > .bar, .p5Canvas { display: none !important; }
      #stage { width: min(calc(100vw - 40px), calc((100vh - 40px - 48px) * ${RATIO})); border-radius: 8px; overflow: hidden;
               box-shadow: 0 10px 40px rgba(0,0,0,.45); background: #0f0e12; }
      #stage #out { display: block; width: 100% !important; height: auto !important; aspect-ratio: ${out.width} / ${out.height}; cursor: pointer; }
      #pl { height: 48px; display: flex; align-items: center; gap: 14px; padding: 0 14px; background: #201d27;
            font: 13px/1 system-ui, -apple-system, "Segoe UI", sans-serif; color: #cfc8d8; user-select: none; }
      #pl button { all: unset; cursor: pointer; display: grid; place-items: center; color: #e9e3ef; border-radius: 6px; }
      #pl button:hover { color: #fff; background: rgba(255,255,255,.08); }
      #pl button:focus-visible { outline: 2px solid #e8a87c; }
      #pplay, #pmute { width: 32px; height: 32px; }
      #pl svg { width: 18px; height: 18px; fill: currentColor; }
      #ptime { font-variant-numeric: tabular-nums; min-width: 104px; color: #b9b1c4; }
      #pseek { -webkit-appearance: none; appearance: none; flex: 1; height: 4px; margin: 0; border-radius: 2px; cursor: pointer; outline: none;
               background: linear-gradient(to right, #e8a87c var(--p, 0%), #3b3646 var(--p, 0%)); }
      #pseek::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%; background: #f3ebdc; border: 0; }
      #pseek::-moz-range-thumb { width: 13px; height: 13px; border-radius: 50%; background: #f3ebdc; border: 0; }
      #pseek:hover::-webkit-slider-thumb { transform: scale(1.2); }
      #pfast { font-size: 12px; font-weight: 600; padding: 5px 8px; color: #b9b1c4; min-width: 30px; }
      #pfast.on { color: #e8a87c; }
    `;
    D.head.appendChild(css);

    const ICON = {
      play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
      pause: '<svg viewBox="0 0 24 24"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg>',
      sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4.5v15L8 15H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      mute: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4.5v15L8 15H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    };
    const stage = D.createElement('div'); stage.id = 'stage';
    out.parentNode.insertBefore(stage, out); stage.appendChild(out);
    const pl = D.createElement('div'); pl.id = 'pl';
    pl.innerHTML = `<button id="pplay" title="播放 / 暂停（空格）">${ICON.play}</button>
      <span id="ptime"></span>
      <input id="pseek" type="range" min="0" max="${DUR}" step="${1 / FPS}" value="0">
      <button id="pfast" title="倍速">1×</button>
      <button id="pmute" title="音乐开 / 关">${ICON.sound}</button>`;
    stage.appendChild(pl);
    const $ = id => D.getElementById(id), seek = $('pseek');

    const audio = new Audio(PROJECT.audio || 'assets/music.m4a');
    let hasAudio = false, playing = false, rate = 1, clock0 = 0, raf = 0;
    audio.preload = 'auto';
    audio.addEventListener('canplay', () => { hasAudio = true; });
    audio.addEventListener('error', () => { hasAudio = false; $('pmute').style.opacity = .35; $('pmute').title = '没找到音乐，静音放画面'; });

    const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
    const clampT = x => Math.max(0, Math.min(DUR, x));
    function show(t) { seek.value = t; seek.style.setProperty('--p', (t / DUR * 100) + '%'); $('ptime').textContent = `${fmt(t)} / ${fmt(DUR)}`; }

    // 画一帧：上一帧没画完就只记住最新的时间，画完再接着画（拖动、播放都走这里，不会堆积）
    let busy = false, want = null;
    async function paintAt(t) { want = t; if (busy) return; busy = true; while (want != null) { const x = want; want = null; await window.renderAt(x); } busy = false; }

    const now = () => hasAudio ? audio.currentTime : (performance.now() - clock0) / 1000 * rate;
    function tick() {
      if (!playing) return;
      const t = now();
      if (t >= DUR) { setPlay(false); show(DUR); paintAt(DUR - 1e-3); return; }
      show(t); paintAt(t);
      raf = requestAnimationFrame(tick);
    }
    function setPlay(on) {
      playing = on; $('pplay').innerHTML = on ? ICON.pause : ICON.play;
      cancelAnimationFrame(raf);
      const t = +seek.value >= DUR - .05 ? 0 : +seek.value;
      if (on) {
        if (hasAudio) { audio.currentTime = t; audio.playbackRate = rate; audio.play().catch(() => {}); }
        clock0 = performance.now() - t * 1000 / rate;
        raf = requestAnimationFrame(tick);
      } else if (hasAudio) audio.pause();
    }
    function jump(t) { t = clampT(t); show(t); if (hasAudio) audio.currentTime = t; clock0 = performance.now() - t * 1000 / rate; paintAt(t); }

    $('pplay').onclick = () => setPlay(!playing);
    out.onclick = () => setPlay(!playing);
    seek.oninput = () => jump(+seek.value);
    $('pfast').onclick = () => {
      const t = now(); rate = { 1: 1.5, 1.5: 2, 2: .5, .5: 1 }[rate];
      audio.playbackRate = rate; clock0 = performance.now() - t * 1000 / rate;
      $('pfast').textContent = rate + '×'; $('pfast').classList.toggle('on', rate !== 1);
    };
    $('pmute').onclick = () => { audio.muted = !audio.muted; $('pmute').innerHTML = audio.muted ? ICON.mute : ICON.sound; };
    D.addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
      else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        jump((playing ? now() : +seek.value) + (e.code === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 1 / FPS : 1));
      }
    });

    const q = new URLSearchParams(location.search);
    jump(+(q.get('t') || 0));
    if (q.has('play')) setPlay(true);
    window.player = { setPlay, jump, get time() { return now(); } };
  }
})();
