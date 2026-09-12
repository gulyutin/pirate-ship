import * as THREE from 'three';
import { cube, glow } from './voxel.js';
import { SEA_Y } from './terrain.js';

// Испытания, которые охраняют ключи в сюжете «Легенда о Кракене».
// Каждое — объект { update(dt, t, s) → 'win' | null, hud(), marks(), dispose() }.
// s: { mode, boat: {x, z}, cap: {x, y, z} }
const TAU = Math.PI * 2;
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

/* ---------- Россия: Жар-птица — догони три раза, и она подарит ключ ---------- */
function firebird(ctx, isl) {
  const g = new THREE.Group();
  const FIRE = [0xff5a1a, 0xff8a1a, 0xffc030, 0xfff08a];
  cube(g, FIRE[1], 1.2, 0.9, 2, 0, 0, 0); // тело
  cube(g, FIRE[2], 0.8, 0.8, 0.8, 0, 0.45, -1.3); // голова
  cube(g, 0xfff08a, 0.3, 0.25, 0.5, 0, 0.35, -1.9); // клюв
  for (const x of [-0.25, 0, 0.25]) cube(g, FIRE[0], 0.14, 0.6, 0.14, x, 1.05, -1.25); // хохолок
  for (const x of [-0.3, 0.3]) cube(g, 0x2a1a10, 0.12, 0.12, 0.1, x, 0.55, -1.72);
  const wings = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.6, 0.2, 0);
    g.add(pivot);
    cube(pivot, FIRE[0], 2.2, 0.15, 1.4, side * 1.1, 0, 0);
    cube(pivot, FIRE[2], 1.4, 0.16, 0.9, side * 1.6, 0.02, 0.35);
    return pivot;
  });
  // хвост из длинных перьев веером
  for (let k = -2; k <= 2; k++) cube(g, FIRE[(k + 2) % 4], 0.3, 0.12, 3.6 - Math.abs(k) * 0.5, k * 0.35, 0.1, 2.6).rotation.y = k * 0.15;
  glow(g, 0xffa040, 9, 0, 0, 0, 0.6);
  ctx.scene.add(g);

  const R = isl.r + 45;
  let ang = Math.random() * TAU;
  let speed = 13;
  let feathers = 0;
  let cool = 0;
  let trailT = 0;
  const pos = new THREE.Vector3();

  return {
    update(dt, t, s) {
      ang += (speed / R) * dt;
      pos.set(isl.x + Math.cos(ang) * R, 7 + Math.sin(t * 2) * 1.2, isl.z + Math.sin(ang) * R);
      g.position.copy(pos);
      g.rotation.y = Math.atan2(-Math.sin(ang), Math.cos(ang)) + Math.PI; // клювом по ходу полёта
      const flap = Math.sin(t * 10) * 0.7;
      wings[0].rotation.z = flap;
      wings[1].rotation.z = -flap;
      if ((trailT -= dt) <= 0) {
        trailT = 0.07;
        ctx.fx.burst(Math.random() < 0.5 ? 0xff8a1a : 0xffd040, pos, 1, { speed: 1, up: 0.5, size: 0.4, life: 0.6, y: 0, gravity: 0 });
      }
      cool -= dt;
      if (s.mode === 'sea' && cool <= 0 && dist(pos.x, pos.z, s.boat.x, s.boat.z) < 15) {
        feathers++;
        cool = 2;
        ang += 1.3; // упорхнула вперёд
        speed += 3;
        ctx.fx.burst(0xffc030, pos, 20, { speed: 10, up: 6, size: 0.5, life: 0.9 });
        ctx.sfx.rescue();
        if (feathers < 3) ctx.say(`Перо Жар-птицы! ${feathers} из 3 🔥`);
      }
      return feathers >= 3 ? 'win' : null;
    },
    hud: () => `🔥 перья ${feathers}/3`,
    marks: () => [{ x: pos.x, z: pos.z, glyph: '♦', color: '#ff8a1a' }],
    where: () => pos,
    dispose: () => ctx.scene.remove(g),
  };
}

/* ---------- Америка: гонка через 8 колец вокруг острова ---------- */
function race(ctx, isl) {
  const N = 8;
  const R = isl.r + 50;
  const TIME = 90;
  const white = new THREE.MeshLambertMaterial({ color: 0xf4f1e8 });
  const red = new THREE.MeshLambertMaterial({ color: 0xd8453a });
  const gold = new THREE.MeshBasicMaterial({ color: 0xffd040 });
  const rings = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const g = new THREE.Group();
    g.position.set(isl.x + Math.cos(a) * R, 3, isl.z + Math.sin(a) * R);
    g.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)); // кольцо поперёк круга — плыть сквозь
    const parts = [];
    for (let k = 0; k < 14; k++) {
      const b = (k / 14) * TAU;
      parts.push(cube(g, k % 2 ? white : red, 1.4, 1.4, 1.4, Math.cos(b) * 7, Math.sin(b) * 7, 0));
    }
    const shine = glow(g, 0xffd040, 18, 0, 0, 0, 0.5);
    ctx.scene.add(g);
    rings.push({ g, parts, shine });
  }
  let next = 0;
  let left = 0;
  let running = false;
  const paint = () =>
    rings.forEach((r, i) => {
      r.parts.forEach((p, k) => (p.material = i === next ? gold : k % 2 ? white : red));
      r.shine.visible = i === next;
    });
  paint();

  return {
    update(dt, t, s) {
      rings[next].g.rotation.z = Math.sin(t * 2) * 0.1;
      if (running) {
        left -= dt;
        if (left <= 0) {
          running = false;
          next = 0;
          paint();
          ctx.sfx.nope();
          ctx.say('Время вышло! Плыви к золотому кольцу и попробуй ещё', 3);
        }
      }
      const c = rings[next].g.position;
      if (s.mode === 'sea' && dist(c.x, c.z, s.boat.x, s.boat.z) < 9) {
        ctx.fx.burst(0xffd040, c, 16, { speed: 8, up: 5, size: 0.5 });
        ctx.sfx.coin();
        next++;
        if (next === 1) {
          running = true;
          left = TIME;
          ctx.say(`Гонка началась! ${TIME} секунд на все кольца 🏁`, 3);
        }
        if (next >= N) return 'win';
        paint();
      }
      return null;
    },
    hud: () => (running ? `🏁 ${next}/${N} · ⏱${Math.ceil(left)}` : '🏁 к золотому кольцу'),
    marks: () => {
      const c = rings[Math.min(next, N - 1)].g.position;
      return [{ x: c.x, z: c.z, glyph: '◎', color: '#d4a020' }];
    },
    where: () => rings[Math.min(next, N - 1)].g.position,
    dispose: () => rings.forEach((r) => ctx.scene.remove(r.g)),
  };
}

/* ---------- Африка: шесть золотых скарабеев на острове (один — на вершине паркура) ---------- */
function scarabs(ctx, isl) {
  const N = 6;
  const bugs = [];
  const spots = [];
  if (isl.summit) spots.push({ x: isl.summit.x, y: isl.summit.y, z: isl.summit.z });
  const cells = isl.cells.filter((c) => c.kind !== 'sand');
  for (let n = 0; spots.length < N && n < 200; n++) {
    const c = cells[Math.floor(Math.random() * cells.length)];
    if (!c) break;
    const p = ctx.cellPos(c);
    if (spots.every((s) => dist(s.x, s.z, p.x, p.z) > 6)) spots.push(p);
  }
  for (const p of spots) {
    const g = new THREE.Group();
    cube(g, 0xe8b830, 1.0, 0.5, 1.3, 0, 0, 0);
    cube(g, 0xb8901f, 0.08, 0.52, 1.1, 0, 0.02, 0.1); // шов на спинке
    cube(g, 0xe8b830, 0.6, 0.4, 0.5, 0, 0, -0.8); // голова
    for (const sx of [-1, 1]) for (const z of [-0.4, 0, 0.4]) cube(g, 0x8a6a1a, 0.5, 0.1, 0.1, sx * 0.65, -0.2, z);
    glow(g, 0xffd040, 3.5, 0, 0, 0, 0.45);
    g.position.set(p.x, p.y + 1.2, p.z);
    ctx.scene.add(g);
    bugs.push({ g, y: p.y + 1.2, got: false });
  }
  let count = 0;

  return {
    update(dt, t, s) {
      for (const b of bugs) {
        if (b.got) continue;
        b.g.rotation.y += dt * 2;
        b.g.position.y = b.y + Math.sin(t * 3 + b.y) * 0.3;
        if (s.mode === 'land' && dist(b.g.position.x, b.g.position.z, s.cap.x, s.cap.z) < 2.6 && Math.abs(b.y - s.cap.y) < 3.5) {
          b.got = true;
          ctx.scene.remove(b.g);
          count++;
          ctx.fx.burst(0xffd040, b.g.position, 14, { speed: 8, up: 6, size: 0.5 });
          ctx.sfx.chest();
          if (count < bugs.length) ctx.say(`Золотой скарабей! ${count} из ${bugs.length} 🪲`);
        }
      }
      return count >= bugs.length ? 'win' : null;
    },
    hud: (s) => (s.mode === 'land' ? `🪲 ${count}/${bugs.length}` : '🪲 высадись!'),
    marks: () => [],
    points: () => bugs.filter((b) => !b.got).map((b) => b.g.position),
    where: () => ({ x: isl.x, y: 4, z: isl.z }),
    dispose: () => bugs.forEach((b) => ctx.scene.remove(b.g)),
  };
}

export const TRIALS = { firebird, race, scarabs };
