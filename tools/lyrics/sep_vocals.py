# 分离人声和各音轨（2026-10-22 起换成 audio-separator + RoFormer 模型，用显卡跑；原来的 Demucs htdemucs 太老，官方仓库已归档）
# 用法: python -I sep_vocals.py <原曲.m4a/mp3/wav> <输出人声.wav>
#   人声: Kim 的 MelBand Roformer（vocals_mel_band_roformer.ckpt），人声 SDR 12.6，原来的 htdemucs 是 9.9
#   鼓、贝斯、其他: jarredou 的 BS Roformer SW（一次分出人声、鼓、贝斯、吉他、钢琴、其他六轨）
#   同一目录还会写: drums.wav、bass.wav、other.wav（吉他 + 钢琴 + 其他）、acc.wav（伴奏 = 去掉人声），这四条是单声道。
#   速度会漂的歌用鼓轨和伴奏逐拍跟踪（tools/music/beattrack.py），所以一次存齐，不用再分一遍。
# 环境（约 6 GB，放在资源库根目录的 .venv-sep，不进 git）:
#   uv venv --python 3.12 .venv-sep
#   uv pip install --python .venv-sep/bin/python "audio-separator[gpu]" torch audioread
#   （Linux 上 PyPI 的 torch 自带 CUDA；audio-separator 0.47 少声明了 audioread，要自己装）
# 模型第一次用时自动下载到资源库的 sep_models/（几百 MB 一个，不进 git）。audio-separator 默认放 /tmp，这里改掉了。
# 老的 Demucs 版在 git 历史里（2026-10-22 之前那版）。
import logging, os, re, shutil, sys, tempfile, time
import numpy as np, soundfile as sf
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
AUTOCAST = os.environ.get('SEP_AUTOCAST', '1') == '1'          # 半精度（autocast）：4060 上快一些，SEP_AUTOCAST=0 关掉
VOCAL_MODEL, STEM_MODEL = 'vocals_mel_band_roformer.ckpt', 'BS-Roformer-SW.ckpt'
inp, out_v = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2]); d = os.path.dirname(out_v)
work = os.path.join(d, '_sep_tmp'); os.makedirs(work, exist_ok=True); tempfile.tempdir = work
from audio_separator.separator import Separator

def run(model):
    t0 = time.time()
    s = Separator(model_file_dir=os.path.join(ROOT, 'sep_models'), output_dir=work, output_format='WAV', log_level=logging.WARNING, use_autocast=AUTOCAST)
    s.load_model(model_filename=model)
    stems = {}
    for f in s.separate(inp):
        p = f if os.path.isabs(f) else os.path.join(work, f)
        m = re.search(r'_\(([^)]+)\)', os.path.basename(p)); stems[m.group(1).lower() if m else os.path.basename(p)] = p
    print(f'{model}: {time.time() - t0:.0f} 秒 →', ', '.join(stems))
    return stems

def read(p):
    x, sr = sf.read(p, always_2d=True); return x, sr
mono = lambda x: x.mean(1)

V = run(VOCAL_MODEL)                                    # vocals / other（= 伴奏）
x, sr = read(V['vocals']); sf.write(out_v, x, sr); print('人声', out_v, x.shape)
acc, _ = read(V['other'] if 'other' in V else V['instrumental']); sf.write(f'{d}/acc.wav', mono(acc), sr)
S = run(STEM_MODEL)                                     # vocals / drums / bass / guitar / piano / other
for name in ('drums', 'bass'):
    y, sr2 = read(S[name]); sf.write(f'{d}/{name}.wav', mono(y), sr2)
rest = [read(S[k])[0] for k in ('guitar', 'piano', 'other') if k in S]
n = min(len(r) for r in rest); sf.write(f'{d}/other.wav', mono(sum(r[:n] for r in rest)), sr2)
shutil.rmtree(work)
print('另存', d, 'drums / bass / other / acc（伴奏）.wav')
