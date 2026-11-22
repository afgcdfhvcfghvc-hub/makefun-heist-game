// Loot: the Sunspire Diamond (the job) plus the side pieces a greedy
// thief lifts on the way. Each piece has a value and a name for the HUD
// and the end-of-level tally.
import { SCORE } from './config.js';
import { dist } from './random.js';

export const LOOT_KINDS = {
  painting: { value: SCORE.painting, label: 'Portrait of a Duchess', color: '#c98a4b', radius: 15 },
  gold: { value: SCORE.gold, label: 'Gold ingot', color: '#f2c14e', radius: 13 },
  vase: { value: SCORE.vase, label: 'Ming vase', color: '#7fb3d5', radius: 13 },
};

export function createLoot(level) {
  return {
    diamondTaken: false,
    pieces: level.loot.map((l) => ({ ...l, kind: l.kind })),
    value: 0,

    // Returns the piece just grabbed (or the diamond), or null.
    tryGrab(player) {
      if (!this.diamondTaken && dist(player.x, player.y, level.diamond.x, level.diamond.y) < 30) {
        this.diamondTaken = true;
        this.value += SCORE.diamond;
        return { kind: 'diamond', label: 'the Sunspire Diamond', value: SCORE.diamond };
      }
      for (const piece of this.pieces) {
        if (piece.taken) continue;
        const def = LOOT_KINDS[piece.kind];
        if (dist(player.x, player.y, piece.x, piece.y) < def.radius + 14) {
          piece.taken = true;
          this.value += def.value;
          return { kind: piece.kind, label: def.label, value: def.value };
        }
      }
      return null;
    },

    get sideTaken() {
      return this.pieces.filter((p) => p.taken).length;
    },

    get sideTotal() {
      return this.pieces.length;
    },
  };
}
