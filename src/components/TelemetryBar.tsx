/**
 * Telemetry Ribbon & Mission State Bar
 * Provides Mission Elapsed Time (MET), Time Warp Multipliers, DSN state, and mission profile selection
 */

import React from 'react';
import { Play, Pause, FastForward, RotateCcw, Radio } from 'lucide-react';
import { DeepSpaceMission } from '../types/astrodynamics';
import { MISSIONS } from '../data/missions';

interface TelemetryBarProps {
  currentMission: DeepSpaceMission;
  onSelectMission: (mission: DeepSpaceMission) => void;
  metSeconds: number;
  timeWarp: number;
  onChangeTimeWarp: (warp: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onResetTime: () => void;
  carrierLocked: boolean;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  currentMission,
  onSelectMission,
  metSeconds,
  timeWarp,
  onChangeTimeWarp,
  isPaused,
  onTogglePause,
  onResetTime,
  carrierLocked,
}) => {
  // Format MET: T+042D 07H:22M:14S
  const formatMET = (totalSec: number) => {
    const days = Math.floor(totalSec / 86400);
    const remD = totalSec % 86400;
    const hours = Math.floor(remD / 3600);
    const remH = remD % 3600;
    const minutes = Math.floor(remH / 60);
    const seconds = Math.floor(remH % 60);

    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    return `T+${pad(days, 3)}D ${pad(hours)}H:${pad(minutes)}M:${pad(seconds)}S`;
  };

  const warpOptions = [1, 10, 100, 1000, 10000];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-2.5 bg-[#07090E] border-b border-slate-800 text-xs">
      {/* Left: Mission Selector & Flight State */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="mission-select" className="text-slate-400 uppercase font-mono tracking-wider text-[11px]">
            Vehicle:
          </label>
          <select
            id="mission-select"
            value={currentMission.id}
            onChange={(e) => {
              const selected = MISSIONS.find((m) => m.id === e.target.value);
              if (selected) onSelectMission(selected);
            }}
            className="bg-[#0B0E17] text-slate-100 font-medium px-2.5 py-1 rounded border border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {MISSIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} · {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Target</span>
          <span className="font-semibold text-slate-200">{currentMission.targetBody}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500">Ref</span>
          <span className="font-semibold text-slate-200">{currentMission.primaryBody}</span>
        </div>

        {/* State Indicator: text-first, non-hue-only */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Guidance:</span>
          <span className="font-mono font-semibold text-emerald-400">● Nominal Trajectory</span>
        </div>
      </div>

      {/* Center: Mission Elapsed Time */}
      <div className="flex items-center gap-3">
        <span className="text-slate-400 uppercase tracking-widest text-[11px] font-mono">MET</span>
        <div className="bg-[#0B0E17] px-3.5 py-1 rounded border border-slate-800 font-mono-numbers text-sm font-bold text-cyan-400 tracking-wider">
          {formatMET(metSeconds)}
        </div>
      </div>

      {/* Right: Simulation Time Warp Controls & DSN status */}
      <div className="flex items-center gap-5">
        {/* DSN Status */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Radio className={`w-3.5 h-3.5 ${carrierLocked ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
          <span className="text-slate-400">DSN:</span>
          <span className={carrierLocked ? 'text-slate-200' : 'text-slate-500'}>
            {carrierLocked ? 'Locked (OWLT: ' + currentMission.oneWayLightTimeSeconds.toFixed(1) + 's)' : 'LOS'}
          </span>
        </div>

        {/* Warp selector */}
        <div className="flex items-center gap-1 bg-[#0B0E17] p-0.5 rounded border border-slate-800">
          <button
            onClick={onTogglePause}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isPaused ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {warpOptions.map((w) => (
            <button
              key={w}
              onClick={() => {
                if (isPaused) onTogglePause();
                onChangeTimeWarp(w);
              }}
              className={`px-2 py-1 font-mono text-[11px] rounded transition-colors cursor-pointer ${
                timeWarp === w && !isPaused
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {w >= 1000 ? `${w / 1000}kx` : `${w}x`}
            </button>
          ))}

          <button
            onClick={onResetTime}
            title="Reset Simulation Time"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
