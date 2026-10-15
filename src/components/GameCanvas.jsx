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
            isDuelMode: engine.isDuelMode
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

      ctx.save();
      ctx.scale(dpr, dpr);

      // 3. Draw Background with Lobby -> Battlefield crossfade & 3s blur transition
      const lobbyImg = lobbyBgImageRef.current;
      const battleImg = battleBgImageRef.current;
      const phase = engine.phase;
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

      // 4. Draw Laser Bullets
      const bullets = engine.bullets;
      if (bullets.length > 0) {
        ctx.lineCap = 'round';

        for (let b = 0; b < bullets.length; b++) {
          const bul = bullets[b];
          const tailLen = bul.isMegaLaser ? 0.055 : (engine.isRapidFire ? 0.040 : 0.035);
          const tailX = bul.x - bul.vx * tailLen;
          const tailY = bul.y - bul.vy * tailLen;

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(bul.x, bul.y);

          if (bul.isMegaLaser) {
            ctx.lineWidth = 5.5;
            ctx.strokeStyle = '#facc15';
            ctx.stroke();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          } else if (engine.isRapidFire) {
            ctx.lineWidth = 3.0;
            ctx.strokeStyle = '#f43f5e';
            ctx.stroke();
          } else {
            ctx.lineWidth = 2.4;
            ctx.strokeStyle = '#f97316';
            ctx.stroke();
          }

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bul.x, bul.y, bul.isMegaLaser ? 3.5 : 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Draw Explosions
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

      // 6. Draw Foxes (Sprites + HP Bars + Name Tags)
      const foxImg = foxImageRef.current || fallbackFox;
      const foxes = engine.foxes;
      const foxW = 38;
      const foxH = 28;
      const barW = 32;
      const barH = 3.5;

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
        if (engine.aliveCount === 1) {
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

        // Aerodynamic banking tilt
        const tilt = Math.max(-0.25, Math.min(0.25, (f.vy / (f.speed || 1)) * 0.35));
        ctx.rotate(tilt);

        // Draw Fox Image centered
        ctx.drawImage(foxImg, -foxW / 2, -foxH / 2, foxW, foxH);

        // Hit flash highlight
        if (f.hitFlashTimer > 0) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(-foxW / 2, -foxH / 2, foxW, foxH);
        }

        ctx.restore();

        // Draw HP Bar
        const barX = drawX - barW / 2;
        const barY = drawY - foxH / 2 - 6;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(barX, barY, barW, barH);

        const hpRatio = Math.max(0, f.hp / f.maxHp);
        const curW = barW * hpRatio;
        if (curW > 0) {
          ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
          ctx.fillRect(barX, barY, curW, barH);
        }

        // Draw Name Tag
        let cleanName = (f.name || '').replace(/^[#\d\.\:\-\s]+/, '').trim();
        let shortName = cleanName || `Cáo ${f.id}`;
        if (shortName.length > 10) shortName = shortName.slice(0, 9) + '…';

        const label = engine.aliveCount === 1
          ? `🏆 ${f.id}.${shortName} (WINNER)`
          : engine.isDuelMode && f.isFinalist
          ? `👑 ${f.id}.${shortName}`
          : `${f.id}.${shortName}`;

        if (isLowCount) {
          ctx.strokeText(label, drawX, barY - 1.5);
        }

        ctx.fillStyle = engine.aliveCount === 1
          ? '#fef08a'
          : engine.isDuelMode && f.isFinalist
          ? '#fde047'
          : '#ffffff';
        ctx.fillText(label, drawX, barY - 1.5);
      }

      // 7. Last 3 Seconds: Big Holographic Countdown Display
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

      // 8. Battle Start Flash Banner (first 1.2s of Battle)
      if (phase === 'BATTLE' && engine.battleTime <= 1.2) {
        const progress = engine.battleTime / 1.2;
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
        ctx.fillText('SINH TỒN 400 CÁO BAY - TỰ ĐỘNG KHAI HỎA!', cx, cy + 38);

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
