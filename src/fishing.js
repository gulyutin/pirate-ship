import * as THREE from 'three';
import { cube } from './voxel.js';
import { SEA_Y } from './terrain.js';

// Рыбалка: корабль стоит — капитан закидывает удочку с кормы.
// Поплавок ждёт, потом «Клюёт!» — успей нажать «Тянуть».
const CATCH = [
  { name: 'Сардина', gold: 1, w: 30, color: 0x9fb8c8 },
  { name: 'Скумбрия', gold: 2, w: 25, color: 0x5f8fa8 },
  { name: 'Камбала', gold: 3, w: 15, color: 0xa08a6a },
  { name: 'Тунец', gold: 5, w: 10, color: 0x3a5a8a },
  { name: 'Осьминог', gold: 4, w: 8, color: 0xc0608a },
  { name: 'Золотая рыбка', gold: 15, w: 3, color: 0xf6c944 },
  { name: 'Старый сапог', gold: 0, w: 9, color: 0x5a3a20 },
];
const BITE_WINDOW = 1.8; // сколько секунд можно тянуть, пока клюёт

function roll() {
  let r = Math.random() * CATCH.reduce((s, c) => s + c.w, 0);
  for (const c of CATCH) if ((r -= c.w) < 0) return c;
  return CATCH[0];
}

// hooks: say, crew, ship, gold(n), onCatch()
export function createFishing(scene, fx, sfx, hooks) {
  let state = 'idle'; // idle | wait | bite
  let t = 0;
  let rod = null;
  const bobber = new THREE.Group();
  cube(bobber, 0xe0302a, 0.5, 0.4, 0.5, 0, 0.2, 0);
  cube(bobber, 0xf4f4f4, 0.5, 0.3, 0.5, 0, 0.55, 0);
  cube(bobber, 0x333333, 0.06, 5, 0.06, 0, 3.2, 0); // леска
  bobber.visible = false;
  scene.add(bobber);
  const spot = new THREE.Vector3();

  const arm = () => hooks.crew.captain.userData.limbs[3];

  function start() {
    if (state !== 'idle') return;
    state = 'wait';
    t = 2 + Math.random() * 3;
    arm().rotation.x = -2.2;
    rod = cube(arm(), 0x7a5230, 0.15, 0.15, 5, 0, -1.3, -2.4);
    bobber.visible = true;
    sfx.splash();
    hooks.say('Закинули удочку… Ждём, когда клюнет!');
  }

  function stop() {
    if (state === 'idle') return;
    state = 'idle';
    rod?.removeFromParent();
    rod = null;
    arm().rotation.x = 0;
    bobber.visible = false;
  }

  function pull() {
    if (state === 'wait') {
      hooks.say('Рано! Подожди, пока клюнет.');
      return;
    }
    if (state !== 'bite') return;
    const c = roll();
    fx.burst(c.color, { x: spot.x, y: SEA_Y, z: spot.z }, 10, { speed: 3, up: 9, size: 0.6, life: 0.9, y: 0 });
    sfx.chest();
    const gold = c.gold * (hooks.mult?.() ?? 1); // карта «Рыбацкая удача»
    if (gold) hooks.gold(gold);
    hooks.say(gold ? `Улов: ${c.name}! +${gold}` : `Улов: ${c.name}! Ха-ха!`);
    hooks.onCatch();
    stop();
  }

  function update(dt, time) {
    if (state === 'idle') return;
    // поплавок у кормы, сбоку от корабля
    spot.set(5.5, 0, 6.5);
    hooks.ship.group.localToWorld(spot);
    t -= dt;
    if (state === 'wait') {
      bobber.position.set(spot.x, SEA_Y + Math.sin(time * 3) * 0.1, spot.z);
      if (t <= 0) {
        state = 'bite';
        t = BITE_WINDOW;
        fx.splash(spot.x, spot.z);
        sfx.squeak();
        hooks.say('Клюёт! Жми «Тянуть»!');
      }
    } else {
      bobber.position.set(spot.x, SEA_Y - 0.4 + Math.sin(time * 25) * 0.2, spot.z); // поплавок дёргается
      if (t <= 0) {
        state = 'wait';
        t = 2 + Math.random() * 3;
        hooks.say('Сорвалась! Ждём ещё.');
      }
    }
  }

  return {
    start,
    stop,
    pull,
    update,
    get active() {
      return state !== 'idle';
    },
  };
}
