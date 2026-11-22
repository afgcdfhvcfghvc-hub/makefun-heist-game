// Wren, the thief. Moves with WASD or arrows, sneaks with Shift, and
// carries three tools, each with a limited count: smoke to vanish inside,
// an EMP to blind cameras, and a tossed coin to pull a guard away.
import { PLAYER, TOOLS, TILE } from './config.js';
import { dist } from './random.js';
import { moveEntity } from './physics.js';
import { empCameras } from './cameras.js';
import { lureGuards } from './guards.js';

export function createPlayer(level) {
  return {
    x: level.start.x,
    y: level.start.y,
    radius: PLAYER.radius,
    facing: Math.PI / 2,
    sneaking: false,
    moving: false,
    stepTimer: 0,
    tools: {
      smoke: TOOLS.smoke.start,
      emp: TOOLS.emp.start,
      coin: TOOLS.coin.start,
    },
  };
}

export function updatePlayer(lv, player, input, dt, world, events) {
  const move = input.moveVector();
  player.moving = move.x !== 0 || move.y !== 0;
  player.sneaking = input.sneak;
  if (player.moving) {
    const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    moveEntity(lv, player, move.x * speed * dt, move.y * speed * dt);
    player.facing = Math.atan2(move.y, move.x);
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = player.sneaking ? 0.55 : 0.34;
      events.push('step');
    }
  }

  // Tool keys: 1 smoke, 2 EMP, 3 coin.
  if (input.pressed.has('1')) useSmoke(player, world, events);
  if (input.pressed.has('2')) useEmp(player, world, events);
  if (input.pressed.has('3')) useCoin(player, world, events);
}

function useSmoke(player, world, events) {
  if (player.tools.smoke <= 0) return;
  player.tools.smoke -= 1;
  world.smokes.push({
    x: player.x,
    y: player.y,
    radius: TOOLS.smoke.radius,
    until: world.time + TOOLS.smoke.seconds,
  });
  events.push('smoke');
}

function useEmp(player, world, events) {
  if (player.tools.emp <= 0) return;
  player.tools.emp -= 1;
  const hit = empCameras(world.cameras, player.x, player.y, TOOLS.emp.radius, world.time + TOOLS.emp.seconds);
  world.empFlashes.push({ x: player.x, y: player.y, radius: TOOLS.emp.radius, until: world.time + 0.5 });
  events.push(hit > 0 ? 'emp' : 'emp-miss');
}

function useCoin(player, world, events) {
  if (player.tools.coin <= 0) return;
  player.tools.coin -= 1;
  const tx = player.x + Math.cos(player.facing) * TOOLS.coin.throwDistance;
  const ty = player.y + Math.sin(player.facing) * TOOLS.coin.throwDistance;
  // The coin stops at the first wall or cover in its path.
  const clamped = clampThrow(world.level, player.x, player.y, tx, ty);
  world.coins.push({ x: clamped.x, y: clamped.y, until: world.time + TOOLS.coin.seconds });
  lureGuards(world.guards, clamped.x, clamped.y, TOOLS.coin.lureRadius);
  events.push('coin');
}

function clampThrow(lv, x1, y1, x2, y2) {
  const steps = 24;
  let last = { x: x1, y: y1 };
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    const tile = lv.grid[ty] && lv.grid[ty][tx];
    if (tile !== '.') return last;
    last = { x, y };
  }
  return { x: x2, y: y2 };
}

// The exit opens once the diamond is taken; stepping through it with the
// diamond ends the room.
export function atExit(level, player, diamondTaken) {
  return diamondTaken && dist(player.x, player.y, level.exit.x, level.exit.y) < 26;
}
