// smoke.mjs：只查会不会报错，不出图。像渲染那样打开页面，从 from 到 to 每隔 step 秒画一帧（含字幕层），
// 打印运行报错（同一个错只打一次）和最慢的几帧。几个分身同时跑也不抢（每次一个单独的浏览器目录，跑完删掉）。
// 用法（在项目根目录）：node ~/project/testt/videos/ClaudeAnimationBase/tools/check/smoke.mjs [页面=studio.html] [from=0] [to=片长] [step=0.5] [--shots]
//   --shots 另外列出镜头表（像素引擎的 SHOTS：开始秒 + 函数名），核对各段首尾接没接上。
// 来历：《多远都要在一起》像素整片，用户要"先完成，再完美"，6 个分身按时间段并行写、不看图，每段写完只跑这个。
// 像素 / 剪纸这类有 frame(t) + composite(t) 的页面直接调这两个；别的页面退回 window.renderAt(t)（慢一些）。
import puppeteer from 'puppeteer-core';
import { resolve } from 'node:path';
import { rmSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
const argv = process.argv.slice(2).filter(a => !a.startsWith('--')), pageArg = argv[0] && !/^[\d.]+$/.test(argv[0]) ? argv.shift() : 'studio.html';
const [from = 0, to = 1e9, step = .5] = argv.map(Number);
const chrome = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && existsSync(p));
const prof = fileURLToPath(new URL(`./out/.smoke-${process.pid}`, import.meta.url));
const br = await puppeteer.launch({ executablePath: chrome, headless: true, userDataDir: prof, args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await br.newPage(), errs = [];
page.on('pageerror', e => errs.push('页面: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|Failed to load resource/.test(m.text())) errs.push('控制台: ' + m.text()); });
await page.goto(pathToFileURL(resolve(pageArg)).href + '?render', { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction('window.ready === true', { timeout: 120000 });
const r = await page.evaluate(async (a, b, s) => {
  const end = Math.min(b, typeof DUR !== 'undefined' ? DUR : b), fast = typeof frame === 'function' && typeof composite === 'function';
  const bad = [], ms = [];
  for (let t = a; t <= end + 1e-6; t += s) {
    const t0 = performance.now();
    try { if (fast) { frame(t); composite(t); } else await window.renderAt(t); } catch (e) { bad.push([+t.toFixed(2), String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')]); }
    ms.push([Math.round(performance.now() - t0), +t.toFixed(2)]);
  }
  ms.sort((x, y) => y[0] - x[0]);
  const shots = typeof SHOTS !== 'undefined' ? SHOTS.map(x => [+(+x[0]).toFixed(2), x[1] && x[1].name]) : [];
  return { bad, slow: ms.slice(0, 8), n: ms.length, shots };
}, from, to, step);
console.log(`画了 ${r.n} 帧；镜头 ${r.shots.length} 个`);
console.log('最慢:', r.slow.map(([m, t]) => `${t}s ${m}ms`).join('  '));
const seen = new Set();
for (const [t, e] of r.bad) { if (seen.has(e)) continue; seen.add(e); console.log(`报错 @${t}s: ${e}`); }
for (const e of errs) console.log(e);
if (process.argv.includes('--shots')) console.log(r.shots.map(([t, n]) => `${t} ${n}`).join('\n'));
await br.close();
rmSync(prof, { recursive: true, force: true });
