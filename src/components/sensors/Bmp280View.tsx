/**
 * BMP280 High-Precision Barometric Pressure & Altitude Sensor View
 * Real-time Atmospheric Pressure (hPa/Pa), Barometric Altitude (m/ft), Variometer (VSI), Die Temp
 */

import React, { useState } from 'react';
import { Gauge, ArrowUp, ArrowDown, Thermometer, Wind } from 'lucide-react';
import { BMP280Data } from '../../types/sensors';

interface Bmp280ViewProps {
  data: BMP280Data;
  onCalibrateQNH?: (qnh: number) => void;
}

export const Bmp280View: React.FC<Bmp280ViewProps> = ({ data, onCalibrateQNH }) => {
  const [seaLevelQnh, setSeaLevelQnh] = useState(data.seaLevelPressureHpa || 1013.25);

  const handleQnhChange = (val: number) => {
    setSeaLevelQnh(val);
    if (onCalibrateQNH) onCalibrateQNH(val);
  };

  const isAscending = data.verticalSpeedMS > 0.1;
  const isDescending = data.verticalSpeedMS < -0.1;

  return (
    <div className="flex flex-col h-full bg-[#0B0E17] border border-slate-800 rounded overflow-hidden">
      {/* Sensor Title & Bus Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-[#07090E]">
        <div className="flex items-center gap-3">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold font-mono text-slate-100 tracking-wide">
            BMP280 · DIGITAL BAROMETRIC PRESSURE & ALTIMETER
          </span>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            I2C: {data.i2cAddress} · 10 Hz
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>QNH REF:</span>
          <input
            type="number"
            step="0.5"
            value={seaLevelQnh}
            onChange={(e) => handleQnhChange(Number(e.target.value))}
            className="w-20 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-200 font-bold text-right"
          />
          <span>hPa</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Barometric Altitude</span>
            <div className="text-2xl font-mono-numbers font-bold text-emerald-400 mt-1">
              {data.altitudeMeters.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              <span className="text-xs text-slate-400 font-normal ml-1.5">METERS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{(data.altitudeMeters * 3.28084).toFixed(0)} ft MSL</span>
          </div>

          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Atmospheric Pressure</span>
            <div className="text-2xl font-mono-numbers font-bold text-slate-100 mt-1">
              {data.pressureHpa.toFixed(2)}
              <span className="text-xs text-slate-400 font-normal ml-1.5">HPA</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{data.pressurePa.toLocaleString()} Pa</span>
          </div>

          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Vertical Speed (VSI)</span>
            <div className={`text-2xl font-mono-numbers font-bold mt-1 flex items-center gap-1 ${
              isAscending ? 'text-emerald-400' : isDescending ? 'text-rose-400' : 'text-slate-300'
            }`}>
              {isAscending ? <ArrowUp className="w-5 h-5 text-emerald-400" /> : isDescending ? <ArrowDown className="w-5 h-5 text-rose-400" /> : null}
              <span>{data.verticalSpeedMS >= 0 ? '+' : ''}{data.verticalSpeedMS.toFixed(2)}</span>
              <span className="text-xs text-slate-400 font-normal ml-1">M/S</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {isAscending ? 'CLIMBING PROFILE' : isDescending ? 'DESCENDING DESCENT' : 'LEVEL ALTITUDE'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Sensor Temperature</span>
            <div className="text-2xl font-mono-numbers font-bold text-slate-100 mt-1">
              {data.temperatureC.toFixed(2)}
              <span className="text-xs text-slate-400 font-normal ml-1.5">°C</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{((data.temperatureC * 9/5) + 32).toFixed(1)}°F</span>
          </div>
        </div>

        {/* Hypsometric Barometric Formula & Altitude Decay Diagram */}
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-200">HYPSOMETRIC ALTITUDE EQUATION MODEL</span>
            <span className="text-emerald-400">h = 44330 · [1 - (P/P₀)^(1/5.255)]</span>
          </div>

          {/* Barometric Scale Visualization */}
          <div className="relative w-full bg-slate-950 p-4 rounded border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SEA LEVEL (1013.25 hPa)</span>
              <span>TROPOSPHERE (500 hPa)</span>
              <span>STRATOSPHERE (100 hPa)</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(5, (data.altitudeMeters / 12000) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>0 m</span>
              <span className="text-emerald-400 font-bold">CURRENT: {data.altitudeMeters.toFixed(0)} m</span>
              <span>12,000 m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
