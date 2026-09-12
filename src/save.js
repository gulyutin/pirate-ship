const KEY = 'korabl:save:v2';
const OLD_KEY = 'korabl:save:v1'; // версия-раннер: золото было в поле bank

const fresh = () => ({
  gold: 0, // в банке порта — на это покупаются улучшения
  cargo: 0, // в трюме: найдено в заплыве, ещё не разгружено (при крушении половина тонет)
  found: [], // id открытых островов с чудесами света
  dug: 0, // выкопано кладов
  trips: 0, // сколько раз выходили из порта
  muted: false,
  seed: null, // номер мира; null — самый первый
  runs: 0, // сколько раз начинали заново
  gfx: 'fancy', // fancy — тени и чёткая картинка; fast — для слабых телефонов
  up: { cannons: 0, hull: 0, sails: 0, magnet: 0 },
  summits: [], // острова, на чьи вершины забрались по паркуру
  medals: 0, // выполненные задания
  quests: [], // текущие задания капитана порта
  mapPieces: 0, // клочки карты сокровищ (из трёх)
  bigTreasure: null, // остров с великим кладом, когда карта собрана
  bigDug: 0,
  fish: 0,
  rescued: 0,
  krakens: 0,
  look: { sail: 'purple', flag: 'black', figure: 'none', hat: 'tricorn', pet: 'parrot' }, // внешний вид
  owned: ['sail:purple', 'flag:black', 'figure:none', 'hat:tricorn', 'pet:parrot', 'pet:none'],
  base: [], // блоки своего острова: [i, k, низ, тип]
});

function read(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    return raw && typeof raw === 'object' ? raw : null;
  } catch {
    return null;
  }
}

export function loadSave() {
  const save = fresh();
  const raw = read(KEY);
  if (raw) {
    Object.assign(save, raw);
  } else {
    const old = read(OLD_KEY);
    if (old) {
      save.gold = Number(old.bank) || 0;
      save.muted = !!old.muted;
      save.up = old.up ?? save.up;
    }
  }
  save.up = { ...fresh().up, ...save.up };
  save.look = { ...fresh().look, ...save.look };
  for (const k of ['found', 'summits', 'quests', 'owned', 'base']) if (!Array.isArray(save[k])) save[k] = fresh()[k];
  return save;
}

// «Начать заново»: всё с нуля и новый мир, но настройки звука и графики остаются.
export function resetSave(old) {
  return {
    ...fresh(),
    muted: old.muted,
    gfx: old.gfx,
    runs: (old.runs || 0) + 1,
    seed: 1 + Math.floor(Math.random() * 2 ** 30),
  };
}

export function storeSave(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* приватный режим — просто не запоминаем */
  }
}
