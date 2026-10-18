# 把站酷快乐体按歌词用到的字做成子集，写成 data URL（js/font_data.js）：双击打开的 file:// 页面加载不了 @font-face 文件
# 用法（在 lineart/ 或项目目录里，要有 fontTools 的环境）: <venv>/bin/python -I tools/make_font.py <站酷快乐体 ttf，资源库 fonts/ZCOOLKuaiLe-Regular.ttf>
#   环境：uv venv work/.venv && uv pip install --python work/.venv/bin/python fonttools
import base64, io, re, sys
from fontTools import subset
from fontTools.ttLib import TTFont
src = sys.argv[1]
text = open('js/music.js', encoding='utf-8').read()
chars = set(re.findall(r'[　-鿿＀-￯]', text)) | set('0123456789:.')
opts = subset.Options(); opts.layout_features = ['*']; opts.notdef_outline = True
ft = TTFont(src); s = subset.Subsetter(opts); s.populate(text=''.join(sorted(chars))); s.subset(ft)
buf = io.BytesIO(); ft.save(buf)
b64 = base64.b64encode(buf.getvalue()).decode()
open('js/font_data.js', 'w', encoding='utf-8').write(
    '// 站酷快乐体（SIL OFL）子集，只含歌词用到的字；由 work/make_font.py 生成\n'
    f"const FONT_DATA = {{ 'ZCOOL KuaiLe': 'data:font/ttf;base64,{b64}' }};\n")
print(len(chars), '字', len(buf.getvalue()), '字节')
