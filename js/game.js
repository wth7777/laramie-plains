// ============================================================
// LARAMIE: PLAINS OF THE LOST — js/game.js
// Main entry point, game loop, state management
// ============================================================
import { Input } from './core/Input.js';
import { Camera } from './core/Camera.js';
import { TileMap, ScreenMap, PF_W, PF_H, TILE } from './core/TileMap.js';
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
const DIAG = {
  jsInitialized: false,
  startElementFound: false,
  startBound: false,
  pointerDownReceived: false,
  pointerUpReceived: false,
  startActionRecognized: false,
  titleHandlerCalled: false,
  gameState: 'title',
  lastError: null,
  updateCalled: false,
  actualState: 'unknown',
  expectedState: 'title',
  switchMatched: 'unknown',
  updateError: null,
  frameCount: 0,
  loopError: null,
};

function debugLog(...args) {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  DEBUG_LOG.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (DEBUG_LOG.length > 20) DEBUG_LOG.shift();
  console.log(...args);
}

function updateDiag(key, value) {
  if (DIAG.hasOwnProperty(key)) {
    DIAG[key] = value;
  }
  renderDiagPanel();
}

function renderDiagPanel() {
  let panel = document.getElementById('diag-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'diag-panel';
    panel.style.cssText = `
      position: fixed; top: 8px; right: 8px; left: 8px; z-index: 9999;
      background: rgba(0,0,0,0.9); color: #0f0; font: 11px monospace;
      padding: 8px; border-radius: 4px; border: 1px solid #0f0;
      pointer-events: none; white-space: pre-wrap; max-height: 50vh;
      overflow-y: auto; line-height: 1.4;
    `;
    document.body.appendChild(panel);
  }
  const lines = [
    '=== LARAMIE INPUT DIAG ===',
    `JS Initialized: ${DIAG.jsInitialized ? 'YES' : 'NO'}`,
    `START element found: ${DIAG.startElementFound ? 'YES' : 'NO'}`,
    `START bound: ${DIAG.startBound ? 'YES' : 'NO'}`,
    `Pointer DOWN: ${DIAG.pointerDownReceived ? 'YES' : 'NO'}`,
    `Pointer UP: ${DIAG.pointerUpReceived ? 'YES' : 'NO'}`,
    `START action recognized: ${DIAG.startActionRecognized ? 'YES' : 'NO'}`,
    `Title handler called: ${DIAG.titleHandlerCalled ? 'YES' : 'NO'}`,
    `Game state: ${DIAG.gameState}`,
    `update() called: ${DIAG.updateCalled ? 'YES' : 'NO'}`,
    `frame count: ${DIAG.frameCount}`,
    `actual state: ${DIAG.actualState}`,
    `expected state: ${DIAG.expectedState}`,
    `switch matched: ${DIAG.switchMatched}`,
    `Input.start getter: ${Input.start ? 'TRUE' : 'FALSE'}`,
    `Input.pressed.Enter: ${Input.pressed.Enter ? 'TRUE' : 'FALSE'}`,
    `Input.keys.Enter: ${Input.keys.Enter ? 'TRUE' : 'FALSE'}`,
    `Input.actionPressed.start: ${Input.actionPressed && Input.actionPressed.start ? 'TRUE' : 'FALSE'}`,
    `Input.actionHeld.start: ${Input.actionHeld && Input.actionHeld.start ? 'TRUE' : 'FALSE'}`,
  ];
  if (DIAG.lastError) lines.push(`ERROR: ${DIAG.lastError}`);
  if (DIAG.updateError) lines.push(`UPDATE ERROR: ${DIAG.updateError}`);
  if (DIAG.loopError) lines.push(`LOOP ERROR: ${DIAG.loopError}`);
  panel.textContent = lines.join('\n');
}

// Expose for Input.js
window.__diagUpdate = updateDiag;

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
  '.': 1, ',': 2, 'S': 3, 'C': 4, '~': 5,
  's': 6, 'R': 7, 'B': 8, 'P': 9, 'X': 10, '=': 11,
  'F': 12, 'H': 13, 'D': 14, 'O': 15, 'U': 16,
  'V': 17, 'g': 18, 'f': 19, 'p': 20, 'G': 21,
  '#': 22, '_': 23, 'L': 24, 'K': 25,
  'Z': 26, '>': 27, 'c': 28, 't': 29, 'A': 30,
  'o': 31, 'w': 32, 'h': 33, 'r': 34, 'n': 35,
  'T': 41, '*': 43, 'M': 44,
};

// Convert char map to ScreenMap
function makeScreenMap(charMap) {
  const tiles = charMap.map(row => row.split(''));
  return new ScreenMap(tiles, CHAR_TILE, { firstgid: 1, columns: 16 });
}

// ---- Init ----
async function init() {
  try {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Check START button element
    const startBtn = document.getElementById('btn-start');
    updateDiag('startElementFound', !!startBtn);
    if (startBtn) {
      debugLog('[DIAG] START button element found');
    } else {
      debugLog('[DIAG] ERROR: START button element NOT found');
      updateDiag('lastError', 'START button missing from DOM');
    }

    // Input
    Input.init();

    // Create map
    currentMap = makeScreenMap(DOWNTOWN_TILES);
    await currentMap.loadTileset('data:image/png;base64,' + generateTilesetPNG());

    // Camera
    const mapW = currentMap.w * TILE;
    const mapH = currentMap.h * TILE;
    camera = new Camera(mapW, mapH);

    // Player spawn at path center
    player = new Player(mapW / 2, mapH / 2);
    player.sprites = SPR.fox;
    camera.snap(player.x, player.y);

    updateDiag('jsInitialized', true);
    debugLog('[LARAMIE] Initialized');

    requestAnimationFrame(gameLoop);
  } catch (e) {
    console.error('[init] Error:', e);
    updateDiag('lastError', 'init error: ' + e.message);
    updateDiag('jsInitialized', false);
  }
}

// Generate a simple tileset PNG programmatically
function generateTilesetPNG() {
  // 1x1 transparent PNG base64
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

// ---- Game Loop ----
function gameLoop(time) {
  try {
    const dt = Math.min((time - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = time;

    update(dt);
    render();
  } catch (e) {
    console.error('[gameLoop] Error:', e);
    if (window.__diagUpdate) window.__diagUpdate('loopError', e.message);
  }

  requestAnimationFrame(gameLoop);
}

// ---- Update ----
function update(dt) {
  // Diagnostic: track that update() is being called
  if (window.__diagUpdate) window.__diagUpdate('updateCalled', true);
  if (window.__diagUpdate) window.__diagUpdate('actualState', state);
  if (window.__diagUpdate) window.__diagUpdate('expectedState', GameState.TITLE);
  if (window.__diagUpdate) window.__diagUpdate('frameCount', DIAG.frameCount + 1);

  try {
    switch (state) {
      case GameState.TITLE:
        if (window.__diagUpdate) window.__diagUpdate('switchMatched', 'TITLE');
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
      default:
        if (window.__diagUpdate) window.__diagUpdate('switchMatched', 'NONE - state=' + state);
    }
  } catch (e) {
    if (window.__diagUpdate) window.__diagUpdate('updateError', 'update() error: ' + e.message);
    console.error('[update] Error:', e);
  }

  if (toastTimer > 0) toastTimer -= dt;

  // Clear per-frame input state AFTER game logic has consumed it
  Input.flush();
}

function updateTitle(dt) {
  updateDiag('gameState', 'title');
  updateDiag('titleHandlerCalled', true);
  if (Input.start || Input.attack) {
    updateDiag('startActionRecognized', true);
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
  updateDiag('gameState', 'play');
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
  updateDiag('gameState', 'fade');
  fadeAlpha += fadeDir * dt * 2;
  if (fadeAlpha <= 0) { fadeAlpha = 0; fadeDir = 0; if (fadeCb) { fadeCb(); fadeCb = null; } }
  else if (fadeAlpha >= 1) { fadeAlpha = 1; }
}

function updateDialog(dt) {
  updateDiag('gameState', 'dialog');
  if (Input.attack || Input.item) {
    dialogPage++;
    if (dialogPage >= dialogPages.length) {
      state = GameState.PLAY;
    }
  }
}

function updatePause(dt) {
  updateDiag('gameState', 'pause');
  if (Input.start) state = GameState.PLAY;
}

function updateGameover(dt) {
  updateDiag('gameState', 'gameover');
  if (Input.attack) { state = GameState.TITLE; player.health = player.maxHealth; }
}

// ---- Render ----
function render() {
  ctx.clearRect(0, 0, PF_W, PF_H);

  // Render map - base (floor) + obj (walls)
  currentMap.render(ctx, camera, ['base', 'obj']);

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