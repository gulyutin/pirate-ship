// Задания капитана порта: всегда два активных. Выполнил — сразу награда и медаль,
// новые выдаются при заходе в порт. Хранятся в сохранении (save.quests).
const TEMPLATES = [
  { type: 'discover', need: [2, 3], reward: 15, text: (n) => `Открой ${n} новых острова` },
  { type: 'dig', need: [2, 3], reward: 15, text: (n) => `Выкопай ${n} клада` },
  { type: 'coin', need: [10, 15], reward: 10, text: (n) => `Собери ${n} монет` },
  { type: 'summit', need: [1], reward: 20, text: () => 'Поднимись на вершину любого чуда света' },
  { type: 'fish', need: [2, 3], reward: 12, text: (n) => `Поймай ${n} рыбы` },
  { type: 'rescue', need: [1, 2], reward: 15, text: (n) => (n === 1 ? 'Спаси моряка с бочки' : `Спаси ${n} моряков с бочек`) },
  {
    type: 'sink', need: [1, 2], reward: 20,
    text: (n) => (n === 1 ? 'Потопи вражеский бриг' : `Потопи ${n} вражеских брига`),
    when: (s) => s.up.cannons > 0 && s.found.length >= 2,
  },
  { type: 'visit', need: [1], reward: 15, text: (_, name) => `Доплыви до острова «${name}»` },
  { type: 'map', need: [1], reward: 10, text: () => 'Найди клочок карты сокровищ', when: (s) => !s.bigTreasure },
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// hooks: islands, onDone(quest)
export function createQuests(save, hooks) {
  // остров для задания «доплыви»: один из ближних к порту неоткрытых
  function visitTarget() {
    const taken = new Set(save.quests.map((q) => q.target));
    const open = hooks.islands
      .filter((i) => i.landmark && !i.secret && !save.found.includes(i.id) && !taken.has(i.id))
      .sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))
      .slice(0, 3);
    return open.length ? pick(open) : null;
  }

  function make() {
    const active = new Set(save.quests.map((q) => q.type));
    const options = TEMPLATES.filter((t) => !active.has(t.type) && (!t.when || t.when(save)));
    for (let tries = 0; tries < 10 && options.length; tries++) {
      const t = pick(options);
      const need = pick(t.need);
      if (t.type === 'visit') {
        const isl = visitTarget();
        if (!isl) continue;
        return { type: t.type, need, have: 0, reward: t.reward, target: isl.id, text: t.text(need, isl.name) };
      }
      return { type: t.type, need, have: 0, reward: t.reward, text: t.text(need) };
    }
    return null;
  }

  // Дополнить до двух заданий (в порту и в начале игры).
  function ensure() {
    while (save.quests.length < 2) {
      const q = make();
      if (!q) break;
      save.quests.push(q);
    }
  }

  // Что-то случилось в игре: type — вид события, payload — например id острова.
  function event(type, payload) {
    let changed = false;
    for (const q of save.quests) {
      if (q.type !== type || q.done) continue;
      if (type === 'visit' && payload !== q.target) continue;
      q.have++;
      changed = true;
      if (q.have >= q.need) {
        q.done = true;
        hooks.onDone(q);
      }
    }
    if (changed) save.quests = save.quests.filter((q) => !q.done);
  }

  return {
    ensure,
    event,
    list: () => save.quests,
    target: () => save.quests.find((q) => q.type === 'visit')?.target ?? null,
  };
}
