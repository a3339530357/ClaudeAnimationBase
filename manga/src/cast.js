// cast.js: who's who. A spec carries the hairstyle, the face build, accessories and a default expression (ex0); outfit.js
// adds .outfit at its end. These six are the cast of 坏女孩 · 漫画版 (2009 small town). A new character = a new spec:
// pick or write a HAIR_ (hair.js / hair2.js) and an OUT_ (outfit.js), set male for the boys' build, ex0 for make-up
// (liner, smoky, lips), acc for extras drawn on the head (hoops, gum). A one-off variant: { ...LU, name: 'x', tie: false }.
const LU = { name: 'lu', hair: HAIR_LU, browHalo: true, ex0: {} };                                     // 小鹿, before
const LU_BAD = { name: 'lubad', hair: HAIR_LU_BAD, browHalo: true, ex0: { liner: true, lips: RED } };  // 小鹿, after: liner + red lips
const BOY = { male: true, ears: true, mouthY: 39, noseY: 26 };
const FEI = { ...BOY, name: 'fei', earring: true, hair: HAIR_FEI, ex0: { mouth: 'smirk', open: .85 } };   // 阿飞, before
const FEI_NEW = { ...BOY, name: 'feinew', earring: true, hair: HAIR_FEI_NEW, ex0: {} };                  // 阿飞, at the end (the earring stays: it's still him)
const QUEEN = { name: 'queen', hair: HAIR_QUEEN, browHalo: true, ex0: { liner: true, smoky: true, lips: INK }, acc: (v, s, E) => { hoops(v, s, E); gum(v, s, E); } };
const STRANGER = { ...BOY, name: 'stranger', hair: HAIR_STRANGER, ex0: {} };
