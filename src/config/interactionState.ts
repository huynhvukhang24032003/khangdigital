/*
 * Meow Astral Core
 * Copyright (c) 2026 Meow. All rights reserved.
 */

import * as THREE from 'three';

export const interactionState = {
  pointer: new THREE.Vector2(),
  smoothPointer: new THREE.Vector2(),
  velocity: new THREE.Vector2(),
  energy: 0,
  ringFlux: 0,
  pulse: 0,
  surge: 0,
  resonance: 0,
  phase: 0,
};

