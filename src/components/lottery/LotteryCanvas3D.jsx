// LotteryCanvas3D.jsx - React Three Fiber Canvas with full Grand Draw Cinematic 3D Scene (Optimized & Lag-Free)
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Stage from './scene/Stage.jsx';
import Curtain from './scene/Curtain.jsx';
import Cage from './scene/Cage.jsx';
import Balls from './scene/Balls.jsx';
import EjectedBall from './scene/EjectedBall.jsx';
import InteractiveProps from './scene/InteractiveProps.jsx';
import Lighting from './scene/Lighting.jsx';
import CameraDirector from './scene/CameraDirector.jsx';
import { useGrandDrawStore } from './store/useGrandDrawStore.js';

export default function LotteryCanvas3D() {
  const phase = useGrandDrawStore(state => state.phase);

  return (
    <div className="w-full h-full relative bg-[#0B090F] overflow-hidden select-none">
      <Canvas
        shadows={false}
        dpr={[1, 1.25]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,
          powerPreference: 'high-performance'
        }}
        camera={{ position: [0, 2.0, 12.5], fov: 46 }}
      >
        <color attach="background" args={['#0B090F']} />
        <fog attach="fog" args={['#0B090F', 24, 45]} />

        <Suspense fallback={null}>
          <CameraDirector />
          <Lighting />
          <Stage />
          <Curtain phase={phase} />
          <Cage />
          <Balls />
          <EjectedBall />
          <InteractiveProps />
        </Suspense>
      </Canvas>
    </div>
  );
}
