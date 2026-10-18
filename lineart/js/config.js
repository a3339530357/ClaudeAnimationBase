// 全局配置：画面、帧率、节拍、配色、字体。示例数据是《去年夏天》样片 B（照歌词逐句画 · 线稿，开头 8 秒），新项目改这里
const AUDIO = 'assets/music.m4a';   // 播放器读的音乐（原曲不进 git；文件不在就静音放画面）
const [W, H] = (new URLSearchParams(location.search).get('size') || '1920x1080').split('x').map(Number);
const FPS = 30, DUR = 8.0;
// 131.98 BPM：第 n 拍 = 0.2145 + n × 0.45461 秒（qunian-xiatian-mv/work/analysis/timing.json）。n % 4 === 0 是小节第一拍
const BEAT = 0.45461, B0 = 0.2145;
const bt = n => B0 + n * BEAT;
const sbeat = t => (t - B0) / BEAT;

// 墨线 + 一点红（她的发夹、冰棍）+ 米黄纸
const INK = '#2b2724', RED = '#c8382a', PAPER = '#f4eee0', PAGE = '#fbf8f1';
const HAIR = '#b07a4f', KEY_BG = '#f6c445';   // 她的头发：暖棕（不要一大块墨黑）；歌词关键词块：夏天的暖黄底 + 墨色字
let LINE_K = 1;   // 线宽系数：画人物时调细一点
const FONT_HAND = "'Long Cang','ZCOOL KuaiLe',sans-serif";
const FONT_FUN = "'ZCOOL KuaiLe','Noto Sans CJK SC',sans-serif";
const FONT_BRUSH = "'Ma Shan Zheng','Noto Serif CJK SC',serif";
