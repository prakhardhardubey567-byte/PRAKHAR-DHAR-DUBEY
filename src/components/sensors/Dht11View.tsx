/**
 * DHT11 Temperature & Relative Humidity Sensor View
 * Features Temperature (°C/°F), Relative Humidity (% RH), Dew Point, and Heat Index
 */

import React from 'react';
import { Thermometer, Droplets, ShieldCheck, AlertTriangle } from 'lucide-react';
import { DHT11Data } from '../../types/sensors';

interface Dht11ViewProps {
  data: DHT11Data;
}

export const Dht11View: React.FC<Dht11ViewProps> = ({ data }) => {
  return (
    <div className="flex flex-col h-full bg-[#0B0E17] border border-slate-800 rounded overflow-hidden">
      {/* Sensor Title & Bus Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-[#07090E]">
        <div className="flex items-center gap-3">
          <Thermometer className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold font-mono text-slate-100 tracking-wide">
            DHT11 · AMBIENT TEMPERATURE & RELATIVE HUMIDITY SENSOR
          </span>
          <span className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
            INTERFACE: {data.pinInterface} · 1 Hz
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PAYLOAD CLIMATE: {data.comfortLevel}</span>
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        {/* Main 2 Large Gauges: Temperature & Humidity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Temperature Card */}
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Ambient Temperature</span>
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {data.temperatureF.toFixed(1)}°F
              </span>
            </div>

            <div className="my-4 flex items-baseline">
              <span className="text-5xl font-mono-numbers font-bold text-amber-400">
                {data.temperatureC.toFixed(1)}
              </span>
              <span className="text-lg font-mono text-slate-400 ml-2">°C</span>
            </div>

            {/* Thermal Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (data.temperatureC / 50) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>0°C (Freezing)</span>
                <span>25°C (Room)</span>
                <span>50°C (Max Range)</span>
              </div>
            </div>
          </div>

          {/* Relative Humidity Card */}
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Relative Humidity</span>
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                DEW POINT: {data.dewPointC.toFixed(1)}°C
              </span>
            </div>

            <div className="my-4 flex items-baseline">
              <span className="text-5xl font-mono-numbers font-bold text-cyan-400">
                {data.humidityPercent}
              </span>
              <span className="text-lg font-mono text-slate-400 ml-2">% RH</span>
            </div>

            {/* Humidity Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, data.humidityPercent))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>20% (Dry)</span>
                <span>50% (Comfort)</span>
                <span>90% (Saturated)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Derived Psychrometric Parameters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Dew Point (T_d)</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-100 mt-1">
              {data.dewPointC.toFixed(1)}°C
            </div>
            <span className="text-[10px] font-mono text-slate-500">CONDENSATION THRESHOLD</span>
          </div>

          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Heat Index</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-100 mt-1">
              {data.heatIndexC.toFixed(1)}°C
            </div>
            <span className="text-[10px] font-mono text-slate-500">APPARENT TEMPERATURE</span>
          </div>

          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Vapor Pressure</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-100 mt-1">
              {(0.61078 * Math.exp((17.27 * data.temperatureC) / (data.temperatureC + 237.3)) * (data.humidityPercent / 100)).toFixed(2)} kPa
            </div>
            <span className="text-[10px] font-mono text-slate-500">PARTIAL PRESSURE</span>
          </div>

          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Electronics Safety</span>
            <div className="text-lg font-mono-numbers font-bold text-emerald-400 mt-1">
              NOMINAL
            </div>
            <span className="text-[10px] font-mono text-slate-500">NO CONDENSATION RISK</span>
          </div>
        </div>
      </div>
    </div>
  );
};
