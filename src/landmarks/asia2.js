import { TAU, Q, CORNERS, SIDES, GOLD, WATER, round, stack, stackSquare, dome, sphere, beam } from './kit.js';

// Азия (часть 2)

/* Шанхай: телебашня «Жемчужина Востока» */
function pearl(a) {
  const P = 0xd8508a;
  const P2 = 0xb83a70;
  const W = 0xe8eaee;
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * TAU;
    round(a, Math.cos(ang) * 2.6, 0, Math.sin(ang) * 2.6, 1.4, 42, W);
    beam(a, [Math.cos(ang) * 8, 0, Math.sin(ang) * 8], [Math.cos(ang) * 2.6, 10, Math.sin(ang) * 2.6], 1.2, W);
    sphere(a, Math.cos(ang) * 2.6, 21, Math.sin(ang) * 2.6, 1.2, P);
  }
  sphere(a, 0, 7, 0, 6, P, P2);
  sphere(a, 0, 29, 0, 4.5, P, P2);
  sphere(a, 0, 42, 0, 1.8, P);
  a.box(0, 45.6, 0, 0.6, 12, 0.6, 0xc8ccd0);
  a.solid(0, 0, 4);
}

/* Китай: Терракотовая армия */
function terracotta(a) {
  const T = 0xb07a50;
  const T2 = 0x9a6844;
  const D = 0x6a5038;
  a.box(0, 0, 0, 22, 0.3, 17, 0xc9a070);
  for (let r = 0; r < 4; r++) {
    const z = -6 + r * 4;
    a.box(0, 0, z + 2, 22, 1.4, 0.8, D);
    for (let c = 0; c < 9; c++) {
      const x = -8 + c * 2;
      a.box(x, 0.3, z, 0.8, 1.2, 0.5, T2);
      a.box(x, 1.5, z, 1, 1.4, 0.7, T);
      a.box(x, 2.9, z, 0.6, 0.7, 0.6, T2);
      a.box(x + 0.15, 3.6, z, 0.3, 0.3, 0.3, D);
    }
    a.solid(0, z, 9, 0.5);
  }
  for (let i = 0; i < 4; i++) {
    const x = -2.4 + i * 1.6;
    a.box(x, 0.3, -9, 0.8, 1.4, 2, T); // кони
    a.box(x, 1.4, -10.2, 0.6, 1, 0.8, T2, 0, 0.4);
  }
  a.box(0, 0.3, -6.9, 3, 1.2, 1.2, T2); // колесница
}

/* Мьянма: золотая пагода Шведагон */
function shwedagon(a) {
  const W = 0xefeae0;
  stackSquare(a, 0, 0, 0, [20, 16, 12], 1.2, W);
  const top = stack(a, 0, 3.6, 0, [11, 11.5, 11, 10, 8.6, 7, 5.6, 4.4, 3.4, 2.6, 2, 1.5, 1.1, 0.8, 0.5], 1.4, GOLD, 0xd4a22c);
  round(a, 0, top, 0, 0.6, 0.6, 0xf4f1ea);
  a.box(0, top + 0.6, 0, 0.2, 1.4, 0.2, GOLD);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU;
    stack(a, Math.cos(ang) * 8.4, 3.6, Math.sin(ang) * 8.4, [2.4, 2.2, 1.6, 1, 0.5], 0.8, GOLD, 0xd4a22c);
  }
  a.solid(0, 0, 6.5);
}

/* Индонезия: Боробудур — ступенчатый храм со ступами-колоколами */
function borobudur(a) {
  const S = 0x7a7568;
  const S2 = 0x6a655a;
  const y0 = stackSquare(a, 0, 0, 0, [24, 21, 18, 15, 12], 1.8, S, S2);
  for (let k = 0; k < 3; k++) {
    const r = 5.2 - k * 1.4;
    const y = y0 + k * 1.2;
    round(a, 0, y, 0, r * 2 + 1.4, 1.2, S);
    const n = 16 - k * 4;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU;
      stack(a, Math.cos(ang) * r, y + 1.2, Math.sin(ang) * r, [1.4, 1.5, 1.2, 0.7, 0.3], 0.45, S2, S);
    }
  }
  stack(a, 0, y0 + 3.6, 0, [4.4, 4.6, 4.2, 3.4, 2.4, 1.4, 0.8, 0.4], 0.9, S, S2);
  a.solid(0, 0, 12);
}

/* Стамбул: Айя-София */
function hagiaSophia(a) {
  const P = 0xd9a88a;
  const P2 = 0xc8977a;
  const D = 0x8a9aa4;
  const W = 0xefeae0;
  a.box(0, 0, 0, 18, 9, 14, P);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.box(sx * 8.5, 0, sz * 6.5, 2, 10, 2, P2);
  round(a, 0, 9, 0, 9, 2, P2);
  const top = dome(a, 0, 11, 0, 5.2, D, 0x7a8a94);
  a.box(0, top, 0, 0.2, 1.4, 0.2, GOLD);
  for (const sx of [-1, 1]) dome(a, sx * 6, 9, 0, 3.4, D);
  for (const [sx, sz] of CORNERS) {
    const x = sx * 10.5;
    const z = sz * 8.5;
    round(a, x, 0, z, 1.2, 20, W);
    round(a, x, 12, z, 1.8, 0.4, W);
    round(a, x, 17, z, 1.8, 0.4, W);
    stack(a, x, 20, z, [1.2, 0.8, 0.5, 0.25], 1.5, D);
    a.solid(x, z, 0.8);
  }
  a.solid(0, 0, 9.5, 7.5);
}

/* Иордания: Петра — сокровищница, высеченная в розовой скале */
function petra(a) {
  const R = 0xc9785a;
  const R2 = 0xb56a4e;
  const R3 = 0xa35d44;
  a.box(0, 0, 4, 26, 26, 10, R2);
  for (const [x, h] of [[-10, 4], [-4, 2], [3, 5], [9, 3]]) a.box(x, 26, 4, 6, h, 8, R3);
  for (let i = 0; i < 6; i++) if (i !== 2 && i !== 3) round(a, -5 + i * 2, 0, -1.4, 1.1, 10, R);
  round(a, -1, 0, -1.4, 1.1, 10, R);
  round(a, 1, 0, -1.4, 1.1, 10, R);
  [14, 11, 8, 5, 2].forEach((w, i) => a.box(0, 10 + i * 0.8, -1.2, w, 0.8, 1.6, R));
  a.box(0, 0, -1.05, 1.6, 6, 0.2, 0x4a2a1e);
  round(a, 0, 14.5, -1.2, 3.4, 6, R);
  stack(a, 0, 20.5, -1.2, [3, 2, 1], 0.6, R);
  a.box(0, 22.3, -1.2, 0.8, 1.2, 0.8, R);
  for (const sx of [-1, 1]) {
    round(a, sx * 4.5, 14.5, -1.2, 1, 6, R);
    round(a, sx * 6.5, 14.5, -1.2, 1, 6, R);
    a.box(sx * 5.5, 20.5, -1.2, 3.4, 0.8, 1.6, R);
  }
  a.solid(0, 4, 13, 5);
}

/* Дели: минарет Кутб-Минар */
function qutb(a) {
  const R = 0xb5603f;
  const R2 = 0xa3533a;
  const W = 0xe8dcc4;
  let y = 0;
  [[5, 8], [4.3, 7.5], [3.7, 7], [3.2, 6], [2.7, 5]].forEach(([w, h], i) => {
    round(a, 0, y, 0, w, h, i % 2 ? R2 : R, R);
    a.box(0, y, 0, w * 0.9, h, w * 0.9, R2, Q / 2); // рёбра-«каннелюры»
    a.box(0, y, 0, w * 0.9, h, w * 0.9, R2, -Q / 2);
    round(a, 0, y + h, 0, w + 1.2, 0.5, W);
    y += h + 0.5;
  });
  round(a, 0, y, 0, 1.8, 1.6, W);
  stack(a, 0, y + 1.6, 0, [1.4, 0.8, 0.3], 0.6, R);
  for (let i = 0; i < 4; i++) a.box(-9 + i * 1.8, 0, 5, 1.2, 6, 1.2, R2); // руины мечети
  a.box(-6.3, 6, 5, 6.6, 1, 1.4, R2);
  a.solid(0, 0, 2.6);
  a.solid(-6.3, 5, 3.5, 0.8);
}

/* Дели: Храм Лотоса */
function lotus(a) {
  const W = 0xf4f2ee;
  const W2 = 0xe2dfd8;
  round(a, 0, 0, 0, 24, 0.25, WATER);
  round(a, 0, 0.25, 0, 18, 0.8, W2);
  for (let L = 0; L < 3; L++) {
    const r = [7, 5, 3][L];
    const tilt = [0.9, 0.55, 0.25][L];
    const h = [6, 8, 9][L];
    for (let i = 0; i < 9; i++) {
      const ang = ((i + L * 0.5) / 9) * TAU;
      a.box(Math.sin(ang) * r, 1.05, Math.cos(ang) * r, 3.2 - L * 0.5, h, 0.6, L % 2 ? W2 : W, ang, -tilt);
    }
  }
  a.solid(0, 0, 8);
}

/* Дубай: отель-парус Бурдж аль-Араб */
function burjArab(a) {
  const W = 0xf2f4f6;
  const S = 0xc8ccd0;
  for (let i = 0; i < 16; i++) {
    const u = i / 15;
    const len = 11 * (1 - u * u * 0.85);
    a.box(-6 + len / 2, i * 3, 0, len, 3, 4 - u * 1.5, i % 2 ? W : 0xe6eaee);
  }
  a.box(-6.5, 0, 0, 1.4, 54, 1.4, S);
  for (let i = 0; i < 4; i++) beam(a, [-6.5, i * 12, 2.2], [3.5 - i * 2.2, i * 12 + 12, 2.2], 0.5, S); // крестовины
  round(a, 5, 40, 0, 5, 0.4, 0x3a3f45); // вертолётная площадка
  a.box(5, 40.4, 0, 2, 0.1, 0.4, 0xf0f0f0);
  beam(a, [-4, 36, 0], [4, 40, 0], 0.6, S);
  a.solid(-1, 0, 6, 2.5);
}

/* Кувейт: Кувейтские башни с синими шарами */
function kuwaitTowers(a) {
  const M = 0xd0d6dc;
  const B = 0x2f6fb0;
  const B2 = 0x5f9fd8;
  round(a, 0, 0, 0, 1.6, 48, M);
  sphere(a, 0, 17, 0, 5.5, B, B2);
  sphere(a, 0, 32, 0, 3.4, B, B2);
  a.box(0, 48, 0, 0.4, 6, 0.4, M);
  round(a, 7, 0, 3, 1.3, 34, M);
  sphere(a, 7, 16, 3, 4, B, B2);
  a.box(7, 34, 3, 0.3, 4, 0.3, M);
  round(a, -5, 0, 4, 0.7, 30, M);
  a.solid(0, 0, 1.4);
  a.solid(7, 3, 1.2);
  a.solid(-5, 4, 0.8);
}

/* Бангкок: храм Ват Арун — пранги в фарфоровой мозаике */
function watArun(a) {
  const W = 0xe6dcc8;
  const C = [0xd8453a, 0x3a6fc0, 0xe8b830, 0x4f9c5a];
  stackSquare(a, 0, 0, 0, [18, 14, 10], 1.6, W);
  const prang = (x, z, base, h) => {
    const n = 12;
    for (let i = 0; i < n; i++) round(a, x, 4.8 + (i * h) / n, z, base * (1 - (i / n) * 0.8), h / n, i % 2 ? W : C[i % 4]);
    a.box(x, 4.8 + h, z, 0.25, 2, 0.25, GOLD);
  };
  prang(0, 0, 7, 28);
  for (const [sx, sz] of CORNERS) prang(sx * 6, sz * 6, 3.2, 14);
  a.solid(0, 0, 9);
}

export const ASIA2 = [
  { id: 'pearl', name: 'Жемчужина Востока', country: 'Китай', size: 8.5, build: pearl },
  { id: 'terracotta', name: 'Терракотовая армия', country: 'Китай', size: 11, build: terracotta },
  { id: 'shwedagon', name: 'Пагода Шведагон', country: 'Мьянма', size: 10, build: shwedagon },
  { id: 'borobudur', name: 'Боробудур', country: 'Индонезия', size: 12, build: borobudur },
  { id: 'hagia', name: 'Айя-София', country: 'Турция', size: 11, build: hagiaSophia },
  { id: 'petra', theme: 'desert', name: 'Петра', country: 'Иордания', size: 13, build: petra },
  { id: 'qutb', name: 'Кутб-Минар', country: 'Индия', size: 9.5, build: qutb },
  { id: 'lotus', name: 'Храм Лотоса', country: 'Индия', size: 12, build: lotus },
  { id: 'burjarab', theme: 'desert', name: 'Бурдж аль-Араб', country: 'ОАЭ', size: 8, build: burjArab },
  { id: 'kuwait', name: 'Кувейтские башни', country: 'Кувейт', size: 11, build: kuwaitTowers },
  { id: 'watarun', name: 'Храм Ват Арун', country: 'Таиланд', size: 9.5, build: watArun },
];
