// Управление. Джойстик появляется там, куда коснулся палец (или нажала мышь);
// стрелки и WASD дают тот же вектор. Пробел — прыжок, E и Enter — действие,
// B — вернуться на корабль.
const R = 50; // ход ручки джойстика, px
const DEAD = 0.12;
const KEYS = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
};
const ZERO = Object.freeze({ x: 0, y: 0 });

export function createControls(stage, { onAction, onJump, onBoard }) {
  const base = document.getElementById('joy');
  const knob = document.getElementById('joyKnob');
  const held = { up: false, down: false, left: false, right: false };
  const stick = { x: 0, y: 0 };
  let touch = null;
  let enabled = false;

  function release() {
    touch = null;
    stick.x = stick.y = 0;
    base.classList.add('hidden');
  }

  stage.addEventListener('pointerdown', (e) => {
    if (!enabled || touch) return;
    touch = { id: e.pointerId, x: e.clientX, y: e.clientY };
    stage.setPointerCapture(e.pointerId);
    base.style.left = `${e.clientX}px`;
    base.style.top = `${e.clientY}px`;
    knob.style.transform = 'translate(-50%, -50%)';
    base.classList.remove('hidden');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!touch || e.pointerId !== touch.id) return;
    let dx = e.clientX - touch.x;
    let dy = e.clientY - touch.y;
    const len = Math.hypot(dx, dy);
    if (len > R) {
      dx *= R / len;
      dy *= R / len;
    }
    stick.x = dx / R;
    stick.y = -dy / R;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  });
  const end = (e) => {
    if (touch && e.pointerId === touch.id) release();
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  window.addEventListener('keydown', (e) => {
    const dir = KEYS[e.code];
    if (dir) {
      held[dir] = true;
      e.preventDefault();
      return;
    }
    if (e.repeat) return;
    if (e.code === 'Space') {
      e.preventDefault();
      onJump();
    } else if (e.code === 'KeyE' || e.code === 'Enter') {
      e.preventDefault();
      onAction();
    } else if (e.code === 'KeyB') {
      onBoard();
    }
  });
  window.addEventListener('keyup', (e) => {
    const dir = KEYS[e.code];
    if (dir) held[dir] = false;
  });
  window.addEventListener('blur', () => {
    held.up = held.down = held.left = held.right = false;
  });

  // Куда толкают: x — вправо, y — вперёд (вверх по экрану), длина до 1.
  function move() {
    if (!enabled) return ZERO;
    let x = stick.x + (held.right ? 1 : 0) - (held.left ? 1 : 0);
    let y = stick.y + (held.up ? 1 : 0) - (held.down ? 1 : 0);
    const len = Math.hypot(x, y);
    if (len < DEAD) return ZERO;
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  function setEnabled(on) {
    enabled = on;
    if (!on) release();
  }

  return { move, setEnabled };
}
