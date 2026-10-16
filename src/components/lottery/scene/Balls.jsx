// Balls.jsx - Dynamic 3D lottery balls with tumbling physics, natural resting pile and proper packing animation
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGrandDrawStore, BALL_COLORS, PHASES } from '../store/useGrandDrawStore.js';

export default function Balls() {
  const meshRef = useRef();
  const phase = useGrandDrawStore(state => state.phase);
  const remainingPool = useGrandDrawStore(state => state.remainingPool);

  const CAGE_RADIUS = 2.05;
  const BALL_RADIUS = 0.20;
  const BALL_COUNT = Math.min(90, Math.max(16, remainingPool.length));

  // Initialize particle states with a natural resting mound
  const particles = useMemo(() => {
    const list = [];
    for (let i = 0; i < 90; i++) {
      // Natural bowl mound at the bottom of the drum
      const layer = Math.floor(i / 18);
      const angle = (i % 18) * ((Math.PI * 2) / 18) + (layer * 0.3);
      const spreadR = 0.3 + (layer * 0.22) + (Math.random() * 0.15);
      const restX = Math.cos(angle) * spreadR * 1.6;
      const restZ = Math.sin(angle) * spreadR * 0.9;
      const restY = -1.55 + (layer * 0.16) + (Math.random() * 0.06);

      const color = new THREE.Color(BALL_COLORS[i % BALL_COLORS.length]);

      list.push({
        pos: new THREE.Vector3(restX, restY, restZ),
        restPos: new THREE.Vector3(restX, restY, restZ),
        vel: new THREE.Vector3(0, 0, 0),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        angVel: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        ),
        color
      });
    }
    return list;
  }, []);

  // Update instance colors
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < 90; i++) {
      meshRef.current.setColorAt(i, particles[i].color);
    }
    meshRef.current.instanceColor.needsUpdate = true;
  }, [particles]);

  // When PACKING begins, reset balls to drop down through the top funnel
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (phase === PHASES.PACKING && prevPhaseRef.current !== PHASES.PACKING) {
      particles.forEach((p, i) => {
        p.pos.set(
          (Math.random() - 0.5) * 0.6,
          2.5 + (i * 0.04) + Math.random() * 0.4,
          (Math.random() - 0.5) * 0.6
        );
        p.vel.set(
          (Math.random() - 0.5) * 2,
          -4 - Math.random() * 3,
          (Math.random() - 0.5) * 2
        );
      });
    }
    prevPhaseRef.current = phase;
  }, [phase, particles]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Frame physics loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.035);
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < BALL_COUNT; i++) {
      const p = particles[i];

      if (phase === PHASES.PACKING) {
        // Fall down through top hatch
        p.vel.y -= 22 * dt;
        p.pos.addScaledVector(p.vel, dt);

        if (p.pos.y < p.restPos.y) {
          p.pos.y = p.restPos.y;
          p.vel.y = -p.vel.y * 0.25;
          p.vel.x += (Math.random() - 0.5) * 2;
          p.vel.z += (Math.random() - 0.5) * 2;
        }

        const dist = p.pos.length();
        if (dist > CAGE_RADIUS - BALL_RADIUS) {
          const norm = p.pos.clone().normalize();
          p.pos.copy(norm.multiplyScalar(CAGE_RADIUS - BALL_RADIUS));
          p.vel.reflect(norm).multiplyScalar(0.4);
        }
      } else if (phase === PHASES.SPINNING) {
        // Chaotic tumbling along circular drum circumference
        const tangentialAngle = Math.atan2(p.pos.y, p.pos.z);
        const tangentialSpeed = 8.5;

        p.vel.y += (-tangentialSpeed * Math.sin(tangentialAngle) + 4) * dt * 14;
        p.vel.z += (tangentialSpeed * Math.cos(tangentialAngle) + (Math.random() - 0.5) * 4) * dt * 14;
        p.vel.x += ((Math.random() - 0.5) * 8) * dt;

        // Gravity pull
        p.vel.y -= 14 * dt;
        p.vel.multiplyScalar(0.975);

        p.pos.addScaledVector(p.vel, dt);

        // Spherical boundary bounce
        const dist = p.pos.length();
        if (dist > CAGE_RADIUS - BALL_RADIUS) {
          const norm = p.pos.clone().normalize();
          p.pos.copy(norm.multiplyScalar(CAGE_RADIUS - BALL_RADIUS));
          p.vel.reflect(norm).multiplyScalar(0.6);
        }

        if (Math.abs(p.pos.x) > 1.95) {
          p.pos.x = Math.sign(p.pos.x) * 1.95;
          p.vel.x = -p.vel.x * 0.5;
        }

        p.rot.x += p.angVel.x * dt * 2;
        p.rot.y += p.angVel.y * dt * 2;
        p.rot.z += p.angVel.z * dt * 2;
      } else if (phase === PHASES.DECELERATING) {
        // Smoothly settle down towards bottom
        p.vel.y -= 16 * dt;
        p.vel.x *= 0.92;
        p.vel.z *= 0.92;

        p.pos.addScaledVector(p.vel, dt);

        const dist = p.pos.length();
        if (dist > CAGE_RADIUS - BALL_RADIUS) {
          const norm = p.pos.clone().normalize();
          p.pos.copy(norm.multiplyScalar(CAGE_RADIUS - BALL_RADIUS));
          p.vel.reflect(norm).multiplyScalar(0.35);
        }
        if (p.pos.y < p.restPos.y) {
          p.pos.y = p.restPos.y;
          p.vel.y = 0;
        }
      } else {
        // Resting pile in IDLE_READY / BALL_PRESENTED / TICKET_SHOWN / EDITING
        // Smoothly return to the natural resting bowl mound
        p.pos.lerp(p.restPos, 0.06);

        const wobble = Math.sin(time * 2 + i * 0.3) * 0.005;
        dummy.position.set(p.pos.x, p.pos.y + wobble, p.pos.z);
        dummy.rotation.copy(p.rot);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    // Hide remaining instances if BALL_COUNT < 90
    for (let i = BALL_COUNT; i < 90; i++) {
      dummy.position.set(0, -999, 0);
      dummy.scale.setScalar(0.001);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, 0.5, 0]}>
      <instancedMesh
        ref={meshRef}
        args={[null, null, 90]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[BALL_RADIUS, 24, 24]} />
        <meshStandardMaterial
          roughness={0.12}
          metalness={0.35}
        />
      </instancedMesh>
    </group>
  );
}
