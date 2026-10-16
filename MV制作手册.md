# MV 制作手册（卡点动画）

**开新片之前先把这份读完。** 内容来自六条片子：《中华五千年》线稿动画、《电击小子》、《把回忆拼好给你》拼图版和 Clawd 版、《坏女孩》Clawd 版和漫画版，包括做法、哪些受欢迎、哪些不受欢迎，以及踩过的坑。画面怎么画、引擎怎么用：水彩 Clawd 见同目录的 `ANIMATION_GUIDE.md`，黑白漫画见 `manga/README.md`，歌词字幕的三种动效样式见 `lyricfx/README.md`，以前片子里的现成场景道具见 `extras/README.md`。

资源库在 `~/project/testt/videos/ClaudeAnimationBase`（备份在私有仓库 https://github.com/a3339530357/ClaudeAnimationBase）。下面命令里的 `tools/...` 都是资源库里的脚本，在项目目录里运行时写成 `$B/tools/...`，其中 `B=~/project/testt/videos/ClaudeAnimationBase`。

---

## 0. 一页速查

| 步骤 | 做什么 | 交付 / 停下来 |
|---|---|---|
| 1 | 从视频里提取音乐 | |
| 2 | 量拍子、找卡点；歌词用**逐字识别**拿时间（不抄字幕）→ `timing.json` | |
| 3 | 出**对拍视频** | ✋ 给用户看，确认卡点准 |
| 4 | **两轮提问**定方向（每题带推荐项） | ✋ 用户选 |
| 5 | 写分镜 `STORYBOARD.md`，每个动作标第几拍 | ✋ 用户过目 |
| 6 | 画**角色设定图**（换造型的、小配件出特写） | ✋ 用户看过再写代码 |
| 7 | 一口气写完全部镜头，只做**一次整体检查**（缩略图） | |
| 8 | 上云渲染 → 下载 → 抽帧检查 → 报告 | ✋ 上云前先问 |
| 9 | 出**封面**：只出一张 4:3（1920×1440） | ✋ 给用户看 |

✋ = 停下来，等用户。其余步骤直接往下做，不用每步都问。

---

## 1. 提取音乐

```bash
ffmpeg -i 原视频.mp4 -vn -c:a copy music.m4a          # 流拷贝，不损失音质
ffmpeg -i 原视频.mp4 -vn -c:a libmp3lame -q:a 2 music.mp3   # 要 mp3 时
```

## 2. 音乐分析：拍网格、卡点、歌词时间

Python 环境一律用 uv（系统的 `python3 -m venv` 会失败）：

```bash
uv venv work/.venv && uv pip install --python work/.venv/bin/python librosa numpy pillow
```

**拍网格**（`tools/music/beatgrid.py`）：

```bash
work/.venv/bin/python -I tools/music/beatgrid.py assets/music.m4a --drums 0:17,31:57 --out work/analysis/timing.json
```

- 输出 `第 n 拍 = offset + n × period`，`n % 4 == 0` 是小节第一拍。之后分镜和代码里的拍号都用这套编号。
- `--drums` 填**有鼓的时间段**。鼓撤掉的间奏会把拟合带偏，所以第一次可以不填，看完能量表再补上重跑。
- "候选卡点"只是候选，鼓撤、爆发、重击一定要**用耳朵核对**（对拍视频就是用来核对的）。
- 加速过的版本（DJ 版、1.1 倍速）BPM 不是整数很正常。比如 128 BPM 加速 1.1 倍，实测是 140.63 BPM。

**歌词**：文字以用户给的为准。**时间不能照抄原视频的烧录字幕**：字幕本身常常偏晚，《坏女孩》实测平均比实际开唱晚 0.56 秒（0.25～0.99），导歌、副歌提前 2～3 拍抢进来唱的句子最严重；而且句内是匀速分配的，每个字还差 0.3 秒左右。照它卡点，整片会一直慢半拍。

**首选：逐字识别（《坏女孩》验证过）**，拿到每个字的开始和结束时间：

1. Demucs 把人声单独分离出来（`sep_vocals.py`）。
2. 人声交给火山"录音文件识别标准版"（`volc.seedasr.auc`，新版控制台 API Key，音频 base64 直传，不用公网地址）。**一定要把歌词原文作为参考传进去**：`volc_asr.py --lang zh-CN --ctx 歌词.txt`。传了歌词，错字从 8 个降到 1 个；加热词、开 enable_music_fc 反而错得更多，别加。
3. 对回用户给的歌词（`align_lyrics.py`）：认错的字按位置借时间，多出的语气词丢掉，漏掉的字插值。
4. 用人声响度补上句尾长音（`hold_tails.py`）。

脚本在 `tools/lyrics/`，用法写在每个脚本开头。火山语音的 Key 文件在 `~/project/testt/videos/huainvhai-mv/work/secrets/volc_speech_key.txt`，拷到新项目的 `work/secrets/`（不进 git）。歌词存成 `歌词.txt`，一行一句。

```bash
# 人声分离：单独一个约 1.3 GB 的环境，装法见 sep_vocals.py 开头
work/.venv-sep/bin/python -I tools/lyrics/sep_vocals.py assets/music.m4a work/lyrics/vocals.wav
ffmpeg -i work/lyrics/vocals.wav -ac 1 -ar 16000 -c:a pcm_s16le work/lyrics/vocals16k.wav
# 识别两次：带歌词的用来对字，不带歌词的用来判断长音（带了歌词会把语气词抹掉）
python3 -I tools/lyrics/volc_asr.py work/secrets/volc_speech_key.txt work/lyrics/vocals16k.wav work/lyrics/asr_ctx.json --lang zh-CN --ctx 歌词.txt
python3 -I tools/lyrics/volc_asr.py work/secrets/volc_speech_key.txt work/lyrics/vocals16k.wav work/lyrics/asr_plain.json --lang zh-CN
python3 -I tools/lyrics/align_lyrics.py work/lyrics/asr_ctx.json work/analysis/timing.json --lyrics 歌词.txt
work/.venv/bin/python -I tools/lyrics/hold_tails.py work/lyrics/vocals16k.wav work/analysis/timing.json work/lyrics/asr_plain.json --write
```

这套流程用《坏女孩》的原始数据重跑过，结果和成片里用的逐字时间完全一致。

**识别中途"放弃"时**（《把回忆拼好给你》DJ 版遇到过）：整首送进去，它只认出前 17 秒，后面几乎是空的。办法是按段落切开（`ffmpeg -ss 起 -to 止`），每段只配那几句歌词单独识别，再把时间加回切段起点、拼成一份。几个要注意的地方：
- 切段开头认出来的第一个字常常是上一句的拖音，要对一下人声响度再决定。
- 一句末尾的字没认出来时，`align_lyrics.py` 可能把它们算到下一句开头，要看一眼每句的首尾时间。
- DJ 版的副歌可能整段换成了英文采样：原曲和人声都只认出英文，那就是真的没唱中文。这几句只能沿用字幕时间，要告诉用户。识别出的开唱时间和频谱人工判读只差 0～0.1 秒。火山的"自动字幕打轴"（传歌词做强制对齐）在新版控制台找不到，别指望。

**备用：读烧录字幕断句**（`tools/music/subs_white.py`），只在识别用不了时拿来粗定位：

```bash
ffmpeg -ss 10 -i 原视频.mp4 -frames:v 1 work/analysis/peek.png        # 先看字幕在画面哪一条
work/.venv/bin/python -I tools/music/subs_white.py 原视频.mp4 --y0 595 --h 115 --start 10 --png work/analysis/subs.png
```

- 它不认字，只断句：输出每句的开始和结束时间，再把文字换成用户给的歌词。结果要按上面说的偏晚来修正。
- 录屏类视频底下有白色工具栏时，用 `--start` 指定从字幕出现后开始统计，常驻的白色会被自动扣掉。
- 歌词网站的 API（LRCLIB 等）对变速版、剪辑版不准，别用。

把歌词补进 `timing.json` 的 `lyrics: [[开始, 结束, "歌词"(, [[字开始, 字结束], ...])], ...]`（第 4 项逐字时间可选，`make_check.py` 有就按字点亮），项目里的 `src/music.js` 照着写：`bt(n)`、`sbeat(t)`、`HIT{...}`（各个大节点）、`LY`（歌词）。

## 3. 对拍视频（写代码前必做）

```bash
work/.venv/bin/python -I tools/music/make_check.py work/analysis/timing.json assets/music.m4a out/check [work/check/plan.json]
```

- 出两条视频：**带节拍器**的用来检查拍子准不准，**只有原曲**的用来感受节奏。
- 画面元素：每个镜头一块底色，每拍左上角闪一下，大卡点全屏闪白加提示音，小卡点出黄框，蓄力段有进度条，歌词按卡拉OK方式点亮，每帧有时间码。
- `plan.json` 写分镜的镜头、段落和卡点（格式见脚本开头）；不给就按每 8 拍一块。
- **用户对这一步评价很高**（"做的非常非常好"）。代价最小，能最早发现卡点不准。

## 4. 头脑风暴：两轮提问

每题 2～4 个选项，**第一个是推荐项并标"（推荐）"**，带一句说明。一轮最多 4 题。

**第一轮：大方向**
1. 故事：比如暗恋告白 / 友情离别 / 反差搞笑 / 不讲故事的舞台 MV
2. 画风：水彩手绘 Clawd（引擎现成，表情最多）/ 黑白漫画 + 一抹红（真人比例的动漫人物，`manga/`）/ 像素 / 扁平卡通。用户要"真人形象"时就用漫画引擎画动漫风，**不用生图**
3. 道具主线：拿什么东西把整片串起来（拍立得、信、玻璃瓶……）
4. 卡点密度：叙事为主、大节点重卡（推荐）/ 每拍都动 / 前松后紧

**第二轮：角色和结局**
1. 另一个角色长什么样（给具体颜色和配饰）
2. 主角性格（害羞笨拙 / 元气 / 表面淡定内心戏多）。**这一题决定角色有没有特点**
3. 结局：反转 / 圆满 / 开放
4. 世界：一个统一的地方（海边小镇、校园……），每个镜头在其中换一个地点

## 5. 分镜

`STORYBOARD.md` 的结构：
- 一句话梗概；角色（外形和性格）；世界和**颜色变化**（比如黄昏 → 深夜 → 黎明 → 白天 → 又一个黄昏）；道具主线；伏笔和回收。
- 按段落分表，列：`# | 时间 | 歌词 | 地点 | 发生了什么 | 卡点（第几拍）`。
- 最后列出每个镜头接缝用什么转场，转场不要重样。

**分镜检查清单**
- [ ] 每个镜头都有一件事发生（有因有果），不是角色站着卖萌
- [ ] 每镜换地点，但有一条线串起来（道具、颜色、同一个世界）
- [ ] 鼓撤、爆发、结尾重击这些大节点配大动作或换场
- [ ] 前面埋的东西后面有交代；结尾和开头呼应（同一个地方，变了的状态）
- [ ] **结尾留出看清的时间**：最后一个画面至少停 1.5 秒；音乐太短就在音乐后补静音（`config.js` 的 duration 比音乐长，云端流程会自动补）
- [ ] 卡拉OK字幕占着画面底部（y > 950），关键画面别放在那里
- [ ] 除了歌词和片名，画面里不要有字

## 6. 角色设定图（写镜头代码前做）

用一张图把主角和配角的几种表情、几个关键姿势、主要道具都画出来，给用户看。示例在 `src/cast_tao.js` 末尾的 `LOOPS.cast`：

```bash
node render.mjs --loop=cast --sheet=0.3 --cols=1 --w=1920 --out=out/check/cast.jpg
```

漫画画风的设定页：`node render.mjs --loop=lookbook --size=3840x2160 --stills=0.4 --out=out/check/lookbook`（写法见 `manga/src/sheet.js`）。

Clawd 版就是在这一步拿了 10 分。新角色画得好、用户说要通用的，做完后**加回这个资源库**。

**角色变化（变坏、长大、换装）靠换零件，不用新做一个角色。** 《坏女孩》里变坏的小桃只换了三样：眼睛（杏仁眼 + 长眼线）、嘴（红唇）、蝴蝶结（红色大蝴蝶结换成黑色小的），身体、颜色、动作全部照用，观众一眼认得出是同一个人。做法是在项目里包一层 `eyes / mouth / hat`，加上新的名字，见 `~/project/testt/videos/huainvhai-mv/src/cast_bad.js`。造型可以出两三版让用户挑。

**小配件要单独放大给用户看清楚。** 设定图除了全身表情，再出一张道具图、一张造型特写（《坏女孩》出了 cast / props / looks 三张）。全身图里配件太小，丑不丑看不出来：第一版黑蝴蝶结就是因为丑被用户删掉的。

## 7. 写代码

**新项目**（下面是水彩 Clawd；黑白漫画的拷法见 `manga/README.md`）：

```bash
B=~/project/testt/videos/ClaudeAnimationBase; P=~/project/testt/videos/新项目名
mkdir -p $P/src/scenes $P/assets $P/work/{analysis,secrets} $P/out/check $P/.github/workflows
cp -r $B/{ANIMATION_GUIDE.md,docs,fonts,lyricfx,package.json,package-lock.json,render.mjs,studio.html,node_modules} $P/
cp $B/LICENSE $P/LICENSE-ClaudeAnimationBase; cp $B/src/*.js $P/src/; cp $B/tools/ci/render.yml $P/.github/workflows/
```

然后在 `studio.html` 里把 `src/scenes/demo.js` 那一行换成自己的章节文件，音乐拷到 `assets/`。

**文件怎么分**（每个文件不要太大，按章节分段写）：
- `src/config.js`：`PROJECT = { duration, bpm, offset, audio }`
- `src/music.js`：`bt / sbeat / HIT / LY`
- `src/cast_*.js`：角色和道具；`src/world.js`：场景和配色；`src/scenes/common.js`：转场和共用的小工具
- `src/scenes/ch1_xxx.js`…：每章 4～6 个镜头，每个文件结尾调用 `shots([[开始时间, 函数, 镜头号], ...])`
- `studio.html` 里脚本的顺序：config → core → clawd → music → fx → karaoke → cast_heroes/robots → timeline → **cast_tao（要用 timeline 里的 LOOPS）** → world → 其他 → scenes（漫画版的顺序见 `manga/studio.html`）

**歌词字幕**：默认的字幕（水彩版是墨块加黄字，漫画版是旁白框）偏安静。用户更喜欢动效强、看得清的字幕，所以**新片默认从 `lyricfx/` 的三种样式里挑**：纸条贴字 `slip`、大字蹦出 `pop`、动态排版 `kinetic`，也可以混搭（比如主歌纸条、副歌动态排版）。在 `music.js` 的 `LY` 旁边加一行 `const LYRIC_FX = { style: 'slip' }` 就能换。动态排版要按镜头一句句摆位置，摆法见 `lyricfx/README.md`。拿不准选哪种时，先出三种的对比小样给用户挑。

**每个镜头函数的写法**：先在注释里写清这一镜观众要依次看懂的几件事（reads）和时间，再写代码。表情变化用 `emotions()`（小桃用 `temo()`），转身用 `turn()`，走路用 `stroll()`，跳用 `jump()`。拿东西用手臂钩子 `armL / armR`，挂在身上的用 `draw`。

**检查只做一次整体的**（用户说过"直接全写完，不需要慢慢检查"）：

```bash
node render.mjs --sheet=1,3.5,5.1,... --cols=6 --w=320 --out=out/check/all.jpg     # 每镜挑 1～2 个关键时刻
node render.mjs --sheet=5.6,12.5 --cols=2 --w=960 --out=out/check/big.jpg          # 关键镜头出大图看细节
```

在缩略图里看起来没问题，大图里常常能看出挡脸、穿帮、角色太小。改完再看一遍改过的那几镜就够了。

**性能**：水彩版本地 4060 每帧 0.1～1.7 秒正常；漫画版每帧多在 0.1 秒以内。照片、角色这些东西一多就慢，比如一叠照片只给最上面那张画内容。

## 8. 上云渲染

**上云之前要先问用户**（同意只算这一次）。用户选过公开仓库，因为 Actions 免费；以后默认推荐公开仓库，但还是要问。

```bash
# 原曲加密：仓库里只放 .gpg，口令文件不进 git
head -c 24 /dev/urandom | base64 > work/secrets/music_key.txt
gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file work/secrets/music_key.txt -o assets/music.m4a.gpg assets/music.m4a
# .gitignore 里要有：node_modules  out/  assets/*.m4a  assets/*.mp3  work/secrets/  work/.venv/  以及原视频截图
git init && git add -A && git commit -m "第一版"
gh repo create a3339530357/<仓库名> --public --source . --remote origin --push
gh secret set MUSIC_KEY -R a3339530357/<仓库名> < work/secrets/music_key.txt
gh workflow run render.yml -R a3339530357/<仓库名> -f segments=20        # 只渲一段：-f range=30:33 -f segments=3
gh run watch <run id> -R a3339530357/<仓库名> --exit-status
gh run download <run id> -R a3339530357/<仓库名> -n video -D out/final
```

**出片后检查**：
```bash
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration,size -of compact out/final/*.mp4
ffmpeg -i out/final/*.mp4 -af volumedetect -vn -f null - 2>&1 | grep mean_volume        # 响度应与原曲一致
# 抽 20 帧拼一张图，和本地预览对照
```

20 台机器并行时，一条一分钟的片子大约 3～5 分钟出片。成片在 Actions 那次运行的 Artifacts 里，保留 14 天。**公开仓库的成片任何登录 GitHub 的人都能下载（含原曲）**，报告时提醒用户。

## 9. 封面

封面也是交付物，成片之后做。**只出一张 4:3（1920×1440）**，竖版、16:9 这些别的比例都不用出。单张图在本地出就行，不用上云。

- **只放歌名**，不放歌词句子。
- 角色用**最有辨识度的原本形象**：《坏女孩》封面里的小桃是变坏之前的样子（红色大蝴蝶结、眯眼笑、腮红），Clawd 不戴墨镜，脸不要被道具挡住。
- 一张图看出故事：两人牵着钳子站在聚光灯下，身后巨大的霓虹爱心右半边已经熄灭。

写成一个 `LOOPS.cover`，示例见 `~/project/testt/videos/huainvhai-mv/src/cover.js`（水彩）和 `~/project/testt/videos/huainvhai-manga-mv/src/cover.js`（漫画：一张脸从中间撕开，左边从前、右边后来）。资源库的 `render.mjs`、`core.js` 和漫画版 `ink.js` 都支持 `--size`：

```bash
node render.mjs --loop=cover --size=1920x1440 --stills=1 --out=out/cover/q
cp out/cover/q/t1_00.png out/cover/歌名_封面_4比3.png
ffmpeg -i out/cover/q/t1_00.png -q:v 2 out/cover/歌名_封面_4比3.jpg
```

---

## 10. 创作经验：哪些受欢迎，哪些不受欢迎

| 做法 | 用户反应 | 结论 |
|---|---|---|
| 拼图版：剪影人物 + 整个画面做成拼图 | "质量很好，但不是我喜欢的类型：人物没特点，拼图背景观感不佳" | **花哨的画面手法比不上有性格的角色** |
| Clawd 版：害羞笨拙的 Clawd + 粉色戴蝴蝶结的小桃，先给设定图 | 10 分满分，要求把小桃加进资源库 | 角色要有脸、有表情、有性格；先给用户看角色 |
| 电击小子：21 个镜头大多在同一个屋顶上 | "场景变换太少" | 每个镜头换一个地方 |
| 拍立得当道具主线，快门闪光正好落在拍子上 | 喜欢 | 道具本身就是卡点，故事和音乐一下就对上 |
| 写代码前先出对拍视频 | "做的非常非常好" | 每条片子都先做这一步 |
| 拼图版标题在最后一下才拼好，紧接着就结束了 | （我自己发现的问题） | 结尾要留时间，音乐不够长就补静音 |
| 结尾反转（她也在偷拍他），前面埋 3 个线索 | 喜欢 | 前面埋伏笔、结尾回收，有惊喜 |
| 漫画版：用户要"真人形象"，我先去查生图模型 | "不需要用生图吧，真人形象的卡通或者动漫风" | 真人形象也用代码画成动漫风，不找生图 |
| 漫画版：同一首歌换一个完全不同的故事和画风（换人、换比喻），先出 lookbook 设定页 | "很好，继续" | 第二版就要彻底换掉，设定页这一步保留 |
| 线稿版：细的手写字（龙藏体）放在画面底部，跟着唱一个个写出来 | "有点看不清，能弄成动效比较强的歌词字幕效果吗" | 字幕要有底或粗描边；整句要有时间读完 |
| 三种动效字幕（纸条、大字蹦出、动态排版），各出一段对比小样给用户挑 | "这三个格式都超级好"，要求收进资源库 | 收进了 `lyricfx/`；以后新片默认从这三种里挑 |

## 11. 技术坑速查

| 现象 | 原因 / 解法 |
|---|---|
| WSL 里 Chrome 不用显卡，渲染很慢 | `render.mjs` 已经处理（d3d12 驱动 + Playwright 的 chrome-headless-shell） |
| 云端没有显卡，水彩填色极慢 | 渲染时加 `--ci`：用 llvmpipe 跑 WebGL，并加 `--disable-accelerated-2d-canvas`。真显卡上别开 |
| 静止的线条一直抖 | 每个元素画之前调用 `boilSeed('名字')`；`clawd()` 自己会处理 |
| 换表情时小桃闪成橘色 | `emotions()` 默认按 Clawd 的颜色过渡，小桃要用 `temo()`/`tfeel()` |
| 镜头快速横扫时画面边缘露出白纸 | 背景画得比画面宽很多（天空、海、墙都铺到 -2400～W+2400） |
| 视频比音乐长，合成后被截短 | 云端流程用 `-af apad` 给音轨补静音（模板已改好） |
| 新仓库里 render 流程不出现 | 推送时修改 workflow 文件会触发一次 push，GitHub 才会登记（模板里有 `push: paths`） |
| 绕着脚旋转 90° 的"倒下"像竖着站 | 扑倒用压扁（`sq`）加一点倾斜，别整个转 90° |
| 一叠照片很耗时 | 只有最上面一张画内容 |
| `LOOPS is not defined` | 用到 `LOOPS` 的文件要放在 `timeline.js` 之后加载 |
| 第一帧计时偏快 | 计时不等显卡做完；要准的话用 `gl.readPixels` 读 1 个像素强制同步 |
| 云端渲染的水彩画面暗处有细线框 | ubuntu-24.04 的旧 Mesa 在水彩晕染的矩形边界画线；模板已改用 `ubuntu-26.04` |
| 云端字幕变成方块 | 云端机器没有中文字体：水彩版用 `fonts/` 里的字体；漫画版用 `tools/lyrics/caption_font.py` 生成歌词用字的子集 `fonts/caption.otf` |
| 漫画版镜像人物（`v < 0`）往反方向倒 | 镜像后 `lean / tilt` 的方向跟着翻，写完出大图核对 |
| 漫画版远景人物太小、手像一摞白条、排线太密 | 见 `manga/README.md` 最后一节 |
| 手写字体把简体字画成繁体（龙藏体的"时"画成"時"） | 换字幕字体前，先用 `fontTools` 查歌词用字在 cmap 里有没有，再出大图逐字看字形；个别字换成别的字体 |
| 动态排版的字压在人脸、拟声字上 | 先截每句开头、中间、结尾三帧不带字幕的画面找空白处（`LYRIC_FX = { style: 'none' }`），再写 `layout`，见 `lyricfx/README.md` |

## 12. 资源库里有什么

**两套画风**：根目录是水彩 Clawd（p5.brush，要显卡才快），`manga/` 是黑白漫画 + 一抹红（纯 2D canvas，没显卡也快）。另外两种画风（剪影拼图、SVG 线稿）没收进来，在哪见 `extras/README.md` 最后一节。

**水彩 Clawd**
- **角色**：`clawd()`（31 种表情、5 个视角、各种眼睛、嘴、帽子、头顶符号、舞步），见 `ANIMATION_GUIDE.md`。
  - **小桃**：`tao() / tfeel() / temo()`，`cast_tao.js`
  - 电击小子造型 `electro()`、小卡 `kaka()`、小猫 `kitten()`：`cast_heroes.js`
  - 坏蛋机器人 `villain()`、小机器 `minion()`：`cast_robots.js`
- **道具**：拍立得 `polaCam()`，三种拿法 `camShoot()`（侧面举到眼前）、`camRaise()`（单手举起，自拍）、`camHang()`（挂在胸前）；照片 `polaroid()`（可显影、可写标题）；邮筒 `postbox()`；蚱蜢 `grasshopper()`；帽子新增 `bigbow`（小桃的蝴蝶结）、`electro`、`chef`。
- **特效**（`fx.js`）：`kick / shakes / punch`（震动、推镜），`impactFrame`（反色冲击帧），`monoFrame`，`bolt`（闪电），`speedLines`（集中线），`shockRing`（冲击波），`dust`（烟尘）。另外还有 `brushWipe`（timeline.js），以及 `iris / flash / glow`（core.js）。
- **字幕**：`karaoke.js`，读 `music.js` 里的 `LY`，没有 `LY` 就不显示；有逐字时间就每个字唱到才点亮。加了 `LYRIC_FX` 就换成 `lyricfx/` 的样式（见下面）。
- **现成场景和道具**（`extras/`）：Clawd 版《坏女孩》的霓虹夜城、酒吧、变坏的小桃、手机和酒杯；Clawd 版拼回忆的海边小镇（五个时段配色）、照片里的迷你角色、定格成照片和大浪拍屏的转场。

**黑白漫画**（`manga/`，详见 `manga/README.md`）
- **人物**：真人比例的动漫人物，脸、发型、身体、服装分开拼；表情、眼线、红唇；6 个现成角色（小鹿从前和后来、阿飞从前和结尾、溜冰场女王、陌生人）。
- **场景和道具**：2009 年的小城夜景、溜冰场、网吧、卧室、迪吧；诺基亚、QQ 窗口、跳舞机、大头贴、口红等。
- **漫画手法**：分格砸入、网点、排线、集中线、速度线、闪光、泡泡、雨、裂纹；翻页、撕页、墨水淹没、斜格缝、黑白反转频闪。
- **字幕**：漫画旁白框，逐字从灰变黑；同样可以用 `LYRIC_FX` 换成 `lyricfx/` 的样式。

**歌词字幕特效**（`lyricfx/`，详见 `lyricfx/README.md`，两套画风通用，别的页面盖一张透明 canvas 也能用）
- `slip` 纸条贴字（手撕白纸条拍进来、胶带、旧纸条被撕走）、`pop` 大字蹦出（逐字弹出、粗白描边）、`kinetic` 动态排版（分块踩拍砸进空白处、关键词黑底白字、画面跟着抖）；可以混搭。
- `lyricfx/demo.html` 是示例页：`node render.mjs --page=lyricfx/demo.html --clip --out=out/lyricfx_demo.mp4`。

**工具**
- `tools/music/`：`beatgrid.py`（拍网格、候选卡点）、`subs_white.py`（读烧录字幕断句）、`make_check.py`（对拍视频）
- `tools/lyrics/`：`sep_vocals.py`（分人声）、`volc_asr.py`（火山逐字识别）、`align_lyrics.py`（对回歌词）、`hold_tails.py`（补句尾长音）、`caption_font.py`（字幕字体子集）
- `tools/ci/render.yml`：云端分段渲染模板（两套画风通用）
- `render.mjs`：缩略图、逐帧、单帧、整片；`--size` 换画面比例（封面），`--page` 换页面（比如 `--page=manga/studio.html`）

## 13. 和用户协作的约定

- 回答先说大白话，少堆路径和内部机制名。装了或改了东西，要把等效命令写出来。
- **小预览在本地出，不用问；整片一律上 GitHub Actions**，不占用户电脑。
- 渲染、编译这类重任务先问，同意只算这一次。
- 方案（提问、分镜、设定图）确认之前，不开始正式制作；确认之后一口气做完。
- 原曲、原视频截图、口令都不进 git。
- 临时文件不放 `/tmp`，放在项目目录下自己建的文件夹里。杀进程只用记下的 PID。
