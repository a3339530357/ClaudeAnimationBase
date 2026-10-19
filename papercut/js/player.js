// 播放条：整片 0–44.6 s，原曲跟着走（音乐 42.61 s 断掉以后按时钟走完片尾）。
// 控件：播放/暂停、进度条（拖）、时间、0.5 倍速、音乐开关。键盘：空格 播放/暂停，←/→ 0.5 秒，Shift+←/→ 一帧。
// ?t=27.5 打开时停在那里；?play 打开就播；?clean 不显示播放条（截图、云端渲染用）
(() => {
  const FPS = 30, D = document, $ = id => D.getElementById(id);
  if (new URLSearchParams(location.search).has('clean')) return;
  const wait = setInterval(() => { if (window.ready) { clearInterval(wait); boot(); } }, 50);

  function boot() {
    const out = $('out');
    const css = D.createElement('style');
    css.textContent = `
      html, body { margin: 0; height: 100%; background: #efe3cb; overflow: hidden; font: 14px/1.3 system-ui, "Microsoft YaHei", sans-serif; color: #3b2f28; }
      main { box-sizing: border-box; height: 100vh; padding: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      #stage { width: min(calc(100vw - 32px), calc((100vh - 32px - 60px) * 16 / 9)); box-shadow: 3px 6px 18px rgba(85,55,25,.35); background: #fffaf0; }
      #out { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; cursor: pointer; }
      #pl { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #fffaf0; border-top: 2px dashed #e2d3b8; user-select: none; }
      #pl button { border: 2px solid #3b2f28; border-radius: 8px; background: #fffaf0; color: #3b2f28; padding: 4px 10px; font: inherit; cursor: pointer; white-space: nowrap; }
      #pl button.on { background: #ffd23f; }
      #pplay { min-width: 64px; }
      #ptime { font-variant-numeric: tabular-nums; min-width: 96px; }
      #pseek { flex: 1; margin: 0; accent-color: #f47c6a; cursor: pointer; }
    `;
    D.head.appendChild(css);
    const stage = D.createElement('div'); stage.id = 'stage';
    out.parentNode.insertBefore(stage, out); stage.appendChild(out);
    const pl = D.createElement('div'); pl.id = 'pl';
    pl.innerHTML = `<button id="pplay" title="播放 / 暂停（空格）">▶ 播放</button>
      <input id="pseek" type="range" min="0" max="${DUR}" step="${1 / FPS}" value="0">
      <span id="ptime"></span><button id="pslow" title="慢放看卡点">1×</button><button id="pmute" title="音乐开 / 关">🔊</button>`;
    stage.appendChild(pl);
    const seek = $('pseek');

    // 先找带回声结尾的音乐，没有就用原曲
    let audio = new Audio(PROJECT.audio), hasAudio = false, playing = false, rate = 1, v0 = 0, clock0 = 0, raf = 0, tried = false;
    const hook = a => {
      a.preload = 'auto';
      a.addEventListener('canplay', () => { hasAudio = true; });
      a.addEventListener('error', () => {
        if (!tried && PROJECT.audioFallback) { tried = true; audio = new Audio(PROJECT.audioFallback); hook(audio); return; }
        hasAudio = false; $('pmute').style.opacity = .35; $('pmute').title = '没找到音乐，静音放画面';
      });
    };
    hook(audio);

    function show(v) { seek.value = v; $('ptime').textContent = `${v.toFixed(2)} / ${DUR.toFixed(1)} s`; }
    let busy = false, want = null;
    async function paintAt(s) { want = s; if (busy) return; busy = true; while (want != null) { const x = want; want = null; await window.renderAt(x); await new Promise(r => setTimeout(r, 0)); } busy = false; }

    // 现在放到哪：音乐在放就看音乐，音乐放完了（或者没有音乐、浏览器不让放）就看时钟
    function nowV() {
      if (hasAudio && !audio.paused && !audio.ended && audio.currentTime < audio.duration - .03) return audio.currentTime;
      return v0 + (performance.now() - clock0) / 1000 * rate;
    }
    function tick() {
      if (!playing) return;
      const v = nowV();
      if (hasAudio && !audio.paused && !audio.ended) { v0 = v; clock0 = performance.now(); }
      if (v >= DUR - .01) { setPlay(false); show(DUR); paintAt(DUR - 1e-3); return; }
      show(v); paintAt(v);
      raf = requestAnimationFrame(tick);
    }
    function setPlay(on) {
      playing = on; $('pplay').textContent = on ? '❚❚ 暂停' : '▶ 播放';
      cancelAnimationFrame(raf);
      let v = +seek.value; if (v >= DUR - .05) v = 0;
      v0 = v; clock0 = performance.now();
      if (on) {
        if (hasAudio && v < audio.duration - .05) { audio.currentTime = v; audio.playbackRate = rate; audio.play().catch(() => {}); }
        raf = requestAnimationFrame(tick);
      } else if (hasAudio) audio.pause();
    }
    function jump(v) {
      v = Math.max(0, Math.min(DUR, v)); show(v); v0 = v; clock0 = performance.now();
      if (hasAudio) { if (v < audio.duration - .05) { audio.currentTime = v; if (playing) audio.play().catch(() => {}); } else audio.pause(); }
      paintAt(v);
    }

    $('pplay').onclick = () => setPlay(!playing);
    out.onclick = () => setPlay(!playing);
    seek.oninput = () => jump(+seek.value);
    $('pslow').onclick = () => {
      const v = playing ? nowV() : +seek.value; rate = rate === 1 ? .5 : 1;
      audio.playbackRate = rate; v0 = v; clock0 = performance.now();
      $('pslow').textContent = rate + '×'; $('pslow').classList.toggle('on', rate !== 1);
    };
    $('pmute').onclick = () => { audio.muted = !audio.muted; $('pmute').textContent = audio.muted ? '🔇' : '🔊'; };
    D.addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
      else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        e.preventDefault();
        jump((playing ? nowV() : +seek.value) + (e.code === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 1 / FPS : .5));
      }
    });

    const q = new URLSearchParams(location.search);
    jump(q.has('t') ? +q.get('t') : 0);
    if (q.has('play')) setPlay(true);
    window.player = { setPlay, jump, get time() { return nowV(); } };
  }
})();
