// grandDrawAudio.js - Procedural Web Audio API sound generator for Grand Draw Cinematic 3D
// Fully self-contained without needing external sound assets

class GrandDrawAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.sfxVolume = 0.9;
    this.bgmVolume = 0.5;

    // Tumbling continuous loop source
    this.tumbleFilter = null;
    this.tumbleGain = null;
    this.tumbleNoiseNode = null;
    this.isTumbling = false;

    // Ambient room tone
    this.ambientGain = null;

    // Spin background music (/music.mp3)
    this.spinMusicAudio = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // BGM / Ambient bus
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.startAmbientTheater();
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
    if (this.spinMusicAudio) {
      this.spinMusicAudio.volume = this.isMuted ? 0 : (this.masterVolume * this.bgmVolume);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  setBgmVolume(val) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(this.bgmVolume, this.ctx.currentTime, 0.05);
    }
    if (this.spinMusicAudio) {
      this.spinMusicAudio.volume = this.isMuted ? 0 : (this.masterVolume * this.bgmVolume);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
    if (this.spinMusicAudio) {
      this.spinMusicAudio.volume = muted ? 0 : (this.masterVolume * this.bgmVolume);
    }
  }

  // Soft low-frequency theater room tone + warm vinyl hiss
  startAmbientTheater() {
    if (!this.ctx || this.ambientGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.03;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const lowPass = this.ctx.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 180;

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      whiteNoise.connect(lowPass);
      lowPass.connect(this.ambientGain);
      this.ambientGain.connect(this.bgmGain);
      whiteNoise.start();
    } catch {
      // Ignore audio init restriction before gesture
    }
  }

  // Tactile click when hovering or clicking 3D props (wood/brass)
  playPropHover() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Ratchet crank tick (when user turns or clicks crank)
  playCrankRatchet() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.035);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Heavy brass lid clank
  playLidClank() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Metallic body
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(280, now);
    osc1.frequency.exponentialRampToValueAtTime(70, now + 0.25);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(640, now);
    osc2.frequency.exponentialRampToValueAtTime(120, now + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);
  }

  // Small ball drop into cage during loading
  playBallDrop(pitchMultiplier = 1) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    const baseFreq = 750 * pitchMultiplier;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.Q.value = 6;

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Dynamic continuous cage tumbling noise
  startTumble() {
    this.ensureContext();
    if (!this.ctx || this.isTumbling) return;
    try {
      this.isTumbling = true;
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.tumbleNoiseNode = this.ctx.createBufferSource();
      this.tumbleNoiseNode.buffer = noiseBuffer;
      this.tumbleNoiseNode.loop = true;

      this.tumbleFilter = this.ctx.createBiquadFilter();
      this.tumbleFilter.type = 'bandpass';
      this.tumbleFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.tumbleFilter.Q.value = 3.5;

      this.tumbleGain = this.ctx.createGain();
      this.tumbleGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.tumbleGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.4);

      this.tumbleNoiseNode.connect(this.tumbleFilter);
      this.tumbleFilter.connect(this.tumbleGain);
      this.tumbleGain.connect(this.sfxGain);

      this.tumbleNoiseNode.start();
    } catch {
      // Audio context might need user interaction
    }
  }

  updateTumbleIntensity(speedRatio) {
    if (!this.ctx || !this.tumbleGain || !this.tumbleFilter) return;
    const now = this.ctx.currentTime;
    const clamped = Math.max(0.05, Math.min(1.5, speedRatio));
    this.tumbleFilter.frequency.setTargetAtTime(600 + clamped * 1200, now, 0.08);
    this.tumbleGain.gain.setTargetAtTime(Math.min(0.5, clamped * 0.4), now, 0.08);
  }

  stopTumble() {
    if (!this.isTumbling || !this.tumbleGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.tumbleGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
      setTimeout(() => {
        if (this.tumbleNoiseNode) {
          try { this.tumbleNoiseNode.stop(); } catch {}
          this.tumbleNoiseNode = null;
        }
        this.isTumbling = false;
      }, 550);
    } catch {
      this.isTumbling = false;
    }
  }

  // Ball rolling down curved chute
  playChuteRoll() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.6);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.value = 2.5;

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  // Ball opens: golden chime, mechanical shell split & harmonic bloom
  playBallCrackBloom() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Mechanical snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(1800, now);
    snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.06);
    snapGain.gain.setValueAtTime(0.4, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    snapOsc.connect(snapGain);
    snapGain.connect(this.sfxGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.07);

    // 2. Warm golden harmonic chime (A major chords: 440, 554, 659, 880)
    const freqs = [440, 554.37, 659.25, 880, 1108.73];
    freqs.forEach((freq, idx) => {
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(freq, now + idx * 0.03);

      const delay = idx * 0.03;
      chimeGain.gain.setValueAtTime(0.001, now + delay);
      chimeGain.gain.linearRampToValueAtTime(0.25 / (idx + 1), now + delay + 0.04);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.8);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.sfxGain);

      chimeOsc.start(now + delay);
      chimeOsc.stop(now + delay + 1.9);
    });
  }

  // Regal brass fanfare / chime when ticket unfurls
  playTicketRevealFanfare() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Soft paper rustle
    const rustleOsc = this.ctx.createOscillator();
    const rustleGain = this.ctx.createGain();
    rustleOsc.type = 'sawtooth';
    rustleOsc.frequency.setValueAtTime(240, now);
    rustleGain.gain.setValueAtTime(0.08, now);
    rustleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    rustleOsc.connect(rustleGain);
    rustleGain.connect(this.sfxGain);
    rustleOsc.start(now);
    rustleOsc.stop(now + 0.26);

    // Harmonious regal brass swell
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + 0.15 + i * 0.07);

      const start = now + 0.15 + i * 0.07;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 2.3);
    });
  }

  // Play spin music (/music_quay.mp3 - music quay.mp3)
  playSpinMusic() {
    this.ensureContext();
    if (!this.spinMusicAudio) {
      this.spinMusicAudio = new Audio('/music_quay.mp3');
      this.spinMusicAudio.loop = true;
    }
    const vol = this.isMuted ? 0 : (this.masterVolume * this.bgmVolume);
    this.spinMusicAudio.volume = Math.max(0, Math.min(1, vol));
    this.spinMusicAudio.currentTime = 0;
    this.spinMusicAudio.play().catch(e => {
      console.warn('Could not auto-play spin music:', e);
    });
  }

  // Stop spin music with smooth fade-out
  stopSpinMusic() {
    if (!this.spinMusicAudio) return;
    try {
      const initialVol = this.spinMusicAudio.volume;
      let step = 0;
      const fadeInterval = setInterval(() => {
        step++;
        if (this.spinMusicAudio) {
          this.spinMusicAudio.volume = Math.max(0, initialVol * (1 - step / 8));
        }
        if (step >= 8) {
          clearInterval(fadeInterval);
          if (this.spinMusicAudio) {
            this.spinMusicAudio.pause();
            this.spinMusicAudio.currentTime = 0;
          }
        }
      }, 50);
    } catch {
      if (this.spinMusicAudio) {
        this.spinMusicAudio.pause();
        this.spinMusicAudio.currentTime = 0;
      }
    }
  }
}

export const grandAudio = new GrandDrawAudio();

