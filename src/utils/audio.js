// audio.js - High performance Web Audio API Sound FX for FOX BATTLE ROYALE
// Features procedural SFX and custom background music for lobby phase

import lobbyMusicFile from '../assets/music.mp3';

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.lastLaserTime = 0;
    this.lastExplosionTime = 0;
    this.lastBeepSecond = -1;

    // Lobby Background Music (HTMLAudioElement for reliable playback & loop)
    this.lobbyAudio = null;
    this.lobbyBaseVolume = 0.55;
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

  initLobbyAudio() {
    if (this.lobbyAudio) return;
    try {
      this.lobbyAudio = new Audio(lobbyMusicFile || '/music.mp3');
      this.lobbyAudio.loop = true;
      this.lobbyAudio.volume = this.lobbyBaseVolume;
      this.lobbyAudio.muted = this.isMuted;
    } catch (e) {
      console.warn('Lobby music init error', e);
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
    if (this.lobbyAudio) {
      this.lobbyAudio.muted = muted;
    }
  }

  // Play lobby music starting at 0:00 according to configured lobby duration
  playLobbyMusic() {
    if (this.isMuted) return;
    this.initLobbyAudio();
    if (!this.lobbyAudio) return;

    try {
      this.lobbyAudio.currentTime = 0;
      this.lobbyAudio.volume = this.lobbyBaseVolume;
      this.lobbyAudio.muted = this.isMuted;
      const playPromise = this.lobbyAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Lobby music playback prevented', err);
        });
      }
    } catch (e) {
      console.warn('Play lobby music error', e);
    }
  }

  // Update lobby music volume (smoothly fades out in the last 2.5s of lobby)
  updateLobbyMusic(timeLeft) {
    if (!this.lobbyAudio || this.isMuted) return;
    if (timeLeft <= 2.5 && timeLeft > 0) {
      const factor = Math.max(0, timeLeft / 2.5);
      this.lobbyAudio.volume = this.lobbyBaseVolume * factor;
    } else if (timeLeft > 2.5) {
      this.lobbyAudio.volume = this.lobbyBaseVolume;
    }
  }

  // Stop lobby music completely (when battle starts or reset)
  stopLobbyMusic() {
    if (!this.lobbyAudio) return;
    try {
      this.lobbyAudio.pause();
      this.lobbyAudio.currentTime = 0;
      this.lobbyAudio.volume = this.lobbyBaseVolume;
    } catch (e) {}
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

  // Start Horn (used for race start)
  playStartHorn() {
    this.playBattleStart();
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

  // Punch impact sound (throttled to max 7 punches/sec)
  playPunch() {
    if (this.isMuted) return;
    const now = performance.now();
    if (!this.lastPunchTime) this.lastPunchTime = 0;
    if (now - this.lastPunchTime < 130) return;
    this.lastPunchTime = now;

    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.095);
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

  // Cinematic door shutter drop sound (heavy descent + latch over ~1.4s)
  playDoorDrop() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Low descending whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 1.25);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 1.35);

      // Metallic impact thump at bottom when door shuts at 1.3s
      const impactOsc = this.ctx.createOscillator();
      const impactGain = this.ctx.createGain();
      impactOsc.type = 'triangle';
      impactOsc.frequency.setValueAtTime(115, t + 1.3);
      impactOsc.frequency.exponentialRampToValueAtTime(28, t + 1.65);

      impactGain.gain.setValueAtTime(0.32, t + 1.3);
      impactGain.gain.exponentialRampToValueAtTime(0.001, t + 1.65);

      impactOsc.connect(impactGain);
      impactGain.connect(this.ctx.destination);
      impactOsc.start(t + 1.3);
      impactOsc.stop(t + 1.65);
    } catch (e) {}
  }

  // Pneumatic / cyber door sliding open sound (over ~2.6s)
  playDoorOpen() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.linearRampToValueAtTime(320, t + 2.2);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 2.5);
    } catch (e) {}
  }
}

export const soundFX = new SoundManager();
