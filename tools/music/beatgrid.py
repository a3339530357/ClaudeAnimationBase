# beatgrid.py: 给一首歌量出固定的拍网格，并列出可能的卡点（鼓撤、鼓回、重击）。
#
# 用法:  python -I beatgrid.py <音频> [--drums 0:17,31:57] [--bpm 140] [--out timing.json]
#   --drums  有鼓的时间段（秒）。拍网格只用这些段拟合；不给就用整首。鼓撤掉的间奏会把拟合带偏，最好排除。
#   --bpm    粗估的 BPM。不给就先用 librosa 估一个，再在它 ±4% 里细扫。
#   --out    写出 timing.json 骨架（duration、beat、候选卡点），歌词和镜头之后手动补。
#
# 思路: librosa 的 beat_track 拍间隔会抖，做卡点要的是一条笔直的网格: 第 n 拍 = offset + n × period。
# 所以在周期和相位上扫一遍，挑让"低频起音（底鼓）"落点强度总和最大的那组。再看 4 拍里哪一拍最重，定小节线。
# 依赖: librosa numpy（uv pip install librosa）
import argparse, json, warnings
import numpy as np, librosa
warnings.filterwarnings('ignore')

ap = argparse.ArgumentParser()
ap.add_argument('audio'); ap.add_argument('--drums', default=''); ap.add_argument('--bpm', type=float); ap.add_argument('--out')
A = ap.parse_args()

y, sr = librosa.load(A.audio, sr=22050, mono=True)
dur, hop = len(y) / sr, 128
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)); f = librosa.fft_frequencies(sr=sr, n_fft=2048)
on = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[f < 180]), sr=sr, hop_length=hop)   # 底鼓
segs = [tuple(map(float, s.split(':'))) for s in A.drums.split(',') if s] or [(0, dur)]
print(f'时长 {dur:.3f}s   拟合用的有鼓段: {segs}')

def score(P, ph, lo=0, hi=dur):
    ts = np.arange(ph, dur, P); ts = ts[(ts >= lo) & (ts < hi)]
    return on[np.clip(np.round(ts * sr / hop).astype(int), 0, len(on) - 1)].mean() if len(ts) else 0
total = lambda P, ph: sum(score(P, ph, a, b) for a, b in segs)

bpm0 = A.bpm
if not bpm0:
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr, trim=False); bpm0 = float(np.atleast_1d(tempo)[0])
    print(f'librosa 粗估 {bpm0:.2f} BPM')
best = (0, 0, 0)
for P in np.arange(60 / (bpm0 * 1.04), 60 / (bpm0 * .96), .0001):
    for ph in np.arange(0, P, .004):
        s = total(P, ph)
        if s > best[0]: best = (s, P, ph)
_, P, ph = best
for P2 in np.arange(P - .0002, P + .0002, .00001):          # 周期和相位精修
    for p2 in np.arange(ph - .006, ph + .006, .0005):
        s = total(P2, p2)
        if s > best[0]: best = (s, P2, p2)
_, P, ph = best
print(f'\n拟合: 周期 {P:.5f}s ({60 / P:.2f} BPM)，相位 {ph:.4f}s')
for a, b in segs:   # 各段相位漂不漂
    bp = max(np.arange(0, P, .002), key=lambda q: score(P, q, a, b)); d = (bp - ph + P / 2) % P - P / 2
    print(f'  {a:5.1f}–{b:5.1f}s 段内最佳相位偏差 {d * 1000:+4.0f} ms' + ('   ← 偏大，这段可能变速或没鼓' if abs(d) > .03 else ''))

n = np.arange(int((dur - ph) / P) + 1); bts = ph + n * P
idx = np.clip(np.round(bts * sr / hop).astype(int), 0, len(on) - 1)
heavy = [float(on[idx][(n % 4) == k].mean()) for k in range(4)]
bar = int(np.argmax(heavy))
print(f'4 拍里平均最重的一拍: {[round(h, 2) for h in heavy]}，把它定为小节第一拍')
# 重新编号: offset 取第一条小节线（0 ≤ offset < 一小节），之后 n % 4 == 0 就是小节第一拍；它前面的弱起拍是负数
off = (ph + bar * P) % (4 * P)
n = np.arange(-int(off / P), int((dur - off) / P) + 1); bts = off + n * P
print(f'\n★ 拍网格: 第 n 拍 = {off:.4f} + n × {P:.5f} 秒   ({60 / P:.2f} BPM)，n % 4 == 0 是小节第一拍')

# 每拍的低/中/高频能量，找候选卡点
low, mid, hi = S[f < 120].sum(0), S[(f > 200) & (f < 2000)].sum(0), S[f > 6000].sum(0)
def at(a, t): i = max(0, int(t * sr / hop)); return a[i:i + max(1, int(.1 * sr / hop))].mean()
L = np.array([at(low, t) for t in bts]) / low.max(); M = np.array([at(mid, t) for t in bts]) / mid.max(); Hh = np.array([at(hi, t) for t in bts]) / hi.max()
# 鼓撤 / 鼓回: 前 4 拍和后 4 拍（含本拍）的底鼓能量差，取局部最大的那一拍，并要求本拍自己就是"没鼓"/"有鼓"
cb = np.array([L[i:i + 4].mean() - L[max(0, i - 4):i].mean() if i >= 4 else 0 for i in range(len(L))])
cues = {}
for i in range(4, len(bts) - 4):
    w = cb[max(0, i - 3):i + 4]
    if cb[i] > .25 and cb[i] == w.max() and L[i] > .3: cues[int(n[i])] = '鼓回 / 爆发'
    if -cb[i] > .25 and -cb[i] == (-w).max() and L[i] < .2: cues[int(n[i])] = '鼓撤（底鼓没了）'
for i in np.argsort(L)[::-1][:6]: cues.setdefault(int(n[i]), '低频最重的几拍之一')
print('\n候选卡点（再用耳朵核对）:')
for k in sorted(cues): print(f'  第 {k:3d} 拍  {off + k * P:6.2f}s  {cues[k]}')
print('\n拍号  时间   低    中    高   (每拍起点后 100ms 的相对能量)')
for i in range(len(bts)):
    print(f'{n[i]:4d} {bts[i]:6.2f} {L[i] * 100:5.1f} {M[i] * 100:5.1f} {Hh[i] * 100:5.1f}' + ('  ← 小节线' if n[i] % 4 == 0 else ''))

if A.out:
    tj = {'duration': round(dur, 3), 'beat': {'period': round(P, 5), 'offset': round(off, 4), 'bpm': round(60 / P, 2),
          'formula': f'第n拍 = {off:.4f} + n*{P:.5f}', 'downbeat': 'n%4==0 为小节第一拍'},
          'hits': {f'b{k}': {'beat': k, 't': round(off + k * P, 2), 'note': w} for k, w in sorted(cues.items())}, 'lyrics': []}
    json.dump(tj, open(A.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\n写出 {A.out}')
