import * as THREE from 'three';
import { cube } from './voxel.js';

// Бабочки порхают вокруг капитана, пока он гуляет по острову.
const COLORS = [0xf6c944, 0xf07ab8, 0x7ab8f0, 0xffffff, 0xf08a24, 0xb07af0];
const COUNT = 6;

export function createNature(scene) {
  const flies = [];
  for (let i = 0; i < COUNT; i++) {
    const g = new THREE.Group();
    cube(g, 0x2a2420, 0.12, 0.12, 0.5).castShadow = false;
    const wings = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      g.add(pivot);
      const w = cube(pivot, COLORS[i % COLORS.length], 0.55, 0.05, 0.5, side * 0.3, 0, 0);
      w.castShadow = false;
      return pivot;
    });
    g.visible = false;
    scene.add(g);
    flies.push({ g, wings, home: null, ph: Math.random() * 6 });
  }

  // точка над сушей рядом с капитаном
  function pickHome(p, groundAt) {
    for (let n = 0; n < 8; n++) {
      const a = Math.random() * Math.PI * 2;
      const d = 5 + Math.random() * 10;
      const x = p.x + Math.cos(a) * d;
      const z = p.z + Math.sin(a) * d;
      const y = groundAt(x, z);
      if (y !== undefined) return { x, y, z };
    }
    return null;
  }

  // p: { x, y, z, active, groundAt }
  function update(dt, t, p) {
    for (const f of flies) {
      if (!p.active) {
        f.g.visible = false;
        f.home = null;
        continue;
      }
      if (!f.home || Math.hypot(f.home.x - p.x, f.home.z - p.z) > 30) {
        f.home = pickHome(p, p.groundAt);
        if (!f.home) continue;
      }
      const s = t + f.ph;
      const x = f.home.x + Math.sin(s * 0.7) * 3 + Math.sin(s * 1.9) * 1;
      const z = f.home.z + Math.cos(s * 0.6) * 3 + Math.cos(s * 2.3) * 1;
      const y = f.home.y + 1.6 + Math.sin(s * 2.1) * 0.7;
      const g = f.g;
      if (g.visible) g.rotation.y = Math.atan2(x - g.position.x, z - g.position.z);
      g.position.set(x, y, z);
      g.visible = true;
      const flap = Math.sin(s * 18) * 0.9;
      f.wings[0].rotation.z = flap;
      f.wings[1].rotation.z = -flap;
    }
  }

  return { update };
}
