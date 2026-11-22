// Deterministic screenshot scenes. `?shot=start|mid|getaway|caught` puts
// the game into a staged, frozen moment so a screenshot always shows the
// full heist at its best: thief, room, guard cones, cameras, loot target
// and alarm meter in one frame. The game itself is untouched otherwise.
import { TILE } from './config.js';

const SHOTS = {
  // Room 1, just inside the door: guards on patrol, alarm quiet.
  start: { level: 0, alarm: 4, playerAt: null, diamond: false, freeze: true },
  // Room 2, deep in the hall: the thief crouched behind a case with a
  // guard turning suspicious and the meter half full.
  mid: { level: 1, alarm: 46, playerAt: [11, 6], diamond: false, freeze: true, suspicious: 0.55 },
  // Room 3, diamond taken, alarm high, guards hunting, the green EXIT lit.
  getaway: { level: 2, alarm: 72, playerAt: [12, 10], diamond: true, freeze: true, hunting: true },
  // Caught at the vault door: the fair end of a run that pushed too far.
  caught: { level: 2, alarm: 100, playerAt: [12, 5], diamond: true, freeze: true, hunting: true },
};

export function shotFor(params) {
  const name = params.get('shot');
  if (!name || !SHOTS[name]) return null;
  return { name, ...SHOTS[name] };
}

// Place the world into the staged scene. Guard facings are chosen so
// their cones sweep across the frame.
export function applyShot(world, shot) {
  const lv = world.level;
  if (shot.playerAt) {
    world.player.x = shot.playerAt[0] * TILE + TILE / 2;
    world.player.y = shot.playerAt[1] * TILE + TILE / 2;
  }
  world.alarm.value = shot.alarm;
  if (shot.diamond) {
    world.loot.diamondTaken = true;
    world.loot.value += 5000;
  }
  if (shot.suspicious !== undefined) {
    for (const g of world.guards) g.suspicion = shot.suspicious;
    world.guards[0].state = 'investigate';
    world.guards[0].lastSeen = { x: world.player.x, y: world.player.y };
  }
  if (shot.hunting) {
    for (const g of world.guards) {
      g.state = 'chase';
      g.suspicion = 0.9;
      g.lastSeen = { x: world.player.x, y: world.player.y };
    }
    world.alarm.hunts = true;
  }
  // Freeze the simulation: the screenshot is one held moment.
  world.frozen = shot.freeze;
  world.status = 'playing';
  // Stage the guards mid-patrol with cones facing the thief's side.
  world.guards.forEach((g, i) => {
    g.facing = [Math.PI / 2, -Math.PI / 2, 0, Math.PI][i % 4];
  });
}
