// Stage.jsx - Theatrical Grand Stage floor, custom backdrop image, footlights and atmosphere
import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function Stage() {
  // Load background artwork provided by user
  const bgTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/sticker_rutide.png');
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <group position={[0, -2.5, 0]}>
      {/* Main Circular Raised Stage Riser */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[8.5, 9.2, 0.6, 64]} />
        <meshStandardMaterial
          color="#221C18"
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Brass Edge Trim Rim around the stage riser */}
      <mesh position={[0, 0.31, 0]}>
        <torusGeometry args={[8.5, 0.08, 16, 64]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial
          color="#E5B25D"
          roughness={0.25}
          metalness={0.88}
        />
      </mesh>

      {/* Outer Lower Stage Floor */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <cylinderGeometry args={[22, 22, 0.4, 48]} />
        <meshStandardMaterial
          color="#121014"
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* ================= USER CUSTOM BACKDROP IMAGE ================= */}
      {/* Positioned right behind the cage and stage archway */}
      <mesh position={[0, 8.5, -7.4]}>
        <planeGeometry args={[36, 22]} />
        <meshBasicMaterial
          map={bgTexture}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Theater Archway Molding Trim Frame around backdrop */}
      <group position={[0, 5, -7.2]}>
        {/* Left Column */}
        <mesh position={[-9.2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.4, 15, 24]} />
          <meshStandardMaterial color="#8A661E" roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Right Column */}
        <mesh position={[9.2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.4, 15, 24]} />
          <meshStandardMaterial color="#8A661E" roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Arch Header Bar */}
        <mesh position={[0, 7.8, 0]}>
          <boxGeometry args={[19, 0.6, 0.4]} />
          <meshStandardMaterial color="#C5942B" roughness={0.4} metalness={0.7} />
        </mesh>
      </group>

      {/* Footlights along front curvature of stage */}
      {[-3, -1.8, -0.6, 0.6, 1.8, 3].map((angleStep, i) => {
        const rad = (angleStep * Math.PI) / 18;
        const radius = 8.1;
        const x = Math.sin(rad) * radius;
        const z = Math.cos(rad) * radius - 3.8;
        return (
          <group key={i} position={[x, 0.35, z]}>
            {/* Brass Housing */}
            <mesh>
              <cylinderGeometry args={[0.15, 0.2, 0.25, 16]} />
              <meshStandardMaterial color="#D8A436" metalness={0.85} roughness={0.3} />
            </mesh>
            {/* Glowing Bulb Lens */}
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial
                color="#FFF0B3"
                emissive="#FFD152"
                emissiveIntensity={3.0}
                toneMapped={false}
              />
            </mesh>
            {/* Upward spotlight */}
            <spotLight
              color="#FFE8B3"
              intensity={1.2}
              distance={9}
              angle={0.35}
              penumbra={0.7}
              position={[0, 0.2, 0]}
              target-position={[x * 0.5, 3.5, z - 2]}
            />
          </group>
        );
      })}

      {/* Decorative Gold Inlay Ring on stage floor */}
      <mesh position={[0, 0.305, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 3.88, 64]} />
        <meshStandardMaterial
          color="#E5B25D"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}
