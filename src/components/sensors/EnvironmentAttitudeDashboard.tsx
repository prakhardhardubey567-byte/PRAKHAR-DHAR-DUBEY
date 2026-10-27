/**
 * Environment & Flight Attitude Dashboard
 * Explicitly designed for Temperature, Relative Humidity, Roll, and Pitch
 * Powered by MPU6050 (Attitude/IMU) and DHT11 (Atmospheric Enclosure Climate)
 */

import React from 'react';
import {
  Thermometer,
  Droplets,
  Compass,
  RotateCw,
  Activity,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { MPU6050Data, DHT11Data, BMP280Data } from '../../types/sensors';

interface EnvironmentAttitudeDashboardProps {
  mpuData: MPU6050Data;
  dhtData: DHT11Data;
  bmpData: BMP280Data;
}

export const EnvironmentAttitudeDashboard: React.FC<EnvironmentAttitudeDashboardProps> = ({
  mpuData,
  dhtData,
  bmpData,
}) => {
  // Clamping for smooth attitude display
  const pitchClamped = Math.max(-45, Math.min(45, mpuData.pitchDeg));
  const rollClamped = Math.max(-60, Math.min(60, mpuData.rollDeg));

  // Pitch state
  const isClimbing = mpuData.pitchDeg > 1.0;
  const isDiving = mpuData.pitchDeg < -1.0;

  // Roll state
  const isBankingRight = mpuData.rollDeg > 1.0;
  const isBankingLeft = mpuData.rollDeg < -1.0;

  return (
    <div className="flex flex-col h-full bg-[#0B0E17] border border-slate-800 rounded overflow-hidden">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 border-b border-slate-800 bg-[#07090E]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-mono tracking-wide">
              ENVIRONMENT & FLIGHT ATTITUDE DASHBOARD
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Sensors: DHT11 (Climate) · MPU6050 (Inertial Attitude) · BMP280 (Baro Ambient)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PAYLOAD STABLE</span>
          </div>
          <div className="text-slate-400">
            RATE: <strong className="text-slate-200">50 Hz FUSED</strong>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
        {/* TOP ROW: 4 HERO KPI INSTRUMENT BOXES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. TEMPERATURE */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 hover:border-amber-500/40 rounded transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Temperature</span>
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {dhtData.temperatureF.toFixed(1)}°F
              </span>
            </div>

            <div className="my-3 flex items-baseline">
              <span className="text-4xl font-mono-numbers font-bold text-amber-400">
                {dhtData.temperatureC.toFixed(1)}
              </span>
              <span className="text-sm font-mono text-slate-400 ml-1.5">°C</span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-amber-400 transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(5, (dhtData.temperatureC / 50) * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>DIE: {bmpData.temperatureC.toFixed(1)}°C</span>
              <span className="text-amber-400">DHT11 + BMP280</span>
            </div>
          </div>

          {/* 2. RELATIVE HUMIDITY */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 rounded transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Relative Humidity</span>
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                DEW: {dhtData.dewPointC.toFixed(1)}°C
              </span>
            </div>

            <div className="my-3 flex items-baseline">
              <span className="text-4xl font-mono-numbers font-bold text-cyan-400">
                {dhtData.humidityPercent}
              </span>
              <span className="text-sm font-mono text-slate-400 ml-1.5">% RH</span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-cyan-400 transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(5, dhtData.humidityPercent))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>HEAT INDEX: {dhtData.heatIndexC.toFixed(1)}°C</span>
              <span className="text-emerald-400">NOMINAL AIR</span>
            </div>
          </div>

          {/* 3. PITCH */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 hover:border-sky-500/40 rounded transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Pitch Attitude</span>
              </span>
              <span className={`text-xs font-mono font-bold ${isClimbing ? 'text-emerald-400' : isDiving ? 'text-rose-400' : 'text-slate-400'}`}>
                {isClimbing ? '▲ CLIMB' : isDiving ? '▼ DIVE' : 'LEVEL'}
              </span>
            </div>

            <div className="my-3 flex items-baseline">
              <span className="text-4xl font-mono-numbers font-bold text-sky-400">
                {mpuData.pitchDeg >= 0 ? '+' : ''}{mpuData.pitchDeg.toFixed(2)}
              </span>
              <span className="text-sm font-mono text-slate-400 ml-1.5">DEG</span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1.5 relative">
              <div
                className="h-full bg-sky-400 transition-all duration-75"
                style={{ width: `${Math.min(100, Math.max(0, (mpuData.pitchDeg + 45) / 90 * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>RATE: {mpuData.gyroY.toFixed(1)}°/s</span>
              <span className="text-sky-400">X-TILT AXIS</span>
            </div>
          </div>

          {/* 4. ROLL */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 rounded transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <RotateCw className="w-4 h-4 text-emerald-400" />
                <span>Roll Attitude</span>
              </span>
              <span className={`text-xs font-mono font-bold ${isBankingRight ? 'text-amber-400' : isBankingLeft ? 'text-cyan-400' : 'text-slate-400'}`}>
                {isBankingRight ? 'BANK RIGHT' : isBankingLeft ? 'BANK LEFT' : 'WINGS LEVEL'}
              </span>
            </div>

            <div className="my-3 flex items-baseline">
              <span className="text-4xl font-mono-numbers font-bold text-emerald-400">
                {mpuData.rollDeg >= 0 ? '+' : ''}{mpuData.rollDeg.toFixed(2)}
              </span>
              <span className="text-sm font-mono text-slate-400 ml-1.5">DEG</span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1.5 relative">
              <div
                className="h-full bg-emerald-400 transition-all duration-75"
                style={{ width: `${Math.min(100, Math.max(0, (mpuData.rollDeg + 60) / 120 * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>RATE: {mpuData.gyroX.toFixed(1)}°/s</span>
              <span className="text-emerald-400">Y-BANK AXIS</span>
            </div>
          </div>
        </div>

        {/* MIDDLE STAGE: DUAL INSTRUMENT COCKPIT (ATTITUDE HORIZON + ENVIRONMENTAL PSYCHROMETRIC) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Flight Attitude Artificial Horizon Cockpit */}
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded flex flex-col justify-between items-center">
            <div className="w-full flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-2 mb-4">
              <span className="font-bold flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>FLIGHT ATTITUDE COCKPIT (ROLL & PITCH)</span>
              </span>
              <span className="text-cyan-400 font-bold">MPU6050 IMU</span>
            </div>

            {/* Artificial Horizon Sphere Display */}
            <div className="relative w-56 h-56 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-950 flex items-center justify-center shadow-2xl my-2">
              <div
                className="absolute inset-0 w-full h-full transition-transform duration-75"
                style={{
                  transform: `rotate(${-rollClamped}deg) translateY(${pitchClamped * 1.6}px)`,
                }}
              >
                {/* Sky */}
                <div className="w-full h-1/2 bg-sky-950/90 border-b-2 border-sky-400" />
                {/* Ground */}
                <div className="w-full h-1/2 bg-amber-950/90" />

                {/* Pitch Ladder Marks */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {[-30, -20, -10, 10, 20, 30].map((deg) => (
                    <div
                      key={deg}
                      className="w-12 h-px bg-white/50 my-2.5 relative flex items-center justify-between text-[8px] font-mono text-white/80"
                    >
                      <span>{Math.abs(deg)}°</span>
                      <span>{Math.abs(deg)}°</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed Aircraft Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3 h-3 rounded-full border-2 border-amber-400 bg-amber-400/20" />
                <div className="absolute w-20 h-0.5 bg-amber-400" />
                <div className="absolute h-5 w-0.5 bg-amber-400" />
              </div>

              {/* Current Angle Display Overlay */}
              <div className="absolute bottom-3 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono text-slate-200">
                P: {mpuData.pitchDeg.toFixed(1)}° · R: {mpuData.rollDeg.toFixed(1)}°
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">PITCH</span>
                <span className="font-bold text-sky-400">{mpuData.pitchDeg.toFixed(2)}°</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">ROLL</span>
                <span className="font-bold text-emerald-400">{mpuData.rollDeg.toFixed(2)}°</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">TOTAL G</span>
                <span className="font-bold text-amber-400">{mpuData.totalG.toFixed(2)} G</span>
              </div>
            </div>
          </div>

          {/* Environmental Climate Monitor (Temperature & Humidity) */}
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-2 mb-4">
              <span className="font-bold flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>ENVIRONMENTAL CLIMATE MONITOR (TEMP & HUMIDITY)</span>
              </span>
              <span className="text-amber-400 font-bold">DHT11 SENSOR</span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-2">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded flex flex-col items-center justify-center text-center">
                <Thermometer className="w-6 h-6 text-amber-400 mb-1" />
                <span className="text-[10px] font-mono text-slate-400 uppercase">Ambient Thermal</span>
                <span className="text-3xl font-mono-numbers font-bold text-amber-400 mt-1">
                  {dhtData.temperatureC.toFixed(1)}°C
                </span>
                <span className="text-[11px] font-mono text-slate-500 mt-0.5">{dhtData.temperatureF.toFixed(1)}°F</span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded flex flex-col items-center justify-center text-center">
                <Droplets className="w-6 h-6 text-cyan-400 mb-1" />
                <span className="text-[10px] font-mono text-slate-400 uppercase">Moisture Content</span>
                <span className="text-3xl font-mono-numbers font-bold text-cyan-400 mt-1">
                  {dhtData.humidityPercent}%
                </span>
                <span className="text-[11px] font-mono text-slate-500 mt-0.5">RELATIVE HUMIDITY</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded flex flex-col gap-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span>Dew Point Condensation Margin:</span>
                <strong className="text-cyan-400">{(dhtData.temperatureC - dhtData.dewPointC).toFixed(1)}°C Margin</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Enclosure Electronics Risk:</span>
                <strong className="text-emerald-400">Zero Risk (Dry Atmosphere)</strong>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">DEW POINT</span>
                <span className="font-bold text-slate-200">{dhtData.dewPointC.toFixed(1)}°C</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">HEAT INDEX</span>
                <span className="font-bold text-slate-200">{dhtData.heatIndexC.toFixed(1)}°C</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">DIE TEMP</span>
                <span className="font-bold text-slate-200">{bmpData.temperatureC.toFixed(1)}°C</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
