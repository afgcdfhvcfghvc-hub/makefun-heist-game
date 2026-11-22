// The alarm meter: the game's shared tension. It climbs while any guard
// or camera has eyes on the thief, drains while hidden, and at 100 the
// heist is over. Crossing the hunt line turns patrols into a manhunt.
import { ALARM } from './config.js';
import { clamp } from './random.js';

export function createAlarm() {
  return {
    value: 0,
    spotted: false, // anyone can currently see the thief
    hunts: false, // guards are actively hunting
    triggered: 0, // how many times the alarm crossed the hunt line
    wasHunting: false,
    tickBeepAt: 0,

    update(dt, anyoneSees, time) {
      this.spotted = anyoneSees;
      if (anyoneSees) {
        this.value = clamp(this.value + ALARM.risePerSecond * dt, 0, ALARM.max);
      } else {
        this.value = clamp(this.value - ALARM.decayPerSecond * dt, 0, ALARM.max);
      }
      this.hunts = this.value >= ALARM.huntAt;
      if (this.hunts && !this.wasHunting) this.triggered += 1;
      this.wasHunting = this.hunts;
      // A rising beep while the meter is high keeps the pressure audible.
      if (this.value >= 70 && time - this.tickBeepAt > 0.6) {
        this.tickBeepAt = time;
        return 'tick';
      }
      return null;
    },

    get caught() {
      return this.value >= ALARM.max;
    },

    get suspicious() {
      return this.value >= ALARM.suspiciousAt;
    },

    reset() {
      this.value = 0;
      this.spotted = false;
      this.hunts = false;
      this.wasHunting = false;
    },
  };
}
