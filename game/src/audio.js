// Tiny synthesised sound effects. No audio files: every cue is a short
// WebAudio oscillator phrase, so the game stays a handful of static files.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    // Called from the first user gesture so the context is allowed to start.
    unlock() {
      ensure();
    },
    step() {
      tone(180, 0.05, 'sine', 0.04);
    },
    pickup() {
      tone(660, 0.12, 'sine', 0.12);
      tone(990, 0.16, 'sine', 0.1, 0.07);
    },
    diamond() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.09));
    },
    smoke() {
      tone(300, 0.35, 'sawtooth', 0.05, 0, 90);
    },
    emp() {
      tone(1200, 0.3, 'square', 0.05, 0, 120);
    },
    coin() {
      tone(1400, 0.07, 'square', 0.06);
      tone(1400, 0.07, 'square', 0.06, 0.16);
    },
    spotted() {
      tone(880, 0.12, 'square', 0.07);
      tone(880, 0.12, 'square', 0.07, 0.14);
    },
    alarmTick() {
      tone(440, 0.09, 'square', 0.05);
    },
    caught() {
      [392, 311, 233, 175].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.09, i * 0.16));
    },
    escape() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.25, 'triangle', 0.11, i * 0.1));
    },
  };
}
