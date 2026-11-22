// Everything the player sees: the gallery floor, the sweeping vision
// cones, the guards and cameras, the loot and the exit — plus the HUD
// (alarm meter, loot, tools, timer) and the title / caught / clear screens.
import { TILE, VIEW_W, VIEW_H, HUD_H, COLORS, STORY, SCORE } from './config.js';
import { LOOT_KINDS } from './loot.js';
import { clamp } from './random.js';

const FONT_TITLE = 'bold 44px Georgia, "Times New Roman", serif';
const FONT_HUD = 'bold 15px "Segoe UI", Arial, sans-serif';
const FONT_SMALL = '13px "Segoe UI", Arial, sans-serif';
const FONT_MONO = 'bold 15px "Courier New", monospace';

export function drawWorld(ctx, world) {
  const { level, time } = world;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H + HUD_H);
  drawFloor(ctx, level, time);
  drawLootMarkers(ctx, world);
  drawCones(ctx, world);
  drawWallsAndCover(ctx, level);
  drawExit(ctx, world);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawPlayer(ctx, world);
  drawEffects(ctx, world);
  drawHud(ctx, world);
}

function drawFloor(ctx, level, time) {
  for (let ty = 0; ty < level.height; ty++) {
    for (let tx = 0; tx < level.width; tx++) {
      const x = tx * TILE;
      const y = HUD_H + ty * TILE;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      // Faint grout line.
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
  // A crimson carpet runner down the bottom corridor, where the thief walks in.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(0, HUD_H + 13 * TILE, VIEW_W, TILE);
  ctx.fillStyle = COLORS.carpetEdge;
  ctx.fillRect(0, HUD_H + 13 * TILE, VIEW_W, 3);
  ctx.fillRect(0, HUD_H + 14 * TILE - 3, VIEW_W, 3);
  // Gold trim around the diamond dais.
  const d = level.diamond;
  ctx.strokeStyle = 'rgba(242,193,78,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(d.x - TILE * 0.9, HUD_H + d.y - TILE * 0.9, TILE * 1.8, TILE * 1.8);
  void time;
}

function drawLootMarkers(ctx, world) {
  const { level, loot, time } = world;
  // Side loot.
  for (const piece of loot.pieces) {
    if (piece.taken) continue;
    const def = LOOT_KINDS[piece.kind];
    const x = piece.x;
    const y = HUD_H + piece.y;
    const bob = Math.sin(time * 2 + piece.x) * 2;
    if (piece.kind === 'painting') {
      ctx.fillStyle = '#8a6a2f';
      ctx.fillRect(x - 14, y - 10 + bob, 28, 20);
      ctx.fillStyle = def.color;
      ctx.fillRect(x - 11, y - 7 + bob, 22, 14);
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(x - 3, y - 4 + bob, 6, 8);
    } else if (piece.kind === 'gold') {
      ctx.fillStyle = '#8a6a2f';
      ctx.beginPath();
      ctx.arc(x, y + 6, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(x, y + bob, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(x - 3, y - 3 + bob, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.plantPot;
      ctx.fillRect(x - 8, y + 4 + bob, 16, 9);
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.ellipse(x, y - 2 + bob, 8, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // The Sunspire Diamond, glowing on its dais.
  if (!loot.diamondTaken) {
    const x = level.diamond.x;
    const y = HUD_H + level.diamond.y;
    const pulse = 0.75 + Math.sin(time * 3) * 0.25;
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 46 * pulse);
    glow.addColorStop(0, 'rgba(127,231,255,0.55)');
    glow.addColorStop(1, 'rgba(127,231,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 46 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y + Math.sin(time * 2) * 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.diamond;
    ctx.fillRect(-11, -11, 22, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    // No text label: the glow and the gold dais already say "the prize",
    // and a label under a diamond near the room's edge reads as clipped.
  }
}

function drawCone(ctx, x, y, facing, range, halfAngle, suspicion) {
  const alert = suspicion >= 0.6;
  const wary = suspicion >= 0.3;
  const fill = alert ? COLORS.coneAlert : wary ? COLORS.coneSuspicious : COLORS.coneCalm;
  const edge = alert ? COLORS.coneEdgeAlert : COLORS.coneEdgeCalm;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // A bright sweep line at the cone's leading edge.
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + halfAngle) * range, y + Math.sin(facing + halfAngle) * range);
  ctx.stroke();
}

function drawCones(ctx, world) {
  const { guards, cameras, time } = world;
  for (const cam of cameras) {
    if (time < cam.disabledUntil) continue;
    drawCone(ctx, cam.x, HUD_H + cam.y, cam.facing, 235, 0.5, cam.suspicion);
  }
  for (const g of guards) {
    drawCone(ctx, g.x, HUD_H + g.y, g.facing, 215, 0.62, g.suspicion);
  }
}

function drawWallsAndCover(ctx, level) {
  for (let ty = 0; ty < level.height; ty++) {
    for (let tx = 0; tx < level.width; tx++) {
      const t = level.grid[ty][tx];
      if (t === '.') continue;
      const x = tx * TILE;
      const y = HUD_H + ty * TILE;
      if (t === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        // A lit top edge only where the wall meets open floor, so a tall
        // wall reads as one solid slab instead of a stack of stripes.
        if (ty === 0 || level.grid[ty - 1][tx] !== '#') {
          ctx.fillStyle = COLORS.wallTop;
          ctx.fillRect(x, y, TILE, 4);
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(x, y + 4, TILE, 2);
        }
      } else if (t === 'C') {
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = COLORS.crateEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3);
        ctx.lineTo(x + TILE - 3, y + TILE - 3);
        ctx.moveTo(x + TILE - 3, y + 3);
        ctx.lineTo(x + 3, y + TILE - 3);
        ctx.stroke();
      } else if (t === 'D') {
        ctx.fillStyle = COLORS.caseFrame;
        ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
        ctx.fillStyle = COLORS.caseGlass;
        ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x + 10, y + 10, 6, TILE - 20);
      } else if (t === 'P') {
        ctx.fillStyle = COLORS.plantPot;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2 + 6, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.plant;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2 - 4, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.arc(x + TILE / 2 - 4, y + TILE / 2 - 8, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (t === 'V') {
        ctx.strokeStyle = COLORS.rope;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + TILE / 2);
        ctx.lineTo(x + TILE - 2, y + TILE / 2);
        ctx.stroke();
        ctx.fillStyle = '#c9a227';
        ctx.beginPath();
        ctx.arc(x + 4, y + TILE / 2, 3, 0, Math.PI * 2);
        ctx.arc(x + TILE - 4, y + TILE / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawExit(ctx, world) {
  const { level, loot } = world;
  const x = level.exit.x;
  const y = HUD_H + level.exit.y;
  const open = loot.diamondTaken;
  ctx.fillStyle = open ? COLORS.exit : COLORS.exitLocked;
  ctx.fillRect(x - 16, y - 16, 32, 32);
  ctx.strokeStyle = open ? '#bff0cf' : '#e8a0a0';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 16, y - 16, 32, 32);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCK', x, y + 4);
  if (open) {
    // A green beacon so the getaway reads at a glance.
    ctx.strokeStyle = 'rgba(63,174,106,0.7)';
    ctx.lineWidth = 2;
    const r = 26 + Math.sin(world.time * 4) * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCameras(ctx, world) {
  for (const cam of world.cameras) {
    const x = cam.x;
    const y = HUD_H + cam.y;
    const disabled = world.time < cam.disabledUntil;
    ctx.fillStyle = disabled ? '#3a3f45' : COLORS.cameraBody;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0c0e10';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = disabled ? '#666' : COLORS.cameraLens;
    ctx.beginPath();
    ctx.arc(x + Math.cos(cam.facing) * 5, y + Math.sin(cam.facing) * 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (disabled) {
      ctx.strokeStyle = '#ff5a4a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 6);
      ctx.lineTo(x + 6, y + 6);
      ctx.moveTo(x + 6, y - 6);
      ctx.lineTo(x - 6, y + 6);
      ctx.stroke();
    }
  }
}

function drawGuards(ctx, world) {
  for (const g of world.guards) {
    const x = g.x;
    const y = HUD_H + g.y;
    const alert = g.state === 'chase';
    const wary = g.state === 'investigate';
    ctx.fillStyle = alert ? COLORS.guardAlert : wary ? '#8a6a2f' : COLORS.guardBody;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0c0e10';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick and cap brim.
    ctx.strokeStyle = '#e8ddc4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(g.facing) * 17, y + Math.sin(g.facing) * 17);
    ctx.stroke();
    ctx.fillStyle = '#1c2733';
    ctx.beginPath();
    ctx.arc(x - Math.cos(g.facing) * 4, y - Math.sin(g.facing) * 4, 6, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion "?" / "!" over the head.
    if (g.suspicion >= 0.3) {
      ctx.fillStyle = alert ? '#ff5040' : '#ffd65a';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(alert ? '!' : '?', x, y - 20);
    }
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  const x = p.x;
  const y = HUD_H + p.y;
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerCoat;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Facing wedge and hat brim.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, 10, p.facing - 0.5, p.facing + 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1c2733';
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(232,193,90,0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawEffects(ctx, world) {
  const { time } = world;
  for (const s of world.smokes) {
    if (time > s.until) continue;
    const x = s.x;
    const y = HUD_H + s.y;
    const fade = clamp((s.until - time) / 1.5, 0, 1);
    ctx.fillStyle = COLORS.smoke.replace('0.55', String(0.55 * fade));
    ctx.beginPath();
    ctx.arc(x, y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220,225,235,${0.35 * fade})`;
    ctx.beginPath();
    ctx.arc(x - 18, y - 10, s.radius * 0.45, 0, Math.PI * 2);
    ctx.arc(x + 16, y + 12, s.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const c of world.coins) {
    if (time > c.until) continue;
    const x = c.x;
    const y = HUD_H + c.y;
    const blink = Math.sin(time * 8) > 0 ? 1 : 0.55;
    ctx.fillStyle = `rgba(242,193,78,${blink})`;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(242,193,78,${0.5 * blink})`;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const f of world.empFlashes) {
    if (time > f.until) continue;
    const a = clamp((f.until - time) / 0.5, 0, 1);
    ctx.strokeStyle = `rgba(127,231,255,${0.8 * a})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(f.x, HUD_H + f.y, f.radius * (1 - a * 0.3), 0, Math.PI * 2);
    ctx.stroke();
  }
  // Floating pickup text.
  for (const pop of world.popups) {
    const age = time - pop.at;
    if (age > 1.6) continue;
    ctx.fillStyle = `rgba(232,221,196,${1 - age / 1.6})`;
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pop.text, pop.x, HUD_H + pop.y - age * 26);
  }
}

function drawHud(ctx, world) {
  const { level, alarm, loot, player, time, status } = world;
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#3a2f24';
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  // Room name and objective.
  ctx.fillStyle = COLORS.hudText;
  ctx.font = FONT_HUD;
  ctx.textAlign = 'left';
  ctx.fillText(level.name, 14, 22);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = FONT_SMALL;
  ctx.fillText(
    loot.diamondTaken ? 'Diamond secured — reach the EXIT!' : 'Steal the Sunspire Diamond, then escape.',
    14,
    44,
  );

  // Alarm meter, front and centre.
  const ax = 330;
  const aw = 300;
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = FONT_HUD;
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 22);
  ctx.fillStyle = '#241a12';
  ctx.fillRect(ax, 28, aw, 16);
  const frac = alarm.value / 100;
  const grad = ctx.createLinearGradient(ax, 0, ax + aw, 0);
  grad.addColorStop(0, '#3fae6a');
  grad.addColorStop(0.55, '#e8c15a');
  grad.addColorStop(1, '#ff5040');
  ctx.fillStyle = grad;
  ctx.fillRect(ax, 28, aw * frac, 16);
  ctx.strokeStyle = '#6a5a44';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax + 0.5, 28.5, aw, 16);
  ctx.fillStyle = alarm.spotted ? '#ff5040' : COLORS.hudText;
  ctx.font = FONT_MONO;
  ctx.fillText(`${Math.round(alarm.value)}%`, ax + aw + 8, 42);
  if (alarm.spotted && status === 'playing') {
    ctx.fillStyle = Math.sin(time * 10) > 0 ? '#ff5040' : '#ffb0a0';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.fillText('SPOTTED!', ax, 58);
  } else if (alarm.hunts) {
    ctx.fillStyle = '#ff9040';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.fillText('THEY ARE HUNTING', ax, 58);
  }

  // Loot and tools, right side.
  const rx = VIEW_W - 14;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = FONT_HUD;
  ctx.textAlign = 'right';
  ctx.fillText(`LOOT $${loot.value.toLocaleString()}`, rx, 22);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = FONT_SMALL;
  const tools = player.tools;
  ctx.fillText(`[1] Smoke ${tools.smoke}   [2] EMP ${tools.emp}   [3] Coin ${tools.coin}`, rx, 44);
  // The run clock sits under the tools so it never collides with the
  // SPOTTED / HUNTING warning under the alarm meter.
  ctx.fillStyle = COLORS.hudText;
  ctx.font = FONT_MONO;
  ctx.fillText(fmtTime(world.levelTime), rx, 58);
  void time;
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---- Screens ----------------------------------------------------------

function dim(ctx) {
  ctx.fillStyle = 'rgba(10, 8, 6, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H + HUD_H);
}

export function drawTitle(ctx, world) {
  drawWorld(ctx, world);
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c15a';
  ctx.font = FONT_TITLE;
  ctx.fillText(STORY.title, VIEW_W / 2, 190);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillText(`Midnight at ${STORY.gallery}. One thief, one diamond, one way out.`, VIEW_W / 2, 228);
  ctx.font = FONT_SMALL;
  ctx.fillStyle = COLORS.hudDim;
  const lines = [
    'WASD / Arrows — move        Shift — sneak (slower, harder to spot)',
    '1 — Smoke bomb    2 — EMP pulse (blinds cameras)    3 — Toss a coin to lure a guard',
    'Walk into loot to lift it. Grab the Sunspire Diamond, then reach the green EXIT.',
    'If the alarm hits 100%, the guards catch you. Three rooms stand between you and dawn.',
    '',
    'Press ENTER or click to begin the heist.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 300 + i * 26));
  ctx.fillStyle = '#e8c15a';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('M — mute sound', VIEW_W / 2, 300 + lines.length * 26 + 8);
}

export function drawCaught(ctx, world) {
  drawWorld(ctx, world);
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5040';
  ctx.font = FONT_TITLE;
  ctx.fillText('CAUGHT!', VIEW_W / 2, 220);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '18px Georgia, serif';
  ctx.fillText('The alarm hit 100%. The guards close in, and the night is over.', VIEW_W / 2, 262);
  ctx.font = FONT_SMALL;
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText(`Loot carried: $${world.loot.value.toLocaleString()} — alarms raised: ${world.alarm.triggered}`, VIEW_W / 2, 300);
  ctx.fillStyle = '#e8c15a';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Press R to retry this room.', VIEW_W / 2, 350);
}

export function drawLevelDone(ctx, world, tally) {
  drawWorld(ctx, world);
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3fae6a';
  ctx.font = FONT_TITLE;
  ctx.fillText('ROOM CLEAR', VIEW_W / 2, 200);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '18px Georgia, serif';
  ctx.fillText('You slipped out the service door, diamond in hand.', VIEW_W / 2, 240);
  ctx.font = FONT_SMALL;
  ctx.fillStyle = COLORS.hudDim;
  tally.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 290 + i * 26));
  ctx.fillStyle = '#e8c15a';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Press ENTER for the next room.', VIEW_W / 2, 290 + tally.length * 26 + 20);
}

export function drawWin(ctx, world, tally) {
  drawWorld(ctx, world);
  dim(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c15a';
  ctx.font = FONT_TITLE;
  ctx.fillText('THE GETAWAY', VIEW_W / 2, 190);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '18px Georgia, serif';
  ctx.fillText('Three rooms, one diamond, and dawn breaking over the river.', VIEW_W / 2, 230);
  ctx.fillText('Wren vanishes into the morning crowd. The Marlowe never saw a thing.', VIEW_W / 2, 258);
  ctx.font = FONT_SMALL;
  ctx.fillStyle = COLORS.hudDim;
  tally.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 300 + i * 26));
  ctx.fillStyle = '#e8c15a';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Press R to run the heist again.', VIEW_W / 2, 300 + tally.length * 26 + 20);
}

export { SCORE };
