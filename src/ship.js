import * as THREE from 'three';
import { cube, lambert, glow } from './voxel.js';

const HULL = 0x8a5c34;
const HULL_DK = 0x6d4728;
const RAIL = 0x5a3a20;
const DECK = 0x9c6d44;
const DARK = 0x3b2a18;
const BONE = 0xf0ece0;
const INK = 0x22201c;
const IRON = 0x8d949a;
const GUN = 0x2e2e30;
const GOLD = 0xf6c944;
const SKIN = 0xf0c49a;

// Цвет парусов растёт вместе с улучшением «Паруса».
const SAIL_COLORS = [
  [0x7d5eb8, 0x6b4fa0], // фиолетовые
  [0xc0453a, 0xa3362d], // красные
  [0x3a6fc0, 0x2f5aa0], // синие
  [0xe8b830, 0xd49b1f], // золотые
];

// Цвет флага выбирается в порту.
export const FLAG_COLORS = [
  { id: 'black', color: 0x1d1813 },
  { id: 'red', color: 0xc0392b },
  { id: 'blue', color: 0x2f6ac0 },
  { id: 'green', color: 0x3f9f4a },
  { id: 'purple', color: 0x8a4fc0 },
  { id: 'pink', color: 0xf07ab8 },
  { id: 'orange', color: 0xf08a24 },
  { id: 'gold', color: 0xf6c944 },
  { id: 'white', color: 0xf4f1e8 },
];

// Габариты для столкновений (корабль смотрит носом в −z).
export const DECK_Y = 0.7;
export const SHIP_HALF_WIDTH = 3.8;
export const SHIP_BOW_Z = -10;
export const SHIP_STERN_Z = 7.5;
// точки корпуса (x, z в координатах корабля): если любая над сушей — упёрлись
export const HULL_POINTS = [
  [0, -10.6], [0, 7.6], [-2, -8.5], [2, -8.5],
  [-3.6, -5], [3.6, -5], [-3.6, 0], [3.6, 0], [-3.6, 5], [3.6, 5],
];

export function createShip(scene) {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ'; // сначала курс, потом качка — крен остаётся креном при любом курсе

  // корпус ступеньками к килю
  for (let i = 0; i < 3; i++) {
    cube(g, i === 0 ? HULL : HULL_DK, 7 - i * 0.8, 1.2, 15 - i * 1.2, 0, -0.6 - i * 1.2, 0);
  }
  // нос и бушприт
  cube(g, HULL, 5, 2.8, 1.4, 0, 0.2, -8.8);
  cube(g, HULL_DK, 2.6, 2.2, 1.2, 0, 0.3, -10.1);
  cube(g, RAIL, 0.6, 0.6, 5, 0, 1.9, -11.6).rotation.x = 0.3;
  // иллюминаторы
  for (const z of [-4, 0, 4]) {
    cube(g, DARK, 0.2, 0.7, 0.7, -3.55, -0.6, z);
    cube(g, DARK, 0.2, 0.7, 0.7, 3.55, -0.6, z);
  }

  // палуба и борта
  cube(g, DECK, 7.6, 1, 15.4, 0, 0.2, 0);
  cube(g, RAIL, 7.6, 1.6, 1, 0, 1.1, -7.6);
  cube(g, RAIL, 7.6, 1.6, 1, 0, 1.1, 7.6);
  cube(g, RAIL, 1, 1.6, 15.4, -3.4, 1.1, 0);
  cube(g, RAIL, 1, 1.6, 15.4, 3.4, 1.1, 0);

  // кормовая надстройка со штурвалом и фонарями
  cube(g, 0x7a5230, 6, 1.6, 4, 0, 1.5, 5.6);
  cube(g, RAIL, 0.4, 1.0, 0.4, 0, 2.8, 4.5);
  cube(g, DARK, 1.6, 1.6, 0.3, 0, 3.7, 4.5);
  cube(g, 0xc9a13f, 0.4, 0.4, 0.4, 0, 3.7, 4.5);
  for (const x of [-2.6, 2.6]) {
    cube(g, 0xffb347, 0.5, 0.6, 0.5, x, 2.7, 7.2);
    glow(g, 0xffb347, 2.6, x, 2.7, 7.2, 0.45);
    cube(g, DARK, 0.7, 0.2, 0.7, x, 3.1, 7.2);
  }

  // Мачта. Паруса подняты выше камеры — не закрывают море впереди.
  cube(g, RAIL, 1.2, 24.3, 1.2, 0, DECK_Y + 24.3 / 2, -1);
  cube(g, RAIL, 10, 0.8, 0.8, 0, 18.9, -1);
  cube(g, RAIL, 7.5, 0.8, 0.8, 0, 22.3, -1);
  const mainSail = cube(g, SAIL_COLORS[0][0], 9, 4.6, 0.6, 0, 16.2, -0.1);
  const topSail = cube(g, SAIL_COLORS[0][1], 6.5, 2.6, 0.6, 0, 20.6, -0.1);

  // череп на гроте — со стороны кормы, чтобы его было видно из камеры
  cube(g, BONE, 2.2, 2.2, 0.3, 0, 16.8, 0.35);
  cube(g, INK, 0.6, 0.6, 0.3, -0.6, 17.1, 0.45);
  cube(g, INK, 0.6, 0.6, 0.3, 0.6, 17.1, 0.45);
  cube(g, INK, 0.5, 0.9, 0.3, 0, 15.9, 0.45);
  cube(g, BONE, 2.6, 0.5, 0.3, 0, 15.3, 0.35);

  // флаг на шарнире у мачты — развевается; череп смотрит в сторону кормы (в камеру)
  const flag = new THREE.Group();
  flag.position.set(0.6, 24, -1);
  g.add(flag);
  const cloth = cube(flag, FLAG_COLORS[0].color, 3.2, 1.8, 0.3, 1.6, 0, 0);
  const skull = [
    cube(flag, BONE, 0.8, 0.7, 0.1, 1.6, 0.15, 0.2),
    cube(flag, BONE, 0.5, 0.25, 0.1, 1.6, -0.3, 0.2),
    cube(flag, BONE, 1.4, 0.2, 0.1, 1.6, -0.6, 0.2),
  ];
  cube(flag, INK, 0.2, 0.2, 0.1, 1.42, 0.2, 0.26);
  cube(flag, INK, 0.2, 0.2, 0.1, 1.78, 0.2, 0.26);

  function setFlag(id) {
    const c = (FLAG_COLORS.find((f) => f.id === id) ?? FLAG_COLORS[0]).color;
    cloth.material = lambert(c);
    // на светлом флаге белый череп не видно — делаем его тёмным
    const light = c === 0xf4f1e8 || c === 0xf6c944;
    for (const m of skull) m.material = lambert(light ? 0x3a3530 : BONE);
  }

  // сюда складываются детали от улучшений — пересобираются при покупке
  const parts = new THREE.Group();
  g.add(parts);
  let muzzles = [];

  function addCannon(x, y, z, fancy) {
    cube(parts, HULL_DK, 1, 0.6, 1.2, x, y, z);
    cube(parts, GUN, 0.6, 0.6, 2.2, x, y + 0.6, z - 0.8);
    if (fancy) cube(parts, GOLD, 0.75, 0.75, 0.3, x, y + 0.6, z - 1.7);
    muzzles.push(new THREE.Vector3(x, y + 0.6, z - 2));
  }

  // Всё купленное в порту видно прямо на корабле.
  function setUpgrades(up) {
    parts.clear();
    muzzles = [];
    if (up.cannons >= 1) {
      addCannon(-0.9, 1.0, -6.6, up.cannons >= 2);
      addCannon(0.9, 1.0, -6.6, up.cannons >= 2);
    }
    if (up.cannons >= 3) {
      addCannon(-3.4, 2.2, -3.2, true);
      addCannon(3.4, 2.2, -3.2, true);
    }
    // железные обручи на корпусе
    [-5.8, -2, 2].slice(0, up.hull).forEach((z) => cube(parts, IRON, 7.3, 1.35, 0.5, 0, -0.6, z));
    const [main, top] = SAIL_COLORS[up.sails] ?? SAIL_COLORS[0];
    mainSail.material = lambert(main);
    topSail.material = lambert(top);
    // золотая фигура на носу — магнит
    if (up.magnet >= 1) {
      const s = 0.5 + up.magnet * 0.3;
      cube(parts, GOLD, s, s, s, 0, 1.4 + s / 2, -10.3);
      if (up.magnet >= 3) cube(parts, 0xd8453a, 0.4, 0.4, 0.4, 0, 1.6 + s, -10.3);
    }
  }

  scene.add(g);

  // lean — крен от поворота руля; остальное — лёгкая качка.
  function animate(t, lean) {
    g.rotation.z = lean + Math.sin(t * 1.7) * 0.02;
    g.rotation.x = Math.sin(t * 1.2) * 0.025;
    g.position.y = Math.sin(t * 1.5) * 0.35;
    mainSail.rotation.z = Math.sin(t * 2) * 0.02;
    topSail.rotation.z = Math.sin(t * 2.3) * 0.02;
    flag.rotation.y = Math.sin(t * 2.6) * 0.18;
  }

  // золотой кубок на корме — за победу над Кракеном
  const trophy = new THREE.Group();
  trophy.position.set(0, 2.3, 6.6);
  cube(trophy, GOLD, 1.0, 0.25, 1.0, 0, 0, 0);
  cube(trophy, GOLD, 0.3, 0.6, 0.3, 0, 0.4, 0);
  cube(trophy, GOLD, 1.2, 0.9, 1.2, 0, 1.1, 0);
  for (const sx of [-1, 1]) cube(trophy, GOLD, 0.2, 0.6, 0.2, sx * 0.75, 1.2, 0);
  trophy.visible = false;
  g.add(trophy);

  return { group: g, animate, setUpgrades, setFlag, setTrophy: (on) => (trophy.visible = on), muzzles: () => muzzles };
}

// Вражеский бриг: тёмное дерево, чёрный парус с черепом. Нос смотрит на игрока (+z).
export function createEnemyShip() {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  const body = new THREE.Group();
  g.add(body);

  for (let i = 0; i < 2; i++) {
    cube(body, i ? 0x2e2118 : 0x3d2b1f, 5 - i * 0.8, 1.2, 10 - i * 1.2, 0, -0.6 - i * 1.2, 0);
  }
  cube(body, 0x4a3526, 5.4, 0.8, 10.4, 0, 0.3, 0);
  cube(body, 0x2e2118, 5.4, 1.2, 0.8, 0, 1.2, -5.2);
  cube(body, 0x2e2118, 5.4, 1.2, 0.8, 0, 1.2, 5.2);
  cube(body, 0x2e2118, 0.8, 1.2, 10.4, -2.3, 1.2, 0);
  cube(body, 0x2e2118, 0.8, 1.2, 10.4, 2.3, 1.2, 0);
  cube(body, 0x2e2118, 3, 2, 1.2, 0, 0.4, -5.9);
  cube(body, GUN, 0.5, 0.5, 1.6, 0, 1.3, -5.8);

  cube(body, RAIL, 0.8, 12, 0.8, 0, 6.7, 0.5);
  cube(body, RAIL, 7, 0.6, 0.6, 0, 10.3, 0.5);
  cube(body, 0x1d1b1a, 6, 4.2, 0.4, 0, 8, 0.1);
  // череп на стороне паруса, которая после разворота смотрит на игрока
  cube(body, 0xd8d2c4, 1.8, 1.8, 0.2, 0, 8.4, -0.2);
  cube(body, 0x1d1b1a, 0.5, 0.5, 0.2, -0.45, 8.6, -0.3);
  cube(body, 0x1d1b1a, 0.5, 0.5, 0.2, 0.45, 8.6, -0.3);
  cube(body, 0xd8d2c4, 2.4, 0.4, 0.2, 0, 7, -0.2);
  cube(body, 0xb8322a, 2, 1.2, 0.2, 1.1, 12.2, 0.5);

  // пират в красной бандане
  cube(body, 0x7a2a24, 1.1, 1.4, 0.7, 0, 1.4, -3.2);
  cube(body, SKIN, 1, 1, 0.9, 0, 2.6, -3.2);
  cube(body, 0xb8322a, 1.1, 0.35, 1.0, 0, 3.15, -3.2);

  body.rotation.y = Math.PI;
  return g;
}
