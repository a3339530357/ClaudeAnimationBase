// 渲染公共部分：本地小网页服务器 + 启动无界面 Chrome
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { chromium } from 'playwright-core';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.ttf': 'font/ttf', '.m4a': 'audio/mp4', '.png': 'image/png' };

// 只服务项目目录里的文件，监听 127.0.0.1 的随机端口
export function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}/index.html` }));
  });
}

// 优先用 Playwright 自带的无界面 Chrome，没有就用系统的 google-chrome
function chromePath() {
  const base = path.join(os.homedir(), '.cache/ms-playwright');
  const shells = fs.existsSync(base) ? fs.readdirSync(base).filter(d => d.startsWith('chromium_headless_shell-')).sort().reverse() : [];
  for (const d of shells) {
    const p = path.join(base, d, 'chrome-headless-shell-linux64/chrome-headless-shell');
    if (fs.existsSync(p)) return p;
  }
  return '/usr/bin/google-chrome';
}

// 注：WSL 里的 Chrome 拿不到真显卡（OpenGL/Vulkan 都会退回软件模拟），所以只用 CPU
export async function launch() {
  return chromium.launch({
    executablePath: chromePath(), headless: true,
    args: ['--no-proxy-server', '--force-color-profile=srgb', '--hide-scrollbars', '--font-render-hinting=none'],
  });
}

export async function openPage(browser, url, scale = 1, size = [1920, 1080]) {
  const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: scale });
  page.on('pageerror', e => console.error('[页面报错]', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  return page;
}

export const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i > 0 ? process.argv[i + 1] : def;
};
