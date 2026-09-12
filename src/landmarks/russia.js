import { TAU, Q, CORNERS, SIDES, GOLD, round, stack, onion, dome, clocks } from './kit.js';

// Россия

/* Санкт-Петербург: Зимний дворец и Александрийская колонна */
function winterPalace(a) {
  const GR = 0x7fbfa0;
  const W = 0xf2eee4;
  a.box(0, 0, 0, 26, 8, 9, GR);
  a.box(0, 0, 4.7, 26, 0.8, 0.4, W);
  a.box(0, 4, 4.7, 26, 0.4, 0.4, W);
  a.box(0, 8, 0, 26.4, 0.6, 9.4, W);
  a.box(0, 8.6, 0, 25, 1.2, 8, 0x6f8f80);
  for (let i = 0; i < 17; i++) {
    const x = -12 + i * 1.5;
    a.box(x, 0.8, 4.6, 0.5, 3.2, 0.4, W); // колонны в два яруса
    a.box(x, 4.4, 4.6, 0.5, 3.4, 0.4, W);
    if (i < 16) {
      a.box(x + 0.75, 1.4, 4.5, 0.7, 1.8, 0.2, 0x3a4a5a);
      a.box(x + 0.75, 5, 4.5, 0.7, 2, 0.2, 0x3a4a5a);
    }
  }
  for (let i = 0; i < 14; i++) a.box(-12.5 + i * 1.92, 8.6, 4.3, 0.4, 1.2, 0.4, GOLD); // статуи на крыше
  a.box(0, 0, 5, 6, 9, 1, GR);
  a.box(0, 0, 5.55, 2.4, 3.4, 0.2, 0x3b3226);
  a.box(0, 9, 5, 6.4, 0.6, 1.2, W);
  a.solid(0, 0, 13, 5);
  a.box(0, 0, 11, 2.4, 1.6, 2.4, 0x8a6a5a);
  round(a, 0, 1.6, 11, 1.4, 14, 0xa87a6a);
  a.box(0, 15.6, 11, 1.8, 0.6, 1.8, 0x5a4a3a);
  a.box(0, 16.2, 11, 0.5, 1.8, 0.5, 0x4a5a4a); // ангел
  a.box(0, 17.4, 11, 1.4, 0.3, 0.3, 0x4a5a4a);
  a.solid(0, 11, 1.2);
}

/* Санкт-Петербург: Исаакиевский собор */
function isaac(a) {
  const G = 0x8f8a80;
  const W = 0xd8d2c4;
  const RC = 0xb0674a;
  a.box(0, 0, 0, 16, 1.2, 16, 0x7d7870);
  a.box(0, 1.2, 0, 12, 11, 12, G);
  for (const [sx, sz] of SIDES) {
    const along = sz !== 0;
    for (let i = 0; i < 8; i++) {
      const o = -5.25 + i * 1.5;
      round(a, sx * 7.2 + (along ? o : 0), 1.2, sz * 7.2 + (along ? 0 : o), 1, 9, RC);
    }
    a.box(sx * 7.2, 10.2, sz * 7.2, along ? 12 : 3, 1.2, along ? 3 : 12, W);
    [10, 7.5, 5, 2.5].forEach((w, i) => a.box(sx * 7.2, 11.4 + i * 0.8, sz * 7.2, along ? w : 3, 0.8, along ? 3 : w, W));
  }
  round(a, 0, 12.2, 0, 8, 1, W);
  round(a, 0, 13.2, 0, 7, 5, G);
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * TAU;
    a.box(Math.cos(ang) * 4.1, 13.2, Math.sin(ang) * 4.1, 0.5, 5, 0.5, RC);
  }
  const top = dome(a, 0, 18.2, 0, 3.8, GOLD, 0xd9a52e);
  round(a, 0, top, 0, 1.4, 2, W);
  dome(a, 0, top + 2, 0, 0.8, GOLD);
  a.box(0, top + 3.6, 0, 0.2, 1.4, 0.2, GOLD);
  for (const [sx, sz] of CORNERS) {
    round(a, sx * 4.8, 12.2, sz * 4.8, 1.8, 3, W);
    dome(a, sx * 4.8, 15.2, sz * 4.8, 1, GOLD);
  }
  a.solid(0, 0, 8.5);
}

/* Санкт-Петербург: Петропавловский собор с золотым шпилем */
function peterPaul(a) {
  const Y = 0xe8cf9a;
  const W = 0xf2eee4;
  const GR = 0x5f8a6a;
  a.box(0, 0, 3, 8, 7, 12, Y);
  a.box(0, 7, 3, 8.4, 1.2, 12.4, GR);
  round(a, 0, 8.2, 7, 2.5, 2, Y);
  onion(a, 0, 10.2, 7, 1.4, GR, 0x4f7a5a);
  a.box(0, 0, -5, 6, 12, 6, Y);
  for (const [sx, sz] of CORNERS) a.box(sx * 2.9, 0, -5 + sz * 2.9, 0.4, 12, 0.4, W);
  a.box(0, 12, -5, 5, 4, 5, Y);
  a.box(0, 16, -5, 3.8, 3, 3.8, Y);
  round(a, 0, 19, -5, 2.4, 2, GOLD);
  const top = stack(a, 0, 21, -5, [1.8, 1.4, 1.0, 0.7, 0.5, 0.35, 0.25], 3, GOLD, 0xd9a52e);
  a.box(0, top, -5, 0.4, 1.4, 0.4, GOLD); // ангел
  a.box(0, top + 0.8, -5, 1.8, 0.3, 0.3, GOLD);
  a.solid(0, -5, 3);
  a.solid(0, 3, 4, 6);
}

/* Москва: Останкинская башня */
function ostankino(a) {
  const C = 0xe6e2da;
  const R = 0xc0392b;
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * TAU;
    a.box(Math.cos(ang) * 4.5, 0, Math.sin(ang) * 4.5, 1.2, 12, 1.2, C);
  }
  let y = 10;
  for (const [w, h] of [[7, 10], [5.8, 12], [4.6, 14], [3.6, 6]]) {
    round(a, 0, y, 0, w, h, C);
    y += h;
  }
  round(a, 0, y, 0, 7, 3, 0x6a6f74); // «Седьмое небо»
  round(a, 0, y + 3, 0, 5, 1, C);
  for (let i = 0; i < 8; i++) round(a, 0, y + 4 + i * 3, 0, 1.6 - i * 0.12, 3, i % 2 ? R : C);
  a.solid(0, 0, 5);
}

/* Москва: главное здание МГУ */
function mgu(a) {
  const B = 0xd9cfbd;
  const B2 = 0xc4b8a2;
  a.box(0, 0, 0, 28, 8, 7, B);
  for (const sx of [-1, 1]) {
    a.box(sx * 11, 8, 0, 5, 4, 6, B2);
    stack(a, sx * 11, 12, 0, [3, 2, 1.2, 0.5], 1.4, B, B2);
  }
  a.box(0, 0, 0, 10, 16, 9, B);
  a.box(0, 16, 0, 8, 8, 7, B);
  a.box(0, 24, 0, 6, 6, 5, B2);
  a.box(0, 30, 0, 4, 4, 4, B);
  for (let i = 0; i < 6; i++) a.box(-4 + i * 1.6, 1, 4.55, 0.5, 14, 0.2, 0x6a6258);
  a.box(0, 26, 2.55, 2.6, 2.6, 0.2, 0xf4f1e8); // часы
  const top = stack(a, 0, 34, 0, [2.8, 2.2, 1.6, 1.1, 0.7, 0.4], 2.2, B, B2);
  a.box(0, top, 0, 0.3, 1, 0.3, GOLD);
  a.box(0, top + 1, 0, 1.4, 1.4, 0.3, 0xe0302a, 0, 0, Q); // звезда
  a.solid(0, 0, 14, 4);
}

/* Волгоград: Родина-мать зовёт */
function motherland(a) {
  const G = 0x8a8f94;
  const G2 = 0x6f7479;
  const H = 0x4f8f3e;
  stack(a, 0, 0, 0, [18, 14, 10], 3, H, 0x5f9f48);
  a.box(0, 9, 0, 4, 1.5, 4, G2);
  a.box(0, 10.5, 0, 3, 8, 2.4, G);
  a.box(0, 12, 1.8, 4, 6, 1, G2, 0, 0.3); // развевающийся плащ
  a.box(0, 18.5, -0.3, 2.8, 5, 2, G);
  a.box(0, 23.5, -0.3, 1.4, 1.8, 1.4, G);
  a.box(1.8, 20, -0.3, 0.8, 5, 0.8, G, 0, 0, -0.6); // рука с мечом
  a.box(3.8, 22, -0.3, 0.4, 12, 0.5, 0xb8bcc0, 0, 0, -0.35);
  a.box(-2.4, 20.5, -1.4, 0.8, 4.5, 0.8, G, 0, -0.9, 0.7); // зовущая рука
  a.solid(0, 0, 9);
}

/* Казань: мечеть Кул-Шариф */
function kulSharif(a) {
  const W = 0xf2f0ea;
  const T = 0x3aa7b8;
  const T2 = 0x2f8f9f;
  a.box(0, 0, 0, 14, 1, 14, 0xd9d4c7);
  round(a, 0, 1, 0, 10, 8, W);
  const top = stack(a, 0, 9, 0, [9, 9.6, 9.2, 8, 6.2, 4, 2], 1.5, T, T2);
  a.box(0, top, 0, 0.3, 1.6, 0.3, GOLD);
  a.box(0, top + 1.6, 0, 1, 0.3, 0.3, GOLD); // полумесяц
  for (const [sx, sz] of CORNERS) {
    const x = sx * 6.5;
    const z = sz * 6.5;
    round(a, x, 1, z, 1.6, 20, W);
    round(a, x, 11, z, 2.3, 0.5, T);
    round(a, x, 17, z, 2.3, 0.5, T);
    const t = stack(a, x, 21, z, [1.6, 1.2, 0.8, 0.4], 1.5, T, T2);
    a.box(x, t, z, 0.2, 1, 0.2, GOLD);
    a.solid(x, z, 1);
  }
  a.solid(0, 0, 5.5);
}

/* Москва: Храм Христа Спасителя */
function christSaviour(a) {
  const W = 0xf4f1ea;
  a.box(0, 0, 0, 16, 1.2, 16, 0xcfc8b8);
  a.box(0, 1.2, 0, 13, 12, 13, W);
  a.box(0, 1.2, 0, 16, 10, 7, W);
  a.box(0, 1.2, 0, 7, 10, 16, W);
  for (const [sx, sz] of SIDES) {
    const along = sz !== 0;
    [7, 5, 3, 1].forEach((w, i) => a.box(sx * 7.5, 11.2 + i * 0.7, sz * 7.5, along ? w : 1, 0.7, along ? 1 : w, W));
    a.box(sx * 8.05, 3, sz * 8.05, along ? 1.4 : 0.2, 5, along ? 0.2 : 1.4, 0x4a5a6a);
  }
  round(a, 0, 13.2, 0, 7, 5, W);
  onion(a, 0, 18.2, 0, 3.6, GOLD, 0xd9a52e);
  for (const [sx, sz] of CORNERS) {
    round(a, sx * 4.8, 13.2, sz * 4.8, 2.4, 3.5, W);
    onion(a, sx * 4.8, 16.7, sz * 4.8, 1.4, GOLD, 0xd9a52e);
  }
  a.solid(0, 0, 8);
}

/* Москва: Большой театр с квадригой Аполлона */
function bolshoi(a) {
  const B = 0xe9dcc4;
  const W = 0xf4f1ea;
  const BR = 0x8a6a3a;
  a.box(0, 0, 0, 16, 11, 14, B);
  a.box(0, 11, 0, 16.4, 1, 14.4, W);
  a.box(0, 12, 0, 15, 2, 13, 0x6f8f80);
  a.box(0, 0, 8, 13, 1, 3, W);
  for (let i = 0; i < 8; i++) round(a, -5.6 + i * 1.6, 1, 8.2, 0.9, 9, W);
  a.box(0, 10, 8, 13, 1.2, 3, W);
  [13, 10, 7, 4, 1.5].forEach((w, i) => a.box(0, 11.2 + i * 0.9, 8, w, 0.9, 3, i % 2 ? B : W));
  for (let i = 0; i < 4; i++) {
    const x = -2.1 + i * 1.4;
    a.box(x, 15.7, 8.8, 0.7, 1.2, 2.2, BR); // кони
    a.box(x, 16.6, 9.7, 0.6, 1.2, 0.8, BR, 0, -0.4);
  }
  a.box(0, 15.7, 7.4, 3, 1.4, 1.2, BR); // колесница
  a.box(0, 17.1, 7.4, 0.8, 2, 0.8, BR);
  a.solid(0, 0, 8, 7);
  a.solid(0, 8, 6.5, 1.5);
}

/* Карелия: деревянная церковь в Кижах */
function kizhi(a) {
  const WD = 0x7a5a3a;
  const WD2 = 0x6a4a2e;
  const SV = 0xb8bec4;
  const SV2 = 0xa2a8ae;
  const small = (x, y, z, r) => {
    round(a, x, y, z, r * 0.8, r * 0.9, WD2);
    onion(a, x, y + r * 0.9, z, r, SV, SV2, SV2);
  };
  round(a, 0, 0, 0, 10, 6, WD, WD2);
  a.box(0, 0, 0, 14, 5, 5, WD);
  a.box(0, 0, 0, 5, 5, 14, WD);
  for (const [sx, sz] of SIDES) small(sx * 6.2, 5, sz * 6.2, 1.2);
  round(a, 0, 6, 0, 7, 4, WD);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU + Q / 2;
    small(Math.cos(ang) * 4, 6, Math.sin(ang) * 4, 1.1);
  }
  round(a, 0, 10, 0, 5, 4, WD2);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU;
    small(Math.cos(ang) * 2.8, 10, Math.sin(ang) * 2.8, 1);
  }
  round(a, 0, 14, 0, 3.4, 4, WD);
  for (const [sx, sz] of CORNERS) small(sx * 1.4, 14, sz * 1.4, 0.9);
  small(0, 18, 0, 1.8);
  a.solid(0, 0, 6);
}

/* Москва: Царь-пушка и Царь-колокол */
function tsar(a) {
  const BR = 0x5f6a5a;
  const BR2 = 0x4f5a4a;
  a.box(-4, 0, 0, 3, 2.4, 7, BR2); // лафет
  for (const [dx, dz] of [[-1.9, -2], [1.9, -2], [-1.9, 2.2], [1.9, 2.2]]) {
    a.box(-4 + dx, 0, dz, 0.8, 3.2, 3.2, BR2);
    a.box(-4 + dx, 0, dz, 0.8, 3.2, 3.2, BR2, 0, Q);
  }
  a.box(-4, 2.4, 0.5, 3, 3, 9, BR, 0, -0.08); // ствол
  a.box(-4, 2.2, -4.4, 3.6, 3.6, 0.6, BR2);
  a.box(-4, 3, -4.75, 1.8, 1.8, 0.1, 0x1a1a1a);
  for (const [dx, y] of [[-1, 0], [1, 0], [0, 1.2]]) a.box(-4 + dx, y, -7, 1.2, 1.2, 1.2, 0x2e2e30); // ядра
  a.solid(-4, 0, 2, 4.5);
  a.box(5, 0, 1, 7, 1.2, 7, 0x8f8a80);
  stack(a, 5, 1.2, 1, [7, 6.2, 5.4, 4.8, 4.4, 3.6], 1.4, BR, BR2);
  a.box(5, 9.6, 1, 1.2, 1, 0.4, BR2); // ушко
  a.box(8.8, 1.2, 4.6, 2.2, 1.6, 0.6, BR, 0.4, 0, 0.3); // отколотый кусок
  a.solid(5, 1, 3.6);
}

export const RUSSIA = [
  { id: 'winter', name: 'Зимний дворец', country: 'Россия', size: 13.5, build: winterPalace },
  { id: 'isaac', name: 'Исаакиевский собор', country: 'Россия', size: 9.5, build: isaac },
  { id: 'peterpaul', name: 'Петропавловский собор', country: 'Россия', size: 9.5, build: peterPaul },
  { id: 'ostankino', name: 'Останкинская башня', country: 'Россия', size: 6, build: ostankino },
  { id: 'mgu', name: 'Московский университет', country: 'Россия', size: 14.5, build: mgu },
  { id: 'motherland', name: 'Родина-мать', country: 'Россия', size: 9.5, build: motherland },
  { id: 'kulsharif', name: 'Мечеть Кул-Шариф', country: 'Россия', size: 7.5, build: kulSharif },
  { id: 'saviour', name: 'Храм Христа Спасителя', country: 'Россия', size: 8.5, build: christSaviour },
  { id: 'bolshoi', name: 'Большой театр', country: 'Россия', size: 10, build: bolshoi },
  { id: 'kizhi', name: 'Кижи', country: 'Россия', size: 7.5, build: kizhi },
  { id: 'tsar', name: 'Царь-пушка и Царь-колокол', country: 'Россия', size: 9.5, build: tsar },
];
