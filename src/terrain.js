import * as THREE from 'three';
import { voxelize, TEX, glow } from './voxel.js';
import { LANDMARKS } from './landmarks/index.js';
import { SECRETS } from './landmarks/secret.js';
import { EXTRA } from './landmarks/extra.js';

// Суша: острова из блоков с чудесами света, причал и постройки порта.
// Зерно фиксированное — мир одинаковый при каждом запуске, как карта в Minecraft.

export const B = 2; // размер блока суши
export const SEA_Y = -1.6; // верх воды в покое
const FLOOR_Y = -9; // дно, до которого тянутся колонны
const PLATEAU_H = 3; // высота плато под чудом света, в блоках
const VIEW_DIST = 210; // дальше острова скрыты дымкой — их можно не рисовать
const SEED = 20260911;

export const PORT = { x: 0, z: 0, r: 24 };
export const DOCK = { x: 9, z: 36, heading: Math.PI }; // стоянка у причала, носом в море
export const HOME = { x: -100, z: -34, r: 20 }; // свой остров — недалеко от порта

const TOP = { sand: 0xe3d38f, grass: 0x5fa044, stone: 0x8a8f94 };
const BODY = { sand: 0xd4bf78, grass: 0x8b5a2b, stone: 0x6f7479, plaza: 0x9a9282 };
const PLAZA = [0xcfc7b4, 0xbdb4a0]; // плитка площади шахматкой
// Поверхность острова под стать чуду: снег у полюса, песок в пустыне, красная земля в Австралии.
const THEMES = {
  snow: { top: { sand: 0xe8eef2, grass: 0xf4f7fa, stone: 0xdfe6ea }, body: { sand: 0xcfd8de, grass: 0xcfd8de, stone: 0xb8c2c8 }, palms: false },
  desert: { top: { sand: 0xead9a0, grass: 0xe0c98a, stone: 0xc9b07a }, body: { sand: 0xd4bf78, grass: 0xc9a870, stone: 0xb0976a }, palms: true },
  red: { top: { sand: 0xd9905f, grass: 0xc9704a, stone: 0xb5603f }, body: { sand: 0xb5603f, grass: 0xa04a32, stone: 0x8a3f2a }, palms: false },
};
const LEAF = [0x3f8f3a, 0x4fa044, 0x37803a];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (i, k) => i * 65536 + k;
const cellOf = (v) => Math.floor(v / B);
const cellCenter = (c) => (c + 0.5) * B;

// Новый мир после «Начать заново»: чудеса встают в другом порядке. Первые 20 —
// самые известные — остаются поближе к порту, просто перемешиваются между собой.
function shuffled(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function landmarkOrder(seed) {
  if (seed === SEED) return LANDMARKS;
  const rng = mulberry32(seed ^ 0x5eed);
  return [...shuffled(LANDMARKS.slice(0, 20), rng), ...shuffled(LANDMARKS.slice(20), rng)];
}

// surfaces — сюда регистрируются парящие ступени паркура (на них можно стоять).
// seed — номер мира: у каждого своё расположение островов.
export function createTerrain(scene, surfaces, seed = SEED) {
  const rng = mulberry32(seed);
  const deco = mulberry32(seed ^ 0xf10e); // цветы и трава — свой генератор, чтобы острова не сдвинулись
  const top = new Map(); // клетка → верх суши (y); нет в карте — вода
  const solid = new Set(); // деревья и постройки: сквозь них не пройти
  let sink = []; // блоки острова, который сейчас строим (у каждого острова — свой меш)
  const islands = [];
  const actors = []; // подвижные части чудес: крылья мельницы, ракета
  const shade = new THREE.Color();

  // лёгкий разброс оттенка — «текстура» блоков как в Minecraft
  const vary = (hex, amt = 0.12) => shade.setHex(hex).multiplyScalar(1 - amt / 2 + rng() * amt).getHex();
  // ry/rx/rz — поворот блока (сначала крен, потом наклон, потом курс), нужен чудесам света
  const block = (x, y, z, w, h, d, color, ry = 0, rx = 0, rz = 0) => sink.push({ x, y, z, w, h, d, color, ry, rx, rz });

  // колонна суши: тело до дна и верхний блок; theme — палитра острова (или обычная)
  let theme = null;
  function column(i, k, topY, kind) {
    const x = cellCenter(i);
    const z = cellCenter(k);
    top.set(key(i, k), topY);
    const bodyH = topY - B - FLOOR_Y;
    block(x, FLOOR_Y + bodyH / 2, z, B, bodyH, B, (theme?.body ?? BODY)[kind] ?? BODY[kind]);
    const topColor = kind === 'plaza' ? PLAZA[(i + k) & 1] : (theme?.top ?? TOP)[kind] ?? TOP[kind];
    block(x, topY - B / 2, z, B, B, B, vary(topColor, kind === 'plaza' ? 0.06 : 0.12));
  }

  function markSolid(x, z, hx, hz = hx) {
    for (let i = cellOf(x - hx); i <= cellOf(x + hx); i++) {
      for (let k = cellOf(z - hz); k <= cellOf(z + hz); k++) solid.add(key(i, k));
    }
  }

  function nearSolid(i, k, rad) {
    for (let di = -rad; di <= rad; di++) {
      for (let dk = -rad; dk <= rad; dk++) if (solid.has(key(i + di, k + dk))) return true;
    }
    return false;
  }

  function palm(i, k, y0) {
    const x = cellCenter(i);
    const z = cellCenter(k);
    const n = 3 + Math.floor(rng() * 2);
    for (let s = 0; s < n; s++) block(x, y0 + s * B + B / 2, z, 1.2, B, 1.2, s % 2 ? 0x8a6a3c : 0x7a5a30);
    const ly = y0 + n * B + 0.5;
    block(x, ly, z, B, 1, B, LEAF[0]);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      block(x + dx * B, ly, z + dz * B, B, 1, B, LEAF[1]);
      block(x + dx * 2 * B, ly - 0.8, z + dz * 2 * B, B, 1, B, LEAF[2]);
    }
    block(x + 0.7, ly - 1, z + 0.7, 0.7, 0.7, 0.7, 0x5a3a1c);
    block(x - 0.7, ly - 1, z - 0.5, 0.7, 0.7, 0.7, 0x5a3a1c);
    solid.add(key(i, k));
  }

  // Паркур, как «обби» в Роблоксе: радужные парящие ступени винтом вокруг чуда света,
  // наверху — сундук «Покоритель вершины». Упал — просто начинаешь снизу.
  // Ступень — 2×2 блока: есть куда приземлиться. Где ступени сошлись вплотную,
  // по ним можно просто зашагать вверх.
  const RAINBOW = [0xe0302a, 0xf08a2a, 0xf4d23a, 0x4fb05a, 0x3a7fd0, 0x7a4ab0];
  function buildParkour(island, landmarkTop) {
    const { x: cx, z: cz, landmark } = island;
    const baseY = SEA_Y + PLATEAU_H * B;
    const R = landmark.size + 5;
    const height = Math.min(46, Math.max(12, landmarkTop - baseY + 2));
    const steps = Math.round(height / 1.8);
    let ang = rng() * Math.PI * 2;
    let prev = baseY;
    let prevCells = new Set();
    let last = null;
    for (let s = 1; s <= steps; s++) {
      let i0 = 0;
      let k0 = 0;
      let cells = [];
      // следующая ступень по дуге — не залезая на клетки предыдущей
      for (let tries = 0; tries < 10; tries++) {
        ang += (tries ? 0.8 : 5.2) / R;
        i0 = Math.round((cx + Math.cos(ang) * R) / B) - 1;
        k0 = Math.round((cz + Math.sin(ang) * R) / B) - 1;
        cells = [[i0, k0], [i0 + 1, k0], [i0, k0 + 1], [i0 + 1, k0 + 1]];
        if (!cells.some(([i, k]) => prevCells.has(key(i, k)))) break;
      }
      const x = (i0 + 1) * B;
      const z = (k0 + 1) * B;
      const ground = Math.max(...cells.map(([i, k]) => top.get(key(i, k)) ?? SEA_Y));
      const t = Math.max(prev + 1.4, baseY + s * (height / steps), ground + 1.6);
      prev = t;
      block(x, t - 0.4, z, B * 2, 0.8, B * 2, RAINBOW[s % RAINBOW.length]);
      for (const [i, k] of cells) surfaces?.add(cellCenter(i), cellCenter(k), t - 0.8, t, 'parkour');
      prevCells = new Set(cells.map(([i, k]) => key(i, k)));
      last = { x, y: t, z };
    }
    // флажок на последней ступени — видно, куда забираться
    block(last.x + 1.6, last.y + 1.5, last.z + 1.6, 0.15, 3, 0.15, 0x8a8a8a);
    block(last.x + 2.2, last.y + 2.6, last.z + 1.6, 1.2, 0.8, 0.1, 0xe0302a);
    island.summit = last;
  }

  function buildLandmark(island) {
    const { x: cx, z: cz, landmark } = island;
    const baseY = SEA_Y + PLATEAU_H * B;
    const from = sink.length;
    landmark.build({
      box: (dx, y0, dz, w, h, d, color, ry, rx, rz) => block(cx + dx, baseY + y0 + h / 2, cz + dz, w, h, d, color, ry, rx, rz),
      solid: (dx, dz, hx, hz = hx) => markSolid(cx + dx, cz + dz, hx, hz),
      group: (dx, y0, dz) => {
        const g = new THREE.Group();
        g.position.set(cx + dx, baseY + y0, cz + dz);
        scene.add(g);
        actors.push({ group: g, island });
        return g;
      },
    });
    let landmarkTop = baseY;
    for (let n = from; n < sink.length; n++) landmarkTop = Math.max(landmarkTop, sink[n].y + sink[n].h / 2);
    island.baseY = baseY;
    island.top = landmarkTop;
    buildParkour(island, landmarkTop);
  }

  function makeIsland(cx, cz, r, { port = false, home = false, landmark = null, name = '' } = {}) {
    const p1 = rng() * 6.28;
    const p2 = rng() * 6.28;
    const p3 = rng() * 6.28;
    const wob = port || home ? 0 : 0.5; // порт и свой остров — ровный круг, остальные с изрезанным берегом
    const maxH = port || home ? 1 : 3 + (r > 26 ? 1 : 0);
    const plateau = landmark ? landmark.size + 3 : 0;
    const island = {
      id: islands.length, name: landmark?.name ?? name, country: landmark?.country ?? '',
      x: cx, z: cz, r, port, home, landmark, cells: [], blocks: [], secret: !!landmark?.secret,
    };
    islands.push(island);
    sink = island.blocks;
    theme = THEMES[landmark?.theme] ?? null;
    const cells = island.cells;
    const reach = r * 1.4;
    for (let i = cellOf(cx - reach); i <= cellOf(cx + reach); i++) {
      for (let k = cellOf(cz - reach); k <= cellOf(cz + reach); k++) {
        if (top.has(key(i, k))) continue;
        const x = cellCenter(i) - cx;
        const z = cellCenter(k) - cz;
        const ang = Math.atan2(z, x);
        const edge = r * (1 + wob * (0.22 * Math.sin(ang * 3 + p1) + 0.12 * Math.sin(ang * 5 + p2)));
        const dc = Math.hypot(x, z);
        const e = 1 - dc / edge;
        if (e <= 0) continue;
        const bump = (Math.sin(x * 0.35 + p3) + Math.sin(z * 0.29 + p1)) * 0.35 * wob;
        let h = e < 0.2 ? 1 : Math.max(2, Math.min(maxH + 1, 1 + Math.round(e * maxH * 1.3 + bump)));
        if (dc < plateau) h = PLATEAU_H; // ровная площадка под чудо света
        // вокруг чуда — мощёная площадь (кроме снежных островов)
        const kind = dc < plateau && theme !== THEMES.snow ? 'plaza' : h === 1 ? 'sand' : h >= 6 ? 'stone' : 'grass';
        column(i, k, SEA_Y + h * B, kind);
        cells.push({ i, k, h, kind, dc });
      }
    }

    if (port) return island;
    if (home) {
      buildHome(island);
      return island;
    }

    buildLandmark(island);
    plazaProps(island, plateau);
    for (const c of theme?.palms === false ? [] : cells) {
      if (c.kind !== 'grass' || c.h > 4 || c.dc < plateau + 2 || rng() > 0.07 || nearSolid(c.i, c.k, 2)) continue;
      palm(c.i, c.k, SEA_Y + c.h * B);
    }
    decorate(cells, plateau);
    // рифы у берега
    const reefs = 2 + Math.floor(rng() * 3);
    for (let n = 0; n < reefs; n++) {
      const a = rng() * 6.28;
      const d = r * 1.25 + 4 + rng() * 8;
      const i = cellOf(cx + Math.cos(a) * d);
      const k = cellOf(cz + Math.sin(a) * d);
      if (!top.has(key(i, k))) column(i, k, SEA_Y + B * (1 + Math.floor(rng() * 2)), 'stone');
    }
    return island;
  }

  // Цветы и травинки на лужайках, в пустыне — кактусы. Сквозь них можно ходить.
  const FLOWERS = [0xe0302a, 0xf4d23a, 0xffffff, 0xf07ab8, 0x6a8ff0, 0xf08a24];
  function decorate(cells, plateau) {
    if (theme === THEMES.snow) return;
    for (const c of cells) {
      if (c.kind !== 'grass' || c.dc < plateau || solid.has(key(c.i, c.k)) || deco() > 0.18) continue;
      const x = cellCenter(c.i) + (deco() - 0.5) * 1.1;
      const z = cellCenter(c.k) + (deco() - 0.5) * 1.1;
      const y = SEA_Y + c.h * B;
      if (theme === THEMES.desert) {
        const h = 1.6 + deco() * 1.2;
        block(x, y + h / 2, z, 0.7, h, 0.7, 0x4f8f3a);
        block(x + 0.55, y + h * 0.6, z, 0.5, 0.9, 0.5, 0x4f8f3a);
      } else if (deco() < 0.55) {
        block(x, y + 0.35, z, 0.18, 0.7, 0.18, 0x3f8f3a);
        block(x, y + 0.85, z, 0.5, 0.4, 0.5, FLOWERS[Math.floor(deco() * FLOWERS.length)]);
        block(x, y + 0.9, z, 0.2, 0.2, 0.55, 0xf4d23a);
      } else {
        for (let n = 0; n < 3; n++) {
          const bh = 0.5 + deco() * 0.5;
          block(x + (n - 1) * 0.3, y + bh / 2, z + (deco() - 0.5) * 0.4, 0.15, bh, 0.15, 0x6fbf4a);
        }
      }
    }
  }

  // Фонари и скамейки по краю площади. Свет фонарей — в группе острова, она прячется вместе с ним.
  function plazaProps(island, plateau) {
    const { x: cx, z: cz } = island;
    const y = SEA_Y + PLATEAU_H * B;
    island.extras = new THREE.Group();
    scene.add(island.extras);
    const r = plateau - 1.2;
    const n = 6;
    const turn = deco() * Math.PI * 2;
    for (let s = 0; s < n; s++) {
      const ang = turn + (s / n) * Math.PI * 2;
      const x = cellCenter(cellOf(cx + Math.cos(ang) * r));
      const z = cellCenter(cellOf(cz + Math.sin(ang) * r));
      if (nearSolid(cellOf(x), cellOf(z), 0) || top.get(key(cellOf(x), cellOf(z))) !== y) continue;
      // фонарь
      block(x, y + 0.3, z, 0.9, 0.6, 0.9, 0x3a3a3c);
      block(x, y + 2, z, 0.3, 3.4, 0.3, 0x2e2e30);
      block(x, y + 4.1, z, 0.8, 0.8, 0.8, 0xffd98a);
      block(x, y + 4.6, z, 1.1, 0.25, 1.1, 0x2e2e30);
      glow(island.extras, 0xffd27a, 3.2, x, y + 4.1, z, 0.35);
      markSolid(x, z, 0.3);
      // скамейка между фонарями, спинкой к чуду
      const mid = ang + Math.PI / n;
      const bx = cx + Math.cos(mid) * (r + 0.3);
      const bz = cz + Math.sin(mid) * (r + 0.3);
      if (s % 2 || nearSolid(cellOf(bx), cellOf(bz), 0) || top.get(key(cellOf(bx), cellOf(bz))) !== y) continue;
      const yaw = -mid + Math.PI / 2;
      block(bx, y + 0.75, bz, 2.4, 0.25, 0.8, 0x9a6a3c, yaw);
      block(bx - Math.cos(mid) * 0.4, y + 1.3, bz - Math.sin(mid) * 0.4, 2.4, 0.8, 0.15, 0x8a5a30, yaw);
      for (const side of [-1, 1]) {
        block(bx + Math.sin(mid) * side, y + 0.33, bz - Math.cos(mid) * side, 0.2, 0.66, 0.7, 0x2e2e30, yaw);
      }
    }
  }

  // Свой остров: ровная лужайка под стройку, флагшток с пиратским флагом и пара пальм.
  function buildHome(island) {
    const { x: cx, z: cz } = island;
    const fx = cellCenter(cellOf(cx - 10));
    const fz = cellCenter(cellOf(cz + 8));
    const fy = top.get(key(cellOf(fx), cellOf(fz)));
    block(fx, fy + 3.5, fz, 0.35, 7, 0.35, 0x8a8a8a);
    block(fx + 1.4, fy + 6.2, fz, 2.4, 1.6, 0.12, 0x1a1a1a);
    block(fx + 1.4, fy + 6.35, fz, 0.7, 0.6, 0.16, 0xf4f1e8);
    block(fx + 1.4, fy + 5.9, fz, 0.5, 0.2, 0.16, 0xf4f1e8);
    markSolid(fx, fz, 0.3);
    for (const [x, z] of [[13, 9], [-14, -5], [9, -14]]) {
      const i = cellOf(cx + x);
      const k = cellOf(cz + z);
      palm(i, k, top.get(key(i, k)));
    }
    decorate(island.cells, 0);
  }

  function buildPort() {
    makeIsland(PORT.x, PORT.z, PORT.r, { port: true, name: 'Порт' });

    // причал на юг, к стоянке корабля
    const deck = 0.9;
    for (let k = cellOf(14); k <= cellOf(46); k++) {
      for (const i of [-1, 0]) {
        if (top.has(key(i, k))) continue;
        top.set(key(i, k), deck);
        block(cellCenter(i), deck - 0.3, cellCenter(k), B, 0.6, B, k % 2 ? 0xa87a4a : 0x9c6d44);
      }
      if (k % 3 === 0) {
        for (const x of [-2.1, 2.1]) block(x, (FLOOR_Y + deck) / 2, cellCenter(k), 0.6, deck - FLOOR_Y, 0.6, 0x5a3a20);
      }
    }

    // маяк
    const lh = { x: -11, z: -9 };
    const ly = top.get(key(cellOf(lh.x), cellOf(lh.z)));
    for (let s = 0; s < 8; s++) block(lh.x, ly + s * B + B / 2, lh.z, 3, B, 3, s % 2 ? 0xe8e3d6 : 0xc0453a);
    block(lh.x, ly + 8 * B + 1, lh.z, 2.2, 2, 2.2, 0xfff3a0);
    glow(scene, 0xfff3a0, 9, lh.x, ly + 8 * B + 1, lh.z, 0.55);
    block(lh.x, ly + 9 * B + 0.5, lh.z, 3.4, 1, 3.4, 0x3b2a18);
    markSolid(lh.x, lh.z, 1.5);

    // лавка, дверью к причалу
    const hs = { x: 9, z: -4 };
    const hy = top.get(key(cellOf(hs.x), cellOf(hs.z)));
    block(hs.x, hy + 2.5, hs.z, 8, 5, 7, 0xb58a58);
    for (let s = 0; s < 3; s++) block(hs.x, hy + 5.5 + s, hs.z, 9 - s * 2.5, 1, 8, 0x8a3a2a);
    block(hs.x, hy + 1.5, hs.z + 3.55, 1.6, 3, 0.2, 0x4a3120);
    block(hs.x - 2.3, hy + 3, hs.z + 3.55, 1.4, 1.2, 0.2, 0x9cd3f0);
    block(hs.x + 2.3, hy + 3, hs.z + 3.55, 1.4, 1.2, 0.2, 0x9cd3f0);
    markSolid(hs.x, hs.z, 4.2, 3.7);

    // таверна «Весёлый осьминог»: дом, светящееся окно и вывеска-кружка
    const tv = { x: -7, z: 3 };
    const ty = top.get(key(cellOf(tv.x), cellOf(tv.z)));
    block(tv.x, ty + 2, tv.z, 6, 4, 5, 0x9c6d44);
    for (let s = 0; s < 3; s++) block(tv.x, ty + 4.4 + s * 0.8, tv.z, 7 - s * 2.2, 0.8, 6, 0x5a3a20);
    block(tv.x + 3.05, ty + 1.3, tv.z, 0.2, 2.6, 1.4, 0x4a3120);
    block(tv.x + 3.1, ty + 3.2, tv.z - 1.6, 0.2, 1, 1, 0xffd27a);
    glow(scene, 0xffd27a, 3, tv.x + 3.3, ty + 3.2, tv.z - 1.6, 0.35);
    block(tv.x + 3.6, ty + 3.6, tv.z + 1.6, 1.0, 0.2, 0.2, 0x4a3120);
    block(tv.x + 4.0, ty + 2.8, tv.z + 1.6, 0.9, 1.0, 0.2, 0xe8b830);
    block(tv.x + 4.0, ty + 3.35, tv.z + 1.6, 1.0, 0.25, 0.25, 0xf4f4f4);
    markSolid(tv.x, tv.z, 3, 2.5);

    for (const [x, z] of [[-6, 10], [15, 8], [-16, 4]]) {
      palm(cellOf(x), cellOf(z), top.get(key(cellOf(x), cellOf(z))));
    }
  }

  buildPort();

  // Острова «подсолнухом» вокруг порта: равномерно по кругу, первый — прямо по курсу.
  // Расстояние растёт как корень из номера — так острова не редеют к краю мира.
  const placed = [{ x: PORT.x, z: PORT.z, r: PORT.r + 30 }, { x: HOME.x, z: HOME.z, r: HOME.r + 10 }];
  landmarkOrder(seed).forEach((landmark, n) => {
    const r = landmark.size + 10 + rng() * 5;
    let x = 0;
    let z = 0;
    for (let tries = 0; tries < 40; tries++) {
      const ang = Math.PI / 2 + n * 2.39996 + (rng() - 0.5) * 0.4;
      const d = 195 + 101 * Math.sqrt(n) + rng() * 26 + tries * 14; // между островами — простор
      x = Math.cos(ang) * d;
      z = Math.sin(ang) * d;
      if (!placed.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + r + 80)) break;
    }
    placed.push({ x, z, r });
    makeIsland(x, z, r, { landmark });
  });

  // секретные острова — за последним кругом, там, где просторнее всего
  for (const landmark of SECRETS) {
    const r = landmark.size + 12;
    let best = null;
    let bestGap = -Infinity;
    for (let k = 0; k < 72; k++) {
      const ang = (k / 72) * Math.PI * 2;
      const x = Math.cos(ang) * 1380;
      const z = Math.sin(ang) * 1380;
      const gap = Math.min(...placed.map((p) => Math.hypot(p.x - x, p.z - z) - p.r - r));
      if (gap > bestGap) {
        bestGap = gap;
        best = { x, z };
      }
    }
    placed.push({ x: best.x, z: best.z, r });
    makeIsland(best.x, best.z, r, { landmark });
  }

  // свой остров строим последним: номера островов с чудесами не сдвигаются
  makeIsland(HOME.x, HOME.z, HOME.r, { home: true, name: 'Мой остров' });

  // чудеса, добавленные позже, — после своего острова (номера прежних островов не сдвигаются),
  // на среднем круге, там, где просторнее всего
  for (const landmark of EXTRA) {
    const r = landmark.size + 10;
    let best = null;
    let bestGap = -Infinity;
    for (let k = 0; k < 72; k++) {
      const ang = (k / 72) * Math.PI * 2 + 0.3;
      const x = Math.cos(ang) * 470;
      const z = Math.sin(ang) * 470;
      const gap = Math.min(...placed.map((p) => Math.hypot(p.x - x, p.z - z) - p.r - r));
      if (gap > bestGap) {
        bestGap = gap;
        best = { x, z };
      }
    }
    placed.push({ x: best.x, z: best.z, r });
    makeIsland(best.x, best.z, r, { landmark });
  }

  // монеты и крестики — только там, где можно стоять
  for (const isl of islands) isl.cells = isl.cells.filter((c) => !solid.has(key(c.i, c.k)));

  // Текстура со стыками по мировой сетке блоков: высокая колонна выглядит
  // сложенной из кубов. Сдвиг по y — потому что блоки стоят от уровня моря.
  // У каждого острова свой InstancedMesh: рисуются только ближние, а камера
  // отбрасывает те, что не в кадре (в том числе при расчёте теней).
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const material = voxelize(new THREE.MeshLambertMaterial({ color: 0xffffff }), { tex: TEX.block, tile: B, offset: [0, -SEA_Y, 0], terrain: true });
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const pos = new THREE.Vector3();
  const size = new THREE.Vector3();
  const color = new THREE.Color();
  for (const isl of islands) {
    const mesh = new THREE.InstancedMesh(unitBox, material, isl.blocks.length);
    isl.blocks.forEach((b, n) => {
      q.setFromEuler(euler.set(b.rx, b.ry, b.rz));
      m.compose(pos.set(b.x, b.y, b.z), q, size.set(b.w, b.h, b.d));
      mesh.setMatrixAt(n, m);
      mesh.setColorAt(n, color.setHex(b.color));
    });
    mesh.computeBoundingSphere();
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    isl.mesh = mesh;
    delete isl.blocks;
  }

  // Острова дальше дымки не рисуем вовсе.
  // dist — в подзорную трубу видно гораздо дальше
  function updateVisibility(x, z, dist = VIEW_DIST) {
    for (const isl of islands) {
      isl.mesh.visible = Math.hypot(isl.x - x, isl.z - z) < dist + isl.r;
      if (isl.extras) isl.extras.visible = isl.mesh.visible;
    }
  }

  const groundAt = (x, z) => top.get(key(cellOf(x), cellOf(z)));
  const isSolid = (x, z) => solid.has(key(cellOf(x), cellOf(z)));
  const cellPos = (c) => ({ x: cellCenter(c.i), z: cellCenter(c.k), y: SEA_Y + c.h * B });
  const islandAt = (x, z) => islands.find((isl) => Math.hypot(isl.x - x, isl.z - z) < isl.r * 1.45) ?? null;

  // Ближайшая клетка суши, куда можно встать. islandOnly — пропускать рифы в море.
  function nearestLand(x, z, maxDist, islandOnly = false) {
    let best = null;
    let bestD = maxDist;
    const ci = cellOf(x);
    const ck = cellOf(z);
    const rad = Math.ceil(maxDist / B);
    for (let i = ci - rad; i <= ci + rad; i++) {
      for (let k = ck - rad; k <= ck + rad; k++) {
        const y = top.get(key(i, k));
        if (y === undefined || solid.has(key(i, k))) continue;
        const cx = cellCenter(i);
        const cz = cellCenter(k);
        const d = Math.hypot(cx - x, cz - z);
        if (d >= bestD || (islandOnly && !islandAt(cx, cz))) continue;
        bestD = d;
        best = { x: cx, z: cz, y };
      }
    }
    return best;
  }

  return { islands, actors, groundAt, isSolid, nearestLand, islandAt, cellPos, updateVisibility };
}
