/**
 * Primary Navigation Telemetry Grid
 * Features Latitude, Longitude, Altitude, Speed, Flight Path Angle, True Anomaly, and Delta-V
 * Conforms to MCT flight dynamics standards and scientific display specs.
 */

import React from 'react';
import { NavigationTelemetry, OrbitalElements } from '../types/astrodynamics';
import { AU_KM } from '../physics/orbitPropagator';

interface PrimaryMetricsGridProps {
  telemetry: NavigationTelemetry;
  elements: OrbitalElements;
  primaryBody: string;
}

export const PrimaryMetricsGrid: React.FC<PrimaryMetricsGridProps> = ({
  telemetry,
  elements,
  primaryBody,
}) => {
  // Format Latitude with N/S suffix
  const formatLatitude = (lat: number) => {
    const dir = lat >= 0 ? 'N' : 'S';
    return `${Math.abs(lat).toFixed(4)}° ${dir}`;
  };

  // Format Longitude with E/W suffix
  const formatLongitude = (lon: number) => {
    const dir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lon).toFixed(4)}° ${dir}`;
  };

  // Format Altitude cleanly with AU or km
  const formatAltitude = (altKm: number) => {
    if (altKm > AU_KM * 0.1) {
      const au = altKm / AU_KM;
      return { value: au.toFixed(4), unit: 'AU', sub: `${(altKm / 1e6).toFixed(2)}M km` };
    }
    return {
      value: altKm.toLocaleString(undefined, { maximumFractionDigits: 1 }),
      unit: 'KM',
      sub: `${(altKm + 6371).toLocaleString(undefined, { maximumFractionDigits: 1 })} km rad`,
    };
  };

  const altDisplay = formatAltitude(telemetry.altitudeKm);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px bg-slate-800 border-b border-slate-800">
      {/* 1. LATITUDE */}
      <div className="bg-[#0B0E17] p-3.5 flex flex-col justify-between">
        <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
          Sub-Sat Latitude
        </span>
        <div className="mt-1 flex items-baseline">
          <span className="text-xl md:text-2xl font-mono-numbers font-bold text-slate-100">
            {formatLatitude(telemetry.latitude)}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 mt-1">
          REF: {primaryBody.toUpperCase()} EQUATORIAL
        </span>
      </div>

      {/* 2. LONGITUDE */}
      <div className="bg-[#0B0E17] p-3.5 flex flex-col justify-between">
        <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
          Sub-Sat Longitude
        </span>
        <div className="mt-1 flex items-baseline">
          <span className="text-xl md:text-2xl font-mono-numbers font-bold text-slate-100">
            {formatLongitude(telemetry.longitude)}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 mt-1">
          PRIME MERIDIAN ROT
        </span>
      </div>

      {/* 3. ALTITUDE */}
      <div className="bg-[#0B0E17] p-3.5 flex flex-col justify-between">
        <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
          Altitude (h)
        </span>
        <div className="mt-1 flex items-baseline">
          <span className="text-xl md:text-2xl font-mono-numbers font-bold text-cyan-400">
            {altDisplay.value}
          </span>
          <span className="text-xs uppercase font-mono text-slate-400 ml-1.5 font-medium">
            {altDisplay.unit}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 mt-1">
          {altDisplay.sub}
        </span>
      </div>

      {/* 4. INERTIAL SPEED */}
      <div className="bg-[#0B0E17] p-3.5 flex flex-col justify-between">
        <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
          Inertial Speed (v)
        </span>
        <div className="mt-1 flex items-baseline">
          <span className="text-xl md:text-2xl font-mono-numbers font-bold text-slate-100">
            {telemetry.speedInertialKmS.toFixed(3)}
          </span>
          <span className="text-xs uppercase font-mono text-slate-400 ml-1.5 font-medium">
            KM/S
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 mt-1">
          {(telemetry.speedInertialKmS * 3600).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/h
        </span>
      </div>

      {/* 5. GROUND SPEED */}
      <div className="bg-[#0B0E17] p-3.5 flex flex-col justify-between">
        <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
          Ground Track Speed
        </span>
        <div className="mt-1 flex items-baseline">
          <span className="text-xl md:text-2xl font-mono-numbers font-bold text-slate-100">
            {telemetry.speedGroundKmS.toFixed(3)}
          </span>
          <span className="text-xs uppercase font-mono text-slate-400 ml-1.5 font-medium">
            KM/S
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 mt-1">
          SURFACE HORIZONTAL
        </span>
      </div>

      {/* 6. FLIGHT PATH ANGLE */}
      <div className="bg-[#0B0E17] p-3.5 flex flex-col justify-between">
        <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
          Flight Path Angle (γ)
        </span>
        <div className="mt-1 flex items-baseline">
          <span className="text-xl md:text-2xl font-mono-numbers font-bold text-slate-100">
            {telemetry.flightPathAngleDeg >= 0 ? '+' : ''}
            {telemetry.flightPathAngleDeg.toFixed(2)}°
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 mt-1">
          {Math.abs(telemetry.flightPathAngleDeg) < 0.1 ? 'CIRCULAR HORIZON' : telemetry.flightPathAngleDeg > 0 ? 'CLIMBING' : 'DESCENDING'}
        </span>
      </div>

      {/* 7. TRUE ANOMALY */}
      <div className="bg-[#0B0E17] p-3.5 flex flex-col justify-between">
        <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
          True Anomaly (ν)
        </span>
        <div className="mt-1 flex items-baseline">
          <span className="text-xl md:text-2xl font-mono-numbers font-bold text-slate-100">
            {elements.trueAnomaly.toFixed(2)}°
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 mt-1">
          ECC: {elements.eccentricity.toFixed(4)}
        </span>
      </div>

      {/* 8. DELTA-V REMAINING */}
      <div className="bg-[#0B0E17] p-3.5 flex flex-col justify-between">
        <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
          Delta-V Reserve (Δv)
        </span>
        <div className="mt-1 flex items-baseline">
          <span className="text-xl md:text-2xl font-mono-numbers font-bold text-emerald-400">
            {(telemetry.deltaVRemainingKmS * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs uppercase font-mono text-slate-400 ml-1.5 font-medium">
            M/S
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 mt-1">
          MASS: {(telemetry.propellantMassKg / 1000).toFixed(1)}t PROP
        </span>
      </div>
    </div>
  );
};
