import * as THREE from 'three';
import { cube, glow, glows } from './voxel.js';

// Ожившие чудеса: подойди к чуду — появится кнопка «🔔 Куранты», «🚀 Запуск!», «🔦 Тайный ход»…
// В первый раз за это — награда. Эффекты собраны из частиц, звуков и временных фигур.

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

/* ---------- мелодии ---------- */
const N = {
  C3: 131, E3: 165, G3: 196, A3: 220, B3: 247, C4: 262, D4: 294, E4: 330, F4: 349, Fs4: 370, G4: 392, Gs4: 415,
  A4: 440, B4: 494, C5: 523, Cs5: 554, D5: 587, E5: 659, Fs5: 740, G5: 784, A5: 880,
};
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
const TUNES = {
  // вестминстерские четверти и три удара часов
  westminster: () => chain(
    [[N.Gs4, N.Fs4, N.E4, [N.B3, 2], N.E4, N.Gs4, N.Fs4, [N.B3, 2], N.E4, N.Fs4, N.Gs4, [N.E4, 2], N.Gs4, N.E4, N.Fs4, [N.B3, 3]], 0.5, 'bell'],
    [[N.E3, [0, 2], N.E3, [0, 2], N.E3, [0, 2]], 0.55, 'bell', 1.6],
  ),
  kremlin: () => chain(
    [[N.G4, N.E4, N.F4, [N.C4, 2], N.C4, N.F4, N.G4, [N.E4, 3]], 0.5, 'bell'],
    [[N.C3, [0, 2], N.C3, [0, 2], N.C3, [0, 2]], 0.55, 'bell', 1.6],
  ),
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
  eiffel: { label: '✨ Огоньки', fx: 'sparkle', say: 'Эйфелева башня засверкала огоньками! ✨' },
  bigben: { label: '🔔 Куранты', fx: 'music', tune: 'westminster', h: 0.62, say: 'Бом! Биг-Бен бьёт часы 🔔' },
  spasskaya: { label: '🔔 Куранты', fx: 'music', tune: 'kremlin', h: 0.6, say: 'Кремлёвские куранты бьют! 🔔' },
  liberty: { label: '🎆 Салют', fx: ['fireworks', 'music'], tune: 'fanfare', say: 'Салют над Статуей Свободы! 🎆' },
  pyramids: { label: '🔦 Тайный ход', fx: 'secret', bonus: 10, say: 'Тайный ход открылся… а там мумия машет тебе! 👋' },
  pisa: { label: '🔔 Колокола', fx: 'music', tune: 'pisa', h: 0.92, say: 'На Пизанской башне семь колоколов — послушай! 🔔' },
  basil: { label: '🔔 Звон', fx: 'music', tune: 'zvon', h: 0.8, say: 'Колокольный звон над Красной площадью! 🔔' },
  rocket: { label: '🚀 Запуск!', fx: 'launch', cool: 50, say: 'Три, два, один… Пуск! 🚀' },
  colosseum: { label: '📣 Гладиаторы!', fx: 'cheer', say: 'Публика Колизея ликует! 📣' },
  taj: { label: '🪔 Фонарики', fx: 'lanterns', say: 'Над Тадж-Махалом поднимаются фонарики 🪔' },
  windmill: { label: '💨 Ветер!', fx: 'spin', say: 'Подул ветер — мельница закрутилась! 💨' },
  moai: { label: '🗿 Разбудить', fx: ['music', 'sparkle'], tune: 'moai', h: 0.8, say: 'Моаи запели низкими голосами! 🗿' },
  christ: { label: '🕊 Голуби', fx: 'doves', say: 'Голуби взлетели над Рио! 🕊' },
  burj: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над самым высоким небоскрёбом мира! 🎆' },
  pagoda: { label: '🏮 Фонарики', fx: 'lanterns', gong: true, say: 'Бонг! Над пагодой летят фонарики 🏮' },
  sydney: { label: '🎵 Концерт', fx: 'music', tune: 'ode', h: 0.7, r: 6, say: 'В опере начался концерт! 🎵' },
  stonehenge: { label: '☀️ Солнце', fx: 'sunbeam', say: 'Луч солнца прошёл точно через центр круга! ☀️' },
  chichen: { label: '👏 Хлопнуть', fx: 'music', tune: 'chirp', h: 1, say: 'Хлоп! А эхо у пирамиды чирикает, как птица кетцаль 🐦' },
  parthenon: { label: '⚡ Молния', fx: 'lightning', say: 'Зевс метнул молнию! ⚡' },
  greatwall: { label: '🏮 Фонарики', fx: 'lanterns', say: 'Над Великой стеной поднимаются фонарики 🏮' },
  // Россия
  winter: { label: '🎆 Салют', fx: 'fireworks', say: 'Праздничный салют над Невой! 🎆' },
  isaac: { label: '🔔 Звон', fx: 'music', tune: 'zvon', h: 0.9, say: 'Звонят колокола Исаакиевского собора! 🔔' },
  peterpaul: { label: '💥 Пушка', fx: 'confetti', at: [0, 2, 12], dir: [0, 9], say: 'Бабах! Полуденная пушка Петропавловки! 💥' },
  ostankino: { label: '✨ Огни', fx: 'sparkle', say: 'Останкинская башня зажгла огни! ✨' },
  mgu: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над университетом! 🎆' },
  motherland: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над Мамаевым курганом! 🎆' },
  kulsharif: { label: '🏮 Фонарики', fx: 'lanterns', say: 'Над Казанью летят фонарики 🏮' },
  saviour: { label: '🔔 Звон', fx: 'music', tune: 'zvon', h: 0.85, say: 'Звонят колокола храма! 🔔' },
  bolshoi: { label: '🩰 Балет', fx: 'music', tune: 'swan', h: 0.9, r: 5, say: 'Звучит «Лебединое озеро»! 🦢' },
  kizhi: { label: '🔔 Звон', fx: 'music', tune: 'zvon', h: 0.8, say: 'Звонница Кижей заиграла! 🔔' },
  tsar: { label: '💥 Выстрел', fx: 'confetti', at: [-4, 3.6, -5], dir: [0, -10], say: 'Царь-пушка выстрелила… конфетти! 🎉' },
  // Европа
  arc: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над Триумфальной аркой! 🎆' },
  notredame: { label: '🔔 Колокола', fx: 'music', tune: 'zvon', h: 0.7, say: 'Звонит колокол Эммануэль! 🔔' },
  louvre: { label: '✨ Огоньки', fx: 'sparkle', say: 'Стеклянная пирамида Лувра засияла! ✨' },
  michel: { label: '🕊 Чайки', fx: 'doves', say: 'Чайки взлетели над Мон-Сен-Мишелем! 🕊' },
  towerbridge: { label: '🌉 Развести мост', fx: 'raise', say: 'Тауэрский мост разводится — пропускаем корабль! 🌉' },
  londoneye: { label: '🎡 Прокатиться', fx: 'spin', boost: 10, say: 'Колесо обозрения закрутилось быстрее! 🎡' },
  brandenburg: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над Бранденбургскими воротами! 🎆' },
  neuschwanstein: { label: '✨ Волшебство', fx: 'sparkle', say: 'Сказочный замок засиял! ✨' },
  cologne: { label: '🔔 Колокола', fx: 'music', tune: 'zvon', h: 0.75, say: 'Звонят колокола Кёльнского собора! 🔔' },
  sagrada: { label: '🔔 Колокола', fx: 'music', tune: 'chimes', h: 0.85, say: 'Башни Саграды звенят! 🔔' },
  atomium: { label: '⚛️ Огоньки', fx: 'sparkle', say: 'Шары Атомиума засверкали! ⚛️' },
  stpeter: { label: '🕊 Голуби', fx: ['doves', 'music'], tune: 'zvon', h: 0.8, say: 'Колокола и голуби над Ватиканом! 🕊' },
  venice: { label: '🎶 Песня', fx: 'music', tune: 'gondola', h: 0.4, r: 6, say: 'Гондольер запел песню! 🎶' },
  orloj: { label: '💀 Куранты', fx: 'music', tune: 'orloj', h: 0.55, say: 'Скелет звонит в колокольчик — выходят апостолы! 🔔' },
  belem: { label: '🕊 Чайки', fx: 'doves', say: 'Чайки взлетели над башней Белен! 🕊' },
  budapest: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над Дунаем! 🎆' },
  stave: { label: '🔔 Колокол', fx: 'music', tune: 'mystic', h: 0.8, say: 'Звонит колокол деревянной церкви 🔔' },
  matterhorn: { label: '🏔 Йодль', fx: 'music', tune: 'yodel', h: 0.5, say: 'Йо-ло-ла-и-ти! Эхо в горах 🏔' },
  geysir: { label: '💦 Разбудить', fx: 'geyser', say: 'Гейзер выстрелил в небо! 💦' },
  vesuvius: { label: '🌋 Извержение', fx: 'erupt', say: 'Везувий извергается! 🌋' },
  bran: { label: '🦇 Летучие мыши', fx: 'doves', color: 0x2a2a30, say: 'Из замка вылетели летучие мыши! 🦇' },
  nessie: { label: '🦕 Позвать Несси', fx: 'nessie', say: 'Несси вынырнула поздороваться! 🦕' },
  // Азия
  tokyo: { label: '✨ Огни', fx: 'sparkle', say: 'Токийская башня зажгла огни! ✨' },
  fuji: { label: '🌸 Сакура', fx: 'petals', say: 'У горы Фудзи цветёт сакура! 🌸' },
  buddha: { label: '🔔 Гонг', fx: ['music', 'petals'], tune: 'gong', h: 0.3, say: 'Бонг! Звучит гонг у Великого Будды 🔔' },
  kinkaku: { label: '🌸 Сакура', fx: 'petals', say: 'Лепестки сакуры кружат над Золотым павильоном 🌸' },
  angkor: { label: '🔔 Гонг', fx: 'music', tune: 'gong', h: 0.5, say: 'Бонг! Звучит гонг Ангкор-Вата 🔔' },
  petronas: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над башнями Петронас! 🎆' },
  marinabay: { label: '✨ Шоу огней', fx: 'sparkle', say: 'Начинается шоу огней! ✨' },
  merlion: { label: '⛲ Фонтан', fx: 'fountain', say: 'Мерлайон пустил струю побольше! ⛲' },
  forbidden: { label: '🏮 Фонарики', fx: 'lanterns', gong: true, say: 'Над Запретным городом летят фонарики 🏮' },
  heaven: { label: '🔔 Гонг', fx: 'music', tune: 'gong', h: 0.6, say: 'Бонг! Гонг у Храма Неба 🔔' },
  taipei: { label: '🎆 Салют', fx: 'fireworks', say: 'Новогодний салют над Тайбэй 101! 🎆' },
  pearl: { label: '✨ Огни', fx: 'sparkle', say: 'Жемчужина Востока засияла! ✨' },
  terracotta: { label: '🥁 Барабаны', fx: 'music', tune: 'drums', h: 0.4, r: 6, say: 'Бум-бум! Барабаны Терракотовой армии 🥁' },
  shwedagon: { label: '🔔 Колокольчики', fx: 'music', tune: 'chimes', h: 0.8, say: 'Звенят колокольчики золотой пагоды 🔔' },
  borobudur: { label: '🏮 Фонарики', fx: 'lanterns', say: 'Над Боробудуром поднимаются фонарики 🏮' },
  hagia: { label: '🕊 Голуби', fx: 'doves', say: 'Голуби взлетели над Айя-Софией! 🕊' },
  petra: { label: '🕯 Огоньки', fx: 'lanterns', say: 'Петра ночью: тысячи огоньков! 🕯' },
  qutb: { label: '🕊 Птицы', fx: 'doves', say: 'Птицы взлетели над минаретом! 🕊' },
  lotus: { label: '🌸 Лепестки', fx: 'petals', say: 'Храм Лотоса осыпал лепестки! 🌸' },
  burjarab: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над парусом Бурдж аль-Араб! 🎆' },
  kuwait: { label: '✨ Огни', fx: 'sparkle', say: 'Кувейтские башни засверкали! ✨' },
  watarun: { label: '🏮 Фонарики', fx: 'lanterns', say: 'Праздник фонариков у храма Ват Арун! 🏮' },
  // Америка
  goldengate: { label: '🌫 Ревун', fx: 'fog', say: 'Туман накрыл мост — гудит ревун! 🌫' },
  rushmore: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над горой Рашмор! 🎆' },
  empire: { label: '✨ Огни', fx: 'sparkle', say: 'Эмпайр-стейт-билдинг зажёг огни! ✨' },
  whitehouse: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над Белым домом! 🎆' },
  spaceneedle: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над Спейс-Нидл! 🎆' },
  hollywood: { label: '🎬 Мотор!', fx: ['fireworks', 'music'], tune: 'fanfare', say: 'Камера, мотор! Голливуд празднует! 🎬' },
  cn: { label: '✨ Огни', fx: 'sparkle', say: 'Си-Эн Тауэр засияла огнями! ✨' },
  machupicchu: { label: '🦅 Кондоры', fx: 'doves', color: 0x3a3a3a, say: 'Над Мачу-Пикчу парят кондоры! 🦅' },
  niagara: { label: '🌈 Радуга', fx: 'rainbow', say: 'Над водопадом радуга! 🌈' },
  gateway: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над аркой Гейтвей! 🎆' },
  brooklyn: { label: '🎆 Салют', fx: 'fireworks', say: 'Салют над Бруклинским мостом! 🎆' },
  // Африка, Океания и древние чудеса
  abusimbel: { label: '☀️ Солнце', fx: 'sunbeam', at: [0, 0], say: 'Солнечный луч заглянул в храм фараона! ☀️' },
  kilimanjaro: { label: '🏔 Эхо', fx: 'music', tune: 'yodel', h: 0.6, say: 'Эхо с вершины Килиманджаро! 🏔' },
  table: { label: '🌫 Скатерть', fx: 'fog', say: 'Облака-скатерть легли на Столовую гору 🌫' },
  djenne: { label: '🥁 Барабаны', fx: 'music', tune: 'drums', h: 0.5, say: 'Бум-бум! Праздник у мечети в Дженне 🥁' },
  victoria: { label: '🌈 Радуга', fx: 'rainbow', say: 'Над водопадом Виктория радуга! 🌈' },
  baobabs: { label: '🥁 Барабаны', fx: 'music', tune: 'drums', h: 0.3, r: 8, say: 'Под баобабами бьют барабаны! 🥁' },
  hassan: { label: '🏮 Фонарики', fx: 'lanterns', say: 'Над мечетью Хасана II летят фонарики 🏮' },
  uluru: { label: '✨ Закат', fx: 'sparkle', say: 'На закате Улуру светится красным! ✨' },
  harbour: { label: '🎆 Салют', fx: 'fireworks', say: 'Новогодний салют над Харбор-Бридж! 🎆' },
  southpole: { label: '🌌 Сияние', fx: 'aurora', say: 'Полярное сияние в небе! 🌌' },
  hobbiton: { label: '🎆 Фейерверк', fx: ['fireworks', 'music'], tune: 'fanfare', say: 'Фейерверк, как у волшебника на празднике! 🎆' },
  colossus: { label: '💡 Факел', fx: 'beam', say: 'Факел Колосса осветил море! 💡' },
  pharos: { label: '💡 Маяк', fx: 'beam', say: 'Александрийский маяк зажёгся! 💡' },
  gardens: { label: '🌸 Цветы', fx: 'petals', say: 'Висячие сады осыпали лепестки! 🌸' },
};

// Мумия из тайного хода — смотрит в +x.
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

// hooks: fx, sfx, say, camera, gold(n), save, store()
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

  // проиграть мелодию; вернёт её длину в секундах
  function play(list) {
    let end = 0;
    for (const n of list) {
      if (n.k === 'bell') sfx.bell(n.f, n.t, 0.2 * n.v);
      else if (n.k === 'note') sfx.note(n.f, Math.max(0.12, n.d * 0.95), n.t, 0.16 * n.v);
      else sfx[n.k]?.(n.t, n.v ?? 1);
      end = Math.max(end, n.t + (n.k === 'bell' || n.k === 'gong' ? 1.2 : n.d ?? 0.3));
    }
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
          i++;
          if (Math.random() < 0.75) floatNote(e, c.x + rnd(r), y, c.z + rnd(r));
        }
      };
    },

    // салют с верхушки: ракеты взлетают и рассыпаются
    fireworks(e, o, c) {
      e.dur = 7;
      const shells = [];
      let next = 0;
      e.tick = (dt) => {
        if ((next -= dt) <= 0 && e.t < e.dur - 1.6) {
          next = 0.35 + Math.random() * 0.4;
          shells.push({ x: c.x + rnd(c.size * 0.4), y: c.top - 1, z: c.z + rnd(c.size * 0.4), vy: 20 + Math.random() * 6, fuse: 0.7 + Math.random() * 0.4, color: pick(PALETTE) });
          sfx.whoosh();
        }
        for (const s of shells) {
          if (s.fuse <= 0) continue;
          s.fuse -= dt;
          s.y += s.vy * dt;
          fx.burst(0xfff3c0, s, 1, { speed: 0.3, up: -2, size: 0.4, life: 0.3, y: 0, gravity: 0 });
          if (s.fuse <= 0) {
            fx.burst(s.color, s, 36, { speed: 13, up: 2, size: 0.7, life: 1.3, y: 0, gravity: 5 });
            fx.burst(0xffffff, s, 8, { speed: 6, up: 1, size: 0.5, life: 0.8, y: 0, gravity: 3 });
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
      e.tick = (dt) => e.every('f', 0.02, dt, () => fx.burst(0x9fd8f0, p, 1, { speed: 1, up: 4, size: 0.6, life: 1.2, y: 0, gravity: 12, vx: vx * 1.7, vz: vz * 1.7 }));
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
        fx.burst(Math.random() < 0.6 ? 0xf7a8c8 : 0xffd6e6, { x: c.x + Math.cos(a) * r, y: c.top + 4, z: c.z + Math.sin(a) * r }, 1, { speed: 1, up: 0, size: 0.45, life: 4, y: 0, gravity: 1.2 });
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
    let longest = 0;
    for (const kind of [].concat(w.act.fx)) {
      const e = makeEffect(c);
      EFFECTS[kind](e, w.act, c);
      running.push(e);
      longest = Math.max(longest, e.dur);
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

  function update(dt) {
    for (const w of state.values()) if (w.cool > 0) w.cool -= dt;
    for (let n = running.length - 1; n >= 0; n--) {
      const e = running[n];
      e.t += dt;
      if (e.t <= e.dur) e.tick?.(dt, e);
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
        o.position.x += v.vx * dt;
        o.position.y += v.vy * dt;
        o.position.z += v.vz * dt;
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
  };
}
