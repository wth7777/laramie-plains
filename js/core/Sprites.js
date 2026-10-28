// ============================================================
// LARAMIE — core/Sprites.js
// Procedural sprite generation (LTTP-style, 16x16/16x24)
// ============================================================
export const TILE = 16;
const CACHE = new Map();

function getCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Color palette (LTTP-ish) - Wyoming frontier theme
const COL = {
  // Player (surveyor/fox)
  fur: '#c87838', furDark: '#a05828', furLight: '#e0a068',
  white: '#f8f8f8', black: '#181818', nose: '#281810',
  // Clothes (surveyor's outfit - 1868 frontier)
  shirt: '#4878b8', shirtDark: '#305890', shirtLight: '#6898d8',
  pants: '#383878', pantsDark: '#202058',
  boots: '#281810',
  // Sword
  blade: '#c8c8d0', hilt: '#886838', guard: '#f0d858',
  // UI
  heartFull: '#e83828', heartEmpty: '#481818',
  rupee: '#00e8a8',
};

// ---- Procedural sprite builders ----

export function makeFoxSprites() {
  if (CACHE.has('fox')) return CACHE.get('fox');

  const sprites = {};
  const dirs = ['down', 'up', 'right', 'left'];
  const walkFrames = 4;

  for (const dir of dirs) {
    // Idle (1 frame)
    sprites[`idle_${dir}`] = [drawFox(16, 24, dir, 0, false)];

    // Walk (4 frames)
    const walk = [];
    for (let f = 0; f < walkFrames; f++) {
      walk.push(drawFox(16, 24, dir, f, true));
    }
    sprites[`walk_${dir}`] = walk;

    // Attack (3 frames)
    const atk = [];
    for (let f = 0; f < 3; f++) {
      atk.push(drawFoxAttack(16, 24, dir, f));
    }
    sprites[`attack_${dir}`] = atk;

    // Spin (1 frame, rotated)
    sprites[`spin_${dir}`] = [drawFoxSpin(16, 24, dir)];

    // Hurt (1 frame)
    sprites[`hurt_${dir}`] = [drawFoxHurt(16, 24, dir)];

    // Dash (1 frame, stretched)
    sprites[`dash_${dir}`] = [drawFoxDash(16, 24, dir)];
  }

  // Sword sprites
  for (const dir of dirs) {
    sprites[`sword_${dir}`] = [drawSword(16, 16, dir)];
  }

  CACHE.set('fox', sprites);
  return sprites;
}

function drawFox(w, h, dir, frame, walking) {
  const c = getCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const bob = walking ? Math.sin(frame * Math.PI / 2) * 1.5 : 0;
  const legOffset = walking ? (frame % 2 === 0 ? -1 : 1) * 2 : 0;
  const armOffset = walking ? (frame % 2 === 0 ? 1 : -1) * 1 : 0;

  // Draw shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(8, 22, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawBody(ctx, dir, bob, legOffset, armOffset);

  return c;
}

function drawBody(ctx, dir, bob, legOffset, armOffset = 0) {
  const cx = 8, cy = 14 + bob;

  // Legs
  ctx.fillStyle = COL.furDark;
  if (dir === 'down' || dir === 'up') {
    ctx.fillRect(cx - 4, cy + 6 + legOffset, 3, 5);
    ctx.fillRect(cx + 1, cy + 6 - legOffset, 3, 5);
    // Boots
    ctx.fillStyle = COL.boots;
    ctx.fillRect(cx - 4, cy + 11 + legOffset, 3, 2);
    ctx.fillRect(cx + 1, cy + 11 - legOffset, 3, 2);
  } else {
    ctx.fillRect(cx - 3, cy + 6, 3, 5);
    ctx.fillRect(cx, cy + 6, 3, 5);
    // Boots
    ctx.fillStyle = COL.boots;
    ctx.fillRect(cx - 3, cy + 11, 3, 2);
    ctx.fillRect(cx, cy + 11, 3, 2);
  }

  // Tail
  ctx.fillStyle = COL.fur;
  if (dir === 'down') {
    ctx.fillRect(cx + 5, cy - 2, 4, 8);
  } else if (dir === 'up') {
    ctx.fillRect(cx - 9, cy - 2, 4, 8);
  } else if (dir === 'right') {
    ctx.fillRect(cx + 6, cy - 2, 8, 4);
  } else {
    ctx.fillRect(cx - 14, cy - 2, 8, 4);
  }

  // Body with outline
  ctx.fillStyle = COL.fur;
  ctx.fillRect(cx - 4, cy - 6, 8, 10);
  // Body outline
  ctx.strokeStyle = COL.furDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 4.5, cy - 6.5, 9, 11);

  // Shirt
  ctx.fillStyle = COL.shirt;
  ctx.fillRect(cx - 3, cy - 4, 6, 7);
  ctx.strokeStyle = COL.shirtDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 3.5, cy - 4.5, 7, 8);

  // Arms
  ctx.fillStyle = COL.shirt;
  if (dir === 'down') {
    ctx.fillRect(cx - 6, cy - 3 + armOffset, 3, 6);
    ctx.fillRect(cx + 3, cy - 3 - armOffset, 3, 6);
    ctx.strokeStyle = COL.shirtDark;
    ctx.strokeRect(cx - 6.5, cy - 3.5 + armOffset, 4, 7);
    ctx.strokeRect(cx + 2.5, cy - 3.5 - armOffset, 4, 7);
  } else if (dir === 'up') {
    ctx.fillRect(cx - 6, cy - 4 + armOffset, 3, 5);
    ctx.fillRect(cx + 3, cy - 4 - armOffset, 3, 5);
    ctx.strokeStyle = COL.shirtDark;
    ctx.strokeRect(cx - 6.5, cy - 4.5 + armOffset, 4, 6);
    ctx.strokeRect(cx + 2.5, cy - 4.5 - armOffset, 4, 6);
  } else if (dir === 'right') {
    ctx.fillRect(cx + 4, cy - 4, 4, 5);
    ctx.fillRect(cx - 6, cy - 4 + armOffset, 3, 5);
    ctx.strokeStyle = COL.shirtDark;
    ctx.strokeRect(cx + 3.5, cy - 4.5, 5, 6);
    ctx.strokeRect(cx - 6.5, cy - 4.5 + armOffset, 4, 6);
  } else {
    ctx.fillRect(cx - 8, cy - 4, 4, 5);
    ctx.fillRect(cx + 2, cy - 4 + armOffset, 3, 5);
    ctx.strokeStyle = COL.shirtDark;
    ctx.strokeRect(cx - 8.5, cy - 4.5, 5, 6);
    ctx.strokeRect(cx + 1.5, cy - 4.5 + armOffset, 4, 6);
  }

  // Head
  ctx.fillStyle = COL.fur;
  ctx.fillRect(cx - 4, cy - 14, 8, 8);
  ctx.strokeStyle = COL.furDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 4.5, cy - 14.5, 9, 9);

  // Ears
  ctx.fillStyle = COL.fur;
  ctx.fillRect(cx - 5, cy - 16, 3, 4);
  ctx.fillRect(cx + 2, cy - 16, 3, 4);
  ctx.strokeStyle = COL.furDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 5.5, cy - 16.5, 4, 5);
  ctx.strokeRect(cx + 1.5, cy - 16.5, 4, 5);
  // Ear insides
  ctx.fillStyle = COL.furLight;
  ctx.fillRect(cx - 4, cy - 15, 1, 2);
  ctx.fillRect(cx + 3, cy - 15, 1, 2);

  // Face details
  ctx.fillStyle = COL.white;
  // Eyes
  if (dir === 'down') {
    ctx.fillRect(cx - 3, cy - 11, 2, 2);
    ctx.fillRect(cx + 1, cy - 11, 2, 2);
    ctx.fillStyle = COL.black;
    ctx.fillRect(cx - 2, cy - 10, 1, 1);
    ctx.fillRect(cx + 2, cy - 10, 1, 1);
  } else if (dir === 'up') {
    ctx.fillRect(cx - 3, cy - 12, 2, 2);
    ctx.fillRect(cx + 1, cy - 12, 2, 2);
  } else if (dir === 'right') {
    ctx.fillRect(cx, cy - 11, 2, 2);
    ctx.fillRect(cx, cy - 8, 2, 2);
  } else {
    ctx.fillRect(cx - 2, cy - 11, 2, 2);
    ctx.fillRect(cx - 2, cy - 8, 2, 2);
  }

  // Nose
  ctx.fillStyle = COL.nose;
  if (dir === 'down') ctx.fillRect(cx - 1, cy - 8, 2, 1);
  else if (dir === 'up') ctx.fillRect(cx - 1, cy - 7, 2, 1);
  else if (dir === 'right') ctx.fillRect(cx + 3, cy - 9, 1, 2);
  else ctx.fillRect(cx - 4, cy - 9, 1, 2);
}

function drawFoxAttack(w, h, dir, frame) {
  const c = getCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const progress = frame / 2;
  drawBody(ctx, dir, 0, 0);

  // Sword arm extended
  ctx.fillStyle = COL.shirt;
  const cx = 8, cy = 14;
  if (dir === 'right') {
    ctx.fillRect(cx + 4, cy - 4, 8 + progress * 6, 3);
  } else if (dir === 'left') {
    ctx.fillRect(cx - 12 - progress * 6, cy - 4, 8 + progress * 6, 3);
  } else if (dir === 'down') {
    ctx.fillRect(cx - 1, cy + 4, 3, 8 + progress * 6);
  } else {
    ctx.fillRect(cx - 1, cy - 12 - progress * 6, 3, 8 + progress * 6);
  }

  return c;
}

function drawFoxSpin(w, h, dir) {
  const c = getCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Spin = body rotated 45 deg visually, sword circle
  drawBody(ctx, dir, 0, 0);

  // Sword blur circle
  ctx.strokeStyle = COL.blade;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(8, 14, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  return c;
}

function drawFoxHurt(w, h, dir) {
  const c = getCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Flash white
  drawBody(ctx, dir, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  return c;
}

function drawFoxDash(w, h, dir) {
  const c = getCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Stretched with motion lines
  drawBody(ctx, dir, 0, 0);

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 3; i++) {
    const offset = (i + 1) * 4;
    if (dir === 'right') ctx.beginPath(), ctx.moveTo(0 - offset, 14), ctx.lineTo(4 - offset, 14), ctx.stroke();
    else if (dir === 'left') ctx.beginPath(), ctx.moveTo(16 + offset, 14), ctx.lineTo(12 + offset, 14), ctx.stroke();
    else if (dir === 'down') ctx.beginPath(), ctx.moveTo(8, 24 + offset), ctx.lineTo(8, 20 + offset), ctx.stroke();
    else ctx.beginPath(), ctx.moveTo(8, 0 - offset), ctx.lineTo(8, 4 - offset), ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return c;
}

function drawSword(w, h, dir) {
  const c = getCanvas(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const cx = 8, cy = 8;
  ctx.fillStyle = COL.hilt;
  ctx.fillStyle = COL.guard;
  ctx.fillStyle = COL.blade;

  if (dir === 'right') {
    ctx.fillRect(cx, cy - 1, 10, 2); // blade
    ctx.fillRect(cx, cy - 2, 2, 4); // guard
    ctx.fillRect(cx - 2, cy - 1, 2, 2); // hilt
  } else if (dir === 'left') {
    ctx.fillRect(cx - 10, cy - 1, 10, 2);
    ctx.fillRect(cx - 2, cy - 2, 2, 4);
    ctx.fillRect(cx, cy - 1, 2, 2);
  } else if (dir === 'down') {
    ctx.fillRect(cx - 1, cy, 2, 10);
    ctx.fillRect(cx - 2, cy, 4, 2);
    ctx.fillRect(cx - 1, cy + 10, 2, 2);
  } else {
    ctx.fillRect(cx - 1, cy - 10, 2, 10);
    ctx.fillRect(cx - 2, cy - 10, 4, 2);
    ctx.fillRect(cx - 1, cy - 12, 2, 2);
  }

  return c;
}

// ---- Tile sprites (biome tiles) ----
export function makeTileSprites() {
  if (CACHE.has('tiles')) return CACHE.get('tiles');

  const sprites = {};
  const biomeTiles = [
    'grass', 'flowers', 'sagebrush', 'cottonwood', 'river', 'sand', 'rock', 'bush',
    'path', 'crack', 'bridge', 'fence', 'hwall', 'hdoor', 'cave', 'stump',
    'dwall', 'dfloor', 'door_lock', 'door_boss', 'door_shut', 'stairs', 'dcrack', 'torch', 'statue', 'door_open',
    'wfloor', 'wwall', 'rug', 'counter', 'grave', 'pond', 'roof', 'sign', 'waterfall',
    'rail', 'telegraph', 'campfire', 'claim_marker'
  ];

  for (const name of biomeTiles) {
    sprites[name] = drawTile(name);
  }

  CACHE.set('tiles', sprites);
  return sprites;
}

function drawTile(name) {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Specific tile rendering
  switch (name) {
    case 'grass':
      return drawGrassTile();
    case 'path':
      return drawPathTile();
    case 'sagebrush':
      return drawSagebrushTile();
    case 'bush':
      return drawBushTile();
    case 'rock':
      return drawRockTile();
    case 'river':
      return drawRiverTile();
    case 'sand':
      return drawSandTile();
    case 'cottonwood':
      return drawCottonwoodTile();
    case 'flowers':
      return drawFlowersTile();
    case 'fence':
      return drawFenceTile();
    case 'hwall':
      return drawHWallTile();
    case 'hdoor':
      return drawHDoorTile();
    case 'cave':
      return drawCaveTile();
    case 'stump':
      return drawStumpTile();
    case 'dwall':
      return drawDWallTile();
    case 'dfloor':
      return drawDFloorTile();
    case 'door_lock':
      return drawDoorLockTile();
    case 'door_boss':
      return drawDoorBossTile();
    case 'door_shut':
      return drawDoorShutTile();
    case 'stairs':
      return drawStairsTile();
    case 'dcrack':
      return drawDCrackTile();
    case 'torch':
      return drawTorchTile();
    case 'statue':
      return drawStatueTile();
    case 'door_open':
      return drawDoorOpenTile();
    case 'wfloor':
      return drawWFloorTile();
    case 'wwall':
      return drawWWallTile();
    case 'rug':
      return drawRugTile();
    case 'counter':
      return drawCounterTile();
    case 'grave':
      return drawGraveTile();
    case 'pond':
      return drawPondTile();
    case 'roof':
      return drawRoofTile();
    case 'sign':
      return drawSignTile();
    case 'waterfall':
      return drawWaterfallTile();
    case 'rail':
      return drawRailTile();
    case 'telegraph':
      return drawTelegraphTile();
    case 'campfire':
      return drawCampfireTile();
    case 'claim_marker':
      return drawClaimMarkerTile();
    case 'cottonwood':
      return drawCottonwoodTile();
    default:
      return drawDefaultTile(name);
  }
}

function drawGrassTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Base grass
  ctx.fillStyle = '#3a6b3a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Grass blades - deterministic pattern
  ctx.fillStyle = '#4a8b4a';
  const blades = [
    [2, 14, 1, 3], [4, 13, 1, 4], [6, 14, 1, 3], [8, 12, 1, 5],
    [10, 13, 1, 4], [12, 14, 1, 3], [14, 13, 1, 4],
    [1, 10, 1, 3], [3, 9, 1, 4], [5, 10, 1, 3], [7, 8, 1, 5],
    [9, 9, 1, 4], [11, 10, 1, 3], [13, 9, 1, 4],
    [2, 6, 1, 3], [4, 5, 1, 4], [6, 6, 1, 3], [8, 5, 1, 5],
    [10, 6, 1, 3], [12, 5, 1, 4], [14, 6, 1, 3],
    [1, 2, 1, 3], [3, 1, 1, 4], [5, 2, 1, 3], [7, 1, 1, 5],
    [9, 2, 1, 4], [11, 1, 1, 3], [13, 2, 1, 4]
  ];
  ctx.fillStyle = '#4a8b4a';
  for (const [x, y, w, h] of blades) {
    ctx.fillRect(x, y, w, h);
  }
  
  // Lighter grass highlights
  ctx.fillStyle = '#5a9b5a';
  const highlights = [
    [3, 13], [5, 12], [7, 13], [9, 11], [11, 12], [13, 11],
    [2, 9], [4, 8], [6, 9], [8, 7], [10, 8], [12, 8], [14, 8],
    [2, 5], [4, 4], [6, 5], [8, 4], [10, 5], [12, 4], [14, 4],
    [2, 1], [4, 0], [6, 1], [8, 0], [10, 1], [12, 0], [14, 1]
  ];
  for (const [x, y] of highlights) {
    ctx.fillRect(x, y, 1, 1);
  }
  
  return c;
}

function drawPathTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Base dirt
  ctx.fillStyle = '#a89878';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Dirt texture
  ctx.fillStyle = '#b8a888';
  const lightSpots = [
    [1, 1], [3, 2], [5, 1], [7, 2], [9, 1], [11, 2], [13, 1], [14, 2],
    [2, 4], [4, 3], [6, 4], [8, 3], [10, 4], [12, 3], [14, 4],
    [1, 5], [3, 4], [5, 5], [7, 4], [9, 5], [11, 4], [13, 5],
    [2, 7], [4, 6], [6, 7], [8, 6], [10, 7], [12, 6], [14, 7],
    [1, 8], [3, 7], [5, 8], [7, 7], [9, 8], [11, 7], [13, 8],
    [2, 10], [4, 9], [6, 10], [8, 9], [10, 10], [12, 9], [14, 10],
    [1, 11], [3, 10], [5, 11], [7, 10], [9, 11], [11, 10], [13, 11],
    [2, 13], [4, 12], [6, 13], [8, 12], [10, 13], [12, 12], [14, 13]
  ];
  ctx.fillStyle = '#b8a888';
  for (const [x, y] of lightSpots) {
    ctx.fillRect(x, y, 1, 1);
  }
  
  // Darker dirt spots
  ctx.fillStyle = '#988868';
  const darkSpots = [
    [0, 0], [2, 1], [4, 0], [6, 1], [8, 0], [10, 1], [10, 1], [12, 0], [14, 1],
    [1, 3], [3, 2], [5, 3], [7, 2], [9, 3], [11, 2], [13, 3], [15, 2],
    [0, 5], [2, 4], [4, 5], [6, 4], [8, 5], [10, 4], [12, 5], [14, 4],
    [1, 7], [3, 6], [5, 7], [7, 6], [9, 7], [11, 6], [13, 7], [15, 6],
    [0, 9], [2, 8], [4, 9], [6, 8], [8, 9], [10, 8], [12, 9], [14, 8],
    [1, 11], [3, 10], [5, 11], [7, 10], [9, 11], [11, 10], [13, 11], [15, 10],
    [0, 13], [2, 12], [4, 13], [6, 12], [8, 13], [10, 12], [12, 13], [14, 12],
    [1, 15], [3, 14], [5, 15], [7, 14], [9, 15], [11, 14], [13, 15]
  ];
  for (const [x, y] of darkSpots) {
    if (x < TILE && y < TILE) ctx.fillRect(x, y, 1, 1);
  }
  
  // Edge darkening for path edges
  ctx.fillStyle = '#887858';
  for (let x = 0; x < TILE; x++) {
    ctx.fillRect(x, 0, 1, 1);
    ctx.fillRect(x, TILE - 1, 1, 1);
  }
  for (let y = 0; y < TILE; y++) {
    ctx.fillRect(0, y, 1, 1);
    ctx.fillRect(TILE - 1, y, 1, 1);
  }
  
  return c;
}

function drawSagebrushTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#3a6b3a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Sagebrush clumps
  const clumps = [
    {x: 3, y: 10, w: 6, h: 5, color: '#5a7a4a'},
    {x: 10, y: 8, w: 5, h: 6, color: '#6a8a5a'},
    {x: 14, y: 12, w: 4, h: 4, color: '#4a6a3a'},
    {x: 2, y: 3, w: 4, h: 5, color: '#5a7a4a'},
    {x: 11, y: 2, w: 3, h: 4, color: '#4a6a3a'},
    {x: 5, y: 13, w: 5, h: 4, color: '#5a7a4a'},
    {x: 8, y: 14, w: 4, h: 3, color: '#6a8a5a'}
  ];
  
  for (const clump of clumps) {
    ctx.fillStyle = clump.color;
    ctx.fillRect(clump.x, clump.y, clump.w, clump.h);
    // Highlight
    ctx.fillStyle = '#7a9a6a';
    ctx.fillRect(clump.x + 1, clump.y + 1, Math.max(1, clump.w - 2), Math.max(1, clump.h - 2));
  }
  
  return c;
}

function drawBushTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#1a4a1a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Bush mound
  ctx.fillStyle = '#2a5a2a';
  ctx.fillRect(2, 4, 12, 10);
  ctx.fillRect(3, 2, 10, 12);
  ctx.fillRect(1, 6, 14, 8);
  
  // Highlights
  ctx.fillStyle = '#3a7a3a';
  ctx.fillRect(4, 4, 10, 4);
  ctx.fillRect(4, 4, 4, 8);
  ctx.fillRect(8, 4, 4, 8);
  ctx.fillRect(3, 3, 8, 2);
  ctx.fillRect(5, 2, 6, 2);
  
  // Darker base
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(2, 10, 12, 4);
  
  return c;
}

function drawRockTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Base rock
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Rock shape
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(2, 2, 12, 12);
  ctx.fillRect(4, 1, 8, 1);
  ctx.fillRect(1, 4, 1, 8);
  ctx.fillRect(14, 4, 1, 8);
  ctx.fillRect(4, 14, 8, 1);
  
  // Highlights
  ctx.fillStyle = '#6a6a6a';
  ctx.fillRect(3, 3, 2, 2);
  ctx.fillRect(6, 3, 3, 2);
  ctx.fillRect(9, 3, 2, 2);
  ctx.fillRect(3, 6, 1, 1);
  ctx.fillRect(12, 6, 1, 1);
  ctx.fillRect(3, 12, 2, 1);
  ctx.fillRect(10, 12, 2, 1);
  
  // Darker cracks
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(4, 6, 1, 1);
  ctx.fillRect(8, 8, 1, 1);
  ctx.fillRect(11, 10, 1, 1);
  
  return c;
}

function drawRiverTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Water base
  ctx.fillStyle = '#2a4a8a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Flow lines
  ctx.fillStyle = '#3a6ab8';
  for (let y = 0; y < TILE; y += 3) {
    for (let x = 0; x < TILE; x += 4) {
      const offset = (y * 2) % 4;
      ctx.fillRect((x + offset) % TILE, y, 2, 1);
    }
  }
  
  // Highlights
  ctx.fillStyle = '#4a8ad8';
  for (let y = 1; y < TILE; y += 4) {
    for (let x = 0; x < TILE; x += 5) {
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  // White foam highlights
  ctx.fillStyle = '#8ac8f8';
  ctx.fillRect(3, 3, 1, 1);
  ctx.fillRect(10, 5, 1, 1);
  ctx.fillRect(7, 10, 1, 1);
  ctx.fillRect(12, 12, 1, 1);
  
  return c;
}

function drawSandTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#c8b888';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Sand grains
  const grains = [
    [1, 2, '#d8c898'], [3, 1, '#b8a878'], [5, 3, '#d8c898'],
    [7, 2, '#c8b888'], [9, 1, '#b8a878'], [11, 3, '#d8c898'],
    [13, 2, '#c8b888'], [2, 5], [4, 6], [6, 5], [8, 6],
    [10, 5], [12, 6], [14, 5], [1, 8], [3, 7], [5, 8],
    [7, 7], [9, 8], [11, 7], [13, 8], [2, 10], [4, 11],
    [6, 10], [8, 11], [10, 10], [12, 11], [14, 10],
    [1, 12], [3, 13], [5, 12], [7, 13], [9, 12], [11, 13], [13, 12]
  ];
  
  for (const grain of grains) {
    const x = grain[0], y = grain[1], color = grain[2] || '#d8c898';
    if (x < TILE && y < TILE) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  return c;
}

function drawCottonwoodTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#2a5a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Trunk
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(7, 8, 2, 8);
  ctx.fillRect(6, 14, 4, 2);
  
  // Foliage
  ctx.fillStyle = '#3a6a3a';
  ctx.fillRect(4, 2, 8, 8);
  ctx.fillRect(3, 8, 10, 4);
  
  // Highlights
  ctx.fillStyle = '#4a8a4a';
  ctx.fillRect(6, 4, 4, 4);
  ctx.fillRect(5, 8, 6, 2);
  
  return c;
}

function drawFlowersTile() {
  const c = drawGrassTile();
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Flowers on grass
  const flowers = [
    {x: 3, y: 14, color: '#e84a4a'},
    {x: 12, y: 10, color: '#f8c848'},
    {x: 5, y: 7, color: '#e8a8e8'},
    {x: 10, y: 4, color: '#e84a4a'},
    {x: 14, y: 5, color: '#f8c848'},
    {x: 2, y: 10, color: '#e8a8e8'},
    {x: 8, y: 12, color: '#e84a4a'}
  ];
  
  for (const f of flowers) {
    ctx.fillStyle = f.color;
    ctx.fillRect(f.x, f.y, 2, 2);
    ctx.fillRect(f.x + 1, f.y - 1, 1, 2);
    ctx.fillRect(f.x - 1, f.y, 2, 1);
  }
  
  return c;
}

function drawFenceTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#3a3a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Fence posts
  ctx.fillStyle = '#4a3a2a';
  for (let x = 2; x < TILE; x += 4) {
    ctx.fillRect(x, 2, 2, 12);
  }
  
  // Rails
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(0, 5, TILE, 1);
  ctx.fillRect(0, 10, TILE, 1);
  
  return c;
}

function drawHWallTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Wall base
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Brick pattern
  ctx.fillStyle = '#4a4a4a';
  for (let y = 1; y < TILE; y += 4) {
    for (let x = 0; x < TILE; x += 8) {
      ctx.fillRect(x, y, 7, 3);
    }
  }
  
  // Highlights
  ctx.fillStyle = '#5a5a5a';
  for (let y = 1; y < TILE; y += 4) {
    for (let x = 0; x < TILE; x += 8) {
      ctx.fillRect(x, y, 7, 1);
    }
  }
  
  // Dark mortar
  ctx.fillStyle = '#2a2a2a';
  for (let y = 3; y < TILE; y += 4) {
    ctx.fillRect(0, y, TILE, 1);
  }
  
  return c;
}

function drawHDoorTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Door frame
  ctx.fillStyle = '#5a4a2a';
  ctx.fillRect(4, 0, 8, 16);
  
  // Door
  ctx.fillStyle = '#6a5a3a';
  ctx.fillRect(5, 1, 6, 14);
  
  // Door panels
  ctx.fillStyle = '#5a4a2a';
  ctx.fillRect(5, 2, 6, 5);
  ctx.fillRect(5, 8, 6, 5);
  
  // Knob
  ctx.fillStyle = '#f0d858';
  ctx.fillRect(9, 8, 1, 1);
  
  // Frame highlight
  ctx.fillStyle = '#7a6a4a';
  ctx.fillRect(4, 0, 1, 16);
  ctx.fillRect(11, 0, 1, 16);
  ctx.fillRect(4, 0, 8, 1);
  ctx.fillRect(4, 15, 8, 1);
  
  return c;
}

function drawCaveTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Cave entrance shape
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.ellipse(8, 12, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  return c;
}

function drawStumpTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Stump rings
  ctx.fillStyle = '#5a3a2a';
  ctx.fillRect(4, 4, 8, 8);
  
  // Rings
  ctx.fillStyle = '#6a4a3a';
  ctx.fillRect(5, 5, 6, 1);
  ctx.fillRect(5, 7, 6, 1);
  ctx.fillRect(5, 10, 6, 1);
  
  // Bark texture
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(4, 4, 1, 8);
  ctx.fillRect(11, 4, 1, 8);
  ctx.fillRect(4, 11, 8, 1);
  
  return c;
}

function drawDWallTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Stone brick pattern
  ctx.fillStyle = '#3a3a3a';
  for (let y = 1; y < TILE; y += 5) {
    for (let x = 0; x < TILE; x += 10) {
      ctx.fillRect(x, y, 9, 4);
    }
  }
  
  // Mortar
  ctx.fillStyle = '#1a1a1a';
  for (let y = 0; y < TILE; y += 5) {
    ctx.fillRect(0, y, TILE, 1);
  }
  for (let x = 0; x < TILE; x += 10) {
    ctx.fillRect(x, 0, 1, TILE);
  }
  
  // Highlights
  ctx.fillStyle = '#4a4a4a';
  for (let y = 1; y < TILE; y += 5) {
    for (let x = 0; x < TILE; x += 10) {
      ctx.fillRect(x, y, 9, 1);
    }
  }
  
  return c;
}

function drawDFloorTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Floor tiles
  ctx.fillStyle = '#4a4a4a';
  for (let y = 0; y < TILE; y += 8) {
    for (let x = 0; x < TILE; x += 8) {
      ctx.fillRect(x, y, 8, 8);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x + 1, y + 1, 6, 6);
      ctx.fillStyle = '#4a4a4a';
    }
  }
  
  return c;
}

function drawDoorLockTile() {
  const c = drawHDoorTile();
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Lock
  ctx.fillStyle = '#f0d858';
  ctx.fillRect(8, 7, 2, 2);
  ctx.fillStyle = '#e0c848';
  ctx.fillRect(8, 7, 1, 1);
  
  return c;
}

function drawDoorBossTile() {
  const c = drawHDoorTile();
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Boss door decoration
  ctx.fillStyle = '#e83828';
  ctx.fillRect(6, 4, 4, 2);
  ctx.fillRect(7, 10, 2, 4);
  ctx.fillRect(7, 6, 4, 2);
  
  return c;
}

function drawDoorShutTile() {
  const c = drawHDoorTile();
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Barred door
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(4, 0, 8, 16);
  
  // Bars
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(5, 2, 6, 1);
  ctx.fillRect(5, 5, 6, 1);
  ctx.fillRect(5, 8, 6, 1);
  ctx.fillRect(5, 11, 6, 1);
  ctx.fillRect(5, 14, 6, 1);
  
  return c;
}

function drawStairsTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Steps
  ctx.fillStyle = '#4a4a4a';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(0, 4 + i * 3, TILE, 2);
  }
  
  // Step edges
  ctx.fillStyle = '#2a2a2a';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(0, 3 + i * 3, TILE, 1);
  }
  
  return c;
}

function drawDCrackTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Crack
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(6, 5);
  ctx.lineTo(10, 5);
  ctx.lineTo(8, 0);
  ctx.fill();
  
  ctx.moveTo(8, 16);
  ctx.lineTo(6, 11);
  ctx.lineTo(10, 11);
  ctx.lineTo(8, 16);
  ctx.fill();
  
  ctx.moveTo(0, 8);
  ctx.lineTo(5, 6);
  ctx.lineTo(5, 10);
  ctx.lineTo(0, 8);
  ctx.fill();
  
  ctx.moveTo(16, 8);
  ctx.lineTo(11, 6);
  ctx.lineTo(11, 10);
  ctx.lineTo(16, 8);
  ctx.fill();
  
  return c;
}

function drawTorchTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Torch post
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(7, 8, 2, 8);
  
  // Flame
  ctx.fillStyle = '#f8a838';
  ctx.fillRect(7, 2, 2, 6);
  ctx.fillStyle = '#f8c838';
  ctx.fillRect(7, 2, 1, 4);
  ctx.fillRect(8, 2, 1, 3);
  
  return c;
}

function drawStatueTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Statue base
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(4, 10, 8, 6);
  
  // Statue body
  ctx.fillRect(6, 4, 4, 6);
  
  // Head
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(7, 2, 2, 2);
  
  return c;
}

function drawDoorOpenTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  // Door frame
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Open doorway
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(4, 0, 8, 16);
  
  return c;
}

function drawWFloorTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Wood planks
  ctx.fillStyle = '#4a4a4a';
  for (let y = 0; y < TILE; y += 4) {
    ctx.fillRect(0, y, TILE, 3);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, y + 3, TILE, 1);
    ctx.fillStyle = '#4a4a4a';
  }
  
  // Plank seams
  ctx.fillStyle = '#2a2a2a';
  for (let x = 8; x < TILE; x += 8) {
    ctx.fillRect(x, 0, 1, TILE);
  }
  
  return c;
}

function drawWWallTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#3a2a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Wood planks vertical
  ctx.fillStyle = '#4a3a3a';
  for (let x = 0; x < TILE; x += 4) {
    ctx.fillRect(x, 0, 3, TILE);
    ctx.fillStyle = '#3a2a2a';
    ctx.fillRect(x + 3, 0, 1, TILE);
    ctx.fillStyle = '#4a3a3a';
  }
  
  return c;
}

function drawRugTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Rug pattern
  ctx.fillStyle = '#7a3a2a';
  ctx.fillRect(2, 2, 12, 12);
  
  // Pattern
  ctx.fillStyle = '#8a4a3a';
  for (let y = 3; y < 13; y += 3) {
    for (let x = 3; x < 13; x += 3) {
      ctx.fillRect(x, y, 2, 2);
    }
  }
  
  // Border
  ctx.fillStyle = '#5a2a1a';
  ctx.fillRect(2, 2, 12, 1);
  ctx.fillRect(2, 13, 12, 1);
  ctx.fillRect(2, 2, 1, 12);
  ctx.fillRect(13, 2, 1, 12);
  
  return c;
}

function drawCounterTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Counter top
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(0, 0, TILE, 4);
  
  // Cabinets
  ctx.fillStyle = '#3a3a2a';
  ctx.fillRect(0, 4, TILE, 12);
  
  // Cabinet doors
  ctx.fillStyle = '#4a3a2a';
  for (let x = 2; x < TILE; x += 4) {
    ctx.fillRect(x, 5, 3, 10);
  }
  
  // Handles
  ctx.fillStyle = '#f0d858';
  for (let x = 3; x < TILE; x += 4) {
    ctx.fillRect(x, 9, 1, 1);
  }
  
  return c;
}

function drawGraveTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Grave stone
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(5, 4, 6, 10);
  
  // Rounded top
  ctx.fillRect(5, 4, 6, 2);
  ctx.fillRect(5, 4, 1, 2);
  ctx.fillRect(10, 4, 1, 2);
  
  // Cross
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(7, 5, 2, 6);
  ctx.fillRect(6, 7, 4, 2);
  
  // Inscription lines
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(6, 8, 4, 1);
  ctx.fillRect(6, 10, 4, 1);
  
  return c;
}

function drawPondTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#2a4a6a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Ripples
  ctx.fillStyle = '#3a5a7a';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(8, 8, 4 - i, 2 - i * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Highlights
  ctx.fillStyle = '#5a8a9a';
  ctx.fillRect(6, 6, 2, 1);
  ctx.fillRect(8, 7, 1, 2);
  
  return c;
}

function drawRoofTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#6a2a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Roof tiles
  ctx.fillStyle = '#7a3a3a';
  for (let y = 0; y < TILE; y += 4) {
    for (let x = 0; x < TILE; x += 8) {
      ctx.fillRect(x, y, 7, 3);
    }
  }
  
  // Ridge
  ctx.fillStyle = '#8a4a4a';
  for (let x = 0; x < TILE; x += 8) {
    ctx.fillRect(x, 7, 7, 1);
    ctx.fillRect(x, 15, 7, 1);
  }
  
  // Ridge cap
  ctx.fillStyle = '#5a2a2a';
  ctx.fillRect(0, 7, TILE, 1);
  ctx.fillRect(0, 15, TILE, 1);
  
  return c;
}

function drawSignTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Post
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(7, 4, 2, 12);
  
  // Sign board
  ctx.fillStyle = '#f0d858';
  ctx.fillRect(2, 2, 12, 8);
  
  // Border
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(2, 2, 12, 1);
  ctx.fillRect(2, 9, 12, 1);
  ctx.fillRect(2, 2, 1, 8);
  ctx.fillRect(13, 2, 1, 8);
  
  return c;
}

function drawWaterfallTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#2a4a8a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Water flow
  ctx.fillStyle = '#4a8ad8';
  for (let y = 0; y < TILE; y += 4) {
    ctx.fillRect(6, y, 4, 3);
  }
  
  // Foam
  ctx.fillStyle = '#8ac8f8';
  for (let y = 2; y < TILE; y += 6) {
    ctx.fillRect(5, y, 6, 1);
  }
  
  return c;
}

function drawRailTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Rails
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(4, 0, 2, TILE);
  ctx.fillRect(10, 0, 2, TILE);
  
  // Ties
  ctx.fillStyle = '#3a3a3a';
  for (let y = 2; y < TILE; y += 4) {
    ctx.fillRect(2, y, 12, 1);
  }
  
  return c;
}

function drawTelegraphTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Pole
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(7, 0, 2, 16);
  
  // Cross arms
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(3, 3, 10, 1);
  ctx.fillRect(3, 6, 10, 1);
  ctx.fillRect(3, 9, 10, 1);
  ctx.fillRect(3, 12, 10, 1);
  
  // Wires
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(2, 3);
  ctx.lineTo(14, 3);
  ctx.moveTo(2, 6);
  ctx.lineTo(14, 6);
  ctx.moveTo(2, 9);
  ctx.lineTo(14, 9);
  ctx.moveTo(2, 12);
  ctx.lineTo(14, 12);
  ctx.stroke();
  
  // Insulators
  ctx.fillStyle = '#f0d858';
  ctx.fillRect(2, 2, 2, 2);
  ctx.fillRect(12, 2, 2, 2);
  ctx.fillRect(2, 5, 2, 2);
  ctx.fillRect(12, 5, 2, 2);
  ctx.fillRect(2, 8, 2, 2);
  ctx.fillRect(12, 8, 2, 2);
  ctx.fillRect(2, 11, 2, 2);
  ctx.fillRect(12, 11, 2, 2);
  ctx.fillRect(2, 14, 2, 2);
  ctx.fillRect(12, 14, 2, 2);
  
  return c;
}

function drawCampfireTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#2a1a1a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Fire pit
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(8, 12, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Logs
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(4, 10, 8, 2);
  ctx.fillRect(5, 11, 6, 2);
  
  // Flames
  ctx.fillStyle = '#e86828';
  ctx.fillRect(6, 6, 4, 6);
  ctx.fillRect(5, 8, 2, 4);
  ctx.fillRect(9, 8, 2, 4);
  
  ctx.fillStyle = '#f8a838';
  ctx.fillRect(7, 4, 2, 4);
  ctx.fillRect(6, 7, 1, 3);
  ctx.fillRect(9, 8, 1, 3);
  
  // Embers
  ctx.fillStyle = '#f8c848';
  ctx.fillRect(5, 10, 1, 1);
  ctx.fillRect(10, 11, 1, 1);
  ctx.fillRect(4, 9, 1, 1);
  
  return c;
}

function drawClaimMarkerTile() {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, TILE, TILE);
  
  // Post
  ctx.fillStyle = '#e83828';
  ctx.fillRect(7, 4, 2, 10);
  
  // Marker
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(4, 2, 8, 4);
  
  // Text area (simplified)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(5, 3, 6, 2);
  
  return c;
}

function drawDefaultTile(name) {
  const c = getCanvas(TILE, TILE);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const colors = {
    grass: ['#3a6b3a', '#4a8b4a', '#2a5a2a'],
    flowers: ['#3a6b3a', '#e84a4a', '#f8c848', '#e8a8e8'],
    sagebrush: ['#5a7a4a', '#6a8a5a', '#4a6a3a'],
    cottonwood: ['#4a6a3a', '#6a8a5a', '#8a9a6a'],
    river: ['#2a4a8a', '#3a6ab8', '#4a8ad8'],
    sand: ['#c8b888', '#d8c898', '#b8a878'],
    rock: ['#5a5a5a', '#6a6a6a', '#4a4a4a'],
    bush: ['#2a5a2a', '#3a7a3a', '#1a4a1a'],
    path: ['#a89878', '#b8a888', '#988868'],
    crack: ['#3a3a3a', '#4a4a4a'],
    bridge: ['#6a5a3a', '#7a6a4a'],
    fence: ['#4a3a2a', '#5a4a3a'],
    hwall: ['#3a3a3a', '#4a4a4a', '#2a2a2a'],
    hdoor: ['#5a4a2a', '#6a5a3a'],
    cave: ['#1a1a1a', '#2a2a2a'],
    stump: ['#5a3a2a', '#6a4a3a'],
    dwall: ['#2a2a2a', '#3a3a3a'],
    dfloor: ['#3a3a3a', '#4a4a4a'],
    door_lock: ['#4a3a2a', '#f0d858'],
    door_boss: ['#2a1a1a', '#e83828'],
    door_shut: ['#3a2a1a'],
    stairs: ['#3a3a3a', '#4a4a4a'],
    dcrack: ['#2a2a2a'],
    torch: ['#1a1a1a', '#f8a838'],
    statue: ['#4a4a4a', '#5a5a5a'],
    door_open: ['#2a2a2a'],
    wfloor: ['#3a3a3a', '#4a4a4a'],
    wwall: ['#3a2a2a', '#4a3a3a'],
    rug: ['#7a3a2a', '#8a4a3a'],
    counter: ['#4a3a2a'],
    grave: ['#2a2a2a', '#3a3a3a'],
    pond: ['#2a4a6a', '#3a5a7a'],
    roof: ['#6a2a2a', '#7a3a3a'],
    sign: ['#3a3a3a', '#f0d858'],
    waterfall: ['#4a8ad8', '#8ac8f8'],
    rail: ['#3a3a3a', '#4a4a4a'],
    telegraph: ['#2a2a2a', '#3a3a3a'],
    campfire: ['#2a1a1a', '#e86828', '#f8a838'],
    claim_marker: ['#e83828', '#f8f8f8'],
  };

  const pal = colors[name] || colors.grass;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = ((x * 7 + y * 11 + name.length * 13) % pal.length);
      ctx.fillStyle = pal[n];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

// ---- UI sprites ----
export function makeUISprites() {
  if (CACHE.has('ui')) return CACHE.get('ui');

  const sprites = {};

  // Heart full
  sprites.heartFull = drawHeart(true);
  sprites.heartEmpty = drawHeart(false);

  // Rupee
  sprites.rupee = drawRupee();

  CACHE.set('ui', sprites);
  return sprites;
}

function drawHeart(full) {
  const c = getCanvas(16, 16);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = full ? COL.heartFull : COL.heartEmpty;
  // Heart shape
  ctx.beginPath();
  ctx.moveTo(8, 2);
  ctx.bezierCurveTo(2, 2, 2, 8, 8, 14);
  ctx.bezierCurveTo(14, 8, 14, 2, 8, 2);
  ctx.fill();
  return c;
}

function drawRupee() {
  const c = getCanvas(16, 16);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = COL.rupee;
  ctx.beginPath();
  ctx.moveTo(8, 2);
  ctx.lineTo(14, 8);
  ctx.lineTo(8, 14);
  ctx.lineTo(2, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.lineTo(12, 8);
  ctx.lineTo(8, 12);
  ctx.lineTo(4, 8);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  return c;
}

// ---- Enemy sprites ----
export function makeEnemySprites() {
  if (CACHE.has('enemies')) return CACHE.get('enemies');

  const sprites = {};

  // Prairie dog
  sprites.prairieDog = drawEnemy('prairieDog');
  sprites.prairieDogRed = drawEnemy('prairieDogRed');
  // Rattler
  sprites.rattler = drawEnemy('rattler');
  // Falcon
  sprites.falcon = drawEnemy('falcon');
  // Vigilante
  sprites.vigilante = drawEnemy('vigilante');
  // Spirit
  sprites.spirit = drawEnemy('spirit');

  CACHE.set('enemies', sprites);
  return sprites;
}

function drawEnemy(type) {
  const c = getCanvas(16, 16);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const pal = {
    prairieDog: ['#8a7a5a', '#9a8a6a', '#6a5a4a'],
    prairieDogRed: ['#a84a3a', '#b85a4a', '#8a3a2a'],
    rattler: ['#4a6a3a', '#5a7a4a', '#e8a838'],
    falcon: ['#3a3a3a', '#4a4a4a', '#f8c838'],
    vigilante: ['#2a2a3a', '#3a3a4a', '#c8a868'],
    spirit: ['#4a6a8a', '#6a8ab8', '#aac8e8'],
  }[type] || ['#888'];

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const n = (x * 3 + y * 5 + type.length * 7) % pal.length;
      ctx.fillStyle = pal[n];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

// ---- Collect all ----
export const SPR = {
  fox: makeFoxSprites(),
  tiles: makeTileSprites(),
  ui: makeUISprites(),
  enemies: makeEnemySprites(),
};