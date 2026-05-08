/*
 * Meow Astral Core
 * Copyright (c) 2026 Meow. All rights reserved.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { interactionState } from '../config/interactionState';

const vertexShader = `
uniform float uTime;
uniform float uPixelRatio;
uniform float uSurge;
attribute float aSeed;
attribute float aSize;
varying float vAlpha;

void main() {
  vec3 pos = position;
  float drift = fract(aSeed * 7.0 + uTime * (0.03 + aSeed * 0.04));
  pos.z += (drift - 0.5) * 8.0;
  pos.x += sin(uTime * 0.2 + aSeed * 30.0) * 0.08;
  pos.y += cos(uTime * 0.17 + aSeed * 24.0) * 0.06;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp((20.0 * aSize * uPixelRatio) / -mvPosition.z, 0.8, 6.8);

  float depthFade = smoothstep(-7.5, -0.2, mvPosition.z) * (1.0 - smoothstep(-0.4, 0.5, mvPosition.z));
  vAlpha = depthFade * (0.26 + uSurge * 0.35);
}
`;

const fragmentShader = `
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float circle = smoothstep(0.5, 0.04, length(uv));
  vec3 color = mix(vec3(0.42, 0.2, 0.86), vec3(1.0, 0.42, 0.94), circle);
  gl_FragColor = vec4(color, circle * vAlpha);
}
`;

export function ForegroundDust() {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const geometry = useMemo(() => {
    const count = 320;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6.4;
      positions[i * 3 + 2] = -0.8 - Math.random() * 8.2;
      seeds[i] = Math.random();
      sizes[i] = 0.3 + Math.random() * 1.2;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
      uSurge: { value: 0 },
    }),
    [],
  );

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
      groupRef.current.position.copy(camera.position);
      groupRef.current.quaternion.slerp(camera.quaternion, 1 - Math.exp(-2.6 * delta));
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
      materialRef.current.uniforms.uSurge.value = interactionState.surge;
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

