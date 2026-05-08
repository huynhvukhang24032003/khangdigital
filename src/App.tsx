/*
 * Meow Astral Core
 * Copyright (c) 2026 Meow. All rights reserved.
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, OrbitControls, PerformanceMonitor } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AccretionDisk } from './components/AccretionDisk';
import { ContainmentMesh } from './components/ContainmentMesh';
import { EnergyCore } from './components/EnergyCore';
import { ForegroundDust } from './components/ForegroundDust';
import { Particles } from './components/Particles';
import { PlasmaBackground } from './components/PlasmaBackground';
import { PostProcessing } from './components/PostProcessing';
import { Rings } from './components/Rings';
import { interactionState } from './config/interactionState';
import { sceneConfig } from './config/sceneConfig';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const distance = size.width < 720 ? sceneConfig.camera.radius * 1.55 : sceneConfig.camera.radius;
    camera.position.set(0, 0.25, distance);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  return null;
}

function InteractionDriver() {
  const { mouse, clock } = useThree();
  const previousPointer = useRef(new THREE.Vector2());

  useFrame((_, delta) => {
    interactionState.pointer.set(mouse.x, mouse.y);
    interactionState.smoothPointer.lerp(interactionState.pointer, 1 - Math.exp(-8 * delta));

    const safeDelta = Math.max(delta, 1e-4);
    const vx = (interactionState.pointer.x - previousPointer.current.x) / safeDelta;
    const vy = (interactionState.pointer.y - previousPointer.current.y) / safeDelta;
    interactionState.velocity.set(vx, vy).multiplyScalar(0.014);
    previousPointer.current.copy(interactionState.pointer);

    const kinetic = Math.min(1, interactionState.velocity.length() * 1.8);
    const presence = Math.min(1, interactionState.smoothPointer.length() * 0.75);
    const targetEnergy = Math.min(1, 0.18 + kinetic * 0.7 + presence * 0.5);
    interactionState.energy = THREE.MathUtils.lerp(interactionState.energy, targetEnergy, 1 - Math.exp(-6 * delta));
    const time = clock.elapsedTime;
    const longWave = 0.5 + 0.5 * Math.sin(time * 0.11 + 1.2);
    const surgeCarrier = Math.pow(0.5 + 0.5 * Math.sin(time * 0.18 + 0.7), 6.0);
    interactionState.resonance = THREE.MathUtils.lerp(interactionState.resonance, longWave, 1 - Math.exp(-2.8 * delta));
    interactionState.surge = THREE.MathUtils.lerp(
      interactionState.surge,
      Math.min(1, surgeCarrier * 0.95 + interactionState.energy * 0.35),
      1 - Math.exp(-3.2 * delta),
    );
    interactionState.phase = time;
    interactionState.pulse = 0.5 + 0.5 * Math.sin(time * 1.7 + interactionState.energy * 4.2 + interactionState.surge * 5.5);
  });

  return null;
}

function CursorFx() {
  const haloRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.body.classList.add('cursor-fx-enabled');
    const target = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    const trail = { x: target.x, y: target.y };
    let raf = 0;

    const render = () => {
      trail.x += (target.x - trail.x) * 0.18;
      trail.y += (target.y - trail.y) * 0.18;

      if (haloRef.current) haloRef.current.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0)`;
      if (coreRef.current) coreRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      raf = requestAnimationFrame(render);
    };

    const setVisible = (visible: boolean) => {
      const value = visible ? '1' : '0';
      if (haloRef.current) haloRef.current.style.opacity = value;
      if (coreRef.current) coreRef.current.style.opacity = value;
    };

    const handleMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      setVisible(true);
    };

    const handleDown = () => {
      haloRef.current?.classList.add('is-down');
      coreRef.current?.classList.add('is-down');
    };

    const handleUp = () => {
      haloRef.current?.classList.remove('is-down');
      coreRef.current?.classList.remove('is-down');
    };

    const handleLeave = () => setVisible(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointerleave', handleLeave);
    window.addEventListener('blur', handleLeave);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointerleave', handleLeave);
      window.removeEventListener('blur', handleLeave);
      document.body.classList.remove('cursor-fx-enabled');
    };
  }, []);

  return (
    <>
      <div ref={haloRef} className="cursor-fx cursor-fx-halo" />
      <div ref={coreRef} className="cursor-fx cursor-fx-core" />
    </>
  );
}

function CinematicRig({
  controlsRef,
  detailMode,
}: {
  controlsRef: { current: OrbitControlsImpl | null };
  detailMode: boolean;
}) {
  const { camera, clock } = useThree();

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const time = clock.elapsedTime;
    const detail = detailMode ? 1 : 0;
    const pointer = interactionState.smoothPointer;
    const surge = interactionState.surge;

    const targetOffset = new THREE.Vector3(
      pointer.x * (0.26 - detail * 0.16) + Math.sin(time * 0.17) * 0.18,
      0.06 + pointer.y * (0.22 - detail * 0.14) + Math.cos(time * 0.13) * 0.12,
      0,
    );
    controls.target.lerp(targetOffset, 1 - Math.exp(-3.3 * delta));

    const breathingFov = 42 + Math.sin(time * 0.24) * 0.7 - surge * 1.0 - detail * 2.3;
    camera.fov = THREE.MathUtils.lerp(camera.fov, breathingFov, 1 - Math.exp(-2.8 * delta));
    camera.updateProjectionMatrix();
  });

  return null;
}

function Scene({ detailMode }: { detailMode: boolean }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <>
      <color attach="background" args={[sceneConfig.colors.background]} />
      <fog attach="fog" args={[sceneConfig.colors.background, 5.2, 22]} />

      <PlasmaBackground />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 2]} intensity={6.8} color={sceneConfig.colors.coreHot} />
      <pointLight position={[4, 2, 3]} intensity={1.7} color={sceneConfig.colors.glow} />
      <pointLight position={[-3.4, -1.2, 2.2]} intensity={1.15} color="#6f3bd6" />
      <directionalLight position={[-3.5, 4, 4.5]} intensity={0.92} color="#a98dff" />

      <InteractionDriver />
      <CinematicRig controlsRef={controlsRef} detailMode={detailMode} />
      <AccretionDisk />
      <EnergyCore />
      <ContainmentMesh />
      <Rings />
      <Particles />
      <ForegroundDust />
      <ResponsiveCamera />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={detailMode ? 0.085 : 0.055}
        enablePan={detailMode}
        enableZoom
        zoomSpeed={detailMode ? 1.35 : 0.75}
        rotateSpeed={detailMode ? 0.3 : 0.55}
        panSpeed={detailMode ? 1.15 : 0}
        screenSpacePanning
        autoRotate={!detailMode}
        autoRotateSpeed={0.18}
        minDistance={detailMode ? 1.45 : 3.1}
        maxDistance={11}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: detailMode ? THREE.MOUSE.DOLLY : THREE.MOUSE.PAN,
          RIGHT: detailMode ? THREE.MOUSE.PAN : THREE.MOUSE.DOLLY,
        }}
        target={[0, 0, 0]}
      />
      <PostProcessing />
    </>
  );
}

export default function App() {
  const [detailMode, setDetailMode] = useState(false);

  useEffect(() => {
    const handlePointerUp = () => setDetailMode(false);
    const handleBlur = () => setDetailMode(false);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <main
      className="hero"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.button === 2) setDetailMode(true);
      }}
      onPointerUp={(event) => {
        if (event.button === 2) setDetailMode(false);
      }}
    >
      <CursorFx />
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.25, sceneConfig.camera.radius], fov: 42, near: 0.1, far: 80 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      >
        <PerformanceMonitor />
        <AdaptiveDpr pixelated={false} />
        <Suspense fallback={null}>
          <Scene detailMode={detailMode} />
        </Suspense>
      </Canvas>

      <section className="hero-copy" aria-label="Portfolio intro">
        <p>Portfolio System</p>
        <h1>Vũ Khang Digital Portfolio</h1>
      </section>
    </main>
  );
}
