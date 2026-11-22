// The Marlowe Heist — main loop and state machine. Boots the canvas,
// owns the world (level, thief, guards, cameras, loot, alarm), steps it
// each frame, and draws the right screen for the current status.
import { TILE, VIEW_W, VIEW_H, HUD_H, SCORE } from './config.js';
import { LEVELS } from './levels.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createAlarm } from './alarm.js';
import { createLoot } from './loot.js';
import { createGuards, updateGuards } from './guards.js';
import { createCameras, updateCameras } from './cameras.js';
import { createPlayer, updatePlayer, atExit } from './player.js';
import { drawWorld, drawTitle, drawCaught, drawLevelDone, drawWin } from './render.js';
import { shotFor, applyShot } from './shots.js';
import { makeRng } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H + HUD_H;

const input = createInput();
input.attach(canvas);
const audio = createAudio();
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 7);
makeRng(seed); // decor is seeded; levels themselves are hand-built.

const world = {
  levelIndex: 0,
  level: null,
  player: null,
  guards: null,
  cameras: null,
  loot: null,
  alarm: createAlarm(),
  status: 'title', // title | playing | caught | leveldone | win
  time: 0,
  levelTime: 0,
  totalTime: 0,
  totalLoot: 0,
  totalAlarms: 0,
  frozen: false,
  smokes: [],
  coins: [],
  empFlashes: [],
  popups: [],
  tally: [],
  shot: shotFor(params),
};

function loadLevel(index) {
  world.levelIndex = index;
  world.level = LEVELS[index];
  world.player = createPlayer(world.level);
  world.guards = createGuards(world.level);
  world.cameras = createCameras(world.level);
  world.loot = createLoot(world.level);
  world.alarm.reset();
  world.smokes = [];
  world.coins = [];
  world.empFlashes = [];
  world.popups = [];
  world.levelTime = 0;
  world.status = 'playing';
  world.frozen = false;
  if (world.shot && world.shot.level === index) applyShot(world, world.shot);
}

function scoreTally(levelTime, alarms) {
  const timeBonus = Math.max(0, Math.round((180 - levelTime) * SCORE.timeBonusPerSecond));
  const penalty = alarms * SCORE.alarmPenalty;
  return { timeBonus, penalty, total: world.loot.value + timeBonus - penalty };
}

function levelTallyLines(tally) {
  return [
    `Loot this room: $${world.loot.value.toLocaleString()}`,
    `Time bonus: $${tally.timeBonus.toLocaleString()}   Alarm penalties: -$${tally.penalty.toLocaleString()}`,
    `Room score: $${tally.total.toLocaleString()}`,
  ];
}

function update(dt) {
  world.time += dt;
  if (world.status !== 'playing' || world.frozen) return;
  world.levelTime += dt;
  const events = [];
  const w = world;

  updatePlayer(w.level, w.player, input, dt, w, events);
  const guardSees = updateGuards(w.level, w.guards, w.player, dt, w.alarm, w.smokes, events);
  const camSees = updateCameras(w.level, w.cameras, w.player, dt, w.time, w.smokes, events);
  const tick = w.alarm.update(dt, guardSees || camSees, w.time);
  if (tick === 'tick') audio.alarmTick();

  // Loot pickups, with a floating note and a chime.
  const grabbed = w.loot.tryGrab(w.player);
  if (grabbed) {
    w.popups.push({ x: w.player.x, y: w.player.y - 20, text: `+ $${grabbed.value.toLocaleString()} — ${grabbed.label}`, at: w.time });
    if (grabbed.kind === 'diamond') audio.diamond();
    else audio.pickup();
  }

  for (const e of events) {
    if (e === 'step') audio.step();
    else if (e === 'smoke') audio.smoke();
    else if (e === 'emp') audio.emp();
    else if (e === 'coin') audio.coin();
    else if (e === 'spotted') audio.spotted();
  }

  // Expire smoke, coins and flashes.
  w.smokes = w.smokes.filter((s) => w.time < s.until);
  w.coins = w.coins.filter((c) => w.time < c.until);
  w.empFlashes = w.empFlashes.filter((f) => w.time < f.until);
  w.popups = w.popups.filter((p) => w.time - p.at < 1.6);

  if (w.alarm.caught) {
    w.status = 'caught';
    w.totalAlarms += w.alarm.triggered;
    audio.caught();
    return;
  }

  if (atExit(w.level, w.player, w.loot.diamondTaken)) {
    const tally = scoreTally(w.levelTime, w.alarm.triggered);
    w.totalLoot += tally.total;
    w.totalTime += w.levelTime;
    w.totalAlarms += w.alarm.triggered;
    w.tally = levelTallyLines(tally);
    audio.escape();
    if (world.levelIndex + 1 >= LEVELS.length) {
      w.status = 'win';
      w.tally = [
        `Total loot: $${w.totalLoot.toLocaleString()}`,
        `Total time: ${fmtClock(w.totalTime)}   Alarms raised: ${w.totalAlarms}`,
        `Rating: ${w.totalAlarms === 0 ? 'GHOST — never raised the alarm' : w.totalAlarms <= 2 ? 'CLEAN — barely a whisper' : 'LOUD — but the diamond is yours'}`,
      ];
    } else {
      w.status = 'leveldone';
    }
  }
}

function fmtClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function handleKeys() {
  if (input.pressed.has('m')) {
    const muted = audio.toggleMute();
    world.popups.push({ x: world.player.x, y: world.player.y - 20, text: muted ? 'Sound off' : 'Sound on', at: world.time });
  }
  if (world.status === 'title' && (input.pressed.has('enter') || input.mouse.clicked)) {
    audio.unlock();
    loadLevel(0);
  } else if (world.status === 'caught' && input.pressed.has('r')) {
    loadLevel(world.levelIndex);
  } else if (world.status === 'leveldone' && input.pressed.has('enter')) {
    loadLevel(world.levelIndex + 1);
  } else if (world.status === 'win' && input.pressed.has('r')) {
    world.totalLoot = 0;
    world.totalTime = 0;
    world.totalAlarms = 0;
    loadLevel(0);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  handleKeys();
  update(dt);
  if (world.status === 'title') drawTitle(ctx, world);
  else if (world.status === 'caught') drawCaught(ctx, world);
  else if (world.status === 'leveldone') drawLevelDone(ctx, world, world.tally);
  else if (world.status === 'win') drawWin(ctx, world, world.tally);
  else drawWorld(ctx, world);
  input.endFrame();
  requestAnimationFrame(frame);
}

// Boot: show the title over room 1 so the first frame is already the game.
// A ?shot= URL jumps straight to that scene's room, staged and frozen.
loadLevel(world.shot ? world.shot.level : 0);
world.status = world.shot ? 'playing' : 'title';
if (world.shot) world.frozen = true;
requestAnimationFrame(frame);
