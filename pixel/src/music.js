// music.js: big hits, lyrics and opening credits for the project (numbers from work/analysis/timing.json).
//   HIT: named beat numbers;  LY: [[start, end, 'line', [[char start, char end], ...]], ...] (per-character times optional:
//   without them the line lights up evenly);  CREDITS: see pxlyrics.js.
// Every character used here, in the title and in the credits must be in the font subset (tools/pixel_font.py).
const HIT = { duet: 16 };
const LY = [
  [9.6, 11.6, '写不完的温柔', [[9.6, 9.9], [9.9, 10.2], [10.2, 10.5], [10.5, 10.8], [10.8, 11.2], [11.2, 11.6]]],
];
const CREDITS = [
  [1.5, 4.2, 978, [['MV制作', '小冰OvO']]],
];
