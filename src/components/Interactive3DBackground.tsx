'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Eye, RotateCw, Palette, Layers } from 'lucide-react';

interface ColorTheme {
  name: string;
  id: 'indigo' | 'emerald' | 'sunset';
  primary: number;
  secondary: number;
  accent: number;
  ambient: number;
  bgGradient: string;
}

const COLOR_THEMES: Record<string, ColorTheme> = {
  indigo: {
    name: 'Cosmic Indigo',
    id: 'indigo',
    primary: 0x6366f1,    // Indigo 500
    secondary: 0x06b6d4,  // Cyan 500
    accent: 0xa855f7,     // Purple 500
    ambient: 0x1e1b4b,    // Deep indigo
    bgGradient: 'radial-gradient(ellipse at 50% -10%, #312e81 0%, #0f172a 60%, #020617 100%)',
  },
  emerald: {
    name: 'Matrix Emerald',
    id: 'emerald',
    primary: 0x10b981,    // Emerald 500
    secondary: 0x14b8a6,  // Teal 500
    accent: 0x3b82f6,     // Blue 500
    ambient: 0x064e3b,    // Deep emerald
    bgGradient: 'radial-gradient(ellipse at 50% -10%, #064e3b 0%, #022c22 60%, #020617 100%)',
  },
  sunset: {
    name: 'Cyber Sunset',
    id: 'sunset',
    primary: 0xf43f5e,    // Rose 500
    secondary: 0xec4899,  // Pink 500
    accent: 0xf59e0b,     // Amber 500
    ambient: 0x4c0519,    // Deep rose
    bgGradient: 'radial-gradient(ellipse at 50% -10%, #831843 0%, #1e112a 60%, #020617 100%)',
  },
};

interface InteractableItem {
  mesh: THREE.Group;
  baseScale: number;
  targetScale: number;
  currentScale: number;
  rotSpeed: { x: number; y: number; z: number };
  baseSpeed: { x: number; y: number; z: number };
  kickSpeed: { x: number; y: number; z: number };
  floatOffset: number;
  floatSpeed: number;
  initialPos: THREE.Vector3;
}

export function Interactive3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTheme, setActiveTheme] = useState<'indigo' | 'emerald' | 'sunset'>('indigo');
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [interactedCount, setInteractedCount] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);

  // References for scene synchronization across theme changes
  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialsRef = useRef<THREE.Material[]>([]);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const interactablesRef = useRef<InteractableItem[]>([]);
  const shockwavesRef = useRef<Array<{ mesh: THREE.Mesh; scale: number; maxScale: number; opacity: number }>>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(COLOR_THEMES[activeTheme].ambient, 2.5);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(20, 25, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(COLOR_THEMES[activeTheme].secondary, 1.5);
    dirLight2.position.set(-20, -15, -10);
    scene.add(dirLight2);

    // Dynamic mouse-following point light
    const mouseLight = new THREE.PointLight(COLOR_THEMES[activeTheme].primary, 8, 35, 1.2);
    mouseLight.position.set(0, 0, 10);
    scene.add(mouseLight);
    pointLightRef.current = mouseLight;

    // 3. Materials Factory
    materialsRef.current = [];
    const createGlassMat = (color: number, opacity = 0.5) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.1,
        metalness: 0.2,
        transmission: 0.6,
        ior: 1.5,
        transparent: true,
        opacity,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });
      materialsRef.current.push(mat);
      return mat;
    };

    const createWireMat = (color: number) => {
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      });
      materialsRef.current.push(mat);
      return mat;
    };

    const themeColors = COLOR_THEMES[activeTheme];

    // 4. Generate 3D Interactable Objects
    const interactables: InteractableItem[] = [];

    const makeCompoundObject = (
      geo: THREE.BufferGeometry,
      pos: [number, number, number],
      color: number,
      scale = 1,
      speed = { x: 0.008, y: 0.012, z: 0.005 }
    ): InteractableItem => {
      const group = new THREE.Group();
      group.position.set(...pos);

      // Inner glass body
      const solidMat = createGlassMat(color, 0.55);
      const solidMesh = new THREE.Mesh(geo, solidMat);
      solidMesh.castShadow = true;
      group.add(solidMesh);

      // Outer wireframe halo
      const wireMat = createWireMat(themeColors.secondary);
      const wireMesh = new THREE.Mesh(geo, wireMat);
      wireMesh.scale.setScalar(1.05);
      group.add(wireMesh);

      scene.add(group);

      const item: InteractableItem = {
        mesh: group,
        baseScale: scale,
        targetScale: scale,
        currentScale: scale,
        rotSpeed: { ...speed },
        baseSpeed: { ...speed },
        kickSpeed: { x: 0, y: 0, z: 0 },
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.0015 + Math.random() * 0.001,
        initialPos: new THREE.Vector3(...pos),
      };
      interactables.push(item);
      return item;
    };

    // A. Holographic Icosahedron (Top Right Crystal)
    makeCompoundObject(
      new THREE.IcosahedronGeometry(2.4, 0),
      [14, 7, -4],
      themeColors.primary,
      1.1,
      { x: 0.007, y: 0.01, z: 0.004 }
    );

    // B. Torus Knot / Orbit Ring (Left Side Data Loop)
    makeCompoundObject(
      new THREE.TorusKnotGeometry(1.8, 0.45, 100, 16),
      [-14, 5, -5],
      themeColors.accent,
      1.0,
      { x: 0.009, y: 0.007, z: 0.005 }
    );

    // C. Floating Presentation Slide Deck (Center-Right Polyhedron)
    makeCompoundObject(
      new THREE.DodecahedronGeometry(2.2, 0),
      [15, -6, -2],
      themeColors.secondary,
      1.2,
      { x: -0.006, y: 0.012, z: 0.006 }
    );

    // D. Octahedron Diamond Prism (Left-Bottom Data Core)
    makeCompoundObject(
      new THREE.OctahedronGeometry(2.3, 0),
      [-13, -7, -3],
      themeColors.primary,
      1.15,
      { x: 0.01, y: -0.008, z: 0.007 }
    );

    // E. 3D Bar Chart Stack (Floating Executive Pillars)
    const chartGroup = new THREE.Group();
    chartGroup.position.set(-6, 9, -8);
    const heights = [1.8, 3.2, 2.4, 4.0, 3.0];
    heights.forEach((h, i) => {
      const barGeo = new THREE.BoxGeometry(0.7, h, 0.7);
      const barMat = createGlassMat(i % 2 === 0 ? themeColors.primary : themeColors.secondary, 0.6);
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set((i - 2) * 1.0, h / 2, 0);

      const wire = new THREE.Mesh(barGeo, createWireMat(themeColors.accent));
      wire.position.copy(bar.position);
      wire.scale.setScalar(1.04);

      chartGroup.add(bar);
      chartGroup.add(wire);
    });
    scene.add(chartGroup);
    interactables.push({
      mesh: chartGroup,
      baseScale: 0.9,
      targetScale: 0.9,
      currentScale: 0.9,
      rotSpeed: { x: 0.005, y: 0.008, z: 0.002 },
      baseSpeed: { x: 0.005, y: 0.008, z: 0.002 },
      kickSpeed: { x: 0, y: 0, z: 0 },
      floatOffset: Math.random() * Math.PI,
      floatSpeed: 0.0018,
      initialPos: new THREE.Vector3(-6, 9, -8),
    });

    // F. Golden Ratio Floating Rings
    const ringGeo = new THREE.TorusGeometry(3.2, 0.1, 16, 100);
    const ringMat = createWireMat(themeColors.accent);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    const ringGroup = new THREE.Group();
    ringGroup.position.set(7, -8, -6);
    ringGroup.add(ring);
    scene.add(ringGroup);
    interactables.push({
      mesh: ringGroup,
      baseScale: 1.0,
      targetScale: 1.0,
      currentScale: 1.0,
      rotSpeed: { x: 0.015, y: 0.005, z: 0.01 },
      baseSpeed: { x: 0.015, y: 0.005, z: 0.01 },
      kickSpeed: { x: 0, y: 0, z: 0 },
      floatOffset: 1.2,
      floatSpeed: 0.002,
      initialPos: new THREE.Vector3(7, -8, -6),
    });

    interactablesRef.current = interactables;

    // 5. Undulating 3D Wave Floor Plane
    const planeWidth = 70;
    const planeHeight = 70;
    const planeSegments = 45;
    const floorGeo = new THREE.PlaneGeometry(planeWidth, planeHeight, planeSegments, planeSegments);
    const floorMat = new THREE.MeshBasicMaterial({
      color: themeColors.primary,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    materialsRef.current.push(floorMat);

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2.3;
    floorMesh.position.set(0, -14, -10);
    scene.add(floorMesh);

    const originalPos = floorGeo.attributes.position.clone();

    // 6. 3D Particle Constellation Dust
    const particleCount = 500;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: Array<{ x: number; y: number; z: number }> = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 65;
      particlePositions[i + 1] = (Math.random() - 0.5) * 45;
      particlePositions[i + 2] = (Math.random() - 0.5) * 35;
      particleVelocities.push({
        x: (Math.random() - 0.5) * 0.012,
        y: (Math.random() - 0.5) * 0.012,
        z: (Math.random() - 0.5) * 0.008,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: themeColors.secondary,
      size: 0.35,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    materialsRef.current.push(particleMat);
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 7. Raycasting & Mouse Tracking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    const targetCameraPos = new THREE.Vector2(0, 0);

    let isDragging = false;
    let prevPointerPos = { x: 0, y: 0 };
    let dragRotSpeed = { x: 0, y: 0 };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.x = x;
      mouse.y = y;

      targetCameraPos.x = x * 3.5;
      targetCameraPos.y = y * 2.5;

      // Project mouse position to 3D for the spotlight
      if (pointLightRef.current) {
        pointLightRef.current.position.x = x * 18;
        pointLightRef.current.position.y = y * 12;
      }

      if (isDragging) {
        const deltaX = e.clientX - prevPointerPos.x;
        const deltaY = e.clientY - prevPointerPos.y;
        dragRotSpeed.y = deltaX * 0.004;
        dragRotSpeed.x = deltaY * 0.004;
        prevPointerPos = { x: e.clientX, y: e.clientY };
      }
    };

    const triggerShockwave = (x: number, y: number, z: number, color: number) => {
      const ringGeo = new THREE.RingGeometry(0.1, 0.4, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, y, z);
      ring.lookAt(camera.position);
      scene.add(ring);
      shockwavesRef.current.push({
        mesh: ring,
        scale: 1,
        maxScale: 12,
        opacity: 0.9,
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointerPos = { x: e.clientX, y: e.clientY };

      // Raycast against interactable meshes
      raycaster.setFromCamera(mouse, camera);
      const allMeshes: THREE.Object3D[] = [];
      interactablesRef.current.forEach((item) => {
        item.mesh.children.forEach((child) => allMeshes.push(child));
      });

      const intersects = raycaster.intersectObjects(allMeshes, true);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        // Find owner item
        const owner = interactablesRef.current.find((item) =>
          item.mesh.children.includes(hitMesh as any) || item.mesh === hitMesh.parent
        );

        if (owner) {
          // Boost rotation and bounce
          owner.kickSpeed.x = (Math.random() - 0.5) * 0.35;
          owner.kickSpeed.y = (Math.random() - 0.5) * 0.35;
          owner.kickSpeed.z = (Math.random() - 0.5) * 0.25;
          owner.targetScale = owner.baseScale * 1.45;

          triggerShockwave(
            owner.mesh.position.x,
            owner.mesh.position.y,
            owner.mesh.position.z,
            COLOR_THEMES[activeTheme].accent
          );
          setInteractedCount((c) => c + 1);
        }
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    // 8. Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 9. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Camera smooth lerping
      camera.position.x += (targetCameraPos.x - camera.position.x) * 0.05;
      camera.position.y += (targetCameraPos.y - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Raycast for hover state
      raycaster.setFromCamera(mouse, camera);
      const allMeshes: THREE.Object3D[] = [];
      interactablesRef.current.forEach((item) => {
        item.mesh.children.forEach((child) => allMeshes.push(child));
      });
      const intersects = raycaster.intersectObjects(allMeshes, true);
      const hoveredParent = intersects.length > 0 ? intersects[0].object.parent : null;

      // Update 3D Interactables
      interactablesRef.current.forEach((item) => {
        const isHovered = item.mesh === hoveredParent;
        item.targetScale = isHovered ? item.baseScale * 1.3 : item.baseScale;

        // Smooth scale interpolation
        item.currentScale += (item.targetScale - item.currentScale) * 0.12;
        item.mesh.scale.setScalar(item.currentScale);

        // Rotation & kick damping
        item.rotSpeed.x = item.baseSpeed.x + item.kickSpeed.x + (isHovered ? 0.025 : 0);
        item.rotSpeed.y = item.baseSpeed.y + item.kickSpeed.y + (isHovered ? 0.03 : 0);
        item.rotSpeed.z = item.baseSpeed.z + item.kickSpeed.z;

        item.mesh.rotation.x += item.rotSpeed.x;
        item.mesh.rotation.y += item.rotSpeed.y;
        item.mesh.rotation.z += item.rotSpeed.z;

        // Apply drag rotation if user swiped
        item.mesh.rotation.y += dragRotSpeed.y;
        item.mesh.rotation.x += dragRotSpeed.x;

        // Kick friction
        item.kickSpeed.x *= 0.94;
        item.kickSpeed.y *= 0.94;
        item.kickSpeed.z *= 0.94;

        // Gentle floating bob
        const bob = Math.sin(elapsed * 1.5 + item.floatOffset) * 0.8;
        item.mesh.position.y = item.initialPos.y + bob;
      });

      dragRotSpeed.x *= 0.92;
      dragRotSpeed.y *= 0.92;

      // Animate Undulating Floor Vertices
      const posAttr = floorGeo.attributes.position;
      const orig = originalPos;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = orig.getX(i);
        const vy = orig.getY(i);
        // Harmonic ripple equation
        const dist = Math.sqrt(vx * vx + vy * vy);
        const wave =
          Math.sin(dist * 0.28 - elapsed * 2.2) * 1.1 +
          Math.cos(vx * 0.15 + elapsed) * 0.5;
        posAttr.setZ(i, wave);
      }
      posAttr.needsUpdate = true;

      // Animate Particles
      const pPos = particleGeo.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const vel = particleVelocities[i];
        pPos.setX(idx, pPos.getX(idx) + vel.x);
        pPos.setY(idx + 1, pPos.getY(idx + 1) + vel.y);
        pPos.setZ(idx + 2, pPos.getZ(idx + 2) + vel.z);

        // Boundary wrap
        if (Math.abs(pPos.getX(idx)) > 35) vel.x *= -1;
        if (Math.abs(pPos.getY(idx + 1)) > 25) vel.y *= -1;
        if (Math.abs(pPos.getZ(idx + 2)) > 20) vel.z *= -1;
      }
      pPos.needsUpdate = true;
      particleSystem.rotation.y = elapsed * 0.02;

      // Animate Shockwaves
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.scale += 0.45;
        sw.opacity *= 0.91;
        sw.mesh.scale.setScalar(sw.scale);
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = sw.opacity;

        if (sw.opacity < 0.02 || sw.scale > sw.maxScale) {
          scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          (sw.mesh.material as THREE.Material).dispose();
          shockwavesRef.current.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      floorGeo.dispose();
      particleGeo.dispose();
      materialsRef.current.forEach((m) => m.dispose());
    };
  }, [activeTheme]);

  // Handle wireframe toggle dynamically
  useEffect(() => {
    materialsRef.current.forEach((mat) => {
      if ('wireframe' in mat) {
        (mat as any).wireframe = wireframeMode;
      }
    });
  }, [wireframeMode]);

  return (
    <div
      className="fixed inset-0 pointer-events-auto overflow-hidden -z-10 transition-colors duration-1000"
      style={{
        background: COLOR_THEMES[activeTheme].bgGradient,
      }}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Subtle modern radial vignette glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.15) 45%, transparent 75%)',
        }}
      />

      {/* Floating 3D Interaction HUD / Controls Pill */}
      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-2 pointer-events-auto">
        {showControls ? (
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl text-xs text-slate-200">
            {/* Interactive hint badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-slate-300 font-medium border-r border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Click or drag 3D shapes</span>
              {interactedCount > 0 && (
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  {interactedCount} {interactedCount === 1 ? 'hit' : 'hits'}
                </span>
              )}
            </div>

            {/* 3D Theme Switcher */}
            <div className="flex items-center gap-1 px-1">
              {(Object.keys(COLOR_THEMES) as Array<'indigo' | 'emerald' | 'sunset'>).map((themeKey) => {
                const t = COLOR_THEMES[themeKey];
                const isSelected = activeTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    onClick={() => setActiveTheme(themeKey)}
                    title={`Switch 3D Scene Theme to ${t.name}`}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/50 scale-105'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    }`}
                  >
                    {t.name.split(' ')[1]}
                  </button>
                );
              })}
            </div>

            {/* Wireframe toggle */}
            <button
              onClick={() => setWireframeMode(!wireframeMode)}
              title="Toggle Hologram Wireframe Mode"
              className={`p-1.5 rounded-lg border transition-all ${
                wireframeMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {/* Minimize button */}
            <button
              onClick={() => setShowControls(false)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
              title="Hide 3D controls"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowControls(true)}
            className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl text-slate-300 hover:text-white hover:scale-105 transition-all text-xs flex items-center gap-1.5"
            title="Open 3D Scene Controls"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline font-semibold">3D Scene</span>
          </button>
        )}
      </div>
    </div>
  );
}
