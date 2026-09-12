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

// Часть света каждого чуда — по ним разложены ключи в сюжете «Легенда о Кракене».
const CLASSIC_REGION = {
  eiffel: 'europe', bigben: 'europe', spasskaya: 'russia', liberty: 'americas', pyramids: 'africa',
  pisa: 'europe', basil: 'russia', rocket: 'asia', colosseum: 'europe', taj: 'asia',
  windmill: 'europe', moai: 'americas', christ: 'americas', burj: 'asia', pagoda: 'asia',
  sydney: 'asia', stonehenge: 'europe', chichen: 'americas', parthenon: 'europe', greatwall: 'asia',
};
const tag = (list, region) => list.map((l) => ({ ...l, region }));

// 100 чудес света. Порядок = порядок островов от порта: первые 20 — самые знаменитые
// (и их номера совпадают с сохранениями прошлой версии).
export const LANDMARKS = [
  ...CLASSIC.map((l) => ({ ...l, region: CLASSIC_REGION[l.id] ?? 'europe' })),
  ...interleave([
    tag(RUSSIA, 'russia'), tag(EUROPE, 'europe'), tag(ASIA, 'asia'), tag(AMERICAS, 'americas'),
    tag(AFRICA, 'africa'), tag(EUROPE2, 'europe'), tag(ASIA2, 'asia'), tag(ANCIENT, 'africa'),
  ]),
];
