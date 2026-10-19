# make_check.py: 对拍检查片。写代码之前先用它验证卡点: 每个镜头一块底色、每拍一个闪块、重点卡点全屏白闪 + 提示音、
# 蓄力条、卡拉OK歌词、每帧时间码。出两条视频: 带节拍器的（检查拍子准不准）和只有原曲的（感受节奏）。
#
# 用法: python -I make_check.py <timing.json> <音乐> <输出目录> [plan.json]
#   timing.json  beatgrid.py 写出的那份，再补上 lyrics: [[开始秒, 结束秒, "歌词"(, [[字开始, 字结束], ...])], ...]  逐字时间可选
#   plan.json    分镜（可选）。不给就每 8 拍一块底色、每 32 拍一段，卡点用 timing.json 里的 hits。格式:
#     { "sections": [[起拍, "段名"], ...],
#       "shots":    [[起拍, 镜头号, "地点", "动作", "#底色"], ...],
#       "subs":     [[拍号, "镜头内的子画面", "#底色"], ...],          (可选)
#       "cues":     [[拍号, "卡点名", "big|act|vis"], ...],             big = 全屏白闪+大叮，act = 黄框+小叮，vis = 只有文字
#       "riser":    [开始秒, 结束秒] }                                   (可选) 蓄力条
# 依赖: numpy；ffmpeg 要带 libass；字体 Noto Sans CJK SC。
# 不是 4 拍的小节：timing.json 的 beat 里写 "odd_bars": [[起拍, 拍数], ...]（《多远都要在一起》桥段第 188 拍是个 2 拍的小节，
#   之后小节线整体后移 2 拍："odd_bars": [[188, 2]]）。不写就是每 4 拍一小节。
import bisect, json, subprocess, sys, wave
import numpy as np

timing_p, music_p, out = sys.argv[1], sys.argv[2], sys.argv[3]
TM = json.load(open(timing_p, encoding='utf-8'))
PL = json.load(open(sys.argv[4], encoding='utf-8')) if len(sys.argv) > 4 else {}
P, OFF, DUR = TM['beat']['period'], TM['beat']['offset'], TM['duration']
bt = lambda n: OFF + n * P
NB = int((DUR - OFF) / P) + 1                       # 拍数(含最后半拍)
TM.setdefault('lyrics', [])
ODD = {b: L for b, L in TM['beat'].get('odd_bars', [])}
BAR0 = [0]
while BAR0[-1] < NB + 8: BAR0.append(BAR0[-1] + ODD.get(BAR0[-1], 4))
def barpos(n):                                       # → (第几小节 从 0 起, 小节内第几拍 从 0 起)
    k = bisect.bisect_right(BAR0, n) - 1; return k, n - BAR0[k]

COLS = ['#C8642A', '#2E6FB7', '#B8901C', '#3A8F6B', '#8E44AD', '#2C7A7B', '#C2457A', '#A0522D']
SEC = [tuple(s) for s in PL.get('sections', [[b, f'第 {b // 32 + 1} 段'] for b in range(0, NB, 32)])]
SHOTS = [tuple(s) for s in PL.get('shots', [[b, b // 8 + 1, f'第 {b // 4 + 1}–{b // 4 + 2} 小节', '', COLS[(b // 8) % len(COLS)]] for b in range(0, NB, 8)])]
SUBS = [tuple(s) for s in PL.get('subs', [])]
# 没给 cues 才用 hits 里带拍号的那些（hits 里也可能有蓄力段 {t0, t1}、一串卡点 [...]，没有 beat 的跳过）
CUES = [tuple(s) for s in PL['cues']] if 'cues' in PL else \
       [(h['beat'], h['note'], 'big' if '鼓' in h['note'] else 'act') for h in TM.get('hits', {}).values() if isinstance(h, dict) and 0 <= h.get('beat', -1) < NB]
CUES.sort()
RISER = tuple(PL['riser']) if 'riser' in PL else None

# ---------------- 音频: 原曲 + 节拍器 ----------------
SR = 44100
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', music_p, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
music = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
clk = np.zeros(len(music))
def tone(freqs, amps, tau, dur, gain):
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t / tau) * (1 - np.exp(-t / .0008))
    return gain * env * sum(a * np.sin(2 * np.pi * f * t) for f, a in zip(freqs, amps))
TICK = tone([2000], [1], .010, .05, .28)
DOWN = tone([1300, 2600], [1, .4], .018, .08, .42)
DING = tone([2093, 4186], [1, .3], .12, .45, .22)
BIG = tone([1568, 2349, 3136], [1, .6, .3], .25, .8, .30)
def put(sig, t):
    i = int(round(t * SR)); j = min(len(clk), i + len(sig))
    if 0 <= i < len(clk): clk[i:j] += sig[:j - i]
for n in range(NB):
    put(DOWN if barpos(n)[1] == 0 else TICK, bt(n))
for n, _, lv in CUES:
    if lv == 'act': put(DING, bt(n))
    if lv == 'big': put(BIG, bt(n))
mix = music * .8 + clk[:, None]
pk = np.abs(mix).max()
if pk > .98: mix *= .98 / pk
with wave.open(f'{out}/click_mix.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(f'音频: {len(music)/SR:.2f}s, 峰值缩放 {min(1, .98/pk):.2f}')

# ---------------- ASS 字幕层 ----------------
def ts(t):
    cs = int(round(max(0, t) * 100)); return f'{cs//360000}:{cs//6000%60:02d}:{cs//100%60:02d}.{cs%100:02d}'
def bgr(h, a=0): h = h.lstrip('#'); return f'&H{a:02X}{h[4:6]}{h[2:4]}{h[0:2]}&'
EV = []
def ev(layer, t0, t1, style, text): EV.append(f'Dialogue: {layer},{ts(t0)},{ts(t1)},{style},,0,0,0,,{text}')
RECT = 'm 0 0 l 1280 0 1280 720 0 720'
FRAME = 'm 0 0 l 1280 0 1280 18 0 18 m 0 702 l 1280 702 1280 720 0 720 m 0 0 l 18 0 18 720 0 720 m 1262 0 l 1280 0 1280 720 1262 720'
def draw(layer, t0, t1, shape, col, extra='', pos=(0, 0)): ev(layer, t0, t1, 'Box', f'{{\\an7\\pos({pos[0]},{pos[1]})\\1c{col}\\bord0\\shad0{extra}\\p1}}{shape}{{\\p0}}')

END = DUR
starts = [0 if s[0] == 0 else bt(s[0]) for s in SHOTS] + [END]
for k, (b, num, place, act, col) in enumerate(SHOTS):
    t0, t1 = starts[k], starts[k + 1]
    draw(0, t0, t1, RECT, bgr(col))
    ev(10, t0, t1, 'Title', f'{{\\pos(640,285)}}#{num}  {place}')
    ev(10, t0, t1, 'Desc', f'{{\\pos(640,365)}}{act}')
    b1 = SHOTS[k + 1][0] if k + 1 < len(SHOTS) else NB
    ev(10, t0, t1, 'Small', f'{{\\an5\\pos(640,420)\\1a&H40&}}{t0:.2f} – {t1:.2f}s   第 {b}–{b1} 拍   ({t1-t0:.2f}s)')
subs_sorted = sorted(SUBS)
for i, (b, text, col) in enumerate(subs_sorted):
    t0 = bt(b); nxt = [bt(x[0]) for x in subs_sorted if x[0] > b]
    shot_end = min(s for s in starts if s > t0 + 1e-6)
    t1 = min([shot_end] + nxt)
    draw(1, t0, t1, RECT, bgr(col))
    ev(11, t0, t1, 'Desc', f'{{\\pos(640,470)\\1c&H00E5FF&}}{text}')
for b, name in SEC:
    nxt = [x[0] for x in SEC if x[0] > b]; t1 = bt(nxt[0]) if nxt else END
    ev(10, 0 if b == 0 else bt(b), t1, 'Small', f'{{\\an9\\pos(1255,22)}}{name}')
# 每拍闪块 + 小节/拍计数
for n in range(NB):
    t0, t1 = bt(n), min(END, bt(n + 1)); bk, bp = barpos(n); down = bp == 0
    s = 72 if down else 46; c = '#FF5A36' if down else '#FFFFFF'
    draw(20, t0, min(t1, t0 + .13), f'm 0 0 l {s} 0 {s} {s} 0 {s}', bgr(c), pos=(60 - s//2, 58 - s//2))
    ev(20, t0, t1, 'Small', f'{{\\an4\\pos(115,58)}}小节 {bk + 1} · 拍 {bp + 1}   (第 {n} 拍)')
# 卡点
for k, (n, name, lv) in enumerate(CUES):
    t0 = bt(n); te = min(t0 + .75, bt(CUES[k + 1][0]) if k + 1 < len(CUES) else END)
    if lv == 'big':
        draw(5, t0, t0 + .35, RECT, bgr('#FFFFFF'), '\\fad(0,320)')
    if lv == 'act':
        draw(15, t0, t0 + .45, FRAME, bgr('#FFE000'), '\\fad(0,300)')
    sz = 48 if lv == 'big' else 40
    ev(30, t0, te, 'Cue', f'{{\\an8\\pos(640,120)\\fs{sz}\\fad(0,250)\\fscx135\\fscy135\\t(0,140,\\fscx100\\fscy100)}}{name}')
# 蓄力条
if RISER:
    r0, r1 = RISER
    draw(16, r0, r1, 'm 0 0 l 1280 0 1280 14 0 14', bgr('#FFFFFF'), pos=(0, 560), extra=f'\\clip(0,560,0,574)\\t(0,{int((r1-r0)*1000)},\\clip(0,560,1280,574))')
    ev(16, r0, r1, 'Small', '{\\an5\\pos(640,595)}蓄力 ↑')
# 卡拉OK歌词: 有逐字时间(第 4 项 [[字开始, 字结束], ...])就按字走，提前 0.4s 亮出整句、唱完停 0.5s；没有就句内匀速
LY = TM['lyrics']
for k, L in enumerate(LY):
    t0, t1, line = L[:3]
    if len(L) < 4:
        cs = max(1, int(round((t1 - t0) * 100 / len(line))))
        ev(40, t0, t1, 'Lyric', ''.join(f'{{\\kf{cs}}}{ch}' for ch in line)); continue
    prev = LY[k - 1][1] if k else 0
    s0 = max(t0 - .4, min(t0, prev + .05)); nx = LY[k + 1][0] if k + 1 < len(LY) else END
    s1 = min(t1 + .5, max(t1, nx - min(.4, max(0, nx - t1 - .05))))
    tags, cur = [], s0
    for ch, (a, b) in zip(line, L[3]):
        gap = int(round((a - cur) * 100)); dur = max(1, int(round((b - a) * 100)))
        tags.append((f'{{\\k{gap}}}' if gap > 0 else '') + f'{{\\kf{dur}}}{ch}'); cur = a + dur / 100
    ev(40, s0, s1, 'Lyric', ''.join(tags))
# 时间码(每帧一条)
for i in range(int(END * 30) + 1):
    ev(50, i / 30, (i + 1) / 30, 'TC', f'{{\\an1\\pos(18,706)}}{i/30:05.2f}s')

HEAD = f'''[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Box,Noto Sans CJK SC,20,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Title,Noto Sans CJK SC,66,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,0,5,0,0,0,1
Style: Desc,Noto Sans CJK SC,34,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,2.5,0,5,0,0,0,1
Style: Small,Noto Sans CJK SC,24,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,7,0,0,0,1
Style: Cue,Noto Sans CJK SC,40,&H0000E5FF,&H0000E5FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3.5,0,8,0,0,0,1
Style: Lyric,Noto Sans CJK SC,46,&H0000E5FF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,2,0,1,3,0,2,0,0,0,1
Style: TC,Noto Sans Mono CJK SC,30,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,2.5,0,1,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
# 歌词放在时间码上方
EV = [e.replace(',Lyric,,0,0,0,,', ',Lyric,,0,0,0,,{\\an2\\pos(640,668)}') for e in EV]
open(f'{out}/check.ass', 'w', encoding='utf-8').write(HEAD + '\n'.join(EV) + '\n')
print(f'ASS: {len(EV)} 条事件, 镜头 {len(SHOTS)}, 卡点 {len(CUES)}, 歌词 {len(TM["lyrics"])} 句')

# ---------------- 出片: 纯色底 + 字幕层，配两种音轨 ----------------
for audio, name in [(f'{out}/click_mix.wav', '对拍_带节拍器.mp4'), (music_p, '对拍_原曲.mp4')]:
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f'color=c=0x111111:s=1280x720:r=30:d={DUR}', '-i', audio,
                    '-vf', f'ass={out}/check.ass', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', f'{out}/{name}'], check=True)
    print('出片', f'{out}/{name}')
