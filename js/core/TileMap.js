// TileMap.js – simple tilemap using procedural sprites from SPR.tiles
import { TILE } from './Hitbox.js';
import { SPR } from './Sprites.js';

// Tile ID to sprite name mapping (must match CHAR_TILE numbers)
export const TILE_ID_TO_NAME = {
  1: 'grass', 2: 'flowers', 3: 'sagebrush', 4: 'cottonwood', 5: 'river',
  6: 'sand', 7: 'rock', 8: 'bush', 9: 'path', 10: 'crack', 11: 'bridge',
  12: 'fence', 13: 'hwall', 14: 'hdoor', 15: 'cave', 16: 'stump',
  17: 'roof', 18: 'sign', 19: 'waterfall', 20: 'pond', 21: 'grave',
  22: 'dwall', 23: 'dfloor', 24: 'door_lock', 25: 'door_boss', 26: 'door_shut',
  27: 'stairs', 28: 'dcrack', 29: 'torch', 30: 'statue', 31: 'door_open',
  32: 'wfloor', 33: 'wwall', 34: 'rug', 35: 'counter', 36: 'grave', // duplicate grave ok
  37: 'pond', 38: 'roof', 39: 'sign', 40: 'waterfall',
  41: 'rail', 42: 'telegraph', 43: 'campfire', 44: 'claim_marker',
};

export class TileMap {
  /**
   * @param {number[][]} data 2D array of tile IDs (0 = empty)
   */
  constructor(data) {
    this.data = data;
    this.h = data.length;
    this.w = data[0] ? data[0].length : 0;
    // Set sprite source for static rendering helpers
    TileMap.setSpriteSource(SPR.tiles);
  }

  /** Static setter for sprite map used by render */
  static setSpriteSource(sprites) {
    TileMap._sprites = sprites;
  }

  /** Get tile ID at tile coordinates (tx, ty) */
  getTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return 0;
    return this.data[ty][tx];
  }

  /** Set tile ID at tile coordinates (tx, ty) */
  setTile(tx, ty, value) {
    if (tx >= 0 && ty >= 0 && tx < this.w && ty < this.h) {
      this.data[ty][tx] = value;
    }
  }

  /** Check if tile is solid using SOLID_TILES set (provided externally) */
  isSolid(tx, ty, solidTiles) {
    const tid = this.getTile(tx, ty);
    return solidTiles.has(tid);
  }

  /** Render visible tiles using camera offset */
  render(ctx, camera, solidTiles) {
    const { x: camX, y: camY } = camera.getRenderOffset ? camera.getRenderOffset() : { x: 0, y: 0 };
    const tileSize = TILE;
    const startTx = Math.max(0, Math.floor(camX / tileSize) - 1);
    const endTx = Math.min(this.w, Math.ceil((camX + camera.width) / tileSize) + 1);
    const startTy = Math.max(0, Math.floor(camY / tileSize) - 1);
    const endTy = Math.min(this.h, Math.ceil((camY + camera.height) / tileSize) + 1);

    for (let ty = startTy; ty < endTy; ty++) {
      for (let tx = startTx; tx < endTx; tx++) {
        const tid = this.getTile(tx, ty);
        if (tid === 0) continue;
        const spriteName = TILE_ID_TO_NAME[tid];
        const sprite = TileMap._sprites?.[spriteName];
        if (!sprite) continue;
        ctx.drawImage(sprite, tx * tileSize - camX, ty * tileSize - camY, tileSize, tileSize);
      }
    }
  }
}

/** Simple camera that follows a target with bounds */
export class Camera {
  /**
   * @param {number} worldWidth  width of world in pixels
   * @param {number} worldHeight height of world in pixels
   * @param {number} viewWidth   viewport width (canvas width)
   * @param {number} viewHeight  viewport height (canvas height)
   */
  constructor(worldWidth, worldHeight, viewWidth, viewHeight) {
    this.x = 0;
    this.y = 0;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }

  /** Follow target, keeping it centered but clamping to world bounds */
  follow(targetX, targetY) {
    this.x = targetX - this.viewWidth / 2;
    this.y = targetY - this.viewHeight / 2;
    this.clamp();
  }

  clamp() {
    if (this.x < 0) this.x = 0;
    if (this.x + this.viewWidth > this.worldWidth) this.x = this.worldWidth - this.viewWidth;
    if (this.y < 0) this.y = 0;
    if (this.y + this.viewHeight > this.worldHeight) this.y = this.worldHeight - this.viewHeight;
  }

  /** Get offset to subtract from world coordinates for rendering */
  getRenderOffset() {
    return { x: this.x, y: this.y };
  }
}