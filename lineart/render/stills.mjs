// 预览截图（在本机出，不用上云）
//   node render/stills.mjs --t 1.2,3.4,5.6 [--cols 4] [--w 480] --out out/check/a.jpg   几个时间点拼成一张（左上角标时间）
//   node render/stills.mjs --t 12.3 --out out/check/one.png                             单张原尺寸
//   node render/stills.mjs --sheet cast --scale 2 --out out/check/cast.png              设定图（2 倍清晰度）
//   加 --ly slip|pop|kinetic|mix|none 换歌词样式（默认 kinetic）；加 --grid 120 叠一层坐标网格（每 120 像素一条线，摆字幕位置用）
//   node render/stills.mjs --sheet cover --size 1920x1440 --out out/cover/封面.png       封面（4:3）
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, serve, launch, openPage, arg } from './common.mjs';

const out = path.resolve(ROOT, arg('out', 'out/check/stills.jpg')), scale = +arg('scale', 1), sheet = arg('sheet', ''), size = arg('size', '1920x1080');
const times = (arg('t', '0') + '').split(',').filter(Boolean).map(Number);
fs.mkdirSync(path.dirname(out), { recursive: true });
const { srv, url } = await serve();
const browser = await launch();
const ly = arg('ly', '');
const qs = ['clean=1', sheet && `sheet=${sheet}`, size !== '1920x1080' && `size=${size}`, ly && `ly=${ly}`].filter(Boolean).join('&');
const page = await openPage(browser, url + (qs ? '?' + qs : ''), scale, size.split('x').map(Number));
const tileDir = path.join(ROOT, 'out', 'check', '_tiles');
fs.rmSync(tileDir, { recursive: true, force: true }); fs.mkdirSync(tileDir, { recursive: true });
const grid = +arg('grid', 0);
if (grid) await page.evaluate(([g, w, h]) => {   // 坐标网格：细线每 g 像素，粗线和数字每 2g 像素
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" style="position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:9">`;
  for (let x = g; x < w; x += g) svg += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#0a6cff" stroke-opacity="${x % (2 * g) ? .25 : .55}" stroke-width="2"/>` + (x % (2 * g) ? '' : `<text x="${x + 4}" y="${h / 2 - 6}" fill="#0a6cff" font-size="26" font-family="sans-serif">${x}</text>`);
  for (let y = g; y < h; y += g) svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#0a6cff" stroke-opacity="${y % (2 * g) ? .25 : .55}" stroke-width="2"/>` + (y % (2 * g) ? '' : `<text x="${w / 2 + 6}" y="${y - 6}" fill="#0a6cff" font-size="26" font-family="sans-serif">${y}</text>`);
  document.body.insertAdjacentHTML('beforeend', svg + '</svg>');
}, [grid, ...size.split('x').map(Number)]);
const files = [];
for (const [i, t] of times.entries()) {
  const t0 = Date.now();
  await page.evaluate(([t, lab]) => {
    seek(t);
    let d = document.getElementById('lab');
    if (!d) { d = document.createElement('div'); d.id = 'lab'; d.style.cssText = 'position:fixed;left:0;top:0;background:rgba(0,0,0,.6);color:#fff;font:22px sans-serif;padding:2px 8px'; document.body.appendChild(d); }
    d.textContent = lab; d.style.display = lab ? 'block' : 'none';
  }, [t, times.length > 1 ? t.toFixed(2) + 's' : '']);
  const f = times.length > 1 ? path.join(tileDir, `${String(i).padStart(3, '0')}.png`) : out;
  await page.screenshot({ path: f, type: f.endsWith('.jpg') ? 'jpeg' : 'png', ...(f.endsWith('.jpg') ? { quality: 92 } : {}) });
  files.push(f);
  console.log(`${t.toFixed(2)}s  ${Date.now() - t0} ms`);
}
await browser.close(); srv.close();
if (files.length > 1) {
  const cols = +arg('cols', Math.min(4, files.length)), w = +arg('w', 480), rows = Math.ceil(files.length / cols);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(tileDir, '%03d.png'),
    '-vf', `scale=${w}:-1,tile=${cols}x${rows}:padding=4:color=white`, '-frames:v', '1', '-q:v', '3', out]);
}
fs.rmSync(tileDir, { recursive: true, force: true });
console.log('→', path.relative(ROOT, out));
