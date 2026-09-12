import { SAILS } from './ship.js';

// Верфь: корабли, паруса, фигура на носу, шляпа капитана и питомец.
// Покупается за золото из банка один раз, выбирать купленное можно сколько угодно.
export const HULLS = {
  sloop: { scale: 1, tier: 0 },
  brig: { scale: 1.12, tier: 1 },
  frigate: { scale: 1.24, tier: 2 },
  galleon: { scale: 1.36, tier: 3 },
};

export const CATALOG = {
  hull: {
    title: 'Корабль',
    icon: '⛵',
    items: [
      { id: 'sloop', name: 'Шлюп', icon: '⛵', price: 0, text: 'Лёгкий и шустрый' },
      { id: 'brig', name: 'Бриг', icon: '🚢', price: 120, text: 'Две мачты · корпус +1 · чуть быстрее' },
      { id: 'frigate', name: 'Фрегат', icon: '🛳', price: 250, text: 'Три мачты, пушечные порты · корпус +2' },
      { id: 'galleon', name: 'Галеон', icon: '👑', price: 450, text: 'Огромный, золото и фонари · корпус +3' },
    ],
  },
  sail: {
    title: 'Паруса',
    icon: '🎨',
    items: SAILS.map((s) => ({ id: s.id, name: s.name, swatch: s.main, price: 0 })),
  },
  figure: {
    title: 'Фигура',
    icon: '🧜',
    items: [
      { id: 'none', name: 'Без фигуры', icon: '➖', price: 0 },
      { id: 'mermaid', name: 'Русалка', icon: '🧜', price: 30 },
      { id: 'dolphin', name: 'Дельфин', icon: '🐬', price: 30 },
      { id: 'lion', name: 'Лев', icon: '🦁', price: 40 },
      { id: 'eagle', name: 'Орёл', icon: '🦅', price: 40 },
      { id: 'dragon', name: 'Дракон', icon: '🐉', price: 50 },
    ],
  },
  hat: {
    title: 'Шляпа',
    icon: '🎩',
    items: [
      { id: 'tricorn', name: 'Треуголка', icon: '🏴‍☠️', price: 0 },
      { id: 'bandana', name: 'Бандана', icon: '🔴', price: 15 },
      { id: 'bicorne', name: 'Адмиральская', icon: '⚓', price: 25 },
      { id: 'feather', name: 'Шляпа с пером', icon: '🪶', price: 30 },
      { id: 'top', name: 'Цилиндр', icon: '🎩', price: 35 },
      { id: 'crown', name: 'Корона', icon: '👑', price: 60 },
    ],
  },
  pet: {
    title: 'Питомец',
    icon: '🦜',
    items: [
      { id: 'none', name: 'Без питомца', icon: '➖', price: 0 },
      { id: 'parrot', name: 'Попугай', icon: '🦜', price: 0, text: 'Кричит, когда рядом враг' },
      { id: 'cat', name: 'Котик', icon: '🐱', price: 30, text: 'Ловит рыбку — монетки в трюм' },
      { id: 'monkey', name: 'Обезьянка', icon: '🐒', price: 40, text: 'Собирает монетки издалека' },
      { id: 'puppy', name: 'Щенок', icon: '🐶', price: 50, text: 'Лает, когда рядом зарыт клад' },
    ],
  },
};

export function owns(save, cat, id) {
  const it = CATALOG[cat].items.find((i) => i.id === id);
  return !it || it.price === 0 || save.owned.includes(`${cat}:${id}`);
}

// Вкладки и карточки верфи. onTab(cat), onPick(cat, item, button).
export function renderYard(itemsRoot, tabsRoot, save, tab, onTab, onPick) {
  tabsRoot.replaceChildren(
    ...Object.entries(CATALOG).map(([cat, c]) => {
      const b = document.createElement('button');
      b.className = `yard-tab ${cat === tab ? 'on' : ''}`;
      b.textContent = `${c.icon} ${c.title}`;
      b.addEventListener('click', () => onTab(cat));
      return b;
    }),
  );
  itemsRoot.replaceChildren(
    ...CATALOG[tab].items.map((item) => {
      const chosen = save.look[tab] === item.id;
      const have = owns(save, tab, item.id);
      const b = document.createElement('button');
      b.className = `yard-item ${chosen ? 'chosen' : have ? 'have' : save.gold >= item.price ? 'can' : 'cant'}`;
      const face = item.swatch !== undefined
        ? `<span class="yi-swatch" style="background:#${item.swatch.toString(16).padStart(6, '0')}"></span>`
        : `<span class="yi-icon">${item.icon}</span>`;
      const state = chosen ? '✓ выбрано' : have ? 'выбрать' : `<span class="cube"></span>${item.price}`;
      b.innerHTML = `${face}<span class="yi-name">${item.name}</span>${item.text ? `<span class="yi-text">${item.text}</span>` : ''}<span class="yi-state">${state}</span>`;
      b.addEventListener('click', () => onPick(tab, item, b));
      return b;
    }),
  );
}
