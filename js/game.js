// ============================================================
// LARAMIE: PLAINS OF THE LOST — js/game.js
// Main entry point, game loop, state management
// ============================================================
import { Input } from './core/Input.js';
import { Camera } from './core/Camera.js';
import { TileMap, ScreenMap, PF_W, PF_H } from './core/TileMap.js';
import { Player } from './core/Player.js';
import { RectHitbox } from './core/Hitbox.js';
import { SPR } from './core/Sprites.js';

// Set procedural sprites for tilemap rendering
TileMap.setSpriteSource(SPR.tiles);

// ---- Game State ----
const GameState = {
  TITLE: 'title',
  PLAY: 'play',
  SCROLL: 'scroll',
  FADE: 'fade',
  DIALOG: 'dialog',
  PAUSE: 'pause',
  GAMEOVER: 'gameover',
};

let state = GameState.TITLE;
let canvas, ctx;
let camera, player, currentMap;
let currentScreen = { map: 'overworld', sx: 2, sy: 2 };
let lastTime = 0;
let fadeAlpha = 1, fadeDir = -1, fadeCb = null;
let dialogText = '', dialogPage = 0, dialogPages = [];
let toastMsg = '', toastTimer = 0;

// Debug
const DEBUG_LOG = [];
function debugLog(...args) {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  DEBUG_LOG.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (DEBUG_LOG.length > 20) DEBUG_LOG.shift();
  console.log(...args);
}

// Solid tiles (walkable whitelist approach - inverted)
const SOLID_TILES = new Set([
  // Tiles that BLOCK movement
  'bush', 'rock', 'fence', 'hwall', 'hdoor', 'cave', 'stump',
  'dwall', 'door_lock', 'door_boss', 'door_shut', 'dcrack', 'torch', 'statue',
  'wwall', 'counter', 'grave', 'pond', 'roof', 'sign', 'waterfall',
  'rail', 'telegraph', 'campfire', 'claim_marker'
]);

// ---- Map Data (from world.js CHAR_TILE) ----
// Simplified: just Downtown Laramie for testing (32x28 for 512x448)
const DOWNTOWN_TILES = [
  "################################",
  "#..............................#",
  "#..............................#",
  "#........PPPPPPPPPPPPPP........#",
  "#........P................P....#",
  "#........P................P....#",
  "#........P................P....#",
  "#........P................P....#",
  "#........P................P....#",
  "#........P................P....#",
  "#........P................P....#",
  "#........P................P....#",
  "#........PPPPPPPPPPPPPP........#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "#..............................#",
  "################################",
];

const CHAR_TILE = {
  '.': 'grass', ',': 'flowers', 'S': 'sagebrush', 'C': 'cottonwood', '~': 'river',
  's': 'sand', 'R': 'rock', 'B': 'bush', 'P': 'path', 'X': 'crack', '=': 'bridge',
  'F': 'fence', 'H': 'hwall', 'D': 'hdoor', 'O': 'cave', 'U': 'stump',
  'V': 'roof', 'g': 'sign', 'f': 'waterfall', 'p': 'pond', 'G': 'grave',
  '#': 'dwall', '_': 'dfloor', 'L': 'door_lock', 'K': 'door_boss',
  'Z': 'door_shut', '>': 'stairs', 'c': 'dcrack', 't': 'torch', 'A': 'statue',
  'o': 'door_open', 'w': 'wfloor', 'h': 'wwall', 'r': 'rug', 'n': 'counter',
  'T': 'telegraph', '*': 'campfire', 'M': 'claim_marker',
};

// Convert char map to ScreenMap
function makeScreenMap(charMap) {
  const tiles = charMap.map(row => row.split(''));
  return new ScreenMap(tiles, CHAR_TILE, { firstgid: 1, columns: 16 });
}

// ---- Init ----
async function init() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Input
  Input.init();

  // Create map
  currentMap = makeScreenMap(DOWNTOWN_TILES);
  await currentMap.loadTileset('data:image/png;base64,' + generateTilesetPNG());

  // Camera
  camera = new Camera(512, 448); // single screen for now

  // Player spawn at path center
  player = new Player(256, 224);
  player.sprites = SPR.fox;
  camera.snap(player.x, player.y);

  debugLog('[LARAMIE] Initialized');

  requestAnimationFrame(gameLoop);
}

// Generate a simple tileset PNG programmatically
function generateTilesetPNG() {
  // For now, return empty - sprites are procedural
  // In production, this would be a real tilesheet
  return '';
}

// ---- Game Loop ----
function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05); // cap at 50ms
  lastTime = time;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// ---- Update ----
function update(dt) {
  Input.flush();

  switch (state) {
    case GameState.TITLE:
      updateTitle(dt);
      break;
    case GameState.PLAY:
      updatePlay(dt);
      break;
    case GameState.SCROLL:
      updateScroll(dt);
      break;
    case GameState.FADE:
      updateFade(dt);
      break;
    case GameState.DIALOG:
      updateDialog(dt);
      break;
    case GameState.PAUSE:
      updatePause(dt);
      break;
    case GameState.GAMEOVER:
      updateGameover(dt);
      break;
  }

  if (toastTimer > 0) toastTimer -= dt;
}

function updateTitle(dt) {
  if (Input.start || Input.attack) {
    startGame();
  }
}

function startGame() {
  state = GameState.FADE;
  fadeAlpha = 1; fadeDir = -1;
  fadeCb = () => {
    state = GameState.PLAY;
    showDialog("LARAMIE, 1868. THE UNION PACIFIC REACHES THESE PLAINS.\nYOU ARRIVE AS A SURVEYOR'S APPRENTICE...\nBUT THE LAND REMEMBERS JACQUES LA RAMEE.\nFIND THE TRAPPER AT VEDAUWOO.");
  };
}

function updatePlay(dt) {
  // Player update
  player.update(dt, currentMap, SOLID_TILES);

  // Camera follow
  camera.follow(player.x, player.y);
  camera.update();

  // Screen edge transition (for multi-screen later)
  if (player.x < 16 && Input.left) { /* transition west */ }
  if (player.x > PF_W - 16 && Input.right) { /* transition east */ }
  if (player.y < 16 && Input.up) { /* transition north */ }
  if (player.y > PF_H - 16 && Input.down) { /* transition south */ }

  // Pause
  if (Input.start) { state = GameState.PAUSE; }
}

function updateScroll(dt) {
  const done = camera.update();
  if (done) state = GameState.PLAY;
}

function updateFade(dt) {
  fadeAlpha += fadeDir * dt * 2;
  if (fadeAlpha <= 0) { fadeAlpha = 0; fadeDir = 0; if (fadeCb) { fadeCb(); fadeCb = null; } }
  else if (fadeAlpha >= 1) { fadeAlpha = 1; }
}

function updateDialog(dt) {
  if (Input.attack || Input.item) {
    dialogPage++;
    if (dialogPage >= dialogPages.length) {
      state = GameState.PLAY;
    }
  }
}

function updatePause(dt) {
  if (Input.start) state = GameState.PLAY;
}

function updateGameover(dt) {
  if (Input.attack) { state = GameState.TITLE; player.health = player.maxHealth; }
}

// ---- Render ----
function render() {
  ctx.clearRect(0, 0, PF_W, PF_H);

  // Render map
  currentMap.render(ctx, camera, ['base', 'fg']);

  // Render player
  player.draw(ctx, camera);

  // Restore context for UI
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // HUD
  renderHUD();

  // Dialog
  if (state === GameState.DIALOG) renderDialog();

  // Toast
  if (toastTimer > 0) renderToast();

  // Fade
  if (fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
    ctx.fillRect(0, 0, PF_W, PF_H);
  }

  // Debug overlay
  renderDebug();
}

function renderHUD() {
  // Hearts
  for (let i = 0; i < player.heartContainers; i++) {
    const heart = player.health > i ? SPR.ui.heartFull : SPR.ui.heartEmpty;
    ctx.drawImage(heart, 4 + i * 18, 4);
  }
  // Rupees
  ctx.drawImage(SPR.ui.rupee, 4, 22);
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  ctx.fillText(player.rupees.toString().padStart(3, '0'), 22, 32);
}

function showDialog(text) {
  dialogPages = text.split('\n');
  dialogPage = 0;
  state = GameState.DIALOG;
}

function renderDialog() {
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(8, PF_H - 64, PF_W - 16, 56);
  ctx.strokeStyle = '#9fb4d8';
  ctx.strokeRect(8, PF_H - 64, PF_W - 16, 56);

  ctx.fillStyle = '#fff';
  ctx.font = '11px monospace';
  const lines = wrapText(dialogPages[dialogPage], PF_W - 32);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 16, PF_H - 52 + i * 14);
  }
  // Continue indicator
  ctx.fillStyle = '#9fb4d8';
  ctx.fillText('▼ PRESS A/B', PF_W - 80, PF_H - 12);
}

function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    const test = current + (current ? ' ' : '') + w;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function toast(msg) { toastMsg = msg; toastTimer = 2; }

function renderToast() {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(PF_W / 2 - 60, 40, 120, 20);
  ctx.fillStyle = '#fff';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(toastMsg, PF_W / 2, 54);
  ctx.textAlign = 'left';
}

function renderDebug() {
  if (!DEBUG_LOG.length) return;
  const overlay = document.getElementById('debug-overlay') || createDebugOverlay();
  overlay.textContent = DEBUG_LOG.slice(-12).join('\n');
}

function createDebugOverlay() {
  const div = document.createElement('div');
  div.id = 'debug-overlay';
  document.body.appendChild(div);
  return div;
}

// ---- Boot ----
init();