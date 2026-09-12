import * as THREE from 'three';
import { cube, TAU, Q, CORNERS, SIDES, GOLD, WATER, round, stack, stackSquare, sphere, beam, polyline, archFill, yawAlong, flag } from './kit.js';

// Европа (часть 1)
const tangent = (ang) => yawAlong(-Math.sin(ang), Math.cos(ang));

/* ---------- Париж: Триумфальная арка — рельефы, фриз, аттик со щитами, вечный огонь и флаг в проёме ---------- */
function arcTriomphe(a) {
  const S = 0xe3dac6;
  const S2 = 0xcfc5ae;
  const S3 = 0xbcb199;
  const PAVE = 0xa89f8c;
  // площадь Звезды: лучи мостовой расходятся от арки
  for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * TAU + 0.26;
    a.box(Math.cos(ang) * 8.2, 0, Math.sin(ang) * 8.2, 3.6, 0.05, 0.5, PAVE, yawAlong(Math.cos(ang), Math.sin(ang)));
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const z = sz * 2.8;
      a.box(sx * 6, 0, z, 6, 10, 4, S);
      a.box(sx * 6, 0, z, 6.3, 1.2, 4.3, S3); // цоколь
      a.solid(sx * 6, z, 3, 2);
      const fz = sz * 4.82;
      // скульптурная группа на постаменте: три фигуры и знамя
      a.box(sx * 6, 1.2, fz, 4.2, 0.5, 0.3, S3);
      a.box(sx * 6, 1.7, fz, 3.8, 4.4, 0.2, S2);
      for (const [dx, h] of [[-1.1, 3.2], [0, 3.8], [1.1, 3.0]]) {
        a.box(sx * 6 + dx, 1.7, fz + sz * 0.2, 0.7, h, 0.3, S3);
        a.box(sx * 6 + dx, 1.7 + h, fz + sz * 0.2, 0.45, 0.45, 0.3, S3);
      }
      a.box(sx * 6 + 0.6, 4.6, fz + sz * 0.25, 1.8, 0.8, 0.12, S3, 0, 0, 0.4);
      // верхний барельеф и угловые пилястры
      a.box(sx * 6, 6.9, fz, 4.6, 2.4, 0.2, S2);
      for (let i = 0; i < 5; i++) a.box(sx * 6 - 1.8 + i * 0.9, 7.2, fz + sz * 0.12, 0.35, 1.6, 0.12, S3);
      for (const px of [-2.75, 2.75]) a.box(sx * 6 + px, 1.2, fz, 0.5, 8.8, 0.3, S2);
    }
    // боковой проём сквозь опору и барельеф над ним
    archFill(a, sx * 6, 5, 0, 1.6, 0.8, 10, 6, S, false);
    a.box(sx * 9.02, 6.6, 0, 0.1, 2, 4.2, S2);
  }
  // главный проём: полукруглый свод с замковым камнем
  archFill(a, 0, 5.6, 0, 6, 3.2, 10, 9.6, S);
  for (const sz of [-1, 1]) a.box(0, 8.4, sz * 4.82, 1.2, 1.6, 0.2, S3);
  // вечный огонь и флаг Франции в проёме
  a.box(0, 0, 0, 1.4, 0.2, 1.4, 0x6a6152);
  a.group(0, 0.3, 0).userData.fire = true;
  for (const [x, c] of [[-0.9, 0x2a4a9a], [0, 0xf4f4f4], [0.9, 0xd8332a]]) a.box(x, 4.2, 1.8, 0.9, 4.4, 0.08, c);
  a.box(0, 8.6, 1.8, 3, 0.1, 0.1, 0x6a6152);
  // антаблемент с фризом, щитами и аттик
  a.box(0, 10, 0, 18.4, 0.6, 10, S2);
  a.box(0, 10.6, 0, 18, 2.6, 9.6, S);
  for (const sz of [-1, 1]) {
    a.box(0, 11, sz * 4.85, 17, 1.3, 0.2, S3); // фриз с шествием
    for (let i = 0; i < 24; i++) a.box(-8.1 + i * 0.7, 11.1, sz * 4.97, 0.3, 1, 0.1, S2);
    for (let i = 0; i < 15; i++) a.box(-7.7 + i * 1.1, 12.5, sz * 4.9, 0.6, 0.6, 0.12, S3); // щиты
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) a.box(sx * 9.05, 12.5, -3.6 + i * 1.2, 0.12, 0.6, 0.6, S3);
  a.box(0, 13.2, 0, 18.6, 0.8, 10.2, S2);
  a.box(0, 14, 0, 17.8, 2.2, 9.4, S);
  for (const sz of [-1, 1]) for (let i = 0; i < 6; i++) a.box(-7 + i * 2.8, 14.4, sz * 4.72, 2.2, 1.4, 0.1, S3);
  a.box(0, 16.2, 0, 18, 0.3, 9.6, S2);
  // смотровая площадка с перилами
  for (let i = 0; i < 18; i++) for (const sz of [-1, 1]) a.box(-8.5 + i, 16.5, sz * 4.6, 0.15, 0.6, 0.15, 0x4a4a4e);
  for (const sz of [-1, 1]) a.box(0, 17.05, sz * 4.6, 17.4, 0.1, 0.1, 0x4a4a4e);
}

/* ---------- Париж: Нотр-Дам — фасад с розой и галереей королей, две башни, аркбутаны, трансепт, шпиль ---------- */
function notreDame(a) {
  const S = 0xd9cfb4;
  const S2 = 0xc2b89c;
  const S3 = 0xb0a68a;
  const D = 0x3b3a44;
  const LEAD = 0x6a7078;
  const LEAD2 = 0x5a6068;
  const GL = 0x5a6a9a;
  const GL2 = 0x8a5a9a;
  const VERD = 0x6f9a8a; // позеленевшая медь статуй
  // неф, апсида и трансепт со свинцовыми крышами
  a.box(0, 0, 3, 9, 11, 16, S);
  [9.4, 7.6, 5.8, 4, 2.2].forEach((w, i) => a.box(0, 11 + i * 1.1, 3, w, 1.1, 16, i % 2 ? LEAD2 : LEAD));
  round(a, 0, 0, 10, 7.4, 11, S, S2);
  stack(a, 0, 11, 10, [7.8, 6.2, 4.6, 3, 1.4], 1.1, LEAD, LEAD2);
  a.box(0, 0, 4, 16, 11, 5, S);
  [5.4, 4.2, 3, 1.8, 0.8].forEach((d, i) => a.box(0, 11 + i * 1.1, 4, 16.4, 1.1, d, i % 2 ? LEAD2 : LEAD));
  for (const sx of [-1, 1]) {
    // роза трансепта
    a.box(sx * 8.05, 4, 4, 0.2, 3.6, 3.6, GL);
    a.box(sx * 8.1, 4, 4, 0.2, 3.6, 3.6, GL2, 0, Q);
    a.box(sx * 8.2, 5.3, 4, 0.1, 1, 1, 0xe8c050);
    // стрельчатые окна нефа и аркбутаны с пинаклями
    for (const z of [-3.4, -1, 8.2]) {
      a.box(sx * 4.55, 3, z, 0.15, 5, 1, GL);
      a.box(sx * 4.55, 7.6, z, 0.15, 0.7, 0.7, GL, 0, Q);
      a.box(sx * 7.3, 0, z, 1, 8, 1, S2);
      a.box(sx * 7.3, 8, z, 0.6, 1.4, 0.6, S3);
      a.box(sx * 7.3, 9.4, z, 0.25, 1, 0.25, S3);
      beam(a, [sx * 7.1, 7.6, z], [sx * 4.6, 10.4, z], 0.4, S2);
      beam(a, [sx * 7.1, 4.8, z], [sx * 4.6, 7, z], 0.35, S2);
    }
  }
  // западный фасад: три портала со стрельчатыми арками
  a.box(0, 0, -5, 14, 13, 3, S);
  a.box(0, 0, -6.6, 14.4, 0.8, 0.3, S3);
  for (const x of [-4.5, 0, 4.5]) {
    const w = x ? 2.2 : 2.8;
    a.box(x, 0.8, -6.55, w, 3.4, 0.2, D);
    [0.8, 0.5, 0.2].forEach((k, st) => a.box(x, 4.2 + st * 0.45, -6.55, w * k, 0.45, 0.2, D));
    for (const sd of [-1, 1]) a.box(x + sd * (w / 2 + 0.25), 0.8, -6.65, 0.35, 4.8, 0.3, S2);
    a.box(x, 5.6, -6.65, w + 0.8, 0.3, 0.3, S2);
  }
  // галерея королей
  a.box(0, 6.2, -6.6, 14, 0.2, 0.3, S2);
  for (let i = 0; i < 28; i++) a.box(-6.5 + i * 0.48, 6.4, -6.58, 0.3, 0.9, 0.22, S3);
  a.box(0, 7.4, -6.6, 14, 0.2, 0.3, S2);
  // большая роза и окна по бокам
  a.box(0, 7.8, -6.58, 4.6, 4.6, 0.15, S2);
  a.box(0, 8.1, -6.65, 4, 4, 0.15, GL);
  a.box(0, 8.1, -6.7, 4, 4, 0.15, GL2, 0, 0, Q);
  a.box(0, 9.5, -6.78, 1.2, 1.2, 0.1, 0xe8c050);
  for (const sx of [-1, 1]) {
    a.box(sx * 4.5, 8.2, -6.58, 1.1, 3, 0.15, GL);
    a.box(sx * 4.5, 11.2, -6.58, 0.8, 0.8, 0.15, GL, 0, 0, Q);
  }
  // ажурная галерея наверху
  a.box(0, 12.4, -6.6, 14, 0.25, 0.3, S2);
  for (let i = 0; i < 14; i++) a.box(-6.5 + i, 12.65, -6.6, 0.2, 0.9, 0.2, S3);
  // две башни с высокими проёмами, балюстрадой и горгульями
  for (const sx of [-1, 1]) {
    const x = sx * 4.5;
    a.box(x, 13, -5, 5, 8.5, 3, S);
    for (const o of [-1.1, 1.1]) {
      a.box(x + o, 14, -6.55, 0.8, 5.4, 0.2, D);
      a.box(x + o, 19.1, -6.55, 0.5, 0.5, 0.2, D, 0, 0, Q);
    }
    a.box(x + sx * 2.52, 14, -5, 0.2, 5.4, 0.8, D);
    a.box(x, 21.5, -5, 5.4, 0.4, 3.4, S2);
    for (const [cx, cz] of CORNERS) a.box(x + cx * 2.4, 21.9, -5 + cz * 1.4, 0.4, 1.3, 0.4, S3);
    for (let i = 0; i < 6; i++) a.box(x - 2 + i * 0.8, 21.9, -6.6, 0.18, 0.6, 0.18, S3);
    a.box(x + sx * 2.8, 20.6, -6.4, 0.9, 0.3, 0.3, S3); // горгулья
  }
  // шпиль над средокрестием и статуи апостолов
  round(a, 0, 16.5, 4, 2, 2, LEAD);
  const top = stack(a, 0, 18.5, 4, [1.5, 1.2, 0.95, 0.72, 0.52, 0.36, 0.22], 1.6, LEAD, LEAD2);
  a.box(0, top, 4, 0.15, 1.4, 0.15, GOLD);
  a.box(0, top + 0.9, 4, 0.7, 0.15, 0.15, GOLD);
  for (const [cx, cz] of CORNERS) a.box(cx * 1.5, 16.5, 4 + cz * 1.5, 0.35, 1.2, 0.35, VERD);
  a.solid(0, 2, 7.8, 9.5);
  a.solid(0, 10, 3.7);
}

/* ---------- Париж: Лувр — стеклянная пирамида с каркасом, пирамидки, фонтаны и дворец с павильонами ---------- */
function louvre(a) {
  const G = 0x9fc4d8;
  const G2 = 0x86b0c8;
  const FR = 0x4a5460;
  const S = 0xd9cfb8;
  const S2 = 0xc4b8a0;
  const R = 0x4a5460;
  const R2 = 0x5a6470;
  const WIN = 0x3a4a5a;
  // стеклянная пирамида: ярусы стекла и рёбра каркаса
  const PB = 12;
  const PH = 9;
  for (let i = 0; i < 10; i++) {
    const w = PB * (1 - i / 10);
    a.box(0, (i * PH) / 10, 0, w, PH / 10, w, i % 2 ? G : G2);
  }
  for (const [cx, cz] of CORNERS) beam(a, [(cx * PB) / 2, 0, (cz * PB) / 2], [0, PH, 0], 0.2, FR);
  for (const [sx, sz] of SIDES) beam(a, [(sx * PB) / 2, 0, (sz * PB) / 2], [0, PH, 0], 0.12, FR);
  a.box(0, 0, -6.1, 2, 1.4, 0.3, FR); // вход
  a.solid(0, 0, 6);
  // три маленькие пирамиды
  for (const [x, z] of [[-9, 1], [9, 1], [0, -9]]) {
    for (let i = 0; i < 4; i++) a.box(x, i * 0.7, z, 3 - i * 0.72, 0.7, 3 - i * 0.72, i % 2 ? G : G2);
    a.solid(x, z, 1.4);
  }
  // бассейны с фонтанчиками
  for (const sx of [-1, 1]) {
    const x = sx * 6.8;
    const z = -8.5;
    a.box(x, 0, z, 5, 0.5, 3.2, S2);
    a.box(x, 0.1, z, 4.4, 0.45, 2.6, WATER);
    for (const dx of [-1.2, 1.2]) a.group(x + dx, 0.6, z).userData.fountain = [0, 0];
  }
  // дворец: крылья с окнами в два этажа, мансардами и слуховыми окнами
  const wing = (x, z, w, d, alongX) => {
    a.box(x, 0, z, w, 7, d, S);
    a.box(x, 0, z, w + 0.3, 0.8, d + 0.3, S2);
    a.box(x, 3.4, z, w + 0.1, 0.25, d + 0.1, S2);
    a.box(x, 7, z, w + 0.3, 0.5, d + 0.3, S2);
    a.box(x, 7.5, z, alongX ? w : w * 0.8, 1.4, alongX ? d * 0.8 : d, R);
    a.box(x, 8.9, z, alongX ? w - 0.4 : w * 0.45, 0.8, alongX ? d * 0.45 : d - 0.4, R2);
    const len = alongX ? w : d;
    const n = Math.floor(len / 2);
    for (let i = 0; i < n; i++) {
      const u = -len / 2 + 1 + i * 2;
      for (const sd of [-1, 1]) {
        const px = alongX ? x + u : x + sd * (w / 2 + 0.03);
        const pz = alongX ? z + sd * (d / 2 + 0.03) : z + u;
        for (const y of [1.2, 4.2]) a.box(px, y, pz, alongX ? 0.8 : 0.1, 1.8, alongX ? 0.1 : 0.8, WIN);
        if (i % 2 === 0) {
          const qx = alongX ? x + u : x + sd * (w * 0.4 - 0.1);
          const qz = alongX ? z + sd * (d * 0.4 - 0.1) : z + u;
          a.box(qx, 7.6, qz, 0.7, 1.1, 0.7, S2);
          a.box(qx, 8.7, qz, 0.8, 0.3, 0.8, R2);
        }
      }
    }
  };
  wing(0, 10.8, 21.2, 4, true);
  for (const sx of [-1, 1]) wing(sx * 10.6, 2.2, 4, 13.6, false);
  // павильоны с высокими крышами
  const pavilion = (x, z, w, h) => {
    a.box(x, 0, z, w, h, w, S);
    a.box(x, h, z, w + 0.3, 0.4, w + 0.3, S2);
    stackSquare(a, x, h + 0.4, z, [w - 0.4, w - 1.2, w - 2, w - 2.8].filter((v) => v > 0.4), 1, R, R2);
    for (const [fx, fz] of SIDES) {
      for (const o of [-1, 1]) {
        a.box(x + fx * (w / 2 + 0.03) + (fz ? o * 0.9 : 0), 1.2, z + fz * (w / 2 + 0.03) + (fx ? o * 0.9 : 0), fz ? 0.8 : 0.1, h - 2.4, fx ? 0.8 : 0.1, WIN);
      }
    }
  };
  pavilion(0, 10.8, 5.4, 9);
  a.box(0, 13.4, 10.8, 0.2, 1, 0.2, GOLD);
  for (const sx of [-1, 1]) {
    pavilion(sx * 10.6, 10.8, 4.4, 8);
    pavilion(sx * 10.6, -4.8, 4, 7.5);
  }
  a.solid(0, 10.8, 13, 2.6);
  for (const sx of [-1, 1]) a.solid(sx * 10.6, 2.7, 2.4, 8.3);
}

/* ---------- Франция: Мон-Сен-Мишель — скала, стены с башнями, деревня уступами, аббатство и золотой архангел ---------- */
function montStMichel(a) {
  const R = 0x8f8a80;
  const R2 = 0x7d786e;
  const GR = 0x7a8a62;
  const S = 0xc9bea6;
  const S2 = 0xb5aa92;
  const ROOF = 0x4a5058;
  const ROOF2 = 0x5a6068;
  const WIN = 0x3a4050;
  const HOUSE = [0xe6dcc6, 0xd8ccb2, 0xcfc2a6];
  // скала: неровные ярусы, чуть повёрнутые друг к другу, с травой на уступах
  const LAYERS = [[19, 0], [16.5, 0.25], [14, 0.1], [11.5, 0.35], [9, 0.15], [7, 0.45]];
  LAYERS.forEach(([w, rot], i) => {
    a.box(0, i * 2.4, 0, w, 2.4, w * 0.94, i % 2 ? R : R2, rot);
    if (i < 4) {
      for (let k = 0; k < 5; k++) {
        const ang = k * 1.26 + i;
        a.box(Math.cos(ang) * w * 0.45, i * 2.4 + 2.4, Math.sin(ang) * w * 0.45, 1.6, 0.25, 1.2, GR, ang);
      }
    }
  });
  // крепостная стена с зубцами и воротами
  for (let i = 0; i < 26; i++) {
    const ang = (i / 26) * TAU;
    if (Math.abs(ang - 1.5 * Math.PI) < 0.14) continue;
    a.box(Math.cos(ang) * 9.9, 0, Math.sin(ang) * 9.9, 2.6, 3, 0.9, S, tangent(ang));
    if (i % 2) a.box(Math.cos(ang) * 9.9, 3, Math.sin(ang) * 9.9, 0.9, 0.6, 0.9, S2, tangent(ang));
  }
  a.box(0, 0, -10, 2.2, 3.4, 1.2, S2);
  a.box(0, 0, -10.62, 1.4, 2.4, 0.1, WIN);
  // круглые башни с островерхими крышами
  for (let k = 0; k < 6; k++) {
    const ang = (k / 6) * TAU + 0.5;
    const x = Math.cos(ang) * 10;
    const z = Math.sin(ang) * 10;
    round(a, x, 0, z, 2.1, 4.4, S, S2);
    stack(a, x, 4.4, z, [2.4, 1.7, 1, 0.4], 0.8, ROOF, ROOF2);
    a.solid(x, z, 1);
  }
  // деревня: домики уступами по склону
  for (let i = 0; i < 12; i++) {
    const ang = i * 0.5236 + 0.25;
    const tier = i % 3;
    const r = 8.9 - tier * 1.25;
    const y = 2.4 + tier * 2.4;
    const t = tangent(ang);
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    a.box(x, y, z, 1.9, 1.8, 1.2, HOUSE[i % 3], t);
    a.box(x, y + 1.8, z, 2.1, 0.45, 1.4, ROOF, t);
    a.box(x, y + 2.25, z, 1.5, 0.4, 1.4, ROOF2, t);
    a.box(Math.cos(ang) * (r + 0.62), y + 0.7, Math.sin(ang) * (r + 0.62), 0.45, 0.6, 0.06, WIN, t);
  }
  // аббатство на вершине: стены-подпорки, церковь с окнами
  const y = 14.4;
  a.box(0, y - 2.4, 0, 7.4, 5.9, 9.4, S);
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      a.box(sx * 3.75, y - 1, -3 + i * 2, 0.12, 2.2, 0.8, WIN);
      a.box(sx * 3.85, y - 2.4, -3.9 + i * 2.6, 0.5, 5.6, 0.5, S2);
    }
  }
  a.box(0, y + 3.5, 0.5, 5, 4, 8, S2);
  [5.4, 4, 2.6, 1.2].forEach((w, i) => a.box(0, y + 7.5 + i * 0.6, 0.5, w, 0.6, 8.2, i % 2 ? ROOF2 : ROOF));
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) a.box(sx * 2.55, y + 4.3, -2 + i * 2.4, 0.1, 2, 0.7, WIN);
  // колокольня и шпиль с золотым архангелом Михаилом
  a.box(0, y + 7.5, -2, 3, 4, 3, S);
  for (const [fx, fz] of SIDES) a.box(fx * 1.52, y + 8.5, -2 + fz * 1.52, fz ? 0.7 : 0.1, 2, fx ? 0.7 : 0.1, WIN);
  a.box(0, y + 11.5, -2, 3.4, 0.4, 3.4, S2);
  const top = stack(a, 0, y + 11.9, -2, [2.6, 2, 1.5, 1.1, 0.75, 0.45, 0.25], 1.5, ROOF, ROOF2);
  a.box(0, top, -2, 0.45, 1.3, 0.4, GOLD);
  a.box(0, top + 1.3, -2, 0.35, 0.35, 0.35, GOLD);
  for (const sx of [-1, 1]) a.box(sx * 0.45, top + 0.7, -1.8, 0.6, 1, 0.1, GOLD, 0, 0, sx * 0.35);
  a.box(0.45, top + 1.1, -2, 0.1, 1.5, 0.1, 0xe8e8e8); // меч
  a.solid(0, 0, 10);
}

/* ---------- Лондон: Тауэрский мост — готические башни, верхние галереи, цепи и разводные пролёты ---------- */
function towerBridge(a) {
  const S = 0xcfc3a6;
  const S2 = 0xb8ac90;
  const S3 = 0xa89c80;
  const B = 0x5f8fb8;
  const B2 = 0x4a7aa4;
  const R = 0x4a5058;
  const R2 = 0x5a6068;
  const ROAD = 0x4a4a4e;
  const WIN = 0x3a4050;
  const DECK = 3.4; // уровень дороги
  a.box(0, 0, 0, 34, 0.25, 9, WATER); // Темза
  for (const sx of [-1, 1]) {
    const x = sx * 6;
    a.box(x, 0, 0, 7, 1.2, 7, S3); // бык в воде
    a.box(x, 1.2, 0, 5, 15, 5, S);
    // стрельчатые окна ярусами на всех гранях
    for (const y of [8, 11.5]) {
      for (const [fx, fz] of SIDES) {
        for (const o of [-0.9, 0.9]) {
          const wx = x + fx * 2.52 + (fz ? o : 0);
          const wz = fz * 2.52 + (fx ? o : 0);
          a.box(wx, y, wz, fz ? 0.6 : 0.1, 2.2, fx ? 0.6 : 0.1, WIN);
          a.box(wx, y + 2.2, wz, fz ? 0.4 : 0.1, 0.4, fx ? 0.4 : 0.1, WIN, 0, fx ? Q : 0, fz ? Q : 0);
        }
      }
    }
    // проезд сквозь башню
    for (const fx of [-1, 1]) a.box(x + fx * 2.52, DECK, 0, 0.1, 3.4, 3.2, WIN);
    // угловые башенки со шпилями и центральная крыша
    for (const [cx, cz] of CORNERS) {
      a.box(x + cx * 2.3, 1.2, cz * 2.3, 1.3, 17, 1.3, S2);
      a.box(x + cx * 2.3, 18.2, cz * 2.3, 1.5, 0.3, 1.5, S3);
      stack(a, x + cx * 2.3, 18.5, cz * 2.3, [1.1, 0.8, 0.5, 0.25], 0.8, R, R2);
      a.box(x + cx * 2.3, 21.7, cz * 2.3, 0.1, 0.8, 0.1, GOLD);
    }
    a.box(x, 16.2, 0, 4.4, 0.6, 4.4, S3);
    stack(a, x, 16.8, 0, [4, 3.2, 2.4, 1.6, 0.9], 1.2, R, R2);
    a.box(x, 22.8, 0, 0.2, 1.4, 0.2, GOLD);
    // висячий пролёт к берегу: цепи, подвески, дорога с голубыми перилами
    for (const z of [-2.1, 2.1]) {
      polyline(a, [[x + sx * 2.6, 13, z], [x + sx * 5, 8.5, z], [x + sx * 8, 6, z], [x + sx * 10.6, 7.5, z]], 0.4, B);
      for (const [d, top] of [[4, 10.4], [6.5, 7.25], [9, 6.6]]) a.box(x + sx * d, DECK + 0.7, z, 0.12, top - DECK - 0.7, 0.12, B2);
    }
    a.box(x + sx * 7.25, DECK, 0, 9.5, 0.7, 4.6, ROAD);
    a.box(x + sx * 7.25, DECK - 0.6, 0, 9.5, 0.6, 4.2, B2);
    for (const z of [-2.2, 2.2]) a.box(x + sx * 7.25, DECK + 0.7, z, 9.5, 0.5, 0.15, B);
    // береговой устой с башенкой
    a.box(x + sx * 11.4, 0, 0, 2.6, 7.6, 5.2, S);
    stack(a, x + sx * 11.4, 7.6, 0, [2.8, 2, 1.2, 0.5], 0.8, R, R2);
    a.solid(x, 0, 3.5);
    a.solid(x + sx * 11.4, 0, 1.3, 2.6);
  }
  // верхние пешеходные галереи с решётками
  for (const z of [-1.4, 1.4]) {
    const side = z + Math.sign(z) * 0.62;
    a.box(0, 13, z, 7.2, 0.4, 1.3, B2);
    a.box(0, 14.9, z, 7.2, 0.4, 1.3, B2);
    for (let i = 0; i < 7; i++) beam(a, [-3.3 + i, 13.4, side], [-2.8 + i, 14.9, side], 0.1, B);
    for (let i = 0; i < 8; i++) a.box(-3.5 + i, 13.4, side, 0.12, 1.5, 0.12, B);
  }
  // разводные пролёты: две половины поднимаются, пропуская корабли
  for (const sx of [-1, 1]) {
    const g = a.group(sx * 3.5, DECK, 0);
    g.userData.bascule = -sx; // левая половина поднимается поворотом «+», правая — «−»
    cube(g, ROAD, 3.5, 0.6, 4.4, -sx * 1.75, 0.3, 0);
    cube(g, B2, 3.4, 0.4, 4, -sx * 1.75, -0.2, 0);
    for (const z of [-2.15, 2.15]) cube(g, B, 3.5, 0.5, 0.15, -sx * 1.75, 0.85, z);
  }
}

/* ---------- Лондон: «Лондонский глаз» — колесо на опоре-«А», капсулы, спицы-тросы, причал на Темзе ---------- */
function londonEye(a) {
  const W = 0xf0f0f0;
  const SLV = 0xc8ccd0;
  const SLV2 = 0xa8b0b8;
  const GL = 0xb8dcea;
  const HY = 17.5;
  const R = 15;
  a.box(0, 0, 5, 16, 0.25, 6, WATER);
  a.box(0, 0, 0.5, 11, 0.8, 3.4, 0x8a8f94); // посадочная платформа
  a.box(0, 0.8, 0.5, 11, 0.1, 3.4, 0x6a6f74);
  for (const sx of [-1, 1]) {
    beam(a, [sx * 4.5, 0, 4], [0, HY, 1.4], 0.9, SLV);
    beam(a, [sx * 4.5, 0, 4], [sx * 1.2, 7, 2.9], 0.5, SLV2); // распорка
    a.box(sx * 4.5, 0, 4, 1.8, 0.8, 1.8, 0x8a8f94);
  }
  a.box(0, HY - 0.6, 1.2, 1.2, 1.2, 1.6, SLV2); // ось
  const hub = a.group(0, HY, 0);
  cube(hub, SLV, 1.6, 1.6, 2.2);
  for (let i = 0; i < 32; i++) {
    const g = new THREE.Group();
    g.rotation.z = (i / 32) * TAU;
    hub.add(g);
    cube(g, W, 3.1, 0.4, 1.4, 0, R, 0); // обод
    cube(g, SLV, 0.1, R, 0.1, 0, R / 2, 0.5); // спица-трос
    cube(g, GL, 1.2, 1.3, 2.3, 0, R + 1.05, 0); // капсула
  }
  hub.userData.spin = 0.12;
  a.solid(0, 0.5, 5.5, 1.8);
  for (const sx of [-1, 1]) a.solid(sx * 4.5, 4, 1);
}

/* ---------- Берлин: Бранденбургские ворота — двенадцать колонн, триглифы, аттик и квадрига с Викторией ---------- */
function brandenburg(a) {
  const S = 0xe0d6bc;
  const S2 = 0xcabfa2;
  const S3 = 0xb8ad90;
  const BR = 0x4f7a74;
  const BR2 = 0x3f6a66;
  const D = 0x6a6152;
  a.box(0, 0, 0, 17, 0.6, 6.4, S2);
  a.box(0, 0.6, 0, 16.2, 0.3, 5.6, S3);
  // шесть пар колонн и стенки между пятью проходами
  for (let i = 0; i < 6; i++) {
    const x = -6.5 + i * 2.6;
    for (const z of [-2, 2]) {
      round(a, x, 0.9, z, 1.1, 7.4, S, S2);
      a.box(x, 8.3, z, 1.4, 0.3, 1.4, S2);
    }
    a.box(x, 0.9, 0, 1.1, 7.4, 3, S2);
    a.solid(x, 0, 0.7, 2.6);
  }
  // антаблемент с триглифами
  a.box(0, 8.6, 0, 16.4, 0.8, 5.6, S);
  a.box(0, 9.4, 0, 16.6, 1, 5.8, S2);
  for (const z of [-2.92, 2.92]) for (let i = 0; i < 16; i++) a.box(-7.5 + i, 9.5, z, 0.35, 0.8, 0.1, D);
  a.box(0, 10.4, 0, 16.8, 0.3, 6, S);
  // аттик с рельефом шествия
  a.box(0, 10.7, 0, 10, 1.8, 4.4, S);
  for (const z of [-2.22, 2.22]) {
    a.box(0, 11, z, 8, 1.2, 0.1, S3);
    for (let i = 0; i < 10; i++) a.box(-3.6 + i * 0.8, 11.1, z * 1.02, 0.35, 0.9, 0.1, S2);
  }
  a.box(0, 12.5, 0, 10.4, 0.3, 4.8, S2);
  a.box(0, 12.8, 0, 3.6, 0.4, 3.2, S2);
  // квадрига: четыре коня мчатся на восток (−z)
  for (let i = 0; i < 4; i++) {
    const x = -1.5 + i;
    a.box(x, 13.9, -0.6, 0.55, 0.7, 1.7, BR);
    for (const dz of [-0.6, 0.6]) for (const dx of [-0.15, 0.15]) a.box(x + dx, 13.2, -0.6 + dz, 0.15, 0.8, 0.15, BR2);
    a.box(x, 14.3, -1.5, 0.4, 0.9, 0.45, BR, 0, -0.5);
    a.box(x, 15, -1.9, 0.35, 0.4, 0.7, BR);
    a.box(x, 15.3, -1.7, 0.1, 0.35, 0.3, BR2);
    a.box(x, 14.3, 0.3, 0.15, 0.6, 0.15, BR2, 0, 0.5); // хвост
  }
  // колесница и богиня Победы с жезлом
  a.box(0, 13.2, 1.1, 2.2, 1.1, 1.2, BR);
  for (const sx of [-1, 1]) a.box(sx * 1.15, 13.2, 1.2, 0.15, 1.1, 1.1, BR2);
  a.box(0, 14.3, 1.2, 0.6, 1.6, 0.5, BR);
  a.box(0, 15.9, 1.2, 0.4, 0.4, 0.4, BR);
  for (const sx of [-1, 1]) a.box(sx * 0.55, 15.1, 1.4, 0.7, 1, 0.1, BR, 0, 0, sx * 0.4);
  a.box(0.5, 14.8, 1.1, 0.12, 3.2, 0.12, BR2);
  a.box(0.5, 17.9, 1.1, 0.7, 0.7, 0.1, BR, 0, 0, Q);
  a.box(0.5, 18.1, 1.05, 0.45, 0.25, 0.12, 0xe8b830);
  // караульные домики по бокам
  for (const sx of [-1, 1]) {
    const x = sx * 9.6;
    a.box(x, 0, 0, 2.6, 5, 4.2, S);
    a.box(x, 5, 0, 3, 0.4, 4.6, S2);
    a.box(x, 5.4, 0, 2.6, 0.7, 3, S2);
    for (const dz of [-1.2, 1.2]) round(a, x - sx * 1.5, 0.6, dz, 0.5, 4.4, S);
    a.solid(x, 0, 1.4, 2.2);
  }
}

/* ---------- Бавария: замок Нойшванштайн — скала с елями, белые стены, синие островерхие башни и красные ворота ---------- */
function neuschwanstein(a) {
  const W = 0xefebe2;
  const W2 = 0xe0dbcf;
  const B = 0x3f5a8a;
  const B2 = 0x344c78;
  const RK = 0x8f8a80;
  const RK2 = 0x7d786e;
  const RED = 0xc9866a;
  const RED2 = 0xb8765a;
  const WIN = 0x3a4050;
  stack(a, 0, 0, 0, [20, 16.5, 13], 2.6, RK, RK2);
  for (let k = 0; k < 10; k++) {
    const ang = (k / 10) * TAU + 0.2;
    const r = k % 2 ? 9.2 : 7.6;
    const y = k % 2 ? 2.6 : 5.2;
    a.box(Math.cos(ang) * r, y, Math.sin(ang) * r, 0.4, 0.8, 0.4, 0x5a3a20);
    a.box(Math.cos(ang) * r, y + 0.8, Math.sin(ang) * r, 1.4, 1, 1.4, 0x2f6a3a);
    a.box(Math.cos(ang) * r, y + 1.8, Math.sin(ang) * r, 0.8, 0.9, 0.8, 0x2f6a3a);
  }
  const y = 7.8;
  // дворец-Палас: четыре этажа окон, высокая крыша со щипцами, балкон
  a.box(0, y, 2, 12, 12, 5, W);
  a.box(0, y, 2, 12.3, 0.5, 5.3, W2);
  for (let fl = 0; fl < 4; fl++) {
    for (let i = 0; i < 6; i++) {
      for (const fz of [-1, 1]) {
        const z = 2 + fz * 2.52;
        a.box(-5 + i * 2, y + 1.2 + fl * 2.7, z, 0.7, 1.5, 0.1, WIN);
        a.box(-5 + i * 2, y + 2.7 + fl * 2.7, z, 0.45, 0.45, 0.1, WIN, 0, 0, Q);
      }
    }
    a.box(0, y + 0.9 + fl * 2.7, -0.55, 12.2, 0.15, 0.1, W2);
  }
  [5.4, 4.2, 3, 1.8, 0.8].forEach((d, i) => a.box(0, y + 12 + i * 0.9, 2, 12.4, 0.9, d, i % 2 ? B2 : B));
  for (const sx of [-1, 1]) [4.6, 3.4, 2.2, 1].forEach((d, i) => a.box(sx * 6.1, y + 12 + i * 0.9, 2, 0.4, 0.9, d, W));
  a.box(0, y + 6, -1.1, 3, 0.2, 0.9, W2);
  for (let i = 0; i < 6; i++) a.box(-1.25 + i * 0.5, y + 6.2, -1.5, 0.1, 0.5, 0.1, W2);
  // главная башня с зубцами и флагом
  round(a, -6.5, y, 2, 3.2, 18, W, W2);
  for (let k = 0; k < 5; k++) a.box(-6.5, y + 3 + k * 3.2, 0.36, 0.5, 1.3, 0.1, WIN);
  a.box(-6.5, y + 18, 2, 3.8, 0.5, 3.8, W2);
  for (const [cx, cz] of CORNERS) a.box(-6.5 + cx * 1.6, y + 18.5, 2 + cz * 1.6, 0.6, 0.6, 0.6, W);
  const tt = stack(a, -6.5, y + 18.5, 2, [3.2, 2.5, 1.8, 1.2, 0.7, 0.35], 1.6, B, B2);
  a.box(-6.5, tt, 2, 0.12, 1.4, 0.12, GOLD);
  a.box(-6.1, tt + 0.8, 2, 0.7, 0.45, 0.05, 0xf4f4f4);
  // тонкие башенки
  for (const [x, z, h, w] of [[4, -2.6, 12, 2.2], [-2, -3.6, 9, 2.6], [5.8, 4.4, 14, 1.6], [-3, 5.2, 13, 1.8], [1.5, -0.9, 16, 1.4]]) {
    round(a, x, y, z, w, h, W, W2);
    a.box(x, y + h, z, w + 0.4, 0.35, w + 0.4, W2);
    stack(a, x, y + h + 0.35, z, [w + 0.2, w * 0.75, w * 0.5, w * 0.28, 0.15], 1.1, B, B2);
    for (let k = 0; k < Math.floor(h / 2.8) - 1; k++) a.box(x, y + 2 + k * 2.8, z - w / 2 - 0.02, 0.4, 1, 0.1, WIN);
  }
  // красные ворота (Торбау) с зубцами и башенками
  a.box(2, y, -5, 6, 5, 3, RED);
  a.box(2, y + 5, -5, 6.4, 0.4, 3.4, RED2);
  for (let i = 0; i < 6; i++) a.box(-0.5 + i, y + 5.4, -6.5, 0.5, 0.6, 0.4, RED);
  a.box(2, y, -6.55, 1.8, 2.8, 0.1, WIN);
  a.box(2, y + 2.8, -6.55, 1.2, 0.4, 0.1, WIN);
  for (const sx of [-1, 1]) {
    round(a, 2 + sx * 3, y, -5, 1.6, 7, RED, RED2);
    stack(a, 2 + sx * 3, y + 7, -5, [1.8, 1.2, 0.6], 0.9, B, B2);
  }
  a.solid(0, 0, 10);
}

/* ---------- Кёльн: собор — две ажурные башни-шпиля, стрельчатые окна, аркбутаны с пинаклями, апсида ---------- */
function cologne(a) {
  const D = 0x5a5650;
  const D2 = 0x4a4640;
  const D3 = 0x6a665e;
  const ROOF = 0x3f4a50;
  const ROOF2 = 0x4a555c;
  const GL = 0x4a5a8a;
  const DARK = 0x2a2f3a;
  // неф, апсида и трансепт
  a.box(0, 0, 3.5, 9, 14, 17, D);
  [9.4, 7.4, 5.4, 3.4, 1.4].forEach((w, i) => a.box(0, 14 + i * 1.2, 3.5, w, 1.2, 17, i % 2 ? ROOF : ROOF2));
  round(a, 0, 0, 11, 7.4, 14, D, D2);
  stack(a, 0, 14, 11, [7.6, 6.2, 4.6, 3, 1.4], 1.2, ROOF, ROOF2);
  a.box(0, 0, 5, 15, 14, 4.5, D);
  [4.9, 3.7, 2.5, 1.3].forEach((d, i) => a.box(0, 14 + i * 1.2, 5, 15.4, 1.2, d, i % 2 ? ROOF2 : ROOF));
  for (const sx of [-1, 1]) {
    for (const z of [-1.5, 1, 8.5]) {
      a.box(sx * 4.55, 3, z, 0.15, 8, 1.2, GL);
      a.box(sx * 4.55, 11, z, 0.15, 0.85, 0.85, GL, 0, Q);
      a.box(sx * 7, 0, z + 1.2, 1, 10, 1, D2);
      a.box(sx * 7, 10, z + 1.2, 0.6, 2.2, 0.6, D3);
      a.box(sx * 7, 12.2, z + 1.2, 0.25, 1, 0.25, D3);
      beam(a, [sx * 6.8, 9.5, z + 1.2], [sx * 4.6, 12.6, z + 1.2], 0.35, D2);
    }
    a.box(sx * 7.55, 3, 5, 0.15, 9, 2.4, GL);
    a.box(sx * 7.55, 12, 5, 0.15, 1.4, 1.4, GL, 0, Q);
  }
  stack(a, 0, 19.5, 5, [1.2, 0.8, 0.5, 0.25], 1.6, ROOF, ROOF2);
  a.box(0, 25.9, 5, 0.1, 0.9, 0.1, GOLD);
  // западный фасад: портал и большое окно между башнями
  a.box(0, 0, -5, 4, 20, 5, D);
  a.box(0, 0, -7.55, 3, 7, 0.2, DARK);
  [2.6, 2.1, 1.6, 1.1, 0.6].forEach((w, i) => a.box(0, 7 + i * 0.5, -7.55, w, 0.5, 0.2, DARK));
  a.box(0, 11, -7.55, 2.4, 6.5, 0.2, GL);
  a.box(0, 17.5, -7.55, 1.4, 1.4, 0.2, GL, 0, 0, Q);
  const WS = [3.6, 3.1, 2.6, 2.1, 1.7, 1.3, 1, 0.7, 0.45, 0.3];
  for (const sx of [-1, 1]) {
    const x = sx * 4.5;
    a.box(x, 0, -5, 5, 26, 5, D);
    for (const o of [-2.2, 0, 2.2]) a.box(x + o, 0, -7.55, 0.4, 26, 0.2, D2);
    for (const yy of [3, 10, 17]) for (const o of [-1.1, 1.1]) a.box(x + o, yy, -7.56, 1.2, 5, 0.1, yy === 17 ? DARK : GL);
    for (const [cx, cz] of CORNERS) {
      a.box(x + cx * 2.6, 0, -5 + cz * 2.6, 0.8, 27, 0.8, D2);
      a.box(x + cx * 2.6, 27, -5 + cz * 2.6, 0.5, 2.4, 0.5, D3);
      a.box(x + cx * 2.6, 29.4, -5 + cz * 2.6, 0.2, 0.8, 0.2, D3);
    }
    // ажурный восьмигранный ярус
    round(a, x, 26, -5, 4, 6, D, D2);
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * TAU;
      a.box(x + Math.cos(ang) * 2.2, 26.5, -5 + Math.sin(ang) * 2.2, 0.5, 5, 0.5, D3);
    }
    // шпиль со сквозными «окошками»-ажуром и крестоцветом
    const top = stack(a, x, 32, -5, WS, 2.2, D, D2);
    for (let k = 0; k < 6; k++) {
      const w = WS[k];
      for (const [fx, fz] of SIDES) a.box(x + fx * (w / 2 + 0.02), 32.5 + k * 2.2, -5 + fz * (w / 2 + 0.02), fz ? 0.5 : 0.1, 1.2, fx ? 0.5 : 0.1, DARK);
    }
    a.box(x, top, -5, 1.1, 1.1, 1.1, D3, Q, Q);
    a.box(x, top + 1.3, -5, 0.2, 0.9, 0.2, GOLD);
    a.solid(x, -5, 3);
  }
  a.solid(0, 4, 7.6, 9);
  a.solid(0, 11, 3.7);
}

/* ---------- Барселона: Саграда Фамилия — башни-веретёна с мозаикой, фасады Рождества и Страстей, башня Иисуса и кран ---------- */
function sagrada(a) {
  const S = 0xc9b48f;
  const S2 = 0xb39e78;
  const S3 = 0xa38e68;
  const D = 0x5a4a3a;
  const GL = 0x6a8ab0;
  const TIPS = [0xd8453a, 0xe8b830, 0x3a6fc0, 0x3a9a9a, 0xf07ab8, 0xf08a24];
  const WHITE = 0xf4f1e8;
  // башня-веретено: ярусы с тёмными прорезями и мозаичная верхушка
  const spindle = (x, z, h, tip, w0 = 2.4) => {
    const n = Math.round(h / 2);
    for (let i = 0; i < n; i++) {
      const w = w0 - (i / n) * (w0 - 0.5);
      round(a, x, i * 2, z, w, 2, i % 3 ? S : S2);
      if (i % 2 && i < n - 2) {
        for (const [fx, fz] of SIDES) a.box(x + fx * (w / 2 + 0.01), i * 2 + 0.4, z + fz * (w / 2 + 0.01), fz ? 0.3 : 0.1, 1.2, fx ? 0.3 : 0.1, D);
      }
    }
    const y = n * 2;
    a.box(x, y, z, 0.9, 0.9, 0.9, tip);
    a.box(x, y, z, 0.9, 0.9, 0.9, tip, Q, Q);
    a.box(x, y + 0.9, z, 0.45, 0.6, 0.45, WHITE);
    for (const [cx, cz] of CORNERS) a.box(x + cx * 0.5, y + 0.3, z + cz * 0.5, 0.3, 0.3, 0.3, WHITE);
    return y;
  };
  // неф: стены с окнами, крыша с корзинами фруктов на пинаклях
  a.box(0, 0, 2, 12, 13, 18, S);
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const z = -5 + i * 2.8;
      a.box(sx * 6.05, 3, z, 0.1, 6, 1.2, GL);
      a.box(sx * 6.05, 9, z, 0.1, 0.8, 0.8, GL, 0, Q);
      a.box(sx * 5, 13, z, 1, 1, 1, TIPS[i % 6]);
    }
  }
  for (let i = 0; i < 7; i++) a.box(0, 13, -6 + i * 2.7, 10, 0.8, 1.1, S2);
  // фасад Рождества (−z): порталы, кипарис с голубями, четыре башни
  a.box(0, 0, -7.5, 12, 9, 3, S2);
  for (const x of [-3.6, 0, 3.6]) {
    a.box(x, 0, -9.05, 2.2, 5, 0.1, D);
    a.box(x, 5, -9.05, 1.4, 1.2, 0.1, D);
    a.box(x, 6.2, -9.05, 0.7, 0.8, 0.1, D);
  }
  a.box(0, 9, -8.4, 1.6, 4, 1.6, 0x2f6a3a);
  a.box(0, 13, -8.4, 1, 1.6, 1, 0x2f6a3a);
  for (let k = 0; k < 4; k++) a.box(-0.6 + k * 0.4, 10 + k * 0.9, -9.3, 0.3, 0.2, 0.25, 0xffffff);
  for (let i = 0; i < 4; i++) spindle(-4.5 + i * 3, -7.5, i === 1 || i === 2 ? 30 : 26, TIPS[i]);
  // фасад Страстей (+z): наклонные колонны-кости и четыре башни
  a.box(0, 0, 11.5, 12, 9, 3, S2);
  for (let i = 0; i < 6; i++) a.box(-5 + i * 2, 0, 13.3, 0.8, 8, 0.8, S3, 0, 0, i % 2 ? 0.15 : -0.15);
  for (let i = 0; i < 4; i++) spindle(-4.5 + i * 3, 11.5, i === 1 || i === 2 ? 28 : 24, TIPS[(i + 2) % 6]);
  // башни евангелистов, Девы Марии со звездой и Иисуса с крестом
  for (const [sx, sz] of CORNERS) spindle(sx * 3, 2 + sz * 3.2, 34, TIPS[(sx + sz + 4) % 6], 2.6);
  const my = spindle(0, 7.2, 36, 0x3a6fc0, 2.6);
  a.box(0, my + 1.5, 7.2, 1.4, 1.4, 0.3, 0xfff3a0);
  a.box(0, my + 1.5, 7.2, 1.4, 1.4, 0.3, 0xfff3a0, 0, 0, Q);
  const ty = spindle(0, 2, 44, WHITE, 3.2);
  a.box(0, ty + 1.5, 2, 0.35, 3.2, 0.35, WHITE);
  a.box(0, ty + 3.4, 2, 2.2, 0.35, 0.35, WHITE);
  a.box(0, ty + 3.4, 2, 0.35, 0.35, 2.2, WHITE);
  // строительный кран — храм всё ещё достраивают
  a.box(8, 0, 8, 1, 44, 1, 0xe8b830);
  for (let k = 0; k < 11; k++) a.box(8, k * 4 + 2, 8.52, 1, 0.15, 0.1, 0xc89820);
  a.box(8, 42.4, 8, 1.6, 1.6, 1.6, 0x3a6fc0);
  a.box(9.5, 44, 8, 12, 0.8, 0.8, 0xe8b830);
  a.box(4.4, 44, 8, 3, 1.4, 1.4, 0x666666);
  a.box(14, 36.2, 8, 0.1, 7.8, 0.1, 0x333333);
  a.box(14, 35.6, 8, 0.6, 0.6, 0.6, 0xe0302a);
  a.solid(0, 2, 6.5, 11.5);
  a.solid(8, 8, 0.8);
}

/* ---------- Брюссель: Атомиум — девять стальных шаров-«атомов», трубы, опоры, пояса окон и павильон ---------- */
function atomium(a) {
  const M = 0xd0d6dc;
  const M2 = 0xb4bcc4;
  const T = 0xa8b0b8;
  const WIN = 0x2a3440;
  const LIT = 0xffe08a;
  const s = 5.5;
  const cy = 14;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 1, 0));
  const pts = [];
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        const v = new THREE.Vector3(x * s, y * s, z * s).applyQuaternion(q);
        pts.push([v.x, v.y + cy, v.z]);
      }
    }
  }
  const center = [0, cy, 0];
  for (const p of pts) beam(a, center, p, 0.8, T);
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      const dd = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
      if (Math.abs(dd - 2 * s) < 0.1) beam(a, pts[i], pts[j], 0.7, T); // рёбра куба
    }
  }
  // шары с поясом окон; в верхнем — светится ресторан
  const topY = Math.max(...pts.map((p) => p[1]));
  for (const p of [...pts, center]) {
    sphere(a, p[0], p[1] - 1.8, p[2], 1.8, M, M2);
    round(a, p[0], p[1] - 0.3, p[2], 3.7, 0.45, p[1] === topY ? LIT : WIN);
  }
  const low = [...pts].sort((p1, p2) => p1[1] - p2[1]).slice(1, 4);
  for (const p of low) beam(a, [p[0] * 1.3, 0, p[2] * 1.3], p, 0.9, T); // опоры
  // павильон у входа и флаг Бельгии
  a.box(0, 0, 0, 6, 2.4, 6, 0x9aa0a6);
  a.box(0, 0, -3.02, 3, 2, 0.1, 0x6a8aa0);
  flag(a, 7.5, 0, -5, ['BYR', 'BYR', 'BYR'], { B: 0x1a1a1a, Y: 0xf4d23a, R: 0xd8332a }, 0.5);
  a.solid(0, 0, 3.2);
}

export const EUROPE = [
  { id: 'arc', name: 'Триумфальная арка', country: 'Франция', size: 8, build: arcTriomphe },
  { id: 'notredame', name: 'Собор Парижской Богоматери', country: 'Франция', size: 12, build: notreDame },
  { id: 'louvre', name: 'Лувр', country: 'Франция', size: 16, build: louvre },
  { id: 'michel', name: 'Мон-Сен-Мишель', country: 'Франция', size: 10.5, build: montStMichel },
  { id: 'towerbridge', name: 'Тауэрский мост', country: 'Великобритания', size: 17.5, build: towerBridge },
  { id: 'londoneye', name: 'Лондонский глаз', country: 'Великобритания', size: 16, build: londonEye },
  { id: 'brandenburg', name: 'Бранденбургские ворота', country: 'Германия', size: 8.5, build: brandenburg },
  { id: 'neuschwanstein', name: 'Замок Нойшванштайн', country: 'Германия', size: 11.5, build: neuschwanstein },
  { id: 'cologne', name: 'Кёльнский собор', country: 'Германия', size: 13, build: cologne },
  { id: 'sagrada', name: 'Саграда Фамилия', country: 'Испания', size: 15, build: sagrada },
  { id: 'atomium', name: 'Атомиум', country: 'Бельгия', size: 10.5, build: atomium },
];
