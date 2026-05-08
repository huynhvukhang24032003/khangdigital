/*
 * Meow Astral Core
 * Copyright (c) 2026 Meow. All rights reserved.
 */

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { interactionState } from '../config/interactionState';
import { sceneConfig } from '../config/sceneConfig';

const vertexShader = `
uniform float uTime;
uniform float uPixelRatio;
uniform vec2 uInteraction;
uniform float uInteractionEnergy;
uniform float uSurge;
attribute float aScale;
attribute float aSeed;
attribute float aOrbitDir;
varying float vAlpha;
varying float vHeat;

void main() {
  vec3 pos = position;
  float baseRadius = max(length(pos.xz), 0.001);
  float fall = fract(baseRadius / 5.4 - uTime * (0.018 + aSeed * 0.03));
  float radius = mix(0.82, 5.4, fall);
  float gravity = 1.0 / max(radius, 0.45);
  float angle = atan(pos.z, pos.x) + aOrbitDir * uTime * (0.22 + gravity * 0.85) + aSeed * 6.2831;
  float spiral = sin(angle * 2.0 - radius * 1.55 + uTime * 0.4);
  float align = 0.5 + 0.5 * dot(normalize(vec2(cos(angle), sin(angle))), normalize(uInteraction + vec2(0.0001)));
  radius += (align - 0.45) * uInteractionEnergy * 0.42 - gravity * uSurge * 0.22;

  pos.x = cos(angle) * radius;
  pos.z = sin(angle) * radius;
  pos.y = pos.y * (0.28 + fall * 0.9) + spiral * (0.025 + gravity * 0.04);
  pos.y += (align - 0.5) * uInteraction.y * uInteractionEnergy * 0.55;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Perspective-sized points keep particles crisp near the energy core.
  gl_PointSize = clamp((18.0 * aScale * uPixelRatio) / -mvPosition.z, 1.0, 5.5);
  vHeat = smoothstep(5.4, 0.82, radius);
  vAlpha = (0.12 + vHeat * 0.8) * (0.36 + aScale * 0.56) * (0.92 + align * uInteractionEnergy * 0.58 + uSurge * 0.34);
}
`;

const fragmentShader = `
uniform vec3 uColor;
varying float vAlpha;
varying float vHeat;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float circle = smoothstep(0.5, 0.08, length(uv));
  gl_FragColor = vec4(uColor * (0.42 + vHeat * 1.35), circle * vAlpha);
}
`;

function randomShellPoint(radius: number) {
  const u = Math.random();
  const v = Math.random();
  const theta = u * Math.PI * 2;
  const phi = Math.acos(2 * v - 1);
  const shell = radius * (0.35 + Math.pow(Math.random(), 0.48) * 0.65);

  return new THREE.Vector3(
    shell * Math.sin(phi) * Math.cos(theta),
    shell * Math.cos(phi) * 0.72,
    shell * Math.sin(phi) * Math.sin(theta),
  );
}

export function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(sceneConfig.particles.count * 3);
    const scales = new Float32Array(sceneConfig.particles.count);
    const seeds = new Float32Array(sceneConfig.particles.count);
    const orbitDirs = new Float32Array(sceneConfig.particles.count);

    for (let i = 0; i < sceneConfig.particles.count; i++) {
      const point = randomShellPoint(sceneConfig.particles.radius);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      scales[i] = 0.35 + Math.random() * 1.15;
      seeds[i] = Math.random();
      orbitDirs[i] = Math.random() > 0.18 ? 1 : -1;
    }

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bufferGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    bufferGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    bufferGeometry.setAttribute('aOrbitDir', new THREE.BufferAttribute(orbitDirs, 1));
    return bufferGeometry;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
      uInteraction: { value: new THREE.Vector2() },
      uInteractionEnergy: { value: 0 },
      uSurge: { value: 0 },
      uColor: { value: new THREE.Color(sceneConfig.colors.particle) },
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime * sceneConfig.particles.speed;
      materialRef.current.uniforms.uInteraction.value.copy(interactionState.smoothPointer);
      materialRef.current.uniforms.uInteractionEnergy.value = interactionState.energy;
      materialRef.current.uniforms.uSurge.value = interactionState.surge;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * (sceneConfig.particles.speed + interactionState.energy * 0.08 + interactionState.surge * 0.12);
      pointsRef.current.rotation.x = interactionState.smoothPointer.y * 0.08;
      pointsRef.current.rotation.z = interactionState.smoothPointer.x * 0.08;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
