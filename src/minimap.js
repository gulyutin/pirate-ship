// Квадратная карта в углу, как карта в Minecraft. Верх карты — туда, куда смотрит камера.
// Открытые острова видны, неоткрытые — нет; на краю два значка:
// ⚓ — дорога домой, «?» — ближайшее неоткрытое чудо света.
const S = 120; // размер в CSS-пикселях
const RANGE = 250; // мировых единиц от центра до края
const K = S / 2 / RANGE;

// Большая карта всего моря — для паузы. Север (−z) сверху.
// v: { islands, found, summits, boat: { x, z, heading }, bigTreasure, questTarget }
export function drawWorldMap(canvas, v) {
  const size = canvas.clientWidth || 280;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(size * dpr)) {
    canvas.width = canvas.height = Math.round(size * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = Math.max(...v.islands.map((i) => Math.hypot(i.x, i.z) + i.r)) + 20;
  const k = size / 2 / R;
  const to = (x, z) => [size / 2 + x * k, size / 2 + z * k];
  ctx.fillStyle = '#2f7fb0';
  ctx.fillRect(0, 0, size, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const isl of v.islands) {
    const [mx, my] = to(isl.x, isl.z);
    if (isl.port || isl.home || v.found.includes(isl.id)) {
      const rr = Math.max(2.5, isl.r * k);
      ctx.fillStyle = '#e3d38f';
      ctx.fillRect(mx - rr, my - rr, rr * 2, rr * 2);
      ctx.fillStyle = isl.port ? '#b58a58' : isl.home ? '#e8793a' : '#5fa044';
      ctx.fillRect(mx - rr * 0.65, my - rr * 0.65, rr * 1.3, rr * 1.3);
      if (v.summits.includes(isl.id)) {
        ctx.fillStyle = '#f6c944';
        ctx.fillRect(mx - 1.5, my - rr - 4, 3, 3);
      }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; // неоткрытые — только точки
      ctx.fillRect(mx - 1.5, my - 1.5, 3, 3);
    }
  }
  const mark = (isl, glyph, color) => {
    if (!isl) return;
    const [mx, my] = to(isl.x, isl.z);
    ctx.fillStyle = color;
    ctx.fillRect(mx - 7, my - 7, 14, 14);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(glyph, mx, my + 1);
  };
  mark(v.islands.find((i) => i.port), '⚓', '#4a3120');
  mark(v.islands.find((i) => i.id === v.bigTreasure), '✕', '#c0392b');
  mark(v.islands.find((i) => i.id === v.questTarget), '!', '#d4a020');
  if (v.storyTarget) {
    const [mx, my] = to(v.storyTarget.x, v.storyTarget.z);
    ctx.fillStyle = '#e8b830';
    ctx.fillRect(mx - 8, my - 8, 16, 16);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('★', mx, my + 1);
  }
  const [sx, sy] = to(v.boat.x, v.boat.z);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-v.boat.heading);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(5, 5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function createMinimap(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = S * dpr;
  canvas.height = S * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // v: { x, z, yaw, heading, islands, found, enemies, ship | null }
  function draw(v) {
    const cos = Math.cos(v.yaw);
    const sin = Math.sin(v.yaw);
    const toMap = (wx, wz) => {
      const dx = wx - v.x;
      const dz = wz - v.z;
      const right = dx * cos - dz * sin;
      const fwd = -dx * sin - dz * cos;
      return [S / 2 + right * K, S / 2 - fwd * K];
    };
    // значок на краю, если цель за пределами карты
    const edgeMark = (wx, wz, glyph, bg) => {
      let [mx, my] = toMap(wx, wz);
      const lim = S / 2 - 9;
      const f = Math.max(Math.abs(mx - S / 2), Math.abs(my - S / 2)) / lim;
      if (f > 1) {
        mx = S / 2 + (mx - S / 2) / f;
        my = S / 2 + (my - S / 2) / f;
      }
      ctx.fillStyle = bg;
      ctx.fillRect(mx - 8, my - 8, 16, 16);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(glyph, mx, my + 1);
    };

    ctx.fillStyle = '#2f7fb0';
    ctx.fillRect(0, 0, S, S);

    let port = null;
    let mystery = null;
    let mysteryD = Infinity;
    for (const isl of v.islands) {
      if (isl.port) port = isl;
      const known = isl.port || v.found.includes(isl.id);
      if (!known) {
        const d = Math.hypot(isl.x - v.x, isl.z - v.z);
        if (d < mysteryD) {
          mysteryD = d;
          mystery = isl;
        }
        continue;
      }
      const [mx, my] = toMap(isl.x, isl.z);
      const rr = Math.max(3, isl.r * K * 1.1);
      ctx.fillStyle = '#e3d38f';
      ctx.fillRect(mx - rr, my - rr, rr * 2, rr * 2);
      ctx.fillStyle = isl.port ? '#b58a58' : '#5fa044';
      ctx.fillRect(mx - rr * 0.7, my - rr * 0.7, rr * 1.4, rr * 1.4);
    }

    ctx.fillStyle = '#e0302a';
    for (const e of v.enemies) {
      const [mx, my] = toMap(e.g.position.x, e.g.position.z);
      if (mx > 0 && mx < S && my > 0 && my < S) ctx.fillRect(mx - 3, my - 3, 6, 6);
    }
    if (v.ship) {
      const [mx, my] = toMap(v.ship.x, v.ship.z);
      ctx.fillStyle = '#7a4a26';
      ctx.fillRect(mx - 4, my - 4, 8, 8);
    }

    for (const m of v.marks ?? []) edgeMark(m.x, m.z, m.glyph, m.color); // бочки, клад, цель задания
    if (mystery) edgeMark(mystery.x, mystery.z, '?', '#8a5fae');
    if (port) edgeMark(port.x, port.z, '⚓', '#4a3120');

    // мы — белая стрелка в центре
    ctx.save();
    ctx.translate(S / 2, S / 2);
    ctx.rotate(v.yaw - v.heading);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  return { draw };
}
