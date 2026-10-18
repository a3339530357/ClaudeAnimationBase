// 歌词字幕：资源库 lyricfx.js 的 kinetic（动态排版：一块块砸进画面，关键词黑底白字），画在盖在画面上面的透明 canvas 上
function karaoke(t) {
  const cv = STAGE.lyr, g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  STAGE.frame.removeAttribute('transform');
  g.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
  const r = lyricFX(g, t, { lines: LY, style: 'kinetic', W, H, beats: LY_BEATS, layout: LY_LAYOUT, ink: INK, paper: PAGE, keyBg: KEY_BG, keyFg: INK,
    lastUntil: 9, boil: () => Math.floor((HOLD ?? t) * 10) });
  if (r.shake[0] || r.shake[1]) STAGE.frame.setAttribute('transform', `translate(${r.shake[0].toFixed(1)} ${r.shake[1].toFixed(1)})`);
}
