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

// Color palette (LTTP-ish)
const COL = {
  // Fox
  fur: '#c87838', furDark: '#a05828', furLight: '#e0a068',
  white: '#f8f8f8', black: '#181818', nose: '#281810',
  // Clothes (surveyor's outfit)
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

  // Body
  drawBody(ctx, dir, bob, legOffset);

  return c;
}

function drawBody(ctx, dir, bob, legOffset) {
  const cx = 8, cy = 14 + bob;

  // Legs
  ctx.fillStyle = COL.furDark;
  if (dir === 'down' || dir === 'up') {
    ctx.fillRect(cx - 4, cy + 6 + legOffset, 3, 4);
    ctx.fillRect(cx + 1, cy + 6 - legOffset, 3, 4);
  } else {
    ctx.fillRect(cx - 3, cy + 6, 3, 4);
    ctx.fillRect(cx, cy + 6, 3, 4);
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

  // Body
  ctx.fillStyle = COL.fur;
  ctx.fillRect(cx - 4, cy - 6, 8, 10);

  // Shirt
  ctx.fillStyle = COL.shirt;
  ctx.fillRect(cx - 3, cy - 4, 6, 7);

  // Head
  ctx.fillStyle = COL.fur;
  ctx.fillRect(cx - 4, cy - 14, 8, 8);

  // Ears
  ctx.fillStyle = COL.fur;
  ctx.fillRect(cx - 5, cy - 16, 3, 4);
  ctx.fillRect(cx + 2, cy - 16, 3, 4);
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
  // Simple noise pattern
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