/**
 * 3D Deep Space Trajectory Viewport (Three.js)
 * Real-time 3D planetary orbits, transfer conics, spacecraft marker, and maneuver vectors
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Eye, Layers, Compass } from 'lucide-react';
import { DeepSpaceMission, ManeuverNode, TrajectoryWayPoint } from '../types/astrodynamics';
import { AU_KM, elementsToCartesian, propagateElements } from '../physics/orbitPropagator';

interface DeepSpace3DViewProps {
  mission: DeepSpaceMission;
  projectedWaypoints: TrajectoryWayPoint[];
  maneuverNode: ManeuverNode | null;
  currentTrueAnomaly: number;
}

export const DeepSpace3DView: React.FC<DeepSpace3DViewProps> = ({
  mission,
  projectedWaypoints,
  maneuverNode,
  currentTrueAnomaly,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [focusTarget, setFocusTarget] = useState<'craft' | 'sun' | 'target'>('craft');

  // Internal Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const spacecraftMarkerRef = useRef<THREE.Group | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const maneuverVectorGroupRef = useRef<THREE.Group | null>(null);
  const planetsGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Camera interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 250 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0x223344, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2.5, 3000, 0.1);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Ecliptic Grid Helper
    const grid = new THREE.GridHelper(400, 20, 0x1e293b, 0x0f172a);
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    // Sun Sphere
    const sunGeo = new THREE.SphereGeometry(7, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    // Sun Corona Glow
    const coronaGeo = new THREE.SphereGeometry(9, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    scene.add(coronaMesh);

    // Planetary Group
    const planetsGroup = new THREE.Group();
    scene.add(planetsGroup);
    planetsGroupRef.current = planetsGroup;

    // Scale: 1 AU ≈ 100 units in 3D scene
    const auScale = 100;

    // Earth Orbit & Mesh
    const earthOrbitGeo = new THREE.BufferGeometry();
    const earthPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      earthPoints.push(new THREE.Vector3(Math.cos(angle) * auScale, 0, Math.sin(angle) * auScale));
    }
    earthOrbitGeo.setFromPoints(earthPoints);
    const earthOrbitMat = new THREE.LineBasicMaterial({ color: 0x0369a1, transparent: true, opacity: 0.6 });
    const earthOrbitLine = new THREE.Line(earthOrbitGeo, earthOrbitMat);
    planetsGroup.add(earthOrbitLine);

    const earthGeo = new THREE.SphereGeometry(3, 24, 24);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.name = 'Earth';
    earthMesh.position.set(auScale, 0, 0);
    planetsGroup.add(earthMesh);

    // Mars Orbit & Mesh (a = 1.524 AU)
    const marsDist = 1.524 * auScale;
    const marsOrbitGeo = new THREE.BufferGeometry();
    const marsPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      marsPoints.push(new THREE.Vector3(Math.cos(angle) * marsDist, 0, Math.sin(angle) * marsDist));
    }
    marsOrbitGeo.setFromPoints(marsPoints);
    const marsOrbitMat = new THREE.LineBasicMaterial({ color: 0x991b1b, transparent: true, opacity: 0.6 });
    const marsOrbitLine = new THREE.Line(marsOrbitGeo, marsOrbitMat);
    planetsGroup.add(marsOrbitLine);

    const marsGeo = new THREE.SphereGeometry(2.2, 24, 24);
    const marsMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsMesh.name = 'Mars';
    marsMesh.position.set(marsDist * Math.cos(1.1), 0, marsDist * Math.sin(1.1));
    planetsGroup.add(marsMesh);

    // Spacecraft Marker Group
    const scGroup = new THREE.Group();
    const scBodyGeo = new THREE.ConeGeometry(1.8, 4, 8);
    scBodyGeo.rotateX(Math.PI / 2);
    const scBodyMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const scMesh = new THREE.Mesh(scBodyGeo, scBodyMat);
    scGroup.add(scMesh);

    // Spacecraft Beacon Halo
    const haloGeo = new THREE.RingGeometry(2.5, 3.2, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    scGroup.add(haloMesh);

    scene.add(scGroup);
    spacecraftMarkerRef.current = scGroup;

    // Maneuver Vector Group
    const mvGroup = new THREE.Group();
    scene.add(mvGroup);
    maneuverVectorGroupRef.current = mvGroup;

    // Mouse Controls Setup
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAngleRef.current.theta -= deltaX * 0.008;
      cameraAngleRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi - deltaY * 0.008));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(20, Math.min(1000, cameraAngleRef.current.radius + e.deltaY * 0.3));
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Camera Spherical Position
      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = targetLookAtRef.current.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = targetLookAtRef.current.y + radius * Math.cos(phi);
      camera.position.z = targetLookAtRef.current.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(targetLookAtRef.current);

      // Rotate beacon halo
      haloMesh.rotation.z += 0.02;

      renderer.render(scene, camera);
    };
    animate();

    // Window Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, []);

  // Update Trajectory Line & Spacecraft Position when waypoints or elements change
  useEffect(() => {
    if (!sceneRef.current || projectedWaypoints.length === 0) return;

    const auScale = 100;
    // Remove old trajectory line
    if (trajectoryLineRef.current) {
      sceneRef.current.remove(trajectoryLineRef.current);
      trajectoryLineRef.current.geometry.dispose();
    }

    // Build new trajectory path from waypoints
    const points: THREE.Vector3[] = projectedWaypoints.map((wp) => {
      const x = (wp.positionKm.x / AU_KM) * auScale;
      const y = (wp.positionKm.z / AU_KM) * auScale; // Z is orbital inclination
      const z = (wp.positionKm.y / AU_KM) * auScale;
      return new THREE.Vector3(x, y, z);
    });

    const trajectoryGeo = new THREE.BufferGeometry().setFromPoints(points);
    const trajectoryMat = new THREE.LineDashedMaterial({
      color: 0x06b6d4, // Laser cyan
      dashSize: 3,
      gapSize: 1.5,
      linewidth: 2,
    });
    const trajectoryLine = new THREE.Line(trajectoryGeo, trajectoryMat);
    trajectoryLine.computeLineDistances();
    sceneRef.current.add(trajectoryLine);
    trajectoryLineRef.current = trajectoryLine;

    // Calculate current spacecraft Cartesian position
    const currentElem = { ...mission.elements, trueAnomaly: currentTrueAnomaly };
    const cartesian = elementsToCartesian(currentElem);
    const scX = (cartesian.position.x / AU_KM) * auScale;
    const scY = (cartesian.position.z / AU_KM) * auScale;
    const scZ = (cartesian.position.y / AU_KM) * auScale;

    if (spacecraftMarkerRef.current) {
      spacecraftMarkerRef.current.position.set(scX, scY, scZ);

      // Orient cone towards velocity vector
      const vDir = new THREE.Vector3(
        cartesian.velocity.x,
        cartesian.velocity.z,
        cartesian.velocity.y
      ).normalize();
      spacecraftMarkerRef.current.lookAt(scX + vDir.x, scY + vDir.y, scZ + vDir.z);
    }

    // Update Maneuver Vector visualization
    if (maneuverVectorGroupRef.current) {
      // Clear old vector arrows
      while (maneuverVectorGroupRef.current.children.length > 0) {
        const obj = maneuverVectorGroupRef.current.children[0];
        maneuverVectorGroupRef.current.remove(obj);
      }

      if (maneuverNode && projectedWaypoints.length > 10) {
        // Place maneuver node marker along trajectory
        const nodeIdx = Math.min(
          projectedWaypoints.length - 1,
          Math.max(1, Math.floor((maneuverNode.timeToNodeSeconds / (86400 * 180)) * projectedWaypoints.length))
        );
        const nodeWp = projectedWaypoints[nodeIdx];
        const nodePos = new THREE.Vector3(
          (nodeWp.positionKm.x / AU_KM) * auScale,
          (nodeWp.positionKm.z / AU_KM) * auScale,
          (nodeWp.positionKm.y / AU_KM) * auScale
        );

        // Node sphere marker
        const nodeGeo = new THREE.SphereGeometry(1.6, 16, 16);
        const nodeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeMesh.position.copy(nodePos);
        maneuverVectorGroupRef.current.add(nodeMesh);

        // Vector Arrow: Prograde (Green)
        if (Math.abs(maneuverNode.deltaVProgradeKmS) > 0.001) {
          const dir = new THREE.Vector3(1, 0, 0).normalize();
          const arrow = new THREE.ArrowHelper(
            dir,
            nodePos,
            Math.abs(maneuverNode.deltaVProgradeKmS) * 400 + 10,
            0x10b981,
            4,
            2
          );
          maneuverVectorGroupRef.current.add(arrow);
        }

        // Vector Arrow: Normal (Cyan)
        if (Math.abs(maneuverNode.deltaVNormalKmS) > 0.001) {
          const dir = new THREE.Vector3(0, 1, 0).normalize();
          const arrow = new THREE.ArrowHelper(
            dir,
            nodePos,
            Math.abs(maneuverNode.deltaVNormalKmS) * 400 + 10,
            0x06b6d4,
            4,
            2
          );
          maneuverVectorGroupRef.current.add(arrow);
        }
      }
    }

    // Camera target tracking
    if (focusTarget === 'craft' && spacecraftMarkerRef.current) {
      targetLookAtRef.current.lerp(spacecraftMarkerRef.current.position, 0.05);
    } else if (focusTarget === 'sun') {
      targetLookAtRef.current.lerp(new THREE.Vector3(0, 0, 0), 0.05);
    } else if (focusTarget === 'target') {
      targetLookAtRef.current.lerp(new THREE.Vector3(152.4 * Math.cos(1.1), 0, 152.4 * Math.sin(1.1)), 0.05);
    }
  }, [projectedWaypoints, currentTrueAnomaly, mission, maneuverNode, focusTarget]);

  // Toggle Grid & Orbits visibility
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    if (planetsGroupRef.current) planetsGroupRef.current.visible = showOrbits;
  }, [showOrbits]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-[#07090E] overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

      {/* Top Left HUD: Coordinate Frame & Scale Info */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1 font-mono text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>HELIOCENTRIC ECLIPTIC J2000</span>
        </div>
        <div>SCALE: 1 AU = 149.6M km (100u)</div>
        <div className="text-cyan-400">
          PROJECTION: {(projectedWaypoints.length * 1.8).toFixed(0)} DAYS AHEAD
        </div>
        <div className="text-slate-400">
          DRAG TO ORBIT · SCROLL TO ZOOM
        </div>
      </div>

      {/* Top Right HUD: Layer & Focus Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/80 p-1 rounded border border-slate-800 backdrop-blur-sm">
        <button
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle Ecliptic Grid"
          className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
            showGrid ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Grid
        </button>

        <button
          onClick={() => setShowOrbits(!showOrbits)}
          title="Toggle Planetary Orbits"
          className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
            showOrbits ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Orbits
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <button
          onClick={() => setFocusTarget('craft')}
          className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
            focusTarget === 'craft' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Focus Craft
        </button>

        <button
          onClick={() => setFocusTarget('target')}
          className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
            focusTarget === 'target' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Focus Target
        </button>

        <button
          onClick={() => setFocusTarget('sun')}
          className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
            focusTarget === 'sun' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Focus Sun
        </button>
      </div>

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-4 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300 backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>Vehicle Beacon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-cyan-400 border-t border-dashed border-cyan-400" />
          <span>Projected Trajectory</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Maneuver Node (TCM)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Target ({mission.targetBody})</span>
        </div>
      </div>
    </div>
  );
};
