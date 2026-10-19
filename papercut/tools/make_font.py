# 马善政毛笔楷书（SIL OFL）子集：只留歌词 + 片名、片尾小卡用到的字，写成 data URL（js/font_data.js），双击打开网页也能用
# 用法（在项目根目录）: <带 fonttools 的 python> -I tools/make_font.py work/analysis/timing.json ~/project/testt/videos/ClaudeAnimationBase/fonts/MaShanZheng-Regular.ttf [额外的字]
#   额外的字 = 歌词以外画面里要写的字（片名、片尾小卡），不给就用示例《最美的期待》片尾小卡那几个字
import base64, io, json, sys
from fontTools import subset
from fontTools.ttLib import TTFont
T = json.load(open(sys.argv[1], encoding='utf-8'))
EXTRA = sys.argv[3] if len(sys.argv) > 3 else '最美的期待·MV制作小冰OvO '   # 片名、片尾小卡
chars = ''.join(sorted(set(''.join(l[2] for l in T['lyrics'])) | set('，。！？') | set(EXTRA)))
opts = subset.Options(); opts.layout_features = ['*']; opts.notdef_outline = True
ft = TTFont(sys.argv[2]); cmap = ft.getBestCmap(); miss = [c for c in chars if ord(c) not in cmap]
s = subset.Subsetter(opts); s.populate(text=chars); s.subset(ft)
buf = io.BytesIO(); ft.save(buf)
open('js/font_data.js', 'w', encoding='utf-8').write(
    '// 马善政楷书（SIL OFL）子集，只含歌词和片尾小卡用到的字；file:// 双击打开时 Chrome 会拦 @font-face 读本地文件，所以内嵌成 data URL。由 tools/make_font.py 生成\n'
    f"const MASHAN_URL = 'data:font/ttf;base64,{base64.b64encode(buf.getvalue()).decode()}';\n")
print(len(chars), '字', len(buf.getvalue()), '字节', '缺字:', miss or '无')
