# 火山 录音文件识别标准版(volc.seedasr.auc): submit → 轮询 query，结果存 JSON。音频用 base64 直传(audio.data，文档没写但可用)，不打印密钥
# 用法: python -I volc_asr.py <key文件> <wav> <输出json> [--lang zh-CN] [--ctx 歌词.txt] [--hot 词1,词2] [--music-fc]
#   --ctx  歌词原文作为上下文(context_data)；--hot 热词；--music-fc 音乐领域推荐词。上下文/热词不能和 enable_auto_lang 同用
#   推荐: --lang zh-CN --ctx 歌词.txt（《坏女孩》20 句只错 1 字；不传歌词错 8 处；加 --hot / --music-fc 反而更差）
#   key 文件: 豆包语音新版控制台的 API Key（要开通"录音文件识别标准版" volc.seedasr.auc），只放文件，不进 git
#   wav 要 16k 单声道: ffmpeg -i 人声.wav -ac 1 -ar 16000 -c:a pcm_s16le 人声16k.wav
import sys, json, base64, uuid, time, argparse, urllib.request, urllib.error
ap = argparse.ArgumentParser(); ap.add_argument('key'); ap.add_argument('wav'); ap.add_argument('out')
ap.add_argument('--lang'); ap.add_argument('--ctx'); ap.add_argument('--hot', default=''); ap.add_argument('--music-fc', action='store_true')
A = ap.parse_args()
key = open(A.key).read().strip(); wav = open(A.wav, 'rb').read()
BASE = 'https://openspeech.bytedance.com/api/v3/auc/bigmodel/'
rid = str(uuid.uuid4())
def call(path, body, extra={}):
    h = {'Content-Type': 'application/json', 'X-Api-Key': key, 'X-Api-Resource-Id': 'volc.seedasr.auc', 'X-Api-Request-Id': rid, **extra}
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers=h, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=120) as r: return r.status, r.headers.get('X-Api-Status-Code'), r.headers.get('X-Api-Message'), r.read().decode()
    except urllib.error.HTTPError as e: return e.code, e.headers.get('X-Api-Status-Code'), e.headers.get('X-Api-Message'), e.read().decode(errors='replace')
req = {'model_name': 'bigmodel', 'enable_itn': False, 'enable_punc': False, 'enable_ddc': False, 'show_utterances': True, 'vad_segment': False}
if A.music_fc: req['enable_music_fc'] = True
ctx = {}
if A.hot: ctx['hotwords'] = [{'word': w} for w in A.hot.split(',') if w]
if A.ctx:
    lines = [l.strip() for l in open(A.ctx, encoding='utf-8') if l.strip()]
    ctx['context_type'] = 'dialog_ctx'; ctx['context_data'] = [{'text': '，'.join(lines)}]
if ctx: req['corpus'] = {'context': json.dumps(ctx, ensure_ascii=False)}
audio = {'data': base64.b64encode(wav).decode(), 'format': 'wav', 'codec': 'raw', 'rate': 16000, 'bits': 16, 'channel': 1}
if A.lang: audio['language'] = A.lang
code, st, msg, txt = call('submit', {'user': {'uid': 'mv'}, 'audio': audio, 'request': req}, {'X-Api-Sequence': '-1'})
print(f'submit: HTTP {code} status={st} msg={msg} {txt[:300]}')
if st != '20000000': sys.exit(1)
for i in range(90):
    time.sleep(2)
    code, st, msg, txt = call('query', {})
    if st in ('20000001', '20000002'): continue
    print(f'query: HTTP {code} status={st} msg={msg}（等了约 {2 * (i + 1)} 秒）'); break
open(A.out, 'w', encoding='utf-8').write(txt)
res = json.loads(txt).get('result', {}) if txt.strip().startswith('{') else {}
print('全文:', res.get('text', '')[:400])
