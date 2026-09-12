import { TAU, Q, CORNERS, SIDES, GOLD, WATER, round, stack, stackSquare, dome, tree } from './kit.js';

// Азия (часть 1)

/* Токио: Токийская башня — красно-белая, как Эйфелева */
function tokyoTower(a) {
  const O = 0xe8552a;
  const W = 0xf0ece4;
  for (let l = 0; l < 7; l++) {
    const s = 8 - l * 0.85;
    for (const [sx, sz] of CORNERS) {
      a.box(sx * s, l * 2, sz * s, 2.4 - l * 0.15, 2, 2.4 - l * 0.15, l % 2 ? W : O, Q);
      if (l < 3) a.solid(sx * s, sz * s, 1.2);
    }
  }
  a.box(0, 13.6, 0, 10, 2, 10, 0x4a5058);
  for (let l = 0; l < 7; l++) a.box(0, 15.6 + l * 2.4, 0, 4 - l * 0.35, 2.4, 4 - l * 0.35, l % 2 ? W : O, Q);
  a.box(0, 32.4, 0, 4, 1.6, 4, 0x4a5058);
  stack(a, 0, 34, 0, [1.8, 1.4, 1.1, 0.8, 0.6, 0.4, 0.3], 2.4, O, W);
}

/* Япония: гора Фудзи и цветущая сакура */
function fuji(a) {
  const R = 0x6a6f84;
  const R2 = 0x5a5f74;
  const SN = 0xf4f7fa;
  for (let i = 0; i < 12; i++) round(a, 0, i * 2.4, 0, 26 - i * 2, 2.4, i >= 8 ? SN : i % 2 ? R : R2);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU;
    a.box(Math.cos(ang) * 8.5, 16.4, Math.sin(ang) * 8.5, 2.2, 2.4, 2.2, SN, ang); // снежные языки
  }
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * TAU + 0.3;
    tree(a, Math.cos(ang) * 12, 0, Math.sin(ang) * 12, 2, 2.6, 0x5a3a2a, i % 2 ? 0xf2a6c2 : 0xf7c4d6);
  }
  a.solid(0, 0, 12);
}

/* Камакура: Великий Будда */
function buddha(a) {
  const BR = 0x5f7a6a;
  const BR2 = 0x4f6a5a;
  a.box(0, 0, 0, 12, 1.5, 10, 0x8f8a80);
  a.box(0, 1.5, 0, 10, 3, 7, BR);
  a.box(0, 1.5, -0.5, 11, 2.4, 5, BR2);
  a.box(0, 4.5, 0.5, 6.5, 6, 4.5, BR);
  a.box(0, 4.6, -2.2, 3, 1.2, 1.4, BR2); // руки на коленях
  a.box(0, 10.5, 0.5, 3.6, 4, 3.6, BR);
  a.box(0, 14.5, 0.5, 3.2, 1, 3.2, BR2);
  a.box(0, 15.5, 0.5, 1.6, 0.8, 1.6, BR2);
  for (const sx of [-1, 1]) {
    a.box(sx * 1.9, 11, 0.5, 0.4, 2.6, 1, BR2); // длинные уши
    a.box(sx * 0.7, 12.5, -1.35, 0.8, 0.15, 0.2, 0x2e3a32);
  }
  a.box(0, 11.6, -1.45, 0.6, 1, 0.4, BR2);
  a.solid(0, 0, 6, 5);
}

/* Киото: Золотой павильон Кинкаку-дзи на пруду */
function kinkaku(a) {
  const G2 = 0xd4a22c;
  const RF = 0x2e2a26;
  a.box(0, 0, 0, 18, 0.25, 16, WATER);
  for (const [x, z] of [[-6, 5], [6, -5], [-5, -5]]) {
    a.box(x, 0.25, z, 2, 0.8, 1.6, 0x8f8a80);
    tree(a, x, 1, z, 1.2, 2, 0x5a3a2a, 0x2f5f3a);
  }
  a.box(0, 0.25, 0, 7, 2.8, 6, 0xefe8d6);
  for (const [sx, sz] of CORNERS) a.box(sx * 3.3, 0.25, sz * 2.8, 0.4, 2.8, 0.4, 0x3a2a1c);
  a.box(0, 3, 0, 9, 0.5, 8, RF);
  a.box(0, 3.5, 0, 6.4, 2.6, 5.4, GOLD);
  a.box(0, 6.1, 0, 8, 0.5, 7, RF);
  a.box(0, 6.6, 0, 4.4, 2.2, 4.4, G2);
  stackSquare(a, 0, 8.8, 0, [6, 4, 2.2], 0.6, RF);
  a.box(0, 10.6, 0, 0.5, 1, 1.2, GOLD); // феникс
  a.solid(0, 0, 3.6, 3.2);
}

/* Камбоджа: Ангкор-Ват — пять башен-бутонов лотоса */
function angkor(a) {
  const S = 0x8f8470;
  const S2 = 0x7a705e;
  for (const [sx, sz] of SIDES) a.box(sx * 14.5, 0, sz * 14.5, sz ? 31 : 2, 0.3, sz ? 2 : 31, WATER); // ров
  stackSquare(a, 0, 0, 0, [22, 17, 12], 2.5, S, S2);
  for (const [sx, sz] of SIDES) {
    for (let i = -3; i <= 3; i++) a.box(sx * 10.6 + (sz ? i * 2.8 : 0), 2.5, sz * 10.6 + (sx ? i * 2.8 : 0), 0.7, 2.4, 0.7, S2); // галереи
  }
  const bud = (x, z, h) => {
    const ws = [3.2, 3.4, 3.2, 2.8, 2.4, 2, 1.6, 1.2, 0.8, 0.4];
    stack(a, x, 7.5, z, ws, h / ws.length, S, S2);
  };
  for (const [sx, sz] of CORNERS) bud(sx * 4.5, sz * 4.5, 12);
  bud(0, 0, 18);
  a.solid(0, 0, 11);
}

/* Куала-Лумпур: башни Петронас */
function petronas(a) {
  const M = 0xc8ced4;
  const M2 = 0xaab2ba;
  for (const sx of [-1, 1]) {
    let y = 0;
    for (const [w, h] of [[5, 22], [4.4, 10], [3.8, 8], [3.2, 5], [2.4, 4], [1.6, 3]]) {
      round(a, sx * 5, y, 0, w, h, M, M2);
      y += h;
    }
    a.box(sx * 5, y, 0, 0.5, 10, 0.5, M);
    a.box(sx * 2, 14, 0, 0.4, 7, 0.4, M2, 0, 0, -sx * 0.5);
    a.solid(sx * 5, 0, 2.6);
  }
  a.box(0, 20, 0, 6, 1.2, 1.4, 0x6a8aa8); // мост между башнями
}

/* Сингапур: Марина Бэй Сэндс — корабль на трёх башнях */
function marinaBay(a) {
  const G = 0xd0d8de;
  const G2 = 0xb8c2ca;
  for (const i of [-1, 0, 1]) {
    a.box(i * 6, 0, -1.2, 4, 30, 2.2, G, 0, 0.06);
    a.box(i * 6, 0, 1.2, 4, 30, 2.2, G2, 0, -0.06);
    a.solid(i * 6, 0, 2.2, 2.4);
  }
  a.box(1.5, 30, 0, 22, 1.4, 5, 0x6a7a88);
  a.box(1.5, 31.4, -1.5, 18, 0.2, 1.2, 0x5ad0f0); // бассейн на крыше
  for (let i = 0; i < 6; i++) a.box(-6 + i * 3, 31.4, 1.2, 1, 1.2, 1, 0x3f8f3a);
}

/* Сингапур: Мерлайон — лев-рыба, из пасти бьёт фонтан */
function merlion(a) {
  const W = 0xefebe2;
  const W2 = 0xd8d2c4;
  a.box(0, 0, -5, 10, 0.25, 4, WATER);
  a.box(0, 0, 0, 6, 2, 6, 0x8f8a80);
  a.box(0, 2, 1, 3, 5, 3, W);
  a.box(0, 5, 3, 2, 3, 1.4, W2, 0, -0.5);
  a.box(0, 8, 4.4, 2.6, 1.2, 0.4, W2);
  a.box(0, 7, -0.6, 3.6, 3.6, 3.4, W);
  a.box(0, 7, 0.6, 4, 4, 1.6, W2);
  a.box(0, 7.8, -2.35, 1.4, 0.8, 0.2, 0x3a3a3a);
  for (const sx of [-1, 1]) a.box(sx * 0.8, 9.4, -2.35, 0.4, 0.4, 0.2, 0x1a1a1a);
  const spout = a.group(0, 8.2, -2.6);
  spout.userData.fountain = [0, -7];
  a.solid(0, 0, 3);
}

/* Пекин: Запретный город */
function forbidden(a) {
  const RD = 0xa82a22;
  const Y = 0xe8b830;
  const Y2 = 0xd4a020;
  const W = 0xeee8da;
  a.box(0, 0, 0, 20, 1.2, 12, W);
  a.box(0, 1.2, 0, 17, 1, 10, W);
  a.box(0, 2.2, 0, 14, 5, 7, RD);
  for (let i = 0; i < 8; i++) a.box(-6.1 + i * 1.75, 2.2, -3.6, 0.5, 5, 0.4, 0x7a1e18);
  a.box(0, 7.2, 0, 17, 0.8, 9.6, Y);
  a.box(0, 8, 0, 15, 0.8, 8, Y2);
  a.box(0, 8.8, 0, 12, 1.2, 5, Y);
  a.box(0, 10, 0, 9, 1.2, 3, Y2);
  for (const sx of [-1, 1]) a.box(sx * 4.8, 11.2, 0, 0.8, 1, 0.8, Y);
  for (const sx of [-1, 1]) a.box(sx * 3, 2.2, -5.6, 0.8, 1.2, 1.2, 0x8f8a80); // львы
  a.solid(0, 0, 9, 5);
  for (const sz of [-1, 1]) {
    a.box(0, 0, sz * 11, 26, 3.6, 1, RD);
    a.box(0, 3.6, sz * 11, 26.4, 0.5, 1.4, Y);
    if (sz > 0) a.solid(0, 11, 13, 0.6);
  }
  a.box(0, 3.6, -11, 6, 3, 2.4, RD); // ворота
  a.box(0, 6.6, -11, 7.4, 0.8, 3.6, Y);
}

/* Пекин: Храм Неба */
function templeHeaven(a) {
  const W = 0xefeae0;
  const B = 0x2f4f8f;
  const B2 = 0x26437a;
  const RD = 0xa82a22;
  stack(a, 0, 0, 0, [20, 16, 12], 1.2, W);
  round(a, 0, 3.6, 0, 8, 3.5, RD);
  round(a, 0, 7.1, 0, 11, 1, B, B2);
  round(a, 0, 8.1, 0, 6.5, 2.2, RD);
  round(a, 0, 10.3, 0, 9, 1, B, B2);
  round(a, 0, 11.3, 0, 5, 2, RD);
  stack(a, 0, 13.3, 0, [7, 4.4, 2.2], 1, B, B2);
  round(a, 0, 16.3, 0, 1, 1.6, GOLD);
  a.solid(0, 0, 6);
}

/* Тайбэй: небоскрёб Тайбэй 101 — восемь «коробочек» одна над другой */
function taipei(a) {
  const G = 0x5f9a8a;
  const G2 = 0x4f8a7a;
  a.box(0, 0, 0, 9, 14, 9, G2);
  a.box(0, 14, 0, 7, 3, 7, G);
  for (let s = 0; s < 8; s++) {
    const y = 17 + s * 5.2;
    a.box(0, y, 0, 6, 1.7, 6, G);
    a.box(0, y + 1.7, 0, 6.6, 1.7, 6.6, G2);
    a.box(0, y + 3.4, 0, 7.2, 1.8, 7.2, G);
  }
  a.box(0, 58.6, 0, 5, 3, 5, G2);
  a.box(0, 61.6, 0, 3.4, 3, 3.4, G);
  a.box(0, 64.6, 0, 0.8, 12, 0.8, 0xd0d8e0);
  a.solid(0, 0, 5);
}

export const ASIA = [
  { id: 'tokyo', name: 'Токийская башня', country: 'Япония', size: 9.5, build: tokyoTower },
  { id: 'fuji', name: 'Гора Фудзи', country: 'Япония', size: 13.5, build: fuji },
  { id: 'buddha', name: 'Великий Будда', country: 'Япония', size: 6.5, build: buddha },
  { id: 'kinkaku', name: 'Золотой павильон', country: 'Япония', size: 9.5, build: kinkaku },
  { id: 'angkor', name: 'Ангкор-Ват', country: 'Камбоджа', size: 16, build: angkor },
  { id: 'petronas', name: 'Башни Петронас', country: 'Малайзия', size: 8, build: petronas },
  { id: 'marinabay', name: 'Марина Бэй Сэндс', country: 'Сингапур', size: 12.5, build: marinaBay },
  { id: 'merlion', name: 'Мерлайон', country: 'Сингапур', size: 7, build: merlion },
  { id: 'forbidden', name: 'Запретный город', country: 'Китай', size: 13.5, build: forbidden },
  { id: 'heaven', name: 'Храм Неба', country: 'Китай', size: 10, build: templeHeaven },
  { id: 'taipei', name: 'Тайбэй 101', country: 'Тайвань', size: 5, build: taipei },
];
