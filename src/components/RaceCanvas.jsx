import React, { useRef, useEffect, useState, useCallback } from 'react';

const FOX_IMAGE_SRC = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791990958/c%C3%A1o_bay-removebg-preview_sz7uol.png';
const BG_IMAGE_SRC = 'https://res.cloudinary.com/ds11ggie4/image/upload/v1791991318/Standee_x_D%C3%A2y_%C4%91eo_WebDesign_2026_fkxelx.png';
//#Hi mpc
export default function RaceCanvas({
  engine,
  isRacing,
  onTimeUpdate,
  onRaceFinish
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const cameraXRef = useRef(0);
  const sizeRef = useRef({ width: 1400, height: 800, dpr: 1 });

  const foxImgRef = useRef(null);
  const bgImgRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Speed lines & ambient particles for smooth flying sensation
  const particlesRef = useRef([]);

  // Safe image preloading
  useEffect(() => {
    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        setImagesLoaded(true);
      }
    };

    const foxImg = new Image();
    foxImg.crossOrigin = 'anonymous';
    foxImg.src = FOX_IMAGE_SRC;
    foxImg.onload = checkAllLoaded;
    foxImg.onerror = checkAllLoaded;
    foxImgRef.current = foxImg;

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.src = BG_IMAGE_SRC;
    bgImg.onload = checkAllLoaded;
    bgImg.onerror = checkAllLoaded;
    bgImgRef.current = bgImg;

    // Initialize 45 smooth flying wind streaks
    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * 2600,
        y: Math.random() * 900,
        length: 16 + Math.random() * 26,
        speed: 7 + Math.random() * 9,
        opacity: 0.15 + Math.random() * 0.35
      });
    }
    particlesRef.current = particles;
  }, []);

  // Main 60 FPS animation loop with DPR correction and smooth interpolation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId;
    let lastTime = performance.now();

    const render = (now) => {
      // Precise clamped delta time to eliminate micro-stutters
      const dt = Math.max(0.001, Math.min((now - lastTime) / 1000, 0.033));
      lastTime = now;

      // 1. Advance physics simulation
      if (engine.isRacing && !engine.isFinished) {
        engine.update(dt);
        if (onTimeUpdate) {
          onTimeUpdate(engine.raceTime);
        }
        if (engine.isFinished && onRaceFinish) {
          onRaceFinish(engine.winner, engine.top10);
        }
      }

      const { width, height, dpr } = sizeRef.current;

      // 2. Camera smooth tracking using exponential smoothing
      const foxes = engine.foxes;
      const leadFox = engine.top10[0] || (foxes.length > 0 ? foxes[0] : null);

      let targetCameraX = 0;
      if (engine.isRacing || engine.isFinished) {
        if (leadFox) {
          // Camera tracks leader smoothly once they cross 55% of the screen
          targetCameraX = Math.max(0, leadFox.x - width * 0.55);
        }
      } else {
        // At start: ensure both the fleet and the forward Start Line are perfectly visible
        const startLineX = engine.startLineX || Math.max(350, width * 0.28);
        if (width < startLineX + 60) {
          targetCameraX = Math.max(0, startLineX - width * 0.85);
        } else {
          targetCameraX = 0;
        }
      }

      // Smooth camera lerp (frame-rate independent)
      cameraXRef.current += (targetCameraX - cameraXRef.current) * (1 - Math.exp(-dt * 6.0));
      const cameraX = cameraXRef.current;

      // Reset transform to DPR for crystal-sharp rendering
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 3. Draw Background (Cover full canvas, non-duplicated)
      const bgImg = bgImgRef.current;
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, width, height);

        // Subtle dark contrast veil so foxes & name tags remain legible
        ctx.fillStyle = 'rgba(10, 15, 30, 0.32)';
        ctx.fillRect(0, 0, width, height);
      } else {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(1, '#05070c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Apply camera pan for race track elements
      ctx.save();
      ctx.translate(-cameraX, 0);

      // 4. Draw Start Line (Positioned precisely at 1/4 of the screen in front of all foxes)
      const startLineX = engine.startLineX || Math.max(300, width * 0.25);
      ctx.save();
      
      // Glowing white vertical start line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(startLineX, 0);
      ctx.lineTo(startLineX, height);
      ctx.stroke();

      // Checkered pattern along start line
      const chkSize = 14;
      for (let y = 0; y < height; y += chkSize * 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(startLineX - 6, y, 6, chkSize);
        ctx.fillRect(startLineX, y + chkSize, 6, chkSize);
      }

      // Start text banner at top of start line
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 18;
      ctx.fillRect(startLineX - 48, 10, 96, 26);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('XUẤT PHÁT', startLineX, 23);
      ctx.restore();

      // 5. Draw Finish Line
      const finishLineX = engine.finishLineDistance || (startLineX + 4150);
      ctx.save();
      const boxSize = 16;
      for (let y = 0; y < height; y += boxSize) {
        for (let col = 0; col < 2; col++) {
          ctx.fillStyle = (Math.floor(y / boxSize) + col) % 2 === 0 ? '#ffffff' : '#f97316';
          ctx.fillRect(finishLineX + col * boxSize, y, boxSize, boxSize);
        }
      }

      // Finish Banner
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.fillRect(finishLineX - 12, 10, 56, 26);
      ctx.fillStyle = '#000000';
      ctx.font = '900 13px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ĐÍCH', finishLineX + 16, 23);
      ctx.restore();

      // 6. Smooth Speed Particles
      const particles = particlesRef.current;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (engine.isRacing) {
          p.x -= p.speed * 2.2;
          if (p.x < cameraX - 200) {
            p.x = cameraX + width + Math.random() * 300;
            p.y = Math.random() * height;
          }
        }
        ctx.fillRect(p.x, p.y, p.length, 1.4);
      }

      // 7. Render 400 Foxes
      const foxImg = foxImgRef.current;
      const hasFoxImg = foxImg && foxImg.complete && foxImg.naturalWidth > 0;
      const foxAspect = hasFoxImg ? foxImg.naturalWidth / foxImg.naturalHeight : 1.25;

      // Sized prominently for great visibility and crisp detail
      const foxHeight = 28;
      const foxWidth = foxHeight * foxAspect;

      for (let i = 0; i < foxes.length; i++) {
        const fox = foxes[i];
        const isLeader = fox.rank === 1;

        // Viewport culling to maintain high performance
        if (fox.x + 100 < cameraX || fox.x - 100 > cameraX + width) {
          continue;
        }

        ctx.save();

        // 7a. Draw Smooth Aerodynamic Nitro Trail behind fox
        if (engine.isRacing) {
          const trailLength = fox.isBursting ? 40 : isLeader ? 32 : 22;
          const trailGrad = ctx.createLinearGradient(
            fox.x,
            fox.y + foxHeight / 2,
            fox.x - trailLength,
            fox.y + foxHeight / 2
          );

          if (fox.isBursting) {
            trailGrad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
            trailGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          } else if (isLeader) {
            trailGrad.addColorStop(0, 'rgba(245, 158, 11, 0.75)');
            trailGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
          } else {
            trailGrad.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
            trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          }

          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = fox.isBursting ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(fox.x, fox.y + foxHeight / 2);
          ctx.lineTo(fox.x - trailLength, fox.y + foxHeight / 2);
          ctx.stroke();
        }

        // 7b. Draw Fox Image
        if (hasFoxImg) {
          const tilt = Math.cos(engine.raceTime * fox.sinSpeed + fox.sinOffset) * 0.05;
          ctx.translate(fox.x + foxWidth / 2, fox.y + foxHeight / 2);
          ctx.rotate(tilt);

          if (isLeader || fox.isBursting) {
            ctx.shadowColor = fox.isBursting ? '#ef4444' : '#f59e0b';
            ctx.shadowBlur = 10;
          }

          // Flip fox horizontally so it flies forward (left to right)
          ctx.scale(-1, 1);

          ctx.drawImage(
            foxImg,
            -foxWidth / 2,
            -foxHeight / 2,
            foxWidth,
            foxHeight
          );
          ctx.restore();
        } else {
          ctx.fillStyle = '#f97316';
          ctx.fillRect(fox.x, fox.y, foxWidth, foxHeight);
          ctx.restore();
        }

        // 7c. Draw Compact Name Tag Pill directly above fox
        ctx.save();
        
        // Clean any duplicate numbers if player name already starts with numbers/indexes
        const cleanName = (fox.name || '').replace(/^[#\d\.\:\-\s]+/, '').trim();
        const displayName = cleanName || fox.name || `Cáo ${fox.id}`;
        let tagText = `${fox.id}. ${displayName}`;
        if (tagText.length > 12) {
          tagText = tagText.slice(0, 11) + '…';
        }

        ctx.font = isLeader ? 'bold 9.5px Outfit, sans-serif' : '600 8.5px Outfit, sans-serif';
        const textMetrics = ctx.measureText(tagText);
        const tagWidth = Math.min(62, textMetrics.width + 8);
        const tagHeight = 13;
        const tagX = fox.x + (foxWidth / 2) - (tagWidth / 2);
        const tagY = fox.y - 12;

        // Pill background
        ctx.fillStyle = isLeader
          ? 'rgba(234, 88, 12, 0.95)'
          : 'rgba(15, 23, 42, 0.88)';
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 3);
        } else {
          ctx.rect(tagX, tagY, tagWidth, tagHeight);
        }
        ctx.fill();

        // Pill border
        ctx.strokeStyle = isLeader
          ? '#fbbf24'
          : 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = isLeader ? 1.2 : 0.6;
        ctx.stroke();

        // Text
        ctx.fillStyle = isLeader ? '#ffffff' : '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, tagX + tagWidth / 2, tagY + tagHeight / 2 + 0.5);

        // Leader Crown
        if (isLeader) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '10px sans-serif';
          ctx.fillText('👑', tagX + tagWidth / 2, tagY - 5);
        }

        ctx.restore();
      }

      ctx.restore(); // restore camera pan

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engine, isRacing, onTimeUpdate, onRaceFinish]);

  // Handle Canvas Resizing with DPR consistency & auto-align foxes
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    sizeRef.current = {
      width: rect.width,
      height: rect.height,
      dpr
    };

    // Auto-distribute foxes in the 1/4 screen if not racing
    if (engine && !engine.isRacing && !engine.isFinished && engine.playerList && engine.playerList.length > 0) {
      engine.initFoxes(engine.playerList, rect.height, rect.width);
    }
  }, [engine]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[90vh] min-h-[600px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing select-none"
      />

      {/* Loading overlay */}
      {!imagesLoaded && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center text-slate-300 font-orbitron text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
            <span>Đang nạp trường đua và cáo bay...</span>
          </div>
        </div>
      )}
    </div>
  );
}
