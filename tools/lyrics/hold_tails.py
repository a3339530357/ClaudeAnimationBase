# 每句最后一个字的长音拖到哪: 从识别给的字尾往后，人声响度一直高于(该句峰值-18dB)就算还在唱，不越过下一句开唱
# 用法: python -I hold_tails.py <人声wav> <timing.json> [识别结果.json] [--write]
#   先不加 --write 看一遍；识别结果最好用"不带歌词上下文"那次的（带上下文会抹掉语气词，长音会越过语气词）
import json, sys, numpy as np, librosa, warnings; warnings.filterwarnings('ignore')
T = json.load(open(sys.argv[2], encoding='utf-8')); write = '--write' in sys.argv
asr = [a for a in sys.argv[3:] if a.endswith('.json')]   # 可选: 识别结果，长音不越过下一个识别出的字（含丢掉的语气词）
WS = sorted(w['start_time'] / 1000 for u in json.load(open(asr[0], encoding='utf-8'))['result']['utterances'] for w in u['words']) if asr else []
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True); hop = 220; dt = hop / sr
rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=hop)[0]
db = 20 * np.log10(np.convolve(rms, np.ones(5) / 5, 'same') / rms.max() + 1e-6)
L = T['lyrics']
for k, (a, b, s, cs) in enumerate(L):
    nxt = L[k + 1][0] - .05 if k + 1 < len(L) else len(y) / sr
    nxt = min([nxt] + [w - .03 for w in WS if w > b + .02])
    pk = db[int(a / dt):int(b / dt) + 1].max(); i = int(b / dt)
    while i * dt < nxt and db[i] > pk - 18: i += 1
    tail = min(i * dt, nxt)
    flag = '  ← 长音' if tail - b > .25 else ''
    print(f'{s[:12]:<13} 识别字尾 {b:6.2f}  人声实际收在 {tail:6.2f}  (+{tail - b:4.2f}s){flag}')
    if write and tail - b > .25: cs[-1][1] = round(tail, 3); L[k][1] = round(tail, 3)
if write: json.dump(T, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print('已把长音写回最后一个字的结束时间')
