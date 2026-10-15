// gameEngine.js - Ultra-optimized Battle Royale Simulation Engine
// Supports configurable Lobby & Battle durations (3s - 60s)
// Features: Memory cleanup every 30 kills, <=150 rapid fire & flight speed boost, 0.2s single winner, Top 5 ranking

import { soundFX } from './audio';

export class GameEngine {
  constructor() {
    this.foxes = [];
    this.foxMap = new Map();
    this.bullets = [];
    this.explosions = [];
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

    this.bulletIdCounter = 0;

    // Memory Cleanup Tracking (every 30 eliminations)
    this.eliminationCount = 0;
    this.lastCleanupEliminationCount = 0;

    // Speed scale factor (configurable by user, default 1.0)
    this.speedScale = 1.0;
    this.lastBeepSecond = -1;

    // Dynamic Combat Status
    this.isRapidFire = false; // Triggered when aliveCount <= 150
    this.isDuelMode = false;  // Triggered when aliveCount === 2
    this.finalistIds = [];
    this.championId = null;
    this.finalShotFired = false;
  }

  // Set user-configured flight speed scale (0.3x to 2.5x)
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
    // 1. Remove expired bullets
    this.bullets = this.bullets.filter(b => b.lifeTime > 0.02);

    // 2. Remove dead explosions
    this.explosions = this.explosions.filter(e => e.life > 0.02);

    // 3. Compact transient properties on eliminated foxes
    for (let i = 0; i < this.foxes.length; i++) {
      const f = this.foxes[i];
      if (!f.isAlive) {
        f.vx = 0;
        f.vy = 0;
        f.hitFlashTimer = 0;
      }
    }

    if (this.bullets.length === 0) {
      this.bulletIdCounter = 0;
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
    this.bullets = [];
    this.explosions = [];
    this.winner = null;
    this.top5 = [];
    this.eliminationCount = 0;
    this.lastCleanupEliminationCount = 0;
    this.isRapidFire = false;
    this.isDuelMode = false;
    this.finalistIds = [];
    this.championId = null;
    this.finalShotFired = false;

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
      // Flight speed calibrated slightly faster as requested (28 - 42 px/s)
      const baseSpeed = 28 + Math.random() * 14;

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

        // Combat attributes
        maxHp: 100,
        hp: 100,
        isAlive: true,
        eliminatedAt: null,
        kills: 0,
        damageDealt: 0,
        hitFlashTimer: 0,
        isFinalist: false,

        // Attack pacing
        attackRange: 340 + Math.random() * 120,
        fireCooldown: 0.8 + Math.random() * 0.8,
        fireTimer: 0.2 + Math.random() * 1.0
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
    this.bullets = [];
    this.explosions = [];
    this.winner = null;
    this.top5 = [];
    this.eliminationCount = 0;
    this.lastCleanupEliminationCount = 0;
    this.aliveCount = this.foxes.length;
    this.isRapidFire = false;
    this.isDuelMode = false;
    this.finalistIds = [];
    this.championId = null;
    this.finalShotFired = false;

    this.lastBeepSecond = -1;
    this.foxes.forEach((fox) => {
      fox.baseSpeed = 28 + Math.random() * 14;
      fox.speed = fox.baseSpeed;
      fox.hp = fox.maxHp;
      fox.isAlive = true;
      fox.eliminatedAt = null;
      fox.kills = 0;
      fox.damageDealt = 0;
      fox.hitFlashTimer = 0;
      fox.isFinalist = false;
      fox.fireTimer = 0.2 + Math.random() * 0.9;
    });
  }

  // Start Phase 2: Configured Battle duration
  startBattle() {
    this.phase = 'BATTLE';
    this.battleTime = 0;
    this.bullets = [];
    this.eliminationCount = 0;
    this.lastCleanupEliminationCount = 0;
    this.isRapidFire = false;
    this.isDuelMode = false;
    this.finalistIds = [];
    this.championId = null;
    this.finalShotFired = false;
    soundFX.playBattleStart();
  }

  // Reset to IDLE
  reset() {
    this.phase = 'IDLE';
    this.lobbyTime = 0;
    this.battleTime = 0;
    this.bullets = [];
    this.explosions = [];
    this.winner = null;
    this.top5 = [];
    this.eliminationCount = 0;
    this.lastCleanupEliminationCount = 0;
    this.aliveCount = this.foxes.length;
    this.isRapidFire = false;
    this.isDuelMode = false;
    this.finalistIds = [];
    this.championId = null;
    this.finalShotFired = false;
    this.lastBeepSecond = -1;

    this.foxes.forEach((fox) => {
      fox.baseSpeed = 28 + Math.random() * 14;
      fox.speed = fox.baseSpeed;
      fox.hp = fox.maxHp;
      fox.isAlive = true;
      fox.eliminatedAt = null;
      fox.kills = 0;
      fox.damageDealt = 0;
      fox.hitFlashTimer = 0;
      fox.isFinalist = false;
    });
  }

  // Master Simulation Update (dt in seconds)
  update(dtRaw) {
    if (this.phase === 'IDLE' || this.phase === 'FINISHED') return;

    const dt = Math.min(dtRaw, 0.033);

    // Phase 1: Sảnh chờ
    if (this.phase === 'LOBBY') {
      this.lobbyTime += dt;
      const timeLeft = this.lobbyDuration - this.lobbyTime;
      if (timeLeft <= 3.05 && timeLeft > 0.05) {
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

    // Phase 2: Chiến đấu sinh tồn
    if (this.phase === 'BATTLE') {
      this.battleTime += dt;

      // Track rapid fire condition: when alive count <= 150 (TĂNG TỐC ĐỘ BAY & BẮN)
      this.isRapidFire = this.aliveCount <= 150;

      this.updateMovement(dt);
      this.updateCombat(dt);
      this.updateBullets(dt);
      this.updateExplosions(dt);

      // Finish battle precisely when reaching battleDuration
      if (this.battleTime >= this.battleDuration) {
        this.battleTime = this.battleDuration;
        this.finishBattle();
      }
    }
  }

  // Flight steering & smooth boundary bounce with high-speed smoothness when <= 150
  updateMovement(dt) {
    const padSide = 35;
    const padTop = 75; // avoid hiding under top HUD
    const padBottom = 35;
    const w = this.mapWidth;
    const h = this.mapHeight;

    // Dynamic flight speed curve:
    // First 2/3 time: normal calibrated speed (1.0x, ~28 - 42 px/s * speedScale)
    // Final 1/3 time: smoothly decelerates to ~0.65x (~18 - 27 px/s * speedScale) for cinematic clarity
    let speedFactor = 1.0;
    if (this.phase === 'BATTLE') {
      const battleProgress = this.battleTime / Math.max(1, this.battleDuration);
      if (battleProgress > 0.667) {
        const slowRatio = Math.min(1.0, (battleProgress - 0.667) / 0.333);
        speedFactor = 1.0 - slowRatio * 0.35; // Smoothly drops to 0.65x in the final stretch
      }
    }
    const currentScale = this.speedScale || 1.0;

    for (let i = 0; i < this.foxes.length; i++) {
      const f = this.foxes[i];
      if (!f.isAlive) continue;

      if (f.hitFlashTimer > 0) {
        f.hitFlashTimer -= dt;
      }

      f.bobPhase += dt * (1.6 * speedFactor * currentScale);

      // Target speed adjusted by speedFactor and user-configurable speedScale
      const targetSpeed = f.baseSpeed * speedFactor * currentScale;
      f.speed += (targetSpeed - f.speed) * Math.min(1, dt * 2.4);

      // 1. Victory Lap: If only 1 fox is alive (final 0.2s)
      if (this.aliveCount === 1) {
        const centerX = w / 2;
        const centerY = (h + padTop) / 2;
        const dx = centerX - f.x;
        const dy = centerY - f.y;
        const targetA = Math.atan2(dy, dx) + Math.PI / 2;
        let diff = targetA - f.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        f.angle += diff * Math.min(1, dt * 2.2 * currentScale);
      }
      // 2. 1v1 Final Duel: the 2 finalists perform dynamic dogfight circling (NEVER head-on collision freeze!)
      else if (this.isDuelMode && this.finalistIds.includes(f.id)) {
        const rivalId = this.finalistIds.find(id => id !== f.id);
        const rival = this.foxMap.get(rivalId);
        if (rival && rival.isAlive) {
          const dx = rival.x - f.x;
          const dy = rival.y - f.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const angleToRival = Math.atan2(dy, dx);

          // Dynamic dogfight orbit: maintain ~170-220px combat distance while circling
          const orbitDir = (f.id % 2 === 0) ? 1 : -1;
          let desiredAngle = angleToRival;

          if (dist > 220) {
            desiredAngle = angleToRival + 0.35 * orbitDir;
          } else if (dist < 140) {
            desiredAngle = angleToRival + Math.PI + 0.35 * orbitDir;
          } else {
            // Tangential orbit circling
            desiredAngle = angleToRival + (Math.PI / 2) * orbitDir;
          }

          let diff = desiredAngle - f.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          f.angle += diff * Math.min(1, dt * 2.4 * currentScale);
        }
      }
      // 3. Normal wandering flight
      else {
        f.turnTimer -= dt;
        if (f.turnTimer <= 0) {
          f.turnTimer = 1.2 + Math.random() * 2.0;
          f.targetAngle = f.angle + (Math.random() - 0.5) * 0.9;
        }

        const steerRate = 1.6 * speedFactor * currentScale;
        let diff = f.targetAngle - f.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        f.angle += diff * Math.min(1, dt * steerRate);
      }

      f.vx = Math.cos(f.angle) * f.speed;
      f.vy = Math.sin(f.angle) * f.speed;

      f.x += f.vx * dt;
      f.y += f.vy * dt;

      // Soft boundary bounce keeping clear of top HUD
      if (f.x < padSide) {
        f.x = padSide;
        f.targetAngle = (Math.random() - 0.5) * 1.2;
        f.angle = f.targetAngle;
      } else if (f.x > w - padSide) {
        f.x = w - padSide;
        f.targetAngle = Math.PI + (Math.random() - 0.5) * 1.2;
        f.angle = f.targetAngle;
      }

      if (f.y < padTop) {
        f.y = padTop;
        f.targetAngle = Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        f.angle = f.targetAngle;
      } else if (f.y > h - padBottom) {
        f.y = h - padBottom;
        f.targetAngle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        f.angle = f.targetAngle;
      }
    }
  }

  // Automatic combat: Continuous smooth decay, orbital dogfight duel, 0.2s lethal finish
  updateCombat(dt) {
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
    this.livingFoxes = aliveFoxes;

    // If only 1 fox is left (the sole winner), combat stops and victory lap begins
    if (aliveLen <= 1) return;

    // =========================================================================
    // STAGE 3: THE FINAL 0.2s - LETHAL FINISHING BLOW (EXACTLY 1 SOLE WINNER)
    // =========================================================================
    if (timeLeft <= 0.2) {
      if (aliveLen > 1) {
        let champion = aliveFoxes[0];
        let runnerUp = aliveFoxes[1];

        if (this.championId) {
          champion = this.foxMap.get(this.championId) || aliveFoxes[0];
          runnerUp = (champion === aliveFoxes[0]) ? aliveFoxes[1] : aliveFoxes[0];
        } else {
          champion = (aliveFoxes[0].hp + aliveFoxes[0].damageDealt >= aliveFoxes[1].hp + aliveFoxes[1].damageDealt)
            ? aliveFoxes[0]
            : aliveFoxes[1];
          runnerUp = (champion === aliveFoxes[0]) ? aliveFoxes[1] : aliveFoxes[0];
          this.championId = champion.id;
        }

        if (!this.finalShotFired && runnerUp && runnerUp.isAlive) {
          this.finalShotFired = true;
          // Champion fires lethal mega-laser beam
          this.fireBullet(champion, runnerUp, 9999, true);

          runnerUp.hp = 0;
          runnerUp.isAlive = false;
          runnerUp.eliminatedAt = t;
          this.aliveCount = 1;
          this.eliminationCount++;
          if (champion) champion.kills++;
          this.addExplosion(runnerUp.x, runnerUp.y, true);
          soundFX.playExplosion();
        }
      }
      return;
    }

    // =========================================================================
    // STAGE 2: 1v1 DUEL MODE (0.7s down to 0.2s: EXACTLY 2 FINALISTS DOGFIGHTING)
    // =========================================================================
    if (aliveLen === 2 || timeLeft <= 0.7) {
      // In case any excess remains at 0.7s, trim cleanly to top 2 finalists
      if (aliveLen > 2) {
        aliveFoxes.sort((a, b) => (b.hp + b.damageDealt * 0.1) - (a.hp + a.damageDealt * 0.1));
        for (let i = 2; i < aliveFoxes.length; i++) {
          const victim = aliveFoxes[i];
          victim.hp = 0;
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
        if (f1.hp !== f2.hp) {
          this.championId = f1.hp > f2.hp ? f1.id : f2.id;
        } else if (f1.damageDealt !== f2.damageDealt) {
          this.championId = f1.damageDealt > f2.damageDealt ? f1.id : f2.id;
        } else {
          this.championId = f1.id;
        }
      }

      // Fast, dramatic dogfight laser exchanges
      f1.fireTimer -= dt;
      f2.fireTimer -= dt;

      if (f1.fireTimer <= 0) {
        f1.fireTimer = 0.14 + Math.random() * 0.08;
        this.fireBullet(f1, f2, 12 + Math.random() * 8);
      }
      if (f2.fireTimer <= 0) {
        f2.fireTimer = 0.14 + Math.random() * 0.08;
        this.fireBullet(f2, f1, 12 + Math.random() * 8);
      }
      return;
    }

    // =========================================================================
    // STAGE 1: SMOOTH CONTINUOUS PACING (400 -> 2 FOXES EVENLY THROUGHOUT MATCH)
    // =========================================================================
    const duelStartTime = Math.max(0.5, totalDuration - 0.7);
    const initialCount = Math.max(2, this.foxes.length);
    const progress = Math.min(1.0, t / duelStartTime);

    // Smooth decay power curve: reaches ~150 foxes at 50% time, 2 foxes at duelStartTime
    const remainingFactor = Math.pow(1 - progress, 1.35);
    const targetPacedAlive = Math.max(2, Math.round(2 + (initialCount - 2) * remainingFactor));

    // Smoothly prune excess at a continuous, steady rate (max 1 or 2 per frame)
    // This completely eliminates any sudden freeze or massive 100-fox kill spike!
    if (aliveLen > targetPacedAlive) {
      const excess = aliveLen - targetPacedAlive;
      const elimThisTick = Math.min(excess, Math.max(1, Math.floor(excess * dt * 14)));

      // Target weakest foxes (lowest HP + damage), preserving top contenders
      const sortedCandidates = [...aliveFoxes].sort((a, b) => (a.hp + a.damageDealt * 0.05) - (b.hp + b.damageDealt * 0.05));

      for (let k = 0; k < elimThisTick; k++) {
        const victim = sortedCandidates[k];
        if (victim && victim.isAlive) {
          victim.hp = 0;
          victim.isAlive = false;
          victim.eliminatedAt = t;
          this.aliveCount--;
          this.eliminationCount++;
          this.addExplosion(victim.x, victim.y, false);

          // Attribute kill and damage to nearest active shooter
          for (let s = aliveFoxes.length - 1; s >= 0; s--) {
            const shooter = aliveFoxes[s];
            if (shooter.isAlive && shooter.id !== victim.id) {
              shooter.kills++;
              shooter.damageDealt += 90;
              break;
            }
          }
        }
      }

      // Memory cleanup trigger every 30 kills
      if (this.eliminationCount - this.lastCleanupEliminationCount >= 30) {
        this.lastCleanupEliminationCount = this.eliminationCount;
        this.performMemoryCleanup();
      }
    }

    // Normal multi-fox combat & visual laser volleys
    const cooldownMultiplier = this.isRapidFire ? 0.42 : 0.85;
    const isGlobalRange = aliveLen <= 40;

    for (let i = 0; i < aliveLen; i++) {
      const shooter = aliveFoxes[i];
      shooter.fireTimer -= dt;

      if (shooter.fireTimer <= 0) {
        shooter.fireTimer = (0.50 + Math.random() * 0.45) * cooldownMultiplier;

        let bestTarget = null;
        let minD2 = isGlobalRange ? Infinity : shooter.attackRange * shooter.attackRange;
        const samples = isGlobalRange ? aliveLen : Math.min(8, aliveLen);

        for (let s = 0; s < samples; s++) {
          const targetCandidate = isGlobalRange ? aliveFoxes[s] : aliveFoxes[Math.floor(Math.random() * aliveLen)];
          if (targetCandidate.id === shooter.id) continue;

          const dx = targetCandidate.x - shooter.x;
          const dy = targetCandidate.y - shooter.y;
          const d2 = dx * dx + dy * dy;

          if (d2 < minD2) {
            minD2 = d2;
            bestTarget = targetCandidate;
          }
        }

        if (bestTarget) {
          const baseDmg = 25 + Math.random() * 15;
          this.fireBullet(shooter, bestTarget, baseDmg);
        }
      }
    }
  }

  // Fire laser bullet towards target (Speed reduced by 1/3 for clear visibility)
  fireBullet(shooter, target, damage, isMega = false) {
    if (this.bullets.length > 50 && !isMega) return;

    const dx = target.x - shooter.x;
    const dy = target.y - shooter.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    // Laser speeds calibrated for visible, impactful projectiles
    const bulletSpeed = isMega ? 640 : (this.isRapidFire ? 460 : 340);

    this.bullets.push({
      id: ++this.bulletIdCounter,
      shooterId: shooter.id,
      targetId: target.id,
      x: shooter.x,
      y: shooter.y,
      vx: (dx / dist) * bulletSpeed,
      vy: (dy / dist) * bulletSpeed,
      damage,
      lifeTime: 0.95,
      isMegaLaser: isMega
    });

    soundFX.playLaser();
  }

  // Advance laser bullets and execute fast collision checks
  updateBullets(dt) {
    const hitRadiusSq = 24 * 24;
    const living = this.livingFoxes || [];

    for (let b = this.bullets.length - 1; b >= 0; b--) {
      const bul = this.bullets[b];
      bul.x += bul.vx * dt;
      bul.y += bul.vy * dt;
      bul.lifeTime -= dt;

      if (bul.lifeTime <= 0) {
        this.bullets.splice(b, 1);
        continue;
      }

      let hit = false;

      // 1. Direct Target check O(1)
      const targetFox = this.foxMap.get(bul.targetId);
      if (targetFox && targetFox.isAlive) {
        const dx = targetFox.x - bul.x;
        const dy = targetFox.y - bul.y;
        if (dx * dx + dy * dy <= hitRadiusSq) {
          this.applyDamage(targetFox, bul);
          hit = true;
        }
      }

      // 2. Proximity check against LIVING FOXES ONLY (not all 400 foxes!)
      if (!hit && bul.lifeTime < 0.75 && !this.isDuelMode && living.length <= 40) {
        for (let f = 0; f < living.length; f++) {
          const fox = living[f];
          if (!fox.isAlive || fox.id === bul.shooterId || fox.id === bul.targetId) continue;

          if (Math.abs(fox.x - bul.x) > 24 || Math.abs(fox.y - bul.y) > 24) continue;

          const dx = fox.x - bul.x;
          const dy = fox.y - bul.y;
          if (dx * dx + dy * dy <= hitRadiusSq) {
            this.applyDamage(fox, bul);
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        this.bullets.splice(b, 1);
      }
    }
  }

  // Apply hit damage and handle elimination (with 30-kill memory cleanup trigger)
  applyDamage(victim, bullet) {
    let actualDmg = Math.min(victim.hp, bullet.damage);
    if (this.isDuelMode && victim.hp - actualDmg <= 10) {
      actualDmg = Math.max(0, victim.hp - 10);
    }

    victim.hp -= actualDmg;
    victim.hitFlashTimer = 0.18;

    const shooter = this.foxMap.get(bullet.shooterId);
    if (shooter) {
      shooter.damageDealt += Math.round(actualDmg);
    }

    // Eliminate fox
    if (victim.hp <= 0) {
      victim.hp = 0;
      victim.isAlive = false;
      victim.eliminatedAt = this.battleTime;
      this.aliveCount = Math.max(0, this.aliveCount - 1);
      this.eliminationCount++;

      if (shooter) {
        shooter.kills += 1;
      }

      this.addExplosion(victim.x, victim.y, bullet.isMegaLaser);
      soundFX.playExplosion();

      // Trigger Memory Cleanup every 30 kills
      if (this.eliminationCount - this.lastCleanupEliminationCount >= 30) {
        this.lastCleanupEliminationCount = this.eliminationCount;
        this.performMemoryCleanup();
      }
    }
  }

  // Trigger elimination explosion particles with cap to prevent lag
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

  // Update explosion particles
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

  // Conclude battle: Crown the 1 sole Champion and Top 5 Survivors
  finishBattle() {
    this.phase = 'FINISHED';
    this.bullets = [];

    const living = this.foxes.filter(f => f.isAlive);
    const eliminated = this.foxes.filter(f => !f.isAlive);

    // Rule 1: Living foxes sorted by HP descending -> damageDealt -> kills -> ID
    living.sort((a, b) => {
      if (b.hp !== a.hp) return b.hp - a.hp;
      if (b.damageDealt !== a.damageDealt) return b.damageDealt - a.damageDealt;
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.id - b.id;
    });

    // Rule 2: Eliminated foxes sorted by eliminatedAt descending (survived longest) -> damageDealt -> kills -> ID
    eliminated.sort((a, b) => {
      if (b.eliminatedAt !== a.eliminatedAt) return (b.eliminatedAt || 0) - (a.eliminatedAt || 0);
      if (b.damageDealt !== a.damageDealt) return b.damageDealt - a.damageDealt;
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.id - b.id;
    });

    const fullRanked = [...living, ...eliminated];

    this.winner = fullRanked[0] || null;
    this.top5 = fullRanked.slice(0, 5); // ONLY TOP 5 SAVED & DISPLAYED
  }
}
