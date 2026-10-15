// lotteryAudio.js - High-fidelity Web Audio API sound effects for 3D Lottery Drum
class LotteryAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.spinOsc = null;
    this.spinGain = null;
    this.rattleInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stopDrumSpin();
    }
  }

  // Continuous mechanical drum hum & motor sound
  startDrumSpin(intensity = 0.5) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    if (this.spinOsc) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 2.0);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 2.0);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12 * intensity, now + 0.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      this.spinOsc = osc;
      this.spinGain = gain;

      // Realistic rattling / clattering of 400 balls tumbling inside acrylic drum
      this.rattleInterval = setInterval(() => {
        if (!this.isMuted && Math.random() < 0.85) {
          this.playBallClack(0.2 + Math.random() * 0.4);
        }
      }, 70);
    } catch {
      // Fallback
    }
  }

  // Update drum spin pitch as it speeds up or slows down
  updateDrumSpeed(factor) {
    if (!this.spinOsc || !this.ctx || this.isMuted) return;
    try {
      const freq = 65 + factor * 110;
      this.spinOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    } catch {
      // Fallback
    }
  }

  stopDrumSpin() {
    if (this.rattleInterval) {
      clearInterval(this.rattleInterval);
      this.rattleInterval = null;
    }

    if (this.spinOsc && this.spinGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.spinGain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        this.spinOsc.stop(now + 0.45);
      } catch {
        // Ignore
      }
      this.spinOsc = null;
      this.spinGain = null;
    }
  }

  // Single ball impact / click sound
  playBallClack(volume = 0.3) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 800 + Math.random() * 1200;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, now + 0.035);

      gain.gain.setValueAtTime(volume * 0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  // Ball suction / extraction whoosh sound
  playExtractionWhoosh() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.35);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.Q.setValueAtTime(3, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Ignore
    }
  }

  // Ball rolling down chute and clicking into holder tray
  playBallDrop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Double click effect
      [0, 0.08, 0.15].forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const freq = 550 - idx * 70;
        osc.frequency.setValueAtTime(freq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(180, now + offset + 0.07);

        gain.gain.setValueAtTime(0.25 / (idx + 1), now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.08);
      });
    } catch {
      // Ignore
    }
  }

  // Grand fanfare when winning student is announced
  playWinnerFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [
        { f: 523.25, d: 0.14, t: 0 },    // C5
        { f: 659.25, d: 0.14, t: 0.14 }, // E5
        { f: 783.99, d: 0.16, t: 0.28 }, // G5
        { f: 1046.50, d: 0.5, t: 0.44 }  // C6 (Triumphant chord)
      ];

      const now = this.ctx.currentTime;
      notes.forEach(({ f, d, t }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0.01, now + t);
        gain.gain.linearRampToValueAtTime(0.25, now + t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + d + 0.05);
      });
    } catch {
      // Ignore
    }
  }
}

export const lotteryAudio = new LotteryAudio();

