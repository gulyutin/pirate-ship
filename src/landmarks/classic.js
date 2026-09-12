// Первые 20 чудес света — ближайшие к порту острова. Модели — в classic1…4.js.
import { eiffel, bigBen, spasskaya, liberty, pyramids } from './classic1.js';
import { pisa, basil, rocket, colosseum, taj } from './classic2.js';
import { windmill, moai, christ, burj, pagoda } from './classic3.js';
import { sydney, stonehenge, chichen, parthenon, greatWall } from './classic4.js';

// Порядок = порядок островов от порта: ближние — самые знаменитые.
// size — полуразмер постройки, от него зависят плато и размер острова.
export const CLASSIC = [
  { id: 'eiffel', name: 'Эйфелева башня', country: 'Франция', size: 10.5, build: eiffel },
  { id: 'bigben', name: 'Биг-Бен', country: 'Великобритания', size: 13, build: bigBen },
  { id: 'spasskaya', name: 'Спасская башня', country: 'Россия', size: 13.5, build: spasskaya },
  { id: 'liberty', name: 'Статуя Свободы', country: 'США', size: 10, build: liberty },
  { id: 'pyramids', theme: 'desert', name: 'Пирамиды Гизы', country: 'Египет', size: 17, build: pyramids },
  { id: 'pisa', name: 'Пизанская башня', country: 'Италия', size: 5, build: pisa },
  { id: 'basil', name: 'Храм Василия Блаженного', country: 'Россия', size: 8, build: basil },
  { id: 'rocket', name: 'Ракета на Байконуре', country: 'Казахстан', size: 7.5, build: rocket },
  { id: 'colosseum', name: 'Колизей', country: 'Италия', size: 13, build: colosseum },
  { id: 'taj', name: 'Тадж-Махал', country: 'Индия', size: 14, build: taj },
  { id: 'windmill', name: 'Мельница', country: 'Нидерланды', size: 11, build: windmill },
  { id: 'moai', name: 'Статуи Моаи', country: 'Остров Пасхи, Чили', size: 13, build: moai },
  { id: 'christ', name: 'Христос-Искупитель', country: 'Бразилия', size: 9.5, build: christ },
  { id: 'burj', theme: 'desert', name: 'Бурдж-Халифа', country: 'ОАЭ', size: 9, build: burj },
  { id: 'pagoda', name: 'Пагода', country: 'Япония', size: 10, build: pagoda },
  { id: 'sydney', name: 'Сиднейская опера', country: 'Австралия', size: 11.5, build: sydney },
  { id: 'stonehenge', name: 'Стоунхендж', country: 'Великобритания', size: 9.5, build: stonehenge },
  { id: 'chichen', name: 'Чичен-Ица', country: 'Мексика', size: 11, build: chichen },
  { id: 'parthenon', name: 'Парфенон', country: 'Греция', size: 10.5, build: parthenon },
  { id: 'greatwall', name: 'Великая Китайская стена', country: 'Китай', size: 19.5, build: greatWall },
];
