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
  discover: () => arp([523, 659, 784, 1047, 784, 1047], 0.09, { vol: 0.22 }),
  dance: () => arp([659, 784, 880, 784, 659, 523, 659, 784], 0.1, { vol: 0.18 }),
  launch() {
    noise(2.5, { vol: 0.5, freq: 400, to: 2000 });
    tone(60, 2.5, { type: 'sawtooth', vol: 0.15, to: 200 });
  },
};

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
