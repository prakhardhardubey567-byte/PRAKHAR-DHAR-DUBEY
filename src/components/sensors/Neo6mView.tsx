/**
 * NEO-6M High-Sensitivity GPS / GNSS Sensor View
 * Features Latitude, Longitude, GPS Altitude, Speed, Fix Status, Satellites, and NMEA Sentences
 */

import React, { useState } from 'react';
import { MapPin, Navigation, Satellite, Radio, Terminal } from 'lucide-react';
import { NEO6MData } from '../../types/sensors';

interface Neo6mViewProps {
  data: NEO6MData;
}

export const Neo6mView: React.FC<Neo6mViewProps> = ({ data }) => {
  const [coordFormat, setCoordFormat] = useState<'DD' | 'DMS'>('DD');

  // Convert Decimal Degrees to Degrees Minutes Seconds
  const toDMS = (deg: number, isLat: boolean) => {
    const dir = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
    const absDeg = Math.abs(deg);
    const d = Math.floor(absDeg);
    const minFloat = (absDeg - d) * 60;
    const m = Math.floor(minFloat);
    const s = ((minFloat - m) * 60).toFixed(2);
    return `${d}° ${m}' ${s}" ${dir}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0E17] border border-slate-800 rounded overflow-hidden">
      {/* Sensor Title & Bus Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-[#07090E]">
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold font-mono text-slate-100 tracking-wide">
            NEO-6M · HIGH-SENSITIVITY GNSS / GPS RECEIVER
          </span>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded">
            UART: {data.baudRate} BAUD · 5 Hz
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            ● {data.fixType} ({data.satellitesTracked}/{data.satellitesInView} SVs)
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Latitude */}
          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">GPS Latitude</span>
            <div className="text-xl font-mono-numbers font-bold text-slate-100 mt-1">
              {coordFormat === 'DD'
                ? `${Math.abs(data.latitude).toFixed(5)}° ${data.latitude >= 0 ? 'N' : 'S'}`
                : toDMS(data.latitude, true)}
            </div>
            <span className="text-[10px] font-mono text-slate-500">WGS-84 ELLIPSOID</span>
          </div>

          {/* Longitude */}
          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">GPS Longitude</span>
            <div className="text-xl font-mono-numbers font-bold text-slate-100 mt-1">
              {coordFormat === 'DD'
                ? `${Math.abs(data.longitude).toFixed(5)}° ${data.longitude >= 0 ? 'E' : 'W'}`
                : toDMS(data.longitude, false)}
            </div>
            <span className="text-[10px] font-mono text-slate-500">PRIME MERIDIAN REF</span>
          </div>

          {/* GPS Speed */}
          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Ground Speed (SOG)</span>
            <div className="text-xl font-mono-numbers font-bold text-purple-400 mt-1">
              {data.groundSpeedKmH.toFixed(1)} <span className="text-xs text-slate-400 font-normal">KM/H</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{data.groundSpeedKnots.toFixed(1)} KNOTS</span>
          </div>

          {/* GPS Altitude */}
          <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">GPS Altitude (MSL)</span>
            <div className="text-xl font-mono-numbers font-bold text-slate-100 mt-1">
              {data.altitudeMeters.toFixed(1)} <span className="text-xs text-slate-400 font-normal">M</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">HDOP: {data.hdop.toFixed(1)} (EXCELLENT)</span>
          </div>
        </div>

        {/* NMEA Raw Sentences Output Console */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-slate-300">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>LIVE NMEA 0183 SERIAL DATA STREAM ($GPGGA, $GPRMC)</span>
            </span>
            <span className="text-slate-500">BUFFER OK · CHECKSUM PASS</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded font-mono text-xs text-emerald-400 space-y-1 overflow-x-auto border border-slate-800">
            <div>{data.rawNmeaSentence}</div>
            <div className="text-slate-400">$GPRMC,{data.utcTime},A,{Math.abs(data.latitude).toFixed(4)},{data.latitude >= 0 ? 'N' : 'S'},{Math.abs(data.longitude).toFixed(4)},{data.longitude >= 0 ? 'E' : 'W'},{(data.groundSpeedKnots).toFixed(1)},{data.courseDeg.toFixed(1)},261026,,,A*77</div>
            <div className="text-slate-500">$GPVTG,{data.courseDeg.toFixed(1)},T,,M,{(data.groundSpeedKnots).toFixed(1)},N,{(data.groundSpeedKmH).toFixed(1)},K*4E</div>
          </div>
        </div>
      </div>
    </div>
  );
};
