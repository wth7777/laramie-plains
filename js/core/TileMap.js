// ============================================================
// LARAMIE — core/TileMap.js
// Layered tilemap with autotiling, loads from JSON
// ============================================================
import { TILE } from './Hitbox.js';

export class TileMap {
  constructor(data) {
    this.w = data.width;
    this.h = data.height;
    this.data = data.layers[0].data; // base layer (ground)
    this.fgData = data.layers[1]?.data || null; // foreground layer
    this.objData = data.layers[2]?.data || null; // object/collision layer
    this.tileset = data.tilesets[0];
    this.tileImage = null;
    this.animFrames = {};
  }

  // Load tileset image
  async loadTileset(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { this.tileImage = img; resolve(); };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  // Get tile ID at tile coordinates
  getTile(tx, ty, layer = 'base') {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return 0;
    const d = layer === 'fg' ? this.fgData : (layer === 'obj' ? this.objData : this.data);
    return d ? d[ty * this.w + tx] : 0;
  }

  // Set tile (for dynamic changes like opening doors)
  setTile(tx, ty, id, layer = 'base') {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return;
    if (layer === 'fg') this.fgData?.[ty * this.w + tx] = id;
    else if (layer === 'obj') this.objData?.[ty * this.w + tx] = id;
    else this.data[ty * this.w + tx] = id;
  }

  // Check if tile is solid (uses object layer or base)
  isSolid(tx, ty, solidTiles) {
    const tid = this.getTile(tx, ty, 'obj') || this.getTile(tx, ty, 'base');
    return solidTiles.has(tid);
  }

  // Autotile edges for a tile (returns source rect in tileset)
  // Simplified: returns base tile, edge detection can be added
  getTileRect(tid) {
    if (!this.tileset) return null;
    const cols = this.tileset.columns || 16;
    const tx = (tid - this.tileset.firstgid) % cols;
    const ty = Math.floor((tid - this.tileset.firstgid) / cols);
    return { sx: tx * TILE, sy: ty * TILE, w: TILE, h: TILE };
  }

  // Render visible portion
  // Use procedural sprites from SPR.tiles
  static setSpriteSource(sprites) { TileMap._sprites = sprites; }

  render(ctx, camera, layers = ['base', 'fg']) {
    const { x: camX, y: camY } = camera.getRenderOffset();
    const startTx = Math.max(0, Math.floor(camX / TILE) - 1);
    const endTx = Math.min(this.w, Math.ceil((camX + PF_W) / TILE) + 1);
    const startTy = Math.max(0, Math.floor(camY / TILE) - 1);
    const endTy = Math.min(this.h, Math.ceil((camY + PF_H) / TILE) + 1);

    for (const layer of layers) {
      const d = layer === 'fg' ? this.fgData : this.data;
      if (!d) continue;
      for (let ty = startTy; ty < endTy; ty++) {
        for (let tx = startTx; tx < endTx; tx++) {
          const tid = d[ty * this.w + tx];
          if (tid === 0) continue;
          // Map tile ID to sprite name
          const spriteName = TileMap._tileIdToName[tid];
          const sprite = TileMap._sprites?.[spriteName];
          if (!sprite) continue;
          ctx.drawImage(sprite, tx * TILE - camX, ty * TILE - camY, TILE, TILE);
        }
      }
    }
  }

  // Render single layer (for scroll transitions)
  renderLayer(ctx, camera, layer) {
    this.render(ctx, camera, [layer]);
  }
}

// Tile ID to sprite name mapping (CHAR_TILE values -> SPR.tiles keys)
TileMap._tileIdToName = {
  1: 'grass', 2: 'flowers', 3: 'sagebrush', 4: 'cottonwood', 5: 'river',
  6: 'sand', 7: 'rock', 8: 'bush', 9: 'path', 10: 'crack', 11: 'bridge',
  12: 'fence', 13: 'hwall', 14: 'hdoor', 15: 'cave', 16: 'stump',
  17: 'roof', 18: 'sign', 19: 'waterfall', 20: 'pond', 21: 'grave',
  22: 'dwall', 23: 'dfloor', 24: 'door_lock', 25: 'door_boss', 26: 'door_shut',
  27: 'stairs', 28: 'dcrack', 29: 'torch', 30: 'statue', 31: 'door_open',
  32: 'wfloor', 33: 'wwall', 34: 'rug', 35: 'counter', 36: 'grave', // duplicate grave
  37: 'pond', 38: 'roof', 39: 'sign', 40: 'waterfall',
  41: 'rail', 42: 'telegraph', 43: 'campfire', 44: 'claim_marker',
};
  const h = worldMap.length;
  const w = worldMap[0].length;
  const baseData = new Array(w * h).fill(0);
  const objData = new Array(w * h).fill(0);

  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const ch = worldMap[ty][tx];
      const tid = charToTile[ch] || 0;
      // Walkable tiles -> base, solid tiles -> obj
      const walkable = ['.', ',', 'S', 'C', '~', 's', 'P', '=', '>', 'w', 'r', 'n', 'h', 'p', 'G', 't', 'A', 'o', '*', 'M', 'T'];
      if (walkable.includes(ch)) baseData[ty * w + tx] = tid;
      else objData[ty * w + tx] = tid;
    }
  }

  return {
    width: w, height: h,
    layers: [
      { name: 'base', data: baseData },
      { name: 'fg', data: [] }, // empty for now
      { name: 'obj', data: objData }
    ],
    tilesets: [tileset]
  };
}

// Screen-sized map (16x11) for individual rooms
export class ScreenMap {
  constructor(tiles, charToTile, tileset) {
    this.w = 16; this.h = 11;
    this.baseData = new Array(176).fill(0);
    this.objData = new Array(176).fill(0);
    this.tileset = tileset;

    for (let ty = 0; ty < 11; ty++) {
      for (let tx = 0; tx < 16; tx++) {
        const ch = tiles[ty][tx];
        const tid = charToTile[ch] || 0;
        const walkable = ['.', ',', 'S', 'C', '~', 's', 'P', '=', '>', 'w', 'r', 'n', 'h', 'p', 'G', 't', 'A', 'o', '*', 'M', 'T', '_', 'D', 'L', 'K', 'Z', 'c', 'f', 'f'];
        if (walkable.includes(ch)) this.baseData[ty * 16 + tx] = tid;
        else this.objData[ty * 16 + tx] = tid;
      }
    }
  }

  getTile(tx, ty, layer = 'base') {
    if (tx < 0 || ty < 0 || tx >= 16 || ty >= 11) return 0;
    return (layer === 'obj' ? this.objData : this.baseData)[ty * 16 + tx];
  }

  setTile(tx, ty, id, layer = 'base') {
    if (tx < 0 || ty < 0 || tx >= 16 || ty >= 11) return;
    if (layer === 'obj') this.objData[ty * 16 + tx] = id;
    else this.baseData[ty * 16 + tx] = id;
  }

  isSolid(tx, ty, solidTiles) {
    const tid = this.getTile(tx, ty, 'obj') || this.getTile(tx, ty, 'base');
    return solidTiles.has(tid);
  }

  getTileRect(tid) {
    if (!this.tileset) return null;
    const cols = this.tileset.columns || 16;
    const tx = (tid - this.tileset.firstgid) % cols;
    const ty = Math.floor((tid - this.tileset.firstgid) / cols);
    return { sx: tx * TILE, sy: ty * TILE, w: TILE, h: TILE };
  }

  // Use procedural sprites from SPR.tiles
  render(ctx, camera, layers = ['base']) {
    const { x: camX, y: camY } = camera.getRenderOffset();
    const startTx = Math.max(0, Math.floor(camX / TILE) - 1);
    const endTx = Math.min(16, Math.ceil((camX + PF_W) / TILE) + 1);
    const startTy = Math.max(0, Math.floor(camY / TILE) - 1);
    const endTy = Math.min(11, Math.ceil((camY + PF_H) / TILE) + 1);

    for (const layer of layers) {
      const d = layer === 'obj' ? this.objData : this.baseData;
      if (!d.length) continue;
      for (let ty = startTy; ty < endTy; ty++) {
        for (let tx = startTx; tx < endTx; tx++) {
          const tid = d[ty * 16 + tx];
          if (tid === 0) continue;
          const spriteName = TileMap._tileIdToName[tid];
          const sprite = TileMap._sprites?.[spriteName];
          if (!sprite) continue;
          ctx.drawImage(sprite, tx * TILE - camX, ty * TILE - camY, TILE, TILE);
        }
      }
    }
  }

  async loadTileset(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { this.tileImage = img; resolve(); };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }
}

// PF_W/PF_H re-export
export const PF_W = 256, PF_H = 176;