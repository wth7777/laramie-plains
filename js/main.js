// LARAMIE: PLAINS OF THE LOST — main.js
// Entry point, game loop, state management
import { StateMachine } from './core/StateMachine.js';
import { Input } from './core/Input.js';
import { TileMap, Camera } from './core/TileMap.js';
import { SPR } from './core/Sprites.js';

const STATE = {
  TITLE: 'title',
  DIALOG: 'dialog',
  PLAY: 'play',
  PAUSE: 'pause',
};

let stateMachine;
let canvasCtx;
let tileMap;
let camera;
let player;
let dialogText = '';
let dialogPage = 0;
const dialogPages = [];

// Solid tiles (walls, obstacles) – using CHAR_TILE numbers from Sprites.js tile mapping
const SOLID_TILES = new Set([
  7,   // rock
  8,   // bush
  12,  // fence
  13,  // hwall
  14,  // hdoor
  15,  // cave
  16,  // stump
  17,  // roof
  18,  // sign
  19,  // waterfall
  20,  // pond
  21,  // grave
  22,  // dwall
  23,  // dfloor
  24,  // door_lock
  25,  // door_boss
  26,  // door_shut
  27,  // stairs
  28,  // dcrack
  29,  // torch
  30,  // statue
  31,  // door_open
  32,  // wfloor
  33,  // wwall
  34,  // rug
  35,  // counter
  36,  // grave (duplicate)
  37,  // pond (dup)
  38,  // roof (dup)
  39,  // sign (dup)
  40,  // waterfall (dup)
  41,  // rail
  42,  // telegraph
  43,  // campfire
  44,  // claim_marker
]);

// Player simple object
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 80; // px/sec
    this.dir = 'down'; // down, up, left, right
    this.frame = 0;
    this.frameTime = 0;
    this.spriteIdle = SPR.fox.idle_down[0]; // placeholder
    this.spriteWalk = SPR.fox.walk_down; // array
  }
  update(dt, tileMap) {
    const dx = (Input.left ? -1 : 0) + (Input.right ? 1 : 0);
    const dy = (Input.up ? -1 : 0) + (Input.down ? 1 : 0);
    let moveX = 0, moveY = 0;
    if (dx !== 0 || dy !== 0) {
      // Normalize diagonal
      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(2);
        dx /= len; dy /= len;
      }
      moveX = dx * this.speed * dt;
      moveY = dy * this.speed * dt;
      // Update direction
      if (dx < 0) this.dir = 'left';
      else if (dx > 0) this.dir = 'right';
      else if (dy < 0) this.dir = 'up';
      else if (dy > 0) this.dir = 'down';
      // Animation
      this.frameTime += dt;
      if (this.frameTime > 0.1) {
        this.frameTime = 0;
        this.frame = (this.frame + 1) % 4;
      }
    }
    // Simple collision: check intended new position against solid tiles
    const newX = this.x + moveX;
    const newY = this.y + moveY;
    const tileSize = 16;
    const rx = Math.floor(newX / tileSize);
    const ry = Math.floor(newY / tileSize);
    // Check four corners of player's hitbox (size 16x16)
    const points = [
      { x: newX, y: newY },
      { x: newX + 15, y: newY },
      { x: newX, y: newY + 15 },
      { x: newX + 15, y: newY + 15 },
    ];
    let canMove = true;
    for (const p of points) {
      const tx = Math.floor(p.x / tileSize);
      const ty = Math.floor(p.y / tileSize);
      if (tileMap.isSolid(tx, ty, SOLID_TILES)) {
        canMove = false;
        break;
      }
    }
    if (canMove) {
      this.x = newX;
      this.y = newY;
    }
  }
  draw(ctx, camera) {
    const { x: camX, y: camY } = camera.getRenderOffset();
    const spriteName = `walk_${this.dir}`;
    const spriteArray = SPR.fox[spriteName];
    const sprite = spriteArray ? spriteArray[this.frame] : SPR.fox[`idle_${this.dir}`][0];
    ctx.drawImage(sprite, this.x - camX, this.y - camY, 16, 16);
  }
}

// Initialize
async function init() {
  const canvasEl = document.getElementById('game');
  const ctx = canvasEl.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  canvasCtx = ctx;

  Input.init();

  // Create map: 32x32 tiles
  const mapWidth = 32, mapHeight = 32;
  const grass = 1; // grass tile ID
  const wall = 22; // dwall (solid wall)
  const data = Array.from({ length: mapHeight }, (y) =>
    Array.from({ length: mapWidth }, (x) => {
      // Border walls
      if (x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1) return wall;
      // Building rectangle from (8,8) to (20,14)
      if (x >= 8 && x <= 20 && y >= 8 && y <= 14) {
        // Outer walls
        if (x === 8 || x === 20 || y === 8 || y === 14) return wall;
        // Inner floor
        return grass;
      }
      // Open grass elsewhere
      return grass;
    })
  );

  tileMap = new TileMap(data);
  const worldPixelWidth = mapWidth * 16;
  const worldPixelHeight = mapHeight * 16;
  camera = new Camera(worldPixelWidth, worldPixelHeight, 512, 448);
  // Start player in open area north of building
  player = new Player(8 * 16, 6 * 16); // tile (8,6) pixel coords

  // Dialog setup
  dialogPages = [
    "LARAMIE, 1868. THE UNION PACIFIC REACHES THESE PLAINS.",
    "YOU ARRIVE AS A SURVEYOR'S APPRENTICE...",
    "BUT THE LAND REMEMBERS JACQUES LA RAMEE.",
    "FIND THE TRAPPER AT VEDAUWOO."
  ];
  dialogPage = 0;

  // Hide hint
  const hint = document.getElementById('hint');
  if (hint) hint.style.display = 'none';

  stateMachine = new StateMachine({
    [STATE.TITLE]: {
      enter: () => { /* nothing */ },
      update: (dt) => {
        if (Input.pressed.start || Input.pressed.a || Input.pressed.b) {
          stateMachine.change(STATE.DIALOG);
          dialogPage = 0;
        }
      },
    },
    [STATE.DIALOG]: {
      enter: () => { /* reset */ },
      update: (dt) => {
        if (Input.pressed.a || Input.pressed.b) {
          dialogPage++;
          if (dialogPage >= dialogPages.length) {
            stateMachine.change(STATE.PLAY);
          }
        }
      },
    },
    [STATE.PLAY]: {
      enter: () => { },
      update: (dt) => {
        player.update(dt, tileMap);
        camera.follow(player.x + 8, player.y + 8); // center on player
        if (Input.pressed.start) stateMachine.change(STATE.PAUSE);
      },
    },
    [STATE.PAUSE]: {
      enter: () => { },
      update: (dt) => {
        if (Input.pressed.start) stateMachine.change(STATE.PLAY);
      },
    },
  });

  stateMachine.change(STATE.TITLE);

  requestAnimationFrame(loop);
}

let lastTime = 0;
function loop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  Input.update();
  stateMachine.update(dt);
  render();

  requestAnimationFrame(loop);
}

function render() {
  const ctx = canvasCtx;
  ctx.clearRect(0, 0, 512, 448);

  stateMachine.render(ctx);

  // Debug: show FPS
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  ctx.fillText(`FPS: ${Math.round(1 / (time - lastTime))}`, 10, 20);
}

// Start
init();