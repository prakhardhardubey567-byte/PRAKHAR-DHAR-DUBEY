/**
 * Fused Multi-Sensor Hub Dashboard
 * Overview of all 4 sensors: MPU6050, BMP280, DHT11, and NEO-6M
 */

import React from 'react';
import {
  Compass,
  Gauge,
  Thermometer,
  MapPin,
  Activity,
  ShieldCheck,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { SensorSuiteData, SelectedSensorTab } from '../../types/sensors';

interface FusedSensorHubProps {
  data: SensorSuiteData;
  onNavigateSensor: (tab: SelectedSensorTab) => void;
}

export const FusedSensorHub: React.FC<FusedSensorHubProps> = ({
  data,
  onNavigateSensor,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0B0E17] border border-slate-800 rounded overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-[#07090E]">
        <div className="flex items-center gap-3">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold font-mono text-slate-100 tracking-wide">
            TEAM SPUTNIK · FUSED SENSOR TELEMETRY SUITE
          </span>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
            4 SENSORS SYNCHRONIZED
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>I2C + UART + 1-WIRE BUSES NOMINAL</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        {/* 4 Sensor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SENSOR 1: MPU6050 (Attitude & G-Force) */}
          <div
            onClick={() => onNavigateSensor('mpu6050')}
            className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-lg transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-bold text-slate-100">
                  MPU6050 · 6-AXIS IMU & GYROSCOPE
                </span>
              </div>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-800/30">
                I2C 0x68 · 50Hz
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">PITCH ATTITUDE</span>
                <span className="text-lg font-mono-numbers font-bold text-slate-100">
                  {data.mpu6050.pitchDeg >= 0 ? '+' : ''}{data.mpu6050.pitchDeg.toFixed(1)}°
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">ROLL ATTITUDE</span>
                <span className="text-lg font-mono-numbers font-bold text-slate-100">
                  {data.mpu6050.rollDeg >= 0 ? '+' : ''}{data.mpu6050.rollDeg.toFixed(1)}°
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">TOTAL G-FORCE</span>
                <span className="text-lg font-mono-numbers font-bold text-sky-400">
                  {data.mpu6050.totalG.toFixed(2)} G
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-sky-400 pt-2 border-t border-slate-800/80">
              <span>View full 3D artificial horizon & gyro rates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* SENSOR 2: BMP280 (Altitude & Pressure) */}
          <div
            onClick={() => onNavigateSensor('bmp280')}
            className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-100">
                  BMP280 · BAROMETRIC ALTIMETER & PRESSURE
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/30">
                I2C 0x76 · 10Hz
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">BARO ALTITUDE</span>
                <span className="text-lg font-mono-numbers font-bold text-emerald-400">
                  {data.bmp280.altitudeMeters.toFixed(0)} m
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">PRESSURE</span>
                <span className="text-lg font-mono-numbers font-bold text-slate-100">
                  {data.bmp280.pressureHpa.toFixed(1)} hPa
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">VARIOMETER (VSI)</span>
                <span className="text-lg font-mono-numbers font-bold text-slate-100">
                  {data.bmp280.verticalSpeedMS >= 0 ? '+' : ''}{data.bmp280.verticalSpeedMS.toFixed(1)} m/s
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 pt-2 border-t border-slate-800/80">
              <span>View QNH calibration & barometric decay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* SENSOR 3: DHT11 (Temperature & Humidity) */}
          <div
            onClick={() => onNavigateSensor('dht11')}
            className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-lg transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-slate-100">
                  DHT11 · TEMPERATURE & RELATIVE HUMIDITY
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/30">
                1-WIRE GPIO · 1Hz
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">TEMPERATURE</span>
                <span className="text-lg font-mono-numbers font-bold text-amber-400">
                  {data.dht11.temperatureC.toFixed(1)}°C
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">HUMIDITY</span>
                <span className="text-lg font-mono-numbers font-bold text-cyan-400">
                  {data.dht11.humidityPercent}% RH
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">DEW POINT</span>
                <span className="text-lg font-mono-numbers font-bold text-slate-100">
                  {data.dht11.dewPointC.toFixed(1)}°C
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 pt-2 border-t border-slate-800/80">
              <span>View heat index & enclosure thermal safety</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* SENSOR 4: NEO-6M (GPS Navigation) */}
          <div
            onClick={() => onNavigateSensor('neo6m')}
            className="p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-lg transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold text-slate-100">
                  NEO-6M · GPS / GNSS SATELLITE RECEIVER
                </span>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-800/30">
                UART 9600 · 5Hz
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">LATITUDE</span>
                <span className="text-lg font-mono-numbers font-bold text-slate-100">
                  {Math.abs(data.neo6m.latitude).toFixed(3)}°{data.neo6m.latitude >= 0 ? 'N' : 'S'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">LONGITUDE</span>
                <span className="text-lg font-mono-numbers font-bold text-slate-100">
                  {Math.abs(data.neo6m.longitude).toFixed(3)}°{data.neo6m.longitude >= 0 ? 'E' : 'W'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">GROUND SPEED</span>
                <span className="text-lg font-mono-numbers font-bold text-purple-400">
                  {data.neo6m.groundSpeedKmH.toFixed(1)} km/h
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-purple-400 pt-2 border-t border-slate-800/80">
              <span>View satellite sky-plot & raw NMEA stream</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
