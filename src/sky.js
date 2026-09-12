import * as THREE from 'three';
import { cube, glow, glows, voxSun, voxSky } from './voxel.js';

// Небо, свет, смена дня и ночи и погода. Всё небесное держится вокруг камеры.
// Ночь не совсем тёмная: светит луна, горят фонари, маяк и звёзды.
const DAY_LEN = 480; // секунд в сутках
const DAY_PART = 0.72; // доля суток, когда солнце над горизонтом
const TAU = Math.PI * 2;
const col = (hex) => new THREE.Color(hex);
// [горизонт, зенит]
const SKY = {
  day: [col(0xc4e4f3), col(0x4f9ee0)],
  dusk: [col(0xf2a86a), col(0x3a5a9a)],
  night: [col(0x22345a), col(0x0a1230)],
  storm: [col(0x8f98a2), col(0x4f5862)],
};
const WEATHER = {
  clear: { overcast: 0, rain: 0, waves: 1, time: [100, 180] },
  cloudy: { overcast: 0.45, rain: 0, waves: 1.1, time: [40, 70] },
  rain: { overcast: 0.75, rain: 1, waves: 1.3, time: [45, 70] },
  storm: { overcast: 1, rain: 1, waves: 1.9, time: [35, 50] },
};
const RAINBOW = [0xe0302a, 0xf08a2a, 0xf4d23a, 0x4fb05a, 0x3a7fd0, 0x8a4fc0];
const smooth = (a, b, x) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const UP = new THREE.Vector3(0, 1, 0);

// hooks: say(msg, sec), sfx (thunder), rain(level), lighthouse {x, y, z}
export function createSky(scene, renderer, camera, hooks) {
  scene.fog = new THREE.Fog(SKY.day[0].getHex(), 60, 170);
  let clock = 0.08; // утро
  let time = 0;
  let weather = 'clear';
  let weatherT = 90 + Math.random() * 60;
  let overcast = 0;
  let rainK = 0;
  let waves = 1;
  let flash = 0;
  let strikeT = 2;
  let boltT = 0;
  let bowT = 0;
  let day = 1;
  let wasNight = false;
  const sunDir = new THREE.Vector3();
  const moonDir = new THREE.Vector3();
  const lightDir = new THREE.Vector3();
  const shadowDir = new THREE.Vector3();
  const horizon = new THREE.Color();
  const zenith = new THREE.Color();
  const tmp = new THREE.Color();

  // купол неба: цвет по высоте — от дымки у горизонта к зениту
  const R = 450;
  const geo = new THREE.SphereGeometry(R, 24, 12);
  const pos = geo.attributes.position;
  const weights = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) weights[i] = Math.pow(Math.min(1, Math.max(0, (pos.getY(i) / R) * 2.2)), 0.6);
  const colors = new Float32Array(pos.count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.renderOrder = -2;
  scene.add(dome);

  // звёзды
  const sp = [];
  for (let i = 0; i < 500; i++) {
    const a = Math.random() * TAU;
    const y = 0.08 + Math.random() * 0.92;
    const r = Math.sqrt(1 - y * y);
    sp.push(Math.cos(a) * r * 400, y * 400, Math.sin(a) * r * 400);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat);
  stars.renderOrder = -1;
  scene.add(stars);

  // свет: небо сверху, отражённый снизу, солнце (ночью — луна) с тенями.
  // С three r155 интенсивность без встроенного множителя π — домножаем сами.
  const hemi = new THREE.HemisphereLight(0xd6ecff, 0x7d6e52, 0.46 * Math.PI);
  const ambient = new THREE.AmbientLight(0xffffff, 0.1 * Math.PI);
  const sun = new THREE.DirectionalLight(0xffe9c8, 0.92 * Math.PI);
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 400 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.06;
  scene.add(hemi, ambient, sun, sun.target);
  const SUN_COL = col(0xffe9c8);
  const DUSK_COL = col(0xffa860);
  const MOON_COL = col(0x9fb4ff);
  const HEMI_DAY = col(0xd6ecff);
  const HEMI_NIGHT = col(0x6a80b8);

  // квадратное солнце и луна с кратерами
  const sunCube = cube(scene, new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false }), 12, 12, 12);
  const sunGlow = glow(sunCube, 0xfff0c0, 5, 0, 0, 0, 0.6, false);
  sunGlow.userData.sky = true;
  const moon = new THREE.Group();
  cube(moon, new THREE.MeshBasicMaterial({ color: 0xe8eef8, fog: false }), 9, 9, 9);
  const crater = new THREE.MeshBasicMaterial({ color: 0xb8c2d2, fog: false });
  for (const [x, y] of [[-2, 1.5], [1.8, -1], [0.5, 2.6], [-1, -2.4]]) cube(moon, crater, 2, 2, 9.3, x, y, 0);
  glow(moon, 0xc8d8ff, 30, 0, 0, 0, 0.5, false).userData.sky = true;
  scene.add(moon);

  // облака — с тенью снизу; ночью темнеют, в непогоду сереют
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: 0.92 });
  const cloudUnder = new THREE.MeshLambertMaterial({ color: 0xd9e3ec, fog: false, transparent: true, opacity: 0.92 });
  const CLOUD_DAY = col(0xffffff);
  const CLOUD_NIGHT = col(0x3a4660);
  const CLOUD_STORM = col(0x8c949c);
  const clouds = [];
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group();
    const n = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const w = 8 + Math.random() * 8;
      const d = 6 + Math.random() * 5;
      const y = Math.random() * 2;
      const z = Math.random() * 4;
      cube(g, cloudMat, w, 2.2, d, k * 7, y, z).castShadow = false;
      cube(g, cloudUnder, w * 0.92, 1, d * 0.92, k * 7, y - 1.5, z).castShadow = false;
    }
    g.userData.off = new THREE.Vector3(Math.random() * 320, 32 + Math.random() * 16, Math.random() * 320);
    scene.add(g);
    clouds.push(g);
  }

  // луч маяка — ночью ходит по кругу
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const beam = new THREE.Group();
  if (hooks.lighthouse) {
    beam.position.set(hooks.lighthouse.x, hooks.lighthouse.y, hooks.lighthouse.z);
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(unitBox, beamMat);
      m.scale.set(46, 1.6, 1.6);
      m.position.x = s * 23.5;
      m.rotation.z = s * 0.03;
      beam.add(m);
    }
    scene.add(beam);
  }

  // дождь — тонкие косые капли вокруг игрока
  const RAIN = 600;
  const rainGeo = new THREE.BoxGeometry(0.07, 1.6, 0.07);
  rainGeo.rotateZ(0.12);
  const rain = new THREE.InstancedMesh(rainGeo, new THREE.MeshBasicMaterial({ color: 0xc0d0e0, transparent: true, opacity: 0.5, depthWrite: false }), RAIN);
  rain.frustumCulled = false;
  rain.count = 0;
  scene.add(rain);
  const drops = new Float32Array(RAIN * 3);
  for (let i = 0; i < RAIN; i++) {
    drops[i * 3] = (Math.random() - 0.5) * 70;
    drops[i * 3 + 1] = Math.random() * 40;
    drops[i * 3 + 2] = (Math.random() - 0.5) * 70;
  }
  const m4 = new THREE.Matrix4();

  // молния — ломаная из белых брусков
  const boltMat = new THREE.MeshBasicMaterial({ color: 0xf4f8ff, fog: false });
  const bolt = new THREE.Group();
  const boltSegs = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(unitBox, boltMat);
    bolt.add(m);
    boltSegs.push(m);
  }
  bolt.visible = false;
  scene.add(bolt);
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const dir = new THREE.Vector3();
  function strike(fx, fz) {
    const a = Math.random() * TAU;
    const d = 70 + Math.random() * 70;
    pA.set(fx + Math.cos(a) * d, 70, fz + Math.sin(a) * d);
    for (const m of boltSegs) {
      pB.copy(pA).add(dir.set((Math.random() - 0.5) * 8, -9.5, (Math.random() - 0.5) * 8));
      dir.subVectors(pB, pA);
      const len = dir.length();
      m.position.addVectors(pA, pB).multiplyScalar(0.5);
      m.scale.set(0.6, len, 0.6);
      m.quaternion.setFromUnitVectors(UP, dir.normalize());
      pA.copy(pB);
    }
    bolt.visible = true;
    boltT = 0.25;
    flash = 1;
    setTimeout(() => hooks.sfx.thunder(), 300 + Math.random() * 900);
  }

  // радуга после дождя — встаёт над горизонтом напротив солнца
  const bowMats = RAINBOW.map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  const bow = new THREE.Group();
  RAINBOW.forEach((_, band) => {
    const r = 110 - band * 3;
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI;
      const m = new THREE.Mesh(unitBox, bowMats[band]);
      m.scale.set((Math.PI * r) / 40 + 0.5, 3, 1);
      m.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      m.rotation.z = a + Math.PI / 2;
      bow.add(m);
    }
  });
  bow.visible = false;
  scene.add(bow);
  function startRainbow(fx, fz) {
    const dx = -sunDir.x;
    const dz = -sunDir.z;
    const l = Math.hypot(dx, dz) || 1;
    bow.position.set(fx + (dx / l) * 170, -8, fz + (dz / l) * 170);
    bow.rotation.y = Math.atan2(dx, dz);
    bow.visible = true;
    bowT = 40;
  }

  function nextWeather(s) {
    const prev = weather;
    if (weather === 'clear') weather = Math.random() < 0.6 ? 'cloudy' : 'clear';
    else if (weather === 'cloudy') {
      const r = Math.random();
      weather = r < 0.5 ? 'rain' : r < 0.72 && s.stormOk ? 'storm' : 'clear';
    } else if (weather === 'storm') weather = 'rain';
    else weather = 'clear';
    const [a, b] = WEATHER[weather].time;
    weatherT = a + Math.random() * (b - a);
    if (weather === 'rain' && prev === 'cloudy') hooks.say('Пошёл дождь 🌧');
    if (weather === 'storm') hooks.say('Гроза! ⛈ Держись крепче!', 3);
    if (weather === 'clear' && prev === 'rain' && day > 0.6) {
      startRainbow(s.fx, s.fz);
      hooks.say('После дождя — радуга! 🌈', 3);
    }
  }

  // Небо, солнце, облака и тени — на свои места вокруг камеры.
  function place(fx, fz) {
    const cp = camera.position;
    dome.position.copy(cp);
    stars.position.copy(cp);
    const rel = (v) => ((v % 320) + 320) % 320 - 160;
    for (const c of clouds) {
      const o = c.userData.off;
      c.position.set(cp.x + rel(o.x + time * 1.6 - cp.x), o.y, cp.z + rel(o.z - cp.z));
    }
    sunCube.position.copy(cp).addScaledVector(sunDir, 300);
    moon.position.copy(cp).addScaledVector(moonDir, 300);
    moon.lookAt(cp);
    // тени считаются в квадрате вокруг игрока; шаг сетки — чтобы тени не дрожали
    const sx = Math.round(fx / 4) * 4;
    const sz = Math.round(fz / 4) * 4;
    sun.target.position.set(sx, 0, sz);
    sun.position.set(sx + shadowDir.x * 150, shadowDir.y * 150, sz + shadowDir.z * 150);
  }

  // s: { fx, fz, mode, spy, fogK, stormOk }
  function update(dt, t, s) {
    time = t;
    clock = (clock + dt / DAY_LEN) % 1;
    if (s.mode === 'sea' || s.mode === 'land') {
      weatherT -= dt;
      if (weatherT <= 0) nextWeather(s);
    }
    const W = WEATHER[weather];
    const k = Math.min(1, dt * 0.25);
    overcast += (W.overcast - overcast) * k;
    rainK += (W.rain - rainK) * k;
    waves += (W.waves - waves) * k;

    // солнце идёт с востока на запад; ночью над горизонтом — луна
    const sunA = clock < DAY_PART ? (clock / DAY_PART) * Math.PI : Math.PI + ((clock - DAY_PART) / (1 - DAY_PART)) * Math.PI;
    sunDir.set(Math.cos(sunA), Math.sin(sunA), 0.45).normalize();
    moonDir.copy(sunDir).negate();
    day = smooth(-0.1, 0.18, sunDir.y);
    const night = 1 - day;
    const dusk = Math.max(0, 1 - Math.abs(sunDir.y) / 0.3);
    const useMoon = sunDir.y < 0;
    lightDir.copy(useMoon ? moonDir : sunDir);
    shadowDir.set(lightDir.x, Math.max(lightDir.y, 0.3), lightDir.z).normalize();

    // цвета неба: день ↔ ночь, закат, серая непогода, вспышка молнии
    const bright = 0.35 + 0.65 * day;
    horizon.copy(SKY.night[0]).lerp(SKY.day[0], day).lerp(SKY.dusk[0], dusk * 0.8);
    zenith.copy(SKY.night[1]).lerp(SKY.day[1], day).lerp(SKY.dusk[1], dusk * 0.5);
    horizon.lerp(tmp.copy(SKY.storm[0]).multiplyScalar(bright), overcast * 0.85);
    zenith.lerp(tmp.copy(SKY.storm[1]).multiplyScalar(bright), overcast * 0.85);
    if (flash > 0) {
      horizon.lerp(tmp.setRGB(1, 1, 1), flash * 0.6);
      zenith.lerp(tmp.setRGB(0.9, 0.92, 1), flash * 0.5);
    }
    for (let i = 0; i < pos.count; i++) {
      tmp.copy(horizon).lerp(zenith, weights[i]);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.attributes.color.needsUpdate = true;
    scene.fog.color.copy(horizon);
    renderer.setClearColor(horizon);
    voxSky.value.copy(horizon);
    voxSun.value.copy(lightDir);

    // свет
    const sunI = smooth(-0.02, 0.2, sunDir.y) * 0.92 * (1 - 0.6 * overcast);
    const moonI = smooth(-0.02, 0.2, moonDir.y) * 0.25 * (1 - 0.7 * overcast);
    sun.intensity = (useMoon ? moonI : sunI) * Math.PI;
    sun.color.copy(useMoon ? MOON_COL : tmp.copy(SUN_COL).lerp(DUSK_COL, dusk));
    hemi.intensity = Math.PI * ((0.26 + 0.2 * day) * (1 - 0.15 * overcast) + flash * 2.5); // ночью не слишком темно
    hemi.color.copy(HEMI_NIGHT).lerp(HEMI_DAY, day);
    ambient.intensity = Math.PI * (0.08 + 0.02 * day + flash);

    // солнце, луна, звёзды, облака
    sunCube.visible = sunDir.y > -0.1;
    sunGlow.material.opacity = 0.6 * (1 - overcast) * smooth(-0.05, 0.1, sunDir.y);
    moon.visible = moonDir.y > -0.1;
    starMat.opacity = night * (1 - overcast) * 0.9;
    tmp.copy(CLOUD_DAY).lerp(CLOUD_NIGHT, night).lerp(CLOUD_STORM.clone().multiplyScalar(bright), overcast * 0.7);
    cloudMat.color.copy(tmp);
    cloudUnder.color.copy(tmp).multiplyScalar(0.85);

    // ночью фонари, маяк и огни корабля светят ярче
    for (const g of glows) if (!g.userData.sky) g.material.opacity = Math.min(1, g.userData.strength * (0.7 + 1.9 * night));
    beam.rotation.y = t * 0.9;
    beamMat.opacity = night * 0.35;

    // туман: ночью и в дождь видно ближе; подзорная труба разгоняет дымку
    if (s.spy) {
      scene.fog.near = 300;
      scene.fog.far = 1100;
    } else {
      scene.fog.near = Math.max(12, 60 - 15 * rainK - 5 * night - 42 * (s.fogK || 0));
      scene.fog.far = Math.max(60, 170 - 45 * rainK - 15 * night - 100 * (s.fogK || 0));
    }

    // дождь
    rain.count = Math.floor(RAIN * rainK);
    const cx = (camera.position.x + s.fx) / 2;
    const cz = (camera.position.z + s.fz) / 2;
    for (let i = 0; i < rain.count; i++) {
      let y = drops[i * 3 + 1] - 48 * dt;
      if (y < 0) y += 40;
      drops[i * 3 + 1] = y;
      rain.setMatrixAt(i, m4.makeTranslation(cx + drops[i * 3], -2 + y, cz + drops[i * 3 + 2]));
    }
    if (rain.count) rain.instanceMatrix.needsUpdate = true;
    hooks.rain(rainK * (s.mode === 'port' ? 0.5 : 1));

    // гроза: молнии и гром
    if (weather === 'storm' && (s.mode === 'sea' || s.mode === 'land') && (strikeT -= dt) <= 0) {
      strikeT = 3 + Math.random() * 5;
      strike(s.fx, s.fz);
    }
    flash = Math.max(0, flash - dt * 4);
    if (boltT > 0 && (boltT -= dt) <= 0) bolt.visible = false;

    // радуга
    if (bowT > 0) {
      bowT -= dt;
      const a = Math.min(1, (40 - bowT) / 3, bowT / 5) * 0.55;
      for (const m of bowMats) m.opacity = a;
      if (bowT <= 0) bow.visible = false;
    }

    // ночь наступила / утро
    const active = s.mode === 'sea' || s.mode === 'land';
    if (!wasNight && night > 0.6) {
      wasNight = true;
      if (active) hooks.say('Наступила ночь — зажглись фонари 🌙', 3);
    } else if (wasNight && night < 0.3) {
      wasNight = false;
      if (active) hooks.say('Доброе утро! ☀️', 2);
    }

    // под водой: бирюзовая глубина, неба не видно
    const under = s.mode === 'dive';
    dome.visible = stars.visible = !under;
    for (const c of clouds) c.visible = !under;
    if (under) {
      horizon.set(0x1c6a86);
      scene.fog.color.copy(horizon);
      scene.fog.near = 6;
      scene.fog.far = 70;
      renderer.setClearColor(horizon);
      voxSky.value.copy(horizon);
      sunCube.visible = moon.visible = false;
      rain.count = 0;
      hooks.rain(0);
      hemi.color.set(0x8ad0e8);
    }

    place(s.fx, s.fz);
  }

  // цвета неба и свет — сразу, ещё до первого кадра
  update(0, 0, { fx: 0, fz: 0, mode: 'port' });

  return {
    sun,
    update,
    place,
    get night() {
      return 1 - day;
    },
    get waves() {
      return waves;
    },
    get weather() {
      return weather;
    },
    // только для отладки
    setTime(v) {
      clock = ((v % 1) + 1) % 1;
    },
    setWeather(kind) {
      weather = kind;
      weatherT = WEATHER[kind].time[0];
      if (kind === 'storm') strikeT = 0.5;
    },
  };
}
