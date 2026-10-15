// music.js: the song's map. Times in seconds; beats counted from beat 0 (PROJECT.offset), the same numbers as
// STORYBOARD.md. bt(n): time of beat n (fractions allowed). Bars start on beats n % 4 === 0; even beats are the kick,
// odd beats the clap (cam() dips on kicks, strobe() flips on claps; change kick/clap if the song's pattern differs).
const bt = n => OFF + n * BEAT;
const sbeat = t => (t - OFF) / BEAT;
const kick = t => { const b = sbeat(t), n = Math.floor(b); return n % 2 === 0 ? Math.exp(-(b - n) * 7) : 0; };   // 1 on even beats
const clap = t => { const b = sbeat(t), n = Math.floor(b); return n % 2 ? Math.exp(-(b - n) * 9) : 0; };          // 1 on odd beats

// shot starts (bar lines) and the big moments, as in the storyboard
const S = [0, bt(4), bt(8), bt(12), bt(16), DUR];
const HIT = { run: bt(4), stare: bt(6), turn: bt(8), sparkle: bt(9), drop: bt(12), tear: bt(16), flood: bt(18) };

// Karaoke (optional: no LY, no captions). Lines [start, end, text, [[char start, char end], ...]]: every character's
// own time, from tools/lyrics (sep_vocals → volc_asr → align_lyrics → hold_tails write them into timing.json). E.g.
// const LY = [[1.65, 3.29, '那时我放开了的手', [[1.65,1.69],[1.81,1.97],[2.01,2.25],[2.25,2.49],[2.49,2.65],[2.65,2.81],[2.81,2.89],[2.97,3.29]]]];
