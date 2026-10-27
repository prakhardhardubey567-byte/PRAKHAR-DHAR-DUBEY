/**
 * MPU6050 6-DOF IMU & Gyroscope Telemetry View
 * Accelerometer (Ax, Ay, Az), Gyroscope (Gx, Gy, Gz), Pitch/Roll Artificial Horizon
 */

import React, { useState } from 'react';
import { Compass, RotateCw, Activity, Sliders, CheckCircle } from 'lucide-react';
import { MPU6050Data } from '../../types/sensors';

interface Mpu6050ViewProps {
  data: MPU6050Data;
  onZeroCalibration?: () => void;
}

export const Mpu6050View: React.FC<Mpu6050ViewProps> = ({ data, onZeroCalibration }) => {
  const [calibrated, setCalibrated] = useState(false);

  const handleCalibrate = () => {
    setCalibrated(true);
    if (onZeroCalibration) onZeroCalibration();
    setTimeout(() => setCalibrated(false), 2000);
  };

  // Artificial Horizon transform calculations
  const pitchClamped = Math.max(-45, Math.min(45, data.pitchDeg));
  const rollClamped = Math.max(-60, Math.min(60, data.rollDeg));

  return (
    <div className="flex flex-col h-full bg-[#0B0E17] border border-slate-800 rounded overflow-hidden">
      {/* Sensor Title & Bus Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-[#07090E]">
        <div className="flex items-center gap-3">
          <Compass className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-semibold font-mono text-slate-100 tracking-wide">
            MPU6050 · 6-AXIS MOTION TRACKING IMU & GYROSCOPE
          </span>
          <span className="text-xs font-mono text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2 py-0.5 rounded">
            I2C: {data.i2cAddress} · {data.sampleRateHz} Hz
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCalibrate}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded transition-colors cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>{calibrated ? 'Offsets Zeroed!' : 'Zero Gyro Bias'}</span>
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Total G-Loading</span>
            <div className="text-xl font-mono-numbers font-bold text-sky-400 mt-1">
              {data.totalG.toFixed(3)} <span className="text-xs text-slate-400 font-normal">G</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{(data.totalG * 9.80665).toFixed(2)} m/s²</span>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Euler Pitch</span>
            <div className="text-xl font-mono-numbers font-bold text-slate-100 mt-1">
              {data.pitchDeg >= 0 ? '+' : ''}{data.pitchDeg.toFixed(2)}°
            </div>
            <span className="text-[10px] font-mono text-slate-500">X-AXIS TILT</span>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Euler Roll</span>
            <div className="text-xl font-mono-numbers font-bold text-slate-100 mt-1">
              {data.rollDeg >= 0 ? '+' : ''}{data.rollDeg.toFixed(2)}°
            </div>
            <span className="text-[10px] font-mono text-slate-500">Y-AXIS BANK</span>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Die Temperature</span>
            <div className="text-xl font-mono-numbers font-bold text-emerald-400 mt-1">
              {data.temperatureC.toFixed(1)}°C
            </div>
            <span className="text-[10px] font-mono text-slate-500">INTERNAL SENSOR DIE</span>
          </div>
        </div>

        {/* Middle Stage: Artificial Horizon + 3-Axis Accel & Gyro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Artificial Horizon (5 Cols) */}
          <div className="lg:col-span-5 bg-[#07090E] border border-slate-800 rounded p-4 flex flex-col items-center justify-between">
            <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>ARTIFICIAL HORIZON ATTITUDE HUD</span>
              <span className="text-sky-400">PITCH: {data.pitchDeg.toFixed(1)}°</span>
            </div>

            {/* SVG Gyroscope Attitude Sphere */}
            <div className="relative w-52 h-52 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-950 flex items-center justify-center shadow-inner">
              {/* Sky and Ground Rectangles that rotate and pitch */}
              <div
                className="absolute inset-0 w-full h-full transition-transform duration-75"
                style={{
                  transform: `rotate(${-rollClamped}deg) translateY(${pitchClamped * 1.5}px)`,
                }}
              >
                {/* Sky (Top Half) */}
                <div className="w-full h-1/2 bg-sky-950/80 border-b-2 border-sky-400/80" />
                {/* Ground (Bottom Half) */}
                <div className="w-full h-1/2 bg-amber-950/80" />

                {/* Pitch Ladder Marks */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {[-30, -20, -10, 10, 20, 30].map((deg) => (
                    <div
                      key={deg}
                      className="w-10 h-px bg-white/40 my-2 relative flex items-center justify-between text-[8px] font-mono text-white/70"
                    >
                      <span>{Math.abs(deg)}</span>
                      <span>{Math.abs(deg)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed Aircraft Crosshair Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 bg-amber-400/30" />
                <div className="absolute w-16 h-0.5 bg-amber-400" />
                <div className="absolute h-4 w-0.5 bg-amber-400" />
              </div>

              {/* Bank Roll Indicator Arc */}
              <div className="absolute top-2 text-[10px] font-mono font-bold text-amber-400">
                {rollClamped >= 0 ? `+${rollClamped.toFixed(0)}°` : `${rollClamped.toFixed(0)}°`}
              </div>
            </div>

            <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-500 mt-2">
              <span>ROLL: {data.rollDeg.toFixed(1)}°</span>
              <span>YAW: {data.yawDeg.toFixed(1)}°</span>
            </div>
          </div>

          {/* 3-Axis Accel & Gyro Details (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* 3-Axis Accelerometer */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-200">ACCELEROMETER (±2G / ±16G SCALE)</span>
                <span className="text-slate-400">m/s²</span>
              </div>

              {/* Ax */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-sky-400 w-8">A_x</span>
                <div className="flex-1 bg-slate-800 h-2 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-sky-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, (data.accelX + 19.6) / 39.2 * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-100 w-20 text-right tabular-nums">
                  {data.accelX.toFixed(3)}
                </span>
              </div>

              {/* Ay */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-sky-400 w-8">A_y</span>
                <div className="flex-1 bg-slate-800 h-2 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-sky-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, (data.accelY + 19.6) / 39.2 * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-100 w-20 text-right tabular-nums">
                  {data.accelY.toFixed(3)}
                </span>
              </div>

              {/* Az */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-sky-400 w-8">A_z</span>
                <div className="flex-1 bg-slate-800 h-2 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-sky-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, (data.accelZ + 19.6) / 39.2 * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-100 w-20 text-right tabular-nums">
                  {data.accelZ.toFixed(3)}
                </span>
              </div>
            </div>

            {/* 3-Axis Gyroscope */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-200">GYROSCOPE ANGULAR VELOCITY</span>
                <span className="text-slate-400">deg/s</span>
              </div>

              {/* Gx */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400 w-8">ω_x</span>
                <div className="flex-1 bg-slate-800 h-2 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, (data.gyroX + 250) / 500 * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-100 w-20 text-right tabular-nums">
                  {data.gyroX.toFixed(2)}
                </span>
              </div>

              {/* Gy */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400 w-8">ω_y</span>
                <div className="flex-1 bg-slate-800 h-2 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, (data.gyroY + 250) / 500 * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-100 w-20 text-right tabular-nums">
                  {data.gyroY.toFixed(2)}
                </span>
              </div>

              {/* Gz */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400 w-8">ω_z</span>
                <div className="flex-1 bg-slate-800 h-2 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, (data.gyroZ + 250) / 500 * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-100 w-20 text-right tabular-nums">
                  {data.gyroZ.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
