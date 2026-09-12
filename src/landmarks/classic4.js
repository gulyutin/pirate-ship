import * as THREE from 'three';
import {
  cube, TAU, Q, CORNERS, SIDES, WATER, GOLD, yawAlong, round, stack, stackSquare, onion, dome, sphere,
  beam, polyline, pixels, flag, clocks, tree, archFill,
} from './kit.js';

// Чудеса света у порта, часть 4: sydney, stonehenge, chichen, parthenon, greatWall.

/* ---------- Сидней: белые «паруса» из плитки на гранитном подиуме, стеклянные фасады, лестница ---------- */
function sydney(a) {
  const P = 0xd8b89a; // гранит подиума
  const P2 = 0xc9a888;
  const W = 0xf6f3ec;
  const W2 = 0xe7e2d6;
  const W3 = 0xd6d0c2; // рёбра между плитками
  const GL = 0x6f7f86; // бронзовое стекло
  const GL2 = 0x86969c;
  // подиум с карнизом и светлыми полосами мощения
  a.box(0, 0, 0.5, 22, 2.2, 13, P);
  a.box(0, 2.2, 0.5, 22.3, 0.2, 13.3, P2);
  for (let x = -10; x <= 10; x += 2.5) a.box(x, 2.4, 0.5, 0.18, 0.04, 12.8, W3);
  // широкая парадная лестница на юг (−z) с перилами
  for (let i = 0; i < 5; i++) a.box(0, 0, -6.35 - i * 0.7, 12, 2.2 * (1 - (i + 1) / 6), 0.7, i % 2 ? P2 : P);
  for (const sx of [-1, 1]) {
    a.box(sx * 6.2, 0, -7.9, 0.5, 1.2, 3.6, P2);
    for (let i = 0; i < 5; i++) a.box(sx * 6.2, 1.2 + (4 - i) * 0.25, -6.4 - i * 0.7, 0.14, 0.9, 0.14, 0x9a9a9a);
  }

  // Парус — изогнутая цепочка плит: снизу почти стоит, к макушке ложится вперёд.
  // dir — куда наклонён (−1 к лестнице, +1 назад), s — размер. Под изгибом — стеклянная стена.
  const shell = (x, z, s, dir, n = 9) => {
    let py = 2.4;
    let pz = z;
    for (let i = 0; i < n; i++) {
      const th = 0.12 + i * 0.14;
      const L = 1.25 * s;
      const h = L + 0.25;
      const cy = py + (Math.cos(th) * L) / 2;
      const cz = pz + (dir * Math.sin(th) * L) / 2;
      const w = (5.4 - i * 0.52) * s;
      a.box(x, cy - h / 2, cz, w, h, 0.55, i % 2 ? W : W2, 0, dir * th);
      a.box(x, cy - h / 2, cz, 0.15, h, 0.6, W3, 0, dir * th); // шов посередине
      a.box(x - w / 2 + 0.1, cy - h / 2, cz, 0.12, h, 0.58, W3, 0, dir * th); // кромки
      a.box(x + w / 2 - 0.1, cy - h / 2, cz, 0.12, h, 0.58, W3, 0, dir * th);
      py += Math.cos(th) * L;
      pz += dir * Math.sin(th) * L;
    }
    // стекло под изгибом: ступеньками, сужается кверху
    const top = py - 2.4;
    const gz = pz - dir * 0.4;
    [4.2, 3.2, 2.0].forEach((w, k) => a.box(x, 2.4 + (top * k) / 3, gz - dir * k * 0.5, w * s, top / 3, 0.25, k % 2 ? GL2 : GL));
    for (const e of [-1.2, 0, 1.2]) a.box(x + e * s, 2.4, gz, 0.08, top * 0.66, 0.3, W3); // переплёты
  };
  // Концертный зал (запад) и театр (восток): три паруса к лестнице и один назад
  for (const [x, k] of [[-4.6, 1], [4.6, 0.85]]) {
    shell(x, 3.6, 1.25 * k, -1);
    shell(x, 0.4, 1.02 * k, -1);
    shell(x, -2.6, 0.78 * k, -1);
    shell(x, 4.6, 0.8 * k, 1);
  }
  // ресторан — маленькие паруса у края подиума
  shell(-9, 5.8, 0.42, -1, 8);
  shell(-9, 6.4, 0.36, 1, 8);
  // австралийский флаг
  const B = 0x1f3a8a;
  const Wf = 0xf4f4f4;
  flag(a, 10.2, 2.4, -5.6, ['WRWBBBBBB', 'RRRBBBWBB', 'WRWBBBBBW', 'BBBBWBBBB', 'BBBBBBBWB'], { B, W: Wf, R: 0xc8281e });
  a.solid(0, 0.5, 11, 6.5);
}

/* ---------- Англия: Стоунхендж — сарсены с перемычками, подкова трилитов, голубые камни, земляной вал ---------- */
function stonehenge(a) {
  const S = 0x9a958a;
  const S2 = 0x857f74;
  const S3 = 0xa9a498;
  const BLUE = 0x7f8a94; // голубые камни
  const LICH = 0xa8a070; // лишайник
  const BANK = 0x6aa84f; // травяной вал
  const tangent = (ang) => yawAlong(-Math.sin(ang), Math.cos(ang));
  // земляной вал по кругу, с проходом на юг (к пяточному камню)
  for (let k = 0; k < 24; k++) {
    if (k === 18) continue;
    const ang = (k / 24) * TAU;
    a.box(Math.cos(ang) * 9, 0, Math.sin(ang) * 9, 2.6, 0.5, 1.0, BANK, tangent(ang));
  }
  // внешнее кольцо сарсенов с перемычками; один камень упал
  const n = 16;
  const R = 7.3;
  for (let s = 0; s < n; s++) {
    const ang = (s / n) * TAU;
    const x = Math.cos(ang) * R;
    const z = Math.sin(ang) * R;
    const t = tangent(ang);
    if (s === 11) {
      a.box(x * 1.12, 0, z * 1.12, 4.5, 1.2, 1.5, S2, t + 0.5);
      a.box(x * 1.12, 1.2, z * 1.12, 1.2, 0.08, 0.8, LICH, t + 0.5);
      continue;
    }
    a.box(x, 0, z, 1.35, 5.6, 1.1, s % 2 ? S : S2, t); // между камнями — просветы
    a.box(x + Math.cos(ang) * 0.5, 0.3, z + Math.sin(ang) * 0.5, 0.35, 4.4, 0.2, S2, t); // желобок снаружи
    a.box(x + Math.cos(ang) * 0.56, 1.2 + (s % 4) * 0.8, z + Math.sin(ang) * 0.56, 0.6, 0.5, 0.08, LICH, t);
    a.solid(x, z, 0.8);
    if (s < 10 || s > 12) {
      const mid = ((s + 0.5) / n) * TAU;
      a.box(Math.cos(mid) * R, 5.6, Math.sin(mid) * R, 2 * R * Math.sin(Math.PI / n) + 1.3, 0.9, 1.1, s % 2 ? S2 : S3, tangent(mid));
    }
  }
  // кольцо голубых камней поменьше
  for (let k = 0; k < 12; k++) {
    if (k === 3 || k === 8) continue;
    const ang = (k / 12) * TAU + 0.13;
    a.box(Math.cos(ang) * 5.3, 0, Math.sin(ang) * 5.3, 0.8, 2 + (k % 3) * 0.3, 0.7, BLUE, tangent(ang));
  }
  // подкова из пяти трилитов, средний — самый высокий
  const tri = [[-3, -2.5, 0.9, 6.4], [0, -3.8, 0, 7.6], [3, -2.5, -0.9, 6.4], [-4, 1, 1.4, 5.8], [4, 1, -1.4, 5.8]];
  for (const [x, z, yaw, h] of tri) {
    const c = Math.cos(yaw) * 1.1;
    const sn = Math.sin(yaw) * 1.1;
    a.box(x - c, 0, z + sn, 1.5, h, 1.3, S, yaw);
    a.box(x + c, 0, z - sn, 1.5, h, 1.3, S2, yaw);
    a.box(x - c * 1.02, h * 0.4, z + sn * 1.02, 0.5, 0.6, 1.36, LICH, yaw);
    a.box(x, h, z, 4, 1.1, 1.4, S3, yaw);
    a.solid(x, z, 1.5, 1);
  }
  // внутренняя подкова голубых камней и алтарный камень
  for (let k = 0; k < 7; k++) {
    const ang = Math.PI + (k / 6) * Math.PI;
    a.box(Math.cos(ang) * 2.4, 0, Math.sin(ang) * 2.2 - 0.6, 0.55, 1.6, 0.5, BLUE, tangent(ang));
  }
  a.box(0, 0, 0.5, 3.4, 0.6, 1.2, 0x6a655c);
  // пяточный камень в проходе, чуть наклонился
  a.box(1.2, 0, -8.7, 1.8, 3.6, 1.4, S3, 0.2, 0, 0.12);
  a.solid(1.2, -8.7, 0.9);
}

/* ---------- Мексика: Эль-Кастильо — девять террас с рельефами, лестницы-змеи, храм на вершине ---------- */
function chichen(a) {
  const S = 0xc2b99f;
  const S2 = 0xaea58a;
  const S3 = 0xb8ae94;
  const ST = 0xd4ccb4;
  const DARK = 0x3b2a18;
  const SERP = 0x7a8a6a; // пернатый змей
  const base = 19;
  const th = 1.5;
  for (let i = 0; i < 9; i++) {
    const w = base - i * 1.5;
    a.box(0, i * th, 0, w, th, w, i % 2 ? S2 : S);
    a.box(0, i * th + th - 0.3, 0, w + 0.3, 0.3, w + 0.3, ST);
    // тёмные панели-рельефы на каждой террасе (кроме мест под лестницами)
    for (const [sx, sz] of SIDES) {
      const n = Math.max(2, Math.floor((w - 2.6) / 2.2) + 1);
      for (let k = 0; k < n; k++) {
        const u = -w / 2 + 1.3 + (k * (w - 2.6)) / (n - 1);
        if (Math.abs(u) < 2.4) continue;
        const f = w / 2 + 0.03;
        a.box(sx ? sx * f : u, i * th + 0.25, sz ? sz * f : u, sz ? 1.4 : 0.1, 0.8, sz ? 0.1 : 1.4, S3);
      }
    }
  }
  const topY = 9 * th;
  // четыре лестницы с балюстрадами-змеями
  for (const [sx, sz] of SIDES) {
    for (let st = 0; st < 18; st++) {
      const off = base / 2 + 0.5 - st * 0.375;
      a.box(sx * off, st * 0.75, sz * off, sz ? 3.2 : 1.2, 0.75, sz ? 1.2 : 3.2, st % 2 ? ST : S);
    }
    for (const side of [-1, 1]) {
      const along = (off) => [sx * off + (sz ? side * 1.9 : 0), 0, sz * off + (sx ? side * 1.9 : 0)];
      const p = along(base / 2 + 0.5);
      const q = along(base / 2 + 0.5 - 17 * 0.375);
      beam(a, [p[0], 0.5, p[2]], [q[0], 13.4, q[2]], 0.6, SERP);
    }
  }
  // головы змей у подножия северной лестницы: пасть с языком, глаза
  for (const side of [-1, 1]) {
    const x = side * 1.9;
    const z = base / 2 + 0.8;
    a.box(x, 0, z, 1.0, 1.0, 1.4, SERP);
    a.box(x, 0.1, z + 0.55, 0.9, 0.2, 0.4, 0xc0392b);
    for (const e of [-0.3, 0.3]) a.box(x + e, 0.8, z + 0.45, 0.15, 0.15, 0.1, DARK);
  }
  // храм наверху: двери, змеиные колонны, фриз с узором, зубцы на крыше
  a.box(0, topY, 0, 6, 4, 6, S);
  for (const [sx, sz] of SIDES) {
    a.box(sx * 3.05, topY, sz * 3.05, sz ? 1.4 : 0.2, 2.6, sz ? 0.2 : 1.4, DARK);
    for (const e of [-1.9, 1.9]) a.box(sx * 3.1 + (sz ? e : 0), topY, sz * 3.1 + (sx ? e : 0), 0.6, 2.6, 0.6, sz > 0 ? SERP : S2);
  }
  a.box(0, topY + 2.6, 0, 6.2, 0.4, 6.2, ST);
  for (let k = 0; k < 8; k++) {
    for (const [sx, sz] of SIDES) {
      const u = -2.6 + k * 0.75;
      a.box(sx ? sx * 3.12 : u, topY + 3.05, sz ? sz * 3.12 : u, sz ? 0.4 : 0.1, 0.5, sz ? 0.1 : 0.4, k % 2 ? S2 : S3);
    }
  }
  a.box(0, topY + 4, 0, 6.4, 0.6, 6.4, ST);
  a.box(0, topY + 4.6, 0, 5, 0.8, 5, S2);
  for (let k = 0; k < 5; k++) {
    for (const s of [-1, 1]) {
      a.box(-2 + k, topY + 5.4, s * 2.3, 0.5, 0.6, 0.4, S);
      a.box(s * 2.3, topY + 5.4, -2 + k, 0.4, 0.6, 0.5, S);
    }
  }
  a.solid(0, 0, 10);
}

/* ---------- Афины: Парфенон — дорические колонны с каннелюрами, фриз с триглифами, фронтон и кран реставраторов ---------- */
function parthenon(a) {
  const M = 0xe9e1cf;
  const M2 = 0xd8ceb8;
  const M3 = 0xcbbfa6;
  const M4 = 0xbcae92; // тени каннелюр и триглифы
  const CRANE = 0xe8b830;
  const STEEL = 0x8a8f94;
  const PLANK = 0x9a6a3c;
  // стилобат — три ступени
  a.box(0, 0, 0, 20, 0.6, 11, M3);
  a.box(0, 0.6, 0, 19.2, 0.6, 10.2, M2);
  a.box(0, 1.2, 0, 18.4, 0.6, 9.4, M);
  const column = (x, z, h) => {
    if (!h) return;
    round(a, x, 1.8, z, 0.85, h, M, M2); // колонны потоньше — между ними видны просветы
    for (const [sx, sz] of SIDES) a.box(x + sx * 0.44, 1.8, z + sz * 0.44, sz ? 0.14 : 0.06, h, sz ? 0.06 : 0.14, M4);
    for (let k = 1; k * 1.6 < h; k++) round(a, x, 1.8 + k * 1.6 - 0.03, z, 0.89, 0.06, M3); // стыки барабанов
    if (h >= 7) {
      round(a, x, 1.8 + h - 0.35, z, 1.1, 0.35, M2); // эхин
      a.box(x, 1.8 + h, z, 1.25, 0.45, 1.25, M3); // абака
    } else {
      a.box(x, 1.8 + h, z, 0.8, 0.25, 0.8, M3); // обломанный верх
    }
    a.solid(x, z, 0.5);
  };
  const north = [7, 7, 7, 4.5, 7, 7, 0, 7, 7, 3, 7, 7]; // часть колонн обрушилась
  const south = [7, 7, 7, 7, 7, 2.5, 7, 7, 7, 7, 7, 7];
  for (let i = 0; i < 12; i++) {
    column(-8.2 + i * 1.49, 4.2, north[i]);
    column(-8.2 + i * 1.49, -4.2, south[i]);
  }
  for (let j = 1; j < 5; j++) for (const x of [-8.2, 8.2]) column(x, -4.2 + j * 1.68, 7);

  // уцелевший антаблемент: архитрав, фриз с триглифами, карниз
  const entab = (x, z, lx, lz) => {
    a.box(x, 9.25, z, lx, 0.8, lz, M);
    a.box(x, 10.05, z, lx, 0.7, lz, M2);
    a.box(x, 10.75, z, lx + 0.3, 0.3, lz + 0.3, M);
    const alongX = lx > lz;
    const L = alongX ? lx : lz;
    const D = alongX ? lz : lx;
    for (let t = -L / 2 + 0.4; t <= L / 2 - 0.3; t += 0.75) {
      for (const s of [-1, 1]) {
        const px = alongX ? x + t : x + s * (D / 2 + 0.03);
        const pz = alongX ? z + s * (D / 2 + 0.03) : z + t;
        a.box(px, 10.1, pz, alongX ? 0.3 : 0.08, 0.6, alongX ? 0.08 : 0.3, M4);
      }
    }
  };
  entab(-7.3, 0, 3.6, 9.4);
  entab(7.3, 0, 3.6, 9.4);
  entab(-2, -4.2, 8, 1.4);
  // восточный фронтон со скульптурами, от западного осталась только нижняя плита
  [9.4, 7, 4.6, 2.2].forEach((d, i) => a.box(8.2, 11.05 + i * 0.8, 0, 2.2, 0.8, d, i % 2 ? M2 : M));
  [[-2.8, 0.5], [-1.4, 1.0], [0, 1.4], [1.4, 1.0], [2.8, 0.5]].forEach(([z, h]) => a.box(9.35, 11.1, z, 0.1, h, 0.7, M3));
  a.box(-8.2, 11.05, 0, 2.2, 0.8, 9.4, M);

  // стены целлы — руины разной высоты
  [2.6, 1.6, 3.2, 1.0, 2.2].forEach((h, k) => a.box(-4 + k * 2, 1.8, 2.6, 2, h, 0.9, M2));
  [1.4, 3, 0.8, 2.4, 1.8].forEach((h, k) => a.box(-4 + k * 2, 1.8, -2.6, 2, h, 0.9, k % 2 ? M3 : M2));
  a.box(-5.8, 1.8, 0, 0.9, 3, 4.4, M2);
  // обломки колонн
  a.box(3, 1.8, 1.2, 1.1, 1.1, 3, M2, 0.3);
  a.box(-4, 1.8, -1, 1.4, 0.8, 1.4, M3);
  round(a, 1, 1.8, -1.2, 1.1, 0.8, M2);

  // леса реставраторов у западного фасада
  for (const z of [-4, -2, 0, 2, 4]) a.box(-9.4, 0, z, 0.12, 10, 0.12, STEEL);
  for (const y of [2.5, 5, 7.5]) {
    a.box(-9.4, y, 0, 0.12, 0.12, 8.2, STEEL);
    a.box(-9.1, y, 0, 0.6, 0.1, 8.2, PLANK);
  }
  // кран внутри целлы, на крюке — мраморный блок
  for (const [sx, sz] of CORNERS) a.box(-1 + sx * 0.4, 1.8, sz * 0.4, 0.14, 12, 0.14, CRANE);
  for (let y = 2.8; y < 13.5; y += 1.5) beam(a, [-1.4, y, 0.42], [-0.6, y + 1.5, 0.42], 0.1, CRANE);
  a.box(-1, 13.8, 0, 1.2, 1, 1.2, CRANE); // кабина
  a.box(-1, 13.95, 0.62, 0.8, 0.5, 0.05, 0x2a3848);
  a.box(2.2, 14.8, 0, 7.6, 0.35, 0.5, CRANE); // стрела
  a.box(-4, 14.8, 0, 2.6, 0.35, 0.5, CRANE); // противовесная консоль
  a.box(-4.8, 14.1, 0, 1, 0.7, 0.9, STEEL);
  a.box(5.2, 11.2, 0, 0.05, 3.6, 0.05, 0x2e2e30); // трос
  a.box(5.2, 10.6, 0, 0.35, 0.6, 0.35, 0x2e2e30);
  a.box(5.2, 9.6, 0, 1.4, 0.9, 0.9, M2);
}

/* ---------- Китай: Великая стена — кладка, дорожка, зубцы с бойницами, двухэтажные башни, беседки и флаги ---------- */
function greatWall(a) {
  const S = 0x9d927c;
  const S2 = 0x8a806b;
  const S3 = 0xb0a68e;
  const PAVE = 0xb8ae96;
  const DARK = 0x3b3222;
  const RED = 0xa33a2a;
  const ROOF = 0x3a3f45;
  const ROOF2 = 0x4a5058;
  const GOLD2 = 0xd9a534;
  const pts = [[-17, 3], [-9, -4], [0, -1], [8, 5], [17, 0]];
  for (let p = 0; p < pts.length - 1; p++) {
    const [x0, z0] = pts[p];
    const [x1, z1] = pts[p + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const yaw = yawAlong(dx, dz);
    const nx = -dz / len;
    const nz = dx / len;
    const gate = p === 2; // посередине — проход сквозь стену
    const piece = (u0, u1) => {
      const um = (u0 + u1) / 2;
      const cx = x0 + dx * um;
      const cz = z0 + dz * um;
      const l = len * (u1 - u0);
      a.box(cx, 0, cz, l, 5, 3, S, yaw);
      for (const y of [1.25, 2.5, 3.75]) a.box(cx, y, cz, l, 0.12, 3.06, S2, yaw); // ряды кладки
      a.box(cx, 5, cz, l, 0.12, 2.2, PAVE, yaw); // дорожка
    };
    if (gate) {
      piece(0, 0.4);
      piece(0.6, 1);
      const cx = x0 + dx * 0.5;
      const cz = z0 + dz * 0.5;
      a.box(cx, 4.2, cz, len * 0.2, 0.8, 3, S, yaw); // перемычка над воротами
      a.box(cx, 5, cz, len * 0.2, 0.12, 2.2, PAVE, yaw);
    } else {
      piece(0, 1);
    }
    const teeth = Math.floor(len / 1.4);
    for (let i = 0; i < teeth; i += 2) {
      const u = (i + 0.5) / teeth;
      const tx = x0 + dx * u;
      const tz = z0 + dz * u;
      for (const side of [-1, 1]) {
        a.box(tx + nx * 1.3 * side, 5, tz + nz * 1.3 * side, 0.8, 1, 0.4, S2, yaw);
        a.box(tx + nx * 1.52 * side, 5.35, tz + nz * 1.52 * side, 0.2, 0.3, 0.04, DARK, yaw); // бойница
      }
      if (i % 4 === 0) a.box(tx - nx * 1.65, 4.4, tz - nz * 1.65, 0.3, 0.25, 0.5, S2, yaw); // водосток
    }
    for (let u = 0; u <= 1; u += 1.5 / len) {
      if (!gate || u < 0.4 || u > 0.6) a.solid(x0 + dx * u, z0 + dz * u, 1.4);
    }
  }
  // сторожевые башни: два этажа окон, зубчатый верх; на чётных — беседки, на нечётных — флаги
  pts.forEach(([x, z], i) => {
    a.box(x, 0, z, 5, 8, 5, S2);
    for (const y of [2.6, 5.2]) a.box(x, y, z, 5.06, 0.12, 5.06, S);
    a.box(x, 4.5, z, 5.3, 0.25, 5.3, S3);
    for (const [sx, sz] of SIDES) {
      for (const y of [1.6, 5.4]) {
        for (const s of [-1, 1]) {
          const ox = x + sx * 2.52 + (sz ? s * 1.1 : 0);
          const oz = z + sz * 2.52 + (sx ? s * 1.1 : 0);
          a.box(ox, y, oz, sz ? 0.9 : 0.12, 1.4, sz ? 0.12 : 0.9, S3);
          a.box(ox + sx * 0.04, y + 0.1, oz + sz * 0.04, sz ? 0.6 : 0.1, 1.1, sz ? 0.1 : 0.6, DARK);
        }
      }
    }
    a.box(x, 8, z, 5.6, 0.5, 5.6, S);
    for (const [sx, sz] of SIDES) for (const s of [-1.6, 0, 1.6]) a.box(x + sx * 2.5 + (sz ? s : 0), 8.5, z + sz * 2.5 + (sx ? s : 0), sz ? 0.8 : 0.5, 1, sz ? 0.5 : 0.8, S2);
    if (i % 2 === 0) {
      for (const [sx, sz] of CORNERS) a.box(x + sx * 1.3, 8.5, z + sz * 1.3, 0.35, 2, 0.35, RED);
      a.box(x, 10.3, z, 3.2, 0.3, 3.2, RED);
      a.box(x, 10.5, z, 4.4, 0.4, 4.4, ROOF);
      a.box(x, 10.9, z, 3.4, 0.4, 3.4, ROOF2);
      a.box(x, 11.3, z, 2.2, 0.4, 2.2, ROOF);
      for (const [sx, sz] of CORNERS) a.box(x + sx * 2.3, 10.75, z + sz * 2.3, 0.5, 0.4, 0.5, ROOF2); // загнутые углы
      a.box(x, 11.7, z, 0.4, 0.6, 0.4, GOLD2);
    } else {
      a.box(x + 1.8, 8.5, z + 1.8, 0.15, 4, 0.15, 0x8a8a8a);
      a.box(x + 2.5, 11.2, z + 1.8, 1.3, 0.8, 0.06, RED);
      a.box(x + 2.3, 11.35, z + 1.8, 0.35, 0.35, 0.08, 0xf2c94c);
    }
    a.solid(x, z, 2.5);
  });
  // лестница на башню у восточного поворота
  for (let k = 0; k < 8; k++) a.box(8, 0, 7.5 + (7 - k) * 0.6 + 0.3, 1.6, 0.6 * (k + 1), 0.6, S3);
  // сосны у подножия
  for (const [x, z] of [[-13, 9], [-4, 7], [4, -7], [13, -6], [-12, -6]]) tree(a, x, 0, z, 2, 2.2, 0x5a3e28, 0x2f6b3a);
}

export { sydney, stonehenge, chichen, parthenon, greatWall };
