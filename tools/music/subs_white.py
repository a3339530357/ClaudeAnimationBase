# subs_white.py: 从视频里烧录的白色字幕读出每句歌词的开始、结束时间（不认字，只断句；文字以用户给的歌词为准）。
#
# 用法: python -I subs_white.py <视频> --y0 595 --h 115 [--start 0] [--scale 1592:720] [--thresh 228] [--minpx 400] [--png subs.png]
#   --y0 --h   字幕所在的横条（像素，按 --scale 之后的画面算）。先抽一帧看字幕在哪: ffmpeg -ss 10 -i 视频 -frames:v 1 a.png
#   --start    从第几秒起统计"常驻白色像素"（录屏的工具栏、水印），统计出来的固定 UI 会被扣掉
#   --thresh   多白算白（RGB 三个通道都大于它）；--minpx 一帧里至少多少白像素算"有字幕"
#   --png      每句一行的缩略图，对照着核对歌词
# 断句: 有字幕的帧连成一段；同一段里白像素的形状突然大变（换了一句）就切开；相隔 < 4 帧的合并，短于 5 帧的丢掉。
# 依赖: numpy pillow，ffmpeg
import argparse, subprocess
import numpy as np
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('--y0', type=int, required=True); ap.add_argument('--h', type=int, required=True)
ap.add_argument('--start', type=float, default=0); ap.add_argument('--scale', default=''); ap.add_argument('--thresh', type=int, default=228)
ap.add_argument('--minpx', type=int, default=400); ap.add_argument('--png', default='subs.png'); ap.add_argument('--fps', type=int, default=30)
A = ap.parse_args()

probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', A.video], capture_output=True, text=True, check=True).stdout.strip()
Wd, Hd = map(int, (A.scale.split(':') if A.scale else probe.split(',')))
vf = (f'scale={Wd}:{Hd},' if A.scale else '') + f'fps={A.fps},crop={Wd}:{A.h}:0:{A.y0}'
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', A.video, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, A.h, Wd, 3)
n, FPS = len(fr), A.fps

white = (fr[..., 0] > A.thresh) & (fr[..., 1] > A.thresh) & (fr[..., 2] > A.thresh)
i0 = int(A.start * FPS)
bg = np.median(white[i0:].astype(np.uint8), 0) > .5                # 一直是白的 = 固定 UI，扣掉
sub = white.copy(); sub[:, bg] = False
cnt = sub.reshape(n, -1).sum(1)
print(f'{n} 帧，扣掉固定 UI 像素 {int(bg.sum())} 个')

segs, cur = [], None
for i in range(n):
    on = cnt[i] > A.minpx
    if on and cur is not None:
        a = sub[cur:i].mean(0) > .3; inter = (a & sub[i]).sum(); uni = (a | sub[i]).sum()
        if uni and inter / uni < .5: segs.append((cur, i)); cur = i
    elif on and cur is None: cur = i
    elif not on and cur is not None: segs.append((cur, i)); cur = None
if cur is not None: segs.append((cur, n))
merged = []
for s in segs:
    if merged and s[0] - merged[-1][1] < 4: merged[-1] = (merged[-1][0], s[1])
    else: merged.append(s)
merged = [s for s in merged if s[1] - s[0] >= 5]
print(f'共 {len(merged)} 句:')
for k, (a, e) in enumerate(merged): print(f'  {k:2d}  {a / FPS:6.2f} – {e / FPS:6.2f}  ({(e - a) / FPS:.2f}s)')
print('lyrics 骨架（把文字换成用户给的歌词）:')
print('[' + ', '.join(f'[{a / FPS:.2f}, {e / FPS:.2f}, "第{k}句"]' for k, (a, e) in enumerate(merged)) + ']')

CH, half = A.h // 2 + 10, Wd // 2
canvas = Image.new('RGB', (220 + half, CH * len(merged) + 10), (18, 18, 18)); d = ImageDraw.Draw(canvas)
for k, (a, e) in enumerate(merged):
    canvas.paste(Image.fromarray(fr[(a + e) // 2]).resize((half, A.h // 2)), (220, 5 + k * CH))
    d.text((8, 5 + k * CH + A.h // 4 - 6), f'{k:2d}  {a / FPS:6.2f}-{e / FPS:6.2f}', fill=(255, 255, 100))
canvas.save(A.png); print('缩略图', A.png)
