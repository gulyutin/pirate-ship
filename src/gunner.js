import * as THREE from 'three';
import { cube } from './voxel.js';

// Пушкарь. Кто записан в "pushkari" в crew.json — носит красную бандану и повязку на глаз,
// а в море время от времени сам стреляет из носовой пушки фейерверком:
// рядом враг — топит его одним залпом; рядом сундук или бочка — цепляет гарпуном и тянет
// к кораблю; никого нет — устраивает салют.
const SPARKS = [0xe0302a, 0xf4d23a, 0x3a7fd0, 0x4fb05a, 0xf07ab8, 0xffffff];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// hooks: say, fx, sfx, mode(), ship (группа корабля), busy(p), findEnemy(), sinkEnemy(it), findLoot()
export function createGunner(scene, crew, hooks) {
  const pool = crew.people.filter((p) => p.gunner);
  let shootT = 30 + Math.random() * 10;
  let shot = null; // летящий снаряд: { kind, target, from, t, dur }
  let aim = null; // выстрел: пушкарь подпрыгивает от отдачи
  const pos = new THREE.Vector3();
  const hook = new THREE.Vector3();
  const ball = cube(scene, new THREE.MeshBasicMaterial({ color: 0xffb030 }), 0.9, 0.9, 0.9);
  ball.visible = false;
  const rope = cube(scene, new THREE.MeshBasicMaterial({ color: 0x5a3a20 }), 0.12, 0.12, 1);
  rope.visible = false;
  const bow = (out) => out.set(0, 2.2, -9).applyMatrix4(hooks.ship.matrixWorld);
  const v = (p, m, f) => (p.fem ? f : m);

  function fire(kind, target) {
    const who = pool.find((p) => p.alive && !p.fall && !hooks.busy(p));
    if (!who) return false;
    aim = { who, t: 0 };
    const from = bow(new THREE.Vector3());
    hooks.fx.burst(0xffd27a, from, 8, { speed: 6, up: 3, size: 0.5, life: 0.4, y: 0 });
    hooks.sfx.cannon();
    const n = who.name;
    if (kind === 'shot') hooks.say(`${n}: огонь! Фейерверком по врагу! 💥`);
    else if (kind === 'harpoon') hooks.say(`${n} ${v(who, 'зацепил', 'зацепила')} ${target.kind === 'barrel' ? 'бочку' : 'сундук'} гарпуном!`);
    else hooks.say(`${n} ${v(who, 'устроил', 'устроила')} салют! 🎆`);
    shot = { kind, target, from, t: 0, dur: kind === 'salute' ? 1.1 : kind === 'shot' ? 0.9 : 2.4 };
    ball.visible = kind !== 'harpoon';
    return true;
  }

  function end() {
    shot = null;
    ball.visible = false;
    rope.visible = false;
  }

  function boom(p) {
    for (let i = 0; i < 3; i++) hooks.fx.burst(pick(SPARKS), p, 14, { speed: 16, up: 6, size: 0.6, life: 1, y: 2, gravity: 8 });
    hooks.sfx.boom();
  }

  function update(dt, t) {
    // отдача: рука с запалом вверх, лёгкий подскок
    if (aim) {
      aim.t += dt;
      const g = aim.who.g;
      g.userData.limbs[3].rotation.x = -1.6 * Math.max(0, 1 - aim.t / 0.8);
      g.position.y = aim.who.home.y + (aim.t < 0.3 ? Math.sin((aim.t / 0.3) * Math.PI) * 0.5 : 0);
      if (aim.t > 0.8) {
        g.userData.limbs[3].rotation.x = 0;
        g.position.y = aim.who.home.y;
        aim = null;
      }
    }

    if (shot) {
      shot.t += dt;
      const u = Math.min(1, shot.t / shot.dur);
      const tp = shot.target?.g.position;
      if (shot.kind === 'shot') {
        ball.position.lerpVectors(shot.from, tp, u);
        ball.position.y += Math.sin(u * Math.PI) * 12;
        hooks.fx.burst(pick(SPARKS), ball.position, 1, { speed: 1, up: 0.5, size: 0.35, life: 0.4, y: 0, gravity: 0 });
        if (u >= 1) {
          boom(tp);
          if (!shot.target.dead && !shot.target.sinking) hooks.sinkEnemy(shot.target);
          end();
        }
      } else if (shot.kind === 'harpoon') {
        // крюк летит полсекунды, потом верёвка тянет добычу к борту
        bow(pos);
        hook.lerpVectors(pos, tp, Math.min(1, shot.t / 0.5));
        rope.visible = true;
        rope.position.addVectors(pos, hook).multiplyScalar(0.5);
        rope.scale.set(0.12, 0.12, Math.max(0.1, pos.distanceTo(hook)));
        rope.lookAt(hook);
        if (shot.t > 0.5 && !shot.target.dead) {
          // тянем к середине корабля — там добычу и подбирают
          const k = Math.min(1, dt * 2.5);
          tp.x += (hooks.ship.position.x - tp.x) * k;
          tp.z += (hooks.ship.position.z - tp.z) * k;
        }
        if (shot.t >= shot.dur || shot.target.dead) end();
      } else {
        ball.position.copy(shot.from);
        ball.position.y += u * 26;
        hooks.fx.burst(0xffd27a, ball.position, 1, { speed: 0.5, up: 0, size: 0.4, life: 0.3, y: 0, gravity: 0 });
        if (u >= 1) {
          for (let i = 0; i < 4; i++) {
            const p = { x: ball.position.x + (Math.random() - 0.5) * 10, y: ball.position.y + Math.random() * 6, z: ball.position.z + (Math.random() - 0.5) * 10 };
            hooks.fx.burst(pick(SPARKS), p, 16, { speed: 18, up: 3, size: 0.7, life: 1.3, y: 0, gravity: 5 });
          }
          hooks.sfx.boom();
          end();
        }
      }
    }

    if (!pool.length || hooks.mode() !== 'sea' || shot) return;
    const enemy = hooks.findEnemy();
    if (enemy && shootT > 6) shootT = 6; // враг рядом — пушкарь не ждёт долго
    shootT -= dt;
    if (shootT > 0) return;
    let ok;
    if (enemy) ok = fire('shot', enemy);
    else {
      const loot = hooks.findLoot();
      ok = loot ? fire('harpoon', loot) : fire('salute');
    }
    shootT = !ok ? 5 : enemy ? 18 : 40 + Math.random() * 20;
  }

  // В порту — пушка отдыхает.
  function cancel() {
    end();
    if (aim) {
      aim.who.g.userData.limbs[3].rotation.x = 0;
      aim = null;
    }
    shootT = 30 + Math.random() * 10;
  }

  return { update, cancel, has: pool.length > 0, names: pool.map((p) => p.name), fire };
}
