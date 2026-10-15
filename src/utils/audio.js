// audio.js - High performance Web Audio API Sound FX for FOX BATTLE ROYALE
// Procedural audio generation with zero external files, no memory leaks, strict throttling

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.lastLaserTime = 0;
    this.lastExplosionTime = 0;
    this.lastBeepSecond = -1;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn('Web Audio not supported', e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  // Countdown Beep (1 beep per second in last 3s)
  playCountdownBeep(freq = 560, duration = 0.1) {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {}
  }

  // Battle Start Horn
  playBattleStart() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      [587, 740, 880, 1175].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = t + idx * 0.07;
        const dur = 0.45;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch (e) {}
  }

  // Laser shot (strictly throttled to max 6 shots/sec to prevent audio buffer spikes)
  playLaser() {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.lastLaserTime < 160) return;
    this.lastLaserTime = now;

    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  // Explosion sound (throttled to max 4 explosions/sec)
  playExplosion() {
    if (this.isMuted) return;
    const now = performance.now();
    if (now - this.lastExplosionTime < 220) return;
    this.lastExplosionTime = now;

    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const dur = 0.3;

      // Low pitch boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + dur);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {}
  }

  // Victory fanfare
  playVictory() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const notes = [
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.15 },
        { f: 783.99, d: 0.18 },
        { f: 1046.50, d: 0.55 }
      ];

      let t = this.ctx.currentTime;
      notes.forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + note.d);

        t += note.d * 0.9;
      });
    } catch (e) {}
  }
}

export const soundFX = new SoundManager();
