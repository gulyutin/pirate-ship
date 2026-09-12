import * as THREE from 'three';
import { cube } from './voxel.js';

// Питомец на левом плече капитана. Иногда что-нибудь говорит, и у каждого своё умение:
// попугай кричит, когда рядом враг; котик ловит рыбку; обезьянка тянет монетки
// издалека; щенок лает, когда рядом зарыт клад.
const WORDS = {
  parrot: ['🦜 Пиастр-р-ры! Пиастр-р-ры!', '🦜 Кар-р! Полный впер-р-рёд!', '🦜 Капитан — молодец!', '🦜 Хочу печеньку!'],
  cat: ['🐱 Мяу! Там рыбка!', '🐱 Мур-р-р… качает…', '🐱 Мяу! Хочу молочка!'],
  monkey: ['🐒 У-у-а-а! Банан!', '🐒 Ии-ии! Смотри, монетка!', '🐒 У-у! Хочу на мачту!'],
  puppy: ['🐶 Гав! Гав!', '🐶 Гав! Я охраняю корабль!', '🐶 Р-р-гав! Ищу клад!'],
};
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function build(kind) {
  const g = new THREE.Group();
  const parts = {};
  if (kind === 'parrot') {
    cube(g, 0xd8302a, 0.4, 0.6, 0.4, 0, 0.3, 0);
    cube(g, 0xd8302a, 0.36, 0.36, 0.36, 0, 0.75, -0.05);
    cube(g, 0xf6d860, 0.14, 0.14, 0.24, 0, 0.72, -0.3);
    for (const sx of [-1, 1]) cube(g, 0x111111, 0.07, 0.07, 0.05, sx * 0.12, 0.82, -0.2);
    parts.wings = [-1, 1].map((sx) => {
      const p = new THREE.Group();
      p.position.set(sx * 0.2, 0.5, 0);
      g.add(p);
      cube(p, 0x2f6ac0, 0.1, 0.45, 0.35, sx * 0.05, -0.15, 0);
      return p;
    });
    cube(g, 0x2f6ac0, 0.14, 0.5, 0.1, 0, -0.1, 0.22).rotation.x = 0.3; // хвост
  } else if (kind === 'cat') {
    cube(g, 0xf08a24, 0.4, 0.3, 0.6, 0, 0.15, 0);
    cube(g, 0xf08a24, 0.34, 0.32, 0.32, 0, 0.35, -0.35);
    for (const sx of [-1, 1]) {
      cube(g, 0xf08a24, 0.1, 0.14, 0.08, sx * 0.11, 0.56, -0.35);
      cube(g, 0x3f9f4a, 0.07, 0.07, 0.04, sx * 0.08, 0.4, -0.52);
    }
    cube(g, 0xffffff, 0.2, 0.12, 0.04, 0, 0.28, -0.52);
    parts.tail = new THREE.Group();
    parts.tail.position.set(0, 0.2, 0.3);
    g.add(parts.tail);
    cube(parts.tail, 0xf08a24, 0.1, 0.5, 0.1, 0, 0.25, 0);
  } else if (kind === 'monkey') {
    cube(g, 0x7a4a26, 0.4, 0.5, 0.35, 0, 0.25, 0);
    cube(g, 0x7a4a26, 0.36, 0.34, 0.34, 0, 0.66, 0);
    cube(g, 0xe0b88a, 0.26, 0.22, 0.05, 0, 0.62, -0.18);
    for (const sx of [-1, 1]) {
      cube(g, 0xe0b88a, 0.1, 0.14, 0.08, sx * 0.22, 0.68, 0);
      cube(g, 0x111111, 0.06, 0.06, 0.04, sx * 0.07, 0.7, -0.2);
    }
    parts.arm = new THREE.Group();
    parts.arm.position.set(0.22, 0.4, 0);
    g.add(parts.arm);
    cube(parts.arm, 0x7a4a26, 0.1, 0.35, 0.1, 0, 0.15, 0);
    cube(parts.arm, 0xf6d860, 0.1, 0.3, 0.1, 0.05, 0.4, -0.05); // банан
    parts.tail = new THREE.Group();
    parts.tail.position.set(0, 0.1, 0.2);
    g.add(parts.tail);
    cube(parts.tail, 0x7a4a26, 0.08, 0.08, 0.6, 0, -0.1, 0.3);
  } else {
    cube(g, 0xf2eee4, 0.38, 0.32, 0.55, 0, 0.16, 0);
    cube(g, 0xf2eee4, 0.34, 0.32, 0.34, 0, 0.38, -0.32);
    cube(g, 0x8a5a30, 0.12, 0.26, 0.2, -0.2, 0.34, -0.32); // висячие уши
    cube(g, 0x8a5a30, 0.12, 0.26, 0.2, 0.2, 0.34, -0.32);
    cube(g, 0x111111, 0.1, 0.08, 0.06, 0, 0.36, -0.51);
    cube(g, 0x8a5a30, 0.2, 0.2, 0.05, 0.08, 0.2, 0.28); // пятно
    parts.tail = new THREE.Group();
    parts.tail.position.set(0, 0.25, 0.28);
    g.add(parts.tail);
    cube(parts.tail, 0xf2eee4, 0.08, 0.3, 0.08, 0, 0.15, 0);
  }
  g.traverse((o) => (o.castShadow = false));
  return { g, parts };
}

// hooks: say, fx, sfx, mode(), gold(n), enemyNear(d), treasureNear(r) → item | null
export function createPet(crew, hooks) {
  let kind = 'none';
  let pet = null;
  let talkT = 40 + Math.random() * 20;
  let perkT = 40;
  let checkT = 0;
  let warned = false;
  const barked = new WeakSet();

  function set(id) {
    if (pet) pet.g.removeFromParent();
    pet = null;
    kind = id;
    if (!WORDS[id]) return;
    pet = build(id);
    pet.g.position.set(-0.85, 2.95, 0.1); // на левом плече
    crew.captain.add(pet.g);
  }

  function update(dt, t) {
    if (!pet) return;
    const { g, parts } = pet;
    g.position.y = 2.95 + Math.abs(Math.sin(t * 3)) * 0.08;
    if (parts.wings) {
      const flap = Math.sin(t * 2) > 0.7 ? Math.sin(t * 30) * 0.8 : 0; // иногда хлопает крыльями
      parts.wings[0].rotation.z = flap;
      parts.wings[1].rotation.z = -flap;
    }
    if (parts.tail) parts.tail.rotation.z = Math.sin(t * (kind === 'puppy' ? 14 : 3)) * 0.5;
    if (parts.arm) parts.arm.rotation.x = Math.sin(t * 2) * 0.4 - 0.3;

    const mode = hooks.mode();
    if (mode !== 'sea' && mode !== 'land') return;
    if ((talkT -= dt) <= 0) {
      talkT = 60 + Math.random() * 40;
      hooks.say(pick(WORDS[kind]));
      hooks.sfx.squeak();
    }
    if ((checkT -= dt) > 0) return;
    checkT = 0.5;
    if (kind === 'parrot' && mode === 'sea') {
      const near = hooks.enemyNear(110);
      if (near && !warned) hooks.say('🦜 Кар-р! Враг на гор-р-ризонте!', 2.5);
      warned = near;
    } else if (kind === 'cat' && mode === 'sea' && (perkT -= 0.5) <= 0) {
      perkT = 45;
      hooks.gold(2);
      hooks.sfx.coin();
      hooks.say('🐱 Мур! Котик поймал рыбку: +2');
    } else if (kind === 'puppy' && mode === 'land') {
      const it = hooks.treasureNear(30);
      if (it && !barked.has(it)) {
        barked.add(it);
        hooks.say('🐶 Гав-гав! Рядом зарыт клад!', 2.5);
        hooks.fx.burst(0xffd040, it.g.position, 14, { speed: 3, up: 8, size: 0.5, life: 1.2, y: 0.5, gravity: -1 });
        hooks.sfx.whistle();
      }
    }
  }

  return {
    set,
    update,
    get landMagnet() {
      return kind === 'monkey' ? 6 : 0;
    },
  };
}
