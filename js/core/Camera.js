// ============================================================
// LARAMIE — core/Camera.js
// Smooth follow camera with deadzone and screen transitions
// ============================================================
export const PF_W = 256, PF_H = 176; // playfield size (16×11 tiles)

export class Camera {
  constructor(worldW, worldH) {
    this.x = 0; this.y = 0;
    this.targetX = 0; this.targetY = 0;
    this.worldW = worldW; this.worldH = worldH;
    this.deadzone = 32; // pixels player can move before camera follows
    this.lerp = 0.15;   // follow smoothness
    this.transitioning = false;
    this.transition = null; // { dir, targetX, targetY, progress, duration }
  }

  // Call when player position updates
  follow(px, py) {
    if (this.transitioning) return;
    this.targetX = Math.max(0, Math.min(this.worldW - PF_W, px - PF_W / 2));
    this.targetY = Math.max(0, Math.min(this.worldH - PF_H, py - PF_H / 2));
  }

  // Instant snap (for spawn/warp)
  snap(px, py) {
    this.x = Math.max(0, Math.min(this.worldW - PF_W, px - PF_W / 2));
    this.y = Math.max(0, Math.min(this.worldH - PF_H, py - PF_H / 2));
    this.targetX = this.x; this.targetY = this.y;
  }

  // Start screen transition (LTTP style)
  startTransition(dir, duration = 24) {
    if (this.transitioning) return false;
    this.transitioning = true;
    let tx = this.x, ty = this.y;
    if (dir === 'e') tx += PF_W;
    else if (dir === 'w') tx -= PF_W;
    else if (dir === 's') ty += PF_H;
    else if (dir === 'n') ty -= PF_H;
    tx = Math.max(0, Math.min(this.worldW - PF_W, tx));
    ty = Math.max(0, Math.min(this.worldH - PF_H, ty));
    this.transition = { dir, startX: this.x, startY: this.y, targetX: tx, targetY: ty, t: 0, duration };
    return true;
  }

  update() {
    if (this.transitioning && this.transition) {
      const tr = this.transition;
      tr.t++;
      const p = tr.t / tr.duration;
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      this.x = tr.startX + (tr.targetX - tr.startX) * eased;
      this.y = tr.startY + (tr.targetY - tr.startY) * eased;
      if (tr.t >= tr.duration) {
        this.x = tr.targetX; this.y = tr.targetY;
        this.transitioning = false; this.transition = null;
        return true; // transition complete
      }
      return false;
    }

    // Smooth follow
    this.x += (this.targetX - this.x) * this.lerp;
    this.y += (this.targetY - this.y) * this.lerp;

    // Clamp
    this.x = Math.max(0, Math.min(this.worldW - PF_W, this.x));
    this.y = Math.max(0, Math.min(this.worldH - PF_H, this.y));
    return false;
  }

  // Get render offset (integer for crisp pixels)
  getRenderOffset() {
    return { x: Math.round(this.x), y: Math.round(this.y) };
  }

  // Check if point is visible
  isVisible(x, y, margin = 32) {
    return x >= this.x - margin && x <= this.x + PF_W + margin &&
           y >= this.y - margin && y <= this.y + PF_H + margin;
  }
}