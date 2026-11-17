import { COLORS } from "./levels.js";

export { COLORS as PALETTE } from "./levels.js";

export const BOARD_WIDTH = 860;
export const BOARD_HEIGHT = 600;
export const GRID_COLS = 14;
export const GRID_ROWS = 13;

export const BRICK_TYPES = [
  { id: "normal", color: "cyan", counted: true },
  { id: "explosive", color: "rose", counted: true },
  { id: "hidden", color: "purple", counted: true },
  { id: "gold", color: "lemon", counted: false },
  { id: "cracked", color: "lemon", counted: true },
  { id: "gray", color: "white", counted: true },
  { id: "silver", color: "white", counted: true },
  { id: "steel", color: "white", counted: true },
];

export const POWERUPS = [
  { id: "blaster", kind: "good", symbol: "↑" },
  { id: "grab", kind: "good", symbol: "⊓" },
  { id: "thru", kind: "good", symbol: "⇡" },
  { id: "fire", kind: "good", symbol: "✦" },
  { id: "spread", kind: "neutral", symbol: "✣" },
  { id: "detonate", kind: "neutral", symbol: "✹" },
  { id: "zap", kind: "good", symbol: "ϟ" },
  { id: "life", kind: "good", symbol: "+" },
  { id: "skip", kind: "good", symbol: "»" },
  { id: "slow", kind: "good", symbol: "↓" },
  { id: "expand", kind: "good", symbol: "↔" },
  { id: "shrink", kind: "bad", symbol: "><" },
  { id: "split", kind: "good", symbol: "⋔" },
  { id: "small", kind: "bad", symbol: "·" },
  { id: "falling", kind: "bad", symbol: "⇊" },
  { id: "fast", kind: "bad", symbol: "⇈" },
  { id: "superShrink", kind: "bad", symbol: "−" },
  { id: "kill", kind: "bad", symbol: "×" },
];

const GRID_X = 38;
const GRID_Y = 46;
const BRICK_GAP = 4;
const BRICK_WIDTH = (BOARD_WIDTH - GRID_X * 2 - (GRID_COLS - 1) * BRICK_GAP) / GRID_COLS;
const BRICK_HEIGHT = 17.5;
const ROW_PITCH = BRICK_HEIGHT + 6;
const WALL_LEFT = 14;
const WALL_RIGHT = BOARD_WIDTH - WALL_LEFT;
const WALL_TOP = 14;
const PADDLE_Y = 556;
const PADDLE_WIDTH = 104;
const BALL_RADIUS = 5.8;
const STEP = 1 / 180;
const MAX_BALLS = 24;
const EPSILON = 0.00001;

const METAL = {
  gold: { top: "#ffe993", base: "#d9a52b", shadow: "#79510e", glow: "#fbc143" },
  cracked: { top: "#ffe993", base: "#d9a52b", shadow: "#79510e", glow: "#fbc143" },
  gray: { top: "#bec8db", base: "#7c8ba6", shadow: "#404c61", glow: "#bfcee8" },
  silver: { top: "#e4edff", base: "#a8bad5", shadow: "#586b89", glow: "#dceaff" },
  steel: { top: "#ccd9ef", base: "#8096b7", shadow: "#3b4e6c", glow: "#a3c2f7" },
};

const DROP_COLORS = {
  good: { edge: "#78d9ff", fill: "#124264", light: "#ddf7ff" },
  neutral: { edge: "#a1abc4", fill: "#34394e", light: "#f2f4ff" },
  bad: { edge: "#ff6a8c", fill: "#651f3b", light: "#fff0f4" },
};

const COMMON_DROPS = [
  "blaster", "grab", "thru", "fire", "spread", "detonate", "zap", "zap",
  "slow", "slow", "expand", "expand", "shrink", "split", "split",
  "small", "falling", "fast", "superShrink", "kill",
];

const TONES = {
  serve: [370, 580, 0.09, 0.032],
  paddle: [194, 112, 0.06, 0.06],
  brick: [510, 350, 0.062, 0.036],
  hard: [276, 194, 0.075, 0.038],
  wall: [178, 145, 0.039, 0.02],
  fire: [198, 65, 0.14, 0.05],
  power: [428, 880, 0.19, 0.042],
  bad: [271, 98, 0.18, 0.045],
  loss: [395, 88, 0.32, 0.044],
  clear: [451, 1016, 0.27, 0.044],
};

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
const brickX = (col) => GRID_X + col * (BRICK_WIDTH + BRICK_GAP);
const brickY = (row) => GRID_Y + row * ROW_PITCH;

function roundBox(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function colorForBrick(cell) {
  return METAL[cell.type] || COLORS[cell.color] || COLORS.cyan;
}

export function drawBrick(ctx, x, y, width, height, cell, { revealHidden = false } = {}) {
  if (!cell || (cell.type === "hidden" && !revealHidden) || width < 1 || height < 1) return;

  const palette = colorForBrick(cell);
  const detailScale = Math.min(1, height / 16);
  const edge = Math.min(2.8, height / 3);
  const face = ctx.createLinearGradient(0, y, 0, y + height);
  face.addColorStop(0, palette.top);
  face.addColorStop(0.25, palette.base);
  face.addColorStop(0.74, palette.base);
  face.addColorStop(1, palette.shadow);

  ctx.save();
  if (cell.type === "hidden") ctx.globalAlpha *= 0.48;
  ctx.fillStyle = "#030610";
  roundBox(ctx, x, y + 1.75 * detailScale, width, height, edge);
  ctx.fill();
  ctx.fillStyle = face;
  roundBox(ctx, x, y, width, height, edge);
  ctx.fill();
  ctx.strokeStyle = palette.top;
  ctx.globalAlpha *= 0.35;
  ctx.lineWidth = Math.max(0.3, 0.75 * detailScale);
  roundBox(ctx, x + 0.5 * detailScale, y + 0.5 * detailScale,
    width - detailScale, height - detailScale, edge);
  ctx.stroke();
  ctx.restore();

  if (height < 5 || cell.type === "normal") return;

  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.scale(detailScale, detailScale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 1.15;
  ctx.strokeStyle = "#101525a0";
  ctx.fillStyle = "#10152585";

  if (cell.type === "explosive") {
    ctx.fillStyle = "#501529a8";
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(6.2, 4.4);
    ctx.lineTo(-6.2, 4.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#fff0d4";
    ctx.beginPath();
    ctx.moveTo(0, -1.8);
    ctx.lineTo(0, 0.95);
    ctx.moveTo(0, 2.7);
    ctx.lineTo(0, 3);
    ctx.stroke();
  } else if (cell.type === "gold") {
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-2.4, -2.4, 4.8, 4.8);
  } else if (cell.type === "cracked") {
    ctx.beginPath();
    ctx.moveTo(-5.3, 4.5);
    ctx.lineTo(-1.7, 0.2);
    ctx.lineTo(0.4, 1.55);
    ctx.lineTo(4.7, -4.25);
    ctx.moveTo(-1.7, 0.2);
    ctx.lineTo(-2.5, -3.15);
    ctx.stroke();
  } else if (cell.type === "hidden") {
    ctx.strokeStyle = "#fbf2ff9c";
    ctx.setLineDash([1.2, 2]);
    ctx.strokeRect(-4, -4, 8, 8);
  } else {
    const pips = cell.type === "steel" ? 3 : cell.type === "silver" ? 2 : 1;
    for (let i = 0; i < pips; i++) {
      ctx.fillRect((i - (pips - 1) / 2) * 4 - 0.95, -2.2, 1.9, 4.4);
    }
  }

  ctx.restore();
}

function canvasSize(canvas) {
  const { width, height } = canvas.getBoundingClientRect();
  const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
  return { width: Math.max(1, Math.round(width * dpr)), height: Math.max(1, Math.round(height * dpr)) };
}

export function drawBoardPreview(canvas, level) {
  const size = canvasSize(canvas);
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  const background = ctx.createLinearGradient(0, 0, 0, size.height);
  background.addColorStop(0, "#171b37");
  background.addColorStop(1, "#090d20");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size.width, size.height);

  const grid = level?.grid || [];
  const occupiedRows = grid.map((row, index) => row.some(Boolean) ? index : -1).filter((index) => index >= 0);
  if (!occupiedRows.length) return;

  const firstRow = occupiedRows[0];
  const lastRow = occupiedRows.at(-1);
  const gridWidth = BOARD_WIDTH - GRID_X * 2;
  const gridHeight = (lastRow - firstRow) * ROW_PITCH + BRICK_HEIGHT;
  const scale = Math.min(size.width * 0.90 / gridWidth, size.height * 0.76 / gridHeight);
  const startX = (size.width - gridWidth * scale) / 2;
  const startY = (size.height - gridHeight * scale) / 2;

  ctx.save();
  ctx.translate(startX, startY);
  ctx.scale(scale, scale);

  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      drawBrick(ctx, brickX(col) - GRID_X, (row - firstRow) * ROW_PITCH,
        BRICK_WIDTH, BRICK_HEIGHT, grid[row][col], { revealHidden: true });
    }
  }

  ctx.restore();
}

function drawArena(ctx) {
  const ground = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT);
  ground.addColorStop(0, "#111832");
  ground.addColorStop(0.52, "#0a1024");
  ground.addColorStop(1, "#080c19");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

  const halo = ctx.createRadialGradient(430, 86, 25, 430, 112, 500);
  halo.addColorStop(0, "#34327755");
  halo.addColorStop(1, "#15173600");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

  ctx.strokeStyle = "#8b9af112";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 24; x < BOARD_WIDTH - 14; x += 28) {
    ctx.moveTo(x + 0.5, WALL_TOP);
    ctx.lineTo(x + 0.5, BOARD_HEIGHT - 12);
  }
  for (let y = 30; y < BOARD_HEIGHT - 10; y += 28) {
    ctx.moveTo(WALL_LEFT, y + 0.5);
    ctx.lineTo(WALL_RIGHT, y + 0.5);
  }
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#a3adf030";
  ctx.beginPath();
  ctx.moveTo(WALL_LEFT - 0.5, BOARD_HEIGHT - 11);
  ctx.lineTo(WALL_LEFT - 0.5, WALL_TOP + 7);
  ctx.lineTo(WALL_LEFT + 7, WALL_TOP - 0.5);
  ctx.lineTo(WALL_RIGHT - 7, WALL_TOP - 0.5);
  ctx.lineTo(WALL_RIGHT + 0.5, WALL_TOP + 7);
  ctx.lineTo(WALL_RIGHT + 0.5, BOARD_HEIGHT - 11);
  ctx.stroke();

  ctx.fillStyle = "#9ba7e523";
  for (let y = 32; y <= BOARD_HEIGHT - 20; y += 21) {
    ctx.fillRect(6, y, 2, 7);
    ctx.fillRect(BOARD_WIDTH - 8, y, 2, 7);
  }

  ctx.fillStyle = "#b9b6fa6e";
  ctx.fillRect(WALL_LEFT + 10, WALL_TOP - 1, 26, 2);
  ctx.fillRect(WALL_RIGHT - 36, WALL_TOP - 1, 26, 2);

  const floor = ctx.createLinearGradient(WALL_LEFT, 0, WALL_RIGHT, 0);
  floor.addColorStop(0, "#483e7700");
  floor.addColorStop(0.5, "#7668b77a");
  floor.addColorStop(1, "#483e7700");
  ctx.strokeStyle = floor;
  ctx.setLineDash([3, 7]);
  ctx.beginPath();
  ctx.moveTo(WALL_LEFT, BOARD_HEIGHT - 11.5);
  ctx.lineTo(WALL_RIGHT, BOARD_HEIGHT - 11.5);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddle(ctx, x, width, style) {
  const left = x - width / 2;
  const body = ctx.createLinearGradient(0, PADDLE_Y, 0, PADDLE_Y + 13);
  const accent = style === "blaster" ? "#fa7ea4" : style === "grab" ? "#83f7d8" : "#beb0ff";
  body.addColorStop(0, "#f2edff");
  body.addColorStop(0.33, accent);
  body.addColorStop(1, "#5140a2");
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 15;
  ctx.fillStyle = body;
  roundBox(ctx, left, PADDLE_Y, width, 11.5, 4.5);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#34275999";
  ctx.fillRect(left + 6, PADDLE_Y + 7.1, width - 12, 2);
  ctx.fillStyle = "#f9f7ff";
  ctx.fillRect(x - 11, PADDLE_Y + 2.2, 22, 1.25);

  if (style === "blaster") {
    ctx.fillStyle = "#ffe3ef";
    ctx.fillRect(left + 4, PADDLE_Y - 3, 4, 5);
    ctx.fillRect(left + width - 8, PADDLE_Y - 3, 4, 5);
  }
  ctx.restore();
}

function drawBall(ctx, ball, radius, effects) {
  ctx.save();
  const color = effects.fire ? "#ffab65" : effects.thru ? "#80f8d9" : "#d2c2ff";
  if (!ball.attached) {
    for (let i = ball.trail.length - 1; i >= 0; i--) {
      const point = ball.trail[i];
      const fraction = (ball.trail.length - i) / (ball.trail.length + 1);
      ctx.globalAlpha = 0.28 * fraction;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * (0.25 + 0.55 * fraction), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowColor = color;
  ctx.shadowBlur = effects.fire ? 16 : 11;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fffaf8";
  ctx.beginPath();
  ctx.arc(ball.x - radius * 0.22, ball.y - radius * 0.25, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDrop(ctx, drop) {
  const theme = DROP_COLORS[drop.power.kind];
  ctx.save();
  ctx.translate(drop.x, drop.y);
  ctx.shadowColor = theme.edge;
  ctx.shadowBlur = 11;
  ctx.fillStyle = theme.fill;
  roundBox(ctx, -12, -8, 24, 16, 4);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = theme.edge;
  ctx.stroke();
  ctx.fillStyle = theme.light;
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(drop.power.symbol, 0, 0.5);
  ctx.restore();
}

function sweepRect(x, y, vx, vy, minX, minY, maxX, maxY, maxTime) {
  if ((!vx && (x < minX || x > maxX)) || (!vy && (y < minY || y > maxY))) return null;

  const enterX = vx ? ((vx > 0 ? minX : maxX) - x) / vx : -Infinity;
  const exitX = vx ? ((vx > 0 ? maxX : minX) - x) / vx : Infinity;
  const enterY = vy ? ((vy > 0 ? minY : maxY) - y) / vy : -Infinity;
  const exitY = vy ? ((vy > 0 ? maxY : minY) - y) / vy : Infinity;
  const enter = Math.max(enterX, enterY);

  if (enter < -EPSILON || enter > maxTime || Math.min(exitX, exitY) < enter) return null;

  const horizontal = enterX > enterY;
  return {
    time: Math.max(0, enter),
    nx: horizontal ? -Math.sign(vx) : 0,
    ny: horizontal ? 0 : -Math.sign(vy),
  };
}

export class Game {
  constructor(canvas, { onUpdate, onEnd, onPowerUp } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.background = document.createElement("canvas");
    this.onUpdate = onUpdate;
    this.onEnd = onEnd;
    this.onPowerUp = onPowerUp;
    this.muted = false;
    this.frameHandle = 0;
    this.pointerId = null;
    this.paintFrame = this.paintFrame.bind(this);
    this.playLevels = [];
    this.previewLevel = null;
    this.score = 0;
    this.lives = 3;
    this.levelIndex = 0;
    this.mode = "campaign";
    this.phase = "idle";
    this.resetScene(null);

    this.pointerDown = (event) => {
      if (event.pointerType === "touch") {
        this.pointerId = event.pointerId;
        canvas.setPointerCapture?.(event.pointerId);
      }
      this.moveFromPointer(event);
    };
    this.pointerMove = (event) => {
      if (event.pointerType !== "touch" || this.pointerId === event.pointerId) this.moveFromPointer(event);
    };
    this.pointerEnd = (event) => {
      if (this.pointerId === event.pointerId) this.pointerId = null;
    };
    canvas.addEventListener("pointerdown", this.pointerDown);
    canvas.addEventListener("pointermove", this.pointerMove);
    canvas.addEventListener("pointerup", this.pointerEnd);
    canvas.addEventListener("pointercancel", this.pointerEnd);
    canvas.addEventListener("lostpointercapture", this.pointerEnd);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  getState() {
    return {
      phase: this.phase,
      level: this.playLevels[this.levelIndex] || this.previewLevel,
      levelIndex: this.levelIndex,
      levelCount: this.playLevels.length,
      score: this.score,
      lives: this.lives,
      mode: this.mode,
      remaining: this.remaining,
    };
  }

  emit() {
    this.dirty = false;
    const state = this.getState();
    this.onUpdate?.(state);
    return state;
  }

  start(levels, { mode = "campaign" } = {}) {
    if (!levels.length) return false;
    this.unlockAudio();
    this.playLevels = mode === "single" ? levels.slice(0, 1) : levels.slice();
    this.mode = mode;
    this.score = 0;
    this.lives = 3;
    this.levelIndex = 0;
    this.beginLevel();
    return true;
  }

  reset(level = this.previewLevel) {
    this.previewLevel = level;
    this.playLevels = [];
    this.mode = "campaign";
    this.score = 0;
    this.lives = 3;
    this.levelIndex = 0;
    this.phase = "idle";
    this.resetScene(level);
    this.draw();
    this.emit();
  }

  preview(level) {
    if (this.phase === "idle") this.reset(level);
  }

  beginLevel() {
    this.phase = "ready";
    this.resetScene(this.playLevels[this.levelIndex]);
    this.draw();
    this.emit();
  }

  resetScene(level) {
    this.bricks = [];
    const grid = level?.grid || [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cell = grid[row]?.[col];
        if (cell) this.bricks.push({ ...cell, row, col });
      }
    }
    this.remaining = this.bricks.filter((brick) => brick.type !== "gold").length;
    this.particles = [];
    this.pulses = [];
    this.elapsed = 0;
    this.lastBrickTime = 0;
    this.assistAfter = 40 + Math.random() * 20;
    this.difficulty = clamp(Number(level?.difficulty) || this.levelIndex + 1, 1, 12);
    this.direction = 0;
    this.resetServe();
  }

  resetServe() {
    this.paddle = { x: BOARD_WIDTH / 2, width: PADDLE_WIDTH, style: "normal" };
    this.effects = { thru: false, fire: false, small: false, falling: false, speed: 1 };
    this.drop = null;
    this.shots = [];
    this.balls = [this.newBall(0)];
    this.lastShot = -Infinity;
    this.lastFrameTime = null;
    this.accumulator = 0;
  }

  newBall(offset) {
    return {
      x: this.paddle.x + offset,
      y: PADDLE_Y - BALL_RADIUS - 1,
      vx: 0,
      vy: 0,
      attached: true,
      offset,
      trail: [],
    };
  }

  get ballRadius() {
    return this.effects.small ? BALL_RADIUS * 0.55 : BALL_RADIUS;
  }

  get baseSpeed() {
    return 350 + (this.difficulty - 1) * 16;
  }

  action() {
    this.unlockAudio();
    if (this.phase === "ready") {
      this.phase = "playing";
      this.serve();
      this.ensureFrame();
      this.emit();
    } else if (this.phase === "paused") {
      this.togglePause();
    } else if (this.phase === "levelComplete") {
      this.levelIndex += 1;
      this.beginLevel();
    } else if (this.phase === "playing") {
      if (this.balls.some((ball) => ball.attached)) this.serve();
      else if (this.paddle.style === "blaster") this.fireBlaster();
    }
  }

  togglePause() {
    if (this.phase === "paused") {
      this.phase = "playing";
      this.ensureFrame();
    } else if (this.phase === "playing") {
      this.phase = "paused";
      this.direction = 0;
    } else {
      return;
    }
    this.lastFrameTime = null;
    this.accumulator = 0;
    this.emit();
  }

  setMuted(muted) {
    const wasMuted = this.muted;
    this.muted = Boolean(muted);
    if (wasMuted && !this.muted) this.unlockAudio();
  }

  unlockAudio() {
    if (this.muted) return;
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) return;

    try {
      this.audio ||= new AudioContext();
      if (this.audio.state === "suspended") this.audio.resume().catch(() => {});
    } catch {
      // The game can be played when audio is unavailable.
    }
  }

  playSound(sound) {
    if (this.muted || this.audio?.state !== "running") return;

    const now = this.audio.currentTime;
    if (now - (this.lastSounds?.[sound] ?? -Infinity) < 0.028) return;
    this.lastSounds ||= {};
    this.lastSounds[sound] = now;

    const [from, to, duration, volume] = TONES[sound];
    const oscillator = this.audio.createOscillator();
    const gain = this.audio.createGain();
    oscillator.type = sound === "power" || sound === "clear" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + duration);
    oscillator.connect(gain).connect(this.audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  serve() {
    const speed = this.baseSpeed * this.effects.speed;
    for (const ball of this.balls) {
      if (!ball.attached) continue;
      const aim = ball.offset / (this.paddle.width / 2);
      const direction = Math.sign(aim) || this.direction || (this.lives % 2 === 0 ? -1 : 1);
      const angle = direction * Math.max(0.26, Math.abs(aim) * 0.95);
      ball.attached = false;
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.cos(angle) * speed;
    }
    this.playSound("serve");
  }

  setDirection(direction) {
    this.direction = Math.sign(direction);
    if (this.phase === "ready" || this.phase === "playing") this.ensureFrame();
  }

  moveFromPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width) this.moveTo((event.clientX - rect.left) / rect.width);
  }

  moveTo(fraction) {
    if (this.phase !== "playing" && this.phase !== "ready") return;
    this.placePaddle(fraction * BOARD_WIDTH);
    if (this.phase === "ready") this.draw();
  }

  placePaddle(x) {
    const half = this.paddle.width / 2;
    this.paddle.x = clamp(x, WALL_LEFT + half, WALL_RIGHT - half);
    for (const ball of this.balls) {
      if (ball.attached) {
        ball.x = this.paddle.x + ball.offset;
        ball.y = PADDLE_Y - this.ballRadius - 1;
      }
    }
  }

  fireBlaster() {
    if (this.elapsed - this.lastShot < 0.14) return;
    for (const direction of [-1, 1]) {
      this.shots.push({ x: this.paddle.x + direction * (this.paddle.width / 2 - 7), y: PADDLE_Y - 5 });
    }
    this.lastShot = this.elapsed;
    this.playSound("fire");
  }

  resize() {
    const { width, height } = canvasSize(this.canvas);
    if (this.background.width !== width || this.background.height !== height || !this.backgroundReady) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.background.width = width;
      this.background.height = height;
      const backgroundCtx = this.background.getContext("2d");
      backgroundCtx.setTransform(width / BOARD_WIDTH, 0, 0, height / BOARD_HEIGHT, 0, 0);
      drawArena(backgroundCtx);
      this.backgroundReady = true;
    }
    this.draw();
  }

  ensureFrame() {
    if (!this.frameHandle) this.frameHandle = requestAnimationFrame(this.paintFrame);
  }

  paintFrame(time) {
    this.frameHandle = 0;
    const delta = this.lastFrameTime === null ? STEP : Math.min(0.04, (time - this.lastFrameTime) / 1000);
    this.lastFrameTime = time;

    if (this.phase === "playing") {
      this.accumulator += delta;
      while (this.accumulator >= STEP && this.phase === "playing") {
        this.accumulator -= STEP;
        this.advance(STEP);
      }
    } else if (this.phase === "ready" && this.direction) {
      this.placePaddle(this.paddle.x + this.direction * 670 * delta);
    }
    if (this.phase !== "paused") this.updateParticles(delta);
    this.draw();
    if (this.dirty) this.emit();

    if (this.phase === "playing" || (this.phase === "ready" && this.direction)
      || (this.phase !== "paused" && (this.particles.length || this.pulses.length))) {
      this.ensureFrame();
    } else {
      this.lastFrameTime = null;
    }
  }

  advance(dt) {
    this.elapsed += dt;
    if (this.direction) this.placePaddle(this.paddle.x + this.direction * 670 * dt);

    for (const ball of this.balls) {
      if (!ball.attached) this.moveBall(ball, dt);
    }
    this.balls = this.balls.filter((ball) => ball.y < BOARD_HEIGHT + 18);

    this.moveShots(dt);
    this.moveDrop(dt);
    if (this.phase !== "playing") return;

    if (!this.remaining) {
      this.finishLevel();
      return;
    }
    if (!this.balls.length) {
      this.loseLife();
      return;
    }

    if (this.remaining === 1) {
      this.lastBrickTime += dt;
      if (this.lastBrickTime >= this.assistAfter) this.lightningAssist();
    } else {
      this.lastBrickTime = 0;
    }
  }

  findCollision(ball, maxTime) {
    const radius = this.ballRadius;
    let contact = null;
    const consider = (time, nx, ny, kind) => {
      if (time >= -EPSILON && time <= maxTime && (!contact || time < contact.time)) {
        contact = { time: Math.max(0, time), nx, ny, kind };
      }
    };

    if (ball.vx < 0) consider((WALL_LEFT + radius - ball.x) / ball.vx, 1, 0, "wall");
    if (ball.vx > 0) consider((WALL_RIGHT - radius - ball.x) / ball.vx, -1, 0, "wall");
    if (ball.vy < 0) consider((WALL_TOP + radius - ball.y) / ball.vy, 0, 1, "wall");
    if (ball.vy > 0) {
      const time = (PADDLE_Y - radius - ball.y) / ball.vy;
      const x = ball.x + ball.vx * time;
      if (Math.abs(this.paddle.x - x) <= this.paddle.width / 2 + radius * 0.68) {
        consider(time, 0, -1, "paddle");
      }
    }

    const finalY = ball.y + ball.vy * maxTime;
    if (Math.min(ball.y, finalY) > brickY(GRID_ROWS - 1) + BRICK_HEIGHT + radius) return contact;

    const finalX = ball.x + ball.vx * maxTime;
    const minX = Math.min(ball.x, finalX) - radius;
    const maxX = Math.max(ball.x, finalX) + radius;
    const minY = Math.min(ball.y, finalY) - radius;
    const maxY = Math.max(ball.y, finalY) + radius;

    for (const brick of this.bricks) {
      if (brick.removed) continue;
      const x = brickX(brick.col);
      const y = brickY(brick.row);
      if (x > maxX || x + BRICK_WIDTH < minX || y > maxY || y + BRICK_HEIGHT < minY) continue;
      const hit = sweepRect(ball.x, ball.y, ball.vx, ball.vy, x - radius, y - radius,
        x + BRICK_WIDTH + radius, y + BRICK_HEIGHT + radius, contact?.time ?? maxTime);
      if (hit && (!contact || hit.time < contact.time)) contact = { ...hit, kind: "brick", brick };
    }

    return contact;
  }

  moveBall(ball, dt) {
    let remainingTime = dt;
    let collisions = 0;
    ball.traceTime = (ball.traceTime || 0) + dt;
    if (ball.traceTime >= 0.014) {
      ball.traceTime = 0;
      ball.trail.unshift({ x: ball.x, y: ball.y });
      if (ball.trail.length > 5) ball.trail.pop();
    }

    while (remainingTime > EPSILON && collisions < 6 && !ball.attached) {
      const hit = this.findCollision(ball, remainingTime);
      if (!hit) {
        ball.x += ball.vx * remainingTime;
        ball.y += ball.vy * remainingTime;
        break;
      }

      ball.x += ball.vx * hit.time;
      ball.y += ball.vy * hit.time;
      remainingTime -= hit.time;

      if (hit.kind === "paddle") {
        this.reboundFromPaddle(ball);
      } else {
        if (hit.kind === "wall") this.playSound("wall");
        if (hit.brick) {
          this.hitBrick(hit.brick, {
            points: 2 * Math.round(Math.hypot(ball.vx, ball.vy) / 72),
            piercing: this.effects.thru,
            fiery: this.effects.fire,
          });
        }
        const piercing = hit.brick && this.effects.thru;
        if (!piercing) {
          if (hit.nx) ball.vx *= -1;
          if (hit.ny) ball.vy *= -1;
        }
        const nudge = piercing ? -0.035 : 0.035;
        ball.x += hit.nx * nudge;
        ball.y += hit.ny * nudge;
      }
      collisions += 1;
    }
  }

  reboundFromPaddle(ball) {
    const normalized = clamp((ball.x - this.paddle.x) / (this.paddle.width / 2), -1, 1);
    if (this.effects.falling) this.fallBricks();
    if (this.paddle.style === "grab") {
      ball.attached = true;
      ball.offset = normalized * this.paddle.width * 0.45;
      ball.y = PADDLE_Y - this.ballRadius - 1;
      ball.trail = [];
    } else {
      const speed = Math.min(Math.hypot(ball.vx, ball.vy) * 1.021 + 3, this.baseSpeed * this.effects.speed * 1.5);
      const angle = Math.abs(normalized) > 0.1 ? normalized * 1.095 : Math.sign(ball.vx || 1) * 0.13;
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.cos(angle) * speed;
      ball.y = PADDLE_Y - this.ballRadius - 0.035;
    }
    this.playSound("paddle");
  }

  fallBricks() {
    const cells = new Map(this.bricks.filter((brick) => !brick.removed).map((brick) => [brick.row * GRID_COLS + brick.col, brick]));
    for (let row = GRID_ROWS - 2; row >= 0; row--) {
      for (let col = 0; col < GRID_COLS; col++) {
        const key = row * GRID_COLS + col;
        const brick = cells.get(key);
        if (brick && !cells.has(key + GRID_COLS)) {
          brick.row++;
          cells.delete(key);
          cells.set(key + GRID_COLS, brick);
        }
      }
    }
  }

  moveShots(dt) {
    for (const shot of this.shots) {
      const end = shot.y - dt * 770;
      let hit = null;
      for (const brick of this.bricks) {
        if (brick.removed) continue;
        const x = brickX(brick.col);
        const bottom = brickY(brick.row) + BRICK_HEIGHT;
        if (shot.x >= x && shot.x <= x + BRICK_WIDTH && bottom >= end && bottom <= shot.y
          && (!hit || brick.row > hit.row)) hit = brick;
      }

      if (hit) {
        this.hitBrick(hit, { points: 6, piercing: this.effects.thru });
        if (!this.effects.thru) shot.removed = true;
      }
      shot.y = end;
    }
    this.shots = this.shots.filter((shot) => !shot.removed && shot.y > WALL_TOP);
  }

  changeScore(points) {
    if (!points) return;
    this.score += points;
    this.dirty = true;
  }

  hitBrick(brick, { points, piercing = false, fiery = false }) {
    const type = brick.type;
    if (brick.removed) return;

    if (fiery || piercing || type !== "gold") this.changeScore(points);
    if (fiery || piercing || type === "normal" || type === "gray" || type === "explosive") {
      this.removeBrick(brick, true, type === "explosive" || fiery);
      if (type === "explosive" || fiery) this.explode(brick.row, brick.col);
      else this.playSound("brick");
      return;
    }

    if (type === "hidden") brick.type = "normal";
    if (type === "steel") brick.type = "silver";
    if (type === "silver") brick.type = "gray";
    if (type === "cracked") {
      brick.type = "gold";
      this.remaining -= 1;
    }
    this.emitBurst(brick, 5);
    this.playSound("hard");
  }

  removeBrick(brick, mayDrop = false, explosive = false) {
    if (brick.removed) return;
    brick.removed = true;
    if (brick.type !== "gold") this.remaining--;
    this.emitBurst(brick, explosive ? 18 : 9);
    if (mayDrop && this.remaining > 0) this.maybeDrop(brick);
  }

  explode(row, col) {
    this.pulses.push({ x: brickX(col) + BRICK_WIDTH / 2, y: brickY(row) + BRICK_HEIGHT / 2, life: 0.35, total: 0.35 });
    this.playSound("fire");

    for (const brick of this.bricks) {
      if (brick.removed || Math.abs(brick.row - row) > 1 || Math.abs(brick.col - col) > 1) continue;
      const chain = brick.type === "explosive";
      this.removeBrick(brick, false, chain);
      this.changeScore(4);
      if (chain) this.explode(brick.row, brick.col);
    }
  }

  lightningAssist() {
    const brick = this.bricks.find((cell) => !cell.removed && cell.type !== "gold");
    if (!brick) return;
    if (brick.type === "explosive") this.explode(brick.row, brick.col);
    this.removeBrick(brick, false, true);
    this.pulses.push({
      x: brickX(brick.col) + BRICK_WIDTH / 2,
      y: brickY(brick.row) + BRICK_HEIGHT / 2,
      life: 0.56,
      total: 0.56,
      lightning: true,
    });
    this.playSound("fire");
    this.changeScore(10);
    this.finishLevel();
  }

  maybeDrop(brick) {
    if (this.drop || Math.random() >= 0.2) return;

    const selection = Math.random();
    const id = selection < 0.01 ? "skip" : selection < 0.02 ? "life"
      : COMMON_DROPS[Math.floor(Math.random() * COMMON_DROPS.length)];
    this.drop = {
      power: POWERUPS.find((power) => power.id === id),
      x: brickX(brick.col) + BRICK_WIDTH / 2,
      y: brickY(brick.row) + BRICK_HEIGHT / 2,
      vx: (Math.random() - 0.5) * 105,
      vy: -52,
      age: 0,
    };
  }

  moveDrop(dt) {
    const drop = this.drop;
    if (!drop) return;

    drop.age += dt;
    if (drop.age > 0.22) drop.vy = Math.min(246, drop.vy + 290 * dt);
    drop.x += drop.vx * dt;
    const nextY = drop.y + drop.vy * dt;
    if (drop.x < WALL_LEFT + 12 || drop.x > WALL_RIGHT - 12) {
      drop.x = clamp(drop.x, WALL_LEFT + 12, WALL_RIGHT - 12);
      drop.vx *= -1;
    }
    if (nextY <= WALL_TOP + 8) {
      drop.y = WALL_TOP + 8;
      drop.vy = Math.abs(drop.vy);
      return;
    }

    const catchesDrop = drop.y <= PADDLE_Y - 8 && nextY >= PADDLE_Y - 8
      && Math.abs(drop.x - this.paddle.x) < this.paddle.width / 2 + 11;
    drop.y = nextY;

    if (catchesDrop || drop.y > BOARD_HEIGHT + 12) this.drop = null;
    if (catchesDrop) this.applyPower(drop.power);
  }

  changePaddleWidth(width) {
    if (this.balls.some((ball) => ball.attached)) this.serve();
    this.paddle.width = clamp(width, PADDLE_WIDTH / 2, PADDLE_WIDTH * 4);
    this.placePaddle(this.paddle.x);
  }

  changePaddleStyle(style) {
    if (this.paddle.style === "grab" && style !== "grab" && this.balls.some((ball) => ball.attached)) this.serve();
    this.paddle.style = style;
  }

  changeBallSpeed(multiplier) {
    const ratio = multiplier / this.effects.speed;
    this.effects.speed = multiplier;
    for (const ball of this.balls) {
      ball.vx *= ratio;
      ball.vy *= ratio;
    }
  }

  setSmallBall(small) {
    if (this.effects.small === small) return;
    this.effects.small = small;
    for (const ball of this.balls) {
      ball.x = clamp(ball.x, WALL_LEFT + this.ballRadius, WALL_RIGHT - this.ballRadius);
      ball.y = Math.max(WALL_TOP + this.ballRadius, ball.y);
    }
    this.placePaddle(this.paddle.x);
  }

  applyPower(power) {
    this.changeScore(100);
    this.playSound(power.kind === "bad" ? "bad" : "power");

    switch (power.id) {
      case "blaster":
        this.changePaddleStyle("blaster");
        break;
      case "grab":
        this.changePaddleStyle("grab");
        break;
      case "thru":
        this.effects.thru = true;
        break;
      case "fire":
        this.effects.fire = true;
        this.setSmallBall(false);
        break;
      case "spread":
        this.spreadExplosives();
        break;
      case "detonate":
        this.detonateExplosives();
        break;
      case "zap":
        this.zapBricks();
        break;
      case "life":
        this.lives++;
        this.changePaddleStyle("normal");
        break;
      case "skip":
        this.finishLevel();
        break;
      case "slow":
        this.setSmallBall(false);
        this.changeBallSpeed(0.8);
        break;
      case "expand":
        this.changePaddleWidth(this.paddle.width < PADDLE_WIDTH ? PADDLE_WIDTH : this.paddle.width + PADDLE_WIDTH);
        break;
      case "shrink":
        this.changePaddleWidth(this.paddle.width - PADDLE_WIDTH);
        break;
      case "split":
        this.splitBalls();
        break;
      case "small":
        this.setSmallBall(true);
        this.effects.fire = false;
        break;
      case "falling":
        this.effects.falling = true;
        break;
      case "fast":
        this.changeBallSpeed(Math.min(1.82, this.effects.speed + 0.38));
        break;
      case "superShrink":
        this.changePaddleWidth(PADDLE_WIDTH / 2);
        break;
      case "kill":
        this.loseLife();
        break;
    }

    this.onPowerUp?.(power.id);
  }

  spreadExplosives() {
    const positions = new Map();
    const explosives = [];
    for (const brick of this.bricks) {
      if (brick.removed) continue;
      positions.set(brick.row * GRID_COLS + brick.col, brick);
      if (brick.type === "explosive") explosives.push(brick);
    }

    for (const brick of explosives) {
      for (const [row, col] of [[brick.row - 1, brick.col], [brick.row + 1, brick.col],
        [brick.row, brick.col - 1], [brick.row, brick.col + 1]]) {
        if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) continue;
        const key = row * GRID_COLS + col;
        const target = positions.get(key);
        if (target?.type === "explosive") continue;
        if (!target || target.type === "gold") this.remaining++;
        if (target) {
          target.type = "explosive";
          target.color = "rose";
        } else {
          const added = { row, col, type: "explosive", color: "rose" };
          this.bricks.push(added);
          positions.set(key, added);
        }
      }
    }
  }

  detonateExplosives() {
    for (const brick of this.bricks) {
      if (!brick.removed && brick.type === "explosive") {
        this.changeScore(4);
        this.removeBrick(brick, false, true);
        this.explode(brick.row, brick.col);
      }
    }
  }

  zapBricks() {
    this.effects.falling = false;
    for (const brick of this.bricks) {
      if (brick.removed) continue;
      if (brick.type === "gold") this.remaining++;
      if (brick.type === "gold" || brick.type === "cracked" || brick.type === "steel" || brick.type === "silver") {
        brick.type = "gray";
      } else if (brick.type === "hidden") {
        brick.type = "normal";
      }
    }
  }

  splitBalls() {
    if (!this.balls.length) return;
    if (this.balls.some((ball) => ball.attached)) this.serve();
    const originalBalls = this.balls.slice();
    for (const ball of originalBalls) {
      if (this.balls.length >= MAX_BALLS) break;
      const angle = Math.atan2(ball.vy, ball.vx);
      const speed = Math.hypot(ball.vx, ball.vy);
      const direction = ball.vx * ball.vy >= 0 ? 1 : -1;
      const angle1 = angle - direction * 0.24;
      const angle2 = angle + direction * 0.24;
      ball.vx = Math.cos(angle1) * speed;
      ball.vy = Math.sin(angle1) * speed;
      this.balls.push({
        ...ball,
        vx: Math.cos(angle2) * speed,
        vy: Math.sin(angle2) * speed,
        trail: [],
      });
    }
  }

  finishLevel() {
    this.playSound("clear");
    this.drop = null;
    this.shots = [];
    this.direction = 0;
    const lastLevel = this.levelIndex >= this.playLevels.length - 1;
    this.phase = lastLevel ? "won" : "levelComplete";
    const state = this.emit();
    if (lastLevel) this.onEnd?.(state);
  }

  loseLife() {
    this.playSound("loss");
    this.lives--;
    if (this.lives > 0) {
      this.phase = "ready";
      this.resetServe();
      this.lastBrickTime = 0;
      this.emit();
    } else {
      this.phase = "lost";
      this.drop = null;
      this.balls = [];
      this.shots = [];
      const state = this.emit();
      this.onEnd?.(state);
    }
  }

  emitBurst(brick, count) {
    const palette = colorForBrick(brick);
    for (let i = 0; i < count && this.particles.length < 340; i++) {
      const life = 0.18 + Math.random() * 0.32;
      this.particles.push({
        x: brickX(brick.col) + BRICK_WIDTH * (0.14 + Math.random() * 0.72),
        y: brickY(brick.row) + BRICK_HEIGHT * Math.random(),
        vx: (Math.random() - 0.5) * 215,
        vy: -25 - Math.random() * 99,
        size: 1.1 + Math.random() * 3.1,
        color: i % 3 === 0 ? palette.top : palette.glow,
        life,
        total: life,
      });
    }
  }

  updateParticles(dt) {
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 235 * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
    for (const pulse of this.pulses) pulse.life -= dt;
    this.pulses = this.pulses.filter((pulse) => pulse.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    if (!this.backgroundReady) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.background, 0, 0);
    ctx.setTransform(this.canvas.width / BOARD_WIDTH, 0, 0, this.canvas.height / BOARD_HEIGHT, 0, 0);

    for (const brick of this.bricks) {
      if (!brick.removed) drawBrick(ctx, brickX(brick.col), brickY(brick.row), BRICK_WIDTH, BRICK_HEIGHT, brick);
    }
    if (this.drop) drawDrop(ctx, this.drop);
    drawPaddle(ctx, this.paddle.x, this.paddle.width, this.paddle.style);

    for (const ball of this.balls) drawBall(ctx, ball, this.ballRadius, this.effects);

    ctx.save();
    for (const shot of this.shots) {
      ctx.shadowColor = "#fa7eab";
      ctx.shadowBlur = 11;
      ctx.fillStyle = "#ffeff9";
      ctx.fillRect(shot.x - 1.2, shot.y - 9, 2.4, 11);
    }
    ctx.shadowBlur = 0;
    for (const particle of this.particles) {
      ctx.globalAlpha = particle.life / particle.total;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    for (const pulse of this.pulses) {
      const fraction = pulse.life / pulse.total;
      ctx.globalAlpha = fraction * 0.77;
      ctx.lineWidth = pulse.lightning ? 2.5 : 2;
      ctx.strokeStyle = pulse.lightning ? "#cbf6ff" : "#ffb47d";
      ctx.beginPath();
      if (pulse.lightning) {
        const steps = Math.ceil(pulse.y / 16);
        ctx.moveTo(pulse.x - 12, WALL_TOP);
        for (let i = 1; i < steps; i++) {
          const offset = Math.sin(i * 15 + Math.round(fraction * 15)) * 13;
          ctx.lineTo(pulse.x + offset, WALL_TOP + (pulse.y - WALL_TOP) * i / steps);
        }
        ctx.lineTo(pulse.x, pulse.y);
      } else {
        ctx.arc(pulse.x, pulse.y, 17 + 54 * (1 - fraction), 0, Math.PI * 2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  destroy() {
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener("pointerdown", this.pointerDown);
    this.canvas.removeEventListener("pointermove", this.pointerMove);
    this.canvas.removeEventListener("pointerup", this.pointerEnd);
    this.canvas.removeEventListener("pointercancel", this.pointerEnd);
    this.canvas.removeEventListener("lostpointercapture", this.pointerEnd);
    this.audio?.close().catch(() => {});
  }
}
