// 自检：像双击那样用 file:// 打开 index.html，查报错、字体、音乐，全片均匀抽 N 帧拼一张缩略图，打印每帧画多少毫秒
// 用法（在项目根目录）: TMPDIR=work/t node tools/check.mjs [输出 jpg] [帧数] [列数] [每格宽]   例: node tools/check.mjs check.jpg 24 6 320
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, launch } from '../render/common.mjs';
const [out = 'check.jpg', n = '24', cols = '6', w = '320'] = process.argv.slice(2);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const logs = [];
page.on('console', m => { if (m.type() !== 'log') logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => logs.push('pageerror: ' + e.message));
page.on('requestfailed', r => logs.push('requestfailed: ' + r.url().slice(-60) + ' ' + r.failure().errorText));
await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
await page.waitForFunction(() => window.ready === true && window.player, null, { timeout: 60000 });
console.log('字体:', await page.evaluate(() => document.fonts.check("90px 'MaShan'", LY[0][2])));
console.log('音乐:', await page.evaluate(() => Promise.all([PROJECT.audio, PROJECT.audioFallback].map(u => new Promise(ok => { const a = new Audio(u); a.oncanplay = () => ok(u + ' 能加载 ' + a.duration.toFixed(2) + 's'); a.onerror = () => ok(u + ' 加载失败'); })))));
const N = +n, times = Array.from({ length: N }, (_, i) => +(.3 + i * (44.3 / (N - 1))).toFixed(2));
const { url, ms } = await page.evaluate(([ts, c, w]) => window.renderSheet(ts, c, w), [times, +cols, +w]);
fs.writeFileSync(path.resolve(ROOT, out), Buffer.from(url.split(',')[1], 'base64'));
console.log('时间点:', times.join(' '));
console.log('每帧毫秒:', ms.join(' '), ' 最慢', Math.max(...ms), ' 平均', Math.round(ms.reduce((a, b) => a + b, 0) / ms.length));
// 播放器：从 42.3 s 放 2.5 秒，看音乐断掉以后能不能按时钟走到片尾
await page.evaluate(() => window.player.jump(42.3)); await page.click('#pplay'); await new Promise(r => setTimeout(r, 2500));
console.log('从 42.3 s 播放 2.5 秒后:', (await page.evaluate(() => window.player.time)).toFixed(2), await page.$eval('#ptime', e => e.textContent));
console.log(logs.join('\n') || '(控制台没有报错)');
await browser.close();
console.log('→', out);
