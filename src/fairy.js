import * as THREE from 'three';
import { cube } from './voxel.js';

// Волшебница. Кто записан в "volshebnicy" в crew.json — носит корону, а в море
// время от времени взмахивает палочкой и колдует что-нибудь доброе: радугу,
// волшебный пузырь, цветы вместо вражеских ядер, компас к новому острову, звездопад.
// На суше подсвечивает клад рядом с капитаном.
const SEA_SPELLS = ['rainbow', 'bubble', 'flowers', 'compass', 'stars'];
const RAINBOW = [0xe0302a, 0xf08a2a, 0xf4d23a, 0x4fb05a, 0x3a7fd0, 0x8a4fc0];
const SPARKS = [0xf07ab8, 0xffffff, 0xf6c944, 0xb07af0];
const FLOWERS = [0xf07ab8, 0xffffff, 0xf4d23a, 0xe0302a, 0xb07af0];
const RAINBOW_TIME = 20;
const BUBBLE_TIME = 25;
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// hooks: say, fx, sfx, mode(), ship (группа корабля), gold(n), shield(), enemiesNear(),
//        target() → {x, z} | null, treasure() → {x, y, z} | null, captain() → {x, y, z}
export function createFairy(scene, crew, hooks) {
  const pool = crew.people.filter((p) => p.fairy);
  let castT = 25 + Math.random() * 10; // первое колдовство — вскоре после выхода в море
  let last = '';
  let wave = null; // взмах палочкой: { who, t }
  let rainbowT = 0;
  let bubbleT = 0;
  let charmT = 0;
  let stars = 0;
  let starT = 0;
  let compass = null; // { x, z, t, beat, d }
  let pillar = null; // { x, y, z, t, beat }
  const pos = new THREE.Vector3();

  // радуга над кораблём: полукруг из разноцветных блоков, поперёк курса
  const rainbowMats = RAINBOW.map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0 }));
  const rainbow = new THREE.Group();
  rainbow.position.set(0, -2, -4);
  RAINBOW.forEach((_, band) => {
    const r = 29 - band * 0.9;
    const n = 30;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI;
      const seg = cube(rainbow, rainbowMats[band], (Math.PI * r) / n + 0.2, 0.9, 0.5, Math.cos(a) * r, Math.sin(a) * r, 0);
      seg.rotation.z = a + Math.PI / 2;
    }
  });
  rainbow.visible = false;
  hooks.ship.add(rainbow);

  // волшебный пузырь вокруг корабля — розовый, чуть переливается
  const bubbleMat = new THREE.MeshLambertMaterial({
    color: 0xffb8e8,
    emissive: 0x5a2048,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    flatShading: true,
  });
  const bubble = new THREE.Mesh(new THREE.IcosahedronGeometry(11, 1), bubbleMat);
  bubble.scale.set(0.85, 0.8, 1.25);
  bubble.position.set(0, 5, -1);
  bubble.visible = false;
  hooks.ship.add(bubble);

  const starPos = (who) => who.g.userData.wandStar.getWorldPosition(pos);
  const fade = (left, total) => Math.max(0, Math.min(1, (total - left) / 1.5, left / 2));

  function cast(kind) {
    const who = pool.find((p) => p.alive && !p.fall);
    if (!who) return false;
    const n = who.name;
    let target = null;
    if (kind === 'compass') {
      target = hooks.target();
      if (!target) return false;
    }
    switch (kind) {
      case 'rainbow':
        rainbowT = RAINBOW_TIME;
        rainbow.visible = true;
        hooks.say(`${n} колдует радугу! 🌈 Всё золото ×2`, 3);
        break;
      case 'bubble':
        bubbleT = BUBBLE_TIME;
        bubble.visible = true;
        hooks.shield();
        hooks.say(`${n} наколдовала волшебный пузырь — корпус крепче!`, 3);
        break;
      case 'flowers':
        charmT = 25;
        hooks.say(`${n} заколдовала пушки врагов — вместо ядер цветы! 🌸`, 3);
        break;
      case 'compass':
        compass = { x: target.x, z: target.z, t: 12, beat: 0, d: 8 };
        hooks.say(`${n}: волшебный компас! ✨ Звёздочки ведут к новому острову`, 3);
        break;
      case 'stars':
        stars = 6;
        starT = 0.8;
        hooks.say(`${n} колдует звездопад! ⭐`, 3);
        break;
      case 'bloom': {
        const c = hooks.captain();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          hooks.fx.burst(pick(FLOWERS), { x: c.x + Math.cos(a) * 3, y: c.y, z: c.z + Math.sin(a) * 3 }, 5, { speed: 3, up: 5, size: 0.5, life: 1.2, y: 0.5 });
        }
        const tr = hooks.treasure();
        if (tr) {
          pillar = { x: tr.x, y: tr.y, z: tr.z, t: 12, beat: 0 };
          hooks.say(`${n} наколдовала с корабля: клад подсвечен! ✨`, 3);
        } else {
          hooks.say(`${n} наколдовала цветы вокруг капитана 🌸`);
        }
        break;
      }
    }
    wave = { who, t: 0 };
    who.g.userData.wand.visible = true;
    hooks.sfx.magic();
    last = kind;
    return true;
  }

  function endWave() {
    const g = wave.who.g;
    g.userData.limbs[3].rotation.x = 0;
    g.userData.wand.visible = false;
    if (!(wave.who.isCaptain && hooks.mode() === 'land')) g.rotation.y = 0;
    wave = null;
  }

  function update(dt, t) {
    const mode = hooks.mode();

    // взмах палочкой: рука вверх, кружится, из звезды сыплются искры
    if (wave) {
      const before = wave.t;
      wave.t += dt;
      const g = wave.who.g;
      g.userData.limbs[3].rotation.x = 2.8;
      if (!(wave.who.isCaptain && mode === 'land')) g.rotation.y = wave.t * 9;
      if (Math.floor(wave.t * 10) !== Math.floor(before * 10)) {
        hooks.fx.burst(pick(SPARKS), starPos(wave.who), 3, { speed: 4, up: 3, size: 0.35, life: 0.6, y: 0, gravity: 2 });
      }
      if (wave.t > 1.4 || !wave.who.alive) endWave();
    }

    if (rainbowT > 0) {
      rainbowT -= dt;
      const k = fade(rainbowT, RAINBOW_TIME) * 0.75;
      for (const m of rainbowMats) m.opacity = k;
      if (rainbowT <= 0) rainbow.visible = false;
    }
    if (bubbleT > 0) {
      bubbleT -= dt;
      bubbleMat.opacity = fade(bubbleT, BUBBLE_TIME) * 0.28;
      bubble.rotation.y += dt * 0.3;
      bubble.scale.set(0.85, 0.8, 1.25).multiplyScalar(1 + Math.sin(t * 3) * 0.03);
      if (bubbleT <= 0) bubble.visible = false;
    }
    charmT = Math.max(0, charmT - dt);

    // звёзды падают на палубу — каждая по монетке
    if (stars > 0 && (starT -= dt) <= 0) {
      starT = 0.3;
      stars--;
      pos.set((Math.random() - 0.5) * 5, 2, (Math.random() - 0.5) * 9);
      hooks.ship.localToWorld(pos);
      hooks.fx.burst(0xf6c944, pos, 1, { speed: 0.5, up: 0, size: 0.9, life: 0.6, y: 11, gravity: 30 });
      hooks.fx.burst(0xffffff, pos, 5, { speed: 5, up: 4, size: 0.3, life: 0.5, y: 0.5 });
      hooks.sfx.coin();
      hooks.gold(1);
    }

    // компас: бегущая дорожка из звёздочек от корабля к цели
    if (compass) {
      compass.t -= dt;
      compass.beat -= dt;
      if (mode !== 'sea' || compass.t <= 0) compass = null;
      else if (compass.beat <= 0) {
        compass.beat = 0.1;
        const sx = hooks.ship.position.x;
        const sz = hooks.ship.position.z;
        const len = Math.hypot(compass.x - sx, compass.z - sz) || 1;
        compass.d = compass.d > 48 ? 8 : compass.d + 3;
        const p = { x: sx + ((compass.x - sx) / len) * compass.d, y: 1, z: sz + ((compass.z - sz) / len) * compass.d };
        hooks.fx.burst(pick(SPARKS), p, 2, { speed: 1, up: 1, size: 0.6, life: 1.4, y: 0, gravity: 0 });
      }
    }

    // столб искр над кладом
    if (pillar) {
      pillar.t -= dt;
      pillar.beat -= dt;
      if (pillar.t <= 0) pillar = null;
      else if (pillar.beat <= 0) {
        pillar.beat = 0.1;
        hooks.fx.burst(pick(SPARKS), pillar, 2, { speed: 1.5, up: 8, size: 0.45, life: 1.2, y: 0.5, gravity: -2 });
      }
    }

    if (!pool.length || (mode !== 'sea' && mode !== 'land')) return;
    castT -= dt;
    if (castT > 0 || wave) return;
    castT = 45 + Math.random() * 25;
    const options = mode === 'land'
      ? ['bloom']
      : SEA_SPELLS.filter((k) => k !== last && (k !== 'flowers' || hooks.enemiesNear()));
    if (!cast(pick(options))) castT = 5;
  }

  // Вернулись в порт — волшебство заканчивается.
  function cancel() {
    if (wave) endWave();
    rainbowT = bubbleT = charmT = 0;
    stars = 0;
    compass = pillar = null;
    rainbow.visible = bubble.visible = false;
    castT = 25 + Math.random() * 10;
  }

  return {
    update,
    cancel,
    cast,
    has: pool.length > 0,
    names: pool.map((p) => p.name),
    get goldMult() {
      return rainbowT > 0 ? 2 : 1;
    },
    get charmed() {
      return charmT > 0;
    },
  };
}
