// FoxMascot.jsx - Flying Fox Mascot 2D sprite placed on the right side of the stage
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGrandDrawStore, PHASES } from '../store/useGrandDrawStore.js';

export default function FoxMascot() {
  const meshRef = useRef();
  const phase = useGrandDrawStore(state => state.phase);
  const triggerSpin = useGrandDrawStore(state => state.triggerSpin);
  const hoveredProp = useGrandDrawStore(state => state.hoveredProp);
  const setHoveredProp = useGrandDrawStore(state => state.setHoveredProp);

  // Load transparent PNG texture
  const foxTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/fox_mascot.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const isInteractive = phase === PHASES.IDLE_READY;
  const isHovered = hoveredProp === 'FOX';

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    if (phase === PHASES.SPINNING || phase === PHASES.DECELERATING) {
      // Excited cheer bob during spin
      meshRef.current.position.y = -0.45 + Math.sin(time * 9) * 0.14;
      meshRef.current.position.x = 4.25 + Math.cos(time * 4) * 0.05;
      meshRef.current.rotation.z = Math.sin(time * 6) * 0.12;
    } else if (phase === PHASES.BALL_PRESENTED || phase === PHASES.TICKET_SHOWN) {
      // Victory celebration
      meshRef.current.position.y = -0.35 + Math.sin(time * 5) * 0.1;
      meshRef.current.position.x = 4.25;
      meshRef.current.rotation.z = Math.sin(time * 4) * 0.08;
    } else {
      // Gentle floating breathing hover in idle
      meshRef.current.position.y = -0.55 + Math.sin(time * 2.5) * 0.06;
      meshRef.current.position.x = 4.25;
      meshRef.current.rotation.z = Math.sin(time * 1.8) * 0.04;
    }
  });

  return (
    <group
      ref={meshRef}
      position={[4.25, -0.55, 0.8]}
      onClick={(e) => {
        e.stopPropagation();
        if (isInteractive) triggerSpin();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (isInteractive) {
          document.body.style.cursor = 'pointer';
          setHoveredProp('FOX');
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
        if (hoveredProp === 'FOX') setHoveredProp(null);
      }}
    >
      {/* 2D Cutout Plane with transparent texture */}
      <mesh castShadow receiveShadow>
        <planeGeometry args={[2.2, 2.2]} />
        <meshBasicMaterial
          map={foxTexture}
          transparent={true}
          alphaTest={0.05}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Floating 3D Tooltip on hover */}
      {isInteractive && isHovered && (
        <Html position={[0, 1.25, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="bg-black/85 text-amber-200 border border-[#F2D28A]/80 px-3.5 py-1.5 rounded-xl text-xs font-['Cinzel',serif] tracking-wider shadow-[0_0_20px_rgba(242,210,138,0.4)] whitespace-nowrap backdrop-blur-md animate-bounce">
            🦊 Cáo May Mắn • Chạm để quay!
          </div>
        </Html>
      )}
    </group>
  );
}

