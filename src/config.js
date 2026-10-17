// config.js: project settings.
//   duration: the video's length in seconds.
//   bpm:      the rhythm that bounces, dances and pulse() follow. Clawd always moves to some beat; if the video has music,
//             set this to the song's tempo, and set offset to the time in seconds of its first downbeat.
// audio: 本地预览用的音乐（studio.html 的播放器读它）。没有这个文件就静音放画面。
const PROJECT = { duration: 11, bpm: 120, offset: 0, audio: 'assets/music.m4a' };
