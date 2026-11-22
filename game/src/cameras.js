// Security cameras: wall mounts that sweep their cone back and forth.
// They never move, they never sleep, and they feed the alarm just like a
// guard — but an EMP pulse shuts one down for a few seconds.
import { CAMERA } from './config.js';
import { clamp, dist } from './random.js';
import { canSee } from './guards.js';

export function createCameras(level) {
  return level.cameras.map((c) => ({
    x: c.x,
    y: c.y,
    baseAngle: c.baseAngle,
    sweep: c.sweep,
    facing: c.baseAngle,
    sweepT: Math.random() * Math.PI * 2,
    suspicion: 0,
    disabledUntil: 0,
  }));
}

export function updateCameras(lv, cameras, player, dt, time, smokes, events) {
  let anyoneSees = false;
  for (const cam of cameras) {
    // Sweep the mount; a disabled camera hangs still and blind.
    if (time < cam.disabledUntil) {
      cam.suspicion = 0;
      continue;
    }
    cam.sweepT += dt * CAMERA.sweepSpeed;
    cam.facing = cam.baseAngle + Math.sin(cam.sweepT) * cam.sweep;
    const sees = canSee(lv, cam, player.x, player.y, CAMERA.viewRange, CAMERA.halfAngle, smokes);
    if (sees) {
      anyoneSees = true;
      const d = dist(cam.x, cam.y, player.x, player.y);
      let rate = CAMERA.seeRise * (1 - (d / CAMERA.viewRange) * 0.5);
      if (player.sneaking) rate *= 0.5;
      const before = cam.suspicion;
      cam.suspicion = clamp(cam.suspicion + rate * dt, 0, 1);
      if (before < 0.6 && cam.suspicion >= 0.6) events.push('spotted');
    } else {
      cam.suspicion = clamp(cam.suspicion - CAMERA.seeFall * dt, 0, 1);
    }
  }
  return anyoneSees;
}

// An EMP pulse disables every camera inside its radius until `until`.
export function empCameras(cameras, x, y, radius, until) {
  let hit = 0;
  for (const cam of cameras) {
    if (dist(cam.x, cam.y, x, y) < radius) {
      cam.disabledUntil = until;
      cam.suspicion = 0;
      hit += 1;
    }
  }
  return hit;
}
