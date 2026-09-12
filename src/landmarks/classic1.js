import * as THREE from 'three';
import {
  cube, TAU, Q, CORNERS, SIDES, WATER, GOLD, yawAlong, round, stack, stackSquare, onion, dome, sphere,
  beam, polyline, pixels, flag, clocks, tree, archFill,
} from './kit.js';

// Чудеса света у порта, часть 1: eiffel, bigBen, spasskaya, liberty, pyramids.

/* ---------- Общие помощники ---------- */

// Блок на грани: side — [sx, sz] из SIDES (наружная нормаль грани), (cx, cz) — центр постройки,
// u — сдвиг вдоль грани (плюс — вправо, если смотреть на грань снаружи), off — отступ от центра
// до середины блока по нормали; w — ширина вдоль грани, d — толщина по нормали; roll — поворот в плоскости грани.
function fbox(a, cx, cz, [sx, sz], u, y0, off, w, h, d, c, roll = 0) {
  a.box(cx + sx * off + sz * u, y0, cz + sz * off - sx * u, w, h, d, c, Math.atan2(sx, sz), 0, roll);
}

// Правильный восьмигранник с апофемой r: четыре бруска, повёрнутых через 45°.
// Высоты чуть разные, чтобы верхние грани не мерцали.
function oct(a, x, y0, z, r, h, c, c2 = c) {
  for (let k = 0; k < 4; k++) a.box(x, y0, z, r * 2, h + k * 0.012, r * 0.83, k % 2 ? c2 : c, (k * Math.PI) / 4);
}

// Круглый циферблат с рамкой, делениями и стрелками «10:10» на одной грани.
// (cx, cz) — центр башни, cy — центр циферблата, off — где грань, r — радиус.
function dial(a, cx, cz, side, cy, off, r, { face, rim, frame, marks, hand, back }) {
  if (frame) fbox(a, cx, cz, side, 0, cy - r - 0.35, off, r * 2 + 0.7, r * 2 + 0.7, 0.16, frame);
  if (back) fbox(a, cx, cz, side, 0, cy - r - 0.1, off + 0.05, r * 2 + 0.2, r * 2 + 0.2, 0.16, back);
  const rows = 7;
  const hh = (2 * r) / rows;
  for (let i = 0; i < rows; i++) {
    const dy = -r + (i + 0.5) * hh;
    const w = 2 * Math.sqrt(Math.max(0, r * r - dy * dy)) + 0.25;
    if (rim) fbox(a, cx, cz, side, 0, cy + dy - hh / 2, off + 0.1, w + 0.4, hh, 0.14, rim);
    fbox(a, cx, cz, side, 0, cy + dy - hh / 2, off + 0.14, w, hh, 0.14, face);
  }
  if (rim) {
    fbox(a, cx, cz, side, 0, cy + r - 0.05, off + 0.1, r * 1.1, 0.3, 0.14, rim);
    fbox(a, cx, cz, side, 0, cy - r - 0.25, off + 0.1, r * 1.1, 0.3, 0.14, rim);
  }
  for (let k = 0; k < 12; k++) {
    const t = (k * TAU) / 12;
    const big = k % 3 === 0;
    const s = big ? 0.34 : 0.22;
    fbox(a, cx, cz, side, Math.sin(t) * r * 0.8, cy + Math.cos(t) * r * 0.8 - s / 2, off + 0.22, s, s, 0.08, marks);
  }
  const L1 = r * 0.78;
  const L2 = r * 0.52;
  const t1 = Math.PI / 3; // минутная — на «2»
  const t2 = -Math.PI / 3; // часовая — на «10»
  fbox(a, cx, cz, side, Math.sin(t1) * L1 * 0.5, cy + Math.cos(t1) * L1 * 0.5 - L1 / 2, off + 0.28, 0.22, L1, 0.08, hand, -t1);
  fbox(a, cx, cz, side, Math.sin(t2) * L2 * 0.5, cy + Math.cos(t2) * L2 * 0.5 - L2 / 2, off + 0.28, 0.3, L2, 0.08, hand, -t2);
  fbox(a, cx, cz, side, 0, cy - 0.2, off + 0.3, 0.4, 0.4, 0.1, hand);
}

// Ферма из четырёх поясов с раскосами-крестами и кольцами на каждом уровне.
// levels — [{ h, x, z, hw }]: высота, центр и полуширина сечения.
function truss(a, levels, tPost, tBrace, cPost, cBrace, cRing) {
  const corners = (L) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, k]) => [L.x + i * L.hw, L.h, L.z + k * L.hw]);
  for (let s = 1; s < levels.length; s++) {
    const A = corners(levels[s - 1]);
    const B = corners(levels[s]);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      beam(a, A[i], B[i], tPost, cPost);
      beam(a, A[i], B[j], tBrace, cBrace);
      beam(a, A[j], B[i], tBrace, cBrace);
      beam(a, B[i], B[j], tBrace * 1.2, cRing);
    }
  }
}

// Перила по периметру квадрата со стороной 2·hw на высоте y.
function railing(a, hw, y, step, c, h = 0.8) {
  const n = Math.max(2, Math.round((hw * 2) / step));
  for (let i = 0; i <= n; i++) {
    const t = -hw + (i * hw * 2) / n;
    a.box(t, y, hw, 0.16, h, 0.16, c);
    a.box(t, y, -hw, 0.16, h, 0.16, c);
    if (i > 0 && i < n) {
      a.box(hw, y, t, 0.16, h, 0.16, c);
      a.box(-hw, y, t, 0.16, h, 0.16, c);
    }
  }
  for (const s of [-1, 1]) {
    a.box(0, y + h, s * hw, hw * 2 + 0.16, 0.14, 0.16, c);
    a.box(s * hw, y + h, 0, 0.16, 0.14, hw * 2 + 0.16, c);
  }
}

/* ---------- Париж: четыре ноги-фермы, арки, три площадки и шпиль-антенна ---------- */
function eiffel(a) {
  const C = 0x7b5a3c; // раскосы
  const C2 = 0x5e4330; // пояса ног
  const R = 0x6a4b30; // кольца
  const P = 0x4f3726; // площадки
  const GOLDEN = 0xc9a877;
  const STONE = 0xcfc4ac;
  const STONE2 = 0xb8ab90;
  // каменные опоры под ногами
  for (const [sx, sz] of CORNERS) {
    a.box(sx * 7.6, 0, sz * 7.6, 4.8, 0.5, 4.8, STONE2);
    a.box(sx * 7.6, 0.5, sz * 7.6, 4.2, 0.3, 4.2, STONE);
    a.solid(sx * 7.6, sz * 7.6, 2.4);
  }
  // нижние ноги: изгибаются к центру
  const lowC = (h) => 7.6 - 0.235 * (h - 0.8);
  const lowW = (h) => 2.0 - 0.045 * (h - 0.8);
  const upC = (h) => 4.3 - 0.169 * (h - 14.4);
  const upW = (h) => 1.2 - 0.035 * (h - 14.4);
  for (const [sx, sz] of CORNERS) {
    truss(a, [0.8, 4.0, 7.2, 10.1, 12.6].map((h) => ({ h, x: sx * lowC(h), z: sz * lowC(h), hw: lowW(h) })), 0.5, 0.26, C2, C, R);
    truss(a, [14.4, 17.6, 20.8, 24.0, 27.4].map((h) => ({ h, x: sx * upC(h), z: sz * upC(h), hw: upW(h) })), 0.42, 0.22, C2, C, R);
  }
  // арки между ногами: двойная дуга с кружевом над ней
  for (const side of SIDES) {
    const [sx, sz] = side;
    const pt = (along, y) => (sx ? [sx * 5.7, y, along] : [along, y, sz * 5.7]);
    const arc = (R0, V, y0) => {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const f = (Math.PI * i) / 12;
        pts.push(pt(-R0 * Math.cos(f), y0 + V * Math.sin(f)));
      }
      return pts;
    };
    const inner = arc(4.8, 6.6, 4.6);
    const outer = arc(5.4, 7.3, 4.6);
    polyline(a, inner, 0.45, P);
    polyline(a, outer, 0.35, C2);
    for (let i = 1; i < 12; i += 2) beam(a, inner[i], outer[i], 0.2, C);
    for (const along of [-4.5, -3, -1.5, 1.5, 3, 4.5]) {
      const y = 4.6 + 7.3 * Math.sqrt(1 - (along / 5.4) ** 2);
      const [x, , z] = pt(along, 0);
      a.box(x, y, z, 0.22, 12.6 - y, 0.22, C);
    }
  }
  // первая площадка: тёмный пояс с золотистыми арочками-окнами, карниз, перила
  a.box(0, 12.6, 0, 12.6, 1.4, 12.6, P);
  for (const side of SIDES) {
    for (let k = 0; k < 9; k++) fbox(a, 0, 0, side, -4.8 + k * 1.2, 12.9, 6.33, 0.6, 0.8, 0.1, GOLDEN);
    for (let k = 0; k < 10; k++) fbox(a, 0, 0, side, -5.4 + k * 1.2, 12.3, 6.1, 0.2, 0.3, 0.3, C2); // консоли
  }
  a.box(0, 14, 0, 13.2, 0.4, 13.2, C2);
  railing(a, 6.4, 14.4, 1.3, R);
  a.box(0, 14.4, 0, 4.2, 1.6, 4.2, 0xa8b8c0); // стеклянный павильон
  a.box(0, 16, 0, 4.4, 0.25, 4.4, P);
  // вторая площадка
  a.box(0, 27.4, 0, 7, 1, 7, P);
  for (const side of SIDES) for (let k = 0; k < 5; k++) fbox(a, 0, 0, side, -2.4 + k * 1.2, 27.6, 3.53, 0.6, 0.6, 0.1, GOLDEN);
  a.box(0, 28.4, 0, 7.6, 0.3, 7.6, C2);
  railing(a, 3.7, 28.7, 1.2, R, 0.7);
  // верхняя часть: одна сужающаяся ферма с шахтой лифта внутри
  const topW = (h) => 0.65 + 1.9 * Math.pow((50.5 - h) / 21.8, 1.5);
  const lv = [28.7, 31.3, 34.0, 36.8, 39.8, 42.8, 45.6, 48.2, 50.5];
  truss(a, lv.map((h) => ({ h, x: 0, z: 0, hw: topW(h) })), 0.4, 0.2, C2, C, R);
  a.box(0, 28.7, 0, 1.0, 21.8, 1.0, 0x4a3524);
  a.box(0, 39.6, 0, topW(39.8) * 2 + 0.5, 0.3, topW(39.8) * 2 + 0.5, P); // промежуточная площадка
  // третья площадка: кабинка с окнами, маяк и антенна в полоску
  a.box(0, 50.5, 0, 3, 0.4, 3, P);
  a.box(0, 50.9, 0, 2.2, 1.8, 2.2, C);
  for (const side of SIDES) for (const u of [-0.5, 0.5]) fbox(a, 0, 0, side, u, 51.3, 1.12, 0.6, 1.0, 0.1, 0xd9d4c7);
  a.box(0, 52.7, 0, 2.7, 0.3, 2.7, P);
  railing(a, 1.3, 50.9, 0.65, R, 0.6);
  a.box(0, 53, 0, 1.6, 0.8, 1.6, C2);
  a.box(0, 53.8, 0, 1.1, 1.4, 1.1, 0xf2ead2);
  a.box(0, 55.2, 0, 1.3, 0.2, 1.3, P);
  for (let i = 0; i < 4; i++) a.box(0, 55.4 + i * 1.15, 0, 0.36 - i * 0.04, 1.15, 0.36 - i * 0.04, i % 2 ? 0xf4f1ea : 0xd8453a);
  // внизу между ногами — клумбы и скамейки
  const FLOWERS = [0xe04a5a, 0xf2c94c, 0xf07ab0, 0xffffff, 0x9a6ee0];
  for (const side of SIDES) {
    fbox(a, 0, 0, side, 0, 0, 9.2, 3.8, 0.6, 1.2, STONE2);
    fbox(a, 0, 0, side, 0, 0.6, 9.2, 3.5, 0.3, 0.95, 0x4f9a3e);
    for (let k = 0; k < 5; k++) fbox(a, 0, 0, side, -1.4 + k * 0.7, 0.9, 9.2 + (k % 2 ? 0.2 : -0.2), 0.4, 0.4, 0.4, FLOWERS[k]);
    for (const u of [-3.3, 3.3]) {
      fbox(a, 0, 0, side, u, 0.45, 9.3, 1.6, 0.2, 0.6, 0x9a6a3a);
      fbox(a, 0, 0, side, u, 0.65, 9.6, 1.6, 0.6, 0.15, 0x9a6a3a);
      for (const e of [-0.6, 0.6]) fbox(a, 0, 0, side, u + e, 0, 9.3, 0.18, 0.45, 0.5, 0x3b3b3b);
    }
  }
}

/* ---------- Лондон: башня Елизаветы с часами и шпилем + крыло Парламента ---------- */
function bigBen(a) {
  const S = 0xd9c48c; // песчаник
  const S2 = 0xcdb67c;
  const D = 0xa88f5a; // тёмные карнизы и рамы
  const SL = 0x39475a; // шиферная крыша
  const SL2 = 0x445468;
  const G = 0xe8b830;
  const GL = 0x3d4a5a; // стёкла
  const DARK = 0x3b3222;
  const RED = 0xc8281e;
  // башня Елизаветы стоит на углу дворца
  const TX = 7.5;
  const TZ = -2.5;
  const T = (dx, y0, dz, w, h, d, c) => a.box(TX + dx, y0, TZ + dz, w, h, d, c);
  const F = (side, u, y0, off, w, h, d, c) => fbox(a, TX, TZ, side, u, y0, off, w, h, d, c);
  T(0, 0, 0, 7.6, 0.6, 7.6, D);
  T(0, 0.6, 0, 7, 0.6, 7, S2);
  T(0, 1.2, 0, 6, 24.8, 6, S);
  for (const [sx, sz] of CORNERS) T(sx * 2.85, 1.2, sz * 2.85, 0.9, 24.4, 0.9, S2); // угловые контрфорсы
  for (const y of [5.8, 10.4, 15, 19.6]) T(0, y, 0, 6.5, 0.35, 6.5, D);
  for (const side of SIDES) {
    // стрельчатые окна в каждом ярусе, рёбра между ними, дверь внизу
    for (const u of [-2.05, 0, 2.05]) F(side, u, 1.2, 3.05, u ? 0.25 : 0.3, 23.2, 0.14, D);
    for (const yb of [1.2, 6.15, 10.75, 15.35, 19.95]) {
      for (const u of [-1.1, 1.1]) {
        const y0 = yb + (yb < 2 ? 1.2 : 0.55);
        F(side, u, y0 - 0.15, 3.1, 1.3, 0.15, 0.2, D);
        F(side, u, y0, 3.05, 1.1, 3.1, 0.12, D);
        F(side, u, y0 + 0.2, 3.1, 0.7, 2.4, 0.12, GL);
        F(side, u, y0 + 2.6, 3.1, 0.36, 0.3, 0.12, GL);
      }
    }
    // пояс с гербами под часами
    [0xb03a2e, 0x2f4f9a, G].forEach((c, k) => F(side, (k - 1) * 1.6, 24.5, 3.08, 0.7, 0.8, 0.14, c));
  }
  T(0, 25.6, 0, 6.8, 0.4, 6.8, D);
  // часовой ярус с четырьмя циферблатами
  T(0, 26, 0, 7.4, 6, 7.4, S);
  for (const [sx, sz] of CORNERS) T(sx * 3.5, 26, sz * 3.5, 1, 6.1, 1, S2);
  for (const side of SIDES) {
    dial(a, TX, TZ, side, 29.1, 3.7, 2.3, { face: 0xf4f1e8, rim: G, frame: G, marks: 0x22201c, hand: 0x22201c, back: 0x2a2a30 });
    for (const [du, dy] of CORNERS) F(side, du * 2, 29.1 + dy * 2 - 0.25, 3.86, 0.5, 0.5, 0.1, G);
    F(side, 0, 26.08, 3.76, 5, 0.26, 0.12, G); // золотая надпись
  }
  T(0, 32, 0, 7.8, 0.35, 7.8, D);
  // звонница с арками и башенками по углам
  T(0, 32.35, 0, 6.4, 2.85, 6.4, S);
  T(0, 35, 0, 6.5, 0.2, 6.5, G);
  for (const [sx, sz] of CORNERS) {
    T(sx * 3.5, 32.35, sz * 3.5, 0.9, 2.4, 0.9, D);
    T(sx * 3.5, 34.75, sz * 3.5, 0.5, 0.8, 0.5, S2);
    T(sx * 3.5, 35.55, sz * 3.5, 0.25, 0.7, 0.25, G);
  }
  for (const side of SIDES) {
    for (const u of [-1.7, 0, 1.7]) {
      F(side, u, 32.8, 3.22, 1, 2, 0.12, DARK);
      F(side, u, 34.8, 3.22, 0.5, 0.2, 0.12, DARK);
    }
    for (const u of [-2.6, -0.85, 0.85, 2.6]) F(side, u, 32.5, 3.26, 0.25, 2.5, 0.14, D);
    // щипец над звонницей
    [3, 2, 1].forEach((w, i) => F(side, 0, 35.2 + i * 0.4, 3.1, w, 0.4, 0.3, S2));
    F(side, 0, 36.4, 3.1, 0.2, 0.6, 0.2, G);
  }
  // шпиль: шиферные уступы, слуховые окошки, фонарь и золотой крест
  [5.6, 4.6, 3.6, 2.7, 1.9, 1.2].forEach((w, i) => {
    T(0, 35.2 + i * 1.6, 0, w, 1.6, w, i % 2 ? SL2 : SL);
    if (i % 2) T(0, 35.2 + i * 1.6 + 1.45, 0, w + 0.1, 0.15, w + 0.1, G);
  });
  for (const [sx, sz] of CORNERS) {
    T(sx * 2.9, 35.2, sz * 2.9, 0.6, 2.2, 0.6, S2);
    T(sx * 2.9, 37.4, sz * 2.9, 0.25, 0.8, 0.25, G);
  }
  for (const side of SIDES) {
    F(side, 0, 36.9, 2.3, 1.1, 1.5, 0.1, G);
    F(side, 0, 37.05, 2.35, 0.7, 1.1, 0.1, 0xf2d27a);
    F(side, 0, 40.3, 1.37, 1.4, 0.9, 0.1, 0xffe38a);
  }
  T(0, 44.8, 0, 0.8, 0.6, 0.8, G);
  T(0, 45.4, 0, 0.5, 0.9, 0.5, G);
  T(0, 46.3, 0, 0.25, 2.1, 0.25, G);
  T(0, 47.5, 0, 0.9, 0.18, 0.18, G);
  T(0, 47.5, 0, 0.18, 0.18, 0.9, G);
  a.solid(TX, TZ, 3.8);

  // Вестминстерский дворец: крыло с контрфорсами, окнами в два этажа, зубцами и шиферной крышей
  const WX = -1.5;
  const WZ = 2;
  const WL = 13; // x от −8 до 5
  const WD = 6.8; // z от −1.4 до 5.4
  a.box(WX, 0, WZ, WL + 0.4, 0.8, WD + 0.4, D);
  a.box(WX, 0.8, WZ, WL, 7.2, WD, S);
  a.box(WX, 4.4, WZ, WL + 0.2, 0.3, WD + 0.2, D);
  const bay = WL / 6;
  for (const sz of [1, -1]) {
    const fz = WZ + (sz * WD) / 2;
    for (let k = 0; k <= 6; k++) {
      const x = WX - WL / 2 + k * bay;
      if (sz < 0 && x > 3.5) continue; // сзади угол закрыт башней
      a.box(x, 0.8, fz + sz * 0.15, 0.5, 8.6, 0.3, S2);
      a.box(x, 9.4, fz + sz * 0.15, 0.3, 1, 0.3, D);
      a.box(x, 10.4, fz + sz * 0.15, 0.14, 0.4, 0.14, G);
    }
    for (let k = 0; k < 6; k++) {
      const x = WX - WL / 2 + (k + 0.5) * bay;
      if (sz < 0 && x > 3) continue;
      for (const y of [1.6, 5]) {
        a.box(x, y, fz + sz * 0.06, 1.3, 2.6, 0.12, D);
        a.box(x, y + 0.2, fz + sz * 0.1, 0.9, 2.2, 0.12, GL);
        a.box(x, y + 0.2, fz + sz * 0.14, 0.12, 2.2, 0.1, D);
      }
    }
    for (let x = WX - WL / 2 + 0.4; x < WX + WL / 2 - 0.2; x += 0.8) a.box(x, 8.5, fz, 0.4, 0.4, 0.3, D);
  }
  a.box(WX, 8, WZ, WL + 0.2, 0.5, WD + 0.2, D);
  a.box(WX, 8.5, WZ, WL - 0.4, 0.9, WD - 0.8, SL);
  a.box(WX, 9.4, WZ, WL - 0.8, 0.9, WD - 2.4, SL2);
  a.box(WX, 10.3, WZ, WL - 1.2, 0.8, WD - 4.2, SL);
  a.box(WX, 11.1, WZ, WL - 1.4, 0.15, 0.15, G);
  for (let x = WX - WL / 2 + 1.5; x < WX + WL / 2 - 1; x += 1.5) a.box(x, 11.1, WZ, 0.12, 0.5, 0.12, G);
  // центральная восьмигранная башня со шпилем
  const CX = -2;
  oct(a, CX, 8.5, WZ, 1.5, 5.5, S, S2);
  for (const side of SIDES) fbox(a, CX, WZ, side, 0, 10, 1.52, 0.5, 2.4, 0.1, GL);
  oct(a, CX, 14, WZ, 1.7, 0.3, D);
  [1.3, 1, 0.75, 0.5, 0.28].forEach((r, i) => oct(a, CX, 14.3 + i * 1.3, WZ, r, 1.3, i % 2 ? SL2 : SL));
  a.box(CX, 20.8, WZ, 0.2, 1.2, 0.2, G);
  // башня Виктории с британским флагом
  const VX = -10.2;
  const VZ = 2;
  a.box(VX, 0, VZ, 4.6, 20, 4.6, S);
  for (const [sx, sz] of CORNERS) {
    a.box(VX + sx * 2.2, 0, VZ + sz * 2.2, 0.9, 21.5, 0.9, S2);
    a.box(VX + sx * 2.2, 21.5, VZ + sz * 2.2, 0.6, 1, 0.6, SL);
    a.box(VX + sx * 2.2, 22.5, VZ + sz * 2.2, 0.2, 0.6, 0.2, G);
  }
  for (const y of [5.4, 10.2, 15]) a.box(VX, y, VZ, 4.8, 0.3, 4.8, D);
  for (const side of SIDES) {
    for (const y of [1.2, 6.2, 11, 15.8]) {
      if (side[0] > 0 && y < 8) continue; // эта грань — внутри дворца
      if (side[1] > 0 && y < 2) continue;
      fbox(a, VX, VZ, side, 0, y, 2.32, 1.4, 3.4, 0.12, D);
      fbox(a, VX, VZ, side, 0, y + 0.2, 2.36, 1, 3, 0.12, GL);
      fbox(a, VX, VZ, side, 0, y + 0.2, 2.4, 0.12, 3, 0.1, D);
    }
  }
  fbox(a, VX, VZ, [0, 1], 0, 0, 2.32, 2.4, 4.2, 0.12, D); // королевский вход
  fbox(a, VX, VZ, [0, 1], 0, 0, 2.37, 1.8, 3.6, 0.12, DARK);
  fbox(a, VX, VZ, [0, 1], 0, 3.6, 2.37, 1, 0.3, 0.12, DARK);
  a.box(VX, 20, VZ, 5, 0.6, 5, D);
  for (let k = -2; k <= 2; k++) {
    for (const s of [-1, 1]) {
      a.box(VX + k * 0.9, 20.6, VZ + s * 2.3, 0.45, 0.5, 0.4, D);
      a.box(VX + s * 2.3, 20.6, VZ + k * 0.9, 0.4, 0.5, 0.45, D);
    }
  }
  const B = 0x1f3a8a;
  const W = 0xf4f4f4;
  flag(a, VX, 20.6, VZ, ['WBBWRWBBW', 'BWBWRWBWB', 'RRRRRRRRR', 'BWBWRWBWB', 'WBBWRWBBW'], { B, W, R: RED });
  a.solid(-3, 2, 10, 3.6);

  // перед дворцом — красный двухэтажный автобус и телефонная будка
  const BX = -3.5;
  const BZ = 10;
  a.box(BX, 0.35, BZ, 6.4, 3.1, 2.2, RED);
  a.box(BX, 1.9, BZ, 6.46, 0.2, 2.26, 0xf2eee4);
  a.box(BX, 3.45, BZ, 6.2, 0.15, 2, 0xa82018);
  for (const sz of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      a.box(BX - 2.4 + i * 1.2, 1, BZ + sz * 1.12, 0.9, 0.7, 0.06, 0x2a3848);
      a.box(BX - 2.4 + i * 1.2, 2.3, BZ + sz * 1.12, 0.9, 0.8, 0.06, 0x2a3848);
    }
    for (const sx of [-1, 1]) {
      a.box(BX + sx * 2.1, 0, BZ + sz * 1, 1, 0.8, 0.35, 0x1d1d1d);
      a.box(BX + sx * 2.1, 0.25, BZ + sz * 1.2, 0.4, 0.3, 0.06, 0x9a9a9a);
    }
    a.box(BX + 3.23, 0.55, BZ + sz * 0.75, 0.06, 0.25, 0.3, 0xfff2b0);
  }
  a.box(BX + 3.23, 1, BZ, 0.06, 0.7, 1.8, 0x2a3848);
  a.box(BX + 3.23, 2.3, BZ, 0.06, 0.7, 1.8, 0x2a3848);
  a.box(BX + 3.24, 3.05, BZ, 0.06, 0.25, 1.2, 0x1a1a1a);
  a.box(BX + 3.26, 3.1, BZ, 0.04, 0.15, 0.9, 0xf2c94c);
  a.solid(BX, BZ, 3.2, 1.1);
  const PX = 2.5;
  const PZ = 8.5;
  a.box(PX, 0, PZ, 1.2, 0.2, 1.2, 0xa82018);
  a.box(PX, 0.2, PZ, 1, 2.6, 1, RED);
  for (const side of SIDES) {
    fbox(a, PX, PZ, side, 0, 0.8, 0.52, 0.64, 1.4, 0.06, 0xcfe3ea);
    for (const y of [1.2, 1.65]) fbox(a, PX, PZ, side, 0, y, 0.55, 0.64, 0.07, 0.04, RED);
    fbox(a, PX, PZ, side, 0, 0.8, 0.55, 0.07, 1.4, 0.04, RED);
    fbox(a, PX, PZ, side, 0, 2.35, 0.52, 0.8, 0.22, 0.06, 0xf2f2f2);
  }
  a.box(PX, 2.8, PZ, 1.15, 0.25, 1.15, RED);
  a.box(PX, 3.05, PZ, 0.8, 0.25, 0.8, RED);
  a.solid(PX, PZ, 0.6);
  // фонари и сад позади дворца
  for (const [x, z] of [[6.5, 7.5], [-9.5, 7.5]]) {
    a.box(x, 0, z, 0.5, 0.3, 0.5, 0x2a2a2a);
    a.box(x, 0.3, z, 0.2, 2.8, 0.2, 0x2a2a2a);
    a.box(x, 3.1, z, 0.55, 0.6, 0.55, 0xffe38a);
    a.box(x, 3.7, z, 0.7, 0.15, 0.7, 0x2a2a2a);
  }
  a.box(-2, 0, -3.4, 12, 0.9, 0.9, 0x3f7f3a);
  for (const [x, z] of [[-10, -8], [-4, -9], [1.5, -8.5], [-7, -11.5]]) tree(a, x, 0, z, 2.2, 2.4);
  a.box(-6.5, 0.45, -6, 1.6, 0.2, 0.6, 0x9a6a3a);
  a.box(-6.5, 0.65, -6.3, 1.6, 0.6, 0.15, 0x9a6a3a);
  for (const e of [-0.6, 0.6]) a.box(-6.5 + e, 0, -6, 0.18, 0.45, 0.5, 0x3b3b3b);
}

/* ---------- Москва: Спасская башня — красный кирпич, белокаменные ярусы, куранты, шатёр, звезда ---------- */
function spasskaya(a) {
  const R = 0xb5382a;
  const R2 = 0x9c2e22;
  const R3 = 0xc4442f;
  const W = 0xeee8da;
  const W2 = 0xd6cdbb;
  const G = 0x2f6b5e; // шатёр: зелёный с синевой — мелкие детали не качаются на ветру
  const G2 = 0x285e53;
  const Y = 0xe8b830;
  const STAR = 0xe0302a;
  const DARK = 0x2a1c14;
  const BLUE = 0x1d3a6b;

  // кремлёвская стена: кирпичные ряды, карниз, зубцы «ласточкин хвост» с бойницами
  for (const sx of [-1, 1]) {
    const cx = sx * 9;
    a.box(cx, 0, 0, 8, 7.4, 3, R2);
    for (const y of [1.8, 3.6, 5.4]) a.box(cx, y, 0, 8.1, 0.14, 3.1, R);
    a.box(cx, 7.4, 0, 8.2, 0.35, 3.2, R3);
    for (let i = 0; i < 3; i++) {
      const x = sx * (6.2 + i * 1.5);
      a.box(x, 7.75, -1.1, 1.0, 1.2, 0.8, R2); // зубец
      for (const e of [-0.3, 0.3]) a.box(x + e, 8.95, -1.1, 0.34, 0.6, 0.8, R2); // «хвост»
      a.box(x, 8.1, -1.52, 0.22, 0.5, 0.06, DARK); // бойница
      a.box(x, 7.75, 1.2, 1.0, 0.8, 0.5, R2); // низкий парапет изнутри
    }
    // башенка на краю стены с зелёным шатром
    const tx = sx * 12;
    a.box(tx, 0, 0, 3, 9.6, 3.6, R);
    a.box(tx, 9.6, 0, 3.3, 0.35, 3.9, W);
    [2.8, 2.2, 1.6, 1.0, 0.5].forEach((w, i) => a.box(tx, 9.95 + i * 0.9, 0, w, 0.9, w, i % 2 ? G2 : G));
    a.box(tx, 14.45, 0, 0.2, 1, 0.2, Y);
    for (const y of [3, 6]) fbox(a, tx, 0, [0, -1], 0, y, 1.82, 0.4, 0.9, 0.1, DARK);
    a.solid(cx, 0, 4, 1.5);
  }

  // основной объём: белый цоколь, угловые лопатки, пояса белого камня, карниз
  a.box(0, 0, 0, 10.8, 0.8, 10.8, W2);
  a.box(0, 0.8, 0, 10, 12.2, 10, R);
  for (const [sx, sz] of CORNERS) a.box(sx * 4.75, 0.8, sz * 4.75, 0.7, 12.2, 0.7, R3);
  for (const y of [4.5, 9]) a.box(0, y, 0, 10.2, 0.3, 10.2, W);
  a.box(0, 12.6, 0, 10.8, 0.5, 10.8, W);
  a.box(0, 13.1, 0, 10.4, 0.3, 10.4, W2);
  // проездные ворота в белокаменной раме, над ними — икона
  for (const sz of [1, -1]) {
    const side = [0, sz];
    fbox(a, 0, 0, side, 0, 0.8, 5.0, 4.4, 6.4, 0.2, W);
    fbox(a, 0, 0, side, 0, 0.8, 5.08, 3.4, 4.8, 0.2, DARK);
    [2.8, 2.2, 1.2].forEach((w, i) => fbox(a, 0, 0, side, 0, 5.6 + i * 0.4, 5.08, w, 0.4, 0.2, DARK));
    fbox(a, 0, 0, side, 0, 7.8, 5.05, 2.2, 2.4, 0.2, W);
    fbox(a, 0, 0, side, 0, 8.0, 5.12, 1.7, 1.9, 0.12, BLUE);
    fbox(a, 0, 0, side, 0, 9.1, 5.18, 0.7, 0.7, 0.1, Y);
  }
  // по бокам — парные окна в белых наличниках
  for (const sx of [1, -1]) {
    for (const u of [-2, 2]) {
      fbox(a, 0, 0, [sx, 0], u, 9.6, 5.0, 1.3, 2.4, 0.16, W);
      fbox(a, 0, 0, [sx, 0], u, 9.8, 5.06, 0.8, 1.7, 0.14, DARK);
    }
  }
  // балюстрада и угловые башенки-пирамидки
  railing(a, 5.05, 13.4, 0.72, W, 0.7);
  for (const [sx, sz] of CORNERS) {
    const x = sx * 4.4;
    const z = sz * 4.4;
    a.box(x, 13.4, z, 1.5, 3.6, 1.5, W);
    for (const side of SIDES) fbox(a, x, z, side, 0, 14.4, 0.75, 0.5, 1.4, 0.1, R2);
    a.box(x, 17, z, 1.8, 0.3, 1.8, W2);
    [1.3, 0.9, 0.5].forEach((w, i) => a.box(x, 17.3 + i * 0.7, z, w, 0.7, w, i % 2 ? G2 : G));
    a.box(x, 19.4, z, 0.25, 0.9, 0.25, Y);
    a.box(x, 19.9, z, 0.5, 0.12, 0.12, Y);
  }
  // ярус курантов: синие циферблаты с золотом в белых рамах
  a.box(0, 13.4, 0, 7.4, 7.6, 7.4, R);
  for (const [sx, sz] of CORNERS) a.box(sx * 3.55, 13.4, sz * 3.55, 0.6, 7.6, 0.6, W);
  for (const side of SIDES) {
    dial(a, 0, 0, side, 17.4, 3.7, 2.2, { face: BLUE, rim: Y, frame: W, marks: Y, hand: Y, back: BLUE });
    fbox(a, 0, 0, side, 0, 20.1, 3.72, 5.2, 0.5, 0.14, W);
    for (const u of [-1.8, -0.6, 0.6, 1.8]) fbox(a, 0, 0, side, u, 20.6, 3.72, 0.8, 0.45, 0.14, W); // «кокошники»
  }
  a.box(0, 21, 0, 8.2, 0.5, 8.2, W);
  // восьмигранная звонница с белыми арками
  oct(a, 0, 21.5, 0, 2.9, 4.6, R, R2);
  for (let k = 0; k < 8; k++) {
    const ang = (k * Math.PI) / 4;
    const side = [Math.sin(ang), Math.cos(ang)];
    fbox(a, 0, 0, side, 0, 22.2, 2.9, 1.3, 3, 0.14, W);
    fbox(a, 0, 0, side, 0, 22.5, 2.96, 0.8, 2.3, 0.12, DARK);
  }
  oct(a, 0, 26.1, 0, 3.3, 0.5, W);
  // шатёр со слуховыми окошками и золотым яблоком
  [2.6, 2.2, 1.85, 1.5, 1.15, 0.8, 0.5].forEach((r, i) => oct(a, 0, 26.6 + i * 1.75, 0, r, 1.75, i % 2 ? G2 : G));
  for (const side of SIDES) {
    fbox(a, 0, 0, side, 0, 27.6, 2.35, 0.7, 1.0, 0.3, W);
    fbox(a, 0, 0, side, 0, 27.8, 2.52, 0.4, 0.6, 0.1, DARK);
  }
  a.box(0, 38.85, 0, 0.8, 0.5, 0.8, Y);
  a.box(0, 39.35, 0, 0.35, 1.7, 0.35, Y);
  // рубиновая звезда в золотой оправе: пять лучей, видна с двух сторон
  const sy = 41.6;
  a.box(0, sy - 0.6, 0, 1.2, 1.2, 1.2, STAR);
  a.box(0, sy - 0.35, 0, 0.7, 0.7, 1.3, Y);
  for (let r = 0; r < 5; r++) {
    const ang = (r * TAU) / 5;
    a.box(Math.sin(ang) * 0.9, sy - 0.95 + Math.cos(ang) * 0.9, 0, 0.7, 1.9, 0.5, STAR, 0, 0, -ang);
    a.box(0, sy - 0.95 + Math.cos(ang) * 0.9, Math.sin(ang) * 0.9, 0.5, 1.9, 0.7, STAR, 0, ang, 0);
  }
  a.solid(0, 0, 5);
}

/* ---------- Нью-Йорк: Статуя Свободы — факел, корона, скрижаль, гранитный пьедестал и звёздный форт ---------- */
function liberty(a) {
  const ST = 0xc2b49a;
  const ST2 = 0xa8987a;
  const ST3 = 0xb5a68a;
  const GR = 0x74b8a4; // патина — зелёная с синевой
  const GR2 = 0x5c9e8a;
  const GR3 = 0x4f8c79;
  const GR4 = 0x86c4b2;
  const DARK = 0x3a342a;
  const FLAME = 0xffc24a;
  const FLAME2 = 0xffe38a;
  // звёздный форт Вуд: восьмигранник и восемь каменных лучей
  oct(a, 0, 0, 0, 6.4, 2.5, ST2, ST3);
  for (let k = 0; k < 8; k++) {
    const ang = (k * Math.PI) / 4 + Math.PI / 8;
    a.box(Math.cos(ang) * 6.6, 0, Math.sin(ang) * 6.6, 3.1, 2.5, 3.1, ST2, -ang + Q);
  }
  oct(a, 0, 2.5, 0, 6.6, 0.3, ST);
  // гранитный пьедестал: цоколь с панелями, рустованные углы, лоджии с колоннами, диски
  a.box(0, 2.8, 0, 9, 1.7, 9, ST);
  for (const side of SIDES) for (const u of [-3, -1, 1, 3]) fbox(a, 0, 0, side, u, 3.1, 4.5, 1.2, 1.1, 0.12, ST2);
  a.box(0, 4.5, 0, 7.4, 1.2, 7.4, ST2);
  a.box(0, 5.7, 0, 6.4, 8, 6.4, ST);
  for (const [sx, sz] of CORNERS) {
    a.box(sx * 3.05, 5.7, sz * 3.05, 0.7, 8, 0.7, ST3);
    for (const y of [6.7, 7.9, 9.1, 10.3, 11.5, 12.7]) a.box(sx * 3.1, y, sz * 3.1, 0.85, 0.4, 0.85, ST2);
  }
  for (const side of SIDES) {
    fbox(a, 0, 0, side, 0, 8.2, 3.2, 2.8, 3.4, 0.14, DARK); // лоджия
    for (const u of [-1.05, 1.05]) fbox(a, 0, 0, side, u, 8.2, 3.3, 0.35, 3.4, 0.2, ST);
    fbox(a, 0, 0, side, 0, 11.7, 3.25, 3.4, 0.4, 0.2, ST2);
    for (const u of [-2, -1, 0, 1, 2]) fbox(a, 0, 0, side, u * 0.95, 12.6, 3.25, 0.55, 0.55, 0.12, ST3);
  }
  a.box(0, 13.7, 0, 7, 0.8, 7, ST2);
  railing(a, 3.4, 14.5, 0.8, ST2, 0.5);
  a.box(0, 14.5, 0, 5.4, 1.4, 5.4, ST);

  // статуя смотрит в −z; правая рука (+x) с факелом, левая (−x) держит скрижаль
  const y = 15.9;
  a.box(-0.8, y, -1.9, 1.0, 0.4, 1.0, GR3); // сандалии
  a.box(0.9, y, -1.5, 1.0, 0.4, 1.0, GR3);
  a.box(0, y, -2.4, 2.6, 0.2, 0.3, GR2); // разорванная цепь
  a.box(0, y, 0, 4.2, 3, 3.6, GR); // одеяние расширяется книзу
  a.box(0, y + 3, 0, 3.8, 3, 3.2, GR2);
  a.box(0.2, y + 6, 0, 3.4, 3.2, 2.8, GR);
  for (const [x, h, z] of [[-1.4, 5, -1.85], [-0.5, 6.5, -1.9], [0.4, 5.5, -1.9], [1.3, 4.5, -1.85], [-1.6, 5, 1.75], [0.6, 6, 1.75]]) {
    a.box(x, y + 0.3, z, 0.45, h, 0.35, GR3); // складки
  }
  a.box(0, y + 5.4, -1.7, 3.6, 0.5, 0.4, GR3, 0, 0, 0.35); // накидка через грудь
  a.box(0.2, y + 7, 1.35, 3.2, 2.2, 0.4, GR2); // плащ на спине
  // голова: шея, лицо, волосы, корона с окошками и семью лучами
  a.box(0, y + 9.2, 0, 1.2, 0.8, 1.2, GR2);
  a.box(0, y + 10, 0, 2, 2.2, 2, GR);
  a.box(0, y + 10.1, 0.25, 2.2, 1.5, 1.8, GR2);
  for (const sx of [-1, 1]) a.box(sx * 0.4, y + 11.1, -1.02, 0.35, 0.25, 0.1, GR3);
  a.box(0, y + 10.5, -1.12, 0.3, 0.7, 0.25, GR4); // нос
  a.box(0, y + 12.0, 0, 2.3, 0.45, 2.3, GR2);
  for (let k = -2; k <= 2; k++) a.box(k * 0.42, y + 12.1, -1.18, 0.28, 0.28, 0.1, 0x9fd8e8);
  for (let r = -3; r <= 3; r++) {
    const ang = r * 0.42;
    a.box(Math.sin(ang) * 1.4, y + 11.9, -Math.cos(ang) * 1.4, 0.3, 1.8, 0.3, GR4, -ang, -0.9);
  }
  // поднятая рука с факелом: рукав, ручка, золотая чаша, пламя
  a.box(2.1, y + 8.5, 0.2, 1, 6.5, 1, GR, 0, 0, -0.15);
  a.box(2.0, y + 8.3, 0.2, 1.4, 1.6, 1.3, GR2, 0, 0, -0.15);
  a.box(2.6, y + 14.6, 0.2, 0.8, 1.4, 0.8, GR2);
  a.box(2.6, y + 15.9, 0.2, 1.6, 0.4, 1.6, 0xe8b830);
  a.box(2.6, y + 16.3, 0.2, 1.3, 1.2, 1.3, FLAME);
  a.box(2.6, y + 17.5, 0.2, 0.8, 0.9, 0.8, FLAME2);
  a.box(2.6, y + 18.4, 0.2, 0.35, 0.5, 0.35, 0xfff4c0);
  // левая рука прижимает скрижаль с датой
  a.box(-1.9, y + 6.2, -0.2, 0.9, 3, 0.9, GR);
  a.box(-2.2, y + 4.9, -0.9, 2.0, 3.0, 0.6, GR3, 0, 0, 0.25);
  for (const dy of [0.3, 0.9]) a.box(-2.2, y + 5.2 + dy, -1.22, 1.4, 0.2, 0.08, GR4, 0, 0, 0.25);
  a.solid(0, 0, 7.5);
}

/* ---------- Египет: пирамиды Гизы с пирамидами цариц, сфинкс, руины храма и верблюд ---------- */
function pyramids(a) {
  const S = 0xd9b96a;
  const S2 = 0xcfae5f;
  const S3 = 0xc6a456;
  const CAP = 0xeee2c0;
  const DARK = 0x4a3a20;
  const NEMES = 0x3a6fc0;
  // ступенчатая пирамида: слои разных оттенков и швы кладки на гранях
  const pyramid = (x, z, base, layers, cap = 0) => {
    const step = base / (layers * 2);
    const h = step * 1.27;
    for (let i = 0; i < layers; i++) {
      const w = base - i * step * 2;
      const cased = i >= layers - cap;
      a.box(x, i * h, z, w, h, w, cased ? CAP : [S, S2, S3][(i * 2) % 3]);
      if (!cased && w > 3) {
        for (const side of SIDES) fbox(a, x, z, side, (((i * 3) % 5) - 2) * w * 0.12, i * h + h * 0.45, w / 2 + 0.02, w * 0.3, h * 0.15, 0.06, S3);
      }
    }
    a.solid(x, z, base / 2 - 0.5);
    return h;
  };
  const hc = pyramid(5, -5, 18, 16); // Хеопс
  pyramid(-5, 5, 14, 13, 3); // Хефрен — с облицовкой на верхушке
  pyramid(-11, 11, 6, 7); // Микерин
  for (const x of [1, 4.5, 8]) pyramid(x, -15.5, 3, 3); // пирамиды цариц
  // вход в Хеопса на северной грани
  fbox(a, 5, -5, [0, -1], 0, 4 * hc + 0.05, 6.75, 1.2, 0.6, 0.2, DARK);
  fbox(a, 5, -5, [0, -1], 0, 4 * hc + 0.62, 6.75, 1.6, 0.12, 0.25, S3);

  // сфинкс смотрит на восток (+x): тело, лапы, полосатый немес, лицо
  const SX = 10.5;
  const SZ = 9;
  a.box(SX, 0, SZ, 7, 0.6, 3.4, S3);
  a.box(SX - 0.5, 0.6, SZ, 6, 2.2, 2.8, S2);
  a.box(SX - 3.6, 0.6, SZ, 1.4, 1.6, 2.6, S2);
  a.box(SX - 3.1, 0.6, SZ + 1.45, 1.6, 0.3, 0.3, S2); // хвост
  for (const dz of [-0.8, 0.8]) a.box(SX + 3.6, 0.6, SZ + dz, 2.6, 0.8, 0.8, S2);
  a.box(SX + 2.3, 2.8, SZ, 2.2, 2.6, 2.2, S);
  for (let k = 0; k < 4; k++) a.box(SX + 1.9, 2.9 + k * 0.6, SZ, 2.3, 0.3, 2.7, k % 2 ? S : NEMES);
  for (const dz of [-1.15, 1.15]) a.box(SX + 2.8, 1.8, SZ + dz, 0.8, 1.6, 0.4, NEMES);
  for (const dz of [-0.45, 0.45]) a.box(SX + 3.42, 4.3, SZ + dz, 0.1, 0.25, 0.4, DARK);
  a.box(SX + 3.5, 3.6, SZ, 0.25, 0.6, 0.35, S3); // нос
  a.box(SX + 3.42, 3.2, SZ, 0.1, 0.15, 0.7, DARK); // рот
  a.box(SX + 3.45, 4.9, SZ, 0.15, 0.3, 0.2, 0xe8b830); // золотая змейка-урей
  a.solid(SX + 0.5, SZ, 4.5, 1.8);

  // руины храма: обломки колонн и упавшие блоки
  for (const [x, z, h] of [[-15, -4, 3.4], [-13, -4, 2.2], [-15, -8, 1.4], [-13, -8, 3]]) {
    round(a, x, 0, z, 1.1, h, S2, S3);
    if (h > 3) a.box(x, h, z, 1.5, 0.4, 1.5, S);
  }
  a.box(-14, 3.4, -4, 3, 0.6, 1, S3);
  a.box(-14, 0, -6, 2.2, 0.8, 1.2, S3, 0.5);
  a.box(-11.5, 0, -9.5, 1.2, 0.7, 1.2, S2, 0.3);
  a.solid(-14, -6, 1.6, 2.6);

  // верблюд с красной попоной
  const CX = 8;
  const CZ = 14.5;
  const CM = 0xc8a060;
  const CM2 = 0xb08a50;
  for (const dx of [-0.9, 0.9]) for (const dz of [-0.35, 0.35]) a.box(CX + dx, 0, CZ + dz, 0.3, 1.8, 0.3, CM2);
  a.box(CX, 1.8, CZ, 2.4, 1.0, 1.1, CM);
  a.box(CX + 0.2, 2.8, CZ, 1.0, 0.7, 0.9, CM);
  a.box(CX + 0.2, 2.7, CZ, 1.4, 0.3, 1.2, 0xc0392b);
  for (const dz of [-0.62, 0.62]) a.box(CX + 0.2, 2.35, CZ + dz, 1.4, 0.35, 0.06, 0xe8b830);
  a.box(CX - 1.45, 2.1, CZ, 0.5, 1.6, 0.5, CM, 0, 0, 0.5); // шея
  a.box(CX - 2.05, 3.35, CZ, 1.0, 0.5, 0.55, CM); // голова
  for (const dz of [-0.28, 0.28]) a.box(CX - 2.2, 3.55, CZ + dz, 0.15, 0.15, 0.05, DARK);
  a.box(CX + 1.25, 1.9, CZ, 0.15, 0.8, 0.15, CM2); // хвост
  a.solid(CX, CZ, 1.2, 0.6);
}

export { eiffel, bigBen, spasskaya, liberty, pyramids };
