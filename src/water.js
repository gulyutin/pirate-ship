import * as THREE from 'three';
import { lambert, voxelize, TEX } from './voxel.js';

const TILE = 4;
const N = 61; // блоков по стороне квадрата вокруг игрока
const HALF = (N - 1) / 2;
const LEVEL = -1.6; // верх водяного блока в покое

// шахматка [светлый, тёмный]: открытое море, бирюзовое мелководье, пена у кромки
const DEEP = [new THREE.Color(0x3b8fc6), new THREE.Color(0x2f7bb2)];
const SHALLOW = [new THREE.Color(0x45b8cc), new THREE.Color(0x3aa9c0)];
const FOAM = [new THREE.Color(0xb4e6f4), new THREE.Color(0x9fdcee)];
const PALETTE = [DEEP, SHALLOW, FOAM];

const ring = (r, n) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r]);
const NEAR = ring(3.5, 8);
const FAR = ring(9, 12);

// Бесконечное море: квадрат блоков всегда вокруг игрока, стоит на мировой сетке.
// Волны ступенчатые: высота блока округляется до полублока.
// groundAt(x, z) — есть ли суша: у берега вода светлеет и пенится.
export function createWater(scene, groundAt) {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(TILE, TILE, TILE),
    // рябь по блоку воды; сетка текстуры сдвинута так, чтобы совпасть с краями блоков
    voxelize(new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 }), {
      tex: TEX.water,
      tile: TILE,
      offset: [TILE / 2, 0, TILE / 2],
      water: true,
    }),
    N * N,
  );
  mesh.frustumCulled = false; // блоки переставляются каждый кадр
  mesh.receiveShadow = true; // тень корабля ложится на воду
  scene.add(mesh);

  // Дальнее море одним блоком ниже самой глубокой волны — стык прячет туман.
  // Потемнее: сквозь прозрачную воду это глубина.
  const deep = new THREE.Mesh(new THREE.BoxGeometry(2000, 2, 2000), lambert(0x225f8c));
  deep.position.y = LEVEL - 1.1 - 1;
  deep.receiveShadow = true;
  scene.add(deep);

  const m = new THREE.Matrix4();
  let lastBi = NaN;
  let lastBk = NaN;

  // 2 — пена у самой суши, 1 — мелководье, 0 — открытое море
  function shore(x, z) {
    if (!groundAt) return 0;
    if (groundAt(x, z) !== undefined) return 2;
    for (const [dx, dz] of NEAR) if (groundAt(x + dx, z + dz) !== undefined) return 2;
    for (const [dx, dz] of FAR) if (groundAt(x + dx, z + dz) !== undefined) return 1;
    return 0;
  }

  // cx, cz — вокруг какой точки держать воду.
  function update(t, cx, cz) {
    const bi = Math.round(cx / TILE) - HALF;
    const bk = Math.round(cz / TILE) - HALF;
    // цвета привязаны к миру: сдвинулся квадрат — перекрашиваем
    if (bi !== lastBi || bk !== lastBk) {
      lastBi = bi;
      lastBk = bk;
      for (let a = 0; a < N; a++) {
        for (let b = 0; b < N; b++) {
          const odd = (((bi + a + bk + b) % 2) + 2) % 2;
          mesh.setColorAt(a * N + b, PALETTE[shore((bi + a) * TILE, (bk + b) * TILE)][odd]);
        }
      }
      mesh.instanceColor.needsUpdate = true;
    }
    for (let a = 0; a < N; a++) {
      const x = (bi + a) * TILE;
      for (let b = 0; b < N; b++) {
        const z = (bk + b) * TILE;
        const h = Math.round(Math.sin(x * 0.08 + t * 1.6) + Math.sin(z * 0.11 - t * 1.1)) * 0.5;
        m.makeTranslation(x, LEVEL + h - TILE / 2, z);
        mesh.setMatrixAt(a * N + b, m);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    deep.position.x = cx;
    deep.position.z = cz;
  }

  return { update };
}
