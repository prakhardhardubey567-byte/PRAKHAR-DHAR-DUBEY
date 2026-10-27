/**
 * Telemetry Graphs & Time-Series Strip Chart Panel
 * Real-time multi-channel orbital velocity, altitude, flight path angle,
 * G-acceleration, and DSN SNR graphs with interactive crosshair inspection.
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  Activity,
  Layers,
  Maximize2,
  Minimize2,
  Download,
  RotateCcw,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { AU_KM } from '../physics/orbitPropagator';

export interface TelemetryPoint {
  timestamp: number;
  metSeconds: number;
  speedKmS: number;
  altitudeKm: number;
  flightPathAngleDeg: number;
  trueAnomalyDeg: number;
  accelerationG: number;
  dsnSnrDb: number;
  propellantKg: number;
}

interface TelemetryGraphsPanelProps {
  history: TelemetryPoint[];
  currentMissionName: string;
  onClearHistory?: () => void;
}

type ChannelKey = 'speedKmS' | 'altitudeKm' | 'flightPathAngleDeg' | 'accelerationG' | 'dsnSnrDb' | 'propellantKg';

interface ChannelConfig {
  key: ChannelKey;
  label: string;
  unit: string;
  color: string;
  format: (v: number) => string;
  min?: number;
  max?: number;
}

const CHANNELS: ChannelConfig[] = [
  {
    key: 'speedKmS',
    label: 'Inertial Speed',
    unit: 'km/s',
    color: '#06b6d4', // Laser cyan
    format: (v) => v.toFixed(3),
  },
  {
    key: 'altitudeKm',
    label: 'Altitude (h)',
    unit: 'km',
    color: '#38bdf8', // Sky blue
    format: (v) => {
      if (v > AU_KM * 0.1) return `${(v / AU_KM).toFixed(4)} AU`;
      return `${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    },
  },
  {
    key: 'flightPathAngleDeg',
    label: 'Flight Path Angle (γ)',
    unit: 'deg',
    color: '#10b981', // Emerald
    format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}°`,
  },
  {
    key: 'accelerationG',
    label: 'G-Acceleration',
    unit: 'g',
    color: '#f59e0b', // Amber
    format: (v) => v.toFixed(3),
  },
  {
    key: 'dsnSnrDb',
    label: 'DSN Signal-to-Noise (SNR)',
    unit: 'dB',
    color: '#a855f7', // Purple
    format: (v) => `${v.toFixed(1)} dB`,
  },
  {
    key: 'propellantKg',
    label: 'Propellant Mass',
    unit: 'kg',
    color: '#ef4444', // Red
    format: (v) => `${(v / 1000).toFixed(1)}t`,
  },
];

export const TelemetryGraphsPanel: React.FC<TelemetryGraphsPanelProps> = ({
  history,
  currentMissionName,
  onClearHistory,
}) => {
  const [primaryChannel, setPrimaryChannel] = useState<ChannelKey>('speedKmS');
  const [secondaryChannel, setSecondaryChannel] = useState<ChannelKey | null>('altitudeKm');
  const [timeSpanMode, setTimeSpanMode] = useState<'30s' | '60s' | 'all'>('60s');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter history based on time span mode
  const filteredData = useMemo(() => {
    if (history.length === 0) return [];
    if (timeSpanMode === 'all') return history;
    const count = timeSpanMode === '30s' ? 30 : 60;
    return history.slice(-count);
  }, [history, timeSpanMode]);

  const primaryCfg = CHANNELS.find((c) => c.key === primaryChannel)!;
  const secondaryCfg = secondaryChannel ? CHANNELS.find((c) => c.key === secondaryChannel) : null;

  // Compute domain bounds for primary channel
  const primaryStats = useMemo(() => {
    if (filteredData.length === 0) return { min: 0, max: 1, current: 0, avg: 0, rate: 0 };
    const vals = filteredData.map((d) => d[primaryChannel]);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const current = vals[vals.length - 1];
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const rate = vals.length > 1 ? (vals[vals.length - 1] - vals[0]) / vals.length : 0;

    // Pad domain slightly so lines don't clip at top/bottom
    const span = Math.max(0.001, maxVal - minVal);
    const paddedMin = minVal - span * 0.1;
    const paddedMax = maxVal + span * 0.1;

    return { min: paddedMin, max: paddedMax, current, avg, rate, rawMin: minVal, rawMax: maxVal };
  }, [filteredData, primaryChannel]);

  // Compute domain bounds for secondary channel if active
  const secondaryStats = useMemo(() => {
    if (!secondaryCfg || filteredData.length === 0) return null;
    const vals = filteredData.map((d) => d[secondaryCfg.key]);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const span = Math.max(0.001, maxVal - minVal);
    return {
      min: minVal - span * 0.1,
      max: maxVal + span * 0.1,
      rawMin: minVal,
      rawMax: maxVal,
      current: vals[vals.length - 1],
    };
  }, [filteredData, secondaryCfg]);

  // SVG Coordinates calculation
  const width = 900;
  const height = 340;
  const padding = { top: 25, right: secondaryCfg ? 65 : 25, bottom: 35, left: 65 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const pointsPrimary = useMemo(() => {
    if (filteredData.length < 2) return '';
    return filteredData
      .map((d, i) => {
        const x = padding.left + (i / (filteredData.length - 1)) * graphWidth;
        const normY = (d[primaryChannel] - primaryStats.min) / (primaryStats.max - primaryStats.min);
        const y = padding.top + (1 - Math.max(0, Math.min(1, normY))) * graphHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [filteredData, primaryChannel, primaryStats, graphWidth, graphHeight, padding]);

  const pointsSecondary = useMemo(() => {
    if (!secondaryStats || !secondaryCfg || filteredData.length < 2) return '';
    return filteredData
      .map((d, i) => {
        const x = padding.left + (i / (filteredData.length - 1)) * graphWidth;
        const normY = (d[secondaryCfg.key] - secondaryStats.min) / (secondaryStats.max - secondaryStats.min);
        const y = padding.top + (1 - Math.max(0, Math.min(1, normY))) * graphHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [filteredData, secondaryCfg, secondaryStats, graphWidth, graphHeight, padding]);

  // Format MET: T+042D 07H:22M:14S
  const formatMET = (totalSec: number) => {
    const days = Math.floor(totalSec / 86400);
    const remD = totalSec % 86400;
    const hours = Math.floor(remD / 3600);
    const remH = remD % 3600;
    const minutes = Math.floor(remH / 60);
    const seconds = Math.floor(remH % 60);
    return `T+${String(days).padStart(2, '0')}D ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Export CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ['MET_Seconds', 'Speed_km_s', 'Altitude_km', 'FlightPathAngle_deg', 'TrueAnomaly_deg', 'Acceleration_G', 'DSN_SNR_dB', 'Propellant_kg'];
    const rows = history.map((d) => [
      d.metSeconds.toFixed(1),
      d.speedKmS.toFixed(4),
      d.altitudeKm.toFixed(2),
      d.flightPathAngleDeg.toFixed(3),
      d.trueAnomalyDeg.toFixed(3),
      d.accelerationG.toFixed(4),
      d.dsnSnrDb.toFixed(2),
      d.propellantKg.toFixed(1),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMissionName}_TELEMETRY_LOG_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Mouse move on SVG for crosshair probe
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = (clientX - padding.left) / graphWidth;
    if (ratio >= 0 && ratio <= 1 && filteredData.length > 0) {
      const idx = Math.round(ratio * (filteredData.length - 1));
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
  };

  const hoveredPoint = hoverIndex !== null && filteredData[hoverIndex] ? filteredData[hoverIndex] : null;

  return (
    <div className="flex flex-col h-full bg-[#0B0E17] border border-slate-800 rounded overflow-hidden">
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-[#07090E]">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-100 tracking-wide font-mono">
            REAL-TIME TELEMETRY TIME-SERIES RECORDER
          </span>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
            BUFFER: {history.length} PTS
          </span>
        </div>

        {/* Time Span & Export Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setTimeSpanMode('30s')}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                timeSpanMode === '30s' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last 30s
            </button>
            <button
              onClick={() => setTimeSpanMode('60s')}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                timeSpanMode === '60s' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last 60s
            </button>
            <button
              onClick={() => setTimeSpanMode('all')}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                timeSpanMode === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full Arc
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            title="Download Telemetry CSV"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {onClearHistory && (
            <button
              onClick={onClearHistory}
              title="Reset Buffer"
              className="p-1 text-slate-400 hover:text-slate-200 rounded border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Channel Selector Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2 bg-[#07090E]/60 border-b border-slate-800 text-xs font-mono">
        {/* Primary Channel Selectors */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Primary:</span>
          {CHANNELS.map((ch) => (
            <button
              key={ch.key}
              onClick={() => setPrimaryChannel(ch.key)}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                primaryChannel === ch.key
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Secondary Overlay Channel Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Secondary Overlay:</span>
          <select
            value={secondaryChannel || 'none'}
            onChange={(e) => setSecondaryChannel(e.target.value === 'none' ? null : (e.target.value as ChannelKey))}
            className="bg-slate-900 text-slate-200 text-xs font-mono px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="none">None (Single Channel)</option>
            {CHANNELS.filter((c) => c.key !== primaryChannel).map((c) => (
              <option key={c.key} value={c.key}>
                {c.label} ({c.unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main SVG Chart & Stats Area */}
      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto" ref={containerRef}>
        {/* KPI Strip for Active Channel */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-2.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Current Reading</span>
            <div className="text-lg font-mono-numbers font-bold text-cyan-400 mt-0.5">
              {primaryCfg.format(primaryStats.current)}
              <span className="text-xs text-slate-400 font-normal ml-1">{primaryCfg.unit}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Window Max (Peak)</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-100 mt-0.5">
              {primaryCfg.format(primaryStats.rawMax ?? 0)}
              <span className="text-xs text-slate-400 font-normal ml-1">{primaryCfg.unit}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Window Min</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-100 mt-0.5">
              {primaryCfg.format(primaryStats.rawMin ?? 0)}
              <span className="text-xs text-slate-400 font-normal ml-1">{primaryCfg.unit}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Time-Weighted Mean</span>
            <div className="text-lg font-mono-numbers font-bold text-slate-200 mt-0.5">
              {primaryCfg.format(primaryStats.avg)}
              <span className="text-xs text-slate-400 font-normal ml-1">{primaryCfg.unit}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/50 border border-slate-800 rounded">
            <span className="text-[10px] font-mono uppercase text-slate-400">Rate of Change (Δ/dt)</span>
            <div className={`text-lg font-mono-numbers font-bold mt-0.5 ${primaryStats.rate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {primaryStats.rate >= 0 ? '+' : ''}{primaryStats.rate.toExponential(2)}
              <span className="text-xs text-slate-400 font-normal ml-1">/s</span>
            </div>
          </div>
        </div>

        {/* High Precision SVG Telemetry Canvas */}
        <div className="relative w-full bg-[#07090E] border border-slate-800 rounded p-2 overflow-hidden select-none">
          {filteredData.length < 2 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
              <Activity className="w-6 h-6 text-slate-600 mb-2 animate-pulse" />
              <span>Awaiting telemetry data stream...</span>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto cursor-crosshair overflow-visible"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                {/* Subtle gradient fill below primary curve */}
                <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Background Lines (Horizontal Y-ticks) */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
                const y = padding.top + ratio * graphHeight;
                const primaryVal = primaryStats.max - ratio * (primaryStats.max - primaryStats.min);
                const secondaryVal = secondaryStats
                  ? secondaryStats.max - ratio * (secondaryStats.max - secondaryStats.min)
                  : null;

                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray={ratio === 0 || ratio === 1 ? 'none' : '3 3'}
                    />

                    {/* Primary Y-axis Tick Label (Left) */}
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#64748b"
                      fontFamily="monospace"
                      fontSize="10"
                    >
                      {primaryCfg.format(primaryVal)}
                    </text>

                    {/* Secondary Y-axis Tick Label (Right) */}
                    {secondaryCfg && secondaryVal !== null && (
                      <text
                        x={width - padding.right + 8}
                        y={y + 3}
                        textAnchor="start"
                        fill={secondaryCfg.color}
                        fontFamily="monospace"
                        fontSize="10"
                      >
                        {secondaryCfg.format(secondaryVal)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Grid Vertical Time Ticks */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
                const x = padding.left + ratio * graphWidth;
                const dataIndex = Math.min(
                  filteredData.length - 1,
                  Math.round(ratio * (filteredData.length - 1))
                );
                const timePoint = filteredData[dataIndex];

                return (
                  <g key={ratio}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={height - padding.bottom}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray="2 4"
                    />
                    {timePoint && (
                      <text
                        x={x}
                        y={height - padding.bottom + 16}
                        textAnchor="middle"
                        fill="#64748b"
                        fontFamily="monospace"
                        fontSize="9"
                      >
                        {formatMET(timePoint.metSeconds).replace('T+', '')}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Area Fill for Primary Channel */}
              {pointsPrimary && (
                <polygon
                  points={`${padding.left},${height - padding.bottom} ${pointsPrimary} ${width - padding.right},${height - padding.bottom}`}
                  fill="url(#primaryAreaGrad)"
                />
              )}

              {/* Secondary Overlay Line */}
              {pointsSecondary && secondaryCfg && (
                <polyline
                  points={pointsSecondary}
                  fill="none"
                  stroke={secondaryCfg.color}
                  strokeWidth="1.8"
                  strokeDasharray="4 2"
                />
              )}

              {/* Primary Line */}
              {pointsPrimary && (
                <polyline
                  points={pointsPrimary}
                  fill="none"
                  stroke={primaryCfg.color}
                  strokeWidth="2.2"
                />
              )}

              {/* Interactive Crosshair Hover Line & Dot */}
              {hoverIndex !== null && hoveredPoint && (
                <g>
                  {/* Vertical Hairline */}
                  <line
                    x1={padding.left + (hoverIndex / (filteredData.length - 1)) * graphWidth}
                    y1={padding.top}
                    x2={padding.left + (hoverIndex / (filteredData.length - 1)) * graphWidth}
                    y2={height - padding.bottom}
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />

                  {/* Primary Data Dot */}
                  {(() => {
                    const x = padding.left + (hoverIndex / (filteredData.length - 1)) * graphWidth;
                    const normY =
                      (hoveredPoint[primaryChannel] - primaryStats.min) /
                      (primaryStats.max - primaryStats.min);
                    const y = padding.top + (1 - Math.max(0, Math.min(1, normY))) * graphHeight;
                    return (
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#06b6d4"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  })()}

                  {/* Secondary Data Dot if active */}
                  {secondaryCfg && secondaryStats && (() => {
                    const x = padding.left + (hoverIndex / (filteredData.length - 1)) * graphWidth;
                    const normY =
                      (hoveredPoint[secondaryCfg.key] - secondaryStats.min) /
                      (secondaryStats.max - secondaryStats.min);
                    const y = padding.top + (1 - Math.max(0, Math.min(1, normY))) * graphHeight;
                    return (
                      <circle
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill={secondaryCfg.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  })()}
                </g>
              )}
            </svg>
          )}

          {/* Floating Monospace HUD for Probed Value */}
          {hoveredPoint && (
            <div className="absolute top-4 right-4 bg-slate-900/90 border border-amber-500/40 p-2.5 rounded text-xs font-mono backdrop-blur-sm shadow-xl flex flex-col gap-1 pointer-events-none">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>CROSSHAIR TELEMETRY PROBE</span>
              </div>
              <div className="text-slate-300">
                MET: <strong>{formatMET(hoveredPoint.metSeconds)}</strong>
              </div>
              <div className="text-cyan-400">
                {primaryCfg.label}: <strong>{primaryCfg.format(hoveredPoint[primaryChannel])} {primaryCfg.unit}</strong>
              </div>
              {secondaryCfg && (
                <div style={{ color: secondaryCfg.color }}>
                  {secondaryCfg.label}: <strong>{secondaryCfg.format(hoveredPoint[secondaryCfg.key])} {secondaryCfg.unit}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 pt-1">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
              <span className="text-slate-200">Primary: {primaryCfg.label} ({primaryCfg.unit})</span>
            </div>
            {secondaryCfg && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: secondaryCfg.color }} />
                <span style={{ color: secondaryCfg.color }}>
                  Secondary: {secondaryCfg.label} ({secondaryCfg.unit})
                </span>
              </div>
            )}
          </div>
          <div>
            SAMPLING INTERVAL: 50 ms · FIFO RING BUFFER
          </div>
        </div>
      </div>
    </div>
  );
};
