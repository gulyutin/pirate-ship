import * as THREE from 'three';
import { cube } from './voxel.js';

const BALL_SPEED = 100;
const ENEMY_FLIGHT = 1.6; // секунд летит вражеское ядро — хватает, чтобы увернуться
const ARC = 12;
const IRON = 0x2b2b2b;

// Ядра. Наши сами наводятся на цель; вражеские летят дугой в точку,
// которая заранее мигает красным квадратом на воде.
export function createBattle(scene) {
  const balls = [];
  const shells = [];
  const markerMat = new THREE.MeshBasicMaterial({
    color: 0xff3b30, transparent: true, opacity: 0.45, depthTest: false, fog: false,
  });
  const aim = new THREE.Vector3();

  function fire(from, target) {
    const m = cube(scene, IRON, 0.8, 0.8, 0.8, from.x, from.y, from.z);
    target.incoming = (target.incoming || 0) + 1;
    balls.push({ m, target, v: new THREE.Vector3(0, 0, -BALL_SPEED), life: 1.4 });
  }

  function enemyFire(from, tx, tz) {
    const m = cube(scene, IRON, 1.1, 1.1, 1.1, from.x, from.y, from.z);
    const marker = cube(scene, markerMat, 7, 0.3, 7, tx, -0.4, tz);
    marker.renderOrder = 5; // поверх корпуса: видно, даже когда корабль стоит на метке
    shells.push({ m, marker, from: from.clone(), to: new THREE.Vector3(tx, 0.5, tz), u: 0 });
  }

  function dropBall(i) {
    const b = balls[i];
    scene.remove(b.m);
    balls.splice(i, 1);
    if (b.target) b.target.incoming--;
  }

  // hooks: hitTarget(item), shellLanded(x, z)
  function update(dt, t, hooks) {
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      const tg = b.target;
      if (tg && !tg.dead && !tg.sinking) {
        aim.copy(tg.g.position);
        aim.y += tg.aimY ?? 1.5;
        if (b.m.position.distanceTo(aim) < tg.r + 0.8) {
          dropBall(i);
          hooks.hitTarget(tg);
          continue;
        }
        b.v.subVectors(aim, b.m.position).setLength(BALL_SPEED);
      }
      b.m.position.addScaledVector(b.v, dt);
      b.m.rotation.x += dt * 10;
      b.life -= dt;
      if (b.life <= 0) dropBall(i);
    }

    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.u = Math.min(1, s.u + dt / ENEMY_FLIGHT);
      s.m.position.lerpVectors(s.from, s.to, s.u);
      s.m.position.y += Math.sin(Math.PI * s.u) * ARC;
      s.marker.visible = s.u > 0.7 || Math.floor(t * 8) % 2 === 0;
      if (s.u >= 1) {
        scene.remove(s.m, s.marker);
        shells.splice(i, 1);
        hooks.shellLanded(s.to.x, s.to.z);
      }
    }
  }

  function clear() {
    balls.forEach((b) => scene.remove(b.m));
    shells.forEach((s) => scene.remove(s.m, s.marker));
    balls.length = 0;
    shells.length = 0;
  }

  return { fire, enemyFire, update, clear };
}
