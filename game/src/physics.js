// Axis-separated circle-vs-tile collision: slide along a wall instead of
// sticking to it. Used by the thief and by every guard.
import { TILE } from './config.js';
import { blocksMove } from './levels.js';

export function moveEntity(lv, ent, dx, dy) {
  const r = ent.radius;
  // X axis, then Y axis, so a diagonal push slides along the wall.
  let nx = ent.x + dx;
  if (dx !== 0) {
    const top = Math.floor((ent.y - r + 1) / TILE);
    const bottom = Math.floor((ent.y + r - 1) / TILE);
    const edge = dx > 0 ? Math.floor((nx + r) / TILE) : Math.floor((nx - r) / TILE);
    for (let ty = top; ty <= bottom; ty++) {
      if (blocksMove(lv, edge, ty)) {
        nx = dx > 0 ? edge * TILE - r - 0.01 : (edge + 1) * TILE + r + 0.01;
        break;
      }
    }
  }
  ent.x = nx;
  let ny = ent.y + dy;
  if (dy !== 0) {
    const left = Math.floor((ent.x - r + 1) / TILE);
    const right = Math.floor((ent.x + r - 1) / TILE);
    const edge = dy > 0 ? Math.floor((ny + r) / TILE) : Math.floor((ny - r) / TILE);
    for (let tx = left; tx <= right; tx++) {
      if (blocksMove(lv, tx, edge)) {
        ny = dy > 0 ? edge * TILE - r - 0.01 : (edge + 1) * TILE + r + 0.01;
        break;
      }
    }
  }
  ent.y = ny;
}
