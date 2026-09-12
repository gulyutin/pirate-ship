import * as THREE from 'three';
import './style.css';
import { voxTime, voxCutOn, voxCutAt } from './voxel.js';
import { createSky } from './sky.js';
import { createWater } from './water.js';
import { createShip, HULL_POINTS, FLAG_COLORS } from './ship.js';
import { createCrew, walkPose, captainName } from './crew.js';
import { createTerrain, DOCK, B } from './terrain.js';
import { createWorld, wrapAngle, turnToward } from './world.js';
import { createBattle } from './battle.js';
import { createFx } from './fx.js';
import { createControls } from './controls.js';
import { createMinimap, drawWorldMap } from './minimap.js';
import { createBalbes } from './balbes.js';
import { createFairy } from './fairy.js';
import { createGunner } from './gunner.js';
import { createStory, LEGEND } from './story.js';
import { BOSSES, kraken } from './bosses.js';
import { RECRUITS, renderTavern, createRoles } from './tavern.js';
import { HULLS, owns, renderYard } from './looks.js';
import { createPet } from './pets.js';
import { createAnimals, renderAlbum, STICKERS } from './animals.js';
import { createDive, makeHelmet, SEABED } from './dive.js';
import { sfx, unlockAudio, setMuted, setMusic, setTrack, setRain } from './audio.js';
import { createCards, renderPicker } from './cards.js';
import { createEvents } from './events.js';
import { loadSave, storeSave, resetSave } from './save.js';
import { effect, renderShop } from './shop.js';
import { createOcean } from './ocean.js';
import { createNature } from './nature.js';
import { FACTS } from './landmarks/facts.js';
import { createSurfaces } from './surfaces.js';
import { createQuests } from './quests.js';
import { createFishing } from './fishing.js';

const $ = (id) => document.getElementById(id);
const clamp = THREE.MathUtils.clamp;
const smooth = (x) => x * x * (3 - 2 * x);
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

const wrap = $('wrap');
const stage = $('stage');
const hud = $('hud');
const toast = $('toast');
const hint = $('hint');
const actBtn = $('actBtn');
const jumpBtn = $('jumpBtn');
const boardBtn = $('boardBtn');

const SHIP_SPEED = 22; // полный ход без улучшений
const TURN_RATE = 1.3; // рад/с
const WALK_SPEED = 9;
const JUMP_V = 17; // прыжок на два блока
const GRAVITY = 34;
const LAND_REACH = 0.7; // в прыжке встаём на ступень, чей верх не выше этого над ногами
const DOCK_R = 16; // подплыл так близко к причалу — заходим в порт
const DOCK_RELEASE = 28; // чтобы зайти снова, надо сначала отплыть
const ASHORE_R = 18; // капитан спрыгивает на берег с такого расстояния
const BOARD_R = 13; // ближе — просто запрыгивает, дальше — матросы забирают по свистку
const RAM_R = 8;
const CHEST_R = 7;
const SHELL_R = 6.5;
const DIG_TIME = 1.3;
const TREASURE = 10;
const BIG_TREASURE = 60; // великий клад по карте сокровищ
const CARD_EVERY = 25; // столько золота в трюме — и новая карта удачи
const MERCHANT_PRICE = 15;

/* ---------- рендер ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false });
} catch (err) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
  $('scErr').classList.remove('hidden');
  throw err;
}
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.type = THREE.PCFShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);


/* ---------- мир ---------- */
const save = loadSave();
const surfaces = createSurfaces(); // парящие ступени паркура, блоки своего острова
const terrain = createTerrain(scene, surfaces, save.seed ?? undefined);
// небо, свет, день и ночь, погода; маяк в порту светит лучом
const sky = createSky(scene, renderer, camera, {
  say: (msg, sec) => say(msg, sec),
  sfx,
  rain: setRain,
  lighthouse: { x: -11, y: (terrain.groundAt(-11, -9) ?? 0) + 17, z: -9 },
});
const water = createWater(scene, terrain.groundAt);
const ship = createShip(scene);
const crew = createCrew(ship.group);
for (const id of save.hired) {
  const r = RECRUITS.find((x) => x.id === id);
  if (r) crew.addSailor(r.name, r.id); // нанятые в таверне — снова на палубе
}
const world = createWorld(scene, terrain);
const battle = createBattle(scene);
const fx = createFx(scene);
const ocean = createOcean(scene, fx, sfx, { say: (msg) => say(msg), sticker: (id) => addSticker(id) });
const nature = createNature(scene);
const minimap = createMinimap($('minimap'));
const controls = createControls(stage, { onAction: doAction, onJump: doJump, onBoard: goAboard });
const WONDERS = terrain.islands.filter((isl) => !isl.port && !isl.secret);
const SECRET_ISLES = terrain.islands.filter((isl) => isl.secret);
// На картах — всё, кроме секретных островов, о которых ещё не узнал.
const mapIslands = () => terrain.islands.filter((i) => !i.secret || save.secretsKnown.includes(i.id));
const mapFound = () => save.found.concat(save.secretsFound);


/* ---------- сохранение и состояние ---------- */
ship.setUpgrades(save.up);
ship.setFlag(save.look.flag);
ship.setTrophy(!!save.story.kraken);
setMuted(save.muted);

// port — стоим у причала, открыт магазин (он же главное меню)
// sea — плывём; land — капитан гуляет по острову; wreck — корабль разбит
let mode = 'port';
let paused = false;
const boat = { x: DOCK.x, z: DOCK.z, heading: DOCK.heading, speed: 0 };
const cap = { x: 0, z: 0, y: 0, vy: 0, air: false, facing: 0, phase: 0, stride: 0 };
let camYaw = DOCK.heading;
let t = 0;
let lean = 0;
let shields = maxShields();
let inv = 0;
let shake = 0;
let cannonT = 0;
let muzzleIdx = 0;
let portLock = true;
let digT = 0;
let digSpot = null;
let digFx = 0;
let wreckT = 0;
let foamT = 0;
let sprayT = 0;
let boostT = 0;
let seaHop = 0;
let action = null;
let landUi = null;
let frameNo = 0;
let portMix = 1;
let viewW = 1;
let viewH = 1;
let portrait = false;
let snapCam = true;
let landedOnce = false;
let spy = false; // смотрим в подзорную трубу
let spyT = 0;
let spyName = '';
const lootOptions = () => ({
  summits: save.summits,
  pieces: save.bigTreasure != null ? 0 : 3 - save.mapPieces, // сколько клочков карты спрятать
  bigTreasure: save.bigTreasure,
});

const balbes = createBalbes(crew, {
  say,
  fx,
  sfx,
  mode: () => mode,
  walking: () => cap.stride > 0.3,
  gold: (n) => addGold(n),
  boost: (sec) => {
    boostT = sec;
  },
  salute: () => salute(),
  cannons: () => save.up.cannons > 0,
});

const fairy = createFairy(scene, crew, {
  say,
  fx,
  sfx,
  mode: () => mode,
  ship: ship.group,
  gold: (n) => addGold(n),
  shield: () => {
    shields++;
    updateHud();
  },
  enemiesNear: () => world.items.some((it) => it.kind === 'enemy' && !it.dead && !it.sinking && dist(it.g.position.x, it.g.position.z, boat.x, boat.z) < 90),
  target: fairyTarget,
  treasure: () => {
    const it = world.items.find((i) => (i.kind === 'xspot' || i.kind === 'bigx') && !i.dead && dist(i.g.position.x, i.g.position.z, cap.x, cap.z) < 60);
    return it ? it.g.position : null;
  },
  captain: () => cap,
});

const gunner = createGunner(scene, crew, {
  say,
  fx,
  sfx,
  mode: () => mode,
  ship: ship.group,
  busy: (p) => balbes.acting(p),
  findEnemy: () => nearestItem((it) => it.kind === 'enemy' && !it.sinking && !it.hidden, 90),
  sinkEnemy: (it) => {
    if (it.custom) {
      it.onHit(3); // босса фейерверк не топит сразу — просто сильно бьёт
      return;
    }
    const p = it.g.position;
    world.sink(it);
    world.addChest(p.x, p.z);
    sfx.sink();
    quests.event('sink');
  },
  findLoot: () => nearestItem((it) => it.kind === 'chest' || it.kind === 'barrel', 70),
});

const story = createStory(save, {
  islands: terrain.islands,
  scene,
  fx,
  sfx,
  say,
  celebrate: (x, y, z) => celebrate(x, y, z),
  store: () => storeSave(save),
  cellPos: terrain.cellPos,
  onKey: (k) => {
    updateHud();
    if (k === 1) addSticker('firebird');
    if (k === 4) addSticker('serpent');
  },
  world,
  battle,
  groundAt: terrain.groundAt,
  hurt: () => damage(),
  chest: (x, z) => world.addChest(x, z),
  extra: BOSSES,
  kraken,
  onKraken: (p) => {
    // финал: огромный клад, салют и золотой кубок на корме
    addGold(200);
    for (let i = 0; i < 4; i++) setTimeout(() => celebrate(p.x + (Math.random() - 0.5) * 20, 4, p.z + (Math.random() - 0.5) * 20), i * 400);
    sfx.medal();
    ship.setTrophy(true);
    addSticker('kraken');
    say('🏆 Золотой Кракен побеждён! Его клад твой: +200. Ты — легенда морей!', 6);
  },
});
story.ensure();

const roles = createRoles(scene, crew, {
  say,
  fx,
  sfx,
  mode: () => mode,
  ship: ship.group,
  gold: (n) => addGold(n),
  shields: () => shields,
  maxShields,
  addShield: () => {
    shields++;
    updateHud();
  },
  target: () => fairyTarget(),
  busy: (p) => balbes.acting(p),
});

// Прочность корпуса за заплыв: улучшение «Корпус» и плотник из таверны.
function maxShields() {
  return effect.shields[save.up.hull] + (save.hired.includes('carpenter') ? 1 : 0) + (HULLS[save.look.hull]?.tier ?? 0);
}

const pet = createPet(crew, {
  say,
  fx,
  sfx,
  mode: () => mode,
  gold: (n) => addGold(n),
  enemyNear: (d) => !!nearestItem((it) => it.kind === 'enemy' && !it.sinking && !it.hidden, d),
  treasureNear: (r) =>
    world.items.find((i) => (i.kind === 'xspot' || i.kind === 'bigx') && !i.dead && dist(i.g.position.x, i.g.position.z, cap.x, cap.z) < r) ?? null,
});

const animals = createAnimals(scene, terrain, {
  has: (id) => save.stickers.includes(id),
  add: (id) => addSticker(id),
});

// Затонувшие корабли и ныряние к ним.
const deep = createDive(scene, {
  fx,
  sfx,
  say,
  islands: terrain.islands,
  gold: (n) => addGold(n),
  sticker: (id) => addSticker(id),
  looted: (id) => save.wrecksLooted.includes(id),
  markLooted: (id) => {
    save.wrecksLooted.push(id);
    storeSave(save);
  },
});
const helmet = makeHelmet();
let hatWasVisible = true;

function startDive() {
  const site = deep.nearSite(boat.x, boat.z, 18);
  if (!site) return;
  balbes.cancel();
  fishing.stop();
  mode = 'dive';
  boat.speed = 0;
  deep.start(site);
  const p = deep.entry();
  Object.assign(cap, { x: p.x, z: p.z, y: p.y, vy: 0, air: false, facing: boat.heading, stride: 0 });
  crew.captain.removeFromParent();
  scene.add(crew.captain);
  crew.captain.rotation.order = 'YXZ';
  hatWasVisible = crew.captain.userData.hat.visible;
  crew.captain.userData.hat.visible = false;
  crew.captain.add(helmet);
  water.setUnderwater(true);
  sfx.splash();
  fx.splash(boat.x, boat.z);
  say('🤿 Ныряем! Собирай жемчуг, ищи сундук и морских жителей. Воздуха — на 45 секунд', 4);
}

function endDive(msg) {
  deep.end();
  water.setUnderwater(false);
  helmet.removeFromParent();
  crew.captain.userData.hat.visible = hatWasVisible;
  mode = 'sea';
  crew.captain.removeFromParent();
  ship.group.add(crew.captain);
  crew.captain.position.copy(crew.captainSpot);
  crew.captain.rotation.set(0, 0, 0);
  walkPose(crew.captain, 0, 0);
  fx.splash(boat.x, boat.z);
  sfx.splash();
  say(msg ?? 'Всплыли! 🫧');
}

// Под водой: плывёшь куда ведёшь, кнопка прыжка — гребок вверх, потом плавно опускаешься.
function updateDive(dt, mv) {
  const m = Math.hypot(mv.x, mv.y);
  if (m > 0) {
    const [dx, dz] = stickToWorld(mv);
    cap.facing = turnToward(cap.facing, Math.atan2(-dx, -dz), dt * 8);
    cap.x += dx * 7 * dt;
    cap.z += dz * 7 * dt;
    if (!deep.nearSite(cap.x, cap.z, 60)) {
      cap.x -= dx * 7 * dt; // дальше — открытая глубина, не уплываем
      cap.z -= dz * 7 * dt;
    }
  }
  setAction('surface');
  cap.vy -= 5 * dt;
  cap.y += cap.vy * dt;
  if (cap.y < SEABED + 1.2) {
    cap.y = SEABED + 1.2;
    cap.vy = 0;
  }
  if (cap.y > SEABED + 14) {
    cap.y = SEABED + 14;
    cap.vy = Math.min(cap.vy, 0);
  }
  cap.phase += dt * 6;
  walkPose(crew.captain, cap.phase, 0.6);
  crew.captain.position.set(cap.x, cap.y, cap.z);
  crew.captain.rotation.y = cap.facing;
  crew.captain.rotation.x = m > 0 ? -0.9 : -0.2; // плывёт, вытянувшись вперёд
  if (deep.update(dt, t, cap) === 'air') endDive('Воздух кончился — всплываем! 🫧');
}

// Новая наклейка в альбом: звери на островах, дельфины и кит, чудища из легенды.
function addSticker(id) {
  if (save.stickers.includes(id)) return;
  const st = STICKERS.find((s) => s.id === id);
  if (!st) return;
  save.stickers.push(id);
  storeSave(save);
  addGold(3);
  sfx.medal();
  say(`📒 Новая наклейка: ${st.icon} ${st.name}! (${save.stickers.length} из ${STICKERS.length}) +3`, 3);
}

function openAlbum() {
  unlockAudio();
  $('albumCount').textContent = `Наклеек: ${save.stickers.length} из ${STICKERS.length}. Подойди к зверю поближе — и он в альбоме!`;
  renderAlbum($('stickers'), save);
  $('scAlbum').classList.remove('hidden');
}

// Внешний вид с верфи: корабль, паруса, фигура, шляпа, питомец.
let hullScale = 1;
function applyLooks() {
  const L = save.look;
  hullScale = HULLS[L.hull]?.scale ?? 1;
  ship.setHull(L.hull);
  ship.setSails(L.sail);
  ship.setFigure(L.figure);
  crew.setCaptainHat(L.hat);
  pet.set(L.pet);
  if (mode === 'port') shields = maxShields();
}

// Верфь: купить один раз, выбирать сколько угодно.
let yardTab = 'hull';
function openYard() {
  unlockAudio();
  renderYardScreen();
  $('scYard').classList.remove('hidden');
}

function renderYardScreen() {
  $('yardGold').textContent = save.gold;
  renderYard($('yardItems'), $('yardTabs'), save, yardTab, (tab) => {
    yardTab = tab;
    renderYardScreen();
  }, pickLook);
}

function pickLook(cat, item, btn) {
  unlockAudio();
  if (!owns(save, cat, item.id)) {
    if (save.gold < item.price) {
      sfx.nope();
      btn.classList.remove('shake');
      void btn.offsetWidth;
      btn.classList.add('shake');
      return;
    }
    save.gold -= item.price;
    save.owned.push(`${cat}:${item.id}`);
    sfx.buy();
  } else {
    sfx.step();
  }
  save.look[cat] = item.id;
  storeSave(save);
  applyLooks();
  renderYardScreen();
  renderPort();
  updateHud();
}

// Таверна: нанять моряка за золото из банка.
function openTavern() {
  unlockAudio();
  renderTavernScreen();
  $('scTavern').classList.remove('hidden');
}

function renderTavernScreen() {
  $('tavernGold').textContent = save.gold;
  renderTavern($('recruits'), save, hire);
}

function hire(r, btn) {
  unlockAudio();
  if (save.gold < r.price) {
    sfx.nope();
    btn.classList.remove('shake');
    void btn.offsetWidth;
    btn.classList.add('shake');
    return;
  }
  save.gold -= r.price;
  save.hired.push(r.id);
  storeSave(save);
  crew.addSailor(r.name, r.id);
  if (r.id === 'carpenter') shields = maxShields();
  sfx.buy();
  renderTavernScreen();
  renderPort();
  updateHud();
}

// Ближайший к кораблю предмет, подходящий под ok, не дальше maxD.
function nearestItem(ok, maxD) {
  let best = null;
  let bestD = maxD;
  for (const it of world.items) {
    if (it.dead || !ok(it)) continue;
    const d = dist(it.g.position.x, it.g.position.z, boat.x, boat.z);
    if (d < bestD) {
      bestD = d;
      best = it;
    }
  }
  return best;
}

// Куда ведёт волшебный компас: к великому кладу, а если его нет — к ближайшему неоткрытому острову.
function fairyTarget() {
  const st = story.target(); // главное — следующий ключ
  if (st) return st;
  if (save.bigTreasure != null) {
    const isl = terrain.islands[save.bigTreasure];
    return { x: isl.x, z: isl.z };
  }
  let best = null;
  let bestD = Infinity;
  for (const isl of WONDERS) {
    if (save.found.includes(isl.id)) continue;
    const d = dist(isl.x, isl.z, boat.x, boat.z);
    if (d < bestD) {
      bestD = d;
      best = isl;
    }
  }
  return best && { x: best.x, z: best.z };
}

const quests = createQuests(save, { islands: terrain.islands, onDone: questDone });
const fishing = createFishing(scene, fx, sfx, {
  say,
  crew,
  ship,
  gold: (n) => addGold(n),
  mult: () => 2 ** cards.count('fish'),
  onCatch: () => {
    save.fish++;
    quests.event('fish');
  },
});

const cards = createCards();
const events = createEvents(scene, fx, sfx, {
  say,
  gold: (n) => addGold(n),
  chest: (x, z) => world.addChest(x, z),
  merchant: () => openCards('merchant'),
  bottle: bottleFound,
  landNear,
});

// Всё найденное в заплыве едет в трюме; в банк оно попадёт, когда корабль разгрузится в порту.
function addGold(n) {
  if (mode !== 'port') n *= fairy.goldMult; // радуга волшебницы
  if (mode === 'port') save.gold += n;
  else save.cargo += n;
  storeSave(save);
  updateHud();
}

// Разгрузка в порту. После крушения в трюме остаётся только спасённая половина.
function unloadCargo(fromWreck) {
  const n = save.cargo;
  save.cargo = 0;
  save.gold += n;
  storeSave(save);
  if (fromWreck) say(n ? `Всех выловили! Спасли полтрюма: +${n}` : 'Всех выловили — вы дома!', 3);
  else if (n) say(`Трюм разгружен: +${n} золота в банк!`, 3);
  if (n) sfx.buy();
}

function landNear(x, z, r) {
  if (terrain.groundAt(x, z) !== undefined) return true;
  for (let n = 0; n < 8; n++) {
    const a = (n / 8) * Math.PI * 2;
    if (terrain.groundAt(x + Math.cos(a) * r, z + Math.sin(a) * r) !== undefined) return true;
  }
  return false;
}

/* ---------- HUD, подсказки ---------- */
function pip(className, title) {
  const el = document.createElement('div');
  el.className = className;
  el.title = title;
  return el;
}

function updateHud() {
  $('goldNum').textContent = save.cargo;
  cards.renderHud($('hudCards'));
  $('isleNum').textContent = `${save.found.length}/${WONDERS.length}`;
  $('keyNum').textContent = `${save.story.keys}/5`;
  const hasMap = save.mapPieces > 0 || save.bigTreasure != null;
  $('mapRow').classList.toggle('hidden', !hasMap);
  $('mapNum').textContent = save.bigTreasure != null ? 'ищи клад ✕' : `${save.mapPieces}/3`;
  const pips = crew.sailors.map((s) => pip(s.alive ? 'pip' : 'pip out', s.name));
  for (let i = 0; i < shields; i++) pips.push(pip('pip shield', 'корпус'));
  $('crewPips').replaceChildren(...pips);
}

let toastT = 0;
// Надпись посреди экрана.
function say(msg, sec = 2) {
  toast.textContent = msg;
  toast.classList.add('on');
  toastT = sec;
}

let hintT = 0;
function showHint(text) {
  $('hintText').textContent = text;
  hint.classList.remove('hidden');
  hintT = 5;
}

function discover(isl) {
  if (isl.secret) {
    findSecret(isl);
    return;
  }
  if (isl.port || save.found.includes(isl.id)) return;
  save.found.push(isl.id);
  storeSave(save);
  sfx.discover();
  showFact(isl, true);
  quests.event('discover');
  quests.event('visit', isl.id);
  if (save.found.length === WONDERS.length) say('Все чудеса света открыты!', 3);
  updateHud();
}

// Карточка с фактом. При открытии острова — маленькая плашка (название и страна),
// нажмёшь — раскроется с фактом. Из паспорта — сразу раскрытая.
let factTimer = 0;
function showFact(isl, isNew) {
  $('fcTop').textContent = isNew ? 'Новый штамп!' : 'Паспорт';
  $('fcName').textContent = isl.name;
  $('fcCountry').textContent = isl.country;
  $('fcText').textContent = FACTS[isl.landmark?.id] ?? '';
  const card = $('factCard');
  card.classList.toggle('collapsed', isNew);
  card.classList.remove('hidden');
  hideFactLater(isNew ? 6 : 12);
}

function hideFactLater(sec) {
  clearTimeout(factTimer);
  factTimer = setTimeout(() => $('factCard').classList.add('hidden'), sec * 1000);
}

/* ---------- порт, берег, клады ---------- */
function enterPort(fromWreck = false) {
  balbes.cancel();
  story.cancel();
  fairy.cancel();
  gunner.cancel();
  roles.cancel();
  fishing.stop();
  events.clear();
  cards.reset();
  ship.setUpgrades(save.up); // пушки «напрокат» с карты возвращаем
  unloadCargo(fromWreck);
  quests.ensure(); // капитан порта выдаёт новые задания
  mode = 'port';
  portLock = true;
  boat.speed = 0;
  crew.reset();
  shields = maxShields();
  inv = 0;
  boostT = 0;
  ship.group.visible = true;
  world.removeEnemies();
  battle.clear();
  world.spawnLoot(lootOptions()); // пока стояли в порту, на островах зарыли новые клады
  controls.setEnabled(false);
  setAction(null);
  show('port');
  updateHud();
}

// «В море!» — сначала карта удачи на заплыв, потом отчаливаем.
function leavePort() {
  unlockAudio();
  if (mode === 'port') openCards('start');
}

function startVoyage() {
  mode = 'sea';
  controls.setEnabled(true);
  sfx.horn();
  show('sea');
  save.trips++;
  storeSave(save);
  cardAt = CARD_EVERY;
  chestT = 20;
  if (save.trips <= 2) showHint('веди пальцем — корабль поплывёт');
}

/* ---------- карты удачи ---------- */
let picking = null; // открыт выбор карты: start | reward | merchant | gift
let pickChoices = [];
let cardAt = CARD_EVERY;
const PICK_TEXT = {
  start: ['Карта удачи', 'Выбери одну — она поможет в этом заплыве'],
  reward: ['Новая карта!', 'В трюме уже много золота — выбирай ещё одну'],
  merchant: ['Торговец картами', `Любая карта — ${MERCHANT_PRICE} золота из трюма`],
  gift: ['Записка в бутылке', 'А в ней карта удачи — выбирай!'],
};

function openCards(kind) {
  if (picking) return false;
  if (kind === 'merchant' && save.cargo < MERCHANT_PRICE) {
    say(`У торговца карты по ${MERCHANT_PRICE} монет. Собери золото в трюм!`, 3);
    sfx.nope();
    return false;
  }
  if (spy) setSpy(false);
  picking = kind;
  controls.setEnabled(false);
  const [title, sub] = PICK_TEXT[kind];
  $('cardsTitle').textContent = title;
  $('cardsSub').textContent = sub;
  $('cardsSkip').classList.toggle('hidden', kind !== 'merchant');
  pickChoices = cards.offer(3);
  renderPicker($('cardsRow'), pickChoices, { price: kind === 'merchant' ? MERCHANT_PRICE : 0 }, pickCard);
  $('scCards').classList.remove('hidden');
  sfx.chest();
  return true;
}

function closeCards() {
  const kind = picking;
  picking = null;
  $('scCards').classList.add('hidden');
  last = performance.now();
  if (kind === 'start') startVoyage();
  else controls.setEnabled(mode === 'sea' || mode === 'land');
}

function pickCard(card) {
  if (!picking) return;
  if (picking === 'merchant') save.cargo -= MERCHANT_PRICE;
  cards.add(card.id);
  if (card.id === 'planks') shields += 2;
  if (card.id === 'fire' && save.up.cannons === 0) ship.setUpgrades({ ...save.up, cannons: 1 });
  storeSave(save);
  sfx.medal();
  closeCards();
  say(`${card.icon} ${card.name}!`);
  updateHud();
}

// Полоска испытания вверху экрана.
let trialText = null;
function showTrial(text) {
  if (text === trialText) return;
  trialText = text;
  $('trialBar').classList.toggle('hidden', !text);
  if (text) $('trialBar').textContent = text;
}

// Легенда: при первом запуске и по кнопке 📜 в порту.
function openLegend() {
  unlockAudio();
  $('legendText').textContent = LEGEND;
  $('legendKeys').replaceChildren(
    ...story.keyList().map((k) => {
      const el = document.createElement('div');
      el.className = `legend-key ${k.got ? 'got' : ''}`;
      el.textContent = `${k.got ? '🗝' : '🔒'} ${k.icon} ${k.key}`;
      return el;
    }),
  );
  $('scLegend').classList.remove('hidden');
}

// Секретный остров: сначала узнаёшь (записка в бутылке или подплыл), потом высаживаешься — клад +50.
function revealSecret(isl) {
  if (save.secretsKnown.includes(isl.id)) return;
  save.secretsKnown.push(isl.id);
  storeSave(save);
  sfx.discover();
  say(`✦ Секретный остров «${isl.name}»!`, 3);
}

function findSecret(isl) {
  revealSecret(isl);
  if (save.secretsFound.includes(isl.id)) return;
  save.secretsFound.push(isl.id);
  storeSave(save);
  addGold(50);
  celebrate(cap.x, cap.y, cap.z);
  sfx.chest();
  say(`✦ Ты нашёл секретный остров «${isl.name}»! Клад: +50`, 4);
}

// Бутылка с запиской: секретный остров, клочок карты сокровищ или карта удачи в подарок.
function bottleFound() {
  const hidden = SECRET_ISLES.filter((i) => !save.secretsKnown.includes(i.id));
  if (hidden.length && Math.random() < 0.45) {
    const isl = hidden[Math.floor(Math.random() * hidden.length)];
    save.secretsKnown.push(isl.id);
    storeSave(save);
    sfx.discover();
    say(`🍾 В записке карта секретного острова «${isl.name}»! Ищи ✦ на карте`, 4);
    return;
  }
  if (save.bigTreasure == null && Math.random() < 0.5) addMapPiece();
  else openCards('gift');
}

// Карты, которые работают сами: дельфины носят монетки, со дна всплывают сундуки.
let dolphinT = 0;
let chestT = 20;
function cardPerks(dt) {
  const dol = cards.count('dolphins');
  if (dol && Math.abs(boat.speed) > 5 && (dolphinT -= dt) <= 0) {
    dolphinT = 7 / dol;
    const side = Math.random() < 0.5 ? -7 : 7;
    const p = { x: boat.x + Math.cos(boat.heading) * side, y: 0, z: boat.z - Math.sin(boat.heading) * side };
    fx.splash(p.x, p.z);
    fx.burst(0xf6c944, p, 6, { up: 8, y: 1 });
    sfx.coin();
    addGold(1);
  }
  const ch = cards.count('chests');
  if (ch && (chestT -= dt) <= 0) {
    chestT = 30 / ch;
    const a = boat.heading + (Math.random() - 0.5) * 1.2;
    const x = boat.x - Math.sin(a) * 40;
    const z = boat.z - Math.cos(a) * 40;
    if (!landNear(x, z, 6)) {
      world.addChest(x, z);
      fx.splash(x, z);
      say('Со дна всплыл сундук!');
    }
  }
}

// «В порт» из паузы: сразу домой, в меню.
function goHome(fromWreck = false) {
  if (mode === 'land') goAboard();
  boat.x = DOCK.x;
  boat.z = DOCK.z;
  boat.heading = DOCK.heading;
  ship.group.rotation.set(0, 0, 0);
  ship.group.position.y = 0;
  snapCam = true;
  enterPort(fromWreck);
}

function goAshore() {
  const spot = terrain.nearestLand(boat.x, boat.z, ASHORE_R, true);
  if (!spot) return;
  balbes.cancel();
  fishing.stop();
  mode = 'land';
  boat.speed = 0;
  Object.assign(cap, { x: spot.x, z: spot.z, y: spot.y, vy: 0, air: false, facing: boat.heading, stride: 0 });
  crew.captain.removeFromParent();
  scene.add(crew.captain);
  sfx.step();
  const isl = terrain.islandAt(spot.x, spot.z);
  if (isl) discover(isl);
  if (!landedOnce) {
    landedOnce = true;
    showHint('веди пальцем — капитан пойдёт. Прыгать — большая кнопка справа, назад — «На корабль»');
  }
}

// Вернуться на корабль можно откуда угодно: рядом — сам запрыгивает,
// далеко — свисток, и матросы забирают капитана на шлюпке.
function goAboard() {
  if (mode === 'dive') {
    endDive();
    return;
  }
  if (mode !== 'land') return;
  if (dist(cap.x, cap.z, boat.x, boat.z) > BOARD_R) {
    fx.burst(0xffffff, crew.captain.position, 12, { speed: 6, up: 4, y: 2 });
    sfx.whistle();
    say(`Свисток — и ${captainName} снова на корабле!`);
  } else {
    sfx.step();
  }
  balbes.cancel();
  digT = 0;
  mode = 'sea';
  crew.captain.removeFromParent();
  ship.group.add(crew.captain);
  crew.captain.position.copy(crew.captainSpot);
  crew.captain.rotation.set(0, 0, 0);
  walkPose(crew.captain, 0, 0);
}

function startDig() {
  if (digSpot && digT <= 0 && !cap.air) digT = DIG_TIME / (1 + cards.count('digger'));
}

function finishDig() {
  const p = digSpot.g.position;
  const big = digSpot.kind === 'bigx';
  const reward = (big ? BIG_TREASURE : TREASURE) * (1 + cards.count('digger'));
  world.take(digSpot);
  world.addPrize(p.x, p.y, p.z);
  fx.burst(0xf6c944, p, big ? 30 : 18, { up: 9 });
  sfx.chest();
  save.dug++;
  if (big) {
    save.bigTreasure = null;
    save.bigDug++;
    celebrate(p.x, p.y, p.z);
  }
  addGold(reward);
  const back = crew.revive();
  const title = big ? `Великий клад! +${reward}` : `Клад! +${reward}`;
  say(back ? `${title}. ${back.name} снова с нами!` : title, big ? 3 : 2);
  quests.event('dig');
  digSpot = null;
  updateHud();
}

// Праздничный салют из кубиков над точкой.
function celebrate(x, y, z) {
  const colors = [0xd8453a, 0xe8b830, 0x3a6fc0, 0x4f9c5a, 0xe07ab0];
  for (let i = 0; i < 4; i++) {
    const p = { x: x + (Math.random() - 0.5) * 8, y: y + 6 + Math.random() * 6, z: z + (Math.random() - 0.5) * 8 };
    fx.burst(colors[i], p, 16, { speed: 16, up: 3, size: 0.7, life: 1.2, y: 0, gravity: 5 });
  }
}

// Забрались по паркуру на вершину чуда света.
function reachSummit(it) {
  const p = it.g.position;
  const isl = terrain.islandAt(p.x, p.z);
  world.take(it);
  if (isl && !save.summits.includes(isl.id)) save.summits.push(isl.id);
  celebrate(p.x, p.y, p.z);
  sfx.chest();
  sfx.discover();
  addGold(25);
  say(`Покоритель вершины! ${isl ? isl.name : ''} +25`, 3);
  quests.event('summit');
}

// Задание выполнено — сразу награда и медаль.
function questDone(q) {
  save.medals++;
  addGold(q.reward);
  sfx.medal();
  const onLand = mode === 'land' || mode === 'dive';
  celebrate(onLand ? cap.x : boat.x, onLand ? cap.y : 4, onLand ? cap.z : boat.z);
  say(`Задание выполнено: ${q.text}! +${q.reward}`, 3);
}

// Клочок карты сокровищ; три клочка — и на карте появляется великий клад.
function takePiece(it) {
  world.take(it);
  fx.burst(0xe8dcc0, it.g.position, 10);
  addMapPiece();
}

function addMapPiece() {
  sfx.chest();
  if (save.bigTreasure != null) {
    addGold(10); // карта уже собрана — старый клочок продадим
    say('Ещё клочок карты — но карта уже собрана. +10');
    return;
  }
  save.mapPieces++;
  quests.event('map');
  if (save.mapPieces >= 3) {
    const choices = terrain.islands.filter((i) => !i.port && !i.home && i.cells.length);
    const isl = choices[Math.floor(Math.random() * choices.length)];
    save.bigTreasure = isl.id;
    save.mapPieces = 0;
    world.setBigTreasure(isl.id);
    say(`Карта сокровищ собрана! Великий клад зарыт на острове «${isl.name}». Ищи красный крестик на карте!`, 4);
  } else {
    say(`Клочок карты сокровищ! ${save.mapPieces} из 3`);
  }
  storeSave(save);
  updateHud();
}

// Подплыли к бочке — моряк спасён.
function rescueBarrel(it) {
  world.kill(it);
  save.rescued++;
  fx.splash(it.g.position.x, it.g.position.z);
  sfx.rescue();
  const back = crew.revive();
  if (back) {
    say(`Моряк спасён! Это был ${back.name} — снова на палубе!`);
  } else {
    const gift = 5 * (1 + cards.count('luck'));
    addGold(gift);
    say(`Моряк спасён! В благодарность он подарил ${gift} монет.`);
  }
  quests.event('rescue');
  storeSave(save);
  updateHud();
}

/* ---------- урон и бой ---------- */
// Сначала удар принимает корпус, потом за борт летит матрос.
function damage() {
  if (inv > 0 || mode !== 'sea') return;
  shake = 0.4;
  if (shields > 0) {
    shields--;
    inv = 1.5;
    sfx.shield();
    say('Корпус выдержал!');
    updateHud();
    return;
  }
  balbes.cancel();
  fishing.stop();
  sfx.crash();
  const lost = crew.hit();
  updateHud();
  if (crew.aliveCount === 0 && cards.consume('ring')) {
    crew.reset();
    inv = 3;
    sfx.rescue();
    say('🛟 Спасательный круг! Вся команда снова на палубе!', 3);
    updateHud();
    return;
  }
  if (crew.aliveCount === 0) {
    mode = 'wreck';
    wreckT = 2.4;
    boat.speed = 0;
    controls.setEnabled(false);
    setAction(null);
    const sunk = Math.ceil(save.cargo / 2); // половина трюма уходит на дно
    save.cargo -= sunk;
    storeSave(save);
    say(sunk ? `Корабль разбит! ${sunk} золота утонуло…` : 'Корабль разбит!', 2.4);
  } else {
    inv = 2;
    if (lost) say(`${lost.name} за бортом!`);
  }
}

function sailorLanded(pos) {
  fx.splash(pos.x, pos.z);
  sfx.splash();
}

function fireCannons(dt) {
  const fire = cards.count('fire'); // «Огненные ядра»: вдвое чаще, а без пушек — пушки напрокат
  const cooldown = (effect.cannonCooldown[save.up.cannons] || (fire ? 1.6 : 0)) * 0.5 ** fire;
  if (!cooldown) return;
  cannonT -= dt;
  if (cannonT > 0) return;
  const target = world.findTarget(boat.x, boat.z);
  if (!target) return;
  const list = ship.muzzles();
  const from = ship.group.localToWorld(list[muzzleIdx++ % list.length].clone());
  battle.fire(from, target);
  fx.burst(0xffd27a, from, 5, { speed: 5, up: 2, size: 0.5, life: 0.3, y: 0 });
  sfx.cannon();
  cannonT = cooldown;
}

const enemyMuzzle = new THREE.Vector3(0, 2, 6);
function enemyFires(enemy) {
  battle.enemyFire(enemy.g.localToWorld(enemyMuzzle.clone()), boat.x, boat.z);
  sfx.enemyFire();
}

const battleHooks = {
  hitTarget(it) {
    if (it.kind !== 'enemy' || it.sinking) return;
    if (it.custom) {
      it.onHit(1);
      return;
    }
    const p = it.g.position;
    it.hp--;
    fx.burst(0x3d2b1f, p, 10, { y: 2 });
    sfx.boom();
    if (it.hp > 0) {
      it.pop = 0.25;
    } else {
      world.sink(it);
      world.addChest(p.x, p.z);
      sfx.sink();
      say('Враг потоплен!');
      quests.event('sink');
    }
  },
  shellLanded(x, z) {
    if (fairy.charmed) {
      // заколдованное ядро рассыпается цветами
      for (const c of [0xf07ab8, 0xffffff, 0xf4d23a]) fx.burst(c, { x, y: -1, z }, 5, { speed: 6, up: 6, size: 0.5, life: 1 });
      sfx.rescue();
      return;
    }
    if (mode === 'sea' && dist(x, z, boat.x, boat.z) < SHELL_R) {
      fx.burst(0x6d4728, { x: boat.x, y: 0, z: boat.z }, 12, { y: 2 });
      damage();
    } else {
      fx.splash(x, z);
      sfx.splash();
    }
  },
};

// салют из пушек (проделка балбеса)
function salute() {
  const colors = [0xd8453a, 0xe8b830, 0x3a6fc0, 0x4f9c5a, 0xe07ab0];
  for (let i = 0; i < 4; i++) {
    const p = { x: boat.x + (Math.random() - 0.5) * 20, y: 26 + Math.random() * 10, z: boat.z + (Math.random() - 0.5) * 20 };
    fx.burst(colors[i], p, 18, { speed: 20, up: 3, size: 0.8, life: 1.3, y: 0, gravity: 5 });
  }
  sfx.cannon();
}

/* ---------- корабль ---------- */
function hullHits(x, z, h) {
  const c = Math.cos(h);
  const s = Math.sin(h);
  for (const [hx, hz] of HULL_POINTS) {
    const lx = hx * hullScale;
    const lz = hz * hullScale;
    if (terrain.groundAt(x + lx * c + lz * s, z - lx * s + lz * c) !== undefined) return true;
  }
  return false;
}

// Куда отталкиваться от берега: от задевших сушу точек корпуса к центру корабля.
function shoreAway(x, z, h) {
  const c = Math.cos(h);
  const s = Math.sin(h);
  let ax = 0;
  let az = 0;
  for (const [hx, hz] of HULL_POINTS) {
    const lx = hx * hullScale;
    const lz = hz * hullScale;
    const px = x + lx * c + lz * s;
    const pz = z - lx * s + lz * c;
    if (terrain.groundAt(px, pz) !== undefined) {
      ax += x - px;
      az += z - pz;
    }
  }
  const len = Math.hypot(ax, az);
  return len ? [ax / len, az / len] : null;
}

// Поворот упёрся в сушу — отодвигаемся от берега ровно настолько, чтобы развернуться.
// Иначе корабль, уткнувшийся носом в остров, зажат: ни вперёд, ни повернуть.
function nudgeOffShore(turned) {
  const away = shoreAway(boat.x, boat.z, turned);
  if (!away) return;
  for (const d of [0.3, 0.6, 1]) {
    const nx = boat.x + away[0] * d;
    const nz = boat.z + away[1] * d;
    if (!hullHits(nx, nz, turned)) {
      boat.x = nx;
      boat.z = nz;
      boat.heading = turned;
      return;
    }
  }
}

// Двигаем корабль; упёрлись в сушу — скользим вдоль берега или отскакиваем.
function moveBoat(dt) {
  const step = boat.speed * dt;
  const nx = boat.x - Math.sin(boat.heading) * step;
  const nz = boat.z - Math.cos(boat.heading) * step;
  if (!hullHits(nx, nz, boat.heading)) {
    boat.x = nx;
    boat.z = nz;
  } else if (!hullHits(nx, boat.z, boat.heading)) {
    boat.x = nx;
    boat.speed *= 0.97;
  } else if (!hullHits(boat.x, nz, boat.heading)) {
    boat.z = nz;
    boat.speed *= 0.97;
  } else {
    if (Math.abs(boat.speed) > 6) {
      sfx.bump();
      shake = 0.15;
    }
    boat.speed *= -0.3;
  }
}

// Джойстик считается относительно камеры: толкнул вправо — корабль поворачивает вправо.
function stickToWorld(mv) {
  const s = Math.sin(camYaw);
  const c = Math.cos(camYaw);
  return [-s * mv.y + c * mv.x, -c * mv.y - s * mv.x];
}

function updateSea(dt, mv) {
  const agility = effect.steer[save.up.sails];
  const before = boat.heading;
  let throttle = 0;
  const m = Math.hypot(mv.x, mv.y);
  if (m > 0) {
    const [dx, dz] = stickToWorld(mv);
    const want = Math.atan2(-dx, -dz);
    const turned = turnToward(boat.heading, want, TURN_RATE * agility * dt);
    if (!hullHits(boat.x, boat.z, turned)) boat.heading = turned;
    else nudgeOffShore(turned);
    // толкнули назад — корабль сдаёт кормой, пока разворачивается (так легко отойти от берега)
    const c = Math.cos(wrapAngle(want - boat.heading));
    throttle = c >= 0 ? m * (0.35 + 0.65 * c) : m * 0.45 * c;
  }
  boostT = Math.max(0, boostT - dt);
  const top = SHIP_SPEED * (1 + 0.15 * save.up.sails + 0.25 * cards.count('wind') + 0.04 * (HULLS[save.look.hull]?.tier ?? 0)) * (boostT > 0 ? 1.5 : 1) * roles.speedMult;
  boat.speed += (throttle * top - boat.speed) * Math.min(1, dt * 1.2);
  moveBoat(dt);
  const turnRate = wrapAngle(boat.heading - before) / Math.max(dt, 1e-3);
  lean += (clamp(-turnRate * 0.12, -0.16, 0.16) - lean) * Math.min(1, dt * 4);

  // капитан подпрыгивает у штурвала (пробел в море)
  if (seaHop > 0) {
    seaHop = Math.max(0, seaHop - dt);
    crew.captain.position.y = crew.captainSpot.y + Math.sin((seaHop / 0.5) * Math.PI) * 1.6;
  }

  foamT -= dt;
  if (boat.speed > 6 && foamT <= 0) {
    foamT = 0.06;
    fx.foam(boat.x + Math.sin(boat.heading) * 8 + (Math.random() - 0.5) * 3, boat.z + Math.cos(boat.heading) * 8);
  }
  // на полном ходу нос режет волну — брызги в стороны
  sprayT -= dt;
  if (boat.speed > 12 && sprayT <= 0) {
    sprayT = 0.07;
    const fwdX = -Math.sin(boat.heading);
    const fwdZ = -Math.cos(boat.heading);
    const side = Math.random() < 0.5 ? -1 : 1;
    const sx = -fwdZ * side;
    const sz = fwdX * side;
    const p = { x: boat.x + fwdX * 9.5 + sx * 2.2, y: -1, z: boat.z + fwdZ * 9.5 + sz * 2.2 };
    fx.burst(0xe6f5ff, p, 2, { speed: 3, up: 5, size: 0.55, life: 0.55, y: 0, vx: sx * 6, vz: sz * 6 });
  }

  const dDock = dist(boat.x, boat.z, DOCK.x, DOCK.z);
  if (portLock && dDock > DOCK_RELEASE) portLock = false;
  if (!portLock && dDock < DOCK_R) {
    enterPort();
    return;
  }

  for (const isl of WONDERS) {
    if (dist(isl.x, isl.z, boat.x, boat.z) < isl.r + 45) discover(isl);
  }
  for (const isl of SECRET_ISLES) if (dist(isl.x, isl.z, boat.x, boat.z) < isl.r + 45) revealSecret(isl);

  world.spawnEnemies(dt, boat.x, boat.z, save.found.length);
  if (world.spawnBarrels(dt, boat.x, boat.z, boat.heading)) say('Человек за бортом! Плыви к бочке!');
  fireCannons(dt);
  cardPerks(dt);

  for (const it of world.items) {
    if (it.dead) continue;
    const d = dist(it.g.position.x, it.g.position.z, boat.x, boat.z);
    if (it.kind === 'barrel' && d < CHEST_R) {
      rescueBarrel(it);
    } else if (it.kind === 'chest' && d < CHEST_R) {
      world.kill(it);
      fx.burst(0xf6c944, it.g.position, 16);
      sfx.chest();
      const v = it.value * (1 + cards.count('luck'));
      say(`Сундук! +${v}`);
      addGold(v);
    } else if (it.kind === 'enemy' && !it.sinking && d < RAM_R && inv <= 0) {
      fx.burst(0x3d2b1f, it.g.position, 12);
      world.sink(it);
      damage();
    }
  }

  const spot = Math.abs(boat.speed) < 8 ? terrain.nearestLand(boat.x, boat.z, ASHORE_R, true) : null;
  if (fishing.active && (m > 0 || spot)) fishing.stop(); // поплыли — удочку сматываем
  if (spot) setAction('ashore');
  else if (!fishing.active && Math.abs(boat.speed) < 5 && deep.nearSite(boat.x, boat.z, 18)) setAction('dive');
  else if (fishing.active) setAction('pull');
  else {
    const still = Math.abs(boat.speed) < 1.5 && dist(boat.x, boat.z, DOCK.x, DOCK.z) > DOCK_RELEASE;
    setAction(still ? 'fish' : null);
  }
  fishing.update(dt, t);
}

/* ---------- капитан на суше ---------- */
// Опора под ногами в точке: земля острова или парящий блок, но не выше cap.y + reach.
function supportAt(x, z, reach) {
  let best = -Infinity;
  const g = terrain.groundAt(x, z);
  if (g !== undefined && !terrain.isSolid(x, z) && g <= cap.y + reach) best = g;
  return Math.max(best, surfaces.support(x, z, cap.y + reach));
}

function canWalk(x, z) {
  // стоя — сам заходит на один блок; в прыжке — туда, над чем уже пролетает
  const s = supportAt(x, z, cap.air ? LAND_REACH : B + 0.1);
  if (s === -Infinity) return false; // вода или стена
  // и чтобы голова не упёрлась в блок; в прыжке тело на высоте cap.y — сквозь бок ступени не пролететь
  return !surfaces.blocked(x, z, cap.air ? Math.max(s, cap.y) : s, 3.8);
}

// Опора под ступнями: капитан шире точки — встанет, даже если под ногой только край ступени.
const FEET = 0.5;
const FEET_OFFSETS = [[0, 0], [FEET, 0], [-FEET, 0], [0, FEET], [0, -FEET]];
function feetAt(x, z, reach) {
  let best = -Infinity;
  for (const [dx, dz] of FEET_OFFSETS) best = Math.max(best, supportAt(x + dx, z + dz, reach));
  return best;
}

function doJump() {
  unlockAudio();
  if (paused || picking) return;
  if (mode === 'port') {
    leavePort();
  } else if (mode === 'land') {
    if (cap.air || digT > 0 || balbes.captainBusy()) return;
    cap.air = true;
    cap.vy = JUMP_V * (1 + 0.3 * Math.min(2, cards.count('boots')));
    sfx.jump();
  } else if (mode === 'dive') {
    cap.vy = 6; // гребок вверх
    sfx.splash();
  } else if (mode === 'sea' && seaHop <= 0 && !balbes.acting(crew.people[0])) {
    seaHop = 0.5;
    sfx.jump();
  }
}

function updateLand(dt, mv) {
  const m = Math.hypot(mv.x, mv.y);
  const moving = m > 0 && digT <= 0 && !balbes.captainBusy();
  if (moving) {
    const [dx, dz] = stickToWorld(mv);
    cap.facing = turnToward(cap.facing, Math.atan2(-dx, -dz), dt * 12);
    const nx = cap.x + dx * WALK_SPEED * dt;
    const nz = cap.z + dz * WALK_SPEED * dt;
    const len = Math.hypot(dx, dz) || 1;
    const px = (dx / len) * 0.8;
    const pz = (dz / len) * 0.8;
    if (canWalk(nx + px, nz + pz)) {
      cap.x = nx;
      cap.z = nz;
    } else if (canWalk(nx + px, cap.z)) {
      cap.x = nx;
    } else if (canWalk(cap.x, nz + pz)) {
      cap.z = nz;
    }
  }
  cap.stride += ((moving && !cap.air ? m : 0) - cap.stride) * Math.min(1, dt * 10);
  cap.phase += dt * 11 * cap.stride;

  // прыжок, падение с обрыва, шаг на ступеньку
  // та же высота, что и в canWalk: влетел в клетку ступени — значит, на неё и встанешь
  let ground = feetAt(cap.x, cap.z, cap.air ? LAND_REACH : B + 0.1);
  if (ground === -Infinity) ground = terrain.groundAt(cap.x, cap.z) ?? cap.y;
  if (cap.air) {
    cap.vy -= GRAVITY * dt;
    cap.y += cap.vy * dt;
    if (cap.y <= ground) {
      cap.y = ground;
      cap.air = false;
      cap.vy = 0;
    }
  } else if (ground > cap.y) {
    cap.y += (ground - cap.y) * Math.min(1, dt * 16);
  } else if (ground < cap.y - 0.4) {
    cap.air = true;
    cap.vy = 0;
  } else {
    cap.y = ground;
  }

  // копаем
  let hop = 0;
  if (digT > 0) {
    digT -= dt;
    hop = Math.abs(Math.sin(t * 14)) * 0.5;
    digFx -= dt;
    if (digFx <= 0) {
      digFx = 0.15;
      fx.burst(0x8b5a2b, digSpot.g.position, 3, { speed: 6, up: 5, size: 0.5, life: 0.5, y: 0.3 });
      sfx.dig();
    }
    walkPose(crew.captain, t * 20, 1);
    if (digT <= 0) finishDig();
  } else if (cap.air) {
    walkPose(crew.captain, 1.2, 1); // в прыжке — ноги врозь
  } else {
    walkPose(crew.captain, cap.phase, cap.stride);
  }
  crew.captain.position.set(cap.x, cap.y + hop, cap.z);
  crew.captain.rotation.y = cap.facing;

  // монеты и клады
  digSpot = null;
  for (const it of world.items) {
    if (it.dead) continue;
    const p = it.g.position;
    const d = dist(p.x, p.z, cap.x, cap.z);
    if (it.kind === 'coin' && d < 2.4 && Math.abs(p.y - cap.y) < 5) {
      world.take(it);
      fx.burst(0xf6c944, p, 8);
      sfx.coin();
      addGold(1 + cards.count('rush'));
      quests.event('coin');
    } else if (it.kind === 'piece' && d < 2.4 && Math.abs(p.y - cap.y) < 5) {
      takePiece(it);
    } else if ((it.kind === 'xspot' && d < 2.8) || (it.kind === 'bigx' && d < 3.6)) {
      digSpot = it;
    } else if (it.kind === 'summit' && d < 2.6 && Math.abs(p.y - cap.y) < 3.5) {
      reachSummit(it);
    }
  }

  setAction(digSpot && digT <= 0 ? 'dig' : null);
}

function updatePort(dt) {
  const k = Math.min(1, dt * 1.5);
  boat.x += (DOCK.x - boat.x) * k;
  boat.z += (DOCK.z - boat.z) * k;
  boat.heading += wrapAngle(DOCK.heading - boat.heading) * k;
}

function updateWreck(dt) {
  wreckT -= dt;
  ship.group.rotation.z += dt * 0.35;
  ship.group.position.y -= dt * 2.5;
  if (wreckT <= 0) {
    goHome(true);
  }
}

/* ---------- чудеса, которые двигаются ---------- */
// Раз в `every` секунд выпускает частицу — дым, брызги, огонь, фонтан.
function emit(u, dt, every, fn) {
  u.t = (u.t ?? Math.random() * every) - dt;
  if (u.t <= 0) {
    u.t = every;
    fn();
  }
}

function updateActors(dt, fxX, fxZ) {
  for (const { group: g } of terrain.actors) {
    const u = g.userData;
    const p = g.position;
    const near = dist(p.x, p.z, fxX, fxZ) < 260;
    g.visible = near && !u.gone; // далёкое не рисуем — оно всё равно в дымке
    if (!near && !u.flying) continue;
    if (u.spin) g.rotation.z += dt * u.spin; // крылья мельницы, колесо обозрения
    if (u.smoke) {
      emit(u, dt, 0.3, () => fx.burst(Math.random() < 0.5 ? 0x8a8a8a : 0xb4b4b4, p, 1, { speed: 1.5, up: 2.5, size: 2.4, life: 3.5, y: 0, gravity: -0.6 }));
    }
    if (u.fire) {
      emit(u, dt, 0.08, () => fx.burst(Math.random() < 0.5 ? 0xff8a2a : 0xffd23a, p, 1, { speed: 1.5, up: 3, size: 0.8, life: 0.6, y: 0, gravity: -2 }));
    }
    if (u.mist) {
      emit(u, dt, 0.06, () => fx.burst(0xf4fbff, { x: p.x + (Math.random() - 0.5) * u.mist, y: p.y, z: p.z }, 1, { speed: 2, up: 3, size: 1, life: 1, y: 0, gravity: 1 }));
    }
    if (u.fountain) {
      emit(u, dt, 0.05, () => fx.burst(0x9fd8f0, p, 1, { speed: 0.6, up: 2, size: 0.4, life: 0.9, y: 0, gravity: 12, vx: u.fountain[0], vz: u.fountain[1] }));
    }
    if (u.geyser) {
      // извержение каждые 11 секунд, длится три
      u.clock = (u.clock ?? Math.random() * 11) + dt;
      if (u.clock % 11 < 3.2) {
        if (!u.roar) {
          u.roar = true;
          sfx.splash();
        }
        emit(u, dt, 0.05, () => fx.burst(Math.random() < 0.5 ? 0xe6f5ff : 0xbfe8f5, p, 2, { speed: 3, up: 16, size: 1, life: 1.4, y: 0, gravity: 14 }));
      } else {
        u.roar = false;
      }
    }
    if (u.swim) {
      // Несси плавает кругами и ныряет
      u.home ??= p.clone();
      u.clock = (u.clock ?? 0) + dt;
      p.x = u.home.x + Math.sin(u.clock * 0.3) * 4;
      p.z = u.home.z + Math.cos(u.clock * 0.3) * 2;
      p.y = u.home.y + Math.sin(u.clock * 1.4) * 0.4 - 0.2;
      g.rotation.y = -u.clock * 0.3 + Math.PI;
    }
    if (!u.launch) continue;
    // ракета взлетает, когда подплываешь, и через время возвращается на стол
    u.home ??= p.y;
    u.cool ??= 0;
    if (u.flying) {
      u.v += dt * 7;
      p.y += u.v * dt;
      fx.burst(Math.random() < 0.5 ? 0xffb347 : 0xfff3a0, { x: p.x, y: p.y - 1.5, z: p.z }, 2, {
        speed: 5, up: -3, size: 0.9, life: 0.5, y: 0,
      });
      if (p.y > u.home + 160) {
        u.flying = false;
        u.gone = true;
        u.cool = 45;
      }
    } else if (u.cool > 0) {
      u.cool -= dt;
      if (u.cool <= 0) {
        p.y = u.home;
        u.gone = false;
      }
    } else if (dist(p.x, p.z, fxX, fxZ) < 80) {
      u.flying = true;
      u.v = 0;
      sfx.launch();
      say('Ракета улетает в космос! 🚀');
    }
  }
}

/* ---------- камера, небо, солнце ---------- */
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const wantPos = new THREE.Vector3();
const wantLook = new THREE.Vector3();
const orbitPos = new THREE.Vector3();
const orbitLook = new THREE.Vector3();
const look = new THREE.Vector3();

function updateCamera(dt) {
  portMix += ((mode === 'port' ? 1 : 0) - portMix) * Math.min(1, dt * 2);
  const m = smooth(clamp(portMix, 0, 1));

  // В море камера сзади и выше парусов: грот ложится на воду у борта,
  // а чудеса света впереди видны над ним. Медленно доворачивает за кораблём.
  // На суше направление камеры не меняется — так проще ходить.
  let fx0;
  let fz0;
  let fy0 = 0;
  let back = 32;
  let height = 29;
  let ahead = 22;
  let lookY = 7;
  if (mode === 'land' || mode === 'dive') {
    fx0 = cap.x;
    fz0 = cap.z;
    fy0 = cap.y;
    back = 17;
    height = 11;
    ahead = 3;
    lookY = 3;
  } else {
    camYaw += wrapAngle(boat.heading - camYaw) * Math.min(1, dt * 1.5);
    back *= hullScale; // большой корабль — камера дальше и выше, паруса не закрывают вид
    height *= hullScale;
    fx0 = boat.x;
    fz0 = boat.z;
  }
  const fwdX = -Math.sin(camYaw);
  const fwdZ = -Math.cos(camYaw);
  wantPos.set(fx0 - fwdX * back, fy0 + height, fz0 - fwdZ * back);
  wantLook.set(fx0 + fwdX * ahead, fy0 + lookY, fz0 + fwdZ * ahead);
  const k = snapCam ? 1 : Math.min(1, dt * 6);
  snapCam = false;
  camPos.lerp(wantPos, k);
  camLook.lerp(wantLook, k);

  // В порту — неспешный облёт со стороны моря, чтобы разглядеть покупки.
  const a = Math.sin(t * 0.08) * 1.1;
  orbitPos.set(boat.x + Math.sin(a) * 49, 14, boat.z + Math.cos(a) * 49);
  orbitLook.set(boat.x, 10, boat.z);

  camera.position.lerpVectors(camPos, orbitPos, m);
  look.lerpVectors(camLook, orbitLook, m);
  if (spy) {
    // подзорная труба: смотрим с верхушки мачты далеко вперёд
    camera.position.set(fx0, fy0 + 20, fz0);
    look.set(fx0 + fwdX * 300, fy0 + 8, fz0 + fwdZ * 300);
  }
  if (shake > 0) {
    const j = shake * 3;
    camera.position.x += (Math.random() - 0.5) * j;
    camera.position.y += (Math.random() - 0.5) * j;
    shake = Math.max(0, shake - dt);
  }
  camera.lookAt(look);

  // Корабль уводим из-под панели порта: вверх на телефоне, влево на широком экране.
  if (m > 0.001) {
    camera.setViewOffset(viewW, viewH, portrait ? 0 : viewW * 0.22 * m, portrait ? viewH * 0.27 * m : 0, viewW, viewH);
  } else {
    camera.clearViewOffset();
  }
}


// Подзорная труба: узкий угол зрения, туман отступает — видно далёкие острова и их названия.
function setSpy(on) {
  spy = on;
  $('spyMask').classList.toggle('hidden', !on);
  $('spyLabel').classList.toggle('hidden', !on);
  camera.far = on ? 1600 : 500;
  spyName = '';
  resize();
}

function updateSpy(dt, fxX, fxZ) {
  spyT -= dt;
  if (spyT > 0) return;
  spyT = 0.25;
  const fwdX = -Math.sin(camYaw);
  const fwdZ = -Math.cos(camYaw);
  let best = null;
  let bestAng = 0.12; // остров должен быть почти в перекрестии
  for (const isl of terrain.islands) {
    const dx = isl.x - fxX;
    const dz = isl.z - fxZ;
    const d = Math.hypot(dx, dz);
    if (d < 20 || d > 1100) continue;
    const ang = Math.acos(Math.max(-1, Math.min(1, (dx * fwdX + dz * fwdZ) / d)));
    if (ang < bestAng) {
      bestAng = ang;
      best = { isl, d };
    }
  }
  const known = best && (best.isl.port || best.isl.home || save.found.includes(best.isl.id) || save.secretsKnown.includes(best.isl.id));
  const name = !best ? 'Только море…' : known ? best.isl.name : 'Неизвестный остров';
  $('spyLabel').textContent = best ? `${name} · ${Math.round(best.d)} м` : name;
  if (name !== spyName) {
    spyName = name;
  }
}

function drawMap() {
  const onLand = mode === 'land' || mode === 'dive';
  minimap.draw({
    x: onLand ? cap.x : boat.x,
    z: onLand ? cap.z : boat.z,
    yaw: camYaw,
    heading: onLand ? cap.facing : boat.heading,
    islands: mapIslands(),
    found: mapFound(),
    enemies: world.items.filter((it) => it.kind === 'enemy' && !it.dead && !it.sinking),
    ship: onLand ? boat : null,
    marks: mapMarks(),
  });
}

// Значки на мини-карте: бочки с моряками, великий клад, остров из задания.
function mapMarks() {
  const marks = [];
  for (const it of world.items) {
    if (it.kind === 'barrel' && !it.dead) marks.push({ x: it.g.position.x, z: it.g.position.z, glyph: '+', color: '#3f8f4a' });
  }
  const big = save.bigTreasure != null ? terrain.islands[save.bigTreasure] : null;
  if (big) marks.push({ x: big.x, z: big.z, glyph: '✕', color: '#c0392b' });
  const qt = quests.target();
  if (qt != null) marks.push({ x: terrain.islands[qt].x, z: terrain.islands[qt].z, glyph: '!', color: '#d4a020' });
  const mf = mode === 'land' || mode === 'dive' ? cap : boat;
  marks.push(...events.marks(), ...story.marks(), ...deep.marks(mf.x, mf.z));
  for (const isl of SECRET_ISLES) {
    if (save.secretsKnown.includes(isl.id) && !save.secretsFound.includes(isl.id)) marks.push({ x: isl.x, z: isl.z, glyph: '✦', color: '#8a4fc0' });
  }
  return marks;
}

function renderQuests(el) {
  el.replaceChildren(
    ...quests.list().map((q) => {
      const row = document.createElement('div');
      row.className = 'quest';
      const text = document.createElement('span');
      text.textContent = `📜 ${q.text}`;
      const prog = document.createElement('b');
      prog.textContent = `${q.have}/${q.need} · +${q.reward}`;
      row.append(text, prog);
      return row;
    }),
  );
}

/* ---------- кнопки, экраны, пауза, графика ---------- */
const ACTIONS = {
  ashore: ['⚓ На берег', goAshore],
  dig: ['⛏ Копать', startDig],
  fish: ['🎣 Рыбачить', () => fishing.start()],
  pull: ['🎣 Тянуть!', () => fishing.pull()],
  dive: ['🤿 Нырнуть', () => startDive()],
  surface: ['🫧 Всплыть', () => endDive()],
};

// Когда кнопка появляется впервые, голос объясняет, что нажать.
const ACTION_TIPS = {
  ashore: 'Рядом остров! Нажми зелёную кнопку «На берег».',
  dig: 'Здесь зарыт клад! Нажми «Копать».',
  fish: 'Корабль стоит — можно порыбачить! Нажми «Рыбачить».',
};
const tipped = new Set();

function setAction(name) {
  if (name === action) return;
  action = name;
  actBtn.classList.toggle('hidden', !name);
  if (name) actBtn.textContent = ACTIONS[name][0];
  if (name && ACTION_TIPS[name] && !tipped.has(name)) {
    tipped.add(name);
    showHint(ACTION_TIPS[name]);
  }
}

// кнопки суши: прыжок и «На корабль» видны всё время, пока капитан на острове
function syncLandUi() {
  const on = mode === 'land' || mode === 'dive';
  if (on === landUi) return;
  landUi = on;
  jumpBtn.classList.toggle('hidden', !on);
  boardBtn.classList.toggle('hidden', !on);
  wrap.classList.toggle('on-land', on);
}

function doAction() {
  unlockAudio();
  if (paused || picking) return;
  if (mode === 'port') leavePort();
  else if (action) ACTIONS[action][1]();
}

function show(name) {
  $('scPort').classList.toggle('hidden', name !== 'port');
  hud.classList.toggle('hidden', name === 'port');
  if (name === 'port') {
    hint.classList.add('hidden');
    renderPort();
  }
}

function renderPort() {
  $('bank').textContent = save.gold;
  const world = save.runs ? `Мир №${save.runs + 1} · ` : '';
  $('portStats').textContent = save.found.length === WONDERS.length
    ? '🏆 Все чудеса света открыты! Нажми «Начать заново» — будет новый мир.'
    : save.trips
      ? `${world}Чудеса света: ${save.found.length}/${WONDERS.length} · Кладов: ${save.dug}`
      : `${world}Плыви к островам, ищи чудеса света и клады!`;
  $('balbesLine').textContent = !balbes.hasGoofs
    ? ''
    : balbes.current
      ? `🤪 Сейчас балбес: ${balbes.current.name}`
      : '🤪 В море кто-то станет балбесом…';
  $('storyLine').textContent = story.portText();
  $('fairyLine').textContent = fairy.has ? `✨ ${fairy.names.join(', ')}: в море иногда колдует` : '';
  $('gunnerLine').textContent = gunner.has ? `💥 ${gunner.names.join(', ')}: сам стреляет фейерверком и тянет сундуки гарпуном` : '';
  $('muteBtn').textContent = save.muted ? '🔇' : '🔊';
  renderQuests($('questList'));
  renderShop($('shop'), save, buy);
  renderFlags();
}

// Цвет флага — бесплатно, сколько угодно раз.
function renderFlags() {
  $('flagColors').replaceChildren(
    ...FLAG_COLORS.map((f) => {
      const b = document.createElement('button');
      b.className = `swatch ${save.look.flag === f.id ? 'on' : ''}`;
      b.style.background = `#${f.color.toString(16).padStart(6, '0')}`;
      b.setAttribute('aria-label', f.id);
      b.addEventListener('click', () => {
        save.look.flag = f.id;
        storeSave(save);
        ship.setFlag(f.id);
        sfx.step();
        renderFlags();
      });
      return b;
    }),
  );
}

function buy(upgrade, price, btn) {
  unlockAudio();
  if (price === null || save.gold < price) {
    sfx.nope();
    btn.classList.remove('shake');
    void btn.offsetWidth; // перезапуск CSS-анимации
    btn.classList.add('shake');
    return;
  }
  save.gold -= price;
  save.up[upgrade.id]++;
  storeSave(save);
  ship.setUpgrades(save.up);
  fx.burst(0xf6c944, ship.group.position, 18, { up: 10, y: 4 });
  sfx.buy();
  renderPort();
}

function toggleMute() {
  save.muted = !save.muted;
  setMuted(save.muted);
  storeSave(save);
  if (mode === 'port') renderPort();
  if (paused) renderPause();
}

// «Красивая» — тени и чёткая картинка на ретина-экранах; «быстрая» — для слабых телефонов.
function applyGraphics() {
  const fancy = save.gfx !== 'fast';
  renderer.setPixelRatio(fancy ? Math.min(window.devicePixelRatio || 1, 1.5) : 1);
  renderer.shadowMap.enabled = fancy;
  sky.sun.castShadow = fancy;
  scene.traverse((o) => {
    if (o.material) o.material.needsUpdate = true; // шейдеры пересоберутся с тенями или без
  });
  resize();
}

function toggleGraphics() {
  save.gfx = save.gfx === 'fast' ? 'fancy' : 'fast';
  storeSave(save);
  applyGraphics();
  renderPause();
}

function renderPause() {
  $('pauseMute').textContent = save.muted ? '🔇 Звук выключен' : '🔊 Звук включён';
  $('gfxBtn').textContent = save.gfx === 'fast' ? '⚡ Графика: быстрая' : '✨ Графика: красивая';
  drawWorldMap($('worldMap'), {
    islands: mapIslands(),
    found: mapFound(),
    summits: save.summits,
    boat,
    bigTreasure: save.bigTreasure,
    questTarget: quests.target(),
    storyTarget: story.target(),
    secrets: SECRET_ISLES.filter((i) => save.secretsKnown.includes(i.id) && !save.secretsFound.includes(i.id)),
  });
  renderQuests($('pauseQuests'));
  $('passBtn').textContent = `📘 Паспорт: ${save.found.length} из ${WONDERS.length}`;
}


// Паспорт путешественника: штамп за каждое открытое чудо; нажмёшь — покажет и прочитает факт.
const STAMP_COLORS = ['#3a6fc0', '#c0453a', '#3f8f4a', '#8a5fae', '#c77a1e', '#2f8f9f', '#b06a8d', '#6a7a2a'];
function stampColor(country) {
  let h = 0;
  for (const ch of country) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return STAMP_COLORS[h % STAMP_COLORS.length];
}

function openPassport() {
  unlockAudio();
  $('passCount').textContent = `Штампов: ${save.found.length} из ${WONDERS.length}. Нажми на штамп — узнаешь интересное!`;
  $('stamps').replaceChildren(
    ...WONDERS.map((isl) => {
      if (!save.found.includes(isl.id)) {
        const el = document.createElement('div');
        el.className = 'stamp';
        el.textContent = '?';
        return el;
      }
      const el = document.createElement('button');
      el.className = 'stamp found';
      el.style.setProperty('--c', stampColor(isl.country));
      const name = document.createElement('span');
      name.textContent = isl.name;
      const country = document.createElement('small');
      country.textContent = isl.country;
      el.append(name, country);
      if (save.summits.includes(isl.id)) {
        const star = document.createElement('b');
        star.textContent = '⭐ вершина';
        el.append(star);
      }
      el.addEventListener('click', () => showFact(isl, false));
      return el;
    }),
  );
  $('scPassport').classList.remove('hidden');
}

function setPaused(on) {
  if (on === paused || mode === 'port' || picking) return; // в порту и так меню
  paused = on;
  $('scPause').classList.toggle('hidden', !on);
  const active = mode === 'sea' || mode === 'land';
  controls.setEnabled(!on && active);
  setMusic(!on);
  if (on) renderPause();
  else last = performance.now();
}

$('goBtn').addEventListener('click', leavePort);
$('cardsSkip').addEventListener('click', closeCards);
$('legendBtn').addEventListener('click', openLegend);
$('tavernBtn').addEventListener('click', openTavern);
$('yardBtn').addEventListener('click', openYard);
$('albumBtn').addEventListener('click', openAlbum);
$('albumBtn2').addEventListener('click', openAlbum);
$('albumClose').addEventListener('click', () => $('scAlbum').classList.add('hidden'));
$('yardClose').addEventListener('click', () => $('scYard').classList.add('hidden'));
$('tavernClose').addEventListener('click', () => $('scTavern').classList.add('hidden'));
$('legendGo').addEventListener('click', () => {
  $('scLegend').classList.add('hidden');
  save.story.legend = true;
  storeSave(save);
});
// «Начать заново»: сначала спрашиваем — вдруг нажали случайно
const askRestart = () => $('scRestart').classList.remove('hidden');
$('portRestart').addEventListener('click', askRestart);
$('restartBtn').addEventListener('click', askRestart);
$('restartNo').addEventListener('click', () => $('scRestart').classList.add('hidden'));
$('restartYes').addEventListener('click', () => {
  storeSave(resetSave(save));
  location.reload(); // новый мир строится при запуске
});
$('muteBtn').addEventListener('click', toggleMute);
$('portPassBtn').addEventListener('click', openPassport);
$('passBtn').addEventListener('click', openPassport);
$('passClose').addEventListener('click', () => $('scPassport').classList.add('hidden'));
$('spyBtn').addEventListener('click', () => (mode === 'sea' || mode === 'land') && setSpy(!spy));
$('factCard').addEventListener('click', () => {
  const card = $('factCard');
  if (card.classList.contains('collapsed')) {
    card.classList.remove('collapsed'); // первое касание — показать факт
    hideFactLater(12);
  } else {
    card.classList.add('hidden');
  }
});
$('pauseBtn').addEventListener('click', () => setPaused(true));
$('resumeBtn').addEventListener('click', () => setPaused(false));
$('pauseMute').addEventListener('click', toggleMute);
$('gfxBtn').addEventListener('click', toggleGraphics);
$('homeBtn').addEventListener('click', () => {
  setPaused(false);
  goHome();
});
actBtn.addEventListener('click', doAction);
jumpBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault(); // прыжок сразу по касанию, без задержки «клика»
  doJump();
});
boardBtn.addEventListener('click', goAboard);

// звук можно включить только по жесту пользователя
window.addEventListener('pointerdown', () => {
  unlockAudio();
}, { capture: true });
window.addEventListener('keydown', (e) => {
  unlockAudio();
  if (picking) {
    const i = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
    if (i >= 0 && pickChoices[i]) pickCard(pickChoices[i]);
    if (e.code === 'Escape' && picking === 'merchant') closeCards();
    return;
  }
  if (e.code === 'Escape' || e.code === 'KeyP') setPaused(!paused);
  if (e.code === 'KeyM') toggleMute();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) setPaused(true);
});

/* ---------- размер ---------- */
function resize() {
  viewW = wrap.clientWidth;
  viewH = wrap.clientHeight;
  renderer.setSize(viewW, viewH);
  camera.aspect = viewW / viewH;
  portrait = viewH > viewW;
  camera.fov = spy ? 16 : portrait ? 68 : 55;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

/* ---------- цикл ---------- */
let last = performance.now();
const MUSIC_FOR = { port: 'port', sea: 'sea', land: 'land', dive: 'night' };
let battleMusic = false;
// Мелодия по месту; рядом враги — боевая, вокруг призрак — ночная.
function musicNow() {
  if (mode === 'sea') {
    let near = Infinity;
    for (const it of world.items) {
      if (it.kind === 'enemy' && !it.dead && !it.sinking) near = Math.min(near, dist(it.g.position.x, it.g.position.z, boat.x, boat.z));
    }
    battleMusic = near < (battleMusic ? 110 : 70);
    if (battleMusic) return 'boss';
    if (events.kind === 'ghost') return 'night';
  }
  if ((mode === 'sea' || mode === 'land') && sky.night > 0.65) return 'night'; // ночью — тихая мелодия
  return MUSIC_FOR[mode] ?? 'none';
}
let devFreeze = false; // только для отладки: кадр с осмотра модели не перерисовывается

function frame(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05);
  last = now;
  if (paused || picking || devFreeze) return;
  t += dt;
  voxTime.value = t;

  const mv = controls.move();
  if (mode === 'sea') updateSea(dt, mv);
  else if (mode === 'land') updateLand(dt, mv);
  else if (mode === 'dive') updateDive(dt, mv);
  else if (mode === 'port') updatePort(dt);
  else updateWreck(dt);
  syncLandUi();
  setTrack(musicNow());

  if (inv > 0) {
    inv -= dt;
    ship.group.visible = inv <= 0 || Math.floor(inv * 14) % 2 === 0;
  }
  ship.group.position.x = boat.x;
  ship.group.position.z = boat.z;
  ship.group.rotation.y = boat.heading;
  if (mode !== 'wreck') ship.animate(t, mode === 'sea' ? lean : 0);
  if (mode === 'sea') {
    // в шторм корабль качает сильнее
    ship.group.rotation.x += Math.sin(t * 1.3) * 0.06 * (sky.waves - 1);
    ship.group.rotation.z += Math.sin(t * 0.9) * 0.05 * (sky.waves - 1);
  }

  const onLand = mode === 'land' || mode === 'dive';
  const focusX = onLand ? cap.x : boat.x;
  const focusZ = onLand ? cap.z : boat.z;
  water.update(t, focusX - Math.sin(camYaw) * 40, focusZ - Math.cos(camYaw) * 40, sky.waves);
  if (spy && mode !== 'sea' && mode !== 'land') setSpy(false);
  terrain.updateVisibility(focusX, focusZ, spy ? 1200 : undefined);
  if (spy) updateSpy(dt, focusX, focusZ);

  world.update(dt, t, {
    x: boat.x,
    z: boat.z,
    fx: focusX,
    fz: focusZ,
    hostile: mode === 'sea',
    onEnemyFire: enemyFires,
    magnet: onLand
      ? { x: cap.x, z: cap.z, r: effect.magnet[save.up.magnet] * 0.5 + 8 * cards.count('magnet') + pet.landMagnet, coins: true }
      : { x: boat.x, z: boat.z, r: effect.magnet[save.up.magnet] + 4 + 14 * cards.count('magnet'), chests: true },
  });
  battle.update(dt, t, battleHooks);
  crew.update(dt, sailorLanded);
  balbes.update(dt, t);
  fairy.update(dt, t);
  gunner.update(dt, t);
  roles.update(dt, t);
  pet.update(dt, t);
  animals.update(dt, t, { mode, cap, fx: focusX, fz: focusZ });
  updateActors(dt, focusX, focusZ);
  ocean.update(dt, t, {
    x: boat.x, z: boat.z, heading: boat.heading, speed: boat.speed, mode,
    fx: focusX, fz: focusZ, groundAt: terrain.groundAt,
  });
  nature.update(dt, t, { x: cap.x, y: cap.y, z: cap.z, active: mode === 'land', groundAt: terrain.groundAt, night: sky.night });
  events.update(dt, t, { x: boat.x, z: boat.z, heading: boat.heading, speed: boat.speed, mode });
  story.update(dt, t, { mode, boat, cap });
  showTrial(mode === 'dive' ? deep.hud() : story.hud({ mode }));
  deep.updateSurface(dt, t, focusX, focusZ);
  fx.update(dt);

  // набрали золота в трюм — новая карта удачи
  if ((mode === 'sea' || mode === 'land') && save.cargo >= cardAt) {
    cardAt += CARD_EVERY + 10 * cards.list.length;
    openCards('reward');
  }

  updateCamera(dt);
  sky.update(dt, t, { fx: focusX, fz: focusZ, mode, spy, fogK: events.fog, stormOk: save.found.length >= 2 });
  if (mode !== 'port' && (frameNo++ & 1) === 0) drawMap();

  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) toast.classList.remove('on');
  }
  if (hintT > 0) {
    hintT -= dt;
    if (hintT <= 0) hint.classList.add('hidden');
  }

  // на суше всё, что между камерой и капитаном, становится прозрачным
  voxCutOn.value = (mode === 'land' || mode === 'dive') && !spy ? 1 : 0;
  voxCutAt.value.set(cap.x, cap.y + 3.2, cap.z);

  renderer.render(scene, camera);
}

applyGraphics();
unloadCargo(false); // игру закрыли посреди заплыва — золото из трюма не пропадает
world.spawnLoot(lootOptions());
quests.ensure();
applyLooks();
show('port');
updateHud();
if (!save.story.legend) openLegend();
setMusic(true);
renderer.setAnimationLoop(frame);

// Только в режиме разработки: заглянуть в состояние игры из консоли браузера.
if (import.meta.env.DEV) {
  window.__korabl = {
    get mode() { return mode; },
    boat, cap, save, terrain, world, balbes, fairy, gunner, roles, pet, animals, deep, sky, story, camera, cards, events, surfaces,
    get picking() { return picking; },
    pick: (i) => pickCard(pickChoices[i]),
    // поставить капитана в точку (проверка паркура)
    drop(x, y, z, vy = 0) {
      if (mode !== 'land') {
        mode = 'land';
        crew.captain.removeFromParent();
        scene.add(crew.captain);
      }
      Object.assign(cap, { x, y, z, vy, air: true });
    },
    hit: () => {
      inv = 0;
      damage();
    },
    event: (kind) => events.start(kind, { x: boat.x, z: boat.z, heading: boat.heading }),
    // осмотреть точку со стороны: камера в from, смотрит в to (для проверки моделей)
    shot(from, to) {
      devFreeze = true; // игра стоит, пока не вызовут step()
      camera.clearViewOffset();
      camera.position.set(...from);
      camera.lookAt(...to);
      sky.place(to[0], to[2]);
      renderer.render(scene, camera);
    },
    // прогнать игру на sec секунд вперёд — работает и в скрытой вкладке, где кадры не идут
    step(sec) {
      devFreeze = false;
      let now = last;
      for (let i = 0; i < sec * 60; i++) frame((now += 1000 / 60));
    },
  };
}
