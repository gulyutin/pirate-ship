// Все звуки синтезируются на лету через WebAudio — никаких аудиофайлов.
// Браузер разрешает звук только после первого касания, поэтому контекст
// создаётся в unlockAudio(), который вешается на первый жест.

let ctx = null;
let master = null;
let sfxBus = null;
let musicBus = null;
let noiseBuf = null;
let muted = false;
let musicOn = false;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.5;
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.1;
    musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    setInterval(scheduleMusic, 50);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = value ? 0 : 1;
}

function tone(freq, dur, { type = 'square', vol = 0.3, to = 0, delay = 0, at = 0, bus = sfxBus } = {}) {
  if (!ctx || muted) return;
  const t0 = at || ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(bus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, { vol = 0.4, freq = 1000, to = 0, delay = 0, at = 0, bus = sfxBus } = {}) {
  if (!ctx || muted) return;
  const t0 = at || ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq, t0);
  if (to) filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(g).connect(bus);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

const arp = (notes, step, opts) => notes.forEach((f, i) => tone(f, step * 1.6, { ...opts, delay: i * step }));

export const sfx = {
  coin: () => arp([988, 1319], 0.07, { vol: 0.2 }),
  chest: () => arp([659, 784, 988, 1319], 0.07, { vol: 0.2 }),
  buy: () => arp([392, 523, 659, 784, 1047], 0.06, { vol: 0.2 }),
  rescue: () => arp([523, 659, 784], 0.09, { vol: 0.22 }),
  nope: () => arp([196, 147], 0.1, { vol: 0.25 }),
  cannon() {
    noise(0.35, { vol: 0.6, freq: 1200, to: 200 });
    tone(120, 0.3, { type: 'sine', vol: 0.6, to: 40 });
  },
  boom() {
    noise(0.3, { vol: 0.5, freq: 900, to: 150 });
    tone(90, 0.25, { type: 'triangle', vol: 0.4, to: 40 });
  },
  crash() {
    noise(0.45, { vol: 0.7, freq: 600, to: 100 });
    tone(80, 0.4, { type: 'triangle', vol: 0.6, to: 30 });
  },
  shield() {
    tone(660, 0.25, { type: 'triangle', vol: 0.35, to: 440 });
    tone(990, 0.2, { type: 'triangle', vol: 0.2, delay: 0.03 });
  },
  splash: (delay = 0) => noise(0.5, { vol: 0.35, freq: 3000, to: 300, delay }),
  sink() {
    noise(0.8, { vol: 0.4, freq: 800, to: 120 });
    tone(300, 0.8, { type: 'sawtooth', vol: 0.12, to: 60 });
  },
  enemyFire: () => noise(0.3, { vol: 0.25, freq: 700, to: 150 }),
  horn() {
    tone(196, 0.6, { type: 'sawtooth', vol: 0.15 });
    tone(247, 0.6, { type: 'sawtooth', vol: 0.1 });
  },
  bump() {
    tone(110, 0.2, { type: 'triangle', vol: 0.5, to: 60 });
    noise(0.15, { vol: 0.3, freq: 500 });
  },
  dig: () => noise(0.12, { vol: 0.3, freq: 1500, to: 400 }),
  jump: () => tone(300, 0.15, { type: 'square', vol: 0.18, to: 600 }),
  // «свисток-горка» — кто-то стал балбесом
  goof() {
    tone(900, 0.45, { type: 'sine', vol: 0.3, to: 300 });
    tone(300, 0.4, { type: 'sine', vol: 0.3, to: 1000, delay: 0.45 });
  },
  whistle: () => tone(1400, 0.35, { type: 'sine', vol: 0.25, to: 1900 }),
  medal: () => arp([523, 659, 784, 1047, 1319], 0.08, { vol: 0.22, type: 'triangle' }),
  squeak() {
    tone(1800, 0.12, { type: 'sine', vol: 0.15, to: 2600 });
    tone(2400, 0.1, { type: 'sine', vol: 0.12, to: 1600, delay: 0.12 });
  },
  whale() {
    tone(90, 1.6, { type: 'sine', vol: 0.35, to: 140 });
    tone(140, 1.2, { type: 'sine', vol: 0.2, to: 70, delay: 1.2 });
  },
  gull() {
    tone(1300, 0.18, { type: 'sawtooth', vol: 0.05, to: 900 });
    tone(1250, 0.2, { type: 'sawtooth', vol: 0.05, to: 850, delay: 0.25 });
  },
  step: () => tone(330, 0.08, { type: 'triangle', vol: 0.25, to: 440 }),
  thunder() {
    noise(2.2, { vol: 0.7, freq: 500, to: 60 });
    tone(55, 1.8, { type: 'sine', vol: 0.5, to: 30 });
    noise(1.2, { vol: 0.4, freq: 900, to: 100, delay: 0.25 });
  },
  magic: () => arp([1319, 1568, 1976, 2637, 1976, 2637], 0.06, { vol: 0.14, type: 'triangle' }),
  // колокол: основной тон и неровные обертоны, долгое затухание
  bell(f, delay = 0, vol = 0.2) {
    tone(f, 2.4, { type: 'sine', vol, delay });
    tone(f * 2.76, 1.2, { type: 'sine', vol: vol * 0.3, delay });
    tone(f * 5.4, 0.5, { type: 'sine', vol: vol * 0.15, delay });
  },
  note: (f, dur, delay = 0, vol = 0.16) => tone(f, dur, { type: 'triangle', vol, delay }),
  // колокольчик курантов: звонкий, но короче большого колокола — мелодия не сливается
  chime(f, delay = 0, vol = 0.18) {
    tone(f, 1.1, { type: 'sine', vol, delay });
    tone(f * 2, 0.7, { type: 'sine', vol: vol * 0.3, delay });
    tone(f * 2.76, 0.4, { type: 'sine', vol: vol * 0.2, delay });
  },
  screech: (delay = 0) => tone(1900, 0.5, { type: 'sawtooth', vol: 0.06, to: 900, delay }),
  bikebell: (delay = 0) => { tone(2200, 0.25, { type: 'sine', vol: 0.12, delay }); tone(2200, 0.25, { type: 'sine', vol: 0.12, delay: delay + 0.15 }); },
  thud: (delay = 0) => { tone(80, 0.3, { type: 'sine', vol: 0.45, to: 40, delay }); noise(0.2, { vol: 0.2, freq: 600, to: 150, delay }); },
  gong(delay = 0) {
    tone(98, 3.5, { type: 'sine', vol: 0.35, delay });
    tone(147, 2.5, { type: 'sine', vol: 0.12, delay });
    noise(1.2, { vol: 0.12, freq: 600, to: 200, delay });
  },
  drum(delay = 0, v = 1) {
    tone(90, 0.25, { type: 'sine', vol: 0.4 * v, to: 50, delay });
    noise(0.1, { vol: 0.2 * v, freq: 900, to: 200, delay });
  },
  clap: (delay = 0) => noise(0.08, { vol: 0.45, freq: 3500, to: 1500, delay }),
  chirp: (delay = 0, v = 1) => tone(2400, 0.22, { type: 'sine', vol: 0.18 * v, to: 900, delay }),
  pop: (delay = 0) => noise(0.35, { vol: 0.3, freq: 2500, to: 300, delay }),
  whoosh: (delay = 0) => noise(0.6, { vol: 0.12, freq: 800, to: 4000, delay }),
  cheer: () => noise(2.2, { vol: 0.22, freq: 2200, to: 900 }),
  rumble: () => noise(3, { vol: 0.45, freq: 220, to: 50 }),
  foghorn() {
    tone(110, 2.2, { type: 'sawtooth', vol: 0.12 });
    tone(112, 2.2, { type: 'sawtooth', vol: 0.08 });
  },
  discover: () => arp([523, 659, 784, 1047, 784, 1047], 0.09, { vol: 0.22 }),
  dance: () => arp([659, 784, 880, 784, 659, 523, 659, 784], 0.1, { vol: 0.18 }),
  launch() {
    noise(2.5, { vol: 0.5, freq: 400, to: 2000 });
    tone(60, 2.5, { type: 'sawtooth', vol: 0.15, to: 200 });
  },
};

// Пока у чуда звучит его мелодия, фоновая музыка молчит, потом плавно возвращается.
let duckUntil = 0;
export function duckMusic(sec) {
  if (!ctx) return;
  const now = ctx.currentTime;
  duckUntil = Math.max(duckUntil, now + sec);
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setTargetAtTime(0.0001, now, 0.15);
  musicBus.gain.setTargetAtTime(0.1, duckUntil, 0.6);
}

// Шум дождя: бесконечная петля шума, громкость — сила дождя (0..1).
let rainGain = null;
export function setRain(level) {
  if (!ctx) return;
  if (!rainGain) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 0.6;
    rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    src.connect(filter).connect(rainGain).connect(master);
    src.start();
  }
  rainGain.gain.value = level * 0.12;
}

/* ---------- музыка: свои мелодии под разные места ---------- */
// Ноты записаны строкой «нота:доли», R — пауза. Мелодия и бас одной длины.
const SEMI = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
function freq(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  const semi = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (semi / 12);
}
const seq = (str) =>
  str.trim().split(/\s+/).map((tok) => {
    const [n, b] = tok.split(':');
    return [n === 'R' ? 0 : freq(n), Number(b)];
  });
const rep = (str, n) => Array(n).fill(str).join(' ');
const DRUMS = 'K:1 H:.5 H:.5 K:1 H:1'; // бочка и тарелочка, такт на 4 доли

const TRACKS = {
  // порт: спокойно, треугольная волна
  port: {
    bpm: 84, lead: 'triangle', leadVol: 0.4, drums: false,
    melody: 'G4:1 B4:1 D5:2 C5:1 B4:1 A4:2 G4:1 A4:1 B4:1 D5:1 A4:4 G4:1 B4:1 D5:2 E5:1 D5:1 B4:2 C5:1 B4:1 A4:1 F#4:1 G4:4',
    bass: 'G2:4 D3:4 C3:4 D3:4 G2:4 E3:4 C3:2 D3:2 G2:4',
  },
  // море: «Попутный ветер»
  breeze: {
    bpm: 120, lead: 'square', leadVol: 0.3, drums: true,
    melody: 'D5:1 A4:.5 B4:.5 A4:1 F#4:1 G4:1 A4:.5 B4:.5 A4:2 D5:1 E5:.5 F#5:.5 E5:1 D5:1 B4:1 A4:1 D4:2 '
      + 'F#4:1 A4:1 D5:1 F#5:1 E5:1 D5:.5 C#5:.5 B4:2 G4:1 B4:1 E5:1 D5:1 C#5:1 A4:1 D5:2',
    bass: 'D3:2 A2:2 G2:2 A2:2 D3:2 G2:2 G2:2 D3:2 D3:2 F#2:2 G2:2 E2:2 G2:2 A2:2 A2:2 D3:2',
  },
  // море: «Пьяный матрос» — народная матросская песня
  shanty: {
    bpm: 190, lead: 'square', leadVol: 0.32, drums: true,
    melody: 'A4:1 A4:.5 A4:.5 A4:1 A4:.5 A4:.5 A4:1 D4:1 F4:1 A4:1 G4:1 G4:.5 G4:.5 G4:1 G4:.5 G4:.5 G4:1 C4:1 E4:1 G4:1 '
      + 'A4:1 A4:.5 A4:.5 A4:1 A4:.5 A4:.5 A4:1 B4:1 C5:1 D5:1 C5:1 A4:1 G4:1 E4:1 D4:2 D4:2',
    bass: 'D3:2 A2:2 D3:2 A2:2 C3:2 G2:2 C3:2 G2:2 D3:2 A2:2 D3:2 A2:2 C3:2 G2:2 D3:2 A2:2',
  },
  // море: «Волны» — пиратская, в миноре
  waves: {
    bpm: 132, lead: 'square', leadVol: 0.28, drums: true,
    melody: 'A4:.5 C5:.5 E5:1 D5:.5 C5:.5 B4:1 G4:.5 B4:.5 D5:1 C5:.5 B4:.5 A4:1 A4:.5 C5:.5 E5:1 G5:1 F5:.5 E5:.5 D5:1 E5:1 C5:1 A4:1 '
      + 'F4:.5 A4:.5 C5:1 B4:.5 A4:.5 G4:1 E4:.5 G4:.5 B4:1 A4:.5 G4:.5 E4:1 A4:1 C5:1 B4:1 G#4:1 A4:4',
    bass: rep('A2:1 A2:1 E3:1 A2:1 G2:1 G2:1 D3:1 G2:1 F2:1 F2:1 C3:1 F2:1 E2:1 E2:1 B2:1 E2:1', 2),
  },
  // остров: весёлая, прыгучая
  land: {
    bpm: 128, lead: 'square', leadVol: 0.26, drums: true,
    melody: 'C5:.5 E5:.5 G5:.5 E5:.5 F5:.5 A5:.5 G5:1 E5:.5 D5:.5 C5:.5 D5:.5 E5:1 C5:1 D5:.5 E5:.5 F5:.5 D5:.5 G5:1 E5:.5 C5:.5 D5:1 G4:1 C5:2',
    bass: 'C3:1 G2:1 C3:1 G2:1 F2:1 C3:1 F2:1 C3:1 A2:1 E2:1 F2:1 G2:1 C3:1 G2:1 C3:2',
  },
  // ночь: тихая, медленная
  night: {
    bpm: 72, lead: 'triangle', leadVol: 0.4, drums: false,
    melody: 'A4:2 C5:1 B4:1 A4:2 E4:2 F4:2 A4:1 G4:1 E4:4',
    bass: 'A2:4 E2:4 F2:4 E2:4',
  },
  // бой и шторм: быстрая, тревожная
  boss: {
    bpm: 150, lead: 'sawtooth', leadVol: 0.2, drums: true,
    melody: 'D5:.5 D5:.5 F5:.5 D5:.5 A5:.5 G5:.5 F5:.5 E5:.5 D5:.5 D5:.5 F5:.5 A5:.5 C6:1 A5:1 Bb5:.5 A5:.5 G5:.5 F5:.5 E5:.5 F5:.5 G5:.5 E5:.5 D5:2 R:2',
    bass: `${rep('D2:.5 D3:.5', 8)} ${rep('Bb2:.5 Bb3:.5', 4)} ${rep('A2:.5 A3:.5', 4)}`,
  },
};
/* ---------- национальные мелодии у чудес света (народные и классика, без авторских прав) ---------- */
Object.assign(TRACKS, {
  // Россия: «Коробейники»
  n_russia: {
    bpm: 140, lead: 'square', leadVol: 0.28, drums: true,
    melody: 'E5:1 B4:.5 C5:.5 D5:1 C5:.5 B4:.5 A4:1 A4:.5 C5:.5 E5:1 D5:.5 C5:.5 B4:1.5 C5:.5 D5:1 E5:1 C5:1 A4:1 A4:2 '
      + 'D5:1.5 F5:.5 A5:1 G5:.5 F5:.5 E5:1.5 C5:.5 E5:1 D5:.5 C5:.5 B4:1 B4:.5 C5:.5 D5:1 E5:1 C5:1 A4:1 A4:2',
    bass: 'E2:1 E3:1 E2:1 E3:1 A2:1 A3:1 A2:1 A3:1 G#2:1 G#3:1 G#2:1 G#3:1 A2:1 A3:1 A2:1 A3:1 '
      + 'D3:1 D2:1 D3:1 D2:1 C3:1 C2:1 C3:1 C2:1 G#2:1 G#3:1 G#2:1 G#3:1 A2:1 A3:1 A2:1 A3:1',
  },
  // Франция: канкан
  n_france: {
    bpm: 150, lead: 'square', leadVol: 0.28, drums: true,
    melody: 'C5:1 D5:.5 F5:.5 E5:.5 D5:.5 G5:1 G5:1 G5:.5 A5:.5 E5:.5 F5:.5 D5:1 D5:1 D5:.5 F5:.5 E5:.5 D5:.5 C5:.5 C6:.5 B5:.5 A5:.5 G5:.5 F5:.5 E5:.5 D5:1.5 '
      + 'C5:1 D5:.5 F5:.5 E5:.5 D5:.5 G5:1 G5:1 G5:.5 A5:.5 E5:.5 F5:.5 D5:1 D5:1 D5:.5 F5:.5 E5:.5 D5:.5 C5:.5 G5:.5 D5:.5 E5:.5 C5:3',
    bass: rep('C3:1 G2:1 C3:1 G2:1 G2:1 D3:1 G2:1 D3:1 G2:1 D3:1 G2:1 D3:1 C3:1 G2:1 C3:1 G2:1', 2),
  },
  // Англия: «Лондонский мост»
  n_uk: {
    bpm: 120, lead: 'square', leadVol: 0.28, drums: true,
    melody: 'G4:1.5 A4:.5 G4:1 F4:1 E4:1 F4:1 G4:2 D4:1 E4:1 F4:2 E4:1 F4:1 G4:2 G4:1.5 A4:.5 G4:1 F4:1 E4:1 F4:1 G4:2 D4:2 G4:2 E4:1 C4:3',
    bass: 'C3:2 G2:2 C3:2 C3:2 G2:2 G2:2 C3:2 C3:2 C3:2 G2:2 C3:2 C3:2 G2:2 G2:2 C3:2 C3:2',
  },
  // Шотландия: «Старая дружба», как на волынке
  n_scotland: {
    bpm: 96, lead: 'sawtooth', leadVol: 0.18, drums: false,
    melody: 'C4:1 F4:1.5 F4:.5 F4:1 A4:1 G4:1.5 F4:.5 G4:1 A4:1 F4:1.5 F4:.5 A4:1 C5:1 D5:3 '
      + 'D5:1 C5:1.5 A4:.5 A4:1 F4:1 G4:1.5 F4:.5 G4:1 A4:1 F4:1.5 D4:.5 D4:1 C4:1 F4:3',
    bass: 'F2:4 F2:4 F2:4 Bb2:4 F2:4 F2:4 F2:4 C3:2 F2:2',
  },
  // США: «Янки-дудл» — дудка и барабан
  n_usa: {
    bpm: 150, lead: 'square', leadVol: 0.28, drums: true,
    melody: 'C5:1 C5:1 D5:1 E5:1 C5:1 E5:1 D5:1 G4:1 C5:1 C5:1 D5:1 E5:1 C5:2 B4:2 C5:1 C5:1 D5:1 E5:1 F5:1 E5:1 D5:1 C5:1 B4:1 G4:1 A4:1 B4:1 C5:2 C5:2',
    bass: 'C3:2 G2:2 C3:2 G2:2 C3:2 G2:2 C3:2 G2:2 C3:2 C3:2 F2:2 F2:2 G2:2 G2:2 C3:2 C3:2',
  },
  // Канада: «О, Канада»
  n_canada: {
    bpm: 100, lead: 'triangle', leadVol: 0.42, drums: false,
    melody: 'E4:2 G4:1.5 G4:.5 C4:3 R:1 D4:1 E4:1 F4:1 G4:1 A4:1 D4:3 E4:2 G4:1.5 G4:.5 C4:3 R:1 D4:1 E4:1 F4:1 G4:1 A4:1 G4:3',
    bass: 'C3:4 C3:4 D3:4 G2:4 C3:4 C3:4 F2:4 G2:4',
  },
  // Мексика: «Кукарача»
  n_mexico: {
    bpm: 160, lead: 'square', leadVol: 0.28, drums: true,
    melody: 'C5:.5 C5:.5 C5:.5 F5:1.5 A5:1 R:1 C5:.5 C5:.5 C5:.5 F5:1.5 A5:1 R:1 F5:1 F5:.5 E5:.5 E5:.5 D5:.5 D5:.5 C5:2.5 '
      + 'C5:.5 C5:.5 C5:.5 E5:1.5 G5:1 R:1 C5:.5 C5:.5 C5:.5 E5:1.5 G5:1 R:1 C6:1 D6:.5 C6:.5 Bb5:.5 A5:.5 G5:.5 F5:2.5',
    bass: `${rep('F2:1 C3:1', 6)} ${rep('C3:1 G2:1', 2)} ${rep('C3:1 G2:1', 6)} ${rep('F2:1 C3:1', 2)}`,
  },
  // Бразилия: самба
  n_samba: {
    bpm: 170, lead: 'square', leadVol: 0.26, drums: true,
    melody: 'G4:.5 A4:.5 C5:.75 A4:.25 C5:.5 D5:.5 E5:1 D5:.5 C5:.5 A4:.5 G4:.5 R:.5 E4:.5 G4:1 A4:.5 C5:.5 D5:.75 C5:.25 D5:.5 E5:.5 G5:1 E5:.5 D5:.5 C5:1 R:2',
    bass: 'C3:.75 G2:.25 C3:1 C3:.75 G2:.25 C3:1 A2:.75 E2:.25 A2:1 A2:.75 E2:.25 A2:1 D3:.75 A2:.25 D3:1 G2:.75 D3:.25 G2:1 C3:.75 G2:.25 C3:1 C3:2',
  },
  // Перу: флейта Анд
  n_andes: {
    bpm: 110, lead: 'sine', leadVol: 0.45, drums: true,
    melody: 'E5:1 G5:.5 A5:.5 B5:1 A5:.5 G5:.5 E5:2 D5:1 E5:1 G5:1 E5:.5 D5:.5 B4:2 E5:4',
    bass: 'E2:2 B2:2 E2:2 B2:2 G2:2 D3:2 E2:4',
  },
  // Остров Пасхи: гавайская гитара
  n_island: {
    bpm: 120, lead: 'triangle', leadVol: 0.4, drums: true,
    melody: 'C5:.5 E5:.5 G5:1 E5:.5 G5:.5 A5:1 G5:.5 E5:.5 C5:1 D5:1 E5:.5 D5:.5 C5:1 A4:1 G4:1 C5:.5 D5:.5 E5:1 C5:3',
    bass: 'C3:2 G2:2 F2:2 C3:2 F2:2 C3:2 G2:2 C3:2',
  },
  // Япония: «Сакура»
  n_japan: {
    bpm: 96, lead: 'triangle', leadVol: 0.45, drums: false,
    melody: 'A4:1 A4:1 B4:2 A4:1 A4:1 B4:2 A4:1 B4:1 C5:1 B4:1 A4:1 B4:.5 A4:.5 F4:2 E4:1 C4:1 E4:1 F4:1 E4:1 E4:.5 C4:.5 B3:2 '
      + 'A4:1 B4:1 C5:1 B4:1 A4:1 B4:.5 A4:.5 F4:2 E4:1 C4:1 E4:1 F4:1 E4:1 E4:.5 C4:.5 B3:2 '
      + 'A4:1 A4:1 B4:2 A4:1 A4:1 B4:2 E4:1 F4:1 B4:.5 A4:.5 F4:1 E4:4',
    bass: 'A2:4 A2:4 A2:4 A2:4 E2:4 E2:4 A2:4 A2:4 E2:4 E2:4 A2:4 A2:4 E2:4 E2:4',
  },
  // Китай: «Жасмин»
  n_china: {
    bpm: 92, lead: 'triangle', leadVol: 0.45, drums: false,
    melody: 'E5:1 E5:.5 G5:.5 A5:.5 C6:.5 C6:.5 A5:.5 G5:1 G5:.5 A5:.5 G5:2 E5:1 E5:.5 G5:.5 A5:.5 C6:.5 C6:.5 A5:.5 G5:1 G5:.5 A5:.5 G5:2 '
      + 'G5:1 G5:1 G5:1 E5:.5 G5:.5 A5:1 A5:1 G5:2 E5:1 D5:.5 E5:.5 G5:1 E5:.5 D5:.5 C5:1 C5:.5 D5:.5 C5:2',
    bass: 'C3:4 C3:2 G2:2 C3:4 C3:2 G2:2 C3:4 F2:2 C3:2 A2:2 G2:2 C3:4',
  },
  // Индия: напев на рагу, как на шехнае
  n_india: {
    bpm: 110, lead: 'sawtooth', leadVol: 0.17, drums: true,
    melody: 'C5:1 Db5:.5 E5:.5 F5:1 E5:.5 Db5:.5 C5:2 G4:1 Ab4:.5 B4:.5 C5:2 Db5:1 E5:1 F5:.5 G5:.5 Ab5:1 G5:.5 F5:.5 E5:1 '
      + 'Db5:1 C5:2 E5:.5 F5:.5 G5:1 F5:.5 E5:.5 Db5:1 C5:1 B4:1 C5:3 R:4',
    bass: 'C3:4 G2:4 C3:4 G2:4 C3:4 G2:4 C3:4 C3:4',
  },
  // Арабский Восток и Египет: лад хиджаз
  n_arab: {
    bpm: 118, lead: 'square', leadVol: 0.24, drums: true,
    melody: 'D5:1 Eb5:.5 F#5:.5 G5:1 F#5:.5 Eb5:.5 D5:2 A4:1 Bb4:.5 C5:.5 D5:1 Eb5:1 F#5:2 Eb5:1 D5:1 G5:1 F#5:.5 G5:.5 '
      + 'A5:1 G5:.5 F#5:.5 Eb5:1 D5:1 C5:.5 Bb4:.5 A4:1 Bb4:.5 A4:.5 G4:1 F#4:1 G4:1 A4:2 D5:4',
    bass: rep('D3:.75 D3:.25 A2:1 D3:1 A2:1', 8),
  },
  // Турция: «Турецкий марш»
  n_turkish: {
    bpm: 120, lead: 'square', leadVol: 0.22, drums: true,
    melody: 'B4:.25 A4:.25 G#4:.25 A4:.25 C5:1 D5:.25 C5:.25 B4:.25 C5:.25 E5:1 F5:.25 E5:.25 D#5:.25 E5:.25 B5:.25 A5:.25 G#5:.25 A5:.25 '
      + 'B5:.25 A5:.25 G#5:.25 A5:.25 C6:1 A5:.5 C6:.5 B5:.5 A5:.5 G5:.5 A5:.5 B5:.5 A5:.5 G5:.5 A5:.5 B5:.5 A5:.5 G5:.5 F#5:.5 E5:1',
    bass: 'A2:1 E3:1 A2:1 E3:1 A2:1 E3:1 A2:1 E3:1 C3:1 G3:1 E2:1 B2:1 A2:1 E3:1 E2:1 B2:1',
  },
  // Италия: тарантелла
  n_italy: {
    bpm: 200, lead: 'square', leadVol: 0.26, drums: true,
    melody: 'E5:1 E5:.5 E5:1 D5:.5 C5:1 B4:.5 A4:1.5 A4:1 C5:.5 E5:1 A5:.5 G#5:1.5 B4:1.5 B4:1 B4:.5 B4:1 C5:.5 D5:1 E5:.5 D5:1 C5:.5 B4:1 C5:.5 D5:1 B4:.5 A4:3',
    bass: 'A2:1.5 E3:1.5 A2:1.5 E3:1.5 A2:1.5 E3:1.5 E2:1.5 B2:1.5 E2:1.5 B2:1.5 E2:1.5 B2:1.5 E2:1.5 B2:1.5 A2:3',
  },
  // Германия: «Ах, мой милый Августин» — вальс
  n_germany: {
    bpm: 150, lead: 'square', leadVol: 0.24, drums: false,
    melody: 'G4:1.5 A4:.5 G4:1 F4:1 E4:1 C4:1 D4:1 G3:1 G3:1 E4:1 C4:1 C4:1 G4:1.5 A4:.5 G4:1 F4:1 E4:1 C4:1 D4:1 G3:1 G3:1 C4:3',
    bass: 'C3:1 G3:1 G3:1 C3:1 G3:1 G3:1 G2:1 F3:1 F3:1 G2:1 F3:1 F3:1 C3:1 G3:1 G3:1 C3:1 G3:1 G3:1 G2:1 F3:1 F3:1 C3:1 E3:1 G3:1',
  },
  // Испания: куплеты Тореадора
  n_spain: {
    bpm: 116, lead: 'square', leadVol: 0.26, drums: true,
    melody: 'C5:1 D5:.75 C5:.25 A4:1 A4:1 A4:.75 G4:.25 A4:.75 Bb4:.25 A4:2 Bb4:1 G4:.75 C5:.25 A4:2 F4:.75 D4:.25 G4:.75 C4:.25 F4:2',
    bass: 'F2:1 C3:1 F2:1 C3:1 F2:1 C3:1 F2:1 C3:1 C3:1 G2:1 C3:1 F2:1 C3:1 G2:1 F2:2',
  },
  // Нидерланды: вальс шарманки
  n_netherlands: {
    bpm: 160, lead: 'square', leadVol: 0.22, drums: false,
    melody: 'D5:1 B4:1 G4:1 A4:1 B4:1 C5:1 D5:2 B4:1 G5:2 F#5:1 E5:1 D5:1 C5:1 B4:1 A4:1 G4:1 D4:1 E4:1 F#4:1 G4:3',
    bass: 'G2:1 D3:1 D3:1 G2:1 D3:1 D3:1 G2:1 D3:1 D3:1 E2:1 B2:1 B2:1 C3:1 G3:1 G3:1 G2:1 D3:1 D3:1 D2:1 A2:1 A2:1 G2:3',
  },
  // Греция: сиртаки
  n_greece: {
    bpm: 150, lead: 'square', leadVol: 0.24, drums: true,
    melody: 'D5:.5 D5:.5 E5:.5 F5:.5 E5:.5 D5:.5 C#5:.5 D5:.5 A4:1 A4:1 F4:.5 G4:.5 A4:.5 Bb4:.5 A4:.5 G4:.5 F4:.5 E4:.5 D4:2 '
      + 'D5:.5 D5:.5 E5:.5 F5:.5 G5:.5 F5:.5 E5:.5 D5:.5 C#5:1 A4:1 Bb4:.5 A4:.5 G4:.5 F4:.5 E4:.5 F4:.5 E4:.5 C#4:.5 D4:2',
    bass: 'D3:1 A2:1 D3:1 A2:1 D3:1 A2:1 G2:1 D3:1 G2:1 D3:1 D3:1 A2:1 D3:1 A2:1 D3:1 A2:1 A2:1 E3:1 G2:1 D3:1 A2:1 E3:1 D3:2',
  },
  // Чехия: «Влтава»
  n_czech: {
    bpm: 110, lead: 'triangle', leadVol: 0.42, drums: false,
    melody: 'E4:1 F#4:1 G4:1 A4:1 B4:2 B4:2 C5:2 C5:2 B4:4 A4:2 A4:2 G4:4 F#4:2 F#4:2 E4:4',
    bass: 'E2:4 E2:4 A2:4 E2:4 C3:4 G2:4 B2:4 E2:4',
  },
  // Венгрия: «Венгерский танец»
  n_hungary: {
    bpm: 140, lead: 'sawtooth', leadVol: 0.17, drums: true,
    melody: 'D4:2 G4:1 G4:1 A4:1 Bb4:3 A4:1 G4:1 F#4:1 G4:1 A4:2 D4:2 D4:2 F#4:1 F#4:1 G4:1 A4:3 G4:1 F#4:1 E4:1 F#4:1 G4:4',
    bass: 'G2:4 G2:4 D3:4 D3:4 D3:4 D3:4 D3:4 G2:4',
  },
  // Норвегия и Исландия: «В пещере горного короля»
  n_norway: {
    bpm: 130, lead: 'square', leadVol: 0.24, drums: true,
    melody: 'B3:.5 C#4:.5 D4:.5 E4:.5 F#4:.5 D4:.5 F#4:1 F4:.5 C#4:.5 F4:1 E4:.5 C4:.5 E4:1 B3:.5 C#4:.5 D4:.5 E4:.5 F#4:.5 D4:.5 F#4:.5 B4:.5 A4:.5 F#4:.5 D4:.5 F#4:.5 A4:2',
    bass: 'B2:1 F#2:1 B2:1 F#2:1 C#3:1 F#2:1 C3:1 G2:1 B2:1 F#2:1 B2:1 F#2:1 D3:1 A2:1 D3:2',
  },
  // Швейцария: йодль
  n_swiss: {
    bpm: 130, lead: 'triangle', leadVol: 0.42, drums: false,
    melody: 'G4:.5 C5:.5 G4:.5 E5:1.5 C5:1 G4:.5 C5:.5 G4:.5 F5:1.5 D5:1 G4:.5 D5:.5 G4:.5 F5:1.5 D5:1 G4:.5 C5:.5 G4:.5 E5:1.5 C5:1',
    bass: 'C3:2 G2:2 G2:2 G2:2 G2:2 G2:2 C3:2 C3:2',
  },
  // Португалия: фаду
  n_portugal: {
    bpm: 90, lead: 'triangle', leadVol: 0.42, drums: false,
    melody: 'E4:1 G4:.5 A4:.5 B4:1 C5:1 B4:1 A4:.5 G4:.5 A4:2 A4:1 C5:.5 D5:.5 E5:1 D5:.5 C5:.5 B4:1 A4:.5 G#4:.5 A4:2',
    bass: 'A2:2 E2:2 E2:2 A2:2 A2:2 D3:2 E2:2 A2:2',
  },
  // Румыния, замок Дракулы: страшноватый орган
  n_romania: {
    bpm: 70, lead: 'sawtooth', leadVol: 0.18, drums: false,
    melody: 'A5:.25 G5:.25 A5:2.5 G5:.25 F5:.25 E5:.25 D5:.25 C#5:1 D5:3 A4:.25 G4:.25 A4:2.5 E4:.5 F4:.5 C#4:.5 D4:3.5',
    bass: 'D2:8 D2:8',
  },
  // Казахстан, космодром: космическая
  n_space: {
    bpm: 110, lead: 'triangle', leadVol: 0.4, drums: false,
    melody: 'C5:.5 G5:.5 E5:.5 G5:.5 C5:.5 G5:.5 E5:.5 G5:.5 A4:.5 E5:.5 C5:.5 E5:.5 A4:.5 E5:.5 C5:.5 E5:.5 F4:.5 C5:.5 A4:.5 C5:.5 G4:.5 D5:.5 B4:.5 D5:.5 C5:4',
    bass: 'C3:4 A2:4 F2:2 G2:2 C3:4',
  },
  // Африка: маримба и барабаны
  n_africa: {
    bpm: 130, lead: 'triangle', leadVol: 0.42, drums: true,
    melody: 'C5:.5 E5:.5 G5:.5 E5:.5 C5:.5 A4:.5 G4:1 A4:.5 C5:.5 D5:.5 E5:.5 D5:1 C5:1 E5:.5 G5:.5 A5:.5 G5:.5 E5:.5 D5:.5 C5:1 D5:.5 E5:.5 C5:.5 A4:.5 C5:2',
    bass: 'C3:1 G2:1 C3:1 G2:1 A2:1 E2:1 A2:1 E2:1 F2:1 C3:1 F2:1 C3:1 G2:1 D3:1 C3:2',
  },
  // Австралия: диджериду и палочки
  n_australia: {
    bpm: 110, lead: 'triangle', leadVol: 0.36, drums: true,
    melody: 'A4:1 C5:.5 A4:.5 G4:1 E4:1 A4:1 C5:.5 D5:.5 E5:2 D5:1 C5:.5 A4:.5 G4:1 E4:1 A4:4',
    bass: rep('A1:.75 A1:.25 A1:.5 E2:.5', 8),
  },
  // Новая Зеландия, Хоббитон: весёлая джига
  n_shire: {
    bpm: 150, lead: 'triangle', leadVol: 0.38, drums: true,
    melody: 'D5:.5 F#5:.5 A5:.5 F#5:.5 D5:.5 F#5:.5 G5:.5 E5:.5 C#5:.5 E5:.5 A5:.5 G5:.5 F#5:.5 D5:.5 E5:.5 F#5:.5 '
      + 'G5:.5 A5:.5 B5:.5 A5:.5 G5:.5 F#5:.5 E5:.5 D5:.5 C#5:.5 E5:.5 D5:3',
    bass: 'D3:1 A2:1 D3:1 A2:1 A2:1 E3:1 A2:1 E3:1 D3:1 A2:1 G2:1 D3:1 A2:1 E3:1 D3:2',
  },
  // Юго-Восточная Азия: гамелан
  n_gamelan: {
    bpm: 120, lead: 'triangle', leadVol: 0.42, drums: false,
    melody: 'E5:.5 G5:.5 A5:.5 G5:.5 E5:1 D5:1 C5:.5 D5:.5 E5:.5 G5:.5 A5:2 C6:.5 A5:.5 G5:.5 E5:.5 D5:1 E5:1 G5:.5 E5:.5 D5:.5 C5:.5 D5:2',
    bass: 'C3:2 C3:2 G2:2 A2:2 C3:2 G2:2 A2:2 G2:2',
  },
  // Антарктида: хрустальные колокольчики
  n_polar: {
    bpm: 80, lead: 'sine', leadVol: 0.45, drums: false,
    melody: 'C6:1 G5:1 E5:1 G5:1 A5:1 G5:1 E5:2 D5:1 E5:1 G5:1 E5:1 C5:4',
    bass: 'C3:4 A2:4 G2:4 C3:4',
  },
});

// Страна чуда → его мелодия.
const COUNTRY_TUNE = {
  'Россия': 'n_russia', 'Франция': 'n_france', 'Бельгия': 'n_france', 'Великобритания': 'n_uk', 'Шотландия': 'n_scotland',
  'США': 'n_usa', 'США и Канада': 'n_usa', 'Канада': 'n_canada', 'Мексика': 'n_mexico', 'Бразилия': 'n_samba', 'Перу': 'n_andes',
  'Остров Пасхи, Чили': 'n_island', 'Япония': 'n_japan', 'Китай': 'n_china', 'Тайвань': 'n_china', 'Индия': 'n_india',
  'Египет': 'n_arab', 'Древний Египет': 'n_arab', 'Древний Вавилон': 'n_arab', 'ОАЭ': 'n_arab', 'Кувейт': 'n_arab',
  'Иордания': 'n_arab', 'Марокко': 'n_arab', 'Турция': 'n_turkish', 'Италия': 'n_italy', 'Ватикан': 'n_italy',
  'Германия': 'n_germany', 'Испания': 'n_spain', 'Нидерланды': 'n_netherlands', 'Греция': 'n_greece', 'Древняя Греция': 'n_greece',
  'Чехия': 'n_czech', 'Венгрия': 'n_hungary', 'Норвегия': 'n_norway', 'Исландия': 'n_norway', 'Швейцария': 'n_swiss',
  'Португалия': 'n_portugal', 'Румыния': 'n_romania', 'Казахстан': 'n_space', 'Австралия': 'n_australia',
  'Новая Зеландия': 'n_shire', 'Антарктида': 'n_polar', 'Мьянма': 'n_gamelan', 'Индонезия': 'n_gamelan', 'Таиланд': 'n_gamelan',
  'Камбоджа': 'n_gamelan', 'Малайзия': 'n_gamelan', 'Сингапур': 'n_gamelan', 'Танзания': 'n_africa', 'ЮАР': 'n_africa',
  'Мали': 'n_africa', 'Замбия и Зимбабве': 'n_africa', 'Мадагаскар': 'n_africa',
};
export const nationalTrack = (country) => COUNTRY_TUNE[country] ?? null;

// в море мелодии сменяют друг друга: каждая звучит по два раза
const PLAYLISTS = { sea: ['breeze', 'shanty', 'waves'] };
const LOOPS_PER_TUNE = 2;

let current = null; // { key, list, idx, loops }
let beat = 0.5;
let voices = [];

function loadTune(id, at) {
  const tr = TRACKS[id];
  if (!tr) {
    voices = [];
    return;
  }
  beat = 60 / tr.bpm;
  voices = [
    { seq: seq(tr.melody), type: tr.lead, vol: tr.leadVol, lead: true },
    { seq: seq(tr.bass), type: 'triangle', vol: 0.55 },
  ];
  if (tr.drums) {
    const bars = voices[0].seq.reduce((s, [, b]) => s + b, 0) / 4;
    voices.push({ seq: seq(rep(DRUMS, bars).replace(/K/g, 'A1').replace(/H/g, 'A7')), drums: true });
  }
  for (const v of voices) {
    v.i = 0;
    v.t = at;
  }
}

// Какую музыку играть: port, sea, land, night, boss или none.
export function setTrack(key) {
  if (current?.key === key) return;
  const list = PLAYLISTS[key] ?? [key];
  current = { key, list, idx: 0, loops: 0 };
  loadTune(list[0], ctx ? ctx.currentTime + 0.1 : 0);
}

function playNote(v, f, dur, at) {
  if (!f) return;
  if (!v.drums) {
    tone(f, dur, { type: v.type, vol: v.vol, at, bus: musicBus });
  } else if (f < 100) {
    tone(120, 0.15, { type: 'sine', vol: 0.6, to: 45, at, bus: musicBus }); // бочка
  } else {
    noise(0.05, { vol: 0.12, freq: 7000, at, bus: musicBus }); // тарелочка
  }
}

function scheduleMusic() {
  if (!musicOn || muted || !current || !voices.length) return;
  // вкладка засыпала — начинаем мелодию сначала, чтобы голоса не разъехались
  if (voices[0].t < ctx.currentTime - 0.1) loadTune(current.list[current.idx], ctx.currentTime + 0.05);
  const horizon = ctx.currentTime + 0.25;
  for (const v of voices) {
    while (v.t < horizon) {
      const [f, beats] = v.seq[v.i];
      playNote(v, f, beats * beat * 0.9, v.t);
      v.t += beats * beat;
      v.i = (v.i + 1) % v.seq.length;
      if (v.lead && v.i === 0 && current.list.length > 1 && ++current.loops >= LOOPS_PER_TUNE) {
        // следующая мелодия из плейлиста — с того же места во времени
        current.loops = 0;
        current.idx = (current.idx + 1) % current.list.length;
        loadTune(current.list[current.idx], v.t);
        return;
      }
    }
  }
}

export function setMusic(on) {
  if (on && !musicOn && ctx && current) loadTune(current.list[current.idx], ctx.currentTime + 0.1);
  musicOn = on;
}
