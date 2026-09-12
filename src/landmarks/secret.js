import { round, flag, GOLD } from './kit.js';

// Секретные острова: их нет на карте, пока не найдёшь записку в бутылке.
// Стоят далеко, за последним кругом островов с чудесами света.

/* ---------- Бухта пиратов: скала-череп, хижина, бочки, сундук с золотом и костёр ---------- */
function cove(a) {
  const ROCK = 0x8a8f94;
  const ROCK2 = 0x6f7479;
  const WOOD = 0x7a5230;
  const WOOD2 = 0x5a3a20;
  const DARK = 0x1a1a1a;
  const BONE = 0xd8d2c4;
  // скала в виде черепа
  a.box(-5, 0, -3, 7, 7, 6, ROCK);
  a.box(-5, 7, -3, 5.6, 1.6, 5, ROCK2);
  for (const sx of [-1, 1]) a.box(-5 + sx * 1.6, 3.8, -6.05, 1.6, 1.8, 0.2, DARK);
  a.box(-5, 2.3, -6.05, 0.8, 1.0, 0.2, DARK);
  for (let i = 0; i < 4; i++) a.box(-6.2 + i * 0.8, 0.6, -6.05, 0.5, 1.0, 0.2, BONE);
  a.solid(-5, -3, 3.5, 3);
  // хижина с пиратским флагом
  a.box(4, 0, 2, 5, 3.4, 4, WOOD);
  [5.6, 4.2, 2.8, 1.4].forEach((w, i) => a.box(4, 3.4 + i * 0.5, 2, w, 0.5, 4.6, i % 2 ? WOOD : WOOD2));
  a.box(4, 0, 4.05, 1.2, 2.2, 0.2, DARK);
  a.box(2.5, 1.6, 4.05, 0.9, 0.9, 0.2, 0xffd27a);
  flag(a, 6.4, 3.4, 0.4, ['BBBBB', 'BWBWB', 'BBWBB', 'BWWWB', 'BBBBB'], { B: 0x1a1a1a, W: 0xf4f1e8 });
  a.solid(4, 2, 2.6, 2.1);
  // бочки
  for (const [x, z] of [[1.4, 5.2], [2.4, 5.8], [1.8, 6.6]]) round(a, x, 0, z, 0.9, 1.2, WOOD, WOOD2);
  // открытый сундук и россыпь монет
  a.box(0, 0, -1, 2.4, 1.2, 1.6, WOOD2);
  a.box(0, 1.2, -1, 2.2, 0.5, 1.4, GOLD);
  a.box(0, 1.2, -1.8, 2.4, 1.2, 0.2, WOOD2, 0, -0.6);
  for (const [x, z] of [[1.6, 0.2], [-1.4, 0.5], [0.8, 0.9], [-0.6, -2.4]]) a.box(x, 0, z, 0.5, 0.2, 0.5, GOLD);
  a.solid(0, -1, 1.2, 0.8);
  // костёр в кольце камней
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * Math.PI * 2;
    a.box(3 + Math.cos(ang) * 0.9, 0, -4 + Math.sin(ang) * 0.9, 0.45, 0.35, 0.45, ROCK2);
  }
  a.box(3, 0, -4, 1.4, 0.3, 0.3, WOOD2, 0.5);
  a.box(3, 0, -4, 1.4, 0.3, 0.3, WOOD2, -0.5);
  a.group(3, 0.5, -4).userData.fire = true;
  // лодка на песке
  a.box(8, 0, -6, 1.8, 0.6, 3.4, WOOD);
  a.box(8, 0.6, -6, 1.9, 0.3, 3.5, WOOD2);
}

/* ---------- Вулкан: дымящийся конус, озеро лавы в кратере и лавовые реки ---------- */
function volcano(a) {
  const S = 0x4a4440;
  const S2 = 0x3a3430;
  const LAVA = 0xff6a1a;
  const LAVA2 = 0xffb030;
  [22, 19, 16, 13, 10.5, 8].forEach((w, i) => round(a, 0, i * 2.4, 0, w, 2.4, i % 2 ? S2 : S));
  round(a, 0, 14.4, 0, 6.4, 0.6, S2);
  round(a, 0, 14.5, 0, 4.6, 0.6, LAVA);
  round(a, 0, 14.6, 0, 2.6, 0.6, LAVA2);
  for (const ang of [0.4, 2.3, 4.1]) {
    for (let i = 0; i < 6; i++) {
      const r = 3.4 + i * 1.3;
      a.box(Math.cos(ang) * r, 13.6 - i * 2.35, Math.sin(ang) * r, 1.1, 0.6, 1.5, i % 2 ? LAVA : LAVA2, -ang);
    }
  }
  a.group(0, 15.4, 0).userData.smoke = true;
  a.group(0, 15.2, 0).userData.fire = true;
  a.solid(0, 0, 10.5);
}

/* ---------- Ледяной остров: ледяной замок, сосульки и снеговик (а рядом бродит йети) ---------- */
function iceisle(a) {
  const ICE = 0xbfe6f5;
  const ICE2 = 0x9fd4ec;
  const SNOW = 0xf4f7fa;
  const DARK = 0x3a4a5a;
  a.box(0, 0, 0, 8, 5, 8, ICE);
  for (let k = -3; k <= 3; k += 2) {
    for (const s of [-1, 1]) {
      a.box(k, 5, s * 3.9, 1, 1, 0.4, ICE2);
      a.box(s * 3.9, 5, k, 0.4, 1, 1, ICE2);
    }
  }
  a.box(0, 0, 4.05, 2.4, 3.2, 0.2, DARK);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    round(a, sx * 4, 0, sz * 4, 2.4, 8, ICE2, ICE);
    [2.8, 2.0, 1.2, 0.5].forEach((w, i) => round(a, sx * 4, 8 + i * 0.9, sz * 4, w, 0.9, i % 2 ? ICE : ICE2));
  }
  a.solid(0, 0, 5);
  for (let k = 0; k < 7; k++) {
    const ang = (k / 7) * Math.PI * 2 + 0.3;
    a.box(Math.cos(ang) * 8.5, 0, Math.sin(ang) * 8.5, 0.8, 2 + (k % 3), 0.8, ICE2, 0, 0.15, 0.1);
  }
  // снеговик
  a.box(6, 0, -6, 1.6, 1.6, 1.6, SNOW);
  a.box(6, 1.6, -6, 1.2, 1.2, 1.2, SNOW);
  a.box(6, 2.8, -6, 0.9, 0.9, 0.9, SNOW);
  a.box(6, 3.1, -6.6, 0.2, 0.2, 0.6, 0xf08a24);
  for (const sx of [-1, 1]) a.box(6 + sx * 0.22, 3.35, -6.46, 0.12, 0.12, 0.05, 0x1a1a1a);
  a.box(6, 3.7, -6, 1.1, 0.2, 1.1, 0x1a1a1a);
  a.box(6, 3.9, -6, 0.7, 0.7, 0.7, 0x1a1a1a);
  a.solid(6, -6, 0.9);
}

export const SECRETS = [
  { id: 'cove', name: 'Бухта пиратов', country: 'секретный остров', size: 11, secret: true, build: cove },
  { id: 'volcano', theme: 'red', name: 'Вулкан', country: 'секретный остров', size: 12, secret: true, build: volcano },
  { id: 'iceisle', theme: 'snow', name: 'Ледяной остров', country: 'секретный остров', size: 10, secret: true, build: iceisle },
];
