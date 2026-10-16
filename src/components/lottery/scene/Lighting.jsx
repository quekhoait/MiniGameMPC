// Lighting.jsx - Vibrant, Bright & High-Performance Stage Lighting (Lag-Free)
import React from 'react';

export default function Lighting() {
  return (
    <group>
      {/* Bright, clean theatrical ambient light */}
      <ambientLight intensity={1.25} color="#FFF8F0" />

      {/* Main Overhead Spotlight focused on Brass Cage & Stage */}
      <spotLight
        position={[0, 10, 5]}
        target-position={[0, 0.4, 0]}
        color="#FFF9ED"
        intensity={3.8}
        angle={0.7}
        penumbra={0.65}
        distance={25}
      />

      {/* Secondary Accent Spotlight on Velvet Catch Tray & Ball */}
      <spotLight
        position={[0, 7, 6]}
        target-position={[0, -1.8, 2.45]}
        color="#FFECC7"
        intensity={2.8}
        angle={0.45}
        penumbra={0.55}
        distance={18}
      />

      {/* Left Spotlight for Radio */}
      <spotLight
        position={[-6, 6, 3.5]}
        target-position={[-5.2, -1.1, 0.5]}
        color="#FFE5B8"
        intensity={2.0}
        angle={0.45}
        penumbra={0.75}
        distance={16}
      />

      {/* Right Spotlight for Clipboard */}
      <spotLight
        position={[6, 6, 3.5]}
        target-position={[5.2, -1.1, 0.5]}
        color="#FFE5B8"
        intensity={2.0}
        angle={0.45}
        penumbra={0.75}
        distance={16}
      />

      {/* Backdrop Image Illumination Light */}
      <directionalLight
        position={[0, 8, 2]}
        target-position={[0, 8, -7.4]}
        color="#FFF6EB"
        intensity={1.3}
      />

      {/* Front Warm Fill Light */}
      <directionalLight
        position={[-2, 4, 7]}
        color="#FFEED6"
        intensity={0.9}
      />

      {/* Soft Rim Light */}
      <directionalLight
        position={[0, 5, -5]}
        color="#BBD4FF"
        intensity={0.75}
      />
    </group>
  );
}
