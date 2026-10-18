# 现成素材（水彩 Clawd 引擎）

从以前的片子里拿出来的场景、道具和角色，都建立在根目录的水彩引擎上（`src/core.js`、`src/clawd.js`、`src/cast_tao.js`），不能和 `manga/` 混用。用的时候复制进项目的 `src/`，在 `studio.html` 里放到 `timeline.js` 之后加载（它们会用到 `LOOPS`）。原样拷来，没有改过；名字可能和别的文件撞（比如 `strobe`、`sofa`），只拷要用的那个。

## huainvhai/：Clawd 版《坏女孩》，霓虹夜城

- `world_city.js`：节拍脉冲 `kickK / clapK`（底鼓、拍手），跟着底鼓顿一下的相机 `camKick`；夜城配色 `NITE` 和 `palMix`；夜空、天际线、街道、路灯、公交站、公交车、电子屏、高架、栏杆、斑马线、打伞的路人、雨、红绿灯、他的房间、沙发、化妆镜框
- `world_club.js`：霓虹酒杯、酒吧门面、舞池 `danceRoom`、闪光 `strobe`、卡座、吧台、洗手间的镜子和水池、广告牌街的店面
- `cast_bad.js`：变坏的小桃 `badTao`（猫眼眼线、红唇、黑缎小蝴蝶结），墨镜，戴礼帽的陌生螃蟹 `stranger`，舞池人群 `crowdCrab / crowdSil`
- `props_bad.js`：手机（消息、来电、拒接）、眼线笔、鸡尾酒、威士忌杯、霓虹爱心、广告牌女孩
- `sheet_bad.js`：上面这些的设定图（`?loop=cast`、`?loop=props`）

## pinhui/：Clawd 版《把回忆拼好给你》，海边小镇

- `world.js`：五个时段的配色 `TOD / todMix`（黄昏 → 夜 → 黎明 → 白天 → 金色），天空、海、沙滩、房子、灯塔、栈桥、路灯、树、海鸥、鱼
- `photos.js`：拍立得照片里的画面 `PICS`，照片里的迷你角色 `miniCrab / miniTao`
- `common.js`（原来的 `scenes/common.js`）：画面定格缩成一张照片 `photoBegin / photoEnd`，大浪拍满屏的转场 `waveWipe`，一排照片 `photoRow`，抱着一叠照片 `photoStack`（要配 `photos.js`）；其余是那条片子的小工具 `cover / whiteIn / snapFlash`

## 没收进来的画风

- 剪影 + 拼图转场（《把回忆拼好给你》拼图版）：`~/project/testt/videos/pinhui-mv/`，`src/sil.js` 剪影人物，`src/compose.js` 拼图合成
- SVG 线稿、Q 版大头小人（《中华五千年》）：`~/project/testt/videos/china-5000-anim/`，自己的一套渲染脚本。**已收进 `lineart/`**（经《拼回忆》线稿版、《去年夏天》改过，带六个新角色），新片用 `lineart/`
