/**
 * Top Bar Navigation Header
 * Conforms strictly to 3-zone Top Bar Contract:
 * [Wordmark brand] — [Nav links] — [1 Primary Action]
 */

import React from 'react';
import { Download, Compass, Users, Cpu } from 'lucide-react';
import { DeepSpaceMission, NavigationTelemetry } from '../types/astrodynamics';

export type MainNavTab = 'sensors' | '3d-orbit' | 'ground-track' | 'maneuver' | 'elements' | 'graphs';

interface NavigationHeaderProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  mission: DeepSpaceMission;
  telemetry: NavigationTelemetry;
  onOpenTeamModal: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  onTabChange,
  mission,
  telemetry,
  onOpenTeamModal,
}) => {
  const handleExportTelemetry = () => {
    const reportData = {
      team: 'TEAM SPUTNIK',
      crew: [
        'UJJWAL YADAV (FIDO)',
        'PRIYANSHU YADAV (GUIDO)',
        'ATUL KUMAR MAURYA (RETRO)',
        'RATNESH KUMAR SINGH (TRAJ)',
        'PRAKHAR DHAR DUBEY (DSN)',
      ],
      timestamp: new Date().toISOString(),
      mission: {
        id: mission.id,
        code: mission.code,
        name: mission.name,
        target: mission.targetBody,
        missionElapsedTimeSeconds: mission.missionElapsedTimeSeconds,
      },
      navigationTelemetry: {
        latitudeDeg: telemetry.latitude,
        longitudeDeg: telemetry.longitude,
        altitudeKm: telemetry.altitudeKm,
        speedInertialKmS: telemetry.speedInertialKmS,
        groundSpeedKmS: telemetry.speedGroundKmS,
        flightPathAngleDeg: telemetry.flightPathAngleDeg,
        trueAnomalyDeg: telemetry.trueAnomalyDeg,
        accelerationG: telemetry.accelerationG,
        deltaVRemainingKmS: telemetry.deltaVRemainingKmS,
        propellantMassKg: telemetry.propellantMassKg,
      },
      orbitalElements: mission.elements,
      lightTime: {
        oneWaySeconds: mission.oneWayLightTimeSeconds,
        roundTripSeconds: mission.roundTripLightTimeSeconds,
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TEAM_SPUTNIK_${mission.code}_TELEMETRY_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0B0E17] border-b border-slate-800 shrink-0">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded bg-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
          <Compass className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-wide text-slate-100 whitespace-nowrap">
            TEAM SPUTNIK DASHBOARD
          </span>
          <span className="text-xs font-mono text-cyan-400 font-medium whitespace-nowrap bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded hidden sm:inline-block">
            MCT FLIGHT DYNAMICS
          </span>
        </div>
      </div>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => onTabChange('sensors')}
          className={`whitespace-nowrap transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sensors'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Starting Sensors</span>
        </button>

        <button
          onClick={() => onTabChange('3d-orbit')}
          className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
            activeTab === '3d-orbit'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Heliocentric 3D
        </button>

        <button
          onClick={() => onTabChange('ground-track')}
          className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
            activeTab === 'ground-track'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ground Track
        </button>

        <button
          onClick={() => onTabChange('maneuver')}
          className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
            activeTab === 'maneuver'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Maneuver Planner
        </button>

        <button
          onClick={() => onTabChange('graphs')}
          className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
            activeTab === 'graphs'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Telemetry Graphs
        </button>

        <button
          onClick={onOpenTeamModal}
          className="whitespace-nowrap transition-colors py-1 cursor-pointer text-slate-400 hover:text-cyan-300 flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Sputnik</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleExportTelemetry}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Ephemeris JSON</span>
        </button>
      </div>
    </header>
  );
};
