// raceEngine.js - High-Performance Physics & Simulation Engine for FOX RACE
// Exact 10-second race simulation with ultra-smooth acceleration and balanced competition.

export const RACE_DURATION = 10.0; // Exactly 10.0 seconds

export class RaceEngine {
  constructor() {
    this.foxes = [];
    this.playerList = [];
    this.raceTime = 0; // elapsed seconds
    this.isRacing = false;
    this.isFinished = false;
    this.startTime = null;
    this.winner = null;
    this.top10 = [];
    this.totalLanes = 40;
    this.startLineX = 420; // 1/4 screen mark
    this.finishLineDistance = 4600;
  }

  // Initialize foxes: All 400 foxes fit neatly within the left 1/4 of screen width, distributed vertically
  initFoxes(playerList, canvasHeight = 800, canvasWidth = 1400) {
    this.playerList = playerList;
    this.raceTime = 0;
    this.isRacing = false;
    this.isFinished = false;
    this.winner = null;
    this.top10 = [];

    const count = playerList.length;
    if (count === 0) {
      this.foxes = [];
      return;
    }

    // 1. Establish Start Line at roughly 1/4 of the screen width (25% to 28%)
    const quarterWidth = Math.max(300, Math.min(canvasWidth * 0.25, 450));
    this.startLineX = quarterWidth;
    this.finishLineDistance = this.startLineX + 4150; // 10s sprint target

    // 2. Vertical distribution: maximize lanes across height so foxes are nicely spread vertically
    const topPadding = 42;
    const bottomPadding = 42;
    const trackHeight = Math.max(canvasHeight - topPadding - bottomPadding, 480);

    // Spread foxes vertically across 30 - 38 lanes with adequate spacing for larger foxes
    const optimalLanes = Math.min(38, Math.max(16, Math.floor(trackHeight / 19.5)));
    this.totalLanes = optimalLanes;
    const laneHeight = trackHeight / optimalLanes;

    // 3. Horizontal columns: fit within [20px, quarterWidth - 35px]
    const maxColumns = Math.ceil(count / optimalLanes);
    const availableWidth = quarterWidth - 40;
    const colSpacing = Math.max(32, availableWidth / Math.max(1, maxColumns));

    this.foxes = playerList.map((player, index) => {
      // Lane index (vertical row)
      const lane = index % optimalLanes;
      // Column index (horizontal)
      const colIndex = Math.floor(index / optimalLanes);

      // Subtle stagger on alternating rows for a clean honeycomb pattern
      const staggerX = (lane % 2 === 1) ? colSpacing * 0.45 : 0;
      const startX = 20 + (colIndex * colSpacing) + staggerX;

      // Perfectly distributed Y from top to bottom (no bottom clustering)
      const baseY = topPadding + (lane * laneHeight) + (laneHeight / 2);

      // Balanced base speed for uniform competition
      const baseSpeed = 415 + ((index % 9) - 4) * 3; // 403 - 427 px/s
      const burstChance = 0.035;

      return {
        id: player.id,
        name: player.name,
        lane,
        colIndex,
        startX,
        x: startX,
        y: baseY,
        baseY,
        distance: 0,
        speed: 0,
        baseSpeed,
        targetSpeed: baseSpeed,
        acceleration: 280,
        isBursting: false,
        burstTimer: 0,
        burstDuration: 0,
        burstChance,
        sinOffset: (index * 0.47) % (Math.PI * 2),
        sinSpeed: 2.2,
        sinAmp: 3.5, // 3.5px gentle bobbing so tags never collide
        rank: index + 1
      };
    });

    // Automatically shift the Start Line clearly IN FRONT of all foxes!
    let maxFoxX = 0;
    for (let i = 0; i < this.foxes.length; i++) {
      if (this.foxes[i].startX > maxFoxX) {
        maxFoxX = this.foxes[i].startX;
      }
    }
    // Set Start Line 65px ahead of the foremost fox
    this.startLineX = Math.round(maxFoxX + 65);
    this.finishLineDistance = this.startLineX + 4150;
  }

  // Start the official race
  startRace() {
    this.isRacing = true;
    this.isFinished = false;
    this.raceTime = 0;
    this.startTime = performance.now();
    this.winner = null;
    this.top10 = [];

    this.foxes.forEach((fox) => {
      fox.distance = 0;
      fox.x = fox.startX;
      fox.speed = 0;
      fox.isBursting = false;
      fox.burstTimer = 0;
    });
  }

  // Ultra-smooth simulation step with exponential smoothing
  update(dt) {
    if (!this.isRacing || this.isFinished) return;

    this.raceTime += dt;

    if (this.raceTime >= RACE_DURATION) {
      this.raceTime = RACE_DURATION;
      this.finishRace();
      return;
    }

    const progressRatio = this.raceTime / RACE_DURATION;

    for (let i = 0; i < this.foxes.length; i++) {
      const fox = this.foxes[i];

      // Handle mini-turbos (bursts) for lead-swapping drama
      if (fox.isBursting) {
        fox.burstTimer -= dt;
        if (fox.burstTimer <= 0) {
          fox.isBursting = false;
          fox.targetSpeed = fox.baseSpeed;
        }
      } else {
        const currentBurstChance = fox.burstChance * (1 + progressRatio * 0.9);
        if (Math.random() < currentBurstChance * dt * 4.2) {
          fox.isBursting = true;
          fox.burstDuration = 0.7 + Math.random() * 0.6;
          fox.burstTimer = fox.burstDuration;
          fox.targetSpeed = fox.baseSpeed * (1.15 + Math.random() * 0.08); // +15-23% turbo
        }
      }

      // Smooth exponential speed interpolation (prevents any jerky motion)
      const accelRate = fox.speed < fox.targetSpeed ? 4.2 : 2.5;
      fox.speed += (fox.targetSpeed - fox.speed) * (1 - Math.exp(-dt * accelRate));

      // Micro aerodynamic resistance (keeps the fleet tightly packed)
      const microJitter = (Math.random() - 0.495) * 12 * dt;
      fox.speed = Math.max(160, fox.speed + microJitter);

      // Distance advancement
      const stepDist = fox.speed * dt;
      fox.distance += stepDist;
      fox.x += stepDist;

      // Gentle, harmonic vertical floating
      fox.y = fox.baseY + Math.sin(this.raceTime * fox.sinSpeed + fox.sinOffset) * fox.sinAmp;
    }

    this.updateRankings();
  }

  // Live rankings calculation
  updateRankings() {
    const sorted = [...this.foxes].sort((a, b) => {
      if (b.distance !== a.distance) {
        return b.distance - a.distance;
      }
      return a.id - b.id;
    });

    for (let r = 0; r < sorted.length; r++) {
      sorted[r].rank = r + 1;
    }

    this.top10 = sorted.slice(0, 10);
  }

  // End race after exact 10.0 seconds
  finishRace() {
    this.isRacing = false;
    this.isFinished = true;

    const finalSorted = [...this.foxes].sort((a, b) => {
      if (b.distance !== a.distance) {
        return b.distance - a.distance;
      }
      return a.id - b.id;
    });

    finalSorted.forEach((fox, index) => {
      fox.rank = index + 1;
    });

    this.winner = finalSorted[0] || null;
    this.top10 = finalSorted.slice(0, 10);
  }

  // Get current race state
  getState() {
    return {
      isRacing: this.isRacing,
      isFinished: this.isFinished,
      raceTime: this.raceTime,
      remainingTime: Math.max(0, RACE_DURATION - this.raceTime),
      winner: this.winner,
      top10: this.top10,
      leadDistance: this.top10[0]?.distance || 0,
      totalFoxes: this.foxes.length
    };
  }

  // Reset to initial state
  reset() {
    this.raceTime = 0;
    this.isRacing = false;
    this.isFinished = false;
    this.winner = null;
    this.top10 = [];
    this.foxes.forEach((fox) => {
      fox.distance = 0;
      fox.x = fox.startX;
      fox.speed = 0;
      fox.isBursting = false;
      fox.burstTimer = 0;
      fox.rank = 1;
    });
  }
}
