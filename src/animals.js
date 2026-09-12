import * as THREE from 'three';
import { cube, voxelize, TEX } from './voxel.js';

// Животные на островах и альбом наклеек. Каждый вид живёт там, где ему положено:
// пингвины — у полюса, верблюды — в пустыне, панды — в Азии… Подошёл к зверю — наклейка.
export const STICKERS = [
  { id: 'penguin', name: 'Пингвин', icon: '🐧', hint: 'у Южного полюса' },
  { id: 'camel', name: 'Верблюд', icon: '🐪', hint: 'в пустыне' },
  { id: 'kangaroo', name: 'Кенгуру', icon: '🦘', hint: 'в Австралии' },
  { id: 'panda', name: 'Панда', icon: '🐼', hint: 'в Азии' },
  { id: 'bear', name: 'Медведь', icon: '🐻', hint: 'в России' },
  { id: 'deer', name: 'Олень', icon: '🦌', hint: 'в Европе' },
  { id: 'elephant', name: 'Слон', icon: '🐘', hint: 'в Африке' },
  { id: 'giraffe', name: 'Жираф', icon: '🦒', hint: 'в Африке' },
  { id: 'llama', name: 'Лама', icon: '🦙', hint: 'в Америке' },
  { id: 'flamingo', name: 'Фламинго', icon: '🦩', hint: 'в Америке' },
  { id: 'crab', name: 'Краб', icon: '🦀', hint: 'на песчаном пляже' },
  { id: 'turtle', name: 'Черепаха', icon: '🐢', hint: 'на песчаном пляже' },
  { id: 'dolphin', name: 'Дельфин', icon: '🐬', hint: 'плывёт рядом, когда корабль идёт полным ходом' },
  { id: 'whale', name: 'Кит', icon: '🐋', hint: 'в открытом море' },
  { id: 'octopus', name: 'Осьминог', icon: '🐙', hint: 'у затонувшего корабля' },
  { id: 'clownfish', name: 'Рыба-клоун', icon: '🐠', hint: 'у затонувшего корабля' },
  { id: 'jellyfish', name: 'Медуза', icon: '🪼', hint: 'у затонувшего корабля' },
  { id: 'pufferfish', name: 'Рыба-фуга', icon: '🐡', hint: 'у затонувшего корабля' },
  { id: 'yeti', name: 'Йети', icon: '❄️', hint: 'на секретном ледяном острове' },
  { id: 'firebird', name: 'Жар-птица', icon: '🔥', hint: 'легенда: испытание России' },
  { id: 'serpent', name: 'Морской змей', icon: '🐉', hint: 'легенда: испытание Азии' },
  { id: 'kraken', name: 'Кракен', icon: '🦑', hint: 'легенда: логово Кракена' },
];

// свой кэш материалов: бурые звери не должны получить текстуру досок
const mats = new Map();
const M = (c) => {
  if (!mats.has(c)) mats.set(c, voxelize(new THREE.MeshLambertMaterial({ color: c }), { tex: TEX.noise }));
  return mats.get(c);
};

// Модели смотрят в −z. Возвращают группу, низ лап — на y = 0.
const BUILD = {
  penguin(g) {
    cube(g, M(0x1f1f24), 1.0, 1.5, 0.9, 0, 0.95, 0);
    cube(g, M(0xf4f4f4), 0.8, 1.2, 0.1, 0, 0.9, -0.46);
    cube(g, M(0x1f1f24), 0.8, 0.7, 0.8, 0, 2.0, 0);
    cube(g, M(0xf08a24), 0.3, 0.2, 0.4, 0, 1.95, -0.5);
    for (const sx of [-1, 1]) {
      cube(g, M(0xffffff), 0.14, 0.14, 0.06, sx * 0.2, 2.15, -0.42);
      cube(g, M(0xf08a24), 0.3, 0.12, 0.4, sx * 0.22, 0.06, -0.15);
      cube(g, M(0x1f1f24), 0.12, 0.9, 0.5, sx * 0.55, 1.1, 0);
    }
  },
  camel(g) {
    const C = M(0xc8a060);
    for (const [x, z] of [[-0.4, -0.9], [0.4, -0.9], [-0.4, 0.9], [0.4, 0.9]]) cube(g, C, 0.35, 1.8, 0.35, x, 0.9, z);
    cube(g, C, 1.1, 1.1, 2.6, 0, 2.3, 0);
    cube(g, C, 0.9, 0.7, 1.0, 0, 3.15, 0.1);
    cube(g, C, 0.45, 1.3, 0.45, 0, 3.0, -1.5).rotation.x = -0.4;
    cube(g, C, 0.5, 0.5, 0.9, 0, 3.6, -1.9);
    for (const sx of [-1, 1]) cube(g, M(0x1a1a1a), 0.08, 0.1, 0.08, sx * 0.26, 3.7, -2.1);
  },
  kangaroo(g) {
    const K = M(0xb07a4a);
    for (const sx of [-1, 1]) cube(g, K, 0.3, 0.3, 1.0, sx * 0.3, 0.15, -0.2);
    cube(g, K, 0.9, 1.6, 0.9, 0, 1.2, 0).rotation.x = 0.2;
    cube(g, M(0xd8b088), 0.6, 0.6, 0.1, 0, 1.0, -0.48);
    cube(g, K, 0.3, 0.3, 1.8, 0, 0.5, 1.0).rotation.x = -0.3;
    cube(g, K, 0.6, 0.6, 0.8, 0, 2.2, -0.2);
    for (const sx of [-1, 1]) {
      cube(g, K, 0.16, 0.5, 0.12, sx * 0.2, 2.65, -0.1);
      cube(g, M(0x1a1a1a), 0.08, 0.08, 0.05, sx * 0.16, 2.3, -0.62);
    }
  },
  panda(g) {
    const W = M(0xf4f4f0);
    const B = M(0x1f1f24);
    for (const [x, z] of [[-0.4, -0.5], [0.4, -0.5], [-0.4, 0.5], [0.4, 0.5]]) cube(g, B, 0.4, 0.7, 0.4, x, 0.35, z);
    cube(g, W, 1.3, 1.0, 1.6, 0, 1.1, 0);
    cube(g, B, 1.34, 0.4, 0.5, 0, 1.3, -0.3);
    cube(g, W, 1.0, 0.9, 0.9, 0, 1.8, -0.9);
    for (const sx of [-1, 1]) {
      cube(g, B, 0.28, 0.28, 0.2, sx * 0.42, 2.3, -0.8);
      cube(g, B, 0.26, 0.22, 0.06, sx * 0.22, 1.9, -1.36);
    }
    cube(g, B, 0.2, 0.14, 0.06, 0, 1.65, -1.36);
  },
  bear(g) {
    const Br = M(0x6a4a2e);
    for (const [x, z] of [[-0.45, -0.7], [0.45, -0.7], [-0.45, 0.7], [0.45, 0.7]]) cube(g, Br, 0.45, 0.8, 0.45, x, 0.4, z);
    cube(g, Br, 1.4, 1.2, 2.0, 0, 1.4, 0);
    cube(g, Br, 0.9, 0.8, 0.8, 0, 1.7, -1.3);
    cube(g, M(0xb08a60), 0.4, 0.3, 0.3, 0, 1.55, -1.8);
    for (const sx of [-1, 1]) {
      cube(g, Br, 0.25, 0.25, 0.15, sx * 0.35, 2.2, -1.2);
      cube(g, M(0x111111), 0.1, 0.1, 0.05, sx * 0.2, 1.85, -1.72);
    }
  },
  deer(g) {
    const D = M(0xa8683a);
    for (const [x, z] of [[-0.3, -0.7], [0.3, -0.7], [-0.3, 0.7], [0.3, 0.7]]) cube(g, D, 0.2, 1.4, 0.2, x, 0.7, z);
    cube(g, D, 0.8, 0.8, 1.8, 0, 1.8, 0);
    cube(g, M(0xf4ecd8), 0.5, 0.4, 0.1, 0, 1.9, 0.9);
    cube(g, D, 0.35, 0.9, 0.35, 0, 2.5, -0.8).rotation.x = -0.3;
    cube(g, D, 0.45, 0.45, 0.8, 0, 3.0, -1.1);
    for (const sx of [-1, 1]) {
      cube(g, M(0xe0d0a8), 0.1, 0.8, 0.1, sx * 0.25, 3.6, -0.9).rotation.z = sx * 0.4;
      cube(g, M(0xe0d0a8), 0.1, 0.4, 0.1, sx * 0.45, 3.9, -1.1).rotation.z = sx * 0.9;
    }
  },
  elephant(g) {
    const E = M(0x8a8f96);
    for (const [x, z] of [[-0.6, -0.8], [0.6, -0.8], [-0.6, 0.8], [0.6, 0.8]]) cube(g, E, 0.6, 1.6, 0.6, x, 0.8, z);
    cube(g, E, 1.8, 1.8, 2.6, 0, 2.4, 0);
    cube(g, E, 1.2, 1.2, 1.0, 0, 2.8, -1.6);
    for (const sx of [-1, 1]) {
      cube(g, M(0x7a7f86), 0.2, 1.3, 1.0, sx * 0.75, 2.8, -1.3);
      cube(g, M(0xf4f1e8), 0.15, 0.15, 0.6, sx * 0.35, 2.2, -2.2);
    }
    cube(g, E, 0.35, 1.6, 0.35, 0, 1.8, -2.15);
  },
  giraffe(g) {
    const Y = M(0xe8b850);
    const S = M(0x9a5a2a);
    for (const [x, z] of [[-0.35, -0.6], [0.35, -0.6], [-0.35, 0.6], [0.35, 0.6]]) cube(g, Y, 0.22, 2.0, 0.22, x, 1.0, z);
    cube(g, Y, 1.0, 1.0, 1.8, 0, 2.5, 0);
    for (const [x, y, z] of [[0.51, 2.6, 0.3], [-0.51, 2.4, -0.3], [0.51, 2.3, -0.5], [-0.51, 2.7, 0.5]]) cube(g, S, 0.02, 0.3, 0.3, x, y, z);
    cube(g, Y, 0.45, 2.6, 0.45, 0, 4.1, -0.8).rotation.x = -0.2;
    cube(g, Y, 0.5, 0.5, 0.9, 0, 5.4, -1.2);
    for (const sx of [-1, 1]) cube(g, S, 0.1, 0.35, 0.1, sx * 0.15, 5.8, -1.0);
  },
  llama(g) {
    const L = M(0xeee4d0);
    for (const [x, z] of [[-0.3, -0.6], [0.3, -0.6], [-0.3, 0.6], [0.3, 0.6]]) cube(g, L, 0.25, 1.2, 0.25, x, 0.6, z);
    cube(g, L, 1.0, 1.0, 1.6, 0, 1.7, 0);
    cube(g, L, 0.45, 1.4, 0.45, 0, 2.6, -0.7);
    cube(g, L, 0.5, 0.5, 0.8, 0, 3.4, -0.85);
    for (const sx of [-1, 1]) cube(g, L, 0.12, 0.35, 0.12, sx * 0.16, 3.8, -0.7);
    cube(g, M(0xd8453a), 0.8, 0.2, 0.9, 0, 2.25, 0.1); // яркое покрывальце
  },
  flamingo(g) {
    const P = M(0xf07ab8);
    cube(g, P, 0.1, 1.6, 0.1, 0, 0.8, 0);
    cube(g, P, 0.1, 0.8, 0.1, 0.15, 1.3, 0.2).rotation.x = 0.8; // вторая нога поджата
    cube(g, P, 0.8, 0.6, 1.0, 0, 2.0, 0);
    cube(g, P, 0.15, 1.0, 0.15, 0, 2.7, -0.4);
    cube(g, P, 0.35, 0.3, 0.35, 0, 3.25, -0.5);
    cube(g, M(0x1a1a1a), 0.12, 0.2, 0.3, 0, 3.1, -0.8);
  },
  crab(g) {
    const R = M(0xd8453a);
    cube(g, R, 0.8, 0.35, 0.6, 0, 0.35, 0);
    for (const sx of [-1, 1]) {
      cube(g, R, 0.3, 0.25, 0.3, sx * 0.6, 0.45, -0.35);
      cube(g, M(0x111111), 0.08, 0.2, 0.08, sx * 0.15, 0.65, -0.25);
      for (const z of [-0.15, 0.15]) cube(g, R, 0.4, 0.08, 0.08, sx * 0.5, 0.2, z);
    }
  },
  yeti(g) {
    const W = M(0xf4f7fa);
    for (const sx of [-1, 1]) {
      cube(g, W, 0.7, 1.2, 0.8, sx * 0.45, 0.6, 0);
      cube(g, W, 0.55, 1.6, 0.6, sx * 1.05, 2.2, -0.1);
    }
    cube(g, W, 1.8, 1.9, 1.3, 0, 2.1, 0);
    cube(g, W, 1.2, 1.1, 1.1, 0, 3.55, -0.1);
    cube(g, M(0x7ab0d8), 0.9, 0.7, 0.1, 0, 3.5, -0.66);
    for (const sx of [-1, 1]) cube(g, M(0x1a1a1a), 0.14, 0.14, 0.05, sx * 0.2, 3.62, -0.72);
    cube(g, M(0x1a1a1a), 0.4, 0.1, 0.05, 0, 3.3, -0.72);
  },
  turtle(g) {
    cube(g, M(0x5a7a3a), 1.0, 0.5, 1.2, 0, 0.45, 0);
    cube(g, M(0x7a9a4a), 0.7, 0.2, 0.9, 0, 0.75, 0);
    cube(g, M(0x9ab86a), 0.35, 0.3, 0.4, 0, 0.35, -0.75);
    for (const [x, z] of [[-0.55, -0.4], [0.55, -0.4], [-0.5, 0.45], [0.5, 0.45]]) cube(g, M(0x9ab86a), 0.35, 0.12, 0.3, x, 0.2, z);
  },
};

const BEACH = new Set(['crab', 'turtle', 'flamingo']);
const SPEED = { crab: 1.5, turtle: 0.7, penguin: 1.2, elephant: 1.4, giraffe: 1.6 };

// Кто живёт на острове: по климату и части света.
function speciesFor(isl) {
  const L = isl.landmark;
  if (!L) return null;
  if (L.secret) return L.id === 'iceisle' ? 'yeti' : null;
  if (L.theme === 'snow') return 'penguin';
  if (L.theme === 'desert') return 'camel';
  if (L.theme === 'red' || L.id === 'sydney') return 'kangaroo';
  switch (L.region) {
    case 'russia': return 'bear';
    case 'europe': return 'deer';
    case 'asia': return 'panda';
    case 'africa': return isl.id % 2 ? 'giraffe' : 'elephant';
    case 'americas': return isl.id % 2 ? 'flamingo' : 'llama';
  }
  return null;
}
const beachFor = (isl) => (isl.landmark?.theme === 'snow' ? null : ['crab', 'turtle', null][isl.id % 3]);

const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

// hooks: has(id), add(id)
// звери, которые могут жить на своём острове (сухопутные из альбома)
const ZOO = Object.keys(BUILD);

// hooks.blocked(x, z, y) — блок своей базы: сквозь него звери не ходят
export function createAnimals(scene, terrain, hooks) {
  const herds = terrain.islands.filter((i) => !i.port && i.cells.length).map((isl) => ({ isl, live: false, list: [] }));
  let scanT = 0;

  function spawn(h) {
    h.live = true;
    const kinds = [];
    const main = speciesFor(h.isl);
    if (main) for (let n = 0; n < 3; n++) kinds.push(main);
    // на своём острове гуляют все звери, которых уже нашёл
    h.zoo = h.isl.home ? ZOO.filter(hooks.has) : [];
    kinds.push(...h.zoo);
    const beach = h.isl.home ? null : beachFor(h.isl);
    if (beach) for (let n = 0; n < 2; n++) kinds.push(beach);
    for (const kind of kinds) {
      const cell = pickCell(h.isl, kind);
      if (!cell) continue;
      const g = new THREE.Group();
      BUILD[kind](g);
      g.traverse((o) => (o.castShadow = true));
      const p = terrain.cellPos(cell);
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = Math.random() * Math.PI * 2;
      scene.add(g);
      h.list.push({ kind, g, target: null, wait: Math.random() * 3, hop: 0 });
    }
  }

  function despawn(h) {
    for (const a of h.list) scene.remove(a.g);
    h.list = [];
    h.live = false;
  }

  function pickCell(isl, kind) {
    const pool = BEACH.has(kind) ? isl.cells.filter((c) => c.kind === 'sand') : isl.cells.filter((c) => c.kind !== 'sand');
    const list = pool.length ? pool : isl.cells;
    for (let n = 0; n < 10; n++) {
      const c = list[Math.floor(Math.random() * list.length)];
      const p = terrain.cellPos(c);
      if (!terrain.isSolid(p.x, p.z) && !hooks.blocked?.(p.x, p.z, p.y)) return c;
    }
    return null;
  }

  function walk(a, h, dt, t) {
    const g = a.g;
    if (a.wait > 0) {
      a.wait -= dt;
      g.position.y = (terrain.groundAt(g.position.x, g.position.z) ?? g.position.y) + Math.max(0, Math.sin(a.hop)) * 0.6;
      a.hop = Math.max(0, a.hop - dt * 6);
      return;
    }
    if (!a.target) {
      const c = pickCell(h.isl, a.kind);
      a.target = c ? terrain.cellPos(c) : null;
      if (!a.target) return;
    }
    const dx = a.target.x - g.position.x;
    const dz = a.target.z - g.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.5) {
      a.target = null;
      a.wait = 1 + Math.random() * 3;
      return;
    }
    const step = Math.min(d, (SPEED[a.kind] ?? 1.8) * dt);
    const nx = g.position.x + (dx / d) * step;
    const nz = g.position.z + (dz / d) * step;
    const y = terrain.groundAt(nx, nz);
    if (y === undefined || terrain.isSolid(nx, nz) || hooks.blocked?.(nx, nz, y)) {
      a.target = null;
      a.wait = 0.5;
      return;
    }
    g.position.set(nx, y + Math.abs(Math.sin(t * 8)) * 0.12, nz);
    const face = Math.atan2(-dx, -dz);
    g.rotation.y = a.kind === 'crab' ? face + Math.PI / 2 : face; // краб бегает боком
  }

  // s: { mode, cap, fx, fz }
  function update(dt, t, s) {
    scanT -= dt;
    if (scanT <= 0) {
      scanT = 0.5;
      for (const h of herds) {
        const d = dist(h.isl.x, h.isl.z, s.fx, s.fz);
        if (!h.live && d < 190) spawn(h);
        else if (h.live && d > 260) despawn(h);
        else if (h.live && h.isl.home && ZOO.filter(hooks.has).length !== h.zoo.length) {
          despawn(h); // новый зверь в альбоме — переселяется к тебе на остров
          spawn(h);
        }
      }
    }
    for (const h of herds) {
      if (!h.live) continue;
      for (const a of h.list) {
        walk(a, h, dt, t);
        if (s.mode === 'land' && !hooks.has(a.kind) && dist(a.g.position.x, a.g.position.z, s.cap.x, s.cap.z) < 7) {
          a.hop = Math.PI; // зверь подпрыгивает от радости
          a.wait = 1.2;
          hooks.add(a.kind);
        }
      }
    }
  }

  // где ближайший зверь, которого ещё нет в альбоме (для отладки и подсказок)
  function nearestNew(x, z) {
    let best = null;
    let bestD = Infinity;
    for (const h of herds) {
      for (const a of h.list) {
        if (hooks.has(a.kind)) continue;
        const d = dist(a.g.position.x, a.g.position.z, x, z);
        if (d < bestD) {
          bestD = d;
          best = a;
        }
      }
    }
    return best;
  }

  return { update, nearestNew, speciesFor };
}

// Альбом: найденные — яркие, ненайденные — «?» и подсказка, где искать.
export function renderAlbum(root, save) {
  root.replaceChildren(
    ...STICKERS.map((st) => {
      const got = save.stickers.includes(st.id);
      const el = document.createElement('div');
      el.className = `sticker ${got ? 'got' : ''}`;
      el.innerHTML = got
        ? `<span class="st-icon">${st.icon}</span><span class="st-name">${st.name}</span>`
        : `<span class="st-icon">?</span><span class="st-hint">${st.hint}</span>`;
      return el;
    }),
  );
}
