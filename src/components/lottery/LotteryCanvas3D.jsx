// LotteryCanvas3D.jsx - Ultra-Realistic 3D Lottery Drum & 400 Tumbling Balls using Three.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const BALL_COLORS = [
  0xf59e0b, // Amber / Gold
  0xef4444, // Crimson Red
  0x3b82f6, // Royal Blue
  0x10b981, // Emerald Green
  0x8b5cf6, // Violet / Purple
  0xec4899, // Hot Pink
  0x06b6d4, // Cyan
  0xf97316  // Orange
];

export default function LotteryCanvas3D({
  engine,
  gameState,
  onOpenWinnerModal
}) {
  const mountRef = useRef(null);

  // References to keep Three.js instances alive across re-renders
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const drumGroupRef = useRef(null);
  const ballsDataRef = useRef([]);
  const instancedMeshRef = useRef(null);
  const winningBallMeshRef = useRef(null);
  const spotLightRef = useRef(null);

  // Mouse orbit interaction
  const mouseRef = useRef({
    isDown: false,
    prevX: 0,
    prevY: 0,
    targetRotY: 0,
    targetRotX: 0.15,
    rotY: 0,
    rotX: 0.15
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 1200;
    const height = container.clientHeight || 700;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x060814, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 8.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Lighting Setup (Stage Lighting Style)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffecd2, 2.0);
    keyLight.position.set(5, 8, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
    fillLight.position.set(-6, 4, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    rimLight.position.set(0, -4, -6);
    scene.add(rimLight);

    const spotLight = new THREE.SpotLight(0xfffbeb, 4.5, 20, Math.PI / 5, 0.45);
    spotLight.position.set(0, 7, 3);
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);
    spotLightRef.current = spotLight;

    // Glowing interior point light inside drum
    const innerLight = new THREE.PointLight(0xffd580, 1.5, 5);
    innerLight.position.set(0, 0, 0);
    scene.add(innerLight);

    // 3. Luxurious Stage Floor with Reflective Grid
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x05070e,
      roughness: 0.25,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.8;
    floor.receiveShadow = true;
    scene.add(floor);

    // Glowing stage ring
    const ringGeo = new THREE.RingGeometry(3.6, 3.8, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.78;
    scene.add(ring);

    // 4. LOTTERY DRUM 3D ASSEMBLY
    const drumGroup = new THREE.Group();
    scene.add(drumGroup);
    drumGroupRef.current = drumGroup;

    const DRUM_RADIUS = 2.0;

    // 4a. Transparent Acrylic Glass Sphere
    const glassGeo = new THREE.SphereGeometry(DRUM_RADIUS, 48, 48);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 0.35,
      transparent: true,
      roughness: 0.08,
      metalness: 0.1,
      ior: 1.45,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide
    });
    const glassSphere = new THREE.Mesh(glassGeo, glassMat);
    drumGroup.add(glassSphere);

    // 4b. Golden Metallic Ribs & Rings
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 1.5
    });

    // Horizontal equator ring
    const equatorGeo = new THREE.TorusGeometry(DRUM_RADIUS + 0.03, 0.045, 16, 64);
    const equator = new THREE.Mesh(equatorGeo, goldMat);
    equator.rotation.x = Math.PI / 2;
    drumGroup.add(equator);

    // Vertical meridian rings
    for (let i = 0; i < 4; i++) {
      const meridian = new THREE.Mesh(equatorGeo, goldMat);
      meridian.rotation.y = (i * Math.PI) / 4;
      drumGroup.add(meridian);
    }

    // Interior tumbling paddle fins (agitator fins inside cage)
    for (let f = 0; f < 3; f++) {
      const finGeo = new THREE.BoxGeometry(0.06, 0.7, 1.8);
      const finMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.3,
        transparent: true,
        opacity: 0.7
      });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.rotation.x = (f * Math.PI * 2) / 3;
      drumGroup.add(fin);
    }

    // 4c. Chrome Horizontal Axle & Heavy Cast-Metal Pedestal Stand
    const axleGeo = new THREE.CylinderGeometry(0.08, 0.08, 5.2, 32);
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.95,
      roughness: 0.15
    });
    const axle = new THREE.Mesh(axleGeo, chromeMat);
    axle.rotation.z = Math.PI / 2;
    scene.add(axle);

    // Left and Right A-Frame Supports
    [-2.35, 2.35].forEach(xPos => {
      const standLegGeo = new THREE.CylinderGeometry(0.09, 0.14, 3.2, 16);
      const leftLeg = new THREE.Mesh(standLegGeo, goldMat);
      leftLeg.position.set(xPos, -1.3, 0);
      leftLeg.castShadow = true;
      scene.add(leftLeg);

      // Hub bearing cap
      const hubGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.2, 32);
      const hub = new THREE.Mesh(hubGeo, goldMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(xPos, 0, 0);
      scene.add(hub);

      // Base foot
      const footGeo = new THREE.BoxGeometry(0.6, 0.15, 1.4);
      const foot = new THREE.Mesh(footGeo, goldMat);
      foot.position.set(xPos, -2.7, 0);
      foot.castShadow = true;
      scene.add(foot);
    });

    // 4d. Transparent Extraction Chute & Front Collection Tray
    const chuteGeo = new THREE.CylinderGeometry(0.32, 0.35, 1.8, 32, 1, true);
    const chuteMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.88,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.position.set(0, -1.1, 2.1);
    chute.rotation.x = Math.PI / 4.2;
    scene.add(chute);

    // Acrylic collection tray at the bottom of chute
    const trayGeo = new THREE.CylinderGeometry(0.65, 0.55, 0.22, 32);
    const tray = new THREE.Mesh(trayGeo, goldMat);
    tray.position.set(0, -1.95, 2.85);
    scene.add(tray);

    // 5. Instanced 400 LOTTERY BALLS
    const MAX_BALLS = 400;
    const BALL_RADIUS = 0.14;
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 20, 20);
    const ballMat = new THREE.MeshStandardMaterial({
      roughness: 0.25,
      metalness: 0.35
    });

    const instancedMesh = new THREE.InstancedMesh(ballGeo, ballMat, MAX_BALLS);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;

    // Helper dummy object for matrix calculations
    const dummy = new THREE.Object3D();

    // Initialize physical ball states inside the drum sphere
    const balls = [];
    const activeStudents = engine.students.slice(0, MAX_BALLS);
    const count = Math.max(activeStudents.length, 1);

    for (let i = 0; i < MAX_BALLS; i++) {
      const student = activeStudents[i] || null;
      const isVisible = i < count && (!student || !student.isWinner);

      // Random spherical distribution inside R = 1.6
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const theta = Math.acos(costheta);
      const r = Math.cbrt(Math.random()) * (DRUM_RADIUS - 0.45);

      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);

      const colorHex = BALL_COLORS[i % BALL_COLORS.length];
      const color = new THREE.Color(colorHex);
      instancedMesh.setColorAt(i, color);

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(isVisible ? 1 : 0);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      balls.push({
        id: i + 1,
        student,
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8
        ),
        rot: new THREE.Euler(Math.random(), Math.random(), Math.random()),
        rotSpeed: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5),
        colorHex,
        active: isVisible
      });
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
    ballsDataRef.current = balls;

    // 6. Winning Ball Mesh for dramatic suction & floating zoom
    const winBallGeo = new THREE.SphereGeometry(BALL_RADIUS * 1.8, 32, 32);
    const winBallMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.15,
      metalness: 0.5,
      emissive: 0xd97706,
      emissiveIntensity: 0.3
    });
    const winBallMesh = new THREE.Mesh(winBallGeo, winBallMat);
    winBallMesh.visible = false;
    scene.add(winBallMesh);
    winningBallMeshRef.current = winBallMesh;

    // 7. Mouse Orbit Controls Event Handlers
    const handleMouseDown = (e) => {
      mouseRef.current.isDown = true;
      mouseRef.current.prevX = e.clientX;
      mouseRef.current.prevY = e.clientY;
    };

    const handleMouseMove = (e) => {
      if (!mouseRef.current.isDown) return;
      const dx = e.clientX - mouseRef.current.prevX;
      const dy = e.clientY - mouseRef.current.prevY;
      mouseRef.current.prevX = e.clientX;
      mouseRef.current.prevY = e.clientY;

      mouseRef.current.targetRotY += dx * 0.006;
      mouseRef.current.targetRotX = Math.max(-0.2, Math.min(0.6, mouseRef.current.targetRotX + dy * 0.006));
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Touch support for tablets/mobile
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        mouseRef.current.isDown = true;
        mouseRef.current.prevX = e.touches[0].clientX;
        mouseRef.current.prevY = e.touches[0].clientY;
      }
    };
    const handleTouchMove = (e) => {
      if (!mouseRef.current.isDown || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - mouseRef.current.prevX;
      const dy = e.touches[0].clientY - mouseRef.current.prevY;
      mouseRef.current.prevX = e.touches[0].clientX;
      mouseRef.current.prevY = e.touches[0].clientY;

      mouseRef.current.targetRotY += dx * 0.007;
      mouseRef.current.targetRotX = Math.max(-0.2, Math.min(0.6, mouseRef.current.targetRotX + dy * 0.007));
    };
    const handleTouchEnd = () => {
      mouseRef.current.isDown = false;
    };

    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // 8. Main 60 FPS Render Loop
    let animId;
    let clock = new THREE.Clock();
    let extractionProgress = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.033);
      const phase = engine.phase;
      const speed = engine.drumSpeed;

      // 8a. Camera Orbit Smooth Dampening
      const m = mouseRef.current;
      m.rotY += (m.targetRotY - m.rotY) * 0.08;
      m.rotX += (m.targetRotX - m.rotX) * 0.08;

      let camTargetZ = 8.5;
      let camTargetY = 0.8;
      let camTargetX = 0;

      // Dynamic cinematic camera moves depending on phase
      if (phase === 'SPINNING_FAST') {
        // Dramatic slight shake
        camTargetX += (Math.random() - 0.5) * 0.03;
        camTargetY += (Math.random() - 0.5) * 0.03;
      } else if (phase === 'EXTRACTING' || phase === 'ANNOUNCING') {
        camTargetZ = 6.8;
        camTargetY = 0.2;
      }

      const camDist = camTargetZ;
      camera.position.x = Math.sin(m.rotY) * Math.cos(m.rotX) * camDist + camTargetX;
      camera.position.y = Math.sin(m.rotX) * camDist + camTargetY;
      camera.position.z = Math.cos(m.rotY) * Math.cos(m.rotX) * camDist;
      camera.lookAt(0, 0, 0);

      // 8b. Drum Rotation
      if (drumGroupRef.current) {
        drumGroupRef.current.rotation.x += speed * dt * 9.5;
        drumGroupRef.current.rotation.y += speed * dt * 3.2;
      }

      // 8c. Physics for 400 Lottery Balls inside Drum
      const maxDist = DRUM_RADIUS - BALL_RADIUS - 0.05;
      const gravity = -3.8;
      const agitation = speed > 0.1 ? speed * 8.5 : 0;

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        if (!b.active) continue;

        // Apply Gravity + Tumbling agitation force
        b.vel.y += gravity * dt;

        if (speed > 0.05) {
          // Tangential centrifugal swirl
          b.vel.x += (-b.pos.y * 5.2 * speed + (Math.random() - 0.5) * agitation) * dt;
          b.vel.y += (b.pos.x * 5.2 * speed + (Math.random() - 0.5) * agitation + 2.0 * speed) * dt;
          b.vel.z += (Math.random() - 0.5) * agitation * dt;
        }

        // Apply damping
        b.vel.multiplyScalar(0.985);

        // Advance position
        b.pos.addScaledVector(b.vel, dt);

        // Spherical boundary collision constraint with restitution
        const dist = b.pos.length();
        if (dist > maxDist) {
          b.pos.normalize().multiplyScalar(maxDist);
          // Reflect velocity vector
          const normal = b.pos.clone().normalize();
          const dot = b.vel.dot(normal);
          b.vel.sub(normal.multiplyScalar(1.8 * dot));
          b.vel.multiplyScalar(0.78); // restitution bounce dampening
        }

        // Update InstancedMesh transform
        dummy.position.copy(b.pos);
        b.rot.x += b.rotSpeed.x * dt * (1 + speed * 10);
        b.rot.y += b.rotSpeed.y * dt * (1 + speed * 10);
        dummy.rotation.copy(b.rot);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;

      // 8d. Dramatic Winning Ball Extraction Animation
      if (winningBallMeshRef.current) {
        if (phase === 'EXTRACTING') {
          winningBallMeshRef.current.visible = true;
          extractionProgress = Math.min(1, extractionProgress + dt * 0.85);

          // Animate along chute: from drum center (0, 0, 0) -> down chute (0, -1.1, 2.1) -> into tray (0, -1.8, 2.85)
          const startP = new THREE.Vector3(0, 0, 0);
          const midP = new THREE.Vector3(0, -1.1, 2.1);
          const endP = new THREE.Vector3(0, -1.8, 2.85);

          let currentP;
          if (extractionProgress < 0.5) {
            currentP = startP.clone().lerp(midP, extractionProgress * 2);
          } else {
            currentP = midP.clone().lerp(endP, (extractionProgress - 0.5) * 2);
          }

          winningBallMeshRef.current.position.copy(currentP);
          winningBallMeshRef.current.rotation.x += 12 * dt;
          winningBallMeshRef.current.scale.setScalar(1);
        } else if (phase === 'ANNOUNCING') {
          winningBallMeshRef.current.visible = true;
          // Float up to center of camera stage
          const targetWinnerPos = new THREE.Vector3(0, 0.4, 4.5);
          winningBallMeshRef.current.position.lerp(targetWinnerPos, 0.08);
          winningBallMeshRef.current.rotation.y += 2.0 * dt;
          winningBallMeshRef.current.rotation.x += 1.0 * dt;
          winningBallMeshRef.current.scale.lerp(new THREE.Vector3(1.6, 1.6, 1.6), 0.08);
        } else {
          winningBallMeshRef.current.visible = false;
          extractionProgress = 0;
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // 9. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update ball instances when student list or won states change
  useEffect(() => {
    if (!instancedMeshRef.current || !ballsDataRef.current) return;
    const mesh = instancedMeshRef.current;
    const balls = ballsDataRef.current;
    const dummy = new THREE.Object3D();

    const activeStudents = engine.students;
    const count = activeStudents.length;

    for (let i = 0; i < balls.length; i++) {
      const student = activeStudents[i] || null;
      const isVisible = i < count && (!student || !student.isWinner);
      balls[i].active = isVisible;
      balls[i].student = student;

      dummy.position.copy(balls[i].pos);
      dummy.scale.setScalar(isVisible ? 1 : 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [engine.students, engine.remainingStudents, gameState.remainingCount]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-[68vh] min-h-[500px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-[0_0_80px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing select-none"
    >
      {/* 3D Stage Ambient Glow / Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(2,6,23,0.85)_100%)]" />

      {/* Floating 3D Hint */}
      <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] text-slate-500 font-medium flex items-center gap-2 bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800 backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>Kéo chuột để xoay 360° quan sát lồng cầu</span>
      </div>

      {/* Live Ball Counter in Top Left */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1.5">
        <div className="flex items-center gap-2 bg-slate-950/85 border border-amber-500/50 px-3.5 py-1.5 rounded-2xl backdrop-blur-md shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-slate-300">BÓNG TRONG LỒNG:</span>
          <span className="font-orbitron font-black text-amber-400 text-sm">
            {gameState.remainingCount} <span className="text-xs text-slate-400">/ {gameState.totalStudents}</span>
          </span>
        </div>

        {gameState.wonCount > 0 && (
          <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-800 px-3 py-1 rounded-xl backdrop-blur-md text-[11px] text-slate-400">
            <span>Đã trúng thưởng:</span>
            <span className="font-orbitron font-bold text-emerald-400">{gameState.wonCount}</span>
          </div>
        )}
      </div>

      {/* Current Spinning Status Banner */}
      {gameState.phase !== 'IDLE' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-amber-500/20 border border-amber-400/80 backdrop-blur-md shadow-2xl flex items-center gap-2.5 animate-pulse">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
            <span className="font-orbitron font-black text-xs sm:text-sm tracking-widest text-amber-300 uppercase">
              {gameState.phase === 'SPINNING_UP' && 'ĐANG KHỞI ĐỘNG ĐỘNG CƠ...'}
              {gameState.phase === 'SPINNING_FAST' && 'LỒNG CẦU ĐANG QUAY TÍT...'}
              {gameState.phase === 'SLOWING_DOWN' && 'ĐANG GIẢM TỐC CHỌN BÓNG...'}
              {gameState.phase === 'EXTRACTING' && 'BÓNG ĐANG RA KHAY NHẬN...'}
              {gameState.phase === 'ANNOUNCING' && 'CÔNG BỐ KẾT QUẢ TRÚNG THƯỞNG!'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

