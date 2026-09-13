import * as THREE from 'three';
import { cube, glow, glows } from './voxel.js';
import { SEA_Y } from './terrain.js';
import { buildAnimal } from './animals.js';
import { duckMusic } from './audio.js';

// Ожившие чудеса: подойди к чуду — появится кнопка: куранты, лифт на вершину, охота за звёздами,
// тайный ход, воздушные змеи… В первый раз — награда. Эффекты собраны из частиц, звуков и фигур.

const TAU = Math.PI * 2;
const BOX = new THREE.BoxGeometry(1, 1, 1);
const UP = new THREE.Vector3(0, 1, 0);
const PALETTE = [0xe0302a, 0xf08a24, 0xf4d23a, 0x4fb05a, 0x3a7fd0, 0x8a4fc0, 0xf07ab8, 0xffffff];
const RAINBOW = [0xe0302a, 0xf08a2a, 0xf4d23a, 0x4fb05a, 0x3a7fd0, 0x8a4fc0];
const rnd = (r) => (Math.random() - 0.5) * 2 * r;
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
const own = (m) => {
  m.userData.own = true; // создан для эффекта — после него удаляем
  return m;
};
// направление по касательной к кругу (угол a) → поворот модели, смотрящей в −z
const along = (a) => Math.atan2(Math.sin(a), -Math.cos(a));

/* ---------- мелодии ---------- */
const N = {
  C3: 131, E3: 165, G3: 196, A3: 220, B3: 247, C4: 262, D4: 294, E4: 330, F4: 349, Fs4: 370, G4: 392, Gs4: 415,
  A4: 440, B4: 494, C5: 523, Cs5: 554, D5: 587, E5: 659, F5: 698, Fs5: 740, G5: 784, A5: 880,
};
const SEMI = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
const nf = (n) => {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  return 440 * 2 ** ((SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12) / 12);
};
// «нота:доли» строкой — в события мелодии
function fromStr(str, step, k = 'note', v = 1, t0 = 0) {
  const out = [];
  let t = t0;
  for (const tok of str.trim().split(/\s+/)) {
    const [n, b] = tok.split(':');
    if (n !== 'R') out.push({ t, f: nf(n), k, v, d: step * Number(b) });
    t += step * Number(b);
  }
  return out;
}
// Куски мелодии подряд: [ноты, шаг, чем играть, громкость]. Нота — число или [нота, доли]; 0 — пауза.
function chain(...parts) {
  const out = [];
  let t0 = 0;
  for (const [list, step, k = 'note', v = 1] of parts) {
    let t = t0;
    for (const it of list) {
      const [f, beats = 1] = Array.isArray(it) ? it : [it];
      if (f) out.push({ t, f, k, v, d: step * beats });
      t += step * beats;
    }
    t0 = t;
  }
  return out;
}
const KOROBEINIKI = 'E5:1 B4:.5 C5:.5 D5:1 C5:.5 B4:.5 A4:1 A4:.5 C5:.5 E5:1 D5:.5 C5:.5 B4:1.5 C5:.5 D5:1 E5:1 C5:1 A4:1 A4:2 '
  + 'D5:1.5 F5:.5 A5:1 G5:.5 F5:.5 E5:1.5 C5:.5 E5:1 D5:.5 C5:.5 B4:1 B4:.5 C5:.5 D5:1 E5:1 C5:1 A4:1 A4:2';
const TUNES = {
  // вестминстерские четверти и три удара часов
  westminster: () => chain(
    [[N.Gs4, N.Fs4, N.E4, [N.B3, 2], N.E4, N.Gs4, N.Fs4, [N.B3, 2], N.E4, N.Fs4, N.Gs4, [N.E4, 2], N.Gs4, N.E4, N.Fs4, [N.B3, 3]], 0.5, 'bell'],
    [[N.E3, [0, 2], N.E3, [0, 2], N.E3, [0, 2]], 0.55, 'bell', 1.6],
  ),
  // Куранты Спасской башни: двенадцать ударов главного колокола и гимн.
  // Настоящего четвертного перезвона здесь пока нет — его ноты надо снять с записи.
  kremlin: () => {
    const out = [];
    let t = 0.3;
    for (let n = 1; n <= 12; n++) {
      out.push({ t, f: N.C3, k: 'bell', v: 1.7, say: `Бом! ${n}` });
      t += 0.75;
    }
    t += 0.8;
    return out.concat(fromStr('G4:1 C5:2 G4:1.5 A4:.5 B4:2 E4:1 E4:1 A4:2 G4:1.5 F4:.5 G4:2 C4:1 C4:1 D4:2 D4:1 E4:1 F4:2 F4:1 G4:1 A4:2 B4:1 C5:1 D5:3 G4:1 C5:4', 0.36, 'chime', 1, t));
  },
  // Красноярский Биг-Бен: мелодия курантов «соль-соль-до, до-ре-си-до, до» дважды, потом двенадцать ударов
  krasnoyarsk: () => {
    const phrase = 'G5:1 G5:1 C6:3 C6:1 D6:2 B5:2 C6:2 C5:4';
    const out = fromStr(phrase, 0.43, 'chime', 0.9).concat(fromStr(phrase, 0.43, 'chime', 0.9, 0.43 * 16 + 1.2));
    let t = 0.43 * 32 + 2.4;
    for (let n = 1; n <= 12; n++) {
      out.push({ t, f: 277, k: 'bell', v: 1.5, say: `Бом! ${n}` }); // часовой колокол — как на записи, около до-диез
      t += 1.1;
    }
    return out;
  },
  pisa: () => chain([[N.C5, N.B4, N.A4, N.G4, N.F4, N.E4, [N.D4, 2], N.C5, N.B4, N.A4, N.G4, N.F4, N.E4, [N.D4, 3]], 0.3, 'bell', 0.8]),
  orloj: () => chain([[N.A4, 0, N.A4, 0, N.A4, 0, N.A4, 0, N.A4, 0, N.A4, 0], 0.4, 'bell'], [[[N.G4, 0.5], [N.C5, 0.5], [N.E5, 3]], 0.4]),
  // русский колокольный звон: большой колокол, средние и перезвон маленьких
  zvon: () => {
    const out = [];
    for (let i = 0; i < 32; i++) {
      const t = i * 0.22;
      if (i % 8 === 0) out.push({ t, f: N.C3, k: 'bell', v: 1.6 });
      if (i % 2 === 0) out.push({ t, f: i % 4 ? N.A4 : N.G4, k: 'bell', v: 0.6 });
      out.push({ t, f: [N.C5, N.E5, N.D5, N.G5][(i * 5) % 4], k: 'bell', v: 0.35 });
    }
    return out;
  },
  chimes: () => {
    const out = [];
    for (let i = 0; i < 18; i++) out.push({ t: i * 0.3 + Math.random() * 0.1, f: pick([N.E5, N.G5, N.A5, N.C5, N.D5]), k: 'bell', v: 0.45 });
    return out;
  },
  korobeiniki: () => fromStr(KOROBEINIKI, 0.25),
  swan: () => chain([[[N.Fs5, 3], N.B4, N.Cs5, N.D5, N.E5, [N.Fs5, 1.5], [N.D5, 0.5], [N.Fs5, 1.5], [N.D5, 0.5], [N.Fs5, 1.5], [N.B4, 0.5], N.D5, N.B4, N.G4, N.D5, [N.B4, 4]], 0.3]),
  ode: () => chain([[N.E4, N.E4, N.F4, N.G4, N.G4, N.F4, N.E4, N.D4, N.C4, N.C4, N.D4, N.E4, [N.E4, 1.5], [N.D4, 0.5], [N.D4, 2],
    N.E4, N.E4, N.F4, N.G4, N.G4, N.F4, N.E4, N.D4, N.C4, N.C4, N.D4, N.E4, [N.D4, 1.5], [N.C4, 0.5], [N.C4, 2]], 0.3]),
  fanfare: () => chain([[N.C4, N.E4, N.G4, [N.C5, 2], N.G4, [N.C5, 3], N.E4, N.G4, N.C5, [N.E5, 2], N.C5, [N.E5, 4]], 0.18, 'note', 1.2]),
  gondola: () => chain([[N.G4, N.C5, N.C5, N.B4, N.C5, N.D5, N.C5, [N.A4, 2], N.G4, N.B4, N.B4, N.A4, N.B4, N.C5, N.B4, [N.G4, 3]], 0.3]),
  mystic: () => chain([[N.A3, N.E4, N.A4, N.C5, [N.B4, 2], N.E4, [N.A4, 4]], 0.45, 'bell', 0.7]),
  moai: () => chain([[N.A3, N.C4, N.E4, [N.A3, 2], N.G3, N.C4, [N.A3, 3]], 0.55, 'bell', 1.2]),
  // йодль и его эхо в горах
  yodel: () => chain(
    [[N.G4, N.C5, N.G4, N.E5, [N.C5, 2], N.G4, N.C5, N.G4, N.E5, [N.C5, 3]], 0.2],
    [[N.G4, N.C5, N.G4, N.E5, [N.C5, 3]], 0.2, 'note', 0.45],
    [[N.G4, N.C5, N.G4, N.E5, [N.C5, 3]], 0.2, 'note', 0.2],
  ),
  gong: () => [0, 2.6, 5.2].map((t) => ({ t, k: 'gong' })),
  drums: () => {
    const out = [];
    [...'1011011010110110'.repeat(2)].forEach((ch, i) => ch === '1' && out.push({ t: i * 0.2, k: 'drum', v: i % 8 === 0 ? 1.4 : 0.8 }));
    return out;
  },
  // хлопок у пирамиды Кукулькана возвращается птичьим «чирик»
  chirp: () => {
    const out = [];
    for (const t0 of [0, 2.2]) {
      out.push({ t: t0, k: 'clap' });
      for (let j = 1; j <= 4; j++) out.push({ t: t0 + j * 0.28, k: 'chirp', v: 1.1 - j * 0.22 });
    }
    return out;
  },
};

/* ---------- что делает каждое чудо ---------- */
const ACTS = {
  eiffel: { label: '🛗 На вершину', fx: 'lift', say: 'Лифт везёт на самый верх Эйфелевой башни! 🛗' },
  bigben: { label: '🔔 Куранты', fx: 'music', tune: 'westminster', h: 0.62, say: 'Бом! Биг-Бен бьёт часы 🔔' },
  spasskaya: { label: '🔔 Куранты', fx: 'music', tune: 'kremlin', h: 0.6, say: 'Кремлёвские куранты! Сосчитай удары 🔔' },
  liberty: { label: '🎆 Салют', fx: ['fireworks', 'music'], tune: 'fanfare', say: 'Салют над Статуей Свободы! 🎆' },
  pyramids: { label: '🔦 Тайный ход', fx: 'secret', bonus: 10, say: 'Тайный ход открылся… а там мумия машет тебе! 👋' },
  pisa: { label: '⚖️ Опыт Галилея', fx: 'galileo', say: 'Галилей бросает с башни тяжёлый и лёгкий шар. Какой упадёт первым? 🤔' },
  basil: { label: '💃 Хоровод', fx: 'matryoshka', say: 'Матрёшки водят хоровод вокруг храма! 💃' },
  rocket: { label: '🚀 Запуск!', fx: 'launch', cool: 50, say: 'Три, два, один… Пуск! 🚀' },
  colosseum: { label: '📣 Гладиаторы!', fx: 'cheer', say: 'Публика Колизея ликует! 📣' },
  taj: { label: '🪔 Фонарики', fx: 'lanterns', say: 'Над Тадж-Махалом поднимаются фонарики 🪔' },
  windmill: { label: '💨 Ветер!', fx: 'spin', say: 'Подул ветер — мельница закрутилась! 💨' },
  moai: { label: '🗿 Разбудить', fx: ['music', 'sparkle'], tune: 'moai', h: 0.8, say: 'Моаи запели низкими голосами! 🗿' },
  christ: { label: '🕊 Голуби', fx: 'doves', say: 'Голуби взлетели над Рио! 🕊' },
  burj: { label: '🛗 На вершину', fx: 'lift', say: 'Лифт на самый высокий небоскрёб мира — держись! 🛗' },
  pagoda: { label: '🏮 Фонарики', fx: 'lanterns', gong: true, say: 'Бонг! Над пагодой летят фонарики 🏮' },
  sydney: { label: '🎵 Концерт', fx: 'music', tune: 'ode', h: 0.7, r: 6, say: 'В опере начался концерт! 🎵' },
  stonehenge: { label: '☀️ Солнце', fx: 'sunbeam', say: 'Луч солнца прошёл точно через центр круга! ☀️' },
  chichen: { label: '👏 Хлопнуть', fx: 'music', tune: 'chirp', h: 1, say: 'Хлоп! А эхо у пирамиды чирикает, как птица кетцаль 🐦' },
  parthenon: { label: '⚡ Молния', fx: 'lightning', say: 'Зевс метнул молнию! ⚡' },
  greatwall: { label: '🪁 Воздушные змеи', fx: 'kites', say: 'Над Великой стеной взлетели воздушные змеи! 🪁' },
  // Россия
  winter: { label: '⛵ Алые паруса', fx: 'sailship', sail: 0xd8252a, tune: 'fanfare', say: 'По Неве плывёт корабль с алыми парусами! ⛵' },
  isaac: { label: '🔔 Звон', fx: 'music', tune: 'zvon', h: 0.9, say: 'Звонят колокола Исаакиевского собора! 🔔' },
  peterpaul: { label: '💥 Пушка', fx: 'confetti', at: [0, 2, 12], dir: [0, 9], say: 'Бабах! Полуденная пушка Петропавловки! 💥' },
  ostankino: { label: '🛗 На вершину', fx: 'lift', say: 'Лифт на Останкинскую башню — выше облаков! 🛗' },
  mgu: { label: '🎓 Выпускной', fx: 'gradcaps', say: 'Выпускники подбросили шапочки! 🎓' },
  motherland: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над Мамаевым курганом! 🎆' },
  kulsharif: { label: '🏮 Фонарики', fx: 'lanterns', say: 'Над Казанью летят фонарики 🏮' },
  saviour: { label: '🔔 Звон', fx: 'music', tune: 'zvon', h: 0.85, say: 'Звонят колокола храма! 🔔' },
  bolshoi: { label: '🩰 Балет', fx: ['music', 'ballerina'], tune: 'swan', h: 0.9, r: 5, say: 'Балерина танцует «Лебединое озеро»! 🦢' },
  kizhi: { label: '🔔 Звон', fx: 'music', tune: 'zvon', h: 0.8, say: 'Звонница Кижей заиграла! 🔔' },
  tsar: { label: '💥 Выстрелить капитаном!', fx: 'launchcap', at: [-4, 3.6, -5], say: 'Бабах! Капитан вылетел из Царь-пушки — парашют раскроется сам! 🪂' },
  krasbigben: { label: '🔔 Куранты', fx: 'music', tune: 'krasnoyarsk', h: 0.72, say: 'Куранты Красноярского Биг-Бена: мелодия и двенадцать ударов! 🔔' },
  // Европа
  arc: { label: '🚴 Тур де Франс', fx: 'racers', say: 'Велогонка «Тур де Франс» вокруг Триумфальной арки! 🚴' },
  notredame: { label: '🔔 Колокола', fx: 'music', tune: 'zvon', h: 0.7, say: 'Звонит колокол Эммануэль! 🔔' },
  louvre: { label: '🖼 Найди картины', fx: 'hunt', item: 'painting', icon: '🖼', say: 'Картины Лувра разбежались! Собери все 6, пока не вышло время 🖼' },
  michel: { label: '🕊 Чайки', fx: 'doves', say: 'Чайки взлетели над Мон-Сен-Мишелем! 🕊' },
  towerbridge: { label: '🌉 Развести мост', fx: 'raise', say: 'Тауэрский мост разводится — пропускаем корабль! 🌉' },
  londoneye: { label: '🎡 Прокатиться', fx: 'spin', boost: 10, say: 'Колесо обозрения закрутилось быстрее! 🎡' },
  brandenburg: { label: '🎈 Шарики', fx: 'balloons', say: 'В небо над воротами летят сотни шариков! 🎈' },
  neuschwanstein: { label: '❄️ Зимняя сказка', fx: 'snow', say: 'Над сказочным замком пошёл снег! ❄️' },
  cologne: { label: '🔔 Колокола', fx: 'music', tune: 'zvon', h: 0.75, say: 'Звонят колокола Кёльнского собора! 🔔' },
  sagrada: { label: '🔔 Колокола', fx: 'music', tune: 'chimes', h: 0.85, say: 'Башни Саграды звенят! 🔔' },
  atomium: { label: '⚛️ Электроны', fx: 'electrons', say: 'Вокруг Атомиума закружились электроны! ⚛️' },
  stpeter: { label: '🕊 Голуби', fx: ['doves', 'music'], tune: 'zvon', h: 0.8, say: 'Колокола и голуби над Ватиканом! 🕊' },
  venice: { label: '🎶 Песня', fx: 'music', tune: 'gondola', h: 0.4, r: 6, say: 'Гондольер запел песню! 🎶' },
  orloj: { label: '💀 Куранты', fx: 'music', tune: 'orloj', h: 0.55, say: 'Скелет звонит в колокольчик — выходят апостолы! 🔔' },
  belem: { label: '⛵ Каравелла', fx: 'sailship', sail: 0xf4f1e8, cross: true, tune: 'gondola', say: 'Каравелла мореплавателей отправляется открывать новые земли! ⛵' },
  budapest: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над Дунаем! 🎆' },
  stave: { label: '🔔 Колокол', fx: 'music', tune: 'mystic', h: 0.8, say: 'Звонит колокол деревянной церкви 🔔' },
  matterhorn: { label: '🏔 Йодль', fx: 'music', tune: 'yodel', h: 0.5, say: 'Йо-ло-ла-и-ти! Эхо в горах 🏔' },
  geysir: { label: '💦 Разбудить', fx: 'geyser', say: 'Гейзер выстрелил в небо! 💦' },
  vesuvius: { label: '🌋 Извержение', fx: 'erupt', say: 'Везувий извергается! 🌋' },
  bran: { label: '🦇 Летучие мыши', fx: 'doves', color: 0x2a2a30, say: 'Из замка вылетели летучие мыши! 🦇' },
  nessie: { label: '🦕 Позвать Несси', fx: 'nessie', say: 'Несси вынырнула поздороваться! 🦕' },
  // Азия
  tokyo: { label: '✨ Огни', fx: 'sparkle', say: 'Токийская башня зажгла огни! ✨' },
  fuji: { label: '🧗 На вершину', fx: 'lift', say: 'Подъём на самую вершину Фудзи! 🗻' },
  buddha: { label: '🔔 Гонг', fx: ['music', 'petals'], tune: 'gong', h: 0.3, say: 'Бонг! Звучит гонг у Великого Будды 🔔' },
  kinkaku: { label: '🌸 Сакура', fx: 'petals', say: 'Лепестки сакуры кружат над Золотым павильоном 🌸' },
  angkor: { label: '🪷 Найди лотосы', fx: 'hunt', item: 'lotus', icon: '🪷', say: 'У храма распустились 6 лотосов — собери их, пока не вышло время! 🪷' },
  petronas: { label: '⛲ Шоу фонтанов', fx: 'fountainshow', tune: 'ode', say: 'Поющие фонтаны у башен Петронас! ⛲' },
  marinabay: { label: '⛲ Шоу фонтанов', fx: ['fountainshow', 'sparkle'], tune: 'gondola', say: 'Шоу фонтанов и огней в Сингапуре! ⛲' },
  merlion: { label: '⛲ Фонтан', fx: 'fountain', say: 'Мерлайон пустил струю побольше! ⛲' },
  forbidden: { label: '🐉 Танец дракона', fx: 'dragon', say: 'Бум-бум! Вокруг дворца танцует дракон! 🐉' },
  heaven: { label: '🔔 Гонг', fx: 'music', tune: 'gong', h: 0.6, say: 'Бонг! Гонг у Храма Неба 🔔' },
  taipei: { label: '🎆 Салют', fx: 'fireworks', say: 'Новогодний салют над Тайбэй 101! 🎆' },
  pearl: { label: '✨ Огни', fx: 'sparkle', say: 'Жемчужина Востока засияла! ✨' },
  terracotta: { label: '🥁 Барабаны', fx: 'music', tune: 'drums', h: 0.4, r: 6, say: 'Бум-бум! Барабаны Терракотовой армии 🥁' },
  shwedagon: { label: '🔔 Колокольчики', fx: 'music', tune: 'chimes', h: 0.8, say: 'Звенят колокольчики золотой пагоды 🔔' },
  borobudur: { label: '🏮 Фонарики', fx: 'lanterns', say: 'Над Боробудуром поднимаются фонарики 🏮' },
  hagia: { label: '🕊 Голуби', fx: 'doves', say: 'Голуби взлетели над Айя-Софией! 🕊' },
  petra: { label: '💎 Сокровища Петры', fx: 'hunt', item: 'gem', icon: '💎', say: 'В Петре спрятаны 6 самоцветов — найди их! 💎' },
  qutb: { label: '🕊 Птицы', fx: 'doves', say: 'Птицы взлетели над минаретом! 🕊' },
  lotus: { label: '🌸 Лепестки', fx: 'petals', say: 'Храм Лотоса осыпал лепестки! 🌸' },
  burjarab: { label: '🚁 Вертолёт', fx: 'heli', say: 'Над парусом Бурдж аль-Араб кружит вертолёт! 🚁' },
  kuwait: { label: '✨ Огни', fx: 'sparkle', say: 'Кувейтские башни засверкали! ✨' },
  watarun: { label: '🏮 Фонарики', fx: 'lanterns', say: 'Праздник фонариков у храма Ват Арун! 🏮' },
  // Америка
  goldengate: { label: '🌫 Ревун', fx: 'fog', say: 'Туман накрыл мост — гудит ревун! 🌫' },
  rushmore: { label: '🦅 Орёл', fx: 'eagle', say: 'Белоголовый орлан парит над горой Рашмор! 🦅' },
  empire: { label: '🛗 На вершину', fx: 'lift', say: 'Лифт на самую макушку Эмпайр-стейт-билдинг! 🛗' },
  whitehouse: { label: '🥚 Охота за яйцами', fx: 'hunt', item: 'egg', icon: '🥚', say: 'Пасхальная охота у Белого дома: найди 6 яиц! 🥚' },
  spaceneedle: { label: '🛗 На вершину', fx: 'lift', say: 'Лифт на Спейс-Нидл — прямо к «летающей тарелке»! 🛗' },
  hollywood: { label: '⭐ Собери звёзды', fx: 'hunt', item: 'star', icon: '⭐', tune: 'fanfare', say: 'Звёзды Аллеи славы рассыпались — собери все 6! ⭐' },
  cn: { label: '🛗 На вершину', fx: 'lift', say: 'Лифт на Си-Эн Тауэр — одну из самых высоких башен мира! 🛗' },
  machupicchu: { label: '🦅 Кондор', fx: 'eagle', color: 0x1f1f24, head: 0xd8a090, say: 'Над Мачу-Пикчу парит огромный кондор! 🦅' },
  niagara: { label: '🌈 Радуга', fx: 'rainbow', say: 'Над водопадом радуга! 🌈' },
  gateway: { label: '🎈 Аэростаты', fx: 'balloons', big: true, say: 'Над аркой взлетают воздушные шары! 🎈' },
  brooklyn: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над Бруклинским мостом! 🎆' },
  // Африка, Океания и древние чудеса
  abusimbel: { label: '☀️ Солнце', fx: 'sunbeam', at: [0, 0], say: 'Солнечный луч заглянул в храм фараона! ☀️' },
  kilimanjaro: { label: '🐘 Сафари', fx: 'parade', kinds: ['elephant', 'giraffe', 'elephant', 'giraffe', 'elephant'], speed: 0.2, tune: 'drums', say: 'Сафари! Мимо идут слоны и жирафы 🐘' },
  table: { label: '🌫 Скатерть', fx: 'fog', say: 'Облака-скатерть легли на Столовую гору 🌫' },
  djenne: { label: '🥁 Барабаны', fx: 'music', tune: 'drums', h: 0.5, say: 'Бум-бум! Праздник у мечети в Дженне 🥁' },
  victoria: { label: '🌈 Радуга', fx: 'rainbow', say: 'Над водопадом Виктория радуга! 🌈' },
  baobabs: { label: '🥥 Плоды баобаба', fx: 'hunt', item: 'fruit', icon: '🥥', say: 'С баобабов упали 6 плодов — собери их! 🥥' },
  hassan: { label: '⛲ Фонтан', fx: 'fountain', say: 'Фонтан у мечети Хасана II забил выше! ⛲' },
  uluru: { label: '🦘 Кенгуру', fx: 'parade', kinds: ['kangaroo', 'kangaroo', 'kangaroo', 'kangaroo'], hop: true, speed: 0.3, say: 'Кенгуру скачут вокруг Улуру! 🦘' },
  harbour: { label: '🎆 Салют', fx: 'fireworks', say: 'Новогодний салют над Харбор-Бридж! 🎆' },
  southpole: { label: '🌌 Сияние', fx: ['aurora', 'parade'], kinds: ['penguin', 'penguin', 'penguin', 'penguin', 'penguin', 'penguin'], waddle: true, speed: 0.12, say: 'Полярное сияние — и пингвины вышли на парад! 🐧' },
  hobbiton: { label: '🎆 Фейерверк', fx: ['fireworks', 'music'], tune: 'fanfare', say: 'Фейерверк, как у волшебника на празднике! 🎆' },
  colossus: { label: '⛵ Корабль', fx: 'sailship', sail: 0xd8553a, oars: true, say: 'Древний корабль проплывает мимо Колосса! ⛵' },
  pharos: { label: '💡 Маяк', fx: 'beam', say: 'Александрийский маяк зажёгся! 💡' },
  gardens: { label: '🌸 Цветы', fx: 'petals', say: 'Висячие сады осыпали лепестки! 🌸' },
};

// Насколько выше чуда уходит эффект — столько камера должна захватить сверху.
// null — камера остаётся за капитаном (лифт, охота, тайный ход); 'ground' — смотрим на площадь вокруг чуда.
const FOCUS = {
  fireworks: 6, sparkle: 2, music: 2, doves: 8, lanterns: 12, aurora: 30, lightning: 10, beam: 2, sunbeam: 8,
  petals: 4, erupt: 12, geyser: 18, fountain: 4, rainbow: 6, spin: 2, raise: 2, nessie: 6, cheer: 4, confetti: 4,
  fog: 2, kites: 14, balloons: 12, heli: 8, eagle: 10, snow: 6, electrons: 4, fountainshow: 12, galileo: 2,
  gradcaps: 6, launch: 30, matryoshka: 'ground', parade: 'ground', racers: 'ground', dragon: 'ground', ballerina: 'ground',
};

/* ---------- фигурки для эффектов (все смотрят в −z) ---------- */
function makeMummy() {
  const g = new THREE.Group();
  const W = 0xe8e2d0;
  const W2 = 0xcfc6b0;
  for (const sz of [-0.22, 0.22]) cube(g, W2, 0.4, 0.9, 0.36, 0, 0.45, sz);
  cube(g, W, 0.6, 1.0, 0.9, 0, 1.4, 0);
  for (let i = 0; i < 3; i++) cube(g, W2, 0.62, 0.1, 0.92, 0, 1.05 + i * 0.3, 0);
  cube(g, W, 0.7, 0.7, 0.7, 0, 2.25, 0);
  cube(g, W2, 0.72, 0.1, 0.72, 0, 2.05, 0);
  cube(g, 0x1a1a1a, 0.05, 0.12, 0.5, 0.36, 2.35, 0);
  cube(g, 0xf07ab8, 0.05, 0.08, 0.26, 0.36, 2.1, 0);
  cube(g, W, 0.3, 0.9, 0.3, 0, 1.4, -0.6);
  const arm = new THREE.Group();
  arm.position.set(0, 1.85, 0.6);
  cube(arm, W, 0.3, 0.9, 0.3, 0, -0.45, 0);
  g.add(arm);
  g.userData.arm = arm;
  return g;
}

function makeDoll(col) {
  const g = new THREE.Group();
  cube(g, col, 1.3, 1.2, 1.3, 0, 0.6, 0);
  cube(g, col, 1.0, 0.9, 1.0, 0, 1.6, 0);
  cube(g, 0xf6dcc0, 0.7, 0.6, 0.1, 0, 1.55, -0.51);
  for (const sx of [-1, 1]) {
    cube(g, 0x1a1a1a, 0.1, 0.1, 0.05, sx * 0.15, 1.65, -0.57);
    cube(g, 0xf07ab8, 0.14, 0.1, 0.05, sx * 0.24, 1.45, -0.57);
  }
  cube(g, 0xd8252a, 0.2, 0.06, 0.05, 0, 1.38, -0.57);
  cube(g, 0xf4d23a, 0.9, 0.9, 0.1, 0, 0.55, -0.66); // фартук
  for (const [x, y, c2] of [[-0.2, 0.7, 0xd8252a], [0.2, 0.45, 0x3a6fc0], [0, 0.3, 0xd8252a]]) cube(g, c2, 0.22, 0.22, 0.05, x, y, -0.72);
  return g;
}

function makeBallerina() {
  const g = new THREE.Group();
  const SKIN = 0xf6dcc0;
  const PINK = 0xf7a8c8;
  for (const sx of [-0.12, 0.12]) cube(g, PINK, 0.16, 1.2, 0.16, sx, 0.6, 0);
  cube(g, 0xffffff, 1.7, 0.25, 1.7, 0, 1.25, 0); // пачка
  cube(g, 0xf4f4ff, 1.5, 0.2, 1.5, 0, 1.3, 0).rotation.y = Math.PI / 4;
  cube(g, PINK, 0.5, 0.8, 0.35, 0, 1.75, 0);
  cube(g, SKIN, 0.4, 0.4, 0.4, 0, 2.4, 0);
  cube(g, 0x5a3a20, 0.3, 0.3, 0.3, 0, 2.75, 0.05); // пучок
  for (const sx of [-1, 1]) cube(g, SKIN, 0.12, 0.9, 0.12, sx * 0.4, 2.45, 0).rotation.z = sx * 0.5;
  return g;
}

function makeCyclist(col) {
  const g = new THREE.Group();
  for (const z of [-0.6, 0.6]) cube(g, 0x222222, 0.12, 0.9, 0.9, 0, 0.45, z);
  cube(g, 0x9a9aa0, 0.1, 0.1, 1.2, 0, 0.8, 0);
  cube(g, 0x9a9aa0, 0.1, 0.5, 0.1, 0, 1.0, -0.5);
  for (const sx of [-0.12, 0.12]) cube(g, 0x2a2a2a, 0.15, 0.65, 0.15, sx, 0.85, 0.1);
  cube(g, col, 0.5, 0.75, 0.4, 0, 1.4, 0).rotation.x = -0.5;
  cube(g, 0xf6dcc0, 0.35, 0.35, 0.35, 0, 1.8, -0.3);
  cube(g, col, 0.4, 0.15, 0.45, 0, 2.02, -0.3);
  return g;
}

function makeHeli() {
  const g = new THREE.Group();
  cube(g, 0xe0302a, 1.6, 1.4, 3, 0, 0, 0);
  cube(g, 0x9fd8f0, 1.5, 0.9, 1, 0, 0.2, -1.4);
  cube(g, 0xe0302a, 0.4, 0.4, 3.5, 0, 0.3, 3);
  cube(g, 0xf4f4f4, 0.1, 1, 0.6, 0, 0.8, 4.6);
  for (const sx of [-0.7, 0.7]) cube(g, 0x333333, 0.1, 0.1, 3, sx, -0.95, 0);
  cube(g, 0x333333, 0.3, 0.4, 0.3, 0, 0.9, 0);
  const rotor = new THREE.Group();
  rotor.position.y = 1.15;
  cube(rotor, 0x333333, 6, 0.08, 0.35);
  cube(rotor, 0x333333, 0.35, 0.08, 6);
  g.add(rotor);
  g.userData.rotor = rotor;
  return g;
}

function makeBird(body, head) {
  const g = new THREE.Group();
  cube(g, body, 0.8, 0.6, 2.2, 0, 0, 0);
  cube(g, head, 0.55, 0.55, 0.6, 0, 0.2, -1.3);
  cube(g, 0xf4b020, 0.2, 0.2, 0.35, 0, 0.1, -1.7);
  cube(g, head, 0.9, 0.15, 0.8, 0, 0, 1.4);
  const wings = [-1, 1].map((sx) => {
    const w = new THREE.Group();
    w.position.set(sx * 0.4, 0.1, 0);
    cube(w, body, 3, 0.12, 1.2, sx * 1.5, 0, 0);
    cube(w, 0x2a1a10, 0.8, 0.1, 1.0, sx * 3.2, 0, 0.1);
    g.add(w);
    return w;
  });
  g.userData.w = wings;
  return g;
}

function makeShip(sail, { cross = false, oars = false } = {}) {
  const g = new THREE.Group();
  const WOOD = 0x6a4424;
  cube(g, WOOD, 2.2, 1.2, 7, 0, 0.3, 0);
  cube(g, 0x8a6a3a, 2, 0.2, 6.6, 0, 0.95, 0);
  cube(g, WOOD, 2.2, 1, 1.6, 0, 1.4, 2.6);
  cube(g, WOOD, 1.4, 0.8, 1.2, 0, 0.9, -3.8);
  for (const z of [-1.5, 1]) {
    cube(g, 0x5a3a20, 0.25, 7, 0.25, 0, 4.2, z);
    cube(g, sail, 3.2, 2.6, 0.1, 0, 4.4, z - 0.2);
    cube(g, sail, 2.4, 1.6, 0.1, 0, 6.6, z - 0.2);
    if (cross) {
      cube(g, 0xd8252a, 0.8, 0.22, 0.12, 0, 4.4, z - 0.27);
      cube(g, 0xd8252a, 0.22, 0.8, 0.12, 0, 4.4, z - 0.27);
    }
  }
  cube(g, sail === 0xd8252a ? 0xf4d23a : 0xd8252a, 0.8, 0.4, 0.05, 0.4, 7.8, 1);
  if (oars) for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) cube(g, 0x8a6a3a, 1.6, 0.1, 0.15, sx * 1.6, 0.2, -2 + k).rotation.z = sx * 0.4;
  return g;
}

function makeDragonHead(g) {
  const R = 0xd8252a;
  const Y = 0xf4c020;
  cube(g, R, 1.4, 1.2, 1.6, 0, 0, 0);
  cube(g, R, 1.0, 0.7, 0.9, 0, -0.1, -1.1);
  cube(g, 0xffffff, 0.9, 0.15, 0.2, 0, -0.45, -1.4);
  for (const sx of [-1, 1]) {
    cube(g, 0xffffff, 0.3, 0.3, 0.1, sx * 0.4, 0.3, -0.82);
    cube(g, 0x1a1a1a, 0.15, 0.15, 0.05, sx * 0.4, 0.3, -0.88);
    cube(g, Y, 0.15, 0.8, 0.15, sx * 0.45, 0.9, 0.3).rotation.x = 0.5;
    cube(g, Y, 1.4, 0.06, 0.06, sx * 0.9, -0.2, -1.3).rotation.y = sx * 0.4;
  }
  cube(g, 0x6a4a2e, 0.12, 1.3, 0.12, 0, -1.0, 0);
}

// Что прячется при охоте
const ITEM = {
  star(g) {
    cube(g, 0xf6c944, 1.1, 1.1, 0.25, 0, 0, 0);
    cube(g, 0xf6c944, 1.1, 1.1, 0.25, 0, 0, 0).rotation.z = Math.PI / 4;
    cube(g, 0xfff3a0, 0.5, 0.5, 0.32, 0, 0, 0);
  },
  egg(g) {
    const c = pick([0xf07ab8, 0x6ab0f0, 0xf4d23a, 0x8ad08a, 0xc08af0]);
    cube(g, c, 0.7, 0.95, 0.7, 0, 0, 0);
    cube(g, 0xffffff, 0.72, 0.18, 0.72, 0, 0.1, 0);
    cube(g, c, 0.5, 0.2, 0.5, 0, 0.55, 0);
  },
  gem(g) {
    cube(g, pick([0x3ad0e0, 0xe0304a, 0x40d070, 0xc070f0]), 0.8, 0.8, 0.8, 0, 0, 0).rotation.set(Math.PI / 4, 0, Math.PI / 4);
  },
  painting(g) {
    cube(g, 0xd4a020, 1.3, 1.0, 0.12, 0, 0, 0);
    cube(g, pick([0x3a6fc0, 0x4fa05a, 0xd8553a]), 1.0, 0.7, 0.14, 0, 0, 0);
    cube(g, 0xf6dcc0, 0.3, 0.35, 0.16, 0, 0.05, 0);
  },
  fruit(g) {
    cube(g, 0xc8a060, 0.7, 0.9, 0.7, 0, 0, 0);
    cube(g, 0x5a3a20, 0.12, 0.3, 0.12, 0, 0.55, 0);
  },
  lotus(g) {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      cube(g, 0xf7a8c8, 0.3, 0.2, 0.6, Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35).rotation.y = -a + Math.PI / 2;
    }
    cube(g, 0xf4d23a, 0.3, 0.3, 0.3, 0, 0.1, 0);
    cube(g, 0x3a8a6a, 1.0, 0.08, 1.0, 0, -0.15, 0);
  },
};

let noteTex = null;
function noteTexture() {
  if (noteTex) return noteTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  g.font = 'bold 54px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 5;
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  g.strokeText('♪', 32, 34);
  g.fillStyle = '#fff';
  g.fillText('♪', 32, 34);
  noteTex = new THREE.CanvasTexture(cv);
  return noteTex;
}

// hooks: fx, sfx, say, camera, gold(n), save, store(), focus(point, r, sec), lift(island), fling(point, vx, vz, vy)
export function createWonders(scene, terrain, hooks) {
  const { fx, sfx, say } = hooks;
  const state = new Map(); // остров → { act, cool }
  for (const isl of terrain.islands) {
    const act = isl.landmark && ACTS[isl.landmark.id];
    if (act) state.set(isl, { act, cool: 0 });
  }
  const running = [];
  let current = null;

  const partOf = (isl, key) => terrain.actors.find((a) => a.island === isl && a.group.userData[key])?.group ?? null;
  const partsOf = (isl, key) => terrain.actors.filter((a) => a.island === isl && a.group.userData[key]).map((a) => a.group);
  // точка у чуда на стороне камеры — там, где видно
  const facing = (c, off) => {
    const cam = hooks.camera.position;
    const dx = cam.x - c.x;
    const dz = cam.z - c.z;
    const d = Math.hypot(dx, dz) || 1;
    return { dx: dx / d, dz: dz / d, x: c.x + (dx / d) * off, z: c.z + (dz / d) * off };
  };

  // проиграть мелодию; вернёт её длину в секундах
  function play(list) {
    let end = 0;
    for (const n of list) {
      if (n.k === 'bell') sfx.bell(n.f, n.t, 0.2 * n.v);
      else if (n.k === 'chime') sfx.chime(n.f, n.t, 0.18 * n.v);
      else if (n.k === 'note') sfx.note(n.f, Math.max(0.12, n.d * 0.95), n.t, 0.16 * n.v);
      else sfx[n.k]?.(n.t, n.v ?? 1);
      end = Math.max(end, n.t + (n.k === 'bell' || n.k === 'gong' ? 1.2 : n.d ?? 0.3));
    }
    duckMusic(end + 0.8); // фоновая музыка не мешает мелодии чуда
    return end;
  }

  function makeEffect(c) {
    const e = { c, t: 0, dur: 6, objs: [], floaters: [], acc: {}, tick: null, end: null };
    e.add = (o) => {
      scene.add(o);
      e.objs.push(o);
      return o;
    };
    e.float = (o, v) => {
      e.add(o);
      o.userData.v = v;
      e.floaters.push(o);
      return o;
    };
    // вызывать fn раз в period секунд — чтобы частиц не было слишком много
    e.every = (key, period, dt, fn) => {
      e.acc[key] = (e.acc[key] ?? 0) + dt;
      while (e.acc[key] >= period) {
        e.acc[key] -= period;
        fn();
      }
    };
    return e;
  }

  function floatNote(e, x, y, z) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTexture(), color: pick(PALETTE), transparent: true, depthWrite: false }));
    s.scale.set(1.7, 1.7, 1);
    s.position.set(x, y, z);
    e.float(s, { vx: rnd(0.8), vy: 2.4, vz: rnd(0.8), life: 2.6, fade: 1 });
  }

  const EFFECTS = {
    // мелодия (колокола, оркестр, барабаны) и ноты, взлетающие над чудом
    music(e, o, c) {
      const list = TUNES[o.tune]();
      e.dur = play(list) + 0.3;
      const y = c.base + (c.top - c.base) * (o.h ?? 0.75);
      const r = o.r ?? 2.5;
      let i = 0;
      e.tick = () => {
        while (i < list.length && list[i].t <= e.t) {
          if (list[i].say) say(list[i].say, 0.9);
          i++;
          if (Math.random() < 0.75) floatNote(e, c.x + rnd(r), y, c.z + rnd(r));
        }
      };
    },

    // салют: ракеты взлетают с площади и рассыпаются над чудом
    fireworks(e, o, c) {
      e.dur = 7;
      const shells = [];
      let next = 0;
      e.tick = (dt) => {
        if ((next -= dt) <= 0 && e.t < e.dur - 1.6) {
          next = 0.35 + Math.random() * 0.4;
          // стартуют с середины чуда и рвутся у его верхушки — так салют целиком в кадре
          shells.push({ x: c.x + rnd(c.size * 0.6), y: c.base + (c.top - c.base) * 0.55, z: c.z + rnd(c.size * 0.6), vy: 18 + Math.random() * 5, fuse: 0.6 + Math.random() * 0.4, color: pick(PALETTE) });
          sfx.whoosh();
        }
        for (const s of shells) {
          if (s.fuse <= 0) continue;
          s.fuse -= dt;
          s.y += s.vy * dt;
          fx.burst(0xfff3c0, s, 1, { speed: 0.3, up: -2, size: 0.4, life: 0.3, y: 0, gravity: 0 });
          if (s.fuse <= 0) {
            fx.burst(s.color, s, 40, { speed: 14, up: 2, size: 1.1, life: 1.4, y: 0, gravity: 5 });
            fx.burst(0xffffff, s, 10, { speed: 7, up: 1, size: 0.7, life: 0.8, y: 0, gravity: 3 });
            // яркая вспышка — видно даже издалека
            const flash = glow(scene, s.color, 14, s.x, s.y, s.z, 0.9);
            scene.remove(flash);
            e.float(flash, { vx: 0, vy: 0, vz: 0, life: 0.7, fade: 0.7 });
            sfx.pop();
          }
        }
      };
    },

    // огоньки бегут по всему чуду снизу доверху
    sparkle(e, o, c) {
      e.dur = 8;
      sfx.magic();
      e.tick = (dt) => {
        e.every('s', 0.03, dt, () => {
          const f = Math.random();
          const r = c.size * 0.6 * (1 - f * 0.8) * Math.sqrt(Math.random());
          const a = Math.random() * TAU;
          fx.burst(Math.random() < 0.7 ? 0xffffff : 0xffe08a, { x: c.x + Math.cos(a) * r, y: c.base + (c.top - c.base) * f, z: c.z + Math.sin(a) * r }, 1, { speed: 0.2, up: 0, size: 0.7, life: 0.35, y: 0, gravity: 0 });
        });
        e.every('m', 2.5, dt, () => sfx.magic());
      };
    },

    launch(e, o, c) {
      e.dur = 12;
      const r = c.part('launch');
      if (r && !r.userData.flying && !r.userData.gone) r.userData.go = true;
    },

    // лифт в стеклянной кабине на самую макушку, вниз — на парашюте
    lift(e, o, c) {
      e.dur = 5;
      hooks.lift(c.isl);
    },

    // крутится быстрее: мельница, колесо обозрения
    spin(e, o, c) {
      e.dur = 8;
      const g = c.part('spin');
      if (!g) return;
      const base = g.userData.spin;
      sfx.whoosh();
      e.tick = (dt) => {
        g.userData.spin = base * (1 + (o.boost ?? 6) * Math.min(1, e.t, e.dur - e.t));
        e.every('w', 1.2, dt, () => sfx.whoosh());
      };
      e.end = () => (g.userData.spin = base);
    },

    // разводной мост: пролёты поднимаются и опускаются
    raise(e, o, c) {
      e.dur = 9;
      const parts = partsOf(c.isl, 'bascule');
      sfx.whistle();
      e.tick = () => {
        const k = smooth(0.5, 3, e.t) - smooth(6, 8.5, e.t);
        for (const g of parts) g.rotation.z = g.userData.bascule * k * 1.1;
        if (e.t > 3 && e.t < 6 && Math.random() < 0.02) sfx.whistle();
      };
      e.end = () => parts.forEach((g) => (g.rotation.z = 0));
    },

    // радуга над водопадом, лицом к камере
    rainbow(e, o, c) {
      e.dur = 10;
      sfx.magic();
      const p = c.part('mist')?.position ?? new THREE.Vector3(c.x, c.base, c.z);
      const g = e.add(new THREE.Group());
      g.position.set(p.x, p.y - 1, p.z);
      const cam = hooks.camera.position;
      g.rotation.y = Math.atan2(cam.x - p.x, cam.z - p.z);
      const mats = RAINBOW.map((col) => own(new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })));
      const R0 = c.size + 4;
      RAINBOW.forEach((col, b) => {
        const R = R0 - b * 0.9;
        for (let s = 0; s <= 20; s++) {
          const a = (s / 20) * Math.PI;
          const m = new THREE.Mesh(BOX, mats[b]);
          m.scale.set((R * Math.PI) / 20 + 0.3, 0.9, 0.3);
          m.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
          m.rotation.z = a + Math.PI / 2;
          g.add(m);
        }
      });
      e.tick = () => {
        const k = Math.min(1, e.t / 1.5, (e.dur - e.t) / 1.5);
        for (const m of mats) m.opacity = 0.55 * k;
      };
    },

    // извержение: лава, камни и дым
    erupt(e, o, c) {
      e.dur = 7;
      sfx.rumble();
      const p = c.part('smoke')?.position ?? new THREE.Vector3(c.x, c.top, c.z);
      e.tick = (dt) => {
        e.every('r', 3, dt, () => sfx.rumble());
        e.every('l', 0.04, dt, () => {
          fx.burst(pick([0xff6a1a, 0xffb030, 0xe0302a]), p, 2, { speed: 7, up: 20, size: 1.3, life: 1.8, y: 0, gravity: 14 });
          if (Math.random() < 0.3) fx.burst(0x4a4440, p, 1, { speed: 2, up: 6, size: 3, life: 3, y: 1, gravity: -1 });
        });
      };
    },

    geyser(e, o, c) {
      e.dur = 3.5;
      const g = c.part('geyser');
      if (g) g.userData.clock = 0; // сам гейзер тоже просыпается
      const p = g?.position ?? new THREE.Vector3(c.x, c.base, c.z);
      sfx.splash();
      e.tick = (dt) => e.every('g', 0.04, dt, () => fx.burst(Math.random() < 0.5 ? 0xe6f5ff : 0xbfe8f5, p, 2, { speed: 2.5, up: 28, size: 1.2, life: 1.8, y: 0, gravity: 14 }));
    },

    fountain(e, o, c) {
      e.dur = 6;
      const g = c.part('fountain');
      const p = g?.position ?? new THREE.Vector3(c.x, c.top, c.z);
      const [vx, vz] = g?.userData.fountain ?? [0, -7];
      sfx.splash();
      e.tick = (dt) => e.every('f', 0.02, dt, () => fx.burst(0x9fd8f0, p, 1, { speed: 1, up: 4 + (vx || vz ? 0 : 10), size: 0.6, life: 1.2, y: 0, gravity: 12, vx: vx * 1.7, vz: vz * 1.7 }));
    },

    // шоу фонтанов: кольцо струй пляшет волнами под музыку
    fountainshow(e, o, c) {
      e.dur = play(TUNES[o.tune ?? 'ode']()) + 1;
      const R = c.size + 1.5;
      const n = 10;
      const COLORS = [0x9fd8f0, 0xf7a8c8, 0xffe08a, 0xa8f0c8];
      e.tick = (dt) => e.every('j', 0.07, dt, () => {
        const wave = Math.floor(e.t / 2) % 4;
        for (let k = 0; k < n; k++) {
          const a = (k / n) * TAU;
          const h = 9 + 7 * Math.sin(e.t * 3 + k * (wave % 2 ? 0.6 : 0));
          fx.burst(COLORS[(wave + k) % 4], { x: c.x + Math.cos(a) * R, y: c.base, z: c.z + Math.sin(a) * R }, 1, { speed: 0.5, up: h, size: 0.5, life: 1.4, y: 0, gravity: 18 });
        }
      });
    },

    // Несси выпрыгивает из озера
    nessie(e, o, c) {
      e.dur = 4;
      const g = c.part('swim');
      if (!g) return;
      sfx.splash();
      e.tick = (dt) => {
        g.position.y += Math.sin(Math.PI * Math.min(1, e.t / 3)) * 3.5;
        if (e.t > 3 && !e.down) {
          e.down = true;
          sfx.splash();
          fx.burst(0xe6f5ff, g.position, 16, { speed: 7, up: 7, size: 0.8, life: 0.8, y: 0 });
        }
        e.every('h', 0.15, dt, () => fx.burst(0xf07ab8, g.position, 1, { speed: 1, up: 3, size: 0.5, life: 1, y: 4, gravity: -1 }));
      };
      fx.burst(0xe6f5ff, g.position, 16, { speed: 7, up: 7, size: 0.8, life: 0.8, y: 0 });
    },

    // тайный ход в пирамиде: плита уходит в песок, выходит мумия и машет
    secret(e, o, c) {
      e.dur = 8;
      const x = c.x + 14.1;
      const z = c.z - 5;
      const y = c.base;
      const door = e.add(new THREE.Group());
      cube(door, 0x1a140c, 0.2, 2.4, 2.0, x + 0.02, y + 1.2, z);
      for (const s of [-1, 1]) cube(door, 0xc6a456, 0.5, 2.8, 0.5, x + 0.2, y + 1.4, z + s * 1.25);
      cube(door, 0xeee2c0, 0.6, 0.5, 3.0, x + 0.2, y + 3.0, z);
      glow(door, 0xffd27a, 3.5, x + 0.3, y + 1.2, z, 0.5);
      const slab = e.add(cube(scene, 0xcfae5f, 0.4, 2.4, 2.0, x + 0.3, y + 1.2, z));
      const mummy = e.add(makeMummy());
      mummy.position.set(x - 0.6, y, z);
      mummy.visible = false;
      sfx.rumble();
      e.tick = (dt) => {
        const t = e.t;
        slab.position.y = y + 1.2 - 2.5 * smooth(0, 1.2, t) + 2.5 * smooth(6.6, 7.8, t);
        const out = smooth(1.5, 2.5, t) - smooth(5.4, 6.4, t);
        mummy.position.x = x - 0.6 + out * 2.6;
        mummy.visible = t > 1.3 && t < 6.5;
        mummy.userData.arm.rotation.x = t > 2.5 && t < 5.4 ? -2.4 + Math.sin(t * 9) * 0.4 : 0;
        if (t > 1.2 && !e.opened) {
          e.opened = true;
          sfx.chest();
        }
        if (t > 6.6 && !e.closed) {
          e.closed = true;
          sfx.rumble();
        }
        if (t > 1.3 && t < 6) e.every('c', 0.06, dt, () => fx.burst(0xf6c944, { x: x + 0.6, y: y + 1, z }, 1, { speed: 3, up: 5, size: 0.4, life: 1, y: 0, gravity: 10, vx: 4 }));
      };
    },

    // охота: вокруг чуда спрятаны вещицы — собери все, пока не вышло время
    hunt(e, o, c) {
      const n = o.n ?? 6;
      e.dur = 45;
      if (o.tune) play(TUNES[o.tune]());
      const cells = c.isl.cells.map((cl) => terrain.cellPos(cl)).filter((p) => {
        const d = Math.hypot(p.x - c.x, p.z - c.z);
        return d > c.size * 0.5 && d < c.size + 6;
      });
      const spots = [];
      for (let tries = 0; spots.length < n && tries < 400 && cells.length; tries++) {
        const p = pick(cells);
        if (spots.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > 4)) spots.push(p);
      }
      const items = spots.map((p) => {
        const g = new THREE.Group();
        ITEM[o.item](g);
        glow(g, 0xffe08a, 2.6, 0, 0.2, 0, 0.45);
        g.position.set(p.x, p.y + 1, p.z);
        e.add(g);
        return { g, got: false, y: p.y + 1 };
      });
      let got = 0;
      e.tick = (dt, _e, cap) => {
        items.forEach((it, i) => {
          if (it.got) return;
          it.g.rotation.y += dt * 2;
          it.g.position.y = it.y + Math.sin(e.t * 3 + i) * 0.25;
          if (cap && Math.hypot(cap.x - it.g.position.x, cap.z - it.g.position.z) < 2 && Math.abs(cap.y + 1 - it.g.position.y) < 3) {
            it.got = true;
            it.g.visible = false;
            got++;
            fx.burst(0xf6c944, it.g.position, 10, { speed: 5, up: 4, size: 0.4 });
            sfx.coin();
            hooks.gold(2);
            if (got < items.length) say(`${o.icon} ${got} из ${items.length}! +2`, 1.5);
          }
        });
        if (items.length && got === items.length && !e.won) {
          e.won = true;
          sfx.medal();
          hooks.gold(8);
          for (const it of items) fx.burst(pick(PALETTE), it.g.position, 12, { speed: 6, up: 8, size: 0.5, life: 1.4 });
          say(`${o.icon} Все ${items.length} найдены! +8`, 3);
          e.dur = e.t;
        }
      };
      e.end = () => {
        if (!e.won) say(`Время вышло — найдено ${got} из ${items.length}. Попробуй ещё раз!`, 3);
      };
    },

    // выстрел капитаном из пушки: бабах, дым, конфетти — и полёт с парашютом
    launchcap(e, o, c) {
      e.dur = 3;
      const [ax, ay, az] = o.at;
      const p = { x: c.x + ax, y: c.base + ay, z: c.z + az };
      sfx.cannon();
      sfx.thud();
      fx.burst(0xb4b4b4, p, 14, { speed: 5, up: 3, size: 2, life: 1.5, y: 0, gravity: -1 });
      const d = Math.hypot(ax, az) || 1;
      hooks.fling(p, (-ax / d) * 6, (-az / d) * 6, 30);
      e.tick = (dt) => {
        if (e.t < 1) e.every('c', 0.04, dt, () => fx.burst(pick(PALETTE), p, 3, { speed: 4, up: 8, size: 0.5, life: 2, y: 0, gravity: 6 }));
      };
    },

    // опыт Галилея: тяжёлый и лёгкий шар падают с башни одновременно
    galileo(e, o, c) {
      e.dur = 6;
      const f = facing(c, o.off ?? 4.5);
      const tx = -f.dz;
      const tz = f.dx;
      const top = c.top - 1.5;
      const ground = c.base + 0.5;
      const balls = [0x3a3a40, 0xb07a4a].map((col, i) => {
        const g = new THREE.Group();
        cube(g, col, 1, 1, 1, 0, 0, 0);
        cube(g, col, 0.8, 1.15, 0.8, 0, 0, 0);
        cube(g, col, 1.15, 0.8, 0.8, 0, 0, 0);
        const sd = i ? 0.9 : -0.9;
        g.position.set(f.x + tx * sd, top, f.z + tz * sd);
        e.add(g);
        return { g, vy: 0 };
      });
      let landed = false;
      e.tick = (dt) => {
        if (e.t < 1.5) return; // пауза: «какой упадёт первым?»
        for (const b of balls) {
          b.vy -= 20 * dt;
          b.g.position.y += b.vy * dt;
          if (b.g.position.y < ground) {
            b.g.position.y = ground;
            b.vy = Math.abs(b.vy) > 3 ? -b.vy * 0.35 : 0;
            if (!landed) {
              landed = true;
              sfx.thud();
              for (const bb of balls) fx.burst(0xd8c890, bb.g.position, 10, { speed: 5, up: 3, size: 0.6, life: 0.8, y: 0 });
              say('Бух! Оба шара упали одновременно — как у Галилея! 🎓', 4);
            }
          }
        }
      };
    },

    // хоровод матрёшек вокруг храма под «Коробейников»
    matryoshka(e, o, c) {
      e.dur = play(TUNES.korobeiniki()) + 0.5;
      const R = c.size + 2.5;
      const dolls = [0xd8252a, 0x3a6fc0, 0xd8252a, 0x2a9a8a, 0xf0a020, 0xd8252a, 0x8a4fc0].map((col) => e.add(makeDoll(col)));
      e.tick = () => dolls.forEach((g, i) => {
        const a = e.t * 0.6 + (i / dolls.length) * TAU;
        g.position.set(c.x + Math.cos(a) * R, c.base + Math.abs(Math.sin(e.t * 6 + i)) * 0.6, c.z + Math.sin(a) * R);
        g.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)) + Math.sin(e.t * 6 + i) * 0.3;
      });
    },

    // балерина кружится перед театром
    ballerina(e, o, c) {
      e.dur = 10;
      const f = facing(c, c.size + 1.5);
      const g = e.add(makeBallerina());
      g.position.set(f.x, c.base, f.z);
      e.tick = () => {
        g.rotation.y = e.t * 5;
        g.position.y = c.base + Math.abs(Math.sin(e.t * 2.5)) * 0.5;
      };
    },

    // велогонка по кругу
    racers(e, o, c) {
      e.dur = 12;
      const R = c.size + 2;
      const riders = [0xf4d23a, 0xe0302a, 0x3a6fc0, 0xf4f4f4, 0x4fb05a].map((col, i) => ({ g: e.add(makeCyclist(col)), a: -i * 0.35, v: 0.9 - i * 0.04 }));
      sfx.cheer();
      sfx.bikebell(0.3);
      e.tick = (dt) => {
        for (const r of riders) {
          r.a += r.v * dt;
          r.g.position.set(c.x + Math.cos(r.a) * R, c.base, c.z + Math.sin(r.a) * R);
          r.g.rotation.y = along(r.a);
        }
        e.every('b', 2.5, dt, () => sfx.bikebell());
      };
    },

    // снегопад над замком
    snow(e, o, c) {
      e.dur = 10;
      play(TUNES.mystic());
      e.tick = (dt) => e.every('s', 0.025, dt, () => {
        const a = Math.random() * TAU;
        const r = (c.size + 6) * Math.sqrt(Math.random());
        fx.burst(0xffffff, { x: c.x + Math.cos(a) * r, y: c.base + 3 + Math.random() * (c.top - c.base + 3), z: c.z + Math.sin(a) * r }, 1, { speed: 0.6, up: 0, size: 0.35, life: 4, y: 0, gravity: 1.2 });
      });
    },

    // электроны кружат по орбитам вокруг Атомиума
    electrons(e, o, c) {
      e.dur = 10;
      sfx.magic();
      const center = new THREE.Vector3(c.x, c.base + (c.top - c.base) * 0.55, c.z);
      const R = c.size + 1;
      const els = [];
      [[0.3, 0], [1.2, 1.0], [-0.9, 2.1]].forEach(([tilt, yaw], i) => {
        const orbit = e.add(new THREE.Group());
        orbit.position.copy(center);
        orbit.rotation.set(tilt, yaw, 0);
        for (let k = 0; k < 24; k++) {
          const a = (k / 24) * TAU;
          cube(orbit, 0x9ad8ff, 0.2, 0.2, 0.2, Math.cos(a) * R, 0, Math.sin(a) * R);
        }
        for (let k = 0; k < 2; k++) {
          const g = new THREE.Group();
          cube(g, 0x7ad0ff, 0.8, 0.8, 0.8);
          glow(g, 0x5ab8ff, 4, 0, 0, 0, 0.7);
          orbit.add(g);
          els.push({ g, a: k * Math.PI + i, v: 1.6 + i * 0.3 });
        }
      });
      e.tick = (dt) => {
        for (const el of els) {
          el.a += el.v * dt;
          el.g.position.set(Math.cos(el.a) * R, 0, Math.sin(el.a) * R);
        }
        e.every('m', 3, dt, () => sfx.magic());
      };
    },

    // шарики (или большие аэростаты) поднимаются в небо
    balloons(e, o, c) {
      e.dur = 14;
      play(TUNES.fanfare());
      const n = o.big ? 6 : 24;
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group();
        const col = pick(PALETTE.slice(0, 7));
        if (o.big) {
          const col2 = pick(PALETTE.slice(0, 7));
          [2.2, 3, 3.3, 3, 2.2, 1.2].forEach((w, k) => cube(g, k % 2 ? col : col2, w, 1, w, 0, 3.5 + k, 0));
          for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) cube(g, 0x6a4a2e, 0.06, 1.8, 0.06, x, 1.9, z);
          cube(g, 0x8a6a3a, 1.4, 0.9, 1.4, 0, 0.45, 0);
        } else {
          cube(g, col, 0.9, 1.1, 0.9, 0, 1.6, 0);
          cube(g, col, 0.25, 0.2, 0.25, 0, 1.0, 0);
          cube(g, 0xeeeeee, 0.04, 1, 0.04, 0, 0.45, 0);
        }
        const a = Math.random() * TAU;
        const r = c.size * (0.5 + Math.random() * 0.6) + (o.big ? 4 : 0);
        g.position.set(c.x + Math.cos(a) * r, c.base, c.z + Math.sin(a) * r);
        e.float(g, { vx: rnd(o.big ? 0.8 : 1.2), vy: o.big ? 1.6 + Math.random() : 2.5 + Math.random() * 2, vz: rnd(o.big ? 0.8 : 1.2), life: o.big ? 13 : 9, delay: i * (o.big ? 1 : 0.15) });
      }
    },

    // вертолёт прилетает, кружит над верхушкой и улетает
    heli(e, o, c) {
      e.dur = 12;
      const g = e.add(makeHeli());
      const R = c.size + 4;
      const H = c.top + 3;
      e.tick = (dt) => {
        g.userData.rotor.rotation.y += dt * 25;
        const k = Math.min(1, e.t / 3, (e.dur - e.t) / 3);
        const a = e.t * 0.5;
        const r = R + (1 - k) * 40;
        g.position.set(c.x + Math.cos(a) * r, H - (1 - k) * 5 + Math.sin(e.t * 2) * 0.3, c.z + Math.sin(a) * r);
        g.rotation.y = along(a);
        e.every('w', 0.22, dt, () => sfx.drum(0, 0.25));
      };
    },

    // орёл (или кондор) парит кругами над чудом
    eagle(e, o, c) {
      e.dur = 11;
      const g = e.add(makeBird(o.color ?? 0x5a3a20, o.head ?? 0xf4f4f4));
      const R = c.size + 3;
      const H = c.top + 5;
      sfx.screech();
      e.tick = (dt) => {
        const k = Math.min(1, e.t / 2, (e.dur - e.t) / 2);
        const a = e.t * 0.7;
        g.position.set(c.x + Math.cos(a) * (R + (1 - k) * 30), H + (1 - k) * 10, c.z + Math.sin(a) * (R + (1 - k) * 30));
        g.rotation.set(0, along(a), -0.35);
        const f = Math.sin(e.t * 4) * (Math.sin(e.t * 0.9) > 0.5 ? 0.35 : 0.06);
        g.userData.w[0].rotation.z = f;
        g.userData.w[1].rotation.z = -f;
        e.every('s', 3.5, dt, () => sfx.screech());
      };
    },

    // звери идут парадом вокруг чуда
    parade(e, o, c) {
      e.dur = 14;
      if (o.tune) play(TUNES[o.tune]());
      const R = c.size + 2;
      const walkers = o.kinds.map((kind, i) => ({ g: e.add(buildAnimal(kind)), a: -i * 0.45 }));
      e.tick = (dt) => walkers.forEach((w, i) => {
        w.a += dt * (o.speed ?? 0.3);
        const hop = o.hop ? Math.abs(Math.sin(e.t * 5 + i)) * 1.2 : Math.abs(Math.sin(e.t * 8 + i)) * 0.12;
        w.g.position.set(c.x + Math.cos(w.a) * R, c.base + hop, c.z + Math.sin(w.a) * R);
        w.g.rotation.set(0, along(w.a), o.waddle ? Math.sin(e.t * 8 + i) * 0.15 : 0);
      });
    },

    // воздушные змеи парят над стеной
    kites(e, o, c) {
      e.dur = 12;
      play(TUNES.mystic());
      const kites = [];
      for (let i = 0; i < 6; i++) {
        const g = new THREE.Group();
        cube(g, PALETTE[i % 7], 1.8, 1.8, 0.1, 0, 0, 0).rotation.z = Math.PI / 4;
        cube(g, 0xffffff, 0.1, 2.4, 0.12, 0, 0, 0).rotation.z = Math.PI / 4;
        g.userData.tail = [];
        for (let k = 0; k < 5; k++) g.userData.tail.push(cube(g, PALETTE[(i + k) % 7], 0.35, 0.25, 0.1, 0, -1.6 - k * 0.6, 0));
        e.add(g);
        kites.push({ g, a: (i / 6) * TAU, h: c.top + 6 + (i % 3) * 3 });
      }
      const cam = hooks.camera.position;
      e.tick = () => kites.forEach((k, i) => {
        const r = c.size * 0.7;
        const rise = Math.min(1, e.t / 3);
        k.g.position.set(c.x + Math.cos(k.a + e.t * 0.1) * r, c.base + (k.h - c.base) * rise + Math.sin(e.t * 1.5 + i) * 1.2, c.z + Math.sin(k.a + e.t * 0.1) * r);
        k.g.lookAt(cam.x, k.g.position.y, cam.z);
        k.g.rotateZ(Math.sin(e.t * 2 + i) * 0.25);
        k.g.userData.tail.forEach((t, j) => (t.position.x = Math.sin(e.t * 4 + j + i) * 0.3 * j));
      });
    },

    // китайский дракон извивается вокруг дворца под барабаны
    dragon(e, o, c) {
      const drums = TUNES.drums();
      play(drums);
      play(drums.map((n) => ({ ...n, t: n.t + 6.4 })));
      sfx.gong(0);
      e.dur = 12.5;
      const R = c.size + 2;
      const segs = [];
      for (let i = 0; i < 14; i++) {
        const g = new THREE.Group();
        if (i === 0) makeDragonHead(g);
        else {
          cube(g, i % 2 ? 0xd8252a : 0xf4c020, 1.2, 1.0, 1.1, 0, 0, 0);
          cube(g, 0xf4c020, 0.3, 0.5, 0.9, 0, 0.7, 0);
          cube(g, 0x6a4a2e, 0.12, 1.3, 0.12, 0, -1.0, 0);
        }
        segs.push(e.add(g));
      }
      e.tick = () => segs.forEach((g, i) => {
        const a = e.t * 0.45 - i * 0.1;
        const rr = R + Math.sin(e.t * 3 - i * 0.6) * 0.8;
        g.position.set(c.x + Math.cos(a) * rr, c.base + 2 + Math.sin(e.t * 5 - i * 0.7) * 0.7, c.z + Math.sin(a) * rr);
        g.rotation.y = along(a);
      });
    },

    // парусник проплывает мимо острова — на стороне камеры
    sailship(e, o, c) {
      e.dur = 16;
      if (o.tune) play(TUNES[o.tune]());
      const g = e.add(makeShip(o.sail, o));
      // полукругом вокруг острова по той стороне, откуда смотрит камера; камера — сверху
      const f = facing(c, 1);
      const R = c.isl.r + 10;
      const a0 = Math.atan2(f.dz, f.dx) - 1.2;
      e.tick = () => {
        const a = a0 + (e.t / e.dur) * 2.4;
        g.position.set(c.x + Math.cos(a) * R, SEA_Y + 0.2 + Math.sin(e.t * 1.5) * 0.15, c.z + Math.sin(a) * R);
        g.rotation.set(0, along(a), Math.sin(e.t * 1.2) * 0.05);
      };
      hooks.focus({ x: c.x, y: SEA_Y + 4, z: c.z }, R + 22, 14, 0.7);
    },

    // выпускники подбрасывают шапочки
    gradcaps(e, o, c) {
      e.dur = 5;
      sfx.cheer();
      play(TUNES.fanfare());
      for (let i = 0; i < 22; i++) {
        const g = new THREE.Group();
        cube(g, 0x1a1a1a, 1.0, 0.1, 1.0, 0, 0.3, 0);
        cube(g, 0x1a1a1a, 0.6, 0.35, 0.6, 0, 0.08, 0);
        cube(g, 0xf4c020, 0.06, 0.5, 0.06, 0.45, 0.1, 0.45);
        const a = Math.random() * TAU;
        const r = c.size * (0.6 + Math.random() * 0.5);
        g.position.set(c.x + Math.cos(a) * r, c.base + 1.5, c.z + Math.sin(a) * r);
        e.float(g, { vx: rnd(1.5), vy: 11 + Math.random() * 5, vz: rnd(1.5), g: 12, life: 2.3, spin: 6 + Math.random() * 6, tumble: 4 });
      }
    },

    // стая птиц взлетает с верхушки и кружит
    doves(e, o, c) {
      e.dur = 8;
      sfx.whoosh();
      const col = o.color ?? 0xf4f4f4;
      for (let i = 0; i < 12; i++) {
        const b = new THREE.Group();
        cube(b, col, 0.4, 0.3, 0.8, 0, 0, 0);
        b.userData.w = [cube(b, col, 1.1, 0.06, 0.45, -0.6, 0.05, 0), cube(b, col, 1.1, 0.06, 0.45, 0.6, 0.05, 0)];
        b.position.set(c.x + rnd(1), c.top - 1, c.z + rnd(1));
        const a = (i / 12) * TAU;
        e.float(b, { vx: Math.cos(a) * 6, vy: 2.5 + Math.random() * 2, vz: Math.sin(a) * 6, life: 7 + Math.random(), flap: 14 + Math.random() * 4, turn: 0.7, delay: i * 0.08 });
      }
    },

    // бумажные фонарики поднимаются в небо
    lanterns(e, o, c) {
      e.dur = 10;
      if (o.gong) sfx.gong(0);
      else play(TUNES.mystic());
      for (let i = 0; i < 22; i++) {
        const g = new THREE.Group();
        cube(g, pick([0xf08a24, 0xe0302a, 0xf4d23a]), 0.55, 0.65, 0.55, 0, 0, 0);
        glow(g, 0xffb040, 2.6, 0, 0, 0, 0.5);
        const a = Math.random() * TAU;
        const r = c.size * (0.4 + Math.random() * 0.7);
        g.position.set(c.x + Math.cos(a) * r, c.base + 1 + Math.random() * 2, c.z + Math.sin(a) * r);
        e.float(g, { vx: rnd(0.6), vy: 1.4 + Math.random() * 1.2, vz: rnd(0.6), life: 9 + Math.random() * 3, delay: i * 0.25 });
      }
    },

    // полярное сияние: волнистые ленты в небе
    aurora(e, o, c) {
      e.dur = 12;
      play(TUNES.mystic());
      const ribbons = [];
      for (let i = 0; i < 4; i++) {
        const geo = new THREE.PlaneGeometry(70, 16, 24, 1);
        geo.userData.own = true;
        geo.userData.base = geo.attributes.position.array.slice();
        const mat = own(new THREE.MeshBasicMaterial({ color: i % 2 ? 0x5affb0 : 0xb07aff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        const m = e.add(new THREE.Mesh(geo, mat));
        m.position.set(c.x, c.top + 22 + i * 3, c.z - 10 + i * 6);
        m.rotation.x = -0.3;
        ribbons.push(m);
      }
      e.tick = () => {
        const k = Math.min(1, e.t / 2, (e.dur - e.t) / 2);
        ribbons.forEach((m, i) => {
          m.material.opacity = 0.35 * k;
          const p = m.geometry.attributes.position;
          const b = m.geometry.userData.base;
          for (let v = 0; v < p.count; v++) p.array[v * 3 + 2] = b[v * 3 + 2] + Math.sin(b[v * 3] * 0.12 + e.t * 1.5 + i) * 3;
          p.needsUpdate = true;
        });
      };
    },

    // солнечный луч в центр
    sunbeam(e, o, c) {
      e.dur = 8;
      play(TUNES.mystic());
      const x = c.x + (o.at?.[0] ?? 0);
      const z = c.z + (o.at?.[1] ?? 0);
      const mat = own(new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      const m = e.add(new THREE.Mesh(BOX, mat));
      m.scale.set(2.5, 70, 2.5);
      m.position.set(x, c.base + 35, z);
      e.tick = (dt) => {
        mat.opacity = 0.4 * Math.min(1, e.t / 1.5, (e.dur - e.t) / 1.5) * (0.85 + 0.15 * Math.sin(e.t * 6));
        e.every('s', 0.05, dt, () => {
          const a = Math.random() * TAU;
          const r = c.size * 0.8;
          fx.burst(0xffe08a, { x: c.x + Math.cos(a) * r, y: c.base + 0.5, z: c.z + Math.sin(a) * r }, 1, { speed: 0.3, up: 2, size: 0.5, life: 1.2, y: 0, gravity: -1 });
        });
      };
    },

    // выстрел пушки конфетти
    confetti(e, o, c) {
      e.dur = 3;
      sfx.cannon();
      const p = { x: c.x + (o.at?.[0] ?? 0), y: c.base + (o.at?.[1] ?? 3), z: c.z + (o.at?.[2] ?? 0) };
      fx.burst(0xb4b4b4, p, 10, { speed: 4, up: 3, size: 2, life: 1.5, y: 0, gravity: -1 });
      const [vx, vz] = o.dir ?? [0, -10];
      e.tick = (dt) => {
        if (e.t < 1.2) e.every('c', 0.03, dt, () => fx.burst(pick(PALETTE), p, 3, { speed: 4, up: 8, size: 0.5, life: 2.2, y: 0, gravity: 6, vx, vz }));
      };
    },

    // публика ликует: шум трибун и конфетти по кругу
    cheer(e, o, c) {
      e.dur = 5;
      sfx.cheer();
      e.tick = (dt) => {
        if (e.t > 2.2 && !e.again) {
          e.again = true;
          sfx.cheer();
        }
        e.every('c', 0.04, dt, () => {
          const a = Math.random() * TAU;
          const r = c.size * 0.8;
          fx.burst(pick(PALETTE), { x: c.x + Math.cos(a) * r, y: c.top, z: c.z + Math.sin(a) * r }, 2, { speed: 3, up: 6, size: 0.5, life: 2, y: 0, gravity: 5 });
        });
      };
    },

    // лепестки падают с неба
    petals(e, o, c) {
      e.dur = 9;
      if (!o.tune) play(TUNES.mystic());
      e.tick = (dt) => e.every('p', 0.04, dt, () => {
        const a = Math.random() * TAU;
        const r = (c.size + 4) * Math.sqrt(Math.random());
        fx.burst(Math.random() < 0.6 ? 0xf7a8c8 : 0xffd6e6, { x: c.x + Math.cos(a) * r, y: c.base + 4 + Math.random() * (c.top - c.base), z: c.z + Math.sin(a) * r }, 1, { speed: 1, up: 0, size: 0.45, life: 4, y: 0, gravity: 1.2 });
      });
    },

    // луч маяка ходит по кругу
    beam(e, o, c) {
      e.dur = 10;
      sfx.foghorn();
      const p = c.part('fire')?.position ?? new THREE.Vector3(c.x, c.top, c.z);
      const g = e.add(new THREE.Group());
      g.position.copy(p);
      const mat = own(new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      for (const s of [-1, 1]) {
        const m = new THREE.Mesh(BOX, mat);
        m.scale.set(50, 2, 2);
        m.position.x = s * 25.5;
        g.add(m);
      }
      glow(g, 0xfff3a0, 8, 0, 0, 0, 0.6);
      e.tick = (dt) => {
        g.rotation.y += dt * 1.2;
        mat.opacity = 0.5 * Math.min(1, e.t, e.dur - e.t);
      };
    },

    // молния Зевса бьёт в крышу
    lightning(e, o, c) {
      e.dur = 2.5;
      sfx.thunder();
      const mat = own(new THREE.MeshBasicMaterial({ color: 0xf4f8ff, fog: false }));
      const g = e.add(new THREE.Group());
      const a = new THREE.Vector3(c.x + rnd(3), c.top + 45, c.z + rnd(3));
      const b = new THREE.Vector3();
      const d = new THREE.Vector3();
      for (let i = 1; i <= 8; i++) {
        b.set(i === 8 ? c.x : c.x + rnd(3), c.top + 45 - (45 * i) / 8, i === 8 ? c.z : c.z + rnd(3));
        d.subVectors(b, a);
        const m = new THREE.Mesh(BOX, mat);
        m.scale.set(0.5, d.length(), 0.5);
        m.position.addVectors(a, b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(UP, d.normalize());
        g.add(m);
        a.copy(b);
      }
      e.tick = () => {
        g.visible = e.t < 0.25 || (e.t > 0.45 && e.t < 0.6);
        if (e.t > 0.6 && !e.glowed) {
          e.glowed = true;
          fx.burst(0xffe08a, { x: c.x, y: c.top, z: c.z }, 40, { speed: 8, up: 4, size: 0.6, life: 1.2, y: 0, gravity: 2 });
          sfx.magic();
        }
      };
    },

    // туман и гудок ревуна
    fog(e, o, c) {
      e.dur = 7;
      sfx.foghorn();
      e.tick = (dt) => {
        if (e.t > 3 && !e.again) {
          e.again = true;
          sfx.foghorn();
        }
        e.every('f', 0.08, dt, () => {
          const a = Math.random() * TAU;
          const r = c.size + Math.random() * 8;
          fx.burst(0xf4f7fa, { x: c.x + Math.cos(a) * r, y: c.base + Math.random() * (c.top - c.base) * 0.6, z: c.z + Math.sin(a) * r }, 1, { speed: 1.5, up: 0.5, size: 4, life: 3, y: 0, gravity: 0 });
        });
      };
    },
  };

  function near(cap) {
    const isl = terrain.islandAt(cap.x, cap.z);
    const w = isl && state.get(isl);
    current = w && w.cool <= 0 && Math.hypot(cap.x - isl.x, cap.z - isl.z) < isl.landmark.size + 8 ? isl : null;
    return !!current;
  }

  function run() {
    const isl = current;
    if (!isl) return;
    current = null;
    const w = state.get(isl);
    const c = { isl, x: isl.x, z: isl.z, base: isl.baseY, top: isl.top, size: isl.landmark.size, part: (k) => partOf(isl, k) };
    const kinds = [].concat(w.act.fx);
    let longest = 0;
    for (const kind of kinds) {
      const e = makeEffect(c);
      EFFECTS[kind](e, w.act, c);
      running.push(e);
      longest = Math.max(longest, e.dur);
    }
    // камера отъезжает, чтобы было видно и капитана, и эффект (фейерверк высоко над чудом и т.п.)
    const up = kinds.map((k) => FOCUS[k]).find((v) => v != null);
    if (up === 'ground') hooks.focus({ x: c.x, y: c.base + 3, z: c.z }, c.size * 2.2 + 10, Math.min(longest, 12), 0.8);
    else if (up != null) {
      const h = c.top - c.base + up;
      hooks.focus({ x: c.x, y: c.base + h * 0.55, z: c.z }, Math.max(c.size * 2 + 8, h * 0.95), Math.min(longest, 10));
    }
    w.cool = w.act.cool ?? longest + 3;
    const first = !hooks.save.played.includes(isl.landmark.id);
    say(first ? `${w.act.say} +${5 + (w.act.bonus ?? 0)}` : w.act.say, 3);
    if (first) {
      hooks.save.played.push(isl.landmark.id);
      hooks.gold(5 + (w.act.bonus ?? 0));
      hooks.store();
    }
  }

  function cleanup(e) {
    for (const o of e.objs) {
      scene.remove(o);
      o.traverse((m) => {
        const k = glows.indexOf(m);
        if (k >= 0) glows.splice(k, 1);
        if (m.isSprite || m.material?.userData.own) m.material.dispose();
        if (m.geometry?.userData.own) m.geometry.dispose();
      });
    }
  }

  // cap — капитан, когда он на суше (для охоты), иначе null
  function update(dt, cap) {
    for (const w of state.values()) if (w.cool > 0) w.cool -= dt;
    for (let n = running.length - 1; n >= 0; n--) {
      const e = running[n];
      e.t += dt;
      if (e.t <= e.dur) e.tick?.(dt, e, cap);
      let alive = false;
      for (const o of e.floaters) {
        const v = o.userData.v;
        if (v.life <= 0) continue;
        alive = true;
        if (v.delay > 0) {
          v.delay -= dt;
          o.visible = false;
          continue;
        }
        o.visible = true;
        v.life -= dt;
        if (v.turn) {
          const ca = Math.cos(v.turn * dt);
          const sa = Math.sin(v.turn * dt);
          [v.vx, v.vz] = [v.vx * ca - v.vz * sa, v.vx * sa + v.vz * ca];
          o.rotation.y = Math.atan2(-v.vx, -v.vz);
        }
        if (v.g) v.vy -= v.g * dt;
        o.position.x += v.vx * dt;
        o.position.y += v.vy * dt;
        o.position.z += v.vz * dt;
        if (v.spin) o.rotation.y += v.spin * dt;
        if (v.tumble) o.rotation.x += v.tumble * dt;
        if (v.flap) {
          const f = Math.sin(e.t * v.flap) * 0.6;
          o.userData.w[0].rotation.z = -f;
          o.userData.w[1].rotation.z = f;
        }
        if (v.fade) o.material.opacity = Math.min(1, v.life / v.fade);
        if (v.life <= 0) o.visible = false;
      }
      if (e.t > e.dur && !alive) {
        e.end?.();
        cleanup(e);
        running.splice(n, 1);
      }
    }
  }

  return {
    near,
    run,
    update,
    label: () => (current ? state.get(current).act.label : '✨'),
    acts: ACTS,
    running: () => running, // для отладки
  };
}
