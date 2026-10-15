# 字幕字体子集: 只留歌词里用到的字。云端渲染机器没有中文字体，整套思源宋体几十 MB，子集只有几十 KB，可以放进仓库
# 用法: python -I caption_font.py <timing.json> <输出.otf> [--extra 片名等额外的字] [--font 字体文件 --index N]
#   默认用本机思源宋体粗体 /usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc 里的第 2 个（简体中文 SC）
#   漫画画风: 输出到 fonts/caption.otf（manga/studio.html 里的 "Caption" 字体）
#   环境: uv pip install --python work/.venv/bin/python fonttools
# 思源宋体是 SIL OFL 授权，子集可以随项目放进仓库（项目 README 里注明来源和授权）
import json, argparse
from fontTools import subset
ap = argparse.ArgumentParser(); ap.add_argument('timing'); ap.add_argument('out'); ap.add_argument('--extra', default='')
ap.add_argument('--font', default='/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc'); ap.add_argument('--index', type=int, default=2)
A = ap.parse_args()
T = json.load(open(A.timing, encoding='utf-8'))
chars = ''.join(sorted(set(''.join(l[2] for l in T.get('lyrics', [])) + A.extra)))
if not chars: raise SystemExit('timing.json 里没有歌词，也没给 --extra')
opts = subset.Options(); opts.layout_features = ['*']; opts.font_number = A.index
font = subset.load_font(A.font, opts); sub = subset.Subsetter(opts); sub.populate(text=chars); sub.subset(font)
subset.save_font(font, A.out, opts)
print(f'{len(chars)} 个字 → {A.out}: {chars}')
