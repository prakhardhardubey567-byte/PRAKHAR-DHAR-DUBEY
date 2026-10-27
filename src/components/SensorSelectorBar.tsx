/**
 * Sensor Suite Selector Bar
 * Lets the user select between MPU6050, BMP280, DHT11, NEO-6M, All Sensors, or Deep Space Trajectory
 */

import React from 'react';
import {
  Layers,
  Compass,
  Gauge,
  Thermometer,
  MapPin,
  Cpu,
  Orbit,
  Radio,
} from 'lucide-react';
import { SelectedSensorTab, SensorSuiteData } from '../types/sensors';

interface SensorSelectorBarProps {
  selectedTab: SelectedSensorTab;
  onSelectTab: (tab: SelectedSensorTab) => void;
  sensorData: SensorSuiteData;
}

export const SensorSelectorBar: React.FC<SensorSelectorBarProps> = ({
  selectedTab,
  onSelectTab,
  sensorData,
}) => {
  const sensorItems: {
    id: SelectedSensorTab;
    label: string;
    sub: string;
    icon: React.ReactNode;
    tag: string;
    liveValue: string;
    color: string;
  }[] = [
    {
      id: 'all',
      label: 'All Sensors',
      sub: 'Multi-Sensor Fusion Hub',
      icon: <Layers className="w-4 h-4" />,
      tag: '4 ACTIVE',
      liveValue: 'FUSED TELEMETRY',
      color: 'text-cyan-400',
    },
    {
      id: 'mpu6050',
      label: 'MPU6050',
      sub: '6-DOF IMU & Gyroscope',
      icon: <Compass className="w-4 h-4" />,
      tag: 'I2C 0x68 · 50Hz',
      liveValue: `${sensorData.mpu6050.totalG.toFixed(2)} G`,
      color: 'text-sky-400',
    },
    {
      id: 'bmp280',
      label: 'BMP280',
      sub: 'Barometric Alt & Pressure',
      icon: <Gauge className="w-4 h-4" />,
      tag: 'I2C 0x76 · 10Hz',
      liveValue: `${sensorData.bmp280.altitudeMeters.toFixed(0)} m`,
      color: 'text-emerald-400',
    },
    {
      id: 'dht11',
      label: 'DHT11',
      sub: 'Temp & Humidity',
      icon: <Thermometer className="w-4 h-4" />,
      tag: '1-WIRE · 1Hz',
      liveValue: `${sensorData.dht11.temperatureC.toFixed(1)}°C · ${sensorData.dht11.humidityPercent}%`,
      color: 'text-amber-400',
    },
    {
      id: 'neo6m',
      label: 'NEO-6M',
      sub: 'GPS / GNSS Receiver',
      icon: <MapPin className="w-4 h-4" />,
      tag: 'UART 9600 · 5Hz',
      liveValue: `${sensorData.neo6m.satellitesTracked} SVs · 3D FIX`,
      color: 'text-purple-400',
    },
    {
      id: 'deep-space',
      label: 'Deep Space MCT',
      sub: '3D Trajectory & Astrodynamics',
      icon: <Orbit className="w-4 h-4" />,
      tag: 'ORBIT PROPAGATOR',
      liveValue: 'HELIOCENTRIC',
      color: 'text-cyan-300',
    },
  ];

  return (
    <div className="bg-[#0B0E17] border-b border-slate-800 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-4 mb-2.5">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold font-mono tracking-wider uppercase text-slate-200">
            PAYLOAD TELEMETRY SENSOR MATRIX · SELECT SENSOR CONSOLE
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>BUS HEALTH: <strong>NOMINAL (I2C + UART + 1-WIRE)</strong></span>
        </div>
      </div>

      {/* Sensor Selection Cards / Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {sensorItems.map((item) => {
          const isSelected = selectedTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`p-3 rounded text-left transition-all cursor-pointer border flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-900/50 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-slate-100">
                  <span className={item.color}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-500 bg-slate-800'
                  }`}
                >
                  {item.tag}
                </span>
              </div>

              <div className="my-1.5">
                <div className="text-[11px] text-slate-400 truncate">{item.sub}</div>
                <div className="text-xs font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
                  {item.liveValue}
                </div>
              </div>

              <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isSelected ? 'bg-cyan-400 w-full' : 'bg-slate-700 w-1/3'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
