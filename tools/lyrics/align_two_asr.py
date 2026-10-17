# align_two_asr.py：用两份火山识别结果对齐歌词，拿到每个字的准确时间
#
# 用法:
#   python -I align_two_asr.py --base <不带上下文.json> --lyrics 歌词.txt [--fill <带上下文.json>]
#                             [--out work/analysis/ly.json]
#
# 输出: work/analysis/ly.json —— [[整句起, 整句止, "歌词", [[字起, 字止], ...]], ...]
#       这个格式直接能喂给 make_check.py（对拍视频）和项目里的 music.js。
#
# ---------------------------------------------------------------------------
# 为什么需要两份识别结果
#
# 火山「录音文件识别标准版」传歌词原文当上下文（--ctx）时**会编时间**。实测（《一个人想着一个人》）：
# 它在 31.89–34.09 那 2.2 秒里按每字 0.04 秒硬塞了 30 个字（2.2 秒根本唱不完 30 个字），
# 又另起一段把后半句重复列了一遍，看起来像整段唱了两遍——实际只唱一遍。
# 不带上下文那份的段边界和字时间反而可靠。
#
# 所以：**不带上下文那份当基准**（时间准、段切得对，但可能漏字/认错字），
#       **带上下文那份只用来补漏掉的字**。
#
# 另一条经验：识别会把相邻几句并成一段，段内的停顿不可靠（句子内部也有 0.4 秒的停顿），
# 所以不能按停顿拆句。但**段的边界是可靠的**，用段定位置、段内按歌词字数切行。
# ---------------------------------------------------------------------------
import json, difflib, argparse, os, sys

ap = argparse.ArgumentParser()
ap.add_argument('--base', required=True, help='不带歌词上下文那份识别结果（当基准）')
ap.add_argument('--fill', default='', help='带歌词上下文那份（只用来补基准漏掉的字）')
ap.add_argument('--lyrics', required=True, help='歌词原文，一行一句')
ap.add_argument('--out', default='work/analysis/ly.json', help='输出的 ly.json')
ap.add_argument('--dump-js', default='', help='可选：同时写一份 JS 数组到指定文件')
A = ap.parse_args()

lines = []
for raw in open(A.lyrics, encoding='utf-8'):
    s = raw.strip().replace(' ', '')
    if s and not s.startswith('#'):
        lines.append(s)
if not lines:
    sys.exit('歌词文件是空的')

def flatten(path):
    """拍平成一串 [字, 起, 止]，并给出每段的边界"""
    d = json.load(open(path, encoding='utf-8'))
    ws, bounds, k = [], [], 0
    for u in d['result']['utterances']:
        for w in u.get('words', []):
            ws.append([w['text'], w['start_time'] / 1000, w['end_time'] / 1000])
        bounds.append((k, len(ws), u['start_time'] / 1000, u['end_time'] / 1000))
        k = len(ws)
    return ws, bounds

BASE, base_bounds = flatten(A.base)
FILL = flatten(A.fill)[0] if A.fill else []

# ---------- 段 → 行：段按演唱顺序，行也按演唱顺序；逐段往下发 ----------
n_base, n_lyr = len(BASE), sum(len(l) for l in lines)
print(f'基准识别 {n_base} 字，歌词 {n_lyr} 字（差 {n_lyr - n_base} 个多半是识别漏的，用 --fill 补）')
if n_base > n_lyr:
    sys.exit('基准识别的字数比歌词还多，说明歌词文件里少写了句子，先核对歌词')
seg2lines, p = [], 0
for i0, i1, a, b in base_bounds:
    need, js = i1 - i0, []
    while need > 0:
        if p >= len(lines):
            sys.exit(f'段 [{a:.2f}-{b:.2f}] 发到第 {p} 行时歌词已经用完了，核对歌词是否完整')
        js.append(p); need -= len(lines[p]); p += 1
    seg2lines.append(js)
    print(f'  段 [{a:6.2f}–{b:6.2f}] {i1 - i0:3d} 字 → 行 {js}  ' + ' / '.join(lines[j] for j in js))
if p != len(lines):
    print(f'  !! 只用到 {p}/{len(lines)} 行歌词：识别没听到最后几句，那几句要靠插值')

# ---------- 配字：整串对整串 ----------
tgt = ''.join(lines)
tgt_time = [None] * len(tgt)
src_str = ''.join(w[0] for w in BASE)
sm = difflib.SequenceMatcher(None, src_str, tgt, autojunk=False)
print(f'整体对齐相似度 {sm.ratio():.3f}')
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal' or tag == 'replace':
        # equal 直接用；replace 是认错的同音字，用识别那个字的时间
        for t in range(min(i2 - i1, j2 - j1)):
            w = BASE[i1 + t]
            tgt_time[j1 + t] = [w[1], w[2]]
        if tag == 'replace':
            print(f'  错字 {src_str[i1:i2]} → {tgt[j1:j2]}（借识别的时间）')
    elif tag == 'delete':
        print(f'  识别多出 {src_str[i1:i2]}（丢弃）')

# ---------- 补漏字：在带上下文那份里找 ----------
missing = [i for i, v in enumerate(tgt_time) if v is None]
if missing:
    if not FILL:
        print(f'\n识别漏了 {len(missing)} 个字，没给 --fill，靠前后插值')
    else:
        print(f'\n识别漏了 {len(missing)} 个字，从带上下文那份取时间：')
        for i in missing:
            ch = tgt[i]
            prev = next((tgt_time[q][0] for q in range(i - 1, -1, -1) if tgt_time[q]), None)
            nxt = next((tgt_time[q][1] for q in range(i + 1, len(tgt)) if tgt_time[q]), None)
            best = None
            for w in FILL:
                if w[0] != ch:
                    continue
                score = (abs(w[1] - prev) if prev is not None else 0) + (abs(nxt - w[2]) if nxt is not None else 0)
                if best is None or score < best[0]:
                    best = (score, w)
            if best is None:
                print(f'  「{ch}」两份识别里都没有，靠插值'); continue
            w = best[1]
            tgt_time[i] = [w[1], w[2]]
            print(f'  第 {i:3d} 字「{ch}」→ {w[1]:.2f}–{w[2]:.2f}s')

# ---------- 补缺（插值）、拉平（保证单调）、输出 ----------
def fill_gaps(ts):
    known = [i for i in range(len(ts)) if ts[i]]
    if not known:
        return ts
    for i in range(len(ts)):
        if ts[i]:
            continue
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        if prev is not None and nxt is not None:
            span = nxt - prev
            ts[i] = [ts[prev][0] + (ts[nxt][0] - ts[prev][0]) * (i - prev) / span,
                     ts[prev][1] + (ts[nxt][1] - ts[prev][1]) * (i - prev) / span]
        elif prev is not None:
            d = ts[prev][1] - ts[prev][0]
            ts[i] = [ts[prev][1] + (i - prev - 1) * d, ts[prev][1] + (i - prev) * d]
        else:
            d = ts[nxt][1] - ts[nxt][0]
            ts[i] = [ts[nxt][0] - (nxt - i) * d, ts[nxt][0] - (nxt - i - 1) * d]
    return ts

LYJ, at = [], 0
for ln in lines:
    n = len(ln)
    ts = fill_gaps([list(x) if x else None for x in tgt_time[at:at + n]])
    at += n
    # 同一个字被前后邻居挤成倒序时拉平（识别偶尔会这样）
    for q in range(1, n):
        if ts[q][0] < ts[q - 1][1] - .08:
            ts[q][0] = ts[q - 1][1] - .08
        if ts[q][1] < ts[q][0] + .04:
            ts[q][1] = ts[q][0] + .04
    st, en = ts[0][0], ts[-1][1]
    LYJ.append([round(st, 2), round(en, 2), ln, [[round(x, 2), round(y, 2)] for x, y in ts]])
    print(f'{st:6.2f} → {en:6.2f}  {ln}')

_d = os.path.dirname(os.path.abspath(A.out))
os.makedirs(_d, exist_ok=True)
json.dump(LYJ, open(A.out, 'w', encoding='utf-8'), ensure_ascii=False)
print(f'\n{len(LYJ)} 句 → {A.out}')
if A.dump_js:
    body = ',\n'.join('  [' + f'{a:.2f}, {b:.2f}, ' + json.dumps(t, ensure_ascii=False) + ', '
                      + json.dumps(ch, ensure_ascii=False) + ']' for a, b, t, ch in LYJ)
    open(A.dump_js, 'w', encoding='utf-8').write('const LY = [\n' + body + ',\n];\n')
    print(f'同时写了 JS 数组 → {A.dump_js}')
