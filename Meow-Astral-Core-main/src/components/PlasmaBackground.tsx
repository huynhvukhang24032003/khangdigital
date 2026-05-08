/*
 * Meow Astral Core
 * Copyright (c) 2026 Meow. All rights reserved.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { interactionState } from '../config/interactionState';
import { sceneConfig } from '../config/sceneConfig';

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uDeep;
uniform vec3 uBlue;
uniform vec3 uPurple;
uniform vec3 uPink;
uniform vec2 uLens;
uniform float uSurge;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.55;
  for (int i = 0; i < 5; i++) {
    value += noise(p) * amp;
    p = mat2(1.62, -1.18, 1.18, 1.62) * p;
    amp *= 0.5;
  }
  return value;
}

float starField(vec2 uv, float scale, float threshold) {
  vec2 grid = floor(uv * scale);
  vec2 local = fract(uv * scale) - 0.5;
  float h = hash(grid);
  float star = smoothstep(threshold, 1.0, h);
  float shape = smoothstep(0.42, 0.02, length(local));
  return star * shape;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;
  vec2 lens = vec2(uLens.x * 0.24, uLens.y * 0.18);
  vec2 lensDelta = uv - lens;
  float lensRadius = length(lensDelta);
  float lensWarp = smoothstep(1.15, 0.1, lensRadius) * (0.035 + uSurge * 0.045);
  uv += normalize(lensDelta + vec2(0.0001)) * lensWarp;

  // Layered noise creates the animated plasma/nebula field without textures.
  float slow = uTime * 0.055;
  float nebula = fbm(uv * 1.18 + vec2(slow, -slow * 0.6));
  float farCloud = fbm(uv * 2.35 + vec2(-slow * 0.65, slow * 0.9));
  float veins = fbm(uv * 4.6 + vec2(-uTime * 0.08, uTime * 0.05));
  float electric = smoothstep(0.63, 0.96, veins + sin((uv.x - uv.y) * 3.4 + uTime * 0.45) * 0.18);

  float radial = 1.0 - smoothstep(0.05, 1.58, length(uv));
  vec3 color = mix(uDeep, uBlue, nebula * 0.72);
  color = mix(color, uPurple, electric * 0.22 + farCloud * 0.16);
  color += uPink * electric * radial * 0.1;
  color += uPurple * radial * 0.1;

  float stars = starField(uv + vec2(uTime * 0.002, -uTime * 0.001), 82.0, 0.982);
  stars += starField(uv + vec2(-uTime * 0.001, uTime * 0.0015), 145.0, 0.992) * 0.8;
  float dust = smoothstep(0.55, 0.98, farCloud) * (1.0 - radial * 0.22);
  color += vec3(0.42, 0.18, 0.9) * dust * 0.09;
  color += mix(vec3(0.55, 0.42, 1.0), vec3(1.0, 0.42, 0.9), radial) * stars * 0.85;

  float vignette = smoothstep(1.55, 0.22, length(uv));
  color *= 0.12 + vignette * 0.64;

  gl_FragColor = vec4(color, 1.0);
}
`;

export function PlasmaBackground() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uDeep: { value: new THREE.Color(sceneConfig.colors.plasmaDeep) },
      uBlue: { value: new THREE.Color(sceneConfig.colors.plasmaBlue) },
      uPurple: { value: new THREE.Color(sceneConfig.colors.plasmaPurple) },
      uPink: { value: new THREE.Color(sceneConfig.colors.coreHot) },
      uLens: { value: new THREE.Vector2() },
      uSurge: { value: 0 },
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
    materialRef.current.uniforms.uLens.value.copy(interactionState.smoothPointer);
    materialRef.current.uniforms.uSurge.value = interactionState.surge;
  });

  return (
    <mesh renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
