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

  // Initialize particle states with a neat, compact natural mound at the bottom of the drum
  const particles = useMemo(() => {
    const list = [];
    const MIN_DIST = BALL_RADIUS * 2; // 0.40m
    const MIN_DIST_SQ = MIN_DIST * MIN_DIST;

    // Define clean layered structure: 4, 10, 16, 20, 22, 14, 4 balls = 90 total
    const layerDefs = [
      { count: 4,  y: -1.72, radius: 0.30, zScale: 0.88 },
      { count: 10, y: -1.54, radius: 0.64, zScale: 0.88 },
      { count: 16, y: -1.36, radius: 0.96, zScale: 0.88 },
      { count: 20, y: -1.18, radius: 1.24, zScale: 0.88 },
      { count: 22, y: -1.00, radius: 1.38, zScale: 0.88 },
      { count: 14, y: -0.82, radius: 1.15, zScale: 0.88 },
      { count: 4,  y: -0.66, radius: 0.45, zScale: 0.88 }
    ];

    let ballIndex = 0;
    layerDefs.forEach((def, layerIdx) => {
      const angleStep = (Math.PI * 2) / def.count;
      const layerOffsetAngle = layerIdx * 0.45;
      for (let j = 0; j < def.count; j++) {
        const theta = j * angleStep + layerOffsetAngle;
        const rJitter = Math.sin(ballIndex * 13) * 0.03;
        const yJitter = Math.cos(ballIndex * 17) * 0.02;
        const r = Math.max(0.08, def.radius + rJitter);

        const restX = Math.cos(theta) * r;
        const restZ = Math.sin(theta) * r * def.zScale;
        const restY = def.y + yJitter;

        const color = new THREE.Color(BALL_COLORS[ballIndex % BALL_COLORS.length]);

        list.push({
          pos: new THREE.Vector3(restX, restY, restZ),
          restPos: new THREE.Vector3(restX, restY, restZ),
          vel: new THREE.Vector3(0, 0, 0),
          rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
          angVel: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8
          ),
          mass: 0.9 + Math.random() * 0.2, // slight individual variance for organic feel
          color
        });
        ballIndex++;
      }
    });

    // Pre-relax rest positions so resting balls have ZERO overlap
    for (let step = 0; step < 25; step++) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const dx = list[i].restPos.x - list[j].restPos.x;
          const dy = list[i].restPos.y - list[j].restPos.y;
          const dz = list[i].restPos.z - list[j].restPos.z;
          const dSq = dx * dx + dy * dy + dz * dz;
          if (dSq < MIN_DIST_SQ && dSq > 0.000001) {
            const d = Math.sqrt(dSq);
            const over = (MIN_DIST - d) * 0.5;
            const nx = dx / d;
            const ny = dy / d;
            const nz = dz / d;
            list[i].restPos.x += nx * over;
            list[i].restPos.y += ny * over;
            list[i].restPos.z += nz * over;
            list[j].restPos.x -= nx * over;
            list[j].restPos.y -= ny * over;
            list[j].restPos.z -= nz * over;
          }
        }
      }
    }
    list.forEach(p => p.pos.copy(p.restPos));

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
          (Math.random() - 0.5) * 0.7,
          2.6 + (i * 0.04) + Math.random() * 0.4,
          (Math.random() - 0.5) * 0.7
        );
        p.vel.set(
          (Math.random() - 0.5) * 3,
          -5 - Math.random() * 3,
          (Math.random() - 0.5) * 3
        );
      });
    }
    prevPhaseRef.current = phase;
  }, [phase, particles]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Frame physics loop: Natural 3D projectile tumbling with elastic pairwise ball collisions
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.033);
    const time = state.clock.getElapsedTime();

    const MIN_DIST = BALL_RADIUS * 2; // 0.40m
    const MIN_DIST_SQ = MIN_DIST * MIN_DIST;
    const DRUM_INNER_RADIUS = CAGE_RADIUS - BALL_RADIUS; // 1.85m

    // Dynamic rotational speed matching drum animation
    let drumOmega = 0;
    if (phase === PHASES.SPINNING) {
      drumOmega = 7.5;
    } else if (phase === PHASES.DECELERATING) {
      drumOmega = 1.2;
    }

    // ================= 1. INDIVIDUAL BALL TRAJECTORY & FORCE UPDATE =================
    for (let i = 0; i < BALL_COUNT; i++) {
      const p = particles[i];

      if (phase === PHASES.PACKING) {
        // Gravity drop through hatch
        p.vel.y -= 26 * dt;
        p.pos.addScaledVector(p.vel, dt);

        if (p.pos.y < p.restPos.y) {
          p.pos.y = p.restPos.y;
          p.vel.y = -p.vel.y * 0.25;
          p.vel.x += (Math.random() - 0.5) * 2;
          p.vel.z += (Math.random() - 0.5) * 2;
        }

        const dist = p.pos.length();
        if (dist > DRUM_INNER_RADIUS) {
          const norm = p.pos.clone().normalize();
          p.pos.copy(norm.multiplyScalar(DRUM_INNER_RADIUS));
          p.vel.reflect(norm).multiplyScalar(0.4);
        }
      } else if (phase === PHASES.SPINNING || phase === PHASES.DECELERATING) {
        // Continuous downward gravity
        const gravity = phase === PHASES.SPINNING ? -19.0 : -22.0;
        p.vel.y += gravity * dt;

        const dist3D = p.pos.length();
        const rYZ = Math.hypot(p.pos.y, p.pos.z);

        // When drum is rotating: lift balls along wall and sweep with paddles
        if (drumOmega > 0.05) {
          // Linear drum velocity vector in Y-Z plane
          const drumVy = -drumOmega * p.pos.z;
          const drumVz = drumOmega * p.pos.y;

          // Wall proximity grip: balls near drum perimeter get pulled up along rotation
          if (dist3D > 1.40) {
            const wallProx = Math.min(1, Math.max(0, (dist3D - 1.40) / 0.45));
            const frictionRate = (phase === PHASES.SPINNING ? 18.0 : 7.0) * wallProx * dt;
            p.vel.y += (drumVy - p.vel.y) * frictionRate;
            p.vel.z += (drumVz - p.vel.z) * frictionRate;
          }

          // Agitator Paddle deflection (3 paddles sweep through drum at X = -1.1, 0, 1.1)
          const paddleAngle = (time * drumOmega) % (Math.PI * 2);
          [-1.1, 0, 1.1].forEach((px) => {
            if (Math.abs(p.pos.x - px) < 0.38 && rYZ < 1.7 && rYZ > 0.25) {
              const ballAngle = Math.atan2(p.pos.z, p.pos.y);
              const diffAngle = Math.abs(Math.sin(ballAngle - paddleAngle));
              if (diffAngle < 0.26) {
                // Energetic launch into 3D airspace
                const kickSpeed = drumOmega * rYZ * 0.95;
                p.vel.y += (-Math.sin(paddleAngle) * kickSpeed + 3.2) * dt * 14;
                p.vel.z += (Math.cos(paddleAngle) * kickSpeed) * dt * 14;
                p.vel.x += (p.pos.x - px + (Math.random() - 0.5) * 0.5) * 12 * dt;
              }
            }
          });
        }

        // Air dispersion & subtle turbulence so flight paths vary organically
        p.vel.x += (Math.sin(time * 4.5 + i * 1.7) * 2.8) * dt;
        p.vel.z += (Math.cos(time * 3.8 + i * 2.1) * 2.0) * dt;

        // Deceleration guidance: guide balls smoothly down to resting mound
        if (phase === PHASES.DECELERATING) {
          p.vel.x += (p.restPos.x - p.pos.x) * 3.5 * dt;
          p.vel.z += (p.restPos.z - p.pos.z) * 3.5 * dt;
        }

        // Air resistance damping
        const drag = phase === PHASES.SPINNING ? 0.985 : 0.94;
        p.vel.multiplyScalar(drag);

        // Apply velocity to position
        p.pos.addScaledVector(p.vel, dt);

        // Spherical boundary bounce (Inner cage wire surface)
        const newDist = p.pos.length();
        if (newDist > DRUM_INNER_RADIUS) {
          const nx = p.pos.x / newDist;
          const ny = p.pos.y / newDist;
          const nz = p.pos.z / newDist;

          // Clamp exactly to inner sphere boundary
          p.pos.x = nx * DRUM_INNER_RADIUS;
          p.pos.y = ny * DRUM_INNER_RADIUS;
          p.pos.z = nz * DRUM_INNER_RADIUS;

          // Elastic boundary bounce
          const vDotN = p.vel.x * nx + p.vel.y * ny + p.vel.z * nz;
          if (vDotN > 0) {
            const wallRestitution = 0.65;
            p.vel.x -= (1 + wallRestitution) * vDotN * nx;
            p.vel.y -= (1 + wallRestitution) * vDotN * ny;
            p.vel.z -= (1 + wallRestitution) * vDotN * nz;
          }
        }

        // Side plate bounds along X
        if (Math.abs(p.pos.x) > 1.82) {
          p.pos.x = Math.sign(p.pos.x) * 1.82;
          p.vel.x = -p.vel.x * 0.55;
        }

        // Rotational tumble
        p.rot.x += p.angVel.x * dt * 2.5;
        p.rot.y += p.angVel.y * dt * 2.5;
        p.rot.z += p.angVel.z * dt * 2.5;
      } else {
        // Resting pile in IDLE_READY / BALL_PRESENTED / TICKET_SHOWN / EDITING
        p.pos.lerp(p.restPos, 0.08);
      }
    }

    // ================= 2. BALL-TO-BALL COLLISION & SEPARATION SOLVER =================
    // Guarantees balls NEVER penetrate or overlap each other in mid-air or in pile
    if (phase === PHASES.SPINNING || phase === PHASES.DECELERATING || phase === PHASES.PACKING) {
      for (let iter = 0; iter < 2; iter++) {
        for (let i = 0; i < BALL_COUNT; i++) {
          const pi = particles[i];
          for (let j = i + 1; j < BALL_COUNT; j++) {
            const pj = particles[j];
            const dx = pi.pos.x - pj.pos.x;
            const dy = pi.pos.y - pj.pos.y;
            const dz = pi.pos.z - pj.pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < MIN_DIST_SQ && distSq > 0.000001) {
              const dist = Math.sqrt(distSq);
              const overlap = MIN_DIST - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              const nz = dz / dist;

              // Immediately push apart so they never overlap
              const push = overlap * 0.5;
              pi.pos.x += nx * push;
              pi.pos.y += ny * push;
              pi.pos.z += nz * push;
              pj.pos.x -= nx * push;
              pj.pos.y -= ny * push;
              pj.pos.z -= nz * push;

              // Elastic velocity exchange (only on first iteration)
              if (iter === 0) {
                const rvx = pi.vel.x - pj.vel.x;
                const rvy = pi.vel.y - pj.vel.y;
                const rvz = pi.vel.z - pj.vel.z;
                const velAlongNormal = rvx * nx + rvy * ny + rvz * nz;

                // Reflect only if moving towards each other
                if (velAlongNormal < 0) {
                  const restitution = 0.70;
                  const impulse = -(1 + restitution) * velAlongNormal * 0.5;
                  pi.vel.x += nx * impulse;
                  pi.vel.y += ny * impulse;
                  pi.vel.z += nz * impulse;
                  pj.vel.x -= nx * impulse;
                  pj.vel.y -= ny * impulse;
                  pj.vel.z -= nz * impulse;
                }
              }
            }
          }
        }
      }
    }

    // ================= 3. RENDER MATRICES UPDATE =================
    for (let i = 0; i < BALL_COUNT; i++) {
      const p = particles[i];
      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    // Hide unneeded instances
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
