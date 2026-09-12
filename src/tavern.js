import * as THREE from 'three';
import { cube } from './voxel.js';
import { SEA_Y } from './terrain.js';

// Таверна «Весёлый осьминог» в порту: моряки, которых можно нанять в команду.
// Нанятые встают на палубу, а в море сами делают своё дело.
export const RECRUITS = [
  { id: 'cook', name: 'Кок', icon: '🍲', price: 40, text: 'Кормит команду: возвращает упавших за борт, чинит корпус супом' },
  { id: 'navigator', name: 'Штурман', icon: '🧭', price: 50, text: 'Золотые буйки ведут к цели, корабль плывёт быстрее' },
  { id: 'diver', name: 'Водолаз', icon: '🤿', price: 60, text: 'Ныряет за сокровищами: сундучки и жемчуг со дна' },
  { id: 'carpenter', name: 'Плотник', icon: '🔨', price: 45, text: 'Корпус крепче на удар, в море латает пробоины' },
  { id: 'musician', name: 'Музыкант', icon: '🪗', price: 35, text: 'Играет на гармошке — дельфины приносят монетки' },
];

// Карточки моряков. onHire(recruit, button).
export function renderTavern(root, save, onHire) {
  root.replaceChildren(
    ...RECRUITS.map((r) => {
      const hired = save.hired.includes(r.id);
      const btn = document.createElement('button');
      btn.className = `recruit ${hired ? 'hired' : save.gold >= r.price ? 'can' : 'cant'}`;
      btn.innerHTML =
        `<span class="rc-icon">${r.icon}</span>` +
        `<span class="rc-body"><span class="rc-name">${r.name}</span><span class="rc-text">${r.text}</span></span>` +
        `<span class="rc-price">${hired ? '✓ в команде' : `<span class="cube"></span>${r.price}`}</span>`;
      if (!hired) btn.addEventListener('click', () => onHire(r, btn));
      return btn;
    }),
  );
}

// Как часто каждый берётся за дело (секунд).
const EVERY = { cook: 55, diver: 45, carpenter: 75, musician: 50 };
const NOTES = [0xe0302a, 0xf4d23a, 0x3a7fd0];

// hooks: say, fx, sfx, mode(), ship (группа корабля), gold(n), shields(), maxShields(),
//        addShield(), target() → {x, z} | null, busy(p)
export function createRoles(scene, crew, hooks) {
  const timers = { cook: 30, diver: 25, carpenter: 40, musician: 30 };
  let dive = null;
  const buoyMat = new THREE.MeshBasicMaterial({ color: 0xffd040 });
  const buoys = [];
  for (let i = 0; i < 6; i++) {
    const m = cube(scene, buoyMat, 0.9, 0.9, 0.9);
    m.visible = false;
    buoys.push(m);
  }
  const member = (role) => crew.people.find((p) => p.role === role && p.alive && !p.fall);
  const pos = new THREE.Vector3();
  const at = (p, up = 0) => {
    p.g.getWorldPosition(pos);
    pos.y += up;
    return pos;
  };

  function act(role, p) {
    switch (role) {
      case 'cook': {
        hooks.fx.burst(0xffffff, at(p, 4), 6, { speed: 1, up: 3, size: 0.5, life: 1.2, y: 0, gravity: -1 }); // пар от котелка
        const back = crew.revive();
        if (back) {
          hooks.say(`🍲 Кок накормил команду — ${back.name} снова на палубе!`);
          hooks.sfx.rescue();
        } else if (hooks.shields() < hooks.maxShields()) {
          hooks.addShield();
          hooks.say('🍲 Кок сварил суп — корпус крепче!');
          hooks.sfx.shield();
        } else {
          hooks.gold(2);
          hooks.say('🍲 Кок испёк пирожки и продал встречному кораблю: +2');
          hooks.sfx.coin();
        }
        return true;
      }
      case 'carpenter':
        if (hooks.shields() >= hooks.maxShields()) return false; // чинить нечего — подождёт
        hooks.addShield();
        hooks.fx.burst(0x9c6d44, at(p, 2), 8, { speed: 5, up: 4, size: 0.4, life: 0.6 });
        hooks.sfx.bump();
        hooks.say('🔨 Плотник залатал корпус!');
        return true;
      case 'musician': {
        hooks.sfx.dance();
        for (let i = 0; i < 6; i++) hooks.fx.burst(NOTES[i % 3], at(p, 3 + i * 0.3), 1, { speed: 2, up: 4, size: 0.4, life: 1.5, y: 0, gravity: -1 });
        const s = hooks.ship.position;
        for (const side of [-1, 1]) hooks.fx.splash(s.x + side * 8, s.z);
        hooks.gold(3);
        hooks.say('🪗 Музыкант заиграл — дельфины принесли монетки! +3');
        return true;
      }
      case 'diver': {
        dive = { p, t: 0 };
        const w = at(p);
        hooks.fx.splash(w.x, w.z);
        hooks.sfx.splash();
        p.g.visible = false;
        hooks.say('🤿 Водолаз нырнул за сокровищем…');
        return true;
      }
    }
    return false;
  }

  function finishDive() {
    const p = dive.p;
    dive = null;
    p.g.visible = p.alive;
    if (hooks.mode() !== 'sea') return;
    const w = at(p, 1);
    hooks.fx.splash(w.x, w.z);
    if (Math.random() < 0.12) {
      hooks.gold(25);
      hooks.fx.burst(0xf4f4ff, w, 16, { speed: 8, up: 6, size: 0.5 });
      hooks.say('🤿 …и нашёл огромную жемчужину! +25', 3);
    } else {
      const g = 5 + Math.floor(Math.random() * 8);
      hooks.gold(g);
      hooks.fx.burst(0xf6c944, w, 12, { speed: 6, up: 5, size: 0.5 });
      hooks.say(`🤿 …и достал сундучок со дна! +${g}`);
    }
    hooks.sfx.chest();
  }

  function update(dt, t) {
    const sea = hooks.mode() === 'sea';
    // штурман: золотые буйки на воде показывают дорогу к цели
    const tg = sea && member('navigator') ? hooks.target() : null;
    const s = hooks.ship.position;
    const d = tg ? Math.hypot(tg.x - s.x, tg.z - s.z) : 0;
    buoys.forEach((b, i) => {
      b.visible = d > 35;
      if (!b.visible) return;
      const k = (14 + i * 11) / d;
      b.position.set(s.x + (tg.x - s.x) * k, SEA_Y + 0.5 + Math.sin(t * 3 + i) * 0.25, s.z + (tg.z - s.z) * k);
      b.rotation.y += dt;
    });

    if (dive) {
      dive.t += dt;
      if (Math.random() < dt * 6) hooks.fx.burst(0xe6f5ff, { x: s.x + 6, y: SEA_Y, z: s.z }, 1, { speed: 1, up: 3, size: 0.4, life: 0.6, y: 0 }); // пузыри
      if (dive.t > 3.5 || !sea) finishDive();
    }
    if (!sea) return;
    for (const role of Object.keys(EVERY)) {
      const p = member(role);
      if (!p || hooks.busy(p) || dive?.p === p) continue;
      if ((timers[role] -= dt) > 0) continue;
      timers[role] = act(role, p) ? EVERY[role] : 15;
    }
  }

  function cancel() {
    if (dive) {
      dive.p.g.visible = true;
      dive = null;
    }
    buoys.forEach((b) => (b.visible = false));
  }

  return {
    update,
    cancel,
    act: (role) => {
      const p = member(role);
      return p ? act(role, p) : false;
    },
    get speedMult() {
      return member('navigator') ? 1.12 : 1;
    },
  };
}
