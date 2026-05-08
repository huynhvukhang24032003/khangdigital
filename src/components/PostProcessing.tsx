/*
 * Meow Astral Core
 * Copyright (c) 2026 Meow. All rights reserved.
 */

import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useMemo } from 'react';
import * as THREE from 'three';
import { sceneConfig } from '../config/sceneConfig';

export function PostProcessing() {
  const chromaOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0008), []);

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={sceneConfig.bloom.intensity}
        luminanceThreshold={sceneConfig.bloom.luminanceThreshold}
        luminanceSmoothing={sceneConfig.bloom.luminanceSmoothing}
        mipmapBlur
      />
      <ChromaticAberration offset={chromaOffset} radialModulation modulationOffset={0.2} />
      <Noise opacity={0.016} premultiply />
      <Vignette eskil={false} offset={0.18} darkness={0.72} />
    </EffectComposer>
  );
}
