import { TAU, Q, CORNERS, SIDES, GOLD, WATER, round, stack, stackSquare, dome, beam, polyline, tree } from './kit.js';

// Африка, Океания, Антарктида и древние чудеса света

/* Египет: храм Абу-Симбел — четыре сидящих великана */
function abuSimbel(a) {
  const S = 0xd9b070;
  const S2 = 0xc99f60;
  const S3 = 0xb98f50;
  a.box(0, 0, 3, 28, 16, 8, S2);
  a.box(0, 16, 4, 24, 3, 6, S3);
  [-9, -3, 3, 9].forEach((x, i) => {
    a.box(x, 0, -1.5, 4, 2, 4, S3);
    a.box(x, 2, -1.8, 3.4, 4, 3, S);
    a.box(x, 6, 0, 3.4, 4.4, 2.6, S);
    for (const sx of [-1, 1]) a.box(x + sx, 5.6, -3.2, 0.8, 0.5, 1.2, S2);
    if (i === 1) {
      a.box(x + 2, 0, -5.5, 2.6, 2.6, 2.4, S, 0.3, 0, 0.4); // упавшая голова
      return;
    }
    a.box(x, 9.2, 0.3, 3.4, 3.4, 1.4, S2); // немес
    a.box(x, 10.4, 0, 2.6, 2.8, 2.4, S);
    a.box(x, 11.2, -1.3, 0.6, 1, 0.4, S2);
    a.box(x, 13.2, 0, 1.6, 2, 1.6, S2); // корона
  });
  a.box(0, 0, -1.05, 2.4, 5, 0.2, 0x3a2a1a);
  a.solid(0, 1, 14, 5);
}

/* Танзания: Килиманджаро, акации и жираф */
function kilimanjaro(a) {
  const R = 0x7a6a5a;
  const R2 = 0x6a5a4a;
  const SN = 0xf4f7fa;
  for (let i = 0; i < 8; i++) round(a, 0, i * 2.4, 0, 22 - i * 2.2, 2.4, i >= 6 ? SN : i % 2 ? R : R2);
  for (const [x, z] of [[-11, 9], [11, -8], [9, 10]]) {
    a.box(x, 0, z, 0.5, 2.4, 0.5, 0x5a3a20);
    a.box(x, 2.4, z, 3.2, 0.6, 3.2, 0x5f7a3a);
  }
  const Y = 0xe0b050;
  const gx = -11;
  const gz = -8;
  for (const [dx, dz] of CORNERS) a.box(gx + dx * 0.8, 0, gz + dz * 0.35, 0.3, 3, 0.3, Y);
  a.box(gx, 3, gz, 2.2, 1.2, 1, Y);
  a.box(gx + 1, 4.2, gz, 0.5, 3, 0.5, Y, 0, 0, -0.2);
  a.box(gx + 1.5, 7, gz, 1, 0.6, 0.5, Y);
  for (const [dx, dy] of [[-0.5, 3.4], [0.4, 3.7], [0, 3.2], [1.1, 5]]) a.box(gx + dx, dy, gz - 0.52, 0.35, 0.35, 0.1, 0x8a5a2a); // пятна
  a.solid(0, 0, 11);
  a.solid(gx, gz, 1.2);
}

/* Кейптаун: Столовая гора, «скатерть» из облака и канатная дорога */
function tableMountain(a) {
  const R = 0x8a7f74;
  a.box(0, 0, 2, 30, 6, 16, 0x5f7a44);
  a.box(0, 6, 3, 26, 12, 12, R);
  a.box(0, 18, 3, 25, 1, 11, 0x7a6f64);
  a.box(0, 19, 3, 25.4, 1.2, 11.4, 0xf6f6f6);
  beam(a, [-13, 1, -6], [-8, 19, -2], 0.15, 0x333333);
  a.box(-10.5, 9, -4, 1.2, 1.2, 1.2, 0xc0392b);
  a.solid(0, 3, 14, 7);
}

/* Мали: глиняная мечеть в Дженне */
function djenne(a) {
  const M = 0xb88a5a;
  const M2 = 0xa57a4c;
  const ST = 0x5a4028;
  a.box(0, 0, 0, 22, 2, 16, M2);
  a.box(0, 2, 2, 20, 8, 12, M);
  for (const x of [-6, 0, 6]) {
    a.box(x, 2, -4.6, 3.6, 12, 3, M);
    a.box(x, 14, -4.6, 2.6, 2, 2.2, M2);
    a.box(x, 16, -4.6, 1.4, 1.4, 1.4, M);
    a.box(x, 17.4, -4.6, 0.6, 0.6, 0.6, 0xf4ecd8); // страусиное яйцо
    for (let y = 4; y < 14; y += 2.5) for (const dx of [-1, 1]) a.box(x + dx, y, -6.3, 0.2, 0.2, 1.2, ST); // палки-тороны
  }
  for (const x of [-9, -3, 3, 9]) {
    a.box(x, 2, -4.2, 1.4, 9, 1.6, M);
    a.box(x, 11, -4.2, 0.8, 1, 0.8, M2);
  }
  a.solid(0, 1, 11, 8);
}

/* Замбия и Зимбабве: водопад Виктория и радуга */
function victoria(a) {
  const R = 0x6a5f54;
  a.box(0, 0, 6, 28, 9, 12, R);
  a.box(0, 9, 6, 28, 0.4, 12, 0x4f8f3e);
  a.box(0, 9.4, 6, 24, 0.3, 10, WATER);
  a.box(0, 0, -6, 28, 0.4, 12, WATER);
  for (let i = -11; i <= 11; i++) a.box(i * 1.1, 0.4, -0.3, 1.2, 9.2, 0.6, i % 2 ? 0x8fd0ee : WATER);
  a.box(0, 0.4, -2.2, 24, 0.6, 2.4, 0xe6f5ff);
  const RAIN = [0xe0302a, 0xf08a2a, 0xf4d23a, 0x4fb05a, 0x3a7fd0, 0x7a4ab0];
  RAIN.forEach((c, k) => {
    const r = 11 - k * 0.7;
    for (let i = 0; i <= 16; i++) {
      const ang = (i / 16) * Math.PI;
      a.box(Math.cos(ang) * r, 1 + Math.sin(ang) * r, -8, 0.8, 0.8, 0.2, c, 0, 0, ang);
    }
  });
  const mist = a.group(0, 0.6, -2.2);
  mist.userData.mist = 24;
  a.solid(0, 6, 14, 6);
}

/* Мадагаскар: аллея баобабов и лемур */
function baobabs(a) {
  const T = 0x9a7a60;
  const T2 = 0x8a6a50;
  const C = 0x4f7a3a;
  a.box(0, 0, 0, 4, 0.2, 30, 0xc9a66b);
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const x = side * 4.5;
      const z = -12.5 + i * 5;
      round(a, x, 0, z, 2.4, 12, i % 2 ? T : T2);
      a.box(x, 12, z, 4, 0.6, 1, T2, 0.5);
      a.box(x, 12.3, z, 3, 0.6, 1, T2, -0.6);
      a.box(x + 1.4, 12.9, z, 1.6, 1, 1.6, C);
      a.box(x - 1.4, 12.9, z + 0.4, 1.6, 1, 1.6, C);
      a.solid(x, z, 1.3);
    }
  }
  a.box(4.5, 13, -12.5, 0.8, 0.9, 0.6, 0x9a9a9a); // лемур
  a.box(4.5, 13.9, -12.5, 0.6, 0.5, 0.5, 0x9a9a9a);
  for (let k = 0; k < 6; k++) a.box(4.5, 13 - k * 0.4, -11.9, 0.3, 0.4, 0.3, k % 2 ? 0x1a1a1a : 0xf0f0f0);
}

/* Касабланка: мечеть Хасана II */
function hassan(a) {
  const W = 0xefe8da;
  const T = 0x2f8f7a;
  a.box(4, 0, 0, 14, 7, 18, W);
  a.box(4, 7, 0, 14.4, 1.4, 18.4, T);
  for (let i = 0; i < 6; i++) a.box(-3.05, 1, -7 + i * 2.8, 0.2, 4.5, 1.4, 0x9c8f78);
  a.box(-8, 0, 0, 5, 44, 5, W);
  for (const y of [8, 16, 24, 32, 40]) a.box(-8, y, 0, 5.2, 1.2, 5.2, 0x3fa08a);
  for (const y of [4, 12, 20, 28, 36]) for (const [sx, sz] of SIDES) a.box(-8 + sx * 2.55, y, sz * 2.55, sz ? 1.2 : 0.2, 2.6, sz ? 0.2 : 1.2, 0x2a3a3a);
  a.box(-8, 44, 0, 5.6, 1, 5.6, T);
  a.box(-8, 45, 0, 2.4, 4, 2.4, W);
  dome(a, -8, 49, 0, 1.2, T);
  for (let i = 0; i < 3; i++) a.box(-8, 50.6 + i * 0.7, 0, 0.5, 0.5, 0.5, GOLD);
  a.solid(-8, 0, 2.6);
  a.solid(4, 0, 7, 9);
}

/* Австралия: скала Улуру и кенгуру */
function uluru(a) {
  const R = 0xb5553a;
  const R2 = 0xa04a32;
  [[30, 18, 2.2], [28, 16, 2.2], [26, 14, 2], [23, 12, 2], [19, 9, 1.6]].reduce((y, [w, d, h], i) => {
    a.box(0, y, 0, w, h, d, i % 2 ? R2 : R);
    return y + h;
  }, 0);
  for (let i = 0; i < 9; i++) a.box(-12 + i * 3, 0, -9.05, 0.6, 6 + (i % 3), 0.2, 0x8a3a26); // промоины
  const K = 0xb08060;
  a.box(10, 0, -11, 0.8, 1.6, 1.4, K); // кенгуру
  a.box(10, 1.6, -11.5, 0.6, 0.7, 0.8, K);
  a.box(10, 2.3, -11.6, 0.2, 0.5, 0.2, K);
  a.box(10, 0.2, -10, 0.4, 0.3, 1.6, K, 0, -0.4);
  a.box(10, 0, -11.6, 0.6, 0.3, 1, K);
  a.solid(0, 0, 15, 9);
}

/* Сидней: мост Харбор-Бридж — «вешалка для пальто» */
function harbourBridge(a) {
  const S = 0x7a8088;
  const P = 0xc9b89a;
  a.box(0, 0, 0, 22, 0.3, 30, WATER);
  for (const sx of [-1, 1]) {
    a.box(sx * 13, 0, 0, 3.4, 12, 5, P);
    a.box(sx * 13, 12, 0, 3.8, 1.2, 5.4, P);
    a.solid(sx * 13, 0, 1.8, 2.6);
  }
  a.box(0, 6, 0, 36, 0.8, 4.4, 0x6a7078);
  for (const z of [-2, 2]) {
    const up = [];
    const low = [];
    for (let i = 0; i <= 22; i++) {
      const x = -11 + i;
      const k = 1 - (x / 11) ** 2;
      up.push([x, 8 + 14 * k, z]);
      low.push([x, 6 + 11 * k, z]);
      if (i % 2 === 0) beam(a, [x, 6 + 11 * k, z], [x, 8 + 14 * k, z], 0.25, S);
    }
    polyline(a, up, 0.7, S);
    polyline(a, low, 0.7, S);
  }
}

/* Антарктида: Южный полюс, иглу, станция и пингвины */
function southPole(a) {
  const SN = 0xf4f7fa;
  const IC = 0xcfe8f5;
  a.box(0, 0, 0, 24, 1, 18, SN);
  a.box(8, 1, 5, 4, 5, 3, IC, 0.3);
  a.box(-9, 1, -4, 3, 7, 3, IC, -0.2);
  dome(a, -4, 1, 4, 2.4, SN, IC);
  a.box(-4, 1, 1.5, 1.4, 1.2, 1.4, IC);
  a.box(5, 1, -4, 5, 2.6, 3, 0xc0392b);
  a.box(5, 3.6, -4, 0.2, 3, 0.2, 0x8a8a8a);
  for (let i = 0; i < 6; i++) a.box(0, 1 + i * 0.4, -1, 0.3, 0.4, 0.3, i % 2 ? 0xffffff : 0xd8453a); // полюс
  round(a, 0, 3.4, -1, 0.8, 0.8, 0xd0d8e0);
  for (const [x, z] of [[2, 3], [3.2, 3.4], [1, 5], [-1, 6], [3, 6.2], [-2, 2.4]]) {
    a.box(x, 1, z, 0.8, 1.2, 0.6, 0x1a1a1a);
    a.box(x, 1.1, z - 0.31, 0.6, 0.9, 0.05, 0xffffff);
    a.box(x, 2.2, z, 0.6, 0.5, 0.5, 0x1a1a1a);
    a.box(x, 2.3, z - 0.35, 0.2, 0.15, 0.25, 0xe8a030);
  }
  a.solid(-4, 4, 2.6);
  a.solid(5, -4, 2.6, 1.6);
}

/* Новая Зеландия: Хоббитон — домики в холмах с круглыми дверями */
function hobbiton(a) {
  const G = 0x5fa044;
  const G2 = 0x4f9038;
  const DOORS = [0xe8b830, 0x3f9a55, 0xc0392b, 0x3a6fc0];
  [[-7, -5], [7, -5], [-7, 6], [7, 6]].forEach(([x, z], i) => {
    round(a, x, 0, z, 8, 3, G);
    round(a, x, 3, z, 5.6, 1.6, G2);
    a.box(x, 0.2, z - 4.05, 1.6, 1.6, 0.2, DOORS[i]); // круглая дверь
    a.box(x, 0.2, z - 4.05, 1.6, 1.6, 0.2, DOORS[i], 0, 0, Q);
    a.box(x + 0.4, 0.9, z - 4.2, 0.2, 0.2, 0.1, GOLD);
    a.box(x + 2, 1, z - 3.6, 0.9, 0.9, 0.2, 0xcfe8f5, 0, 0, Q);
    a.box(x - 2, 3, z + 1, 0.8, 2.6, 0.8, 0x9a5a3a); // труба
    a.solid(x, z, 3.6);
  });
  a.box(0, 0, 0, 2, 0.15, 24, 0xc9a66b);
  tree(a, 0, 0, 0, 5, 6, 0x6a4a2e, 0x3f8f3a); // праздничное дерево
  a.solid(0, 0, 0.6);
}

/* Родос: Колосс Родосский над входом в гавань */
function colossus(a) {
  const BR = 0xb08040;
  const BR2 = 0x9a6c34;
  a.box(0, 0, 0, 6, 0.25, 14, WATER);
  for (const sx of [-1, 1]) {
    a.box(sx * 5, 0, 0, 4, 4, 4, 0xd9cfb8);
    beam(a, [sx * 5, 4, 0], [sx * 1.4, 16, 0], 1.6, BR);
    a.solid(sx * 5, 0, 2);
  }
  a.box(0, 15.5, 0, 3.4, 7, 2.2, BR);
  a.box(0, 22.5, 0, 1.8, 2, 1.8, BR);
  for (let r = -3; r <= 3; r++) {
    const ang = r * 0.45;
    a.box(Math.sin(ang) * 1.2, 23.6, -Math.cos(ang) * 1.2, 0.25, 1.3, 0.25, GOLD, -ang, -0.9);
  }
  a.box(1.8, 20, 0, 0.8, 5.5, 0.8, BR, 0, 0, -0.2);
  a.box(2.8, 25.2, 0, 1, 1.4, 1, 0xffc24a);
  a.box(-2, 17, 0, 0.8, 4.4, 0.8, BR2);
}

/* Египет: Александрийский маяк с огнём на вершине */
function pharos(a) {
  const S = 0xe8dcc0;
  const S2 = 0xd4c8aa;
  a.box(0, 0, 0, 16, 2, 16, S2);
  a.box(0, 2, 0, 10, 20, 10, S);
  for (const y of [6, 12, 18]) for (const [sx, sz] of SIDES) a.box(sx * 5.05, y, sz * 5.05, sz ? 1.2 : 0.2, 1.8, sz ? 0.2 : 1.2, 0x6a5a48);
  for (const [sx, sz] of CORNERS) a.box(sx * 4.6, 22, sz * 4.6, 0.8, 1.6, 0.8, 0xb08040);
  round(a, 0, 22, 0, 7, 12, S, S2);
  round(a, 0, 34, 0, 4.4, 6, S);
  round(a, 0, 40, 0, 3, 1, 0xff8a2a);
  a.box(0, 41, 0, 2, 2, 2, 0xffd23a);
  a.box(0, 43, 0, 0.8, 2.4, 0.8, 0xb08040);
  const fire = a.group(0, 42, 0);
  fire.userData.fire = true;
  a.solid(0, 0, 5.5);
}

/* Вавилон: Висячие сады */
function hangingGardens(a) {
  const B = 0xc9a570;
  const B2 = 0xb8945e;
  const G = 0x3f8f3a;
  const FL = [0xe07ab0, 0xe8b830, 0xd8453a];
  [22, 18, 14, 10, 6].forEach((w, i) => {
    const y = i * 3.4;
    a.box(0, y, 0, w, 3.4, w, i % 2 ? B2 : B);
    for (const [sx, sz] of SIDES) {
      a.box(sx * (w / 2 + 0.1), y + 1, sz * (w / 2 + 0.1), sz ? w - 1 : 0.6, 2.4, sz ? 0.6 : w - 1, G); // свисающая зелень
      a.box(sx * (w / 2 + 0.3), y + 2.6, sz * (w / 2 + 0.3), 0.5, 0.5, 0.5, FL[i % 3]);
    }
    if (i < 4) for (const [sx, sz] of CORNERS) tree(a, sx * (w / 2 - 1.4), y + 3.4, sz * (w / 2 - 1.4), 1.6, 1.8, 0x7a5a30, 0x4fa044);
  });
  a.box(0, 0, -11.3, 1.4, 17, 0.4, 0x5aa9d6); // водопад
  a.solid(0, 0, 11);
}

export const AFRICA = [
  { id: 'abusimbel', theme: 'desert', name: 'Абу-Симбел', country: 'Египет', size: 14.5, build: abuSimbel },
  { id: 'kilimanjaro', name: 'Килиманджаро', country: 'Танзания', size: 13.5, build: kilimanjaro },
  { id: 'table', name: 'Столовая гора', country: 'ЮАР', size: 15.5, build: tableMountain },
  { id: 'djenne', theme: 'desert', name: 'Мечеть в Дженне', country: 'Мали', size: 11.5, build: djenne },
  { id: 'victoria', name: 'Водопад Виктория', country: 'Замбия и Зимбабве', size: 14.5, build: victoria },
  { id: 'baobabs', name: 'Аллея баобабов', country: 'Мадагаскар', size: 15, build: baobabs },
  { id: 'hassan', name: 'Мечеть Хасана II', country: 'Марокко', size: 11.5, build: hassan },
  { id: 'uluru', theme: 'red', name: 'Скала Улуру', country: 'Австралия', size: 15.5, build: uluru },
  { id: 'harbour', name: 'Мост Харбор-Бридж', country: 'Австралия', size: 18.5, build: harbourBridge },
  { id: 'southpole', theme: 'snow', name: 'Южный полюс', country: 'Антарктида', size: 12.5, build: southPole },
  { id: 'hobbiton', name: 'Хоббитон', country: 'Новая Зеландия', size: 11.5, build: hobbiton },
];

export const ANCIENT = [
  { id: 'colossus', name: 'Колосс Родосский', country: 'Древняя Греция', size: 7.5, build: colossus },
  { id: 'pharos', name: 'Александрийский маяк', country: 'Древний Египет', size: 8.5, build: pharos },
  { id: 'gardens', name: 'Висячие сады', country: 'Древний Вавилон', size: 11.5, build: hangingGardens },
];
