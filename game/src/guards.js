// Guards: the patrols you have to read before you move. Each guard walks
// its waypoints, pauses to look around, and carries a vision cone. Seeing
// the thief fills the guard's suspicion; a sure sighting sends it hunting,
// and a brief glimpse sends it to investigate the last seen spot.
import { GUARD, PLAYER } from './config.js';
import { angleDelta, clamp, dist } from './random.js';
import { lineOfSight } from './levels.js';
import { moveEntity } from './physics.js';

// Is the watcher looking at the thief right now? Range, cone angle, a
// clear line of sight, and no smoke cloud between them.
export function canSee(lv, watcher, px, py, range, halfAngle, smokes) {
  const d = dist(watcher.x, watcher.y, px, py);
  if (d > range) return false;
  const angle = Math.atan2(py - watcher.y, px - watcher.x);
  if (Math.abs(angleDelta(watcher.facing, angle)) > halfAngle) return false;
  if (!lineOfSight(lv, watcher.x, watcher.y, px, py)) return false;
  for (const s of smokes) {
    if (dist(s.x, s.y, (watcher.x + px) / 2, (watcher.y + py) / 2) < s.radius) return false;
  }
  return true;
}

export function createGuards(level) {
  return level.guards.map((g) => ({
    x: g.waypoints[0].x,
    y: g.waypoints[0].y,
    radius: GUARD.radius,
    facing: g.facing,
    waypoints: g.waypoints,
    wpIndex: 1,
    pause: 0,
    state: 'patrol', // patrol | investigate | chase
    suspicion: 0,
    lastSeen: null,
    lostSightFor: 0,
    lookTimer: 0,
    // How far around the guard has swept while looking at a spot.
    scanAngle: 0,
  }));
}

export function updateGuards(lv, guards, player, dt, alarm, smokes, events) {
  let anyoneSees = false;
  for (const g of guards) {
    const sees = canSee(lv, g, player.x, player.y, GUARD.viewRange, GUARD.halfAngle, smokes);
    if (sees) {
      anyoneSees = true;
      const d = dist(g.x, g.y, player.x, player.y);
      // Close, upright and moving is spotted fast; far and sneaking is slow.
      let rate = GUARD.seeRise * (1 - (d / GUARD.viewRange) * 0.6);
      if (player.sneaking) rate *= PLAYER.sneakSeeFactor;
      if (!player.moving) rate *= PLAYER.stillSeeFactor;
      const before = g.suspicion;
      g.suspicion = clamp(g.suspicion + rate * dt, 0, 1);
      if (before < 0.6 && g.suspicion >= 0.6) events.push('spotted');
      g.lastSeen = { x: player.x, y: player.y };
      g.lostSightFor = 0;
    } else {
      g.suspicion = clamp(g.suspicion - GUARD.seeFall * dt, 0, 1);
      g.lostSightFor += dt;
    }

    if (g.suspicion >= 0.6 && alarm.hunts) {
      g.state = 'chase';
    } else if (g.suspicion >= 0.35 && g.state === 'patrol') {
      g.state = 'investigate';
    } else if (g.state === 'chase' && g.lostSightFor > 2.5) {
      g.state = 'investigate';
    }

    if (g.state === 'chase') {
      moveToward(lv, g, g.lastSeen || player, GUARD.chaseSpeed, dt);
      faceToward(g, g.lastSeen || player, dt, 10);
    } else if (g.state === 'investigate' && g.lastSeen) {
      const arrived = moveToward(lv, g, g.lastSeen, GUARD.investigateSpeed, dt);
      faceToward(g, g.lastSeen, dt, 8);
      if (arrived) {
        // Reached the spot: look around, then give up and go back on patrol.
        g.lookTimer += dt;
        g.scanAngle += dt * 1.8;
        g.facing = g.scanAngle;
        if (g.lookTimer > 2.2) {
          g.state = 'patrol';
          g.lookTimer = 0;
          g.lastSeen = null;
          g.wpIndex = nearestWaypoint(g);
        }
      }
    } else {
      g.state = 'patrol';
      const target = g.waypoints[g.wpIndex];
      if (g.pause > 0) {
        g.pause -= dt;
        g.facing += Math.sin(g.pause * 2.2) * dt * 0.6;
      } else {
        const arrived = moveToward(lv, g, target, GUARD.patrolSpeed, dt);
        faceToward(g, target, dt, 6);
        if (arrived) {
          g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
          g.pause = GUARD.pauseAtWaypoint;
        }
      }
    }
  }
  return anyoneSees;
}

// A coin toss pulls every guard in earshot toward the landing spot.
export function lureGuards(guards, x, y, radius) {
  for (const g of guards) {
    if (dist(g.x, g.y, x, y) < radius) {
      g.lastSeen = { x, y };
      g.suspicion = Math.max(g.suspicion, 0.4);
      if (g.state === 'patrol') g.state = 'investigate';
    }
  }
}

function moveToward(lv, g, target, speed, dt) {
  const dx = target.x - g.x;
  const dy = target.y - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 6) return true;
  const step = Math.min(d, speed * dt);
  moveEntity(lv, g, (dx / d) * step, (dy / d) * step);
  return false;
}

function faceToward(g, target, dt, turnSpeed) {
  const want = Math.atan2(target.y - g.y, target.x - g.x);
  g.facing += angleDelta(g.facing, want) * Math.min(1, turnSpeed * dt);
}

function nearestWaypoint(g) {
  let best = 0;
  let bestD = Infinity;
  g.waypoints.forEach((w, i) => {
    const d = dist(g.x, g.y, w.x, w.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
