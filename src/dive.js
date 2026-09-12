import * as THREE from 'three';
import { cube, glow } from './voxel.js';
import { SEA_Y } from './terrain.js';
import { createEnemyShip } from './ship.js';

// Ныряние к затонувшим кораблям. У каждого — сундук, жемчуг в раковинах и свой
// морской житель для альбома. Воздуха в шлеме хватает на 45 секунд.
export const SEABED = -26;
const AIR = 45;
const TAU = Math.PI * 2;
const SPECIAL = ['octopus', 'clownfish', 'jellyfish', 'pufferfish'];
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

// Шесть мест в открытом море, подальше от островов и друг от друга.
function wreckSites(islands) {
  const sites = [];
  for (let i = 0; i < 6; i++) {
    const R = 390 + i * 156;
    let best = null;
    let bestGap = -Infinity;
    for (let k = 0; k < 48; k++) {
      const a = (k / 48) * TAU + i * 0.37;
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;
      const gap = Math.min(...islands.map((isl) => Math.hypot(isl.x - x, isl.z - z) - isl.r), ...sites.map((s) => Math.hypot(s.x - x, s.z - z)));
      if (gap > bestGap) {
        bestGap = gap;
        best = { x, z };
      }
    }
    sites.push({ id: i, x: best.x, z: best.z, special: SPECIAL[i % SPECIAL.length] });
  }
  return sites;
}

// Медный водолазный шлем с круглым окошком.
export function makeHelmet() {
  const h = new THREE.Group();
  cube(h, 0xb8863a, 1.5, 1.5, 1.4, 0, 3.15, 0);
  cube(h, 0xd8a24a, 1.6, 0.3, 1.5, 0, 2.45, 0);
  cube(h, 0x2a6a7a, 0.9, 0.8, 0.1, 0, 3.15, -0.72);
  cube(h, 0xd8a24a, 1.1, 0.15, 0.12, 0, 3.6, -0.74);
  cube(h, 0xd8a24a, 1.1, 0.15, 0.12, 0, 2.7, -0.74);
  cube(h, 0x5a5a5a, 0.3, 0.3, 0.8, 0, 3.4, 0.9); // шланг
  return h;
}

const CREATURE = {
  octopus(g) {
    cube(g, 0x9a4a8a, 1.3, 1.2, 1.3, 0, 1.3, 0);
    for (const sx of [-1, 1]) cube(g, 0xffffff, 0.3, 0.3, 0.1, sx * 0.3, 1.4, -0.66);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      cube(g, 0x8a3a7a, 0.25, 0.25, 1.3, Math.cos(a) * 0.9, 0.4, Math.sin(a) * 0.9).rotation.y = -a + Math.PI / 2;
    }
  },
  clownfish(g) {
    cube(g, 0xf08a24, 0.5, 0.6, 1.1, 0, 0, 0);
    for (const z of [-0.2, 0.25]) cube(g, 0xffffff, 0.52, 0.62, 0.14, 0, 0, z);
    cube(g, 0xf08a24, 0.1, 0.5, 0.4, 0, 0, 0.7);
    cube(g, 0x111111, 0.52, 0.1, 0.1, 0, 0.1, -0.4);
  },
  jellyfish(g) {
    const m = new THREE.MeshLambertMaterial({ color: 0xf0a8e0, emissive: 0x6a2a5a, transparent: true, opacity: 0.75 });
    cube(g, m, 1.4, 0.8, 1.4, 0, 1.2, 0);
    for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4], [0, 0]]) cube(g, m, 0.12, 1.4, 0.12, x, 0.2, z);
  },
  pufferfish(g) {
    cube(g, 0xe8c85a, 1.1, 1.0, 1.1, 0, 0, 0);
    for (const [x, y, z] of [[0.6, 0, 0], [-0.6, 0, 0], [0, 0.55, 0], [0, 0, 0.6], [0, -0.5, 0]]) cube(g, 0xb89a3a, 0.2, 0.2, 0.2, x, y, z);
    for (const sx of [-1, 1]) cube(g, 0x111111, 0.15, 0.15, 0.1, sx * 0.25, 0.15, -0.56);
  },
};
const FISH_COLORS = [0x3a7fd0, 0xf4d23a, 0x4fb0a0, 0xe0605a];

// hooks: fx, sfx, say, gold(n), sticker(id), looted(id) → bool, markLooted(id), islands
export function createDive(scene, hooks) {
  const sites = wreckSites(hooks.islands);
  // обломки и бочка на поверхности над каждым затонувшим кораблём
  const floats = sites.map((s) => {
    const g = new THREE.Group();
    cube(g, 0x7a5230, 3, 0.3, 0.9, 0, 0, 0).rotation.y = 0.4;
    cube(g, 0x6a4424, 2.2, 0.3, 0.8, 1.2, 0, 1.5).rotation.y = -0.6;
    cube(g, 0x8a5a30, 1, 1.2, 1, -1.5, 0.3, -1);
    g.position.set(s.x, SEA_Y + 0.2, s.z);
    scene.add(g);
    return g;
  });
  let dive = null;
  let bubbleT = 0;
  let surfT = 0;

  function start(site) {
    const group = new THREE.Group();
    group.position.set(site.x, 0, site.z);
    scene.add(group);
    cube(group, 0xd8c890, 150, 2, 150, 0, SEABED - 1, 0); // песчаное дно
    for (let k = 0; k < 12; k++) {
      const a = k * 2.4;
      const r = 12 + (k % 4) * 7;
      cube(group, k % 2 ? 0x7a7f84 : 0x6a6f74, 2 + (k % 3), 1.2 + (k % 2), 2 + ((k + 1) % 3), Math.cos(a) * r, SEABED + 0.4, Math.sin(a) * r);
    }
    const weeds = [];
    for (let k = 0; k < 16; k++) {
      const a = k * 1.9;
      const r = 6 + (k % 5) * 5;
      const w = new THREE.Group();
      w.position.set(Math.cos(a) * r, SEABED, Math.sin(a) * r);
      for (let s = 0; s < 4; s++) cube(w, s % 2 ? 0x3f9f5a : 0x2f8a4a, 0.4, 1.4, 0.4, 0, 0.7 + s * 1.3, 0);
      group.add(w);
      weeds.push(w);
    }
    // затонувший корабль лежит на боку, мачта сломана
    const wreck = createEnemyShip();
    wreck.scale.setScalar(1.7);
    wreck.position.set(0, SEABED + 1.4, 0);
    wreck.rotation.set(0.1, 0.6, 0.35);
    // паруса за годы под водой выцвели и порвались — остались лохмотья
    const rag = new THREE.MeshLambertMaterial({ color: 0x5f7470 });
    wreck.traverse((o) => {
      if (o.isMesh && o.material.color?.getHex() === 0x1d1b1a) {
        o.material = rag;
        o.scale.y *= 0.4;
      }
    });
    group.add(wreck);
    cube(group, 0x3b2a18, 0.9, 0.9, 12, 7, SEABED + 0.6, 3).rotation.y = 0.5;
    // сундук
    let chest = null;
    if (!hooks.looted(site.id)) {
      chest = new THREE.Group();
      cube(chest, 0x7a4a26, 2.4, 1.4, 1.8, 0, 0.7, 0);
      cube(chest, 0xf6c944, 2.5, 0.3, 1.9, 0, 1.2, 0);
      glow(chest, 0xffd040, 5, 0, 1.5, 0, 0.5);
      chest.position.set(-4, SEABED, 5);
      group.add(chest);
    }
    // раковины с жемчугом
    const pearls = [];
    for (let k = 0; k < 6; k++) {
      const a = k * 1.05 + 0.4;
      const r = 9 + (k % 3) * 6;
      const p = new THREE.Group();
      cube(p, 0x9a9aa8, 1.2, 0.3, 1.0, 0, 0.15, 0);
      cube(p, 0xaaaab8, 1.2, 0.3, 1.0, 0, 0.7, 0.35).rotation.x = -0.7;
      cube(p, 0xffffff, 0.4, 0.4, 0.4, 0, 0.45, 0);
      glow(p, 0xffffff, 2.2, 0, 0.5, 0, 0.5);
      p.position.set(Math.cos(a) * r, SEABED + (k === 2 ? 3.2 : 0), Math.sin(a) * r);
      group.add(p);
      pearls.push({ g: p, got: false });
    }
    // стайки рыб
    const schools = [0, 1, 2].map((n) => {
      const fish = [];
      for (let k = 0; k < 6; k++) fish.push(cube(group, FISH_COLORS[(n + k) % 4], 0.35, 0.25, 0.7, 0, 0, 0));
      return { fish, r: 10 + n * 6, h: SEABED + 3 + n * 2.5, speed: 0.4 + n * 0.15, ph: n * 2 };
    });
    // особый житель этого корабля
    const creature = new THREE.Group();
    CREATURE[site.special](creature);
    group.add(creature);
    dive = { site, group, weeds, chest, pearls, schools, creature, air: AIR, got: 0, warned: false };
  }

  // куда ставить капитана, когда он нырнул
  const entry = () => ({ x: dive.site.x + 8, y: SEABED + 3, z: dive.site.z + 8 });

  function update(dt, t, cap) {
    if (!dive) return null;
    const { site } = dive;
    dive.air -= dt;
    if (!dive.warned && dive.air < 10) {
      dive.warned = true;
      hooks.say('🫧 Воздух заканчивается — пора наверх!');
      hooks.sfx.whistle();
    }
    for (const [i, w] of dive.weeds.entries()) w.rotation.z = Math.sin(t * 1.5 + i) * 0.2;
    for (const s of dive.schools) {
      s.fish.forEach((f, k) => {
        const a = t * s.speed + s.ph + k * 0.25;
        f.position.set(Math.cos(a) * s.r, s.h + Math.sin(t * 2 + k) * 0.4, Math.sin(a) * s.r);
        f.rotation.y = -a;
      });
    }
    const ca = t * 0.3;
    dive.creature.position.set(Math.cos(ca) * 7, SEABED + 1.5 + Math.sin(t * 1.3) * 0.8, Math.sin(ca) * 5);
    dive.creature.rotation.y = -ca;
    // пузыри из шлема
    if ((bubbleT -= dt) <= 0) {
      bubbleT = 0.4;
      hooks.fx.burst(0xe6f5ff, { x: cap.x, y: cap.y + 3.6, z: cap.z }, 2, { speed: 0.6, up: 2, size: 0.3, life: 1.6, y: 0, gravity: -3 });
    }
    const lx = cap.x - site.x;
    const lz = cap.z - site.z;
    for (const p of dive.pearls) {
      if (p.got) continue;
      if (dist(p.g.position.x, p.g.position.z, lx, lz) < 2.4 && Math.abs(p.g.position.y + 0.5 - cap.y) < 3) {
        p.got = true;
        dive.got++;
        dive.group.remove(p.g);
        hooks.fx.burst(0xffffff, { x: cap.x, y: cap.y + 1, z: cap.z }, 8, { speed: 4, up: 3, size: 0.4 });
        hooks.sfx.coin();
        hooks.gold(3);
        hooks.say(`🦪 Жемчужина! ${dive.got} из ${dive.pearls.length} · +3`);
      }
    }
    if (dive.chest && dist(-4, 5, lx, lz) < 3 && cap.y < SEABED + 5) {
      dive.group.remove(dive.chest);
      dive.chest = null;
      hooks.markLooted(site.id);
      hooks.gold(15);
      hooks.sfx.chest();
      hooks.fx.burst(0xf6c944, { x: cap.x, y: cap.y + 1, z: cap.z }, 16, { speed: 6, up: 4, size: 0.5 });
      hooks.say('🧰 Сундук с затонувшего корабля! +15', 3);
    }
    const c = dive.creature.position;
    if (dist(c.x, c.z, lx, lz) < 6) hooks.sticker(site.special);
    return dive.air <= 0 ? 'air' : null;
  }

  function end() {
    if (!dive) return;
    scene.remove(dive.group);
    dive = null;
  }

  // обломки на поверхности качаются, над ближними — пузыри
  function updateSurface(dt, t, fx, fz) {
    surfT -= dt;
    floats.forEach((g, i) => {
      const near = dist(g.position.x, g.position.z, fx, fz) < 260;
      g.visible = near;
      if (!near) return;
      g.position.y = SEA_Y + 0.2 + Math.sin(t * 1.4 + i) * 0.25;
      g.rotation.y = Math.sin(t * 0.3 + i) * 0.3;
      if (surfT <= 0) hooks.fx.burst(0xe6f5ff, { x: g.position.x + 2, y: SEA_Y, z: g.position.z }, 1, { speed: 1, up: 2, size: 0.4, life: 0.8, y: 0 });
    });
    if (surfT <= 0) surfT = 0.5;
  }

  return {
    start,
    entry,
    update,
    end,
    updateSurface,
    nearSite: (x, z, r) => sites.find((s) => dist(s.x, s.z, x, z) < r) ?? null,
    marks: (fx, fz) => sites.filter((s) => dist(s.x, s.z, fx, fz) < 260).map((s) => ({ x: s.x, z: s.z, glyph: '◈', color: '#7a5230' })),
    hud: () => (dive ? `🫧 ${Math.ceil(Math.max(0, dive.air))} · 🦪 ${dive.got}/${dive.pearls.length}` : null),
    get active() {
      return !!dive;
    },
    sites,
  };
}
