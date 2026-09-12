import * as THREE from 'three';
import { cube } from './voxel.js';
import { createEnemyShip } from './ship.js';
import { SEA_Y } from './terrain.js';

// Всё живое в мире: монеты и клады на островах, сундуки в море, вражеские бриги.
const ENEMY_MAX = 2;
const ENEMY_SPEED = 13; // медленнее нашего корабля — от них всегда можно уплыть
const ENEMY_TURN = 0.9;
const ENEMY_RANGE = 60; // стреляют, если ближе
const ENEMY_RELOAD = 3.2;
const ENEMY_SPAWN_DIST = 115;
const SAFE_R = 110; // у порта враги не появляются
const DESPAWN = 280;
const COINS_PER_ISLAND = 6;
const LOOT_NEAR = 200; // ближе — монеты и клад острова появляются
const LOOT_FAR = 280; // дальше — убираются (но запоминается, что уже подобрано)
const PEACEFUL_UNTIL = 2; // враги появляются, только когда открыто столько островов
const CANNON_REACH = 55;
const TAU = Math.PI * 2;

export const wrapAngle = (a) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
export const turnToward = (a, b, step) => a + THREE.MathUtils.clamp(wrapAngle(b - a), -step, step);

function makeCoin() {
  const g = new THREE.Group();
  cube(g, 0xf6c944, 1.6, 1.6, 1.6);
  cube(g, 0xffe07a, 0.8, 0.8, 0.8, 0.45, 0.5, 0.45);
  return g;
}

function makeChest() {
  const g = new THREE.Group();
  cube(g, 0x7a4a26, 3, 1.8, 2.2);
  cube(g, 0x8f5a2e, 3.1, 0.8, 2.3, 0, 1.2, 0);
  cube(g, 0xf6c944, 3.2, 0.3, 2.4, 0, 0.9, 0);
  cube(g, 0xf6c944, 0.5, 0.7, 0.2, 0, 0.5, 1.2);
  return g;
}

// Красный крестик «здесь зарыт клад».
function makeX() {
  const g = new THREE.Group();
  cube(g, 0xc0392b, 3, 0.2, 0.6).rotation.y = Math.PI / 4;
  cube(g, 0xc0392b, 3, 0.2, 0.6).rotation.y = -Math.PI / 4;
  return g;
}

// Великий клад: огромный крестик и чёрный пиратский флаг над ним.
function makeBigX() {
  const g = new THREE.Group();
  cube(g, 0xc0392b, 5.4, 0.25, 1).rotation.y = Math.PI / 4;
  cube(g, 0xc0392b, 5.4, 0.25, 1).rotation.y = -Math.PI / 4;
  cube(g, 0x6a4a2e, 0.25, 6, 0.25, 2.4, 3, 0);
  cube(g, 0x1a1a1a, 2.4, 1.5, 0.12, 3.6, 5.2, 0);
  cube(g, 0xf0ece0, 0.6, 0.6, 0.14, 3.6, 5.3, 0);
  return g;
}

// Клочок карты сокровищ — свиток с красным крестиком.
function makeScroll() {
  const g = new THREE.Group();
  cube(g, 0xe8dcc0, 1.8, 0.15, 1.3);
  cube(g, 0xc9b890, 0.35, 0.35, 1.4, -0.9, 0, 0);
  cube(g, 0xc9b890, 0.35, 0.35, 1.4, 0.9, 0, 0);
  cube(g, 0xc0392b, 0.6, 0.18, 0.15, 0.2, 0.05, 0.1).rotation.y = Math.PI / 4;
  cube(g, 0xc0392b, 0.6, 0.18, 0.15, 0.2, 0.05, 0.1).rotation.y = -Math.PI / 4;
  return g;
}

// Бочка с моряком, который машет рукой: «Спасите!»
function makeBarrel() {
  const g = new THREE.Group();
  cube(g, 0x8a5a30, 1.6, 1.8, 1.6);
  cube(g, 0x8a5a30, 1.45, 1.8, 1.45).rotation.y = Math.PI / 4;
  cube(g, 0x3b2a18, 1.75, 0.2, 1.75, 0, 0.5, 0);
  cube(g, 0x3b2a18, 1.75, 0.2, 1.75, 0, -0.5, 0);
  cube(g, 0xf0c49a, 0.9, 0.9, 0.9, 0, 1.4, 0);
  cube(g, 0xc0392b, 1, 0.3, 1, 0, 1.95, 0); // бандана
  const arm = new THREE.Group();
  arm.position.set(0.55, 1.2, 0);
  g.add(arm);
  cube(arm, 0x4f9c5a, 0.35, 1.2, 0.35, 0, 0.6, 0);
  cube(arm, 0xf0c49a, 0.35, 0.35, 0.35, 0, 1.3, 0);
  g.userData.arm = arm;
  return g;
}

export function createWorld(scene, terrain) {
  let items = [];
  let enemyT = 40; // первое время в море — спокойно
  // Клады по островам: { isl, coins: [{x,y,z}], xspot, live, items }. Объекты создаются,
  // только когда игрок рядом — иначе на 100 островах были бы тысячи лишних кубиков.
  const loot = [];
  let lootT = 0;

  function track(it) {
    it.dead = false;
    scene.add(it.g);
    items.push(it);
    return it;
  }

  function kill(it) {
    if (it.dead) return;
    it.dead = true;
    scene.remove(it.g);
  }

  const sweep = () => {
    if (items.some((it) => it.dead)) items = items.filter((it) => !it.dead);
  };

  function addCoin(x, y, z, L = null, src = null) {
    const g = makeCoin();
    g.position.set(x, y, z);
    return track({ kind: 'coin', g, baseY: y, phase: Math.random() * 6, loot: L, src });
  }

  function addX(x, y, z, L = null) {
    const g = makeX();
    g.position.set(x, y, z);
    return track({ kind: 'xspot', g, loot: L });
  }

  function addChest(x, z) {
    const g = makeChest();
    g.position.set(x, SEA_Y + 0.9, z);
    return track({ kind: 'chest', g, value: 5, phase: Math.random() * 6 });
  }

  // Сундук на вершине паркура — большой, с золотой звездой.
  function addSummit(x, y, z, L) {
    const g = makeChest();
    g.scale.setScalar(1.3);
    cube(g, 0xf6c944, 0.9, 0.9, 0.9, 0, 2.4, 0).rotation.y = Math.PI / 4;
    g.position.set(x, y, z);
    return track({ kind: 'summit', g, baseY: y, phase: Math.random() * 6, loot: L });
  }

  function addPiece(x, y, z, L) {
    const g = makeScroll();
    g.position.set(x, y, z);
    return track({ kind: 'piece', g, baseY: y, phase: Math.random() * 6, loot: L });
  }

  function addBigX(x, y, z, L) {
    const g = makeBigX();
    g.position.set(x, y, z);
    return track({ kind: 'bigx', g, loot: L });
  }

  function addBarrel(x, z) {
    const g = makeBarrel();
    g.position.set(x, SEA_Y + 0.4, z);
    return track({ kind: 'barrel', g, phase: Math.random() * 6 });
  }

  // Выкопанный сундук: вылетает из земли, крутится и исчезает.
  function addPrize(x, y, z) {
    const g = makeChest();
    g.position.set(x, y, z);
    return track({ kind: 'prize', g, baseY: y, t: 0 });
  }

  function addEnemy(x, z) {
    const g = createEnemyShip();
    g.position.set(x, 0, z);
    return track({
      kind: 'enemy', g, r: 3.4, hp: 2, heading: Math.random() * TAU, side: Math.random() < 0.5 ? 1 : -1,
      phase: Math.random() * 6, fireT: 2, sinking: 0, pop: 0,
    });
  }

  // Новый день: монеты и крестик с кладом на каждом острове (кроме порта).
  // Вызывается при заходе в порт; сами объекты появятся, когда подплывёшь.
  // opts.summits — id островов, где сундук на вершине уже забран.
  function spawnLoot(opts = {}) {
    for (const L of loot) despawn(L);
    loot.length = 0;
    const summits = new Set(opts.summits ?? []);
    // клочки карты сокровищ — на нескольких случайных островах
    const candidates = terrain.islands.filter((isl) => !isl.port && !isl.home && isl.cells.length);
    const pieceIslands = new Set();
    const want = Math.min(opts.pieces ?? 0, candidates.length);
    while (pieceIslands.size < want) pieceIslands.add(candidates[Math.floor(Math.random() * candidates.length)].id);
    for (const isl of terrain.islands) {
      if (isl.port || isl.home || !isl.cells.length) continue;
      const L = { isl, coins: [], xspot: null, summit: null, piece: null, bigX: null, live: false, items: [] };
      if (isl.summit && !summits.has(isl.id)) L.summit = { ...isl.summit };
      const used = new Set();
      const pick = (ok) => {
        for (let n = 0; n < 40; n++) {
          const c = isl.cells[Math.floor(Math.random() * isl.cells.length)];
          if (!used.has(c) && (!ok || ok(c))) {
            used.add(c);
            return c;
          }
        }
        return null;
      };
      for (let n = 0; n < COINS_PER_ISLAND; n++) {
        const c = pick();
        if (c) {
          const p = terrain.cellPos(c);
          L.coins.push({ x: p.x, y: p.y + 1.8, z: p.z });
        }
      }
      const spot = pick((c) => c.h >= 2) ?? pick();
      if (spot) {
        const p = terrain.cellPos(spot);
        L.xspot = { x: p.x, y: p.y + 0.1, z: p.z };
      }
      if (pieceIslands.has(isl.id)) {
        const c = pick();
        if (c) {
          const p = terrain.cellPos(c);
          L.piece = { x: p.x, y: p.y + 1.6, z: p.z };
        }
      }
      if (isl.id === opts.bigTreasure) placeBigX(L);
      loot.push(L);
    }
    lootT = 0;
    sweep();
  }

  function despawn(L) {
    for (const it of L.items) kill(it);
    L.items = [];
    L.live = false;
  }

  // Раз в полсекунды: у ближних островов создаём клады, у дальних — убираем.
  function updateLoot(dt, x, z) {
    lootT -= dt;
    if (lootT > 0) return;
    lootT = 0.5;
    for (const L of loot) {
      const d = Math.hypot(L.isl.x - x, L.isl.z - z);
      if (!L.live && d < LOOT_NEAR) {
        L.live = true;
        for (const c of L.coins) L.items.push(addCoin(c.x, c.y, c.z, L, c));
        if (L.xspot) L.items.push(addX(L.xspot.x, L.xspot.y, L.xspot.z, L));
        if (L.summit) L.items.push(addSummit(L.summit.x, L.summit.y + 0.9, L.summit.z, L));
        if (L.piece) L.items.push(addPiece(L.piece.x, L.piece.y, L.piece.z, L));
        if (L.bigX) L.items.push(addBigX(L.bigX.x, L.bigX.y, L.bigX.z, L));
      } else if (L.live && d > LOOT_FAR) {
        despawn(L);
      }
    }
  }

  // Монету подобрали или клад выкопали — до нового дня на этом месте пусто.
  function take(it) {
    const L = it.loot;
    if (L && it.kind === 'coin') L.coins = L.coins.filter((c) => c !== it.src);
    if (L && it.kind === 'xspot') L.xspot = null;
    if (L && it.kind === 'summit') L.summit = null;
    if (L && it.kind === 'piece') L.piece = null;
    if (L && it.kind === 'bigx') L.bigX = null;
    kill(it);
  }

  // Крестик великого клада на острове (карта сокровищ собрана).
  function placeBigX(L) {
    const cells = L.isl.cells;
    const c = cells.find((cc) => cc.h >= 2 && cc.dc > 4) ?? cells[Math.floor(Math.random() * cells.length)];
    if (!c) return;
    const p = terrain.cellPos(c);
    L.bigX = { x: p.x, y: p.y + 0.12, z: p.z };
  }

  function setBigTreasure(id) {
    const L = loot.find((l) => l.isl.id === id);
    if (!L || L.bigX) return;
    placeBigX(L);
    if (L.live && L.bigX) L.items.push(addBigX(L.bigX.x, L.bigX.y, L.bigX.z, L));
  }

  // Время от времени впереди появляется бочка с моряком, которого надо спасти.
  let barrelT = 30;
  function spawnBarrels(dt, x, z, heading) {
    barrelT -= dt;
    if (barrelT > 0 || items.some((it) => it.kind === 'barrel' && !it.dead)) return false;
    barrelT = 45 + Math.random() * 25;
    for (let n = 0; n < 6; n++) {
      const a = heading + (Math.random() - 0.5) * 1;
      const d = 60 + Math.random() * 20;
      const bx = x - Math.sin(a) * d;
      const bz = z - Math.cos(a) * d;
      if (landNear(bx, bz, 6)) continue;
      addBarrel(bx, bz);
      return true;
    }
    return false;
  }

  function landNear(x, z, r) {
    if (terrain.groundAt(x, z) !== undefined) return true;
    for (let n = 0; n < 8; n++) {
      const a = (n / 8) * TAU;
      if (terrain.groundAt(x + Math.cos(a) * r, z + Math.sin(a) * r) !== undefined) return true;
    }
    return false;
  }

  // found — сколько островов уже открыто: пока меньше двух, море мирное.
  function spawnEnemies(dt, x, z, found) {
    if (found < PEACEFUL_UNTIL) return;
    enemyT -= dt;
    if (enemyT > 0) return;
    enemyT = 12 + Math.random() * 8;
    if (items.filter((it) => it.kind === 'enemy' && !it.sinking).length >= ENEMY_MAX) return;
    if (Math.hypot(x, z) < SAFE_R) return;
    for (let n = 0; n < 8; n++) {
      const a = Math.random() * TAU;
      const ex = x + Math.cos(a) * ENEMY_SPAWN_DIST;
      const ez = z + Math.sin(a) * ENEMY_SPAWN_DIST;
      if (Math.hypot(ex, ez) < SAFE_R || landNear(ex, ez, 14)) continue;
      addEnemy(ex, ez);
      return;
    }
  }

  function removeEnemies() {
    for (const it of items) if (it.kind === 'enemy') kill(it);
    sweep();
  }

  // Цель для пушек: ближайший враг в досягаемости, на которого ещё не летит достаточно ядер.
  function findTarget(x, z) {
    let best = null;
    let bestD = CANNON_REACH;
    for (const it of items) {
      if (it.dead || it.kind !== 'enemy' || it.sinking || (it.incoming || 0) >= it.hp) continue;
      const d = Math.hypot(it.g.position.x - x, it.g.position.z - z);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    return best;
  }

  function sink(it) {
    if (!it.sinking) it.sinking = 0.001;
  }

  // ctx: { x, z (наш корабль), hostile, onEnemyFire(enemy) }
  function updateEnemy(it, dt, t, ctx) {
    const g = it.g;
    const p = g.position;
    if (it.sinking) {
      it.sinking += dt;
      p.y -= dt * (3 + it.sinking * 10); // уходит под воду с ускорением
      g.rotation.z += dt * 0.7;
      g.rotation.x -= dt * 0.25;
      if (it.sinking > 1.8) kill(it);
      return;
    }
    const dx = ctx.x - p.x;
    const dz = ctx.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    if (d > DESPAWN) {
      kill(it);
      return;
    }
    // издалека — к нам, вблизи — кружит вокруг; когда капитан на суше — уплывает прочь
    let tx = dx / d;
    let tz = dz / d;
    if (!ctx.hostile) {
      tx = -tx;
      tz = -tz;
    } else if (d < 45) {
      [tx, tz] = [-tz * it.side, tx * it.side];
    }
    it.heading = turnToward(it.heading, Math.atan2(tx, tz), ENEMY_TURN * dt);
    const fx = Math.sin(it.heading);
    const fz = Math.cos(it.heading);
    if (terrain.groundAt(p.x + fx * 9, p.z + fz * 9) !== undefined) {
      it.heading += dt * 2.5; // впереди суша — отворачиваем
    } else {
      p.x += fx * ENEMY_SPEED * dt;
      p.z += fz * ENEMY_SPEED * dt;
    }
    g.rotation.y = it.heading;
    g.rotation.z = Math.sin(t * 1.3 + it.phase) * 0.05;
    p.y = Math.sin(t * 1.5 + it.phase) * 0.3;
    it.pop = Math.max(0, it.pop - dt);
    g.scale.setScalar(1 + it.pop);
    if (ctx.hostile && d < ENEMY_RANGE) {
      it.fireT -= dt;
      if (it.fireT <= 0) {
        it.fireT = ENEMY_RELOAD;
        ctx.onEnemyFire(it);
      }
    }
  }

  // Магнит тянет монеты к капитану на суше, а сундуки — к кораблю в море.
  function pull(it, magnet, dt) {
    if (!magnet || magnet.r <= 0) return;
    const p = it.g.position;
    const dx = magnet.x - p.x;
    const dz = magnet.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d < magnet.r && d > 0.5) {
      const k = Math.min(1, dt * 4);
      p.x += dx * k;
      p.z += dz * k;
    }
  }

  // ctx: { x, z, hostile, onEnemyFire, magnet: { x, z, r, coins | chests } }
  function update(dt, t, ctx) {
    updateLoot(dt, ctx.fx ?? ctx.x, ctx.fz ?? ctx.z);
    for (const it of items) {
      if (it.dead) continue;
      const g = it.g;
      const p = g.position;
      switch (it.kind) {
        case 'coin':
          g.rotation.y += dt * 2.2;
          p.y = it.baseY + Math.sin(t * 3 + it.phase) * 0.4;
          if (ctx.magnet.coins) pull(it, ctx.magnet, dt);
          break;
        case 'chest':
          p.y = SEA_Y + 0.9 + Math.sin(t * 2 + it.phase) * 0.25;
          if (ctx.magnet.chests) pull(it, ctx.magnet, dt);
          if (Math.hypot(p.x - ctx.x, p.z - ctx.z) > DESPAWN) kill(it);
          break;
        case 'summit':
        case 'piece':
          g.rotation.y += dt * 1.5;
          p.y = it.baseY + Math.sin(t * 2 + it.phase) * 0.3;
          break;
        case 'barrel':
          p.y = SEA_Y + 0.4 + Math.sin(t * 2 + it.phase) * 0.3;
          g.rotation.z = Math.sin(t * 1.3 + it.phase) * 0.12;
          g.userData.arm.rotation.z = -0.4 + Math.sin(t * 8) * 0.6; // машет рукой
          if (Math.hypot(p.x - ctx.x, p.z - ctx.z) > DESPAWN) kill(it);
          break;
        case 'prize':
          it.t += dt;
          p.y = it.baseY + Math.min(1, it.t * 2) * 2.5;
          g.rotation.y += dt * 4;
          if (it.t > 1.2) kill(it);
          break;
        case 'enemy':
          updateEnemy(it, dt, t, ctx);
          break;
      }
    }
    sweep();
  }

  return {
    get items() {
      return items;
    },
    spawnLoot,
    spawnEnemies,
    spawnBarrels,
    setBigTreasure,
    removeEnemies,
    update,
    findTarget,
    addChest,
    addPrize,
    kill,
    take,
    sink,
  };
}
