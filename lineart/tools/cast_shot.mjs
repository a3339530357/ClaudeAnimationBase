// 像用户那样双击打开 cast.html（file://，不加任何放宽权限的参数），整页截图，报告字体和控制台
// 用法（在 lineart/ 里）: node tools/cast_shot.mjs /usr/bin/google-chrome out/check/cast.png   （截图和 Chrome 配置都放 out/，不进 git）
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { resolve } from 'path';
const require = createRequire('/home/a33511/project/testt/videos/ClaudeAnimationBase/package.json');
const puppeteer = require('puppeteer-core');
const [chrome, out] = process.argv.slice(2);
const br = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'], userDataDir: resolve('out/chrome-cast') });
const p = await br.newPage(); await p.setViewport({ width: 1920, height: 1440 });
const logs = []; p.on('console', m => logs.push(m.type() + ': ' + m.text())); p.on('pageerror', e => logs.push('pageerror: ' + e.message));
await p.goto(pathToFileURL(resolve('cast.html')).href);
try { await p.waitForFunction('window.ready === true', { timeout: 20000 }); } catch (e) { logs.push('没等到 ready'); }
await new Promise(r => setTimeout(r, 800));
console.log('字体加载:', await p.evaluate(() => document.fonts.check("20px 'ZCOOL KuaiLe'")));
await p.screenshot({ path: out, fullPage: true });
console.log(logs.join('\n') || '(控制台没有消息)');
await br.close();
