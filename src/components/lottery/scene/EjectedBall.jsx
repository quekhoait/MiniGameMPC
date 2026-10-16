// EjectedBall.jsx - Solid sphere that rolls down, rotates 45 degrees, opens lid (hiệu ứng mở nắp) and reveals prize ticket
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGrandDrawStore, PHASES } from '../store/useGrandDrawStore.js';

export default function EjectedBall() {
  const groupRef = useRef();
  const ballBodyRef = useRef();
  const lidHingeRef = useRef();
  const ticketRef = useRef();
  const glowRingRef = useRef();

  const phase = useGrandDrawStore(state => state.phase);
  const currentWinner = useGrandDrawStore(state => state.currentWinner);
  const currentBallColor = useGrandDrawStore(state => state.currentBallColor);
  const hoveredProp = useGrandDrawStore(state => state.hoveredProp);
  const setHoveredProp = useGrandDrawStore(state => state.setHoveredProp);
  const openBall = useGrandDrawStore(state => state.openBall);

  // 1. Lower hemisphere (base cup / bowl)
  const lowerHemisphereGeo = useMemo(() => {
    return new THREE.SphereGeometry(
      0.35, 36, 20,
      0, Math.PI * 2,
      Math.PI / 2, Math.PI / 2
    );
  }, []);

  // 2. Upper hemisphere (hinged lid dome)
  const upperHemisphereGeo = useMemo(() => {
    return new THREE.SphereGeometry(
      0.35, 36, 20,
      0, Math.PI * 2,
      0, Math.PI / 2
    );
  }, []);

  // 3. Inner golden lining bowl
  const innerLiningGeo = useMemo(() => {
    return new THREE.SphereGeometry(
      0.335, 24, 16,
      0, Math.PI * 2,
      Math.PI / 2, Math.PI / 2
    );
  }, []);

  // Glossy candy exterior material
  const shellMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(currentBallColor || '#F1C40F'),
      roughness: 0.1,
      metalness: 0.65,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });
  }, [currentBallColor]);

  // Polished gold rim, hinge and interior lining
  const goldMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFDF6D'),
      metalness: 0.95,
      roughness: 0.18,
      side: THREE.DoubleSide
    });
  }, []);

  const isVisible = [
    PHASES.DISPENSING,
    PHASES.BALL_PRESENTED,
    PHASES.OPENING,
    PHASES.TICKET_SHOWN
  ].includes(phase);

  const isInteractive = phase === PHASES.BALL_PRESENTED;
  const isHovered = hoveredProp === 'BALL';

  // Animation trackers
  const dispenseProgressRef = useRef(0);
  const settleRotateProgressRef = useRef(0);
  const lidOpenProgressRef = useRef(0);
  const ticketProgressRef = useRef(0);

  // Reset progress when DISPENSING begins
  useEffect(() => {
    if (phase === PHASES.DISPENSING) {
      dispenseProgressRef.current = 0;
      settleRotateProgressRef.current = 0;
      lidOpenProgressRef.current = 0;
      ticketProgressRef.current = 0;
    }
  }, [phase]);

  useFrame((state, delta) => {
    if (!isVisible || !groupRef.current) return;
    const time = state.clock.getElapsedTime();

    if (phase === PHASES.DISPENSING) {
      // 1. Sliding down the chute smoothly to velvet tray cushion
      dispenseProgressRef.current = THREE.MathUtils.damp(dispenseProgressRef.current, 1, 3.2, delta);
      const t = dispenseProgressRef.current;
      groupRef.current.position.x = 0;
      groupRef.current.position.y = THREE.MathUtils.lerp(-1.0, -1.58, t);
      groupRef.current.position.z = THREE.MathUtils.lerp(1.0, 2.45, t);

      // Keep solid sphere aligned down the chute
      if (ballBodyRef.current) {
        ballBodyRef.current.rotation.x = t * (Math.PI / 6);
        ballBodyRef.current.rotation.y = 0;
      }
    } else if (phase === PHASES.BALL_PRESENTED) {
      // 2. On velvet tray cushion: rests flush at Y = -1.58, solid sphere rotates 45 degrees
      groupRef.current.position.set(0, -1.58, 2.45);
      settleRotateProgressRef.current = THREE.MathUtils.damp(settleRotateProgressRef.current, 1, 3.5, delta);
      const rotT = settleRotateProgressRef.current;

      if (ballBodyRef.current) {
        // Rotate smoothly 45 degrees around Y axis (pi/4) while leveling
        ballBodyRef.current.rotation.x = (1 - rotT) * (Math.PI / 6);
        ballBodyRef.current.rotation.y = rotT * (Math.PI / 4);
      }

      // Glow ring pulse
      if (glowRingRef.current) {
        const pulse = Math.sin(time * 4) * 0.15 + 0.85;
        glowRingRef.current.scale.setScalar(pulse);
      }
    } else {
      // OPENING or TICKET_SHOWN
      groupRef.current.position.set(0, -1.58, 2.45);
      if (ballBodyRef.current) {
        ballBodyRef.current.rotation.x = 0;
        ballBodyRef.current.rotation.y = Math.PI / 4;
      }
    }

    // 3. Lid opening animation ("hiệu ứng mở nắp")
    let targetLid = 0;
    let targetTicket = 0;

    if (phase === PHASES.OPENING || phase === PHASES.TICKET_SHOWN) {
      targetLid = 1;
      targetTicket = 1;
    }

    lidOpenProgressRef.current = THREE.MathUtils.damp(lidOpenProgressRef.current, targetLid, 4.0, delta);
    ticketProgressRef.current = THREE.MathUtils.damp(ticketProgressRef.current, targetTicket, 3.0, delta);

    // Hinge lid opens backward up to ~110 degrees (-1.9 rad)
    if (lidHingeRef.current) {
      lidHingeRef.current.rotation.x = -lidOpenProgressRef.current * 1.95;
    }

    // 4. Paper ticket flying up and forward out of the open sphere
    if (ticketRef.current) {
      const p = ticketProgressRef.current;
      ticketRef.current.position.y = THREE.MathUtils.lerp(0.05, 1.35, p);
      ticketRef.current.position.z = THREE.MathUtils.lerp(0.0, 1.05, p);
      ticketRef.current.rotation.x = THREE.MathUtils.lerp(0.2, -0.25, p);
      ticketRef.current.rotation.y = Math.sin(time * 3) * 0.06 * p;
      ticketRef.current.scale.setScalar(THREE.MathUtils.lerp(0.01, 1.7, p));
    }
  });

  if (!isVisible) return null;

  return (
    <group
      ref={groupRef}
      position={[0, -1.58, 2.45]}
      onClick={(e) => {
        e.stopPropagation();
        if (isInteractive) openBall();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (isInteractive) {
          document.body.style.cursor = 'pointer';
          setHoveredProp('BALL');
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
        if (hoveredProp === 'BALL') setHoveredProp(null);
      }}
    >
      {/* Rotatable Ball Body (Rotates 45 degrees on the tray) */}
      <group ref={ballBodyRef}>
        {/* ================= LOWER BOWL (CUP) ================= */}
        <group>
          {/* Outer Cup */}
          <mesh
            geometry={lowerHemisphereGeo}
            material={shellMaterial}
            castShadow
            receiveShadow
          />
          {/* Inner Gold Lining */}
          <mesh
            geometry={innerLiningGeo}
            material={goldMaterial}
          />
          {/* Gold Equator Rim Ring */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.35, 0.02, 16, 48]} />
            <primitive object={goldMaterial} />
          </mesh>
          {/* Front Gold Latch Button */}
          <mesh position={[0, 0, 0.355]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
            <primitive object={goldMaterial} />
          </mesh>
        </group>

        {/* ================= HINGED TOP LID (DOME) ================= */}
        {/* Hinge point is anchored at the rear edge [0, 0, -0.35] */}
        <group ref={lidHingeRef} position={[0, 0, -0.35]}>
          <group position={[0, 0, 0.35]}>
            {/* Top Lid Dome */}
            <mesh
              geometry={upperHemisphereGeo}
              material={shellMaterial}
              castShadow
            />
            {/* Gold Lid Lip */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.33, 0.355, 36]} />
              <primitive object={goldMaterial} />
            </mesh>
            {/* Top Crown Ring Finial */}
            <mesh position={[0, 0.35, 0]}>
              <torusGeometry args={[0.06, 0.015, 12, 24]} rotation={[0, 0, 0]} />
              <primitive object={goldMaterial} />
            </mesh>
          </group>
        </group>

        {/* Golden glow light bursting from inside when opened */}
        {(phase === PHASES.OPENING || phase === PHASES.TICKET_SHOWN) && (
          <pointLight
            position={[0, 0.15, 0]}
            color="#FFF0A0"
            intensity={9}
            distance={5}
            decay={1.8}
          />
        )}

        {/* ================= FLYING PRIZE TICKET ================= */}
        <group ref={ticketRef} scale={0}>
          {/* Parchment Paper Sheet */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <planeGeometry args={[0.65, 0.95]} />
            <meshStandardMaterial
              color="#FFFDF2"
              roughness={0.4}
              metalness={0.05}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Gold Filigree Stamped Border */}
          <mesh position={[0, 0.25, 0.005]}>
            <planeGeometry args={[0.58, 0.88]} />
            <meshBasicMaterial color="#D4AF37" wireframe />
          </mesh>
          {/* Golden Seal Medallion */}
          <mesh position={[0, 0.45, 0.01]}>
            <circleGeometry args={[0.1, 24]} />
            <meshStandardMaterial color="#FFDF6D" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      </group>

      {/* Pulsating golden aura ring beneath ball on tray */}
      {isInteractive && (
        <group ref={glowRingRef} position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.36, 0.52, 32]} />
          <meshBasicMaterial
            color={isHovered ? '#FFFFFF' : '#FFD700'}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </group>
      )}
    </group>
  );
}
