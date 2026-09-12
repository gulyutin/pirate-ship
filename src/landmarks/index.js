import { CLASSIC } from './classic.js';
import { RUSSIA } from './russia.js';
import { EUROPE } from './europe.js';
import { EUROPE2 } from './europe2.js';
import { ASIA } from './asia.js';
import { ASIA2 } from './asia2.js';
import { AMERICAS } from './americas.js';
import { AFRICA, ANCIENT } from './africa.js';

// По очереди из каждого списка — чтобы соседние острова были из разных стран.
function interleave(lists) {
  const out = [];
  for (let i = 0; lists.some((l) => i < l.length); i++) {
    for (const l of lists) if (i < l.length) out.push(l[i]);
  }
  return out;
}

// 100 чудес света. Порядок = порядок островов от порта: первые 20 — самые знаменитые
// (и их номера совпадают с сохранениями прошлой версии).
export const LANDMARKS = [...CLASSIC, ...interleave([RUSSIA, EUROPE, ASIA, AMERICAS, AFRICA, EUROPE2, ASIA2, ANCIENT])];
