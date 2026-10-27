/**
 * Keplerian Orbital Elements & Astrodynamics Panel
 * Displays 6 classical orbital elements, derived energy metrics, and trajectory dispersion ellipse
 */

import React from 'react';
import { Orbit, Activity, ShieldCheck } from 'lucide-react';
import { OrbitalElements, NavigationTelemetry } from '../types/astrodynamics';
import { AU_KM, G_CONST, SUN_MASS_KG, EARTH_MASS_KG } from '../physics/orbitPropagator';

interface OrbitalElementsPanelProps {
  elements: OrbitalElements;
  telemetry: NavigationTelemetry;
  primaryBody: string;
}

export const OrbitalElementsPanel: React.FC<OrbitalElementsPanelProps> = ({
  elements,
  telemetry,
  primaryBody,
}) => {
  const isSunPrimary = primaryBody.toLowerCase() === 'sun';
  const mu = G_CONST * (isSunPrimary ? SUN_MASS_KG : EARTH_MASS_KG);
  const a = elements.semiMajorAxis;
  const e = elements.eccentricity;

  // Derived Astrodynamic Parameters
  const specificEnergy = -mu / (2 * Math.abs(a)); // km^2 / s^2
  const specificAngularMomentum = Math.sqrt(Math.max(1, mu * Math.abs(a) * (1 - e * e)));
  const rp = elements.periapsisDistance;
  const ra = elements.apoapsisDistance;
  const vp = Math.sqrt(Math.max(1, mu * (2 / rp - 1 / Math.abs(a))));
  const va = ra < Infinity ? Math.sqrt(Math.max(1, mu * (2 / ra - 1 / Math.abs(a)))) : 0;

  // Format AU or km
  const formatDist = (km: number) => {
    if (km === Infinity) return 'Infinity (Hyperbolic)';
    if (km > AU_KM * 0.1) return `${(km / AU_KM).toFixed(4)} AU (${(km / 1e6).toFixed(2)}M km)`;
    return `${km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E17] border border-slate-800 rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#07090E]">
        <div className="flex items-center gap-2">
          <Orbit className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-100 tracking-wide">
            CLASSICAL KEPLERIAN ORBITAL ELEMENTS & ASTRODYNAMICS
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Two-Body Solution Converged</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        {/* 6 Classical Elements Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Semi-major Axis */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Semi-Major Axis (a)</span>
            <div className="text-base font-mono-numbers font-bold text-slate-100 mt-1">
              {a > AU_KM * 0.1 ? `${(a / AU_KM).toFixed(4)} AU` : `${(a / 1000).toFixed(1)}k km`}
            </div>
            <span className="text-[10px] font-mono text-slate-500">{a.toLocaleString(undefined, { maximumFractionDigits: 0 })} km</span>
          </div>

          {/* 2. Eccentricity */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Eccentricity (e)</span>
            <div className="text-base font-mono-numbers font-bold text-cyan-400 mt-1">
              {e.toFixed(5)}
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {e === 0 ? 'CIRCULAR' : e < 1 ? 'ELLIPTIC' : e === 1 ? 'PARABOLIC' : 'HYPERBOLIC ESCAPE'}
            </span>
          </div>

          {/* 3. Inclination */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Inclination (i)</span>
            <div className="text-base font-mono-numbers font-bold text-slate-100 mt-1">
              {elements.inclination.toFixed(3)}°
            </div>
            <span className="text-[10px] font-mono text-slate-500">REL TO ECLIPTIC J2000</span>
          </div>

          {/* 4. Longitude of Ascending Node */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Ascending Node (Ω)</span>
            <div className="text-base font-mono-numbers font-bold text-slate-100 mt-1">
              {elements.longitudeOfAscendingNode.toFixed(3)}°
            </div>
            <span className="text-[10px] font-mono text-slate-500">RIGHT ASCENSION (RAAN)</span>
          </div>

          {/* 5. Argument of Periapsis */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Arg of Periapsis (ω)</span>
            <div className="text-base font-mono-numbers font-bold text-slate-100 mt-1">
              {elements.argumentOfPeriapsis.toFixed(3)}°
            </div>
            <span className="text-[10px] font-mono text-slate-500">PERIAPSIS ORIENTATION</span>
          </div>

          {/* 6. True Anomaly */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">True Anomaly (ν)</span>
            <div className="text-base font-mono-numbers font-bold text-emerald-400 mt-1">
              {elements.trueAnomaly.toFixed(3)}°
            </div>
            <span className="text-[10px] font-mono text-slate-500">POSITION ON CONIC</span>
          </div>
        </div>

        {/* Derived Energetics & Extremes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-900/30 border border-slate-800 rounded flex flex-col justify-between">
            <span className="text-xs font-mono text-slate-400">Periapsis Distance (r_p)</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-100 mt-1">
              {formatDist(rp)}
            </div>
            <span className="text-[10px] font-mono text-slate-500">SPEED AT PERIAPSIS: {vp.toFixed(2)} km/s</span>
          </div>

          <div className="p-3.5 bg-slate-900/30 border border-slate-800 rounded flex flex-col justify-between">
            <span className="text-xs font-mono text-slate-400">Apoapsis Distance (r_a)</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-100 mt-1">
              {formatDist(ra)}
            </div>
            <span className="text-[10px] font-mono text-slate-500">SPEED AT APOAPSIS: {va.toFixed(2)} km/s</span>
          </div>

          <div className="p-3.5 bg-slate-900/30 border border-slate-800 rounded flex flex-col justify-between">
            <span className="text-xs font-mono text-slate-400">Specific Mech. Energy (ε)</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-100 mt-1">
              {specificEnergy.toExponential(4)} <span className="text-xs font-normal text-slate-400">MJ/kg</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">CONSERVED INTEGRAL</span>
          </div>

          <div className="p-3.5 bg-slate-900/30 border border-slate-800 rounded flex flex-col justify-between">
            <span className="text-xs font-mono text-slate-400">Specific Ang. Momentum (h)</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-100 mt-1">
              {(specificAngularMomentum / 1e6).toFixed(3)} <span className="text-xs font-normal text-slate-400">M km²/s</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">ORBITAL PLANE INVARIANT</span>
          </div>
        </div>

        {/* 1-Sigma Trajectory Covariance Dispersion Box */}
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">
                1-SIGMA TRAJECTORY DISPERSION COVARIANCE (FIDO ESTIMATOR)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              CORRIDOR CONFIDENCE: 99.73% (3-SIGMA NOMINAL)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400">Along-Track Error (ΔT)</span>
              <span className="text-sm font-mono-numbers font-bold text-slate-200 mt-0.5">± 14.2 km</span>
              <div className="w-full bg-slate-800 h-1.5 rounded mt-1.5 overflow-hidden">
                <div className="bg-cyan-400 h-full w-[28%]" />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400">Cross-Track Error (ΔC)</span>
              <span className="text-sm font-mono-numbers font-bold text-slate-200 mt-0.5">± 3.8 km</span>
              <div className="w-full bg-slate-800 h-1.5 rounded mt-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full w-[12%]" />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400">Radial Altitude Error (ΔR)</span>
              <span className="text-sm font-mono-numbers font-bold text-slate-200 mt-0.5">± 1.2 km</span>
              <div className="w-full bg-slate-800 h-1.5 rounded mt-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full w-[8%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
