# pixel_font.py: subset the Fusion Pixel 12px font to the characters a project uses and write both
#   fonts/pixel12.ttf  (the subset, for reference / other tools)  and  src/font_data.js  (the same font as a data URL:
#   Chrome refuses @font-face files on a page opened from disk, so studio.html loads the font from this script).
# Characters: every non-ASCII character in src/music.js and src/scenes/*.js (lyrics, title, credits, pxText strings),
# every lyric in --timing, --extra, and all printable ASCII.
#
# usage (project root):  work/.venv/bin/python -I <kit>/pixel/tools/pixel_font.py work/dl/fpf/fusion-pixel-12px-proportional-zh_hans.ttf . [--timing work/analysis/timing.json] [--extra 片名歌手]
# get the full font once (SIL OFL 1.1, ~7 MB, keep it out of git):
#   gh release download -R TakWolf/fusion-pixel-font -p 'fusion-pixel-font-12px-proportional-ttf-v*.zip' -D work/dl && (cd work/dl && unzip -o -q fusion-pixel-font-12px-proportional-ttf-*.zip -d fpf)
#   cp work/dl/fpf/OFL.txt fonts/FusionPixel-OFL.txt
# needs fonttools:  uv venv work/.venv && uv pip install --python work/.venv/bin/python fonttools
import argparse, base64, glob, json, os
from fontTools import subset
from fontTools.ttLib import TTFont
ap = argparse.ArgumentParser(); ap.add_argument('font'); ap.add_argument('root'); ap.add_argument('--timing'); ap.add_argument('--extra', default='')
A = ap.parse_args()
chars = set(chr(c) for c in range(32, 127)) | set('　') | set(A.extra)
for f in [os.path.join(A.root, 'src/music.js')] + glob.glob(os.path.join(A.root, 'src/scenes/*.js')):
    if os.path.exists(f): chars |= {c for c in open(f, encoding='utf-8').read() if ord(c) > 0x2000}
if A.timing:
    for l in json.load(open(A.timing, encoding='utf-8')).get('lyrics', []): chars |= set(l[2])
cmap = TTFont(A.font).getBestCmap()
missing = sorted(c for c in chars if ord(c) not in cmap and c not in '\n\r\t')
used = ''.join(sorted(c for c in chars if ord(c) in cmap))
os.makedirs(os.path.join(A.root, 'fonts'), exist_ok=True)
out = os.path.join(A.root, 'fonts/pixel12.ttf')
opts = subset.Options(); opts.layout_features = ['*']; opts.notdef_outline = True
ft = TTFont(A.font); s = subset.Subsetter(opts); s.populate(text=used); s.subset(ft); ft.save(out)
b64 = base64.b64encode(open(out, 'rb').read()).decode()
open(os.path.join(A.root, 'src/font_data.js'), 'w').write(
    "// font_data.js: fonts/pixel12.ttf (Fusion Pixel 12px subset, SIL OFL) as a data URL, so studio.html opened straight from\n"
    "// disk (file://) can use it: Chrome refuses @font-face files from file:// pages. Made by pixel/tools/pixel_font.py.\n"
    f"const PIXEL_FONT_URL = 'data:font/ttf;base64,{b64}';\n")
print(f'{len(used)} 个字 → {out} ({os.path.getsize(out) // 1024} KB) + src/font_data.js')
print('字体里没有的字:', ''.join(c for c in missing if ord(c) > 127) or '无（中文字符都有）')
