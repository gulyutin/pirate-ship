import * as THREE from 'three';
import { cube, TAU, Q, CORNERS, SIDES, GOLD, WATER, round, stack, dome, sphere, beam, archFill, yawAlong } from './kit.js';

// Европа (часть 1)

/* Париж: Триумфальная арка */
function arcTriomphe(a) {
  const S = 0xe3dac6;
  const S2 = 0xcfc5ae;
  // шире, чем выше, с огромным проёмом посередине
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      a.box(sx * 6, 0, sz * 2.8, 6, 10, 4, S);
      a.solid(sx * 6, sz * 2.8, 3, 2);
    }
    a.box(sx * 6, 2, 4.85, 3.6, 5, 0.2, S2); // рельефы
    a.box(sx * 6, 2, -4.85, 3.6, 5, 0.2, S2);
  }
  archFill(a, 0, 0, 0, 6, 9.4, 10, 9.6, S); // большой проём
  for (const sx of [-1, 1]) archFill(a, sx * 6, 0, 0, 1.6, 6, 10, 6, S, false); // боковые проёмы
  a.box(0, 10, 0, 18, 4, 9.6, S);
  a.box(0, 11, 4.85, 16, 1.2, 0.2, S2); // фриз
  a.box(0, 11, -4.85, 16, 1.2, 0.2, S2);
  a.box(0, 14, 0, 18.4, 0.8, 10, S2);
  a.box(0, 14.8, 0, 17.6, 1.6, 9.2, S);
}

/* Париж: собор Нотр-Дам */
function notreDame(a) {
  const S = 0xd9cfb4;
  const S2 = 0xc2b89c;
  const D = 0x3b3a44;
  const LEAD = 0x6a7078;
  a.box(0, 0, 4, 10, 12, 16, S);
  [9.6, 7.4, 5.2, 3].forEach((w, i) => a.box(0, 12 + i * 1.4, 4, w, 1.4, 16, LEAD));
  a.box(0, 0, -4.5, 14, 14, 3, S);
  for (const sx of [-1, 1]) {
    a.box(sx * 4.5, 14, -4.5, 5, 8, 3, S);
    for (const o of [-1, 1]) a.box(sx * 4.5 + o * 1, 15, -6.05, 1, 5, 0.2, D);
    for (let i = 0; i < 4; i++) a.box(sx * 6.5, 3, -0.5 + i * 3.5, 0.8, 7, 0.8, S2, 0, 0, sx * 0.5); // аркбутаны
  }
  a.box(0, 12.6, -6.05, 14, 0.6, 0.2, S2);
  a.box(0, 5.5, -6.05, 4, 4, 0.2, 0x5a6a9a); // окно-роза
  a.box(0, 5.5, -6.05, 4, 4, 0.2, 0x8a5a9a, 0, 0, Q);
  a.box(0, 6.9, -6.12, 1.2, 1.2, 0.2, 0xe8c050);
  for (const x of [-4.5, 0, 4.5]) {
    a.box(x, 0, -6.05, 2.4, 4.5, 0.2, D);
    a.box(x, 4.5, -6.05, 1.4, 1, 0.2, D);
  }
  round(a, 0, 17.6, 6, 1.6, 2, LEAD);
  stack(a, 0, 19.6, 6, [1.2, 0.9, 0.6, 0.4, 0.25], 2.2, LEAD);
  a.solid(0, 1, 7, 9);
}

/* Париж: Лувр со стеклянной пирамидой */
function louvre(a) {
  const G = 0x9fc4d8;
  const G2 = 0x7fa8c0;
  const S = 0xd9cfb8;
  const R = 0x5a6470;
  for (let i = 0; i < 8; i++) a.box(0, i * 1.2, 0, 12 - i * 1.5, 1.2, 12 - i * 1.5, i % 2 ? G : G2);
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) a.box(sx * 8, i * 0.8, 3, 3 - i, 0.8, 3 - i, G);
    a.box(sx * 5, 0, -5, 5, 0.3, 3, WATER); // фонтаны
  }
  a.solid(0, 0, 6);
  a.box(0, 0, 12, 30, 7, 4, S);
  a.box(0, 7, 12, 30, 2, 4, R);
  for (const sx of [-1, 1]) {
    a.box(sx * 13, 0, 3, 4, 7, 16, S);
    a.box(sx * 13, 7, 3, 4, 2, 16, R);
    a.solid(sx * 13, 3, 2, 8);
  }
  for (let i = 0; i < 12; i++) a.box(-11 + i * 2, 2, 9.95, 0.8, 3, 0.2, 0x3a4a5a);
  a.solid(0, 12, 15, 2);
}

/* Франция: Мон-Сен-Мишель — аббатство на скале */
function montStMichel(a) {
  const R = 0x8f8a80;
  const S = 0xc9bea6;
  const ROOF = 0x4a5058;
  stack(a, 0, 0, 0, [20, 17, 14, 11, 8], 2.5, R, 0x6f7f6a);
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * TAU;
    a.box(Math.cos(ang) * 9.6, 0, Math.sin(ang) * 9.6, 3.2, 3, 1.2, S, yawAlong(-Math.sin(ang), Math.cos(ang)));
  }
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * TAU;
    const r = i % 2 ? 7.2 : 5.8;
    const y = i % 2 ? 2.5 : 5;
    a.box(Math.cos(ang) * r, y, Math.sin(ang) * r, 1.8, 2, 1.8, 0xe6dcc6);
    a.box(Math.cos(ang) * r, y + 2, Math.sin(ang) * r, 2.1, 0.7, 2.1, ROOF);
  }
  a.box(0, 12.5, 0, 7, 5, 9, S);
  a.box(0, 17.5, 0, 6, 1.5, 9.4, ROOF);
  a.box(0, 17.5, 0, 3, 5, 3, S);
  const top = stack(a, 0, 22.5, 0, [2.4, 1.8, 1.3, 0.9, 0.5, 0.3], 2, ROOF);
  a.box(0, top, 0, 0.4, 1.4, 0.4, GOLD);
  a.solid(0, 0, 10);
}

/* Лондон: Тауэрский мост */
function towerBridge(a) {
  const S = 0xcfc3a6;
  const S2 = 0xb8ac90;
  const B = 0x5f8fb8;
  const R = 0x4a5058;
  a.box(0, 0, 0, 7, 0.3, 12, WATER);
  for (const sx of [-1, 1]) {
    a.box(sx * 6, 0, 0, 5, 16, 5, S);
    for (const [cx, cz] of CORNERS) {
      a.box(sx * 6 + cx * 2.3, 0, cz * 2.3, 1.2, 18, 1.2, S2);
      stack(a, sx * 6 + cx * 2.3, 18, cz * 2.3, [1.2, 0.7, 0.3], 0.9, R);
    }
    stack(a, sx * 6, 16, 0, [4.4, 3.2, 2], 1.5, R);
    a.box(sx * 6, 6, 2.55, 1.2, 3, 0.2, 0x3a4050);
    a.box(sx * 6, 10, 2.55, 1.2, 3, 0.2, 0x3a4050);
    for (const z of [-2, 2]) a.box(sx * 11.7, 7.75, z, 11, 0.5, 0.5, B, 0, 0, -sx * 0.75); // цепи
    a.solid(sx * 6, 0, 2.6);
  }
  a.box(0, 3, 0, 7.2, 0.8, 4, S2);
  for (const z of [-1.3, 1.3]) a.box(0, 12.5, z, 7.2, 1.6, 1.2, B); // верхние галереи
}

/* Лондон: колесо обозрения «Лондонский глаз» (крутится) */
function londonEye(a) {
  const W = 0xf0f0f0;
  const SLV = 0xc8ccd0;
  for (const sx of [-1, 1]) a.box(sx * 2.6, 0, 2.2, 0.9, 17.5, 0.9, SLV, 0, 0.12, sx * 0.15);
  const R = 15;
  const hub = a.group(0, 17.5, 0);
  cube(hub, SLV, 1.4, 1.4, 2);
  for (let i = 0; i < 32; i++) {
    const g = new THREE.Group();
    g.rotation.z = (i / 32) * TAU;
    hub.add(g);
    cube(g, W, 3, 0.4, 0.4, 0, R, 0);
    cube(g, SLV, 0.12, R, 0.12, 0, R / 2, 0.3);
    if (i % 2 === 0) cube(g, 0xd8e4ea, 1.4, 1, 2.2, 0, R + 0.9, 0);
  }
  hub.userData.spin = 0.12;
  a.solid(0, 1, 3, 2.5);
}

/* Берлин: Бранденбургские ворота с квадригой */
function brandenburg(a) {
  const S = 0xe0d6bc;
  const S2 = 0xcabfa2;
  const BR = 0x4f6a5a;
  a.box(0, 0, 0, 16, 0.6, 5, S2);
  for (let i = 0; i < 6; i++) {
    const x = -6.5 + i * 2.6;
    for (const z of [-1.6, 1.6]) round(a, x, 0.6, z, 1.1, 8, S);
    a.box(x, 0.6, 0, 1, 8, 3.2, S2);
    a.solid(x, 0, 0.6, 2);
  }
  a.box(0, 8.6, 0, 16, 1.6, 5, S);
  a.box(0, 10.2, 0, 10, 1.8, 4, S);
  for (let i = 0; i < 4; i++) {
    const x = -1.6 + i * 1.07;
    a.box(x, 12, -0.4, 0.6, 1.1, 2, BR);
    a.box(x, 12.8, -1.5, 0.5, 1, 0.7, BR, 0, 0.4);
  }
  a.box(0, 12, 1.2, 2.6, 1.2, 1.2, BR);
  a.box(0, 13.2, 1.2, 0.8, 2.2, 0.8, BR);
  a.box(0.6, 13.2, 1.2, 0.2, 3.4, 0.2, BR);
}

/* Германия: замок Нойшванштайн */
function neuschwanstein(a) {
  const W = 0xefebe2;
  const B = 0x3f5a8a;
  const B2 = 0x344c78;
  stack(a, 0, 0, 0, [20, 16, 12], 2.6, 0x8f8a80, 0x3f7a3a);
  const y = 7.8;
  a.box(0, y, 2, 12, 12, 5, W);
  a.box(0, y + 12, 2, 12.4, 1.5, 5.4, B);
  a.box(0, y + 13.5, 2, 3.6, 1.2, 5, B2);
  for (let i = 0; i < 5; i++) a.box(-4 + i * 2, y + 3, -0.55, 0.8, 5, 0.2, 0x3a4050);
  round(a, -6.5, y, 2, 3, 18, W);
  stack(a, -6.5, y + 18, 2, [3.4, 2.6, 1.8, 1.1, 0.5], 1.8, B, B2);
  round(a, 4, y, -3, 2.2, 12, W);
  stack(a, 4, y + 12, -3, [2.6, 1.8, 1, 0.4], 1.5, B, B2);
  round(a, -2, y, -4, 2.6, 9, W);
  stack(a, -2, y + 9, -4, [3, 2.1, 1.2, 0.5], 1.4, B, B2);
  a.box(3, y, -6, 5, 5, 3, 0xc9866a);
  a.solid(0, 0, 10);
}

/* Кёльн: собор с двумя шпилями */
function cologne(a) {
  const D = 0x5a5650;
  const D2 = 0x4a4640;
  a.box(0, 0, 5, 10, 14, 16, D);
  [9, 6.5, 4, 1.6].forEach((w, i) => a.box(0, 14 + i * 1.3, 5, w, 1.3, 16, D2));
  a.box(0, 0, -5, 3, 18, 5, D);
  for (const sx of [-1, 1]) {
    a.box(sx * 4, 0, -5, 5, 24, 5, D);
    for (const o of [-2.2, 0, 2.2]) a.box(sx * 4 + o, 0, -7.55, 0.4, 24, 0.2, D2);
    round(a, sx * 4, 24, -5, 4, 6, D, D2);
    const top = stack(a, sx * 4, 30, -5, [3.4, 2.9, 2.4, 1.9, 1.5, 1.1, 0.8, 0.5, 0.3], 2.4, D, D2);
    a.box(sx * 4, top, -5, 0.6, 1, 0.6, D2);
  }
  a.box(0, 0, -7.55, 3, 7, 0.2, 0x2a2f3a);
  a.box(0, 9, -7.55, 2.4, 8, 0.2, 0x4a5a8a);
  a.solid(0, 1, 7, 9);
}

/* Барселона: Саграда Фамилия (и кран — её всё ещё строят) */
function sagrada(a) {
  const S = 0xc9b48f;
  const S2 = 0xb39e78;
  const TIPS = [0xd8453a, 0xe8b830, 0x3a6fc0, 0x4f9c5a];
  const spindle = (x, z, h, tip) => {
    const n = Math.round(h / 2);
    for (let i = 0; i < n; i++) round(a, x, i * 2, z, 2.4 - (i / n) * 1.8, 2, i % 3 ? S : S2);
    a.box(x, n * 2, z, 1, 1, 1, tip);
    a.box(x, n * 2, z, 1, 1, 1, tip, Q, Q);
  };
  a.box(0, 0, 3, 12, 12, 16, S);
  for (let i = 0; i < 4; i++) spindle(-4.5 + i * 3, -5, i === 1 || i === 2 ? 30 : 26, TIPS[i]);
  for (const [sx, sz] of CORNERS) spindle(sx * 3, 4 + sz * 3, 32, TIPS[(sx + sz + 4) % 4]);
  spindle(0, 4, 40, 0xf0ece0);
  a.box(0, 40.8, 4, 0.3, 2, 0.3, 0xf0ece0); // крест
  a.box(0, 41.6, 4, 1.4, 0.3, 0.3, 0xf0ece0);
  a.box(8, 0, 9, 1, 40, 1, 0xe8b830); // башенный кран
  a.box(10.5, 40, 9, 11, 0.8, 0.8, 0xe8b830);
  a.box(6, 40, 9, 3, 1.2, 1.2, 0x666666);
  a.box(14.5, 33, 9, 0.1, 7, 0.1, 0x333333);
  a.solid(0, 3, 6, 8);
  a.solid(8, 9, 0.8);
}

/* Брюссель: Атомиум — кристалл железа, увеличенный в миллиарды раз */
function atomium(a) {
  const M = 0xd0d6dc;
  const M2 = 0xb4bcc4;
  const T = 0xa8b0b8;
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
  for (const p of [...pts, center]) sphere(a, p[0], p[1] - 1.8, p[2], 1.8, M, M2);
  const low = [...pts].sort((p1, p2) => p1[1] - p2[1]).slice(1, 4);
  for (const p of low) beam(a, [p[0] * 1.3, 0, p[2] * 1.3], p, 0.9, T); // опоры
  a.solid(0, 0, 3);
}

export const EUROPE = [
  { id: 'arc', name: 'Триумфальная арка', country: 'Франция', size: 7.5, build: arcTriomphe },
  { id: 'notredame', name: 'Собор Парижской Богоматери', country: 'Франция', size: 12, build: notreDame },
  { id: 'louvre', name: 'Лувр', country: 'Франция', size: 16, build: louvre },
  { id: 'michel', name: 'Мон-Сен-Мишель', country: 'Франция', size: 10.5, build: montStMichel },
  { id: 'towerbridge', name: 'Тауэрский мост', country: 'Великобритания', size: 17.5, build: towerBridge },
  { id: 'londoneye', name: 'Лондонский глаз', country: 'Великобритания', size: 16, build: londonEye },
  { id: 'brandenburg', name: 'Бранденбургские ворота', country: 'Германия', size: 8.5, build: brandenburg },
  { id: 'neuschwanstein', name: 'Замок Нойшванштайн', country: 'Германия', size: 10, build: neuschwanstein },
  { id: 'cologne', name: 'Кёльнский собор', country: 'Германия', size: 13, build: cologne },
  { id: 'sagrada', name: 'Саграда Фамилия', country: 'Испания', size: 15, build: sagrada },
  { id: 'atomium', name: 'Атомиум', country: 'Бельгия', size: 10.5, build: atomium },
];
