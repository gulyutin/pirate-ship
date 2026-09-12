import * as THREE from 'three';
import {
  cube, TAU, Q, CORNERS, SIDES, WATER, GOLD, yawAlong, round, stack, stackSquare, onion, dome, sphere,
  beam, polyline, pixels, flag, clocks, tree, archFill,
} from './kit.js';

// Чудеса света у порта, часть 3: windmill, moai, christ, burj, pagoda.

/* ---------- местные помощники ---------- */
const TAN8 = Math.tan(Math.PI / 8);

// Правильный восьмигранник радиусом r (до грани): четыре планки под 0/45/90/135°.
// c — прямые грани, c2 — косые; косые чуть ниже, чтобы верх не рябил.
function oct(a, x, y0, z, r, h, c, c2 = c) {
  const s = 2 * r * TAN8;
  a.box(x, y0, z, 2 * r, h, s, c);
  a.box(x, y0, z, s, h, 2 * r, c);
  a.box(x, y0 + 0.015, z, 2 * r, h - 0.03, s, c2, Q);
  a.box(x, y0 + 0.015, z, 2 * r, h - 0.03, s, c2, -Q);
}

// Деталь на грани: φ — направление наружу (0 = +x, π/2 = +z), r — расстояние до грани,
// s — сдвиг вдоль грани, w — ширина вдоль грани, t — вынос наружу.
function onFace(a, phi, r, s, y0, w, h, t, c, cx = 0, cz = 0) {
  const nx = Math.cos(phi);
  const nz = Math.sin(phi);
  a.box(cx + nx * (r + t / 2) - nz * s, y0, cz + nz * (r + t / 2) + nx * s, t, h, w, c, -phi);
}

// Окно в раме с крестом-переплётом и (по желанию) ставнями.
function windowOn(a, phi, r, s, y0, w, h, frame, glass, shutter, cx = 0, cz = 0) {
  const f = 0.14;
  onFace(a, phi, r, s, y0, w, h, 0.08, glass, cx, cz);
  onFace(a, phi, r, s, y0 - f, w + 2 * f, f, 0.16, frame, cx, cz);
  onFace(a, phi, r, s, y0 + h, w + 2 * f, f, 0.16, frame, cx, cz);
  for (const k of [-1, 1]) onFace(a, phi, r, s + k * (w + f) / 2, y0, f, h, 0.16, frame, cx, cz);
  onFace(a, phi, r, s, y0 + h / 2 - 0.04, w, 0.08, 0.12, frame, cx, cz);
  onFace(a, phi, r, s, y0, 0.08, h, 0.12, frame, cx, cz);
  if (shutter) for (const k of [-1, 1]) onFace(a, phi, r, s + k * (w / 2 + f + w * 0.27), y0, w * 0.5, h, 0.1, shutter, cx, cz);
}

// Колесо в плоскости x-y (спицы и обод), центр (x, cy, z).
function wheelXY(a, x, cy, z, R, t, c, rim = c) {
  for (let k = 0; k < 4; k++) a.box(x, cy - R, z, 0.12, 2 * R, t, c, 0, 0, (k * Math.PI) / 4);
  const seg = 2 * R * TAN8 + 0.05;
  for (let k = 0; k < 8; k++) {
    const ang = (k * Math.PI) / 4;
    a.box(x + Math.cos(ang) * R, cy + Math.sin(ang) * R - 0.09, z, seg, 0.18, t + 0.04, rim, 0, 0, ang + Math.PI / 2);
  }
}

/* ---------- Нидерланды: восьмигранная мельница, решётчатые крылья и тюльпаны ---------- */
function windmill(a) {
  const BR = 0x8a4a32;
  const BR2 = 0x7a3f2a;
  const ST = 0x9a958a;
  const ST2 = 0xb3ad9f;
  const BODY = 0x5a4a3a;
  const BODY2 = 0x4f4032;
  const CAP = 0x3a3026;
  const K = 0x2e2418; // тёмное дерево
  const W = 0xe8e3d6; // белые рамы
  const GL = 0x2c3e50; // стекло
  const SH = 0x2e6a6e; // ставни и двери — сине-зелёные (не качаются)
  const WD = 0x6a4a2e; // доски
  const WD2 = 0x7a5a3a;
  const RED = 0xb8322a;
  const SACK = 0xe6dcc0;
  const LEAF = 0x3f8f3a;

  // каменный цоколь и кирпичная башня рядами «в шахматку»
  oct(a, 0, 0, 0, 4.1, 0.6, ST, ST2);
  for (let i = 0; i < 6; i++) oct(a, 0, 0.6 + i * 0.6, 0, 3.7, 0.6, i % 2 ? BR2 : BR, i % 2 ? BR : BR2);
  oct(a, 0, 4.2, 0, 3.85, 0.25, ST2, ST); // карниз
  // двери внизу (спереди и сзади): рама, «голландская» дверь из двух половинок, перемычка
  for (const phi of [Math.PI / 2, -Math.PI / 2]) {
    onFace(a, phi, 3.7, 0, 0.6, 1.4, 2.4, 0.08, K);
    onFace(a, phi, 3.7, 0, 0.6, 1.2, 1.1, 0.14, SH);
    onFace(a, phi, 3.7, 0, 1.75, 1.2, 1.2, 0.14, SH);
    for (const k of [-1, 1]) onFace(a, phi, 3.7, k * 0.8, 0.6, 0.2, 2.5, 0.16, W);
    onFace(a, phi, 3.7, 0, 3.1, 1.9, 0.35, 0.16, ST2);
    onFace(a, phi, 3.7, 0.4, 1.55, 0.14, 0.14, 0.2, GOLD); // ручка
  }
  for (const phi of [0, Math.PI]) windowOn(a, phi, 3.7, 0, 1.8, 0.8, 1.0, W, GL, null);

  // галерея-«стеллинг»: дощатый пол, подпорки, перила (сзади проход к хвосту)
  oct(a, 0, 4.45, 0, 5.4, 0.3, WD, WD2);
  for (let k = 0; k < 8; k++) {
    const phi = (k * Math.PI) / 4;
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    beam(a, [3.8 * c, 2.4, 3.8 * s], [5.0 * c, 4.46, 5.0 * s], 0.22, K);
    const pc = (5.2 / Math.cos(Math.PI / 8)) * Math.cos(phi + Math.PI / 8);
    const ps = (5.2 / Math.cos(Math.PI / 8)) * Math.sin(phi + Math.PI / 8);
    a.box(pc, 4.75, ps, 0.18, 0.9, 0.18, K);
    if (k === 6) continue;
    onFace(a, phi, 5.1, 0, 4.75, 0.16, 0.85, 0.16, K);
    onFace(a, phi, 5.12, 0, 5.5, 5.2 * 2 * TAN8, 0.12, 0.12, WD2);
    onFace(a, phi, 5.12, 0, 5.1, 5.2 * 2 * TAN8, 0.1, 0.1, WD2);
  }

  // восьмигранный корпус, сужается кверху
  const T0 = 4.75;
  const tierR = (i) => 3.2 - i * 0.135;
  for (let i = 0; i < 8; i++) oct(a, 0, T0 + i * 1.5, 0, tierR(i), 1.5, i % 2 ? BODY2 : BODY, i % 2 ? BODY : BODY2);
  oct(a, 0, T0 + 12, 0, 2.35, 0.2, W); // белое кольцо под колпаком
  // двери на галерею
  for (const phi of [Math.PI / 2, -Math.PI / 2]) {
    onFace(a, phi, tierR(0), 0, T0, 1.3, 1.95, 0.1, W);
    onFace(a, phi, tierR(0), 0, T0, 1.0, 1.8, 0.16, SH);
  }
  // окна со ставнями
  const wins = [[1, 0], [1, Math.PI], [1, -Math.PI / 4], [4, 0], [4, Math.PI], [4, Math.PI / 2], [6, -Math.PI / 2]];
  for (const [ti, phi] of wins) windowOn(a, phi, tierR(ti), 0, T0 + ti * 1.5 + 0.25, 0.7, 1.0, W, GL, ti < 6 ? SH : null);

  // колпак-«лодка» с белой каймой, коньком и доской-«бородой» спереди
  const CY = T0 + 12.2;
  a.box(0, CY, 0, 4.4, 1.2, 5.6, CAP);
  a.box(0, CY - 0.1, 0, 4.6, 0.3, 5.8, W);
  a.box(0, CY + 1.2, 0, 3.6, 0.8, 5.4, K);
  a.box(0, CY + 2.0, 0, 2.4, 0.6, 5.0, CAP);
  a.box(0, CY + 2.6, 0, 1.0, 0.35, 4.6, K);
  onFace(a, Math.PI / 2, 2.9, 0, CY - 0.8, 3.0, 1.0, 0.12, W);
  onFace(a, Math.PI / 2, 3.02, 0, CY - 0.55, 2.2, 0.5, 0.06, RED);
  onFace(a, -Math.PI / 2, 2.8, 0, CY + 0.2, 0.7, 0.8, 0.08, W); // окошко сзади
  const HY = 17;
  a.box(0, HY - 0.45, 3.2, 0.9, 0.9, 1.3, K); // вал

  // хвост-«стаарт» со схватками и воротом — им колпак поворачивают к ветру
  beam(a, [0, 17.3, -2.7], [0, 5.0, -5.15], 0.4, K);
  for (const sx of [-1, 1]) beam(a, [sx * 1.9, 17.1, -2.4], [0, 10.5, -4.05], 0.22, K);
  wheelXY(a, 0, 5.95, -5.3, 0.9, 0.12, WD2, K);

  // крылья: решётка, парус на двух крыльях полностью, на двух — наполовину
  const hub = a.group(0, HY, 3.9);
  cube(hub, K, 1.2, 1.2, 1.2);
  cube(hub, RED, 0.8, 0.8, 0.3, 0, 0, 0.72);
  cube(hub, W, 0.4, 0.4, 0.2, 0, 0, 0.95);
  for (let r = 0; r < 4; r++) {
    const arm = new THREE.Group();
    arm.rotation.z = (r * Math.PI) / 2;
    hub.add(arm);
    cube(arm, K, 0.45, 10.3, 0.35, 0, 5.15, 0);
    cube(arm, W, 0.52, 0.7, 0.42, 0, 9.9, 0); // крашеные концы
    cube(arm, RED, 0.52, 0.6, 0.42, 0, 9.25, 0);
    for (let j = 0; j < 9; j++) cube(arm, W, 2.3, 0.14, 0.12, 1.25, 1.4 + j * 1.1, 0.2);
    cube(arm, W, 0.14, 9.2, 0.12, 2.4, 5.85, 0.2);
    cube(arm, W, 0.1, 9.2, 0.1, 1.25, 5.85, 0.2);
    cube(arm, K, 0.5, 7.4, 0.08, -0.5, 6.4, 0.08); // передняя доска
    const full = r % 2 === 0;
    cube(arm, 0xf4f0e6, 2.1, full ? 8.4 : 4.2, 0.08, 1.25, full ? 5.9 : 8.0, 0.32);
  }
  hub.userData.spin = 0.8;
  a.solid(0, 0, 4);

  // канал с кирпичными набережными, мостик и лодочка
  a.box(9, 0, 0, 2.6, 0.25, 20, 0x5aa9d6);
  for (const x of [7.55, 10.45]) a.box(x, 0, 0, 0.3, 0.5, 20, BR2);
  a.box(9, 0.5, 6, 3.2, 0.2, 1.6, WD);
  for (const sz of [-0.7, 0.7]) {
    for (const x of [7.6, 9, 10.4]) a.box(x, 0.7, 6 + sz, 0.14, 0.9, 0.14, W);
    a.box(9, 1.5, 6 + sz, 3.0, 0.12, 0.12, W);
  }
  a.box(9, 0.1, -4, 1.0, 0.25, 2.4, WD);
  for (const sx of [-1, 1]) a.box(9 + sx * 0.55, 0.1, -4, 0.14, 0.5, 2.7, SH);
  for (const sz of [-1, 1]) a.box(9, 0.1, -4 + sz * 1.3, 1.24, 0.5, 0.14, SH);
  a.box(9, 0.4, -4.3, 1.0, 0.1, 0.4, WD2);
  a.box(8.7, 0.6, -3.7, 0.1, 0.1, 2.2, K, 0.3);

  // тюльпановое поле: грядки, стебли с листьями, бутоны с зубчиками
  const T = [0xd8453a, 0xe8b830, 0xe07ab0, 0xf0ece0, 0xe0702a];
  for (let row = 0; row < 5; row++) {
    const z = -5.6 - row * 1.1;
    a.box(-1.85, 0, z, 14.2, 0.18, 0.75, 0x6b4a2e);
    for (let i = 0; i < 11; i++) {
      const x = -8.6 + i * 1.35;
      const c = T[(row + (i % 7 === 3 ? 2 : 0)) % 5];
      a.box(x, 0.18, z, 0.16, 0.7, 0.16, LEAF);
      a.box(x + (i % 2 ? 0.17 : -0.17), 0.18, z, 0.2, 0.45, 0.14, 0x4a9a40);
      a.box(x, 0.85, z, 0.5, 0.42, 0.5, c);
      a.box(x - 0.16, 1.27, z, 0.16, 0.18, 0.5, c);
      a.box(x + 0.16, 1.27, z, 0.16, 0.18, 0.5, c);
    }
  }
  // белый заборчик вдоль поля
  for (let i = 0; i < 15; i++) {
    const x = -9.1 + i * 1.0;
    if (Math.abs(x + 0.1) < 0.8) continue; // калитка
    a.box(x, 0, -4.75, 0.14, 0.9, 0.1, W);
  }
  for (const [x0, x1] of [[-9.2, -1.0], [0.8, 5.0]]) a.box((x0 + x1) / 2, 0.55, -4.75, x1 - x0, 0.12, 0.08, W);
  for (let i = 0; i < 6; i++) a.box(-9.6, 0, -5.5 - i * 1.0, 0.1, 0.9, 0.14, W);
  a.box(-9.6, 0.55, -8.0, 0.08, 0.12, 5.2, W);

  // у двери: мешки с мукой, тележка, бочки, старый жёрнов
  for (const [x, y, z] of [[2.0, 0, 5.2], [2.9, 0, 5.0], [2.45, 0.85, 5.1], [3.7, 0, 5.6]]) {
    a.box(x, y, z, 0.8, 0.85, 0.6, SACK);
    a.box(x, y + 0.85, z, 0.3, 0.15, 0.3, 0xc9bb98);
  }
  a.box(-3.4, 0.7, 6.8, 2.6, 0.2, 1.4, WD);
  for (const sz of [-0.65, 0.65]) a.box(-3.4, 0.9, 6.8 + sz, 2.6, 0.4, 0.1, WD2);
  a.box(-4.65, 0.9, 6.8, 0.1, 0.4, 1.2, WD2);
  for (const sz of [-0.8, 0.8]) wheelXY(a, -3.6, 0.55, 6.8 + sz, 0.5, 0.1, K);
  for (const sz of [-0.5, 0.5]) a.box(-1.5, 0.65, 6.8 + sz, 1.4, 0.12, 0.12, WD2);
  a.box(-3.8, 0.9, 6.8, 0.8, 0.7, 0.6, SACK);
  a.box(-3.0, 0.9, 6.7, 0.7, 0.6, 0.6, SACK);
  for (const [x, z] of [[-5.9, 4.6], [-6.8, 5.6], [-5.8, 5.7]]) {
    round(a, x, 0, z, 0.8, 1.1, WD, 0x5a3a24);
    round(a, x, 0.2, z, 0.86, 0.12, K);
    round(a, x, 0.8, z, 0.86, 0.12, K);
  }
  round(a, 4.8, 0, 7.4, 1.8, 0.35, ST, ST2);
  a.box(4.8, 0.3, 7.4, 0.35, 0.1, 0.35, K);

  // домик мельника со ступенчатым фронтоном
  const HX = -8.3;
  const HZ = 0.4;
  a.box(HX, 0, HZ, 3.2, 2.6, 4.0, BR);
  a.box(HX, 0, HZ, 3.3, 0.4, 4.1, ST);
  for (let i = 0; i < 5; i++) a.box(HX, 2.6 + i * 0.5, HZ - 0.2, 3.4 - i * 0.7, 0.5, 3.8, i % 2 ? 0x454a50 : 0x3a3f45);
  for (let i = 0; i < 5; i++) {
    const w = 3.2 - i * 0.65;
    a.box(HX, 2.6 + i * 0.55, HZ + 2.0, w, 0.55, 0.3, BR2);
    a.box(HX, 3.15 + i * 0.55, HZ + 2.0, w + 0.1, 0.1, 0.34, W);
  }
  a.box(HX + 0.9, 4.6, HZ - 0.9, 0.6, 1.6, 0.6, BR2); // труба
  onFace(a, Math.PI / 2, 2.0, 0.6, 0.4, 0.9, 1.7, 0.12, SH, HX, HZ);
  onFace(a, Math.PI / 2, 2.0, 0.6, 2.1, 1.1, 0.14, 0.16, W, HX, HZ);
  windowOn(a, Math.PI / 2, 2.0, -0.8, 1.0, 0.6, 0.8, W, GL, null, HX, HZ);
  windowOn(a, Math.PI / 2, 2.15, 0, 3.4, 0.5, 0.6, W, GL, null, HX, HZ);
  windowOn(a, 0, 1.6, -0.8, 1.0, 0.7, 0.8, W, GL, SH, HX, HZ);
  windowOn(a, 0, 1.6, 0.9, 1.0, 0.7, 0.8, W, GL, SH, HX, HZ);
  a.solid(HX, HZ, 1.6, 2.0);
}

/* ---------- Остров Пасхи: шесть моаи на аху, упавший великан и голова, торчащая из земли ---------- */
function moai(a) {
  const S = 0x7a756c;
  const S2 = 0x676259;
  const S3 = 0x8a8478;
  const P = 0x8f8a80; // камни аху
  const P2 = 0x7f7a70;
  const DARK = 0x2e2a26;
  const RED = 0xa04a3a;
  const RED2 = 0x8a3e30;
  const LICHEN = 0xc9a24a; // жёлтый лишайник на камне
  // аху — платформа из подогнанных камней, впереди пологий пандус из гальки
  a.box(0, 0, 0, 26, 1.4, 5, P);
  for (let i = 0; i < 13; i++) a.box(-12 + i * 2, 0.2, -2.55, 1.8, 0.9 + (i % 3) * 0.12, 0.12, i % 2 ? P2 : S3);
  a.box(0, 0, -3.8, 24, 0.5, 2.6, P2);
  for (let i = 0; i < 16; i++) a.box(-11.5 + i * 1.5 + (i % 2) * 0.4, 0.5, -3.4 - (i % 3) * 0.6, 0.7, 0.25, 0.6, i % 2 ? S3 : P);

  // Голова моаи: смотрит в −z. y — низ головы, s — масштаб.
  const head = (x, y, z, s, eyes) => {
    a.box(x, y, z, 3 * s, 5.8 * s, 2.7 * s, S);
    a.box(x, y + 4.1 * s, z - 1.45 * s, 3.2 * s, 0.9 * s, 0.7 * s, S2); // тяжёлые брови
    for (const sx of [-1, 1]) {
      a.box(x + sx * 0.75 * s, y + 3.3 * s, z - 1.4 * s, 0.85 * s, 0.75 * s, 0.14, eyes ? 0xf2efe6 : DARK); // глазницы
      if (eyes) a.box(x + sx * 0.75 * s, y + 3.4 * s, z - 1.5 * s, 0.4 * s, 0.45 * s, 0.1, DARK);
      a.box(x + sx * 1.62 * s, y + 1.3 * s, z + 0.1 * s, 0.28 * s, 3.4 * s, 0.9 * s, S2); // длинные уши
      a.box(x + sx * 0.3 * s, y + 1.35 * s, z - 2.08 * s, 0.25 * s, 0.25 * s, 0.1, DARK); // ноздри
    }
    a.box(x, y + 1.3 * s, z - 1.7 * s, 1.0 * s, 2.8 * s, 0.7 * s, S2); // длинный нос
    a.box(x, y + 0.85 * s, z - 1.55 * s, 1.8 * s, 0.32 * s, 0.4 * s, S3); // верхняя губа
    a.box(x, y + 0.45 * s, z - 1.5 * s, 1.5 * s, 0.3 * s, 0.35 * s, S2); // нижняя губа
    a.box(x, y - 0.1 * s, z - 1.25 * s, 2 * s, 0.6 * s, 0.4 * s, S2); // подбородок
    a.box(x + 0.9 * s, y + 2.3 * s, z - 1.4 * s, 0.45 * s, 0.4 * s, 0.1, LICHEN);
    a.box(x - 1.2 * s, y + 4.9 * s, z + 0.3 * s, 0.5 * s, 0.4 * s, 0.1, LICHEN);
  };

  const statue = (x, s, pukao, eyes) => {
    const y = 1.4;
    a.box(x, y, 0, 3.2 * s, 3.4 * s, 2.3 * s, S); // тело
    for (const sx of [-1, 1]) {
      a.box(x + sx * 1.55 * s, y + 0.8 * s, -0.2 * s, 0.25 * s, 2.4 * s, 1.6 * s, S2); // руки вдоль тела
      a.box(x + sx * 0.6 * s, y + 0.9 * s, -1.2 * s, 1.0 * s, 0.25 * s, 0.14, S2); // длинные пальцы на животе
      a.box(x + sx * 0.6 * s, y + 1.25 * s, -1.2 * s, 1.0 * s, 0.12 * s, 0.12, S2);
    }
    const hy = y + 3.4 * s;
    a.box(x, hy - 0.4 * s, 0.1 * s, 2.7 * s, 1.0 * s, 2.2 * s, S2); // шея
    head(x, hy, 0, s, eyes);
    if (pukao) {
      round(a, x, hy + 5.8 * s, 0, 2.6 * s, 1.5 * s, RED, RED2); // красная шапка-пукао
      round(a, x, hy + 7.3 * s, 0, 1.2 * s, 0.4 * s, RED2);
    }
  };
  [0.9, 1.05, 1.15, 1.1, 1.0, 0.92].forEach((s, i) => statue(-10.5 + i * 4.2, s, i === 1 || i === 3 || i === 4, i === 2));
  a.solid(0, 0, 13, 2.5);

  // упавший моаи лицом вниз и откатившаяся шапка
  a.box(-4.5, 0, -8.6, 8.4, 2.2, 2.8, S2);
  a.box(-9.2, 0, -8.6, 1.4, 2.6, 3.2, S);
  for (const sz of [-1, 1]) a.box(-9.2, 0.5, -8.6 + sz * 1.7, 0.8, 1.4, 0.3, S2);
  a.box(-2, 2.2, -8.6, 2.2, 0.3, 1.4, LICHEN);
  round(a, 0.8, 0, -9.9, 2.4, 1.6, RED, RED2);
  a.solid(-5, -8.6, 4.8, 1.5);
  // голова в земле, как в каменоломне Рано-Рараку
  head(7, 0, -8.2, 0.8, false);
  a.solid(7, -8.2, 1.4);
  // трава у подножия
  for (const [x, z] of [[4.2, -7], [10, -9.5], [-11.5, -6.5], [2.4, -11], [11.8, -6.2]]) {
    for (let k = 0; k < 3; k++) a.box(x + (k - 1) * 0.3, 0, z + (k % 2) * 0.2, 0.15, 0.6 + k * 0.15, 0.15, 0x6fbf4a);
  }
}

/* ---------- Рио: Христос-Искупитель на скалистой горе Корковаду, в джунглях ---------- */
function christ(a) {
  const W = 0xe6e2d8;
  const W2 = 0xd4cfc2;
  const W3 = 0xc6c0b2;
  const ROCK = 0x7a7f84;
  const ROCK2 = 0x6a6f74;
  const ROCK3 = 0x8c9196;
  const JUNGLE = 0x4f8f3e;
  const JUNGLE2 = 0x437a35;
  // гора уступами: скала и джунгли вперемешку
  const levels = [[18, JUNGLE], [15.2, ROCK], [12.4, JUNGLE2], [9.8, ROCK2], [7.2, JUNGLE], [5.2, ROCK]];
  levels.forEach(([w, c], i) => round(a, 0, i * 3, 0, w, 3, c, i % 2 ? ROCK3 : JUNGLE2));
  // скальные выступы по склонам
  levels.forEach(([w], i) => {
    for (let k = 0; k < 6; k++) {
      const ang = k * 1.047 + i * 0.5;
      const r = w / 2 - 1.0;
      a.box(Math.cos(ang) * r, i * 3 - 0.2, Math.sin(ang) * r, 2.2, 2.4 + (k % 3) * 0.5, 1.6, k % 2 ? ROCK2 : ROCK3, -ang + 0.3);
    }
  });
  // деревья на полках
  for (let k = 0; k < 8; k++) {
    const ang = k * 0.785 + 0.4;
    tree(a, Math.cos(ang) * 8.2, 3, Math.sin(ang) * 8.2, 1.6, 1.8);
  }
  for (let k = 0; k < 5; k++) {
    const ang = k * 1.257 + 1;
    tree(a, Math.cos(ang) * 5.6, 9, Math.sin(ang) * 5.6, 1.4, 1.5);
  }

  // смотровая площадка с перилами
  const y = 18;
  a.box(0, y, 0, 5.2, 0.6, 5.2, W2);
  for (const [sx, sz] of SIDES) {
    for (let k = -2; k <= 2; k++) a.box(sx * 2.5 + sz * k * 1.2, y + 0.6, sz * 2.5 + sx * k * 1.2, 0.15, 0.7, 0.15, W3);
    a.box(sx * 2.5, y + 1.3, sz * 2.5, sz ? 5.1 : 0.15, 0.12, sz ? 0.15 : 5.1, W3);
  }
  // постамент-часовня в стиле ар-деко
  a.box(0, y + 0.6, 0, 3.0, 3.6, 3.0, W2);
  for (const [sx, sz] of CORNERS) a.box(sx * 1.35, y + 0.6, sz * 1.35, 0.5, 3.8, 0.5, W3);
  a.box(0, y + 0.6, -1.52, 1.0, 1.8, 0.1, 0x6a5a48);
  a.box(0, y + 4.2, 0, 3.2, 0.3, 3.2, W3);

  // статуя смотрит в −z: одеяние со складками, пояс, руки с широкими рукавами
  const s = y + 4.5;
  a.box(0, s, 0, 2.7, 1.2, 2.0, W); // подол
  a.box(0, s + 1.2, 0, 2.5, 3.0, 1.85, W);
  a.box(0, s + 4.2, 0, 2.2, 2.4, 1.7, W);
  for (const x of [-0.8, -0.25, 0.3, 0.85]) a.box(x, s, -0.98, 0.22, 5.4 - Math.abs(x) * 1.5, 0.12, W3);
  for (const x of [-0.6, 0.6]) a.box(x, s, 0.98, 0.22, 4.5, 0.12, W3);
  a.box(0, s + 4.0, 0, 2.3, 0.3, 1.8, W3, 0, 0, 0.12); // пояс
  a.box(0, s + 6.6, 0, 2.6, 1.6, 1.7, W); // грудь и плечи
  a.box(0, s + 6.9, 0, 13.5, 1, 1, W); // раскинутые руки
  for (const sx of [-1, 1]) {
    a.box(sx * 2.6, s + 5.6, 0, 2.2, 1.4, 0.9, W2); // рукав свисает
    a.box(sx * 4.2, s + 6.1, 0, 1.4, 0.9, 0.8, W2);
    a.box(sx * 6.55, s + 6.75, 0, 0.5, 1.2, 1.1, W); // ладонь
  }
  a.box(0, s + 7.3, -0.9, 0.6, 0.6, 0.1, W3); // сердце на груди
  // голова: волосы до плеч, нос, борода
  a.box(0, s + 8.2, 0, 0.7, 0.5, 0.7, W2);
  a.box(0, s + 8.6, 0, 1.25, 1.5, 1.25, W);
  a.box(0, s + 8.4, 0.2, 1.45, 1.4, 1.05, W2);
  a.box(0, s + 9.25, -0.66, 0.25, 0.45, 0.12, W3);
  a.box(0, s + 8.55, -0.55, 0.9, 0.45, 0.2, W2);
  a.solid(0, 0, 9);
}

/* ---------- Дубай: Бурдж-Халифа — Y-образная башня, крылья уступами по спирали, ленты окон, шпиль ---------- */
function burj(a) {
  const G1 = 0xa9c1d1;
  const G2 = 0x8fa9bb;
  const GLASS = 0x5a7890; // ленты окон
  const SILVER = 0xe4eaf0;
  const M = 0xd0d8e0;
  const STONE = 0xc9bfa8;
  const RED = 0xe0302a;
  const wings = [0, TAU / 3, (2 * TAU) / 3];
  // подиум с входами
  round(a, 0, 0, 0, 8.4, 0.6, STONE);
  let y = 0.6;
  for (let i = 0; i < 12; i++) {
    const h = 5.5 - i * 0.12;
    const core = 4.2 - i * 0.22;
    round(a, 0, y, 0, core, h, i % 2 ? G1 : G2);
    for (let b = 0.8; b < h - 0.3; b += 1.1) round(a, 0, y + b, 0, core + 0.08, 0.18, GLASS);
    wings.forEach((ang, k) => {
      const len = 7 - i * 0.55 - ((i + k) % 3) * 0.6;
      if (len < 0.4) return;
      const r = len / 2 + core / 2 - 0.4;
      const w = 2.8 - i * 0.1;
      const cx = Math.sin(ang) * r;
      const cz = Math.cos(ang) * r;
      a.box(cx, y, cz, w, h, len, i % 2 ? G2 : G1, ang);
      for (let b = 0.8; b < h - 0.3; b += 1.1) a.box(cx, y + b, cz, w + 0.08, 0.18, len + 0.04, GLASS, ang);
      // серебряное ребро на торце крыла и светлая терраса на уступе
      const tip = r + len / 2;
      a.box(Math.sin(ang) * tip, y, Math.cos(ang) * tip, 0.5, h, 0.3, SILVER, ang);
      a.box(cx, y + h - 0.12, cz, w + 0.15, 0.15, len + 0.1, SILVER, ang);
    });
    y += h;
  }
  // шпиль: серебряные сегменты, антенна, красный огонёк на макушке
  a.box(0, y, 0, 1.6, 1.2, 1.6, SILVER);
  a.box(0, y + 1.2, 0, 1.2, 5, 1.2, M);
  for (let k = 0; k < 4; k++) a.box(0, y + 2 + k * 1.1, 0, 1.28, 0.15, 1.28, GLASS);
  [0.8, 0.6, 0.45].forEach((w, k) => a.box(0, y + 6.2 + k * 3.6, 0, w, 3.6, w, k % 2 ? SILVER : M));
  a.box(0, y + 17, 0, 0.25, 2, 0.25, M);
  a.box(0, y + 19, 0, 0.45, 0.45, 0.45, RED);
  a.solid(0, 0, 7);
}

/* ---------- Япония: пятиярусная пагода, ворота-тории, каменные фонари и цветущая сакура ---------- */
function pagoda(a) {
  const WD = 0x5a3322;
  const WW = 0xeee8da;
  const VER = 0xc0392b; // киноварь
  const RF = 0x3a3f45; // черепица
  const RF2 = 0x4a5058;
  const G = 0xd9a534;
  const STONE = 0x9a8f7a;
  const STONE2 = 0x8a8070;
  const DARK = 0x2e2e30;
  // каменное основание и ступени на все стороны
  a.box(0, 0, 0, 11, 1.2, 11, STONE);
  a.box(0, 1.2, 0, 9.4, 0.3, 9.4, STONE2);
  for (const phi of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    for (let k = 0; k < 3; k++) onFace(a, phi, 5.5, 0, 0, 2.4, 1.2 - k * 0.4, 0.5 + k * 0.5, STONE2);
  }
  let y = 1.5;
  [7.5, 6.8, 6.1, 5.4, 4.7].forEach((w, i) => {
    const h = 2.4;
    a.box(0, y, 0, w, h, w, WW);
    for (const [sx, sz] of CORNERS) a.box((sx * w) / 2, y, (sz * w) / 2, 0.5, h, 0.5, VER);
    for (const phi of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      for (const s of [-w * 0.22, w * 0.22]) onFace(a, phi, w / 2, s, y, 0.35, h, 0.12, VER); // колонны
      onFace(a, phi, w / 2, 0, y + 0.2, w * 0.26, h - 0.6, 0.1, WD); // решётчатая дверь
      for (const dy of [0.6, 1.1, 1.6]) onFace(a, phi, w / 2, 0, y + dy, w * 0.26, 0.07, 0.14, VER);
      onFace(a, phi, w / 2, 0, y + h - 0.35, w + 0.4, 0.35, 0.4, WD); // пояс кронштейнов
      for (let k = -2; k <= 2; k++) onFace(a, phi, w / 2, (k * w) / 5, y + h - 0.5, 0.3, 0.3, 0.7, VER);
    }
    if (i === 0) {
      // галерея с перилами вокруг нижнего яруса
      a.box(0, y, 0, w + 1.6, 0.25, w + 1.6, WD);
      for (const phi of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) onFace(a, phi, w / 2 + 0.7, 0, y + 0.8, w + 1.5, 0.12, 0.12, VER);
    }
    // широкая крыша: стропила снизу, три слоя черепицы, загнутые углы с колокольчиками
    const e = w + 3.6;
    a.box(0, y + h - 0.15, 0, e - 0.6, 0.15, e - 0.6, WD);
    a.box(0, y + h, 0, e, 0.35, e, RF);
    a.box(0, y + h + 0.35, 0, w + 2.4, 0.35, w + 2.4, RF2);
    a.box(0, y + h + 0.7, 0, w + 1.2, 0.3, w + 1.2, RF);
    for (const [sx, sz] of CORNERS) {
      a.box((sx * e) / 2, y + h + 0.2, (sz * e) / 2, 0.9, 0.5, 0.9, RF);
      a.box(sx * (e / 2 + 0.3), y + h + 0.5, sz * (e / 2 + 0.3), 0.5, 0.45, 0.5, RF2);
      a.box((sx * e) / 2, y + h - 0.55, (sz * e) / 2, 0.25, 0.4, 0.25, G); // колокольчик
    }
    y += 3.4;
  });
  // шпиль сорин: девять колец, «пламя» и жемчужина
  a.box(0, y, 0, 1.4, 0.6, 1.4, RF);
  a.box(0, y + 0.6, 0, 0.5, 7, 0.5, G);
  for (let r = 0; r < 9; r++) round(a, 0, y + 1.2 + r * 0.6, 0, 1.3, 0.2, G);
  for (const s of [-1, 1]) a.box(s * 0.45, y + 6.8, 0, 0.3, 0.8, 0.12, G, 0, 0, s * 0.4);
  a.box(0, y + 7.6, 0, 0.9, 0.9, 0.9, G);
  a.solid(0, 0, 4.5);

  // тории: киноварные столбы, чёрная верхняя балка с загнутыми краями, табличка
  const tz = -8.6;
  for (const sx of [-1, 1]) {
    a.box(sx * 2.6, 0, tz, 0.8, 0.5, 0.8, DARK);
    a.box(sx * 2.6, 0.5, tz, 0.7, 5.0, 0.7, VER);
    a.box(sx * 3.9, 5.75, tz, 0.8, 0.4, 1.1, DARK, 0, 0, sx * -0.25);
    a.solid(sx * 2.6, tz, 0.5);
  }
  a.box(0, 5.5, tz, 7.2, 0.6, 1.1, DARK);
  a.box(0, 5.1, tz, 6.6, 0.4, 0.8, VER);
  a.box(0, 4.0, tz, 6.2, 0.45, 0.6, VER);
  a.box(0, 4.45, tz, 0.9, 0.65, 0.2, DARK);
  a.box(0, 4.55, tz - 0.12, 0.6, 0.45, 0.06, G);
  // каменные фонари вдоль дорожки
  for (const sx of [-1, 1]) {
    const x = sx * 2.8;
    const z = -5.8;
    a.box(x, 0, z, 1, 0.3, 1, STONE2);
    a.box(x, 0.3, z, 0.35, 1.3, 0.35, STONE);
    a.box(x, 1.6, z, 0.9, 0.2, 0.9, STONE2);
    a.box(x, 1.8, z, 0.7, 0.6, 0.7, 0xffe7a0);
    a.box(x, 2.4, z, 1.2, 0.25, 1.2, STONE2);
    a.box(x, 2.65, z, 0.4, 0.3, 0.4, STONE);
    a.solid(x, z, 0.5);
  }
  // цветущая сакура
  for (const [x, z] of [[-7.2, 6], [7.2, 5.5], [-7.4, -4.5]]) {
    a.box(x, 0, z, 0.5, 2.2, 0.5, 0x5a3a28);
    a.box(x + 0.4, 1.6, z, 0.8, 0.25, 0.25, 0x5a3a28, 0, 0, 0.6);
    a.box(x, 2.2, z, 3, 1.4, 3, 0xf4b8d0);
    a.box(x + 0.3, 3.6, z - 0.2, 2, 0.9, 2, 0xf9cfe0);
    a.box(x - 0.9, 2.4, z + 0.8, 1.2, 0.8, 1.2, 0xeaa2c0);
    a.solid(x, z, 0.4);
  }
}

export { windmill, moai, christ, burj, pagoda };
