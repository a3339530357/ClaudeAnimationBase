# 像素画风

来自《写不完的温柔》（G.E.M. 邓紫棋，2026-10，完整 4 分钟 MV，47 个镜头）。用户评价是"这首像素风的质量很好"。

这套是纯 2D canvas，不用 p5、不用 WebGL，也不用显卡。每帧大多只要 10～60 毫秒，片名这种重画面也就 100～180 毫秒。浏览器打开 `studio.html` 就能流畅地边听边看；云端分 20 段渲染，4 分钟的片几分钟就出完。

- **适合**：讲故事的 MV、温暖怀旧的题材、四季和日夜换色、要画很多场景和镜头的长片。像素颗粒本身就很统一，颜色和光影靠调色板和抖动点来做。
- **不适合**：要像某个真人的片子。用代码画邓紫棋时，像素、水彩、漫画三版用户都说"不像"。要水彩质感或漫画网点的片子，用根目录的水彩引擎或 `manga/`。

## 怎么画出来的

- 画布是 **480×270 个"调色板编号"**，不是颜色，所以画不出抗锯齿或半透明的糊边。最后放大 4 倍（最近邻）到 1920×1080。
- 半透明、渐变、淡入淡出全部用**有序抖动**（Bayer 4×4）。比如人物要半透明，就隔点画；转场的溶解也是这样。
- **调色**：每个镜头设 `POST.grade`，把整张调色板换算一遍，有 `gray` 褪色、`sepia` 回忆、`cold`、`warm`、`dark`、`night` 几种。
- **像素镜头**：`POST.zoom = [倍数, 中心x, 中心y]`，把画面里所有像素一起放大。中景用 2 倍，近景用 3 倍，脸部特写用 3～4 倍。**静止的画面只用整数倍**，推拉的过程中可以用小数。同一套小人只画一种尺寸（约 54 像素高），远景、中景、特写全靠这个放大。
- **转场**：每个镜头的第三项写 `{ tr, d }`，切换时把前后两个镜头分别画出来，再按像素蒙版拼起来。可选的有：`dither` 抖动溶解、`blocks` 方块溶解、`diamond` 菱形擦除、`iris` / `irisIn` 圆形开合、`wipeL/R/D` 擦除、`blinds` 百叶窗、`split` 中间劈开、`push` 推移、`flash` 白闪、`dip` 淡出淡入、`cut` 硬切。
- **歌词**：用 Fusion Pixel 12px 中文像素字体（SIL OFL 协议）。字体里的每个点画成 8×8 的屏幕方块，正好等于画面上 2×2 个像素，和画面是同一套格子。整句先用暗色显示，唱到哪个字，哪个字变亮、跳一下。片头制作人员字幕的大小是歌词的一半。

## 先跑起来（在资源库根目录）

```bash
node render.mjs --page=pixel/studio.html --sheet=0.5,2.5,5,7.8,9.3,11,12.5 --cols=4 --out=out/check/pixel_demo.jpg   # 示例缩略图
node render.mjs --page=pixel/studio.html --clip --out=out/pixel_demo.mp4                                               # 13 秒示例片
node render.mjs --page=pixel/studio.html --loop=cast --stills=.5 --out=out/check/pixel_cast                             # 人物设定图
node render.mjs --page=pixel/studio.html --loop=cover --size=1920x1440 --stills=1 --out=out/check/pixel_cover          # 4:3 封面示例
```

设定图：`cast` 是两个人的各种表情、侧面、背面、走路、弹琴、三套衣服；`hall` / `hallSpring` 是车站大厅；`plat` 是雨夜站台加火车；`rooms` / `herroom` 是两个人的家；`props` 是谱子、琴键、手、手机图标和各种小东西。也可以直接在浏览器打开 `pixel/studio.html?loop=cast` 看。

## 开新项目

```bash
B=~/project/testt/videos/ClaudeAnimationBase; P=~/project/testt/videos/新项目名
mkdir -p $P/assets $P/fonts $P/work/{analysis,secrets,dl} $P/out/check $P/.github/workflows $P/src/scenes
cp $B/pixel/studio.html $P/ && cp -r $B/pixel/src/* $P/src/ && rm $P/src/scenes/demo.js
cp $B/src/player.js $P/src/ && sed -i 's#\.\./src/player\.js#src/player.js#; s#src/scenes/demo\.js#src/scenes/ch_a.js#' $P/studio.html
cp $B/pixel/fonts/FusionPixel-OFL.txt $P/fonts/
cp $B/{render.mjs,package.json,package-lock.json} $P/ && ln -s $B/node_modules $P/node_modules
cp $B/LICENSE $P/LICENSE-ClaudeAnimationBase; cp $B/tools/ci/render.yml $P/.github/workflows/
```

然后：
1. `src/config.js` 填 `duration / bpm / offset / audio`。
2. 歌词。用户给了 LRC 的话，先用火山识别核对，再一步写进 timing.json：`python3 -I $B/tools/lyrics/cmp_lrc.py 歌.lrc work/lyrics/asr_plain.json work/lyrics/asr_ctx.json --timing work/analysis/timing.json`（见手册第 2 节）。`src/music.js` 里写 `HIT`、`LY`（从 timing.json 抄过来）和 `CREDITS`（片头制作人员）。
3. 字体：下载完整字体（命令写在 `tools/pixel_font.py` 开头），然后运行 `work/.venv/bin/python -I $B/pixel/tools/pixel_font.py work/dl/fpf/fusion-pixel-12px-proportional-zh_hans.ttf . --timing work/analysis/timing.json`。这一步会同时生成 `fonts/pixel12.ttf` 和 `src/font_data.js`。**歌词、片名、字幕里的字有改动，就要重新跑一次**。
4. 镜头按章节分文件写：`src/scenes/ch_a.js`、`ch_b.js`……，在 `studio.html` 里逐个引入。**每个文件里所有顶层的名字都要加章节前缀**（`A_`、`B_`……），因为所有脚本共用一个全局作用域，同名的会被悄悄覆盖。前缀尤其不能只写一个 `C`，`C` 是调色板。
5. 自查：
   - `node $B/pixel/tools/shots.cjs studio.html --mid` 会列出所有镜头，并给出每个镜头 62% 处的时间点。把这些时间点交给 `render.mjs --sheet`，就能每镜一帧拼成整片总览。
   - 交付前，用 `node $B/tools/check/plain_open.mjs /usr/bin/google-chrome 25 out/check/plain.png` 模拟用户双击打开网页，确认字体能加载。
6. 封面：参照 `demo.js` 末尾的 `LOOPS.cover`。

## 文件和主要函数

| 文件 | 内容 |
|---|---|
| `px.js` | 画布和 **91 色调色板** `C.xx`（OL 描边、肤色、她的芥末黄/栗发、他的天蓝/黑发、木头、车站、夜空蓝、灰、春绿、粉、海、夕阳、红、纸、咖啡、屏幕光、火车奶油色）；画图 `pset / rect / line / tline`（粗线）`/ ellipse / ring / poly / sprite`（字符地图）；`begin()` / `end(描边色, 透明度)` 把一组形状单独画在一层上，盖下去时自动在外轮廓加 1 像素描边；`remap` 整体换色；抖动 `dith / thin / vramp / hramp / radial`；时间工具 `seg / ease / back / hop / bt / sbeat / pulse / beatPulse / hash / lcg` |
| `frame.js` | 每帧流程：逐个镜头画好 → 调色 → 转场混合 → 放大 → 歌词层。`POST.grade / fade / shake / vig / zoom / overlay`；`?size=1920x1440` 时画布变成 480×360（封面用） |
| `timeline.js` | `shots([[t0, fn, { tr, d }], ...])`、`LOOPS` |
| `pxlyrics.js` `font_data.js` | 像素歌词和片头字幕（读 `music.js` 里的 `LY`、`CREDITS`）；`pxText(字, x, y, 颜色, { scale, ol, reveal })` 把字写进画面（`reveal` 做手写效果），`pxTextWidth`；`?ly=none` 关掉歌词 |
| `cast_body.js` `cast_head.js` | 提线木偶人物 `person(x, y, 角色, o)`，`her()` / `him()`。o 的参数：`view`（front 正面 / side 侧面 / back 背面）、`dir`（朝向）、`pose`（stand 站 / walk 走 / sit 坐 / piano 弹琴）、`ph`（走路相位）、`seat`（座高）、`outfit`（spring 春 / summer 夏 / winter 冬）、`scarf`（围巾）、`arms`（手臂两段角度）、`ex`（表情：n 平常 / smile 笑 / laugh 大笑 / sad 难过 / cry 哭 / teary 含泪笑 / shock 吃惊 / closed 闭眼 / talk 说话 / tense 抿嘴）、`look`（眼睛看向）、`blush`（脸红）、`tear`（眼泪）、`hold`（手里拿的东西）、`alpha`（半透明）、`wind`（围巾飘）。返回头和手的坐标。眨眼是自动的 |
| `props.js` | 车站钢琴 `piano()`（侧面贴便利贴）、琴凳、琴键特写 `keyboard()`、大手 `bigHand()`；那张**没写完的谱子** `songSheet()`（写到哪、播放游标、涂鸦）；手机 `phone()` 加图标（信封、车票、笑脸、头像、拨号键、打字横线）；车票、雨伞、行李箱、杯子、挂钟、爱心、音符、闪光、灯泡、纸团、哈气；路人 `npc(x, y, 种子)`（随机长相） |
| `world.js` | `sky`（夜、白天、春、夕阳、黎明、雨天、雪天、傍晚）、`stars`、`moon`、`snow`、`rain`、`rainGlass`（玻璃上的雨痕）、`sea`、`city`；车站大厅 `stationHall`（拱窗、吊灯、钟、发车牌、长椅、钢琴，`mood` 换季节和时间，`warm` 控制灯亮，`cam` 平移）；站台 `platform`、火车 `train`、车厢内 `trainInside`；他家 `hisRoom`、她的公寓 `herRoom` |
| `scenes/common.js` | `zoom / zoomTo`（像素镜头）、`grade`、`memory`（回忆滤镜：旧照片色加暗角）、`shake`、`walk`（走位）、`twitch`（手抖） |
| `scenes/demo.js` | 13 秒示例：片名弹出的夜车 → 走进车站大厅 → 钢琴视角四手联弹；加上 4:3 封面 `LOOPS.cover` |
| `sheet.js` | 各种设定图 loop |
| `tools/pixel_font.py` | 生成字体子集和嵌入用的 data URL |
| `tools/shots.cjs` | 不开浏览器列出镜头表 |

整部片的写法（47 个镜头、四章、开头片名、重逢结局）可以参考 `~/project/testt/videos/xiebuwan-mv`。那些镜头是那首歌专用的，没收进来。

## 画像素时踩过的坑

- **镜头放大倍数不是整数时，像素大小会不均匀**。静止画面一律用 2、3、4 倍；用 `zoomTo` 推拉时允许中间值，落定后要回到整数。
- **小人只有一个尺寸，大约 54 像素高**。近景靠镜头放大，不要把人物本身画大，否则同一画面里会出现两种大小的像素。
- **俯拍桌面时，手和纸的比例要对**。手画小了像戴手套，画大了会把谱子盖住。写字的手要画成握拳的样子，笔尖落在音符上，袖子从画面边缘伸进来（`ch_a` 的 `A_writingHand`）。
- **人群变灰不要按亮度换成灰色**：脸是浅灰、眼睛是黑点，看着像僵尸。正确做法是先把大厅压暗成几种夜蓝，路人画成没有五官的平涂剪影，只给主角留颜色。
- **俯拍躺着的人**，头发不要画成放射状的发束，看起来像齿轮。画成平铺的一整片，手机放在脸旁边，屏幕的光只照半边脸。
- 小人**不能单独转头，也不能弯腰或蹲下**。要转头，就在画好的人身上再盖画一个 `head()`；蹲下只能拿坐姿凑合。正面视角下，手要举到耳边，角度得写成 `l/r: [100, 118]` 这种。
- **公共家具一定要配一个坐着的人试一下**。她房间的书桌原来高 44 像素，人坐着根本够不到桌面，后来改成 24。
- `dip` 转场会把**上一个镜头的最后 d 秒也压暗**；`iris` 的圆心用的是放大后的屏幕坐标。
- 公共的 `train()` 车门窗只有 4 像素宽，隔着玻璃看不见脸。车门内外的戏要另外画一扇大门。
- 浏览器播放时，片名这种每帧都要描边写字的镜头，一帧要画 100～180 毫秒，看起来会有点卡。成片是逐帧渲染的，不受影响。
