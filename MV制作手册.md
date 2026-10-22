# MV 制作手册（卡点动画）

**开新片之前先把这份读完。** 内容来自九条片子：《中华五千年》线稿动画、《电击小子》、《把回忆拼好给你》拼图版和 Clawd 版、《坏女孩》Clawd 版和漫画版、《写不完的温柔》像素版（4 分钟完整 MV）、《去年夏天》线稿版、《最美的期待》剪纸版，包括做法、哪些受欢迎、哪些不受欢迎，以及踩过的坑。画面怎么画、引擎怎么用：水彩 Clawd 见同目录的 `ANIMATION_GUIDE.md`，黑白漫画见 `manga/README.md`，像素见 `pixel/README.md`，线稿见 `lineart/README.md`，剪纸见 `papercut/README.md`，歌词字幕的三种动效样式见 `lyricfx/README.md`，以前片子里的现成场景道具见 `extras/README.md`。

资源库在 `~/project/testt/videos/ClaudeAnimationBase`（备份在私有仓库 https://github.com/a3339530357/ClaudeAnimationBase）。下面命令里的 `tools/...` 都是资源库里的脚本，在项目目录里运行时写成 `$B/tools/...`，其中 `B=~/project/testt/videos/ClaudeAnimationBase`。

---

## 0. 一页速查

| 步骤 | 做什么 | 交付 / 停下来 |
|---|---|---|
| 1 | 从视频里提取音乐 | |
| 2 | 量拍子、找卡点（**先看各段速度一不一样**，漂的话逐拍跟踪）；歌词用**逐字识别**拿时间（不抄字幕；用户给了 LRC 就用识别核对 LRC）→ `timing.json` | |
| 3 | 出**对拍视频** | ✋ 给用户看，确认卡点准 |
| 4 | **两轮提问**定方向（每题带推荐项）；故事、画风拿不准时，每个方案出一条**短样片**（开头 4～6 秒 + 高潮前后约 2 秒） | ✋ 用户选 |
| 5 | 写分镜 `STORYBOARD.md`，每个动作标第几拍 | ✋ 用户过目 |
| 6 | 画**角色设定图**（换造型的、小配件出特写） | ✋ 用户看过再写代码 |
| 7 | 一口气写完全部镜头，只做**一次整体检查**（缩略图） | |
| 8 | 上云渲染 → 下载 → 抽帧检查 → 报告 | ✋ 上云前先问 |
| 9 | 出**封面**：只出一张 4:3（1920×1440），放歌名和歌手名 | ✋ 给用户看 |

✋ = 停下来，等用户。其余步骤直接往下做，不用每步都问。

---

## 1. 提取音乐

```bash
ffmpeg -i 原视频.mp4 -vn -c:a copy music.m4a          # 流拷贝，不损失音质
ffmpeg -i 原视频.mp4 -vn -c:a libmp3lame -q:a 2 music.mp3   # 要 mp3 时
```

**先量一下音轨的响度**，这决定混音要不要处理（《一个人想着一个人》就是在这里发现问题的）：

```bash
ffmpeg -i music.m4a -af volumedetect -vn -f null - 2>&1 | grep -E "mean_volume|max_volume"
```

- 平均 -8.4 dB、峰值 0.0 dB = **这条音轨压得很满、已经贴到削波边缘**。原样混进成片，在容器转换和 AAC 编码里会冒过 0 削顶。要削峰 + 响度归一：

```bash
# 削峰到 -1.3 dB（听感不变）+ 响度收到 -14 LUFS（网络平台标准，别人不用再压我）
ffmpeg -i in.mp4 -i music.m4a -filter_complex \
  "[0:v]copy[v];[1:a]atrim=end=50.53,apad,alimiter=limit=0.86:level=disabled:attack=5:release=80:asc=1,loudnorm=I=-14:TP=-1.3:LRA=11:linear=true[a]" \
  -map "[v]" -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out.mp4
```

- 平均 -20 dB 左右、峰值留了余量 = 不用动，原样混。
- **音乐比画面短**时用 `apad` 给音轨补静音（别让 `-shortest` 把画面截断）。若结尾是"硬切断在满音量"，参考 `pinhui-lineart-mv/render/music_tail.txt` 的做法：把最后一下做成每拍一次、越轻越闷的回声延到片尾。

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
- **抒情歌常被量成两倍速**：《写不完的温柔》先量出 164 BPM，实际是 82（把八分音符当成了拍）。看一句歌词占几拍，一句一般 4 或 8 拍；不对就 `--bpm` 给一半重量。
- **小节第一拍**：默认按"4 拍里底鼓最重的一拍"定，抒情歌底鼓弱、一小节两下差不多重时，两次运行能差两拍。加 `--downbeat chroma` 改按"和弦变化最大的一拍"定（脚本会把两种都打印出来，不一致时提示），再用对拍视频听。
- **不是 4 拍的小节**：《多远都要在一起》桥段第 188 拍是个只有 2 拍的短小节，之后小节线整体后移 2 拍（`n % 4 == 2` 才是小节第一拍）。漏掉的话最后一遍副歌所有卡点都差半小节。找法：拍子速度恒定、但某段之后和弦变化总落在“第 3 拍”上，就逐段统计和弦变化的位置。在 timing.json 的 `beat` 里写 `"odd_bars": [[188, 2]]`，对拍视频（`make_check.py`）会照着数小节；代码里写一个 `barPos(n)` 算小节内第几拍。

**速度会漂的歌：逐拍跟踪**（《我怀念的》，2026-10）。这首没跟节拍器录，速度从 133 BPM 一路漂到 142，前 112 秒又只有钢琴、没有鼓。我先信了固定公式，在错的网格上分析了好几轮小节线，得出的“短小节”大多是漂移造成的假象。用户问“这一次为什么这么久”。

- **先看速度稳不稳**：`beatgrid.py` 现在会每 30 秒一段各量一次速度，各段差超过 1% 时提示改用逐拍跟踪。看到提示就别往下用公式了。
- **怎么跟**：`sep_vocals.py` 分离时会顺手存下鼓、贝斯、其他（伴奏）几条音轨。有鼓的段用鼓轨跟拍，没鼓的段用伴奏跟拍，在交界处拼起来再平滑，写进 timing.json 的 `beat.times`（每一拍一个时间）。`make_check.py` 认 `times`；项目里的 `bt(n)` 也要改成查这张表。

```bash
$B/.venv-sep/bin/python -I $B/tools/lyrics/sep_vocals.py assets/music.mp3 work/lyrics/vocals.wav      # 顺带存 drums/bass/other/acc.wav
work/.venv/bin/python -I tools/music/beattrack.py assets/music.mp3 work/lyrics --bpm 140 --half --out work/analysis/timing.json   # 先看诊断表
work/.venv/bin/python -I tools/music/beattrack.py assets/music.mp3 work/lyrics --bpm 140 --half --bars work/analysis/bars.json --out work/analysis/timing.json
```

- **怎么验证**：拿几遍副歌里同一句歌词，看它们在网格上相差几拍。网格对了，这个数几乎是整数（±0.1 拍）；固定公式那次是 163.4、162.4 这样一路变。脚本读到 timing.json 里的歌词就会自动打印。所以先跑 `cmp_lrc.py --timing` 或 `align_lyrics.py` 把歌词写进去，再跑 `beattrack.py`。字数相同、六成字一样的平行句（“我问为什么 / 想问为什么”）也会拿来比，所以主歌也能核对。看“余 8”那一列：同一组里有一对和别的对差 1，就是这两句之间多跟或少跟了一拍。以前整首一起跟的时候，在前奏进主歌那里出过一次这种错，所以现在改成按段单独跟。
- **小节线**：诊断表每 16 拍一行。镲片落在奇数拍还是偶数拍，说明半速记拍时取哪一边；贝斯换音最多、底鼓最重的位置（n%8）一般就是小节第一拍。没鼓没贝斯的段只能靠歌词：同一句在几遍里离小节线的距离应该一样。定好以后写成小节起点列表 `bars.json`（细网格拍号），用 `--bars` 重写。
- **相差“8 的倍数 + 1”**（细网格）= 中间有个地方音乐自己拖了半拍，那一小节在 `bars.json` 里写成 9 格，拍表里那一小节的最后一拍会长 1.5 倍。**相差“+ 4”** = 有一个 2 拍的短小节，会自动写进 `odd_bars`。《我怀念的》这两种都遇到了。

**歌词**：文字以用户给的为准。**时间不能照抄原视频的烧录字幕**：字幕本身常常偏晚，《坏女孩》实测平均比实际开唱晚 0.56 秒（0.25～0.99），导歌、副歌提前 2～3 拍抢进来唱的句子最严重；而且句内是匀速分配的，每个字还差 0.3 秒左右。照它卡点，整片会一直慢半拍。

**用户给了 LRC 时（《写不完的温柔》验证过）**：LRC 的句首通常是准的，但要核对。分人声、识别两遍（带歌词、不带歌词）之后：

```bash
python3 -I tools/lyrics/cmp_lrc.py 歌.lrc work/lyrics/asr_plain.json work/lyrics/asr_ctx.json --out work/analysis/cmp.json            # 逐句对比
python3 -I tools/lyrics/cmp_lrc.py 歌.lrc work/lyrics/asr_plain.json work/lyrics/asr_ctx.json --timing work/analysis/timing.json      # 用户说用 LRC：句首 LRC + 逐字借识别，写进 timing.json
```

- 会自动跳过 LRC 开头的制作信息行（词、曲、编曲、监制、OP、SP），并把它们打印出来，正好拿去做片头字幕。
- 那次 60 句里有 59 句差不到 0.3 秒，中位差 0.05 秒（LRC 标的是辅音起点，识别标的是元音起点）。差得多的句子，用人声响度（RMS）看真正的起音点。桥段里即兴重复的"你最温柔"，识别自己也分不清是哪一遍，这种地方先听。
- **对齐一律按顺序**（编辑距离加回溯）。difflib 会先找最长的相同片段，副歌唱四遍时，它把第 16～20 句配到了最后一遍副歌上，差出 146 秒。`align_lyrics.py` 已经改成按顺序对齐。

**首选：逐字识别（《坏女孩》验证过）**，拿到每个字的开始和结束时间：

1. 把人声单独分离出来（`sep_vocals.py`，audio-separator + RoFormer，显卡跑）。
2. 人声交给火山"录音文件识别标准版"（`volc.seedasr.auc`，新版控制台 API Key，音频 base64 直传，不用公网地址）。**一定要把歌词原文作为参考传进去**：`volc_asr.py --lang zh-CN --ctx 歌词.txt`。传了歌词，错字从 8 个降到 1 个；加热词、开 enable_music_fc 反而错得更多，别加。
3. 对回用户给的歌词（`align_lyrics.py`）：认错的字按位置借时间，多出的语气词丢掉，漏掉的字插值。
4. 用人声响度补上句尾长音（`hold_tails.py`）。

**分离模型（2026-10-22 换的）**：原来用 Demucs 的 htdemucs（2023 年的，官方仓库已归档，人声 SDR 9.9），用户说"太太太太老了"。现在用 `audio-separator`（UVR 背后那套，https://github.com/nomadkaraoke/python-audio-separator），在 4060 显卡上跑两个模型：
- 人声：Kim 的 MelBand Roformer（`vocals_mel_band_roformer.ckpt`，人声 SDR 12.6）。
- 鼓、贝斯、吉他、钢琴、其他：jarredou 的 BS Roformer SW（`BS-Roformer-SW.ckpt`）。
- 速度：开半精度（默认开着，和全精度的差异比 71 dB，听不出来），一分钟音乐两个模型一共 24 秒左右。整首 4～5 分钟的歌两分钟上下。
- 效果：《我怀念的》用新人声识别，多认出 4 个字，"编出来的段"从 1 个降到 0；老模型认晚 0.5 秒、要手动修的「我放手」，这次直接对了。用新鼓轨跟拍，清晰度从 4.7 升到 5.3。
- 想换更新的模型：`$B/.venv-sep/bin/audio-separator -l --list_filter vocals` 列出能直接下载的模型和分数，改 `sep_vocals.py` 开头的 `VOCAL_MODEL` / `STEM_MODEL`。排行榜看 https://mvsep.com/quality_checker/multisong_leaderboard?sort=vocals （最前面那两个是 MVSEP 自家的，只能在线付费用，没有权重）。
- 坑：audio-separator 默认把模型下载到 `/tmp`，脚本里已改成资源库的 `sep_models/`；0.47 版少声明了 `audioread` 依赖，要自己装；底层库会往 `TMPDIR` 写一个 `.ses` 小文件，所以运行时把 `TMPDIR` 指到项目的 `work/t`。

脚本在 `tools/lyrics/`，用法写在每个脚本开头。火山语音的 Key 文件在 `~/project/testt/videos/huainvhai-mv/work/secrets/volc_speech_key.txt`，拷到新项目的 `work/secrets/`（不进 git）。歌词存成 `歌词.txt`，一行一句。

```bash
# 人声分离：资源库根目录的 .venv-sep（约 6 GB，装法见 sep_vocals.py 开头），显卡跑。顺带在同一目录存 drums/bass/other/acc.wav
TMPDIR=$PWD/work/t $B/.venv-sep/bin/python -I $B/tools/lyrics/sep_vocals.py assets/music.m4a work/lyrics/vocals.wav
ffmpeg -i work/lyrics/vocals.wav -ac 1 -ar 16000 -c:a pcm_s16le work/lyrics/vocals16k.wav
# 识别两次：带歌词的用来对字，不带歌词的用来判断长音（带了歌词会把语气词抹掉）
python3 -I tools/lyrics/volc_asr.py work/secrets/volc_speech_key.txt work/lyrics/vocals16k.wav work/lyrics/asr_ctx.json --lang zh-CN --ctx 歌词.txt
python3 -I tools/lyrics/volc_asr.py work/secrets/volc_speech_key.txt work/lyrics/vocals16k.wav work/lyrics/asr_plain.json --lang zh-CN
python3 -I tools/lyrics/align_lyrics.py work/lyrics/asr_ctx.json work/analysis/timing.json --lyrics 歌词.txt
work/.venv/bin/python -I tools/lyrics/hold_tails.py work/lyrics/vocals16k.wav work/analysis/timing.json work/lyrics/asr_plain.json --write
```

这套流程用《坏女孩》的原始数据重跑过，结果和成片里用的逐字时间完全一致。

**传了歌词上下文时，它会「编时间」**（《一个人想着一个人》发现的，**凡是有唱得飞快的连续短句都要防**）：

带 `--ctx` 那份**不会漏字，但会编时间**。实测它把 2.2 秒按每字 0.04 秒硬塞了 30 个字（那 2.2 秒根本唱不完 30 个字），又另起一段把后半句重复列了一遍，看起来像整段唱了两遍——**实际只唱一遍**。我照抄就写错了歌词句数。

判断某一段是不是被编了：看那段里**每个字的时长中位数**。正常的段是 0.16～0.36 秒，被编的那段是 0.04 秒（识别自己均匀摆的）。

解法（`tools/lyrics/align_two_asr.py`，输入输出都是命令行参数；**这个脚本是 10-16 写的，之后没在别的歌上验证过，用之前先抽查几句**）：

```bash
# 两份识别：不带上下文那份当基准（时间准、段切得对，但可能漏字），带上下文那份只用来补漏字
python3 -I tools/lyrics/volc_asr.py work/secrets/volc_speech_key.txt work/lyrics/vocals16k.wav work/lyrics/asr_plain.json --lang zh-CN
python3 -I tools/lyrics/volc_asr.py work/secrets/volc_speech_key.txt work/lyrics/vocals16k.wav work/lyrics/asr_ctx.json --lang zh-CN --ctx 歌词.txt
python3 -I tools/lyrics/align_two_asr.py --base work/lyrics/asr_plain.json --fill work/lyrics/asr_ctx.json \
    --lyrics 歌词.txt --out work/analysis/ly.json
```

它会打出整体对齐相似度（0.98 以上算干净）、认错的同音字、漏掉的字（从带上下文那份借时间）、以及每句的首尾时间。输出的 `ly.json` 直接能喂给 `make_check.py` 和项目的 `music.js`。

**歌词句数先自己数一遍。** 用户给的歌词里如果有一段是"整段重复"的（副歌重唱），要先确认音乐里是不是真唱了两遍——这次就是识别虚报了重唱，我跟着多写了三句，被用户一眼看出来。

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
- `plan.json` 写分镜的镜头、段落和卡点（格式见脚本开头）；不给就按每 8 拍一块。有 2 拍短小节或拖长的小节时，自己按小节写 `shots`，别用默认的每 8 拍一块（会错开）。
- timing.json 的 `beat` 里有 `times`（逐拍时间表）就按表走，没有才用 `offset + n × period`。
- **用户对这一步评价很高**（"做的非常非常好"）。代价最小，能最早发现卡点不准。

## 4. 头脑风暴：两轮提问

每题 2～4 个选项，**第一个是推荐项并标"（推荐）"**，带一句说明。一轮最多 4 题。

**第一轮：大方向**
1. 故事：比如暗恋告白 / 友情离别 / 反差搞笑 / 不讲故事的舞台 MV
2. 画风：水彩手绘 Clawd（引擎现成，表情最多）/ 黑白漫画 + 一抹红（真人比例的动漫人物，`manga/`）/ **像素（`pixel/`，4 分钟长片验证过，用户说"质量很好"，渲染最快）** / **线稿（`lineart/`，用户最喜欢的画风之一，《去年夏天》选的就是它）** / **剪纸（`papercut/`，彩纸立体书、东西按拍子立起来折回去，梦境童话、颜色要亮的片子；《最美的期待》三套样片里用户选的："剪纸风非常好"）** / 扁平卡通。用户要"真人形象"时就用漫画引擎画动漫风，**不用生图**。**要像某个真人明星（比如歌手本人）做不到**：邓紫棋在像素、水彩、漫画三种画风里各画了一版，用户都说"不像"，最后拿掉了。先说明做不像，建议换成原创角色
3. 道具主线：拿什么东西把整片串起来（拍立得、信、玻璃瓶……）
4. 卡点密度：叙事为主、大节点重卡（推荐）/ 每拍都动 / 前松后紧

**故事、画风让用户看样片挑**（《去年夏天》用户提的）：用户不直接选，而是说"每一种故事配一个适合的画风，生成开头的几秒让我看看选"时，每个方案配一种画风，开分身（fork）同时做，各做一个带原曲的样片网页，放在项目的 `samples/<方案>/`。
- **每条样片只做两段：开头 4～6 秒 + 高潮（drop、副歌爆发）前后约 2 秒**，在同一个页面里接着放。开头看画风和抓不抓人，高潮看大节点怎么炸，两样都是挑方案的关键。用户原话："下次做开头的 4 到 6 秒和高潮前后的 2 秒左右"。（那次只做了开头 8 秒，高潮那一下没看到。）
- 用户已经定下的规矩（卡点密度、放不放歌名、字幕）每条样片都照做，只有故事和画风不同。
- **样片不渲染**：不出 mp4，做成双击就能打开的网页（有播放键、原曲同步、字体用 data URL），用户自己在浏览器里看。用户原话："让他们不要渲染，我会自己在浏览器看"。自检只出一张缩略图。分身同时开着时，谁都别跑同一份 `render.mjs`（浏览器配置目录在脚本旁边，会抢）。

**第二轮：角色和结局**
1. 另一个角色长什么样（给具体颜色和配饰）
2. 主角性格（害羞笨拙 / 元气 / 表面淡定内心戏多）。**这一题决定角色有没有特点**
3. 结局：反转 / 圆满 / 开放
   - 歌词本身在讲失去、怀念的，先问一句 HE 还是 BE。《多远都要在一起》用户主动要 BE：“这首歌适合BE方向，男主是已经不在世了”，把我给的三个圆满故事都否了。BE 的演法：失去靠**缺席**（空椅子、只用了一张的车票、搬空的房间），不画葬礼、墓碑、遗像、病床；回忆暖色、现在冷一点但不压黑；**他消失的那一刻要让她哭**（用户：“男主消失后让女主流泪”，我原来写的是她看着光点笑）。
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
- [ ] 除了歌词、片名和片头字幕，画面里不要有字
- [ ] **第一帧就是歌名**（加歌手名、"MV制作 小冰OvO"）。用户原话："开头直接展示歌名，你再琢磨抓人都比不上歌名直接展示出来"。我做的"前 2 秒先快切两个高潮画面当钩子"被否了。歌名一个字一个字弹出来，每字隔约 0.1 秒、带一点回弹，1 秒内出齐（"稍微快一点，不要太快"）
- [ ] **片头字幕**写原曲的人（LRC 开头那几行）：**作词紧跟着歌名出来，后面的作曲、编曲、OP、SP、监制按原版顺序一次一行、慢慢往后出**，每行停 3 秒左右。照 LRC 时间点排、三行一次全出，这两种都被否了
- [ ] **结局默认圆满**：《写不完的温柔》本来是"弹到空白小节、他听见了但没复合"，用户说"没有重逢 BE 结局不太好，改成 HE"。

## 6. 角色设定图（写镜头代码前做）

用一张图把主角和配角的几种表情、几个关键姿势、主要道具都画出来，给用户看。示例在 `src/cast_tao.js` 末尾的 `LOOPS.cast`：

```bash
node render.mjs --loop=cast --sheet=0.3 --cols=1 --w=1920 --out=out/check/cast.jpg
```

漫画画风的设定页：`node render.mjs --loop=lookbook --size=3840x2160 --stills=0.4 --out=out/check/lookbook`（写法见 `manga/src/sheet.js`）。

Clawd 版就是在这一步拿了 10 分。新角色画得好、用户说要通用的，做完后**加回这个资源库**。

**每部片子换新主角，不沿用上一部的人物**（"每个视频的人物都一样观众不喜欢"）。选定画风后先出一页**几个候选的新角色**（发型、主题色、衣服、身高、手里的东西都拉开差别，每人全身像 + 三个表情），做成双击能开的网页，让用户挑。线稿的六个候选在 `lineart/cast.html`，下一部可以直接从里面挑没用过的，或照着 `lineart/js/cast_new.js` 的写法再加。

**角色变化（变坏、长大、换装）靠换零件，不用新做一个角色。** 《坏女孩》里变坏的小桃只换了三样：眼睛（杏仁眼 + 长眼线）、嘴（红唇）、蝴蝶结（红色大蝴蝶结换成黑色小的），身体、颜色、动作全部照用，观众一眼认得出是同一个人。做法是在项目里包一层 `eyes / mouth / hat`，加上新的名字，见 `~/project/testt/videos/huainvhai-mv/src/cast_bad.js`。造型可以出两三版让用户挑。

**小配件要单独放大给用户看清楚。** 设定图除了全身表情，再出一张道具图、一张造型特写（《坏女孩》出了 cast / props / looks 三张）。全身图里配件太小，丑不丑看不出来：第一版黑蝴蝶结就是因为丑被用户删掉的。

## 7. 写代码

**新项目**（下面是水彩 Clawd；黑白漫画的拷法见 `manga/README.md`）：

```bash
B=~/project/testt/videos/ClaudeAnimationBase; P=~/project/testt/videos/新项目名
mkdir -p $P/src/scenes $P/assets $P/work/{analysis,secrets} $P/out/check $P/.github/workflows
cp -r $B/{ANIMATION_GUIDE.md,docs,fonts,lyricfx,package.json,package-lock.json,render.mjs,studio.html,node_modules} $P/
cp $B/LICENSE $P/LICENSE-ClaudeAnimationBase; cp $B/src/*.js $P/src/; cp $B/tools/ci/render.yml $P/.github/workflows/
# src/*.js 里已经带了 player.js（本地预览的播放器）。它是所有画风通用的，studio.html 里在场景文件之后引一次就行。
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

**长片（4 分钟、40 多个镜头）怎么分工**（《写不完的温柔》）：
1. 先写公共层：引擎、人物、道具、场景，并出设定图看一遍（人物比例、家具配上坐着的人试一下）。
2. 再按章节开分身并行写：每章 10～13 镜一个文件，所有顶层的名字加章节前缀，不准改公共文件，缺东西就在自己文件里画，或者在报告里说明。我自己写第一章来定调。四章同时写，每章大约 15～20 分钟。
3. 收回来以后，每个镜头抽一帧拼成整片总览，查前后衔接；分身报告里提到的公共问题统一修。
4. 交付前用 `tools/check/plain_open.mjs` 模拟用户双击打开 studio.html。`render.mjs` 自带"允许读本地文件"，自查时字体总是正常，用户那边却可能加载不了。

**用户说“先完成，再完美”时（《多远都要在一起》，77 镜、3 分 37 秒，一个多小时写完）**：用户原话“不需要中途检查渲染抽帧之类的，最后告诉我可以在网页预览就可以了……最后我看了视频会和你说要改什么”。这次的做法，用户看完只提了一处修改就说“很好，上云渲染吧”：
1. 主会话先搭好公共层（选中的样片代码直接当底子），写 `分镜.md`：每段的**开始秒和结束秒写死**（第一个镜头正好从本段开始秒开始，最后一个镜头放到下一段开始）、每句歌词一个画面、**贯穿全片的道具和房间状态表**（哪段下午、哪段夜里、东西还在不在），规矩写在文件最后。
2. 页面里先给每个分身留好固定的文件位（`a_1.js … a_3.js`、`b_1.js`…），缺的文件浏览器会跳过，收回来再删掉没用到的那几行。
3. 按时间段开分身，一段一个，同时写；主会话自己写开头和结尾。**fork 开不了时**（这次的环境里没有 fork），用通用分身，每次显式指定 Opus，提示词里写清先读 `分镜.md` 和哪几个公共文件。
4. 分身**不出图、不看图**，写完只跑 `node --check` 和一次 `tools/check/smoke.mjs`（只查运行报错和每帧毫秒，不出图）。收齐后主会话全片 0.25 秒一帧跑一遍 smoke（加 `--shots` 核对各段首尾），再用 `plain_open.mjs` 模拟双击打开，然后就交给用户看。
5. 用户中途插话（这次是“把阳光删了”）：先改公共函数（一处改完全片生效），再给还在写的分身发消息，已交的段落主会话自己改。
6. 代价：分身各自往房间里加家具（一个加了书桌、一个加了床和台灯），前后对不上。**公共道具和家具要在公共层里先画好**，分镜里写明“要什么先在报告里提，别自己加”。

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

**只改了一小段**（比如片头字幕）：只渲那一段 `-f range=0:22.4 -f segments=8`，下载后用 `bash tools/ci/splice_range.sh 新段.mp4 旧成片.mp4 0 22.4 新成片.mp4` 按帧号接回整片，音轨沿用旧成片的。接缝前后各抽一帧对一下。旧成片留一份在 `out/final/旧版/`。原曲是 mp3 的话，加密成 `assets/music.mp3.gpg` 就行，模板两种都认。

**本地出整片**（像素片很快）：`render.mjs --png/--frames --workers=N` 会**一个个排队启动**浏览器，每个大约 16 秒，`--png` 模式要到结束才打印进度，所以前两分钟看着像卡死，其实没卡。等一等，或者自己数输出目录里的文件数。

20 台机器并行时，一条一分钟的片子大约 3～5 分钟出片。成片在 Actions 那次运行的 Artifacts 里，保留 14 天。**公开仓库的成片任何登录 GitHub 的人都能下载（含原曲）**，报告时提醒用户。

## 9. 封面

封面也是交付物，成片之后做。**只出一张 4:3（1920×1440）**，竖版、16:9 这些别的比例都不用出。单张图在本地出就行，不用上云。

- **放歌名和歌手名**，不放歌词句子。用户看了只有歌名的封面后说"加上GEM邓紫棋"。
- 角色用**最有辨识度的原本形象**：《坏女孩》封面里的小桃是变坏之前的样子（红色大蝴蝶结、眯眼笑、腮红），Clawd 不戴墨镜，脸不要被道具挡住。
- 一张图看出故事：两人牵着钳子站在聚光灯下，身后巨大的霓虹爱心右半边已经熄灭。

写成一个 `LOOPS.cover`，示例见 `~/project/testt/videos/huainvhai-mv/src/cover.js`（水彩）、`~/project/testt/videos/huainvhai-manga-mv/src/cover.js`（漫画：一张脸从中间撕开，左边从前、右边后来）和 `pixel/src/scenes/demo.js` 末尾（像素：钢琴视角两人并排相视而笑，3 倍像素镜头；歌名写进像素画面，歌手名画在高清层上，所以可以比放大后的一个像素还小）。资源库的 `render.mjs`、`core.js` 和漫画版 `ink.js` 都支持 `--size`：

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
| 墨戏版：用纯 canvas 做水墨笔触，画面里塞满家具（床、椅、台灯、桌子、相册） | "这个水墨风格也太丑了吧，这个方案直接推倒吧" | **水墨的门槛在「少」**。一笔下去就是一座山，画面大部分必须留白。我把它当成"用墨画的普通插画"，画成了杂物间。见 `ink/README.md` |
| 同一首歌连出三版（拼图 / Clawd / 线稿 / 漫画 / 墨戏） | 用户逐个挑，不喜欢的直接换 | 一个故事可以换很多画风试；但**画风要配题材**，选错方向再调参数也救不回来 |
| studio.html 只有拖动条，自己想看片得写脚本出图 | 用户："为什么不能本地看……打开没有播放按键" | 本地要能**边听边看**。加了 `src/player.js`，以后新项目直接带 |
| 子代理做长任务中途网关断掉（HTTP 200 返回 HTML） | — | 它的代码留在磁盘上，**重新起一个子代理并让它先读现有代码接手**，比唤醒旧的（旧上下文里还有错数据）干净 |
| 像素版《写不完的温柔》：480×270 调色板画布放大 4 倍、提线木偶小人、像素镜头放大、抖动转场、像素字体歌词，47 个镜头完整 4 分钟 | "这首像素风的质量很好"，换回正常模型后"很满意" | 像素画风收进 `pixel/`。讲故事的长片首选：渲染最快，四季、日夜靠调色板换色，统一感强 |
| 用代码画真人歌手（邓紫棋），像素、水彩、漫画各一版 | "三个都不像邓紫棋，先不做邓紫棋了吧" | 真人明星画不像。先说明，别花一轮去试 |
| 开头前 2 秒先快切两个高潮画面当"钩子"，片名第一下重音才砸进来 | "开头直接展示歌名，你再琢磨抓人都比不上歌名直接展示出来" | 第一帧就是歌名，见第 5 节清单 |
| 片头制作人员字幕：照 LRC 时间排到 22 秒 → 改成三行一次全出 | "一次出来太多了，是第一个作词跟着出来，后面的慢慢一行一行出" | 作词跟歌名一起出，其余一次一行 |
| 结局：谱子弹到空白小节，他听见了但没复合（开放、遗憾） | "最后两个人没有重逢 BE 结局不太好，改成 HE 结局吧" | 默认圆满。这次改成他放走车、坐到她身边，在空白小节里按下第一个音，片名从"写不完的遗憾"变成"写不完的温柔" |
| 用户中途插话（开头要抓人、要写制作人员、署名"小冰OvO"） | 改完很满意 | 署名、制作人员这些发布要素，写分镜时就放进开头，别等用户提醒 |
| 只改片头时，云端只渲开头 22 秒再按帧号接回整片 | "改开头的几秒视频就够了" | `tools/ci/splice_range.sh` |
| 《去年夏天》：样片里的主角还是《拼回忆》线稿版的黑短发女孩 | "每个视频的人物都一样观众不喜欢"；我画了六个新角色的设定页，"六个角色都特别好，之后其他视频都可以考虑复用" | **每部片子换新主角**：选定画风后先出新角色设定页（发型、主题色、衣服、身高、手里的东西都拉开），让用户挑。六个角色收在 `lineart/cast.html` |
| 《去年夏天》线稿样片：头发实心墨黑、关键词黑底、伤心段整页压灰 | "为什么画面很黑，人物也很黑" | 线稿也要亮：浅色头发、暖黄关键词块、靠表情和天气表现情绪 |
| 《最美的期待》三套样片：线稿 / 像素 / 剪纸立体书（彩纸一层层立起来，鼓回时封面弹开） | "剪纸风非常好，就用这个" | 剪纸收进 `papercut/`，梦境、童话、颜色要亮的片子可以用 |
| 剪纸片另做 5 种剪纸风字幕对比（立体字、晾衣绳挂牌、折纸展开、拼贴剪字、镂空透光） | "就用纸条贴字吧，全片都用" | 纸条贴字和剪纸最搭；新做的字幕不一定比现成的好，`papercut/` 只收了纸条贴字 |
| 《多远都要在一起》三条像素样片（失约的旅行 / 最后一条语音 / 他的房间），我推荐 A（场景换得多） | 选了 C 他的房间 | 推荐只是参考；一个房间也能撑满整首，场景变化放进回忆里（山顶、站台、天台、海边、向日葵田、彩虹） |
| 整片：6 个分身按时间段并行写，不出图、不看图，只查报错 | 看完只改了一处，“很好，上云渲染吧” | 用户催速度时这样做可行，靠 `分镜.md` 里写死的时间边界和连续性表撑住（见第 7 节） |
| 窗户斜照进来的光柱、地上的光斑、光里的灰尘、阳光冲进来时往外扩的光圈 | “窗户的阳光洒进来导致整个画面有大片泛光，把阳光删了” | **不要大片泛光**：像素的抖动光是一大片发白的颗粒，把画面洗灰。室内的早晚冷暖只靠调色和窗外天色，太阳只画日轮 |
| BE 片里他化成光点消失，她看着光点笑 | “男主消失后让女主流泪” | 失去的那一刻要哭，笑可以放在之后（含泪笑） |

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
| 传了歌词上下文，识别给的时间是编的 | 段内每字时长中位数 0.04 秒 = 识别自己均分的假值（真的在 0.16～0.36 秒）。改用不带上下文那份当基准，见第 2 节 |
| 识别把后半句重复列了一遍，看着像唱了两遍 | 同一件事。歌词句数先自己数一遍再动手 |
| 拍子整体差一整拍 | librosa 的 `beat_track` 粗估可能偏快 2%（实测 117.45 vs 真值 115.19）。用 `tools/music/beatgrid.py` 的周期+相位联合扫描（相位偏差 1ms），别信粗估 |
| 水墨画面糊成一坨 | 笔与笔之间没有纸色。用 `ink/mo.js` 的 `gap()` 在墨里抠出细缝（露纸色），不是靠描边 |
| 打开 `studio.html` 没有播放按钮 | 资源库自带的那份只有一根拖动条，是逐帧核对用的。`src/player.js` 补上了播放器（画面按窗口缩放居中，控制条和画面同宽：播放/暂停、时间、进度条、倍速、音乐开关；空格播放，←→ 一秒，Shift+←→ 一帧），音乐读 `PROJECT.audio`。**`studio.html` 里 `.p5Canvas { display: none }` 那行不能删**：水彩引擎画在一张隐藏的 p5 画布上，每帧再合成到 `#out`；删了会多露出一张 1920 宽、靠左的原始画布 |
| 本地预览一卡一卡、跳帧 | player 只在上一帧画完后才画下一帧，画面比歌慢就跳过中间帧。**这是特意做的**：本地只用来判断内容对不对，成片一律逐帧云渲染，不受影响 |
| 用户双击打开 studio.html，像素字体变成系统字体 | Chrome 不让 file:// 页面加载 @font-face 字体文件；`render.mjs` 带 `--allow-file-access-from-files`，所以自查时看不出来。把字体做成 data URL 嵌进脚本（`pixel/tools/pixel_font.py` 生成 `src/font_data.js`），交付前用 `tools/check/plain_open.mjs` 模拟用户打开 |
| 整首对齐歌词，前面的句子被配到最后一遍副歌上（差 146 秒） | difflib 先找最长的相同片段，副歌重复时会配错。改用按顺序对齐：`cmp_lrc.py`、`align_lyrics.py` 都已经改好 |
| 抒情歌量出两倍速；小节线两次运行差两拍 | 看一句歌词占几拍，`--bpm` 给一半；小节线用 `beatgrid.py --downbeat chroma` |
| 几遍副歌里同一句歌词相差 163.4、162.4 拍，一路在变；小节线前后半首对不上 | 速度在漂（没跟节拍器录），固定公式不能用。`beatgrid.py` 分段量速度会提示；改用 `beattrack.py` 逐拍跟踪，见第 2 节。前半首没鼓的话，鼓轨跟不了，用伴奏跟 |
| 鼓、贝斯为了跟拍又分离一遍，白等 3 分钟 | `sep_vocals.py` 现在一次存齐 drums/bass/other/acc |
| 人声分离用的 Demucs 太老（2023 年，仓库已归档） | 换成 audio-separator + RoFormer（显卡跑），见第 2 节"分离模型" |
| 本地 `--png/--frames` 开 6 个 worker，两分钟一帧没出 | 浏览器排队启动，每个约 16 秒，`--png` 结束才打印。没卡，别停 |
| 下载云端成片（`gh run download`）好几分钟没动静，看着像卡住 | 没卡，是慢：单连接只有约 48 KB/s（文件在 `*.blob.core.windows.net`），`gh` 下完才显示。先拿跳转地址，再分 8 段并行下，约 1.3 MB/s：`LOC=$(curl -sS -H "Authorization: Bearer $(gh auth token)" -o /dev/null -w '%{redirect_url}' https://api.github.com/repos/<仓库>/actions/artifacts/<id>/zip)`，然后 `curl -r 起-止 -o p$i "$LOC" &` 分段，`cat p0..p7 > video.zip`。artifact 的 id 和大小：`gh api repos/<仓库>/actions/runs/<run>/artifacts` |
| 分身各写一章，函数名互相覆盖 | 所有章节文件共用全局作用域：顶层名字加章节前缀；`C` 是调色板，前缀写成 `C_xxx` |
| 公共家具人坐着够不到 | 设定图里给家具配一个坐着的人试一下（她的书桌原来高 44 像素，改成 24） |
| 整页脚本挂掉，报 `X has already been declared` | 项目 `config.js` 里**不能再声明** `W / H / DUR / BEAT / OFF / BPM`——这些 `core.js` 会从 `PROJECT` 和 `?size=` 自己算。重复声明会让整页脚本停在那一行，后面的 `LOOPS` 之类全都没定义，报错信息还跑到别处去 |
| 无界面 Chrome 起不来，报 "Socket path too long" | `TMPDIR` 写成很深的绝对路径会超长。用项目里短的相对路径：`mkdir -p work/t && TMPDIR=work/t node ...`（剪纸、线稿的脚本都要） |
| 像素画面整片发白、像蒙了一层雾 | 大面积的有序抖动光（光柱、地上光斑、光晕）。用户要求删掉，用调色代替；共用的光函数改成不画就全片生效 |
| `Agent type 'fork' not found` | 这个环境没有 fork。改用通用分身（显式 `model: opus`），提示词要能独立看懂：先读哪几个文件、自己负责哪段时间、只写哪几个文件 |
| 几个分身同时跑检查脚本，浏览器互相抢配置目录 | `tools/check/smoke.mjs` 每次用 `out/.smoke-<进程号>`，跑完删掉；`render.mjs` 的配置目录是固定的，分身同时开着时别一起跑 |

## 12. 资源库里有什么

**五套画风**：根目录是水彩 Clawd（p5.brush，要显卡才快），`manga/` 是黑白漫画 + 一抹红（纯 2D canvas，没显卡也快），`pixel/` 是像素（纯 2D canvas，最快），`lineart/` 是 SVG 线稿（米黄纸墨线，双击就能看），`papercut/` 是剪纸立体书（canvas 彩纸，双击就能看）。剪影拼图没收进来，在哪见 `extras/README.md` 最后一节。

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

**像素**（`pixel/`，详见 `pixel/README.md`）
- **画布**：480×270 调色板缓冲区（91 色）放大 4 倍；调色（褪色、回忆、冷暖、夜）、像素镜头放大、抖动半透明；11 种像素转场。
- **人物**：提线木偶 `person()`，示例角色她（芥末黄、栗色短发、星星发夹）和他（天蓝、圆框眼镜），每人三套衣服、10 种表情，能走、坐、弹琴、拿东西；路人随机生成 `npc()`。
- **场景和道具**：车站大厅（四季、日夜、灯亮）、站台、火车、车厢、两个人的家；钢琴、琴键和手、没写完的谱子（可控写到哪、播放游标）、手机图标、伞、箱子、钟、雨、雪、海、城市。
- **字幕**：像素中文字体（Fusion Pixel，OFL）歌词卡拉OK + 片头制作人员字幕；`pxText` 把字写进画面（片名、手写）。
- **工具**：`pixel/tools/pixel_font.py`（字体子集 + data URL）、`pixel/tools/shots.cjs`（不开浏览器列镜头表）。

**线稿**（`lineart/`，详见 `lineart/README.md`）
- **人物**：六个新角色，`cast.html` 是设定页：夏柚（高马尾体育生）、白栀（草帽长发文艺）、糖豆（双丸子眼镜）、阿野（篮球）、江屿（白衬衫耳机）、卷卷（滑板）。用户评价："六个角色都特别好，之后其他视频都可以考虑复用"。另外还有《拼回忆》的旧角色「她 / 他」，别再拿来当主角。
- **手法**：线条抖动、一笔笔画出来；镜头表 `shot()`；翻页、排线擦、甩镜头转场；开局元素按拍子弹入（`index.html` 示例）。
- **踩过的**：不要大块黑（头发浅色、关键词暖黄底、伤心不压灰）。
- **出片**：`render/render.mjs`（playwright-core，项目里 `npm i`），云端模板 `lineart/ci/render.yml`。

**剪纸**（`papercut/`，详见 `papercut/README.md`）
- **画法**：每样东西是一片彩纸：剪刀毛边、纸纹、投影（`paper.js` 的 `pc / paper`），每秒 12 张的定格抖动；东西像立体书一样从折痕上立起来（`stand`），按拍子弹起、折回（`popK / foldK`，回弹最高点压在拍点上）。
- **人物**：纸偶月芽（珊瑚橘波波头、薄荷青裙）和阿晴（芥末黄毛衣），肩膀用铜钉连着。用过了，新片换新纸偶。
- **场景和转场**：月亮船、镜湖、悬崖热气球、云上蹦床、纸船出海、四季树、摩天轮、彩虹草地；翻页、涟漪、上冲、拉页、钻月亮、折下、转盘、百叶，立体书封面合上又弹开。
- **字幕**：纸条贴字（`lyricfx` 的 `slip`）配马善政楷书。
- **出片**：`render/render.mjs`（playwright-core，项目里 `npm i`），云端模板 `papercut/ci/render.yml`。

**歌词字幕特效**（`lyricfx/`，详见 `lyricfx/README.md`，两套画风通用，别的页面盖一张透明 canvas 也能用）
- `slip` 纸条贴字（手撕白纸条拍进来、胶带、旧纸条被撕走）、`pop` 大字蹦出（逐字弹出、粗白描边）、`kinetic` 动态排版（分块踩拍砸进空白处、关键词黑底白字、画面跟着抖）；可以混搭。
- `lyricfx/demo.html` 是示例页：`node render.mjs --page=lyricfx/demo.html --clip --out=out/lyricfx_demo.mp4`。

**水墨笔触（`ink/`，半成品，详见 `ink/README.md`）**
- `mo.js` 是纯 canvas 的水墨核心：笔触沿路径变宽、边缘用噪声啃出毛边、边缘内侧补积墨（湿边）、一团墨化在纸上、`gap()` 留缝。1080p 一帧 400～600 ms。
- **只留了核心层，画面设计那一层失败了**（把房间塞满家具 → 用户"太丑了，推倒"）。想做水墨的**先读 `ink/README.md` 开头那段**：水墨的门槛在少，一个镜头只画一样东西，画大，其余全是纸。

**工具**
- `tools/music/`：`beatgrid.py`（拍网格、候选卡点；`--downbeat chroma` 按和弦定小节线；分段量速度，漂了会提示）、**`beattrack.py`（速度会漂的歌：鼓轨和伴奏逐拍跟踪 → `beat.times`，带小节线诊断和歌词核对，《我怀念的》验证过）**、`make_check.py`（对拍视频；`odd_bars` 支持不是 4 拍的小节，`times` 支持逐拍时间表）、`subs_white.py`（读烧录字幕断句）
- `tools/lyrics/`：`sep_vocals.py`（分人声，顺带存鼓、贝斯、伴奏；audio-separator + RoFormer，显卡跑）、`volc_asr.py`（火山逐字识别）、**`cmp_lrc.py`（用户给了 LRC：核对 + 写进 timing.json，《写不完的温柔》验证过）**、`align_lyrics.py`（单份识别对回歌词，已改成按顺序对齐）、`align_two_asr.py`（两份识别互相校验，10-16 写的，没再验证过）、`hold_tails.py`（补句尾长音）、`caption_font.py`（字幕字体子集）
- `tools/ci/render.yml`：云端分段渲染模板（三套画风通用；原曲 m4a、mp3 都认）；`tools/ci/splice_range.sh`：只重渲一段后按帧号接回整片
- `tools/check/plain_open.mjs`：像用户那样直接打开 studio.html（不带特殊权限），截图并报告字体加载了没有
- `tools/check/smoke.mjs`：**只查报错不出图**，按步长把整片（或一段）每帧画一遍，打印报错、最慢的帧，`--shots` 列镜头表。分身并行写长片时，每段写完跑它
- `src/player.js`：**studio.html 的播放器**（画面居中自适应，控制条同宽：播放/暂停、时间、进度条、倍速、音乐开关；空格播放，←→ 一秒，Shift+←→ 一帧）。音乐读项目 `config.js` 里的 `PROJECT.audio`（默认 `assets/music.m4a`），文件不在就静音放画面
- `render.mjs`：缩略图、逐帧、单帧、整片；`--size` 换画面比例（封面），`--page` 换页面（比如 `--page=manga/studio.html`）

## 13. 和用户协作的约定

- 回答先说大白话，少堆路径和内部机制名。装了或改了东西，要把等效命令写出来。
- **用户自己在浏览器里看片**（双击 studio.html）：样片、中间版本都不出 mp4，只有确认后的成片才渲染，而且一律上 GitHub Actions，不占用户电脑。自检用的缩略图在本地出，不用问。
- 渲染、编译这类重任务先问，同意只算这一次。
- 方案（提问、分镜、设定图）确认之前，不开始正式制作；确认之后一口气做完。
- 原曲、原视频截图、口令都不进 git。
- 临时文件不放 `/tmp`，放在项目目录下自己建的文件夹里。杀进程只用记下的 PID。
- 给分身写要求时写明：删文件只删自己文件夹里的，用 `&&` 连起来或写完整路径。《最美的期待》有个分身用了 `cd 目录; ... ; rm -rf work/*`，`cd` 一失败就会在别处删东西。
