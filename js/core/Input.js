// ============================================================
// LARAMIE — core/Input.js
// 8-direction virtual joystick + action buttons
// Mobile-first: uses Pointer Events with touch fallback
// ============================================================
export const Input = {
  // Keyboard state: currently held keys
  keys: {},
  // Keyboard keys pressed this frame (cleared each frame after update)
  pressed: {},
  // Touch/pointer action buttons currently held
  actionHeld: {},
  // Touch/pointer action buttons pressed this frame (cleared each frame)
  actionPressed: {},

  touch: {
    active: false,
    startX: 0, startY: 0,
    currentX: 0, currentY: 0,
    joystickId: null,
    joyRadius: 0,
    maxDist: 0,
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
    if (this.touch.active) return this.touch.currentX < this.touch.startX - this.touch.maxDist * 0.3;
    return this.keys['ArrowLeft'] || this.keys['KeyA'];
  },
  get right() {
    if (this.touch.active) return this.touch.currentX > this.touch.startX + this.touch.maxDist * 0.3;
    return this.keys['ArrowRight'] || this.keys['KeyD'];
  },
  get up() {
    if (this.touch.active) return this.touch.currentY < this.touch.startY - this.touch.maxDist * 0.3;
    return this.keys['ArrowUp'] || this.keys['KeyW'];
  },
  get down() {
    if (this.touch.active) return this.touch.currentY > this.touch.startY + this.touch.maxDist * 0.3;
    return this.keys['ArrowDown'] || this.keys['KeyS'];
  },

  // Action buttons: true if pressed this frame (keyboard OR touch)
  get attack() { return this.pressed['KeyZ'] || this.pressed['Space'] || this.actionPressed.attack; },
  get item() { return this.pressed['KeyX'] || this.actionPressed.item; },
  get dash() { return this.pressed['ShiftLeft'] || this.pressed['ShiftRight'] || this.actionPressed.dash; },
  get start() { return this.pressed['Enter'] || this.actionPressed.start; },
  get select() { return this.pressed['KeyM'] || this.actionPressed.select; },

  // Held state for continuous actions (e.g., movement)
  get attackHeld() { return this.keys['KeyZ'] || this.keys['Space'] || this.actionHeld.attack; },
  get itemHeld() { return this.keys['KeyX'] || this.actionHeld.item; },
  get startHeld() { return this.keys['Enter'] || this.actionHeld.start; },
  get selectHeld() { return this.keys['KeyM'] || this.actionHeld.select; },

  init() {
    // Keyboard
    window.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Shift','KeyZ','KeyX','KeyM','KeyA','KeyD','KeyW','KeyS'].includes(e.key)) e.preventDefault();
      if (!this.keys[e.code]) this.pressed[e.code] = true;
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });

    // Joystick
    const joyBase = document.getElementById('joy-base');
    const joyStick = document.getElementById('joy-stick');

    if (joyBase && joyStick) {
      const updateRadius = () => {
        const rect = joyBase.getBoundingClientRect();
        this.touch.joyRadius = Math.min(rect.width, rect.height) / 2;
        this.touch.maxDist = this.touch.joyRadius * 0.7;
      };
      updateRadius();
      window.addEventListener('resize', updateRadius);
      window.addEventListener('orientationchange', () => setTimeout(updateRadius, 100));

      // Pointer Events (unified touch/mouse/pen)
      const pointerDown = (e) => {
        if (e.target !== joyBase && !joyBase.contains(e.target)) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        e.preventDefault();
        const rect = joyBase.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        if (x * x + y * y <= this.touch.joyRadius * this.touch.joyRadius && this.touch.joystickId === null) {
          this.touch.active = true;
          this.touch.joystickId = e.pointerId;
          this.touch.startX = x; this.touch.startY = y;
          this.touch.currentX = x; this.touch.currentY = y;
          joyStick.classList.add('active');
          this.updateStick(x, y, joyStick);
          joyBase.setPointerCapture(e.pointerId);
        }
      };

      const pointerMove = (e) => {
        if (!this.touch.active || e.pointerId !== this.touch.joystickId) return;
        e.preventDefault();
        const rect = joyBase.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        this.touch.currentX = x; this.touch.currentY = y;
        this.updateStick(x, y, joyStick);
      };

      const pointerUp = (e) => {
        if (e.pointerId !== this.touch.joystickId) return;
        e.preventDefault();
        this.touch.active = false;
        this.touch.joystickId = null;
        joyStick.classList.remove('active');
        joyStick.style.transform = 'translate(-50%, -50%)';
        try { joyBase.releasePointerCapture(e.pointerId); } catch {}
      };

      joyBase.addEventListener('pointerdown', pointerDown, { passive: false });
      window.addEventListener('pointermove', pointerMove, { passive: false });
      window.addEventListener('pointerup', pointerUp, { passive: false });
      window.addEventListener('pointercancel', pointerUp, { passive: false });
      window.addEventListener('pointerleave', pointerUp, { passive: false });

      // Touch fallback ONLY if PointerEvent not supported
      if (!window.PointerEvent) {
        joyBase.addEventListener('touchstart', (e) => {
          e.preventDefault();
          const touch = e.changedTouches[0];
          const rect = joyBase.getBoundingClientRect();
          const x = touch.clientX - rect.left - rect.width / 2;
          const y = touch.clientY - rect.top - rect.height / 2;
          if (x * x + y * y <= this.touch.joyRadius * this.touch.joyRadius && !this.touch.joystickId) {
            this.touch.active = true;
            this.touch.joystickId = touch.identifier;
            this.touch.startX = x; this.touch.startY = y;
            this.touch.currentX = x; this.touch.currentY = y;
            joyStick.classList.add('active');
            this.updateStick(x, y, joyStick);
          }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
          if (!this.touch.active) return;
          for (const touch of e.changedTouches) {
            if (touch.identifier === this.touch.joystickId) {
              e.preventDefault();
              const rect = joyBase.getBoundingClientRect();
              const x = touch.clientX - rect.left - rect.width / 2;
              const y = touch.clientY - rect.top - rect.height / 2;
              this.touch.currentX = x; this.touch.currentY = y;
              this.updateStick(x, y, joyStick);
            }
          }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
          for (const touch of e.changedTouches) {
            if (touch.identifier === this.touch.joystickId) {
              e.preventDefault();
              this.touch.active = false;
              this.touch.joystickId = null;
              joyStick.classList.remove('active');
              joyStick.style.transform = 'translate(-50%, -50%)';
            }
          }
        }, { passive: false });

        window.addEventListener('touchcancel', (e) => {
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
    }

    // Action buttons - Pointer Events with touch fallback
    const bindBtn = (id, key, actionName) => {
      const el = document.getElementById(id);
      if (!el) {
        console.warn('[Input] Button not found:', id);
        return;
      }
      console.log('[Input] Bound button:', id, '->', actionName);

      const press = (e) => {
        if (e.type.startsWith('pointer') && e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        console.log('[Input] Press:', actionName, 'type:', e.type, 'pointerType:', e.pointerType);
        // Keyboard mirror
        this.pressed[key] = true;
        this.keys[key] = true;
        // Touch/pointer action state
        this.actionHeld[actionName] = true;
        this.actionPressed[actionName] = true;
        el.classList.add('pressed');
      };

      const release = (e) => {
        if (e.type.startsWith('pointer') && e.pointerType === 'mouse' && e.button !== 0) return;
        // Only release on pointerleave for mouse, not for touch/pen
        if (e.type === 'pointerleave' && e.pointerType !== 'mouse') return;
        console.log('[Input] Release:', actionName, 'type:', e.type, 'pointerType:', e.pointerType);
        // Keyboard mirror
        this.keys[key] = false;
        // Touch/pointer action state
        this.actionHeld[actionName] = false;
        el.classList.remove('pressed');
      };

      // Pointer events (primary)
      el.addEventListener('pointerdown', press, { passive: false });
      el.addEventListener('pointerup', release, { passive: false });
      el.addEventListener('pointercancel', release, { passive: false });
      // pointerleave only for mouse (touch/pen use pointerup/cancel)
      el.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'mouse') release(e);
      }, { passive: false });

      // Touch fallback ONLY if no PointerEvent support
      if (!window.PointerEvent) {
        el.addEventListener('touchstart', press, { passive: false });
        el.addEventListener('touchend', release, { passive: false });
        el.addEventListener('touchcancel', release, { passive: false });
      }
    };

    bindBtn('btn-b', 'KeyZ', 'attack');
    bindBtn('btn-a', 'KeyX', 'item');
    bindBtn('btn-start', 'Enter', 'start');
    bindBtn('btn-select', 'KeyM', 'select');

    // Prevent scrolling on touch controls area
    const tc = document.getElementById('touch-controls');
    if (tc) {
      tc.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
      // Only add pointermove prevention if PointerEvent exists
      if (window.PointerEvent) {
        tc.addEventListener('pointermove', e => e.preventDefault(), { passive: false });
      }
    }
  },

  updateStick(x, y, stickEl) {
    const dist = Math.sqrt(x * x + y * y);
    const maxDist = this.touch.maxDist || this.touch.joyRadius * 0.7;
    if (dist <= maxDist) {
      stickEl.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    } else {
      const ratio = maxDist / dist;
      stickEl.style.transform = `translate(calc(-50% + ${x * ratio}px), calc(-50% + ${y * ratio}px))`;
    }
  },

  // Call at END of frame after game logic has consumed input
  flush() {
    this.pressed = {};
    this.actionPressed = {};
  }
};