# cmp_lrc.py: check an LRC (lyric file the user gives) against Volcengine word timings, and optionally write the lyrics
# into timing.json: line starts from the LRC, per-character times borrowed from the recognition.
# Written for 《写不完的温柔》 (2026-10): the LRC turned out accurate (59/60 lines within 0.3 s), the user said "用 LRC 的".
#
# usage: python3 -I cmp_lrc.py <song.lrc> <asr_plain.json> [<asr_ctx.json>] [--skip-before 秒] [--timing timing.json] [--out cmp.json]
#   asr_plain = volc_asr.py without --ctx (timings honest, may miss words); asr_ctx = with --ctx 歌词.txt (all words, but may
#   invent timings: segments whose median character length is < 0.08 s are flagged as made up and never used)
#   Credit lines (作词/作曲/编曲/监制/OP/SP ..., "歌名 - 歌手") are skipped and printed, ready for the opening credits.
#   --timing writes lyrics: [[LRC start, end, line (spaces -> full-width), [[char start, char end], ...]], ...]; a line whose
#   recognised first character is more than 0.5 s from the LRC start falls back to even timing inside the line.
#
# Alignment is ordered (edit distance + traceback), NOT difflib: with a chorus sung four times, difflib matched the
# longest block first and put lines 16-20 onto the LAST chorus (146 s off).
import argparse, json, re, statistics as st
ap = argparse.ArgumentParser()
ap.add_argument('lrc'); ap.add_argument('plain'); ap.add_argument('ctx', nargs='?')
ap.add_argument('--skip-before', type=float, default=0); ap.add_argument('--timing'); ap.add_argument('--out')
A = ap.parse_args()
keep = lambda s: ''.join(c for c in s if c.isalnum())
ROLE = re.compile(r'^(词|曲|作词|作曲|编曲|监制|制作人?|OP|SP|混音|母带|录音|和声|吉他|贝斯|鼓|弦乐|钢琴|出品|发行|企划|统筹|Producer|Lyrics|Composer)\s*[：:]', re.I)
L, credits = [], []
for raw in open(A.lrc, encoding='utf-8-sig'):
    tags = re.findall(r'\[(\d+):(\d+(?:\.\d+)?)\]', raw); text = re.sub(r'\[[^\]]*\]', '', raw).strip()
    if not tags or not text: continue
    for mm, ss in tags:
        t = int(mm) * 60 + float(ss)
        if ROLE.search(text) or (t < 20 and ' - ' in text) or t < A.skip_before: credits.append((t, text))
        else: L.append((t, text))
L.sort()
print('跳过的制作信息行（可以拿来做片头字幕）:' if credits else '没有制作信息行')
for t, s in credits: print(f'  {t:6.2f}  {s}')

def words(p):
    U = json.load(open(p, encoding='utf-8'))['result'].get('utterances', [])
    W, fake = [], []
    for u in U:
        ws = [(w['text'], w['start_time'] / 1000, w['end_time'] / 1000) for w in u['words'] if keep(w['text'])]
        if not ws: continue
        med = st.median(b - a for _, a, b in ws); bad = med < .08
        if bad: fake.append((ws[0][1], ws[-1][2], len(ws), med))
        for t, a, b in ws:
            k = keep(t); n = len(k)
            for i, c in enumerate(k): W.append((c, a + (b - a) * i / n, a + (b - a) * (i + 1) / n, bad))
    return W, fake
def align(W):
    lyr = ''.join(keep(s) for _, s in L); rec = ''.join(w[0] for w in W)
    owner = [k for k, (_, s) in enumerate(L) for _ in keep(s)]
    n, m = len(lyr), len(rec)
    D = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1): D[i][0] = i
    for j in range(1, m + 1): D[0][j] = j
    for i in range(1, n + 1):
        Di, Dp, c = D[i], D[i - 1], lyr[i - 1]
        for j in range(1, m + 1): Di[j] = min(Dp[j - 1] + (c != rec[j - 1]), Dp[j] + 1, Di[j - 1] + 1)
    tm = [None] * n; same = [False] * n; i, j = n, m
    while i and j:
        if D[i][j] == D[i - 1][j - 1] + (lyr[i - 1] != rec[j - 1]):
            tm[i - 1] = W[j - 1][1:]; same[i - 1] = lyr[i - 1] == rec[j - 1]; i -= 1; j -= 1
        elif D[i][j] == D[i - 1][j] + 1: i -= 1
        else: j -= 1
    out = []
    for k in range(len(L)):
        idx = [i for i in range(n) if owner[i] == k]; got = [i for i in idx if tm[i]]
        out.append(dict(n=len(idx), hit=sum(same[i] for i in idx), first=bool(idx) and idx[0] in got,
                        a=tm[got[0]][0] if got else None, b=tm[got[-1]][1] if got else None,
                        fake=any(tm[i][2] for i in got), chars=[list(tm[i][:2]) if tm[i] else None for i in idx]))
    return out, sum(same) / max(1, n)
P, pf = words(A.plain); RP, simP = align(P)
print(f'\n不带歌词: 识别 {len(P)} 字，和歌词逐字相同 {simP:.0%}；编出来的段 {len(pf)} 个')
RC = None
if A.ctx:
    Cw, cf = words(A.ctx); RC, simC = align(Cw)
    print(f'带歌词:   识别 {len(Cw)} 字，和歌词逐字相同 {simC:.0%}；编出来的段 {len(cf)} 个 ' + ' '.join(f'[{a:.1f}-{b:.1f}s {n}字 每字{m:.2f}s]' for a, b, n, m in cf))
print(f'\n{"#":>2} {"歌词":<14} {"LRC":>7} {"识别":>7} {"LRC-识别":>9}  来源 认对')
res = []
for k, (t, s) in enumerate(L):
    r, src = RP[k], '不带'
    ok = r['a'] is not None and r['first'] and r['hit'] >= r['n'] * .5
    if not ok and RC and RC[k]['a'] is not None and RC[k]['first'] and not RC[k]['fake']: r, src = RC[k], '带歌词'
    elif not ok: src = '?? '
    d = t - r['a'] if r['a'] is not None else None
    flag = '' if d is None or abs(d) < .25 else ('  ← LRC 早了' if d < 0 else '  ← LRC 晚了')
    print(f'{k + 1:>2} {s[:13]:<14} {t:7.2f} {r["a"] if r["a"] is not None else float("nan"):7.2f} {1000 * d if d is not None else float("nan"):+8.0f}ms  {src} {r["hit"]}/{r["n"]}{flag}')
    res.append(dict(lrc=t, text=s, start=r['a'], end=r['b'], src=src, hit=r['hit'], n=r['n'], chars=r['chars']))
D = [x['lrc'] - x['start'] for x in res if x['start'] is not None and x['src'] != '?? ']
if D: print(f'\nLRC - 识别开唱: 中位 {1000 * st.median(D):+.0f} ms，范围 {1000 * min(D):+.0f} ~ {1000 * max(D):+.0f} ms；差 0.25 秒以内 {sum(abs(d) < .25 for d in D)}/{len(D)} 句')
print('差得多的句子先别信识别：副歌重复唱好几遍时，同一句可能被配到另一遍上；用人声响度（RMS）看真正的起音点再定。')
if A.out: json.dump(res, open(A.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

if A.timing:
    LYO, log = [], []
    for k, (s, text) in enumerate(L):
        nxt = L[k + 1][0] if k + 1 < len(L) else s + 4
        ch = [list(c) if c else None for c in res[k]['chars']]; n = len(ch)
        ok = n and ch[0] is not None and abs(ch[0][0] - s) < .5 and ch[-1] is not None and ch[-1][1] < nxt + .3
        if ok:
            for i in range(n):                                     # missing characters: interpolate
                if ch[i] is None:
                    j = i
                    while ch[j] is None: j += 1
                    a, b = ch[i - 1][1], ch[j][0]
                    for q in range(i, j): ch[q] = [a + (b - a) * (q - i) / (j - i), a + (b - a) * (q - i + 1) / (j - i)]
            ch[0][0] = min(s, ch[0][1] - .05)
            for c in ch: c[0] = max(c[0], s); c[1] = min(max(c[1], c[0] + .03), nxt - .02)
        else:
            e = min(nxt - .1, s + .35 * n); ch = [[s + (e - s) * i / n, s + (e - s) * (i + 1) / n] for i in range(n)]
            log.append(f'#{k + 1} {text}: 识别对不上，句内匀速 {s:.2f}–{e:.2f}')
        disp, times, it = '', [], iter(ch)
        for c0 in text:
            if c0.isspace(): disp += '　'; times.append([times[-1][1]] * 2 if times else [s, s])
            elif keep(c0): disp += c0; times.append(next(it))
        times = [[round(a, 3), round(b, 3)] for a, b in times]
        LYO.append([round(s, 3), times[-1][1], disp, times])
    T = json.load(open(A.timing, encoding='utf-8'))
    T['lyrics'] = LYO; T['lyrics_source'] = 'LRC 句首 + 火山识别逐字（cmp_lrc.py）'
    json.dump(T, open(A.timing, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\n写进 {A.timing}: {len(LYO)} 句' + ('\n' + '\n'.join(log) if log else '，每句都借到了识别的逐字时间'))
