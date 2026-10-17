// config.js: project settings. The demo has no music: 120 BPM from t = 0, so beat n = n × 0.5 s.
// For a song, copy the beat map from work/analysis/timing.json (tools/music/beatgrid.py): bpm = 60 / period, offset =
// the time of beat 0, and audio (muxed into --clip / --encode; CI decrypts its own copy). duration may run past the
// music (a black tail): CI pads the audio with silence.
// audio: 本地预览用的音乐（studio.html 的播放器读它，路径相对 manga/）。没有这个文件就静音放画面。
const PROJECT = { duration: 10, bpm: 120, offset: 0, audio: '../assets/music.m4a' };
