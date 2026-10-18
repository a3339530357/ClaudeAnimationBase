# 线稿画风（SVG）

米黄纸上的墨线 Q 版大头小人，线条会轻轻抖（像手绘动画），东西可以一笔一笔画出来。
来历：《中华五千年》线稿动画 → 《把回忆拼好给你》线稿版（`~/project/testt/videos/pinhui-lineart-mv`，用户最喜欢的画风）→ 《去年夏天》样片 B（2026-10-18，提亮 + 开局按拍弹入 + 六个新角色）。

- **适合**：照歌词逐句画、可爱、轻松、日常小故事；要画很多小物件、一笔笔长出来的画面。
- **不适合**：要重光影、厚涂、写实的片子。

## 打开看

不用渲染，双击就行：

- `cast.html`：**角色设定页**，3 个女生 + 3 个男生，每人一张全身像加三个表情。用户评价："六个角色都特别好，之后其他视频都可以考虑复用"。
- `index.html`：示例，是《去年夏天》开头 8 秒。0.21 秒起，地面、站牌、人、太阳**按拍子一样一样弹进来**（回弹最高点压在拍点上）；歌词用动态排版，关键词放在暖黄底块上。示例里的女孩还是《拼回忆》的旧角色，等《去年夏天》做完换成白栀版。原曲不在库里，没有音乐时用时钟走、静音播放。

## 角色

`js/cast_new.js`。用法：`inkParts(castPerson(CAST[i], { face, hands, look, walk }))`；只画头用 `castHead(sp, o, hx, hy, s)`。

| 角色 | 一句话 | 主题色 | 手里 |
|---|---|---|---|
| 夏柚 | 元气体育生：高马尾、薄荷发带、运动短裤 | 薄荷绿 | 水壶 |
| 白栀 | 安静文艺：长直发、草帽蓝丝带、白碎花裙 | 蓝 | 夹着压花的书 |
| 糖豆 | 古灵精怪：双丸子头、大圆眼镜、雀斑、背带裤 | 粉 | 拍立得 |
| 阿野 | 篮球少年：刺头、创可贴、23 号球衣、晒黑 | 橙 | 篮球 |
| 江屿 | 白衬衫：中分刘海、挂脖蓝耳机、话少 | 蓝 | 橘子汽水 |
| 卷卷 | 滑板男孩：自然卷、反戴棒球帽、宽 T 恤 | 绿 | 滑板 |

- 加新角色：在 `HAIRDO` 里写发型（`back` 压在身体下面，比如马尾、长发；`front` 是刘海、帽子），在 `CAST` 里写衣服（`top`：tee / tank / shirt / oversize / dress；`bottom`：shorts / longshorts / overalls / pants）、主题色、身高 `hk`、配件（`glasses`、`freckles`、`bandaid`、`phones`、`lashes`、`brows`），在 `PROPS_NEW` 里写手里的东西。
- 表情用 `person.js` 的 `FACE`（normal、smile、happy、laugh、dreamy、shy、sad、cry、surprised、scared、panic、determined、pout、sleep），姿势用 `POSE`。
- 改了名字或介绍，要重做设定页的字体子集：`<venv>/bin/python -I tools/make_cast_font.py ../fonts/ZCOOLKuaiLe-Regular.ttf`。
- `person.js` 里原来的「她 / 他」（黑短发红发夹、圆眼镜耳夹铅笔）是《拼回忆》的角色，**别再拿来当主角**。用户说过："每个视频的人物都一样，观众不喜欢"。新片先出一页新角色设定给用户挑。
- 目前只有正面站姿，可以挥手、抱东西、叉腰。走路用 `o.walk`（腿会动）。背影、坐、侧脸在《去年夏天》正片里补，补完再合并回来。

## 用户的反馈（这套画风踩过的）

- **不要大块黑**："为什么画面很黑，人物也很黑"。头发用暖棕这类浅色填充，不要实心墨黑；关键词块用暖黄底配墨色字，不用黑底；网页外框和播放条用浅色；伤心的情绪靠乌云、雨和表情来表现，别给整张纸压灰（`tint` 浓度 ≤ 0.08）。
- **开局按拍子弹入**："开局进场的时候用弹入的方式卡点进入"。第一拍之前只有纸，之后每拍弹进来一样东西，示例在 `js/scenes/sample.js`。
- 线稿版《拼回忆》的教训：细的手写字看不清，字幕要有底或者粗描边。

## 怎么画出来的

- 每一帧都把整张 SVG 从头画一遍（`svg.js` 的 `G()` 分组、`P()` 画线、`TX()` 写字），所以画面只由时间 t 决定，可以随意跳帧。
- 人物和物件都是「部件列表」，交给 `inkParts(list, k)`，按 k 一笔笔画出来。
- 线条抖动：SVG 滤镜 `feTurbulence + feDisplacementMap`，每秒换 10 次种子（`main.js`）。
- 镜头表：`shot(拍号, 名字, fn)`，在 `js/scenes/common.js`。转场有翻页 `flipUp / flipSide`、排线擦 `hatchWipe`、甩镜头 `whip`。
- 字幕是盖在 SVG 上的透明 canvas，用 `lyricfx.js` 的动态排版。

## 开新项目

```bash
B=~/project/testt/videos/ClaudeAnimationBase; P=~/project/testt/videos/新项目名
mkdir -p $P/assets $P/work/analysis $P/.github/workflows
cp -r $B/lineart/{index.html,cast.html,js,render,tools,package.json} $P/ && cp $B/lineart/ci/render.yml $P/.github/workflows/
cd $P && npm i      # 出片脚本要 playwright-core（只在出成片、截缩略图时用）
```

然后：
1. 改 `js/config.js`（拍子、`DUR`、`AUDIO`）和 `js/music.js`（歌词）。
2. 在 `js/scenes/` 写镜头，`index.html` 里把 `sample.js` 换成自己的文件。
3. 重做字体子集：`tools/make_font.py` 读 `js/music.js` 里用到的字。

**看片**：用户自己双击 `index.html`，样片和中间版本都不出 mp4。

**自检缩略图**：`node render/stills.mjs --t 1,2.5,4 --cols 3 --out out/check/a.jpg`。

**成片**：上云，用 `.github/workflows/render.yml`。原曲加密成 `assets/music.m4a.gpg`（mp3 也行），口令放仓库 Secret `MUSIC_KEY`，手动触发：`gh workflow run render.yml`。本机 `node render/render.mjs` 也能出，但成片一律上云，不占用户电脑。
