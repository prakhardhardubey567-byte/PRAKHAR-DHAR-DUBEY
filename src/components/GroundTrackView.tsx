/**
 * 2D MCT Ground Track & Planetary Orbit Display
 * Equirectangular world map with day/night solar terminator, DSN ground stations,
 * orbit ground track sinusoidal projection curves, and sub-satellite crosshair.
 */

import React, { useEffect, useRef, useState } from 'react';
import { NavigationTelemetry, GroundStation, OrbitalElements } from '../types/astrodynamics';
import { GROUND_STATIONS } from '../data/missions';
import { EARTH_RADIUS_KM } from '../physics/orbitPropagator';

interface GroundTrackViewProps {
  telemetry: NavigationTelemetry;
  elements: OrbitalElements;
  metSeconds: number;
}

export const GroundTrackView: React.FC<GroundTrackViewProps> = ({
  telemetry,
  elements,
  metSeconds,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Simplified continent polygons for canvas rendering
  const continentOutlines = [
    // North America
    [[-168, 65], [-140, 70], [-120, 72], [-85, 75], [-60, 60], [-55, 48], [-70, 42], [-80, 25], [-90, 18], [-105, 20], [-120, 34], [-125, 48], [-168, 65]],
    // South America
    [[-80, 10], [-60, 8], [-35, -5], [-38, -20], [-55, -40], [-68, -55], [-75, -45], [-80, -5], [-80, 10]],
    // Eurasia & Africa
    [[-10, 36], [0, 42], [15, 55], [30, 70], [60, 72], [110, 75], [170, 65], [140, 50], [120, 30], [105, 10], [80, 12], [60, 25], [45, 12], [50, -10], [35, -34], [18, -34], [10, 5], [-17, 15], [-10, 36]],
    // Australia
    [[115, -22], [130, -12], [148, -18], [152, -32], [138, -38], [118, -35], [115, -22]],
    // Antarctica
    [[-180, -75], [180, -75]],
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = containerRef.current.clientWidth || 800;
    const height = Math.max(420, containerRef.current.clientHeight || 460);
    canvas.width = width;
    canvas.height = height;

    // Coordinate conversion: Lon (-180 to 180) -> X, Lat (-90 to 90) -> Y
    const lonToX = (lon: number) => ((lon + 180) / 360) * width;
    const latToY = (lat: number) => ((90 - lat) / 180) * height;
    const xToLon = (x: number) => (x / width) * 360 - 180;
    const yToLat = (y: number) => 90 - (y / height) * 180;

    // 1. Draw Deep Space Ocean Background
    ctx.fillStyle = '#07090E';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Subtle Lat/Lon Grid Lines
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;

    // Parallels (every 30 deg)
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = latToY(lat);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#475569';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${Math.abs(lat)}°${lat >= 0 ? 'N' : 'S'}`, 6, y - 3);
    }

    // Equator highlight
    const eqY = latToY(0);
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, eqY);
    ctx.lineTo(width, eqY);
    ctx.stroke();

    // Meridians (every 30 deg)
    for (let lon = -150; lon <= 150; lon += 30) {
      const x = lonToX(lon);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#475569';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${Math.abs(lon)}°${lon >= 0 ? 'E' : 'W'}`, x + 3, height - 6);
    }

    // 3. Draw Solar Day/Night Terminator
    // Sub-solar point moves with time
    const sunLon = (-(metSeconds / 86400 * 360) % 360) + 180;
    const sunLat = 12 * Math.sin((metSeconds / (86400 * 365.25)) * Math.PI * 2); // Solar declination

    ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 4) {
      const lon = xToLon(x);
      // Cosine distance to sun
      const deltaLon = ((lon - sunLon + 540) % 360) - 180;
      // Terminator line where solar altitude = 0
      const termLat = -Math.atan(Math.cos(deltaLon * Math.PI / 180) / Math.tan(Math.max(0.01, sunLat * Math.PI / 180))) * 180 / Math.PI;
      const y = latToY(Math.max(-85, Math.min(85, termLat)));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // 4. Draw Continents
    ctx.strokeStyle = '#334155';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.lineWidth = 1.2;

    continentOutlines.forEach((poly) => {
      ctx.beginPath();
      poly.forEach(([lon, lat], i) => {
        const x = lonToX(lon);
        const y = latToY(lat);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // 5. Draw DSN Ground Stations & AOS Footprints
    GROUND_STATIONS.forEach((station) => {
      const sx = lonToX(station.longitude);
      const sy = latToY(station.latitude);

      // Station visibility footprint (approx 30 deg radius circle)
      const radiusPx = (32 / 360) * width;
      ctx.beginPath();
      ctx.arc(sx, sy, radiusPx, 0, Math.PI * 2);
      ctx.fillStyle = station.carrierLocked ? 'rgba(6, 182, 212, 0.08)' : 'rgba(51, 65, 85, 0.08)';
      ctx.fill();
      ctx.strokeStyle = station.carrierLocked ? 'rgba(6, 182, 212, 0.4)' : 'rgba(51, 65, 85, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Station marker
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = station.carrierLocked ? '#06b6d4' : '#64748b';
      ctx.fill();

      // Station label
      ctx.fillStyle = station.carrierLocked ? '#38bdf8' : '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(station.id.replace('dsn-', '').toUpperCase(), sx + 7, sy + 3);

      // If locked, draw direct downlink beam line to spacecraft
      if (station.carrierLocked) {
        const scX = lonToX(telemetry.longitude);
        const scY = latToY(telemetry.latitude);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(scX, scY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // 6. Draw Orbit Ground Track Waves (Sinusoidal paths taking inclination & Earth rotation into account)
    const inc = Math.min(88, Math.max(5, elements.inclination));
    const periodSec = Math.max(5400, elements.periodSeconds || 5400);
    const nodalPrecessionDeg = (360 / 86164) * periodSec; // Ground track shift per rev

    // Draw 3 revolutions ahead
    for (let rev = 0; rev < 3; rev++) {
      ctx.strokeStyle = rev === 0 ? '#06b6d4' : rev === 1 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = rev === 0 ? 2 : 1;
      if (rev > 0) ctx.setLineDash([4, 4]);

      const lonOffset = telemetry.longitude - rev * nodalPrecessionDeg;
      let prevX: number | null = null;
      let prevY: number | null = null;

      for (let u = 0; u <= 360; u += 2) {
        const uRad = (u * Math.PI) / 180;
        // Orbit ground track latitude: sin(lat) = sin(inc) * sin(u)
        const lat = (Math.asin(Math.sin((inc * Math.PI) / 180) * Math.sin(uRad)) * 180) / Math.PI;

        // Longitude taking Earth rotation into account
        const lon = ((((Math.atan2(Math.cos((inc * Math.PI) / 180) * Math.sin(uRad), Math.cos(uRad)) * 180) / Math.PI) + lonOffset - (u / 360) * nodalPrecessionDeg + 540) % 360) - 180;

        const x = lonToX(lon);
        const y = latToY(lat);

        // Avoid cross-screen wrap line
        if (prevX !== null && Math.abs(x - prevX) < width * 0.4) {
          ctx.beginPath();
          ctx.moveTo(prevX, prevY!);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        prevX = x;
        prevY = y;
      }
      ctx.setLineDash([]);
    }

    // 7. Draw Spacecraft Current Position Crosshair & Halo
    const scX = lonToX(telemetry.longitude);
    const scY = latToY(telemetry.latitude);

    // Crosshairs
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scX - 16, scY);
    ctx.lineTo(scX + 16, scY);
    ctx.moveTo(scX, scY - 16);
    ctx.lineTo(scX, scY + 16);
    ctx.stroke();

    // Radar Target Dot
    ctx.beginPath();
    ctx.arc(scX, scY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label with live lat/lon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const latStr = `${Math.abs(telemetry.latitude).toFixed(2)}°${telemetry.latitude >= 0 ? 'N' : 'S'}`;
    const lonStr = `${Math.abs(telemetry.longitude).toFixed(2)}°${telemetry.longitude >= 0 ? 'E' : 'W'}`;
    ctx.fillText(`CRAFT [${latStr}, ${lonStr}]`, scX + 10, scY - 8);

  }, [telemetry, elements, metSeconds]);

  // Handle canvas mouse move for hover coordinate inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lon = (x / rect.width) * 360 - 180;
    const lat = 90 - (y / rect.height) * 180;
    setHoverCoords({ lat, lon });
  };

  const handleMouseLeave = () => {
    setHoverCoords(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-[#07090E] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Top Left Header HUD */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1 font-mono text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded border border-slate-800 backdrop-blur-sm">
        <div className="text-slate-200 font-semibold tracking-wider">
          MCT GLOBAL GROUND TRACK PROJECTION
        </div>
        <div>PROJECTION: EQUIRECTANGULAR WGS84</div>
        <div className="text-cyan-400">
          SUB-SAT: {Math.abs(telemetry.latitude).toFixed(3)}°{telemetry.latitude >= 0 ? 'N' : 'S'}, {Math.abs(telemetry.longitude).toFixed(3)}°{telemetry.longitude >= 0 ? 'E' : 'W'}
        </div>
        {hoverCoords && (
          <div className="text-amber-400">
            PROBE: {Math.abs(hoverCoords.lat).toFixed(2)}°{hoverCoords.lat >= 0 ? 'N' : 'S'}, {Math.abs(hoverCoords.lon).toFixed(2)}°{hoverCoords.lon >= 0 ? 'E' : 'W'}
          </div>
        )}
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-4 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300 backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>Current Rev (Rev 0)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-t border-dashed border-cyan-400/60" />
          <span>Next Revs (+1, +2)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/30 border border-cyan-400" />
          <span>DSN Coverage Footprint (5° Elev)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-slate-950/80 border border-slate-700" />
          <span>Solar Night / Terminator</span>
        </div>
      </div>
    </div>
  );
};
