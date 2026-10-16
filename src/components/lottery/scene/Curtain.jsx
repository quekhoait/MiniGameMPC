// Curtain.jsx - Procedural Velvet Red Curtains for Grand Draw Theater (Wide opening)
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Curtain({ phase }) {
  const leftGroup = useRef();
  const rightGroup = useRef();

  // Procedural corrugated curtain geometry
  const curtainGeo = useMemo(() => {
    const width = 12;
    const height = 18;
    const segmentsX = 48;
    const segmentsY = 16;
    const geo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    const pos = geo.attributes.position;

    // Apply sinusoidal velvet drape folds
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const foldDepth = 0.45 * Math.sin(x * 3.5) * (1 - y / 25);
      pos.setZ(i, foldDepth);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Lush velvet material
  const velvetMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#680910'),
      roughness: 0.88,
      metalness: 0.1,
      bumpScale: 0.05,
      side: THREE.DoubleSide
    });
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    // Gentle breathing wave
    if (leftGroup.current && rightGroup.current) {
      const breath = Math.sin(time * 0.8) * 0.03;
      leftGroup.current.position.z = -5 + breath;
      rightGroup.current.position.z = -5 - breath;

      // Pulled wide out to the sides to show full background artwork
      const targetLeftX = phase === 'EDITING' ? -15.0 : -16.5;
      const targetRightX = phase === 'EDITING' ? 15.0 : 16.5;

      leftGroup.current.position.x = THREE.MathUtils.damp(leftGroup.current.position.x, targetLeftX, 2, delta);
      rightGroup.current.position.x = THREE.MathUtils.damp(rightGroup.current.position.x, targetRightX, 2, delta);
    }
  });

  return (
    <group position={[0, 4, 0]}>
      {/* Left Curtain Wing (Pulled wide out) */}
      <group ref={leftGroup} position={[-16.5, 0, -5]}>
        <mesh geometry={curtainGeo} material={velvetMaterial} castShadow receiveShadow />
        {/* Golden curtain tie-back sash */}
        <mesh position={[2, -3, 0.4]} rotation={[0, 0, 0.3]}>
          <torusGeometry args={[0.9, 0.08, 12, 32]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Right Curtain Wing (Pulled wide out) */}
      <group ref={rightGroup} position={[16.5, 0, -5]} scale={[-1, 1, 1]}>
        <mesh geometry={curtainGeo} material={velvetMaterial} castShadow receiveShadow />
        {/* Golden curtain tie-back sash */}
        <mesh position={[2, -3, 0.4]} rotation={[0, 0, 0.3]}>
          <torusGeometry args={[0.9, 0.08, 12, 32]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Top Velvet Pelmet / Valance */}
      <mesh position={[0, 8.5, -4.6]}>
        <boxGeometry args={[36, 2.2, 0.4]} />
        <meshStandardMaterial color="#4A060C" roughness={0.9} />
      </mesh>
      {/* Gold Trim fringe along top valance */}
      <mesh position={[0, 7.35, -4.4]}>
        <cylinderGeometry args={[0.07, 0.07, 36, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}
