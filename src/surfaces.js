import { B } from './terrain.js';

// Дополнительные твёрдые блоки поверх островов: парящие ступени паркура и блоки своей базы.
// По клеткам сетки суши хранятся отрезки [низ, верх]: на них можно стоять, в них нельзя войти.
const key = (i, k) => i * 65536 + k;
const cellOf = (v) => Math.floor(v / B);

export function createSurfaces() {
  const cells = new Map();

  function add(x, z, bottom, top, tag = '') {
    const k = key(cellOf(x), cellOf(z));
    let list = cells.get(k);
    if (!list) cells.set(k, (list = []));
    list.push({ bottom, top, tag });
  }

  function removeTag(tag) {
    for (const [k, list] of cells) {
      const rest = list.filter((s) => s.tag !== tag);
      if (rest.length) cells.set(k, rest);
      else cells.delete(k);
    }
  }

  // Самый высокий верх в клетке, не выше limit (−Infinity — опоры нет).
  function support(x, z, limit) {
    const list = cells.get(key(cellOf(x), cellOf(z)));
    let best = -Infinity;
    if (list) for (const s of list) if (s.top <= limit && s.top > best) best = s.top;
    return best;
  }

  // Упрётся ли человек ростом h, стоящий на высоте y, в блок в этой клетке.
  function blocked(x, z, y, h) {
    const list = cells.get(key(cellOf(x), cellOf(z)));
    return !!list && list.some((s) => s.bottom < y + h && s.top > y + 0.05);
  }

  // Верх самого высокого блока в клетке (−Infinity — пусто).
  function topAt(x, z) {
    return support(x, z, Infinity);
  }

  return { add, removeTag, support, blocked, topAt };
}
