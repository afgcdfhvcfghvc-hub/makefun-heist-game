// The three rooms of the Marlowe Gallery. Each level is a tile map plus the
// people and machines watching it. Legend: '#' wall, '.' floor, 'C' crate,
// 'D' display case, 'P' potted plant, 'V' velvet rope (blocks movement,
// not sight). Guards, cameras and loot are placed by tile below the map.
import { TILE } from './config.js';

function level(def) {
  const rows = def.map;
  const width = rows[0].length;
  const height = rows.length;
  // Markers placed by the level definition (start, diamond, exit, loot)
  // are floor to walk on; the grid only keeps walls and cover.
  const grid = rows.map((row) =>
    row.split('').map((t) => ('SE*L'.includes(t) ? '.' : t)),
  );
  const px = (tx) => tx * TILE + TILE / 2;
  const py = (ty) => ty * TILE + TILE / 2;
  return {
    name: def.name,
    briefing: def.briefing,
    width,
    height,
    grid,
    start: { x: px(def.start[0]), y: py(def.start[1]) },
    diamond: { x: px(def.diamond[0]), y: py(def.diamond[1]), tx: def.diamond[0], ty: def.diamond[1] },
    exit: { x: px(def.exit[0]), y: py(def.exit[1]), tx: def.exit[0], ty: def.exit[1] },
    guards: def.guards.map((g) => ({
      waypoints: g[0].map(([tx, ty]) => ({ x: px(tx), y: py(ty) })),
      facing: g[1],
    })),
    cameras: def.cameras.map(([tx, ty, baseAngle, sweep]) => ({
      x: px(tx),
      y: py(ty),
      baseAngle,
      sweep,
    })),
    loot: def.loot.map(([tx, ty, kind]) => ({ x: px(tx), y: py(ty), kind, taken: false })),
  };
}

// Tile helpers shared by movement, vision and rendering.
export function tileAt(lv, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= lv.width || ty >= lv.height) return '#';
  return lv.grid[ty][tx];
}

export function blocksMove(lv, tx, ty) {
  return tileAt(lv, tx, ty) !== '.';
}

export function blocksSight(lv, tx, ty) {
  const t = tileAt(lv, tx, ty);
  return t === '#' || t === 'C' || t === 'D' || t === 'P';
}

// Walk the line between two points in small steps; sight is lost if any
// sampled tile blocks it. Cheap, and good enough for cone checks.
export function lineOfSight(lv, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(length / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x1 + dx * t) / TILE);
    const ty = Math.floor((y1 + dy * t) / TILE);
    if (blocksSight(lv, tx, ty)) return false;
  }
  return true;
}

export const LEVELS = [
  level({
    name: 'Room 1 — The Lobby',
    briefing: 'Slip past the night guards, lift the Sunspire Diamond, and leave through the service door.',
    start: [1, 1],
    diamond: [7, 13],
    exit: [14, 13],
    map: [
      '########################',
      '#S......#......#.......#',
      '#.......#......#...L...#',
      '#..C....#..C...#.......#',
      '#.......#......#.......#',
      '#..............#...#...#',
      '#..##...#..##..#.......#',
      '#.......#......#..C....#',
      '#..C....D......#.......#',
      '#.......#..........L...#',
      '#..##...#..##..#.......#',
      '#.......#......#.......#',
      '#..C....#..C...#..C....#',
      '#......*......E........#',
      '########################',
    ],
    guards: [
      [[[2, 2], [2, 11], [6, 11], [6, 2]], 0],
      [[[17, 2], [21, 2], [21, 10], [17, 10]], Math.PI],
    ],
    cameras: [
      [12, 1, Math.PI / 2, 0.9],
      [19, 7, Math.PI, 0.8],
    ],
    loot: [
      [19, 2, 'painting'],
      [19, 9, 'gold'],
    ],
  }),
  level({
    name: 'Room 2 — The Gallery Hall',
    briefing: 'The hall is longer, the patrols overlap, and the cameras sweep the main walk. Use the side aisles.',
    start: [1, 13],
    diamond: [22, 1],
    exit: [21, 13],
    map: [
      '########################',
      '#.......#......#......*.#',
      '#..C....#..C...#..C....#',
      '#.......#......#.......#',
      '#..##......##..#..##...#',
      '#.......#......#.......#',
      '#..C....D......#..C....#',
      '#.......#......#.......#',
      '#..##...#..##.....##...#',
      '#.......#......#.......#',
      '#..C....#..C...#..C....#',
      '#.......#......#.......#',
      '#L......#..L...#....L..#',
      '#S...................E.#',
      '########################',
    ],
    guards: [
      [[[2, 1], [2, 12], [6, 12], [6, 1]], 0],
      [[[10, 1], [10, 12], [13, 12], [13, 1]], Math.PI],
      [[[17, 3], [21, 3], [21, 12], [17, 12]], -Math.PI / 2],
    ],
    cameras: [
      [9, 1, Math.PI / 2, 1.0],
      [16, 7, Math.PI, 0.9],
      [12, 13, -Math.PI / 2, 0.9],
    ],
    loot: [
      [1, 12, 'painting'],
      [11, 12, 'vase'],
      [20, 12, 'gold'],
    ],
  }),
  level({
    name: 'Room 3 — The Vault',
    briefing: 'The diamond sits behind the vault glass. Three guards, four cameras, no easy line. Take it slow.',
    start: [11, 13],
    diamond: [12, 2],
    exit: [22, 13],
    map: [
      '########################',
      '#......#........#......#',
      '#..C...#...D*D..#..C...#',
      '#......#........#......#',
      '#..##..#..####..#..##..#',
      '#......#........#......#',
      '#..C......C..C..#..C...#',
      '#......#........#......#',
      '#..##..#..####..#..##..#',
      '#......#........#......#',
      '#..C...#..C..C.....C...#',
      '#......#........#......#',
      '#..L...#...L....#..L...#',
      '#..........S...........#',
      '########################',
    ],
    guards: [
      [[[2, 1], [2, 12], [5, 12], [5, 1]], 0],
      [[[17, 1], [17, 12], [21, 12], [21, 1]], Math.PI],
      [[[8, 5], [8, 9], [9, 9], [9, 5]], Math.PI / 2],
    ],
    cameras: [
      [12, 1, Math.PI / 2, 1.1],
      [2, 7, 0, 0.9],
      [21, 7, Math.PI, 0.9],
      [12, 13, -Math.PI / 2, 1.0],
    ],
    loot: [
      [3, 12, 'gold'],
      [11, 12, 'painting'],
      [19, 12, 'vase'],
    ],
  }),
];
