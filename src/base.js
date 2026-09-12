import * as THREE from 'three';
import { voxelize, TEX, glow, glows, cube } from './voxel.js';
import { B, SEA_Y } from './terrain.js';
import { CHAPTERS } from './story.js';

// Свой остров: капитан ставит и убирает цветные блоки (по ним можно залезать),
// на пьедесталах — трофеи легенды, а по лужайке гуляют звери из альбома.
export const BLOCKS = [
  { color: 0x5fa044, name: 'Трава' },
  { color: 0x9c6d44, name: 'Доски' },
  { color: 0x8a8f94, name: 'Камень' },
  { color: 0xb5523a, name: 'Кирпич' },
  { color: 0xe3d38f, name: 'Песок' },
  { color: 0xf4f1e8, name: 'Белый' },
  { color: 0x3a7fd0, name: 'Синий' },
  { color: 0xf07ab8, name: 'Розовый' },
  { color: 0xf6c944, name: 'Золото' },
  { color: 0xffe9a0, name: 'Фонарь', lamp: true },
];
const MAX = 600;
const MAX_H = 24 * B; // выше — уже облака
const cellOf = (v) => Math.floor(v / B);
const cellCenter = (c) => (c + 0.5) * B;
const ck = (i, k) => i * 65536 + k;

// Трофеи легенды — по порядку глав, последний — статуя Золотого Кракена.
const GOLD = 0xf6c944;
const TROPHIES = [
  // Жар-птица: огненное перо
  (g) => {
    cube(g, 0xf4d23a, 0.18, 2.4, 0.18, 0, 1.2, 0);
    [[0.6, 0xe0302a], [0.9, 0xe0302a], [1.0, 0xf08a24], [0.9, 0xf08a24], [0.7, 0xf4d23a], [0.4, 0xf4d23a]].forEach(([w, c], n) => cube(g, c, w, 0.36, 0.14, 0, 0.7 + n * 0.34, 0));
    g.children.forEach((m) => (m.rotation.z = 0.25));
  },
  // морская гонка: золотой кубок
  (g) => {
    cube(g, GOLD, 1.0, 0.2, 1.0, 0, 0.1, 0);
    cube(g, GOLD, 0.3, 0.6, 0.3, 0, 0.5, 0);
    cube(g, GOLD, 1.1, 0.9, 1.1, 0, 1.25, 0);
    cube(g, 0xffe9a0, 1.3, 0.15, 1.3, 0, 1.75, 0);
    for (const sx of [-1, 1]) cube(g, GOLD, 0.2, 0.6, 0.2, sx * 0.75, 1.3, 0);
  },
  // золотой скарабей с синим камнем на спинке
  (g) => {
    cube(g, GOLD, 1.0, 0.5, 1.3, 0, 0.45, 0);
    cube(g, GOLD, 0.6, 0.35, 0.4, 0, 0.4, -0.8);
    cube(g, 0x9a7a2a, 0.06, 0.52, 1.1, 0, 0.47, 0.1);
    cube(g, 0x3a7fd0, 0.35, 0.2, 0.35, 0, 0.75, 0.1);
    for (const sx of [-1, 1]) for (const z of [-0.4, 0, 0.4]) cube(g, 0x9a7a2a, 0.5, 0.08, 0.08, sx * 0.6, 0.25, z);
  },
  // голова Морского змея
  (g) => {
    cube(g, 0x3f9f5a, 0.8, 0.7, 0.8, 0, 0.35, 0.2);
    cube(g, 0x3f9f5a, 1.2, 1.0, 1.3, 0, 1.1, 0);
    cube(g, 0x4fb06a, 0.9, 0.55, 0.8, 0, 0.9, -0.95);
    for (const sx of [-1, 1]) {
      cube(g, 0xf4d23a, 0.2, 0.2, 0.1, sx * 0.35, 1.35, -0.66);
      cube(g, 0xe0302a, 0.1, 0.6, 0.5, sx * 0.62, 1.2, 0.3);
      cube(g, 0xf4f1e8, 0.12, 0.25, 0.12, sx * 0.25, 0.55, -1.2);
    }
    cube(g, 0xe0302a, 0.2, 0.5, 0.5, 0, 1.75, 0.1);
  },
  // треуголка Чёрной Бороды с черепом
  (g) => {
    cube(g, 0x1a1a1a, 1.8, 0.2, 1.3, 0, 0.3, 0);
    cube(g, 0x1a1a1a, 1.1, 0.6, 0.9, 0, 0.7, 0);
    cube(g, GOLD, 1.85, 0.08, 1.35, 0, 0.42, 0);
    cube(g, 0xf4f1e8, 0.4, 0.4, 0.1, 0, 0.72, -0.46);
    for (const sx of [-1, 1]) cube(g, 0x1a1a1a, 0.1, 0.1, 0.05, sx * 0.1, 0.78, -0.52);
  },
  // статуя Золотого Кракена
  (g) => {
    cube(g, GOLD, 2.0, 2.2, 2.0, 0, 2.6, 0);
    cube(g, GOLD, 1.6, 0.6, 1.6, 0, 3.9, 0);
    for (const sx of [-1, 1]) cube(g, 0x2a2a2a, 0.4, 0.5, 0.1, sx * 0.5, 2.9, -1.02);
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      cube(g, GOLD, 0.45, 0.45, 1.4, c * 1.0, 1.2, s * 1.0).rotation.y = -ang + Math.PI / 2;
      cube(g, GOLD, 0.4, 0.9, 0.4, c * 1.6, 0.9, s * 1.6);
      cube(g, 0xffe9a0, 0.35, 0.35, 0.35, c * 1.6, 1.5, s * 1.6);
    }
  },
];

// hooks: terrain, surfaces, home (остров), save, store(), fx, sfx, say
export function createBase(scene, { terrain, surfaces, home, save, store, fx, sfx, say }) {
  const blocks = save.base; // [i, k, низ, тип]
  const material = voxelize(new THREE.MeshLambertMaterial({ color: 0xffffff }), { tex: TEX.block, tile: B, offset: [0, -SEA_Y, 0], terrain: true });
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, MAX);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  mesh.setColorAt(0, new THREE.Color(0xffffff)); // цвет у каждого блока свой — заводим буфер сразу
  scene.add(mesh);
  const lights = new THREE.Group();
  scene.add(lights);
  const m4 = new THREE.Matrix4();
  const color = new THREE.Color();
  let type = 0;

  const forget = (group) => group.traverse((o) => {
    const n = glows.indexOf(o);
    if (n >= 0) glows.splice(n, 1);
  });

  function rebuild() {
    mesh.count = blocks.length;
    surfaces.removeTag('base');
    forget(lights);
    lights.clear();
    blocks.forEach(([i, k, y, t], n) => {
      const x = cellCenter(i);
      const z = cellCenter(k);
      m4.makeScale(B, B, B).setPosition(x, y + B / 2, z);
      mesh.setMatrixAt(n, m4);
      mesh.setColorAt(n, color.setHex((BLOCKS[t] ?? BLOCKS[0]).color));
      surfaces.add(x, z, y, y + B, 'base');
      if (BLOCKS[t]?.lamp) glow(lights, 0xffd27a, 4.5, x, y + B / 2, z, 0.4);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }

  // пьедесталы трофеев: пять в ряд и большой посередине позади
  const decor = new THREE.Group();
  scene.add(decor);
  const items = new THREE.Group();
  scene.add(items);
  const reserved = new Set();
  const stands = [];
  const hi = cellOf(home.x);
  const hk = cellOf(home.z);
  function stand(cells, x, z, w, h) {
    const y = terrain.groundAt(x, z);
    cube(decor, 0x8a8f94, w, h, w, x, y + h / 2, z);
    cube(decor, GOLD, w + 0.2, 0.2, w + 0.2, x, y + h, z);
    for (const [i, k] of cells) {
      reserved.add(ck(i, k));
      surfaces.add(cellCenter(i), cellCenter(k), y, y + h + 0.1, 'trophy');
    }
    stands.push({ x, z, y: y + h + 0.1 });
  }
  for (let n = 0; n < CHAPTERS.length; n++) {
    const i = hi - 4 + n * 2;
    stand([[i, hk - 5]], cellCenter(i), cellCenter(hk - 5), 1.7, 1.2);
  }
  stand([[hi - 1, hk - 8], [hi, hk - 8], [hi - 1, hk - 7], [hi, hk - 7]], hi * B, (hk - 7) * B, 3.6, 1.6);

  let shown = '';
  function buildTrophies() {
    const want = `${save.story.keys}:${save.story.kraken ? 1 : 0}`;
    if (want === shown) return;
    shown = want;
    forget(items);
    items.clear();
    const got = CHAPTERS.map((_, n) => n < save.story.keys);
    got.push(!!save.story.kraken);
    got.forEach((ok, n) => {
      if (!ok) return;
      const s = stands[n];
      const g = new THREE.Group();
      g.position.set(s.x, s.y, s.z);
      TROPHIES[n](g);
      glow(g, 0xffd27a, n === 5 ? 8 : 3.5, 0, n === 5 ? 2.6 : 1.1, 0, 0.3);
      items.add(g);
    });
  }

  const onHome = (x, z) => terrain.islandAt(x, z) === home;

  // Клетка перед капитаном и высота, куда встанет новый блок: на верх стопки,
  // а если капитан забрался выше — мостиком прямо под ноги.
  function front(cap) {
    const fx = -Math.sin(cap.facing);
    const fz = -Math.cos(cap.facing);
    const ci = cellOf(cap.x);
    const ckk = cellOf(cap.z);
    for (const d of [1.8, 3.2]) {
      const i = cellOf(cap.x + fx * d);
      const k = cellOf(cap.z + fz * d);
      if (i === ci && k === ckk) continue;
      const x = cellCenter(i);
      const z = cellCenter(k);
      const ground = terrain.groundAt(x, z);
      if (ground === undefined || terrain.isSolid(x, z) || reserved.has(ck(i, k)) || !onHome(x, z)) return null;
      let top = ground;
      for (const b of blocks) if (b[0] === i && b[1] === k) top = Math.max(top, b[2] + B);
      const bridge = SEA_Y + Math.round((cap.y - B - SEA_Y) / B) * B;
      return { i, k, x, z, ground, y: Math.max(top, bridge) };
    }
    return null;
  }

  function place(cap) {
    const f = front(cap);
    if (!f) {
      say('Сюда блок не поставить — повернись к лужайке');
      return;
    }
    if (f.y - f.ground >= MAX_H) {
      say('Выше уже облака! ☁️');
      return;
    }
    if (blocks.length >= MAX) {
      say('Блоков больше не помещается — убери лишние 🧹');
      return;
    }
    blocks.push([f.i, f.k, Math.round(f.y * 100) / 100, type]);
    rebuild();
    store();
    fx.burst(BLOCKS[type].color, { x: f.x, y: f.y + B, z: f.z }, 6, { speed: 4, up: 3, size: 0.4 });
    sfx.step();
    if (blocks.length === 1) say('Первый блок! Строй что хочешь: дом, башню, крепость 🏰', 3);
  }

  // убираем верхний блок перед капитаном (под тем местом, куда встал бы новый)
  function remove(cap) {
    const f = front(cap);
    let best = -1;
    if (f) blocks.forEach((b, n) => {
      if (b[0] === f.i && b[1] === f.k && b[2] < f.y && (best < 0 || b[2] > blocks[best][2])) best = n;
    });
    if (best < 0) {
      say('Перед капитаном нет блока');
      return;
    }
    const [i, k, y, t] = blocks[best];
    blocks.splice(best, 1);
    rebuild();
    store();
    fx.burst((BLOCKS[t] ?? BLOCKS[0]).color, { x: cellCenter(i), y: y + B / 2, z: cellCenter(k) }, 10, { speed: 5, up: 4, size: 0.5 });
    sfx.dig();
  }

  // призрачный блок: показывает, куда встанет следующий
  const ghost = new THREE.Group();
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false });
  ghost.add(new THREE.Mesh(new THREE.BoxGeometry(B, B, B), ghostMat));
  ghost.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(B * 1.02, B * 1.02, B * 1.02)), new THREE.LineBasicMaterial({ color: 0xffffff })));
  ghost.visible = false;
  scene.add(ghost);

  // s: { cap, building }
  function update(dt, t, s) {
    const near = home.mesh.visible;
    mesh.visible = lights.visible = decor.visible = items.visible = near;
    if (!near) {
      ghost.visible = false;
      return;
    }
    buildTrophies();
    for (const g of items.children) g.rotation.y = t * 0.6;
    const f = s.building ? front(s.cap) : null;
    ghost.visible = !!f && f.y - f.ground < MAX_H;
    if (ghost.visible) {
      ghost.position.set(f.x, f.y + B / 2, f.z);
      ghostMat.color.setHex(BLOCKS[type].color);
      ghostMat.opacity = 0.3 + 0.15 * Math.sin(t * 5);
    }
  }

  rebuild();
  buildTrophies();

  return {
    update,
    place,
    remove,
    onHome,
    get type() {
      return type;
    },
    set type(n) {
      type = n;
    },
    count: () => blocks.length,
  };
}
