# 漫画画风：黑白漫画 + 一抹红

来自《坏女孩 · 漫画版》（2026-10）。纯 2D canvas，不用 p5 / WebGL，没有显卡也快：本机每帧多在 0.1 秒以内，云端 20 台机器 3 分钟出完一条一分钟的片。

- **适合**：真人比例的动漫人物、讲故事的 MV、要用分格 / 网点 / 集中线这些漫画手法的片子。用户要"真人形象"时就用这套画，**不用生图**（用户原话："不需要用生图吧，真人形象的卡通或者动漫风"）。
- **不适合**：要水彩质感、要 Clawd 这种圆滚滚卡通角色的片子，那些用根目录的水彩引擎（`ANIMATION_GUIDE.md`）。

## 先跑起来（在资源库根目录）

```bash
node render.mjs --page=manga/studio.html --sheet=0.6,2.2,3.6,4.9,6.6,8.8 --cols=3 --out=out/check/manga_demo.jpg   # 示例缩略图
node render.mjs --page=manga/studio.html --loop=lookbook --size=3840x2160 --stills=0.4 --out=out/check/lookbook    # 角色设定页
node render.mjs --page=manga/studio.html --loop=faces --size=2880x2700 --stills=0.5 --out=out/check/faces         # 表情表
node render.mjs --page=manga/studio.html --clip --out=out/manga_demo.mp4                                          # 10 秒示例片
```

在浏览器里拖时间轴：直接打开 `manga/studio.html`，加 `?t=3.6` 跳到某一秒，加 `?loop=faces`、`?loop=cast`、`?loop=lookbook` 看设定图。

## 开新项目

```bash
B=~/project/testt/videos/ClaudeAnimationBase; P=~/project/testt/videos/新项目名
mkdir -p $P/assets $P/fonts $P/work/{analysis,secrets} $P/out/check $P/.github/workflows
cp -r $B/manga/studio.html $B/manga/src $P/ && rm $P/src/scenes/demo.js
cp -r $B/{render.mjs,package.json,package-lock.json,node_modules} $P/
cp $B/LICENSE $P/LICENSE-ClaudeAnimationBase; cp $B/tools/ci/render.yml $P/.github/workflows/
```

然后：
1. `studio.html` 里把 `src/scenes/demo.js` 那一行换成自己的章节文件（`ch1_xxx.js`……）。
2. `src/config.js` 填 `duration / bpm / offset / audio`，`src/music.js` 填镜头切点 `S`、大节点 `HIT`、歌词 `LY`（数字都从 `work/analysis/timing.json` 来）。
3. 有歌词就生成字幕字体（云端机器没有中文字体）：`work/.venv/bin/python -I $B/tools/lyrics/caption_font.py work/analysis/timing.json fonts/caption.otf`，片名等额外的字用 `--extra` 加。
4. 封面写成 `LOOPS.cover`，示例见 `~/project/testt/videos/huainvhai-manga-mv/src/cover.js`。

## 文件和主要函数

| 文件 | 内容 |
|---|---|
| `ink.js` | 画布、相机 `camBegin / camEnd`，时间工具 `seg / ease / kf / spring / pulse`，G 笔线 `pen()`，闭合描边 `loop()`，带描边的形状 `shape()`（`fill` 可以写 `'tone:0.3'` 表示网点），网点渐变 `toneGrad`，排线 `hatch`，整体淡入淡出的图层 `layer()`，`snap()`。颜色 `INK / PAPER / RED / WHITE` |
| `mfx.js` | 光 `glowW / beam`（叠加，只在暗底上看得见），`flashScreen / fillScreen`，集中线 `focusLines`，速度线 `speedLines`，少女漫画闪光 `sparkle`，泡泡 `bubbles`，雨 `rain`，石化裂纹 `cracks`，墨团 `inkBlob`，分格 `panel()`（`slam` 砸入），`page()` 铺纸 |
| `frame.js` | 每帧流程；`POST.invert` 黑白反转（频闪，红色不变），`POST.overlay` 字幕叠层；纸纹和印刷颗粒 |
| `timeline.js` `music.js` | `shots()`、`LOOPS`；`bt / sbeat / kick / clap / S / HIT / LY` |
| `karaoke.js` | 漫画旁白框字幕：白底黑框，每个字唱到时从灰变黑 |
| `face.js` | `head(x, y, s, spec, ex, o)`：正面、3/4、侧脸、背面；表情 `eyes / mouth / brow / blush / tears / cry / sweat`，妆 `liner / smoky / lips` |
| `hair.js` `hair2.js` | 发型：用一片片发束 `lock()` 拼出漫画头发，天使环 `sheen`；6 套现成发型、红发绳 `hairTie`（可以绷断） |
| `body.js` `outfit.js` | `person(x, y, s, spec, P, o)` 画出一整个人：身体朝向 `v`，头朝向 `hv`，背面 `rear`，侧脸 `side`，倾斜 `lean`，手臂 `aR / aL`，腿 `lR / lL`，手型 `hR / hL`（open / fist / point / relax / hold / peace），表情 `ex`；`o.holdR / holdL` 往手里放东西；`LASTP` 记下头和手画在哪 |
| `cast.js` | 6 个现成角色（见下） |
| `props.js` | 2009 年的东西：耳机线、大头贴、汽水瓶、衬衫、CRT 显示器、跳舞机、QQ 窗口、诺基亚滑盖、撕页日历、口红、卷发棒、骰盅、啤酒罐和瓶、带唇印的杯子、霓虹灯、IC 卡电话键盘 |
| `world.js` | 小城夜景和清晨：天空、天际线、街道、路灯、小卖部、电线杆，整个街角 `corner()`；溜冰场、迪斯科球、网吧、卧室、迪吧外墙和门、舞池（人群跟着拍子跳）、吧台、卡座沙发 |
| `sheet.js` | 设定图 `LOOPS.faces / cast / lookbook` |
| `scenes/common.js` | `cam()`（每个底鼓轻轻一顿），翻页 `pageTurn`，撕页 `tearOff`，墨水淹没 `inkFlood`，雨滴涟漪 `ripples`，斜格缝 `gutter`，双格 `split2`，频闪 `strobe`，走路 `walkPose`，舞池人影 `fig`，"!" `bang`，汗滴 `sweat`，闪光爆开 `sparkleBurst` |
| `scenes/demo.js` | 10 秒示例：雨夜等人 → 翻页、他跑来、脸部特写格砸入 → 少女漫画特写 → 舞池频闪 → 撕页到清晨、斜格缝分开两人、墨水淹没 |

## 现成角色（《坏女孩 · 漫画版》）

| 名字 | 是谁 |
|---|---|
| `LU` | 小鹿·从前：黑长直、齐刘海、低马尾系红发绳、白连衣裙。`{ ...LU, name: 'x', tie: false }` 是散着头发、没有发绳的版本 |
| `LU_BAD` | 小鹿·后来：大波浪、猫眼眼线、红唇、黑吊带裙、项圈 |
| `FEI` | 阿飞·从前：浅色染发，斜刘海遮右眼，耳钉、黑夹克、MP3 耳机 |
| `FEI_NEW` | 阿飞·结尾：短发、白衬衫 |
| `QUEEN` | 溜冰场女王：黑波波头、烟熏眼、黑唇、大耳环、泡泡糖、旱冰鞋 |
| `STRANGER` | 陌生人：寸头、皮夹克、金链子（脸通常被格子切掉） |

新角色要写一个新的 `HAIR_` 和 `OUT_`，再在 `cast.js` 里加一个 spec（做法见 `cast.js` 开头的注释）。写镜头之前先出 lookbook 给用户看。

## 规矩和坑（《坏女孩 · 漫画版》踩过的）

- 每一帧都只由时间 t 算出来：帧会乱序、并行渲染，不能把状态留到下一帧。每个独立的元素画之前调用 `boilSeed('名字')`，线条每秒抖 12 次。
- 网点贴在**屏幕**上，不跟着相机走（真印刷的网点也是这样），所以推镜头时网点不会游动。
- 光（`glowW`、`beam`）是叠加上去的，只在黑底上看得见；白底上要变亮，就把网点调淡。
- 红色（`RED`）只给一个人或一件东西。整片只有那一抹红，它才有分量。
- **镜像的人物（`v < 0`）**，`lean` 和 `tilt` 的方向很容易判断反，写完一定出大图核对。
- 黑底页面上格缝看不见：先 `page()` 铺纸再画格子，或者格子之间留出白边。
- 远景里人物容易太小（街口、溜冰场全景）：人至少占画面高度的一半，不然就配一个特写格。
- 手画小了会像一摞白条：手要入镜的镜头把人物放大，或者用拳头、握东西这类简单的手型。
- 排线和网点在同一块地方叠太密，画面会花：一个区域只用一种。
- 陌生人不画脸（被格子切掉或背光成剪影），观众的注意力留给主角。
- 字幕只有在 `music.js` 里有 `LY` 时才出现；本机没有 `fonts/caption.otf` 会退回系统的思源宋体，云端则会显示成方块，所以字体子集要生成并提交（思源宋体是 SIL OFL 授权）。
