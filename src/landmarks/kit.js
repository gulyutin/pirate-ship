// Инструменты для строительства чудес света из блоков.
// Каждое чудо — функция build(a), где a — «строитель» острова:
//   a.box(dx, y0, dz, w, h, d, color, ry, rx, rz) — блок, стоящий низом на высоте y0
//     над плато; ry/rx/rz — повороты (курс, наклон, крен), по умолчанию 0;
//   a.solid(dx, dz, hx, hz) — сюда капитану не пройти;
//   a.group(dx, y0, dz) — подвижная часть (крутится, дымит, плавает…).
export { cube } from '../voxel.js';

export const TAU = Math.PI * 2;
export const Q = Math.PI / 4;
export const CORNERS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
export const SIDES = [[0, 1], [0, -1], [1, 0], [-1, 0]];
export const WATER = 0x4a90c0;
export const GOLD = 0xe3b23c;

// Угол поворота, при котором ось x блока смотрит вдоль направления (tx, tz).
export const yawAlong = (tx, tz) => Math.atan2(-tz, tx);

// «Круглая» колонна по-минекрафтовски: квадрат плюс квадрат, повёрнутый на 45°.
export function round(a, dx, y0, dz, w, h, c, c2 = c) {
  a.box(dx, y0, dz, w, h, w, c);
  a.box(dx, y0, dz, w * 0.9, h, w * 0.9, c2, Q);
}

// Стопка «круглых» ярусов заданных ширин — конус, шпиль, ступенчатая крыша.
export function stack(a, dx, y0, dz, widths, h, c, c2 = c) {
  let y = y0;
  widths.forEach((w, i) => {
    round(a, dx, y, dz, w, h, i % 2 ? c2 : c);
    y += h;
  });
  return y;
}

// То же, но квадратными ярусами (пирамиды, зиккураты).
export function stackSquare(a, dx, y0, dz, widths, h, c, c2 = c) {
  let y = y0;
  widths.forEach((w, i) => {
    a.box(dx, y, dz, w, h, w, i % 2 ? c2 : c);
    y += h;
  });
  return y;
}

// Луковичный купол с крестом.
export function onion(a, dx, y0, dz, r, c1, c2, tip = GOLD) {
  let y = y0;
  [0.7, 1.05, 1.25, 1.2, 1.0, 0.7, 0.42, 0.2].forEach((k, i) => {
    round(a, dx, y, dz, r * k, r * 0.28, i % 2 ? c2 : c1);
    y += r * 0.28;
  });
  a.box(dx, y, dz, 0.25, r * 0.7, 0.25, tip);
  a.box(dx, y + r * 0.42, dz, r * 0.4, 0.2, 0.2, tip);
  return y;
}

// Купол-полусфера. Возвращает высоту макушки.
export function dome(a, dx, y0, dz, r, c, c2 = c) {
  let y = y0;
  [1, 0.96, 0.88, 0.76, 0.58, 0.34].forEach((k, i) => {
    round(a, dx, y, dz, 2 * r * k, r * 0.2, i % 2 ? c2 : c);
    y += r * 0.2;
  });
  return y;
}

// Шар из кубиков (низ шара на высоте y0).
export function sphere(a, dx, y0, dz, r, c, c2 = c) {
  const prof = [0.45, 0.8, 0.97, 1, 0.97, 0.8, 0.45];
  const h = (2 * r) / prof.length;
  prof.forEach((k, i) => round(a, dx, y0 + i * h, dz, 2 * r * k, h, i % 2 ? c2 : c));
}

// Балка от точки p до точки q (массивы [x, y, z]) толщиной t.
export function beam(a, p, q, t, c) {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const dz = q[2] - p[2];
  const len = Math.hypot(dx, dy, dz);
  a.box((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - len / 2, (p[2] + q[2]) / 2, t, len, t, c, Math.atan2(dx, dz), Math.acos(dy / len));
}

// Ломаная из балок по точкам.
export function polyline(a, pts, t, c) {
  for (let i = 1; i < pts.length; i++) beam(a, pts[i - 1], pts[i], t, c);
}

// Картинка из пикселей: rows — строки сверху вниз, colors — цвет для каждого символа.
export function pixels(a, rows, x0, y0, z, px, colors, depth = 0.4) {
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      const col = colors[ch];
      if (col !== undefined) a.box(x0 + c * px, y0 + (rows.length - 1 - r) * px, z, px, px, depth, col);
    });
  });
}

// Флаг на флагштоке (картинка из пикселей).
export function flag(a, x, y0, z, rows, colors, px = 0.35) {
  a.box(x, y0, z, 0.15, rows.length * px + 3, 0.15, 0x8a8a8a);
  pixels(a, rows, x + 0.2 + px / 2, y0 + 3, z, px, colors, 0.08);
}

// Циферблаты с рамкой и двумя стрелками на четырёх гранях башни.
export function clocks(a, y, off, size, face, hand, frame) {
  for (const [sx, sz] of SIDES) {
    const alongX = sz !== 0;
    const o = off + 0.12;
    if (frame) a.box(sx * (off - 0.05), y - 0.3, sz * (off - 0.05), alongX ? size + 0.6 : 0.2, size + 0.6, alongX ? 0.2 : size + 0.6, frame);
    a.box(sx * off, y, sz * off, alongX ? size : 0.2, size, alongX ? 0.2 : size, face);
    a.box(sx * o, y + size / 2, sz * o, alongX ? 0.35 : 0.2, size * 0.42, alongX ? 0.2 : 0.35, hand);
    a.box(
      sx * o + (alongX ? size * 0.15 : 0), y + size / 2 - 0.15, sz * o + (alongX ? 0 : size * 0.15),
      alongX ? size * 0.32 : 0.2, 0.3, alongX ? 0.2 : size * 0.32, hand,
    );
  }
}

// Дерево: ствол и крона кубами.
export function tree(a, x, y0, z, h, crown, trunk = 0x6a4a2e, leaf = 0x3f8f3a) {
  a.box(x, y0, z, 0.6, h, 0.6, trunk);
  a.box(x, y0 + h, z, crown, crown * 0.6, crown, leaf);
  a.box(x, y0 + h + crown * 0.6, z, crown * 0.6, crown * 0.4, crown * 0.6, leaf);
}

// Полукруглая арка: заполняет пространство над проёмом шириной span
// (от y0 + rise до top), проём смотрит вдоль z; alongX=false — вдоль x.
export function archFill(a, cx, y0, cz, span, rise, top, depth, c, alongX = true) {
  const n = Math.max(4, Math.round(span / 0.5));
  const step = span / n;
  for (let i = 0; i < n; i++) {
    const u = ((i + 0.5) * step - span / 2) / (span / 2);
    const yTop = y0 + rise * Math.sqrt(Math.max(0, 1 - u * u));
    const off = (i + 0.5) * step - span / 2;
    if (top - yTop > 0.05) {
      a.box(alongX ? cx + off : cx, yTop, alongX ? cz : cz + off, alongX ? step : depth, top - yTop, alongX ? depth : step, c);
    }
  }
}
