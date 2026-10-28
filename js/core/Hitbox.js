// ============================================================
// LARAMIE — core/Hitbox.js
// Circle hitbox with sliding collision against tilemap
// ============================================================
export const TILE = 16;

export class Hitbox {
  constructor(x, y, radius) {
    this.x = x; this.y = y; this.r = radius;
    this.solidTiles = new Set();
  }

  // Check if a tile coordinate is solid
  static tileSolid(tx, ty, tilemap, solidSet) {
    if (!tilemap) return false;
    if (tx < 0 || ty < 0 || tx >= tilemap.w || ty >= tilemap.h) return true;

    let tid = 0;
    if (typeof tilemap.getTile === 'function') {
      // ScreenMap / modern API: prefer obj layer, fall back to base
      tid = tilemap.getTile(tx, ty, 'obj') || tilemap.getTile(tx, ty, 'base') || 0;
    } else if (tilemap.data) {
      // legacy 2D or flat
      const row = tilemap.data[ty];
      tid = Array.isArray(row) ? (row[tx] || 0) : (tilemap.data[ty * tilemap.w + tx] || 0);
    } else if (tilemap.objData || tilemap.baseData) {
      const idx = ty * tilemap.w + tx;
      tid = (tilemap.objData && tilemap.objData[idx]) || (tilemap.baseData && tilemap.baseData[idx]) || 0;
    }
    if (!tid) return false;
    return solidSet.has(tid);
  }

  // Try to move by (dx, dy), sliding along walls
  // Returns actual movement applied {x, y}
  move(dx, dy, tilemap, solidSet) {
    if (dx === 0 && dy === 0) return { x: 0, y: 0 };

    let movedX = 0, movedY = 0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2; // sub-pixel steps
    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 0; i < steps; i++) {
      const nx = this.x + stepX;
      const ny = this.y + stepY;

      // Check X movement
      let canMoveX = true;
      if (stepX !== 0) {
        const tx = Math.floor((nx + Math.sign(stepX) * this.r) / TILE);
        const ty1 = Math.floor((this.y - this.r) / TILE);
        const ty2 = Math.floor((this.y + this.r) / TILE);
        for (let ty = ty1; ty <= ty2; ty++) {
          if (Hitbox.tileSolid(tx, ty, tilemap, solidSet)) { canMoveX = false; break; }
        }
      }

      // Check Y movement
      let canMoveY = true;
      if (stepY !== 0) {
        const ty = Math.floor((ny + Math.sign(stepY) * this.r) / TILE);
        const tx1 = Math.floor((this.x - this.r) / TILE);
        const tx2 = Math.floor((this.x + this.r) / TILE);
        for (let tx = tx1; tx <= tx2; tx++) {
          if (Hitbox.tileSolid(tx, ty, tilemap, solidSet)) { canMoveY = false; break; }
        }
      }

      if (canMoveX) { this.x = nx; movedX += stepX; }
      if (canMoveY) { this.y = ny; movedY += stepY; }

      if (!canMoveX && !canMoveY) break;
    }

    return { x: movedX, y: movedY };
  }

  // Direct position set (for spawn/warp)
  setPosition(x, y) { this.x = x; this.y = y; }

  // Get tile coordinate of center
  getTilePos() {
    return { tx: Math.floor(this.x / TILE), ty: Math.floor(this.y / TILE) };
  }

  // Debug draw
  draw(ctx, color = '#ff0000') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Axis-separated collision for entities (rect-based alternative)
export class RectHitbox {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
  get left() { return this.x; }
  get right() { return this.x + this.w; }
  get top() { return this.y; }
  get bottom() { return this.y + this.h; }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  move(dx, dy, tilemap, solidSet) {
    let movedX = 0, movedY = 0;

    // X axis
    if (dx !== 0) {
      const nx = this.x + dx;
      const tx = Math.floor((dx > 0 ? nx + this.w : nx) / TILE);
      const ty1 = Math.floor(this.y / TILE);
      const ty2 = Math.floor((this.y + this.h - 1) / TILE);
      let blocked = false;
      for (let ty = ty1; ty <= ty2; ty++) {
        if (Hitbox.tileSolid(tx, ty, tilemap, solidSet)) { blocked = true; break; }
      }
      if (!blocked) { this.x = nx; movedX = dx; }
    }

    // Y axis
    if (dy !== 0) {
      const ny = this.y + dy;
      const ty = Math.floor((dy > 0 ? ny + this.h : ny) / TILE);
      const tx1 = Math.floor(this.x / TILE);
      const tx2 = Math.floor((this.x + this.w - 1) / TILE);
      let blocked = false;
      for (let tx = tx1; tx <= tx2; tx++) {
        if (Hitbox.tileSolid(tx, ty, tilemap, solidSet)) { blocked = true; break; }
      }
      if (!blocked) { this.y = ny; movedY = dy; }
    }

    return { x: movedX, y: movedY };
  }

  overlaps(other) {
    return this.x < other.x + other.w &&
           this.x + this.w > other.x &&
           this.y < other.y + other.h &&
           this.y + this.h > other.y;
  }

  draw(ctx, color = '#00ff00') {
    ctx.strokeStyle = color;
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
}