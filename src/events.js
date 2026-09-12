import * as THREE from 'three';
import { cube } from './voxel.js';
import { SEA_Y } from './terrain.js';
import { createEnemyShip } from './ship.js';

// Случайные события в море — каждый заплыв немного не такой, как прошлый:
// торговец картами, туман с сундуками, бутылка с запиской, корабль-призрак.
const FIRST_EVENT = 40; // первые секунды в море — спокойно
const EVERY = [45, 75];
const KINDS = ['merchant', 'fog', 'bottle', 'ghost'];
const TAU = Math.PI * 2;

function makeMerchant() {
  const g = new THREE.Group();
  cube(g, 0x8a5a30, 4, 1.4, 8, 0, -0.4, 0);
  cube(g, 0xa87444, 4.4, 0.6, 8.4, 0, 0.5, 0);
  for (const x of [-1.8, 1.8]) for (const z of [-3, 3]) cube(g, 0x6a4424, 0.4, 4, 0.4, x, 2.6, z);
  // полосатый навес лавки
  for (let i = 0; i < 6; i++) cube(g, i % 2 ? 0xf4ecd8 : 0xc0392b, 4.6, 0.4, 1.2, 0, 4.7, -3 + i * 1.2);
  cube(g, 0x2f6ac0, 1.1, 1.4, 0.8, 0, 1.6, 1.5); // торговец
  cube(g, 0xe0b48a, 1, 1, 1, 0, 2.8, 1.5);
  cube(g, 0xf4f4f4, 1.3, 0.8, 1.2, 0, 3.6, 1.5); // чалма
  cube(g, 0xc0392b, 0.4, 0.4, 0.4, 0, 3.7, 0.9);
  cube(g, 0xb8901f, 1.2, 0.8, 1, -1, 1.3, -1.5); // сундучок с товаром
  // над лодкой крутится большая карта удачи — видно издалека
  const card = new THREE.Group();
  cube(card, 0x7a3fb0, 2.2, 3, 0.3, 0, 0, 0);
  cube(card, 0xf6c944, 2.6, 0.3, 0.4, 0, 1.5, 0);
  cube(card, 0xf6c944, 2.6, 0.3, 0.4, 0, -1.5, 0);
  cube(card, 0xf6c944, 0.3, 3, 0.4, -1.2, 0, 0);
  cube(card, 0xf6c944, 0.3, 3, 0.4, 1.2, 0, 0);
  cube(card, 0x5fd36a, 0.8, 0.8, 0.5, 0, 0.2, 0); // клевер
  card.position.y = 9;
  g.add(card);
  g.userData.card = card;
  return g;
}

function makeBottle() {
  const g = new THREE.Group();
  const glass = new THREE.MeshLambertMaterial({ color: 0x7fd0a0, transparent: true, opacity: 0.75 });
  const b = new THREE.Group();
  cube(b, glass, 0.9, 0.9, 2, 0, 0, 0);
  cube(b, glass, 0.45, 0.45, 0.8, 0, 0, 1.3);
  cube(b, 0x8a5a30, 0.5, 0.5, 0.3, 0, 0, 1.8);
  cube(b, 0xf4ecd8, 0.5, 0.5, 1.4, 0, 0, 0); // записка внутри
  b.rotation.x = -0.25;
  g.add(b);
  return g;
}

const ghostMat = new THREE.MeshLambertMaterial({
  color: 0xa8ffe0,
  emissive: 0x2a9a78,
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
});

function makeGhost() {
  const g = createEnemyShip();
  g.traverse((o) => {
    if (o.isMesh) {
      o.material = ghostMat;
      o.castShadow = false;
    }
  });
  g.scale.setScalar(1.25);
  return g;
}

// hooks: say, chest(x, z), merchant(), bottle(), landNear(x, z, r)
export function createEvents(scene, fx, sfx, hooks) {
  let timer = FIRST_EVENT;
  let last = '';
  let ev = null; // текущее событие
  let fog = 0; // 0..1 — насколько сгустился туман

  function clear() {
    if (ev?.g) scene.remove(ev.g);
    ev = null;
    timer = FIRST_EVENT;
  }

  // точка впереди по курсу, где нет суши
  function spotAhead(s, dist, spread) {
    for (let n = 0; n < 10; n++) {
      const a = s.heading + (Math.random() - 0.5) * spread;
      const d = dist + Math.random() * 20;
      const x = s.x - Math.sin(a) * d;
      const z = s.z - Math.cos(a) * d;
      if (!hooks.landNear(x, z, 10)) return { x, z };
    }
    return null;
  }

  function start(kind, s) {
    if (kind === 'merchant') {
      const p = spotAhead(s, 70, 1.2);
      if (!p) return false;
      const g = makeMerchant();
      g.position.set(p.x, 0, p.z);
      scene.add(g);
      ev = { kind, g, t: 60, used: false, near: false };
      hooks.say('Впереди лодка торговца! Подплыви — у него карты удачи', 3);
    } else if (kind === 'bottle') {
      const p = spotAhead(s, 55, 0.8);
      if (!p) return false;
      const g = makeBottle();
      g.position.set(p.x, SEA_Y, p.z);
      scene.add(g);
      ev = { kind, g, t: 50 };
      hooks.say('В волнах бутылка с запиской! Подплыви и достань', 3);
    } else if (kind === 'ghost') {
      const a = Math.random() * TAU;
      const g = makeGhost();
      g.position.set(s.x + Math.cos(a) * 60, 0, s.z + Math.sin(a) * 60);
      scene.add(g);
      ev = { kind, g, t: 35, a, heading: 0 };
      hooks.say('Корабль-призрак! Догони его — он рассыплется на сундуки', 3);
      sfx.goof();
    } else {
      ev = { kind, t: 28 };
      for (let i = 0; i < 3; i++) {
        const p = spotAhead(s, 35 + i * 15, 2.4);
        if (p) hooks.chest(p.x, p.z);
      }
      hooks.say('Туман! В нём спрятаны сундуки — ищи!', 3);
    }
    last = kind;
    return true;
  }

  function end() {
    if (ev?.g) scene.remove(ev.g);
    ev = null;
    timer = EVERY[0] + Math.random() * (EVERY[1] - EVERY[0]);
  }

  // s: { x, z, heading, speed, mode }
  function update(dt, t, s) {
    const atSea = s.mode === 'sea';
    fog += ((ev?.kind === 'fog' && ev.t > 3 ? 1 : 0) - fog) * Math.min(1, dt * 0.8);

    if (!atSea && !ev) return;
    if (!ev) {
      timer -= dt;
      if (timer <= 0) {
        const kinds = KINDS.filter((k) => k !== last);
        if (!start(kinds[Math.floor(Math.random() * kinds.length)], s)) timer = 5;
      }
      return;
    }

    ev.t -= dt;
    const g = ev.g;
    const d = g ? Math.hypot(g.position.x - s.x, g.position.z - s.z) : 0;
    if (ev.kind === 'merchant') {
      g.position.y = Math.sin(t * 1.5) * 0.3;
      g.rotation.z = Math.sin(t * 1.2) * 0.05;
      g.userData.card.rotation.y += dt * 2;
      g.userData.card.position.y = 9 + Math.sin(t * 2) * 0.5;
      // подплыл — торговец показывает карты; снова — только если отплыл и вернулся
      if (atSea && d < 12 && !ev.near) {
        ev.near = true;
        if (hooks.merchant()) ev.t = Math.min(ev.t, 4);
      } else if (d > 18) {
        ev.near = false;
      }
    } else if (ev.kind === 'bottle') {
      g.position.y = SEA_Y + Math.sin(t * 2) * 0.3;
      g.rotation.y += dt * 0.6;
      if (atSea && d < 7) {
        fx.splash(g.position.x, g.position.z);
        sfx.rescue();
        hooks.bottle();
        ev.t = 0;
      }
    } else if (ev.kind === 'ghost') {
      // кружит вокруг корабля и не стреляет — только пугает «бу!»
      ev.a += dt * 0.35;
      const tx = s.x + Math.cos(ev.a) * 45;
      const tz = s.z + Math.sin(ev.a) * 45;
      const dx = tx - g.position.x;
      const dz = tz - g.position.z;
      const k = Math.min(1, dt * 0.6);
      g.position.x += dx * k;
      g.position.z += dz * k;
      if (Math.hypot(dx, dz) > 0.5) ev.heading = Math.atan2(dx, dz);
      g.rotation.y = ev.heading;
      g.position.y = 1 + Math.sin(t * 1.3) * 0.8;
      ghostMat.opacity = 0.35 + Math.sin(t * 3) * 0.12;
      if (atSea && d < 11) {
        fx.burst(0xa8ffe0, g.position, 30, { speed: 12, up: 8, y: 4 });
        sfx.boom();
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU;
          hooks.chest(g.position.x + Math.cos(a) * 6, g.position.z + Math.sin(a) * 6);
        }
        hooks.say('Бу-у! Призрак рассыпался, а сундуки остались!', 3);
        ev.t = 0;
      } else if (ev.t <= 0) {
        hooks.say('Корабль-призрак растаял в тумане…');
      }
    }
    if (ev.t <= 0) end();
  }

  // значки на мини-карте
  function marks() {
    if (!ev?.g) return [];
    const glyph = { merchant: '$', bottle: '?', ghost: '☠' }[ev.kind];
    const color = { merchant: '#d4a020', bottle: '#2f8fcf', ghost: '#2a9a78' }[ev.kind];
    return [{ x: ev.g.position.x, z: ev.g.position.z, glyph, color }];
  }

  return {
    update,
    clear,
    marks,
    start: (kind, s) => {
      if (ev) end();
      return start(kind, s);
    },
    get fog() {
      return fog;
    },
    get kind() {
      return ev?.kind ?? null;
    },
  };
}
