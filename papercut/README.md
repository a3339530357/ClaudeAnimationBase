# 剪纸画风（canvas 剪纸立体书）

每一样东西都是一片彩纸：剪刀剪出来的直线毛边、纸纹颗粒、下面一层浅浅的投影；东西像立体书一样从折痕上立起来、折回去。画面按定格动画走，每秒换 12 张，每张里每片纸都轻轻挪一点，像手摆纸偶。
来历：《最美的期待》DJ 版（2026-10-18，`~/project/testt/videos/zuimei-qidai-mv`）。三套样片（线稿 / 像素 / 剪纸）里用户选了剪纸："剪纸风非常好，就用这个"。10 镜 44.6 秒的成片上云出过片（公开仓库 a3339530357/zuimei-qidai-mv）。

- **适合**：梦境、童话、温暖治愈、颜色要满要亮的片子；东西按拍子一样样弹起来、折回去的卡点；翻页、立体书开合这类转场。
- **不适合**：写实、要像真人、暗沉的片子（纸是亮的，压暗了就不像纸）。伤感题材还没用这套做过。

## 打开看

不用渲染，双击 `index.html`：整部《最美的期待》剪纸 MV（44.6 秒），底下有播放条（空格播放、能拖）。`index.html?t=29.1` 打开停在 29.1 秒。原曲不在库里，没有音乐时静音播放；想边听边看，就把原曲放到 `assets/music.m4a`。

## 角色

`js/cast.js`，两个纸偶，每块都是剪出来的彩纸，肩膀用小铜钉 `brassPin()` 连着。原点在两脚中间的地面，往上是负 y。

| 角色 | 一句话 | 函数和参数 |
|---|---|---|
| 月芽（她） | 珊瑚橘波波头 + 齐刘海、黄星星发夹，薄荷青连衣裙白圆领，珊瑚红小鞋 | `drawYue(ctx, { x, y, s, rot（绕髋转，躺下 = -72）, open（睁眼）, look（-1 看左…1 看右）, mouth, armL, armR, heart（怀里的心 0..1）, hair, sq, noLegs })` |
| 阿晴（他） | 栗棕蓬松短发头顶翘一撮，芥末黄毛衣胸前一道天蓝条，蓝裤子白球鞋 | `drawQing(ctx, { x, y, s, open, look, mouth, armL, armR, wave（挥手）, rainbow（手里小彩虹 0..1）, sq（拍子上压一下）, noLegs })` |

**月芽和阿晴已经用过了，新片要换新主角**（用户："每个视频的人物都一样观众不喜欢"）。照 `cast.js` 的写法做新纸偶，先出一页新角色设定给用户挑。

## 怎么画出来的

- **剪纸**（`js/paper.js`）：形状都是点列（`ell`、`smooth`、`ribbon`、`capsule`、`rect`、`heartShape`、`star`）→ `scissor()` 剪出直线毛边 → `cut(key, …)` 按名字缓存（同一片纸每帧形状不变）→ `paper(ctx, 形状, 颜色, { lift 投影高度, alpha 薄纸, grain 纸纹, edge 白边 })` 贴上去。`pc(ctx, 名字, 造形状的函数, 颜色, 选项)` 是剪好就贴的简写。`wob(ctx, id)` 是定格抖动。另有剪纸字 `paperText`（站酷快乐体，要先加载 `../fonts/ZCOOLKuaiLe-Regular.ttf`，示例没用到）和数字 `drawNum`。
- **共用**（`js/common.js`）：时间曲线 `popK`（弹起，回弹最高点正好压在拍点上）、`foldK`（折回去，拍点上正好拍平）、`bump / beatPulse / downPulse`（拍上脉冲）；立体书的一层 `stand(ctx, 折痕 y, k, fn)`、整片弹出 `popAt`；形状 `band`（手撕天空纸带）、`hills`、`cloud`、`crescent`（月亮船）、`flower`、`house`、`heartPiece`；`sky` 天空纸带、`confetti` 纸屑、`rainbowStrip` 彩虹纸带、`sagLine`（晾衣绳那种垂线）、`steps`（按拍一格一格转）、`paperSun`、`sparkle`。
- **一帧**（`js/main.js`）：镜头表 `SHOTS = [[开始秒, 画这一镜的函数, 进这一镜的转场, 转场时长], …]`，转场在开始秒之前做完、新的一页正好落在拍上；镜头 `camera()` 小节第一拍推一下、每小节左右轻歪；转场 `TRANS`：`page` 翻页、`ripple` 涟漪、`rise` 上冲、`slide` 拉页、`iris` 钻月亮、`fold` 折下、`wheel` 转盘、`slats` 百叶，还有立体书封面合上又弹开（`s_dream.js` 的 `covers()`）；鼓回纸白闪；字幕用纸条贴字（`lyricFX(…, { style: 'slip' })`，马善政楷书）；片尾小卡 `endCard()`。
- **字幕**：`js/lyricfx.js` 和资源库 `lyricfx/lyricfx.js` 是同一份。
- **镜头**（`js/s_*.js`，示例那首歌专用，时间都按它的拍子写）：月亮船·紫粉夜空 `s_dream`、镜湖 `s_lake`、悬崖热气球 `s_cliff`、云上蹦床 `s_cloud`、纸船出海 `s_sea`、醒来·彩虹草地 `s_wake`、一棵树下的四季 `s_season`、摩天轮 `s_wheel`、金色白天的月亮船 `s_day`。想用里面的场景，复制画法再按新歌的拍子改时间。
- **性能**：每帧一般 10 毫秒左右；转场那一帧要画两页，第一次剪新形状时会到 400 毫秒左右。

## 用户的反馈

- "剪纸风非常好，就用这个"（三套样片里选的，样片原样在 `zuimei-qidai-mv/samples/D_papercut`）。
- 字幕另外做过 5 种剪纸风的对比（剪纸立体字、晾衣绳挂牌、折纸展开、拼贴剪字、镂空透光，在 `zuimei-qidai-mv/samples/D_subs/`），用户最后说"就用纸条贴字吧，全片都用"，所以这里只收了纸条贴字。

## 开新项目

```bash
B=~/project/testt/videos/ClaudeAnimationBase; P=~/project/testt/videos/新项目名
mkdir -p $P/assets $P/work/analysis $P/.github/workflows
cp -r $B/papercut/{index.html,js,render,tools,package.json,package-lock.json} $P/ && cp $B/papercut/ci/render.yml $P/.github/workflows/
cd $P && npm i      # 出片和自检脚本要 playwright-core
```

然后：
1. `js/config.js`：`DUR`（片长，云端流程用正则读 `DUR = 数字`，别改这一行的写法）、`MUSIC_END`、拍子 `BP / BO`（`bt(n)` = 第 n 拍）、`PROJECT.audio`。
2. `js/music.js`：歌词 `LY`，从项目的 `work/analysis/timing.json` 抄。
3. 镜头：新建自己的 `js/s_xxx.js`，`main.js` 的 `SHOTS` 换成自己的，`index.html` 里换掉示例的 `s_*.js`。`main.js` 里还有几处是跟示例那首歌绑定的，要一起改：`camera()` 的两处特例、`drawShot()` 里的 `covers()`、纸白闪的两个时间、`BEATS` 的拍数、`lyricFX` 的 `lastUntil`、`endCard()` 的时间和片名。`common.js` 里的 `DREAM_SKY`、`MOON`、`STARS` 这些是示例的布置，用不上可以删。
4. 字体子集：`<带 fonttools 的 python> -I tools/make_font.py work/analysis/timing.json $B/fonts/MaShanZheng-Regular.ttf '片名·MV制作小冰OvO'`，生成 `js/font_data.js`。歌词或片名改了要重跑。
5. 音乐结尾：`render/music_tail.txt` 是示例那首歌的回声结尾（音乐硬切断在满音量时用），时间是那首歌的。新歌不需要就删掉，云端会改成补静音。

**看片**：用户自己双击 `index.html`，样片和中间版本都不出 mp4。

**自检缩略图**：`mkdir -p work/t && TMPDIR=work/t node tools/check.mjs check.jpg 24 6 320`（像双击那样打开，查报错、字体、音乐，全片均匀抽帧拼一张，打印每帧毫秒）；指定时间点用 `TMPDIR=work/t node render/stills.mjs --t 1.2,29.1 --out work/a.jpg`。`TMPDIR` 要写短的相对路径，写成很深的绝对路径时无界面 Chrome 会报 "Socket path too long" 起不来。

**成片**：上云，用 `.github/workflows/render.yml`。原曲加密成 `assets/music.m4a.gpg`（mp3 也行），口令放仓库 Secret `MUSIC_KEY`，手动触发：`gh workflow run render.yml -f segments=20`。本机 `node render/render.mjs` 也能出，但成片一律上云，不占用户电脑。
