// plain_open.mjs: open a studio page the way the user does (double-click, file://, NO --allow-file-access-from-files, which
// render.mjs always passes), seek, screenshot the player and report whether the fonts loaded and what the console said.
// Why: render.mjs can read local font files, a normal Chrome can't (CORS on file://), so a page can look right in every
// self-check and still show fallback fonts to the user. 《写不完的温柔》 caught its pixel font this way (fixed with a data URL).
// usage (project root): node <kit>/tools/check/plain_open.mjs /usr/bin/google-chrome <t> <out.png> [page.html] [font family]
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'url';
import { resolve } from 'path';
const [chrome, t, out, pageArg = 'studio.html', fam = 'PixelLyric'] = process.argv.slice(2);
const br = await puppeteer.launch({ executablePath: chrome, headless: chrome.includes('headless-shell') ? 'shell' : true, args: ['--no-sandbox', '--window-size=1600,1000'], userDataDir: resolve('out/chrome-plain') });
const p = await br.newPage(); await p.setViewport({ width: 1600, height: 1000 });
const logs = []; p.on('console', m => logs.push(m.type() + ': ' + m.text())); p.on('pageerror', e => logs.push('pageerror: ' + e.message));
await p.goto(pathToFileURL(resolve(pageArg)).href + '?t=' + t);
await p.waitForFunction('window.ready === true', { timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));
console.log(`font "${fam}" loaded:`, await p.evaluate(f => document.fonts.check(`12px '${f}'`), fam));
await p.screenshot({ path: out });
console.log(logs.join('\n') || '(no console messages)');
await br.close();
