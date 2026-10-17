// sheet.js: model sheets for checking the cast and props (open studio.html?loop=cast, or render with --loop=cast).
LOOPS.cast = t => {
  clear(C.A0);
  rect(0, 200, PW, 70, C.A1);
  const ex = ['n', 'smile', 'laugh', 'sad', 'cry', 'shock', 'closed', 'talk'];
  ex.forEach((e, i) => { her(30 + i * 30, 95, { ex: e, talk: 1, blink: false }); him(30 + i * 30, 190, { ex: e, talk: 1, blink: false, outfit: i % 2 ? 'winter' : 'spring' }); });
  // side views, walking, winter
  her(290, 95, { view: 'side', dir: 1, pose: 'walk', ph: t, outfit: 'winter' });
  her(320, 95, { view: 'side', dir: -1, ex: 'smile' });
  her(350, 95, { view: 'back', outfit: 'winter' });
  him(290, 190, { view: 'side', dir: 1, pose: 'walk', ph: t + .3, outfit: 'winter', wind: .5 });
  him(320, 190, { view: 'side', dir: -1, ex: 'smile' });
  him(350, 190, { view: 'back', outfit: 'winter' });
  // seated at a piano bench, playing
  rect(380, 80, 30, 3, C.P2); rect(395, 83, 2, 12, C.P1);
  her(392, 95, { view: 'side', dir: 1, pose: 'piano', outfit: 'summer' });
  rect(420, 175, 30, 3, C.P2); rect(435, 178, 2, 12, C.P1);
  him(432, 190, { view: 'side', dir: 1, pose: 'piano', arms: { near: [65, 25], far: [70, 20] } });
  her(460, 95, { outfit: 'winter', scarf: true, ex: 'teary' });
  him(460, 190, { outfit: 'summer', ex: 'laugh' });
};
LOOPS.cast.len = 1;
LOOPS.hall = t => { const A = stationHall(t, { mood: 'night', sheet: 1 }); her(150, A.floor, { view: 'side', dir: -1, outfit: 'winter', ex: 'sad' }); snow(t, { n: 0 }); npc(330, A.floor, 3, { view: 'side', dir: 1, pose: 'walk', ph: t }); npc(260, A.floor, 8, { view: 'side', dir: -1, pose: 'walk', ph: t + .5 }); };
LOOPS.hall.len = 2;
LOOPS.hallSpring = t => { const A = stationHall(t, { mood: 'spring', sheet: 1 }); him(A.piano.seat[0], A.floor, { view: 'side', dir: -1, pose: 'piano', play: t * 2 }); her(200, A.floor, { view: 'side', dir: -1, outfit: 'spring', ex: 'shock' }); };
LOOPS.hallSpring.len = 2;
LOOPS.plat = t => { const A = platform(t, { mood: 'rain', train: { x: 40, lit: true, door: [0, .8] } }); him(260, A.floor, { view: 'side', dir: -1, outfit: 'winter', arms: { near: [150, -10] }, hold: (x, y) => umbrella(x, y, { tilt: -25 }) }); her(236, A.floor, { view: 'side', dir: 1, outfit: 'winter', ex: 'sad' }); suitcase(212, A.floor); rain(t, { n: 140 }); };
LOOPS.plat.len = 2;
LOOPS.rooms = t => {
  hisRoom(t, { night: true }); him(150, 210, { view: 'side', dir: -1, pose: 'piano', play: t * 2 });
};
LOOPS.rooms.len = 2;
LOOPS.herroom = t => { const A = herRoom(t, {}); her(300, A.floor, { view: 'back', outfit: 'winter', scarf: true }); };
LOOPS.herroom.len = 2;
LOOPS.props = t => {
  clear(C.A0);
  songSheet(10, 10, 220, 130, { fill: SONG_END, cursor: .4 });
  keyboard(250, 40, 220, 50, { lit: [3, 7], glow: true });
  bigHand(300, 140, { press: [1] }); bigHand(400, 140, { flip: true, sleeve: [C.U1, C.U2] });
  phone(20, 150, { big: true, screen: (x, y, w, h) => { iconAvatar(x + w / 2, y + 30, 4); iconCall(x + w / 2, y + h - 14); } });
  phone(100, 150, { big: true, screen: (x, y, w, h) => { iconEnvelope(x + 12, y + 20); iconTicket(x + 10, y + 50); } });
  ticket(180, 160, { s: 2 }); cup(200, 200); clock(230, 220, 12, { h: 1, m: 4 }); bulb(260, 200); paperBall(280, 200); noteIcon(300, 200); sparkle(320, 205, 1, C.L2); heart(340, 200, 2);
  suitcase(360, 240, { handle: 6 }); her(420, 262, { outfit: 'summer', ex: 'laugh' }); him(450, 262, { outfit: 'summer', ex: 'smile' });
};
LOOPS.props.len = 1;
