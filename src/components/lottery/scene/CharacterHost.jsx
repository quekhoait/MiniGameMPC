// CharacterHost.jsx - 3D Anime Character MC standing on the right side of the cage and turning the crank
import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useGrandDrawStore, PHASES } from '../store/useGrandDrawStore.js';

export default function CharacterHost() {
  const innerAnimRef = useRef();
  const phase = useGrandDrawStore(state => state.phase);
  const triggerSpin = useGrandDrawStore(state => state.triggerSpin);
  const hoveredProp = useGrandDrawStore(state => state.hoveredProp);
  const setHoveredProp = useGrandDrawStore(state => state.setHoveredProp);

  // Load GLB model from public/models/character.glb
  const { scene } = useGLTF('/models/character.glb');

  // Properly clone SkinnedMesh and Skeleton using SkeletonUtils
  const characterScene = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    cloned.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) {
          node.material.side = THREE.FrontSide;
          node.material.needsUpdate = true;
        }
      }
    });
    return cloned;
  }, [scene]);

  // Find and cache bone references
  const bones = useMemo(() => {
    const map = {};
    characterScene.traverse((node) => {
      if (node.name) {
        const n = node.name.toLowerCase();
        if (n.includes('head')) map.head = node;
        else if (n.includes('chest')) map.chest = node;
        else if (n.includes('spine')) map.spine = node;
        else if (n.includes('right shoulder') || n.includes('shoulder_70')) map.rShoulder = node;
        else if (n.includes('right arm') || n.includes('arm_68')) map.rArm = node;
        else if (n.includes('right elbow') || n.includes('elbow_67')) map.rElbow = node;
        else if (n.includes('right wrist') || n.includes('wrist_64')) map.rWrist = node;
        else if (n.includes('left shoulder') || n.includes('shoulder_22')) map.lShoulder = node;
        else if (n.includes('left arm') || n.includes('arm_20')) map.lArm = node;
        else if (n.includes('left elbow') || n.includes('elbow_19')) map.lElbow = node;
        else if (n.includes('left wrist') || n.includes('wrist_16')) map.lWrist = node;
      }
    });
    return map;
  }, [characterScene]);

  // Store rest rotations
  const restRot = useRef({});
  useEffect(() => {
    Object.keys(bones).forEach(key => {
      if (bones[key]) {
        restRot.current[key] = bones[key].quaternion.clone();
      }
    });
  }, [bones]);

  // Animated turning angle accumulator
  const crankTurnAngleRef = useRef(0);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (!innerAnimRef.current) return;

    // Subtle breathing on chest & spine
    const breath = Math.sin(time * 2.2) * 0.025;
    if (bones.chest && restRot.current.chest) {
      bones.chest.quaternion.copy(restRot.current.chest);
      bones.chest.rotateX(breath);
    }
    if (bones.spine && restRot.current.spine) {
      bones.spine.quaternion.copy(restRot.current.spine);
      bones.spine.rotateX(breath * 0.5);
    }

    // Left arm natural living sway
    if (bones.lArm && restRot.current.lArm) {
      bones.lArm.quaternion.copy(restRot.current.lArm);
      bones.lArm.rotateZ(Math.sin(time * 1.5) * 0.04);
      bones.lArm.rotateX(Math.cos(time * 1.5) * 0.03);
    }

    // Phase-specific animation
    if (phase === PHASES.SPINNING || phase === PHASES.DECELERATING) {
      // Actively turning the crank
      const speed = phase === PHASES.SPINNING ? 7.5 : 1.2;
      crankTurnAngleRef.current += speed * delta;
      const angle = crankTurnAngleRef.current;

      // Head looks towards the turning wheel
      if (bones.head && restRot.current.head) {
        bones.head.quaternion.copy(restRot.current.head);
        bones.head.rotateY(0.4);
        bones.head.rotateX(0.12 + Math.sin(angle) * 0.04);
      }

      // Right arm turning the crank in a circular motion
      if (bones.rShoulder && restRot.current.rShoulder) {
        bones.rShoulder.quaternion.copy(restRot.current.rShoulder);
        bones.rShoulder.rotateZ(0.28 + Math.sin(angle) * 0.18);
        bones.rShoulder.rotateX(-0.35 + Math.cos(angle) * 0.22);
      }
      if (bones.rArm && restRot.current.rArm) {
        bones.rArm.quaternion.copy(restRot.current.rArm);
        bones.rArm.rotateX(-0.75 + Math.cos(angle) * 0.35);
        bones.rArm.rotateZ(-0.35 + Math.sin(angle) * 0.35);
      }
      if (bones.rElbow && restRot.current.rElbow) {
        bones.rElbow.quaternion.copy(restRot.current.rElbow);
        bones.rElbow.rotateY(0.55 + Math.sin(angle) * 0.25);
      }
      if (bones.rWrist && restRot.current.rWrist) {
        bones.rWrist.quaternion.copy(restRot.current.rWrist);
        bones.rWrist.rotateX(Math.cos(angle) * 0.3);
      }

      // Small rhythmic body sway with each turn
      innerAnimRef.current.position.y = Math.sin(angle * 2) * 0.015;
      innerAnimRef.current.position.z = Math.cos(angle) * 0.02;
    } else if (phase === PHASES.BALL_PRESENTED || phase === PHASES.TICKET_SHOWN) {
      // Presentation pose: gesturing towards the velvet tray
      if (bones.head && restRot.current.head) {
        bones.head.quaternion.copy(restRot.current.head);
        bones.head.rotateY(-0.35);
        bones.head.rotateX(0.12);
      }

      if (bones.rArm && restRot.current.rArm) {
        bones.rArm.quaternion.copy(restRot.current.rArm);
        bones.rArm.rotateX(-0.85);
        bones.rArm.rotateZ(-0.45);
      }
      if (bones.rElbow && restRot.current.rElbow) {
        bones.rElbow.quaternion.copy(restRot.current.rElbow);
        bones.rElbow.rotateY(0.4);
      }
      if (bones.rWrist && restRot.current.rWrist) {
        bones.rWrist.quaternion.copy(restRot.current.rWrist);
        bones.rWrist.rotateZ(-0.25);
      }

      innerAnimRef.current.position.y = Math.sin(time * 2) * 0.008;
      innerAnimRef.current.position.z = 0;
    } else {
      // IDLE_READY / EDITING / PACKING: Poised ready at the crank handle
      if (bones.head && restRot.current.head) {
        bones.head.quaternion.copy(restRot.current.head);
        bones.head.rotateY(0.22 + Math.sin(time * 0.7) * 0.06);
        bones.head.rotateX(0.04 + Math.cos(time * 0.9) * 0.02);
      }

      if (bones.rShoulder && restRot.current.rShoulder) {
        bones.rShoulder.quaternion.copy(restRot.current.rShoulder);
        bones.rShoulder.rotateZ(0.22);
        bones.rShoulder.rotateX(-0.25);
      }
      if (bones.rArm && restRot.current.rArm) {
        bones.rArm.quaternion.copy(restRot.current.rArm);
        bones.rArm.rotateX(-0.55 + Math.sin(time * 1.8) * 0.02);
        bones.rArm.rotateZ(-0.28);
      }
      if (bones.rElbow && restRot.current.rElbow) {
        bones.rElbow.quaternion.copy(restRot.current.rElbow);
        bones.rElbow.rotateY(0.48);
      }

      innerAnimRef.current.position.y = 0;
      innerAnimRef.current.position.z = 0;
    }
  });

  const isInteractive = phase === PHASES.IDLE_READY;
  const isHovered = hoveredProp === 'CHARACTER';

  return (
    // Scaled up x1.5 (from 2.2 to 3.3) and positioned on the right side of the cage
    <group
      position={[3.55, -2.18, 0.45]}
      rotation={[0, -Math.PI * 0.45, 0]}
      scale={[3.3, 3.3, 3.3]}
      onClick={(e) => {
        e.stopPropagation();
        if (isInteractive) triggerSpin();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (isInteractive) {
          document.body.style.cursor = 'pointer';
          setHoveredProp('CHARACTER');
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
        if (hoveredProp === 'CHARACTER') setHoveredProp(null);
      }}
    >
      <group ref={innerAnimRef}>
        <primitive object={characterScene} />
      </group>

      {/* Floating 3D Tooltip when hovering over MC in IDLE_READY */}
      {isInteractive && isHovered && (
        <Html position={[0, 1.8, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="bg-amber-950/95 text-amber-200 border border-amber-400/80 px-3.5 py-1.5 rounded-xl text-xs font-serif tracking-wider shadow-2xl whitespace-nowrap backdrop-blur-md animate-bounce">
            ✨ Click MC hoặc Cần Quay để bắt đầu!
          </div>
        </Html>
      )}
    </group>
  );
}

// Preload the character model
useGLTF.preload('/models/character.glb');
