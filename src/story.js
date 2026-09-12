import { TRIALS } from './trials.js';

// Сюжет «Легенда о Кракене»: пять ключей из пяти частей света, каждый охраняет
// испытание. Ключи добываются по порядку — так всегда понятно, куда плыть дальше.
// Собрал все пять — открывается логово Кракена.
export const CHAPTERS = [
  { region: 'russia', key: 'Ключ России', trial: 'firebird', icon: '🔥', dist: 230, intro: 'Жар-птица носит Ключ России. Догони её три раза!' },
  { region: 'americas', key: 'Ключ Америки', trial: 'race', icon: '🏁', dist: 380, intro: 'Проплыви через все 8 колец вокруг острова, пока не кончилось время!' },
  { region: 'africa', key: 'Ключ Африки', trial: 'scarabs', icon: '🪲', dist: 520, intro: 'Высадись на остров и найди шесть золотых скарабеев!' },
  { region: 'asia', key: 'Ключ Азии', trial: 'serpent', icon: '🐉', dist: 660, intro: 'Морской змей стережёт Ключ Азии. Стреляй, когда он выныривает!' },
  { region: 'europe', key: 'Ключ Европы', trial: 'blackbeard', icon: '🏴‍☠️', dist: 800, intro: 'Флагман Чёрной Бороды! Потопи его, чтобы забрать Ключ Европы.' },
];
export const LEGEND =
  'Давным-давно Золотой Кракен утащил на дно самый большой клад на свете. ' +
  'Его логово запирают пять волшебных ключей — по одному в каждой части света. ' +
  'Их стерегут Жар-птица, морская гонка, золотые скарабеи, Морской змей и сам Чёрная Борода. ' +
  'Собери все пять ключей — и сразись с Кракеном!';

const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

// hooks: islands, scene, fx, sfx, say(msg, sec), celebrate(x, y, z), store(), cellPos(c), extra (испытания-боссы)
export function createStory(save, hooks) {
  let trial = null; // { chapter, isl, obj }
  const trials = { ...TRIALS, ...(hooks.extra ?? {}) };

  // острова для ключей: нужная часть света, примерно на нужном расстоянии от порта
  function ensure() {
    // логово Кракена — в открытом море, подальше от островов
    if (!save.story.lair) {
      let best = null;
      let bestScore = -1;
      for (let k = 0; k < 64; k++) {
        const a = (k / 64) * Math.PI * 2;
        const p = { x: Math.cos(a) * 880, z: Math.sin(a) * 880 };
        const score = Math.min(...hooks.islands.map((i) => Math.hypot(i.x - p.x, i.z - p.z) - i.r));
        if (score > bestScore) {
          bestScore = score;
          best = p;
        }
      }
      save.story.lair = best;
      hooks.store();
    }
    if (save.story.islands.length === CHAPTERS.length) return;
    const used = new Set();
    save.story.islands = CHAPTERS.map((ch) => {
      let best = null;
      let bestD = Infinity;
      for (const isl of hooks.islands) {
        if (isl.port || isl.home || !isl.landmark || isl.secret || used.has(isl.id)) continue;
        const d = Math.abs(Math.hypot(isl.x, isl.z) - ch.dist) + (isl.landmark.region === ch.region ? 0 : 400);
        if (d < bestD) {
          bestD = d;
          best = isl;
        }
      }
      used.add(best.id);
      return best.id;
    });
    hooks.store();
  }

  const chapter = () => (save.story.keys < CHAPTERS.length ? save.story.keys : -1);
  const keyIsland = (c) => hooks.islands[save.story.islands[c]];

  function start(c, isl) {
    const make = trials[CHAPTERS[c].trial];
    if (!make) return null;
    hooks.say(`${CHAPTERS[c].icon} ${CHAPTERS[c].intro}`, 4);
    return { chapter: c, isl, obj: make(hooks, isl) };
  }

  function award(c) {
    const p = trial.obj.where();
    trial.obj.dispose();
    trial = null;
    save.story.keys++;
    hooks.store();
    hooks.celebrate(p.x, p.y ?? 4, p.z);
    hooks.sfx.medal();
    const k = save.story.keys;
    hooks.say(
      k < CHAPTERS.length ? `🗝 ${CHAPTERS[c].key} у тебя! Ключей: ${k} из ${CHAPTERS.length}` : '🗝 Все пять ключей! Логово Кракена открылось — смотри ★ на карте!',
      4,
    );
    hooks.onKey?.(k);
  }

  // Финал: пять ключей есть — у логова начинается битва с Кракеном.
  function updateKraken(dt, t, s) {
    if (save.story.kraken || !hooks.kraken) return;
    const lair = save.story.lair;
    const d = dist(s.boat.x, s.boat.z, lair.x, lair.z);
    if (!trial && s.mode === 'sea' && d < 160) {
      hooks.say('🐙 Вода бурлит… Это Золотой Кракен! Уплывай с красных меток и стреляй по щупальцам!', 5);
      trial = { chapter: CHAPTERS.length, isl: lair, obj: hooks.kraken(hooks, lair) };
    }
    if (!trial) return;
    if (trial.obj.update(dt, t, s) === 'win') {
      const p = trial.obj.where();
      trial.obj.dispose();
      trial = null;
      save.story.kraken = true;
      hooks.store();
      hooks.onKraken?.(p);
    } else if (d > 420) cancel();
  }

  // s: { mode, boat, cap }
  function update(dt, t, s) {
    const c = chapter();
    if (c < 0) {
      updateKraken(dt, t, s);
      return;
    }
    const isl = keyIsland(c);
    const fx = s.mode === 'land' ? s.cap.x : s.boat.x;
    const fz = s.mode === 'land' ? s.cap.z : s.boat.z;
    const d = dist(fx, fz, isl.x, isl.z);
    const active = s.mode === 'sea' || s.mode === 'land';
    if (!trial && active && d < isl.r + 110) trial = start(c, isl);
    if (!trial) return;
    if (trial.obj.update(dt, t, s) === 'win') award(c);
    else if (d > isl.r + 280) cancel(); // уплыли далеко — испытание начнётся заново
  }

  function cancel() {
    trial?.obj.dispose();
    trial = null;
  }

  return {
    ensure,
    update,
    cancel,
    get keys() {
      return save.story.keys;
    },
    // куда плыть за следующим ключом (для компаса и карты)
    target() {
      const c = chapter();
      if (c < 0) return save.story.kraken ? null : { x: save.story.lair.x, z: save.story.lair.z };
      const isl = keyIsland(c);
      return { x: isl.x, z: isl.z, id: isl.id };
    },
    marks() {
      const out = trial ? trial.obj.marks() : [];
      const tg = this.target();
      if (tg) out.push({ x: tg.x, z: tg.z, glyph: '★', color: '#e8b830' });
      return out;
    },
    hud(s) {
      return trial ? trial.obj.hud(s) : null;
    },
    portText() {
      const c = chapter();
      if (c < 0) return save.story.kraken ? '🏆 Кракен побеждён! Ты — легенда морей!' : '🐙 Все ключи собраны! Плыви к логову Кракена (★ на карте)';
      const isl = keyIsland(c);
      return `🗝 Ключи: ${save.story.keys}/${CHAPTERS.length} · дальше: ${CHAPTERS[c].icon} ${CHAPTERS[c].key} у острова «${isl.name}» (★ на карте)`;
    },
    keyList() {
      return CHAPTERS.map((ch, i) => ({ ...ch, got: i < save.story.keys }));
    },
    get active() {
      return trial;
    },
  };
}
