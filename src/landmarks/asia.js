import {
  TAU, Q, CORNERS, SIDES, GOLD, WATER, yawAlong, round, stack, beam, polyline, pixels, flag, tree,
} from './kit.js';

// Азия (часть 1): Токийская башня, Фудзи, Великий Будда, Кинкаку-дзи, Ангкор-Ват, Петронас,
// Марина Бэй Сэндс, Мерлайон, Запретный город, Храм Неба, Тайбэй 101.

/* ---------- Общие помощники ---------- */
const TAN8 = Math.tan(Math.PI / 8);
const TAN16 = Math.tan(Math.PI / 16);

// Блок на грани: side — [sx, sz] из SIDES (наружная нормаль грани), (cx, cz) — центр постройки,
// u — сдвиг вдоль грани, off — от центра до середины блока по нормали; w — ширина вдоль грани, d — толщина.
function fbox(a, cx, cz, [sx, sz], u, y0, off, w, h, d, c, roll = 0) {
  a.box(cx + sx * off + sz * u, y0, cz + sz * off - sx * u, w, h, d, c, Math.atan2(sx, sz), 0, roll);
}

// Блок на луче: ang — направление от центра (0 = +x, π/2 = +z), r — до середины блока,
// w — поперёк луча, d — вдоль луча; tilt > 0 приподнимает внешний конец, u — сдвиг поперёк луча.
function rbox(a, cx, cz, ang, r, y0, w, h, d, c, tilt = 0, u = 0) {
  const nx = Math.cos(ang);
  const nz = Math.sin(ang);
  a.box(cx + nx * r - nz * u, y0, cz + nz * r + nx * u, w, h, d, c, yawAlong(-nz, nx), tilt);
}

// Правильный восьмигранник с апофемой r: две прямые планки и две косые.
function oct(a, x, y0, z, r, h, c, c2 = c) {
  const s = 2 * r * TAN8 + 0.02;
  a.box(x, y0, z, 2 * r, h, s, c);
  a.box(x, y0, z, s, h, 2 * r, c);
  a.box(x, y0 + 0.015, z, 2 * r, h - 0.03, s, c2, Q);
  a.box(x, y0 + 0.015, z, 2 * r, h - 0.03, s, c2, -Q);
}

// Круглый ярус: правильный 16-угольник с апофемой r из восьми планок.
// Высоты чуть разные, чтобы верх не мерцал.
function disk(a, x, y0, z, r, h, c, c2 = c) {
  const s = 2 * r * TAN16 + 0.02;
  for (let k = 0; k < 8; k++) a.box(x, y0, z, 2 * r, h + k * 0.006, s, k % 2 ? c2 : c, (k * Math.PI) / 8);
}

// Черепичная крыша восточного стиля: нижний край w×d, n уступов высотой h, каждый уже на 2·k,
// по углам — задранные вверх «рожки». Возвращает высоту верха.
function eaves(a, x, y0, z, w, d, n, h, k, c, c2 = c, tip = c2) {
  let y = y0;
  for (let i = 0; i < n; i++) {
    a.box(x, y, z, w - 2 * i * k, h, d - 2 * i * k, i % 2 ? c2 : c);
    y += h;
  }
  for (const [sx, sz] of CORNERS) {
    const ang = Math.atan2(sz * d, sx * w);
    a.box(x + sx * (w / 2 - 0.3), y0 + h * 0.4, z + sz * (d / 2 - 0.3), 0.9, h, 0.9, c2, Q);
    a.box(x + sx * (w / 2 + 0.05), y0 + h * 0.7, z + sz * (d / 2 + 0.05), 0.4, 0.3, 1.2, tip, yawAlong(-Math.sin(ang), Math.cos(ang)), 0.6);
  }
  return y;
}

// Цветущая сакура: кривой ствол, ветка и розовые облака цветов.
function sakura(a, x, z, s = 1) {
  const T = 0x5a3a28;
  a.box(x, 0, z, 0.5 * s, 2.2 * s, 0.5 * s, T);
  a.box(x + 0.45 * s, 1.5 * s, z, 1 * s, 0.25 * s, 0.25 * s, T, 0, 0, 0.6);
  a.box(x, 2.2 * s, z, 3 * s, 1.4 * s, 3 * s, 0xf4b8d0);
  a.box(x + 0.3 * s, 3.6 * s, z - 0.2 * s, 2 * s, 0.9 * s, 2 * s, 0xf9cfe0);
  a.box(x - 0.9 * s, 2.4 * s, z + 0.8 * s, 1.2 * s, 0.8 * s, 1.2 * s, 0xeaa2c0);
  a.box(x + 1.1 * s, 2 * s, z - 0.8 * s, 0.9 * s, 0.7 * s, 0.9 * s, 0xf7c4d6);
  a.solid(x, z, 0.4 * s);
}

// Японская сосна: наклонный ствол и плоские «облака» хвои.
function pine(a, x, z, h = 3, s = 1) {
  const T = 0x5a4030;
  const L = 0x2f5a36;
  const L2 = 0x3a6a40;
  a.box(x, 0.04, z, 0.45 * s, h, 0.45 * s, T, 0, 0, 0.12);
  a.box(x + 0.6 * s, h * 0.5, z, 1.4 * s, 0.22 * s, 0.22 * s, T, 0, 0, 0.35);
  a.box(x + 1.1 * s, h * 0.62, z, 2 * s, 0.6 * s, 1.7 * s, L);
  a.box(x - 0.2 * s, h, z, 2.8 * s, 0.7 * s, 2.3 * s, L2);
  a.box(x - 0.1 * s, h + 0.7 * s, z, 1.6 * s, 0.55 * s, 1.4 * s, L);
  a.solid(x, z, 0.35 * s);
}

// Кипарис-свеча: тёмная хвоя ярусами.
function cypress(a, x, z, h = 4) {
  a.box(x, 0, z, 0.4, 1, 0.4, 0x5a4030);
  [1.8, 1.5, 1.1, 0.7].forEach((w, i) => a.box(x, 1 + (i * (h - 1)) / 4, z, w, (h - 1) / 4 + 0.1, w, i % 2 ? 0x2a5a3a : 0x336a44));
  a.solid(x, z, 0.4);
}

// Пальма: ствол из коленец с наклоном, кокосы и шесть листьев веером.
function palm(a, x, z, h = 5, lean = 0.2, dir = 0) {
  const LF = 0x3f9a44;
  const LF2 = 0x35883a;
  const n = 4;
  const seg = h / n;
  a.box(x, 0, z, 0.5, seg, 0.5, 0x8a6a48);
  let p = [x, seg, z];
  for (let i = 1; i < n; i++) {
    const t = (lean * (i + 1)) / n;
    const q = [p[0] + Math.cos(dir) * Math.sin(t) * seg, p[1] + Math.cos(t) * seg, p[2] + Math.sin(dir) * Math.sin(t) * seg];
    beam(a, p, q, 0.46 - i * 0.04, i % 2 ? 0x7a5a3c : 0x8a6a48);
    p = q;
  }
  for (let k = 0; k < 6; k++) {
    const ang = (k * TAU) / 6 + 0.3;
    rbox(a, p[0], p[2], ang, 1.1, p[1] - 0.3, 0.7, 0.15, 2.4, k % 2 ? LF : LF2, -0.35);
  }
  a.box(p[0], p[1] - 0.55, p[2], 0.7, 0.6, 0.7, 0x6a4a2a); // кокосы
  a.solid(x, z, 0.35);
}

// Каменный фонарь торо.
function toro(a, x, z, s = 1) {
  const ST = 0x9a8f7a;
  const ST2 = 0x8a8070;
  a.box(x, 0, z, 1 * s, 0.3 * s, 1 * s, ST2);
  a.box(x, 0.3 * s, z, 0.35 * s, 1.3 * s, 0.35 * s, ST);
  a.box(x, 1.6 * s, z, 0.9 * s, 0.2 * s, 0.9 * s, ST2);
  a.box(x, 1.8 * s, z, 0.7 * s, 0.6 * s, 0.7 * s, 0xffe7a0);
  a.box(x, 2.4 * s, z, 1.2 * s, 0.25 * s, 1.2 * s, ST2);
  a.box(x, 2.65 * s, z, 0.6 * s, 0.2 * s, 0.6 * s, ST);
  a.box(x, 2.85 * s, z, 0.3 * s, 0.3 * s, 0.3 * s, ST);
  a.solid(x, z, 0.5 * s);
}

// Красный китайский фонарик с золотыми крышечками и кисточкой; y — низ фонарика.
function lantern(a, x, y, z, s = 1) {
  a.box(x, y + 0.1 * s, z, 0.7 * s, 0.6 * s, 0.7 * s, 0xd8322a);
  a.box(x, y + 0.2 * s, z, 0.8 * s, 0.4 * s, 0.8 * s, 0xe8483a, Q);
  a.box(x, y + 0.7 * s, z, 0.45 * s, 0.12 * s, 0.45 * s, GOLD);
  a.box(x, y, z, 0.45 * s, 0.12 * s, 0.45 * s, GOLD);
  a.box(x, y - 0.35 * s, z, 0.1 * s, 0.35 * s, 0.1 * s, 0xf0c040);
}

// Лев-страж на постаменте, смотрит на −z; c — тело, c2 — грива и лапы.
function guardLion(a, x, z, c, c2, s = 1) {
  const DK = 0x2a2622;
  a.box(x, 0, z, 1.8 * s, 0.9 * s, 2.2 * s, 0x9a948a);
  a.box(x, 0.9 * s, z, 1.95 * s, 0.15 * s, 2.35 * s, 0x8a8478);
  a.box(x, 1.05 * s, z + 0.3 * s, 1.2 * s, 1.1 * s, 1.4 * s, c);
  for (const sx of [-0.35, 0.35]) a.box(x + sx * s, 1.05 * s, z - 0.55 * s, 0.4 * s, 1.1 * s, 0.4 * s, c2);
  a.box(x - 0.45 * s, 1.05 * s, z - 0.4 * s, 0.5 * s, 0.5 * s, 0.5 * s, c2); // шар под лапой
  a.box(x, 2.05 * s, z - 0.1 * s, 1.4 * s, 1.2 * s, 1.1 * s, c2); // кудрявая грива
  for (const [dx, dy] of [[-0.55, 0.9], [0, 1.1], [0.55, 0.9]]) a.box(x + dx * s, 2.05 * s + dy * s, z - 0.1 * s, 0.4 * s, 0.35 * s, 0.9 * s, c2);
  a.box(x, 2.2 * s, z - 0.6 * s, 1 * s, 0.8 * s, 0.4 * s, c); // морда
  for (const sx of [-0.25, 0.25]) a.box(x + sx * s, 2.65 * s, z - 0.82 * s, 0.18 * s, 0.14 * s, 0.06 * s, DK);
  a.box(x, 2.3 * s, z - 0.82 * s, 0.5 * s, 0.14 * s, 0.06 * s, 0xa83a2a); // пасть
  a.box(x, 2.45 * s, z - 0.88 * s, 0.3 * s, 0.22 * s, 0.14 * s, c2); // нос
  a.box(x, 1.8 * s, z + 1.05 * s, 0.4 * s, 0.9 * s, 0.35 * s, c2); // хвост-завиток
  a.solid(x, z, 1 * s, 1.2 * s);
}

/* ---------- Токио: Токийская башня — красно-белая решётка, арки между ногами, две смотровые площадки ---------- */
function tokyoTower(a) {
  const O = 0xf0582a; // «международный оранжевый»
  const W = 0xf4f0e8;
  const W2 = 0xdcd6cc;
  const GL = 0x7ab4d4;
  const GL2 = 0x5a94b8;
  const DK = 0x3a4048;
  const CON = 0x9a958a;
  // уровни решётки: [высота, полуширина]
  const lower = [[1, 7.4], [4.6, 6.1], [8.2, 5.05], [11.8, 4.2], [15.4, 3.55], [19.6, 3.05]];
  const upper = [[23.8, 2.7], [27.6, 2.35], [31.6, 2.0], [35.4, 1.7]];
  const top = [[37.2, 1.35], [40, 1.1], [42.8, 0.85]];
  // точка на грани side: u от −1 до 1 поперёк грани
  const P = ([sx, sz], u, y, h) => [sx * h + sz * u * h, y, sz * h - sx * u * h];
  const lattice = (lv, tPost, tBrace, shift) => {
    for (let i = 1; i < lv.length; i++) {
      const [y0, h0] = lv[i - 1];
      const [y1, h1] = lv[i];
      const c = (i + shift) % 2 ? W : O;
      for (const [sx, sz] of CORNERS) beam(a, [sx * h0, y0, sz * h0], [sx * h1, y1, sz * h1], tPost, c);
      for (const side of SIDES) {
        beam(a, P(side, -1, y0, h0), P(side, 1, y1, h1), tBrace, c); // раскосы крестом
        beam(a, P(side, 1, y0, h0), P(side, -1, y1, h1), tBrace, c);
        beam(a, P(side, -1, y1, h1), P(side, 1, y1, h1), tBrace * 1.3, c); // пояс
      }
    }
  };
  lattice(lower, 0.95, 0.3, 1);
  lattice(upper, 0.6, 0.24, 0);
  lattice(top, 0.4, 0.18, 1);
  // бетонные опоры под ногами
  for (const [sx, sz] of CORNERS) {
    a.box(sx * 7.4, 0, sz * 7.4, 2.2, 1, 2.2, CON);
    a.solid(sx * 7.4, sz * 7.4, 1.1);
  }
  // большие арки между ногами на каждой грани
  const hwAt = (y) => {
    for (let i = 1; i < lower.length; i++) {
      if (y <= lower[i][0]) {
        const t = (y - lower[i - 1][0]) / (lower[i][0] - lower[i - 1][0]);
        return lower[i - 1][1] + t * (lower[i][1] - lower[i - 1][1]);
      }
    }
    return lower[lower.length - 1][1];
  };
  for (const side of SIDES) {
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const th = (k / 8) * Math.PI;
      const y = 1 + 6.4 * Math.sin(th);
      pts.push(P(side, -Math.cos(th) * 0.97, y, hwAt(y)));
    }
    polyline(a, pts, 0.55, O);
  }

  // главная смотровая площадка: восьмигранная, два яруса окон
  oct(a, 0, 19.3, 0, 4.5, 0.7, W2);
  oct(a, 0, 20, 0, 4.25, 1.4, GL, GL2);
  oct(a, 0, 21.4, 0, 4.4, 0.35, W);
  oct(a, 0, 21.75, 0, 4.25, 1.4, GL, GL2);
  oct(a, 0, 23.15, 0, 4.6, 0.45, W2);
  oct(a, 0, 23.6, 0, 3.2, 0.35, DK);
  for (let k = 0; k < 8; k++) {
    for (const u of [-1.1, 0, 1.1]) rbox(a, 0, 0, (k * Math.PI) / 4, 4.3, 20, 0.14, 3.15, 0.1, W, 0, u);
  }
  // верхняя площадка
  oct(a, 0, 35.2, 0, 2.3, 0.3, W2);
  oct(a, 0, 35.5, 0, 2.15, 1.2, GL, GL2);
  oct(a, 0, 36.7, 0, 2.4, 0.4, W);
  for (let k = 0; k < 8; k++) rbox(a, 0, 0, (k * Math.PI) / 4 + Q / 2, 2.2, 35.5, 0.12, 1.2, 0.1, W);

  // антенна: полосатые колена и красный огонёк
  a.box(0, 42.8, 0, 1.9, 0.5, 1.9, W2);
  let y = 43.3;
  [1.1, 0.95, 0.85, 0.75, 0.65, 0.55, 0.45, 0.38, 0.3].forEach((w, i) => {
    a.box(0, y, 0, w, 1.5, w, i % 2 ? W : O);
    if (i === 2 || i === 5) a.box(0, y + 1.4, 0, w + 0.7, 0.2, w + 0.7, W2);
    y += 1.5;
  });
  a.box(0, y, 0, 0.35, 0.4, 0.35, 0xff3030);

  // павильон под башней: окна, вход и красная вывеска
  a.box(0, 0, 0, 7, 3.4, 7, 0xece8e0);
  a.box(0, 3.4, 0, 7.4, 0.3, 7.4, W2);
  for (const side of SIDES) {
    fbox(a, 0, 0, side, 0, 1.9, 3.5, 6.2, 0.9, 0.1, GL2);
    fbox(a, 0, 0, side, 0, 0, 3.5, 1.6, 1.6, 0.12, DK);
  }
  a.box(0, 3.7, -3, 3.4, 0.9, 0.25, O);
  a.box(0, 3.9, -3.15, 2.6, 0.5, 0.06, W);
  a.solid(0, 0, 3.6);

  // сакура, торговый автомат и флаг Японии
  sakura(a, 10, 0, 0.9);
  sakura(a, -10, 0.5, 0.9);
  sakura(a, 0.5, 10, 0.9);
  a.box(4.2, 0, -9.6, 1.1, 1.9, 0.7, 0xd83a30);
  a.box(4.2, 0.9, -9.97, 0.8, 0.8, 0.06, 0xf4f4f4);
  a.box(4.2, 0.25, -9.97, 0.6, 0.25, 0.06, DK);
  a.solid(4.2, -9.6, 0.6, 0.4);
  const JP = ['WWWWWWWW', 'WWWRRWWW', 'WWRRRRWW', 'WWWRRWWW', 'WWWWWWWW'];
  flag(a, -4, 0, -9.6, JP, { W: 0xf8f8f8, R: 0xd81e2c });
}

/* ---------- Япония: гора Фудзи — снежная шапка с языками, кратер, облака, озеро с отражением и пагода Тюрэйто ---------- */
function fuji(a) {
  const R = 0x6a6f8c;
  const R2 = 0x5f6480;
  const R3 = 0x757a96;
  const FOR = 0x3f6a4a; // лес у подножия (крупные блоки)
  const FOR2 = 0x486e54;
  const SN = 0xf4f7fa;
  const SN2 = 0xe2eaf4;
  const ST = 0x9a8f7a;
  const VER = 0xc0392b;
  const RF = 0x3a3f45;
  const RF2 = 0x4a5058;
  const MX = 0;
  const MZ = 2.5; // центр горы чуть позади — впереди озеро
  const H = 18;
  const n = 20;
  const h = H / n;
  const SL = 12; // с этого яруса начинается снег
  const rAt = (t) => 2.8 + 8.7 * Math.pow(1 - t, 1.5);
  // гора: восьмигранные ярусы, внизу лес, выше серо-синие склоны, наверху снег
  for (let i = 0; i < n; i++) {
    const c = i >= SL ? (i % 2 ? SN : SN2) : i < 2 ? (i ? FOR2 : FOR) : i < 6 ? R2 : i < 9 ? R : R3;
    oct(a, MX, i * h, MZ, rAt(i / n), h, c);
  }
  // снежные языки сползают по склонам неровной бахромой
  const tongues = [4, 2, 3, 5, 1, 3, 2, 4, 5, 2, 1, 4, 3, 5, 2, 3];
  const offs = [-0.26, 0.14, -0.08, 0.27, -0.2, 0.05, -0.28, 0.2, -0.15, 0.24, -0.02, 0.18, -0.24, 0.1, -0.12, 0.28];
  for (let k = 0; k < 16; k++) {
    const ang = (Math.floor(k / 2) * Math.PI) / 4;
    const len = tongues[k];
    for (let j = 1; j <= len; j++) {
      const i = SL - j;
      const r = rAt(i / n);
      rbox(a, MX, MZ, ang, r - 0.3, i * h, 0.5 + 0.32 * (len - j + 1), h + 0.02, 0.8, SN, 0, offs[k] * r);
    }
  }
  // кратер: тёмная чаша и зубчатый снежный край
  a.box(MX, H, MZ, 3.4, 0.05, 3.4, 0x7a7890);
  for (let k = 0; k < 8; k++) rbox(a, MX, MZ, (k * Math.PI) / 4 + Math.PI / 8, 2.55, H, 1.5, 0.45 + (k % 3) * 0.15, 0.7, k % 2 ? SN : SN2);
  // облака вокруг склонов
  const cloud = (x, y, z, s) => {
    a.box(x, y, z, 3.4 * s, 1 * s, 2 * s, 0xffffff);
    a.box(x - 1 * s, y + 0.5 * s, z + 0.2 * s, 1.8 * s, 1 * s, 1.6 * s, 0xf4f8fc);
    a.box(x + 0.9 * s, y + 0.6 * s, z - 0.1 * s, 1.6 * s, 0.9 * s, 1.5 * s, 0xffffff);
    a.box(x + 2 * s, y + 0.1 * s, z, 1.2 * s, 0.7 * s, 1.2 * s, 0xf4f8fc);
  };
  cloud(7.6, 8, 1.2, 1);
  cloud(-7.8, 10.5, 4.5, 0.9);
  cloud(1.5, 12.5, 8.2, 0.8);
  // тёмные ели у подножия сзади
  for (let k = 0; k < 7; k++) {
    const ang = 0.35 + (k * (Math.PI - 0.7)) / 6;
    cypress(a, MX + Math.cos(ang) * 12.6, MZ + Math.sin(ang) * 12.4, 3 + (k % 3) * 0.6);
  }
  a.solid(MX, MZ, 11);

  // озеро Кавагути с отражением горы и лодочкой
  a.box(-1, 0, -12.4, 13, 0.18, 4.6, WATER);
  [[7, -10.7, 0x6a74a0], [4.6, -11.6, 0x7a84ac], [2.6, -12.5, 0xe8eef8], [1.2, -13.3, 0xf4f7fa]].forEach(([w, z, c]) => a.box(0, 0.18, z, w, 0.03, 0.9, c));
  const BX = -4.6;
  const BZ = -12.9;
  a.box(BX, 0.15, BZ, 2.2, 0.45, 0.9, 0x8a5a3a);
  a.box(BX, 0.45, BZ, 1.8, 0.2, 0.6, 0x6a4028);
  a.box(BX + 1.2, 0.18, BZ, 0.6, 0.45, 0.6, 0x8a5a3a, Q);
  a.box(BX, 0.55, BZ, 0.12, 0.12, 2.2, 0xb08a5a, 0.4);

  // пятиярусная пагода Тюрэйто на холме
  const PX = -11.6;
  const PZ = -6.4;
  a.box(PX, 0, PZ, 3.6, 0.6, 3.6, ST);
  a.box(PX, 0, PZ - 2.2, 1.4, 0.3, 0.8, ST);
  let y = 0.6;
  [2.4, 2.1, 1.85, 1.6, 1.35].forEach((w) => {
    a.box(PX, y, PZ, w, 1, w, VER);
    for (const [sx, sz] of CORNERS) a.box(PX + (sx * w) / 2, y, PZ + (sz * w) / 2, 0.22, 1, 0.22, 0x8a2a20);
    a.box(PX, y + 0.15, PZ - w / 2 - 0.02, w * 0.3, 0.65, 0.08, 0x3a2a1c);
    a.box(PX, y + 0.8, PZ, w + 0.3, 0.2, w + 0.3, 0xeee8da);
    y = eaves(a, PX, y + 1, PZ, w + 1.4, w + 1.4, 2, 0.22, 0.4, RF, RF2);
  });
  a.box(PX, y, PZ, 0.6, 0.3, 0.6, RF);
  a.box(PX, y + 0.3, PZ, 0.2, 2.2, 0.2, GOLD);
  for (let r = 0; r < 4; r++) a.box(PX, y + 0.6 + r * 0.35, PZ, 0.55, 0.1, 0.55, GOLD);
  a.box(PX, y + 2.5, PZ, 0.35, 0.35, 0.35, GOLD);
  a.solid(PX, PZ, 1.8);

  // сакура вокруг пагоды и у озера, тории на берегу
  sakura(a, -8.6, -10.2, 0.85);
  sakura(a, -14.1, -2.6, 0.8);
  sakura(a, 6.2, -11.2, 0.8);
  const TX = 9.2;
  const TZ = -8.8;
  for (const sx of [-1, 1]) {
    a.box(TX + sx * 1.4, 0, TZ, 0.45, 3, 0.45, VER);
    a.box(TX + sx * 2.25, 3.35, TZ, 0.5, 0.3, 0.7, 0x2e2e30, 0, 0, -sx * 0.3);
    a.solid(TX + sx * 1.4, TZ, 0.3);
  }
  a.box(TX, 3.2, TZ, 4.2, 0.4, 0.7, 0x2e2e30);
  a.box(TX, 2.9, TZ, 3.8, 0.3, 0.5, VER);
  a.box(TX, 2.2, TZ, 3.4, 0.3, 0.4, VER);
  a.box(TX, 2.5, TZ - 0.1, 0.5, 0.5, 0.2, 0x2e2e30);
}

/* ---------- Камакура: Великий Будда — бронзовый Будда на лотосе, кудри-улитки, курильница с дымком ---------- */
function buddha(a) {
  const BR = 0x5a8a86; // бронза с патиной
  const BR2 = 0x4c7a78;
  const BR3 = 0x6c9c96;
  const DK = 0x2e403e;
  const ST = 0x9a958a;
  const ST2 = 0x8a8578;
  const ST3 = 0xaaa498;
  const BZ = 0x4a4038; // тёмная бронза курильницы
  const BZ2 = 0x5a5046;
  const Z = 2; // центр статуи; лицо смотрит на −z
  // каменная площадка, ступени и двухъярусный постамент
  a.box(0, 0, Z, 13, 0.5, 11.4, ST);
  a.box(0, 0, Z - 6.1, 4.4, 0.25, 0.8, ST2);
  a.box(0, 0.5, Z, 11.4, 0.8, 9.6, ST2);
  a.box(0, 1.3, Z, 10.4, 0.6, 8.8, ST3);
  // лотос: круглая подушка и лепестки, отогнутые наружу
  disk(a, 0, 1.9, Z, 4.7, 0.5, BR2, BR);
  for (let k = 0; k < 14; k++) rbox(a, 0, Z, (k * TAU) / 14, 4.75, 1.55, 1.4, 0.95, 0.3, k % 2 ? BR3 : BR, -0.35);

  // скрещённые ноги, колени, ступни на бёдрах и складки одежды
  a.box(0, 2.4, Z - 0.3, 9, 2.1, 5.6, BR);
  for (const sx of [-1, 1]) {
    oct(a, sx * 3.3, 2.4, Z - 2.1, 1.3, 2, BR, BR2);
    a.box(sx * 2, 4.5, Z - 1.5, 1.9, 0.35, 1.1, BR3); // ступня пяткой вверх
  }
  a.box(0, 2.4, Z - 3.15, 5.6, 1.7, 0.4, BR2);
  for (const u of [-1.6, 0, 1.6]) a.box(u, 2.5, Z - 3.4, 0.25, 1.5, 0.15, BR);
  // руки сложены в жест медитации
  a.box(0, 4.5, Z - 1.6, 3, 0.8, 1.6, BR3);
  for (const sx of [-1, 1]) {
    a.box(sx * 0.35, 5.3, Z - 1.7, 0.35, 0.5, 0.35, BR3); // большие пальцы
    a.box(sx * 2.5, 4.4, Z - 1.1, 1.3, 1.1, 2.8, BR2); // предплечья
    a.box(sx * 3.45, 4.6, Z + 0.7, 1.3, 4.4, 3, BR2, 0, 0, sx * 0.08); // плечи и руки
  }
  // туловище, покатые плечи, складки одеяния
  a.box(0, 4.5, Z + 0.9, 6.2, 5, 3.8, BR);
  a.box(0, 7.4, Z + 0.9, 6.6, 1.6, 3.9, BR);
  a.box(0, 9, Z + 0.9, 5.4, 0.6, 3.6, BR);
  const FZ0 = Z + 0.9 - 1.95;
  for (const sx of [-1, 1]) a.box(sx * 0.8, 6.9, FZ0, 0.2, 2.6, 0.12, BR2, 0, 0, sx * 0.45);
  for (const [x, y, rz] of [[-1.3, 5.2, 0.3], [-1.6, 6, 0.35], [1.4, 5.5, -0.25], [1.7, 6.4, -0.3]]) a.box(x, y, FZ0, 1.8, 0.15, 0.12, BR2, 0, 0, rz);
  // два окошка на спине (внутрь статуи можно заглянуть)
  for (const sx of [-1, 1]) a.box(sx * 1, 7.4, Z + 2.86, 0.9, 1.1, 0.12, DK);

  // шея с тремя складками
  a.box(0, 9.6, Z + 1, 2.2, 0.9, 2.2, BR);
  for (const y of [9.7, 10.05]) a.box(0, y, Z + 1, 2.32, 0.1, 2.32, BR2);
  // голова
  a.box(0, 10.5, Z + 0.9, 4.2, 4.2, 4, BR);
  a.box(0, 10.3, Z + 0.4, 2.6, 0.4, 2.6, BR);
  const FZ = Z + 0.9 - 2; // плоскость лица
  const F = (x, y, w, h, c, d = 0.12, rz = 0) => a.box(x, y, FZ - d / 2 + 0.01, w, h, d, c, 0, 0, rz);
  for (const sx of [-1, 1]) {
    F(sx * 0.85, 12.55, 1.2, 0.14, BR2, 0.12, sx * -0.15); // брови
    F(sx * 0.85, 12, 1, 0.1, DK, 0.12, sx * 0.12); // закрытые глаза
    a.box(sx * 2.25, 10.4, Z + 1.1, 0.5, 3.2, 1.1, BR2); // длинные мочки ушей
    a.box(sx * 2.52, 11.4, Z + 1.1, 0.06, 1.6, 0.5, DK);
  }
  F(0, 11.2, 0.6, 1.2, BR, 0.5); // нос
  F(0, 11.2, 0.85, 0.25, BR2, 0.6);
  F(0, 10.75, 0.9, 0.12, DK);
  F(0, 10.6, 0.7, 0.14, BR3);
  F(0, 12.85, 0.3, 0.3, BR3, 0.2); // точка-урна на лбу
  // кудри-улитки: на макушке, у лба и по бокам
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) a.box(-1.6 + i * 0.8, 14.7, Z + 0.9 - 1.6 + j * 0.8, 0.6, 0.35, 0.6, (i + j) % 2 ? BR2 : BR3);
  }
  for (let i = 0; i < 7; i++) {
    for (const [y, o] of [[13.55, 0], [14.15, 0.3]]) F(-1.8 + i * 0.6 + o, y, 0.45, 0.45, (i % 2) ? BR2 : BR3, 0.25);
  }
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      for (const y of [13.4, 14.1]) a.box(sx * 2.12, y, Z - 0.7 + i * 0.8, 0.25, 0.45, 0.45, (i % 2) ? BR3 : BR2);
    }
  }
  // ушниша — бугорок мудрости на макушке
  a.box(0, 14.7, Z + 1, 2.4, 1.2, 2.4, BR2);
  a.box(0, 15.9, Z + 1, 1.5, 0.5, 1.5, BR3);
  for (const [sx, sz] of CORNERS) a.box(sx * 0.9, 15.2, Z + 1 + sz * 0.9, 0.55, 0.55, 0.55, BR3);
  a.solid(0, Z, 5.8, 4.8);

  // курильница под крышей, над ней вьётся дымок
  const KZ = -5.4;
  a.box(0, 0, KZ, 2.4, 0.4, 2.4, ST2);
  for (const [sx, sz] of CORNERS) a.box(sx * 0.6, 0.4, KZ + sz * 0.6, 0.35, 0.5, 0.35, BZ);
  a.box(0, 0.9, KZ, 1.9, 1.1, 1.9, BZ);
  a.box(0, 1, KZ, 2, 0.8, 2, BZ2, Q);
  a.box(0, 2, KZ, 2.2, 0.25, 2.2, BZ2);
  a.box(0, 2.05, KZ, 1.6, 0.25, 1.6, 0xc8c0b0);
  for (const [sx, sz] of CORNERS) a.box(sx * 0.95, 2.25, KZ + sz * 0.95, 0.15, 1.5, 0.15, BZ);
  eaves(a, 0, 3.7, KZ, 2.8, 2.8, 3, 0.25, 0.4, BZ, BZ2);
  a.box(0, 4.45, KZ, 0.4, 0.5, 0.4, GOLD);
  a.group(0, 2.3, KZ).userData.smoke = true;
  a.solid(0, KZ, 1.2);
  // бронзовые лотосы в вазах по бокам
  for (const sx of [-1, 1]) {
    const x = sx * 4.3;
    const z = Z - 5;
    a.box(x, 0.5, z, 1, 0.9, 1, BZ);
    a.box(x, 1.4, z, 1.2, 0.2, 1.2, BZ2);
    a.box(x, 1.6, z, 0.2, 2.4, 0.2, BR2);
    a.box(x + sx * 0.5, 2.5, z, 1.3, 0.12, 1.1, BR, 0, 0.2, sx * -0.25); // лист
    a.box(x, 4, z, 0.6, 0.7, 0.6, BR3);
    for (let k = 0; k < 4; k++) rbox(a, x, z, (k * Math.PI) / 2 + Q, 0.35, 3.9, 0.4, 0.7, 0.12, BR, -0.4);
    a.solid(x, z, 0.6);
  }
  // каменные фонари, сосны, сакура и огромные соломенные сандалии на щите
  for (const sx of [-1, 1]) {
    toro(a, sx * 5.8, -6.2);
    pine(a, sx * 5.9, 6.3, 3.2, 0.75);
    sakura(a, sx * 7.7, -1.8, 0.8);
  }
  const SX = -7.6;
  const SZ = 3.2;
  for (const dz of [-1, 1]) a.box(SX, 0, SZ + dz * 1.1, 0.25, 3, 0.25, 0x5a3a24);
  a.box(SX, 0.8, SZ, 0.15, 2, 2.4, 0x7a5436);
  for (const dz of [-0.5, 0.5]) {
    a.box(SX + 0.12, 1, SZ + dz, 0.1, 1.6, 0.7, 0xc8b078);
    a.box(SX + 0.18, 1.8, SZ + dz, 0.06, 0.12, 0.7, 0x6a3a20);
  }
}

/* ---------- Киото: Золотой павильон Кинкаку-дзи — три этажа над прудом, феникс на крыше, сосны на островках ---------- */
function kinkaku(a) {
  const G = 0xe8b830;
  const G2 = 0xd4a22c;
  const G3 = 0xf2cc55;
  const RF = 0x3a2e26; // крыша из коры кипариса
  const RF2 = 0x4a3c30;
  const WD = 0x5a3a24;
  const WD2 = 0x7a5436;
  const WW = 0xefe8d6;
  const ST = 0x8f8a80;
  const ST2 = 0x7a766c;
  const DK = 0x2a2420;
  const PX = 1;
  const PZ = 2.8; // павильон у дальнего берега, смотрит на −z
  // пруд Кёко-ти
  a.box(0, 0, -1.5, 21, 0.2, 12, WATER);
  a.box(-0.5, 0, -2, 15, 0.2, 14, WATER);
  // отражение павильона в воде
  [[5.4, -1.9, 0xc9a040], [4.6, -2.8, 0x5a6a78], [4, -3.7, 0xd9b450], [2.8, -4.6, 0x4a5a68], [1.6, -5.4, 0xc9a040]].forEach(([w, z, c]) => a.box(PX, 0.2, z, w, 0.03, 0.8, c));

  // первый этаж: дерево и белая штукатурка, веранда с перилами
  a.box(PX, 0, PZ, 8, 0.5, 6.6, ST);
  a.box(PX, 0.5, PZ, 7.8, 0.25, 6.4, WD2);
  a.box(PX, 0.75, PZ, 6.4, 2.35, 5, WW);
  for (const side of SIDES) {
    const half = side[0] ? 2.5 : 3.2;
    const n = side[0] ? 4 : 5;
    for (let i = 0; i < n; i++) {
      const u = -half + (i * 2 * half) / (n - 1);
      fbox(a, PX, PZ, side, u, 0.75, (side[0] ? 3.2 : 2.5) + 0.1, 0.3, 2.35, 0.2, WD);
      if (i < n - 1) {
        const m = u + half / (n - 1);
        fbox(a, PX, PZ, side, m, 0.8, (side[0] ? 3.2 : 2.5) + 0.05, (2 * half) / (n - 1) - 0.4, 1.1, 0.1, WD2); // раздвижные двери
        for (const dy of [2.1, 2.5]) fbox(a, PX, PZ, side, m, dy, (side[0] ? 3.2 : 2.5) + 0.06, (2 * half) / (n - 1) - 0.4, 0.08, 0.1, WD);
      }
    }
  }
  a.box(PX, 1.05, PZ - 3.15, 7.8, 0.12, 0.12, WD);
  for (let i = 0; i < 7; i++) a.box(PX - 3.6 + i * 1.2, 0.75, PZ - 3.15, 0.14, 0.42, 0.14, WD);
  a.box(PX, 2.9, PZ, 6.7, 0.2, 5.3, WD);
  a.box(PX, 2.95, PZ, 8.8, 0.18, 7.4, WD2);
  eaves(a, PX, 3.1, PZ, 9.6, 8.2, 2, 0.3, 0.55, RF, RF2);

  // второй этаж: золотые стены, балкон с золотыми перилами
  a.box(PX, 3.7, PZ, 7.4, 0.2, 6.2, G2);
  a.box(PX, 3.9, PZ, 6.2, 2.4, 5, G);
  for (const [sx, sz] of CORNERS) a.box(PX + sx * 3.1, 3.9, PZ + sz * 2.5, 0.35, 2.4, 0.35, G3);
  for (const side of SIDES) {
    const off = side[0] ? 3.1 : 2.5;
    const us = side[0] ? [-1.2, 1.2] : [-2, 0, 2];
    for (const u of us) {
      fbox(a, PX, PZ, side, u, 4.4, off + 0.05, 1.3, 1.4, 0.1, DK);
      fbox(a, PX, PZ, side, u, 4.4, off + 0.1, 0.12, 1.4, 0.1, G3);
      fbox(a, PX, PZ, side, u, 5.05, off + 0.1, 1.3, 0.1, 0.1, G3);
      fbox(a, PX, PZ, side, u, 5.8, off + 0.1, 1.5, 0.12, 0.12, G3);
    }
    // перила балкона
    const bo = side[0] ? 3.65 : 3.05;
    fbox(a, PX, PZ, side, 0, 4.4, bo, side[0] ? 6.2 : 7.4, 0.12, 0.12, G3);
    for (let k = -3; k <= 3; k++) fbox(a, PX, PZ, side, k * (side[0] ? 0.85 : 1.05), 3.9, bo, 0.1, 0.5, 0.1, G2);
  }
  a.box(PX, 6.1, PZ, 6.4, 0.2, 5.2, G2);
  eaves(a, PX, 6.3, PZ, 8.8, 7.6, 2, 0.3, 0.55, RF, RF2);

  // третий этаж: золотая беседка с колоколовидными окнами
  a.box(PX, 6.9, PZ, 4.6, 2.2, 4.6, G);
  a.box(PX, 6.9, PZ, 5.4, 0.15, 5.4, G2);
  for (const side of SIDES) {
    fbox(a, PX, PZ, side, 0, 7, 2.35, 1, 1.7, 0.1, DK);
    fbox(a, PX, PZ, side, 0, 7, 2.4, 1.2, 0.12, 0.1, G3);
    fbox(a, PX, PZ, side, 0, 7, 2.4, 0.1, 1.7, 0.1, G3);
    for (const u of [-1.45, 1.45]) {
      fbox(a, PX, PZ, side, u, 7.4, 2.35, 0.8, 0.8, 0.1, DK); // окно-колокол
      fbox(a, PX, PZ, side, u, 8.2, 2.35, 0.55, 0.3, 0.1, DK);
      fbox(a, PX, PZ, side, u, 8.5, 2.35, 0.25, 0.25, 0.1, DK);
    }
  }
  a.box(PX, 8.95, PZ, 4.9, 0.2, 4.9, G2);
  const yTop = eaves(a, PX, 9.15, PZ, 7.2, 7.2, 4, 0.35, 0.8, RF, RF2);
  a.box(PX, yTop, PZ, 1, 0.4, 1, RF2);
  // золотой феникс
  a.box(PX, yTop + 0.4, PZ, 0.45, 0.5, 0.45, G);
  a.box(PX, yTop + 0.9, PZ, 0.6, 0.7, 1.2, G);
  a.box(PX, yTop + 1.4, PZ - 0.6, 0.35, 0.6, 0.4, G3);
  a.box(PX, yTop + 1.75, PZ - 0.9, 0.15, 0.15, 0.35, G2);
  for (const sx of [-1, 1]) a.box(PX + sx * 0.65, yTop + 1.2, PZ + 0.1, 1.1, 0.15, 0.8, G3, 0, 0, sx * 0.5);
  a.box(PX, yTop + 1.3, PZ + 0.8, 0.2, 1.1, 0.8, G3, 0, -0.5);
  a.solid(PX, PZ, 4, 3.3);

  // лодочный домик сбоку
  const BX = PX - 5;
  const BZ = PZ - 0.8;
  for (const [sx, sz] of CORNERS) a.box(BX + sx * 0.9, 0, BZ + sz * 1, 0.2, 0.5, 0.2, WD);
  a.box(BX, 0.4, BZ, 2.2, 0.2, 2.4, WD2);
  a.box(BX, 0.6, BZ, 1.8, 1.2, 2, WW);
  fbox(a, BX, BZ, [-1, 0], 0, 0.6, 0.95, 1, 0.9, 0.1, WD);
  eaves(a, BX, 1.8, BZ, 2.8, 3, 2, 0.22, 0.35, RF, RF2);

  // островки с камнями и сосенками
  for (const [x, z, s] of [[-5.2, -3.8, 0.75], [4.8, -5.6, 0.6], [-1.8, -7.4, 0]]) {
    a.box(x, 0, z, 2.6, 0.6, 2, ST);
    a.box(x + 0.4, 0.6, z - 0.1, 1.6, 0.4, 1.2, ST2);
    a.box(x - 0.8, 0, z + 0.7, 1, 0.9, 0.9, ST2, 0.4);
    if (s) pine(a, x - 0.3, z, 2.2, s);
  }
  // берег: сад с кленами, сакурой и соснами, каменный фонарь
  sakura(a, -8.2, 6.2, 0.8);
  tree(a, 7, 7.4, 0, 2, 2.2, 0x5a3a24, 0xd8482a); // осенний клён
  tree(a, -5.2, 8.4, 0, 1.8, 2, 0x5a3a24, 0xe06a2a);
  pine(a, 2.5, 9.6, 3, 0.8);
  pine(a, 9.6, 3.6, 2.6, 0.7);
  tree(a, -9.6, 0.5, 0, 1.6, 1.8, 0x5a3a24, 0x2f5f3a);
  toro(a, 6.2, -9.4);
  toro(a, -6.4, -9.2);
  for (const [x, z] of [[-10.2, -3], [9.8, -5.5], [-3.5, -9.6], [3.2, -9.7]]) a.box(x, 0, z, 1.1, 0.6, 0.9, ST2, x * 0.3);
}

/* ---------- Камбоджа: Ангкор-Ват — пять башен-бутонов лотоса, галереи с колоннами, ров и мост с нагами ---------- */
function angkor(a) {
  const S = 0x9a8e76;
  const S2 = 0x857a64;
  const S3 = 0x70675a;
  const S4 = 0xa89c84;
  const GAL = 0x4a4236; // тень в галереях за колоннами
  const LAT = 0x9a6a4a; // латерит
  const DK = 0x2e2a22;
  const TZ = 1.5; // центр храма
  // ров вокруг храма
  for (const sz of [-1, 1]) a.box(0, 0, sz * 11.9, 25.6, 0.2, 1.8, WATER);
  for (const sx of [-1, 1]) a.box(sx * 11.9, 0, 0, 1.8, 0.2, 22, WATER);
  // мост через ров с перилами-нагами и семиголовыми змеями на входе
  a.box(0, 0, -11.9, 2.6, 0.45, 2.6, S2);
  for (const sx of [-1, 1]) {
    a.box(sx * 1.2, 0.45, -11.9, 0.3, 0.45, 2.6, S3);
    a.box(sx * 1.2, 0.45, -13.3, 0.5, 0.8, 0.5, S3);
    for (let k = 0; k <= 6; k++) {
      const th = (k * Math.PI) / 6;
      a.box(sx * 1.2 + Math.cos(th) * 0.75, 0.9 + Math.sin(th) * 0.75, -13.3, 0.4, 0.45, 0.4, k === 3 ? S4 : S);
    }
  }
  // латеритовая ограда и западные ворота-гопура с тремя башенками
  a.box(0, 0, 10.2, 20.9, 1.2, 0.5, LAT);
  for (const sx of [-1, 1]) {
    a.box(sx * 10.2, 0, 0, 0.5, 1.2, 20.4, LAT);
    a.box(sx * 6.7, 0, -10.2, 7.5, 1.2, 0.5, LAT);
    a.box(sx * 6.7, 1.2, -10.2, 7.5, 0.2, 0.7, S3);
    a.solid(sx * 10.2, 0, 0.3, 10.2);
    a.solid(sx * 6.7, -10.2, 3.75, 0.3);
    a.box(sx * 2, 0, -10.2, 2, 2.4, 1.6, S);
    a.box(sx * 1.05, 0, -11.02, 0.3, 2, 0.15, S4);
    a.solid(sx * 2, -10.2, 1, 0.8);
    stack(a, sx * 2.2, 3.15, -10.2, [1.2, 1.2, 1, 0.8, 0.5, 0.25], 0.4, S, S2);
  }
  a.solid(0, 10.2, 10.4, 0.3);
  a.box(0, 2, -10.2, 2.2, 0.5, 1.6, S2);
  a.box(0, 2.4, -10.2, 6.4, 0.4, 2, S3);
  a.box(0, 2.8, -10.2, 5.6, 0.35, 1.7, S2);
  stack(a, 0, 3.15, -10.2, [1.6, 1.7, 1.5, 1.2, 0.9, 0.6, 0.3], 0.5, S, S2);
  // дорога к храму, пруды с лотосами и две «библиотеки»
  a.box(0, 0, -8.75, 2, 0.3, 2.7, S2);
  for (const sx of [-1, 1]) {
    a.box(sx * 1, 0.3, -8.75, 0.2, 0.3, 2.7, S3);
    a.box(sx * 4.6, 0, -8.75, 4, 0.15, 2.2, WATER);
    for (const [dx, dz] of [[-1, 0.4], [0.3, -0.5], [1.2, 0.3]]) {
      a.box(sx * 4.6 + dx, 0.15, -8.75 + dz, 0.7, 0.05, 0.7, 0x4f9a50);
      a.box(sx * 4.6 + dx, 0.2, -8.75 + dz, 0.25, 0.25, 0.25, 0xf2a6c2);
    }
    const LX = sx * 8.2;
    a.box(LX, 0, -8.2, 2.4, 1.6, 2, S);
    fbox(a, LX, -8.2, [0, -1], 0, 0, 1.02, 0.6, 1.1, 0.1, DK);
    a.box(LX, 1.6, -8.2, 2.8, 0.35, 2.4, S3);
    a.box(LX, 1.95, -8.2, 2, 0.35, 1.6, S2);
    a.box(LX, 2.3, -8.2, 0.8, 0.6, 0.8, S4);
    a.solid(LX, -8.2, 1.2, 1);
  }

  // первая терраса: галерея с колоннами и вход с крыльцом
  a.box(0, 0, TZ, 16.4, 0.35, 14.4, S3);
  a.box(0, 0, TZ, 16, 1, 14, S2);
  a.box(0, 1, TZ, 14.6, 2.2, 12.6, GAL);
  const colonnade = (y0, h, hx, hz, step, skipMid) => {
    for (const side of SIDES) {
      const off = side[0] ? hx : hz;
      const half = side[0] ? hz : hx;
      const n = Math.floor((2 * half) / step);
      for (let i = 0; i <= n; i++) {
        const u = -half + (i * 2 * half) / n;
        if (skipMid && Math.abs(u) < step * 0.6) continue;
        fbox(a, 0, TZ, side, u, y0, off, 0.45, h, 0.45, S4);
      }
    }
  };
  colonnade(1, 2.2, 7.5, 6.5, 2.1, true);
  a.box(0, 3.2, TZ, 15.6, 0.4, 13.6, S3);
  a.box(0, 3.6, TZ, 14.4, 0.45, 12.4, S2);
  a.box(0, 1, TZ - 6.9, 3, 2.6, 1.6, S);
  fbox(a, 0, TZ - 6.9, [0, -1], 0, 1, 0.82, 1, 1.8, 0.1, DK);
  a.box(0, 3.6, TZ - 6.9, 3.4, 0.4, 2, S3);
  a.box(0, 4, TZ - 6.9, 2.4, 0.4, 1.6, S2);
  a.box(0, 4.4, TZ - 6.9, 1.2, 0.5, 1.2, S4);
  [0.33, 0.66, 1].forEach((h, k) => a.box(0, 0, TZ - 8.9 + k * 0.4, 2.4, h, 0.4, S4));
  a.solid(0, TZ, 8, 7);

  // вторая терраса с галереей
  a.box(0, 1, TZ, 12.4, 3.6, 11, S);
  a.box(0, 2.4, TZ, 12.7, 0.3, 11.3, S3);
  a.box(0, 4.6, TZ, 11, 1.8, 9.6, GAL);
  colonnade(4.6, 1.8, 5.9, 5.15, 2.2, false);
  a.box(0, 6.4, TZ, 12, 0.4, 10.6, S3);
  a.box(0, 6.8, TZ, 10.8, 0.4, 9.4, S2);

  // третья, самая высокая терраса: крутые лестницы на все стороны
  a.box(0, 1, TZ, 9, 7.6, 9, S2);
  a.box(0, 7.6, TZ, 9.3, 0.3, 9.3, S3);
  a.box(0, 8.6, TZ, 8, 1.8, 8, GAL);
  colonnade(8.6, 1.8, 4.4, 4.4, 1.5, true);
  a.box(0, 10.4, TZ, 9, 0.4, 9, S3);
  a.box(0, 10.8, TZ, 7.8, 0.4, 7.8, S2);
  for (const side of SIDES) {
    for (let k = 0; k < 6; k++) fbox(a, 0, TZ, side, 0, 7.2, 4.65 + (5 - k) * 0.3, 1.6, 0.5 * (k + 1), 0.3, S4);
    fbox(a, 0, TZ, side, 0, 8.6, 4.4, 1.6, 1.8, 0.6, S);
    fbox(a, 0, TZ, side, 0, 10.2, 4.55, 1.9, 0.9, 0.8, S4);
  }

  // пять башен-бутонов лотоса: четыре по углам и главная в центре
  const bud = (x, z, y0, s) => {
    a.box(x, y0, z, 2.8 * s, 2.6 * s, 2.8 * s, S);
    for (const side of SIDES) {
      fbox(a, x, z, side, 0, y0 + 0.3 * s, 1.4 * s, 0.9 * s, 1.7 * s, 0.12, DK);
      fbox(a, x, z, side, 0, y0 + 2 * s, 1.45 * s, 1.5 * s, 0.5 * s, 0.3 * s, S4);
    }
    let y = y0 + 2.6 * s;
    [3, 3.15, 3.05, 2.85, 2.55, 2.2, 1.85, 1.5, 1.15, 0.8, 0.5].forEach((w, i) => {
      if (w > 1) round(a, x, y, z, w * s, 0.85 * s, i % 2 ? S2 : S, i % 2 ? S : S4);
      else a.box(x, y, z, w * s, 0.85 * s, w * s, i % 2 ? S2 : S);
      if (i % 2 === 0 && i < 4) {
        for (const [sx, sz] of CORNERS) a.box(x + sx * w * s * 0.4, y + 0.85 * s, z + sz * w * s * 0.4, 0.35 * s, 0.45 * s, 0.35 * s, S4);
      }
      y += 0.85 * s;
    });
    a.box(x, y, z, 0.25 * s, 0.9 * s, 0.25 * s, S4);
  };
  for (const [sx, sz] of CORNERS) bud(sx * 3.3, TZ + sz * 3.3, 9.2, 0.85);
  bud(0, TZ, 9.2, 1.2);

  // сахарные пальмы за рвом
  palm(a, -15.2, -3.5, 5.5, 0.2, 0.3);
  palm(a, 15.2, -2.5, 5, 0.25, Math.PI);
  palm(a, -6, -14.8, 4.6, 0.2, 1.2);
  palm(a, 6.5, -14.6, 5.2, 0.2, 2);
}

/* ---------- Куала-Лумпур: башни Петронас — звёздные этажи, небесный мост, шпили и фонтаны перед входом ---------- */
function petronas(a) {
  const M = 0xd4dae0; // нержавеющая сталь
  const M2 = 0xb8c0c8;
  const M3 = 0xe8ecf0;
  const GL = 0x6a8aa8;
  const GL2 = 0x5a7a98;
  // восьмиконечная звезда в плане — два квадрата, повёрнутых на 45°
  const star = (x, z, y, w, h, c, c2 = c) => {
    a.box(x, y, z, w, h, w, c);
    a.box(x, y + 0.01, z, w, h - 0.02, w, c2, Q);
  };
  for (const sx of [-1, 1]) {
    const X = sx * 5;
    star(X, 0, 0, 6, 1.5, M2, M);
    a.box(X, 1.5, -3.9, 2.8, 0.2, 1.6, M3); // козырёк над входом
    for (const dx of [-1.2, 1.2]) a.box(X + dx, 0, -4.5, 0.15, 1.5, 0.15, M2);
    // главный ствол: стекло, стальные пояса этажей и рёбра на лучах звезды
    star(X, 0, 1.5, 4.8, 23.5, GL, GL2);
    for (let y = 2.6; y < 25; y += 1.3) star(X, 0, y, 5, 0.3, M, M2);
    for (let k = 0; k < 8; k++) rbox(a, X, 0, k * Q, 3.35, 1.5, 0.3, 23.5, 0.3, M3);
    // уступы, сужающиеся к небу
    let y = 25;
    for (const [w, h] of [[4.4, 4], [3.9, 3.5], [3.3, 2.7], [2.7, 2.2], [2.1, 1.6], [1.5, 1.2]]) {
      star(X, 0, y, w, h, GL, GL2);
      star(X, 0, y, w + 0.3, 0.35, M, M2);
      star(X, 0, y + h * 0.55, w + 0.15, 0.25, M, M2);
      y += h;
    }
    // шпиль: барабан, кольца, шар и игла
    round(a, X, y, 0, 1.2, 0.8, M, M2);
    a.box(X, y + 0.8, 0, 0.55, 3.2, 0.55, M3);
    for (const [dy, w] of [[1.2, 1.1], [2, 0.9], [2.8, 0.7]]) round(a, X, y + dy, 0, w, 0.2, M, M2);
    round(a, X, y + 3.6, 0, 0.9, 0.7, M3, M);
    a.box(X, y + 4.3, 0, 0.3, 3.2, 0.3, M3);
    a.box(X, y + 7.5, 0, 0.14, 1.4, 0.14, M3);
    a.solid(X, 0, 3);
    // пристройка-«спутник» сбоку
    const AX = sx * 7.6;
    const AZ = 3.2;
    star(AX, AZ, 0, 2.8, 1.5, M2);
    star(AX, AZ, 1.5, 2.4, 12.5, GL, GL2);
    for (let yb = 2.6; yb < 14; yb += 1.3) star(AX, AZ, yb, 2.55, 0.25, M, M2);
    star(AX, AZ, 14, 1.9, 1, GL);
    round(a, AX, 15, AZ, 1.1, 0.6, M, M2);
    a.solid(AX, AZ, 1.4);
  }
  // небесный мост на 41–42 этажах и его опоры-подкосы
  a.box(0, 15.4, 0, 5, 1.3, 1.5, M2);
  a.box(0, 15.7, 0, 5.05, 0.6, 1.56, GL);
  a.box(0, 16.7, 0, 5, 0.25, 1.3, M);
  a.box(0, 14.9, 0, 1.2, 0.5, 1.2, M2);
  for (const sx of [-1, 1]) beam(a, [sx * 0.4, 15.1, 0], [sx * 2.6, 10.5, 0], 0.35, M);

  // торговый центр позади
  a.box(0, 0, 5.4, 15, 2.2, 3.4, 0xe6dcc8);
  a.box(0, 0.7, 5.4, 15.1, 0.7, 3.5, GL);
  a.box(0, 2.2, 5.4, 13.6, 0.35, 2.8, M2);
  a.box(0, 2.55, 5.4, 3, 0.5, 1.6, GL2);
  a.solid(0, 5.4, 7.5, 1.7);
  // озеро с фонтанами перед входом
  a.box(0, 0, -7, 11, 0.2, 3.4, WATER);
  a.box(0, 0, -5.2, 11.2, 0.3, 0.25, M2);
  for (const x of [-3, 0, 3]) {
    a.box(x, 0.2, -7, 0.8, 0.2, 0.8, 0xc8ecf8);
    a.box(x, 0.2, -7, 0.25, x ? 1.4 : 2.2, 0.25, 0x9fd8f0);
    a.box(x, x ? 1.6 : 2.4, -7, 0.5, 0.25, 0.5, 0xc8ecf8);
  }
  // пальмы и флаг Малайзии
  for (const sx of [-1, 1]) {
    palm(a, sx * 7.5, -3, 4.6, 0.2, sx > 0 ? 0 : Math.PI);
    palm(a, sx * 5.9, -6.2, 4, 0.25, sx > 0 ? -0.5 : Math.PI + 0.5);
  }
  const MY = ['BYBBRRRR', 'YBYBWWWW', 'BYBBRRRR', 'WWWWWWWW', 'RRRRRRRR'];
  flag(a, -1.6, 0, -4.6, MY, { B: 0x1a3a8a, Y: 0xf2c81e, R: 0xcc1f2a, W: 0xf8f8f8 }, 0.4);
}

/* ---------- Сингапур: Марина Бэй Сэндс — три башни-«ноги» под кораблём-парком, бассейн на крыше, музей-лотос и супердеревья ---------- */
function marinaBay(a) {
  const G = 0xd6dee4;
  const G2 = 0xa9bccb; // полосы стекла между этажами
  const GL = 0x7a9ab4;
  const GL2 = 0x5a7a96;
  const DK = 0x3a4a58;
  const SP = 0x8a96a2; // корпус небесного парка
  const SP2 = 0xa8b2bc;
  const DECK = 0xe8e0d0;
  const POOL = 0x5ad0f0;
  const WH = 0xf4f4f4;
  // три башни: прямая нога сзади и изогнутая спереди сходятся под крышей
  const zc = (y) => -0.6 - 2.8 * (1 - y / 30) ** 2;
  for (const X of [-7, 0, 7]) {
    a.box(X, 0, -0.8, 4.8, 0.4, 7.4, DK);
    for (let s = 0; s < 12; s++) a.box(X, 0.4 + s * 2.5, 1.5, 4.6, 2.5, 2.2, s % 2 ? G : G2);
    for (let s = 0; s < 12; s++) {
      const y0 = s * 2.5;
      const z0 = zc(y0);
      const z1 = zc(y0 + 2.5);
      const L = Math.hypot(2.5, z1 - z0);
      a.box(X, 0.4 + y0 + 1.25 - L / 2, (z0 + z1) / 2, 4.6, L + 0.05, 2.2, s % 2 ? G : G2, 0, Math.atan2(z1 - z0, 2.5));
    }
    a.box(X, 0.4, -1, 3.6, 12, 2.6, GL2); // стеклянный атриум между ногами
    for (const u of [-1.2, 1.2]) a.box(X + u, 0.4, 2.62, 0.14, 30, 0.1, GL2); // вертикальные швы фасада
    a.box(X, 0.4, 2.65, 0.3, 30, 0.12, GL); // шов на заднем фасаде
    a.box(X, 0.4, -4.55, 1.6, 1.6, 0.12, GL2); // вход
    a.solid(X, -0.8, 2.4, 3.7);
  }
  // небесный парк: длинный «корабль» с консолью над пустотой
  const SY = 30.4;
  a.box(1.5, SY - 0.6, 0, 22, 0.6, 3.6, SP2);
  a.box(2, SY, 0, 25, 1.3, 5, SP);
  a.box(2, SY + 0.5, 0, 25.1, 0.25, 5.1, DK);
  a.box(13.6, SY + 0.2, 0, 2, 1.3, 4.6, SP, 0, 0, 0.15);
  a.box(2, SY + 1.3, 0, 24.4, 0.15, 4.6, DECK);
  // бассейн-«инфинити» с шезлонгами и зонтиками
  a.box(-0.5, SY + 1.45, -1.3, 17, 0.1, 1.8, POOL);
  a.box(-0.5, SY + 1.45, -2.28, 17.2, 0.25, 0.12, 0xc8ecf8);
  for (let i = 0; i < 11; i++) a.box(-8 + i * 1.5, SY + 1.45, 0.2, 0.4, 0.14, 0.8, WH);
  [0xe8483a, 0xf2c81e, 0xe8483a, 0xf2c81e].forEach((c, i) => {
    const x = -7.2 + i * 4.2;
    a.box(x, SY + 1.45, 0.9, 0.08, 0.9, 0.08, 0x8a8a8a);
    a.box(x, SY + 2.35, 0.9, 0.9, 0.12, 0.9, c);
  });
  a.box(2.4, SY + 1.45, 1.3, 5, 0.9, 1.8, GL);
  a.box(2.4, SY + 2.35, 1.3, 5.3, 0.15, 2, G);
  for (const x of [-9.4, -6, 8.4, 11.2]) {
    a.box(x, SY + 1.45, 1.6, 0.2, 1.4, 0.2, 0x8a6a48);
    for (let k = 0; k < 4; k++) rbox(a, x, 1.6, (k * TAU) / 4 + 0.4, 0.5, SY + 2.7, 0.3, 0.1, 1.2, k % 2 ? 0x3f9a44 : 0x35883a, -0.35);
  }

  // торговая галерея со стеклянными волнами крыш
  a.box(3, 0, -6.3, 17, 2, 3.4, 0xe8e0d0);
  a.box(3, 0.3, -8.05, 16.6, 1.2, 0.1, GL2);
  for (const x of [-2, 3.5, 9]) {
    a.box(x, 2, -6.3, 4.6, 0.5, 3, GL);
    a.box(x, 2.5, -6.3, 3, 0.45, 2.6, GL2);
    a.box(x, 2.95, -6.3, 1.4, 0.3, 2.2, GL);
  }
  a.solid(3, -6.3, 8.5, 1.7);
  // залив Марина-Бэй
  a.box(1, 0, -10.6, 15, 0.2, 3.6, WATER);
  // музей науки и искусства — белый цветок лотоса на пруду
  const AX = -9.5;
  const AZ = -6.2;
  a.box(AX, 0, AZ, 5, 0.18, 5, WATER);
  disk(a, AX, 0.18, AZ, 1.5, 1, 0xe4e0d8);
  [3.2, 3.8, 4.4, 4, 3.4, 2.8, 2.4, 2.8, 3].forEach((L, k) => {
    rbox(a, AX, AZ, (k / 9) * TAU + 0.3, 1.1, 0.7, 1.1, L, 0.45, k % 2 ? 0xf4f2ee : 0xe4e0d8, -0.42);
  });
  a.solid(AX, AZ, 1.6);

  // супердеревья из «Садов у залива» и подвесной мостик между ними
  const supertree = (x, z, h) => {
    const PK = 0xb04a9a;
    const PK2 = 0x8a3a8a;
    a.box(x, 0, z, 1.4, 1.2, 1.4, PK2);
    a.box(x, 1.2, z, 1, h * 0.45, 1, PK);
    a.box(x, 1.2 + h * 0.45, z, 0.8, h * 0.55 - 1.8, 0.8, PK2);
    for (let yb = 2.5; yb < h - 1.5; yb += 1.8) a.box(x, yb, z, 1.15, 0.2, 1.15, 0xd070c0, Q);
    for (let k = 0; k < 8; k++) {
      const ang = (k * TAU) / 8;
      rbox(a, x, z, ang, 1.2, h - 0.8, 0.3, 0.3, 2.4, PK, 0.45);
      rbox(a, x, z, ang + Math.PI / 8, 2.2, h - 0.3, 1.7, 0.3, 0.3, PK2);
      if (k % 2) rbox(a, x, z, ang + Math.PI / 8, 2.3, h, 0.25, 0.25, 0.25, 0xffe070);
    }
    a.solid(x, z, 0.7);
  };
  supertree(-7.5, 8.2, 11);
  supertree(0.5, 10.6, 9);
  supertree(7.5, 9.2, 10);
  beam(a, [-7.5, 7.4, 8.2], [0.5, 7.4, 10.6], 0.3, 0xe0e4e8);
  // пальмы по краям
  palm(a, 12.4, -3, 4.8, 0.2, 0);
  palm(a, -12, -1.4, 4.4, 0.2, Math.PI);
}

/* ---------- Сингапур: Мерлайон — лев-рыба на гребне волны, струя из пасти в залив, малыш-мерлайон ---------- */
function merlion(a) {
  const W = 0xf0ece2; // белый бетон
  const W2 = 0xdcd5c6;
  const W3 = 0xc8c0b0; // чешуя и грива
  const DK = 0x2a2a2a;
  const ST = 0x9a958a;
  const ST2 = 0x8a8578;
  const JET = 0x9fd8f0;
  const JET2 = 0xc8ecf8;
  // залив перед статуей и набережная с перилами
  a.box(0, 0, -7, 11, 0.2, 4.2, WATER);
  a.box(0, 0, -7.5, 7, 0.2, 5.2, WATER);
  a.box(0, 0, -4.7, 11, 0.5, 0.4, ST2);
  for (let i = 0; i < 9; i++) if (Math.abs(i - 4) > 1) a.box(-5.2 + i * 1.3, 0.5, -4.7, 0.15, 0.8, 0.15, 0x6a6a6a);
  for (const sx of [-1, 1]) a.box(sx * 3.9, 1.25, -4.7, 2.8, 0.1, 0.1, 0x6a6a6a);

  // постамент-гребень волны
  a.box(0, 0, 0.6, 6, 1, 6, ST);
  a.box(0, 1, 0.6, 5, 0.8, 5, W3);
  for (let k = 0; k < 10; k++) rbox(a, 0, 0.6, (k * TAU) / 10, 2.5, 1.3, 1.3, 0.7, 0.8, k % 2 ? W : W2, 0.5);
  // рыбье тело в чешуе
  a.box(0, 1.8, 1.2, 3.4, 2.8, 3.4, W);
  a.box(0, 4.4, 0.5, 3.2, 2.4, 3, W);
  for (const sx of [-1, 1]) {
    for (let r = 0; r < 7; r++) {
      const y = 2.1 + r * 0.6;
      for (let c = 0; c < 4; c++) {
        const z = (y < 4.4 ? -0.2 : -0.7) + c * 0.75 + (r % 2) * 0.35;
        const off = y < 4.4 ? 1.72 : 1.62;
        a.box(sx * off, y, z, 0.1, 0.35, 0.5, W3);
      }
    }
    a.box(sx * 1.9, 3.4, 0.2, 0.3, 1.2, 1.4, W2, 0, 0.5, sx * 0.4); // плавник
  }
  // хвост закручивается вверх за спиной
  polyline(a, [[0, 2.6, 2.6], [0, 3.4, 3.9], [0, 4.8, 4.6], [0, 6.3, 4.7], [0, 7.4, 4.1]], 1.2, W);
  a.box(0, 7, 3.3, 0.35, 1.6, 1, W2, 0, 0.6);
  a.box(0, 7.3, 4.5, 0.35, 1.5, 1, W2, 0, -0.5);

  // львиная голова с кудрявой гривой
  a.box(0, 6.2, 0.3, 4.6, 4.6, 2.2, W2);
  for (let k = 0; k < 14; k++) {
    const th = (k * TAU) / 14;
    if (Math.sin(th) < -0.75) continue;
    a.box(Math.cos(th) * 2.35, 8.3 + Math.sin(th) * 2.3 - 0.4, -0.5, 0.9, 0.8, 1.2, k % 2 ? W3 : W2, 0, 0, th);
  }
  a.box(0, 6.8, -0.9, 3.2, 3.4, 1.6, W);
  a.box(0, 9.4, -1.8, 3, 0.4, 0.4, W2); // надбровье
  for (const sx of [-1, 1]) {
    a.box(sx * 0.75, 8.6, -1.75, 0.65, 0.5, 0.12, 0xffffff);
    a.box(sx * 0.75, 8.65, -1.83, 0.3, 0.35, 0.08, DK);
    a.box(sx * 1.3, 10.1, -0.8, 0.6, 0.7, 0.5, W2); // ушки
    a.box(sx * 1.3, 7.4, -1.8, 0.5, 0.5, 0.3, W2); // щёки
  }
  a.box(0, 7.6, -2.05, 1.9, 1, 0.8, W); // морда
  a.box(0, 8.2, -2.3, 0.8, 0.45, 0.5, W3); // нос
  a.box(0, 7.1, -2.2, 1.6, 0.5, 0.7, DK); // открытая пасть
  for (const sx of [-1, 1]) a.box(sx * 0.5, 7.25, -2.5, 0.2, 0.35, 0.15, 0xffffff); // клыки
  a.box(0, 6.75, -1.95, 1.7, 0.35, 0.8, W); // нижняя челюсть
  // струя из пасти: фонтан-частицы и дуга из голубых блоков
  const spout = a.group(0, 7.35, -2.6);
  spout.userData.fountain = [0, -7];
  const pts = [0, 1, 2, 3, 4, 5, 5.7].map((d) => [0, 7.35 + 0.35 * d - 0.28 * d * d, -2.55 - d]);
  polyline(a, pts, 0.4, JET);
  a.box(0, 0.2, -8.25, 1.2, 0.25, 1.2, JET2);
  a.box(0, 0.2, -8.25, 1.2, 0.18, 1.2, JET, Q);
  a.solid(0, 0.8, 3, 3.6);

  // малыш-мерлайон позади
  const CX = 4.3;
  const CZ = 4.6;
  a.box(CX, 0, CZ, 1.6, 0.6, 1.6, ST);
  a.box(CX, 0.6, CZ + 0.2, 1, 1.2, 1, W);
  a.box(CX, 1.8, CZ - 0.1, 1.4, 1.3, 0.8, W2);
  a.box(CX, 1.9, CZ - 0.3, 0.9, 0.9, 0.6, W);
  for (const sx of [-1, 1]) a.box(CX + sx * 0.22, 2.4, CZ - 0.62, 0.18, 0.18, 0.06, DK);
  a.box(CX, 2.05, CZ - 0.62, 0.4, 0.15, 0.06, DK);
  a.box(CX, 1, CZ + 0.9, 0.3, 1, 0.5, W2, 0, -0.4);
  a.solid(CX, CZ, 0.8);

  // фонари, пальмы и флаг Сингапура
  for (const sx of [-1, 1]) {
    const x = sx * 4.6;
    a.box(x, 0, -3.8, 0.4, 0.3, 0.4, 0x3a3a3a);
    a.box(x, 0.3, -3.8, 0.18, 3, 0.18, 0x3a3a3a);
    a.box(x, 3.3, -3.8, 0.55, 0.55, 0.55, 0xfff2c0);
    a.box(x, 3.85, -3.8, 0.7, 0.15, 0.7, 0x3a3a3a);
    a.solid(x, -3.8, 0.3);
  }
  palm(a, -5.4, 3.6, 5, 0.2, 2.5);
  palm(a, 5.8, -0.6, 4.4, 0.2, 0.3);
  palm(a, -3.4, 7, 4.2, 0.25, 1.8);
  const SG = ['RWRRRRRRR', 'WRWRRRRRR', 'RWRRRRRRR', 'WWWWWWWWW', 'WWWWWWWWW'];
  flag(a, -7.2, 0, -1.6, SG, { R: 0xe0242c, W: 0xf8f8f8 }, 0.3);
}

/* ---------- Пекин: Запретный город — Зал Высшей Гармонии на мраморных террасах, Золотая река и ворота ---------- */
function forbidden(a) {
  const RD = 0xb02a22;
  const RD2 = 0x8e2019;
  const Y = 0xf0c030; // жёлтая императорская черепица
  const Y2 = 0xd8a820;
  const Y3 = 0xc89418;
  const MB = 0xf2eee6; // белый мрамор
  const MB2 = 0xdcd6ca;
  const MB3 = 0xc8c2b4;
  const TE = 0x2f7a80; // бирюзовая роспись под карнизами
  const BL = 0x2f5a9a;
  const DK = 0x2a2220;
  const BZ = 0x5a4a3a; // бронза
  const BZ2 = 0x4a3c30;
  const HZ = 3.5; // центр террас; зал смотрит на юг (−z)

  // три мраморные террасы с балюстрадами
  [[19, 11.5], [17.4, 10.2], [15.8, 9]].forEach(([w, d], i) => {
    a.box(0, i, HZ, w, 1, d, i % 2 ? MB2 : MB);
    a.box(0, i + 0.85, HZ, w + 0.2, 0.15, d + 0.2, MB3);
    const hw = w / 2 - 0.1;
    const hd = d / 2 - 0.1;
    const y = i + 1;
    a.box(0, y, HZ + hd, 2 * hw, 0.4, 0.14, MB2);
    for (const sx of [-1, 1]) {
      a.box(sx * hw, y, HZ, 0.14, 0.4, 2 * hd, MB2);
      a.box((sx * (hw + 1.8)) / 2, y, HZ - hd, hw - 1.8, 0.4, 0.14, MB2);
    }
    if (i === 1) return;
    const n = Math.round((2 * hw) / 1.6);
    for (let k = 0; k <= n; k++) {
      const x = -hw + (k * 2 * hw) / n;
      a.box(x, y, HZ + hd, 0.24, 0.65, 0.24, MB);
      if (Math.abs(x) > 1.8) a.box(x, y, HZ - hd, 0.24, 0.65, 0.24, MB);
    }
    const m = Math.round((2 * hd) / 1.6);
    for (let k = 1; k < m; k++) {
      for (const sx of [-1, 1]) a.box(sx * hw, y, HZ - hd + (k * 2 * hd) / m, 0.24, 0.65, 0.24, MB);
    }
  });
  // парадная лестница и резной «драконий» пандус посередине
  a.box(0, 0, HZ - 5.1, 3.4, 3, 1.4, MB2);
  for (let k = 0; k < 6; k++) a.box(0, 0, HZ - 5.975 - k * 0.45, 3.4, 3 - k * 0.5, 0.45, k % 2 ? MB2 : MB);
  a.box(0, 1.575, HZ - 7.25, 1.3, 0.2, 4, MB3, 0, -0.759);
  a.solid(0, HZ, 9.5, 5.75);

  // Зал Высшей Гармонии
  const HB = HZ + 0.3;
  a.box(0, 3, HB, 13.4, 0.3, 7, MB3);
  a.box(0, 3.3, HB + 0.6, 12, 3.6, 5.2, RD);
  for (let i = 0; i < 12; i++) a.box(-5.9 + (i * 11.8) / 11, 3.3, HB - 2.9, 0.5, 3.6, 0.5, RD2);
  for (let i = 0; i < 11; i++) {
    const x = -5.36 + (i * 10.72) / 10;
    a.box(x, 3.4, HB - 2.05, 0.85, 3, 0.1, 0xc0402a); // двери
    a.box(x, 4.7, HB - 2.12, 0.7, 1.5, 0.06, Y2); // золотая решётка
  }
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) a.box(sx * 6.3, 3.3, HB - 2.9 + k * 1.9, 0.5, 3.6, 0.5, RD2);
  // расписной пояс и кронштейны-доугуны под карнизом
  a.box(0, 6.9, HB, 13.2, 0.4, 6.8, TE);
  a.box(0, 7.02, HB, 13.3, 0.16, 6.9, BL);
  for (let x = -5.5; x <= 5.6; x += 2.2) a.box(x, 6.95, HB - 3.46, 0.5, 0.3, 0.06, Y);
  for (let i = 0; i < 13; i++) a.box(-6 + i, 7.3, HB - 3.5, 0.35, 0.3, 0.5, i % 2 ? TE : BL);
  for (const sx of [-1, 1]) for (let k = 0; k < 6; k++) a.box(sx * 6.75, 7.3, HB - 2.5 + k, 0.5, 0.3, 0.35, k % 2 ? TE : BL);
  // двойная крыша: юбка-карниз, верхний этаж и вальмовая крыша
  eaves(a, 0, 7.6, HB, 16.4, 9.6, 2, 0.35, 0.7, Y, Y2, Y);
  a.box(0, 8.3, HB, 11, 1.4, 5, RD);
  a.box(0, 9.3, HB, 11.2, 0.4, 5.2, TE);
  const top = eaves(a, 0, 9.7, HB, 14.8, 8.8, 5, 0.45, 0.75, Y, Y2, Y);
  a.box(0, top, HB, 9.4, 0.5, 0.6, Y3);
  for (const sx of [-1, 1]) {
    // драконы-чивэнь на концах конька
    a.box(sx * 4.9, top, HB, 0.6, 1.4, 0.8, Y3);
    a.box(sx * 5.2, top + 0.95, HB, 0.5, 0.5, 0.6, Y3);
    a.box(sx * 4.6, top + 1.15, HB, 0.3, 0.4, 0.3, Y3);
    // рёбра крыши с фигурками зверей
    for (const sz of [-1, 1]) {
      const p = [sx * 4.7, top + 0.1, HB];
      const q = [sx * 7.1, 10.1, HB + sz * 4.1];
      beam(a, p, q, 0.3, Y3);
      for (const t of [0.35, 0.55, 0.75]) a.box(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t + 0.1, p[2] + (q[2] - p[2]) * t, 0.3, 0.35, 0.3, Y3);
    }
  }
  // красные фонарики под карнизом
  for (const x of [-5.4, -2.2, 2.2, 5.4]) {
    a.box(x, 6.75, HB - 4.2, 0.06, 0.85, 0.06, DK);
    lantern(a, x, 5.9, HB - 4.2);
  }
  // бронзовые чаны, журавль и черепаха на верхней террасе
  for (const sx of [-1, 1]) {
    const x = sx * 7.2;
    const z = HB - 3.9;
    a.box(x, 3, z, 1, 0.9, 1, BZ);
    a.box(x, 3.05, z, 1, 0.8, 1, BZ2, Q);
    a.box(x, 3.9, z, 1.15, 0.15, 1.15, BZ2);
    for (const s of [-1, 1]) a.box(x + s * 0.55, 3.45, z, 0.1, 0.3, 0.3, Y);
  }
  const CR = -4.5;
  const CZ = HZ - 3.9;
  for (const s of [-1, 1]) a.box(CR + s * 0.12, 3, CZ, 0.08, 0.7, 0.08, BZ);
  a.box(CR, 3.7, CZ, 0.5, 0.45, 0.8, BZ);
  a.box(CR, 4.1, CZ - 0.35, 0.1, 0.8, 0.1, BZ);
  a.box(CR, 4.85, CZ - 0.45, 0.14, 0.14, 0.35, BZ);
  a.box(4.5, 3, CZ, 0.8, 0.45, 1, BZ);
  a.box(4.5, 3.45, CZ, 0.6, 0.2, 0.8, BZ2);
  a.box(4.5, 3.3, CZ - 0.65, 0.3, 0.45, 0.35, BZ);

  // Золотая река дугой через двор и три мраморных мостика
  const rz = (x) => -6.3 - 1.1 * (1 - (x / 9.6) ** 2);
  const xs = [-9.6, -6, -3, 0, 3, 6, 9.6];
  for (let i = 1; i < xs.length; i++) {
    const x0 = xs[i - 1];
    const x1 = xs[i];
    const z0 = rz(x0);
    const z1 = rz(x1);
    const L = Math.hypot(x1 - x0, z1 - z0);
    const yaw = yawAlong(x1 - x0, z1 - z0);
    const nx = -(z1 - z0) / L;
    const nz = (x1 - x0) / L;
    a.box((x0 + x1) / 2, 0, (z0 + z1) / 2, L + 0.1, 0.12, 1.3, WATER, yaw);
    for (const s of [-1, 1]) a.box((x0 + x1) / 2 + s * nx * 0.75, 0, (z0 + z1) / 2 + s * nz * 0.75, L + 0.1, 0.3, 0.2, MB2, yaw);
  }
  a.box(0, 0, -7.9, 2.2, 0.06, 6.4, MB2); // императорская дорога
  for (const x of [-2.6, 0, 2.6]) {
    const w = x ? 1.6 : 2.2;
    const z = rz(x);
    a.box(x, 0, z, w, 0.4, 2.8, MB);
    a.box(x, 0.4, z, w, 0.25, 1.6, MB);
    for (const s of [-1, 1]) a.box(x + s * (w / 2 - 0.06), 0.4, z, 0.12, 0.45, 2.8, MB2);
  }

  // южные ворота: красный павильон с проходом, двери с золотыми гвоздями
  const GZ = -11;
  a.box(0, 0, GZ, 2.2, 0.2, 3.2, MB3);
  for (const sx of [-1, 1]) {
    a.box(sx * 2.55, 0, GZ, 3.3, 0.8, 3, MB2);
    a.box(sx * 2.55, 0.8, GZ, 2.9, 3.4, 2.4, RD);
    a.box(sx * 2.55, 0.8, GZ - 1.22, 1.5, 2.3, 0.1, RD2);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) a.box(sx * 2.55 + (c - 1) * 0.42, 1.2 + r * 0.5, GZ - 1.3, 0.16, 0.16, 0.08, Y);
    a.solid(sx * 2.55, GZ, 1.6, 1.5);
    guardLion(a, sx * 2.2, GZ - 2.6, BZ, BZ2, 0.9);
  }
  a.box(0, 3, GZ, 2.3, 1.2, 2.4, RD);
  a.box(0, 3, GZ - 1.22, 1.5, 1.1, 0.06, Y);
  a.box(0, 3.1, GZ - 1.27, 1.3, 0.9, 0.1, BL);
  a.box(0, 4.2, GZ, 8.2, 0.4, 2.6, TE);
  eaves(a, 0, 4.6, GZ, 10.4, 4.4, 2, 0.3, 0.5, Y, Y2, Y);
  a.box(0, 5.2, GZ, 7, 0.8, 2.4, RD);
  a.box(0, 5.8, GZ, 7.2, 0.2, 2.5, TE);
  const gt = eaves(a, 0, 6, GZ, 9.6, 3.8, 4, 0.35, 0.45, Y, Y2, Y);
  a.box(0, gt, GZ, 6.6, 0.4, 0.5, Y3);
  for (const sx of [-1, 1]) a.box(sx * 3.4, gt, GZ, 0.5, 1, 0.6, Y3);

  // красные стены с жёлтой черепицей
  for (const sx of [-1, 1]) {
    a.box(sx * 7.6, 0, GZ, 6.8, 3.4, 1.2, RD);
    a.box(sx * 7.6, 3.4, GZ, 7.1, 0.35, 1.7, Y);
    a.box(sx * 7.6, 3.75, GZ, 7.1, 0.25, 0.5, Y2);
    a.solid(sx * 7.6, GZ, 3.4, 0.6);
    a.box(sx * 11, 0, -3, 1.2, 3.4, 16, RD);
    a.box(sx * 11, 3.4, -3, 1.7, 0.35, 16.3, Y);
    a.box(sx * 11, 3.75, -3, 0.5, 0.25, 16.3, Y2);
    a.solid(sx * 11, -3, 0.6, 8);
    cypress(a, sx * 4.5, 11.2, 4);
    cypress(a, sx * 9.4, 10.6, 3.6);
  }
}

/* ---------- Пекин: Храм Неба — круглый Зал молитв об урожае, три синие крыши на мраморной террасе ---------- */
function templeHeaven(a) {
  const MB = 0xf2eee6;
  const MB2 = 0xdcd6ca;
  const MB3 = 0xc8c2b4;
  const RD = 0xb02a22;
  const RD2 = 0x8e2019;
  const B = 0x2c4f94; // синяя глазурованная черепица
  const B2 = 0x24427e;
  const B3 = 0x3a60a8;
  const TE = 0x2f7a80;
  const G2 = 0xf2cc55;
  const LAT = 0xc88a2a; // золочёные решётки
  // трёхъярусная круглая терраса с балюстрадами
  const tiers = [[9, 24], [7.4, 20], [5.9, 16]];
  tiers.forEach(([R, n], i) => {
    disk(a, 0, i * 1.1, 0, R, 1.1, i % 2 ? MB2 : MB);
    const q = n / 4; // на четырёх сторонах света — проходы к лестницам
    const r = R - 0.15;
    for (let k = 0; k < n; k++) {
      const ang = (k / n) * TAU;
      if (k % q) rbox(a, 0, 0, ang, r, (i + 1) * 1.1, 0.24, 0.7, 0.24, MB);
      if (k % q && (k + 1) % q) {
        rbox(a, 0, 0, ang + Math.PI / n, r * Math.cos(Math.PI / n), (i + 1) * 1.1, 2 * r * Math.sin(Math.PI / n) + 0.05, 0.42, 0.14, MB2);
      }
    }
  });
  // лестницы на четыре стороны, на южной — резной пандус
  for (let d = 0; d < 4; d++) {
    const phi = (d * Math.PI) / 2;
    tiers.forEach(([R], i) => {
      for (let s = 0; s < 3; s++) rbox(a, 0, 0, phi, R + (2.5 - s) * 0.4, i * 1.1, 2.6, (s + 1) * 0.367, 0.42, s % 2 ? MB : MB2);
      if (d === 3) rbox(a, 0, 0, phi, R + 0.6, i * 1.1 + 0.5, 1, 0.2, 1.45, MB3, -0.65);
    });
  }

  // зал: двенадцать красных колонн и золочёные решётчатые двери
  const Y0 = 3.3;
  disk(a, 0, Y0, 0, 4.9, 0.3, MB3);
  disk(a, 0, Y0 + 0.3, 0, 4.05, 3.3, RD2, RD);
  for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * TAU;
    a.box(Math.cos(ang) * 4.5, Y0 + 0.3, Math.sin(ang) * 4.5, 0.45, 3.3, 0.45, RD);
    const m = ang + TAU / 24;
    rbox(a, 0, 0, m, 4.16, Y0 + 0.4, 1.7, 2.8, 0.1, 0xc84a2a);
    rbox(a, 0, 0, m, 4.21, Y0 + 1.5, 1.3, 1.4, 0.08, LAT);
  }
  // три яруса: золотой пояс, расписные кронштейны, синяя крыша с рёбрами и красный барабан
  const roofRing = (y, rb, rTop) => {
    disk(a, 0, y, 0, rTop + 0.2, 0.2, GOLD);
    disk(a, 0, y + 0.2, 0, rTop + 0.4, 0.45, TE, B);
    const rr = [rb, rb - 0.8, rb - 1.6];
    rr.forEach((R, i) => disk(a, 0, y + 0.65 + i * 0.38, 0, R, i ? 0.4 : 0.35, i % 2 ? B2 : B, i === 2 ? B3 : i ? B : B2));
    return y + 0.65 + 3 * 0.38;
  };
  let y = roofRing(Y0 + 3.6, 6.2, 4.2);
  for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * TAU + TAU / 24;
    rbox(a, 0, 0, ang, 5.3, 7.9, 0.22, 0.22, 2, B3, -0.49);
    rbox(a, 0, 0, ang, 6.2, 7.6, 0.25, 0.3, 0.3, G2);
  }
  disk(a, 0, y, 0, 3.5, 1.7, RD);
  for (let k = 0; k < 8; k++) rbox(a, 0, 0, (k * TAU) / 8 + TAU / 16, 3.56, y + 0.3, 1, 1.1, 0.08, LAT);
  const y2 = y + 1.7;
  y = roofRing(y2, 5.1, 3.5);
  for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * TAU;
    rbox(a, 0, 0, ang, 4.3, y2 + 1, 0.22, 0.22, 1.8, B3, -0.5);
  }
  disk(a, 0, y, 0, 2.6, 1.5, RD);
  for (let k = 0; k < 8; k++) rbox(a, 0, 0, (k * TAU) / 8, 2.66, y + 0.3, 0.8, 0.9, 0.08, LAT);
  y += 1.5;
  disk(a, 0, y, 0, 2.8, 0.2, GOLD);
  disk(a, 0, y + 0.2, 0, 3, 0.4, TE, B);
  y += 0.6;
  // верхняя коническая крыша и золотое навершие
  [4, 3.3, 2.6, 1.9, 1.2, 0.6].forEach((R, i) => disk(a, 0, y + i * 0.45, 0, R, 0.45, i % 2 ? B2 : B, B3));
  y += 2.7;
  disk(a, 0, y, 0, 0.5, 0.3, GOLD);
  round(a, 0, y + 0.3, 0, 0.9, 0.5, GOLD, G2);
  round(a, 0, y + 0.8, 0, 1.2, 0.6, GOLD, G2);
  round(a, 0, y + 1.4, 0, 0.9, 0.5, GOLD, G2);
  round(a, 0, y + 1.9, 0, 0.4, 0.5, GOLD);
  a.box(0, y + 2.4, 0, 0.2, 0.6, 0.2, GOLD);
  a.solid(0, 0, 6.4);
  // тёмные кипарисы по углам
  for (const [sx, sz] of CORNERS) cypress(a, sx * 10.2, sz * 6.2, 4.2);
}

/* ---------- Тайбэй: Тайбэй 101 — восемь «бамбуковых» секций, монеты-жуи, шпиль и скульптура LOVE ---------- */
function taipei(a) {
  const G = 0x5f9a96; // сине-зелёное стекло
  const G2 = 0x4f8a86;
  const G3 = 0x6fb0aa;
  const DK = 0x2f4a4c;
  const ST = 0xb8c0c4;
  const ST2 = 0x9aa4aa;
  const GD = 0xd9b24a;
  const GL = 0x7aa0b0;
  // сечение «плюсом»: квадрат с уступами на углах
  const plus = (y, w, h, c, c2 = c) => {
    a.box(0, y, 0, w, h, w * 0.78, c);
    a.box(0, y + 0.01, 0, w * 0.78, h - 0.02, w, c2);
  };
  // торговый центр позади
  a.box(0, 0, 3.8, 10.4, 2.6, 3.6, 0xc8ccd0);
  a.box(0, 1.1, 3.8, 10.5, 0.9, 3.7, GL);
  a.box(0, 2.6, 3.8, 9.6, 0.3, 3, ST2);
  a.solid(0, 3.8, 5.2, 1.8);
  // основание-пирамида, сужающееся кверху
  [9, 8.6, 8.2, 7.8, 7.4].forEach((w, i) => {
    plus(i * 3, w, 3, i % 2 ? G : G2, i % 2 ? G2 : G);
    plus(i * 3 + 2.85, w + 0.1, 0.15, DK);
  });
  // вход с козырьком
  a.box(0, 2.6, -5.3, 4.4, 0.3, 1.8, ST);
  for (const sx of [-1, 1]) a.box(sx * 2, 0, -6, 0.2, 2.6, 0.2, ST2);
  a.box(0, 0, -4.56, 3, 2.2, 0.12, DK);
  // золотые монеты-жуи на каждой грани
  for (const side of SIDES) {
    fbox(a, 0, 0, side, 0, 11.7, 3.75, 1.8, 1.8, 0.2, GD);
    fbox(a, 0, 0, side, 0, 11.7, 3.78, 1.8, 1.8, 0.2, GD, Q);
    fbox(a, 0, 0, side, 0, 12.25, 3.92, 0.7, 0.7, 0.1, DK);
  }
  a.solid(0, 0, 4.6);
  // восемь секций по восемь этажей: каждая расширяется кверху, как коробочка для еды
  let y = 15;
  for (let s = 0; s < 8; s++) {
    [5.8, 6.3, 6.8, 7.3].forEach((w, i) => plus(y + i * 1.3, w, 1.3, i === 3 ? G3 : i ? G : G2, i === 3 ? G : G2));
    for (const [sx, sz] of CORNERS) a.box(sx * 3, y + 4.4, sz * 3, 0.5, 0.8, 0.5, GD, Q); // золотые «драконы» на углах
    y += 5.2;
  }
  // верхушка и шпиль
  plus(y, 5.4, 1.2, DK);
  plus(y + 1.2, 4.6, 1.6, G, G2);
  plus(y + 2.8, 3.8, 1.6, G2, G);
  plus(y + 4.4, 3, 1.4, G3, G);
  y += 5.8;
  a.box(0, y, 0, 2.2, 1, 2.2, ST);
  a.box(0, y + 1, 0, 1.2, 2, 1.2, ST2);
  a.box(0, y + 3, 0, 0.8, 4, 0.8, ST);
  for (const dy of [3.6, 5.1, 6.6]) a.box(0, y + dy, 0, 1.1, 0.2, 1.1, ST2);
  a.box(0, y + 7, 0, 0.5, 4, 0.5, 0xd8dee4);
  a.box(0, y + 11, 0, 0.25, 2.6, 0.25, 0xe8ecf0);
  a.box(0, y + 13.6, 0, 0.3, 0.3, 0.3, 0xff4040);

  // красная скульптура LOVE на площади и деревья
  a.box(-4.15, 0, -5.9, 2.6, 0.5, 0.8, ST2);
  const LOVE = ['X...XXXX', 'X...X..X', 'X...X..X', 'XXXXXXXX', 'X..XXXXX', 'X..XXXX.', 'X..XX...', '.XX.XXXX'];
  pixels(a, LOVE, -5.2, 0.5, -5.9, 0.3, { X: 0xd8322a }, 0.5);
  a.solid(-4.15, -5.9, 1.3, 0.4);
  tree(a, 4.3, 0, -5.4, 1.4, 1.5, 0x5a3a24, 0x3f8f3a);
  tree(a, 5.6, 0, -3.2, 1.2, 1.3, 0x5a3a24, 0x4a9a44);
}

export const ASIA = [
  { id: 'tokyo', name: 'Токийская башня', country: 'Япония', size: 10, build: tokyoTower },
  { id: 'fuji', name: 'Гора Фудзи', country: 'Япония', size: 14.5, build: fuji },
  { id: 'buddha', name: 'Великий Будда', country: 'Япония', size: 8, build: buddha },
  { id: 'kinkaku', name: 'Золотой павильон', country: 'Япония', size: 10.5, build: kinkaku },
  { id: 'angkor', name: 'Ангкор-Ват', country: 'Камбоджа', size: 16, build: angkor },
  { id: 'petronas', name: 'Башни Петронас', country: 'Малайзия', size: 9, build: petronas },
  { id: 'marinabay', name: 'Марина Бэй Сэндс', country: 'Сингапур', size: 13, build: marinaBay },
  { id: 'merlion', name: 'Мерлайон', country: 'Сингапур', size: 8.5, build: merlion },
  { id: 'forbidden', name: 'Запретный город', country: 'Китай', size: 14.5, build: forbidden },
  { id: 'heaven', name: 'Храм Неба', country: 'Китай', size: 11, build: templeHeaven },
  { id: 'taipei', name: 'Тайбэй 101', country: 'Тайвань', size: 6, build: taipei },
];
