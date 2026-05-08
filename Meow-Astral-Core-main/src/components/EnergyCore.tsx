/*
 * Meow Astral Core
 * Copyright (c) 2026 Meow. All rights reserved.
 */

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { interactionState } from '../config/interactionState';
import { sceneConfig } from '../config/sceneConfig';

const coreVertexShader = `
uniform float uTime;
uniform float uDistortion;
uniform vec2 uInteraction;
uniform float uInteractionEnergy;
uniform float uRingFlux;
uniform float uSurge;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vNoise;
varying float vPressure;

// Lightweight value noise for vertex energy distortion.
float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float value = 0.0;
  float amp = 0.55;
  for (int i = 0; i < 4; i++) {
    value += noise(p) * amp;
    p *= 2.04;
    amp *= 0.48;
  }
  return value;
}

vec3 energyDirection(float t, float seed) {
  return normalize(vec3(
    sin(t * (0.21 + seed * 0.03) + seed),
    cos(t * (0.17 + seed * 0.04) + seed * 1.7),
    sin(t * (0.13 + seed * 0.05) + seed * 2.3)
  ));
}

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec3 dir = normalize(normal);
  vec2 interactionDir = normalize(uInteraction + vec2(0.0001));

  vec3 axisA = energyDirection(uTime, 0.4);
  vec3 axisB = energyDirection(uTime, 2.1);
  vec3 lobeA = energyDirection(uTime, 4.2);
  vec3 lobeB = energyDirection(uTime, 6.8);
  vec3 lobeC = energyDirection(uTime, 9.4);

  // Layered, slow-moving fields make the matter evolve without noisy shaking.
  float macro = fbm(dir * 1.18 + axisA * 0.7 + vec3(uTime * 0.06, -uTime * 0.04, uTime * 0.05));
  float medium = fbm(dir * 2.75 + axisB * 0.9 + vec3(-uTime * 0.14, uTime * 0.1, uTime * 0.08));
  float skin = fbm(dir * 6.2 + vec3(macro * 1.7, medium * 1.3, uTime * 0.22));

  float breath = sin(uTime * 0.82 + macro * 4.2) * 0.045;
  float stretchA = dot(position, axisA) * (0.075 * sin(uTime * 0.34 + medium * 3.0));
  float stretchB = dot(position, axisB) * (0.045 * cos(uTime * 0.27 + macro * 5.0));

  float lobePulseA = smoothstep(0.12, 0.94, 0.5 + 0.5 * sin(uTime * 0.52 + 1.4));
  float lobePulseB = smoothstep(0.18, 0.9, 0.5 + 0.5 * sin(uTime * 0.43 + 4.7));
  float lobePulseC = smoothstep(0.2, 0.88, 0.5 + 0.5 * sin(uTime * 0.37 + 8.1));

  float blobA = pow(max(dot(dir, lobeA), 0.0), 6.5) * lobePulseA;
  float blobB = pow(max(dot(dir, lobeB), 0.0), 9.0) * lobePulseB;
  float tendril = pow(max(dot(dir, lobeC), 0.0), 18.0) * lobePulseC;
  float collapse = pow(max(dot(dir, -lobeB), 0.0), 5.5) * (1.0 - lobePulseB);
  float cursorAlign = 0.5 + 0.5 * dot(normalize(dir.xy + vec2(0.0001)), interactionDir);
  float cursorPull = pow(cursorAlign, 2.4) * (0.08 + uInteractionEnergy * 0.92 + uSurge * 0.4);
  float compression = (0.5 - cursorAlign) * (0.02 + uRingFlux * 0.05);

  float displacement =
    (macro - 0.47) * 0.42 +
    (medium - 0.5) * 0.24 +
    (skin - 0.52) * 0.1 +
    breath +
    blobA * 0.34 +
    blobB * 0.22 +
    tendril * 0.42 -
    collapse * 0.16 +
    cursorPull * 0.22 -
    compression;

  vec3 displaced = position + dir * (displacement * uDistortion);
  displaced += axisA * stretchA;
  displaced += axisB * stretchB;

  vPressure = clamp(blobA + blobB + tendril + abs(breath) * 4.0 + cursorPull * 0.8 + uRingFlux * 0.35 + uSurge * 0.7, 0.0, 1.0);
  vNoise = clamp(macro * 0.42 + medium * 0.34 + skin * 0.18 + vPressure * 0.32, 0.0, 1.2);

  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const coreFragmentShader = `
uniform vec3 uCoreColor;
uniform vec3 uHotColor;
uniform float uAlpha;
uniform float uTime;
uniform float uInteractionEnergy;
uniform float uRingFlux;
uniform float uSurge;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vNoise;
varying float vPressure;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float value = 0.0;
  float amp = 0.55;
  for (int i = 0; i < 4; i++) {
    value += noise(p) * amp;
    p *= 2.02;
    amp *= 0.48;
  }
  return value;
}

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 2.4);
  float internal = fbm(vWorldPosition * 2.35 + vec3(uTime * 0.22, -uTime * 0.15, uTime * 0.18));
  float magneticVeins = smoothstep(0.48, 0.86, internal + sin(vWorldPosition.y * 3.2 + uTime * 0.74) * 0.16);
  float pulse = 0.55 + 0.45 * sin(uTime * 1.35 + vNoise * 8.0 + internal * 3.0 + uRingFlux * 3.4 + uSurge * 4.4);

  vec3 color = mix(uCoreColor, uHotColor, smoothstep(0.24, 1.04, vNoise + magneticVeins * 0.22));
  color += uHotColor * fresnel * (0.62 + vPressure * 0.45 + uInteractionEnergy * 0.32 + uSurge * 0.35);
  color += uHotColor * magneticVeins * 0.18;
  color *= 0.58 + pulse * 0.28 + vPressure * 0.14 + uInteractionEnergy * 0.2 + uSurge * 0.28;

  gl_FragColor = vec4(color, uAlpha);
}
`;

const haloVertexShader = `
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const haloFragmentShader = `
uniform vec3 uGlowColor;
uniform float uTime;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float rim = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 3.0);
  float breathe = 0.72 + 0.28 * sin(uTime * 1.5);
  gl_FragColor = vec4(uGlowColor * (0.72 + breathe * 0.42), rim * 0.28);
}
`;

const eventHorizonVertexShader = `
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const eventHorizonFragmentShader = `
uniform vec3 uGlowColor;
uniform vec3 uHotColor;
uniform float uTime;
uniform float uInteractionEnergy;
uniform float uSurge;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float rim = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 2.1);
  float flicker = 0.82 + 0.18 * sin(uTime * 1.7 + vWorldPosition.y * 5.0 + uInteractionEnergy * 3.2 + uSurge * 6.0);
  vec3 color = mix(uGlowColor, uHotColor, 0.42) * (1.6 + flicker + uInteractionEnergy * 0.4 + uSurge * 0.55);
  gl_FragColor = vec4(color, rim * (0.32 + uInteractionEnergy * 0.18 + uSurge * 0.2));
}
`;

export function EnergyCore() {
  const groupRef = useRef<THREE.Group>(null);
  const coreMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const wireMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const haloMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const horizonGlowRef = useRef<THREE.ShaderMaterial>(null);
  const peelRefs = useRef<THREE.Group[]>([]);
  const peelMaterialRefs = useRef<THREE.ShaderMaterial[]>([]);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(sceneConfig.core.size, 5), []);
  const horizonGeometry = useMemo(() => new THREE.SphereGeometry(sceneConfig.core.size * 0.58, 48, 32), []);
  const horizonGlowGeometry = useMemo(() => new THREE.SphereGeometry(sceneConfig.core.size * 0.86, 48, 32), []);
  const peelGeometry = useMemo(() => new THREE.IcosahedronGeometry(sceneConfig.core.size * 0.24, 3), []);
  const peelMotions = useMemo(
    () => [
      { dir: new THREE.Vector3(0.8, 0.22, 0.5).normalize(), phase: 0.1, speed: 0.48, scale: [1.25, 0.64, 0.9] },
      { dir: new THREE.Vector3(-0.45, 0.68, 0.58).normalize(), phase: 2.2, speed: 0.37, scale: [0.85, 1.22, 0.72] },
      { dir: new THREE.Vector3(0.12, -0.72, 0.68).normalize(), phase: 4.1, speed: 0.42, scale: [0.72, 0.92, 1.38] },
      { dir: new THREE.Vector3(-0.78, -0.28, -0.42).normalize(), phase: 5.7, speed: 0.33, scale: [1.1, 0.76, 0.82] },
    ],
    [],
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistortion: { value: sceneConfig.core.distortion },
      uInteraction: { value: new THREE.Vector2() },
      uInteractionEnergy: { value: 0 },
      uRingFlux: { value: 0 },
      uSurge: { value: 0 },
      uCoreColor: { value: new THREE.Color(sceneConfig.colors.core) },
      uHotColor: { value: new THREE.Color(sceneConfig.colors.coreHot) },
      uAlpha: { value: 0.96 },
    }),
    [],
  );

  const wireUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistortion: { value: sceneConfig.core.distortion * 1.1 },
      uInteraction: { value: new THREE.Vector2() },
      uInteractionEnergy: { value: 0 },
      uRingFlux: { value: 0 },
      uSurge: { value: 0 },
      uCoreColor: { value: new THREE.Color(sceneConfig.colors.glow) },
      uHotColor: { value: new THREE.Color(sceneConfig.colors.coreHot) },
      uAlpha: { value: 0.18 },
    }),
    [],
  );

  const haloUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistortion: { value: sceneConfig.core.distortion * 0.9 },
      uInteraction: { value: new THREE.Vector2() },
      uInteractionEnergy: { value: 0 },
      uRingFlux: { value: 0 },
      uSurge: { value: 0 },
      uCoreColor: { value: new THREE.Color(sceneConfig.colors.core) },
      uHotColor: { value: new THREE.Color(sceneConfig.colors.coreHot) },
      uAlpha: { value: 1 },
      uGlowColor: { value: new THREE.Color(sceneConfig.colors.glow) },
    }),
    [],
  );

  const peelUniforms = useMemo(
    () =>
      peelMotions.map(() => ({
        uTime: { value: 0 },
        uDistortion: { value: sceneConfig.core.distortion * 0.42 },
        uInteraction: { value: new THREE.Vector2() },
        uInteractionEnergy: { value: 0 },
        uRingFlux: { value: 0 },
        uSurge: { value: 0 },
        uCoreColor: { value: new THREE.Color(sceneConfig.colors.core) },
        uHotColor: { value: new THREE.Color(sceneConfig.colors.coreHot) },
        uAlpha: { value: 0.32 },
      })),
    [peelMotions],
  );

  const horizonGlowUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInteractionEnergy: { value: 0 },
      uSurge: { value: 0 },
      uGlowColor: { value: new THREE.Color(sceneConfig.colors.glow) },
      uHotColor: { value: new THREE.Color(sceneConfig.colors.coreHot) },
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime * sceneConfig.core.pulseSpeed;
    const pointer = interactionState.smoothPointer;
    const interactionEnergy = interactionState.energy;
    const ringFlux = interactionState.ringFlux;
    const surge = interactionState.surge;

    const syncInteractionUniforms = (material: THREE.ShaderMaterial | null) => {
      if (!material) return;
      if (material.uniforms.uInteraction) material.uniforms.uInteraction.value.copy(pointer);
      if (material.uniforms.uInteractionEnergy) material.uniforms.uInteractionEnergy.value = interactionEnergy;
      if (material.uniforms.uRingFlux) material.uniforms.uRingFlux.value = ringFlux;
      if (material.uniforms.uSurge) material.uniforms.uSurge.value = surge;
    };

    if (coreMaterialRef.current) coreMaterialRef.current.uniforms.uTime.value = time;
    if (wireMaterialRef.current) wireMaterialRef.current.uniforms.uTime.value = time;
    if (haloMaterialRef.current) haloMaterialRef.current.uniforms.uTime.value = time;
    if (horizonGlowRef.current) horizonGlowRef.current.uniforms.uTime.value = time;
    if (horizonGlowRef.current) horizonGlowRef.current.uniforms.uInteractionEnergy.value = interactionEnergy;
    if (horizonGlowRef.current) horizonGlowRef.current.uniforms.uSurge.value = surge;

    syncInteractionUniforms(coreMaterialRef.current);
    syncInteractionUniforms(wireMaterialRef.current);
    syncInteractionUniforms(haloMaterialRef.current);
    peelMaterialRefs.current.forEach((material, index) => {
      material.uniforms.uTime.value = time + peelMotions[index].phase;
      syncInteractionUniforms(material);
    });

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (sceneConfig.core.rotationSpeed + interactionEnergy * 0.05 + surge * 0.08);
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.18) * 0.08 + pointer.y * 0.08;
      groupRef.current.rotation.z = pointer.x * 0.06;
    }

    peelRefs.current.forEach((blob, index) => {
      const motion = peelMotions[index];
      const pulse = Math.pow(0.5 + 0.5 * Math.sin(time * motion.speed + motion.phase), 2.6);
      const distance = sceneConfig.core.size * (0.72 + pulse * 0.34);
      const drift = new THREE.Vector3(
        Math.sin(time * 0.31 + motion.phase) * 0.045,
        Math.cos(time * 0.27 + motion.phase) * 0.035,
        Math.sin(time * 0.21 + motion.phase * 1.4) * 0.04,
      );

      blob.position.copy(motion.dir).multiplyScalar(distance).add(drift);
      blob.scale.set(
        motion.scale[0] * (0.45 + pulse * 0.36),
        motion.scale[1] * (0.34 + pulse * 0.28),
        motion.scale[2] * (0.38 + pulse * 0.32),
      );
      blob.rotation.x += delta * (0.12 + index * 0.035);
      blob.rotation.y += delta * (0.18 - index * 0.022);
      blob.rotation.z += delta * (0.08 + motion.speed * 0.12);
    });
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={coreMaterialRef}
          uniforms={uniforms}
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          transparent
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={geometry} scale={1.012}>
        <shaderMaterial
          ref={wireMaterialRef}
          uniforms={wireUniforms}
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          wireframe
          transparent
          opacity={0.34}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={geometry} scale={1.42}>
        <shaderMaterial
          ref={haloMaterialRef}
          uniforms={haloUniforms}
          vertexShader={coreVertexShader}
          fragmentShader={haloFragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh geometry={horizonGlowGeometry} renderOrder={90}>
        <shaderMaterial
          ref={horizonGlowRef}
          uniforms={horizonGlowUniforms}
          vertexShader={eventHorizonVertexShader}
          fragmentShader={eventHorizonFragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh geometry={horizonGeometry} renderOrder={100}>
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={1}
          depthTest={false}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {peelMotions.map((_, index) => (
        <group
          key={index}
          ref={(group) => {
            if (group) peelRefs.current[index] = group;
          }}
        >
          <mesh geometry={peelGeometry}>
            <shaderMaterial
              ref={(material) => {
                if (material) peelMaterialRefs.current[index] = material;
              }}
              uniforms={peelUniforms[index]}
              vertexShader={coreVertexShader}
              fragmentShader={coreFragmentShader}
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
