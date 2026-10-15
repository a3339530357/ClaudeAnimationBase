// sheet_bad.js: model sheets for 《坏女孩》, on the film's night-neon ground.
//   node render.mjs --loop=cast --sheet=0.6 --cols=1 --w=1920 --out=out/check/cast.jpg
//   node render.mjs --loop=props --sheet=0.6 --cols=1 --w=1920 --out=out/check/props.jpg

function nightGround(floorY) {
  paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#1A1630', ink: null });
  paint(ellPts(W * .3, H * .25, 700, 300, 26), { fill: '#3A2560', fillOp: 120, bleed: .3, ink: null });
  paint(ellPts(W * .75, H * .7, 800, 320, 26), { fill: '#24305E', fillOp: 120, bleed: .3, ink: null });
  if (floorY) paint(rectPts(-60, floorY, W + 120, H - floorY + 60), { wash: '#141024', ink: null });
}
const tag = (txt, x, y) => letter(txt, x, y, 26, '#CFC6E6', { font: '26px "ZCOOL KuaiLe"', ink: false });
// hold a prop upright in a hand: undo the arm's raise angle a
const holdR = (a, fn) => ({ aR: a, armR: (u, sw) => { push(); rotate(a); fn(u, sw); pop(); } });
// the left arm's hook is mirrored (scale(-1, 1)), so the same rotate keeps the prop upright (mirrored, which is fine)
const holdL = (a, fn) => ({ aL: a, armL: (u, sw) => { push(); rotate(a); fn(u, sw); pop(); } });

LOOPS.cast = t => {
  nightGround(0);
  for (const [y, c] of [[540, '#3A2A5A'], [1075, '#2A2A52']]) paint(rectPts(-60, y - 70, W + 120, 80), { wash: c, ink: null });
  glow(960, 120, 500, '#FF5FA8', .35); glow(300, 700, 380, '#5FB8FF', .3);
  // 小桃 before: happy · crying at the bus stop with his photo on her phone
  tao(190, 500, 21, { ...tfeel('happy', t), boilKey: 'c1' });
  tao(500, 500, 21, { ...tfeel('cry', t), aL: -.6, aR: .4, boilKey: 'c2' });
  phone(655, 400, 120, { screen: 'photo', who: 'clawd', lit: .5, rot: -.15, key: 'c2' });
  // 小桃 after: the smile under the spotlight · scornful, with a drink · the tear that runs her liner, phone ringing
  badTao(880, 500, 21, { ...bfeel('happy', t, { mouth: 'lip2smile' }), boilKey: 'c3' });
  badTao(1230, 500, 21, { ...bfeel('smug', t, { eyes: 'catBN', view: 'q' }), ...holdR(.5, u => cocktail(.2 * u, .4 * u, .5 * u, { lip: true, stir: Math.sin(t * 6) })), boilKey: 'c4' });
  badTao(1600, 500, 21, { ...bfeel('sad', t, { eyes: 'catBC', mouth: 'lip2', cryK: .5 + .5 * Math.sin(t * 1.5) }), gloom: 0, tint: null, ...holdR(.35, u => phone(.2 * u, -1.4 * u, 3.4 * u, { screen: 'call', who: 'clawd', lit: .8, ring: frac(t), key: 'c5' })), boilKey: 'c5' });
  // Clawd: playing it cool · the shades sliding down his nose · shades off at last, calling her
  clawd(190, 1035, 21, { ...feel('cool', t), boilKey: 'c6' });
  clawd(540, 1035, 21, { ...feel('surprised', t, { eyes: 'shadesdown', mouth: null }), boilKey: 'c7' });
  clawd(900, 1035, 21, { ...feel('sad', t, { eyes: 'teary', mouth: 'wobble' }), emote: null, ...holdR(.9, u => phone(.3 * u, -1.3 * u, 3.4 * u, { screen: 'dial', who: 'tao', lit: .7, t, key: 'c8' })), boilKey: 'c8' });
  // the stranger, and three of the crowd
  stranger(1240, 1035, 21, { ...feel('smug', t, { eyes: 'narrow' }), ...STRC, boilKey: 'c9' });
  for (let i = 0; i < 3; i++) crowdCrab(1520 + i * 140, 1035 - (i % 2) * 20, 12, i, t, ['bounce', 'roof', 'shimmy'][i]);
  tag('小桃 · 从前', 190, 590); tag('哭（公交站）', 520, 590); tag('坏女孩 · 亮相', 880, 590); tag('坏女孩 · 轻蔑', 1230, 590); tag('最后一滴泪', 1600, 590);
  tag('Clawd · 装酷', 190, 1060); tag('墨镜滑下来', 540, 1060); tag('摘掉墨镜 · 打给她', 900, 1060); tag('陌生人', 1240, 1060); tag('舞池人群', 1660, 1060);
};
LOOPS.cast.len = 4;

LOOPS.props = t => {
  nightGround(0);
  billboard(400, 300, 620, { lit: 1, t, key: 'p1' });
  neonHeart(1000, 230, 120, { on: .8 + .2 * pulse(t), key: 'p2' });
  neonHeart(1300, 230, 120, { on: 1, half: 1, key: 'p3' });
  eyelinerPen(1640, 180, 300, { rot: -.5, key: 'p4' });
  eyelinerPen(1660, 330, 300, { rot: -.5, cap: true, key: 'p5' });
  cocktail(1480, 610, 52, { lip: true, stir: Math.sin(t * 6), key: 'p6' });
  rocksGlass(1760, 610, 60, { clink: pulse(t), crack: .7, key: 'p7' });
  const ph = [['msgs', { n: 3 + frac(t / 1.2) }], ['off', {}], ['call', { who: 'clawd', lit: .8, ring: frac(t) }], ['dial', { who: 'tao', lit: .6 }], ['ended', { text: true, lit: .3 }]];
  ph.forEach(([s, o], i) => phone(260 + i * 350, 830, 360, { screen: s, t, key: 'ph' + i, ...o }));
  tag('坏女孩广告牌', 400, 560); tag('霓虹爱心', 1000, 395); tag('灭掉一半', 1300, 395); tag('眼线笔', 1660, 450);
  tag('她的鸡尾酒', 1480, 640); tag('他的威士忌（会裂）', 1760, 640);
  ['她的消息', '黑屏', '来电', '他打给她', '通话结束'].forEach((s, i) => tag(s, 260 + i * 350, 1040));
};
LOOPS.props.len = 4;

// Comparing the two make-up looks with her old self and the first try: node render.mjs --loop=looks --sheet=0.6 ...
LOOPS.looks = t => {
  nightGround(0);
  glow(960, 300, 600, '#FF5FA8', .3);
  const cols = [
    ['小桃 · 从前', o => tao(0, 0, 0, o), {}, {}],
    ['A · 甜酷', null, { eyes: 'catA', mouth: 'lip2smile', blush: .45 }, { eyes: 'catAN', mouth: 'lip2smirk', blush: .35 }],
    ['B · 冷艳', null, { eyes: 'catB', mouth: 'lip2smile' }, { eyes: 'catBN', mouth: 'lip2smirk' }],
  ];
  cols.forEach(([name, , front, side], i) => {
    const x = 210 + i * 440, base = i === 0 ? {} : { hat: 'blackbow' };
    const mk = (y, extra, k) => i === 0 ? tao(x, y, 24, { ...tfeel('happy', t), ...(k ? { view: 'q', eyes: 'normal', mouth: 'smile' } : {}), boilKey: 'lk' + i + k })
                                      : badTao(x, y, 24, { ...tfeel(k ? 'smug' : 'happy', t), ...base, ...extra, ...(k ? { view: 'q' } : {}), emote: null, boilKey: 'lk' + i + k });
    mk(470, front, 0); mk(980, side, 1);
    tag(name, x, 540);
  });
  badTao(1830, 980, 15, { ...tfeel('sad', t), eyes: 'catAC', mouth: 'lip2', cryK: .8, emote: null, gloom: 0, tint: null, boilKey: 'lkcA' });
  badTao(1830, 700, 15, { ...tfeel('sad', t), eyes: 'catBC', mouth: 'lip2', cryK: .8, emote: null, gloom: 0, tint: null, boilKey: 'lkcB' });
  tag('A 哭', 1830, 1040); tag('B 哭', 1830, 760);
};
LOOPS.looks.len = 4;
