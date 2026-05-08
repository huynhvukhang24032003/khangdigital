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
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uSpeed;
uniform vec2 uInteraction;
uniform float uInteractionEnergy;
uniform float uSurge;
attribute float aAngle;
attribute float aRadius;
attribute float aSeed;
attribute float aScale;
varying float vHeat;
varying float vAlpha;

void main() {
  float range = uOuterRadius - uInnerRadius;
  float fall = fract((aRadius - uInnerRadius) / range - uTime * (0.018 + aSeed * 0.018));
  float radius = uInnerRadius + fall * range;
  float gravity = 1.0 / max(radius, 0.35);
  float angle = aAngle + uTime * uSpeed * (0.35 + gravity * 1.8) + aSeed * sin(uTime * 0.22 + radius);
  float align = 0.5 + 0.5 * dot(normalize(vec2(cos(angle), sin(angle))), normalize(uInteraction + vec2(0.0001)));
  radius += (align - 0.5) * uInteractionEnergy * 0.34 - gravity * uSurge * 0.3;

  // Spiral compression makes dust look like it is being pulled inward by gravity.
  float arm = sin(angle * 3.0 - radius * 2.45 + uTime * 0.7);
  float thickness = (0.055 + radius * 0.035) * (0.45 + aSeed);
  vec3 pos = vec3(cos(angle) * radius, arm * thickness, sin(angle) * radius);
  pos.xz += vec2(cos(angle + 1.57), sin(angle + 1.57)) * arm * 0.08;
  pos.y += sin(angle * 4.0 + uTime * 0.85) * uInteractionEnergy * 0.07;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp((22.0 * aScale * uPixelRatio) / -mvPosition.z, 0.9, 6.5);

  vHeat = smoothstep(uOuterRadius, uInnerRadius, radius);
  vAlpha = smoothstep(uOuterRadius, uInnerRadius + 0.35, radius) * (0.22 + aSeed * 0.78) * (0.86 + align * uInteractionEnergy * 0.55 + uSurge * 0.34);
}
`;

const fragmentShader = `
uniform vec3 uGlow;
varying float vHeat;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float core = smoothstep(0.5, 0.04, length(uv));
  gl_FragColor = vec4(uGlow * (0.62 + vHeat * 1.55), core * vAlpha);
}
`;

function makeSpiralTrail(radius: number, phase: number, height: number) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 130; i++) {
    const t = i / 129;
    const r = THREE.MathUtils.lerp(radius, sceneConfig.accretionDisk.innerRadius * 0.94, t);
    const angle = phase + t * Math.PI * 2.7;
    const arm = Math.sin(angle * 2.0 - r * 2.2) * (0.035 + r * 0.012);
    points.push(new THREE.Vector3(Math.cos(angle) * r, height + arm, Math.sin(angle) * r));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

export function AccretionDisk() {
  const pointsRef = useRef<THREE.Points>(null);
  const trailRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const count = sceneConfig.accretionDisk.count;
    const positions = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const seed = Math.random();
      const radius =
        sceneConfig.accretionDisk.innerRadius +
        Math.pow(Math.random(), 0.55) * (sceneConfig.accretionDisk.outerRadius - sceneConfig.accretionDisk.innerRadius);
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = radius;
      seeds[i] = seed;
      scales[i] = 0.35 + Math.random() * 1.3;
    }

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bufferGeometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    bufferGeometry.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
    bufferGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    bufferGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    return bufferGeometry;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
      uInnerRadius: { value: sceneConfig.accretionDisk.innerRadius },
      uOuterRadius: { value: sceneConfig.accretionDisk.outerRadius },
      uSpeed: { value: sceneConfig.accretionDisk.speed },
      uInteraction: { value: new THREE.Vector2() },
      uInteractionEnergy: { value: 0 },
      uSurge: { value: 0 },
      uGlow: { value: new THREE.Color(sceneConfig.colors.particle) },
    }),
    [],
  );

  const trailGeometries = useMemo(
    () => [
      makeSpiralTrail(4.2, 0.2, 0.02),
      makeSpiralTrail(3.6, 1.9, -0.03),
      makeSpiralTrail(4.0, 3.7, 0.05),
      makeSpiralTrail(2.9, 5.1, -0.02),
    ],
    [],
  );

  const trailMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: sceneConfig.colors.coreHot,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uInteraction.value.copy(interactionState.smoothPointer);
      materialRef.current.uniforms.uInteractionEnergy.value = interactionState.energy;
      materialRef.current.uniforms.uSurge.value = interactionState.surge;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * (0.035 + interactionState.energy * 0.08 + interactionState.surge * 0.1);
      pointsRef.current.rotation.x = interactionState.smoothPointer.y * 0.05;
      pointsRef.current.rotation.z = interactionState.smoothPointer.x * 0.05;
    }
    if (trailRef.current) {
      trailRef.current.rotation.y += delta * sceneConfig.accretionDisk.speed * (0.23 + interactionState.energy * 0.3 + interactionState.surge * 0.24);
      trailRef.current.rotation.z = Math.sin(time * 0.16) * 0.025 + interactionState.smoothPointer.x * 0.04;
      trailRef.current.rotation.x = interactionState.smoothPointer.y * 0.05;
    }
  });

  return (
    <group rotation={sceneConfig.accretionDisk.tilt}>
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
      <group ref={trailRef}>
        {trailGeometries.map((trailGeometry, index) => (
          <line key={index} geometry={trailGeometry} material={trailMaterial} />
        ))}
      </group>
    </group>
  );
}
