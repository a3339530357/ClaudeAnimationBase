// 片长、拍子、音乐。云端流程（.github/workflows/render.yml 和 render/render.mjs）用正则读 DUR，别改这一行的写法
const DUR = 44.6;                       // 音乐 42.61 s 满音量硬切断，之后是回声（render/music_tail.txt）+ 最后一个画面停住
const MUSIC_END = 42.609;
const W = 1920, H = 1080, BP = 0.42607, BO = 0.078;   // 140.82 BPM：第 n 拍 = 0.0780 + n × 0.42607 s，n % 4 == 0 是小节第一拍
const bt = n => BO + n * BP;
const B68 = bt(68);                     // 29.05 s 副歌鼓回（全片最大的一下）
// 本地播放器先找带回声结尾的那份（render/bake_audio.sh 用 music_tail.txt 做出来），没有就放原曲
const PROJECT = { audio: 'assets/music_tail.m4a', audioFallback: 'assets/music.m4a' };
