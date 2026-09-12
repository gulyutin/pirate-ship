import { TAU, Q, CORNERS, SIDES, GOLD, WATER, round, stack, stackSquare, beam, polyline, pixels, flag, tree } from './kit.js';

// Америка

/* Сан-Франциско: мост Золотые Ворота */
function goldenGate(a) {
  const R = 0xc0452a;
  const R2 = 0xa83a22;
  a.box(0, 0, 0, 12, 0.3, 30, WATER);
  const cableY = (x) => {
    const ax = Math.abs(x);
    return ax < 8 ? 8 + 14 * (ax / 8) ** 2 : 22 - ((ax - 8) / 11) * 15;
  };
  for (const x of [-8, 8]) {
    for (const z of [-1.6, 1.6]) a.box(x, 0, z, 1.2, 22, 1.2, R);
    for (const y of [8, 15, 21]) a.box(x, y, 0, 1.2, 1, 4.4, R2);
    a.solid(x, 0, 1, 2.2);
  }
  a.box(0, 6, 0, 38, 1, 3.6, R2);
  for (const z of [-1.6, 1.6]) {
    const pts = [];
    for (let x = -19; x <= 19; x += 1) pts.push([x, cableY(x), z]);
    polyline(a, pts, 0.35, R);
    for (let x = -18; x <= 18; x += 2) if (Math.abs(Math.abs(x) - 8) > 0.5) a.box(x, 7, z, 0.12, cableY(x) - 7, 0.12, R);
  }
}

/* США: гора Рашмор — четыре президента, высеченные в скале */
function rushmore(a) {
  const G = 0xb8b4ac;
  const G2 = 0xa8a49c;
  const G3 = 0x98948c;
  a.box(0, 0, 3, 26, 14, 10, G3);
  a.box(0, 14, 4, 22, 6, 8, G2);
  [16, 15, 13.5, 15].forEach((y, i) => {
    const x = -8 + i * 5.3;
    a.box(x, y - 5, -1.5, 3.6, 5, 3, G);
    a.box(x, y - 2, -3.1, 3.4, 0.8, 0.6, G2); // брови
    for (const sx of [-0.8, 0.8]) a.box(x + sx, y - 2.5, -3.05, 0.6, 0.4, 0.2, 0x6a665e);
    a.box(x, y - 3.4, -3.3, 0.8, 1.6, 0.9, G); // нос
    a.box(x, y - 4.4, -3.1, 1.6, 0.3, 0.3, G3);
    a.box(x, y, -1.5, 3.8, 1, 3, G2);
  });
  for (let i = 0; i < 8; i++) tree(a, -12 + i * 3.4, 0, -6 - (i % 2) * 1.5, 1.2, 1.6, 0x4a3020, 0x2f5f3a);
  a.solid(0, 3, 13, 5);
}

/* Нью-Йорк: Эмпайр-стейт-билдинг */
function empire(a) {
  const S = 0xcfc9bc;
  const S2 = 0xbab3a4;
  const D = 0x6a6f78;
  a.box(0, 0, 0, 14, 5, 12, S2);
  a.box(0, 5, 0, 11, 26, 9, S);
  for (let i = 0; i < 9; i++) {
    a.box(-4.4 + i * 1.1, 5, 4.55, 0.4, 26, 0.2, D);
    a.box(-4.4 + i * 1.1, 5, -4.55, 0.4, 26, 0.2, D);
  }
  for (let i = 0; i < 7; i++) {
    for (const sx of [-1, 1]) a.box(sx * 5.55, 5, -3.3 + i * 1.1, 0.2, 26, 0.4, D);
  }
  a.box(0, 31, 0, 9, 4, 7.4, S2);
  a.box(0, 35, 0, 7, 3, 6, S);
  a.box(0, 38, 0, 5.4, 3, 5.4, S2);
  a.box(0, 41, 0, 4, 2, 4, S);
  stack(a, 0, 43, 0, [2.6, 1.8, 1.2], 3, 0xd0d8e0);
  a.box(0, 52, 0, 0.4, 10, 0.4, 0xd0d8e0);
  a.solid(0, 0, 7, 6);
}

/* Вашингтон: Белый дом */
function whiteHouse(a) {
  const W = 0xf6f6f2;
  const W2 = 0xe6e6e0;
  round(a, 0, 0, -10, 4, 0.5, W2);
  round(a, 0, 0.5, -10, 3, 0.2, WATER);
  a.box(0, 0, 0, 16, 7, 8, W);
  for (const sx of [-1, 1]) a.box(sx * 12, 0, 0, 8, 4, 5, W2);
  for (let i = 0; i < 6; i++) {
    const ang = Math.PI + 0.35 + (i / 5) * (Math.PI - 0.7);
    round(a, Math.cos(ang) * 3.6, 0.8, -4 + Math.sin(ang) * 3.6, 0.7, 6, W);
  }
  a.box(0, 0, -4, 6, 7, 2, W);
  a.box(0, 3.2, -5.5, 7, 0.4, 3, W);
  a.box(0, 7, 0, 16.4, 0.8, 8.4, W2);
  for (let i = 0; i < 7; i++) {
    a.box(-6.6 + i * 2.2, 1.5, -4.05, 0.9, 1.6, 0.2, 0x4a5a6a);
    a.box(-6.6 + i * 2.2, 4.5, -4.05, 0.9, 1.6, 0.2, 0x4a5a6a);
  }
  flag(a, 0, 7.8, 0, ['BBRRRRR', 'BBWWWWW', 'RRRRRRR', 'WWWWWWW', 'RRRRRRR'], { R: 0xb22234, W: 0xffffff, B: 0x3c3b6e });
  a.solid(0, 0, 16, 4);
}

/* Сиэтл: башня Спейс-Нидл */
function spaceNeedle(a) {
  const W = 0xefefef;
  round(a, 0, 0, 0, 1.4, 34, 0x9aa4ac);
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * TAU;
    for (const off of [-0.25, 0.25]) {
      const c = Math.cos(ang + off);
      const s = Math.sin(ang + off);
      polyline(a, [[c * 6, 0, s * 6], [c * 1.2, 20, s * 1.2], [c * 2.8, 33, s * 2.8]], 0.7, W);
    }
    a.solid(Math.cos(ang) * 6, Math.sin(ang) * 6, 0.8);
  }
  round(a, 0, 33, 0, 9, 1, 0xe8793a);
  round(a, 0, 34, 0, 10, 1.2, W);
  round(a, 0, 35.2, 0, 8, 1.4, 0x9fb8c8);
  round(a, 0, 36.6, 0, 9, 0.8, W);
  round(a, 0, 37.4, 0, 5, 1, W);
  a.box(0, 38.4, 0, 0.4, 6, 0.4, W);
  a.solid(0, 0, 1.2);
}

/* Лос-Анджелес: надпись HOLLYWOOD на холме */
function hollywood(a) {
  const G = 0x6f8f4a;
  const G2 = 0x5f7f3e;
  const W = 0xf6f6f2;
  a.box(0, 0, 4, 34, 6, 12, G);
  a.box(0, 6, 6, 30, 4, 8, G2);
  a.box(0, 10, 8, 24, 3, 5, G);
  const FONT = {
    H: ['101', '101', '111', '101', '101'],
    O: ['111', '101', '101', '101', '111'],
    L: ['100', '100', '100', '100', '111'],
    Y: ['101', '101', '010', '010', '010'],
    W: ['101', '101', '101', '111', '101'],
    D: ['110', '101', '101', '101', '110'],
  };
  // Буквы стоят на гребне холма. Два слоя: передний читается с юга (−z), задний —
  // зеркальный — с севера, чтобы надпись была правильной с любой стороны.
  const px = 0.7;
  const text = 'HOLLYWOOD';
  const x0 = -((text.length * 4 - 1) * px) / 2 + px / 2;
  const mirror = (rows) => rows.map((r) => [...r].reverse().join(''));
  [...text].forEach((ch, i) => {
    pixels(a, mirror(FONT[ch]), -(x0 + i * 4 * px) - 2 * px, 13, 7.9, px, { 1: W }, 0.2);
    pixels(a, FONT[ch], x0 + i * 4 * px, 13, 8.1, px, { 1: W }, 0.2);
  });
  for (let i = 0; i < 9; i++) a.box(x0 + i * 4 * px + px, 13, 8.5, 0.15, 3, 0.15, 0x8a8a8a); // опоры
  a.solid(0, 4, 17, 6);
}

/* Торонто: телебашня Си-Эн Тауэр */
function cnTower(a) {
  const C = 0xd8d4cc;
  const C2 = 0xc4bfb6;
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * TAU;
    for (let s = 0; s < 5; s++) a.box(Math.sin(ang) * 2.2, s * 6, Math.cos(ang) * 2.2, 1.6, 6, 4.4 - s * 0.7, C2, ang);
  }
  stack(a, 0, 0, 0, [4, 3.4, 3, 2.6, 2.3], 9, C, C2);
  round(a, 0, 45, 0, 7, 1.5, C2);
  round(a, 0, 46.5, 0, 8, 2, 0x3a4a5a);
  round(a, 0, 48.5, 0, 7, 1.2, C2);
  round(a, 0, 49.7, 0, 3, 8, C);
  round(a, 0, 57.7, 0, 3.6, 2, 0x3a4a5a);
  round(a, 0, 59.7, 0, 1.2, 8, C);
  for (let i = 0; i < 5; i++) a.box(0, 67.7 + i * 2, 0, 0.5, 2, 0.5, i % 2 ? 0xc0392b : 0xf0f0f0);
  a.solid(0, 0, 3);
}

/* Перу: Мачу-Пикчу и лама */
function machuPicchu(a) {
  const G = 0x4f8f3e;
  const G2 = 0x5f9f48;
  const S = 0x9a948a;
  for (let i = 0; i < 6; i++) {
    const w = 26 - i * 1.5;
    const d = 18 - i * 2.4;
    a.box(0, i * 1.5, -2 + i * 1.2, w, 1.5, d, i % 2 ? G : G2);
    a.box(0, i * 1.5, -2 + i * 1.2 - d / 2, w, 1.5, 0.5, S);
  }
  for (const [x, z] of [[-6, 3], [-2, 5], [3, 4], [6, 6]]) {
    for (const [sx, sz] of SIDES) a.box(x + sx * 1.3, 9, z + sz * 1.3, sz ? 3 : 0.4, 2, sz ? 0.4 : 3, S); // стены без крыш
  }
  stack(a, 4, 0, 11, [10, 8, 6.5, 5, 3.6, 2.4], 3.5, G, 0x6a6f64); // пик Уайна-Пикчу
  const L = 0xf0ece0;
  a.box(-6, 9, -2, 1.6, 1.2, 0.8, L); // лама
  a.box(-5.2, 10.2, -2, 0.4, 1.4, 0.4, L);
  a.box(-5, 11.4, -2, 0.7, 0.5, 0.4, L);
  for (const [dx, dz] of CORNERS) a.box(-6 + dx * 0.6, 8.3, -2 + dz * 0.25, 0.25, 0.8, 0.25, L);
  a.solid(0, 3, 13, 9);
}

/* США и Канада: Ниагарский водопад */
function niagara(a) {
  const R = 0x7a6f64;
  a.box(0, 0, 6, 28, 8, 12, R);
  a.box(0, 8, 6, 28, 0.4, 12, 0x4f8f3e);
  a.box(0, 8.4, 6, 18, 0.3, 12, WATER);
  a.box(0, 0, -6, 28, 0.4, 12, WATER);
  for (let i = -8; i <= 8; i++) {
    const u = i / 8;
    a.box(i * 1.1, 0.4, -0.2 - 2.5 * (1 - u * u), 1.2, 8.3, 0.6, i % 2 ? 0x8fd0ee : WATER);
  }
  a.box(0, 0.4, -3, 20, 0.6, 3, 0xe6f5ff);
  a.box(4, 0.4, -8, 1.6, 0.8, 3, 0x2f4f8f); // кораблик
  const mist = a.group(0, 0.6, -3);
  mist.userData.mist = 18;
  a.solid(0, 6, 14, 6);
}

/* Сент-Луис: стальная арка Гейтвей */
function gatewayArch(a) {
  const M = 0xd8dde2;
  const H = 34;
  const S = 14;
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = -1 + (i / 24) * 2;
    pts.push([t * S, H * (1 - Math.abs(t) ** 1.6), 0]);
  }
  for (let i = 1; i < pts.length; i++) beam(a, pts[i - 1], pts[i], 2.4 - 1.2 * (1 - Math.abs(i - 12) / 12), M);
  a.solid(-S, 0, 1.4);
  a.solid(S, 0, 1.4);
}

/* Нью-Йорк: Бруклинский мост */
function brooklyn(a) {
  const S = 0xb8a88a;
  const S2 = 0xa49474;
  const C = 0x6a6f74;
  a.box(0, 0, 0, 10, 0.3, 30, WATER);
  for (const x of [-7, 7]) {
    for (const z of [-3, 0, 3]) a.box(x, 0, z, 3.2, 14, 1.4, S);
    a.box(x, 14, 0, 3.2, 6, 7.4, S);
    for (const z of [-1.5, 1.5]) {
      a.box(x, 12, z, 3.2, 2, 1.2, S2); // стрельчатые арки
      a.box(x, 11, z, 3.2, 1, 0.5, S2);
    }
    a.solid(x, 0, 1.8, 3.8);
  }
  a.box(0, 6, 0, 38, 0.8, 5, S2);
  for (const z of [-2.2, 2.2]) {
    const pts = [];
    for (let x = -19; x <= 19; x++) {
      const ax = Math.abs(x);
      pts.push([x, ax < 7 ? 8.5 + 11 * (ax / 7) ** 2 : 19.5 - ((ax - 7) / 12) * 12.5, z]);
    }
    polyline(a, pts, 0.3, C);
    for (const x of [-7, 7]) for (const k of [-4, 4]) beam(a, [x, 19, z], [x + k, 6.8, z], 0.12, C); // растяжки
  }
}

export const AMERICAS = [
  { id: 'goldengate', name: 'Мост Золотые Ворота', country: 'США', size: 19.5, build: goldenGate },
  { id: 'rushmore', name: 'Гора Рашмор', country: 'США', size: 13.5, build: rushmore },
  { id: 'empire', name: 'Эмпайр-стейт-билдинг', country: 'США', size: 7.5, build: empire },
  { id: 'whitehouse', name: 'Белый дом', country: 'США', size: 16, build: whiteHouse },
  { id: 'spaceneedle', name: 'Спейс-Нидл', country: 'США', size: 6.5, build: spaceNeedle },
  { id: 'hollywood', name: 'Надпись Голливуд', country: 'США', size: 17, build: hollywood },
  { id: 'cn', name: 'Си-Эн Тауэр', country: 'Канада', size: 4.5, build: cnTower },
  { id: 'machupicchu', name: 'Мачу-Пикчу', country: 'Перу', size: 13.5, build: machuPicchu },
  { id: 'niagara', name: 'Ниагарский водопад', country: 'США и Канада', size: 14.5, build: niagara },
  { id: 'gateway', name: 'Арка Гейтвей', country: 'США', size: 15, build: gatewayArch },
  { id: 'brooklyn', name: 'Бруклинский мост', country: 'США', size: 19.5, build: brooklyn },
];
