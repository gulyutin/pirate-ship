import * as THREE from 'three';
import { cube, glow } from './voxel.js';
import { SEA_Y } from './terrain.js';
import { createEnemyShip } from './ship.js';
import { turnToward } from './world.js';

// Боссы «Легенды о Кракене»: Морской змей, флагман Чёрной Бороды и сам Кракен.
// Каждый босс — «свой» враг мира (custom): пушки и пушкарь наводятся на него как на
// обычный бриг, а попадания приходят в onHit. Интерфейс как у испытаний:
// { update(dt, t, s) → 'win' | null, hud(), marks(), where(), dispose() }.
// ctx: scene, fx, sfx, say, world, battle, hurt(), chest(x, z), groundAt(x, z)
const TAU = Math.PI * 2;
const Q = Math.PI / 4;
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const bar = (hp, max) => `❤${Math.max(0, hp)}/${max}`;
const hitFx = (ctx, p, color) => {
  ctx.fx.burst(color, p, 10, { speed: 8, up: 5, size: 0.6, y: 1.5 });
  ctx.sfx.boom();
};

/* ---------- Азия: Морской змей — ныряет и выныривает вокруг острова ---------- */
function serpent(ctx, isl) {
  const MAX = 8;
  const SEG = 11;
  const SKIN = [0x2f8f7a, 0x3fa88a];
  const head = new THREE.Group();
  cube(head, SKIN[1], 2.4, 2.0, 3.2, 0, 0, 0);
  cube(head, 0x2a7a66, 2.6, 0.6, 2.2, 0, -0.9, -0.6); // челюсть
  cube(head, 0xc0392b, 1.8, 0.3, 1.6, 0, -0.45, -1.0); // пасть
  for (const sx of [-1, 1]) {
    cube(head, 0xf6e04a, 0.5, 0.5, 0.2, sx * 0.8, 0.5, -1.62);
    cube(head, 0x111111, 0.2, 0.34, 0.1, sx * 0.8, 0.5, -1.7);
    cube(head, 0xe8b830, 0.3, 1.2, 0.3, sx * 0.7, 1.3, 0.8).rotation.x = -0.5; // рожки
  }
  const segs = [];
  for (let i = 0; i < SEG; i++) {
    const s = 2.2 - i * 0.1;
    const m = new THREE.Group();
    cube(m, SKIN[i % 2], s, s, 2.4, 0, 0, 0);
    cube(m, 0xe8b830, 0.3, 0.9, 1.2, 0, s / 2 + 0.3, 0); // гребень
    ctx.scene.add(m);
    segs.push(m);
  }
  const R = isl.r + 38;
  let ang = Math.random() * TAU;
  let up = false;
  let phaseT = 3;
  let lift = 0;
  let spitT = 2;
  let dying = 0;
  let pop = 0;
  const it = ctx.world.addCustom({ kind: 'enemy', custom: true, g: head, r: 3.2, hp: MAX, hidden: true, onHit });
  const tmp = new THREE.Vector3();

  function onHit(n = 1) {
    if (it.hidden || dying) return;
    it.hp -= n;
    pop = 0.3;
    hitFx(ctx, head.position, 0x3fa88a);
    if (it.hp <= 0) {
      dying = 0.001;
      it.hidden = true;
      ctx.say('Змей побеждён! Он уплывает в глубину…', 3);
    }
  }

  return {
    update(dt, t, s) {
      if (dying) {
        dying += dt;
        lift = Math.max(-1, lift - dt);
      } else {
        phaseT -= dt;
        if (phaseT <= 0) {
          up = !up;
          phaseT = up ? 7 : 4;
          if (up) ctx.say('Змей вынырнул — огонь! 🐉');
        }
        lift += ((up ? 1 : 0) - lift) * Math.min(1, dt * 2);
        it.hidden = lift < 0.6;
      }
      ang += (10 / R) * dt;
      for (let i = 0; i < SEG; i++) {
        const a = ang - (i + 1) * 0.055;
        const base = -5 + lift * 6.5;
        segs[i].position.set(isl.x + Math.cos(a) * R, base + Math.sin(t * 3 - i * 0.7) * 1.2, isl.z + Math.sin(a) * R);
        segs[i].rotation.y = Math.atan2(Math.sin(a), -Math.cos(a));
      }
      head.position.set(isl.x + Math.cos(ang) * R, -4 + lift * 8, isl.z + Math.sin(ang) * R);
      head.rotation.y = Math.atan2(Math.sin(ang), -Math.cos(ang));
      pop = Math.max(0, pop - dt);
      head.scale.setScalar(1 + pop);
      // пока над водой — плюётся водяными шарами
      if (!dying && !it.hidden && dist(head.position.x, head.position.z, s.boat.x, s.boat.z) < 60 && (spitT -= dt) <= 0) {
        spitT = 2.5;
        ctx.battle.enemyFire(tmp.copy(head.position).setY(head.position.y + 1), s.boat.x, s.boat.z);
        ctx.sfx.enemyFire();
      }
      if (lift < 0.3 && !dying && Math.random() < dt * 4) ctx.fx.burst(0xe6f5ff, { x: head.position.x, y: SEA_Y, z: head.position.z }, 2, { speed: 2, up: 3, size: 0.5, life: 0.6, y: 0 });
      return dying > 2 ? 'win' : null;
    },
    hud: () => `🐉 ${bar(it.hp, MAX)}${it.hidden && !dying ? ' 💤' : ''}`,
    marks: () => [{ x: head.position.x, z: head.position.z, glyph: '§', color: '#2f8f7a' }],
    where: () => ({ x: head.position.x, y: 3, z: head.position.z }),
    dispose() {
      ctx.world.kill(it);
      segs.forEach((m) => ctx.scene.remove(m));
    },
  };
}

/* ---------- Европа: флагман Чёрной Бороды — большой, стреляет залпами по три ядра ---------- */
function blackbeard(ctx, isl) {
  const MAX = 12;
  const g = createEnemyShip();
  g.scale.setScalar(1.8);
  cube(g, 0xe8b830, 5.6, 0.3, 10.6, 0, 1.9, 0); // золотая кайма
  cube(g, 0x3b2a18, 0.6, 9, 0.6, 0, 5.5, -3.2); // вторая мачта
  cube(g, 0x1d1b1a, 5, 3.4, 0.3, 0, 6.8, -3.4);
  cube(g, 0xd8d2c4, 1.3, 1.3, 0.35, 0, 7, -3.4);
  for (const sx of [-1, 1]) for (const z of [-2, 0.5, 3]) cube(g, 0x2e2e30, 1.2, 0.5, 0.5, sx * 2.9, 1.3, z);
  // сам Чёрная Борода на корме: красный камзол, огромная чёрная борода, треуголка
  const bb = new THREE.Group();
  bb.position.set(0, 1.2, 3.6);
  g.add(bb);
  cube(bb, 0x7a1a1a, 1.2, 1.6, 0.8, 0, 1.3, 0);
  cube(bb, 0xf0c49a, 1, 1, 0.9, 0, 2.6, 0);
  cube(bb, 0x111111, 1.2, 0.9, 1.1, 0, 2.05, 0);
  cube(bb, 0x111111, 1.8, 0.35, 1.5, 0, 3.2, 0);
  cube(bb, 0x111111, 1.0, 0.6, 1.0, 0, 3.6, 0);
  g.position.set(isl.x + isl.r + 40, 0, isl.z);
  const it = ctx.world.addCustom({ kind: 'enemy', custom: true, g, r: 6, hp: MAX, onHit });
  let heading = 0;
  let fireT = 2;
  let dying = 0;
  let pop = 0;
  const muzzle = new THREE.Vector3();

  function onHit(n = 1) {
    if (dying) return;
    it.hp -= n;
    pop = 0.12;
    hitFx(ctx, g.position, 0x3d2b1f);
    if (it.hp <= 0) {
      dying = 0.001;
      it.hidden = true;
      ctx.sfx.sink();
      ctx.say('Флагман Чёрной Бороды тонет! 🏴‍☠️', 3);
    }
  }

  return {
    update(dt, t, s) {
      const p = g.position;
      if (dying) {
        dying += dt;
        p.y -= dt * (2 + dying * 4);
        g.rotation.z += dt * 0.4;
        if (dying > 2.5) {
          for (let i = 0; i < 3; i++) ctx.chest(p.x + (i - 1) * 6, p.z + 4);
          return 'win';
        }
        return null;
      }
      // кружит вокруг корабля игрока на расстоянии залпа
      const dx = s.boat.x - p.x;
      const dz = s.boat.z - p.z;
      const d = Math.hypot(dx, dz) || 1;
      let tx = dx / d;
      let tz = dz / d;
      if (d < 45) [tx, tz] = [-tz, tx];
      heading = turnToward(heading, Math.atan2(tx, tz), 0.8 * dt);
      const fx = Math.sin(heading);
      const fz = Math.cos(heading);
      if (ctx.groundAt(p.x + fx * 16, p.z + fz * 16) !== undefined) heading += dt * 2;
      else {
        p.x += fx * 12 * dt;
        p.z += fz * 12 * dt;
      }
      g.rotation.y = heading;
      g.rotation.z = Math.sin(t * 1.1) * 0.04;
      p.y = Math.sin(t * 1.3) * 0.4;
      pop = Math.max(0, pop - dt);
      g.scale.setScalar(1.8 * (1 + pop));
      // залп из трёх ядер: по кораблю и чуть впереди/сбоку
      if (d < 75 && (fireT -= dt) <= 0) {
        fireT = 3.4;
        const bh = s.boat.heading ?? 0;
        const ax = -Math.sin(bh);
        const az = -Math.cos(bh);
        for (const [f, side] of [[0, 0], [9, 4], [5, -6]]) {
          muzzle.set(0, 1.3, 0).applyMatrix4(g.matrixWorld);
          ctx.battle.enemyFire(muzzle, s.boat.x + ax * f + az * side, s.boat.z + az * f - ax * side);
        }
        ctx.sfx.cannon();
      }
      return null;
    },
    hud: () => `☠ ${bar(it.hp, MAX)}`,
    marks: () => [{ x: g.position.x, z: g.position.z, glyph: '☠', color: '#c0392b' }],
    where: () => ({ x: g.position.x, y: 3, z: g.position.z }),
    dispose: () => ctx.world.kill(it),
  };
}

/* ---------- Финал: Золотой Кракен — сначала щупальца, потом голова ---------- */
function kraken(ctx, lair) {
  const ARMS = 6;
  const HEAD_MAX = 10;
  const P1 = 0x8a3a7a;
  const P2 = 0x6a2a5e;
  const PINK = 0xe07ab0;
  // голова-купол с огромными глазами; смотрит на корабль
  const head = new THREE.Group();
  [9, 11, 11.6, 11, 9.6, 7.2, 4.2].forEach((w, i) => {
    cube(head, i % 2 ? P2 : P1, w, 1.8, w, 0, i * 1.8, 0);
    cube(head, i % 2 ? P1 : P2, w * 0.9, 1.8, w * 0.9, 0, i * 1.8, 0).rotation.y = Q;
  });
  for (const sx of [-1, 1]) {
    cube(head, 0xf6e04a, 2.4, 2.4, 0.4, sx * 2.4, 4.2, -5.6);
    cube(head, 0x111111, 0.6, 1.8, 0.2, sx * 2.4, 4.2, -5.85);
  }
  for (const [x, y] of [[-3, 7.5], [2, 8.6], [3.6, 6], [-1, 10]]) cube(head, PINK, 1, 1, 0.3, x, y, -4.9 + (y - 6) * 0.35);
  glow(head, 0xffd040, 14, 0, 12, 0, 0.3); // золотое сияние над макушкой
  head.position.set(lair.x, -16, lair.z);
  const headIt = ctx.world.addCustom({ kind: 'enemy', custom: true, g: head, r: 7, hp: HEAD_MAX, hidden: true, onHit: onHead });
  headIt.aimY = 5;

  const markerMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.45, depthTest: false, fog: false });
  const arms = [];
  let armsDown = 0;
  let phase = 'arms';
  let spawnT = 2;
  let dying = 0;
  let headLift = 0;

  function makeArm(x, z) {
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const s = 1.8 - i * 0.16;
      const bend = Math.sin(i * 0.35) * i * 0.3;
      cube(g, i % 2 ? P2 : P1, s, 1.7, s, bend, i * 1.6, 0);
      cube(g, PINK, 0.4, 0.4, 0.3, bend - s / 2, i * 1.6, 0); // присоски
    }
    g.position.set(x, -14, z);
    ctx.scene.add(g);
    const marker = cube(ctx.scene, markerMat, 7, 0.3, 7, x, -0.4, z);
    marker.renderOrder = 5;
    const arm = { g, marker, x, z, t: 0, state: 'warn', it: null };
    arms.push(arm);
    return arm;
  }

  function onArm(arm, n = 1) {
    if (arm.state !== 'up') return;
    arm.it.hp -= n;
    hitFx(ctx, { x: arm.x, y: 4, z: arm.z }, PINK);
    if (arm.it.hp <= 0) {
      arm.state = 'down';
      arm.t = 0;
      arm.it.hidden = true;
      armsDown++;
      if (phase === 'arms') {
        if (armsDown >= ARMS) {
          phase = 'head';
          headIt.hidden = false;
          ctx.say('Все щупальца отбиты! Кракен поднимает голову — огонь по голове! 🐙', 4);
        } else ctx.say(`Щупальце отбито! ${armsDown} из ${ARMS}`);
      }
    }
  }

  function onHead(n = 1) {
    if (phase !== 'head' || dying) return;
    headIt.hp -= n;
    hitFx(ctx, { x: head.position.x, y: head.position.y + 6, z: head.position.z }, 0xf6e04a);
    if (headIt.hp <= 0) {
      dying = 0.001;
      headIt.hidden = true;
      ctx.sfx.sink();
    }
  }

  function updateArm(arm, dt, t, s) {
    arm.t += dt;
    if (arm.state === 'warn') {
      arm.marker.visible = Math.floor(t * 8) % 2 === 0 || arm.t > 1;
      if (arm.t > 1.4) {
        arm.state = 'rise';
        arm.t = 0;
        ctx.scene.remove(arm.marker);
        ctx.fx.splash(arm.x, arm.z);
        ctx.sfx.splash();
        if (dist(arm.x, arm.z, s.boat.x, s.boat.z) < 6.5) ctx.hurt(); // не успел уплыть с метки
      }
    } else if (arm.state === 'rise') {
      arm.g.position.y = -14 + Math.min(1, arm.t / 0.5) * 12.4;
      if (arm.t > 0.5) {
        arm.state = 'up';
        arm.t = 0;
        arm.it = ctx.world.addCustom({ kind: 'enemy', custom: true, g: arm.g, r: 3, hp: 2, aimY: 4, onHit: (n) => onArm(arm, n) });
      }
    } else if (arm.state === 'up') {
      arm.g.rotation.z = Math.sin(t * 2 + arm.x) * 0.25;
      if (arm.t > 5) {
        arm.state = 'down';
        arm.t = 0;
        arm.it.hidden = true;
      }
    } else {
      arm.g.position.y -= dt * 18;
      if (arm.g.position.y < -16) {
        if (arm.it) ctx.world.kill(arm.it);
        ctx.scene.remove(arm.g);
        arm.dead = true;
      }
    }
  }

  return {
    update(dt, t, s) {
      // голова всплывает к бою за голову, тонет в конце
      const want = dying ? -20 : phase === 'head' ? -3 : -9;
      headLift += (want - headLift) * Math.min(1, dt * (dying ? 0.8 : 1.5));
      head.position.y = headLift + Math.sin(t * 1.2) * 0.4;
      head.rotation.y = Math.atan2(-(s.boat.x - head.position.x), -(s.boat.z - head.position.z));
      if (dying) {
        dying += dt;
        if (Math.random() < dt * 10) ctx.fx.burst(0xe6f5ff, { x: head.position.x + (Math.random() - 0.5) * 10, y: SEA_Y, z: head.position.z + (Math.random() - 0.5) * 10 }, 3, { speed: 3, up: 6, size: 0.7, life: 0.8, y: 0 });
      }
      for (const arm of arms) updateArm(arm, dt, t, s);
      for (let i = arms.length - 1; i >= 0; i--) if (arms[i].dead) arms.splice(i, 1);
      // новые щупальца бьют туда, где сейчас корабль
      const live = arms.filter((a) => a.state !== 'down').length;
      const cap = phase === 'arms' ? 2 : 1;
      if (!dying && s.mode === 'sea' && live < cap && (spawnT -= dt) <= 0) {
        spawnT = phase === 'arms' ? 2.2 : 4;
        makeArm(s.boat.x + (Math.random() - 0.5) * 6, s.boat.z + (Math.random() - 0.5) * 6);
      }
      return dying > 3 ? 'win' : null;
    },
    hud: () => (phase === 'arms' ? `🐙 щупальца ${armsDown}/${ARMS}` : `🐙 ${bar(headIt.hp, HEAD_MAX)}`),
    marks: () => [{ x: lair.x, z: lair.z, glyph: '✺', color: '#8a3a7a' }],
    where: () => ({ x: head.position.x, y: 6, z: head.position.z }),
    dispose() {
      ctx.world.kill(headIt);
      for (const arm of arms) {
        if (arm.it) ctx.world.kill(arm.it);
        ctx.scene.remove(arm.g, arm.marker);
      }
    },
  };
}

export const BOSSES = { serpent, blackbeard };
export { kraken };
