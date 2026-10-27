// ============================================================
// LARAMIE — core/Input.js
// 8-direction virtual joystick + action buttons
// ============================================================
export const Input = {
  keys: {},
  pressed: {},
  touch: {
    active: false,
    startX: 0, startY: 0,
    currentX: 0, currentY: 0,
    joystickId: null,
    actionBtns: {}
  },

  // 8-direction vector (normalized)
  get dir() {
    let dx = 0, dy = 0;
    if (this.left) dx -= 1;
    if (this.right) dx += 1;
    if (this.up) dy -= 1;
    if (this.down) dy += 1;
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.sqrt(2);
      dx *= inv; dy *= inv;
    }
    return { x: dx, y: dy };
  },

  get left() {
    if (this.touch.active) return this.touch.currentX < this.touch.startX - 12;
    return this.keys['ArrowLeft'] || this.keys['KeyA'];
  },
  get right() {
    if (this.touch.active) return this.touch.currentX > this.touch.startX + 12;
    return this.keys['ArrowRight'] || this.keys['KeyD'];
  },
  get up() {
    if (this.touch.active) return this.touch.currentY < this.touch.startY - 12;
    return this.keys['ArrowUp'] || this.keys['KeyW'];
  },
  get down() {
    if (this.touch.active) return this.touch.currentY > this.touch.startY + 12;
    return this.keys['ArrowDown'] || this.keys['KeyS'];
  },

  get attack() { return this.pressed['KeyZ'] || this.pressed['Space'] || this.touch.actionBtns.attack; },
  get item() { return this.pressed['KeyX'] || this.touch.actionBtns.item; },
  get dash() { return this.pressed['ShiftLeft'] || this.pressed['ShiftRight'] || this.touch.actionBtns.dash; },
  get start() { return this.pressed['Enter'] || this.touch.actionBtns.start; },
  get select() { return this.pressed['KeyM'] || this.touch.actionBtns.select; },

  init() {
    window.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Shift','KeyZ','KeyX','KeyM','KeyA','KeyD','KeyW','KeyS'].includes(e.key)) e.preventDefault();
      if (!this.keys[e.code]) this.pressed[e.code] = true;
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const tc = document.getElementById('touch-controls');
    if (isTouch && tc) tc.classList.add('visible');

    const joyBase = document.getElementById('joy-base');
    const joyStick = document.getElementById('joy-stick');
    const joyRadius = 36;
    const maxDist = joyRadius * 0.65;

    if (joyBase && joyStick) {
      joyBase.addEventListener('touchstart', e => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = joyBase.getBoundingClientRect();
        const x = touch.clientX - rect.left - rect.width / 2;
        const y = touch.clientY - rect.top - rect.height / 2;
        if (x * x + y * y <= joyRadius * joyRadius && !this.touch.joystickId) {
          this.touch.active = true;
          this.touch.joystickId = touch.identifier;
          this.touch.startX = x; this.touch.startY = y;
          this.touch.currentX = x; this.touch.currentY = y;
          joyStick.classList.add('active');
          this.updateStick(x, y, maxDist, joyStick);
        }
      }, { passive: false });

      window.addEventListener('touchmove', e => {
        if (!this.touch.active) return;
        for (const touch of e.changedTouches) {
          if (touch.identifier === this.touch.joystickId) {
            const rect = joyBase.getBoundingClientRect();
            const x = touch.clientX - rect.left - rect.width / 2;
            const y = touch.clientY - rect.top - rect.height / 2;
            this.touch.currentX = x; this.touch.currentY = y;
            this.updateStick(x, y, maxDist, joyStick);
          }
        }
      }, { passive: false });

      window.addEventListener('touchend', e => {
        for (const touch of e.changedTouches) {
          if (touch.identifier === this.touch.joystickId) {
            this.touch.active = false;
            this.touch.joystickId = null;
            joyStick.classList.remove('active');
            joyStick.style.transform = 'translate(-50%, -50%)';
          }
        }
      }, { passive: false });
    }

    const bindBtn = (id, key, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      const press = e => { e.preventDefault(); this.pressed[key] = true; this.keys[key] = true; this.touch.actionBtns[e.pointerId || 0] = action; el.classList.add('pressed'); };
      const release = e => { this.keys[key] = false; delete this.touch.actionBtns[e.pointerId || 0]; el.classList.remove('pressed'); };
      el.addEventListener('touchstart', press, { passive: false });
      el.addEventListener('touchend', release, { passive: false });
      el.addEventListener('touchcancel', release, { passive: false });
      el.addEventListener('mousedown', press);
      el.addEventListener('mouseup', release);
      el.addEventListener('mouseleave', release);
    };

    bindBtn('btn-b', 'KeyZ', 'attack');
    bindBtn('btn-a', 'KeyX', 'item');
    bindBtn('btn-start', 'Enter', 'start');
    bindBtn('btn-select', 'KeyM', 'select');

    if (tc) tc.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  },

  updateStick(x, y, maxDist, stickEl) {
    const dist = Math.sqrt(x * x + y * y);
    if (dist <= maxDist) {
      stickEl.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    } else {
      const ratio = maxDist / dist;
      stickEl.style.transform = `translate(calc(-50% + ${x * ratio}px), calc(-50% + ${y * ratio}px))`;
    }
  },

  flush() { this.pressed = {}; }
};