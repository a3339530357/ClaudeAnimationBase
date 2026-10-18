// 完整渲染：几个 Chrome 并行逐帧截图 → 每个各自压成一段视频 → 拼起来（可选配上音乐）
//   node render/render.mjs [--from 0 --to 12.5] [--workers 4] [--out out/final/x.mp4] [--audio assets/music.m4a] [--ly slip|pop|kinetic|mix]
// 片长读 js/config.js 的 DUR。用户自己在浏览器里看片，这个脚本只给确认后的成片用，成片一律上云（ci/render.yml）。
// 云端每台机器只渲一段（不带音乐），最后在 video 那一步拼接、解密原曲配音轨（见 .github/workflows/render.yml）。
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { ROOT, serve, launch, openPage, arg } from './common.mjs';

const FPS = 30, DUR = +fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8').match(/DUR = ([\d.]+)/)[1];
const workers = +arg('workers', 4), f0 = Math.round(+arg('from', 0) * FPS), f1 = Math.min(Math.round(DUR * FPS), Math.round(+arg('to', DUR) * FPS));
const out = path.resolve(ROOT, arg('out', 'out/final/render.mp4')), audio = arg('audio', '');
const ly = arg('ly', '');   // 歌词样式（见 js/karaoke.js），不给就用默认
const segDir = path.join(path.dirname(out), '_segs_' + path.basename(out, '.mp4'));
fs.rmSync(segDir, { recursive: true, force: true }); fs.mkdirSync(segDir, { recursive: true });

const { srv, url: base } = await serve(), url = base + (ly ? `?ly=${ly}` : '');
const total = f1 - f0, per = Math.ceil(total / workers), started = Date.now();
let done = 0;
// 每个任务单独开一个 Chrome：各自有绘图进程，才能真正并行
async function worker(k) {
  const a = f0 + k * per, b = Math.min(f1, a + per);
  if (a >= b) return null;
  const seg = path.join(segDir, `seg_${String(k).padStart(2, '0')}.mp4`);
  const browser = await launch(), page = await openPage(browser, url);
  // JPEG（q95）截图比 PNG 快；JPEG 是全范围 BT.601，转成视频标准的 BT.709 有限范围，播放器里才不发灰
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-threads', '2',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const closed = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg 退出码 ' + c))));
  for (let f = a; f < b; f++) {
    await page.evaluate(t => seek(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (++done % 150 === 0) { const s = (Date.now() - started) / 1000; console.log(`进度 ${done}/${total} 帧  已用 ${s.toFixed(0)}s  预计还要 ${(s / done * (total - done)).toFixed(0)}s`); }
  }
  ff.stdin.end(); await closed; await browser.close();
  return seg;
}
const segs = (await Promise.all(Array.from({ length: workers }, (_, k) => worker(k)))).filter(Boolean);
srv.close();

const list = path.join(segDir, 'list.txt');
fs.writeFileSync(list, segs.map(s => `file '${s}'`).join('\n'));
// 音轨：音乐比画面短就补静音（apad）。原曲在结尾被硬切断时，可以写一个 render/music_tail.txt（ffmpeg 滤镜，输入 [1:a]、输出 [full]）
// 把最后一下做成越来越轻的回声，例子见 ~/project/testt/videos/pinhui-lineart-mv/render/music_tail.txt。时间按整首歌算，再按 --from 剪掉开头
const tailFile = path.join(ROOT, 'render/music_tail.txt');
const tail = (fs.existsSync(tailFile) ? fs.readFileSync(tailFile, 'utf8').replace(/\n/g, '') : '[1:a]apad[full]') + `;[full]atrim=start=${f0 / FPS},asetpts=PTS-STARTPTS[a]`;
const mux = audio ? ['-i', path.resolve(ROOT, audio), '-filter_complex', tail, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : ['-c', 'copy'];
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, ...mux, '-movflags', '+faststart', out]);
fs.rmSync(segDir, { recursive: true, force: true });
console.log(`完成 → ${path.relative(ROOT, out)}  ${total} 帧，用时 ${((Date.now() - started) / 1000).toFixed(0)}s（${(total / ((Date.now() - started) / 1000)).toFixed(1)} 帧/秒）`);
