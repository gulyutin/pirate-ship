import * as THREE from 'three';
import { cube } from './voxel.js';
import { SEA_Y } from './terrain.js';

// Живой океан: дельфины прыгают у носа корабля, вдали всплывает кит
// и пускает фонтан, над мачтой кружат чайки.
const TAU = Math.PI * 2;
const JUMP = 1.1; // сколько дельфин в воздухе, с
const CYCLE = 2.8; // полный цикл «прыжок — под водой»

function makeDolphin() {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  const B = 0x6f8fa8;
  cube(g, B, 0.9, 0.8, 3);
  cube(g, 0xdfe8ee, 0.7, 0.3, 2.4, 0, -0.35, 0); // светлое брюшко
  cube(g, B, 0.45, 0.4, 0.9, 0, -0.1, -1.9); // нос
  cube(g, B, 0.2, 0.7, 0.7, 0, 0.6, 0.3).rotation.x = -0.4; // плавник
  cube(g, B, 1.4, 0.15, 0.5, 0, 0, 1.7); // хвост
  cube(g, 0x1a1a1a, 0.95, 0.12, 0.12, 0, 0.15, -1.1); // глаза
  return g;
}

function makeWhale() {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  const B = 0x3f5a70;
  cube(g, B, 3.2, 2.4, 9);
  cube(g, 0xd8e0e6, 2.6, 0.6, 7, 0, -1.2, -0.5);
  cube(g, B, 2.6, 2, 2, 0, -0.1, -5.2); // голова
  cube(g, B, 1.6, 1.2, 2.4, 0, 0, 5.4);
  const tail = new THREE.Group();
  tail.position.set(0, 0, 6.4);
  g.add(tail);
  cube(tail, B, 5, 0.3, 1.6, 0, 0, 0.6); // хвост-плавник
  cube(g, B, 0.3, 1, 1.4, 0, 1.6, 1.5);
  for (const sx of [-1, 1]) cube(g, B, 1.8, 0.25, 1, sx * 2.2, -0.8, -2.5);
  cube(g, 0x1a1a1a, 3.3, 0.25, 0.25, 0, 0.2, -4.2);
  g.userData.tail = tail;
  return g;
}

function makeGull() {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  cube(g, 0xf4f4f4, 0.5, 0.45, 1.2);
  cube(g, 0xf4f4f4, 0.42, 0.42, 0.42, 0, 0.18, -0.72);
  cube(g, 0xe8a030, 0.14, 0.12, 0.36, 0, 0.12, -1.08); // клюв
  cube(g, 0xd8dde2, 0.4, 0.08, 0.4, 0, 0, 0.78);
  g.userData.wings = [-1, 1].map((sx) => {
    const w = new THREE.Group();
    w.position.set(sx * 0.25, 0.1, 0);
    g.add(w);
    cube(w, 0xdfe4e8, 1.4, 0.08, 0.6, sx * 0.7, 0, 0);
    cube(w, 0x3a3a3a, 0.4, 0.09, 0.6, sx * 1.55, 0, 0); // тёмные кончики
    return w;
  });
  return g;
}

// hooks: say(msg)
export function createOcean(scene, fx, sfx, hooks) {
  const dolphins = [0, 1, 2].map((i) => {
    const g = makeDolphin();
    g.visible = false;
    scene.add(g);
    return { g, i, side: i % 2 ? 1 : -1, phase: i * 0.9, inAir: false };
  });
  const whale = { g: makeWhale(), active: false, t: 0, x: 0, z: 0, heading: 0, spouts: 0, spoutT: 0 };
  whale.g.visible = false;
  scene.add(whale.g);
  const gulls = [0, 1, 2].map((i) => {
    const g = makeGull();
    scene.add(g);
    return { g, i };
  });
  let podT = 0; // сколько секунд стая плывёт с нами
  let whaleT = 25;
  let cryT = 8;
  let toldDolphins = false;

  const plop = (x, z) => fx.burst(0xe6f5ff, { x, y: SEA_Y, z }, 5, { speed: 4, up: 5, size: 0.6, life: 0.6, y: 0 });

  // Дельфины появляются, когда корабль идёт полным ходом, и прыгают у носа.
  function updateDolphins(t, c) {
    const fwdX = -Math.sin(c.heading);
    const fwdZ = -Math.cos(c.heading);
    const rX = Math.cos(c.heading);
    const rZ = -Math.sin(c.heading);
    for (const d of dolphins) {
      const along = 9 + d.i * 3.5;
      const lat = d.side * (5 + d.i * 1.2);
      const x = c.x + fwdX * along + rX * lat;
      const z = c.z + fwdZ * along + rZ * lat;
      if (podT < 1.5 || c.groundAt(x, z) !== undefined) {
        d.g.visible = false;
        d.inAir = false;
        continue;
      }
      const u = ((t + d.phase) % CYCLE) / JUMP;
      if (u < 1) {
        if (!d.inAir) {
          d.inAir = true;
          plop(x, z);
          if (d.i === 0) sfx.squeak();
        }
        d.g.visible = true;
        d.g.position.set(x, SEA_Y + Math.sin(u * Math.PI) * 3 - 0.3, z);
        d.g.rotation.set(Math.cos(u * Math.PI) * 0.8, c.heading, 0); // нос вверх — потом вниз
      } else if (d.inAir) {
        d.inAir = false;
        d.g.visible = false;
        plop(x, z);
      }
    }
  }

  // Кит всплывает впереди-сбоку, дважды пускает фонтан и уходит на глубину хвостом вверх.
  function updateWhale(dt, c) {
    if (!whale.active) {
      if (c.mode !== 'sea' || Math.hypot(c.x, c.z) < 120) return;
      whaleT -= dt;
      if (whaleT > 0) return;
      whaleT = 35 + Math.random() * 25;
      for (let n = 0; n < 6; n++) {
        const a = c.heading + (Math.random() - 0.5) * 2;
        const x = c.x - Math.sin(a) * 50;
        const z = c.z - Math.cos(a) * 50;
        const clear = [[0, 0], [10, 0], [-10, 0], [0, 10], [0, -10]].every(([dx, dz]) => c.groundAt(x + dx, z + dz) === undefined);
        if (!clear) continue;
        Object.assign(whale, { active: true, t: 0, x, z, heading: Math.random() * TAU, spouts: 0, spoutT: 0 });
        whale.g.visible = true;
        sfx.whale();
        hooks.say('Смотри, кит пускает фонтан!');
        return;
      }
      return;
    }
    const w = (whale.t += dt);
    whale.x -= Math.sin(whale.heading) * 3 * dt;
    whale.z -= Math.cos(whale.heading) * 3 * dt;
    let y;
    let pitch = 0;
    if (w < 2) {
      y = SEA_Y - 5 + (w / 2) * 4.2;
    } else if (w < 9) {
      y = SEA_Y - 0.8 + Math.sin(w * 1.5) * 0.2;
    } else {
      const u = (w - 9) / 2.5;
      y = SEA_Y - 0.8 - u * 6;
      pitch = -u * 0.9; // голова вниз, хвост над водой
    }
    whale.g.position.set(whale.x, y, whale.z);
    whale.g.rotation.set(pitch, whale.heading, 0);
    whale.g.userData.tail.rotation.x = Math.sin(w * 2) * 0.25;
    if (whale.spouts < 2 && w > [3, 6.5][whale.spouts]) {
      whale.spouts++;
      whale.spoutT = 1.4;
      sfx.splash();
    }
    if (whale.spoutT > 0) {
      whale.spoutT -= dt;
      const head = { x: whale.x - Math.sin(whale.heading) * 3.5, y: y + 1.3, z: whale.z - Math.cos(whale.heading) * 3.5 };
      fx.burst(0xe6f5ff, head, 2, { speed: 2.5, up: 10, size: 0.8, life: 1.1, y: 0, gravity: 12 });
    }
    if (w > 11.5) {
      whale.active = false;
      whale.g.visible = false;
    }
  }

  // Чайки кружат над кораблём (или над капитаном на острове) и машут крыльями.
  function updateGulls(dt, t, c) {
    for (const s of gulls) {
      const a = t * (0.45 + s.i * 0.07) + s.i * 2.1;
      const r = 9 + s.i * 2.5;
      s.g.position.set(c.fx + Math.cos(a) * r, 24 + s.i * 2 + Math.sin(t * 0.8 + s.i) * 1.5, c.fz + Math.sin(a) * r);
      s.g.rotation.set(0, Math.atan2(Math.sin(a), -Math.cos(a)), -0.3);
      const f = Math.sin(t * 7 + s.i * 1.7) * 0.55;
      s.g.userData.wings[0].rotation.z = -f;
      s.g.userData.wings[1].rotation.z = f;
    }
    cryT -= dt;
    if (cryT <= 0) {
      cryT = 8 + Math.random() * 10;
      sfx.gull();
    }
  }

  // c: { x, z, heading, speed, mode, fx, fz, groundAt }
  function update(dt, t, c) {
    podT = c.mode === 'sea' && c.speed > 10 ? podT + dt : 0;
    if (podT > 1.5 && !toldDolphins) {
      toldDolphins = true;
      hooks.say('Смотри, дельфины плывут рядом!');
    }
    updateDolphins(t, c);
    updateWhale(dt, c);
    updateGulls(dt, t, c);
  }

  return { update };
}
