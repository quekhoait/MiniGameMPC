// gameEngine.js - Ultra-optimized Melee Brawl Battle Royale Simulation Engine
// Mechanics: Foxes charge directly into each other to punch/brawl, random 50/50 winner/loser on clash, NO HP bars!
// Features: Memory cleanup every 30 kills, dynamic 1v1 duel flurry punches, 0.2s final KO, Top 5 ranking

import { soundFX } from './audio';

export class GameEngine {
  constructor() {
    this.foxes = [];
    this.foxMap = new Map();
    this.clashEffects = []; // Comic punch/clash effects (POW!, BAM!, sparks)
    this.explosions = [];
    this.bullets = []; // empty array for backwards compatibility
    this.playerList = [];

    // Configurable Durations (3s to 60s, default 10s)
    this.lobbyDuration = 10.0;
    this.battleDuration = 10.0;

    // States: 'IDLE' | 'LOBBY' | 'BATTLE' | 'FINISHED'
    this.phase = 'IDLE';
    this.lobbyTime = 0;
    this.battleTime = 0;
    this.aliveCount = 0;
    this.winner = null;
    this.top5 = [];

    this.mapWidth = 1400;
    this.mapHeight = 800;

    // Memory Cleanup Tracking (every 30 eliminations)
    this.eliminationCount = 0;
    this.lastCleanupEliminationCount = 0;

    // Speed scale factor (configurable by user, default 1.0)
    this.speedScale = 1.0;
    this.lastBeepSecond = -1;

    // Dynamic Combat Status
    this.isRapidFire = false; // Used when aliveCount <= 150 (speed boost)
    this.isDuelMode = false;  // Triggered when aliveCount === 2
    this.finalistIds = [];
    this.championId = null;
    this.finalPunchLanded = false;

    // Start Delay & Winner On-Map Celebration
    this.startDelay = 1.5; // Wait 1.5s after countdown ends and start banner fades before brawling
    this.celebrationDuration = 3.0; // 3 seconds on-map winner celebration before opening form
    this.celebrationTime = 0;
    this.isCelebrating = false;

    // Door Opening & Falling Foxes Intro Mechanics (Total 4.0s: 1.4s Drop + 2.6s Split Open)
    this.doorPhase = 'INACTIVE'; // 'INACTIVE' | 'DROPPING' | 'OPENING' | 'DONE'
    this.doorTimer = 0;
    this.doorDropDuration = 1.4; // 1.4s to drop down
    this.doorOpenDuration = 2.6; // 2.6s to slide open to 2 sides (total 4.0s)
    this.isDoorAnimating = false;
  }

  // Set user-configured flight speed scale (0.3x to 3.0x)
  setSpeedScale(scale) {
    if (typeof scale === 'number' && scale >= 0.2 && scale <= 3.0) {
      this.speedScale = scale;
    }
  }

  // Set user-configured durations (from 3s to 60s)
  setDurations(lobbySec, battleSec) {
    if (lobbySec && lobbySec >= 3 && lobbySec <= 60) {
      this.lobbyDuration = Math.round(lobbySec);
    }
    if (battleSec && battleSec >= 5 && battleSec <= 60) {
      this.battleDuration = Math.round(battleSec);
    }
  }

  // Memory cleanup every 30 kills to ensure zero memory leaks and peak 60 FPS
  performMemoryCleanup() {
    this.clashEffects = this.clashEffects.filter(c => c.life > 0.02);
    this.explosions = this.explosions.filter(e => e.life > 0.02);
    this.bullets = [];

    for (let i = 0; i < this.foxes.length; i++) {
      const f = this.foxes[i];
      if (!f.isAlive) {
        f.vx = 0;
        f.vy = 0;
        f.punchTimer = 0;
        f.targetId = null;
      }
    }
  }

  // Initialize foxes distributed throughout battlefield
  initFoxes(playerList, width = 1400, height = 800) {
    this.playerList = playerList;
    this.mapWidth = width;
    this.mapHeight = height;

    this.phase = 'IDLE';
    this.lobbyTime = 0;
    this.battleTime = 0;
    this.clashEffects = [];
    this.explosions = [];
    this.bullets = [];
    this.winner = null;
    this.top5 = [];
    this.eliminationCount = 0;
    this.lastCleanupEliminationCount = 0;
    this.isRapidFire = false;
    this.isDuelMode = false;
    this.finalistIds = [];
    this.championId = null;
    this.finalPunchLanded = false;
    this.celebrationTime = 0;
    this.isCelebrating = false;

    const count = playerList.length;
    this.aliveCount = count;
    this.foxMap.clear();

    if (count === 0) {
      this.foxes = [];
      return;
    }

    const padSide = 40;
    const padTop = 80; // Keep clear from top HUD in fullscreen
    const padBottom = 40;
    const spawnW = Math.max(200, width - padSide * 2);
    const spawnH = Math.max(200, height - padTop - padBottom);

    this.foxes = playerList.map((player) => {
      const x = padSide + Math.random() * spawnW;
      const y = padTop + Math.random() * spawnH;

      const angle = Math.random() * Math.PI * 2;
      const baseSpeed = 32 + Math.random() * 16;

      const fox = {
        id: player.id,
        name: player.name,
        x,
        y,
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
        baseSpeed,
        speed: baseSpeed,
        angle,
        targetAngle: angle,
        turnTimer: Math.random() * 2,
        bobPhase: Math.random() * Math.PI * 2,

        // Melee brawl attributes (NO HP BARS - random win/lose on clash)
        isAlive: true,
        eliminatedAt: null,
        kills: 0,
        punchTimer: 0,
        brawlCooldown: 0,
        targetId: null,
        isFinalist: false,
        isCharging: false
      };

      this.foxMap.set(fox.id, fox);
      return fox;
    });
  }

  // Start Phase 1: Configured Lobby duration
  startLobby() {
    this.phase = 'LOBBY';
    this.lobbyTime = 0;
    this.battleTime = 0;
    this.celebrationTime = 0;
    this.isCelebrating = false;
    this.clashEffects = [];
    this.explosions = [];
    this.bullets = [];
    this.winner = null;
    this.top5 = [];
    this.eliminationCount = 0;
    this.lastCleanupEliminationCount = 0;
    this.aliveCount = this.foxes.length;
    this.isRapidFire = false;
    this.isDuelMode = false;
    this.finalistIds = [];
    this.championId = null;
    this.finalPunchLanded = false;
    this.lastBeepSecond = -1;

    // Trigger Door Shutter Drop -> Split Open animation
    this.doorPhase = 'DROPPING';
    this.doorTimer = 0;
    this.isDoorAnimating = true;
    soundFX.playDoorDrop();

    const padSide = 40;
    const padTop = 80;
    const padBottom = 40;
    const spawnW = Math.max(200, this.mapWidth - padSide * 2);
    const spawnH = Math.max(200, this.mapHeight - padTop - padBottom);

    this.foxes.forEach((fox) => {
      fox.baseSpeed = 32 + Math.random() * 16;
      fox.speed = fox.baseSpeed;
      fox.isAlive = true;
      fox.eliminatedAt = null;
      fox.kills = 0;
      fox.punchTimer = 0;
      fox.brawlCooldown = 0;
      fox.targetId = null;
      fox.isFinalist = false;
      fox.isCharging = false;

      // Target position inside lobby
      fox.targetX = padSide + Math.random() * spawnW;
      fox.targetY = padTop + Math.random() * spawnH;

      // Start position: drop from above the screen!
      fox.x = fox.targetX;
      fox.y = -70 - Math.random() * 300;
      fox.isDropping = true;
      // Stagger drop as the door opens from 1.4s to 4.0s
      fox.dropDelay = 1.4 + 0.1 + Math.random() * 1.5;
      fox.dropVy = 0;
      fox.bounceTimer = 0;
      fox.tilt = (Math.random() - 0.5) * 0.4;
    });

    soundFX.playLobbyMusic();
  }

  // Start Phase 2: Configured Battle duration
  startBattle() {
    this.phase = 'BATTLE';
    this.battleTime = 0;
    this.celebrationTime = 0;
    this.isCelebrating = false;
    this.clashEffects = [];
    this.eliminationCount = 0;
    this.lastCleanupEliminationCount = 0;
    this.isRapidFire = false;
    this.isDuelMode = false;
    this.finalistIds = [];
    this.championId = null;
    this.finalPunchLanded = false;

    soundFX.stopLobbyMusic();
    soundFX.playBattleStart();
  }

  // Reset to IDLE
  reset() {
    this.phase = 'IDLE';
    this.lobbyTime = 0;
    this.battleTime = 0;
    this.celebrationTime = 0;
    this.isCelebrating = false;
    this.clashEffects = [];
    this.explosions = [];
    this.bullets = [];
    this.winner = null;
    this.top5 = [];
    this.eliminationCount = 0;
    this.lastCleanupEliminationCount = 0;
    this.aliveCount = this.foxes.length;
    this.isRapidFire = false;
    this.isDuelMode = false;
    this.finalistIds = [];
    this.championId = null;
    this.finalPunchLanded = false;
    this.lastBeepSecond = -1;

    this.doorPhase = 'INACTIVE';
    this.doorTimer = 0;
    this.isDoorAnimating = false;

    soundFX.stopLobbyMusic();

    this.foxes.forEach((fox) => {
      fox.baseSpeed = 32 + Math.random() * 16;
      fox.speed = fox.baseSpeed;
      fox.isAlive = true;
      fox.eliminatedAt = null;
      fox.kills = 0;
      fox.punchTimer = 0;
      fox.brawlCooldown = 0;
      fox.targetId = null;
      fox.isFinalist = false;
      fox.isCharging = false;
      fox.isDropping = false;
      fox.bounceTimer = 0;
      fox.tilt = 0;
    });
  }

  // Master Simulation Update (dt in seconds)
  update(dtRaw) {
    if (this.phase === 'IDLE' || this.phase === 'FINISHED') return;

    const dt = Math.min(dtRaw, 0.033);

    // Phase 1: Sảnh chờ
    if (this.phase === 'LOBBY') {
      // Step Door Animation
      if (this.isDoorAnimating) {
        this.doorTimer += dt;
        if (this.doorPhase === 'DROPPING') {
          if (this.doorTimer >= this.doorDropDuration) {
            this.doorPhase = 'OPENING';
            this.doorTimer = 0;
            soundFX.playDoorOpen();
          }
        } else if (this.doorPhase === 'OPENING') {
          if (this.doorTimer >= this.doorOpenDuration) {
            this.doorPhase = 'DONE';
            this.isDoorAnimating = false;
          }
        }
      } else {
        // Countdown begins after door finishes opening
        this.lobbyTime += dt;
      }

      const timeLeft = this.lobbyDuration - this.lobbyTime;
      soundFX.updateLobbyMusic(timeLeft);

      if (timeLeft <= 3.05 && timeLeft > 0.05 && !this.isDoorAnimating) {
        const sec = Math.ceil(timeLeft);
        if (sec !== this.lastBeepSecond) {
          this.lastBeepSecond = sec;
          soundFX.playCountdownBeep(sec === 1 ? 880 : 560, 0.12);
        }
      }
      if (this.lobbyTime >= this.lobbyDuration) {
        this.lobbyTime = this.lobbyDuration;
        this.startBattle();
        return;
      }
      this.updateMovement(dt);
      return;
    }

    // Phase 2: Chiến đấu đấm nhau sinh tồn
    if (this.phase === 'BATTLE') {
      this.battleTime += dt;

      // When battle time ends or 1 champion remains -> 3s on-map winner celebration before opening form!
      if (this.aliveCount <= 1 || this.battleTime >= this.battleDuration) {
        if (!this.isCelebrating) {
          this.isCelebrating = true;
          this.celebrationTime = 0;
          this.finishBattleCalculations();
          soundFX.playVictory();
        }

        this.celebrationTime += dt;
        this.updateMovement(dt);
        this.updateClashEffects(dt);
        this.updateExplosions(dt);

        // After exactly 3.0s of on-map celebration, mark FINISHED so WinnerModal form pops up!
        if (this.celebrationTime >= this.celebrationDuration) {
          this.phase = 'FINISHED';
        }
        return;
      }

      // Speed boost when alive count <= 150
      this.isRapidFire = this.aliveCount <= 150;

      this.updateMovement(dt);

      // Foxes ONLY start brawling after countdown ends AND start banner fades out (startDelay = 1.5s)!
      if (this.battleTime >= this.startDelay) {
        this.updateMeleeCombat(dt);
      }

      this.updateClashEffects(dt);
      this.updateExplosions(dt);
    }
  }

  // Flight steering: In Battle, foxes CHARGE at their targets to punch!
  updateMovement(dt) {
    const padSide = 35;
    const padTop = 75; // avoid hiding under top HUD
    const padBottom = 35;
    const w = this.mapWidth;
    const h = this.mapHeight;

    // 50 con cuối cùng tụ lại 1 vùng
    const isGathering50 = this.phase === 'BATTLE' && this.aliveCount <= 50 && !this.isCelebrating;
    const gatherCenterX = w / 2;
    const gatherCenterY = (h + padTop) / 2;
    const gatherRadiusX = Math.min(260, w * 0.28);
    const gatherRadiusY = Math.min(180, h * 0.28);

    // Dynamic flight speed curve:
    let speedFactor = 1.0;
    if (this.phase === 'BATTLE') {
      const battleProgress = this.battleTime / Math.max(1, this.battleDuration);
      if (battleProgress > 0.667) {
        const slowRatio = Math.min(1.0, (battleProgress - 0.667) / 0.333);
        speedFactor = 1.0 - slowRatio * 0.25;
      }
    }
    const currentScale = this.speedScale || 1.0;

    for (let i = 0; i < this.foxes.length; i++) {
      const f = this.foxes[i];
      if (!f.isAlive) continue;

      // 0. Falling down from above into Lobby Intro
      if (f.isDropping) {
        if (f.dropDelay > 0) {
          f.dropDelay -= dt;
          continue;
        }
        // Accelerate downward with gravity
        f.dropVy = (f.dropVy || 0) + 1800 * dt;
        f.y += f.dropVy * dt;
        f.tilt = (f.tilt || 0) * 0.95;

        // Check if landed at target
        if (f.y >= f.targetY) {
          f.y = f.targetY;
          f.isDropping = false;
          f.bounceTimer = 0.22;
          f.dropVy = 0;
          f.tilt = 0;
          f.vx = Math.cos(f.angle) * f.baseSpeed;
          f.vy = Math.sin(f.angle) * f.baseSpeed;
        }
        continue;
      }

      if (f.bounceTimer > 0) {
        f.bounceTimer = Math.max(0, f.bounceTimer - dt);
      }

      if (f.punchTimer > 0) f.punchTimer -= dt;
      if (f.brawlCooldown > 0) f.brawlCooldown -= dt;

      f.bobPhase += dt * (2.0 * speedFactor * currentScale);

      // 1. Victory Lap: If only 1 champion remains or during celebration phase
      if (this.aliveCount === 1 || this.isCelebrating) {
        const centerX = w / 2;
        const centerY = (h + padTop) / 2;
        const dx = centerX - f.x;
        const dy = centerY - f.y;
        const targetA = Math.atan2(dy, dx) + Math.PI / 2;
        let diff = targetA - f.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        f.angle += diff * Math.min(1, dt * 3.5 * currentScale);
        f.speed = f.baseSpeed * 0.9 * currentScale;
        f.isCharging = false;
      }
      // 2. Start Delay: while start banner is fading (first 1.5s), foxes roam peacefully without charging
      else if (this.phase === 'BATTLE' && this.battleTime < this.startDelay) {
        f.turnTimer -= dt;
        if (f.turnTimer <= 0) {
          f.turnTimer = 0.8 + Math.random() * 1.5;
          f.targetAngle = f.angle + (Math.random() - 0.5) * 1.0;
        }
        let diff = f.targetAngle - f.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        f.angle += diff * Math.min(1, dt * 2.0 * currentScale);
        f.speed = f.baseSpeed * currentScale;
        f.isCharging = false;
      }
      // 3. 1v1 Final Duel: 2 finalists charge and clash directly head-on!
      else if (this.isDuelMode && this.finalistIds.includes(f.id)) {
        const rivalId = this.finalistIds.find(id => id !== f.id);
        const rival = this.foxMap.get(rivalId);
        if (rival && rival.isAlive) {
          const dx = rival.x - f.x;
          const dy = rival.y - f.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const angleToRival = Math.atan2(dy, dx);

          // Direct charge to punch!
          let diff = angleToRival - f.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          f.angle += diff * Math.min(1, dt * 6.5 * currentScale);

          // Attack dash speed
          f.speed = (f.baseSpeed + 45) * currentScale;
          f.isCharging = true;
        }
      }
      // 3. Battle Melee Charge: lock onto opponent and dash into them to brawl
      else if (this.phase === 'BATTLE') {
        let target = f.targetId ? this.foxMap.get(f.targetId) : null;
        if (!target || !target.isAlive) {
          // Find nearest opponent
          f.targetId = null;
          f.isCharging = false;
        }

        if (target && target.isAlive) {
          const dx = target.x - f.x;
          const dy = target.y - f.y;
          const targetAngle = Math.atan2(dy, dx);

          let diff = targetAngle - f.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          f.angle += diff * Math.min(1, dt * 4.2 * currentScale);

          // Boost speed while charging to punch
          f.isCharging = true;
          const chargeBoost = this.isRapidFire ? 35 : 20;
          const targetSpeed = (f.baseSpeed + chargeBoost) * speedFactor * currentScale;
          f.speed += (targetSpeed - f.speed) * Math.min(1, dt * 3.5);
        } else {
          // Wander seeking opponent
          f.turnTimer -= dt;
          if (f.turnTimer <= 0) {
            f.turnTimer = 0.8 + Math.random() * 1.4;
            f.targetAngle = f.angle + (Math.random() - 0.5) * 1.2;
          }
          let diff = f.targetAngle - f.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          f.angle += diff * Math.min(1, dt * 2.2 * currentScale);

          const targetSpeed = f.baseSpeed * speedFactor * currentScale;
          f.speed += (targetSpeed - f.speed) * Math.min(1, dt * 2.0);
          f.isCharging = false;
        }
      }
      // 4. Lobby gentle floating
      else {
        f.turnTimer -= dt;
        if (f.turnTimer <= 0) {
          f.turnTimer = 1.2 + Math.random() * 2.0;
          f.targetAngle = f.angle + (Math.random() - 0.5) * 0.9;
        }
        let diff = f.targetAngle - f.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        f.angle += diff * Math.min(1, dt * 1.8 * currentScale);
        f.speed = f.baseSpeed * currentScale;
      }

      // 50 con cuối cùng tụ lại 1 vùng
      if (isGathering50) {
        const dxCenter = gatherCenterX - f.x;
        const dyCenter = gatherCenterY - f.y;
        const distCenter = Math.hypot(dxCenter, dyCenter);
        if (distCenter > 140) {
          const angleToCenter = Math.atan2(dyCenter, dxCenter);
          let diff = angleToCenter - f.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          f.angle += diff * Math.min(1.0, dt * 4.5 * currentScale);
          f.speed = (f.baseSpeed + 28) * currentScale;
        }
      }

      f.vx = Math.cos(f.angle) * f.speed;
      f.vy = Math.sin(f.angle) * f.speed;

      f.x += f.vx * dt;
      f.y += f.vy * dt;

      // Soft boundary bounce (Restricted into 1 region when 50 foxes gather)
      const minX = isGathering50 ? Math.max(padSide, gatherCenterX - gatherRadiusX) : padSide;
      const maxX = isGathering50 ? Math.min(w - padSide, gatherCenterX + gatherRadiusX) : w - padSide;
      const minY = isGathering50 ? Math.max(padTop, gatherCenterY - gatherRadiusY) : padTop;
      const maxY = isGathering50 ? Math.min(h - padBottom, gatherCenterY + gatherRadiusY) : h - padBottom;

      if (f.x < minX) {
        f.x = minX;
        f.targetAngle = (Math.random() - 0.5) * 1.2;
        f.angle = f.targetAngle;
      } else if (f.x > maxX) {
        f.x = maxX;
        f.targetAngle = Math.PI + (Math.random() - 0.5) * 1.2;
        f.angle = f.targetAngle;
      }

      if (f.y < minY) {
        f.y = minY;
        f.targetAngle = Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        f.angle = f.targetAngle;
      } else if (f.y > maxY) {
        f.y = maxY;
        f.targetAngle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        f.angle = f.targetAngle;
      }
    }
  }

  // Melee combat: Foxes charge at each other, clash, random 50/50 win/loss, NO HP!
  updateMeleeCombat(dt) {
    const totalDuration = this.battleDuration;
    const t = this.battleTime;
    const timeLeft = Math.max(0, totalDuration - t);

    // Collect living foxes
    const aliveFoxes = [];
    for (let i = 0; i < this.foxes.length; i++) {
      if (this.foxes[i].isAlive) aliveFoxes.push(this.foxes[i]);
    }
    const aliveLen = aliveFoxes.length;
    this.aliveCount = aliveLen;

    if (aliveLen <= 1) return;

    // =========================================================================
    // STAGE 4: THE FINAL 0.15s - DECISIVE KNOCKOUT PUNCH (EXACTLY 1 SOLE WINNER)
    // =========================================================================
    if (timeLeft <= 0.15) {
      if (aliveLen > 1) {
        let champion = aliveFoxes[0];
        let runnerUp = aliveFoxes[1];

        if (this.championId) {
          champion = this.foxMap.get(this.championId) || aliveFoxes[0];
          runnerUp = (champion === aliveFoxes[0]) ? aliveFoxes[1] : aliveFoxes[0];
        } else {
          // Random coin toss if not yet chosen
          const flip = Math.random() < 0.5;
          champion = flip ? aliveFoxes[0] : aliveFoxes[1];
          runnerUp = flip ? aliveFoxes[1] : aliveFoxes[0];
          this.championId = champion.id;
        }

        if (!this.finalPunchLanded && runnerUp && runnerUp.isAlive) {
          this.finalPunchLanded = true;
          // Decisive KO punch!
          this.addClashEffect((champion.x + runnerUp.x) / 2, (champion.y + runnerUp.y) / 2, 'K.O!');
          soundFX.playPunch();

          runnerUp.isAlive = false;
          runnerUp.eliminatedAt = t;
          this.aliveCount = 1;
          this.eliminationCount++;
          champion.kills++;
          this.addExplosion(runnerUp.x, runnerUp.y, true);
          soundFX.playExplosion();
        }
      }
      return;
    }

    // =========================================================================
    // STAGE 3: 1v1 FINAL DUEL (0.35s down to 0.15s: 2 FINALISTS PUNCH FLURRY)
    // =========================================================================
    if (aliveLen === 2 || timeLeft <= 0.35) {
      if (aliveLen > 2) {
        // Trim down cleanly to 2 finalists
        aliveFoxes.sort((a, b) => b.kills - a.kills);
        for (let i = 2; i < aliveFoxes.length; i++) {
          const victim = aliveFoxes[i];
          victim.isAlive = false;
          victim.eliminatedAt = t;
          this.aliveCount--;
          this.eliminationCount++;
          this.addExplosion(victim.x, victim.y, false);
        }
        aliveFoxes.length = 2;
        this.aliveCount = 2;
      }

      this.isDuelMode = true;
      const f1 = aliveFoxes[0];
      const f2 = aliveFoxes[1];
      this.finalistIds = [f1.id, f2.id];
      f1.isFinalist = true;
      f2.isFinalist = true;

      if (!this.championId) {
        this.championId = Math.random() < 0.5 ? f1.id : f2.id;
      }

      // Proximity check for flurry punches
      const dx = f2.x - f1.x;
      const dy = f2.y - f1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      if (dist < 42) {
        // Trade punches with comic sparks!
        f1.punchTimer = 0.15;
        f2.punchTimer = 0.15;
        const midX = (f1.x + f2.x) / 2;
        const midY = (f1.y + f2.y) / 2;
        this.addClashEffect(midX, midY, Math.random() < 0.5 ? 'BỐP!' : 'CHÁT!');
        soundFX.playPunch();

        // Push back slightly to re-charge
        f1.x -= (dx / dist) * 14;
        f1.y -= (dy / dist) * 14;
        f2.x += (dx / dist) * 14;
        f2.y += (dy / dist) * 14;
      }
      return;
    }

    // =========================================================================
    // STAGE 2: 3-4 CÁO ĐẤM NHAU (TẦM 0.6s CHỈ CÒN 3-4 CON ĐẤM NHAU)
    // =========================================================================
    if (aliveLen <= 4 || timeLeft <= 0.6) {
      if (aliveLen > 4) {
        // Trim down cleanly to 4 top contenders
        aliveFoxes.sort((a, b) => b.kills - a.kills);
        for (let i = 4; i < aliveFoxes.length; i++) {
          const victim = aliveFoxes[i];
          victim.isAlive = false;
          victim.eliminatedAt = t;
          this.aliveCount--;
          this.eliminationCount++;
          this.addExplosion(victim.x, victim.y, false);
        }
        aliveFoxes.length = 4;
        this.aliveCount = 4;
      }

      // 3 or 4 foxes all charge at each other fiercely!
      for (let i = 0; i < aliveFoxes.length; i++) {
        const foxA = aliveFoxes[i];
        if (!foxA.isAlive) continue;

        let nearestRival = null;
        let minD = Infinity;
        for (let j = 0; j < aliveFoxes.length; j++) {
          if (i === j) continue;
          const rival = aliveFoxes[j];
          if (!rival.isAlive) continue;
          const d = Math.hypot(rival.x - foxA.x, rival.y - foxA.y);
          if (d < minD) {
            minD = d;
            nearestRival = rival;
          }
        }

        if (nearestRival) {
          foxA.targetId = nearestRival.id;
          foxA.isCharging = true;
          // Clash check
          if (minD < 42 && foxA.punchTimer <= 0) {
            foxA.punchTimer = 0.14;
            nearestRival.punchTimer = 0.14;
            const midX = (foxA.x + nearestRival.x) / 2;
            const midY = (foxA.y + nearestRival.y) / 2;
            const sfxWords = ['BỐP!', 'BAM!', 'CHÁT!', 'BÙM!'];
            this.addClashEffect(midX, midY, sfxWords[Math.floor(Math.random() * sfxWords.length)]);
            soundFX.playPunch();

            // Chance to drop down from 4 to 3
            if (aliveFoxes.length > 3 && Math.random() < 0.45) {
              nearestRival.isAlive = false;
              nearestRival.eliminatedAt = t;
              this.aliveCount--;
              this.eliminationCount++;
              foxA.kills++;
              this.addExplosion(nearestRival.x, nearestRival.y, false);
              soundFX.playExplosion();
            }
          }
        }
      }
      return;
    }

    // =========================================================================
    // STAGE 1: BRAWL PACING (CONTINUOUS SMOOTH CHARGE & CLASH DOWN TO 4 AT 0.6s)
    // =========================================================================
    const duelStartTime = Math.max(0.5, totalDuration - 0.6);
    const initialCount = Math.max(4, this.foxes.length);
    const progress = Math.min(1.0, t / duelStartTime);

    // Target living count curve
    const remainingFactor = Math.pow(1 - progress, 1.35);
    const targetPacedAlive = Math.max(4, Math.round(4 + (initialCount - 4) * remainingFactor));

    // Assign targets to charge at
    for (let i = 0; i < aliveLen; i++) {
      const f = aliveFoxes[i];
      if (!f.targetId || Math.random() < 0.08) {
        // Pick nearest or random living opponent
        let bestTarget = null;
        let minD2 = Infinity;
        const samples = Math.min(10, aliveLen);
        for (let s = 0; s < samples; s++) {
          const cand = aliveFoxes[Math.floor(Math.random() * aliveLen)];
          if (cand.id === f.id) continue;
          const d2 = (cand.x - f.x) ** 2 + (cand.y - f.y) ** 2;
          if (d2 < minD2) {
            minD2 = d2;
            bestTarget = cand;
          }
        }
        f.targetId = bestTarget ? bestTarget.id : null;
      }
    }

    // Collision & Brawl Clash Check between all active charging foxes
    const clashRadius = 32;
    const clashRadiusSq = clashRadius * clashRadius;

    for (let i = 0; i < aliveLen; i++) {
      const foxA = aliveFoxes[i];
      if (!foxA.isAlive || foxA.brawlCooldown > 0) continue;

      for (let j = i + 1; j < aliveLen; j++) {
        const foxB = aliveFoxes[j];
        if (!foxB.isAlive || foxB.brawlCooldown > 0) continue;

        const dx = foxB.x - foxA.x;
        const dy = foxB.y - foxA.y;
        if (Math.abs(dx) > clashRadius || Math.abs(dy) > clashRadius) continue;

        const d2 = dx * dx + dy * dy;
        if (d2 <= clashRadiusSq) {
          // BRAWL CLASH TRIGGERED!
          const midX = (foxA.x + foxB.x) / 2;
          const midY = (foxA.y + foxB.y) / 2;

          // Only eliminate if current count exceeds paced curve OR by natural clash probability
          const shouldEliminate = aliveLen > targetPacedAlive || Math.random() < 0.35;

          if (shouldEliminate && aliveLen > 2) {
            // Random 50/50 win or loss!
            const winnerFox = Math.random() < 0.5 ? foxA : foxB;
            const loserFox = (winnerFox === foxA) ? foxB : foxA;

            loserFox.isAlive = false;
            loserFox.eliminatedAt = t;
            this.aliveCount--;
            this.eliminationCount++;
            winnerFox.kills++;

            winnerFox.punchTimer = 0.2;
            winnerFox.brawlCooldown = 0.3; // brief rest to find next opponent

            this.addClashEffect(midX, midY, ['BỐP!', 'BAM!', 'POW!', 'CHÁT!'][Math.floor(Math.random() * 4)]);
            soundFX.playPunch();
            this.addExplosion(loserFox.x, loserFox.y, false);

            // Memory cleanup trigger every 30 kills
            if (this.eliminationCount - this.lastCleanupEliminationCount >= 30) {
              this.lastCleanupEliminationCount = this.eliminationCount;
              this.performMemoryCleanup();
            }
            break;
          } else {
            // Bounce off each other with punch flurry spark
            foxA.brawlCooldown = 0.25;
            foxB.brawlCooldown = 0.25;
            foxA.punchTimer = 0.15;
            foxB.punchTimer = 0.15;

            const dist = Math.sqrt(d2) || 1;
            foxA.x -= (dx / dist) * 12;
            foxA.y -= (dy / dist) * 12;
            foxB.x += (dx / dist) * 12;
            foxB.y += (dy / dist) * 12;

            this.addClashEffect(midX, midY, 'BỐP!');
            soundFX.playPunch();
          }
        }
      }
    }
  }

  // Add punch clash visual effect (comic POW! / BAM! starburst)
  addClashEffect(x, y, text = 'BỐP!') {
    if (this.clashEffects.length > 25) {
      this.clashEffects.shift();
    }
    this.clashEffects.push({
      x,
      y,
      text,
      life: 0.38,
      maxLife: 0.38,
      size: 18 + Math.random() * 8,
      color: ['#facc15', '#f97316', '#ef4444', '#fbbf24'][Math.floor(Math.random() * 4)]
    });
  }

  updateClashEffects(dt) {
    for (let c = this.clashEffects.length - 1; c >= 0; c--) {
      const cl = this.clashEffects[c];
      cl.life -= dt;
      if (cl.life <= 0) {
        this.clashEffects.splice(c, 1);
      }
    }
  }

  // Trigger elimination explosion particles
  addExplosion(x, y, isMega = false) {
    let totalActive = 0;
    for (let i = 0; i < this.explosions.length; i++) {
      totalActive += this.explosions[i].particles.length;
    }
    if (totalActive > 75) return;

    const particles = [];
    const count = isMega ? 22 : 12;
    const colors = isMega
      ? ['#facc15', '#fbbf24', '#f97316', '#ffffff']
      : ['#f97316', '#ef4444', '#facc15', '#ffffff'];

    for (let p = 0; p < count; p++) {
      const angle = (p / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = (isMega ? 100 : 70) + Math.random() * (isMega ? 150 : 90);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: (isMega ? 3.0 : 2.2) + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.55 + Math.random() * 0.25,
        maxLife: 0.8
      });
    }

    this.explosions.push({
      x,
      y,
      life: 0.8,
      particles
    });
  }

  updateExplosions(dt) {
    for (let e = this.explosions.length - 1; e >= 0; e--) {
      const exp = this.explosions[e];
      exp.life -= dt;

      if (exp.life <= 0) {
        this.explosions.splice(e, 1);
        continue;
      }

      for (let p = 0; p < exp.particles.length; p++) {
        const pt = exp.particles[p];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
      }
    }
  }

  // Calculate champion and top 5 when celebration begins
  finishBattleCalculations() {
    this.clashEffects = [];

    const living = this.foxes.filter(f => f.isAlive);
    const eliminated = this.foxes.filter(f => !f.isAlive);

    // Living foxes (the sole champion)
    living.sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.id - b.id;
    });

    // Eliminated foxes sorted by eliminatedAt descending (survived longest) -> kills -> ID
    eliminated.sort((a, b) => {
      if (b.eliminatedAt !== a.eliminatedAt) return (b.eliminatedAt || 0) - (a.eliminatedAt || 0);
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.id - b.id;
    });

    const fullRanked = [...living, ...eliminated];

    this.winner = fullRanked[0] || null;
    this.top5 = fullRanked.slice(0, 5); // ONLY TOP 5 SAVED & DISPLAYED
  }

  // Conclude battle: Mark FINISHED
  finishBattle() {
    this.finishBattleCalculations();
    this.phase = 'FINISHED';
  }
}
