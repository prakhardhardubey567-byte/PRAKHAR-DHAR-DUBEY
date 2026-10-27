/**
 * TEAM SPUTNIK DASHBOARD
 * Sensor Telemetry Matrix & Space Navigation Console
 *
 * Certified Flight Controllers:
 * 1. UJJWAL YADAV (FIDO)
 * 2. PRIYANSHU YADAV (GUIDO)
 * 3. ATUL KUMAR MAURYA (RETRO)
 * 4. RATNESH KUMAR SINGH (TRAJ)
 * 5. PRAKHAR DHAR DUBEY (DSN)
 *
 * Supported Sensor Suites:
 * - MPU6050 (6-Axis IMU: Accelerometer, Gyroscope, Pitch, Roll, Yaw)
 * - BMP280 (High-Precision Barometric Pressure, Altitude, VSI)
 * - DHT11 (Ambient Temperature & Relative Humidity, Dew Point)
 * - NEO-6M (High-Sensitivity GNSS/GPS Navigation Receiver)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavigationHeader, MainNavTab } from './components/NavigationHeader';
import { TelemetryBar } from './components/TelemetryBar';
import { PrimaryMetricsGrid } from './components/PrimaryMetricsGrid';
import { SensorSelectorBar } from './components/SensorSelectorBar';
import { EnvironmentAttitudeDashboard } from './components/sensors/EnvironmentAttitudeDashboard';
import { Mpu6050View } from './components/sensors/Mpu6050View';
import { Bmp280View } from './components/sensors/Bmp280View';
import { Dht11View } from './components/sensors/Dht11View';
import { Neo6mView } from './components/sensors/Neo6mView';
import { FusedSensorHub } from './components/sensors/FusedSensorHub';
import { DeepSpace3DView } from './components/DeepSpace3DView';
import { GroundTrackView } from './components/GroundTrackView';
import { ManeuverPlanner } from './components/ManeuverPlanner';
import { OrbitalElementsPanel } from './components/OrbitalElementsPanel';
import { DsnSubsystemPanel } from './components/DsnSubsystemPanel';
import { TelemetryGraphsPanel, TelemetryPoint } from './components/TelemetryGraphsPanel';
import { TeamSputnikModal, TEAM_MEMBERS } from './components/TeamSputnikPanel';
import { MISSIONS } from './data/missions';
import {
  DeepSpaceMission,
  NavigationTelemetry,
  ManeuverNode,
  TrajectoryWayPoint,
} from './types/astrodynamics';
import {
  SensorSuiteData,
  SelectedSensorTab,
} from './types/sensors';
import {
  elementsToCartesian,
  cartesianToGroundTrack,
  propagateElements,
  generateTrajectoryProjection,
  EARTH_RADIUS_KM,
  SUN_RADIUS_KM,
  AU_KM,
} from './physics/orbitPropagator';
import { Users, Shield, Radio, Activity, TrendingUp, Maximize2, Cpu } from 'lucide-react';

export default function App() {
  // Current active mission
  const [currentMission, setCurrentMission] = useState<DeepSpaceMission>(MISSIONS[0]);

  // Simulation Clock & Time Warp
  const [metSeconds, setMetSeconds] = useState(currentMission.missionElapsedTimeSeconds);
  const [timeWarp, setTimeWarp] = useState<number>(100); // Default 100x
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Active Main Navigation Tab (Default to 'sensors' for Starting Dashboard)
  const [activeTab, setActiveTab] = useState<MainNavTab>('sensors');

  // Selected Sensor Option inside the Starting Dashboard: 'all' | 'mpu6050' | 'bmp280' | 'dht11' | 'neo6m' | 'deep-space'
  const [selectedSensor, setSelectedSensor] = useState<SelectedSensorTab>('all');

  // Team Sputnik Modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Active Maneuver Node
  const [maneuverNode, setManeuverNode] = useState<ManeuverNode>(currentMission.defaultManeuver);
  const [isBurnExecuting, setIsBurnExecuting] = useState(false);

  // Propellant and Mass State
  const [propellantMassKg, setPropellantMassKg] = useState(48200);
  const totalMassKg = 92000;

  // Active orbital elements
  const [orbitalElements, setOrbitalElements] = useState(currentMission.elements);

  // Live Hardware Sensor States (MPU6050, BMP280, DHT11, NEO-6M)
  const [sensorData, setSensorData] = useState<SensorSuiteData>({
    mpu6050: {
      accelX: 0.12,
      accelY: -0.08,
      accelZ: 9.81,
      gyroX: 0.42,
      gyroY: -0.18,
      gyroZ: 0.05,
      pitchDeg: 3.45,
      rollDeg: -1.82,
      yawDeg: 142.6,
      totalG: 1.002,
      temperatureC: 28.4,
      status: 'ONLINE',
      sampleRateHz: 50,
      i2cAddress: '0x68',
    },
    bmp280: {
      pressureHpa: 1011.85,
      pressurePa: 101185,
      altitudeMeters: 4280.0,
      altitudeFeet: 14042.0,
      temperatureC: 24.15,
      seaLevelPressureHpa: 1013.25,
      verticalSpeedMS: 12.4,
      status: 'ONLINE',
      sampleRateHz: 10,
      i2cAddress: '0x76',
    },
    dht11: {
      temperatureC: 23.6,
      temperatureF: 74.48,
      humidityPercent: 48,
      dewPointC: 11.9,
      heatIndexC: 23.4,
      comfortLevel: 'OPTIMAL',
      status: 'ONLINE',
      sampleRateHz: 1,
      pinInterface: 'GPIO 4 (1-Wire)',
    },
    neo6m: {
      latitude: 28.5721,
      longitude: -80.6480,
      altitudeMeters: 4280.0,
      groundSpeedKmH: 28.4,
      groundSpeedKnots: 15.3,
      courseDeg: 84.2,
      fixType: '3D FIX',
      satellitesTracked: 11,
      satellitesInView: 14,
      hdop: 0.9,
      utcTime: '223000.00',
      rawNmeaSentence: '$GPGGA,223000.00,2834.3260,N,08038.8800,W,1,11,0.9,4280.0,M,-29.4,M,,*5C',
      status: 'LOCKED',
      baudRate: 9600,
      uartInterface: 'UART1 (TX/RX)',
    },
  });

  // Initial seed generator for telemetry history
  const seedHistory = useCallback((mission: DeepSpaceMission): TelemetryPoint[] => {
    const isSun = mission.primaryBody.toLowerCase() === 'sun';
    const primaryRadius = isSun ? SUN_RADIUS_KM : EARTH_RADIUS_KM;
    const primaryMass = isSun ? 1.9885e30 : 5.9722e24;
    const baseMet = mission.missionElapsedTimeSeconds;
    const points: TelemetryPoint[] = [];

    for (let i = 60; i >= 0; i--) {
      const t = baseMet - i * 10;
      const elem = propagateElements(mission.elements, -i * 10, primaryMass);
      const cart = elementsToCartesian(elem, primaryMass);
      const gt = cartesianToGroundTrack(cart.position, cart.velocity, t, primaryRadius);

      points.push({
        timestamp: Date.now() - i * 1000,
        metSeconds: t,
        speedKmS: cart.speedKmS,
        altitudeKm: gt.altitudeKm,
        flightPathAngleDeg: gt.flightPathAngleDeg,
        trueAnomalyDeg: elem.trueAnomaly,
        accelerationG: 0.001,
        dsnSnrDb: 18.2 + Math.sin(i * 0.1) * 0.8,
        propellantKg: 48200,
      });
    }
    return points;
  }, []);

  // Telemetry Time-Series Buffer
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(() => seedHistory(MISSIONS[0]));

  // When switching mission, update all states
  const handleSelectMission = (mission: DeepSpaceMission) => {
    setCurrentMission(mission);
    setMetSeconds(mission.missionElapsedTimeSeconds);
    setOrbitalElements(mission.elements);
    setManeuverNode(mission.defaultManeuver);
    setTelemetryHistory(seedHistory(mission));
  };

  // Reset clock to mission default
  const handleResetTime = () => {
    setMetSeconds(currentMission.missionElapsedTimeSeconds);
    setTelemetryHistory(seedHistory(currentMission));
  };

  // Real-time Simulation Tick (Updates navigation + sensor dynamics)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const deltaSec = (timeWarp * 50) / 1000;
      setMetSeconds((prev) => {
        const nextMet = prev + deltaSec;

        // Advance orbital elements
        setOrbitalElements((prevElem) => {
          const isSun = currentMission.primaryBody.toLowerCase() === 'sun';
          const primaryMass = isSun ? 1.9885e30 : 5.9722e24;
          const primaryRadius = isSun ? SUN_RADIUS_KM : EARTH_RADIUS_KM;

          const updatedElem = propagateElements(prevElem, deltaSec, primaryMass);
          const cart = elementsToCartesian(updatedElem, primaryMass);
          const gt = cartesianToGroundTrack(cart.position, cart.velocity, nextMet, primaryRadius);

          // Update Sensor Suite in sync with spacecraft flight state
          const osc1 = Math.sin(nextMet * 0.2);
          const osc2 = Math.cos(nextMet * 0.15);
          const currentPitch = (gt.flightPathAngleDeg * 1.5) + osc1 * 2.2;
          const currentRoll = osc2 * 4.8;
          const currentG = isBurnExecuting ? 0.38 : 0.98 + (Math.abs(osc1) * 0.04);

          // Atmospheric / Enclosure temperature & humidity
          const currentTempC = 23.4 + Math.sin(nextMet * 0.01) * 1.2;
          const currentHumidity = Math.round(48 + Math.cos(nextMet * 0.01) * 4);
          const currentDewPoint = currentTempC - ((100 - currentHumidity) / 5);

          setSensorData({
            mpu6050: {
              accelX: osc1 * 1.2,
              accelY: osc2 * 0.9,
              accelZ: currentG * 9.80665,
              gyroX: osc2 * 2.4,
              gyroY: -osc1 * 1.8,
              gyroZ: 0.12,
              pitchDeg: currentPitch,
              rollDeg: currentRoll,
              yawDeg: ((nextMet * 0.5) % 360),
              totalG: currentG,
              temperatureC: 28.2 + osc1 * 0.4,
              status: 'ONLINE',
              sampleRateHz: 50,
              i2cAddress: '0x68',
            },
            bmp280: {
              pressureHpa: Math.max(0.1, 1013.25 * Math.exp(-gt.altitudeKm / 8.5)),
              pressurePa: Math.round(Math.max(10, 101325 * Math.exp(-gt.altitudeKm / 8.5))),
              altitudeMeters: gt.altitudeKm * 1000,
              altitudeFeet: gt.altitudeKm * 3280.84,
              temperatureC: currentTempC + 0.8,
              seaLevelPressureHpa: 1013.25,
              verticalSpeedMS: cart.velocity.z * 1000,
              status: 'ONLINE',
              sampleRateHz: 10,
              i2cAddress: '0x76',
            },
            dht11: {
              temperatureC: currentTempC,
              temperatureF: (currentTempC * 9) / 5 + 32,
              humidityPercent: currentHumidity,
              dewPointC: currentDewPoint,
              heatIndexC: currentTempC + (currentHumidity > 60 ? 1.5 : -0.2),
              comfortLevel: currentHumidity > 75 ? 'HUMID' : 'OPTIMAL',
              status: 'ONLINE',
              sampleRateHz: 1,
              pinInterface: 'GPIO 4 (1-Wire)',
            },
            neo6m: {
              latitude: gt.latitude,
              longitude: gt.longitude,
              altitudeMeters: gt.altitudeKm * 1000,
              groundSpeedKmH: gt.groundSpeedKmS * 3600,
              groundSpeedKnots: gt.groundSpeedKmS * 1943.84,
              courseDeg: 84.5,
              fixType: '3D FIX',
              satellitesTracked: 11,
              satellitesInView: 14,
              hdop: 0.8,
              utcTime: new Date().toISOString().substring(11, 19).replace(/:/g, '') + '.00',
              rawNmeaSentence: `$GPGGA,${new Date().toISOString().substring(11, 19).replace(/:/g, '')}.00,${Math.abs(gt.latitude * 100).toFixed(2)},${gt.latitude >= 0 ? 'N' : 'S'},${Math.abs(gt.longitude * 100).toFixed(2)},${gt.longitude >= 0 ? 'E' : 'W'},1,11,0.8,${(gt.altitudeKm * 1000).toFixed(0)},M,-29.4,M,,*5C`,
              status: 'LOCKED',
              baudRate: 9600,
              uartInterface: 'UART1 (TX/RX)',
            },
          });

          // Push into telemetry history buffer
          setTelemetryHistory((hPrev) => {
            const newPoint: TelemetryPoint = {
              timestamp: Date.now(),
              metSeconds: nextMet,
              speedKmS: cart.speedKmS,
              altitudeKm: gt.altitudeKm,
              flightPathAngleDeg: gt.flightPathAngleDeg,
              trueAnomalyDeg: updatedElem.trueAnomaly,
              accelerationG: isBurnExecuting ? 0.38 : 0.001,
              dsnSnrDb: 18.4 + Math.sin(nextMet * 0.01) * 0.9,
              propellantKg: propellantMassKg,
            };
            const updated = [...hPrev, newPoint];
            return updated.length > 200 ? updated.slice(-200) : updated;
          });

          return updatedElem;
        });

        return nextMet;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, timeWarp, currentMission, isBurnExecuting, propellantMassKg]);

  // Current Cartesian State and Navigation Telemetry
  const telemetry: NavigationTelemetry = useMemo(() => {
    const isSun = currentMission.primaryBody.toLowerCase() === 'sun';
    const primaryRadius = isSun ? SUN_RADIUS_KM : EARTH_RADIUS_KM;
    const primaryMass = isSun ? 1.9885e30 : 5.9722e24;

    const cartesian = elementsToCartesian(orbitalElements, primaryMass);
    const groundTrack = cartesianToGroundTrack(
      cartesian.position,
      cartesian.velocity,
      metSeconds,
      primaryRadius
    );

    const dryMass = totalMassKg - propellantMassKg;
    const dvRemainingKmS = (9.80665 * 380 * Math.log(totalMassKg / Math.max(1, dryMass))) / 1000;

    return {
      latitude: groundTrack.latitude,
      longitude: groundTrack.longitude,
      altitudeKm: groundTrack.altitudeKm,
      speedInertialKmS: cartesian.speedKmS,
      speedGroundKmS: groundTrack.groundSpeedKmS,
      flightPathAngleDeg: groundTrack.flightPathAngleDeg,
      trueAnomalyDeg: orbitalElements.trueAnomaly,
      accelerationG: isBurnExecuting ? 0.38 : 0.001,
      deltaVRemainingKmS: dvRemainingKmS,
      propellantMassKg,
      totalMassKg,
      ispSeconds: 380,
    };
  }, [orbitalElements, metSeconds, currentMission, propellantMassKg, totalMassKg, isBurnExecuting]);

  // Real-time Forward Trajectory Waypoints
  const projectedWaypoints: TrajectoryWayPoint[] = useMemo(() => {
    const isSun = currentMission.primaryBody.toLowerCase() === 'sun';
    return generateTrajectoryProjection(
      orbitalElements,
      maneuverNode,
      isSun,
      120,
      currentMission.missionDurationDays * 86400
    );
  }, [orbitalElements, maneuverNode, currentMission]);

  // Execute Maneuver Burn Simulation
  const handleExecuteBurn = useCallback(() => {
    if (maneuverNode.totalDeltaVKmS <= 0 || isBurnExecuting) return;

    setIsBurnExecuting(true);

    setTimeout(() => {
      const g0 = 9.80665;
      const isp = 380;
      const dv = maneuverNode.totalDeltaVKmS * 1000;
      const propFraction = 1 - Math.exp(-dv / (g0 * isp));
      const fuelBurned = Math.round(totalMassKg * propFraction);

      setPropellantMassKg((prev) => Math.max(0, prev - fuelBurned));

      setOrbitalElements((prev) => {
        const newA = prev.semiMajorAxis * (1 + maneuverNode.deltaVProgradeKmS * 0.12);
        const newEcc = Math.min(0.99, Math.max(0.01, prev.eccentricity + maneuverNode.deltaVProgradeKmS * 0.04));
        const newInc = prev.inclination + maneuverNode.deltaVNormalKmS * 15;
        return {
          ...prev,
          semiMajorAxis: newA,
          eccentricity: newEcc,
          inclination: newInc,
          periapsisDistance: newA * (1 - newEcc),
          apoapsisDistance: newA * (1 + newEcc),
        };
      });

      setManeuverNode((prev) => ({
        ...prev,
        isExecuting: false,
        executed: true,
      }));

      setIsBurnExecuting(false);
    }, 2400);
  }, [maneuverNode, isBurnExecuting, totalMassKg]);

  return (
    <div className="flex flex-col min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. TOP BAR CONTRACT */}
      <NavigationHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mission={currentMission}
        telemetry={telemetry}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
      />

      {/* 2. STARTING DASHBOARD: SENSOR SELECTION OPTION STRIP (MPU6050, BMP280, DHT11, NEO-6M) */}
      <SensorSelectorBar
        selectedTab={activeTab === 'sensors' ? selectedSensor : 'deep-space'}
        onSelectTab={(tab) => {
          if (tab === 'deep-space') {
            setActiveTab('3d-orbit');
          } else {
            setActiveTab('sensors');
            setSelectedSensor(tab);
          }
        }}
        sensorData={sensorData}
      />

      {/* 3. TELEMETRY RIBBON & MISSION TIMELINE */}
      <TelemetryBar
        currentMission={currentMission}
        onSelectMission={handleSelectMission}
        metSeconds={metSeconds}
        timeWarp={timeWarp}
        onChangeTimeWarp={setTimeWarp}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onResetTime={handleResetTime}
        carrierLocked={true}
      />

      {/* 4. PRIMARY NAVIGATION METRICS (Lat, Lon, Alt, Speed, Ground Speed, γ, ν, Δv) */}
      <PrimaryMetricsGrid
        telemetry={telemetry}
        elements={orbitalElements}
        primaryBody={currentMission.primaryBody}
      />

      {/* 5. MAIN VIEWPORT & WORKSPACE CONSOLE */}
      <main className="flex-1 flex flex-col p-4 md:p-6 gap-6 max-w-[1600px] w-full mx-auto">
        {/* Main Display Stage */}
        <div className="flex-1 min-h-[520px] rounded-lg border border-slate-800 bg-[#0B0E17] overflow-hidden shadow-xl flex flex-col">
          {/* Sub-header view tabs for quick switching */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-[#07090E] border-b border-slate-800">
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded">
              <button
                onClick={() => {
                  setActiveTab('sensors');
                  setSelectedSensor('all');
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'sensors' && selectedSensor === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Temp, Humidity, Roll & Pitch</span>
              </button>

              <button
                onClick={() => setActiveTab('3d-orbit')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === '3d-orbit'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Heliocentric 3D View
              </button>

              <button
                onClick={() => setActiveTab('ground-track')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'ground-track'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2D Ground Track
              </button>

              <button
                onClick={() => setActiveTab('maneuver')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'maneuver'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Maneuver Planner (TCM)
              </button>

              <button
                onClick={() => setActiveTab('elements')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTab === 'elements'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Orbital Elements
              </button>

              <button
                onClick={() => setActiveTab('graphs')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'graphs'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Telemetry Graphs</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>VEHICLE: <strong className="text-slate-200">{currentMission.callsign}</strong></span>
              <span className="text-slate-700">|</span>
              <span>CONTROLLER: <strong className="text-cyan-400">TEAM SPUTNIK</strong></span>
            </div>
          </div>

          {/* Active Display Component */}
          <div className="flex-1 w-full h-full relative">
            {/* SENSORS STARTING DASHBOARD VIEWS */}
            {activeTab === 'sensors' && (
              <>
                {selectedSensor === 'all' && (
                  <EnvironmentAttitudeDashboard
                    mpuData={sensorData.mpu6050}
                    dhtData={sensorData.dht11}
                    bmpData={sensorData.bmp280}
                  />
                )}
                {selectedSensor === 'mpu6050' && (
                  <Mpu6050View data={sensorData.mpu6050} />
                )}
                {selectedSensor === 'bmp280' && (
                  <Bmp280View data={sensorData.bmp280} />
                )}
                {selectedSensor === 'dht11' && (
                  <Dht11View data={sensorData.dht11} />
                )}
                {selectedSensor === 'neo6m' && (
                  <Neo6mView data={sensorData.neo6m} />
                )}
              </>
            )}

            {/* DEEP SPACE ASTRODYNAMICS VIEWS */}
            {activeTab === '3d-orbit' && (
              <DeepSpace3DView
                mission={currentMission}
                projectedWaypoints={projectedWaypoints}
                maneuverNode={maneuverNode}
                currentTrueAnomaly={orbitalElements.trueAnomaly}
              />
            )}

            {activeTab === 'ground-track' && (
              <GroundTrackView
                telemetry={telemetry}
                elements={orbitalElements}
                metSeconds={metSeconds}
              />
            )}

            {activeTab === 'maneuver' && (
              <ManeuverPlanner
                maneuverNode={maneuverNode}
                onUpdateManeuver={setManeuverNode}
                telemetry={telemetry}
                mission={currentMission}
                onExecuteBurn={handleExecuteBurn}
                isBurnExecuting={isBurnExecuting}
              />
            )}

            {activeTab === 'elements' && (
              <OrbitalElementsPanel
                elements={orbitalElements}
                telemetry={telemetry}
                primaryBody={currentMission.primaryBody}
              />
            )}

            {activeTab === 'graphs' && (
              <TelemetryGraphsPanel
                history={telemetryHistory}
                currentMissionName={currentMission.code}
                onClearHistory={() => setTelemetryHistory([])}
              />
            )}
          </div>
        </div>

        {/* 6. LIVE TELEMETRY SPARKLINE STRIP TRAY */}
        {activeTab !== 'graphs' && (
          <div className="bg-[#0B0E17] border border-slate-800 rounded p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  LIVE TELEMETRY STRIP CHARTS (REAL-TIME STREAM)
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                  {telemetryHistory.length} SAMPLES
                </span>
              </div>
              <button
                onClick={() => setActiveTab('graphs')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Open Multi-Channel Telemetry Graph</span>
              </button>
            </div>

            {/* 3 Live Mini Sparkline Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Sparkline 1: Speed */}
              <div
                onClick={() => setActiveTab('graphs')}
                className="p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">Inertial Speed (v)</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {telemetry.speedInertialKmS.toFixed(3)} km/s
                  </span>
                </div>
                <div className="h-10 my-1 w-full">
                  <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                    {(() => {
                      if (telemetryHistory.length < 2) return null;
                      const vals = telemetryHistory.map((d) => d.speedKmS);
                      const minV = Math.min(...vals);
                      const maxV = Math.max(...vals);
                      const span = Math.max(0.001, maxV - minV);
                      const pts = telemetryHistory
                        .map((d, i) => {
                          const x = (i / (telemetryHistory.length - 1)) * 200;
                          const y = 35 - ((d.speedKmS - minV) / span) * 30;
                          return `${x},${y}`;
                        })
                        .join(' ');
                      return (
                        <polyline
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="1.8"
                          points={pts}
                        />
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>LAST 60 SECONDS</span>
                  <span className="text-emerald-400">NOMINAL DRIFT</span>
                </div>
              </div>

              {/* Sparkline 2: Altitude */}
              <div
                onClick={() => setActiveTab('graphs')}
                className="p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">Altitude Above Surface (h)</span>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {telemetry.altitudeKm > AU_KM * 0.1
                      ? `${(telemetry.altitudeKm / AU_KM).toFixed(4)} AU`
                      : `${telemetry.altitudeKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`}
                  </span>
                </div>
                <div className="h-10 my-1 w-full">
                  <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                    {(() => {
                      if (telemetryHistory.length < 2) return null;
                      const vals = telemetryHistory.map((d) => d.altitudeKm);
                      const minV = Math.min(...vals);
                      const maxV = Math.max(...vals);
                      const span = Math.max(0.001, maxV - minV);
                      const pts = telemetryHistory
                        .map((d, i) => {
                          const x = (i / (telemetryHistory.length - 1)) * 200;
                          const y = 35 - ((d.altitudeKm - minV) / span) * 30;
                          return `${x},${y}`;
                        })
                        .join(' ');
                      return (
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="1.8"
                          points={pts}
                        />
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>RADIAL VECTOR</span>
                  <span className="text-sky-400">CLIMBING PROFILE</span>
                </div>
              </div>

              {/* Sparkline 3: Flight Path Angle */}
              <div
                onClick={() => setActiveTab('graphs')}
                className="p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">Flight Path Angle (γ)</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {telemetry.flightPathAngleDeg >= 0 ? '+' : ''}{telemetry.flightPathAngleDeg.toFixed(2)}°
                  </span>
                </div>
                <div className="h-10 my-1 w-full">
                  <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                    {(() => {
                      if (telemetryHistory.length < 2) return null;
                      const vals = telemetryHistory.map((d) => d.flightPathAngleDeg);
                      const minV = Math.min(...vals);
                      const maxV = Math.max(...vals);
                      const span = Math.max(0.001, maxV - minV);
                      const pts = telemetryHistory
                        .map((d, i) => {
                          const x = (i / (telemetryHistory.length - 1)) * 200;
                          const y = 35 - ((d.flightPathAngleDeg - minV) / span) * 30;
                          return `${x},${y}`;
                        })
                        .join(' ');
                      return (
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.8"
                          points={pts}
                        />
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>ANGULAR VECTOR</span>
                  <span className="text-emerald-400">HORIZONTAL BALANCED</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. DSN SUBSYSTEM & GROUND STATIONS MONITOR */}
        <DsnSubsystemPanel
          roundTripLightTimeSeconds={currentMission.roundTripLightTimeSeconds}
        />

        {/* 8. TEAM SPUTNIK FLIGHT DYNAMICS CONSOLE STRIP */}
        <section className="bg-[#0B0E17] border border-slate-800 rounded p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                FLIGHT OPERATIONS CONSOLE · TEAM SPUTNIK
              </h3>
            </div>
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View Full Flight Team (5 Members)</span>
            </button>
          </div>

          {/* 5 Team Members Live Station Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.id}
                onClick={() => setIsTeamModalOpen(true)}
                className="p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyan-400 font-bold">STN-0{member.id}</span>
                  <span className="text-emerald-400 font-semibold">● ACTIVE</span>
                </div>
                <div className="my-2">
                  <div className="text-sm font-mono font-bold text-slate-100 truncate">
                    {member.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {member.role.split('(')[0].trim()}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate border-t border-slate-800/80 pt-1.5">
                  {member.specialty}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 9. QUIET AERO FOOTER */}
      <footer className="px-6 py-4 border-t border-slate-800 bg-[#07090E] text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span>TEAM SPUTNIK DASHBOARD</span>
          <span>·</span>
          <span>HARDWARE SENSORS & ASTRODYNAMICS</span>
          <span>·</span>
          <span>EPHEMERIS v4.2</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>BUS: I2C (0x68, 0x76) + UART (9600) + 1-WIRE</span>
          <span>UTC: {new Date().toISOString().substring(0, 19)}Z</span>
        </div>
      </footer>

      {/* Team Sputnik Detail Modal */}
      <TeamSputnikModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />
    </div>
  );
}
