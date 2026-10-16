// CameraDirector.jsx - Orchestrates cinematic camera angles and smooth transitions across all phases
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGrandDrawStore, PHASES } from '../store/useGrandDrawStore.js';

export default function CameraDirector() {
  const { camera } = useThree();
  const phase = useGrandDrawStore(state => state.phase);

  // Current camera target position and lookAt vectors
  const currentTarget = useRef(new THREE.Vector3(0, 0.5, 0));

  // Preset camera configurations per phase - adjusted with comfortable viewing distance
  const getCameraConfig = (p) => {
    switch (p) {
      case PHASES.EDITING:
        return {
          pos: new THREE.Vector3(0, 2.8, 14.5),
          target: new THREE.Vector3(0, 0.5, 0),
          fov: 46,
          speed: 2.2
        };
      case PHASES.PACKING:
      case PHASES.LOADING_CAGE:
        return {
          pos: new THREE.Vector3(0, 3.4, 13.5),
          target: new THREE.Vector3(0, 0.8, 0),
          fov: 45,
          speed: 2.2
        };
      case PHASES.IDLE_READY:
        return {
          pos: new THREE.Vector3(0.5, 1.8, 12.2),
          target: new THREE.Vector3(0.2, 0.4, 0),
          fov: 46,
          speed: 2.5
        };
      case PHASES.SPINNING:
        return {
          pos: new THREE.Vector3(0.8, 1.8, 11.2),
          target: new THREE.Vector3(0.4, 0.5, 0),
          fov: 45,
          speed: 2.8
        };
      case PHASES.DECELERATING:
        return {
          pos: new THREE.Vector3(0.4, 1.4, 9.8),
          target: new THREE.Vector3(0.2, 0.1, 0.8),
          fov: 43,
          speed: 2.2
        };
      case PHASES.DISPENSING:
        return {
          pos: new THREE.Vector3(0, 1.2, 8.8),
          target: new THREE.Vector3(0, -0.6, 1.8),
          fov: 40,
          speed: 2.5
        };
      case PHASES.BALL_PRESENTED:
        return {
          pos: new THREE.Vector3(0, 0.8, 6.8),
          target: new THREE.Vector3(0, -1.2, 2.45),
          fov: 38,
          speed: 2.8
        };
      case PHASES.OPENING:
      case PHASES.TICKET_SHOWN:
        return {
          pos: new THREE.Vector3(0, 0.9, 7.2),
          target: new THREE.Vector3(0, -1.0, 2.45),
          fov: 38,
          speed: 2.8
        };
      default:
        return {
          pos: new THREE.Vector3(0, 2.0, 12.5),
          target: new THREE.Vector3(0, 0.5, 0),
          fov: 46,
          speed: 2.2
        };
    }
  };

  useFrame((state, delta) => {
    const config = getCameraConfig(phase);
    const speed = config.speed;
    const time = state.clock.getElapsedTime();

    // Subtle breathing drift on camera position
    const driftX = Math.sin(time * 0.35) * 0.04;
    const driftY = Math.cos(time * 0.45) * 0.025;

    // Smoothly damp camera position
    camera.position.x = THREE.MathUtils.damp(camera.position.x, config.pos.x + driftX, speed, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, config.pos.y + driftY, speed, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, config.pos.z, speed, delta);

    // Smoothly damp camera FOV if supported
    if (camera.fov) {
      camera.fov = THREE.MathUtils.damp(camera.fov, config.fov, speed, delta);
      camera.updateProjectionMatrix();
    }

    // Smoothly damp lookAt target
    currentTarget.current.x = THREE.MathUtils.damp(currentTarget.current.x, config.target.x, speed, delta);
    currentTarget.current.y = THREE.MathUtils.damp(currentTarget.current.y, config.target.y, speed, delta);
    currentTarget.current.z = THREE.MathUtils.damp(currentTarget.current.z, config.target.z, speed, delta);

    camera.lookAt(currentTarget.current);
  });

  return null;
}
