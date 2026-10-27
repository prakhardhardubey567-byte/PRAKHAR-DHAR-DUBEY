/**
 * Maneuver Planner & Trajectory Vector Controller
 * Provides real-time Δv vector manipulation (Prograde, Normal, Radial),
 * calculates trajectory impact, fuel burn, and executes simulated burns.
 */

import React, { useState } from 'react';
import { Flame, RotateCcw, Target, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { ManeuverNode, NavigationTelemetry, DeepSpaceMission } from '../types/astrodynamics';

interface ManeuverPlannerProps {
  maneuverNode: ManeuverNode;
  onUpdateManeuver: (node: ManeuverNode) => void;
  telemetry: NavigationTelemetry;
  mission: DeepSpaceMission;
  onExecuteBurn: () => void;
  isBurnExecuting: boolean;
}

export const ManeuverPlanner: React.FC<ManeuverPlannerProps> = ({
  maneuverNode,
  onUpdateManeuver,
  telemetry,
  mission,
  onExecuteBurn,
  isBurnExecuting,
}) => {
  const [scheduledDays, setScheduledDays] = useState(
    Math.round(maneuverNode.timeToNodeSeconds / 86400)
  );

  // Update vectors helper
  const handleVectorChange = (progradeMS: number, normalMS: number, radialMS: number) => {
    const proKmS = progradeMS / 1000;
    const normKmS = normalMS / 1000;
    const radKmS = radialMS / 1000;
    const totalKmS = Math.sqrt(proKmS * proKmS + normKmS * normKmS + radKmS * radKmS);
    // Burn duration based on ~10 kN thruster & mass ~45,000 kg => a ≈ 0.22 m/s^2
    const burnDuration = Math.max(1, Math.round((totalKmS * 1000) / 0.35));

    onUpdateManeuver({
      ...maneuverNode,
      deltaVProgradeKmS: proKmS,
      deltaVNormalKmS: normKmS,
      deltaVRadialKmS: radKmS,
      totalDeltaVKmS: totalKmS,
      burnDurationSeconds: burnDuration,
      timeToNodeSeconds: scheduledDays * 86400,
    });
  };

  const progradeMS = Math.round(maneuverNode.deltaVProgradeKmS * 1000);
  const normalMS = Math.round(maneuverNode.deltaVNormalKmS * 1000);
  const radialMS = Math.round(maneuverNode.deltaVRadialKmS * 1000);
  const totalMS = Math.round(maneuverNode.totalDeltaVKmS * 1000);

  // Propellant consumption via Tsiolkovsky rocket equation: m_prop = m_0 * (1 - exp(-dv / (g0 * Isp)))
  const g0 = 9.80665;
  const isp = telemetry.ispSeconds || 380;
  const dv = maneuverNode.totalDeltaVKmS * 1000;
  const propFraction = 1 - Math.exp(-dv / (g0 * isp));
  const estimatedFuelBurnKg = Math.round(telemetry.totalMassKg * propFraction);

  // Projected impact estimates
  const projectedPeriapsisShiftKm = Math.round(progradeMS * 1840 + radialMS * 420);
  const projectedArrivalShiftHours = ((-progradeMS * 3.8) / 24).toFixed(1);

  // Reset vectors
  const handleReset = () => {
    handleVectorChange(0, 0, 0);
  };

  // Auto-target calibrated TCM solution
  const handleAutoTarget = () => {
    handleVectorChange(42, 8, -15);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E17] border border-slate-800 rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#07090E]">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-100 tracking-wide">
            TRAJECTORY CORRECTION MANEUVER (TCM) PLANNER
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoTarget}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Optimal TCM Solution</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Zero Vectors</span>
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        {/* Timing schedule */}
        <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>EXECUTION NODE TIMING:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="60"
              value={scheduledDays}
              onChange={(e) => {
                const days = Number(e.target.value);
                setScheduledDays(days);
                onUpdateManeuver({
                  ...maneuverNode,
                  timeToNodeSeconds: days * 86400,
                });
              }}
              className="w-32 accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-cyan-400 min-w-16">
              +{scheduledDays} Days
            </span>
          </div>
        </div>

        {/* 3 Orthogonal Vector Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. PROGRADE / RETROGRADE */}
          <div className="p-3.5 bg-slate-900/40 border border-slate-800 rounded flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">
                Δv Prograde / Retrograde
              </span>
              <span className={`text-xs font-mono font-bold ${progradeMS > 0 ? 'text-emerald-400' : progradeMS < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {progradeMS > 0 ? `+${progradeMS}` : progradeMS} m/s
              </span>
            </div>
            <input
              type="range"
              min="-200"
              max="200"
              step="1"
              value={progradeMS}
              onChange={(e) => handleVectorChange(Number(e.target.value), normalMS, radialMS)}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>-200 m/s (Braking)</span>
              <span>+200 m/s (Boost)</span>
            </div>
          </div>

          {/* 2. NORMAL / ANTI-NORMAL */}
          <div className="p-3.5 bg-slate-900/40 border border-slate-800 rounded flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">
                Δv Normal / Anti-Normal
              </span>
              <span className={`text-xs font-mono font-bold ${normalMS !== 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
                {normalMS > 0 ? `+${normalMS}` : normalMS} m/s
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={normalMS}
              onChange={(e) => handleVectorChange(progradeMS, Number(e.target.value), radialMS)}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Plane Down (-i)</span>
              <span>Plane Up (+i)</span>
            </div>
          </div>

          {/* 3. RADIAL-IN / RADIAL-OUT */}
          <div className="p-3.5 bg-slate-900/40 border border-slate-800 rounded flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">
                Δv Radial In / Out
              </span>
              <span className={`text-xs font-mono font-bold ${radialMS !== 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {radialMS > 0 ? `+${radialMS}` : radialMS} m/s
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={radialMS}
              onChange={(e) => handleVectorChange(progradeMS, normalMS, Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Radial In (-r)</span>
              <span>Radial Out (+r)</span>
            </div>
          </div>
        </div>

        {/* Projected Impact & Burn Specs Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Total Maneuver Δv</span>
            <div className="text-lg font-mono-numbers font-bold text-cyan-400 mt-1">
              {totalMS} <span className="text-xs text-slate-400 font-normal">m/s</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{(totalMS / 1000).toFixed(4)} km/s</span>
          </div>

          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Engine Burn Time</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-100 mt-1">
              {maneuverNode.burnDurationSeconds} <span className="text-xs text-slate-400 font-normal">SEC</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">THRUST: 10.5 kN</span>
          </div>

          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Fuel Required</span>
            <div className="text-lg font-mono-numbers font-bold text-amber-400 mt-1">
              {estimatedFuelBurnKg} <span className="text-xs text-slate-400 font-normal">KG</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">REMAIN: {Math.max(0, telemetry.propellantMassKg - estimatedFuelBurnKg)} kg</span>
          </div>

          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Projected Arrival Shift</span>
            <div className="text-lg font-mono-numbers font-bold text-emerald-400 mt-1">
              {projectedArrivalShiftHours} <span className="text-xs text-slate-400 font-normal">DAYS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">PERIAPSIS: {projectedPeriapsisShiftKm > 0 ? `+${projectedPeriapsisShiftKm}` : projectedPeriapsisShiftKm} km</span>
          </div>
        </div>

        {/* Burn Execution Button */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-4 border-t border-slate-800">
          <div className="text-xs font-mono text-slate-400">
            {maneuverNode.executed ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>Maneuver burn successfully executed and orbital state committed.</span>
              </span>
            ) : totalMS === 0 ? (
              <span>Adjust vector handles above to configure trajectory correction.</span>
            ) : (
              <span>Ready for ignition sequence. Ensure attitude lock is confirmed.</span>
            )}
          </div>

          <button
            onClick={onExecuteBurn}
            disabled={totalMS === 0 || isBurnExecuting}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold rounded transition-all whitespace-nowrap cursor-pointer ${
              isBurnExecuting
                ? 'bg-amber-500 text-slate-950 animate-pulse'
                : totalMS > 0
                ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Flame className={`w-4 h-4 ${isBurnExecuting ? 'animate-bounce text-red-600' : ''}`} />
            <span>{isBurnExecuting ? 'BURNING THRUSTERS...' : 'EXECUTE MANEUVER BURN'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
