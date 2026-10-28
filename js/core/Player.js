// ============================================================
// LARAMIE — core/Player.js
// Surveyor's apprentice (fox) - LTTP-style movement
// ============================================================
import { Entity } from './Entity.js';
import { RectHitbox } from './Hitbox.js';
import { Input } from './Input.js';

export class Player extends Entity {
  constructor(x, y) {
    const hitbox = new RectHitbox(x + 3, y + 6, 10, 9); // LTTP-style hitbox
    super(x, y, hitbox);
    this.speed = 100; // px/sec walk
    this.dashSpeed = 280;
    this.dashCooldown = 0;
    this.dashTime = 0;
    this.attackTime = 0;
    this.attackCooldown = 0;
    this.spinAttack = false;
    this.itemEquipped = null; // 'bow', 'bomb', 'boots'
    this.rupees = 0;
    this.keys = 0;
    this.bombs = 0;
    this.maxBombs = 0;
    this.arrows = 0;
    this.hasSword = true;
    this.swordLevel = 1;
    this.heartContainers = 3;
    this.health = this.heartContainers;
  }

  update(dt, tilemap, solidTiles) {
    super.update(dt, tilemap, solidTiles);

    // Dash cooldown
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Dash state
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      if (this.dashTime <= 0) this.setState('walk');
    }

    // Attack state
    if (this.attackTime > 0) {
      this.attackTime -= dt;
      if (this.attackTime <= 0) this.setState('idle');
    }

    // Input handling
    if (this.state !== 'hurt' && this.state !== 'dead' && this.state !== 'attack' && this.dashTime <= 0) {
      const dir = Input.dir;
      const moving = dir.x !== 0 || dir.y !== 0;

      if (moving) {
        // Determine facing (8-dir snapped to 4 for sprites)
        if (Math.abs(dir.x) > Math.abs(dir.y)) {
          this.facing = dir.x > 0 ? 'right' : 'left';
        } else {
          this.facing = dir.y > 0 ? 'down' : 'up';
        }

        // Dash
        if (Input.dash && this.dashCooldown <= 0 && !this.spinAttack) {
          this.dash(dir.x, dir.y);
        } else {
          // Normal walk
          const spd = this.speed * dt;
          this.move(dir.x * spd, dir.y * spd, tilemap, solidTiles);
          this.setState('walk');
        }
      } else {
        this.setState('idle');
      }

      // Sword attack
      if (Input.attack && this.attackCooldown <= 0 && this.hasSword) {
        this.attack();
      }

      // Item use
      if (Input.item && this.itemEquipped) {
        this.useItem();
      }
    }

    // Apply knockback velocity
    if (this.vx !== 0 || this.vy !== 0) {
      const kbx = this.vx * dt;
      const kby = this.vy * dt;
      this.move(kbx, kby, tilemap, solidTiles);
      this.vx *= 0.85; this.vy *= 0.85;
      if (Math.abs(this.vx) < 5) this.vx = 0;
      if (Math.abs(this.vy) < 5) this.vy = 0;
    }
  }

  dash(dx, dy) {
    this.dashTime = 0.18;
    this.dashCooldown = 0.6;
    this.invincible = 0.2;
    this.setState('dash');
    const dist = this.dashSpeed * this.dashTime;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.move((dx / len) * dist, (dy / len) * dist, null, null); // dash ignores collision
  }

  attack() {
    this.attackTime = 0.3;
    this.attackCooldown = 0.4;
    this.setState('attack');
    this.spinAttack = false;
  }

  spinAttackStart() {
    if (!this.hasSword || this.attackCooldown > 0) return;
    this.spinAttack = true;
    this.attackTime = 0.6;
    this.attackCooldown = 1.0;
    this.setState('spin');
  }

  useItem() {
    // Bow, bombs, etc.
  }

  // Override move to maintain hitbox offset (LTTP-style hitbox is inset)
  move(dx, dy, tilemap, solidTiles) {
    const m = super.move(dx, dy, tilemap, solidTiles);
    // Re-apply hitbox offset after base class syncs position
    this.hitbox.x = this.x + 3;
    this.hitbox.y = this.y + 6;
    return m;
  }

  updateAnim() {
    const stateAnimMap = {
      idle: 'idle',
      walk: 'walk',
      attack: 'attack',
      spin: 'attack_spin',
      dash: 'dash',
      hurt: 'hurt',
    };
    const baseAnim = stateAnimMap[this.state] || 'idle';
    this.anim = { name: baseAnim, frames: 4, speed: 0.15, loop: true };
    if (this.state === 'attack' || this.state === 'spin') {
      this.anim.frames = 3;
      this.anim.loop = false;
    }
    if (this.state === 'dash') {
      this.anim.frames = 1;
      this.anim.loop = false;
    }
  }

  // Sword hitbox for collision with enemies
  getSwordHitbox() {
    if (this.state !== 'attack' && this.state !== 'spin') return null;
    const range = 18;
    const w = 16, h = 16;
    let x = this.x, y = this.y;
    if (this.facing === 'right') { x += 14; y -= 3; }
    else if (this.facing === 'left') { x -= 14; y -= 3; }
    else if (this.facing === 'down') { x -= 3; y += 14; }
    else { x -= 3; y -= 14; }
    return new RectHitbox(x, y, w, h);
  }

  // Spin attack hitbox (circle around player)
  getSpinHitbox() {
    if (this.state !== 'spin') return null;
    return { x: this.x + 8, y: this.y + 8, r: 24 };
  }

  draw(ctx, camera) {
    super.draw(ctx, camera);

    // Draw sword swing
    if (this.state === 'attack' && this.sprites) {
      const sword = this.sprites[`sword_${this.facing}`];
      if (sword) {
        const { x: camX, y: camY } = camera.getRenderOffset();
        let sx = this.x - camX, sy = this.y - camY;
        if (this.facing === 'right') sx += 12;
        else if (this.facing === 'left') sx -= 12;
        else if (this.facing === 'down') sy += 12;
        else sy -= 12;
        ctx.drawImage(sword[0], sx, sy);
      }
    }
  }
}// rebuild
