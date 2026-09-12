import * as THREE from 'three';
import { cube } from './voxel.js';

// Разлетающиеся кубики: золото, осколки скал, щепки, брызги.
export function createFx(scene) {
  const bits = [];

  // vx/vz — общий снос (струя фонтана), к нему добавляется случайный разлёт
  function burst(color, pos, n = 10, { speed = 14, up = 6, size = 0.7, life = 0.7, y = 1, gravity = 25, vx = 0, vz = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const m = cube(scene, color, size, size, size, pos.x, pos.y + y, pos.z);
      m.castShadow = false;
      const v = new THREE.Vector3(
        vx + (Math.random() - 0.5) * speed,
        up + Math.random() * up * 1.3,
        vz + (Math.random() - 0.5) * speed,
      );
      bits.push({ m, v, life, max: life, size, gravity });
    }
  }

  function splash(x, z) {
    const pos = { x, y: -1.6, z };
    burst(0xe6f5ff, pos, 12, { speed: 7, up: 9, size: 0.9, life: 0.8, y: 0 });
    burst(0x5aa9d6, pos, 8, { speed: 9, up: 6, size: 0.7, life: 0.6, y: 0 });
  }

  // пена за кормой — лежит на воде и тает
  function foam(x, z) {
    burst(0xe6f5ff, { x, y: -0.7, z }, 1, { speed: 2, up: 0, size: 0.9, life: 1.1, y: 0, gravity: 0 });
  }

  function update(dt) {
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.life -= dt;
      if (b.life <= 0) {
        scene.remove(b.m);
        bits.splice(i, 1);
        continue;
      }
      b.v.y -= b.gravity * dt;
      b.m.position.addScaledVector(b.v, dt);
      b.m.scale.setScalar(b.size * Math.min(1, b.life / (b.max * 0.5)));
    }
  }

  function clear() {
    bits.forEach((b) => scene.remove(b.m));
    bits.length = 0;
  }

  return { burst, splash, foam, update, clear };
}
