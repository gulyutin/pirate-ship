import * as THREE from 'three';
import { cube, TAU, Q, CORNERS, SIDES, GOLD, WATER, round, stack, dome, onion } from './kit.js';

// Европа (часть 2)

/* Ватикан: собор Святого Петра, колоннада и обелиск */
function stPeters(a) {
  const S = 0xe3d9c2;
  const S2 = 0xcdc1a6;
  const DOME = 0x8f9aa0;
  const OZ = 6; // всё сдвинуто, чтобы площадь поместилась на острове
  a.box(0, 0, 2 + OZ, 16, 12, 14, S);
  a.box(0, 0, -5.5 + OZ, 18, 13, 1.5, S);
  for (let i = 0; i < 8; i++) round(a, -7 + i * 2, 0, -6.6 + OZ, 1, 11, S2);
  for (let i = 0; i < 9; i++) a.box(-8 + i * 2, 13, -5.5 + OZ, 0.5, 1.4, 0.5, S2); // статуи
  round(a, 0, 12, 3 + OZ, 9, 4, S);
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * TAU;
    a.box(Math.cos(ang) * 4.7, 12, 3 + OZ + Math.sin(ang) * 4.7, 0.5, 4, 0.5, S2);
  }
  const top = dome(a, 0, 16, 3 + OZ, 5, DOME, 0x7f8a90);
  round(a, 0, top, 3 + OZ, 1.8, 2.4, S);
  a.box(0, top + 2.4, 3 + OZ, 0.3, 1.6, 0.3, GOLD);
  a.box(0, top + 3.2, 3 + OZ, 1, 0.3, 0.3, GOLD);
  for (const side of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const f = -0.9 + k * 0.3;
      round(a, side * (6 + 3 * Math.cos(f)), 0, -9 + OZ + 6 * Math.sin(f), 0.8, 5, S);
      a.solid(side * (6 + 3 * Math.cos(f)), -9 + OZ + 6 * Math.sin(f), 0.5);
    }
  }
  a.box(0, 0, -15 + OZ, 1.6, 1, 1.6, S2); // обелиск
  stack(a, 0, 1, -15 + OZ, [1.1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4], 1.3, 0xd8c8a8);
  a.box(0, 11.4, -15 + OZ, 0.3, 1, 0.3, GOLD);
  a.solid(0, 2 + OZ, 9, 8);
}

/* Венеция: кампанила Сан-Марко, базилика и гондола */
function venice(a) {
  const BR = 0xb5553f;
  const W = 0xefe6d2;
  a.box(0, 0, 0, 4.4, 20, 4.4, BR);
  for (const [sx, sz] of CORNERS) a.box(sx * 2.1, 0, sz * 2.1, 0.4, 20, 0.4, 0xa0483a);
  a.box(0, 20, 0, 4.8, 3, 4.8, W);
  for (const [sx, sz] of SIDES) a.box(sx * 2.45, 20.4, sz * 2.45, sz ? 2.4 : 0.2, 2.2, sz ? 0.2 : 2.4, 0x3a3226);
  a.box(0, 23, 0, 4.4, 2.5, 4.4, BR);
  const top = stack(a, 0, 25.5, 0, [4, 3, 2, 1.1], 1.6, 0x5f8f6a);
  a.box(0, top, 0, 0.4, 1.4, 0.4, GOLD);
  a.solid(0, 0, 2.4);
  a.box(8, 0, 1, 8, 7, 9, W);
  for (const [x, z] of [[8, 1], [5.5, -1.5], [10.5, -1.5], [5.5, 3.5], [10.5, 3.5]]) dome(a, x, 7, z, x === 8 && z === 1 ? 2 : 1.4, 0x8f9aa0);
  a.box(8, 0, -3.55, 7, 5, 0.2, 0xd8b060); // золотые мозаики фасада
  a.solid(8, 1, 4, 4.5);
  a.box(-6, 0, 0, 3, 0.25, 22, WATER); // канал
  a.box(-6, 0.25, 3, 0.9, 0.5, 5, 0x1a1a1a); // гондола
  a.box(-6, 0.5, 5.6, 0.5, 1.2, 0.5, 0x1a1a1a, 0, 0.4);
  for (let i = 0; i < 4; i++) a.box(-6, 0.75 + i * 0.4, 1.5, 0.6, 0.4, 0.5, i % 2 ? 0x2f4f8f : 0xf0f0f0); // гондольер
  a.box(-6, 2.35, 1.5, 0.5, 0.5, 0.5, 0xf0c49a);
  a.box(-6, 2.85, 1.5, 0.8, 0.2, 0.8, 0xe8c050);
}

/* Прага: Староместская ратуша с астрономическими часами */
function orloj(a) {
  const S = 0xcfc4a8;
  const D = 0x3a3f45;
  const BL = 0x2f5a9a;
  a.box(0, 0, 0, 6, 22, 6, S);
  a.box(0, 22, 0, 7, 1, 7, D);
  stack(a, 0, 23, 0, [5.6, 4.4, 3.2, 2], 2, D);
  for (const [sx, sz] of CORNERS) stack(a, sx * 3.2, 23, sz * 3.2, [1, 0.6, 0.3], 1.2, D);
  a.box(0, 9, -3.05, 4, 4, 0.2, BL); // циферблат
  a.box(0, 9, -3.05, 4, 4, 0.2, BL, 0, 0, Q);
  a.box(0, 9.6, -3.12, 2.8, 2.8, 0.2, GOLD, 0, 0, Q);
  a.box(0, 10.2, -3.2, 1.6, 1.6, 0.2, 0x1d3a6b);
  a.box(0, 10.9, -3.3, 0.2, 1.6, 0.1, GOLD);
  a.box(0, 3.4, -3.05, 3, 3, 0.2, 0xefe6d2, 0, 0, Q); // календарь
  a.box(-0.8, 14.4, -3.05, 0.9, 1.4, 0.2, D); // окошки апостолов
  a.box(0.8, 14.4, -3.05, 0.9, 1.4, 0.2, D);
  a.solid(0, 0, 3.2);
  a.box(-7, 0, 1, 8, 10, 7, S);
  a.box(-7, 10, 1, 8.4, 1.2, 7.4, D);
  for (let i = 0; i < 3; i++) a.box(-9.5 + i * 2.5, 3, -2.55, 1.2, 4, 0.2, D);
  a.solid(-7, 1, 4, 3.5);
}

/* Лиссабон: башня Белен */
function belem(a) {
  const W = 0xefe8d6;
  const W2 = 0xd8cfb8;
  a.box(0, 0, -9, 16, 0.25, 4, WATER);
  a.box(0, 0, -3, 12, 6, 7, W);
  for (let i = 0; i < 10; i++) {
    a.box(-5.4 + i * 1.2, 6, -6.4, 0.7, 0.9, 0.4, W2);
    if (i % 3 === 1) a.box(-5.4 + i * 1.2, 6.3, -6.65, 0.4, 0.4, 0.1, 0xa33a2a); // кресты на щитах
  }
  for (const sx of [-1, 1]) {
    round(a, sx * 5.6, 6, -6.2, 1.2, 1.8, W);
    stack(a, sx * 5.6, 7.8, -6.2, [1.3, 0.9, 0.4], 0.5, W2);
  }
  a.box(0, 0, 3, 6, 18, 6, W);
  a.box(0, 9, -0.3, 4, 0.5, 1.4, W2);
  for (let i = 0; i < 5; i++) a.box(-2.4 + i * 1.2, 18, -0.1, 0.7, 0.9, 0.4, W2);
  for (const [sx, sz] of CORNERS) {
    round(a, sx * 2.8, 18, 3 + sz * 2.8, 1, 1.4, W);
    stack(a, sx * 2.8, 19.4, 3 + sz * 2.8, [1.1, 0.7, 0.3], 0.4, W2);
  }
  a.solid(0, 0, 6, 6.5);
}

/* Будапешт: здание Парламента на Дунае */
function budapest(a) {
  const W = 0xf0ebe0;
  const R = 0xb5382a;
  const D = 0x4a5058;
  a.box(0, 0, -7, 34, 0.25, 4, WATER);
  a.box(0, 0, 0, 30, 8, 7, W);
  a.box(0, 8, 0, 30.4, 2.5, 7.4, R);
  for (let i = 0; i < 14; i++) a.box(-13 + i * 2, 2, -3.55, 0.8, 4.5, 0.2, 0x4a5a6a);
  round(a, 0, 8, 0, 7, 5, W);
  const top = dome(a, 0, 13, 0, 3.6, R, 0x9c2e22);
  a.box(0, top, 0, 0.8, 6, 0.8, W);
  a.box(0, top + 6, 0, 0.2, 1.4, 0.2, GOLD);
  for (const x of [-14, -10, -6, 6, 10, 14]) {
    for (const z of [-3.4, 3.4]) {
      a.box(x, 8, z, 0.8, 4, 0.8, W);
      stack(a, x, 12, z, [0.7, 0.4], 0.8, D);
    }
  }
  for (const sx of [-1, 1]) {
    a.box(sx * 12, 0, 0, 3, 12, 3, W);
    stack(a, sx * 12, 12, 0, [3, 2, 1, 0.4], 1.2, R);
  }
  a.solid(0, 0, 15, 3.7);
}

/* Норвегия: деревянная церковь с драконами */
function stave(a) {
  const WD = 0x3b2618;
  const WD2 = 0x2e1e12;
  let y = 0;
  [9, 7.5, 6, 4.5, 3].forEach((w, i) => {
    a.box(0, y, 0, w - 1.4, 2.6, w - 1.4, WD);
    a.box(0, y + 2.6, 0, w, 0.8, w, WD2);
    a.box(0, y + 3.4, 0, w - 1.2, 0.8, w - 1.2, WD2);
    if (i > 0) {
      for (const [sx, sz] of SIDES) {
        a.box(sx * (w / 2 + 0.6), y + 3.8, sz * (w / 2 + 0.6), sz ? 0.5 : 1.4, 0.5, sz ? 1.4 : 0.5, WD, 0, sz * 0.5, -sx * 0.5); // драконьи головы
      }
    }
    y += 4.2;
  });
  const top = stack(a, 0, y, 0, [1.6, 1.2, 0.9, 0.6, 0.35], 1.5, WD2);
  a.box(0, top, 0, 0.3, 1, 0.3, 0xc99a3a);
  a.solid(0, 0, 4.5);
}

/* Швейцария: Маттерхорн и домик с флагом */
function matterhorn(a) {
  const R = 0x7a7f84;
  const R2 = 0x5f6469;
  const SN = 0xf4f7fa;
  for (let i = 0; i < 14; i++) {
    const w = 22 - i * 1.55;
    a.box(i * 0.35, i * 3, 0, w, 3, w * 0.85, i > 9 ? SN : i % 2 ? R : R2, 0.3);
    if (i >= 5 && i <= 9) a.box(i * 0.35, i * 3 + 2.7, 0, w * 0.7, 0.5, w * 0.6, SN, 0.3);
  }
  a.box(-9, 0, 9, 3.5, 2.5, 3, 0x8a5a3a);
  a.box(-9, 2.5, 9, 4.4, 0.8, 3.6, 0x4a2e1c);
  a.box(-6.5, 0, 9, 0.15, 4, 0.15, 0x8a8a8a);
  a.box(-5.8, 3, 9, 1.4, 1.4, 0.1, 0xd52b1e); // швейцарский флаг
  a.box(-5.8, 3.55, 9, 0.8, 0.3, 0.12, 0xffffff);
  a.box(-5.8, 3.3, 9, 0.3, 0.8, 0.12, 0xffffff);
  a.solid(0, 0, 10);
}

/* Исландия: гейзер — время от времени выбрасывает столб воды */
function geysir(a) {
  const R2 = 0x6a6258;
  const P = 0x6fd0e0;
  round(a, 0, 0, 0, 8, 0.8, R2);
  round(a, 0, 0.8, 0, 5, 0.5, 0xd8c890);
  a.box(0, 1.3, 0, 3, 0.15, 3, P);
  for (const [x, z] of [[6, -4], [-5, 5], [-6, -3]]) a.box(x, 0, z, 2.5, 0.2, 2, P);
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * TAU;
    a.box(Math.cos(ang) * 6.5, 0, Math.sin(ang) * 6.5, 1.4, 0.9, 1.2, 0x4a4a4a, ang);
  }
  const spout = a.group(0, 1.3, 0);
  spout.userData.geyser = true;
  a.solid(0, 0, 2);
}

/* Италия: Везувий дымит, у подножия — руины Помпей */
function vesuvius(a) {
  const R = 0x6a5f58;
  const R2 = 0x58504a;
  const L = 0xe85a2a;
  for (let i = 0; i < 9; i++) round(a, 0, i * 2.6, 0, 24 - i * 2.2, 2.6, i > 5 ? 0x4a4440 : i % 2 ? R : R2, 0x5f7a44);
  round(a, 0, 23.4, 0, 4, 0.3, L);
  a.box(3.5, 12, 4, 1, 0.3, 10, L, 0.3, 0.8); // поток лавы
  for (const [x, z, h] of [[-9, 9, 3], [-7.5, 10, 2], [-10.5, 7.5, 3.5], [-8, 7, 1.2]]) round(a, x, 0, z, 0.9, h, 0xd8cfb8);
  const smoke = a.group(0, 24, 0);
  smoke.userData.smoke = true;
  a.solid(0, 0, 11);
}

/* Румыния: замок Бран — замок Дракулы */
function bran(a) {
  const W = 0xefe6d6;
  const R = 0xb04a30;
  const R2 = 0x98402a;
  stack(a, 0, 0, 0, [14, 11], 3, 0x8f8a80, 0x7a756c);
  a.box(0, 6, 0, 8, 7, 7, W);
  stack(a, 0, 13, 0, [8.4, 6.4, 4.4, 2.4], 1.2, R, R2);
  round(a, -4, 6, 3, 3, 10, W);
  stack(a, -4, 16, 3, [3.4, 2.6, 1.8, 1, 0.5], 1.4, R, R2);
  a.box(4, 6, -2.5, 3, 11, 3, W);
  stack(a, 4, 17, -2.5, [3.4, 2.4, 1.4, 0.6], 1.2, R, R2);
  for (let i = 0; i < 4; i++) a.box(-2 + i * 1.6, 9, -3.55, 0.6, 1.2, 0.2, 0x3a3226);
  for (const [x, y, z] of [[6, 20, 2], [-7, 18, -3], [2, 22, 5], [8, 15, -6]]) {
    a.box(x, y, z, 0.4, 0.4, 0.4, 0x1a1a1a); // летучие мыши
    a.box(x, y + 0.1, z, 1.6, 0.15, 0.4, 0x1a1a1a, 0, 0, 0.2);
  }
  a.solid(0, 0, 7);
}

/* Шотландия: замок Уркухарт на озере Лох-Несс — и Несси! */
function nessie(a) {
  const S = 0x8a8478;
  const S2 = 0x7a7468;
  const N = 0x3f7a4a;
  a.box(0, 0, -6, 24, 0.3, 12, 0x2f6a8a);
  a.box(6, 0, 5, 5, 12, 5, S);
  for (const [dx, dz, h] of [[-2, -2, 2], [2, -2, 1], [2, 2, 2.4], [-2, 2, 0.6]]) a.box(6 + dx, 12, 5 + dz, 1, h, 1, S2); // обломанный верх
  a.box(0, 0, 7, 10, 4, 1.2, S2);
  a.box(-5, 0, 4, 1.2, 3, 6, S2);
  a.solid(6, 5, 2.6);
  a.solid(0, 7, 5, 0.8);
  const n = a.group(-3, 0.3, -6);
  cube(n, N, 1.4, 1.4, 1.4, 0, 0.5, 0);
  cube(n, N, 1.2, 1.2, 1.2, 2.2, 0.4, 0);
  cube(n, N, 0.9, 0.9, 0.9, 3.8, 0.3, 0);
  cube(n, N, 0.8, 3.6, 0.8, -1.4, 1.8, 0).rotation.z = 0.3;
  cube(n, N, 1.4, 0.8, 0.9, -2.2, 3.7, 0);
  cube(n, 0x1a1a1a, 0.2, 0.2, 0.95, -2.5, 3.9, 0);
  n.userData.swim = true;
}

export const EUROPE2 = [
  { id: 'stpeter', name: 'Собор Святого Петра', country: 'Ватикан', size: 15.5, build: stPeters },
  { id: 'venice', name: 'Венеция', country: 'Италия', size: 12.5, build: venice },
  { id: 'orloj', name: 'Пражские куранты', country: 'Чехия', size: 11, build: orloj },
  { id: 'belem', name: 'Башня Белен', country: 'Португалия', size: 11, build: belem },
  { id: 'budapest', name: 'Парламент Будапешта', country: 'Венгрия', size: 17, build: budapest },
  { id: 'stave', name: 'Деревянная церковь', country: 'Норвегия', size: 5.5, build: stave },
  { id: 'matterhorn', name: 'Гора Маттерхорн', country: 'Швейцария', size: 12, build: matterhorn },
  { id: 'geysir', name: 'Гейзер', country: 'Исландия', size: 8, build: geysir },
  { id: 'vesuvius', name: 'Вулкан Везувий', country: 'Италия', size: 12.5, build: vesuvius },
  { id: 'bran', name: 'Замок Дракулы', country: 'Румыния', size: 7.5, build: bran },
  { id: 'nessie', name: 'Озеро Лох-Несс', country: 'Шотландия', size: 12.5, build: nessie },
];
