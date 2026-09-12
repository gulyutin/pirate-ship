// Карты удачи — рогалайт: перед заплывом выбираешь одну из трёх, потом новые
// за золото в трюме, у торговца и из бутылок. Действуют до возвращения в порт,
// одинаковые карты складываются.
export const CARDS = [
  { id: 'fire', icon: '🔥', name: 'Огненные ядра', text: 'Пушки стреляют вдвое чаще. Нет пушек — дадим!' },
  { id: 'dolphins', icon: '🐬', name: 'Дельфины-друзья', text: 'Пока плывёшь, дельфины носят монетки' },
  { id: 'fish', icon: '🎣', name: 'Рыбацкая удача', text: 'Улов стоит вдвое дороже' },
  { id: 'magnet', icon: '🧲', name: 'Супермагнит', text: 'Монеты и сундуки летят к тебе издалека' },
  { id: 'wind', icon: '💨', name: 'Попутный ветер', text: 'Корабль плывёт быстрее' },
  { id: 'planks', icon: '🪵', name: 'Крепкие доски', text: 'Корпус выдержит ещё 2 удара' },
  { id: 'rush', icon: '💰', name: 'Золотая лихорадка', text: 'Монетка на острове — за две' },
  { id: 'digger', icon: '⛏', name: 'Кладоискатель', text: 'Клады больше, копать быстрее' },
  { id: 'boots', icon: '🦘', name: 'Прыгучие сапоги', text: 'Капитан прыгает выше' },
  { id: 'chests', icon: '🌊', name: 'Сундуки со дна', text: 'Рядом с кораблём всплывают сундуки' },
  { id: 'ring', icon: '🛟', name: 'Спасательный круг', text: 'Разобьют корабль — команда спасётся' },
  { id: 'luck', icon: '🍀', name: 'Пиратская удача', text: 'Сундуки и спасённые моряки — вдвое щедрее' },
];
const BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

export function createCards() {
  let active = []; // id взятых карт, по порядку

  const count = (id) => active.reduce((n, a) => n + (a === id), 0);

  // n разных случайных карт на выбор
  function offer(n = 3) {
    const pool = [...CARDS];
    const out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return out;
  }

  // спасательный круг и подобные — срабатывают один раз
  function consume(id) {
    const i = active.indexOf(id);
    if (i < 0) return false;
    active.splice(i, 1);
    return true;
  }

  // значки взятых карт в HUD: одинаковые — одной плашкой с «×2»
  function renderHud(root) {
    const ids = [...new Set(active)];
    root.replaceChildren(
      ...ids.map((id) => {
        const el = document.createElement('span');
        el.className = 'hcard';
        el.title = BY_ID[id].name;
        el.textContent = BY_ID[id].icon;
        const n = count(id);
        if (n > 1) {
          const b = document.createElement('b');
          b.textContent = `×${n}`;
          el.append(b);
        }
        return el;
      }),
    );
  }

  return {
    count,
    offer,
    consume,
    renderHud,
    add: (id) => active.push(id),
    reset: () => (active = []),
    get list() {
      return active;
    },
  };
}

// Экран выбора: большие карты, нажал — взял. opts: { title, sub, price, skip }.
export function renderPicker(root, choices, opts, onPick) {
  root.replaceChildren(
    ...choices.map((c, i) => {
      const btn = document.createElement('button');
      btn.className = `lcard ${opts.cantPay ? 'cant' : ''}`;
      btn.style.animationDelay = `${i * 0.08}s`;
      btn.innerHTML =
        `<span class="lc-key">${i + 1}</span>` +
        `<span class="lc-icon">${c.icon}</span>` +
        `<span class="lc-body"><span class="lc-name">${c.name}</span>` +
        `<span class="lc-text">${c.text}</span></span>` +
        (opts.price ? `<span class="lc-price"><span class="cube"></span>${opts.price}</span>` : '');
      btn.addEventListener('click', () => onPick(c, btn));
      return btn;
    }),
  );
}
