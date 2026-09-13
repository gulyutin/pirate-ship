import { Q, SIDES, CORNERS, GOLD, round, stack, clocks, tree, flag } from './kit.js';

// Чудеса, добавленные позже. Их острова строятся самыми последними,
// чтобы номера прежних островов в сохранениях не сдвинулись.

/* ---------- Красноярск: «Красноярский Биг-Бен» — часовая башня с курантами над зданием ---------- */
function krasBigBen(a) {
  const W = 0xe8dcc4;
  const W2 = 0xd8ccb2;
  const T = 0xf4f1e8;
  const WIN = 0x3a4a5a;
  const ROOF = 0x3f4a58;
  const ROOF2 = 0x4f5a68;
  // здание: пять этажей окон, карнизы
  a.box(0, 0, 0, 22, 12, 9, W);
  a.box(0, 0, 0, 22.4, 1, 9.4, W2);
  for (const y of [4.4, 8.2]) a.box(0, y, 0, 22.2, 0.25, 9.2, T);
  a.box(0, 12, 0, 22.6, 0.6, 9.6, T);
  for (let fl = 0; fl < 5; fl++) {
    for (let i = 0; i < 10; i++) {
      const x = -9.9 + i * 2.2;
      if (Math.abs(x) < 2 && fl < 2) continue; // над входом — портик
      for (const sz of [-1, 1]) a.box(x, 1.4 + fl * 2.1, sz * 4.52, 1.1, 1.4, 0.1, WIN);
    }
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) a.box(sx * 11.02, 1.4 + fl * 2.1, -2.8 + i * 2.8, 0.1, 1.4, 1.1, WIN);
  }
  // портик с колоннами и фронтоном
  a.box(0, 0, -5.4, 7, 0.5, 2.2, W2);
  for (let i = 0; i < 4; i++) round(a, -2.4 + i * 1.6, 0.5, -5.8, 0.7, 4.6, T);
  a.box(0, 5.1, -5.6, 7, 0.6, 1.8, T);
  [6.4, 4.6, 2.8, 1].forEach((w, i) => a.box(0, 5.7 + i * 0.45, -5.6, w, 0.45, 1.6, W2));
  a.box(0, 0.5, -4.55, 2, 3, 0.1, 0x5a3a20); // двери
  // средняя часть, на которой стоит башня
  a.box(0, 12.6, 0, 9, 3, 7, W);
  for (let i = 0; i < 4; i++) for (const sz of [-1, 1]) a.box(-3 + i * 2, 13.2, sz * 3.52, 1, 1.6, 0.1, WIN);
  a.box(0, 15.6, 0, 9.4, 0.4, 7.4, T);
  // ствол башни с пилястрами и узкими стрельчатыми окнами
  a.box(0, 16, 0, 4.6, 11, 4.6, W);
  for (const [sx, sz] of CORNERS) a.box(sx * 2.25, 16, sz * 2.25, 0.6, 11, 0.6, T);
  for (const [fx, fz] of SIDES) {
    for (const y of [17.5, 21.5]) {
      a.box(fx * 2.33, y, fz * 2.33, fz ? 0.8 : 0.1, 2.6, fx ? 0.8 : 0.1, WIN);
      a.box(fx * 2.33, y + 2.6, fz * 2.33, fz ? 0.55 : 0.1, 0.55, fx ? 0.55 : 0.1, WIN, 0, fx ? Q : 0, fz ? Q : 0);
    }
  }
  // часовой ярус: четыре циферблата в золотых рамах
  a.box(0, 27, 0, 5.4, 5, 5.4, W2);
  a.box(0, 27, 0, 5.8, 0.4, 5.8, T);
  clocks(a, 27.9, 2.72, 3.2, 0xf4f1e8, 0x1a1a1a, GOLD);
  a.box(0, 32, 0, 5.8, 0.5, 5.8, T);
  // звонница с арками и золотыми пинаклями по углам
  a.box(0, 32.5, 0, 4.8, 3, 4.8, W);
  for (const [fx, fz] of SIDES) a.box(fx * 2.42, 32.9, fz * 2.42, fz ? 2.2 : 0.1, 2, fx ? 2.2 : 0.1, 0x2a2f3a);
  for (const [sx, sz] of CORNERS) {
    a.box(sx * 2.6, 32.5, sz * 2.6, 0.7, 4, 0.7, T);
    a.box(sx * 2.6, 36.5, sz * 2.6, 0.4, 1.4, 0.4, ROOF);
    a.box(sx * 2.6, 37.9, sz * 2.6, 0.12, 0.6, 0.12, GOLD);
  }
  a.box(0, 35.5, 0, 5.4, 0.5, 5.4, T);
  // островерхий шпиль с золотой верхушкой
  const top = stack(a, 0, 36, 0, [4.6, 3.8, 3.0, 2.3, 1.6, 1.0, 0.5], 1.5, ROOF, ROOF2);
  a.box(0, top, 0, 0.5, 0.5, 0.5, GOLD);
  a.box(0, top + 0.5, 0, 0.15, 1.6, 0.15, GOLD);
  // клумбы, берёзки и флаг России на крыше
  for (const sx of [-1, 1]) {
    a.box(sx * 6, 0, -7, 5, 0.4, 1.6, 0x6a4a2e);
    for (let i = 0; i < 5; i++) a.box(sx * 6 - 2 + i, 0.4, -7, 0.6, 0.4, 0.6, [0xe0302a, 0xf4d23a, 0xf07ab8][i % 3]);
    tree(a, sx * 10, 0, -8, 3.4, 2.2, 0xf4f1e8, 0x5f9f48);
  }
  flag(a, 9, 12.6, -3.5, ['WWWWW', 'BBBBB', 'RRRRR'], { W: 0xf4f4f4, B: 0x2a4aa0, R: 0xd8252a });
  a.solid(0, 0, 11.4, 4.8);
  a.solid(0, -5.6, 3.6, 1.2);
}

export const EXTRA = [
  { id: 'krasbigben', region: 'russia', name: 'Красноярский Биг-Бен', country: 'Россия', size: 11.5, build: krasBigBen },
];
