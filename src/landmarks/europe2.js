import {
  cube, TAU, Q, CORNERS, SIDES, GOLD, WATER, yawAlong, round, stack, stackSquare, dome, beam, flag,
} from './kit.js';

// Европа (часть 2)

/* ---------- Общие помощники ---------- */

// Блок на грани: side — [sx, sz] (наружная нормаль), (cx, cz) — центр постройки,
// u — сдвиг вдоль грани, off — отступ от центра до середины блока по нормали.
function fbox(a, cx, cz, [sx, sz], u, y0, off, w, h, d, c, roll = 0) {
  a.box(cx + sx * off + sz * u, y0, cz + sz * off - sx * u, w, h, d, c, Math.atan2(sx, sz), 0, roll);
}

// Правильный восьмигранник с апофемой r.
function oct(a, x, y0, z, r, h, c, c2 = c) {
  for (let k = 0; k < 4; k++) a.box(x, y0, z, r * 2, h + k * 0.012, r * 0.83, k % 2 ? c2 : c, (k * Math.PI) / 4);
}

// Касательная к окружности в точке с углом ang (ось x блока идёт вдоль окружности).
const tangent = (ang) => yawAlong(-Math.sin(ang), Math.cos(ang));

// Хвойное дерево ярусами (зелень ярусов широкая — качается как листва, так и задумано).
function fir(a, x, y0, z, h, w, leaf = 0x2f6b3a, leaf2 = 0x3a7a44) {
  a.box(x, y0, z, 0.5, h * 0.3, 0.5, 0x5a3a22);
  [1, 0.75, 0.5, 0.25].forEach((k, i) => a.box(x, y0 + h * 0.2 + i * h * 0.2, z, w * k, h * 0.22, w * k, i % 2 ? leaf2 : leaf));
}

/* ---------- Ватикан: собор Святого Петра — фасад с колоннами и статуями, ребристый купол, колоннада Бернини, обелиск и фонтаны ---------- */
function stPeters(a) {
  const S = 0xe8dfc8; // травертин
  const S2 = 0xd6cbb0;
  const S3 = 0xc2b594;
  const DOME = 0x9aa8b2; // свинцовый купол
  const DOME2 = 0x8c9aa6;
  const RIB = 0xe2dccc;
  const DARK = 0x3e3528;
  const GL = 0x4a5566;
  const RED = 0xb8282a;
  const BRONZE = 0x6a5634;
  const F = [0, -1]; // фасад смотрит на площадь (−z)
  // купол из восьмигранных ярусов с белыми рёбрами и оконцами-люкарнами
  const ribDome = (x, y0, z, r, withWindows) => {
    let y = y0;
    const ks = [1, 0.95, 0.85, 0.7, 0.5, 0.27];
    const h = r * 0.21;
    ks.forEach((k, i) => {
      oct(a, x, y, z, r * k, h, i % 2 ? DOME2 : DOME);
      for (let v = 0; v < 8; v++) {
        const ang = Math.PI / 8 + (v * Math.PI) / 4;
        const R = r * k * 1.07;
        a.box(x + Math.cos(ang) * R, y, z + Math.sin(ang) * R, 0.3, h + 0.02, 0.3, RIB, -ang);
      }
      if (withWindows && (i === 1 || i === 3)) {
        for (let v = 0; v < 8; v++) {
          const ang = (v * Math.PI) / 4;
          fbox(a, x, z, [Math.cos(ang), Math.sin(ang)], 0, y + h * 0.2, r * k + 0.05, 0.5, h * 0.6, 0.12, RIB);
        }
      }
      y += h;
    });
    return y;
  };
  // фонарь на макушке купола: колонки, шапочка, шар и крест
  const lantern = (x, y0, z, s) => {
    round(a, x, y0, z, 2 * s, 0.4 * s, S2);
    round(a, x, y0 + 0.4 * s, z, 1.1 * s, 1.7 * s, GL);
    for (let k = 0; k < 4; k++) {
      const ang = (k * TAU) / 4 + Q;
      a.box(x + Math.cos(ang) * 0.8 * s, y0 + 0.4 * s, z + Math.sin(ang) * 0.8 * s, 0.25 * s, 1.7 * s, 0.25 * s, S);
    }
    round(a, x, y0 + 2.1 * s, z, 2.1 * s, 0.3 * s, S2);
    const t = stack(a, x, y0 + 2.4 * s, z, [1.5 * s, 1 * s, 0.55 * s], 0.4 * s, DOME, DOME2);
    a.box(x, t, z, 0.55 * s, 0.55 * s, 0.55 * s, GOLD);
    a.box(x, t + 0.55 * s, z, 0.18, 1.2 * s, 0.18, GOLD);
    a.box(x, t + 1.2 * s, z, 0.7 * s, 0.16, 0.16, GOLD);
  };

  // ступени и основной корпус базилики
  a.box(0, 0, -1.7, 16, 0.3, 3.4, S3);
  a.box(0, 0.3, -1.2, 15, 0.3, 2.4, S2);
  a.box(0, 0.6, -0.7, 14, 0.3, 1.4, S);
  a.box(0, 0, 6.5, 20, 11, 13, S);
  a.box(0, 11, 6.5, 20.4, 0.6, 13.4, S2);
  a.box(0, 11.6, 7, 18, 0.4, 12, 0xa39c8c); // крыша
  // трансепты с полукруглыми апсидами и апсида позади
  for (const sx of [-1, 1]) {
    a.box(sx * 11, 0, 8, 2.4, 10, 6.4, S);
    round(a, sx * 12.2, 0, 8, 5, 9.5, S, S2);
    a.box(sx * 12.2, 9.5, 8, 5.4, 0.5, 5.4, S2);
    for (const dz of [-1.2, 1.2]) fbox(a, sx * 12.2, 8, [sx, 0], dz, 4, 2.55, 0.8, 2.4, 0.1, GL);
  }
  round(a, 0, 0, 12.8, 8.4, 10, S, S2);
  a.box(0, 10, 12.8, 8.6, 0.5, 8.6, S2);
  a.solid(0, 6.5, 10.2, 6.6);
  a.solid(12, 8, 2.6, 2.6);
  a.solid(-12, 8, 2.6, 2.6);
  a.solid(0, 13.5, 3.8, 3.4);

  // фасад: пилястры, восемь колонн с капителями, двери, окна и лоджия благословения
  for (const u of [-9.7, 9.7]) fbox(a, 0, 0, F, u, 0.9, 0.2, 0.9, 9.1, 0.4, S2);
  for (const x of [-8.9, -6.5, -3.9, -1.3, 1.3, 3.9, 6.5, 8.9]) {
    a.box(x, 0.9, -0.55, 1.0, 8.7, 1.0, S2);
    a.box(x, 9.6, -0.55, 1.3, 0.4, 1.3, S3);
  }
  for (const x of [-7.7, -5.2, -2.6, 0, 2.6, 5.2, 7.7]) {
    const w = x === 0 ? 1.5 : 1.1;
    a.box(x, 0.9, -0.14, w, 3.5, 0.12, DARK); // двери
    a.box(x, 5.5, -0.1, w - 0.2, 2.0, 0.12, GL); // окна второго яруса
    a.box(x, 7.5, -0.14, w + 0.3, 0.3, 0.2, S2);
  }
  a.box(0, 5, -0.5, 2.4, 0.3, 0.9, S2); // балкон лоджии
  a.box(0, 5.3, -0.9, 2.2, 0.5, 0.12, S2);
  a.box(0, 4.3, -0.97, 1.4, 1.0, 0.06, RED); // красное полотнище
  a.box(0, 4.9, -1.0, 0.5, 0.35, 0.05, GOLD);
  // антаблемент с надписью, фронтон, аттик с окнами, балюстрада
  a.box(0, 10, -0.35, 20.6, 1.0, 1.3, S2);
  for (let k = 0; k < 10; k++) if (k % 5 !== 4) a.box(-6.3 + k * 1.4, 10.3, -1.02, 0.9, 0.35, 0.05, DARK);
  a.box(0, 11, 0.2, 20.6, 2.0, 1.4, S);
  for (const x of [-7.5, -5.5, 5.5, 7.5]) a.box(x, 11.5, -0.52, 0.9, 1.0, 0.1, GL);
  [7.2, 5.8, 4.4, 3.0, 1.6].forEach((w, i) => a.box(0, 11 + i * 0.45, -0.75, w, 0.45, 0.8, i % 2 ? S2 : S));
  a.box(0, 11.2, -1.17, 1.0, 0.8, 0.06, GOLD); // герб с ключами
  a.box(0, 13, 0.2, 20.6, 0.5, 1.2, S2);
  // Христос и апостолы на аттике
  for (let k = 0; k < 13; k++) {
    const x = -9 + k * 1.5;
    const big = k === 6 ? 1.25 : 1;
    a.box(x, 13.5, 0.2, 0.5 * big, 1.2 * big, 0.45, S3);
    a.box(x, 13.5 + 1.2 * big, 0.2, 0.34 * big, 0.36 * big, 0.34, S3);
  }
  // часы по краям аттика с маленькими куполками
  for (const sx of [-1, 1]) {
    const x = sx * 9.3;
    a.box(x, 13.5, 0.6, 2, 2.2, 1.6, S);
    a.box(x, 14.1, -0.24, 1.3, 1.3, 0.1, 0xf0e8d0);
    a.box(x, 14.1, -0.24, 1.3, 1.3, 0.1, 0xf0e8d0, 0, 0, Q);
    a.box(x, 14.75, -0.32, 0.12, 0.55, 0.06, DARK);
    a.box(x + 0.2, 14.7, -0.32, 0.45, 0.12, 0.06, DARK);
    a.box(x, 15.7, 0.6, 1.8, 0.3, 1.8, S2);
    const t = stack(a, x, 16, 0.6, [1.3, 0.6], 0.45, DOME, DOME2);
    a.box(x, t, 0.6, 0.15, 0.7, 0.15, GOLD);
  }

  // барабан главного купола с парными колоннами и окнами, ребристый купол, фонарь
  const DZ = 7.5;
  round(a, 0, 11.6, DZ, 11.2, 1, S2);
  round(a, 0, 12.6, DZ, 9.4, 3.6, S, S2);
  for (let k = 0; k < 12; k++) {
    const ang = (k * TAU) / 12;
    const mid = ang + Math.PI / 12;
    a.box(Math.cos(ang) * 4.95, 12.6, DZ + Math.sin(ang) * 4.95, 0.45, 3.6, 0.45, RIB);
    a.box(Math.cos(mid) * 4.72, 13.2, DZ + Math.sin(mid) * 4.72, 0.8, 1.9, 0.12, GL, tangent(mid));
  }
  round(a, 0, 16.2, DZ, 10.4, 0.5, S2);
  round(a, 0, 16.7, DZ, 9.6, 0.7, S);
  const top = ribDome(0, 17.4, DZ, 4.7, true);
  lantern(0, top, DZ, 1);
  // два малых купола по бокам
  for (const sx of [-1, 1]) {
    round(a, sx * 6.4, 11.6, 11.2, 2.8, 1.2, S);
    const t = stack(a, sx * 6.4, 12.8, 11.2, [2.5, 2, 1.2], 0.5, DOME, DOME2);
    round(a, sx * 6.4, t, 11.2, 0.6, 0.6, S2);
    a.box(sx * 6.4, t + 0.6, 11.2, 0.15, 0.8, 0.15, GOLD);
  }

  // колоннада Бернини: две дуги по четыре колонны в глубину, наверху — статуи святых
  const CZ = -9;
  const RX = 11;
  const RZ = 6.5;
  const n = 7;
  const f0 = -1.05;
  const f1 = 1.05;
  for (const sx of [-1, 1]) {
    const P = (f) => [sx * RX * Math.cos(f), CZ + RZ * Math.sin(f)];
    const N = (f) => {
      const nx = (sx * Math.cos(f)) / RX;
      const nz = Math.sin(f) / RZ;
      const l = Math.hypot(nx, nz);
      return [nx / l, nz / l];
    };
    for (let k = 0; k <= n; k++) {
      const f = f0 + ((f1 - f0) * k) / n;
      const [px, pz] = P(f);
      const [nx, nz] = N(f);
      for (const o of [-0.8, 0.8]) a.box(px + nx * o, 0.3, pz + nz * o, 0.55, 4.7, 0.55, S);
      if (k % 2 === 0) {
        a.box(px + nx * 0.9, 6.4, pz + nz * 0.9, 0.45, 1.0, 0.4, S3);
        a.box(px + nx * 0.9, 7.4, pz + nz * 0.9, 0.3, 0.3, 0.3, S3);
      }
      a.solid(px, pz, 0.9);
      if (k === n) continue;
      const fm = f + (f1 - f0) / n / 2;
      const [mx, mz] = P(fm);
      const [tx, tz] = [-sx * RX * Math.sin(fm), RZ * Math.cos(fm)];
      const yaw = yawAlong(tx, tz);
      const len = (Math.hypot(tx, tz) * (f1 - f0)) / n + 0.1;
      a.box(mx, 0, mz, len, 0.3, 2.6, S3, yaw);
      a.box(mx, 5, mz, len, 0.8, 2.3, S2, yaw);
      a.box(mx, 5.8, mz, len + 0.1, 0.25, 2.6, S3, yaw);
    }
    // прямые галереи от дуги к фасаду
    const [ex, ez] = P(f1);
    const q = [sx * 9.2, -0.4];
    const yaw = yawAlong(q[0] - ex, q[1] - ez);
    const len = Math.hypot(q[0] - ex, q[1] - ez);
    const cx = (ex + q[0]) / 2;
    const cz = (ez + q[1]) / 2;
    a.box(cx, 0, cz, len, 0.3, 2.4, S3, yaw);
    a.box(cx, 5, cz, len, 0.8, 2.2, S2, yaw);
    a.box(cx, 5.8, cz, len + 0.1, 0.25, 2.5, S3, yaw);
    for (const t of [0.35, 0.7]) {
      const x = ex + (q[0] - ex) * t;
      const z = ez + (q[1] - ez) * t;
      for (const o of [-0.75, 0.75]) a.box(x + Math.sin(yaw) * o, 0.3, z + Math.cos(yaw) * o, 0.5, 4.7, 0.5, S);
      a.solid(x, z, 0.9);
    }
  }

  // площадь: лучи мостовой, египетский обелиск со львами и крестом, два фонтана
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * TAU + Math.PI / 8;
    a.box(Math.cos(ang) * 4, 0, CZ + Math.sin(ang) * 3, 4.6, 0.04, 0.22, S3, yawAlong(Math.cos(ang), Math.sin(ang) * 0.75));
  }
  const OG = 0xcdbba0;
  a.box(0, 0, CZ, 3.2, 0.4, 3.2, S3);
  a.box(0, 0.4, CZ, 2.4, 0.4, 2.4, S2);
  a.box(0, 0.8, CZ, 1.7, 1.8, 1.7, S);
  for (const [sx, sz] of CORNERS) a.box(sx * 0.7, 2.6, CZ + sz * 0.7, 0.55, 0.55, 0.55, BRONZE); // львы
  a.box(0, 2.6, CZ, 1.5, 0.3, 1.5, S2);
  const ot = stackSquare(a, 0, 2.9, CZ, [1.2, 1.1, 1.0, 0.9, 0.8], 1.8, OG, 0xc2b094);
  [0.6, 0.35].forEach((w, i) => a.box(0, ot + i * 0.3, CZ, w, 0.3, w, OG));
  a.box(0, ot + 0.6, CZ, 0.45, 0.45, 0.45, BRONZE);
  a.box(0, ot + 1.05, CZ, 0.16, 1.2, 0.16, GOLD);
  a.box(0, ot + 1.6, CZ, 0.7, 0.16, 0.16, GOLD);
  a.solid(0, CZ, 1.6);
  for (const sx of [-1, 1]) {
    const x = sx * 5.6;
    round(a, x, 0, CZ, 3.4, 0.6, S2, S3);
    round(a, x, 0.6, CZ, 3.0, 0.05, WATER);
    round(a, x, 0.7, CZ, 0.6, 1.2, S);
    round(a, x, 1.9, CZ, 2.0, 0.35, S2);
    round(a, x, 2.1, CZ, 1.6, 0.2, 0x7ec0e4);
    round(a, x, 2.25, CZ, 0.4, 0.8, S);
    round(a, x, 3.05, CZ, 1.0, 0.3, S2);
    const fnt = a.group(x, 3.4, CZ);
    fnt.userData.fountain = [0, 0];
    a.solid(x, CZ, 1.7);
  }
}

/* ---------- Венеция: кампанила и собор Сан-Марко с конями, Дворец дожей, мост Риальто, гондолы и полосатые сваи ---------- */
function venice(a) {
  const BR = 0xb5553f; // кирпич кампанилы
  const BR2 = 0xa0483a;
  const W = 0xefe6d2; // истрийский камень
  const W2 = 0xdcd2bc;
  const PINK = 0xe8c4b8; // розовая кладка Дворца дожей
  const PINK2 = 0xd8aa9c;
  const SH = 0x6a5a4c; // тень в арках
  const DARK = 0x2e2820;
  const LEAD = 0x8f9aa4; // свинцовые купола
  const LEAD2 = 0x7f8a94;
  const MOS = 0xd8b060; // золотые мозаики
  const BLUE = 0x2f4f9a;
  const PATINA = 0x6a9a8a;
  const BRONZE = 0xb08a4a;
  const TILE = 0xc0643a;

  // Большой канал с гондолами и сваями-палине
  const CX = -10;
  a.box(CX, 0, 0, 4, 0.12, 18, WATER);
  for (const sx of [-1, 1]) a.box(CX + sx * 2.15, 0, 0, 0.3, 0.45, 18, W2); // набережные
  for (const [gz, yaw] of [[-4.5, 0.08], [1.5, -0.1]]) {
    const G = (dz, y0, w, h, d, c, rx = 0) => a.box(CX + Math.sin(yaw) * dz, y0, gz + Math.cos(yaw) * dz, w, h, d, c, yaw, rx);
    G(0, 0.12, 0.9, 0.4, 4.2, 0x1a1a1a); // чёрный корпус
    G(2.5, 0.35, 0.6, 0.35, 1.2, 0x1a1a1a, -0.45); // нос
    G(-2.5, 0.35, 0.6, 0.35, 1.2, 0x1a1a1a, 0.45); // корма
    G(3.1, 0.6, 0.12, 0.9, 0.5, 0xd0d4d8); // стальной «ферро» на носу
    G(0.4, 0.52, 0.8, 0.25, 1.2, 0xb8282a); // красное сиденье
    G(-1.9, 0.52, 0.2, 0.7, 0.2, 0x6a4a2e); // уключина-форкола
    G(-1.4, 1.0, 0.12, 0.12, 3.2, 0x8a6a3a, 0.5); // весло
  }
  for (const [x, z] of [[CX + 1.6, -7.5], [CX + 1.6, -1.5], [CX - 1.6, 3], [CX + 1.6, 8.5]]) {
    for (let i = 0; i < 3; i++) a.box(x, 0.1 + i * 0.9, z, 0.28, 0.9, 0.28, i % 2 ? 0xf4f4f4 : BLUE);
    a.box(x, 2.8, z, 0.36, 0.3, 0.36, GOLD);
  }

  // мост Риальто: каменная арка, лавки на спусках и арка-портик посередине
  const RZ = 5.5;
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    const x = -13.4 + t * 7;
    const yTop = 1.1 + 1.6 * Math.sin(Math.PI * t);
    const u = (x - CX) / 2.3;
    const yBot = Math.abs(u) < 1 ? 1.5 * Math.sqrt(1 - u * u) : 0;
    a.box(x, yBot, RZ, 0.82, yTop - yBot, 3.4, i % 2 ? W2 : W);
    a.box(x, yTop, RZ, 0.82, 0.12, 1.4, 0xcfc6b2); // ступени
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const x = CX + sx * (1.1 + k * 1.1);
        const y = 1.1 + 1.6 * Math.sin(Math.PI * ((x + 13.4) / 7));
        a.box(x, y, RZ + sz * 1.15, 1.0, 1.1, 1.0, W);
        a.box(x, y + 1.1, RZ + sz * 1.15, 1.1, 0.25, 1.2, TILE);
      }
    }
  }
  a.box(CX, 2.7, RZ, 1.6, 2.0, 3.4, W);
  a.box(CX, 2.7, RZ, 1.7, 1.4, 1.6, SH); // проход под портиком
  a.box(CX, 4.7, RZ, 1.9, 0.3, 3.6, W2);
  a.box(CX, 5.0, RZ, 1.4, 0.4, 2.6, TILE);
  a.box(CX, 5.4, RZ, 0.8, 0.3, 1.6, TILE);
  a.solid(CX, RZ, 3.4, 1.8);

  // разноцветные домики вдоль канала: окна с зелёными ставнями, трубы-воронки
  for (const [z, h, c] of [[-0.2, 5, 0xf0b0a0], [8.9, 6, 0xe8a040], [11.8, 4.6, 0xf2d27a]]) {
    const x = -6;
    a.box(x, 0, z, 2.6, h, 2.6, c);
    a.box(x - 1.32, 0.3, z, 0.1, 1.4, 1.1, DARK); // водные ворота
    for (const dz of [-0.6, 0.6]) {
      for (let y = 2.2; y < h - 0.8; y += 1.6) {
        a.box(x - 1.32, y, z + dz, 0.1, 0.9, 0.7, 0x2f6a6a); // ставни
        a.box(x - 1.36, y + 0.1, z + dz, 0.06, 0.7, 0.3, DARK);
      }
    }
    a.box(x - 1.45, 2.0, z, 0.35, 0.12, 1.8, W); // балкончик
    a.box(x, h, z, 2.9, 0.3, 2.9, TILE);
    a.box(x, h + 0.3, z, 2.2, 0.3, 2.2, TILE);
    a.box(x + 0.7, h + 0.6, z + 0.6, 0.3, 0.8, 0.3, W2);
    a.box(x + 0.7, h + 1.4, z + 0.6, 0.6, 0.4, 0.6, W2); // труба-воронка
    a.solid(x, z, 1.3);
  }

  // кампанила Сан-Марко: кирпичный ствол с лопатками, белая звонница, аттик со львом, зелёный шпиль и золотой ангел
  const TX = -2.5;
  const TZ = -3.5;
  a.box(TX, 0, TZ, 5, 0.6, 5, W2);
  a.box(TX, 0.6, TZ, 4.4, 17, 4.4, BR);
  for (const [sx, sz] of CORNERS) a.box(TX + sx * 2.05, 0.6, TZ + sz * 2.05, 0.5, 17, 0.5, BR2);
  for (const side of SIDES) {
    for (const u of [-0.75, 0.75]) fbox(a, TX, TZ, side, u, 0.6, 2.2, 0.35, 16.4, 0.14, BR2); // лопатки
    fbox(a, TX, TZ, side, 0, 16.4, 2.24, 3.4, 0.4, 0.14, BR2); // аркатура наверху
    fbox(a, TX, TZ, side, 0, 8, 2.22, 0.3, 1.4, 0.1, DARK);
  }
  a.box(TX, 17.6, TZ, 5, 0.4, 5, W);
  a.box(TX, 18, TZ, 3.6, 3, 3.6, DARK);
  a.box(TX, 18.2, TZ, 1.1, 1.3, 1.1, GOLD); // колокол
  for (const [sx, sz] of CORNERS) a.box(TX + sx * 1.95, 18, TZ + sz * 1.95, 0.7, 3, 0.7, W);
  for (const side of SIDES) for (const u of [-0.6, 0.6]) fbox(a, TX, TZ, side, u, 18, 1.95, 0.3, 3, 0.3, W);
  a.box(TX, 21, TZ, 5, 0.4, 5, W);
  a.box(TX, 21.4, TZ, 4.4, 2.6, 4.4, BR);
  for (const side of SIDES) {
    fbox(a, TX, TZ, side, 0, 21.8, 2.2, 1.8, 1.6, 0.12, W2);
    fbox(a, TX, TZ, side, 0, 22.1, 2.26, 1.2, 1.0, 0.1, MOS); // крылатый лев
  }
  a.box(TX, 24, TZ, 4.8, 0.3, 4.8, W);
  const st = stackSquare(a, TX, 24.3, TZ, [4.0, 3.3, 2.6, 1.9, 1.3, 0.7], 1.5, PATINA, 0x5f8c7e);
  a.box(TX, st, TZ, 0.2, 0.8, 0.2, GOLD);
  a.box(TX, st + 0.8, TZ, 0.45, 1.1, 0.45, GOLD); // ангел
  a.box(TX, st + 1.3, TZ + 0.3, 1.3, 0.5, 0.12, GOLD);
  a.box(TX, st + 1.9, TZ, 0.35, 0.35, 0.35, GOLD);
  // лоджетта у подножия
  a.box(TX + 3.1, 0, TZ, 1.8, 2.8, 4.2, W);
  for (const u of [-1.2, 0, 1.2]) a.box(TX + 4.02, 0.3, TZ + u, 0.1, 1.8, 0.8, SH);
  a.box(TX + 3.1, 2.8, TZ, 2, 0.35, 4.4, W2);
  a.solid(TX + 0.6, TZ, 3.1, 2.4);

  // собор Сан-Марко: фасад на запад (−x), пять порталов с мозаиками, четыре бронзовых коня, пять куполов
  const BX = 6.5;
  const BZ = 0.5;
  const FW = [-1, 0];
  a.box(BX, 0, BZ, 10, 7, 11, W);
  a.box(BX, 7, BZ, 9, 1.4, 10, W2);
  fbox(a, BX, BZ, FW, 0, 0, 5.2, 11.4, 6.8, 0.6, W); // фасадная стена
  for (const u of [-4.4, -2.2, 0, 2.2, 4.4]) {
    const big = u === 0 ? 1.25 : 1;
    fbox(a, BX, BZ, FW, u, 0, 5.52, 1.9 * big, 5.4 * big, 0.12, W2); // рама портала
    fbox(a, BX, BZ, FW, u, 0, 5.58, 1.3 * big, 2.8 * big, 0.12, DARK);
    fbox(a, BX, BZ, FW, u, 2.9 * big, 5.58, 1.4 * big, 1.6 * big, 0.12, MOS); // мозаика в люнете
    fbox(a, BX, BZ, FW, u, 3.3 * big, 5.62, 0.8 * big, 0.6 * big, 0.08, BLUE);
  }
  for (const u of [-5.5, -3.3, -1.1, 1.1, 3.3, 5.5]) fbox(a, BX, BZ, FW, u, 0, 5.62, 0.35, 5.6, 0.3, 0xc9a8a0); // колонки из порфира
  fbox(a, BX, BZ, FW, 0, 6.8, 5.6, 11.6, 0.35, 1.2, W2); // терраса
  fbox(a, BX, BZ, FW, 0, 7.15, 6.1, 11.6, 0.5, 0.2, W2); // перила террасы
  // четыре бронзовых коня над главным входом
  for (const u of [-1.35, -0.45, 0.45, 1.35]) {
    const H = (dx, y0, w, h, d) => a.box(BX - 5.85 + dx, y0, BZ + u, w, h, d, BRONZE);
    H(0, 7.8, 1.1, 0.55, 0.4); // туловище
    for (const dx of [-0.4, 0.4]) H(dx, 7.15, 0.2, 0.65, 0.3); // ноги
    H(-0.55, 8.2, 0.35, 0.7, 0.3); // шея
    H(-0.75, 8.75, 0.5, 0.3, 0.28); // голова
  }
  // верхний ярус: пять арок-кокошников с мозаикой, между ними башенки со статуями
  for (const u of [-4.4, -2.2, 0, 2.2, 4.4]) {
    const big = u === 0 ? 1.2 : 1;
    fbox(a, BX, BZ, FW, u, 7.15, 5.25, 2.0 * big, 3.2 * big, 0.5, W);
    fbox(a, BX, BZ, FW, u, 7.5, 5.52, 1.5 * big, 2.2 * big, 0.1, u === 0 ? BLUE : MOS);
    [1.4, 0.9, 0.4].forEach((w, i) => fbox(a, BX, BZ, FW, u, 7.15 + 3.2 * big + i * 0.4, 5.25, w * big, 0.4, 0.5, W2));
    fbox(a, BX, BZ, FW, u, 8.35 + 3.2 * big, 5.25, 0.3, 0.6, 0.3, GOLD);
  }
  fbox(a, BX, BZ, FW, 0, 8.4, 5.6, 0.9, 0.7, 0.1, GOLD); // золотой лев Святого Марка
  for (const u of [-5.5, -3.3, -1.1, 1.1, 3.3, 5.5]) {
    fbox(a, BX, BZ, FW, u, 7.15, 5.3, 0.45, 3.4, 0.45, W2);
    fbox(a, BX, BZ, FW, u, 10.55, 5.3, 0.25, 0.7, 0.25, GOLD);
  }
  // купола: барабан, свинцовая шапка, фонарик-луковка с крестом
  for (const [x, z, s] of [[BX - 2.6, BZ, 1], [BX, BZ, 1.15], [BX + 2.8, BZ, 1], [BX, BZ - 3.2, 0.95], [BX, BZ + 3.2, 0.95]]) {
    round(a, x, 8.4, z, 3 * s, 1.1, W);
    const t = stack(a, x, 9.5, z, [3.3 * s, 2.9 * s, 2.2 * s, 1.3 * s], 0.5 * s, LEAD, LEAD2);
    round(a, x, t, z, 0.8, 0.5, LEAD2);
    a.box(x, t + 0.5, z, 0.45, 0.45, 0.45, GOLD);
    a.box(x, t + 0.95, z, 0.14, 0.9, 0.14, GOLD);
    a.box(x, t + 1.5, z, 0.6, 0.14, 0.14, GOLD);
  }
  a.solid(BX - 0.4, BZ, 5.6, 5.6);

  // Дворец дожей: аркада, лоджия с кружевом, розовая стена ромбиками, стрельчатые окна и зубцы
  const PX = 3.5;
  const PZ = -9.5;
  a.box(PX, 0, PZ, 8.4, 2.6, 4.4, SH);
  a.box(PX, 2.6, PZ, 9, 0.35, 5, W);
  a.box(PX, 2.95, PZ, 8.6, 2.3, 4.6, SH);
  a.box(PX, 5.25, PZ, 9, 0.3, 5, W);
  a.box(PX, 5.55, PZ, 9, 4, 5, PINK);
  for (let k = 0; k <= 8; k++) {
    const x = PX - 4.4 + k * 1.1;
    a.box(x, 0, PZ - 2.3, 0.5, 2.6, 0.5, W); // колонны аркады
    a.box(x, 2.95, PZ - 2.35, 0.25, 2.3, 0.3, W);
    if (k < 8) {
      a.box(x + 0.55, 4.6, PZ - 2.45, 0.3, 0.3, 0.1, W, 0, 0, Q); // четырёхлистник
      a.box(x + 0.55, 1.9, PZ - 2.35, 0.7, 0.7, 0.3, W);
    }
  }
  for (let k = 0; k <= 4; k++) {
    const z = PZ - 2 + k;
    a.box(PX - 4.3, 0, z, 0.5, 2.6, 0.5, W);
    a.box(PX - 4.35, 2.95, z, 0.3, 2.3, 0.25, W);
  }
  for (let r = 0; r < 2; r++) {
    for (let k = 0; k < 8; k++) a.box(PX - 3.85 + k * 1.1 + (r % 2) * 0.55, 6.1 + r * 2.4, PZ - 2.51, 0.35, 0.35, 0.05, PINK2, 0, 0, Q); // ромбики
  }
  for (const x of [PX - 3.2, PX - 1.6, PX + 1.6, PX + 3.2]) {
    a.box(x, 6.3, PZ - 2.52, 0.9, 1.9, 0.1, W);
    a.box(x, 6.4, PZ - 2.56, 0.6, 1.5, 0.1, DARK);
  }
  a.box(PX, 6.0, PZ - 2.55, 1.6, 2.8, 0.15, W); // большой балкон
  a.box(PX, 6.2, PZ - 2.6, 1.0, 2.2, 0.1, DARK);
  a.box(PX, 5.55, PZ - 2.75, 1.8, 0.5, 0.5, W);
  a.box(PX, 8.9, PZ - 2.6, 0.7, 0.6, 0.1, MOS);
  a.box(PX, 9.55, PZ, 9.1, 0.25, 5.1, W);
  a.box(PX, 9.8, PZ, 8.4, 0.6, 4.4, 0xa89a88); // крыша
  for (let k = 0; k < 9; k++) {
    for (const sz of [-1, 1]) a.box(PX - 4.2 + k * 1.05, 9.8, PZ + sz * 2.45, 0.3, 0.55, 0.12, W); // зубцы
  }
  a.solid(PX, PZ, 4.5, 2.5);

  // колонны Святого Марка и Святого Теодора на Пьяцетте
  for (const [x, z, lion] of [[-1.8, -12.6, true], [-5.4, -11.2, false]]) {
    a.box(x, 0, z, 1.5, 0.6, 1.5, W2);
    round(a, x, 0.6, z, 0.8, 6.4, 0xb8a8a0, 0xa89890);
    a.box(x, 7, z, 1.2, 0.5, 1.2, W);
    if (lion) {
      a.box(x, 7.5, z, 1.3, 0.7, 0.6, BRONZE); // крылатый лев
      a.box(x - 0.6, 8.1, z, 0.55, 0.6, 0.6, BRONZE);
      a.box(x + 0.2, 8.0, z, 0.8, 0.12, 1.3, BRONZE);
    } else {
      a.box(x, 7.5, z, 0.5, 1.4, 0.4, W);
      a.box(x, 8.9, z, 0.35, 0.35, 0.35, W);
      a.box(x + 0.35, 7.5, z, 0.12, 1.9, 0.12, W2);
    }
    a.solid(x, z, 0.8);
  }
  // голуби на площади
  for (const [x, z] of [[-0.5, 2.5], [0.4, 3.4], [1.1, -5.3], [-0.2, -6.2], [-3.6, 2.4]]) {
    a.box(x, 0, z, 0.35, 0.25, 0.22, 0x8a8e96);
    a.box(x + 0.18, 0.2, z, 0.15, 0.15, 0.15, 0x6a6e76);
  }
}

/* ---------- Прага: Староместская ратуша — астрономические куранты, скелет с колокольчиком, башня с галереей, домики и Тынский храм ---------- */
function orloj(a) {
  const ST = 0xcfc4a8; // камень башни
  const ST2 = 0xbfb393;
  const ST3 = 0xa89c7e;
  const SL = 0x3a3f45; // чёрный шифер
  const SL2 = 0x454b52;
  const DARK = 0x2a2622;
  const BLUE = 0x2f5a9a;
  const NIGHT = 0x1a1a22;
  const DAWN = 0xb8683a;
  const RED = 0xb8282a;
  const BONE = 0xf2efe6;
  const TILE = 0xb8533a;
  const GL = 0x3d4a5a;
  const F = [0, -1]; // куранты смотрят на площадь (−z)
  const O = 4.6; // передняя грань короба курантов
  // круг из горизонтальных полосок на грани башни
  const disc = (cy, off, r, col, rows = 9, d = 0.1) => {
    const hh = (2 * r) / rows;
    for (let i = 0; i < rows; i++) {
      const dy = -r + (i + 0.5) * hh;
      const w = 2 * Math.sqrt(Math.max(0, r * r - dy * dy)) + 0.2;
      fbox(a, 0, 0, F, 0, cy + dy - hh / 2, off, w, hh, d, typeof col === 'function' ? col(dy) : col);
    }
  };
  // кольцо мелких блоков по окружности
  const ring = (cy, off, r, n, s, c, tangential = false) => {
    for (let k = 0; k < n; k++) {
      const t = (k * TAU) / n;
      fbox(a, 0, 0, F, Math.sin(t) * r, cy + Math.cos(t) * r - s / 2, off, tangential ? s * 1.8 : s, s, 0.08, typeof c === 'function' ? c(k) : c, tangential ? -t : 0);
    }
  };
  // стрелка от центра под углом t (0 — вверх)
  const hand = (cy, off, t, L, w, c) => fbox(a, 0, 0, F, (Math.sin(t) * L) / 2, cy + (Math.cos(t) * L) / 2 - L / 2, off, w, L, 0.06, c, -t);

  // башня ратуши: пояса, стрельчатые окна, эркер часовни
  a.box(0, 0, 0, 7.6, 0.6, 7.6, ST3);
  a.box(0, 0.6, 0, 7, 21.4, 7, ST);
  for (const [sx, sz] of CORNERS) a.box(sx * 3.35, 0.6, sz * 3.35, 0.5, 21.4, 0.5, ST2);
  for (const y of [6.5, 15.6]) a.box(0, y, 0, 7.2, 0.3, 7.2, ST3);
  for (const side of SIDES) {
    for (const y of [3, 9, 17]) {
      if (side[1] < 0 && y < 16) continue; // спереди — куранты
      for (const u of [-1.3, 1.3]) {
        fbox(a, 0, 0, side, u, y, 3.5, 1.0, 2.6, 0.12, ST3);
        fbox(a, 0, 0, side, u, y + 0.15, 3.55, 0.7, 2.1, 0.1, GL);
      }
    }
  }
  fbox(a, 0, 0, [1, 0], 0, 9.5, 3.9, 1.8, 4.4, 0.9, ST2); // эркер часовни
  fbox(a, 0, 0, [1, 0], 0, 10.1, 4.37, 1.1, 3.0, 0.1, BLUE);
  fbox(a, 0, 0, [1, 0], 0, 8.9, 3.9, 1.2, 0.6, 0.7, ST3);
  [1.6, 1.1, 0.6].forEach((w, i) => fbox(a, 0, 0, [1, 0], 0, 13.9 + i * 0.6, 3.9, w, 0.6, 0.8, SL));
  // галерея, верхний ярус, башенки по углам и крутая шиферная крыша
  a.box(0, 22, 0, 8.4, 0.4, 8.4, ST3);
  for (const side of SIDES) {
    fbox(a, 0, 0, side, 0, 23.1, 4.1, 8.3, 0.15, 0.15, DARK);
    for (const u of [-1.6, 1.6]) fbox(a, 0, 0, side, u, 22.4, 4.1, 0.15, 0.7, 0.15, DARK);
  }
  a.box(0, 22.4, 0, 6.4, 3, 6.4, ST);
  for (const side of SIDES) for (const u of [-1.4, 1.4]) fbox(a, 0, 0, side, u, 23.2, 3.22, 0.7, 1.3, 0.1, DARK);
  a.box(0, 25.4, 0, 7, 0.35, 7, ST3);
  const rt = stackSquare(a, 0, 25.75, 0, [6.6, 5.6, 4.6, 3.6, 2.6, 1.6, 0.8], 1.4, SL, SL2);
  for (const side of SIDES) {
    fbox(a, 0, 0, side, 0, 27.2, 2.8, 1.0, 1.0, 0.8, SL2); // слуховые окна
    fbox(a, 0, 0, side, 0, 27.35, 3.22, 0.5, 0.6, 0.06, 0xffe38a);
  }
  for (const [sx, sz] of CORNERS) {
    round(a, sx * 3.7, 21.4, sz * 3.7, 1.5, 5, ST, ST2);
    const t = stack(a, sx * 3.7, 26.4, sz * 3.7, [1.8, 1.3, 0.85, 0.45], 1.1, SL, SL2);
    a.box(sx * 3.7, t, sz * 3.7, 0.3, 0.3, 0.3, GOLD);
  }
  a.box(0, rt, 0, 0.2, 1.8, 0.2, GOLD);
  a.box(0, rt + 0.6, 0, 0.5, 0.5, 0.5, GOLD);
  flag(a, 0, rt + 1.2, 0, ['RRRR', 'YYYY'], { R: RED, Y: 0xf2c94c }, 0.35);

  // короб курантов с резной рамой
  a.box(0, 0, -4.05, 6.2, 0.6, 1.4, ST3);
  a.box(0, 0.6, -4.05, 5.8, 13.2, 1.1, ST2);
  for (const sx of [-1, 1]) fbox(a, 0, 0, F, sx * 2.75, 0.6, O + 0.05, 0.3, 13.2, 0.2, ST3);
  // главный циферблат: золотой обод, чёрное кольцо с цифрами, небо — день, заря и ночь
  const CY = 8.6;
  fbox(a, 0, 0, F, 0, CY - 2.85, O + 0.02, 5.7, 5.7, 0.08, 0x8a7a5a);
  for (const [du, dy] of CORNERS) fbox(a, 0, 0, F, du * 2.4, CY + dy * 2.4 - 0.3, O + 0.1, 0.6, 0.6, 0.08, GOLD);
  disc(CY, O + 0.08, 2.7, GOLD);
  disc(CY, O + 0.14, 2.45, NIGHT);
  ring(CY, O + 0.2, 2.18, 12, 0.28, GOLD);
  disc(CY, O + 0.2, 1.95, (dy) => (dy > -0.3 ? BLUE : dy > -0.9 ? DAWN : NIGHT));
  ring(CY + 0.45, O + 0.28, 1.25, 12, 0.22, GOLD, true); // кольцо зодиака
  hand(CY, O + 0.34, 1.0, 2.0, 0.2, GOLD);
  hand(CY, O + 0.36, -2.3, 1.4, 0.16, 0xd0d4d8);
  fbox(a, 0, 0, F, Math.sin(1.0) * 1.45, CY + Math.cos(1.0) * 1.45 - 0.3, O + 0.4, 0.6, 0.6, 0.08, 0xffd040); // солнце
  fbox(a, 0, 0, F, Math.sin(1.0) * 1.45, CY + Math.cos(1.0) * 1.45 - 0.3, O + 0.4, 0.6, 0.6, 0.08, 0xffd040, Q);
  fbox(a, 0, 0, F, Math.sin(-2.3) * 1.0, CY + Math.cos(-2.3) * 1.0 - 0.22, O + 0.42, 0.44, 0.44, 0.08, 0xc8ccd2); // луна
  fbox(a, 0, 0, F, 0, CY - 0.2, O + 0.44, 0.4, 0.4, 0.08, GOLD);
  // календарь с медальонами и гербом Праги
  const KY = 3.4;
  disc(KY, O + 0.08, 1.9, GOLD, 7);
  disc(KY, O + 0.14, 1.65, 0xefe6cf, 7);
  ring(KY, O + 0.2, 1.2, 12, 0.34, (k) => [RED, BLUE, 0x3a7a9a, GOLD][k % 4]);
  fbox(a, 0, 0, F, 0, KY - 0.35, O + 0.2, 0.7, 0.7, 0.08, RED);
  fbox(a, 0, 0, F, 0, KY - 0.2, O + 0.24, 0.3, 0.4, 0.06, BONE);
  // окошки апостолов с фигурками
  for (const u of [-0.9, 0.9]) {
    fbox(a, 0, 0, F, u, 11.7, O + 0.05, 1.2, 1.7, 0.12, ST3);
    fbox(a, 0, 0, F, u, 11.85, O + 0.1, 0.85, 1.25, 0.1, 0x1d3a6b);
    fbox(a, 0, 0, F, u, 11.9, O + 0.14, 0.4, 0.8, 0.08, 0xd8b890);
    fbox(a, 0, 0, F, u, 12.7, O + 0.16, 0.3, 0.3, 0.08, 0xf0d0b0);
    fbox(a, 0, 0, F, u, 13.4, O + 0.05, 0.6, 0.35, 0.14, ST3);
  }
  // готический козырёк со шпилями и золотым петушком
  a.box(0, 13.8, -4.1, 6.4, 0.35, 1.4, ST3);
  [5.2, 4.2, 3.2, 2.2, 1.2].forEach((w, i) => a.box(0, 14.15 + i * 0.55, -4.0, w, 0.55, 1.0, i % 2 ? ST : ST2));
  for (const sx of [-1, 1]) {
    a.box(sx * 2.9, 13.8, -4.3, 0.4, 3.0, 0.4, ST2);
    a.box(sx * 2.9, 16.8, -4.3, 0.2, 0.6, 0.2, GOLD);
  }
  a.box(0, 16.9, -4.0, 0.5, 0.45, 0.3, GOLD); // петушок
  a.box(0.35, 17.1, -4.0, 0.2, 0.5, 0.25, GOLD);
  a.box(-0.3, 17.3, -4.0, 0.25, 0.3, 0.25, GOLD);
  a.box(-0.3, 17.6, -4.0, 0.12, 0.18, 0.1, RED);
  // скелет с колокольчиком и песочными часами — справа от циферблата
  const SX = 3.4;
  const SZ = -4.1;
  a.box(SX, 7.4, SZ, 0.9, 0.3, 0.9, ST3);
  for (const dx of [-0.15, 0.15]) a.box(SX + dx, 7.7, SZ, 0.14, 1.1, 0.14, BONE);
  a.box(SX, 8.8, SZ, 0.5, 0.25, 0.3, BONE);
  a.box(SX, 9.05, SZ, 0.12, 0.9, 0.12, BONE);
  for (const y of [9.25, 9.5, 9.75]) a.box(SX, y, SZ, 0.55, 0.1, 0.3, BONE); // рёбра
  a.box(SX, 9.95, SZ, 0.45, 0.5, 0.42, BONE); // череп
  for (const dx of [-0.1, 0.1]) a.box(SX + dx, 10.15, SZ - 0.22, 0.1, 0.12, 0.05, DARK);
  a.box(SX + 0.4, 9.7, SZ, 0.1, 0.7, 0.1, BONE); // рука вверх
  a.box(SX + 0.4, 10.4, SZ, 0.1, 0.5, 0.1, 0x8a8a8a);
  a.box(SX + 0.4, 10.1, SZ, 0.3, 0.3, 0.3, GOLD); // колокольчик
  a.box(SX - 0.4, 9.1, SZ - 0.1, 0.25, 0.4, 0.25, 0xe8d8a0); // песочные часы
  // слева — фигурка со своим зеркальцем
  a.box(-SX, 7.4, SZ, 0.9, 0.3, 0.9, ST3);
  a.box(-SX, 7.7, SZ, 0.6, 1.6, 0.4, 0x8a2a3a);
  a.box(-SX, 9.3, SZ, 0.4, 0.4, 0.35, 0xf0d0b0);
  a.box(-SX, 9.7, SZ, 0.5, 0.2, 0.45, GOLD);
  a.box(-SX - 0.4, 8.7, SZ - 0.15, 0.3, 0.4, 0.06, 0xd8f0ff);
  a.solid(0, -0.4, 3.8, 4.2);

  // старые дома ратуши: ступенчатые фронтоны, окна, «Прага — глава королевства», дом «У Минуты» со сграффито
  const HOUSES = [[-5.3, 3.4, 11, 0xe9dfc6], [-8.4, 2.8, 9.4, 0xe8b0a0], [-11, 2.4, 10, 0xe8dcc0]];
  HOUSES.forEach(([x, w, h, c], hi) => {
    a.box(x, 0, 0, w, h, 6, c);
    a.box(x, h - 0.3, 0, w + 0.2, 0.3, 6.2, ST3);
    [0.85, 0.6, 0.36, 0.14].forEach((k, i) => {
      a.box(x, h + i * 0.8, 0.2, w * k, 0.8, 5.6, TILE);
      a.box(x, h + i * 0.8, -2.9, w * k + 0.1, 0.8, 0.3, c); // фронтон
    });
    a.box(x, h + 3.2, -2.9, 0.15, 0.6, 0.15, GOLD);
    a.box(x, 0, -3.02, 1.0, 2.0, 0.1, DARK); // дверь
    for (let y = 3; y < h - 1.5; y += 2.4) {
      if (hi === 0 && y > 4 && y < 7) continue;
      for (const u of [-w / 4, w / 4]) {
        a.box(x + u, y, -3.02, 0.8, 1.5, 0.1, GL);
        a.box(x + u, y + 1.5, -3.04, 1.0, 0.2, 0.12, 0xf4efe0);
      }
    }
    if (hi === 2) {
      for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) a.box(x - 0.8 + k * 0.8, 2.3 + r * 2.1, -3.03, 0.35, 0.35, 0.06, DARK, 0, 0, Q); // сграффито
    }
    a.solid(x, 0, w / 2, 3);
  });
  // большое ренессансное окно ратуши с золотой надписью
  a.box(-5.3, 5.2, -3.04, 2.8, 2.4, 0.12, 0xf4efe0);
  for (const u of [-0.9, 0, 0.9]) a.box(-5.3 + u, 5.35, -3.08, 0.7, 2.0, 0.1, GL);
  a.box(-5.3, 7.7, -3.08, 2.8, 0.35, 0.1, GOLD);

  // Тынский храм за площадью: две чёрные башни с золотыми шариками и башенками
  for (const x of [3.8, 7.6]) {
    const z = 8.4;
    a.box(x, 0, z, 2.6, 14, 2.6, 0x7a7266);
    for (const y of [5, 9.5]) a.box(x, y, z - 1.32, 0.6, 1.8, 0.1, DARK);
    a.box(x, 14, z, 3.0, 0.35, 3.0, 0x6a625a);
    const t = stackSquare(a, x, 14.35, z, [2.4, 1.9, 1.4, 0.9, 0.5], 1.7, SL, SL2);
    a.box(x, t, z, 0.4, 0.4, 0.4, GOLD);
    a.box(x, t + 0.4, z, 0.12, 0.8, 0.12, GOLD);
    for (const [sx, sz] of CORNERS) {
      a.box(x + sx * 1.3, 14.35, z + sz * 1.3, 0.5, 1.2, 0.5, SL);
      stackSquare(a, x + sx * 1.3, 15.55, z + sz * 1.3, [0.4, 0.22], 0.9, SL2, SL);
      a.box(x + sx * 1.3, 17.35, z + sz * 1.3, 0.22, 0.22, 0.22, GOLD);
    }
    a.solid(x, z, 1.4);
  }
  a.box(5.7, 0, 8.6, 1.4, 11, 2.2, 0x7a7266); // фронтон между башнями
  [1.4, 1.0, 0.6].forEach((w, i) => a.box(5.7, 11 + i * 0.8, 8.6, w, 0.8, 2.2, 0x6a625a));
  a.box(5.7, 13.4, 7.4, 0.5, 0.8, 0.1, GOLD); // золотая Мадонна
  a.box(5.7, 6, 7.48, 0.8, 2.6, 0.1, GL);
  // Тынская школа с аркадой перед храмом
  a.box(5.7, 0, 5.6, 7, 5, 2.4, 0xe8d8b4);
  for (const x of [3.6, 5.7, 7.8]) {
    a.box(x, 0, 4.36, 1.2, 2.2, 0.1, 0x5a4a3a);
    a.box(x, 3, 4.36, 0.8, 1.1, 0.1, GL);
  }
  for (const x of [4.2, 7.2]) [2.6, 1.8, 1.0].forEach((w, i) => a.box(x, 5 + i * 0.7, 4.55, w, 0.7, 0.3, 0xe8d8b4));
  a.box(5.7, 5, 5.8, 7, 0.6, 2, TILE);
  a.solid(5.7, 7, 3.6, 2.6);
}

/* ---------- Лиссабон: башня Белен — бастион-нос в реке, зубцы-щиты с крестами, сторожевые башенки, лоджия, герб и каравелла ---------- */
function belem(a) {
  const W = 0xefe8d6; // белый известняк
  const W2 = 0xdcd3bc;
  const W3 = 0xc8bea4;
  const RED = 0xc0302a;
  const DARK = 0x3a3226;
  const SH = 0x7a7060; // тень в лоджии
  const ROCK = 0x8a8478;
  const BLUE = 0x2f4f9a;
  // зубец в виде щита с красным крестом Ордена Христа; (x, z) — середина, yaw — вдоль стены
  const merlon = (x, y0, z, yaw, [nx, nz], cross) => {
    a.box(x, y0, z, 0.75, 0.9, 0.35, W2, yaw);
    a.box(x, y0 + 0.9, z, 0.4, 0.25, 0.3, W2, yaw);
    if (cross) {
      a.box(x + nx * 0.19, y0 + 0.25, z + nz * 0.19, 0.12, 0.5, 0.05, RED, yaw);
      a.box(x + nx * 0.19, y0 + 0.45, z + nz * 0.19, 0.4, 0.12, 0.05, RED, yaw);
    }
  };
  // ряд зубцов от точки p до точки q, наружная нормаль n
  const merlons = (p, q, y0, n, count) => {
    const yaw = yawAlong(q[0] - p[0], q[1] - p[1]);
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count;
      merlon(p[0] + (q[0] - p[0]) * t, y0, p[1] + (q[1] - p[1]) * t, yaw, n, k % 2 === 0);
    }
  };
  // сторожевая башенка с ребристым куполком (мавританский стиль)
  const bartizan = (x, y0, z, s) => {
    round(a, x, y0 - 0.6 * s, z, 0.8 * s, 0.6 * s, W3);
    round(a, x, y0, z, 1.3 * s, 2.0 * s, W, W2);
    for (const [sx, sz] of SIDES) a.box(x + sx * 0.66 * s, y0 + 0.7 * s, z + sz * 0.66 * s, 0.25, 0.8 * s, 0.25, DARK);
    round(a, x, y0 + 2.0 * s, z, 1.5 * s, 0.25, W3);
    const t = stack(a, x, y0 + 2.0 * s + 0.25, z, [1.3 * s, 1.05 * s, 0.7 * s, 0.3 * s], 0.35 * s, W, W2);
    a.box(x, t, z, 0.22, 0.4, 0.22, W3);
  };

  // река Тежу вокруг бастиона и камни у воды
  a.box(0, 0, -8, 14, 0.12, 7, WATER);
  for (const sx of [-1, 1]) a.box(sx * 8.5, 0, -5.5, 3, 0.12, 5, WATER);
  for (const [x, z, s] of [[-5.6, -8.6, 1.1], [4.2, -10.6, 0.9], [-7.4, -4.6, 1.2], [-2.8, -11.4, 0.8], [1.6, -12.6, 0.7]]) {
    a.box(x, 0, z, s * 1.4, s * 0.7, s * 1.1, ROCK, x);
  }

  // бастион-нос: шестигранник остриём в реку, пушечные порты, «верёвочный» пояс
  a.box(0, 0, -4.1, 10, 6, 6.8, W);
  a.box(0, 0, -7.5, 7.07, 6, 7.07, W, Q);
  a.box(0, 0, -4.1, 10.3, 0.8, 7.1, W3);
  a.box(0, 0, -7.5, 7.3, 0.8, 7.3, W3, Q);
  a.box(0, 5.1, -4.1, 10.2, 0.25, 7, W2);
  a.box(0, 5.1, -7.5, 7.2, 0.25, 7.2, W2, Q);
  for (const sx of [-1, 1]) {
    for (const z of [-5.5, -2.8]) a.box(sx * 5.02, 2.4, z, 0.1, 0.8, 0.8, DARK);
    for (const t of [0.3, 0.65]) {
      const x = sx * 5 * (1 - t);
      const z = -7.5 - 5 * t;
      a.box(x + sx * 0.04, 2.4, z - 0.04, 0.8, 0.8, 0.1, DARK, yawAlong(-sx, -1) + Math.PI / 2);
    }
  }
  // зубцы по краю террасы бастиона
  const TOP = 6;
  merlons([-5, -7.5], [0, -12.5], TOP, [-0.7, -0.7], 6);
  merlons([0, -12.5], [5, -7.5], TOP, [0.7, -0.7], 6);
  for (const sx of [-1, 1]) merlons([sx * 5, -7.3], [sx * 5, -1.2], TOP, [sx, 0], 5);
  // башенки на углах бастиона
  for (const [x, z] of [[-5, -7.5], [5, -7.5], [0, -12.3], [-5, -1.2], [5, -1.2]]) bartizan(x, 5.2, z, 1);
  a.solid(0, -4.5, 5, 3.2);
  a.solid(0, -9, 3.2, 3);

  // главная башня: четыре яруса, «верёвочные» пояса, окна с арочками
  const TZ = 2.5;
  a.box(0, 0, TZ, 6.4, 19, 6.4, W);
  for (const [sx, sz] of CORNERS) a.box(sx * 3.1, 0, TZ + sz * 3.1, 0.45, 19, 0.45, W2);
  for (const y of [6, 10, 14.5]) a.box(0, y, TZ, 6.7, 0.3, 6.7, W2);
  for (const side of [[1, 0], [-1, 0], [0, 1]]) {
    for (const y of [7, 11, 15.3]) {
      fbox(a, 0, TZ, side, 0, y, 3.2, 1.3, 2.3, 0.14, W3);
      fbox(a, 0, TZ, side, 0, y + 0.15, 3.26, 0.8, 1.6, 0.1, DARK);
      fbox(a, 0, TZ, side, 0, y + 1.75, 3.26, 0.4, 0.3, 0.1, DARK);
    }
  }
  fbox(a, 0, TZ, [0, 1], 0, 0, 3.22, 1.4, 2.6, 0.12, DARK); // вход с суши
  // лоджия с арками и балюстрадой на фасаде к реке
  const LZ = TZ - 3.2;
  a.box(0, 6, LZ - 0.8, 6, 0.4, 1.6, W2);
  a.box(0, 6.4, LZ - 0.05, 5.6, 2.8, 0.1, SH);
  for (let k = 0; k < 7; k++) a.box(-2.7 + k * 0.9, 6.4, LZ - 1.4, 0.25, 2.8, 0.25, W);
  a.box(0, 6.4, LZ - 1.5, 6, 0.8, 0.2, W2);
  for (let k = 0; k < 6; k++) a.box(-2.25 + k * 0.9, 8.8, LZ - 1.4, 0.55, 0.4, 0.25, W); // арочки
  a.box(0, 9.2, LZ - 0.8, 6.2, 0.4, 1.8, W3);
  // королевский герб и две армиллярные сферы
  a.box(0, 10.8, LZ - 0.1, 2.4, 3.2, 0.2, W3);
  a.box(0, 11.2, LZ - 0.22, 1.4, 1.8, 0.1, 0xf4f4f4);
  for (const [dx, dy] of [[0, 0.6], [-0.4, 0], [0.4, 0], [0, -0.6]]) a.box(dx, 11.9 + dy, LZ - 0.28, 0.3, 0.3, 0.06, BLUE);
  a.box(0, 13.1, LZ - 0.28, 1.2, 0.5, 0.1, GOLD); // корона
  for (const sx of [-1, 1]) {
    a.box(sx * 2.1, 11.9, LZ - 0.3, 0.9, 0.9, 0.12, GOLD);
    a.box(sx * 2.1, 11.9, LZ - 0.3, 0.9, 0.9, 0.12, GOLD, 0, 0, Q);
    a.box(sx * 2.1, 12.15, LZ - 0.38, 0.4, 0.4, 0.06, W3);
  }
  // верхняя терраса: карниз, зубцы-щиты, башенки по углам и носорог-горгулья
  a.box(0, 19, TZ, 6.9, 0.35, 6.9, W3);
  for (const [n, p, q] of [[[0, -1], [-3.2, TZ - 3.3], [3.2, TZ - 3.3]], [[0, 1], [3.2, TZ + 3.3], [-3.2, TZ + 3.3]], [[1, 0], [3.3, TZ - 3.2], [3.3, TZ + 3.2]], [[-1, 0], [-3.3, TZ + 3.2], [-3.3, TZ - 3.2]]]) {
    merlons(p, q, 19.35, n, 5);
  }
  for (const [sx, sz] of CORNERS) bartizan(sx * 3.35, 18.6, TZ + sz * 3.35, 1.05);
  a.box(0, 19.35, TZ, 3, 1.8, 3, W2); // башенка-выход на крышу
  a.box(0, 21.15, TZ, 3.3, 0.3, 3.3, W3);
  a.box(-3.75, 16.6, TZ, 0.9, 0.6, 0.7, 0x8a8a8a); // носорог
  a.box(-4.3, 16.7, TZ, 0.4, 0.4, 0.5, 0x8a8a8a);
  a.box(-4.55, 17.0, TZ, 0.12, 0.35, 0.12, 0xe8e0c8);
  flag(a, 0.9, 21.45, TZ, ['GGRRR', 'GGRRR', 'GGRRR'], { G: 0x1f6a5e, R: 0xd0302a }, 0.35);
  a.solid(0, TZ, 3.6);

  // каравелла мореплавателей с крестами на парусах
  const CX = 6.8;
  const CZ = -8.4;
  const yaw = 0.5;
  const B = (dx, y0, dz, w, h, d, c, rz = 0) => a.box(CX + dx * Math.cos(yaw) + dz * Math.sin(yaw), y0, CZ - dx * Math.sin(yaw) + dz * Math.cos(yaw), w, h, d, c, yaw, 0, rz);
  B(0, 0.1, 0, 3.6, 0.8, 1.3, 0x7a4a2a);
  B(0, 0.9, 0, 3.8, 0.15, 1.4, 0x5a3a20);
  B(-1.5, 1.05, 0, 1.0, 0.7, 1.3, 0x7a4a2a); // корма
  B(2.0, 0.5, 0, 0.8, 0.3, 0.3, 0x5a3a20, 0.4); // бушприт
  B(0.3, 1.05, 0, 0.14, 3.6, 0.14, 0x5a3a20);
  B(0.35, 2.0, 0, 0.1, 1.8, 1.9, 0xf4f0e4); // парус
  B(0.4, 2.55, 0, 0.1, 0.8, 0.22, RED);
  B(0.4, 2.85, 0, 0.1, 0.22, 0.7, RED);
  B(-1.2, 1.75, 0, 0.1, 1.0, 1.0, 0xf4f0e4, 0.4); // латинский парус
  B(0.3, 4.65, 0, 0.1, 0.3, 0.6, RED);
}

/* ---------- Будапешт: Парламент на Дунае — лес белых шпилей, красные крыши, павильоны, ребристый купол со шпилем, набережная и кораблик ---------- */
function budapest(a) {
  const W = 0xf0ebe0;
  const W2 = 0xdcd4c4;
  const W3 = 0xc8bfae;
  const R = 0xb5382a; // красная черепица
  const R2 = 0x9c2e22;
  const DARK = 0x3a3a44;
  const GL = 0x4a5a6a;
  const STONE = 0xa8a090;
  // шпиль-пинакль: столбик и острая верхушка
  const pinnacle = (x, y0, z, h, s = 0.4) => {
    a.box(x, y0, z, s, h, s, W);
    a.box(x, y0 + h, z, s * 0.55, 0.7, s * 0.55, W2);
    a.box(x, y0 + h + 0.7, z, 0.12, 0.5, 0.12, W3);
  };

  // Дунай, набережная со ступенями и речной кораблик
  a.box(0, 0, -9.6, 28, 0.12, 4, WATER);
  a.box(0, 0, -7.2, 30, 0.5, 0.9, STONE);
  a.box(0, 0, -6.4, 30, 0.25, 0.8, W3);
  for (const x of [-6, 6]) a.box(x, 0, -7.2, 2.4, 0.3, 1.0, W3);
  const BX = -8.5;
  const BZ = -9.8;
  a.box(BX, 0.1, BZ, 4.6, 0.6, 1.4, W);
  a.box(BX, 0.1, BZ, 4.7, 0.2, 1.5, R);
  a.box(BX - 0.3, 0.7, BZ, 3.2, 0.8, 1.1, W);
  for (let k = 0; k < 4; k++) a.box(BX - 1.5 + k * 0.8, 0.9, BZ - 0.56, 0.5, 0.4, 0.05, GL);
  a.box(BX + 1.6, 0.7, BZ, 0.3, 1.2, 0.3, R2); // труба
  a.box(-BX, 0.1, BZ + 0.3, 3, 0.5, 1.1, W);
  a.box(-BX, 0.6, BZ + 0.3, 1.8, 0.6, 0.9, 0x3a6fc0);

  // основной корпус: белые стены, стрельчатые окна в два ряда, аркада, контрфорсы с пинаклями
  a.box(0, 0, 0, 31, 0.8, 7.4, W3);
  a.box(0, 0.8, 0, 31, 7.2, 7, W);
  a.box(0, 8, 0, 31.4, 0.4, 7.4, W2);
  const inPav = (x) => Math.abs(x) < 4.7 || Math.abs(Math.abs(x) - 11) < 2;
  for (let x = -14.4; x <= 14.5; x += 1.6) {
    for (const sz of [-1, 1]) {
      const z = sz * 3.5;
      if (!inPav(x)) {
        a.box(x, 1, z + sz * 0.02, 0.9, 1.9, 0.1, DARK); // аркада
        a.box(x, 3.6, z + sz * 0.02, 0.7, 1.9, 0.1, GL);
        if (sz < 0) a.box(x, 6.0, z - 0.02, 0.7, 1.5, 0.1, GL);
      }
      const bx = x + 0.8;
      if (bx < 15 && !inPav(bx)) {
        a.box(bx, 0.8, z + sz * 0.12, 0.35, 8.4, 0.25, W2);
        if (sz < 0) pinnacle(bx, 8.4, z - 0.12, 0.9, 0.35);
      }
    }
  }
  // красная крыша с гребнем и маленькими шпилями
  a.box(0, 8.4, 0, 30.6, 1, 6.6, R);
  a.box(0, 9.4, 0, 30, 1, 4.4, R2);
  a.box(0, 10.4, 0, 29.4, 0.8, 2, R);
  for (const x of [-13.5, -8, -6.2, 6.2, 8, 13.5]) {
    a.box(x, 11.2, 0, 0.25, 1.3, 0.25, W);
    a.box(x, 12.5, 0, 0.12, 0.6, 0.12, GOLD);
  }

  // центральный павильон с фронтоном к реке
  a.box(0, 0, -3.9, 9, 10.4, 2.6, W);
  a.box(0, 0, -5.3, 4.2, 3, 0.4, DARK); // главный вход
  for (const x of [-3.3, -1.1, 1.1, 3.3]) {
    a.box(x, 3.8, -5.22, 1.3, 4.2, 0.1, GL);
    a.box(x, 3.6, -5.25, 1.6, 0.25, 0.14, W2);
    a.box(x, 8, -5.22, 0.9, 1.4, 0.1, GL);
  }
  [8.4, 6.8, 5.2, 3.6, 2.0].forEach((w, i) => a.box(0, 10.4 + i * 0.8, -4.4, w, 0.8, 1.6, i % 2 ? W2 : W));
  a.box(0, 11.2, -5.24, 1.4, 1.4, 0.1, 0xb8282a); // герб
  a.box(0, 11.5, -5.28, 0.6, 0.8, 0.06, W);
  for (const x of [-4.4, -2.2, 2.2, 4.4]) pinnacle(x, 10.4, -5.1, 2.4 - Math.abs(x) * 0.2, 0.5);
  pinnacle(0, 14.4, -4.4, 1.2, 0.5);

  // боковые павильоны: крутые красные шатры, угловые шпили, фонарики
  for (const sx of [-1, 1]) {
    const x = sx * 11;
    a.box(x, 0, -0.4, 3.8, 10, 7.8, W);
    for (const dz of [-3.95, 3.15]) for (const u of [-0.8, 0.8]) a.box(x + u, 3.4, dz, 0.7, 4.6, 0.12, GL);
    a.box(x, 10, -0.4, 4.2, 0.4, 8.2, W2);
    const t = stackSquare(a, x, 10.4, -0.4, [3.6, 2.9, 2.2, 1.5, 0.8], 1.2, R, R2);
    a.box(x, t, -0.4, 0.2, 1.4, 0.2, GOLD);
    for (const [cx, cz] of CORNERS) pinnacle(x + cx * 1.9, 10.4, -0.4 + cz * 3.9, 2.2, 0.5);
    // торцевые павильоны
    const ex = sx * 15;
    a.box(ex, 0, 0, 1.8, 9.2, 8, W);
    a.box(ex + sx * 0.92, 3.4, -1.5, 0.1, 2.4, 1, GL);
    a.box(ex + sx * 0.92, 3.4, 1.5, 0.1, 2.4, 1, GL);
    stackSquare(a, ex, 9.2, 0, [1.8, 1.2, 0.6], 1.1, R, R2);
    a.solid(x, -0.4, 1.9, 3.9);
  }
  a.solid(0, -0.2, 15.5, 3.8);
  a.solid(0, -3.9, 4.5, 1.4);

  // купол: основание с четырьмя шпилями-башенками, восьмигранный барабан, красный ребристый купол, фонарь и шпиль
  a.box(0, 8.4, 1, 9, 3, 9, W);
  for (const side of SIDES) for (const u of [-2.4, 0, 2.4]) fbox(a, 0, 1, side, u, 9, 4.52, 0.8, 1.8, 0.1, GL);
  for (const [cx, cz] of CORNERS) {
    const x = cx * 4.4;
    const z = 1 + cz * 4.4;
    a.box(x, 8.4, z, 1, 8, 1, W);
    const t = stack(a, x, 16.4, z, [1.1, 0.75, 0.45, 0.2], 0.9, W2, W);
    a.box(x, t, z, 0.15, 0.6, 0.15, GOLD);
  }
  oct(a, 0, 11.4, 1, 3.8, 3.8, W, W2);
  for (let k = 0; k < 8; k++) {
    const ang = (k * Math.PI) / 4;
    fbox(a, 0, 1, [Math.cos(ang), Math.sin(ang)], 0, 12, 3.8, 0.9, 2.4, 0.12, GL);
    const va = ang + Math.PI / 8;
    a.box(Math.cos(va) * 4.1, 11.4, 1 + Math.sin(va) * 4.1, 0.4, 4.6, 0.4, W2); // пинакли барабана
    a.box(Math.cos(va) * 4.1, 16, 1 + Math.sin(va) * 4.1, 0.2, 0.8, 0.2, W3);
  }
  oct(a, 0, 15.2, 1, 4.2, 0.4, W2);
  let y = 15.6;
  const DR = 4.0;
  [1, 0.95, 0.86, 0.72, 0.54, 0.32].forEach((k, i) => {
    const h = DR * 0.22;
    oct(a, 0, y, 1, DR * k, h, i % 2 ? R2 : R);
    for (let v = 0; v < 8; v++) {
      const va = Math.PI / 8 + (v * Math.PI) / 4;
      const rr = DR * k * 1.08;
      a.box(Math.cos(va) * rr, y, 1 + Math.sin(va) * rr, 0.35, h + 0.02, 0.35, W, -va);
    }
    y += h;
  });
  oct(a, 0, y, 1, 0.95, 2.2, W, W2);
  for (const side of SIDES) fbox(a, 0, 1, side, 0, y + 0.4, 0.97, 0.4, 1.3, 0.08, GL);
  const st = stack(a, 0, y + 2.2, 1, [1.5, 1.1, 0.8, 0.5, 0.3], 1.3, R, R2);
  a.box(0, st, 1, 0.4, 0.4, 0.4, GOLD);
  a.box(0, st + 0.4, 1, 0.14, 1.2, 0.14, GOLD);
  a.box(0, st + 0.9, 1, 0.6, 0.14, 0.14, GOLD);
  a.solid(0, 1, 4.6);

  // флаг Венгрии на шпиле правого павильона (широкие полосы)
  a.box(11, 16.4, -0.4, 0.15, 3.4, 0.15, 0x8a8a8a);
  [0xd0302a, 0xf4f4f4, 0x3a7a3a].forEach((c, i) => a.box(12.4, 19.1 - i * 0.45, -0.4, 2.6, 0.45, 0.08, c));
}

/* ---------- Норвегия: деревянная церковь Боргунн — ярусы крыш из дранки, головы драконов, галерея, апсида, звонница и ели ---------- */
function stave(a) {
  const WD = 0x4a2e1c; // просмолённое дерево
  const WD2 = 0x36220f;
  const WD3 = 0x5e3d24;
  const CARV = 0xa06a38; // резные доски
  const DARK = 0x160e08;
  const STONE = 0x8a8478;
  const RED = 0xc0302a;
  // двускатная крыша уступами: конёк вдоль x (или вдоль z, если alongZ)
  const gable = (x, y0, z, len, widths, h, alongZ = false) => {
    widths.forEach((w, i) => a.box(x, y0 + i * h, z, alongZ ? w : len, h, alongZ ? len : w, i % 2 ? WD2 : WD3));
    return y0 + widths.length * h;
  };
  // голова дракона на коньке, смотрит в сторону (dx, dz)
  const dragon = (x, y, z, dx, dz) => {
    const yaw = yawAlong(dx, dz);
    const P = (k, dy, w, h, d, c, rz = 0) => a.box(x + dx * k, y + dy, z + dz * k, w, h, d, c, yaw, 0, rz);
    P(0.35, -0.1, 1.1, 0.35, 0.3, CARV, 0.6); // шея
    P(0.95, 0.4, 0.85, 0.36, 0.34, CARV); // голова
    P(1.05, 0.18, 0.65, 0.12, 0.28, CARV, -0.25); // нижняя челюсть
    P(1.45, 0.3, 0.3, 0.08, 0.08, RED); // язык
    P(0.75, 0.68, 0.34, 0.34, 0.12, CARV, 0.5); // гребень
  };
  // крест на коньке
  const cross = (x, y, z, alongZ = false) => {
    a.box(x, y, z, 0.18, 1.2, 0.18, CARV);
    a.box(x, y + 0.75, z, alongZ ? 0.14 : 0.7, 0.16, alongZ ? 0.7 : 0.14, CARV);
  };

  // каменный цоколь и галерея-свальганг с арочками
  a.box(0, 0, 0, 11.4, 0.4, 7.8, STONE);
  a.box(0, 0.4, 0, 10.8, 1.8, 7.2, WD);
  for (const sz of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      a.box(-4.2 + k * 1.4, 1.0, sz * 3.62, 0.7, 0.9, 0.06, DARK);
      a.box(-4.2 + k * 1.4, 1.9, sz * 3.63, 0.4, 0.15, 0.06, DARK);
    }
  }
  for (const u of [-2.2, 2.2]) a.box(5.42, 1.0, u, 0.06, 0.9, 0.7, DARK);
  for (const u of [-2.4, -1.2, 1.2, 2.4]) a.box(-5.42, 1.0, u, 0.06, 0.9, 0.6, DARK);
  a.box(0, 2.2, 0, 11.4, 0.35, 7.8, WD2);
  a.box(0, 2.55, 0, 10.4, 0.35, 6.8, WD3);
  // западный портал с резной рамой и навесом
  a.box(-5.45, 0.4, 0, 0.15, 2.4, 1.9, CARV);
  a.box(-5.52, 0.4, 0, 0.1, 1.9, 1.1, DARK);
  gable(-5.9, 2.2, 0, 1.0, [2.4, 1.6, 0.8], 0.45);
  cross(-6.2, 3.55, 0, true);

  // неф и первый ярус крыши с крестами на фронтонах
  a.box(0, 2.2, 0, 7.6, 4.0, 4.8, WD);
  for (const sz of [-1, 1]) for (const x of [-2.4, 0, 2.4]) a.box(x, 5.2, sz * 2.42, 0.4, 0.4, 0.06, DARK);
  const r1 = gable(0, 6.2, 0, 8.4, [6.0, 4.8, 3.6, 2.4, 1.2], 0.6);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) beam(a, [sx * 4.25, 6.1, sz * 3.1], [sx * 4.25, r1 + 0.1, 0], 0.25, CARV);
    cross(sx * 4.25, r1, 0);
  }
  // верхний неф, второй ярус с поперечными фронтонами и четырьмя драконами
  a.box(0, 8.0, 0, 5.4, 3.0, 3.0, WD);
  for (const sz of [-1, 1]) for (const x of [-1.6, 1.6]) a.box(x, 9.6, sz * 1.52, 0.35, 0.35, 0.06, DARK);
  const r2 = gable(0, 11, 0, 6.2, [4.0, 3.1, 2.2, 1.3, 0.5], 0.55);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) beam(a, [sx * 3.15, 10.9, sz * 2.05], [sx * 3.15, r2 + 0.05, 0], 0.22, CARV);
    dragon(sx * 3.15, r2 - 0.1, 0, sx, 0);
  }
  for (const sz of [-1, 1]) {
    const g = gable(0, 11, sz * 1.7, 1.6, [1.8, 1.2, 0.6], 0.5, true);
    dragon(0, g - 0.1, sz * 2.5, 0, sz);
  }
  // башенка со звонницей, юбка крыши и высокий шпиль
  a.box(0, 13.2, 0, 2.2, 2.2, 2.2, WD);
  for (const side of SIDES) fbox(a, 0, 0, side, 0, 13.8, 1.1, 0.8, 1.0, 0.08, DARK);
  stackSquare(a, 0, 15.4, 0, [3.0, 2.4], 0.5, WD2, WD3);
  a.box(0, 16.4, 0, 1.6, 1.4, 1.6, WD);
  for (const side of SIDES) fbox(a, 0, 0, side, 0, 16.7, 0.8, 0.6, 0.8, 0.08, DARK);
  const sp = stackSquare(a, 0, 17.8, 0, [2.2, 1.7, 1.3, 0.95, 0.65, 0.4, 0.2], 1.0, WD3, WD2);
  a.box(0, sp, 0, 0.12, 1.2, 0.12, 0xc99a3a);
  a.box(0.3, sp + 0.8, 0, 0.6, 0.35, 0.06, 0xc99a3a); // флюгер
  a.solid(0, 0, 5.4, 3.6);

  // алтарная часть и круглая апсида с башенкой
  a.box(4.9, 0.4, 0, 2.4, 3.8, 3.2, WD);
  gable(4.9, 4.2, 0, 2.6, [3.8, 2.8, 1.8, 0.8], 0.5);
  round(a, 6.5, 0.4, 0, 1.9, 3.2, WD, WD3);
  const at = stack(a, 6.5, 3.6, 0, [2.3, 1.7, 1.1, 0.6], 0.55, WD2, WD3);
  round(a, 6.5, at, 0, 0.7, 0.9, WD);
  const at2 = stack(a, 6.5, at + 0.9, 0, [0.9, 0.55, 0.25], 0.6, WD2, WD3);
  cross(6.5, at2, 0, true);
  a.solid(5.8, 0, 1.8, 1.6);

  // отдельная звонница
  const BX = 4.8;
  const BZ = -5.6;
  a.box(BX, 0, BZ, 2.6, 1.2, 2.6, WD2);
  a.box(BX, 1.2, BZ, 2.0, 2.4, 2.0, WD);
  a.box(BX, 3.6, BZ, 1.6, 1.4, 1.6, DARK);
  a.box(BX, 3.8, BZ, 0.6, 0.7, 0.6, 0xc99a3a); // колокол
  for (const [sx, sz] of CORNERS) a.box(BX + sx * 0.8, 3.6, BZ + sz * 0.8, 0.3, 1.4, 0.3, WD);
  const bt = stackSquare(a, BX, 5.0, BZ, [2.6, 2.0, 1.4, 0.8, 0.3], 0.6, WD3, WD2);
  a.box(BX, bt, BZ, 0.12, 0.7, 0.12, CARV);
  a.solid(BX, BZ, 1.3);

  // ели, деревянные кресты и камни у ограды
  for (const [x, z, h] of [[-6.8, -3.7, 5.5], [-6.8, 3.4, 6.5], [1.8, 7.1, 5], [6.0, 4.8, 6], [-3.2, 7.0, 4.5]]) {
    fir(a, x, 0, z, h, 2.2);
    a.solid(x, z, 0.5);
  }
  for (const [x, z] of [[-2.5, -5.4], [-1, -6.2], [0.6, -5.6], [-3.9, -6.3]]) {
    a.box(x, 0, z, 0.16, 1.0, 0.16, WD3);
    a.box(x, 0.6, z, 0.6, 0.14, 0.14, WD3);
    a.box(x + 0.4, 0, z + 0.5, 0.5, 0.35, 0.3, STONE);
  }
}

/* ---------- Швейцария: Маттерхорн — кривой пик со снежными гребнями и крестом, ледник, шале с геранями, корова, флаг и фуникулёр ---------- */
function matterhorn(a) {
  const R = 0x8e9398;
  const R2 = 0x80858a;
  const R3 = 0x5c6166;
  const SN = 0xf4f7fa;
  const SN2 = 0xdde5ec;
  const ICE = 0xbfe4f2;
  const WOOD = 0x8a5a3a;
  const WOOD2 = 0x5a3a24;
  const RED = 0xd52b1e;
  const WHITE = 0xffffff;
  // вся сцена чуть повёрнута: гора стоит к порту гранью, а не лбом
  const TH = 0.3;
  const cs = Math.cos(TH);
  const sn = Math.sin(TH);
  const L = (lx, lz) => [lx * cs + lz * sn, -lx * sn + lz * cs];
  const B = (lx, y0, lz, w, h, d, c, ry = 0, rx = 0, rz = 0) => {
    const [x, z] = L(lx, lz);
    a.box(x, y0, z, w, h, d, c, TH + ry, rx, rz);
  };

  // гора: ярусы сужаются, клонятся на восток и чуть закручиваются; снег на уступах и гребнях
  const N = 20;
  const H = 2.1;
  let peak = [0, 0];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const w = 1.3 + 18.7 * Math.pow(1 - t, 1.7);
    const d = w * 0.85;
    const ox = 3.4 * Math.pow(t, 2.2);
    const oz = -0.8 * t * t;
    const tw = 0.35 * t;
    const y = i * H;
    const snowy = i >= 14;
    const P = (u, v) => [ox + u * Math.cos(tw) + v * Math.sin(tw), oz - u * Math.sin(tw) + v * Math.cos(tw)];
    const rock = i === 0 ? 0x6f8f4f : i === 1 ? 0x7a8a6a : [R, R2][i % 2];
    B(ox, y, oz, w, H, d, snowy ? (i % 2 ? SN : SN2) : rock, tw);
    if (i >= 3 && !snowy) B(ox, y + H - 0.01, oz, w * 0.97, 0.3, d * 0.97, SN2, tw); // снег на уступе
    if (i >= 2) {
      const s = Math.max(0.5, Math.min(1.3, w * 0.12));
      for (const [sx, sz] of CORNERS) {
        const [px, pz] = P((sx * w) / 2 - sx * s * 0.3, (sz * d) / 2 - sz * s * 0.3);
        B(px, y, pz, s, H + 0.02, s, snowy ? R3 : SN, tw); // гребни
      }
    }
    if (i >= 3 && i <= 13) {
      for (const [u, v] of [[((i % 3) - 1) * w * 0.25, -d / 2], [w / 2, ((i % 2) - 0.5) * d * 0.4], [-w / 2, ((i % 3) - 1) * d * 0.3]]) {
        const [px, pz] = P(u, v);
        const side = Math.abs(u) === w / 2;
        B(px, y, pz, side ? 0.3 : 1.2, H + 0.02, side ? 1.2 : 0.3, i % 2 ? SN2 : SN, tw); // снежные кулуары
      }
    }
    peak = [ox, oz];
  }
  // загнутая макушка и крест на вершине
  B(peak[0] + 0.35, N * H, peak[1], 1.1, 0.9, 0.9, SN, 0.6);
  B(peak[0] + 0.7, N * H + 0.9, peak[1], 0.6, 0.5, 0.6, R3, 0.6);
  B(peak[0] + 0.7, N * H + 1.4, peak[1], 0.12, 1.3, 0.12, 0xb8bcc0);
  B(peak[0] + 0.7, N * H + 2.2, peak[1], 0.7, 0.12, 0.12, 0xb8bcc0);
  a.solid(0, 0, 9.5);

  // ледник на восточном склоне, валуны у подножия
  B(11, 0, 1, 2.6, 0.35, 6.2, ICE);
  B(10.5, 0.35, 1, 1.6, 0.3, 4.8, 0xe6f4fa);
  for (const z of [-0.8, 0.6, 2]) B(11.4, 0.36, z, 1.4, 0.05, 0.15, 0x7fb8d0);
  for (const [x, z, s] of [[10.6, -7, 1.3], [-10.8, 5.6, 1.5], [-10.5, -7.2, 1.0], [8.6, 8.8, 1.1]]) B(x, 0, z, s * 1.3, s, s, R2, x * 0.3);

  // швейцарское шале: каменный низ, деревянный верх, балкон с геранями, красные ставни
  const CX = -1.5;
  const CZ = -11.6;
  B(CX, 0, CZ, 4.2, 1.0, 3.2, 0x9a948a);
  B(CX, 1.0, CZ, 4.0, 1.8, 3.0, WOOD);
  B(CX + 1.5, 0, CZ - 1.62, 0.8, 1.5, 0.06, WOOD2);
  for (const u of [-1.2, 0.2]) B(CX + u, 0.3, CZ - 1.62, 0.6, 0.5, 0.06, 0x3d4a5a);
  for (const u of [-1.3, 0, 1.3]) {
    B(CX + u, 1.5, CZ - 1.52, 1.1, 0.75, 0.06, RED); // ставни
    B(CX + u, 1.5, CZ - 1.56, 0.55, 0.75, 0.06, 0x3d4a5a);
  }
  B(CX, 1.0, CZ - 1.85, 4.2, 0.15, 0.7, WOOD2); // балкон
  B(CX, 1.15, CZ - 2.15, 4.2, 0.45, 0.1, WOOD2);
  for (let k = 0; k < 5; k++) B(CX - 1.6 + k * 0.8, 1.6, CZ - 2.15, 0.45, 0.3, 0.3, k % 2 ? 0xf07ab0 : 0xe0303a); // герани
  [2.6, 1.6, 0.6].forEach((w, i) => B(CX, 2.8 + i * 0.4, CZ, 3.9, 0.4, w, WOOD));
  [4.2, 3.0, 1.8, 0.6].forEach((w, i) => B(CX, 2.8 + i * 0.4, CZ, 5, 0.4, w, i % 2 ? WOOD2 : 0x4a2e1c));
  B(CX + 1.2, 3.4, CZ + 0.6, 0.5, 1.4, 0.5, 0x9a948a);
  for (const u of [-1.4, 0.2]) B(CX + u, 3.25, CZ - 1.2, 0.45, 0.25, 0.45, 0x9a948a);
  {
    const [x, z] = L(CX, CZ);
    a.solid(x, z, 2.2, 1.9);
  }
  // флаг Швейцарии
  B(3.2, 0, -11.6, 0.15, 5.6, 0.15, 0x8a8a8a);
  B(4.1, 3.9, -11.6, 1.6, 1.6, 0.1, RED);
  B(4.1, 4.55, -11.6, 1.0, 0.3, 0.12, WHITE);
  B(4.1, 4.2, -11.6, 0.3, 1.0, 0.12, WHITE);
  // бурёнка с колокольчиком
  const KX = -6.8;
  const KZ = -10.8;
  const COW = 0xf4f0e8;
  const SPOT = 0x6a3a20;
  B(KX, 0.7, KZ, 1.6, 0.8, 0.8, COW);
  B(KX + 0.3, 0.9, KZ, 0.6, 0.5, 0.84, SPOT);
  B(KX - 0.3, 1.1, KZ, 0.4, 0.4, 0.84, SPOT);
  for (const [dx, dz] of CORNERS) B(KX + dx * 0.6, 0, KZ + dz * 0.25, 0.2, 0.7, 0.2, COW);
  B(KX - 1.0, 1.1, KZ, 0.55, 0.5, 0.5, SPOT);
  B(KX - 1.3, 1.05, KZ, 0.15, 0.3, 0.4, 0xe8b0a0);
  B(KX - 0.95, 1.6, KZ, 0.1, 0.12, 0.8, 0xe8e0c8);
  B(KX - 0.8, 0.75, KZ, 0.25, 0.3, 0.25, GOLD);
  B(KX + 0.85, 0.9, KZ, 0.1, 0.6, 0.1, COW);

  // фуникулёр: нижняя станция, трос, красная кабинка и хижина на склоне
  const p = [7.5, 2.6, -10.8];
  const q = [1.5, 9.4, -6.4];
  B(p[0], 0, p[2], 1.8, 2.2, 1.6, 0xe8e0d0);
  B(p[0], 2.2, p[2], 2.1, 0.4, 1.9, RED);
  B(q[0], 8.4, q[2], 1.6, 1.3, 1.2, WOOD);
  B(q[0], 9.7, q[2], 1.9, 0.35, 1.5, RED);
  const [px, pz] = L(p[0], p[2]);
  const [qx, qz] = L(q[0], q[2]);
  beam(a, [px, p[1], pz], [qx, q[1], qz], 0.08, 0x3a3a3a);
  const cx = (px + qx) / 2;
  const cz = (pz + qz) / 2;
  const cy = (p[1] + q[1]) / 2;
  a.box(cx, cy - 0.6, cz, 0.1, 0.6, 0.1, 0x3a3a3a);
  a.box(cx, cy - 1.4, cz, 0.9, 0.8, 0.9, RED, TH);
  a.box(cx, cy - 1.15, cz, 0.94, 0.35, 0.6, 0xcfe3ea, TH);

  // ели на северном склоне
  for (const [x, z, h] of [[-5, 11.5, 4.5], [-1.5, 12.3, 5.5], [2.5, 11.8, 4], [6, 10.8, 5]]) {
    const [wx, wz] = L(x, z);
    fir(a, wx, 0, wz, h, 2.1);
    a.solid(wx, wz, 0.5);
  }
}

/* ---------- Исландия: гейзер Строккур — бирюзовое жерло с пузырём, террасы натёков, Большой Гейзир, горячие котлы, мостки и дом под травой ---------- */
function geysir(a) {
  const ROCK = 0x5a544c;
  const BASALT = 0x48484a;
  const S1 = 0xc8a878; // кремнистые натёки: охра, песочный, белый
  const S2 = 0xe0d4b0;
  const S3 = 0xf2ecdc;
  const TQ = 0x3fc0d8; // бирюзовая вода
  const DEEP = 0x1f7fb0;
  const BUB = 0x9fe8f0;
  const RUST = 0xd8782a;
  const SULF = 0xe8d040;
  const MOSS = 0x7a8a5c; // мох серо-оливковый
  const PLANK = 0x9a6a3a;
  const PLANK2 = 0x7a5230;
  // террасы из натёков вокруг жерла
  round(a, 0, 0, 0, 16, 0.3, ROCK, 0x625c52);
  round(a, 0, 0.3, 0, 12, 0.35, S1);
  round(a, 0, 0.65, 0, 8.4, 0.3, S2);
  round(a, 0, 0.95, 0, 5.4, 0.25, S3);
  // Строккур: бирюзовая чаша, синяя глубина и вздувшийся водяной пузырь; кромка из натёков
  round(a, 0, 1.2, 0, 3.4, 0.08, TQ);
  round(a, 0, 1.22, 0, 1.8, 0.08, DEEP);
  round(a, 0, 1.25, 0, 1.2, 0.22, BUB);
  round(a, 0, 1.47, 0, 0.6, 0.12, 0xd8f8fc);
  for (let k = 0; k < 10; k++) {
    const ang = (k / 10) * TAU;
    a.box(Math.cos(ang) * 2.05, 1.2, Math.sin(ang) * 2.05, 1.3, 0.3, 0.45, S3, tangent(ang));
  }
  const spout = a.group(0, 1.5, 0);
  spout.userData.geyser = true;
  a.solid(0, 0, 2.2);
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * TAU + 0.2;
    a.box(Math.cos(ang) * 2.9, 1.2, Math.sin(ang) * 2.9, 0.9, 0.05, 0.6, k % 2 ? RUST : 0xe8b060, tangent(ang)); // цветная кайма
  }
  // ручейки от жерла — рыжие полосы бактерий
  for (const [ang, len] of [[0.5, 3.4], [2.2, 2.6], [4.1, 3.0], [5.4, 2.2]]) {
    const r = 2.3 + len / 2;
    a.box(Math.cos(ang) * r, 1.0, Math.sin(ang) * r, len, 0.04, 0.45, RUST, yawAlong(Math.cos(ang), Math.sin(ang)));
  }

  // Большой Гейзир: широкая чаша на холмике и пар над ней
  const GX = -5;
  const GZ = 3.5;
  round(a, GX, 0.65, GZ, 3.8, 0.4, S3, S2);
  round(a, GX, 1.05, GZ, 2.9, 0.08, TQ);
  round(a, GX, 1.07, GZ, 1.3, 0.08, DEEP);
  const steam = a.group(GX, 1.2, GZ);
  steam.userData.mist = 1.6;
  a.solid(GX, GZ, 1.6);
  a.box(GX - 2.5, 0.65, GZ + 1.9, 2.4, 0.05, 0.5, RUST, -0.7);

  // горячие котлы: голубой, бирюзовый и рыжий, с жёлтой серой по краю
  for (const [x, z, c] of [[5.2, -3.8, 0x3a9ad8], [4.6, 4.4, 0x2fa89a], [-3.6, -5.2, RUST]]) {
    round(a, x, 0.65, z, 2.0, 0.14, S3);
    round(a, x, 0.72, z, 1.4, 0.1, c);
    a.box(x + 0.8, 0.79, z - 0.4, 0.3, 0.25, 0.3, SULF);
    a.box(x - 0.6, 0.79, z + 0.7, 0.25, 0.2, 0.25, SULF);
  }
  const hot = a.group(5.2, 0.9, -3.8);
  hot.userData.mist = 0.8;
  // булькающий грязевой котёл
  round(a, 6.8, 0.65, 0.5, 1.8, 0.14, 0x8a8480);
  for (const [dx, dz, s] of [[-0.3, -0.2, 0.35], [0.35, 0.3, 0.25], [0.1, -0.5, 0.2]]) a.box(6.8 + dx, 0.79, 0.5 + dz, s, s * 0.6, s, 0xa8a29c);

  // деревянные мостки с верёвочным ограждением
  const R = 8.8;
  const n = 11;
  const a0 = 0.4;
  const a1 = 2.6;
  for (let k = 0; k < n; k++) {
    const ang = a0 + ((a1 - a0) * (k + 0.5)) / n;
    a.box(Math.cos(ang) * R, 0, Math.sin(ang) * R, (R * (a1 - a0)) / n + 0.05, 0.22, 1.3, k % 2 ? PLANK : PLANK2, tangent(ang));
  }
  for (let k = 0; k <= n; k += 2) {
    const ang = a0 + ((a1 - a0) * k) / n;
    a.box(Math.cos(ang) * (R + 0.55), 0.2, Math.sin(ang) * (R + 0.55), 0.15, 0.9, 0.15, PLANK2);
    if (k < n - 1) {
      const m = a0 + ((a1 - a0) * (k + 1)) / n;
      a.box(Math.cos(m) * (R + 0.52), 0.85, Math.sin(m) * (R + 0.52), (2 * R * (a1 - a0)) / n, 0.07, 0.07, 0xc8b89a, tangent(m));
    }
  }
  // табличка «Осторожно, горячо!»
  a.box(7.6, 0, 2.4, 0.15, 1.6, 0.15, PLANK2);
  a.box(7.6, 1.2, 2.4, 0.1, 0.8, 1.1, SULF, 0.2);
  a.box(7.54, 1.35, 2.42, 0.06, 0.45, 0.45, 0xc0302a, 0.2);

  // скамейка на мостках
  a.box(Math.cos(1.5) * 9.6, 0.5, Math.sin(1.5) * 9.6, 1.6, 0.15, 0.5, PLANK, tangent(1.5));
  for (const e of [-0.6, 0.6]) a.box(Math.cos(1.5 + e / 9.6) * 9.6, 0, Math.sin(1.5 + e / 9.6) * 9.6, 0.15, 0.5, 0.4, PLANK2, tangent(1.5));
  // исландский люпин — фиолетовые свечки цветов
  for (const [x, z] of [[-9.6, -0.4], [-9.9, 0.4], [-9.0, -1.2], [8.8, -2.2], [9.4, -1.2], [8.2, -3.0]]) {
    a.box(x, 0, z, 0.12, 0.6, 0.12, 0x5a8a3a);
    a.box(x, 0.6, z, 0.3, 0.6, 0.3, x < 0 ? 0x8a5ad0 : 0xb07ae0);
  }
  // исландская лошадка со светлой гривой
  const EX = -8.6;
  const EZ = 3.3;
  const HORSE = 0x8a5a36;
  a.box(EX, 0.7, EZ, 1.5, 0.7, 0.65, HORSE);
  for (const [dx, dz] of CORNERS) a.box(EX + dx * 0.55, 0, EZ + dz * 0.2, 0.2, 0.75, 0.2, 0x6a4428);
  a.box(EX - 0.85, 1.1, EZ, 0.45, 0.8, 0.45, HORSE, 0, 0, -0.4);
  a.box(EX - 1.25, 1.6, EZ, 0.65, 0.4, 0.4, HORSE);
  a.box(EX - 0.8, 1.45, EZ, 0.3, 0.55, 0.5, 0xf0e0b0, 0, 0, -0.4); // грива
  a.box(EX + 0.85, 0.6, EZ, 0.2, 0.8, 0.25, 0xf0e0b0, 0, 0, 0.2); // хвост
  a.solid(EX, EZ, 1.1, 0.5);

  // базальтовые валуны с мхом
  for (let k = 0; k < 5; k++) {
    const ang = 3.0 + k * 0.5;
    const s = 1.2 + (k % 3) * 0.3;
    const x = Math.cos(ang) * 9.4;
    const z = Math.sin(ang) * 9.4;
    a.box(x, 0, z, s * 1.2, s * 0.9, s, BASALT, ang);
    a.box(x, s * 0.9, z, s * 0.9, 0.25, s * 0.7, MOSS, ang);
    a.solid(x, z, s * 0.5);
  }

  // исландский домик под травяной крышей
  const HX = 6.9;
  const HZ = -5.6;
  a.box(HX, 0, HZ, 2.6, 1.6, 3.0, 0x8a7a66);
  [[2.4, 1.6], [1.8, 0.4], [1.2, 0.4], [0.6, 0.4]].reduce((y, [w, h]) => {
    a.box(HX - 1.36, y, HZ, 0.12, h, w, 0xf0ece0); // белый фронтон
    return y + h;
  }, 0);
  a.box(HX - 1.44, 0, HZ, 0.08, 1.2, 0.6, 0x9a2a2a);
  a.box(HX - 1.44, 1.9, HZ, 0.08, 0.4, 0.4, 0x3d4a5a);
  [3.4, 2.6, 1.8, 1.0].forEach((d, i) => a.box(HX + 0.1, 1.6 + i * 0.4, HZ, 3.0, 0.4, d, i % 2 ? 0x5a8a3a : 0x6a9a44));
  a.box(HX + 0.8, 2.8, HZ + 0.5, 0.4, 0.9, 0.4, 0x8a8478);
  a.solid(HX, HZ, 1.5, 1.7);

  // флаг Исландии
  a.box(-7.6, 0, -4.4, 0.15, 4.6, 0.15, 0x8a8a8a);
  a.box(-6.6, 3.3, -4.4, 1.8, 1.2, 0.08, 0x1f4fa0);
  a.box(-6.6, 3.75, -4.4, 1.8, 0.3, 0.1, 0xffffff);
  a.box(-6.85, 3.3, -4.4, 0.3, 1.2, 0.1, 0xffffff);
  a.box(-6.6, 3.83, -4.4, 1.8, 0.14, 0.12, 0xd0302a);
  a.box(-6.85, 3.3, -4.4, 0.14, 1.2, 0.12, 0xd0302a);
}

/* ---------- Италия: Везувий — дымящий конус с кратером и лавой, гребень Сомма, обсерватория, у подножия руины Помпей с храмом и пекарней ---------- */
function vesuvius(a) {
  const LAVA = 0xe85a2a;
  const LAVA2 = 0xff8a30;
  const CRUST = 0x3a3230;
  const TUFA = 0xcfc2a4; // туф и мрамор Помпей
  const TUFA2 = 0xb8aa8c;
  const BRICK = 0xa8664a;
  const PRED = 0x9a2a22; // помпейский красный
  const OCHRE = 0xd8a040;
  const MILL = 0x4a4644;
  const CLAY = 0xc0703a;
  // конус сдвинут назад — впереди, у моря, лежат Помпеи
  const CZ = 2.5;
  const LEVELS = [19, 17, 15, 13, 11.2, 9.6, 8.2, 7.0, 6.2];
  const COLS = [0x6f8a4a, 0x7a8660, 0x7a6a5e, 0x6f6258, 0x6a5f58, 0x5f5650, 0x58504a, 0x4f4844, 0x4a4440];
  const H = 2.4;
  LEVELS.forEach((w, i) => round(a, 0, i * H, CZ, w, H, COLS[i], COLS[Math.min(8, i + 1)]));
  for (let i = 2; i < 8; i++) round(a, 0, i * H + 1.1, CZ, LEVELS[i] + 0.12, 0.25, 0x3f3a36); // слои пепла
  a.solid(0, CZ, 9.3);
  // кратер: зубчатая кромка, лавовое озеро внутри и дым
  const top = LEVELS.length * H;
  round(a, 0, top, CZ, 4.6, 0.12, LAVA);
  round(a, 0, top + 0.02, CZ, 2.2, 0.14, LAVA2);
  for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * TAU;
    a.box(Math.cos(ang) * 2.75, top, CZ + Math.sin(ang) * 2.75, 1.7, 1.0 + (k % 3) * 0.35, 0.9, k % 2 ? 0x3f3a36 : 0x4a4440, tangent(ang));
  }
  const smoke = a.group(0, top + 1.2, CZ);
  smoke.userData.smoke = true;

  // поток лавы по склону до лавового озерца у подножия
  const th = -0.35;
  const yaw = yawAlong(Math.cos(th), Math.sin(th));
  for (let i = LEVELS.length - 1; i >= 1; i--) {
    const r = 0.534 * LEVELS[i];
    const wig = Math.sin(i * 1.7) * 0.25;
    a.box(Math.cos(th) * r - Math.sin(th) * wig, i * H - 0.05, CZ + Math.sin(th) * r + Math.cos(th) * wig, 0.9, H + 0.1, 1.3, i % 2 ? LAVA : LAVA2, yaw);
    const r0 = 0.534 * LEVELS[i - 1];
    const m = (r + r0) / 2;
    a.box(Math.cos(th) * m, i * H - 0.1, CZ + Math.sin(th) * m, r0 - r + 0.4, 0.22, 1.2, LAVA2, yaw);
  }
  a.box(Math.cos(th) * 10.4, 0, CZ + Math.sin(th) * 10.4, 1.6, 0.25, 1.4, LAVA, yaw);
  a.box(11.8, 0, -1.6, 2.6, 0.15, 3.0, LAVA);
  a.box(11.9, 0.1, -1.4, 1.6, 0.12, 1.6, LAVA2);
  for (const [x, z] of [[11, -2.6], [12.6, -0.6], [12.4, -2.4]]) a.box(x, 0.15, z, 0.6, 0.15, 0.5, CRUST, x);

  // гребень древнего вулкана Сомма полумесяцем позади конуса
  for (let k = 0; k < 10; k++) {
    const ang = 0.5 + (k / 9) * 2.1;
    const h = 5 + 3.5 * Math.sin((k / 9) * Math.PI) + (k % 3) * 0.5;
    const x = Math.cos(ang) * 9.2;
    const z = CZ + Math.sin(ang) * 9.2;
    a.box(x, 0, z, 2.3, h, 2.4, k % 2 ? 0x6a5f58 : 0x625850, tangent(ang));
    a.box(x, h, z, 1.2, 1.0, 1.4, 0x524a44, tangent(ang) + 0.3);
    a.box(x + Math.cos(ang) * 0.9, 0, z + Math.sin(ang) * 0.9, 2.2, 1.6, 1.0, 0x6f8a4a, tangent(ang)); // зелёный склон
  }
  a.solid(0, CZ + 8.5, 8, 2);

  // Везувианская обсерватория на склоне
  const OX = -11.6;
  const OZ = 3.2;
  a.box(OX, 0, OZ, 2.6, 1.8, 2.2, 0xd8b890);
  a.box(OX, 1.8, OZ, 2.8, 0.3, 2.4, 0xa8403a);
  for (const u of [-0.7, 0.7]) a.box(OX + 1.32, 0.6, OZ + u, 0.06, 0.8, 0.5, 0x3d4a5a);
  round(a, OX, 2.1, OZ, 1.0, 1.2, 0xe8d8b8);
  const ot = dome(a, OX, 3.3, OZ, 0.6, 0x9aa8b2);
  a.box(OX, ot, OZ, 0.1, 0.6, 0.1, 0x8a8a8a);
  a.solid(OX, OZ, 1.3, 1.1);

  // Помпеи: храм Юпитера — подиум, лестница, колонны (часть сломана), обломок карниза, кирпичная целла
  a.box(0, 0, -12, 5.4, 1.2, 3.4, TUFA2);
  a.box(0, 0, -14.05, 2.6, 0.8, 0.8, TUFA);
  a.box(0, 0, -13.85, 2.8, 0.4, 0.5, TUFA2);
  [3.4, 2.2, 3.4, 3.4, 1.4, 3.0].forEach((h, k) => {
    const x = -2.1 + k * 0.84;
    round(a, x, 1.2, -13.1, 0.55, h, TUFA, 0xe0d6bc);
    if (h > 3.2) a.box(x, 1.2 + h, -13.1, 0.75, 0.25, 0.75, TUFA2);
  });
  a.box(-1.26, 4.85, -13.1, 2.4, 0.5, 0.9, TUFA2);
  for (const x of [-2.1, 2.1]) round(a, x, 1.2, -11.8, 0.55, x < 0 ? 3.0 : 1.8, TUFA);
  a.box(0, 1.2, -10.6, 4.4, 2.2, 0.5, BRICK);
  a.box(-1.4, 3.4, -10.6, 1.4, 0.8, 0.5, BRICK);
  a.box(1.2, 3.4, -10.6, 0.8, 0.4, 0.5, BRICK);
  a.solid(0, -12, 2.7, 1.8);
  // форум: колоннада, обломки колонн на земле
  [[3.6, 2.8], [5.0, 1.6], [6.4, 3.0], [7.8, 2.0], [-3.6, 2.4]].forEach(([x, h]) => {
    round(a, x, 0, -9.9, 0.5, h, TUFA, 0xe0d6bc);
    if (h > 2.5) a.box(x, h, -9.9, 0.7, 0.22, 0.7, TUFA2);
    a.solid(x, -9.9, 0.3);
  });
  a.box(3.6, 0, -11.2, 1.5, 0.45, 0.45, TUFA, 0.4); // упавшая колонна
  a.box(5.6, 0, -11.4, 0.6, 0.5, 0.6, TUFA, 0.2);
  // дом с красными фресками и мозаикой «Осторожно, собака»
  a.box(-6.2, 0, -10.3, 3.2, 2.6, 0.35, TUFA2);
  a.box(-5.2, 2.6, -10.3, 1.2, 0.5, 0.35, TUFA2);
  a.box(-6.2, 0.4, -10.5, 2.8, 1.8, 0.06, PRED);
  a.box(-6.2, 0, -10.5, 2.8, 0.4, 0.07, 0x2a2420);
  a.box(-6.6, 0.9, -10.55, 0.8, 0.8, 0.05, OCHRE);
  a.box(-5.4, 1.0, -10.55, 0.5, 0.6, 0.05, 0x3a6fa0);
  a.box(-7.7, 0, -11.5, 0.35, 2.0, 2.4, TUFA2);
  a.box(-7.5, 0.4, -11.5, 0.06, 1.4, 2.0, PRED);
  a.box(-6.1, 0, -11.6, 1.4, 0.05, 1.0, 0xe8e4d8);
  a.box(-6.1, 0.03, -11.6, 0.7, 0.05, 0.3, 0x2a2420); // собака на мозаике
  a.box(-5.7, 0.03, -11.5, 0.2, 0.05, 0.25, 0x2a2420);
  a.solid(-6.2, -10.8, 1.6, 0.4);
  // пекарня: жернова из лавового камня и печь
  for (const [x, z] of [[4.0, -12.6], [5.6, -12.2]]) {
    a.box(x, 0, z, 1.0, 0.3, 1.0, MILL);
    round(a, x, 0.3, z, 0.6, 0.8, MILL);
    round(a, x, 1.1, z, 0.5, 0.3, 0x5a5654);
    round(a, x, 1.4, z, 0.85, 0.5, MILL);
    a.solid(x, z, 0.5);
  }
  a.box(7.2, 0, -11.6, 1.6, 1.2, 1.4, BRICK);
  round(a, 7.2, 1.2, -11.6, 1.2, 0.5, BRICK);
  a.box(6.38, 0.3, -11.6, 0.06, 0.6, 0.6, 0x2a2420);
  a.solid(7.2, -11.6, 0.8, 0.7);
  // амфоры
  for (const [x, z] of [[-3.2, -13.2], [-2.6, -13.7], [-3.8, -13.6]]) {
    a.box(x, 0, z, 0.2, 0.25, 0.2, CLAY);
    round(a, x, 0.25, z, 0.5, 0.6, CLAY);
    a.box(x, 0.85, z, 0.22, 0.35, 0.22, CLAY);
  }
  // итальянские сосны-зонтики
  for (const [x, z] of [[-10, -7.6], [10.2, -7]]) {
    a.box(x, 0.03, z, 0.45, 5, 0.45, 0x7a5a3a, 0, 0.1);
    a.box(x, 4.8, z + 0.3, 3.4, 0.8, 3.0, 0x3f7a3a);
    a.box(x, 5.6, z + 0.3, 2.4, 0.5, 2.2, 0x4a8a44);
    a.solid(x, z, 0.4);
  }
}

/* ---------- Румыния: замок Бран — белые башни на скале, красные островерхие крыши, фахверк, лестница к воротам, летучие мыши и ели ---------- */
function bran(a) {
  const W = 0xefe6d6;
  const W2 = 0xdcd2bf;
  const W3 = 0xc8bca4;
  const R = 0xc0543a; // черепица
  const R2 = 0xa8442e;
  const WOOD = 0x5a3a24;
  const DARK = 0x2a2420;
  const ROCK = 0x8a8278;
  const ROCK2 = 0x7a7268;
  const ROCK3 = 0x6a645c;
  const MOSS = 0x7a8a5c;
  const BAT = 0x1a1a1e;
  const Y = 5.5; // уровень двора на скале
  // окошко на грани постройки
  const win = (cx, cz, side, u, y, off, w = 0.6, h = 0.9) => fbox(a, cx, cz, side, u, y, off, w, h, 0.1, DARK);

  // скала уступами, валуны и мох
  a.box(0, 0, 0, 15, 2.2, 12, ROCK2, 0.15);
  a.box(0.5, 2.2, 0.3, 12.5, 1.8, 10, ROCK, -0.1);
  a.box(0.2, 4.0, 0, 10.6, 1.5, 8.6, ROCK2, 0.08);
  for (const [x, y, z, s, r] of [[-6.4, 0, -4.2, 1.8, 0.4], [6.6, 0, 3.6, 2.0, 0.9], [-5.6, 2.2, 3.4, 1.5, 0.2], [5.4, 2.2, -3.6, 1.4, 0.7], [-7.2, 0, 2.2, 1.4, 1.1]]) {
    a.box(x, y, z, s * 1.3, s, s, ROCK3, r);
    a.box(x, y + s, z, s, 0.3, s * 0.8, MOSS, r);
  }
  a.solid(0, 0, 7.4, 6);

  // главный корпус: белые стены, окошки, фахверк верхнего этажа, крутая крыша со слуховыми окнами
  a.box(0, Y, 0, 8.4, 5.5, 6.4, W);
  a.box(0, Y, 0, 8.8, 0.5, 6.8, W3);
  for (const side of [[0, -1], [0, 1]]) {
    for (const u of [-3, -1.5, 0, 1.5, 3]) win(0, 0, side, u, Y + 1.2, 3.2);
    fbox(a, 0, 0, side, 0, Y + 3.5, 3.24, 8.4, 0.18, 0.1, WOOD);
    fbox(a, 0, 0, side, 0, Y + 5.3, 3.24, 8.4, 0.18, 0.1, WOOD);
    for (let k = 0; k <= 8; k++) fbox(a, 0, 0, side, -4 + k, Y + 3.5, 3.24, 0.16, 1.9, 0.1, WOOD);
    for (const u of [-2.5, 0.5, 2.5]) win(0, 0, side, u, Y + 4.0, 3.26, 0.5, 0.8);
  }
  [7.0, 5.6, 4.2, 2.8, 1.4].forEach((d, i) => a.box(0, Y + 5.5 + i * 0.7, 0, 8.8, 0.7, d, i % 2 ? R2 : R));
  for (const x of [-2, 2]) {
    a.box(x, Y + 6.2, -2.6, 1.0, 0.9, 1.0, W2);
    a.box(x, Y + 6.3, -3.12, 0.5, 0.6, 0.06, DARK);
    a.box(x, Y + 7.1, -2.6, 1.3, 0.3, 1.3, R2);
  }
  a.box(-1, Y + 8.5, 0.8, 0.5, 1.2, 0.5, W3); // труба

  // большая круглая башня с конусом
  const RX = -4;
  const RZ = -2.4;
  round(a, RX, Y, RZ, 3.8, 9.5, W, W2);
  for (const [u, y] of [[-0.6, Y + 1.5], [0.4, Y + 4.2], [-0.3, Y + 7]]) win(RX, RZ, [0, -1], u, y, 1.92, 0.45, 0.9);
  win(RX, RZ, [-1, 0], 0, Y + 5.5, 1.92, 0.45, 0.9);
  round(a, RX, Y + 9.5, RZ, 4.1, 0.3, W3);
  const rt = stack(a, RX, Y + 9.8, RZ, [4.3, 3.6, 2.9, 2.2, 1.5, 0.8, 0.3], 0.8, R, R2);
  a.box(RX, rt, RZ, 0.15, 0.8, 0.15, GOLD);
  // квадратная башня с деревянной галереей и воротами
  const SX = 4;
  const SZ = -2.6;
  a.box(SX, Y, SZ, 3.2, 10, 3.2, W);
  for (const side of [[0, -1], [1, 0]]) {
    win(SX, SZ, side, 0, Y + 3.5, 1.62);
    win(SX, SZ, side, 0, Y + 6, 1.62);
  }
  fbox(a, SX, SZ, [0, -1], 0, Y, 1.62, 1.1, 1.7, 0.1, WOOD); // ворота
  fbox(a, SX, SZ, [0, -1], 0, Y + 1.7, 1.62, 0.6, 0.3, 0.1, WOOD);
  a.box(SX, Y + 8.4, SZ, 3.8, 1.6, 3.8, WOOD); // деревянная галерея
  for (const side of SIDES) for (const u of [-0.9, 0.9]) win(SX, SZ, side, u, Y + 8.8, 1.92, 0.5, 0.7);
  const st = stackSquare(a, SX, Y + 10, SZ, [4.2, 3.4, 2.6, 1.8, 1.0, 0.4], 0.9, R, R2);
  a.box(SX, st, SZ, 0.15, 0.8, 0.15, GOLD);
  // высокая башня позади с флагом Румынии
  const TX = 1.5;
  const TZ = 2.8;
  a.box(TX, Y, TZ, 2.8, 12, 2.8, W);
  for (const side of SIDES) for (const y of [Y + 6.5, Y + 9.5]) win(TX, TZ, side, 0, y, 1.42, 0.5, 0.9);
  a.box(TX, Y + 12, TZ, 3.2, 0.3, 3.2, W3);
  const tt = stackSquare(a, TX, Y + 12.3, TZ, [3.4, 2.7, 2.0, 1.3, 0.6], 1.0, R, R2);
  flag(a, TX, tt, TZ, ['BYR', 'BYR', 'BYR'], { B: 0x1f3fa0, Y: 0xf2c94c, R: 0xd0302a }, 0.4);
  // башенка с конусом на заднем углу
  round(a, -3.6, Y, 3, 1.8, 7.5, W, W2);
  win(-3.6, 3, [-1, 0], 0, Y + 5, 0.92, 0.35, 0.7);
  stack(a, -3.6, Y + 7.5, 3, [2.2, 1.7, 1.2, 0.7, 0.3], 0.7, R, R2);
  a.solid(0, 0, 5, 4.2);

  // лестница по скале к воротам
  for (let k = 0; k < 10; k++) {
    const x = -3.8 + k * 0.85;
    const z = -6.9 + (k / 9) * 2.5;
    a.box(x, 0, z, 0.95, (k + 1) * 0.55, 1.0, k % 2 ? W3 : W2);
  }
  a.box(3.2, 0, -7.1, 0.3, 1.2, 0.3, WOOD); // фонарь у лестницы
  a.box(3.2, 1.2, -7.1, 0.4, 0.4, 0.4, 0xffd98a);

  // летучие мыши над замком
  for (const [x, y, z, r] of [[6.2, 17, 3], [-6.5, 19, -1], [2, 25, -4.5], [-3, 14.5, 6.5], [7.4, 12, -5], [-1, 22, 5.5]]) {
    a.box(x, y, z, 0.4, 0.35, 0.3, BAT);
    for (const s of [-1, 1]) a.box(x + s * 0.55, y + 0.12, z, 0.8, 0.12, 0.35, BAT, 0, 0, s * 0.35);
    a.box(x, y + 0.35, z, 0.3, 0.15, 0.1, BAT);
  }

  // еловый лес у подножия
  for (const [x, z, h] of [[0.5, 9.4, 6], [-9.6, 0.5, 5.5], [9.6, -1, 6.5], [-5.2, 8.2, 5], [5.8, 7.4, 4.5], [-8.4, -5.2, 5]]) {
    fir(a, x, 0, z, h, 2.0);
    a.solid(x, z, 0.5);
  }
}

/* ---------- Шотландия: Лох-Несс — Несси с горбами и румяными щеками, руины замка Уркухарт, требушет, хайлендская корова и вереск ---------- */
function nessie(a) {
  const S = 0x8a8478; // старый камень
  const S2 = 0x7a7468;
  const S3 = 0x6a645a;
  const DARK = 0x2a2622;
  const LOCH = 0x2f6a8a; // тёмная вода озера
  const GRASS = 0x5f8a4a;
  const HEATHER = 0x9a5aa8;
  const WOOD = 0x7a5230;
  const N = 0x3a8676; // Несси — зелёная с бирюзой
  const N2 = 0x2f6e64;
  const BELLY = 0x9ad0c0;

  // озеро: тёмная вода, светлые барашки, камни по берегу
  a.box(-2, 0, -5.5, 17, 0.15, 10, LOCH);
  a.box(-2, 0, -11.9, 11, 0.15, 3, LOCH);
  for (const [x, z, w] of [[-8, -3, 2], [3.5, -8.5, 1.6], [-5, -10.5, 1.8], [2, -2, 1.4]]) a.box(x, 0.15, z, w, 0.03, 0.2, 0xa8d0e0);
  for (const [x, z, s] of [[-10.8, -2, 1.2], [-10.4, -8.2, 1.0], [6.8, -4, 1.1], [6.4, -9.2, 0.9], [-7.0, -11.6, 1.0], [4.2, -12.4, 0.8], [-11, -5.4, 0.8]]) {
    a.box(x, 0, z, s * 1.3, s * 0.6, s, S3, x);
  }
  // тростник у воды
  for (const [x, z] of [[-9.8, -0.8], [-9.3, -1.2], [5.8, -1.2], [6.3, -1.6], [-8.6, -11.2]]) {
    a.box(x, 0, z, 0.15, 1.3, 0.15, 0x6a8a3a);
    a.box(x, 1.3, z, 0.22, 0.4, 0.22, 0x7a5a3a);
  }
  // деревянный причал с лодкой
  a.box(-6.5, 0.2, -0.6, 1.4, 0.2, 3.2, WOOD);
  for (const [dx, dz] of CORNERS) a.box(-6.5 + dx * 0.6, 0, -0.6 + dz * 1.4, 0.2, 0.7, 0.2, 0x5a3a20);
  a.box(-8.1, 0.15, -1.6, 1.0, 0.4, 2.4, 0xc0503a);
  a.box(-8.1, 0.55, -1.6, 1.0, 0.1, 0.25, WOOD);

  // Несси: три горба, хвост, длинная шея, голова с глазками, рожками и румяными щёчками
  const n = a.group(-2, 0.3, -5.5);
  cube(n, N, 1.8, 1.3, 1.4, 0.4, 0.3, 0); // передний горб
  cube(n, BELLY, 1.6, 0.5, 1.45, 0.4, -0.2, 0);
  cube(n, N, 1.5, 1.1, 1.2, 1.9, 0.2, 0);
  cube(n, N, 1.1, 0.8, 0.9, 3.1, 0.05, 0);
  cube(n, N, 0.9, 0.35, 0.5, 3.9, -0.05, 0); // хвост
  for (const [x, y] of [[0.4, 1.05], [1.9, 0.85], [3.1, 0.55]]) cube(n, N2, 0.4, 0.35, 0.3, x, y, 0); // гребень
  for (const [x, z] of [[-0.2, 0.8], [-0.2, -0.8], [2.2, 0.7], [2.2, -0.7]]) cube(n, N2, 0.8, 0.15, 0.5, x, -0.05, z).rotation.y = z * 0.5; // ласты
  cube(n, N, 0.8, 1.3, 0.8, -0.7, 1.1, 0).rotation.z = 0.35; // шея
  cube(n, N, 0.7, 1.3, 0.7, -1.05, 2.2, 0).rotation.z = 0.2;
  cube(n, BELLY, 0.3, 2.2, 0.72, -0.7, 1.6, 0).rotation.z = 0.3;
  cube(n, N, 0.62, 1.1, 0.62, -1.2, 3.2, 0);
  cube(n, N, 1.3, 0.8, 0.9, -1.55, 4.0, 0); // голова
  cube(n, N, 0.6, 0.5, 0.7, -2.35, 3.85, 0); // мордочка
  cube(n, 0x1a1a1a, 0.08, 0.08, 0.2, -2.66, 3.95, 0.18); // ноздри
  cube(n, 0x1a1a1a, 0.08, 0.08, 0.2, -2.66, 3.95, -0.18);
  cube(n, 0x1a1a1a, 0.4, 0.06, 0.5, -2.2, 3.62, 0); // улыбка
  for (const s of [-1, 1]) {
    cube(n, 0xffffff, 0.34, 0.34, 0.1, -1.75, 4.2, s * 0.46); // глазки
    cube(n, 0x1a1a1a, 0.18, 0.2, 0.12, -1.82, 4.2, s * 0.5);
    cube(n, 0xf07ab8, 0.3, 0.18, 0.08, -2.0, 3.8, s * 0.46); // щёчки
    cube(n, N2, 0.18, 0.4, 0.18, -1.3, 4.55, s * 0.25); // рожки
  }
  n.userData.swim = true;

  // зелёный мыс с руинами замка Уркухарт
  a.box(4.8, 0, 5.4, 12, 0.8, 7.2, GRASS);
  a.box(4.8, 0, 1.6, 11, 0.5, 1.0, S3); // каменный берег
  // башня Гранта: пять этажей, обломанная крыша, угловые башенки, окна
  const TX = 8;
  const TZ = 5.8;
  a.box(TX, 0.8, TZ, 4.4, 9.4, 4.4, S);
  for (const [sx, sz] of CORNERS) a.box(TX + sx * 2.1, 0.8, TZ + sz * 2.1, 0.5, 9.4, 0.5, S2);
  for (const y of [3.4, 6.2]) a.box(TX, y, TZ, 4.6, 0.25, 4.6, S2);
  for (const side of SIDES) {
    for (const [u, y] of [[-0.9, 2.2], [0.9, 4.6], [0, 7.2]]) fbox(a, TX, TZ, side, u, y, 2.22, 0.5, 1.0, 0.1, DARK);
  }
  fbox(a, TX, TZ, [0, -1], 0, 0.8, 2.22, 1.1, 1.8, 0.1, DARK); // проём входа
  // обломанный верх: зубцы разной высоты, одна угловая башенка уцелела
  for (let k = 0; k < 5; k++) {
    for (const s of [-1, 1]) {
      const h = [1.6, 0.9, 1.3, 0.4, 1.1][(k + (s > 0 ? 2 : 0)) % 5];
      a.box(TX - 1.8 + k * 0.9, 10.2, TZ + s * 1.95, 0.6, h, 0.5, k % 2 ? S2 : S);
      a.box(TX + s * 1.95, 10.2, TZ - 1.8 + k * 0.9, 0.5, h * 0.8, 0.6, S2);
    }
  }
  round(a, TX - 2.3, 8.8, TZ - 2.3, 1.2, 2.8, S);
  stack(a, TX - 2.3, 11.6, TZ - 2.3, [1.4, 1.0, 0.5], 0.5, S3, S2);
  round(a, TX + 2.3, 8.8, TZ - 2.3, 1.2, 1.2, S);
  // флаг Шотландии: белый андреевский крест на синем
  a.box(TX + 1.2, 10.2, TZ + 1.2, 0.15, 4.2, 0.15, 0x8a8a8a);
  a.box(TX + 2.2, 12.8, TZ + 1.2, 1.8, 1.2, 0.08, 0x1f5fb0);
  for (const s of [-1, 1]) a.box(TX + 2.2, 13.4 - 0.11, TZ + 1.2, 2.0, 0.22, 0.1, 0xffffff, 0, 0, s * 0.59);
  a.solid(TX, TZ, 2.4);
  // крепостные стены-руины вдоль берега
  for (const [p, q, h] of [[[5.6, 3.2], [1.5, 2.6], 2.6], [[1.5, 2.6], [-2.2, 3.4], 1.6], [[10.2, 3.6], [11, 0.6], 2.2], [[5.8, 8.2], [2.8, 8.9], 3.0]]) {
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const yaw = yawAlong(q[0] - p[0], q[1] - p[1]);
    const cx = (p[0] + q[0]) / 2;
    const cz = (p[1] + q[1]) / 2;
    a.box(cx, 0, cz, len, h + 0.5, 0.8, S2, yaw);
    a.box(cx + 0.4 * Math.cos(yaw), 0.5 + h, cz - 0.4 * Math.sin(yaw), len * 0.4, 0.6, 0.8, S, yaw);
    a.solid(cx, cz, Math.max(0.5, Math.abs(q[0] - p[0]) / 2), Math.max(0.5, Math.abs(q[1] - p[1]) / 2));
  }
  // ворота с двумя круглыми башнями
  for (const [x, h] of [[1.2, 4.2], [-1.6, 3.2]]) {
    round(a, x, 0, 9.4, 2.2, h + 0.5, S, S2);
    a.box(x, 0.5 + h, 9.4, 1.2, 0.5, 1.2, S3);
    a.solid(x, 9.4, 1.1);
  }
  a.box(-0.2, 2.6, 9.4, 1.2, 1.0, 1.4, S2);
  a.box(-0.2, 0, 9.4, 0.8, 2.6, 1.5, DARK);

  // требушет у замка
  const BX = -6;
  const BZ = 7.2;
  a.box(BX, 0, BZ, 3.0, 0.4, 2.0, WOOD);
  for (const s of [-1, 1]) {
    beam(a, [BX - 1.1, 0.4, BZ + s * 0.8], [BX, 3.4, BZ + s * 0.8], 0.25, WOOD);
    beam(a, [BX + 1.1, 0.4, BZ + s * 0.8], [BX, 3.4, BZ + s * 0.8], 0.25, WOOD);
  }
  a.box(BX, 3.3, BZ, 0.2, 0.2, 1.8, 0x5a3a20);
  beam(a, [BX + 1.8, 1.4, BZ], [BX - 1.6, 5.4, BZ], 0.22, 0x5a3a20);
  a.box(BX + 1.3, 1.0, BZ, 0.9, 0.9, 0.9, S2); // противовес
  a.solid(BX, BZ, 1.4, 1);

  // хайлендская корова: рыжая, лохматая, с длинными рогами
  const KX = -9.4;
  const KZ = 3.2;
  const FUR = 0xc86a2a;
  a.box(KX, 0.6, KZ, 1.7, 1.0, 1.0, FUR);
  for (const [dx, dz] of CORNERS) a.box(KX + dx * 0.6, 0, KZ + dz * 0.3, 0.25, 0.65, 0.25, 0xa8541e);
  a.box(KX - 1.05, 0.9, KZ, 0.6, 0.6, 0.65, FUR);
  a.box(KX - 1.3, 1.25, KZ, 0.3, 0.35, 0.75, 0xe08a3a); // чёлка
  a.box(KX - 1.1, 1.45, KZ, 0.14, 0.14, 1.6, 0xe8e0c8); // рога
  for (const s of [-1, 1]) a.box(KX - 1.1, 1.6, KZ + s * 0.78, 0.12, 0.35, 0.12, 0xe8e0c8);
  a.box(KX + 0.9, 0.8, KZ, 0.12, 0.7, 0.12, FUR);
  a.solid(KX, KZ, 1.2, 0.6);

  // вереск, чертополох и шотландские сосны
  for (const [x, z] of [[-4, 10.4], [-8.2, 6.2], [3.8, 11.4], [-11, 5.8], [-3.2, 5.4]]) {
    a.box(x, 0, z, 1.4, 0.35, 1.0, HEATHER, x);
    a.box(x + 0.3, 0.35, z, 0.6, 0.25, 0.5, 0xb87ac0, x);
  }
  for (const [x, z] of [[-1.8, 11.8], [-5.8, 11.4]]) {
    a.box(x, 0, z, 0.12, 0.9, 0.12, 0x6a8a3a);
    a.box(x, 0.9, z, 0.35, 0.35, 0.35, 0xa04ab0);
  }
  for (const [x, z, h] of [[-11.2, 0.8, 5.5], [-8.4, 9.8, 6], [11.2, 2.4, 5]]) {
    fir(a, x, 0, z, h, 2.1);
    a.solid(x, z, 0.5);
  }
}

export const EUROPE2 = [
  { id: 'stpeter', name: 'Собор Святого Петра', country: 'Ватикан', size: 16, build: stPeters },
  { id: 'venice', name: 'Венеция', country: 'Италия', size: 13, build: venice },
  { id: 'orloj', name: 'Пражские куранты', country: 'Чехия', size: 11.5, build: orloj },
  { id: 'belem', name: 'Башня Белен', country: 'Португалия', size: 11, build: belem },
  { id: 'budapest', name: 'Парламент Будапешта', country: 'Венгрия', size: 17, build: budapest },
  { id: 'stave', name: 'Деревянная церковь', country: 'Норвегия', size: 7, build: stave },
  { id: 'matterhorn', name: 'Гора Маттерхорн', country: 'Швейцария', size: 12.5, build: matterhorn },
  { id: 'geysir', name: 'Гейзер', country: 'Исландия', size: 9, build: geysir },
  { id: 'vesuvius', name: 'Вулкан Везувий', country: 'Италия', size: 13, build: vesuvius },
  { id: 'bran', name: 'Замок Дракулы', country: 'Румыния', size: 9, build: bran },
  { id: 'nessie', name: 'Озеро Лох-Несс', country: 'Шотландия', size: 13, build: nessie },
];
