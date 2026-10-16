// InteractiveProps.jsx - 3D Interactive Props on Stage: Vintage Radio, Clipboard Ledger, and Ticket Chest
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGrandDrawStore } from '../store/useGrandDrawStore.js';

export default function InteractiveProps() {
  const radioRef = useRef();
  const clipboardRef = useRef();
  const chestRef = useRef();

  const hoveredProp = useGrandDrawStore(state => state.hoveredProp);
  const setHoveredProp = useGrandDrawStore(state => state.setHoveredProp);
  const setActiveModal = useGrandDrawStore(state => state.setActiveModal);
  const drawHistory = useGrandDrawStore(state => state.drawHistory);

  // Materials
  const woodCabinetMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#382216',
    roughness: 0.5,
    metalness: 0.1
  }), []);

  const brassMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#D4AF37',
    metalness: 0.9,
    roughness: 0.25
  }), []);

  const darkBrassMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8A6D24',
    metalness: 0.85,
    roughness: 0.35
  }), []);

  const paperMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#F4ECD8',
    roughness: 0.7,
    metalness: 0.05
  }), []);

  const clothVelvetMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#5C080E',
    roughness: 0.9,
    metalness: 0.1
  }), []);

  // Frame animations (gentle floating / pulse on hover)
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Radio hover bob
    if (radioRef.current) {
      const isHov = hoveredProp === 'RADIO';
      const targetY = isHov ? -1.05 + Math.sin(time * 4) * 0.04 : -1.1;
      radioRef.current.position.y = THREE.MathUtils.damp(radioRef.current.position.y, targetY, 6, delta);
    }

    // Clipboard hover bob
    if (clipboardRef.current) {
      const isHov = hoveredProp === 'CLIPBOARD';
      const targetY = isHov ? -1.05 + Math.sin(time * 4) * 0.04 : -1.1;
      clipboardRef.current.position.y = THREE.MathUtils.damp(clipboardRef.current.position.y, targetY, 6, delta);
    }

    // Chest hover bob
    if (chestRef.current) {
      const isHov = hoveredProp === 'CHEST';
      const targetY = isHov ? -2.05 + Math.sin(time * 4) * 0.04 : -2.1;
      chestRef.current.position.y = THREE.MathUtils.damp(chestRef.current.position.y, targetY, 6, delta);
    }
  });

  return (
    <group>
      {/* ================= 1. VINTAGE RADIO (SETTINGS) - LEFT TABLE ================= */}
      <group
        ref={radioRef}
        position={[-5.2, -1.1, 0.5]}
        onClick={(e) => {
          e.stopPropagation();
          setActiveModal('SETTINGS');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          setHoveredProp('RADIO');
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          if (hoveredProp === 'RADIO') setHoveredProp(null);
        }}
      >
        {/* Small Side Table Pedestal */}
        <mesh position={[0, -0.75, 0]} receiveShadow>
          <cylinderGeometry args={[0.9, 1.1, 1.5, 24]} />
          <meshStandardMaterial color="#1E1916" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.06, 24]} />
          <primitive object={darkBrassMaterial} />
        </mesh>

        {/* Radio Cabinet Body */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1.3, 0.85, 0.7]} />
          <primitive object={woodCabinetMaterial} />
        </mesh>

        {/* Vintage Speaker Grille Mesh */}
        <mesh position={[0.22, 0.52, 0.36]}>
          <planeGeometry args={[0.65, 0.6]} />
          <meshStandardMaterial color="#BCA177" roughness={0.9} />
        </mesh>

        {/* Radio Dial Window */}
        <mesh position={[-0.32, 0.62, 0.36]}>
          <planeGeometry args={[0.42, 0.28]} />
          <meshStandardMaterial
            color="#FFF4D0"
            emissive="#FFB84D"
            emissiveIntensity={hoveredProp === 'RADIO' ? 1.2 : 0.6}
            roughness={0.2}
          />
        </mesh>

        {/* Brass Knobs */}
        <mesh position={[-0.42, 0.32, 0.37]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
          <primitive object={brassMaterial} />
        </mesh>
        <mesh position={[-0.22, 0.32, 0.37]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
          <primitive object={brassMaterial} />
        </mesh>

        {/* Brass Antenna */}
        <mesh position={[-0.5, 1.1, -0.2]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.015, 0.025, 0.9, 12]} />
          <primitive object={brassMaterial} />
        </mesh>

        {/* Floating 3D Label */}
        {hoveredProp === 'RADIO' && (
          <Html position={[0, 1.35, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-amber-950/90 text-amber-200 border border-amber-500/60 px-3 py-1 rounded-md text-xs font-serif tracking-wider shadow-xl whitespace-nowrap backdrop-blur-sm animate-pulse">
              📻 Cài Đặt Âm Thanh & Đồ Hoạ
            </div>
          </Html>
        )}
      </group>

      {/* ================= 2. BRASS CLIPBOARD & LEDGER (EDIT LIST) - RIGHT PEDESTAL ================= */}
      <group
        ref={clipboardRef}
        position={[5.2, -1.1, 0.5]}
        onClick={(e) => {
          e.stopPropagation();
          setActiveModal('ENTRY');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          setHoveredProp('CLIPBOARD');
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          if (hoveredProp === 'CLIPBOARD') setHoveredProp(null);
        }}
      >
        {/* Right Side Pedestal */}
        <mesh position={[0, -0.75, 0]} receiveShadow>
          <cylinderGeometry args={[0.9, 1.1, 1.5, 24]} />
          <meshStandardMaterial color="#1E1916" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.06, 24]} />
          <primitive object={darkBrassMaterial} />
        </mesh>

        {/* Clipboard Wooden Board */}
        <mesh position={[0, 0.45, 0]} rotation={[-0.45, 0, 0]} castShadow>
          <boxGeometry args={[0.85, 1.25, 0.06]} />
          <primitive object={woodCabinetMaterial} />
        </mesh>

        {/* Parchment Paper Sheet */}
        <mesh position={[0, 0.46, 0.035]} rotation={[-0.45, 0, 0]}>
          <planeGeometry args={[0.74, 1.1]} />
          <primitive object={paperMaterial} />
        </mesh>

        {/* Top Heavy Brass Clip */}
        <mesh position={[0, 0.98, -0.22]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.35, 0.12, 0.08]} />
          <primitive object={brassMaterial} />
        </mesh>

        {/* Vintage Fountain Pen resting beside */}
        <mesh position={[0.48, 0.35, 0]} rotation={[0.2, 0, 0.4]}>
          <cylinderGeometry args={[0.025, 0.03, 0.65, 12]} />
          <primitive object={brassMaterial} />
        </mesh>

        {/* Floating 3D Label */}
        {hoveredProp === 'CLIPBOARD' && (
          <Html position={[0, 1.4, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-amber-950/90 text-amber-200 border border-amber-500/60 px-3 py-1 rounded-md text-xs font-serif tracking-wider shadow-xl whitespace-nowrap backdrop-blur-sm animate-pulse">
              📋 Soạn Danh Sách Người Tham Gia
            </div>
          </Html>
        )}
      </group>

      {/* ================= 3. TICKET CHEST (DRAW HISTORY) - BESIDE TRAY ================= */}
      <group
        ref={chestRef}
        position={[2.4, -2.1, 2.6]}
        onClick={(e) => {
          e.stopPropagation();
          setActiveModal('HISTORY');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          setHoveredProp('CHEST');
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          if (hoveredProp === 'CHEST') setHoveredProp(null);
        }}
      >
        {/* Velvet Chest Body */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[1.05, 0.55, 0.7]} />
          <primitive object={clothVelvetMaterial} />
        </mesh>

        {/* Arched Lid */}
        <mesh position={[0, 0.58, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 1.05, 24, 1, false, 0, Math.PI]} />
          <primitive object={clothVelvetMaterial} />
        </mesh>

        {/* Brass Binding Corner Straps */}
        {[-0.48, 0.48].map((x, i) => (
          <mesh key={i} position={[x, 0.3, 0]}>
            <boxGeometry args={[0.06, 0.57, 0.72]} />
            <primitive object={brassMaterial} />
          </mesh>
        ))}

        {/* Front Brass Keyhole Latch Plate */}
        <mesh position={[0, 0.38, 0.36]}>
          <boxGeometry args={[0.16, 0.22, 0.04]} />
          <primitive object={brassMaterial} />
        </mesh>

        {/* History Count Badge on Chest */}
        {drawHistory.length > 0 && (
          <mesh position={[0, 0.38, 0.39]}>
            <circleGeometry args={[0.09, 16]} />
            <meshBasicMaterial color="#FFDF6D" />
          </mesh>
        )}

        {/* Floating 3D Label */}
        {hoveredProp === 'CHEST' && (
          <Html position={[0, 1.15, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="bg-amber-950/90 text-amber-200 border border-amber-500/60 px-3 py-1 rounded-md text-xs font-serif tracking-wider shadow-xl whitespace-nowrap backdrop-blur-sm animate-pulse">
              🧰 Rương Vé Đã Rút ({drawHistory.length})
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

