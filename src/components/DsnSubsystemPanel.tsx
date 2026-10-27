/**
 * DSN Subsystem & Ground Station Telemetry Panel
 * Monitors Goldstone, Madrid, and Canberra Deep Space complexes
 */

import React from 'react';
import { Radio, Wifi, WifiOff, Globe } from 'lucide-react';
import { GroundStation } from '../types/astrodynamics';
import { GROUND_STATIONS } from '../data/missions';

interface DsnSubsystemPanelProps {
  roundTripLightTimeSeconds: number;
}

export const DsnSubsystemPanel: React.FC<DsnSubsystemPanelProps> = ({
  roundTripLightTimeSeconds,
}) => {
  return (
    <div className="flex flex-col bg-[#0B0E17] border border-slate-800 rounded overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#07090E]">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-100 tracking-wide">
            DEEP SPACE NETWORK (DSN) COMM COMPLEX
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          RTLT: <span className="font-bold text-slate-200">{(roundTripLightTimeSeconds / 60).toFixed(1)} MIN</span> ({roundTripLightTimeSeconds.toFixed(1)}s)
        </div>
      </div>

      <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        {GROUND_STATIONS.map((station) => (
          <div
            key={station.id}
            className={`p-3 rounded border transition-colors ${
              station.carrierLocked
                ? 'bg-slate-900/60 border-cyan-500/30'
                : 'bg-slate-900/20 border-slate-800 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200">{station.name}</span>
              {station.carrierLocked ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                  <Wifi className="w-3 h-3" />
                  CARRIER LOCK
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                  <WifiOff className="w-3 h-3" />
                  BELOW HORIZON
                </span>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-y-1 text-[11px] font-mono text-slate-400">
              <div>ELEVATION:</div>
              <div className="text-right font-mono-numbers text-slate-200">
                {station.elevationAngleDeg >= 0 ? `+${station.elevationAngleDeg.toFixed(1)}°` : `${station.elevationAngleDeg.toFixed(1)}°`}
              </div>

              <div>AZIMUTH:</div>
              <div className="text-right font-mono-numbers text-slate-200">
                {station.azimuthDeg.toFixed(1)}°
              </div>

              <div>BAND / SNR:</div>
              <div className="text-right font-mono-numbers text-slate-200">
                {station.frequencyBand} · {station.snrDb.toFixed(1)} dB
              </div>

              <div>DOPPLER:</div>
              <div className={`text-right font-mono-numbers ${station.dopplerShiftKHz >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {station.dopplerShiftKHz >= 0 ? `+${station.dopplerShiftKHz.toFixed(2)}` : station.dopplerShiftKHz.toFixed(2)} kHz
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
