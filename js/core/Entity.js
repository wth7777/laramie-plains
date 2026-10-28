// ============================================================
// LARAMIE — core/Entity.js
// Base entity with state machine, animation, hitbox
// ============================================================
import { Hitbox, RectHitbox } from './Hitbox.js';
import { PF_W, PF_H } from './TileMap.js';

export class Entity {
  constructor(x, y, hitbox) {
    this.x = x; this.y = y;
    this.hitbox = hitbox || new RectHitbox(x, y, 16, 16);
    this.vx = 0; this.vy = 0;
    this.speed = 80; // px/sec
    this.facing = 'down';
    this.state = 'idle';
    this.stateTime = 0;
    this.anim = null;
    this.animFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 0.15; // sec per frame
    this.sprites = null; // set by subclass
    this.invincible = 0;
    this.health = 3;
    this.maxHealth = 3;
    this.dead = false;
    this.solid = true;
  }

  // State machine
  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateTime = 0;
      this.animFrame = 0;
      this.animTimer = 0;
      this.updateAnim();
    }
  }

  updateAnim() {
    // Override in subclasses to set this.anim based on state and facing
  }

  update(dt, tilemap, solidTiles) {
    this.stateTime += dt;

    // Invincibility flash
    if (this.invincible > 0) this.invincible -= dt;

    // Update animation
    if (this.anim && this.anim.frames > 1) {
      this.animTimer += dt;
      if (this.animTimer >= this.animSpeed) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % this.anim.frames;
      }
    }

    // State-specific logic
    this[`update_${this.state}`]?.(dt, tilemap, solidTiles);

    // Sync hitbox
    this.hitbox.x = this.x;
    this.hitbox.y = this.y;
  }

  // Default state updates (override in subclass)
  update_idle(dt) {}
  update_walk(dt, tilemap, solidTiles) {}
  update_attack(dt) { if (this.stateTime > 0.3) this.setState('idle'); }
  update_hurt(dt) { if (this.stateTime > 0.5) this.setState('idle'); }
  update_dead(dt) {}

  // Movement helper: try to move, returns actual movement
  move(dx, dy, tilemap, solidTiles) {
    const m = this.hitbox.move(dx, dy, tilemap, solidTiles);
    this.x += m.x;
    this.y += m.y;
    // Sync hitbox (it may have been moved partially due to collision)
    this.hitbox.x = this.x;
    this.hitbox.y = this.y;
    return m;
  }

  // Take damage
  hurt(damage, knockbackX = 0, knockbackY = 0) {
    if (this.invincible > 0 || this.dead) return false;
    this.health -= damage;
    this.invincible = 1.0;
    if (this.health <= 0) { this.die(); return true; }
    this.setState('hurt');
    this.vx = knockbackX; this.vy = knockbackY;
    return true;
  }

  die() { this.dead = true; this.setState('dead'); }

  // Get current sprite frame
  getSprite() {
    if (!this.sprites || !this.anim) return null;
    const key = `${this.anim.name}_${this.facing}`;
    const frames = this.sprites[key];
    if (!frames || !frames.length) return null;
    return frames[this.animFrame % frames.length];
  }

  // Draw
  draw(ctx, camera) {
    if (this.dead && this.stateTime > 1) return;
    const sprite = this.getSprite();
    if (!sprite) return;

    const { x: camX, y: camY } = camera.getRenderOffset();
    const drawX = this.x - camX;
    const drawY = this.y - camY;

    // Invincibility flash
    if (this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0) return;

    ctx.drawImage(sprite, drawX, drawY);
  }

  // Debug draw hitbox
  drawDebug(ctx, camera) {
    this.hitbox.draw(ctx, '#00ff00');
  }
}

// Animation definition
export class Animation {
  constructor(name, frames, speed = 0.15, loop = true) {
    this.name = name; this.frames = frames; this.speed = speed; this.loop = loop;
  }
}