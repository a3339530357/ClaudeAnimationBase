# Demucs(htdemucs) 分离人声，绕开 torchaudio 读写: librosa 读 → apply_model → soundfile 写
# 用法: python -I sep_vocals.py <原曲.m4a/wav> <输出人声.wav>    （CPU 上一分钟的歌约一两分钟）
# 环境(约 1.3 GB，单独一个): uv venv --python 3.11 work/.venv-sep
#   uv pip install --python work/.venv-sep/bin/python torch torchaudio --index-url https://download.pytorch.org/whl/cpu
#   uv pip install --python work/.venv-sep/bin/python demucs soundfile librosa
import sys, numpy as np, torch, librosa, soundfile as sf
from demucs.pretrained import get_model
from demucs.apply import apply_model
m = get_model('htdemucs'); m.eval()
y, sr = librosa.load(sys.argv[1], sr=m.samplerate, mono=False)
if y.ndim == 1: y = np.stack([y, y])
wav = torch.tensor(y, dtype=torch.float32); ref = wav.mean(0)
x = (wav - ref.mean()) / ref.std()
with torch.no_grad(): out = apply_model(m, x[None], device='cpu', shifts=1, split=True, overlap=.25, progress=False)[0]
out = out * ref.std() + ref.mean()
v = out[m.sources.index('vocals')].numpy().T
sf.write(sys.argv[2], v, m.samplerate); print('人声', sys.argv[2], v.shape, m.sources)
