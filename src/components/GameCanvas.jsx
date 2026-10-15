import React, { useRef, useEffect, useState } from 'react';
import { soundFX } from '../utils/audio';

// Cloudinary Image URLs
const FOX_IMG_URL = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791990958/c%C3%A1o_bay-removebg-preview_sz7uol.png';
const LOBBY_BG_URL = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1792040123/bc9fc038d1a29b2ae9f4a94fab288451_c4tb2x.jpg';
const BATTLE_BG_URL = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791991318/Standee_x_D%C3%A2y_%C4%91eo_WebDesign_2026_fkxelx.png';
const BG_FALLBACK_URL = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791988515/sticker_rutide.png';

// Procedural cute fox fallback canvas if image is loading or unavailable
function createFoxFallbackCanvas() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 48;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // Body
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(32, 26, 22, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(18, 14); ctx.lineTo(12, 3); ctx.lineTo(26, 12); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(38, 12); ctx.lineTo(52, 3); ctx.lineTo(46, 14); ctx.fill();

  // White muzzle
  ctx.fillStyle = '#fff7ed';
  ctx.beginPath();
  ctx.ellipse(32, 29, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes & Nose
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(26, 23, 2.5, 0, Math.PI * 2);
  ctx.arc(38, 23, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(32, 28, 2, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

// Helper to draw image aspect-cover
function drawCover(ctx, img, w, h) {
  if (!img || !img.complete || img.naturalWidth <= 0) return false;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const screenRatio = w / h;
  let dw, dh, dx, dy;

  if (screenRatio > imgRatio) {
    dw = w;
    dh = w / imgRatio;
    dx = 0;
    dy = (h - dh) / 2;
  } else {
    dh = h;
    dw = h * imgRatio;
    dx = (w - dw) / 2;
    dy = 0;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  return true;
}

export default function GameCanvas({
  engine,
  isFullscreen = false,
  onTimeUpdate,
  onBattleFinish
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const foxImageRef = useRef(null);
  const lobbyBgImageRef = useRef(null);
  const battleBgImageRef = useRef(null);

  // Dynamic Camera Zoom & On-Map Celebration Particles
  const cameraRef = useRef({ scale: 1.0, x: 0, y: 0, initialized: false });
  const celebrationParticlesRef = useRef([]);

  // Stable callback refs to ensure the render loop never restarts
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onBattleFinishRef = useRef(onBattleFinish);
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
    onBattleFinishRef.current = onBattleFinish;
  }, [onTimeUpdate, onBattleFinish]);

  // Preload Assets
  useEffect(() => {
    let active = true;
    const foxImg = new Image();
    foxImg.crossOrigin = 'anonymous';
    foxImg.src = FOX_IMG_URL;

    foxImg.onload = () => {
      if (active) foxImageRef.current = foxImg;
    };
    foxImg.onerror = () => {
      if (active) foxImageRef.current = createFoxFallbackCanvas();
    };

    // Preload Lobby Background
    const lobbyImg = new Image();
    lobbyImg.crossOrigin = 'anonymous';
    lobbyImg.src = LOBBY_BG_URL;
    lobbyImg.onload = () => {
      if (active) lobbyBgImageRef.current = lobbyImg;
    };
    lobbyImg.onerror = () => {
      if (active) lobbyBgImageRef.current = battleBgImageRef.current;
    };

    // Preload Battlefield Background
    const battleImg = new Image();
    battleImg.crossOrigin = 'anonymous';
    battleImg.src = BATTLE_BG_URL;
    battleImg.onload = () => {
      if (active) battleBgImageRef.current = battleImg;
    };
    battleImg.onerror = () => {
      const fallbackBg = new Image();
      fallbackBg.crossOrigin = 'anonymous';
      fallbackBg.src = BG_FALLBACK_URL;
      fallbackBg.onload = () => {
        if (active) battleBgImageRef.current = fallbackBg;
      };
    };

    return () => {
      active = false;
    };
  }, []);

  // Main 60 FPS Render Loop (Rock-solid, zero reflow, zero effect-churn)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId = null;
    let lastTime = performance.now();
    let lastHudNotifyTime = 0;
    let finishedNotified = false;

    // Cache dimensions in memory: NEVER call getBoundingClientRect() inside render loop!
    let curWidth = 1200;
    let curHeight = 720;
    let curDpr = 1;

    const updateCanvasSize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const rawDpr = window.devicePixelRatio || 1;
      // In fullscreen, clamp DPR to 1 or 1.25 to prevent 4K fillrate bottlenecks
      const dpr = isFullscreen ? Math.min(rawDpr, 1.25) : Math.min(rawDpr, 2);
      const w = Math.floor(rect.width) || window.innerWidth || 1200;
      const h = Math.floor(rect.height) || window.innerHeight || 720;

      curWidth = w;
      curHeight = h;
      curDpr = dpr;

      const targetPixelW = Math.floor(w * dpr);
      const targetPixelH = Math.floor(h * dpr);

      if (canvas.width !== targetPixelW || canvas.height !== targetPixelH) {
        canvas.width = targetPixelW;
        canvas.height = targetPixelH;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }

      engine.mapWidth = w;
      engine.mapHeight = h;

      if (!cameraRef.current.initialized) {
        cameraRef.current.scale = 1.0;
        cameraRef.current.x = w / 2;
        cameraRef.current.y = h / 2;
        cameraRef.current.initialized = true;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const fallbackFox = createFoxFallbackCanvas();

    const render = (now) => {
      const dt = Math.max(0.001, Math.min((now - lastTime) / 1000, 0.033));
      lastTime = now;

      // 1. Step physics engine
      if (engine.phase === 'LOBBY' || engine.phase === 'BATTLE') {
        engine.update(dt);

        // Throttle React HUD updates to 10 FPS (100ms)
        if (onTimeUpdateRef.current && now - lastHudNotifyTime >= 95) {
          lastHudNotifyTime = now;
          onTimeUpdateRef.current({
            phase: engine.phase,
            lobbyTime: engine.lobbyTime,
            battleTime: engine.battleTime,
            lobbyDuration: engine.lobbyDuration,
            battleDuration: engine.battleDuration,
            aliveCount: engine.aliveCount,
            totalFoxes: engine.foxes.length,
            isRapidFire: engine.isRapidFire,
            isDuelMode: engine.isDuelMode,
            isDoorAnimating: Boolean(engine.isDoorAnimating)
          });
        }

        // Battle finished callback
        if (engine.phase === 'FINISHED' && !finishedNotified) {
          finishedNotified = true;
          if (onBattleFinishRef.current) {
            onBattleFinishRef.current(engine.winner, engine.top5);
          }
        }
      } else if (engine.phase === 'IDLE') {
        finishedNotified = false;
      }

      // 2. Prepare Drawing Context using cached size (NO reflow!)
      const w = curWidth;
      const h = curHeight;
      const dpr = curDpr;
      const phase = engine.phase;
      const foxes = engine.foxes;

      // =====================================================================
      // DYNAMIC SMOOTH CAMERA ZOOM & TRACKING (2/3 time, 1/3 time, <=5 foxes, Winner 3s)
      // =====================================================================
      let targetScale = 1.0;
      let targetFocusX = w / 2;
      let targetFocusY = h / 2;

      if (phase === 'BATTLE') {
        if (engine.isCelebrating && engine.winner) {
          // 3s On-map Winner Celebration: Zoom in close to champion (2.15x)
          targetScale = 2.15;
          targetFocusX = engine.winner.x;
          targetFocusY = engine.winner.y;
        } else if (engine.aliveCount <= 4) {
          // 3-4 Con đâm nhau hoặc 1v1 duel: Dynamic close combat zoom (1.78x)
          targetScale = 1.78;
          let sumX = 0, sumY = 0, cnt = 0;
          for (let i = 0; i < foxes.length; i++) {
            if (foxes[i].isAlive) {
              sumX += foxes[i].x;
              sumY += foxes[i].y;
              cnt++;
            }
          }
          if (cnt > 0) {
            targetFocusX = sumX / cnt;
            targetFocusY = sumY / cnt;
          }
        } else if (engine.aliveCount <= 50) {
          // 50 con cuối cùng tụ lại 1 vùng: ZOOM VÀO VÙNG TỤ NÀY (1.52x)!
          targetScale = 1.52;
          let sumX = 0, sumY = 0, cnt = 0;
          for (let i = 0; i < foxes.length; i++) {
            if (foxes[i].isAlive) {
              sumX += foxes[i].x;
              sumY += foxes[i].y;
              cnt++;
            }
          }
          if (cnt > 0) {
            targetFocusX = sumX / cnt;
            targetFocusY = sumY / cnt;
          }
        } else {
          // Progress-based smooth zoom before reaching 50 foxes:
          const battleProgress = engine.battleTime / Math.max(1, engine.battleDuration);
          if (battleProgress >= 0.667) {
            targetScale = 1.28;
          } else if (battleProgress >= 0.333) {
            targetScale = 1.15;
          } else {
            targetScale = 1.0;
          }

          // Bias target focus towards center of mass of living foxes
          let sumX = 0, sumY = 0, cnt = 0;
          const sampleCount = Math.min(25, foxes.length);
          for (let i = 0; i < sampleCount; i++) {
            if (foxes[i].isAlive) {
              sumX += foxes[i].x;
              sumY += foxes[i].y;
              cnt++;
            }
          }
          if (cnt > 0) {
            targetFocusX = (w / 2) * 0.4 + (sumX / cnt) * 0.6;
            targetFocusY = (h / 2) * 0.4 + (sumY / cnt) * 0.6;
          }
        }
      }

      // Clamp target focus point so camera viewport NEVER exposes void outside [0, 0, w, h]
      const halfW = (w / 2) / Math.max(1.0, targetScale);
      const halfH = (h / 2) / Math.max(1.0, targetScale);
      const clampedTargetX = Math.max(halfW, Math.min(w - halfW, targetFocusX));
      const clampedTargetY = Math.max(halfH, Math.min(h - halfH, targetFocusY));

      // Frame-rate independent smooth camera lerp (Stationary & locked in IDLE/LOBBY with zero drift!)
      const cam = cameraRef.current;
      if (phase === 'IDLE' || phase === 'LOBBY') {
        cam.scale = 1.0;
        cam.x = w / 2;
        cam.y = h / 2;
      } else {
        const lerpSpeed = Math.min(1.0, dt * 2.8);
        cam.scale += (targetScale - cam.scale) * lerpSpeed;
        cam.x += (clampedTargetX - cam.x) * lerpSpeed;
        cam.y += (clampedTargetY - cam.y) * lerpSpeed;
      }

      // Base Canvas DPR Scale
      ctx.save();
      ctx.scale(dpr, dpr);

      // =====================================================================
      // WORLD SPACE TRANSFORM (ZOOMED & PANNED IN HIGH DEFINITION)
      // =====================================================================
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.scale, cam.scale);
      ctx.translate(-cam.x, -cam.y);

      // 3. Draw Background with Lobby -> Battlefield crossfade & 3s blur transition
      const lobbyImg = lobbyBgImageRef.current;
      const battleImg = battleBgImageRef.current;
      const isLobby = phase === 'LOBBY' || phase === 'IDLE';
      const isBattle = phase === 'BATTLE' || phase === 'FINISHED';

      const lobbyTimeLeft = isLobby ? Math.max(0, engine.lobbyDuration - engine.lobbyTime) : 0;
      const isLast3sLobby = phase === 'LOBBY' && lobbyTimeLeft <= 3.0;

      if (phase === 'IDLE') {
        if (!drawCover(ctx, lobbyImg, w, h)) {
          drawCover(ctx, battleImg, w, h);
        }
      } else if (phase === 'LOBBY') {
        if (!isLast3sLobby) {
          // Normal Lobby: Show Lobby Background
          if (!drawCover(ctx, lobbyImg, w, h)) {
            drawCover(ctx, battleImg, w, h);
          }
        } else {
          // Last 3s of Lobby: Crossfade from Lobby image into Battlefield image!
          const transitionProgress = Math.min(1.0, Math.max(0.0, (3.0 - lobbyTimeLeft) / 3.0));

          // Base layer: Battlefield image
          drawCover(ctx, battleImg, w, h);

          // Top fading layer: Lobby image mờ dần
          ctx.save();
          ctx.globalAlpha = Math.max(0.0, 1.0 - transitionProgress);
          drawCover(ctx, lobbyImg, w, h);
          ctx.restore();

          // Cinematic blur & vignette overlay: màn hình mờ
          ctx.save();
          const blurOpacity = 0.25 + 0.35 * Math.sin(transitionProgress * Math.PI);
          const vignette = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, Math.max(w, h) * 0.75);
          vignette.addColorStop(0, `rgba(5, 8, 22, ${blurOpacity * 0.6})`);
          vignette.addColorStop(1, `rgba(2, 4, 12, ${blurOpacity * 1.1})`);
          ctx.fillStyle = vignette;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      } else if (isBattle) {
        // In Battle: Battlefield Background as before
        drawCover(ctx, battleImg, w, h);
      }

      // Dark tech overlay for high contrast
      ctx.fillStyle = 'rgba(5, 8, 20, 0.36)';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = engine.aliveCount === 1
        ? 'rgba(250, 204, 21, 0.16)'
        : engine.isDuelMode
        ? 'rgba(234, 179, 8, 0.12)'
        : engine.isRapidFire
        ? 'rgba(239, 68, 68, 0.08)'
        : 'rgba(249, 115, 22, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 65;
      ctx.beginPath();
      for (let x = 0; x < w; x += gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(w, y);
      }
      ctx.stroke();

      // 4. Draw Melee Punch Clash Effects (POW!, BAM!, sparks, starbursts)
      const clashes = engine.clashEffects || [];
      for (let c = 0; c < clashes.length; c++) {
        const cl = clashes[c];
        if (cl.life > 0) {
          const progress = 1 - cl.life / cl.maxLife;
          const alpha = Math.max(0, cl.life / cl.maxLife);
          const currentSize = cl.size * (1 + progress * 0.6);

          ctx.save();
          ctx.translate(cl.x, cl.y);
          ctx.globalAlpha = alpha;

          // Starburst impact background
          ctx.fillStyle = cl.color || '#facc15';
          ctx.beginPath();
          const spikes = 8;
          const outerR = currentSize;
          const innerR = currentSize * 0.45;
          for (let s = 0; s < spikes * 2; s++) {
            const r = (s % 2 === 0) ? outerR : innerR;
            const a = (s * Math.PI) / spikes;
            if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();

          // Comic text label ("BỐP!", "BAM!", "POW!", "K.O!")
          ctx.font = '900 13px "Orbitron", Impact, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#020617';
          ctx.strokeText(cl.text, 0, -2);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(cl.text, 0, -2);

          ctx.restore();
        }
      }
      ctx.globalAlpha = 1.0;

      // 5. Draw Explosions / KO Particles
      const explosions = engine.explosions;
      for (let e = 0; e < explosions.length; e++) {
        const exp = explosions[e];
        for (let p = 0; p < exp.particles.length; p++) {
          const pt = exp.particles[p];
          if (pt.life > 0) {
            const alpha = Math.max(0, pt.life / pt.maxLife);
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1.0;

      // 6. Draw Foxes (Sprites + Clean Name Tags - NO HEALTH BARS!)
      const foxImg = foxImageRef.current || fallbackFox;
      const foxW = 38;
      const foxH = 28;

      ctx.font = 'bold 9.5px "Outfit", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      // Only use multi-pass strokeText when 60 or fewer foxes are alive
      const isLowCount = engine.aliveCount <= 60;
      if (isLowCount) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#020617';
      }

      for (let i = 0; i < foxes.length; i++) {
        const f = foxes[i];
        if (!f.isAlive) continue;

        const bob = Math.sin(f.bobPhase) * 2;
        const drawX = f.x;
        const drawY = f.y + bob;

        ctx.save();
        ctx.translate(drawX, drawY);

        // Sole Survivor Aura Ring
        if (engine.aliveCount === 1 || engine.isCelebrating) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          const auraR = 26 + Math.sin(now * 0.01) * 4;
          ctx.arc(0, 0, auraR, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Finalist Duel Aura Ring
        else if (engine.isDuelMode && f.isFinalist) {
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          const pulseR = 24 + Math.sin(now * 0.008) * 3;
          ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Horizontal flip based on horizontal velocity
        if (f.vx < 0) {
          ctx.scale(-1, 1);
        }

        // Aerodynamic banking tilt & punch lunge
        let tilt = f.isDropping
          ? (f.tilt || 0)
          : Math.max(-0.25, Math.min(0.25, (f.vy / (f.speed || 1)) * 0.35));
        if (f.punchTimer > 0) {
          tilt += (Math.random() - 0.5) * 0.3; // Punch vibration
        }
        ctx.rotate(tilt);

        // Falling drop wind speed lines behind fox
        if (f.isDropping) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -foxH / 2);
          ctx.lineTo(0, -foxH / 2 - 18);
          ctx.moveTo(-7, -foxH / 2 + 3);
          ctx.lineTo(-7, -foxH / 2 - 12);
          ctx.moveTo(7, -foxH / 2 + 3);
          ctx.lineTo(7, -foxH / 2 - 12);
          ctx.stroke();
          ctx.restore();
        }

        // Cute landing squash & stretch bounce
        if (f.bounceTimer > 0) {
          const bounceProg = f.bounceTimer / 0.22;
          const squash = Math.sin(bounceProg * Math.PI) * 0.22;
          ctx.scale(1 + squash, 1 - squash);
        }

        // Draw Fox Image centered
        ctx.drawImage(foxImg, -foxW / 2, -foxH / 2, foxW, foxH);

        ctx.restore();

        // Draw Name Tag directly above the Fox (NO HEALTH BAR!)
        let cleanName = (f.name || '').replace(/^[#\d\.\:\-\s]+/, '').trim();
        let shortName = cleanName || `Cáo ${f.id}`;
        if (shortName.length > 10) shortName = shortName.slice(0, 9) + '…';

        const label = (engine.aliveCount === 1 || engine.isCelebrating)
          ? `🏆 ${f.id}.${shortName} (WINNER)`
          : engine.isDuelMode && f.isFinalist
          ? `👑 ${f.id}.${shortName}`
          : `${f.id}.${shortName}`;

        const tagY = drawY - foxH / 2 - 4;

        if (isLowCount) {
          ctx.strokeText(label, drawX, tagY);
        }

        ctx.fillStyle = (engine.aliveCount === 1 || engine.isCelebrating)
          ? '#fef08a'
          : engine.isDuelMode && f.isFinalist
          ? '#fde047'
          : '#ffffff';
        ctx.fillText(label, drawX, tagY);
      }

      // 7. On-Map Winner Celebration (3 Seconds of Glorious Fireworks & Sunburst on the Map!)
      if (engine.isCelebrating && engine.winner) {
        const winner = engine.winner;

        // Spawn on-map celebration fireworks & confetti particles
        const particles = celebrationParticlesRef.current;
        if (particles.length < 85) {
          particles.push({
            x: winner.x + (Math.random() - 0.5) * 50,
            y: winner.y - 10 + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 120,
            vy: -70 - Math.random() * 80,
            size: 2.2 + Math.random() * 2.8,
            color: ['#facc15', '#f59e0b', '#fbbf24', '#ef4444', '#38bdf8', '#ffffff'][Math.floor(Math.random() * 6)],
            life: 0.75 + Math.random() * 0.5,
            maxLife: 1.2
          });
        }

        for (let p = particles.length - 1; p >= 0; p--) {
          const pt = particles[p];
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 85 * dt;
          pt.life -= dt;
          if (pt.life <= 0) {
            particles.splice(p, 1);
            continue;
          }
          const alpha = Math.max(0, pt.life / pt.maxLife);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Spinning golden sunburst rays around champion
        ctx.save();
        ctx.translate(winner.x, winner.y);
        const rayCount = 14;
        const spinA = now * 0.002;
        for (let r = 0; r < rayCount; r++) {
          const a = spinA + (r * Math.PI * 2) / rayCount;
          ctx.fillStyle = r % 2 === 0 ? 'rgba(250, 204, 21, 0.16)' : 'rgba(249, 115, 22, 0.08)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, 95, a - 0.12, a + 0.12);
          ctx.closePath();
          ctx.fill();
        }

        // Floating golden crown badge above winner
        ctx.font = '900 13px "Orbitron", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#020617';
        ctx.strokeText('👑 QUÁN QUÂN BRAWL 👑', 0, -32);
        ctx.fillStyle = '#fde047';
        ctx.fillText('👑 QUÁN QUÂN BRAWL 👑', 0, -32);

        ctx.restore();
      }

      // Restore World Transform
      ctx.restore();

      // =====================================================================
      // SCREEN-SPACE OVERLAYS (STATIONARY, UNZOOMED ON SCREEN)
      // =====================================================================

      // 8. Last 3 Seconds of Lobby: Big Holographic Countdown Display
      if (phase === 'LOBBY' && isLast3sLobby && lobbyTimeLeft > 0) {
        const sec = Math.ceil(lobbyTimeLeft);
        const subSec = lobbyTimeLeft % 1;
        const pulse = 1.0 + Math.pow(subSec, 1.5) * 0.28;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cx = w / 2;
        const cy = h / 2 - 15;

        // Frosted Card Backdrop
        const cardW = 340;
        const cardH = 180;
        ctx.fillStyle = 'rgba(10, 15, 30, 0.82)';
        ctx.strokeStyle = sec === 1 ? 'rgba(239, 68, 68, 0.85)' : sec === 2 ? 'rgba(245, 158, 11, 0.85)' : 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 20);
        } else {
          ctx.rect(cx - cardW / 2, cy - cardH / 2, cardW, cardH);
        }
        ctx.fill();
        ctx.stroke();

        // Top tag
        ctx.font = 'bold 12.5px "Outfit", system-ui, sans-serif';
        ctx.fillStyle = '#fb923c';
        ctx.fillText('⚡ CHIẾN TRƯỜNG MỞ SAU ⚡', cx, cy - 50);

        // Huge Pulsing Number 3, 2, 1
        ctx.save();
        ctx.translate(cx, cy + 4);
        ctx.scale(pulse, pulse);
        ctx.font = '900 70px "Orbitron", system-ui, monospace';
        ctx.fillStyle = sec === 1 ? '#ef4444' : sec === 2 ? '#f59e0b' : '#38bdf8';
        ctx.shadowColor = sec === 1 ? 'rgba(239, 68, 68, 0.95)' : 'rgba(245, 158, 11, 0.95)';
        ctx.shadowBlur = 35;
        ctx.fillText(`${sec}`, 0, 0);
        ctx.restore();

        // Bottom subtitle
        ctx.font = '600 12.5px "Outfit", system-ui, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.shadowBlur = 0;
        ctx.fillText('Chuẩn bị cất cánh chiến đấu!', cx, cy + 58);

        ctx.restore();
      }

      // 9. Battle Start Flash Banner (During startDelay = 1.5s while foxes roam peacefully)
      if (phase === 'BATTLE' && engine.battleTime <= 1.5) {
        const progress = engine.battleTime / 1.5;
        const alpha = Math.max(0, 1.0 - progress);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cx = w / 2;
        const cy = h / 2 - 30;

        ctx.font = '900 38px "Orbitron", system-ui, monospace';
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 6;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.95)';
        ctx.shadowBlur = 35;
        ctx.strokeText('🔥 CHIẾN ĐẤU BẮT ĐẦU! 🔥', cx, cy);
        ctx.fillText('🔥 CHIẾN ĐẤU BẮT ĐẦU! 🔥', cx, cy);

        ctx.font = 'bold 15px "Outfit", system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillText('CHUẨN BỊ... BẮT ĐẦU LAO VÀO ĐẤM NHAU!', cx, cy + 38);

        ctx.restore();
      }

      // 10. Cinematic Black Screen Shutter Drop & Split Opening Door Effect
      if (engine.isDoorAnimating && (engine.doorPhase === 'DROPPING' || engine.doorPhase === 'OPENING')) {
        ctx.save();

        if (engine.doorPhase === 'DROPPING') {
          const progress = Math.min(1.0, engine.doorTimer / (engine.doorDropDuration || 1.4));
          // Ease-out cubic for realistic heavy drop
          const ease = 1 - Math.pow(1 - progress, 3);
          const shutterY = -h + ease * h;

          ctx.save();
          ctx.translate(0, shutterY);

          // Dark obsidian metal gradient
          const metalGrad = ctx.createLinearGradient(0, 0, 0, h);
          metalGrad.addColorStop(0, '#020408');
          metalGrad.addColorStop(0.3, '#0b0f1a');
          metalGrad.addColorStop(0.7, '#080c14');
          metalGrad.addColorStop(1, '#020408');
          ctx.fillStyle = metalGrad;
          ctx.fillRect(0, 0, w, h);

          // Horizontal metal panels / grooves
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1.5;
          const grooveStep = 45;
          ctx.beginPath();
          for (let gy = grooveStep; gy < h; gy += grooveStep) {
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
          }
          ctx.stroke();

          // Center seam line where the door will split
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.65)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(w / 2, h);
          ctx.stroke();

          // Bottom bumper edge with warning stripes & neon glow
          const bumperH = 14;
          const bumperY = h - bumperH;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, bumperY, w, bumperH);

          // Bottom edge glowing neon laser strip
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 3;
          ctx.shadowColor = 'rgba(249, 115, 22, 0.9)';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(0, h - 1);
          ctx.lineTo(w, h - 1);
          ctx.stroke();

          // Center Door Shield / Vault Emblem
          const cx = w / 2;
          const cy = h / 2;
          ctx.save();
          ctx.shadowColor = 'rgba(249, 115, 22, 0.7)';
          ctx.shadowBlur = 20;

          // Emblem circle background
          ctx.fillStyle = '#090d16';
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, 54, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner ring
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 46, 0, Math.PI * 2);
          ctx.stroke();

          // Text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '900 16px "Orbitron", Impact, sans-serif';
          ctx.fillStyle = '#fb923c';
          ctx.fillText('ARENA GATES', cx, cy - 6);
          ctx.font = 'bold 9.5px "Outfit", sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('CHUẨN BỊ MỞ CỬA', cx, cy + 14);

          ctx.restore();
          ctx.restore();
        } else if (engine.doorPhase === 'OPENING') {
          const progress = Math.min(1.0, engine.doorTimer / (engine.doorOpenDuration || 2.6));
          // Ease-in-out quadratic for smooth, weighty split
          const ease = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const slideDist = ease * (w / 2 + 30);
          const leftDoorX = -slideDist;
          const rightDoorX = w / 2 + slideDist;
          const doorWidth = w / 2;

          // 1. Draw Golden Light Flare emerging from the widening center gap
          const gapLeft = w / 2 - slideDist;
          const gapRight = w / 2 + slideDist;
          const gapW = gapRight - gapLeft;
          if (gapW > 0 && progress < 0.95) {
            ctx.save();
            const flareAlpha = Math.max(0, (1 - progress) * 0.45);
            const flareGrad = ctx.createLinearGradient(gapLeft, 0, gapRight, 0);
            flareGrad.addColorStop(0, 'rgba(251, 146, 60, 0)');
            flareGrad.addColorStop(0.5, `rgba(255, 240, 200, ${flareAlpha})`);
            flareGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
            ctx.fillStyle = flareGrad;
            ctx.fillRect(gapLeft, 0, gapW, h);
            ctx.restore();
          }

          // Function to draw one half of the metallic door
          const drawDoorPanel = (x, isLeft) => {
            ctx.save();
            ctx.translate(x, 0);

            // Metallic dark panel gradient
            const metalGrad = ctx.createLinearGradient(0, 0, 0, h);
            metalGrad.addColorStop(0, '#020408');
            metalGrad.addColorStop(0.3, '#0b0f1a');
            metalGrad.addColorStop(0.7, '#080c14');
            metalGrad.addColorStop(1, '#020408');
            ctx.fillStyle = metalGrad;
            ctx.fillRect(0, 0, doorWidth, h);

            // Horizontal reinforcing grooves
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1.5;
            const grooveStep = 45;
            ctx.beginPath();
            for (let gy = grooveStep; gy < h; gy += grooveStep) {
              ctx.moveTo(0, gy);
              ctx.lineTo(doorWidth, gy);
            }
            ctx.stroke();

            // Bottom bumper edge
            const bumperH = 14;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, h - bumperH, doorWidth, bumperH);

            // Bottom edge neon laser strip
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, h - 1);
            ctx.lineTo(doorWidth, h - 1);
            ctx.stroke();

            // Center vertical seam edge neon strip
            const seamX = isLeft ? doorWidth : 0;
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 3.5;
            ctx.shadowColor = 'rgba(249, 115, 22, 0.95)';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.moveTo(seamX, 0);
            ctx.lineTo(seamX, h);
            ctx.stroke();

            // Halved circular emblem on the seam
            ctx.save();
            ctx.beginPath();
            if (isLeft) {
              ctx.arc(doorWidth, h / 2, 54, -Math.PI / 2, Math.PI / 2);
            } else {
              ctx.arc(0, h / 2, 54, Math.PI / 2, -Math.PI / 2);
            }
            ctx.fillStyle = '#090d16';
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            ctx.restore();
          };

          // Draw Left and Right Doors
          drawDoorPanel(leftDoorX, true);
          drawDoorPanel(rightDoorX, false);
        }

        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateCanvasSize);
      soundFX.stopLobbyMusic();
    };
  }, [engine, isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 w-screen h-screen z-30 bg-slate-950 overflow-hidden select-none'
          : 'relative w-full h-[65vh] sm:h-[72vh] md:h-[76vh] min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]'
      }
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* Subtle Corner Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_0_80px_rgba(0,0,0,0.7)]" />
    </div>
  );
}
