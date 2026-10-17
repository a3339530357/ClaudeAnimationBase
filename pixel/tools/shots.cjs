// shots.cjs: list the shots a pixel page registers, without a browser (reads the <script src> list of the page, stubs the
// DOM, runs the scripts in one scope). Prints [start, function name, transition] per shot; --mid also prints a comma list
// of times 62% into every shot, ready for render.mjs --sheet (one frame per shot = a contact sheet of the whole film).
// usage (project root):  node <kit>/pixel/tools/shots.cjs [studio.html] [--mid]
const fs = require('fs'), vm = require('vm'), path = require('path');
const page = process.argv.find(a => a.endsWith('.html')) || 'studio.html', dir = path.dirname(page);
const files = [...fs.readFileSync(page, 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/player\.js$/.test(f));
const doc = { createElement: () => ({ getContext: () => ({}) }), head: { appendChild() {} }, fonts: { load: () => Promise.resolve(), add() {} } };
function FontFace() { this.load = () => Promise.resolve(this); }
const ctx = vm.createContext({ Math, console, Uint8Array, Uint8ClampedArray, Promise, FontFace, URLSearchParams, window: { addEventListener() {} }, document: doc, location: { search: '' } });
const src = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n') +
  '\n;JSON.stringify({ shots: SHOTS.map(s => [+s[0].toFixed(3), s[1].name, (s[2] && s[2].tr) || ""]), dur: DUR })';
const { shots, dur } = JSON.parse(vm.runInContext(src, ctx));
console.log(`${shots.length} shots`);
shots.forEach(([t, n, tr]) => console.log(`${t.toFixed(2).padStart(7)}  ${n}${tr ? '  (' + tr + ')' : ''}`));
if (process.argv.includes('--mid')) console.log(shots.map(([t], i) => +(t + ((i + 1 < shots.length ? shots[i + 1][0] : dur) - t) * .62).toFixed(2)).join(','));
