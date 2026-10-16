// Cage.jsx - Theatrical Procedural Brass Lottery Drum, A-Frame Stand, Turnable Crank, Lid, Chute & Tray
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGrandDrawStore, PHASES } from '../store/useGrandDrawStore.js';
import { grandAudio } from '../audio/grandDrawAudio.js';

export default function Cage() {
  const drumGroup = useRef();
  const crankGroup = useRef();
  const lidGroup = useRef();

  const phase = useGrandDrawStore(state => state.phase);
  const hoveredProp = useGrandDrawStore(state => state.hoveredProp);
  const setHoveredProp = useGrandDrawStore(state => state.setHoveredProp);
  const triggerSpin = useGrandDrawStore(state => state.triggerSpin);

  // Materials - rich warm satin antique brass
  const brassMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#C5942B'),
      metalness: 0.72,
      roughness: 0.32,
    });
  }, []);

  const darkBrassMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#8A661E'),
      metalness: 0.7,
      roughness: 0.42,
    });
  }, []);

  const blackWoodMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1A1715'),
      roughness: 0.3,
      metalness: 0.05
    });
  }, []);

  const velvetTrayMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#6E0A12'),
      roughness: 0.85,
      metalness: 0.08
    });
  }, []);

  // Crank hover glow material
  const crankGlowMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFDF6D'),
      emissive: new THREE.Color('#E5A93C'),
      emissiveIntensity: 0.7,
      metalness: 0.85,
      roughness: 0.2
    });
  }, []);

  // Open brass slide material
  const slideMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D8A436'),
      metalness: 0.75,
      roughness: 0.25,
      side: THREE.DoubleSide
    });
  }, []);

  // Cage Ribs & Hoops geometry
  const cageHoops = useMemo(() => {
    const list = [];
    // 8 Longitude Rings (meridians)
    const countLong = 8;
    for (let i = 0; i < countLong; i++) {
      const angle = (i * Math.PI) / countLong;
      list.push({
        type: 'longitude',
        rot: [0, angle, 0],
        radius: 2.25,
        tube: 0.04
      });
    }
    // 5 Latitude Rings
    const latAngles = [-0.85, -0.42, 0, 0.42, 0.85];
    latAngles.forEach((lat, idx) => {
      const r = 2.25 * Math.cos(lat);
      const y = 2.25 * Math.sin(lat);
      list.push({
        type: 'latitude',
        y,
        radius: r,
        tube: 0.035,
        key: `lat-${idx}`
      });
    });
    return list;
  }, []);

  // Continuous rotation physics
  const spinSpeedRef = useRef(0);
  const currentAngleRef = useRef(0);

  useFrame((state, delta) => {
    let targetSpeed = 0;
    if (phase === PHASES.SPINNING) {
      targetSpeed = 7.5; // High spin velocity
    } else if (phase === PHASES.DECELERATING) {
      targetSpeed = 0.6; // Slowing down
    } else {
      targetSpeed = 0;
    }

    // Smooth speed acceleration / deceleration
    spinSpeedRef.current = THREE.MathUtils.damp(spinSpeedRef.current, targetSpeed, 1.8, delta);
    currentAngleRef.current += spinSpeedRef.current * delta;

    // Update drum rotation around X axis
    if (drumGroup.current) {
      drumGroup.current.rotation.x = currentAngleRef.current;
    }

    // Crank rotates synchronously with drum
    if (crankGroup.current) {
      crankGroup.current.rotation.x = currentAngleRef.current;
    }

    // Audio tumble intensity tracks speed
    if (phase === PHASES.SPINNING || phase === PHASES.DECELERATING) {
      grandAudio.updateTumbleIntensity(spinSpeedRef.current / 7.5);
    }

    // Lid animation: Opens in PACKING, slams shut in LOADING_CAGE
    if (lidGroup.current) {
      let targetLidAngle = 0;
      if (phase === PHASES.PACKING) {
        targetLidAngle = -Math.PI * 0.45; // open
      } else {
        targetLidAngle = 0; // closed
      }
      lidGroup.current.rotation.z = THREE.MathUtils.damp(lidGroup.current.rotation.z, targetLidAngle, 6, delta);
    }
  });

  const isCrankHovered = hoveredProp === 'CRANK';
  const isCrankActive = phase === PHASES.IDLE_READY;

  return (
    <group position={[0, 0.5, 0]}>
      {/* ================= A-FRAME PEDESTAL STANDS ================= */}
      {/* Left A-Frame Stand */}
      <group position={[-2.7, 0, 0]}>
        {/* Footing Plate */}
        <mesh position={[0, -2.65, 0]} castShadow>
          <boxGeometry args={[0.5, 0.16, 2.4]} />
          <primitive object={darkBrassMaterial} />
        </mesh>
        {/* Front Leg */}
        <mesh position={[0, -1.35, 0.65]} rotation={[0.42, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.11, 2.85, 16]} />
          <primitive object={brassMaterial} />
        </mesh>
        {/* Rear Leg */}
        <mesh position={[0, -1.35, -0.65]} rotation={[-0.42, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.11, 2.85, 16]} />
          <primitive object={brassMaterial} />
        </mesh>
        {/* Horizontal Cross Strut */}
        <mesh position={[0, -1.75, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 1.15, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <primitive object={brassMaterial} />
        </mesh>
        {/* Axle Bushing Pillow Block */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.32, 24]} rotation={[0, 0, Math.PI / 2]} />
          <primitive object={darkBrassMaterial} />
        </mesh>
      </group>

      {/* Right A-Frame Stand */}
      <group position={[2.7, 0, 0]}>
        {/* Footing Plate */}
        <mesh position={[0, -2.65, 0]} castShadow>
          <boxGeometry args={[0.5, 0.16, 2.4]} />
          <primitive object={darkBrassMaterial} />
        </mesh>
        {/* Front Leg */}
        <mesh position={[0, -1.35, 0.65]} rotation={[0.42, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.11, 2.85, 16]} />
          <primitive object={brassMaterial} />
        </mesh>
        {/* Rear Leg */}
        <mesh position={[0, -1.35, -0.65]} rotation={[-0.42, 0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.11, 2.85, 16]} />
          <primitive object={brassMaterial} />
        </mesh>
        {/* Horizontal Cross Strut */}
        <mesh position={[0, -1.75, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 1.15, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <primitive object={brassMaterial} />
        </mesh>
        {/* Axle Bushing Pillow Block */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.32, 24]} rotation={[0, 0, Math.PI / 2]} />
          <primitive object={darkBrassMaterial} />
        </mesh>
      </group>

      {/* Main Center Horizontal Brass Axle */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 6.0, 24]} />
        <primitive object={brassMaterial} />
      </mesh>

      {/* ================= ROTATING CAGE DRUM ================= */}
      <group ref={drumGroup}>
        {/* Longitude Torus Hoops */}
        {cageHoops.filter(h => h.type === 'longitude').map((h, i) => (
          <mesh key={`long-${i}`} rotation={h.rot} castShadow>
            <torusGeometry args={[h.radius, h.tube, 14, 56]} />
            <primitive object={brassMaterial} />
          </mesh>
        ))}

        {/* Latitude Torus Hoops */}
        {cageHoops.filter(h => h.type === 'latitude').map(h => (
          <mesh key={h.key} position={[0, h.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[h.radius, h.tube, 14, 56]} />
            <primitive object={brassMaterial} />
          </mesh>
        ))}

        {/* Diagonal wire lattice reinforcement */}
        {[-0.55, 0.55].map((shift, idx) => (
          <mesh key={`diag-${idx}`} rotation={[0, 0, shift]}>
            <torusGeometry args={[2.23, 0.025, 10, 44]} />
            <primitive object={darkBrassMaterial} />
          </mesh>
        ))}

        {/* Top Loading Hatch Collar */}
        <mesh position={[0, 2.22, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.1, 32]} />
          <primitive object={brassMaterial} />
        </mesh>

        {/* Hinged Brass Lid */}
        <group ref={lidGroup} position={[0.52, 2.27, 0]}>
          <mesh position={[-0.52, 0, 0]}>
            <cylinderGeometry args={[0.51, 0.51, 0.05, 32]} />
            <primitive object={brassMaterial} />
          </mesh>
          {/* Latch knob */}
          <mesh position={[-0.98, 0.05, 0]}>
            <sphereGeometry args={[0.065, 16, 16]} />
            <primitive object={brassMaterial} />
          </mesh>
        </group>

        {/* Internal agitator paddles (gently sweep balls during spin) */}
        {[-1.1, 0, 1.1].map((xPos, idx) => (
          <group key={`blade-${idx}`} position={[xPos, 0, 0]}>
            <mesh position={[0, 1.05, 0]} rotation={[0.35, 0, 0]}>
              <boxGeometry args={[0.04, 1.5, 0.22]} />
              <primitive object={brassMaterial} />
            </mesh>
            <mesh position={[0, -1.05, 0]} rotation={[-0.35, 0, 0]}>
              <boxGeometry args={[0.04, 1.5, 0.22]} />
              <primitive object={brassMaterial} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ================= TURNABLE BRASS CRANK ================= */}
      {/* Mounted on the right side of the axle */}
      <group
        position={[2.95, 0, 0]}
        ref={crankGroup}
        onClick={(e) => {
          e.stopPropagation();
          if (isCrankActive) triggerSpin();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = isCrankActive ? 'pointer' : 'default';
          if (isCrankActive) setHoveredProp('CRANK');
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          if (hoveredProp === 'CRANK') setHoveredProp(null);
        }}
      >
        {/* Hub boss */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 24]} />
          <primitive object={isCrankHovered ? crankGlowMaterial : brassMaterial} />
        </mesh>

        {/* Heavy brass crank arm */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.1, 1.3, 0.16]} />
          <primitive object={isCrankHovered ? crankGlowMaterial : brassMaterial} />
        </mesh>

        {/* Turning peg shaft */}
        <mesh position={[0.22, 1.25, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.4, 16]} />
          <primitive object={brassMaterial} />
        </mesh>

        {/* Ergonomic Black Ebony / Wood turning handle knob */}
        <mesh position={[0.46, 1.25, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.12, 0.15, 0.48, 24]} />
          <primitive object={blackWoodMaterial} />
        </mesh>

        {/* Pulsating golden indicator ring around handle */}
        {isCrankActive && (
          <mesh position={[0.46, 1.25, 0]} rotation={[0, Math.PI / 2, 0]}>
            <ringGeometry args={[0.22, 0.28, 32]} />
            <meshBasicMaterial color="#FFDF6D" side={THREE.DoubleSide} transparent opacity={0.65} />
          </mesh>
        )}
      </group>

      {/* ================= OPEN BRASS SLIDE & VELVET TRAY ================= */}
      {/* Placed low down so it never clips or obscures the cage center */}
      <group position={[0, -1.9, 1.6]}>
        {/* Sleek open half-pipe brass slide trough */}
        <mesh position={[0, 0.22, -0.2]} rotation={[-0.48, 0, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.26, 1.6, 24, 1, true, 0, Math.PI]} />
          <primitive object={slideMaterial} />
        </mesh>

        {/* Two Polished Brass Slide Guide Rails */}
        {[-0.23, 0.23].map((x, i) => (
          <mesh key={i} position={[x, 0.24, -0.2]} rotation={[-0.48, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 1.65, 12]} />
            <primitive object={brassMaterial} />
          </mesh>
        ))}

        {/* Velvet Catch Tray Base */}
        <mesh position={[0, -0.65, 0.85]} receiveShadow>
          <cylinderGeometry args={[0.95, 1.05, 0.22, 36]} />
          <primitive object={brassMaterial} />
        </mesh>

        {/* Velvet Cushion inside Tray */}
        <mesh position={[0, -0.53, 0.85]} receiveShadow>
          <cylinderGeometry args={[0.84, 0.84, 0.06, 36]} />
          <primitive object={velvetTrayMaterial} />
        </mesh>

        {/* Gold Trim along Tray Rim */}
        <mesh position={[0, -0.5, 0.85]}>
          <torusGeometry args={[0.88, 0.035, 14, 44]} rotation={[Math.PI / 2, 0, 0]} />
          <primitive object={brassMaterial} />
        </mesh>
      </group>
    </group>
  );
}
