import * as THREE from 'three';
import {
  cube, TAU, Q, CORNERS, SIDES, WATER, GOLD, yawAlong, round, stack, stackSquare, onion, dome, sphere,
  beam, polyline, pixels, flag, clocks, tree, archFill,
} from './kit.js';

// Чудеса света у порта, часть 2: pisa, basil, rocket, colosseum, taj.

/* ---------- Пиза: белая мраморная башня — аркады на колоннах, звонница, падает ---------- */
function pisa(a) {
  const W = 0xefe9d9;
  const W2 = 0xe2dac6;
  const C = 0xcfc6b0;
  const SH = 0xb8ae98; // тень в глубине галерей
  const DARK = 0x4e483e;
  const BELL = 0xb08a3a;
  const LEAN = 0.26; // каждый ярус сдвинут — башня падает
  const tangent = (ang) => yawAlong(-Math.sin(ang), Math.cos(ang));
  // лужайка Площади Чудес и мраморные ступени
  round(a, 0, 0, 0, 9.6, 0.25, 0x6aa84f);
  round(a, 0, 0.25, 0, 7.0, 0.35, C);
  round(a, 0, 0.6, 0, 6.4, 0.3, W2);
  let y = 0.9;
  for (let i = 0; i < 8; i++) {
    const x = i * LEAN;
    const base = i === 0;
    const bell = i === 7;
    const h = base ? 3.6 : bell ? 2.6 : 2.7;
    const R = bell ? 1.9 : 2.6; // радиус аркады
    const n = bell ? 8 : 12;
    // стена: у галерей — в тени за колоннами, у цоколя и звонницы — мраморная
    round(a, x, y, 0, base ? 5.2 : bell ? 3.0 : 4.3, h, base || bell ? W : SH, base || bell ? W2 : C);
    for (let c = 0; c < n; c++) {
      const ang = (c / n) * TAU;
      const px = x + Math.cos(ang) * R;
      const pz = Math.sin(ang) * R;
      a.box(px, y, pz, 0.34, h - 0.55, 0.34, W); // колонна
      a.box(px, y + h - 0.95, pz, 0.5, 0.2, 0.5, W2); // капитель
      const mid = ang + Math.PI / n;
      const seg = 2 * R * Math.sin(Math.PI / n) + 0.1;
      const mx = x + Math.cos(mid) * R;
      const mz = Math.sin(mid) * R;
      a.box(mx, y + h - 0.75, mz, seg, 0.3, 0.36, W, tangent(mid)); // арка
      a.box(mx, y + h - 0.95, mz, seg * 0.45, 0.2, 0.3, W, tangent(mid)); // закругление арки
      if (bell && c % 2 === 0) a.box(x + Math.cos(mid) * 1.65, y + 1.0, Math.sin(mid) * 1.65, 0.55, 0.6, 0.55, BELL); // колокол
      if (base && c % 3 === 1) a.box(x + Math.cos(mid) * 2.62, y + 1.4, Math.sin(mid) * 2.62, 0.5, 1.1, 0.12, C, tangent(mid)); // ромбы-вставки
    }
    if (!base) round(a, x, y - 0.05, 0, R * 2 + 0.7, 0.22, C); // пол-балкон галереи
    round(a, x, y + h - 0.45, 0, R * 2 + 0.9, 0.3, W2); // карниз
    round(a, x, y + h - 0.15, 0, R * 2 + 0.6, 0.15, C);
    y += h;
  }
  // парапет наверху звонницы
  const tx = 7 * LEAN;
  round(a, tx, y, 0, 3.6, 0.5, W2);
  round(a, tx, y + 0.5, 0, 2.4, 0.35, C);
  // вход с тёмной дверью и полукруглым люнетом
  a.box(0, 0.9, 2.62, 1.3, 2.4, 0.14, W2);
  a.box(0, 0.9, 2.66, 0.9, 2.0, 0.12, DARK);
  a.box(0, 2.9, 2.66, 0.5, 0.2, 0.12, DARK);
  a.solid(0.4, 0, 3);
}

/* ---------- Москва: храм Василия Блаженного — девять глав, узорные луковицы, галерея, звонница ---------- */
function basil(a) {
  const R = 0xb24a36;
  const R2 = 0x983c2a;
  const W = 0xeee8da;
  const DARK = 0x3b2a18;
  const G = 0xe8b830;
  const GRN = 0x3c8f86; // зелень глав — с синевой, чтобы мелкие ярусы не качались на ветру
  const BLU = 0x3a6fc0;
  const RED = 0xd8453a;
  const YEL = 0xe8b830;
  // луковица из ярусов разных цветов — полоски как на настоящих главах
  const ONION = [0.7, 1.0, 1.2, 1.3, 1.25, 1.1, 0.9, 0.65, 0.42, 0.22];
  const bulb = (x, y0, z, r, cols) => {
    let y = y0;
    ONION.forEach((k, i) => {
      round(a, x, y, z, r * k, r * 0.26, cols[i % cols.length]);
      y += r * 0.26;
    });
    a.box(x, y, z, 0.22, r * 0.9, 0.22, G); // крест
    a.box(x, y + r * 0.55, z, r * 0.5, 0.16, 0.16, G);
    a.box(x, y + r * 0.55, z, 0.16, 0.16, r * 0.5, G);
  };
  // барабан: кирпич, окна в белых наличниках, карниз с «кокошниками»
  const drum = (x, z, w, h, y0) => {
    round(a, x, y0, z, w, h, R, R2);
    for (const [sx, sz] of SIDES) {
      const ox = x + sx * (w / 2);
      const oz = z + sz * (w / 2);
      a.box(ox + sx * 0.02, y0 + h * 0.35, oz + sz * 0.02, sz ? 0.8 : 0.14, h * 0.42, sz ? 0.14 : 0.8, W);
      a.box(ox + sx * 0.08, y0 + h * 0.4, oz + sz * 0.08, sz ? 0.45 : 0.1, h * 0.3, sz ? 0.1 : 0.45, DARK);
      a.box(ox + sx * 0.1, y0 + h - 0.6, oz + sz * 0.1, sz ? w * 0.6 : 0.2, 0.5, sz ? 0.2 : w * 0.6, W);
    }
    round(a, x, y0 + h, z, w + 0.5, 0.35, W);
    return y0 + h + 0.35;
  };

  // подклет: белый цоколь, кирпичные стены, белые пояса
  a.box(0, 0, 0, 14, 0.6, 14, W);
  a.box(0, 0.6, 0, 13.6, 4.4, 13.6, R);
  a.box(0, 2.4, 0, 13.8, 0.25, 13.8, W);
  a.box(0, 5, 0, 14, 0.5, 14, W);
  // галерея — арки по всему периметру
  for (const [sx, sz] of SIDES) {
    for (let k = -2; k <= 2; k++) {
      const u = k * 2.5;
      const x = sx * 6.85 + sz * u;
      const z = sz * 6.85 + sx * u;
      a.box(x, 0.8, z, sz ? 1.7 : 0.14, 2.6, sz ? 0.14 : 1.7, W);
      a.box(x + sx * 0.05, 0.9, z + sz * 0.05, sz ? 1.1 : 0.1, 2.0, sz ? 0.1 : 1.1, DARK);
    }
  }
  // крыльцо с шатриком над входом
  a.box(0, 0, 7.4, 3.2, 0.3, 1.2, W);
  for (const sx of [-1, 1]) a.box(sx * 1.2, 0.3, 7.5, 0.4, 2.6, 0.4, W);
  a.box(0, 2.9, 7.3, 3.0, 0.4, 1.4, R2);
  [2.4, 1.6, 0.8].forEach((w, i) => a.box(0, 3.3 + i * 0.5, 7.3, w, 0.5, 1.2, i % 2 ? YEL : GRN));

  // центральный столп с шатром
  round(a, 0, 5.5, 0, 4.4, 9, R, R2);
  for (const [sx, sz] of SIDES) a.box(sx * 2.22, 8, sz * 2.22, sz ? 0.7 : 0.14, 3, sz ? 0.14 : 0.7, W);
  round(a, 0, 14.5, 0, 5.0, 0.5, W);
  [4.4, 3.8].forEach((w, i) => round(a, 0, 15 + i * 0.6, 0, w, 0.6, i % 2 ? W : R)); // ряды кокошников
  [3.8, 3.1, 2.4, 1.7, 1.1].forEach((w, i) => {
    round(a, 0, 16.2 + i * 1.8, 0, w, 1.6, i % 2 ? GRN : YEL);
    round(a, 0, 17.8 + i * 1.8, 0, w + 0.2, 0.2, W); // белые пояски шатра
  });
  const top = drum(0, 0, 1.4, 1.2, 25.2);
  bulb(0, top, 0, 1.3, [G, 0xf6d860]);

  // восемь приделов с узорными главами: четыре больших по сторонам и четыре малых по углам
  const domes = [
    [0, 5.2, 7, 2.2, [GRN, YEL]], [0, -5.2, 7, 2.2, [BLU, W]], [5.2, 0, 7, 2.2, [RED, W, GRN]], [-5.2, 0, 7, 2.2, [YEL, GRN]],
    [4.3, 4.3, 5, 1.8, [BLU, YEL]], [-4.3, 4.3, 5, 1.8, [RED, GRN]], [4.3, -4.3, 5, 1.8, [GRN, W]], [-4.3, -4.3, 5, 1.8, [YEL, RED]],
  ];
  for (const [x, z, h, r, cols] of domes) {
    const y = drum(x, z, r > 2 ? 2.6 : 2.2, h, 5.5);
    bulb(x, y, z, r, cols);
  }
  a.solid(0, 0, 7);

  // звонница на углу: кирпичный столп, открытый ярус с колоколом, зелёный шатёр
  const bx = 6.3;
  const bz = -6.3;
  a.box(bx, 0, bz, 2, 7, 2, R);
  a.box(bx, 7, bz, 2.3, 0.3, 2.3, W);
  for (const [sx, sz] of CORNERS) a.box(bx + sx * 0.85, 7.3, bz + sz * 0.85, 0.3, 1.8, 0.3, W);
  a.box(bx, 7.6, bz, 0.7, 0.8, 0.7, 0xb08a3a);
  a.box(bx, 9.1, bz, 2.3, 0.3, 2.3, W);
  [1.8, 1.3, 0.8, 0.4].forEach((w, i) => a.box(bx, 9.4 + i * 0.8, bz, w, 0.8, w, i % 2 ? YEL : GRN));
  a.box(bx, 12.6, bz, 0.18, 0.9, 0.18, G);
  a.solid(bx, bz, 1);
}

/* ---------- Байконур: «Союз» в «тюльпане» опор, фермы обслуживания, громоотводы ---------- */
function rocket(a) {
  const W = 0xeeeae0;
  const W2 = 0xdcd8cc;
  const T = 0xb8322a;
  const T2 = 0x9a2a22;
  const K = 0x3b3b3b;
  const GR = 0x8a8f94;
  const GR2 = 0x767b80;
  const OR = 0xe8793a;
  const MAST = 0x9aa0a6;
  // стартовый стол с плитами и газоотводным лотком
  a.box(0, 0, 0, 14, 1, 14, GR);
  for (const [sx, sz] of CORNERS) a.box(sx * 4.6, 1, sz * 4.6, 4, 0.06, 4, GR2);
  a.box(0, 0, 0, 6, 1.1, 6, 0x2e2e30);
  a.box(0, 0.9, 0, 5.2, 0.3, 5.2, 0x1f1f20);
  // «тюльпан»: четыре опоры с противовесами держат ракету за пояс
  for (const [sx, sz] of CORNERS) {
    a.box(sx * 3.7, 1, sz * 3.7, 1.3, 1.3, 1.3, T2);
    beam(a, [sx * 3.5, 2.2, sz * 3.5], [sx * 1.05, 10.2, sz * 1.05], 0.45, T);
    beam(a, [sx * 3.5, 2.2, sz * 3.5], [sx * 2.1, 6, sz * 2.1], 0.3, T2);
  }
  // две фермы обслуживания с площадками и краном
  for (const sx of [-1, 1]) {
    const x = sx * 5.4;
    for (const [px, pz] of CORNERS) a.box(x + px * 0.6, 1, pz * 0.6, 0.25, 24, 0.25, T);
    for (let y = 2; y < 25; y += 3) {
      a.box(x, y, 0.6, 1.45, 0.2, 0.2, T2);
      a.box(x, y, -0.6, 1.45, 0.2, 0.2, T2);
      a.box(x + 0.6, y, 0, 0.2, 0.2, 1.45, T2);
      a.box(x - 0.6, y, 0, 0.2, 0.2, 1.45, T2);
      beam(a, [x - 0.6, y, 0.62], [x + 0.6, y + 3, 0.62], 0.12, T2);
    }
    for (const y of [12, 20]) {
      a.box(sx * 4.1, y, 0, 2.6, 0.4, 1.4, T);
      a.box(sx * 3.1, y + 0.4, 0, 0.12, 0.8, 1.4, 0xf2c94c);
    }
    a.solid(x, 0, 0.9);
  }
  a.box(5.4, 25, 0, 1.6, 0.3, 1.6, T2);
  a.box(4.4, 25.3, 0, 3.4, 0.35, 0.35, T); // стрела крана
  // громоотводы по углам
  for (const [sx, sz] of CORNERS) {
    a.box(sx * 6.6, 1, sz * 6.6, 0.3, 26, 0.3, MAST);
    a.box(sx * 6.6, 27, sz * 6.6, 0.12, 2, 0.12, K);
  }
  a.solid(0, 0, 3.4);

  // сама ракета — подвижная, улетает, когда подплываешь
  const r = a.group(0, 1.1, 0);
  cube(r, W, 2.6, 18, 2.6, 0, 9, 0); // центральный блок
  for (const y of [5, 11, 16.4]) cube(r, K, 2.7, 0.35, 2.7, 0, y, 0);
  cube(r, K, 2.7, 0.5, 2.7, 0, 18.2, 0);
  // флаг и надпись полосками на борту
  for (const [dy, c] of [[0.3, 0xf4f4f4], [0, 0x2f5ab0], [-0.3, 0xd8453a]]) cube(r, c, 1.2, 0.3, 0.1, 0, 14.3 + dy, 1.33);
  for (let k = 0; k < 5; k++) cube(r, K, 0.18, 1.6, 0.1, 0, 7 + k * 0.7 - 0.8, 1.33 + 0.001 * k);
  cube(r, 0xd8d4ca, 2.3, 4.6, 2.3, 0, 20.7, 0); // третья ступень
  for (const [sx, sz] of CORNERS) cube(r, K, 0.15, 1.2, 0.15, sx * 1.05, 18.9, sz * 1.05); // ферма между ступенями
  cube(r, T, 2.9, 0.6, 2.9, 0, 23.3, 0);
  cube(r, W, 2.9, 4, 2.9, 0, 25.6, 0); // головной обтекатель
  cube(r, W2, 3.0, 0.2, 3.0, 0, 24.2, 0);
  cube(r, 0x2a3848, 0.6, 0.6, 0.1, 0, 25.8, 1.47); // окошко корабля
  cube(r, W, 2.2, 1.4, 2.2, 0, 28.3, 0);
  cube(r, W, 1.4, 1.2, 1.4, 0, 29.6, 0);
  cube(r, W, 0.4, 2.2, 0.4, 0, 31.3, 0); // башенка САС
  for (const [sx, sz] of SIDES) cube(r, W2, sx ? 0.5 : 0.1, 0.8, sz ? 0.5 : 0.1, sx * 0.5, 28.6, sz * 0.5);
  // боковые блоки-конусы с рулями и соплами
  for (const [sx, sz] of SIDES) {
    for (let i = 0; i < 5; i++) {
      const w = 2.2 - i * 0.3;
      const off = 2.2 + w * 0.3;
      cube(r, i === 4 ? OR : W, w, 2.4, w, sx * off, 1.2 + i * 2.4, sz * off);
    }
    cube(r, K, 2.25, 0.3, 2.25, sx * 2.86, 2.4, sz * 2.86);
    cube(r, W2, sx ? 0.9 : 0.12, 1.0, sz ? 0.9 : 0.12, sx * 4.1, 0.7, sz * 4.1); // воздушный руль
    cube(r, K, 1.4, 0.8, 1.4, sx * 2.8, -0.4, sz * 2.8);
  }
  cube(r, K, 1.4, 0.8, 1.4, 0, -0.4, 0);
  r.userData.launch = true;
}

/* ---------- Рим: Колизей — три яруса арок с полуколоннами, аттик, трибуны, арена с подземельями ---------- */
function colosseum(a) {
  const C = 0xcdae7c;
  const C2 = 0xb99a6a;
  const C3 = 0xd9bf8e;
  const SH = 0x8a7250; // тень под арками
  const SAND = 0xd9c48a;
  const DARK = 0x5a4632;
  const RX = 12;
  const RZ = 9;
  const n = 36;
  const at = (ang, k = 1) => [Math.cos(ang) * RX * k, Math.sin(ang) * RZ * k];
  const tangent = (ang) => yawAlong(-RX * Math.sin(ang), RZ * Math.cos(ang));
  const normal = (ang) => {
    const nx = Math.cos(ang) / RX;
    const nz = Math.sin(ang) / RZ;
    const l = Math.hypot(nx, nz);
    return [nx / l, nz / l];
  };
  const seg = (TAU * Math.sqrt((RX * RX + RZ * RZ) / 2)) / n;
  // арена: песок и решётка подземелий-гипогея
  a.box(0, 0, 0, 16, 0.3, 11, SAND);
  for (let x = -6; x <= 6; x += 2) a.box(x, 0.3, 0, 0.25, 0.05, 8, DARK);
  for (const z of [-2.5, 0, 2.5]) a.box(0, 0.3, z, 13, 0.05, 0.25, DARK);
  // трибуны уступами, по краю каждой — ряд сидений; нижний ряд в тени — арки читаются как проходы
  for (let ring = 1; ring <= 3; ring++) {
    const k = 1 - ring * 0.13;
    const h = 8.5 - ring * 2.2;
    for (let s = 0; s < 24; s++) {
      const ang = (s / 24) * TAU;
      const [x, z] = at(ang, k);
      a.box(x, 0, z, 3.2, h, 1.6, ring === 1 ? SH : C2, tangent(ang));
      a.box(x, h, z, 3.2, 0.15, 1.7, C3, tangent(ang));
    }
  }
  // внешняя стена: пилоны с полуколоннами, арки, карнизы ярусов, глухой аттик с оконцами
  for (let s = 0; s < n; s++) {
    const ang = (s / n) * TAU;
    const mid = ang + Math.PI / n;
    const [px, pz] = at(ang);
    const [mx, mz] = at(mid);
    const [nx, nz] = normal(ang);
    const [wx, wz] = normal(mid);
    const ruined = ang > 3.5 && ang < 5.6;
    const tiers = ruined ? (s % 3) + 1 : 4;
    for (let tier = 0; tier < tiers; tier++) {
      const y = tier * 3;
      if (tier < 3) {
        a.box(px, y, pz, 0.7, 3, 1.6, C, tangent(ang));
        a.box(px + nx * 0.85, y, pz + nz * 0.85, 0.35, 2.8, 0.2, C3, tangent(ang));
        a.box(mx, y + 2.2, mz, seg + 0.15, 0.8, 1.6, C2, tangent(mid));
        a.box(mx, y + 1.9, mz, seg * 0.5, 0.3, 1.5, C2, tangent(mid));
        a.box(mx + wx * 0.05, y + 2.8, mz + wz * 0.05, seg + 0.3, 0.2, 1.8, C3, tangent(mid));
      } else {
        a.box(mx, y, mz, seg + 0.15, 2.2, 1.6, C, tangent(mid));
        if (s % 2 === 0) a.box(mx + wx * 0.82, y + 0.9, mz + wz * 0.82, 0.6, 0.6, 0.1, DARK, tangent(mid));
        a.box(px + nx * 0.85, y, pz + nz * 0.85, 0.3, 2.2, 0.2, C3, tangent(ang));
        a.box(mx, y + 2.2, mz, seg + 0.3, 0.3, 1.8, C3, tangent(mid));
      }
    }
    if (ang < 1.35 || ang > 1.8) a.solid(px, pz, 0.9); // с севера — вход на арену
  }
  // обломки у разрушенной стены
  for (const [x, z, r] of [[-3, -10.2, 0.4], [2.5, -10.4, 1.1], [-7, -8.6, 2]]) a.box(x, 0, z, 1.6, 0.8, 1.1, C2, r);
}

/* ---------- Агра: Тадж-Махал — порталы-пиштаки, луковичный купол, беседки, минареты, канал и сад ---------- */
function taj(a) {
  const W = 0xf4f1ea;
  const W2 = 0xe6e0d4;
  const INL = 0xcbbfa8; // рамки порталов
  const NICHE = 0x9c8f78;
  const DEEP = 0x6e6250;
  const INK = 0x3a3226; // «каллиграфия» по краю порталов
  const G = 0xe8b830;
  const WATER = 0x5aa9d6;
  const CYP = 0x2f6b3a;
  // деталь на грани: side — направление наружу, u — сдвиг вдоль грани, off — до грани
  const fb = ([sx, sz], u, y0, off, w, h, d, c) => a.box(sx * off + sz * u, y0, sz * off - sx * u, w, h, d, c, Math.atan2(sx, sz));
  // платформа с арочными нишами по краю
  a.box(0, 0, 0, 20, 1.6, 20, W2);
  for (const side of SIDES) for (let k = -4; k <= 4; k++) fb(side, k * 2.1, 0.3, 10.02, 1.2, 1.0, 0.1, NICHE);
  a.box(0, 1.6, 0, 20.2, 0.15, 20.2, INL);
  // основной объём со срезанными углами
  round(a, 0, 1.6, 0, 11.6, 9, W, W2);
  for (const side of SIDES) {
    fb(side, 0, 2.2, 5.85, 4.6, 7.8, 0.3, INL); // пиштак
    for (const [u, y, w, h] of [[-2.35, 2.2, 0.15, 7.8], [2.35, 2.2, 0.15, 7.8], [0, 9.85, 4.85, 0.15]]) fb(side, u, y, 5.98, w, h, 0.1, INK);
    fb(side, 0, 2.6, 5.95, 2.8, 4.8, 0.3, NICHE); // арочная ниша
    [2.2, 1.4, 0.6].forEach((w, i) => fb(side, 0, 7.4 + i * 0.35, 5.95, w, 0.35, 0.3, NICHE));
    fb(side, 0, 2.6, 6.05, 1.4, 2.6, 0.1, DEEP); // дверь
    for (const u of [-3.6, 3.6]) {
      for (const y of [2.6, 6.2]) {
        fb(side, u, y, 5.85, 1.2, 2.6, 0.1, NICHE);
        fb(side, u, y + 2.6, 5.85, 0.6, 0.3, 0.1, NICHE);
      }
    }
    for (let k = -2; k <= 2; k++) fb(side, k * 0.9, 10, 5.9, 0.5, 0.6, 0.3, W); // зубцы над порталом
  }
  // ниши на срезанных углах
  for (const [sx, sz] of CORNERS) {
    const d = [sx * Math.SQRT1_2, sz * Math.SQRT1_2];
    for (const y of [2.6, 6.2]) fb(d, 0, y, 5.25, 1.3, 2.6, 0.1, NICHE);
  }
  a.box(0, 10.6, 0, 11.8, 1, 11.8, W2);
  // барабан и большой луковичный купол с лотосом и золотым навершием
  round(a, 0, 11.6, 0, 6, 2.4, W);
  round(a, 0, 13.7, 0, 6.3, 0.3, INL);
  [6.6, 8, 8.8, 9.1, 9, 8.6, 7.6, 6, 4.2, 2.6, 1.4].forEach((w, i) => round(a, 0, 14 + i * 1.1, 0, w, 1.1, i % 2 ? W : W2));
  round(a, 0, 26.1, 0, 1.8, 0.3, INL); // лотос
  for (const [y, w] of [[26.4, 0.9], [26.9, 0.5], [27.3, 0.7], [27.9, 0.4]]) round(a, 0, y, 0, w, 0.5, G);
  a.box(0, 28.4, 0, 0.2, 1.2, 0.2, G);
  // четыре беседки-чатри на колоннах
  for (const [sx, sz] of CORNERS) {
    const cx = sx * 4.2;
    const cz = sz * 4.2;
    round(a, cx, 11.6, cz, 2.4, 0.4, W2);
    for (const [px, pz] of CORNERS) a.box(cx + px * 0.8, 12, cz + pz * 0.8, 0.25, 1.6, 0.25, W);
    round(a, cx, 13.6, cz, 2.6, 0.3, W2);
    [2.2, 2.0, 1.5, 0.9].forEach((w, i) => round(a, cx, 13.9 + i * 0.55, cz, w, 0.55, W));
    a.box(cx, 16.1, cz, 0.2, 0.9, 0.2, G);
  }
  a.solid(0, 0, 6.5);
  // минареты с тремя балконами и беседкой наверху
  for (const [sx, sz] of CORNERS) {
    const x = sx * 8.8;
    const z = sz * 8.8;
    round(a, x, 1.6, z, 1.6, 15, W, W2);
    for (const by of [5.5, 10.5, 15]) {
      round(a, x, by, z, 2.4, 0.4, W2);
      round(a, x, by + 0.4, z, 2.2, 0.35, INL);
    }
    for (const [px, pz] of CORNERS) a.box(x + px * 0.55, 16.6, z + pz * 0.55, 0.18, 1.2, 0.18, W);
    round(a, x, 17.8, z, 1.8, 0.3, W2);
    [1.5, 1.1, 0.6].forEach((w, i) => round(a, x, 18.1 + i * 0.45, z, w, 0.45, W));
    a.box(x, 19.45, z, 0.18, 0.8, 0.18, G);
    a.solid(x, z, 1);
  }
  // канал с фонтанами и кипарисами, по бокам — сады-чарбаги с цветами
  a.box(0, 0, -12.2, 3.2, 0.3, 3.8, W2);
  a.box(0, 0.05, -12.2, 2.4, 0.3, 3.4, WATER);
  for (const z of [-11, -12.2, -13.4]) a.box(0, 0.35, z, 0.15, 0.8, 0.15, 0xd8f0ff);
  for (const sx of [-1, 1]) {
    for (const z of [-11, -12.4, -13.8]) a.box(sx * 2.3, 0, z, 0.9, 3.4, 0.9, CYP);
    a.box(sx * 7.5, 0, -12.2, 5, 0.3, 3.4, 0x5f9a4a);
    for (let k = 0; k < 5; k++) a.box(sx * 7.5 - 2 + k, 0.3, -12.2, 0.4, 0.4, 0.4, [0xe04a5a, 0xf2c94c, 0xf07ab0, 0xffffff, 0x9a6ee0][k]);
  }
}

export { pisa, basil, rocket, colosseum, taj };
