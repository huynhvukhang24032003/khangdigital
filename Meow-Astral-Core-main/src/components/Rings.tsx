/*
 * Meow Astral Core
 * Copyright (c) 2026 Meow. All rights reserved.
 */

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { interactionState } from '../config/interactionState';

type MajorRing = {
  name: string;
  radius: number;
  width: number;
  depth: number;
  compassRotation: [number, number, number];
  chaosRotation: [number, number, number];
  chaosOffset: [number, number, number];
  spinSpeed: number;
  tickCount: number;
  symbolCount: number;
  runeOffset: number;
  relicSeed: number;
  pieces: Array<{ start: number; length: number; drift: [number, number, number] }>;
  fragments: number[];
  impacts?: Array<{ angle: number; severity: number; offset: number }>;
};

type DebrisShard = {
  angle: number;
  radius: number;
  z: number;
  size: [number, number, number];
  spin: [number, number, number];
  phase: number;
  material: 'brass' | 'edge' | 'dark' | 'glow';
};

const majorRings: MajorRing[] = [
  {
    name: 'outer-celestial-ring',
    radius: 3.35,
    width: 0.18,
    depth: 0.105,
    compassRotation: [Math.PI / 2, 0.18, -0.12],
    chaosRotation: [Math.PI / 2 + 0.1, 0.24, -0.18],
    chaosOffset: [0.03, -0.02, 0.04],
    spinSpeed: 0.055,
    tickCount: 144,
    symbolCount: 24,
    runeOffset: 0.04,
    relicSeed: 1.1,
    pieces: [
      { start: 0.08, length: Math.PI * 0.62, drift: [0.04, -0.02, 0.03] },
      { start: Math.PI * 0.82, length: Math.PI * 0.74, drift: [-0.08, 0.04, -0.04] },
      { start: Math.PI * 1.66, length: Math.PI * 0.22, drift: [0.07, 0.05, 0.02] },
      { start: Math.PI * 1.96, length: Math.PI * 0.36, drift: [-0.04, -0.04, 0.05] },
    ],
    fragments: [0.33, 0.86, 2.48, 3.18, 4.95, 5.88],
    impacts: [
      { angle: 0.56, severity: 1.18, offset: 0.25 },
      { angle: 0.92, severity: 1.42, offset: -0.16 },
      { angle: 2.18, severity: 0.92, offset: -0.18 },
      { angle: 3.74, severity: 1.36, offset: 0.2 },
      { angle: 4.34, severity: 1.55, offset: -0.22 },
      { angle: 4.92, severity: 1.28, offset: 0.14 },
      { angle: 5.42, severity: 1.3, offset: 0.24 },
      { angle: 5.78, severity: 0.78, offset: -0.26 },
    ],
  },
  {
    name: 'meridian-ring',
    radius: 2.92,
    width: 0.145,
    depth: 0.085,
    compassRotation: [1.42, -0.46, 0.28],
    chaosRotation: [1.5, -0.52, 0.36],
    chaosOffset: [-0.05, 0.03, -0.03],
    spinSpeed: -0.045,
    tickCount: 120,
    symbolCount: 24,
    runeOffset: -0.02,
    relicSeed: 2.4,
    pieces: [
      { start: 0.08, length: Math.PI * 0.86, drift: [0.1, -0.03, 0.08] },
      { start: Math.PI * 1.08, length: Math.PI * 0.78, drift: [-0.08, 0.06, -0.04] },
    ],
    fragments: [0.03, 3.16, 5.46],
    impacts: [
      { angle: 0.12, severity: 0.66, offset: 0.2 },
      { angle: 3.1, severity: 0.78, offset: -0.12 },
    ],
  },
  {
    name: 'tilted-armillary-ring',
    radius: 2.48,
    width: 0.12,
    depth: 0.072,
    compassRotation: [0.76, 0.82, -0.58],
    chaosRotation: [0.7, 0.92, -0.64],
    chaosOffset: [0.03, 0.04, -0.03],
    spinSpeed: 0.07,
    tickCount: 96,
    symbolCount: 16,
    runeOffset: 0.08,
    relicSeed: 3.8,
    pieces: [
      { start: 0.0, length: Math.PI * 0.72, drift: [0.07, 0.08, 0.03] },
      { start: Math.PI * 0.92, length: Math.PI * 0.66, drift: [-0.04, -0.06, 0.07] },
      { start: Math.PI * 1.78, length: Math.PI * 0.18, drift: [0.03, 0.02, -0.1] },
    ],
    fragments: [1.02, 2.91, 5.82],
    impacts: [
      { angle: 1.08, severity: 0.62, offset: -0.18 },
      { angle: 5.76, severity: 0.7, offset: 0.16 },
    ],
  },
  {
    name: 'inner-equator-ring',
    radius: 2.05,
    width: 0.105,
    depth: 0.064,
    compassRotation: [0.16, 0.08, 0.04],
    chaosRotation: [0.2, 0.02, 0.08],
    chaosOffset: [-0.02, -0.01, 0.02],
    spinSpeed: -0.09,
    tickCount: 128,
    symbolCount: 24,
    runeOffset: 0,
    relicSeed: 5.2,
    pieces: [
      { start: 0.1, length: Math.PI * 0.24, drift: [0.12, -0.06, 0.07] },
      { start: Math.PI * 0.48, length: Math.PI * 0.32, drift: [-0.08, 0.08, -0.06] },
      { start: Math.PI * 0.96, length: Math.PI * 0.18, drift: [0.06, 0.12, 0.04] },
      { start: Math.PI * 1.36, length: Math.PI * 0.26, drift: [-0.11, -0.05, 0.08] },
      { start: Math.PI * 1.78, length: Math.PI * 0.14, drift: [0.09, -0.1, -0.05] },
    ],
    fragments: [0.18, 0.78, 1.66, 2.48, 3.54, 4.28, 5.34],
    impacts: [
      { angle: 0.68, severity: 0.86, offset: -0.28 },
      { angle: 2.52, severity: 0.78, offset: 0.24 },
      { angle: 4.18, severity: 0.92, offset: -0.2 },
    ],
  },
  {
    name: 'core-compass-ring',
    radius: 1.58,
    width: 0.086,
    depth: 0.052,
    compassRotation: [1.18, -0.18, 0.1],
    chaosRotation: [1.24, -0.22, 0.16],
    chaosOffset: [0.01, -0.03, 0.02],
    spinSpeed: 0.12,
    tickCount: 96,
    symbolCount: 16,
    runeOffset: 0.12,
    relicSeed: 6.6,
    pieces: [
      { start: 0.16, length: Math.PI * 0.2, drift: [0.08, -0.08, 0.06] },
      { start: Math.PI * 0.58, length: Math.PI * 0.22, drift: [-0.1, 0.06, -0.04] },
      { start: Math.PI * 1.08, length: Math.PI * 0.18, drift: [0.07, 0.08, 0.07] },
      { start: Math.PI * 1.55, length: Math.PI * 0.16, drift: [-0.08, -0.07, -0.06] },
    ],
    fragments: [0.05, 0.92, 1.82, 3.4, 4.72, 5.5],
    impacts: [
      { angle: 0.9, severity: 0.76, offset: -0.22 },
      { angle: 3.36, severity: 0.66, offset: 0.18 },
      { angle: 4.7, severity: 0.82, offset: 0.2 },
    ],
  },
];

function ringPoint(angle: number, radius: number, z = 0): [number, number, number] {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius, z];
}

function normalizedAngle(angle: number) {
  return THREE.MathUtils.euclideanModulo(angle, Math.PI * 2);
}

function angleInPieces(angle: number, pieces: MajorRing['pieces'], padding = 0.018) {
  const normalized = normalizedAngle(angle);
  return pieces.some((piece) => {
    const start = normalizedAngle(piece.start - padding);
    const end = piece.start + piece.length + padding;
    const span = piece.length + padding * 2;
    if (span >= Math.PI * 2) return true;
    const normalizedEnd = normalizedAngle(end);
    if (start <= normalizedEnd) return normalized >= start && normalized <= normalizedEnd;
    return normalized >= start || normalized <= normalizedEnd;
  });
}

function seededRandom(seed: number) {
  return THREE.MathUtils.euclideanModulo(Math.sin(seed * 12.9898) * 43758.5453, 1);
}

function ageField(angle: number, seed: number) {
  return (
    Math.sin(angle * 9.7 + seed * 1.8) * 0.42 +
    Math.sin(angle * 17.3 + seed * 3.1) * 0.28 +
    Math.sin(angle * 31.0 + seed * 0.7) * 0.16
  );
}

function tangentRotation(angle: number): [number, number, number] {
  return [0, 0, angle + Math.PI / 2];
}

function createSculptedBandGeometry(
  radius: number,
  width: number,
  depth: number,
  seed = 0,
  segments = 224,
  start = 0,
  length = Math.PI * 2,
) {
  const profile = [
    [-0.5, -0.32],
    [-0.43, -0.5],
    [-0.16, -0.5],
    [-0.08, -0.36],
    [0.08, -0.36],
    [0.16, -0.5],
    [0.43, -0.5],
    [0.5, -0.32],
    [0.5, 0.32],
    [0.43, 0.5],
    [0.16, 0.5],
    [0.08, 0.36],
    [-0.08, 0.36],
    [-0.16, 0.5],
    [-0.43, 0.5],
    [-0.5, 0.32],
  ];

  const vertices: number[] = [];
  const indices: number[] = [];
  const profileCount = profile.length;

  const isClosed = Math.abs(length - Math.PI * 2) < 0.001;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = start + t * length;
    const handcrafted =
      Math.sin(angle * 3 + seed) * width * 0.018 +
      Math.sin(angle * 7.3 + seed * 1.7) * width * 0.012;
    const broadDent = Math.min(
      Math.pow(Math.max(Math.sin(angle * 2.35 + seed * 0.84), 0), 8),
      Math.pow(Math.max(Math.sin(angle * 3.65 + seed * 1.36), 0), 10),
    );
    const ageWarp = ageField(angle, seed) * width * 0.014 - broadDent * width * 0.035;

    for (const [radial, z] of profile) {
      const edgeWear = Math.pow(Math.abs(radial), 1.8) * Math.sin(angle * 23.0 + z * 6.0 + seed) * width * 0.016;
      const chippedLip = Math.abs(radial) > 0.42 && Math.sin(angle * 38.0 + seed * 2.4) > 0.72 ? -width * 0.026 : 0;
      const carvedStep = Math.sign(radial) * Math.sin(angle * 12 + seed) * width * 0.007;
      const zCrush = Math.sin(angle * 19.0 + radial * 8.0 + seed) * depth * 0.035 + broadDent * depth * 0.16 * Math.sign(z);
      const r = radius + radial * width + handcrafted + carvedStep + ageWarp + edgeWear + chippedLip;
      vertices.push(Math.cos(angle) * r, Math.sin(angle) * r, z * depth + zCrush);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < profileCount; j++) {
      const nextJ = (j + 1) % profileCount;
      const a = i * profileCount + j;
      const b = (i + 1) * profileCount + j;
      const c = (i + 1) * profileCount + nextJ;
      const d = i * profileCount + nextJ;
      indices.push(a, b, d, b, c, d);
    }
  }

  if (!isClosed) {
    const addCap = (ringIndex: number, flip: boolean) => {
      const base = ringIndex * profileCount;
      const centerIndex = vertices.length / 3;
      const centerAngle = start + (ringIndex / segments) * length;
      vertices.push(Math.cos(centerAngle) * radius, Math.sin(centerAngle) * radius, 0);

      for (let j = 0; j < profileCount; j++) {
        const nextJ = (j + 1) % profileCount;
        if (flip) indices.push(centerIndex, base + nextJ, base + j);
        else indices.push(centerIndex, base + j, base + nextJ);
      }
    };

    addCap(0, true);
    addCap(segments, false);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Band({
  ring,
  piece,
  material,
}: {
  ring: MajorRing;
  piece: MajorRing['pieces'][number];
  material: THREE.Material;
}) {
  const geometry = useMemo(
    () => createSculptedBandGeometry(ring.radius, ring.width, ring.depth, ring.radius, 224, piece.start, piece.length),
    [piece.length, piece.start, ring.depth, ring.radius, ring.width],
  );
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}

function SurfaceBand({
  radius,
  width,
  depth,
  z,
  material,
  seed,
  start = 0,
  length = Math.PI * 2,
}: {
  radius: number;
  width: number;
  depth: number;
  z: number;
  material: THREE.Material;
  seed: number;
  start?: number;
  length?: number;
}) {
  const geometry = useMemo(
    () => createSculptedBandGeometry(radius, width, depth, seed, 192, start, length),
    [depth, length, radius, seed, start, width],
  );
  return <mesh geometry={geometry} material={material} position={[0, 0, z]} />;
}

function EngravedGrooves({
  ring,
  material,
}: {
  ring: MajorRing;
  material: THREE.Material;
}) {
  const frontZ = ring.depth * 0.54;
  const backZ = -ring.depth * 0.54;
  const grooveWidth = Math.max(ring.width * 0.055, 0.006);

  return (
    <>
      {ring.pieces.flatMap((piece, pieceIndex) =>
        [ring.radius - ring.width * 0.31, ring.radius + ring.width * 0.31].map((radius, index) => (
          <SurfaceBand
            key={`${pieceIndex}-${index}`}
            radius={radius}
            width={grooveWidth}
            depth={ring.depth * 0.05}
            z={frontZ}
            material={material}
            seed={ring.radius + index + pieceIndex * 0.37}
            start={piece.start}
            length={piece.length}
          />
        )),
      )}
      {ring.pieces.map((piece, pieceIndex) => (
        <SurfaceBand
          key={`back-${pieceIndex}`}
          radius={ring.radius}
          width={grooveWidth * 0.72}
          depth={ring.depth * 0.04}
          z={backZ}
          material={material}
          seed={ring.radius * 2 + pieceIndex * 0.53}
          start={piece.start}
          length={piece.length}
        />
      ))}
    </>
  );
}

function RaisedRims({
  ring,
  material,
}: {
  ring: MajorRing;
  material: THREE.Material;
}) {
  const frontZ = ring.depth * 0.66;
  const rimWidth = ring.width * 0.08;

  return (
    <>
      {ring.pieces.flatMap((piece, pieceIndex) => [
        <SurfaceBand
          key={`inner-${pieceIndex}`}
          radius={ring.radius - ring.width * 0.43}
          width={rimWidth}
          depth={ring.depth * 0.14}
          z={frontZ}
          material={material}
          seed={ring.radius * 3.1 + pieceIndex * 0.41}
          start={piece.start}
          length={piece.length}
        />,
        <SurfaceBand
          key={`outer-${pieceIndex}`}
          radius={ring.radius + ring.width * 0.43}
          width={rimWidth}
          depth={ring.depth * 0.14}
          z={frontZ}
          material={material}
          seed={ring.radius * 4.1 + pieceIndex * 0.47}
          start={piece.start}
          length={piece.length}
        />,
      ])}
    </>
  );
}

function CalibrationMarks({
  ring,
  dark,
  glow,
}: {
  ring: MajorRing;
  dark: THREE.Material;
  glow: THREE.Material;
}) {
  const frontZ = ring.depth * 0.58;

  return (
    <>
      {Array.from({ length: ring.tickCount }, (_, index) => {
        const angle = (index / ring.tickCount) * Math.PI * 2;
        if (!angleInPieces(angle, ring.pieces, 0.03)) return null;
        const major = index % 12 === 0;
        const medium = index % 4 === 0;
        return (
          <group
            key={index}
            position={ringPoint(angle, ring.radius + ring.runeOffset, frontZ)}
            rotation={tangentRotation(angle)}
          >
            <mesh material={major ? glow : dark}>
              <boxGeometry
                args={[
                  major ? ring.width * 0.92 : medium ? ring.width * 0.56 : ring.width * 0.34,
                  ring.width * 0.028,
                  0.006,
                ]}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function SymbolPanels({
  ring,
  dark,
  glow,
}: {
  ring: MajorRing;
  dark: THREE.Material;
  glow: THREE.Material;
}) {
  const frontZ = ring.depth * 0.61;
  const radius = ring.radius - ring.width * 0.02;

  return (
    <>
      {Array.from({ length: ring.symbolCount }, (_, index) => {
        const angle = (index / ring.symbolCount) * Math.PI * 2 + Math.PI / ring.symbolCount;
        if (!angleInPieces(angle, ring.pieces, 0.04)) return null;
        const isCardinal = index % 4 === 0;
        return (
          <group key={index} position={ringPoint(angle, radius, frontZ)} rotation={tangentRotation(angle)}>
            <mesh material={dark}>
              <boxGeometry args={[ring.width * 1.18, ring.width * 0.1, 0.008]} />
            </mesh>
            <mesh material={isCardinal ? glow : dark} position={[0, ring.width * 0.055, 0.003]}>
              <boxGeometry args={[ring.width * 0.62, ring.width * 0.045, 0.009]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function StabilizerJoints({
  ring,
  brass,
  dark,
  glow,
}: {
  ring: MajorRing;
  brass: THREE.Material;
  dark: THREE.Material;
  glow: THREE.Material;
}) {
  const frontZ = ring.depth * 0.7;
  const count = ring.radius > 2.6 ? 4 : 3;

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + ring.radius * 0.17;
        if (!angleInPieces(angle, ring.pieces, 0.05)) return null;
        return (
          <group key={index} position={ringPoint(angle, ring.radius, frontZ)} rotation={tangentRotation(angle)}>
            <mesh material={brass}>
              <boxGeometry args={[ring.width * 1.34, ring.width * 0.28, ring.depth * 0.24]} />
            </mesh>
            <mesh material={dark} position={[0, 0, ring.depth * 0.13]}>
              <boxGeometry args={[ring.width * 0.82, ring.width * 0.055, ring.depth * 0.035]} />
            </mesh>
            <mesh material={glow} position={[ring.width * 0.34, 0, ring.depth * 0.16]}>
              <boxGeometry args={[ring.width * 0.16, ring.width * 0.07, ring.depth * 0.04]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function GlyphCluster({
  scale,
  material,
  variant,
  glow = false,
}: {
  scale: number;
  material: THREE.Material;
  variant: number;
  glow?: boolean;
}) {
  const stroke = scale * 0.055;
  const length = scale * 0.34;
  const short = scale * 0.2;
  const z = glow ? 0.006 : 0;

  if (variant % 4 === 0) {
    return (
      <group position={[0, 0, z]}>
        <mesh material={material} position={[0, 0, 0]}>
          <boxGeometry args={[length, stroke, 0.008]} />
        </mesh>
        <mesh material={material} position={[-length * 0.34, stroke * 1.7, 0]}>
          <boxGeometry args={[stroke, short, 0.008]} />
        </mesh>
        <mesh material={material} position={[length * 0.28, -stroke * 1.6, 0]}>
          <boxGeometry args={[stroke, short * 0.9, 0.008]} />
        </mesh>
        <mesh material={material} position={[0, -stroke * 3.0, 0]}>
          <boxGeometry args={[short, stroke, 0.008]} />
        </mesh>
      </group>
    );
  }

  if (variant % 4 === 1) {
    return (
      <group position={[0, 0, z]}>
        <mesh material={material} position={[0, stroke * 2.1, 0]}>
          <boxGeometry args={[length * 0.82, stroke, 0.008]} />
        </mesh>
        <mesh material={material} position={[0, -stroke * 2.1, 0]}>
          <boxGeometry args={[length * 0.82, stroke, 0.008]} />
        </mesh>
        <mesh material={material} position={[-length * 0.38, 0, 0]}>
          <boxGeometry args={[stroke, short * 1.2, 0.008]} />
        </mesh>
        <mesh material={material} position={[length * 0.38, 0, 0]}>
          <boxGeometry args={[stroke, short * 1.2, 0.008]} />
        </mesh>
      </group>
    );
  }

  if (variant % 4 === 2) {
    return (
      <group position={[0, 0, z]}>
        <mesh material={material} position={[-length * 0.25, 0, 0]}>
          <boxGeometry args={[stroke, short * 1.55, 0.008]} />
        </mesh>
        <mesh material={material} position={[length * 0.08, stroke * 2.4, 0]}>
          <boxGeometry args={[short * 1.05, stroke, 0.008]} />
        </mesh>
        <mesh material={material} position={[length * 0.08, 0, 0]}>
          <boxGeometry args={[short * 0.86, stroke, 0.008]} />
        </mesh>
        <mesh material={material} position={[length * 0.08, -stroke * 2.3, 0]}>
          <boxGeometry args={[short * 1.18, stroke, 0.008]} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, 0, z]}>
      <mesh material={material} position={[0, 0, 0]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[length * 0.9, stroke, 0.008]} />
      </mesh>
      <mesh material={material} position={[0, 0, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[length * 0.9, stroke, 0.008]} />
      </mesh>
      <mesh material={material} position={[0, stroke * 3.1, 0]}>
        <boxGeometry args={[short, stroke, 0.008]} />
      </mesh>
    </group>
  );
}

function SacredGlyphs({
  ring,
  dark,
  glow,
}: {
  ring: MajorRing;
  dark: THREE.Material;
  glow: THREE.Material;
}) {
  const frontZ = ring.depth * 0.74;
  const count = ring.radius > 2.7 ? 7 : ring.radius > 2 ? 6 : 5;

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const offset = Math.sin(ring.relicSeed * 2.1 + index * 1.7) * 0.14;
        const angle = (index / count) * Math.PI * 2 + ring.relicSeed * 0.23 + offset;
        if (!angleInPieces(angle, ring.pieces, 0.05)) return null;
        const glowGlyph = index === 1 || (index + Math.floor(ring.relicSeed)) % 5 === 0;
        return (
          <group
            key={index}
            position={ringPoint(angle, ring.radius + ring.width * (index % 2 === 0 ? -0.12 : 0.14), frontZ)}
            rotation={tangentRotation(angle)}
            scale={[1, 0.82 + (index % 3) * 0.12, 1]}
          >
            <GlyphCluster
              scale={ring.width * 2.05}
              material={glowGlyph ? glow : dark}
              variant={index + Math.floor(ring.relicSeed * 3)}
              glow={glowGlyph}
            />
          </group>
        );
      })}
    </>
  );
}

function CartouchePanels({
  ring,
  dark,
  glow,
}: {
  ring: MajorRing;
  dark: THREE.Material;
  glow: THREE.Material;
}) {
  const frontZ = ring.depth * 0.86;
  const count = ring.radius > 2.7 ? 5 : 4;

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const angle = ring.relicSeed * 0.31 + index * ((Math.PI * 2) / count) + (index % 2) * 0.13;
        if (!angleInPieces(angle, ring.pieces, 0.05)) return null;
        return (
          <group
            key={index}
            position={ringPoint(angle, ring.radius + ring.width * 0.02, frontZ)}
            rotation={tangentRotation(angle)}
          >
            <mesh material={dark}>
              <boxGeometry args={[ring.width * 1.8, ring.width * 0.22, 0.011]} />
            </mesh>
            <mesh material={glow} position={[-ring.width * 0.32, 0, 0.006]}>
              <boxGeometry args={[ring.width * 0.42, ring.width * 0.045, 0.012]} />
            </mesh>
            <mesh material={glow} position={[ring.width * 0.22, ring.width * 0.04, 0.006]}>
              <boxGeometry args={[ring.width * 0.18, ring.width * 0.12, 0.012]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function EnergySeams({
  ring,
  material,
}: {
  ring: MajorRing;
  material: THREE.Material;
}) {
  const frontZ = ring.depth * 0.78;
  const count = ring.radius > 2.7 ? 5 : 4;

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const angle = ring.relicSeed * 0.41 + index * ((Math.PI * 2) / count) + Math.sin(index * 2.2) * 0.22;
        if (!angleInPieces(angle, ring.pieces, 0.04)) return null;
        return (
          <group key={index} position={ringPoint(angle, ring.radius, frontZ)} rotation={tangentRotation(angle)}>
            <mesh material={material}>
              <boxGeometry args={[ring.width * (0.9 + (index % 2) * 0.38), ring.width * 0.03, 0.01]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function AncientWear({
  ring,
  material,
}: {
  ring: MajorRing;
  material: THREE.Material;
}) {
  const frontZ = ring.depth * 0.82;
  const count = ring.name === 'outer-celestial-ring' ? 28 : ring.radius > 2.7 ? 10 : 7;

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const angle = ring.relicSeed * 0.73 + index * 1.31 + Math.sin(index * 1.9) * 0.08;
        if (!angleInPieces(angle, ring.pieces, 0.04)) return null;
        const radius = ring.radius + ring.width * (-0.34 + ((index * 37) % 68) / 100);
        const outer = ring.name === 'outer-celestial-ring';
        return (
          <group key={index} position={ringPoint(angle, radius, frontZ)} rotation={[0, 0, angle + 0.38 + (index % 3) * 0.42]}>
            <mesh material={material}>
              <boxGeometry
                args={[
                  ring.width * (outer ? 0.42 + (index % 5) * 0.18 : 0.18 + (index % 4) * 0.07),
                  ring.width * (outer ? 0.026 + (index % 2) * 0.012 : 0.018),
                  0.01,
                ]}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function PatinaDeposits({
  ring,
  patina,
  soot,
}: {
  ring: MajorRing;
  patina: THREE.Material;
  soot: THREE.Material;
}) {
  const count = ring.name === 'outer-celestial-ring' ? 38 : ring.radius > 2.5 ? 24 : 16;
  const frontZ = ring.depth * 0.95;

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const seed = ring.relicSeed * 10 + index;
        const angle = seededRandom(seed + 0.7) * Math.PI * 2;
        if (!angleInPieces(angle, ring.pieces, 0.025)) return null;
        const edgeBias = seededRandom(seed + 2.2) > 0.55 ? 0.34 : -0.3;
        const radius = ring.radius + ring.width * (edgeBias + (seededRandom(seed + 1.8) - 0.5) * 0.28);
        const patchMaterial = index % 4 === 0 ? soot : patina;
        return (
          <group
            key={index}
            position={ringPoint(angle, radius, frontZ + index * 0.0004)}
            rotation={[0, 0, angle + Math.PI / 2 + (seededRandom(seed + 4.4) - 0.5) * 0.7]}
            scale={[1, 0.55 + seededRandom(seed + 5.1) * 0.65, 1]}
          >
            <mesh material={patchMaterial}>
              <boxGeometry
                args={[
                  ring.width * (0.44 + seededRandom(seed + 6.2) * 0.92),
                  ring.width * (0.12 + seededRandom(seed + 7.5) * 0.24),
                  0.012,
                ]}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function ScratchCloud({
  ring,
  material,
}: {
  ring: MajorRing;
  material: THREE.Material;
}) {
  const count = ring.name === 'outer-celestial-ring' ? 70 : ring.radius > 2.5 ? 46 : 30;
  const frontZ = ring.depth * 1.02;

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const seed = ring.relicSeed * 20 + index;
        const angle = seededRandom(seed + 1.1) * Math.PI * 2;
        if (!angleInPieces(angle, ring.pieces, 0.02)) return null;
        const radius = ring.radius + ring.width * (-0.43 + seededRandom(seed + 2.9) * 0.86);
        return (
          <group
            key={index}
            position={ringPoint(angle, radius, frontZ + index * 0.0002)}
            rotation={[0, 0, angle + Math.PI / 2 + (seededRandom(seed + 3.7) - 0.5) * 1.8]}
          >
            <mesh material={material}>
              <boxGeometry
                args={[
                  ring.width * (0.22 + seededRandom(seed + 4.2) * 0.72),
                  ring.width * (0.012 + seededRandom(seed + 5.8) * 0.018),
                  0.008,
                ]}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function PittedSurface({
  ring,
  soot,
  exposed,
}: {
  ring: MajorRing;
  soot: THREE.Material;
  exposed: THREE.Material;
}) {
  const count = ring.name === 'outer-celestial-ring' ? 120 : ring.radius > 2.5 ? 82 : 54;
  const frontZ = ring.depth * 1.035;

  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const seed = ring.relicSeed * 40 + index;
        const angle = seededRandom(seed + 0.2) * Math.PI * 2;
        if (!angleInPieces(angle, ring.pieces, 0.018)) return null;
        const radius = ring.radius + ring.width * (-0.46 + seededRandom(seed + 1.4) * 0.92);
        const size = ring.width * (0.018 + Math.pow(seededRandom(seed + 2.1), 1.8) * 0.06);
        const material = index % 7 === 0 ? exposed : soot;
        return (
          <group
            key={index}
            position={ringPoint(angle, radius, frontZ + index * 0.00004)}
            rotation={[0, 0, angle + seededRandom(seed + 3.3) * Math.PI]}
            scale={[1.0 + seededRandom(seed + 4.5) * 1.8, 0.58 + seededRandom(seed + 5.6) * 0.75, 1]}
          >
            <mesh material={material}>
              <circleGeometry args={[size, 7]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

const trigramLines = [
  [1, 1, 1],
  [0, 1, 1],
  [1, 0, 1],
  [0, 0, 1],
  [1, 1, 0],
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, 0],
];

function TrigramMark({
  scale,
  material,
  pattern,
}: {
  scale: number;
  material: THREE.Material;
  pattern: number[];
}) {
  const lineWidth = scale * 0.42;
  const gap = scale * 0.075;
  const stroke = scale * 0.035;

  return (
    <group>
      {pattern.map((solid, index) => {
        const y = (1 - index) * gap;
        if (solid) {
          return (
            <mesh key={index} material={material} position={[0, y, 0]}>
              <boxGeometry args={[lineWidth, stroke, 0.01]} />
            </mesh>
          );
        }
        return (
          <group key={index} position={[0, y, 0]}>
            <mesh material={material} position={[-lineWidth * 0.28, 0, 0]}>
              <boxGeometry args={[lineWidth * 0.36, stroke, 0.01]} />
            </mesh>
            <mesh material={material} position={[lineWidth * 0.28, 0, 0]}>
              <boxGeometry args={[lineWidth * 0.36, stroke, 0.01]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BaguaCompass({
  ring,
  dark,
  glow,
}: {
  ring: MajorRing;
  dark: THREE.Material;
  glow: THREE.Material;
}) {
  const frontZ = ring.depth * 1.12;
  const radius = ring.radius + ring.width * 0.02;

  return (
    <>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = index * (Math.PI / 4) + Math.PI / 8;
        if (!angleInPieces(angle, ring.pieces, 0.04)) return null;
        const cardinal = index % 2 === 0;
        return (
          <group key={index} position={ringPoint(angle, radius, frontZ)} rotation={tangentRotation(angle)}>
            <TrigramMark scale={ring.width * 2.55} material={cardinal ? glow : dark} pattern={trigramLines[index]} />
            <mesh material={dark} position={[0, -ring.width * 0.28, -0.002]}>
              <boxGeometry args={[ring.width * 0.7, ring.width * 0.035, 0.008]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function LuopanDegreeBands({
  ring,
  dark,
  glow,
}: {
  ring: MajorRing;
  dark: THREE.Material;
  glow: THREE.Material;
}) {
  const frontZ = ring.depth * 1.08;
  const sectors = ring.radius > 3 ? 24 : ring.radius > 2.5 ? 32 : 16;
  const micro = ring.radius > 2.8 ? 96 : 64;

  return (
    <>
      {Array.from({ length: sectors }, (_, index) => {
        const angle = (index / sectors) * Math.PI * 2;
        if (!angleInPieces(angle, ring.pieces, 0.025)) return null;
        const cardinal = index % Math.max(1, sectors / 8) === 0;
        return (
          <group key={`sector-${index}`} position={ringPoint(angle, ring.radius, frontZ)} rotation={tangentRotation(angle)}>
            <mesh material={cardinal ? glow : dark}>
              <boxGeometry args={[cardinal ? ring.width * 1.72 : ring.width * 1.28, ring.width * 0.035, 0.01]} />
            </mesh>
            <mesh material={dark} position={[0, ring.width * 0.24, 0.004]}>
              <boxGeometry args={[ring.width * 0.16, ring.width * 0.22, 0.008]} />
            </mesh>
          </group>
        );
      })}
      {Array.from({ length: micro }, (_, index) => {
        const angle = (index / micro) * Math.PI * 2;
        if (!angleInPieces(angle, ring.pieces, 0.018)) return null;
        const major = index % 8 === 0;
        const radius = ring.radius + ring.width * (major ? 0.38 : -0.38);
        return (
          <group key={`micro-${index}`} position={ringPoint(angle, radius, frontZ + 0.006)} rotation={tangentRotation(angle)}>
            <mesh material={dark}>
              <boxGeometry args={[ring.width * (major ? 0.5 : 0.28), ring.width * 0.018, 0.007]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function BrokenCompassNeedles({
  material,
  dark,
  glow,
}: {
  material: THREE.Material;
  dark: THREE.Material;
  glow: THREE.Material;
}) {
  return (
    <group rotation={[0.16, 0.08, 0.04]}>
      {Array.from({ length: 4 }, (_, index) => {
        const angle = index * (Math.PI / 2);
        return (
          <group key={index} rotation={[0, 0, angle]}>
            {[
              { y: 0.48, length: 0.5, x: index % 2 === 0 ? -0.035 : 0.026, rot: 0.08 },
              { y: 1.04, length: 0.42, x: index % 2 === 0 ? 0.06 : -0.044, rot: -0.16 },
              { y: 1.55, length: 0.34, x: index % 2 === 0 ? -0.05 : 0.058, rot: 0.24 },
            ].map((piece, pieceIndex) => (
              <mesh
                key={pieceIndex}
                material={pieceIndex === 2 && index === 0 ? glow : material}
                position={[piece.x, piece.y, 0.045 + pieceIndex * 0.012]}
                rotation={[0.08 * pieceIndex, -0.05 * index, piece.rot]}
              >
                <boxGeometry args={[0.032 + pieceIndex * 0.006, piece.length, 0.032]} />
              </mesh>
            ))}
            <mesh material={index === 0 ? glow : material} position={[index % 2 === 0 ? 0.08 : -0.07, 1.9, 0.08]} rotation={[0.22, 0.14, 0.42]}>
              <coneGeometry args={[0.065, 0.34, 4]} />
            </mesh>
            <mesh material={dark} position={[index % 2 === 0 ? -0.12 : 0.11, 1.28, 0.072]} rotation={[0.18, 0.28, -0.76]}>
              <boxGeometry args={[0.08, 0.22, 0.018]} />
            </mesh>
          </group>
        );
      })}
      <mesh material={material} position={[0.025, -0.012, 0.055]} rotation={[0.1, -0.14, 0.08]}>
        <cylinderGeometry args={[0.12, 0.12, 0.035, 32]} />
      </mesh>
      <mesh material={dark} position={[-0.06, 0.035, 0.088]} rotation={[0.2, 0.1, 0.72]}>
        <boxGeometry args={[0.12, 0.035, 0.016]} />
      </mesh>
      <mesh material={glow} position={[0.04, -0.02, 0.09]}>
        <cylinderGeometry args={[0.034, 0.034, 0.016, 18]} />
      </mesh>
    </group>
  );
}

function LuopanFacePlate({
  brass,
  edge,
  dark,
  glow,
  patina,
}: {
  brass: THREE.Material;
  edge: THREE.Material;
  dark: THREE.Material;
  glow: THREE.Material;
  patina: THREE.Material;
}) {
  const plateRotation: [number, number, number] = [0.16, 0.08, 0.04];
  const tiers = [
    { radius: 1.36, width: 0.045, depth: 0.024, seed: 11.1, pieces: 5 },
    { radius: 1.54, width: 0.038, depth: 0.02, seed: 12.3, pieces: 6 },
    { radius: 1.78, width: 0.052, depth: 0.024, seed: 13.7, pieces: 5 },
    { radius: 2.18, width: 0.042, depth: 0.022, seed: 14.4, pieces: 4 },
  ];

  return (
    <group rotation={plateRotation}>
      {tiers.flatMap((tier, index) =>
        Array.from({ length: tier.pieces }, (_, pieceIndex) => {
          const start = (pieceIndex / tier.pieces) * Math.PI * 2 + seededRandom(tier.seed + pieceIndex) * 0.18;
          const length = (Math.PI * 2) / tier.pieces * (0.42 + seededRandom(tier.seed + pieceIndex + 3.4) * 0.28);
          const radialDrift = (seededRandom(tier.seed + pieceIndex + 6.8) - 0.5) * 0.16;
          return (
            <group
              key={`${index}-${pieceIndex}`}
              position={[
                Math.cos(start + length * 0.5) * radialDrift,
                Math.sin(start + length * 0.5) * radialDrift,
                (seededRandom(tier.seed + pieceIndex + 9.5) - 0.5) * 0.1,
              ]}
              rotation={[0.04 * Math.sin(pieceIndex), 0.05 * Math.cos(pieceIndex * 1.7), 0]}
            >
              <SurfaceBand
                radius={tier.radius}
                width={tier.width}
                depth={tier.depth}
                z={0.13 + index * 0.006}
                material={index % 2 === 0 ? brass : edge}
                seed={tier.seed + pieceIndex * 0.77}
                start={start}
                length={length}
              />
            </group>
          );
        }),
      )}
      {Array.from({ length: 64 }, (_, index) => {
        const angle = (index / 64) * Math.PI * 2;
        if (index % 5 === 0 || index % 11 === 0) return null;
        const major = index % 8 === 0;
        const radius = major ? 1.76 : index % 2 === 0 ? 1.55 : 2.18;
        return (
          <group key={index} position={ringPoint(angle, radius, 0.18)} rotation={tangentRotation(angle)}>
            <mesh material={major ? glow : dark}>
              <boxGeometry args={[major ? 0.22 : 0.12, major ? 0.014 : 0.009, 0.007]} />
            </mesh>
          </group>
        );
      })}
      {Array.from({ length: 8 }, (_, index) => {
        const angle = index * (Math.PI / 4) + Math.PI / 8;
        if (index === 2 || index === 6) return null;
        return (
          <group key={index} position={ringPoint(angle, 1.98, 0.2)} rotation={tangentRotation(angle)}>
            <TrigramMark scale={0.22} material={index % 2 === 0 ? glow : dark} pattern={trigramLines[index]} />
          </group>
        );
      })}
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        if (index % 4 === 1) return null;
        return (
          <group key={index} position={ringPoint(angle, 1.66, 0.19)} rotation={tangentRotation(angle)}>
            <mesh material={patina}>
              <boxGeometry args={[0.16, 0.035, 0.008]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ImpactDamage({
  ring,
  dark,
  glow,
}: {
  ring: MajorRing;
  dark: THREE.Material;
  glow: THREE.Material;
}) {
  const frontZ = ring.depth * 0.92;
  const sites = ring.impacts ?? ring.fragments.map((angle, index) => ({ angle, severity: 0.45 + index * 0.08, offset: index % 2 ? -0.2 : 0.18 }));
  const outer = ring.name === 'outer-celestial-ring';

  return (
    <>
      {sites.map((site, index) => {
        if (!angleInPieces(site.angle, ring.pieces, 0.1)) return null;
        const radius = ring.radius + ring.width * site.offset;
        const severity = site.severity * (outer ? 1.35 : 1);
        return (
          <group
            key={index}
            position={ringPoint(site.angle, radius, frontZ + index * 0.0008)}
            rotation={tangentRotation(site.angle)}
          >
            <mesh material={dark} rotation={[0, 0, 0.22]}>
              <boxGeometry args={[ring.width * (1.7 + severity * 0.85), ring.width * 0.18, 0.016]} />
            </mesh>
            <mesh material={dark} position={[ring.width * 0.25, ring.width * 0.08, 0.006]} rotation={[0, 0, -0.72]}>
              <boxGeometry args={[ring.width * (1.1 + severity * 0.56), ring.width * 0.075, 0.014]} />
            </mesh>
            <mesh material={dark} position={[-ring.width * 0.32, -ring.width * 0.08, 0.007]} rotation={[0, 0, 0.82]}>
              <boxGeometry args={[ring.width * (0.86 + severity * 0.5), ring.width * 0.055, 0.013]} />
            </mesh>
            <mesh material={glow} position={[ring.width * 0.1, 0, 0.012]} rotation={[0, 0, 0.25]}>
              <boxGeometry args={[ring.width * (0.76 + severity * 0.26), ring.width * 0.026, 0.011]} />
            </mesh>
            {outer ? (
              <>
                <mesh material={dark} position={[0, ring.width * 0.5, -frontZ + ring.depth * 0.18]} rotation={[0, 0, 0.18]}>
                  <boxGeometry args={[ring.width * (2.25 + severity * 0.45), ring.width * 0.05, ring.depth * 0.54]} />
                </mesh>
                <mesh material={dark} position={[ring.width * 0.18, -ring.width * 0.5, -frontZ + ring.depth * 0.12]} rotation={[0, 0, -0.34]}>
                  <boxGeometry args={[ring.width * (1.82 + severity * 0.42), ring.width * 0.045, ring.depth * 0.44]} />
                </mesh>
                <mesh material={dark} position={[ring.width * 0.72, -ring.width * 0.13, 0.014]} rotation={[0, 0, 1.16]}>
                  <boxGeometry args={[ring.width * (1.45 + severity * 0.3), ring.width * 0.044, 0.014]} />
                </mesh>
                <mesh material={dark} position={[-ring.width * 0.82, ring.width * 0.09, 0.015]} rotation={[0, 0, -1.05]}>
                  <boxGeometry args={[ring.width * (1.12 + severity * 0.28), ring.width * 0.04, 0.014]} />
                </mesh>
              </>
            ) : null}
            <mesh material={dark} position={[ring.width * -0.5, ring.width * 0.18, 0.01]}>
              <boxGeometry args={[ring.width * (0.34 + severity * 0.2), ring.width * (0.24 + severity * 0.11), 0.018]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function BrokenSegmentCaps({
  ring,
  dark,
  edge,
}: {
  ring: MajorRing;
  dark: THREE.Material;
  edge: THREE.Material;
}) {
  if (ring.pieces.length < 2) return null;
  const frontZ = ring.depth * 0.72;

  return (
    <>
      {ring.pieces.flatMap((piece, pieceIndex) =>
        [piece.start, piece.start + piece.length].map((angle, capIndex) => {
          const normalized = normalizedAngle(angle);
          const radius = ring.radius + ring.width * (capIndex === 0 ? -0.1 : 0.08);
          return (
            <group
              key={`${pieceIndex}-${capIndex}`}
              position={ringPoint(normalized, radius, frontZ)}
              rotation={tangentRotation(normalized)}
            >
              <mesh material={dark} position={[0, 0, 0.014]} rotation={[0, 0, capIndex === 0 ? -0.32 : 0.32]}>
                <boxGeometry args={[ring.width * 0.62, ring.width * 0.9, ring.depth * 0.18]} />
              </mesh>
              <mesh material={edge} position={[ring.width * 0.18, ring.width * 0.19, 0.026]} rotation={[0, 0, 0.56]}>
                <tetrahedronGeometry args={[ring.width * 0.38, 0]} />
              </mesh>
              <mesh material={dark} position={[-ring.width * 0.24, -ring.width * 0.24, 0.028]} rotation={[0, 0, -0.24]}>
                <boxGeometry args={[ring.width * 0.32, ring.width * 0.24, ring.depth * 0.16]} />
              </mesh>
            </group>
          );
        }),
      )}
    </>
  );
}

function makeDebrisShards(): DebrisShard[] {
  return Array.from({ length: 246 }, (_, index) => {
    const denseOuterField = index < 74;
    const innerInstrumentField = index >= 74 && index < 168;
    const seed = index + 2.37;
    const angle = seededRandom(seed) * Math.PI * 2;
    const radius = denseOuterField
      ? 2.45 + seededRandom(seed + 4.1) * 1.85
      : innerInstrumentField
        ? 0.82 + seededRandom(seed + 5.7) * 2.15
        : 1.35 + seededRandom(seed + 6.2) * 3.35;
    const scale = denseOuterField
      ? 0.78 + seededRandom(seed + 3.3) * 1.08
      : innerInstrumentField
        ? 0.54 + seededRandom(seed + 3.3) * 1.18
        : 0.4 + seededRandom(seed + 3.3) * 1.45;
    const materialRoll = seededRandom(seed + 10.4);
    return {
      angle,
      radius,
      z: (seededRandom(seed + 8.8) - 0.5) * (denseOuterField ? 1.0 : innerInstrumentField ? 1.62 : 2.35),
      size: [
        0.038 * scale * (0.7 + seededRandom(seed + 1.2)),
        0.021 * scale * (0.65 + seededRandom(seed + 1.7)),
        0.03 * scale * (0.62 + seededRandom(seed + 2.3)),
      ],
      spin: [
        0.2 + seededRandom(seed + 11.2) * 0.8,
        0.15 + seededRandom(seed + 12.4) * 0.72,
        0.18 + seededRandom(seed + 13.6) * 0.92,
      ],
      phase: seededRandom(seed + 9.2) * Math.PI * 2,
      material: materialRoll > 0.9 ? 'glow' : materialRoll > 0.62 ? 'edge' : materialRoll > 0.16 ? 'brass' : 'dark',
    };
  });
}

export function Rings() {
  const rootRef = useRef<THREE.Group>(null);
  const frameRefs = useRef<THREE.Group[]>([]);
  const pieceRefs = useRef<THREE.Group[][]>([]);
  const fragmentRefs = useRef<THREE.Group[][]>([]);
  const debrisRefs = useRef<THREE.Group[]>([]);
  const ringRefs = useRef<THREE.Group[]>([]);
  const spinVelocity = useRef(majorRings.map((ring) => ring.spinSpeed));
  const runeGlowRef = useRef<THREE.MeshBasicMaterial | null>(null);

  const debrisShards = useMemo(() => makeDebrisShards(), []);
  const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const pointerQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const pointerEuler = useMemo(() => new THREE.Euler(), []);
  const scratchVec = useMemo(() => new THREE.Vector3(), []);
  const driftVec = useMemo(() => new THREE.Vector3(), []);
  const wobbleVec = useMemo(() => new THREE.Vector3(), []);
  const radialVec = useMemo(() => new THREE.Vector3(), []);
  const attachedVec = useMemo(() => new THREE.Vector3(), []);
  const suspendedVec = useMemo(() => new THREE.Vector3(), []);

  const rotationTargets = useMemo(
    () =>
      majorRings.map((ring) => ({
        compass: new THREE.Quaternion().setFromEuler(new THREE.Euler(...ring.compassRotation)),
        chaos: new THREE.Quaternion().setFromEuler(new THREE.Euler(...ring.chaosRotation)),
      })),
    [],
  );

  const brass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#090912',
        roughness: 0.58,
        metalness: 0.86,
        emissive: '#3a1757',
        emissiveIntensity: 0.22,
      }),
    [],
  );

  const polishedEdge = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#141420',
        roughness: 0.5,
        metalness: 0.92,
        emissive: '#5b2f93',
        emissiveIntensity: 0.28,
      }),
    [],
  );

  const engraving = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#120d1d',
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      }),
    [],
  );

  const fractureDark = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#120804',
        transparent: true,
        opacity: 0.96,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  const patina = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#25123c',
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    [],
  );

  const soot = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#120b08',
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    [],
  );

  const paleScratch = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#9a63ff',
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      }),
    [],
  );

  const runeGlow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#d64dff',
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  runeGlowRef.current = runeGlow;

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    const pointer = interactionState.smoothPointer;
    const pointerMagnitude = Math.min(1, pointer.length());
    const interactionEnergy = interactionState.energy;
    const surge = interactionState.surge;
    const resonance = interactionState.resonance;
    const chaos = THREE.MathUtils.clamp(
      0.34 + 0.34 * Math.sin(time * 0.13 + 0.7) + pointerMagnitude * 0.2 + interactionEnergy * 0.22 + surge * 0.26 + resonance * 0.12,
      0.0,
      1.0,
    );
    const easedChaos = chaos * chaos * (3 - 2 * chaos);
    const sealTension = Math.min(1.2, easedChaos * 0.7 + interactionEnergy * 0.75);
    interactionState.ringFlux = THREE.MathUtils.lerp(interactionState.ringFlux, Math.min(1, sealTension * 0.75 + pointerMagnitude * 0.35), 1 - Math.exp(-4 * delta));

    if (rootRef.current) {
      rootRef.current.rotation.y += delta * (0.014 + interactionEnergy * 0.03 + surge * 0.035);
      rootRef.current.rotation.x = Math.sin(time * 0.08) * 0.018 + pointer.y * 0.05;
      rootRef.current.rotation.z = pointer.x * 0.038;
    }

    if (runeGlowRef.current) {
      runeGlowRef.current.opacity = 0.42 + Math.sin(time * 1.25) * 0.1 + Math.sin(time * 0.37) * 0.04 + surge * 0.22;
    }

    frameRefs.current.forEach((frame, index) => {
      const ring = majorRings[index];
      targetQuaternion.slerpQuaternions(rotationTargets[index].compass, rotationTargets[index].chaos, easedChaos);
      pointerEuler.set(
        pointer.y * (0.16 + index * 0.012) * (index % 2 ? -1 : 1),
        pointer.x * (0.2 + index * 0.01),
        Math.sin(time * 0.24 + index * 0.82) * 0.04 * sealTension,
      );
      pointerQuaternion.setFromEuler(pointerEuler);
      targetQuaternion.multiply(pointerQuaternion);

      frame.quaternion.slerp(targetQuaternion, 1 - Math.exp(-2.2 * delta));
      scratchVec.set(...ring.chaosOffset).multiplyScalar(easedChaos + interactionEnergy * 0.25);
      frame.position.lerp(scratchVec, 1 - Math.exp(-2.0 * delta));
    });

    ringRefs.current.forEach((group, index) => {
      const ring = majorRings[index];
      const gyroResponse = 1 + easedChaos * 0.52 + Math.sin(time * 0.19 + index * 1.7) * 0.12 + interactionEnergy * 0.35 + surge * 0.25;
      const target = ring.spinSpeed * gyroResponse;
      spinVelocity.current[index] = THREE.MathUtils.lerp(spinVelocity.current[index], target, 1 - Math.exp(-2.4 * delta));
      group.rotation.z += spinVelocity.current[index] * delta;
      group.rotation.x = Math.sin(time * (0.21 + index * 0.04) + ring.relicSeed) * 0.08 * sealTension + pointer.y * 0.11;
      group.rotation.y = Math.cos(time * (0.18 + index * 0.03) + ring.relicSeed * 0.7) * 0.06 * sealTension + pointer.x * 0.1;
    });

    pieceRefs.current.forEach((pieces, ringIndex) => {
      const ring = majorRings[ringIndex];
      pieces.forEach((pieceGroup, pieceIndex) => {
        const piece = ring.pieces[pieceIndex];
        const centerAngle = piece.start + piece.length * 0.5;
        const aperture = (0.5 + 0.5 * Math.sin(time * 0.37 + ring.relicSeed + pieceIndex * 1.2)) * sealTension;
        driftVec.set(...piece.drift).multiplyScalar(easedChaos + interactionEnergy * 0.25);
        wobbleVec.set(
          Math.sin(time * 0.36 + ring.relicSeed + pieceIndex) * 0.018,
          Math.cos(time * 0.28 + ring.relicSeed * 1.7 + pieceIndex) * 0.014,
          Math.sin(time * 0.24 + pieceIndex) * 0.016,
        ).multiplyScalar(easedChaos + interactionEnergy * 0.35);
        radialVec
          .set(Math.cos(centerAngle), Math.sin(centerAngle), 0)
          .multiplyScalar(ring.width * (aperture - 0.5) * (0.45 + interactionEnergy * 0.6));
        pieceGroup.position.lerp(driftVec.add(wobbleVec).add(radialVec), 1 - Math.exp(-2.7 * delta));
        pieceGroup.rotation.z += Math.sin(time * 0.33 + pieceIndex + ring.relicSeed) * delta * 0.018 * (easedChaos + interactionEnergy * 0.5);
        pieceGroup.rotation.x = Math.sin(time * 0.22 + pieceIndex) * 0.08 * sealTension + pointer.y * 0.04;
        pieceGroup.rotation.y = Math.cos(time * 0.25 + pieceIndex * 1.4) * 0.06 * sealTension + pointer.x * 0.04;
      });
    });

    fragmentRefs.current.forEach((fragments, ringIndex) => {
      const ring = majorRings[ringIndex];
      fragments.forEach((fragment, index) => {
        const angle = ring.fragments[index] + Math.sin(time * 0.19 + index) * 0.05;
        attachedVec.set(...ringPoint(angle, ring.radius + ring.width * 0.52, ring.depth * 0.75));
        suspendedVec.copy(attachedVec).add(
          scratchVec
            .set(Math.sin(time * 0.33 + index), Math.cos(time * 0.27 + ringIndex), Math.sin(time * 0.22 + index * 2))
            .multiplyScalar(0.12 + interactionEnergy * 0.12),
        );
        suspendedVec.x += pointer.x * 0.45;
        suspendedVec.y += pointer.y * 0.45;
        fragment.position.lerp(attachedVec.lerp(suspendedVec, easedChaos), 1 - Math.exp(-3.1 * delta));
        fragment.rotation.set(0.2 + easedChaos * 0.5 + pointer.y * 0.2, 0.1 + index * 0.4 + pointer.x * 0.12, angle + Math.PI / 2 + time * 0.08);
      });
    });

    debrisRefs.current.forEach((debris, index) => {
      const shard = debrisShards[index];
      const orbit = shard.angle + time * (0.018 + (index % 7) * 0.002) * (index % 3 === 0 ? -1 : 1);
      const impactBreath = Math.sin(time * 0.34 + shard.phase) * 0.08;
      const radius = shard.radius + impactBreath + easedChaos * Math.sin(time * 0.21 + index) * 0.12 + interactionEnergy * 0.16 + surge * 0.18;
      debris.position.set(
        Math.cos(orbit + pointer.x * 0.08) * radius,
        Math.sin(orbit + pointer.y * 0.08) * radius * 0.78 + Math.sin(time * 0.23 + shard.phase) * 0.1,
        shard.z + Math.cos(time * 0.27 + shard.phase) * 0.12,
      );
      debris.rotation.x += delta * shard.spin[0];
      debris.rotation.y += delta * shard.spin[1];
      debris.rotation.z += delta * shard.spin[2];
      const pulse = 1 + Math.sin(time * 0.41 + shard.phase) * 0.08;
      debris.scale.set(pulse, 1 + (pulse - 1) * 0.6, 1);
    });
  });

  return (
    <group ref={rootRef}>
      {majorRings.map((ring, index) => (
        <group
          key={ring.name}
          ref={(group) => {
            if (group) frameRefs.current[index] = group;
          }}
          rotation={ring.compassRotation}
        >
          <group
            ref={(group) => {
              if (group) ringRefs.current[index] = group;
            }}
          >
            {ring.pieces.map((piece, pieceIndex) => (
              <group
                key={pieceIndex}
                ref={(group) => {
                  if (!pieceRefs.current[index]) pieceRefs.current[index] = [];
                  if (group) pieceRefs.current[index][pieceIndex] = group;
                }}
              >
                <Band ring={ring} piece={piece} material={brass} />
              </group>
            ))}
            <RaisedRims ring={ring} material={polishedEdge} />
            <EngravedGrooves ring={ring} material={engraving} />
            <CalibrationMarks ring={ring} dark={engraving} glow={runeGlow} />
            <LuopanDegreeBands ring={ring} dark={engraving} glow={runeGlow} />
            {ring.name === 'inner-equator-ring' || ring.name === 'core-compass-ring' ? (
              <BaguaCompass ring={ring} dark={engraving} glow={runeGlow} />
            ) : null}
            <SymbolPanels ring={ring} dark={engraving} glow={runeGlow} />
            <CartouchePanels ring={ring} dark={engraving} glow={runeGlow} />
            <SacredGlyphs ring={ring} dark={engraving} glow={runeGlow} />
            <EnergySeams ring={ring} material={runeGlow} />
            <PatinaDeposits ring={ring} patina={patina} soot={soot} />
            <PittedSurface ring={ring} soot={soot} exposed={paleScratch} />
            <ScratchCloud ring={ring} material={paleScratch} />
            <AncientWear ring={ring} material={fractureDark} />
            <ImpactDamage ring={ring} dark={fractureDark} glow={runeGlow} />
            <BrokenSegmentCaps ring={ring} dark={fractureDark} edge={polishedEdge} />
            <StabilizerJoints ring={ring} brass={polishedEdge} dark={engraving} glow={runeGlow} />
            {ring.fragments.map((angle, fragmentIndex) => (
              <group
                key={fragmentIndex}
                ref={(group) => {
                  if (!fragmentRefs.current[index]) fragmentRefs.current[index] = [];
                  if (group) fragmentRefs.current[index][fragmentIndex] = group;
                }}
                position={ringPoint(angle, ring.radius + ring.width * 0.52, ring.depth * 0.75)}
                rotation={tangentRotation(angle)}
              >
                <mesh material={polishedEdge}>
                  <boxGeometry args={[ring.width * 0.56, ring.width * 0.16, ring.depth * 0.34]} />
                </mesh>
                <mesh material={runeGlow} position={[0, ring.width * 0.095, ring.depth * 0.19]}>
                  <boxGeometry args={[ring.width * 0.26, ring.width * 0.035, ring.depth * 0.05]} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      ))}
      <BrokenCompassNeedles material={polishedEdge} dark={fractureDark} glow={runeGlow} />
      <LuopanFacePlate brass={brass} edge={polishedEdge} dark={engraving} glow={runeGlow} patina={patina} />
      {debrisShards.map((shard, index) => {
        const material = shard.material === 'edge' ? polishedEdge : shard.material === 'dark' ? fractureDark : shard.material === 'glow' ? runeGlow : brass;
        const isCrumb = index % 3 === 0;
        return (
          <group
            key={index}
            ref={(group) => {
              if (group) debrisRefs.current[index] = group;
            }}
            position={[Math.cos(shard.angle) * shard.radius, Math.sin(shard.angle) * shard.radius * 0.78, shard.z]}
            rotation={[shard.phase, shard.phase * 0.47, shard.phase * 0.22]}
          >
            <mesh material={material} castShadow>
              {isCrumb ? (
                <tetrahedronGeometry args={[Math.max(shard.size[0], shard.size[2]), 0]} />
              ) : (
                <boxGeometry args={shard.size} />
              )}
            </mesh>
            {shard.material !== 'dark' && index % 5 === 0 ? (
              <mesh material={fractureDark} position={[shard.size[0] * 0.2, 0, shard.size[2] * 0.52]}>
                <boxGeometry args={[shard.size[0] * 0.68, shard.size[1] * 0.28, shard.size[2] * 0.18]} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}
