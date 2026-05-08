/*
 * Meow Astral Core
 * Copyright (c) 2026 Meow. All rights reserved.
 */

export const sceneConfig = {
  colors: {
    background: '#05020c',
    plasmaDeep: '#07011d',
    plasmaBlue: '#131251',
    plasmaPurple: '#5b16ff',
    glow: '#d64dff',
    core: '#8f2cff',
    coreHot: '#ff4fd8',
    cyan: '#ff4fd8',
    singularity: '#010006',
    ring: '#07050f',
    ringEdge: '#ff4fd8',
    particle: '#ff4fd8',
  },
  core: {
    size: 0.68,
    distortion: 0.74,
    pulseSpeed: 0.76,
    rotationSpeed: 0.09,
  },
  rings: {
    rotationSpeed: 0.22,
  },
  particles: {
    count: 1450,
    radius: 5.4,
    speed: 0.095,
  },
  accretionDisk: {
    count: 2400,
    innerRadius: 0.62,
    outerRadius: 4.4,
    speed: 0.38,
    tilt: [0.78, 0.18, -0.22],
  },
  bloom: {
    intensity: 1.35,
    luminanceThreshold: 0.44,
    luminanceSmoothing: 0.26,
  },
  camera: {
    radius: 5.8,
    orbitSpeed: 0.055,
    zoomRange: 0.35,
  },
} as const;
