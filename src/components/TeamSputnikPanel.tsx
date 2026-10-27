/**
 * Team Sputnik Flight Control Operations Panel
 * Features Team Sputnik and all 5 flight dynamics engineers
 */

import React from 'react';
import { Users, Shield, Radio, Check, X } from 'lucide-react';

export const TEAM_MEMBERS = [
  { id: 1, name: 'UJJWAL YADAV', role: 'Flight Dynamics Officer (FIDO)', specialty: 'Interplanetary Orbit Insertion & Conics' },
  { id: 2, name: 'PRIYANSHU YADAV', role: 'Guidance & Navigation Officer (GUIDO)', specialty: 'Inertial Platform & State Vector Estimation' },
  { id: 3, name: 'ATUL KUMAR MAURYA', role: 'Retrofire & Maneuver Specialist (RETRO)', specialty: 'Delta-V Propulsion & Burn Planning' },
  { id: 4, name: 'RATNESH KUMAR SINGH', role: 'Trajectory Astrodynamicist', specialty: 'Keplerian Elements & Perturbation Physics' },
  { id: 5, name: 'PRAKHAR DHAR DUBEY', role: 'Deep Space Telemetry & Comms Specialist', specialty: 'DSN Antenna Tracking & Doppler Ranging' },
];

interface TeamSputnikModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamSputnikModal: React.FC<TeamSputnikModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0B0E17] border border-cyan-500/40 rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#07090E] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-400 font-bold font-mono text-sm">
              SPK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 tracking-wide">
                  TEAM SPUTNIK
                </h3>
                <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-950/40">
                  FLIGHT DYNAMICS CREW
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mission Control Center (MCT) · Deep Space Navigation Console
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Roster */}
        <div className="p-6 flex flex-col gap-3">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
            Certified Flight Controllers:
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded bg-[#07090E]/80">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id} className="p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-cyan-400">
                    {member.id}
                  </div>
                  <div>
                    <div className="text-sm font-bold font-mono text-slate-100">
                      {member.name}
                    </div>
                    <div className="text-xs text-cyan-400 font-medium">
                      {member.role}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-400 hidden sm:block">
                  {member.specialty}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-800/40 rounded flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>STATION CONSOLE STATUS: <strong>FLIGHT READY</strong></span>
            </div>
            <div className="text-cyan-400">
              CALLSIGN: <strong>SPUTNIK-CONTROL</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#07090E] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded transition-colors cursor-pointer"
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  );
};
