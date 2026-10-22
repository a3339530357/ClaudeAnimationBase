# beattrack.py: 速度会漂的歌用的逐拍跟踪，把每一拍的时间写进 timing.json 的 beat.times（make_check.py 认）。
# 《我怀念的》写的（2026-10）：没跟节拍器录，133 → 142 BPM 一路漂，前 112 秒没有鼓，beatgrid.py 的固定公式越走越偏。
# beatgrid.py 会先分段量速度，各段差超过 1% 时提示改用这个。
#
# 用法: python -I beattrack.py <原曲> <分轨目录> --bpm 140 [--half] [--bars bars.json] [--out timing.json]
#   分轨目录   sep_vocals.py 写出的 drums.wav、bass.wav、other.wav（老版本只有 acc.wav 时用 acc - drums 当伴奏）
#   --bpm      细网格的大概 BPM（beatgrid.py 量出来的那个）
#   --half     按一半速度记拍（抒情歌：140 的八分音符网格 → 70 BPM 一拍，一句歌词约一小节）
#   --bars     小节起点在细网格上的拍号（JSON 列表）。给了就按它生成 times 和 odd_bars；不给只写细网格，先看诊断表再定
#   --out      timing.json：写 beat.times / grid / odd_bars，hits 按时间重新对到最近的拍；里面已有 lyrics 的话（cmp_lrc.py
#              或 align_lyrics.py 写的），打印每句落在细网格第几拍、同一句歌词在几遍里相差几拍
#
# 做法: 有鼓的段用鼓轨的起音跟拍，没鼓的段用伴奏（贝斯 + 其他，不含鼓）的起音跟拍，各自用 librosa 的 DP 跟拍（tightness 1600），
#       在交界处拼起来，再做 ±4 拍线性平滑（去掉单拍抖动，保留速度变化）。
# 怎么验证: 同一句歌词在几遍副歌里相差的拍数应该几乎是整数（±0.1 拍）。固定公式那次是 163.4、162.4 这样一路变。
# 小节线怎么定（看诊断表）: 有贝斯的段看贝斯换音最多的位置（n%8），有鼓的段看底鼓最重的位置，镲片重的位置就是半速拍的奇偶；
#       没鼓没贝斯的段靠歌词：同一句在几遍里离小节线的位置应该一样。相差拍数是“8 的倍数 + 1”（细网格）= 中间某处音乐
#       自己拖了半拍，那一小节在 --bars 里写成 9 格（相邻两个差 9），生成的拍表里最后一拍长 1.5 倍。差 4 格 = 2 拍的短小节。
import argparse, json, os, numpy as np, librosa
ap = argparse.ArgumentParser()
ap.add_argument('audio'); ap.add_argument('stems'); ap.add_argument('--bpm', type=float, required=True)
ap.add_argument('--half', action='store_true'); ap.add_argument('--bars'); ap.add_argument('--out')
A = ap.parse_args()
sr, hop = 22050, 64; fr = sr / hop
ld = lambda p: librosa.load(p, sr=sr, mono=True)[0]
def onset(y, lo=0, hi=1e9):
    S = np.abs(librosa.stft(y, n_fft=1024, hop_length=hop)); f = librosa.fft_frequencies(sr=sr, n_fft=1024)
    return librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[(f >= lo) & (f < hi)]), sr=sr, hop_length=hop)
P = lambda name: os.path.join(A.stems, name)
dur = librosa.get_duration(path=A.audio)
dr = ld(P('drums.wav'))
if os.path.exists(P('other.wav')):
    acc = ld(P('other.wav')); acc = acc + ld(P('bass.wav'))[:len(acc)] if os.path.exists(P('bass.wav')) else acc
else:
    acc = ld(P('acc.wav')); acc = acc[:len(dr)] - dr[:len(acc)]
Ed, Ek, Ea = onset(dr), onset(dr, 30, 110), onset(acc, 60, 6000)
Eh = onset(dr, 8000)

# ---- 哪些段有鼓：鼓轨响度（2 秒平滑）超过 90 分位的 20%，两头各收 3 秒（鼓常常是轻轻进来的），短于 10 秒的不算 ----
r = librosa.feature.rms(y=dr, hop_length=512)[0]; rf = sr / 512
rs = np.convolve(r, np.ones(int(2 * rf)) / int(2 * rf), 'same'); on = rs > max(.12 * np.percentile(rs, 90), .003)   # .003: 整首没鼓时别把底噪当鼓
segs, i = [], 0
while i < len(on):
    if on[i]:
        j = i
        while j < len(on) and on[j]: j += 1
        a, b = i / rf + 3, j / rf - 3
        if b - a >= 10: segs.append((a, b))
        i = j
    else: i += 1
print(f'时长 {dur:.2f}s   有鼓的段（用鼓轨跟拍）:', ', '.join(f'{a:.1f}–{b:.1f}s' for a, b in segs) or '没有，全用伴奏')
indrum = lambda t: any(a <= t < b for a, b in segs)

# ---- 跟拍 + 拼接 + 平滑 ----
# 有鼓、没鼓的段交替，每段单独跟（多带 5 秒上下文，只取段内的拍）。整首一起跟时，速度散的地方（前奏进主歌）会和单独跟的结果差一拍
bounds = [0.0] + [x for ab in segs for x in ab] + [dur]
parts = [(bounds[i], bounds[i + 1], i % 2 == 1) for i in range(len(bounds) - 1) if bounds[i + 1] > bounds[i]]
def trk(E, a, c):
    s0, s1 = max(0, int((a - 5) * fr)), min(len(E), int((c + 5) * fr))
    bb = np.array(librosa.beat.beat_track(onset_envelope=E[s0:s1], sr=sr, hop_length=hop, start_bpm=A.bpm, tightness=1600, units='time', trim=False)[1]) + s0 / fr
    return bb[(bb >= a) & (bb < c)]
b = np.sort(np.concatenate([trk(Ed if dm else Ea, a, c) for a, c, dm in parts]))
M = np.median(np.diff(b)); fix = 0
while True:                                                  # 接口处多出来、少掉的拍
    d = np.diff(b); k = int(np.argmin(d))
    if d[k] < .6 * M: b = np.delete(b, k + 1); fix += 1; continue
    k = int(np.argmax(d))
    if d[k] > 1.6 * M: b = np.insert(b, k + 1, (b[k] + b[k + 1]) / 2); fix += 1; continue
    break
W = 4; idx = np.arange(len(b))
G = np.array([np.polyval(np.polyfit(idx[max(0, i - W):i + W + 1], b[max(0, i - W):i + W + 1], 1), i) for i in idx])
print(f'细网格 {len(G)} 拍 {G[0]:.2f}…{G[-1]:.2f}s，接口修了 {fix} 处，平滑最多挪了 {abs(G - b).max() * 1000:.0f} ms')
d = np.diff(G); print('BPM 走势（每 32 拍）:', ' '.join(f'{60 / d[i:i + 32].mean():.1f}' for i in range(0, len(d), 32)))
pick = lambda E, t: E[max(0, int(t * fr) - 3): int(t * fr) + 6].max()
print('分段核对（拍点对起音的最佳偏移应在 ±20 ms，清晰度越高越可信）:')
for a in range(0, int(dur), 24):
    sel = G[(G >= a) & (G < a + 24)]
    if not len(sel): continue
    E = Ed if indrum(a + 12) else Ea; rr = []
    for x in np.arange(-.1, .101, .005):
        ii = np.clip(np.round((sel + x) * fr).astype(int), 0, len(E) - 1); rr.append(E[ii].mean())
    rr = np.array(rr); print(f'  {a:3d}–{a + 24:3d}s {"鼓轨" if indrum(a + 12) else "伴奏"}  偏移 {(-.1 + rr.argmax() * .005) * 1000:+4.0f} ms  清晰度 {rr.max() / np.median(rr):.2f}')

# ---- 小节线诊断：每 16 拍一窗，各种信号最强的位置 ----
bassnov = None
if os.path.exists(P('bass.wav')):
    yb = ld(P('bass.wav')); h2 = 256
    C = librosa.feature.chroma_cqt(y=yb, sr=sr, hop_length=h2, fmin=librosa.note_to_hz('C1'), n_octaves=4)
    rb = librosa.feature.rms(y=yb, hop_length=h2)[0]; q = sr / h2
    def cv(n): a, e = int(G[n] * q), int(G[min(n + 1, len(G) - 1)] * q) + 1; v = C[:, a:e].mean(1); return v / (np.linalg.norm(v) + 1e-9)
    V = [cv(n) for n in range(len(G))]
    bassnov = np.zeros(len(G))
    for n in range(2, len(G) - 2):
        if rb[int(G[n] * q)] > .1 * np.percentile(rb, 90): bassnov[n] = 1 - ((V[n - 2] + V[n - 1]) / 2) @ ((V[n] + V[n + 1]) / 2)
print('\n小节线诊断（细网格拍号 n）：每 16 拍一窗，镲片强的奇偶 = 半速拍落在哪边；底鼓最重、贝斯换音最多的 n%8 ≈ 小节第一拍')
print('  起拍   时间   镲奇偶  底鼓n%8  贝斯n%8  伴奏n%8')
for lo in range(0, len(G) - 8, 16):
    ns = range(lo, min(lo + 16, len(G))); t = G[lo]; dm = indrum(t + 3)
    top = lambda E, k: int(np.argmax([np.mean([pick(E, G[n]) for n in ns if n % k == j] or [0]) for j in range(k)]))
    par = '偶' if top(Eh, 2) == 0 else '奇'
    bn = '' if bassnov is None or not bassnov[list(ns)].any() else str(int(np.argmax([np.mean([bassnov[n] for n in ns if n % 8 == j] or [0]) for j in range(8)])))
    print(f'  {lo:4d} {t:6.1f}s   {par if dm else " -":>3}    {str(top(Ek, 8)) if dm else "-":>3}      {bn or "-":>3}      {top(Ea, 8):>3}')

# ---- 写 timing.json ----
if not A.out: raise SystemExit
T = json.load(open(A.out, encoding='utf-8')) if os.path.exists(A.out) else {'duration': round(dur, 3), 'lyrics': []}
gt = lambda n: float(G[n]) if n < len(G) else float(G[-1] + (n - len(G) + 1) * (G[-1] - G[-2]))
step = 2 if A.half else 1
if A.bars:
    bars = json.load(open(A.bars)); beats, odd = [], []
    for i, b0 in enumerate(bars):
        L = (bars[i + 1] - b0) if i + 1 < len(bars) else 8 if A.half else 4
        k = max(1, L // step)
        if k != 4: odd.append([len(beats), k])
        beats += [b0 + step * j for j in range(k)]
    while gt(beats[-1] + step) < dur: beats.append(beats[-1] + step)
    note = 'n 从第一条小节线数起，每 4 拍一小节；odd_bars 里的是拍数不是 4 的小节（make_check.py 照着数）'
else:
    par = 0
    if A.half: par = int(sum(pick(Eh, G[n]) for n in range(1, len(G), 2)) > sum(pick(Eh, G[n]) for n in range(0, len(G), 2)))
    beats, odd = list(range(par, len(G), step)), []
    note = '还没定小节线：n%4==0 不一定是小节第一拍，看诊断表定了以后用 --bars 重写'
times = [round(gt(n), 4) for n in beats if gt(n) < dur]
iv = np.diff(times); Pm = float(np.median(iv))
T['beat'] = {'times': times, 'period': round(Pm, 5), 'offset': times[0], 'bpm': round(60 / Pm, 2), 'odd_bars': odd,
             'grid': [round(float(x), 4) for x in G], 'grid_step': step,
             'formula': '第 n 拍 = times[n]（逐拍跟踪，beattrack.py）；grid 是细网格，times[n] = grid[某个拍号]', 'downbeat': note}
for h in T.get('hits', {}).values():
    if isinstance(h, dict) and 't' in h: h['beat'] = int(np.argmin(np.abs(np.array(times) - h['t'])))
json.dump(T, open(A.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
long = [(i, round(times[i], 1)) for i in range(len(iv)) if iv[i] > 1.3 * Pm]
print(f'\n写出 {A.out}: {len(times)} 拍（{"半速" if A.half else "细网格"}），中位 {60 / Pm:.2f} BPM，短/长小节 {odd or "无"}' + (f'，拖长的拍 {long}' if long else ''))

# ---- 歌词核对 ----
LY = T.get('lyrics') or []
if LY:
    g = lambda t: float(np.interp(t, G, np.arange(len(G))))
    print('\n每句句首落在细网格第几拍:')
    for k, L in enumerate(LY): print(f'{k + 1:3d} {g(L[0]):7.2f} {L[2]}', end='   |' if k % 4 != 3 else '\n')
    print('\n\n同一句（或字数相同、六成字一样的平行句，比如“我问为什么 / 想问为什么”）和它第一次出现相差几拍（逐字中位）:')
    print('  应接近整数。按“余 8”看：同一组的几对余数应该一样；某一对和同组别的对差 1 = 这两句之间网格多跟或少跟了一拍。')
    print('  真实的音乐里也有“+1”（拖了半拍）、“+4”（2 拍短小节），但会在跨过它的每一对上同时出现。')
    sim = lambda x, y: x == y or (len(x) == len(y) and sum(p == q for p, q in zip(x, y)) >= .6 * len(x))
    for k, L in enumerate(LY):
        if len(L) < 4: continue
        js = [j for j in range(k) if len(LY[j]) > 3 and LY[j][2] == L[2]] or [j for j in range(k) if len(LY[j]) > 3 and sim(LY[j][2], L[2])]
        if not js or g(L[0]) - g(LY[js[0]][0]) < 24: continue           # 同一遍里挨着的两句不比
        j = js[0]; a = [g(x[0]) for x in LY[j][3]]; c = [g(x[0]) for x in L[3]]; m = min(len(a), len(c)); dd = sorted(c[i] - a[i] for i in range(m))[m // 2]
        print(f'  #{j + 1:2d} {LY[j][2]:10s} → #{k + 1:2d} {L[2]:10s} {dd:7.2f}  余 8: {dd % 8:4.1f}')
