import * as THREE from 'three';
import { cube } from './voxel.js';
import { walkPose } from './crew.js';

// Перк «Балбес». Время от времени игра случайно выбирает одного человека из
// списка "balbesy" в crew.json: «Пушкарь теперь балбес!». Балбес надевает шапку
// с пропеллером и чудит. Ничего плохого не случается — только смешно, а иногда
// и полезно. Через минуту-другую балбесом становится кто-то другой.

const SEA_ACTS = ['sleep', 'dance', 'fish', 'sneeze', 'swim'];
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const v = (p, m, f) => (p.fem ? f : m); // уснул / уснула

// hooks: say, fx, sfx, mode(), walking(), gold(n), boost(sec), salute(), cannons()
export function createBalbes(crew, hooks) {
  const pool = () => crew.people.filter((p) => p.canGoof); // и нанятые в таверне тоже
  let current = null;
  let switchT = 15 + Math.random() * 10; // первый балбес появится не сразу
  let nextT = 0;
  let act = null;
  const pos = new THREE.Vector3();

  const worldPos = (p, up = 3.5) => {
    p.g.getWorldPosition(pos);
    pos.y += up;
    return pos;
  };

  function wearHat(p, on) {
    p.g.userData.hat.visible = !on;
    p.g.userData.goofHat.visible = on;
  }

  function crown(p) {
    if (current) wearHat(current, false);
    current = p;
    wearHat(p, true);
    hooks.say(`${p.name} теперь ${v(p, 'балбес', 'балбесина')}! 🤪`, 3);
    hooks.sfx.goof();
    hooks.fx.burst(0xe8b830, worldPos(p, 5), 10, { speed: 6, up: 5, size: 0.5 });
    nextT = 6 + Math.random() * 6; // первая проделка — скоро
  }

  function restore(a) {
    const p = a.who;
    if (a.rod) a.rod.removeFromParent();
    if (p.isCaptain && hooks.mode() === 'land') {
      p.g.rotation.x = 0; // на суше позицию капитана ведёт игра
    } else {
      p.g.position.copy(p.home);
      p.g.rotation.set(0, 0, 0);
    }
    walkPose(p.g, 0, 0);
  }

  function start(who, kind) {
    const n = who.name;
    act = { who, kind, t: 0, dur: 3, beat: 0 };
    switch (kind) {
      case 'sleep':
        act.dur = 4.5;
        hooks.say(`${n} ${v(who, 'уснул', 'уснула')} на посту 💤`);
        who.g.rotation.x = 1.3;
        who.g.position.y = who.home.y + 0.4;
        break;
      case 'dance':
        act.dur = 3.5;
        hooks.say(`${n} ${v(who, 'пустился', 'пустилась')} в пляс!`);
        hooks.sfx.dance();
        break;
      case 'fish': {
        act.dur = 2.6;
        hooks.say(`${n} ${v(who, 'закинул', 'закинула')} удочку…`);
        const arm = who.g.userData.limbs[3];
        arm.rotation.x = -2.4;
        act.rod = cube(arm, 0x7a5230, 0.15, 0.15, 5, 0, -1.3, -2.4);
        break;
      }
      case 'sneeze':
        act.dur = 1.6;
        hooks.say(`${n}: а… а-а… `);
        break;
      case 'swim':
        act.dur = 3.4;
        act.side = Math.sign(who.home.x) || 1;
        hooks.say(`${n} ${v(who, 'прыгнул', 'прыгнула')} купаться!`);
        break;
      case 'trip':
        act.dur = 1;
        hooks.say(`${n} ${v(who, 'споткнулся', 'споткнулась')} — бум!`);
        hooks.sfx.bump();
        break;
    }
  }

  function finish(a) {
    const n = a.who.name;
    const w = a.who;
    restore(a);
    act = null;
    if (a.kind === 'fish') {
      const roll = Math.random();
      const p = worldPos(a.who, 1);
      if (roll < 0.45) {
        hooks.say(`…и ${v(w, 'выловил', 'выловила')} старый сапог! 👢`);
        hooks.fx.burst(0x5a3a20, p, 6);
      } else if (roll < 0.8) {
        hooks.say(`…и ${v(w, 'поймал', 'поймала')} рыбу! 🐟`);
        hooks.fx.burst(0x9fb8c8, p, 8);
      } else {
        hooks.say(`…и ${v(w, 'выловил', 'выловила')} сундук! +5`);
        hooks.fx.burst(0xf6c944, p, 14);
        hooks.sfx.chest();
        hooks.gold(5);
      }
    } else if (a.kind === 'swim') {
      hooks.say(`${n} ${v(w, 'вылез мокрый, но довольный', 'вылезла мокрая, но довольная')}`);
    } else if (a.kind === 'trip') {
      hooks.say(`…и ${v(w, 'нашёл', 'нашла')} монетку! +1`);
      hooks.fx.burst(0xf6c944, worldPos(a.who, 0.5), 8);
      hooks.sfx.coin();
      hooks.gold(1);
    }
  }

  function step(a, dt, t) {
    const p = a.who;
    const g = p.g;
    a.t += dt;
    switch (a.kind) {
      case 'sleep':
        a.beat -= dt;
        if (a.beat <= 0) {
          a.beat = 0.8;
          hooks.fx.burst(0xffffff, worldPos(p, 1.5), 1, { speed: 0.6, up: 2, size: 0.5, life: 1.2, y: 0, gravity: 0 });
        }
        break;
      case 'dance':
        g.rotation.y += dt * 9;
        g.position.y = p.home.y + Math.abs(Math.sin(t * 11)) * 0.9;
        walkPose(g, t * 16, 1);
        break;
      case 'fish':
        g.rotation.z = Math.sin(t * 3) * 0.05;
        break;
      case 'sneeze':
        if (a.t > 0.9 && !a.done) {
          a.done = true;
          g.rotation.x = -0.5;
          if (hooks.cannons()) {
            hooks.salute();
            hooks.say(`АПЧХИ! ${p.name} ${v(p, 'чихнул', 'чихнула')} — пушки дали салют!`);
          } else {
            hooks.boost(3);
            hooks.say(`АПЧХИ! Паруса надулись — полный вперёд!`);
          }
        } else if (a.done) {
          g.rotation.x *= 0.9;
        }
        break;
      case 'swim': {
        // прыжок за борт → плещется → забирается обратно (координаты корабля)
        const out = { x: p.home.x + a.side * 7, y: -1.4, z: p.home.z };
        if (a.t < 0.9) {
          const u = a.t / 0.9;
          g.position.set(p.home.x + (out.x - p.home.x) * u, p.home.y + (out.y - p.home.y) * u + Math.sin(u * Math.PI) * 4, p.home.z);
          g.rotation.z = -a.side * u * 1.2;
        } else if (a.t < 2.4) {
          if (!a.splashed) {
            a.splashed = true;
            hooks.fx.splash(worldPos(p, 0).x, pos.z);
            hooks.sfx.splash();
          }
          g.rotation.z = 0;
          g.position.set(out.x, out.y + Math.sin(t * 6) * 0.3, out.z);
          walkPose(g, t * 12, 1);
        } else {
          const u = Math.min(1, (a.t - 2.4) / 0.9);
          g.position.set(out.x + (p.home.x - out.x) * u, out.y + (p.home.y - out.y) * u + Math.sin(u * Math.PI) * 4, p.home.z);
        }
        break;
      }
      case 'trip':
        g.rotation.x = -Math.sin(Math.min(1, a.t / 0.3) * Math.PI * 0.5) * 1.3 * (a.t < 0.7 ? 1 : (1 - a.t) / 0.3);
        break;
    }
    if (a.t >= a.dur) finish(a);
  }

  function update(dt, t) {
    if (current) current.g.userData.goofHat.userData.prop.rotation.y += dt * 14;
    if (act) {
      step(act, dt, t);
      return;
    }
    const mode = hooks.mode();
    if (mode !== 'sea' && mode !== 'land') return;

    // пора выбрать нового балбеса
    switchT -= dt;
    if (switchT <= 0 && pool().length) {
      switchT = 60 + Math.random() * 40;
      const candidates = pool().filter((p) => p !== current && p.alive);
      if (candidates.length) {
        crown(pick(candidates));
        return;
      }
    }

    if (!current) return;
    nextT -= dt;
    if (nextT > 0) return;
    nextT = 16 + Math.random() * 14;
    if (mode === 'sea' && current.alive && !current.fall) {
      start(current, pick(SEA_ACTS));
    } else if (mode === 'land' && current.isCaptain && hooks.walking()) {
      start(current, 'trip');
    }
  }

  // Прервать проделку (удар, высадка, возврат в порт).
  function cancel() {
    if (!act) return;
    restore(act);
    act = null;
  }

  return {
    update,
    cancel,
    get current() {
      return current;
    },
    get hasGoofs() {
      return pool().length > 0;
    },
    acting: (p) => act?.who === p,
    captainBusy: () => act?.who.isCaptain && act.kind === 'trip',
  };
}
