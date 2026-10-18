# 新角色设定页（cast.html）用的字体子集：站酷快乐体，只含 cast_new.js / cast_page.js 里的字，写成 data URL（js/cast_font.js）
# 用法（在 lineart/ 里）: <venv>/bin/python -I tools/make_cast_font.py ../fonts/ZCOOLKuaiLe-Regular.ttf   （改了角色名字、介绍后重跑）
import base64, io, re, sys
from fontTools import subset
from fontTools.ttLib import TTFont
text = ''.join(open(f, encoding='utf-8').read() for f in ['js/cast_new.js', 'js/cast_page.js'])
chars = set(re.findall(r'[　-鿿＀-￯《》·、，]', text)) | set('0123456789')
opts = subset.Options(); opts.layout_features = ['*']; opts.notdef_outline = True
ft = TTFont(sys.argv[1]); s = subset.Subsetter(opts); s.populate(text=''.join(sorted(chars))); s.subset(ft)
buf = io.BytesIO(); ft.save(buf)
open('js/cast_font.js', 'w', encoding='utf-8').write(
    '// 站酷快乐体（SIL OFL）子集，只含新角色设定页用到的字；由 work/make_cast_font.py 生成\n'
    f"const FONT_DATA_CAST = {{ 'ZCOOL KuaiLe': 'data:font/ttf;base64,{base64.b64encode(buf.getvalue()).decode()}' }};\n")
print(len(chars), '字', len(buf.getvalue()), '字节')
