import * as THREE from 'three';
import { cube } from './voxel.js';
import { DECK_Y } from './ship.js';
import defaults from './crew.json';

// Своя команда — в src/crew.local.json (тот же формат, в git не попадает).
// Нет такого файла — берём общий crew.json.
const local = Object.values(import.meta.glob('./crew.local.json', { eager: true, import: 'default' }))[0];
const data = local ?? defaults;

const MAX_SAILORS = 8; // столько мест на палубе
const SKIN = 0xf0c49a;
const PANTS = 0x2c3d6b;
const HAT = 0x3b2a18;
const INK = 0x22201c;
const CHEEK = 0xf08c8c;
const WHITE = 0xffffff;
const SHIRTS = [0xc25f4a, 0x4f9c5a, 0xc9a13f, 0x8a5fae, 0x3f8fa0, 0xb06a8d, 0xd9d4c7, 0x5a6fb8];

const cleanName = (n) => String(n ?? '').trim().slice(0, 14);

export const captainName = cleanName(data.captain) || 'Капитан';

const listed = (Array.isArray(data.sailors) ? data.sailors : []).map(cleanName).filter(Boolean);
if (listed.length > MAX_SAILORS) {
  console.warn(`crew.json: на палубе ${MAX_SAILORS} мест, остальные матросы остались в порту`);
}
export const sailorNames = listed.length ? listed.slice(0, MAX_SAILORS) : ['Матрос'];

// Кто может стать балбесом — список "balbesy" в crew.json. Балбес из них выбирается случайно.
const goofPool = new Set((Array.isArray(data.balbesy) ? data.balbesy : []).map(cleanName));
// Волшебницы — список "volshebnicy": корона, волосы с бантиками и волшебная палочка.
const fairyPool = new Set((Array.isArray(data.volshebnicy) ? data.volshebnicy : []).map(cleanName));
// Пушкари — список "pushkari": красная бандана, повязка на глаз, сами стреляют фейерверком.
const gunnerPool = new Set((Array.isArray(data.pushkari) ? data.pushkari : []).map(cleanName));

// Табличка как в Minecraft: полупрозрачная тёмная плашка и белые буквы без сглаживания.
function nameplate(text, y) {
  const H = 20;
  const PAD = 4;
  const FONT = 'bold 15px system-ui, sans-serif';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = FONT;
  canvas.width = Math.ceil(ctx.measureText(text).width) + PAD * 2;
  canvas.height = H;
  ctx.font = FONT; // смена размера канваса сбрасывает состояние контекста
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, PAD, H / 2 + 1);

  // Каждый пиксель — либо буква, либо фон: полутона сглаживания убираем порогом.
  const img = ctx.getImageData(0, 0, canvas.width, H);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const on = px[i + 3] > 100;
    px[i] = px[i + 1] = px[i + 2] = on ? 255 : 0;
    px[i + 3] = on ? 255 : 110;
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, fog: false }));
  const UNIT = 0.055; // мировых единиц на пиксель таблички
  sprite.scale.set(canvas.width * UNIT, H * UNIT, 1);
  sprite.position.y = y;
  sprite.renderOrder = 10;
  return sprite;
}

// Рука или нога на шарнире — чтобы ими можно было махать при ходьбе.
function limb(parent, x, pivotY, len, w, d, color, handColor) {
  const pivot = new THREE.Group();
  pivot.position.set(x, pivotY, 0);
  parent.add(pivot);
  cube(pivot, color, w, len, d, 0, -len / 2, 0);
  if (handColor) cube(pivot, handColor, w, 0.4, d, 0, -len - 0.2, 0);
  return pivot;
}

function pirateHat() {
  const hat = new THREE.Group();
  cube(hat, HAT, 2.2, 0.4, 1.8, 0, 3.9, 0);
  cube(hat, HAT, 1.3, 0.6, 1.2, 0, 4.2, 0);
  return hat;
}

// Шапка балбеса: разноцветная, с крутящимся пропеллером.
function propellerHat() {
  const hat = new THREE.Group();
  const colors = [0xd8453a, 0xe8b830, 0x3a6fc0, 0x4f9c5a];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
    cube(hat, colors[i], 0.64, 0.55, 0.58, sx * 0.32, 3.95, sz * 0.29);
  });
  cube(hat, 0x2e2e30, 0.14, 0.5, 0.14, 0, 4.45, 0);
  const prop = new THREE.Group();
  prop.position.set(0, 4.72, 0);
  hat.add(prop);
  cube(prop, 0xe8b830, 2.4, 0.1, 0.4);
  cube(prop, 0xd8453a, 0.4, 0.1, 2.4);
  hat.userData.prop = prop;
  return hat;
}

const HAIR = 0x6a3f22;

function tiara() {
  const t = new THREE.Group();
  cube(t, 0xf6c944, 1.36, 0.22, 1.26, 0, 3.82, 0);
  for (const x of [-0.4, 0, 0.4]) cube(t, 0xf6c944, 0.2, x ? 0.3 : 0.45, 0.14, x, x ? 4.06 : 4.14, -0.6);
  cube(t, 0xf07ab8, 0.24, 0.24, 0.1, 0, 3.84, -0.68);
  return t;
}

// Бандана пушкаря: красная, в белый горошек, с узлом на затылке.
function bandana() {
  const b = new THREE.Group();
  cube(b, 0xc0392b, 1.3, 0.4, 1.2, 0, 3.75, 0.02);
  cube(b, 0xc0392b, 0.35, 0.3, 0.3, 0, 3.55, 0.72);
  cube(b, 0xc0392b, 0.2, 0.5, 0.12, 0.12, 3.3, 0.78);
  for (const x of [-0.35, 0.3]) cube(b, 0xffffff, 0.14, 0.14, 0.05, x, 3.85, -0.62);
  return b;
}

// Шляпы и вещи моряков из таверны.
function roleHat(role) {
  const h = new THREE.Group();
  if (role === 'cook') {
    cube(h, 0xffffff, 1.3, 0.3, 1.2, 0, 3.8, 0);
    cube(h, 0xf4f4f4, 1.4, 0.9, 1.3, 0, 4.35, 0); // поварской колпак
  } else if (role === 'navigator') {
    cube(h, 0x1d2a4a, 2.3, 0.55, 0.9, 0, 3.95, 0); // двууголка
    cube(h, 0xe8b830, 2.35, 0.12, 0.95, 0, 3.72, 0);
    cube(h, 0xe8b830, 0.3, 0.3, 0.1, 0, 4.0, -0.5);
  } else if (role === 'diver') {
    cube(h, 0xc0392b, 1.3, 0.55, 1.2, 0, 3.85, 0); // шапка с помпоном
    cube(h, 0xffffff, 0.35, 0.35, 0.35, 0, 4.25, 0);
  } else if (role === 'carpenter') {
    cube(h, 0xe8b830, 1.3, 0.4, 1.2, 0, 3.8, 0); // кепка
    cube(h, 0xe8b830, 1.0, 0.12, 0.5, 0, 3.65, -0.75);
  } else {
    cube(h, 0x3f7a3a, 1.9, 0.3, 1.7, 0, 3.8, 0); // шляпа с пером
    cube(h, 0x3f7a3a, 1.2, 0.6, 1.1, 0, 4.2, 0);
    cube(h, 0xe0302a, 0.15, 1.0, 0.15, 0.5, 4.6, 0.3).rotation.z = -0.4;
  }
  return h;
}

function roleGear(g, role, armR) {
  if (role === 'cook') {
    cube(g, 0xffffff, 1.0, 1.4, 0.1, 0, 1.5, -0.48); // фартук
    cube(armR, 0x9a9a9a, 0.12, 1.0, 0.12, 0, -1.9, -0.2); // половник
  } else if (role === 'navigator') {
    cube(g, 0x1d2a4a, 1.46, 0.5, 0.96, 0, 0.75, 0); // полы камзола
    cube(armR, 0xb08a3a, 0.26, 0.26, 1.2, 0, -1.6, -0.5); // подзорная труба
  } else if (role === 'diver') {
    for (const y of [1.1, 1.6, 2.1]) cube(g, 0xffffff, 1.44, 0.16, 0.94, 0, y, 0); // тельняшка
  } else if (role === 'carpenter') {
    cube(g, 0x6a4a2e, 1.46, 0.25, 0.96, 0, 0.85, 0); // пояс с инструментами
    cube(armR, 0x7a5230, 0.14, 1.0, 0.14, 0, -1.9, 0); // молоток
    cube(armR, 0x6a6f74, 0.5, 0.25, 0.25, 0, -2.35, 0);
  } else if (role === 'musician') {
    cube(g, 0xc0392b, 1.3, 0.8, 0.5, 0, 1.9, -0.7); // гармошка
    for (const x of [-0.25, 0.25]) cube(g, 0xf4f4f4, 0.12, 0.82, 0.52, x, 1.9, -0.7);
  }
}

function makeSailor(name, shirt, labelY, canGoof, fairy = false, gunner = false, role = null) {
  const g = new THREE.Group();
  const legL = limb(g, -0.4, 1.2, 1.2, 0.6, 0.8, PANTS);
  const legR = limb(g, 0.4, 1.2, 1.2, 0.6, 0.8, PANTS);
  cube(g, shirt, 1.4, 1.8, 0.9, 0, 1.6, 0);
  const armL = limb(g, -0.93, 2.5, 1.3, 0.45, 0.6, shirt, SKIN);
  const armR = limb(g, 0.93, 2.5, 1.3, 0.45, 0.6, shirt, SKIN);
  cube(g, SKIN, 1.2, 1.2, 1.1, 0, 3.1, 0);
  // весёлая мордашка смотрит вперёд (−z): глаза с бликом, румяные щёки, улыбка до ушей
  for (const sx of [-1, 1]) {
    cube(g, INK, 0.26, 0.3, 0.1, sx * 0.28, 3.22, -0.58);
    cube(g, WHITE, 0.1, 0.1, 0.1, sx * 0.28 - 0.06, 3.3, -0.62);
    cube(g, CHEEK, 0.24, 0.14, 0.1, sx * 0.45, 2.96, -0.58);
    cube(g, INK, 0.12, 0.12, 0.1, sx * 0.27, 2.9, -0.58); // уголки рта подняты
  }
  cube(g, INK, 0.44, 0.12, 0.1, 0, 2.8, -0.58);
  cube(g, 0xe0605a, 0.24, 0.08, 0.1, 0, 2.72, -0.58); // язычок
  if (fairy) {
    cube(g, HAIR, 1.3, 0.35, 1.2, 0, 3.72, 0.02); // макушка
    cube(g, HAIR, 1.3, 1.5, 0.3, 0, 2.95, 0.6); // волосы сзади
    for (const sx of [-1, 1]) {
      cube(g, HAIR, 0.22, 1.2, 0.9, sx * 0.66, 3.05, 0.1);
      cube(g, 0xf07ab8, 0.32, 0.32, 0.32, sx * 0.72, 3.35, 0.6); // бантики
    }
    // волшебная палочка в правой руке — видна, когда колдует
    const wand = new THREE.Group();
    wand.position.set(0, -1.6, 0);
    armR.add(wand);
    cube(wand, 0xf4f1e8, 0.12, 1.5, 0.12, 0, -0.75, 0);
    g.userData.wandStar = cube(wand, 0xf6c944, 0.45, 0.45, 0.15, 0, -1.6, 0);
    cube(wand, 0xf07ab8, 0.2, 0.2, 0.22, 0, -1.6, 0);
    wand.visible = false;
    g.userData.wand = wand;
  }
  if (gunner) {
    cube(g, INK, 0.36, 0.36, 0.08, -0.28, 3.22, -0.64); // повязка на глаз
    cube(g, INK, 1.24, 0.08, 1.14, 0, 3.4, 0); // ремешок вокруг головы
    cube(g, 0x4a2e1a, 0.7, 0.14, 0.08, 0, 3.0, -0.6); // усы
  }
  const hat = fairy ? tiara() : gunner ? bandana() : role ? roleHat(role) : pirateHat();
  g.add(hat);
  g.userData.hat = hat;
  if (role) roleGear(g, role, armR);
  if (canGoof) {
    const goofHat = propellerHat();
    goofHat.visible = false; // надевается, когда человек становится балбесом
    g.add(goofHat);
    g.userData.goofHat = goofHat;
  }
  g.add(nameplate(name, labelY));
  g.userData.limbs = [legL, legR, armL, armR];
  return g;
}

// Шляпы капитана с верфи.
const CAPTAIN_HATS = {
  tricorn: () => pirateHat(),
  bandana: () => bandana(),
  bicorne: () => roleHat('navigator'),
  feather: () => {
    const h = new THREE.Group();
    cube(h, 0x6a3fa0, 2.3, 0.3, 2.0, 0, 3.8, 0);
    cube(h, 0x6a3fa0, 1.3, 0.7, 1.2, 0, 4.25, 0);
    cube(h, 0xf6c944, 1.34, 0.2, 1.24, 0, 4.0, 0);
    cube(h, 0xe0302a, 0.18, 1.4, 0.18, 0.55, 4.8, 0.35).rotation.z = -0.5;
    return h;
  },
  top: () => {
    const h = new THREE.Group();
    cube(h, 0x1a1a1a, 1.9, 0.2, 1.8, 0, 3.75, 0);
    cube(h, 0x1a1a1a, 1.2, 1.4, 1.1, 0, 4.5, 0);
    cube(h, 0xc0392b, 1.24, 0.25, 1.14, 0, 4.0, 0);
    return h;
  },
  crown: () => {
    const h = new THREE.Group();
    cube(h, 0xf6c944, 1.3, 0.4, 1.2, 0, 3.85, 0);
    for (const [x, z] of [[-0.5, -0.45], [0.5, -0.45], [-0.5, 0.45], [0.5, 0.45], [0, -0.5], [0, 0.5]]) cube(h, 0xf6c944, 0.24, 0.4, 0.24, x, 4.25, z);
    cube(h, 0xe0302a, 0.24, 0.24, 0.1, 0, 3.9, -0.62);
    for (const sx of [-1, 1]) cube(h, 0x3a6fc0, 0.18, 0.18, 0.1, sx * 0.4, 3.9, -0.62);
    return h;
  },
};

// Таблички матросов лесенкой: чем дальше к носу, тем выше — не наезжают друг на друга.
const labelY = (i) => 6.6 + i * 0.6;

// Шаг: ноги и руки качаются навстречу друг другу. amount 0 — стоим ровно.
export function walkPose(g, phase, amount) {
  const [legL, legR, armL, armR] = g.userData.limbs;
  const s = Math.sin(phase) * 0.8 * amount;
  legL.rotation.x = s;
  legR.rotation.x = -s;
  armL.rotation.x = -s;
  armR.rotation.x = s;
}

// Капитан у штурвала — неуязвим и может сходить на берег. Матросы стоят ёлочкой
// вдоль бортов. Камера смотрит сверху: чем дальше человек, тем выше на экране его
// табличка, поэтому у капитана она сразу над шляпой, у матросов — повыше.
export function createCrew(shipGroup) {
  const captainSpot = new THREE.Vector3(0, 2.3, 5.8);
  const captainGoof = goofPool.has(captainName);
  const captainFairy = fairyPool.has(captainName);
  const captain = makeSailor(captainName, 0x2f6fae, captainGoof ? 5.5 : 4.9, captainGoof, captainFairy);
  captain.position.copy(captainSpot);
  shipGroup.add(captain);
  const captainP = { name: captainName, g: captain, home: captainSpot, isCaptain: true, canGoof: captainGoof, fairy: captainFairy, alive: true, fall: null };

  const sailors = sailorNames.map((name, i) => {
    const canGoof = goofPool.has(name);
    const fairy = fairyPool.has(name);
    const gunner = gunnerPool.has(name);
    const g = makeSailor(name, SHIRTS[i % SHIRTS.length], labelY(i), canGoof, fairy, gunner);
    const home = new THREE.Vector3(i % 2 ? 2.2 : -2.2, DECK_Y, 2.6 - i * 1.25);
    g.position.copy(home);
    shipGroup.add(g);
    return { name, g, home, alive: true, fall: null, canGoof, fairy, gunner, fem: fairy };
  });

  function standUp(s) {
    s.alive = true;
    s.fall = null;
    s.g.visible = true;
    s.g.position.copy(s.home);
    s.g.rotation.set(0, 0, 0);
    walkPose(s.g, 0, 0);
  }

  function reset() {
    sailors.forEach(standUp);
  }

  // Удар: за борт летит ближайший к носу живой матрос. Возвращает его или null.
  function hit() {
    const s = sailors.findLast((m) => m.alive);
    if (!s) return null;
    standUp(s); // если он как раз чудил — сначала ставим на место
    const side = Math.sign(s.home.x);
    s.alive = false;
    s.fall = { t: 0, vx: side * 7, vy: 9, spin: -side * 6 };
    return s;
  }

  // Вытащить из воды первого потерянного. Возвращает его или null.
  function revive() {
    const s = sailors.find((m) => !m.alive);
    if (s) standUp(s);
    return s ?? null;
  }

  // onLanded(worldPos) — матрос долетел до воды.
  const landed = new THREE.Vector3();
  function update(dt, onLanded) {
    for (const s of sailors) {
      const f = s.fall;
      if (!f) continue;
      f.t += dt;
      f.vy -= 30 * dt;
      s.g.position.x += f.vx * dt;
      s.g.position.y += f.vy * dt;
      s.g.rotation.z += f.spin * dt;
      if (f.t > 1.1) {
        s.fall = null;
        s.g.visible = false;
        onLanded?.(s.g.getWorldPosition(landed));
      }
    }
  }

  const people = [captainP, ...sailors];

  // Шляпа капитана с верфи (балбес прячет её под шапкой с пропеллером — это сохраняется).
  function setCaptainHat(id) {
    const old = captain.userData.hat;
    const hat = (CAPTAIN_HATS[id] ?? CAPTAIN_HATS.tricorn)();
    hat.visible = old.visible;
    captain.remove(old);
    captain.add(hat);
    captain.userData.hat = hat;
  }

  // Новый матрос из таверны — встаёт на свободное место на палубе.
  function addSailor(name, role) {
    const i = sailors.length;
    if (i >= MAX_SAILORS) return null;
    const g = makeSailor(name, SHIRTS[i % SHIRTS.length], labelY(i), true, false, false, role);
    const home = new THREE.Vector3(i % 2 ? 2.2 : -2.2, DECK_Y, 2.6 - i * 1.25);
    g.position.copy(home);
    shipGroup.add(g);
    const s = { name, g, home, alive: true, fall: null, canGoof: true, role };
    sailors.push(s);
    people.push(s);
    return s;
  }

  return {
    captain,
    captainSpot,
    people,
    addSailor,
    setCaptainHat,
    sailors,
    reset,
    hit,
    revive,
    update,
    get aliveCount() {
      return sailors.filter((s) => s.alive).length;
    },
  };
}
