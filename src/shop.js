// Улучшения корабля, которые покупаются в порту за золото из сундука.
export const MAX_LEVEL = 3;

export const UPGRADES = [
  { id: 'cannons', icon: '💣', name: 'Пушки', hint: 'стреляют сами', prices: [10, 25, 50] },
  { id: 'hull', icon: '🛡️', name: 'Корпус', hint: '+1 удар', prices: [15, 30, 60] },
  { id: 'sails', icon: '⛵', name: 'Паруса', hint: 'быстрее плывёт', prices: [8, 20, 40] },
  { id: 'magnet', icon: '🧲', name: 'Магнит', hint: 'тянет монеты', prices: [8, 20, 40] },
];

// Что даёт каждый уровень (индекс — уровень улучшения).
export const effect = {
  cannonCooldown: [0, 1.6, 1.1, 0.7], // секунд между выстрелами, 0 — пушек нет
  shields: [0, 1, 2, 3], // сколько ударов корпус берёт на себя за заплыв
  steer: [1, 1.3, 1.6, 1.9], // множитель скорости руля
  magnet: [0, 7, 11, 16], // радиус, с которого монеты тянутся к кораблю
};

// Рисует карточки улучшений. onBuy(upgrade, price | null, button).
export function renderShop(root, save, onBuy) {
  root.replaceChildren(
    ...UPGRADES.map((u) => {
      const level = save.up[u.id];
      const price = level < MAX_LEVEL ? u.prices[level] : null;
      const state = price === null ? 'max' : save.bank >= price ? 'can' : 'cant';
      const pips = Array.from({ length: MAX_LEVEL }, (_, i) => `<i class="${i < level ? 'on' : ''}"></i>`).join('');
      const priceHtml = price === null ? '★' : `<span class="cube"></span>${price}`;

      const btn = document.createElement('button');
      btn.className = `up ${state}`;
      btn.innerHTML =
        `<span class="up-icon">${u.icon}</span>` +
        `<span class="up-name">${u.name}</span>` +
        `<span class="up-hint">${u.hint}</span>` +
        `<span class="up-lvl">${pips}</span>` +
        `<span class="up-price">${priceHtml}</span>`;
      btn.addEventListener('click', () => onBuy(u, price, btn));
      return btn;
    }),
  );
}
