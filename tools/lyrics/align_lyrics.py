# 识别结果(带逐字时间) → 对回用户给的歌词: 相同字直接取时间；认错的字按位置借时间；多出来的语气词丢掉；漏掉的字用前后插值
# 用法: python -I align_lyrics.py <识别结果.json> <timing.json> [--lyrics 歌词.txt]
#   --lyrics  一行一句（空行跳过，空格和标点去掉）；不给就用 timing.json 里已有 lyrics 的句子（比如读字幕得来的粗时间）
# 写回 timing.json 的 lyrics: [句开始, 句结束, "歌词", [[字开始, 字结束], ...]]；原来带时间的句子留在 lyrics_subs 做对比
# 只按"字"对齐，适合中文歌词；英文单词会被当成一串字母，对不上的部分按插值处理
import json, difflib, argparse, statistics as st
ap = argparse.ArgumentParser(); ap.add_argument('asr'); ap.add_argument('timing'); ap.add_argument('--lyrics')
A = ap.parse_args()
T = json.load(open(A.timing, encoding='utf-8')); B = T.get('beat', {}); P, OFF = B.get('period'), B.get('offset', 0)
keep = lambda s: ''.join(c for c in s if c.isalnum())
if A.lyrics:
    subs = [[None, None, keep(l)] for l in open(A.lyrics, encoding='utf-8') if keep(l)]
else:
    subs = T.get('lyrics_subs') or [l[:3] for l in T.get('lyrics', [])]
    subs = [[a, b, keep(s)] for a, b, s in subs]
if not subs: raise SystemExit('没有歌词：用 --lyrics 歌词.txt 给出，或者先在 timing.json 里写好 lyrics')
W = [(w['text'], w['start_time'] / 1000, w['end_time'] / 1000) for u in json.load(open(A.asr, encoding='utf-8'))['result']['utterances'] for w in u['words']]
lyr = ''.join(s for _, _, s in subs); rec = ''.join(w[0] for w in W)
owner = [k for k, (_, _, s) in enumerate(subs) for _ in s]
tm = [None] * len(lyr); log = []
for op, i0, i1, j0, j1 in difflib.SequenceMatcher(None, lyr, rec, autojunk=False).get_opcodes():
    if op == 'equal' or (op == 'replace' and i1 - i0 == j1 - j0):
        for k in range(i1 - i0): tm[i0 + k] = W[j0 + k][1:]
        if op == 'replace': log.append(f'认错: 「{lyr[i0:i1]}」← 识别成「{rec[j0:j1]}」，按位置借时间')
    elif op == 'replace':
        a, b = W[j0][1], W[j1 - 1][2]; n = i1 - i0
        for k in range(n): tm[i0 + k] = (a + (b - a) * k / n, a + (b - a) * (k + 1) / n)
        log.append(f'认错(字数不同): 「{lyr[i0:i1]}」← 「{rec[j0:j1]}」，在 {a:.2f}–{b:.2f}s 里平均分')
    elif op == 'insert': log.append(f'多出: 「{rec[j0:j1]}」({W[j0][1]:.2f}s) 丢掉')
    elif op == 'delete': log.append(f'漏掉: 「{lyr[i0:i1]}」，用前后插值')
for i in range(len(tm)):                      # 漏字: 在前一个字结束和后一个字开始之间平均分
    if tm[i] is None:
        j = i
        while j < len(tm) and tm[j] is None: j += 1
        a = tm[i - 1][1] if i else 0; b = tm[j][0] if j < len(tm) else a + .3; n = j - i
        for k in range(n): tm[i + k] = (a + (b - a) * k / n, a + (b - a) * (k + 1) / n)
new = []
for k, (s0, s1, s) in enumerate(subs):
    cs = [[round(tm[i][0], 3), round(tm[i][1], 3)] for i in range(len(owner)) if owner[i] == k]
    new.append([cs[0][0], cs[-1][1], s, cs])
if subs[0][0] is not None: T['lyrics_subs'] = subs
T['lyrics'] = new
T['lyrics_source'] = '火山 录音文件识别(volc.seedasr.auc) 逐字时间，对回用户歌词；输入是 Demucs 分离的人声'
json.dump(T, open(A.timing, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('\n'.join(log) or '识别和歌词逐字一致')
bn = lambda t: f'第 {(t - OFF) / P:6.2f} 拍' if P else ''
if subs[0][0] is None:                        # 没有旧时间可比: 只列出每句开唱和收声
    print(f'\n{"歌词":<13}  开唱    收声')
    for a, b, s, _ in new: print(f'{s[:12]:<13} {a:6.2f} {b:6.2f}  {bn(a)}')
    raise SystemExit
print(f'\n{"歌词":<13}  开唱   字幕   字幕晚了   收声   字幕结束   开唱在第几拍')
d0, d1 = [], []
for (s0, s1, s), (a, b, _, cs) in zip(subs, new):
    d0.append(s0 - a); d1.append(s1 - b)
    print(f'{s[:12]:<13} {a:6.2f} {s0:6.2f} {1000 * (s0 - a):+6.0f}ms {b:6.2f} {s1:6.2f} {1000 * (s1 - b):+6.0f}ms  {bn(a)}')
print(f'\n句首: 字幕平均晚 {1000 * st.mean(d0):.0f} ms，中位 {1000 * st.median(d0):.0f}，范围 {1000 * min(d0):+.0f} ~ {1000 * max(d0):+.0f}')
print(f'句尾: 字幕结束 - 实际收声 平均 {1000 * st.mean(d1):+.0f} ms，范围 {1000 * min(d1):+.0f} ~ {1000 * max(d1):+.0f}')
uni = []                                      # 原来"句内匀速"每个字差多少
for (s0, s1, s), (a, b, _, cs) in zip(subs, new):
    for i, c in enumerate(cs): uni.append(abs(s0 + (s1 - s0) * i / len(s) - c[0]))
uni.sort(); print(f'原来的逐字(字幕时间里匀速): 中位差 {1000 * uni[len(uni) // 2]:.0f} ms，80% 在 {1000 * uni[int(len(uni) * .8)]:.0f} ms 内，最大 {1000 * uni[-1]:.0f} ms')
