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
uniform vec2 uMouse;
uniform float uInteraction;
uniform float uRingFlux;
uniform float uPulse;
uniform float uSurge;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vStress;

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
  float amp = 0.52;
  for (int i = 0; i < 4; i++) {
    value += noise(p) * amp;
    p *= 2.08;
    amp *= 0.5;
  }
  return value;
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec3 dir = normalize(position);
  vec2 mouseDir = normalize(uMouse + vec2(0.0001));
  float align = 0.5 + 0.5 * dot(normalize(dir.xy + vec2(0.0001)), mouseDir);

  float baseNoise = fbm(dir * 4.8 + vec3(uTime * 0.15, -uTime * 0.13, uTime * 0.17));
  float pulseWave = sin(uTime * 1.8 + dot(dir.xy, mouseDir) * 8.0 + baseNoise * 3.0);
  float strain = (baseNoise - 0.5) * 0.08 + pulseWave * 0.02;
  strain += align * uInteraction * 0.12;
  strain += uRingFlux * (0.05 + 0.03 * sin(uTime * 0.9 + dir.y * 7.0));
  strain += (uPulse - 0.5) * 0.05;
  strain += uSurge * (0.045 + 0.025 * sin(uTime * 2.4 + dir.y * 12.0));

  vec3 displaced = position + dir * strain;
  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = world.xyz;
  vStress = clamp(abs(strain) * 16.0 + align * uInteraction * 0.5, 0.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragmentShader = `
uniform vec3 uGlow;
uniform vec3 uHot;
uniform float uTime;
uniform float uInteraction;
uniform float uRingFlux;
uniform float uSurge;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vStress;

void main() {
  float lat = abs(fract(vUv.y * 24.0 + sin(uTime * 0.3 + vUv.x * 8.0) * 0.12) - 0.5);
  float lon = abs(fract(vUv.x * 38.0 + sin(uTime * 0.42 + vUv.y * 6.0) * 0.16) - 0.5);
  float bands = smoothstep(0.075, 0.01, min(lat, lon));

  float plasma = 0.5 + 0.5 * sin(vUv.x * 62.0 + vUv.y * 37.0 + uTime * 1.8);
  float edge = pow(1.0 - max(dot(normalize(cameraPosition - vWorldPosition), normalize(vNormal)), 0.0), 2.5);
  float tension = clamp(vStress + uRingFlux * 0.55 + uInteraction * 0.45 + uSurge * 0.85, 0.0, 1.0);

  vec3 color = mix(uGlow, uHot, 0.35 + plasma * 0.35 + tension * 0.2);
  color += uHot * edge * (0.45 + tension * 0.85);

  float alpha = bands * (0.2 + tension * 0.55) + edge * (0.14 + uSurge * 0.2);
  gl_FragColor = vec4(color, alpha);
}
`;

export function ContainmentMesh() {
  const outerRef = useRef<THREE.ShaderMaterial>(null);
  const innerRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(sceneConfig.core.size * 2.28, 6), []);
  const innerGeometry = useMemo(() => new THREE.IcosahedronGeometry(sceneConfig.core.size * 1.86, 4), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uInteraction: { value: 0 },
      uRingFlux: { value: 0 },
      uPulse: { value: 0 },
      uSurge: { value: 0 },
      uGlow: { value: new THREE.Color(sceneConfig.colors.glow) },
      uHot: { value: new THREE.Color(sceneConfig.colors.coreHot) },
    }),
    [],
  );

  const innerUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uInteraction: { value: 0 },
      uRingFlux: { value: 0 },
      uPulse: { value: 0 },
      uSurge: { value: 0 },
      uGlow: { value: new THREE.Color(sceneConfig.colors.core) },
      uHot: { value: new THREE.Color(sceneConfig.colors.glow) },
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    const smoothedFlux = THREE.MathUtils.lerp(uniforms.uRingFlux.value, interactionState.ringFlux, 1 - Math.exp(-4 * delta));

    const applyUniforms = (target: typeof uniforms) => {
      target.uTime.value = time;
      target.uMouse.value.copy(interactionState.smoothPointer);
      target.uInteraction.value = interactionState.energy;
      target.uRingFlux.value = smoothedFlux;
      target.uPulse.value = interactionState.pulse;
      target.uSurge.value = interactionState.surge;
    };

    applyUniforms(uniforms);
    applyUniforms(innerUniforms);
  });

  return (
    <group>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={outerRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          wireframe
        />
      </mesh>
      <mesh geometry={geometry} scale={1.03}>
        <meshBasicMaterial
          color={sceneConfig.colors.glow}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={innerGeometry}>
        <shaderMaterial
          ref={innerRef}
          uniforms={innerUniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

