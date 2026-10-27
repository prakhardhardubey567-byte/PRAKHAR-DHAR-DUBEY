/**
 * Astrodynamics & Space Navigation Type Definitions
 * Mission Control Trajectory (MCT) / Flight Dynamics Specifications
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface OrbitalElements {
  semiMajorAxis: number;     // a (km or AU)
  eccentricity: number;       // e (0 = circular, 0<e<1 elliptical, 1 parabolic, >1 hyperbolic)
  inclination: number;        // i (degrees)
  longitudeOfAscendingNode: number; // Ω (degrees)
  argumentOfPeriapsis: number;// ω (degrees)
  trueAnomaly: number;        // ν (degrees)
  periodSeconds: number;      // Orbital period T
  periapsisDistance: number;  // r_p (km)
  apoapsisDistance: number;   // r_a (km)
}

export interface NavigationTelemetry {
  latitude: number;           // deg (-90 to +90)
  longitude: number;          // deg (-180 to +180)
  altitudeKm: number;         // km above primary body surface
  speedInertialKmS: number;   // v_inertial (km/s)
  speedGroundKmS: number;     // v_ground (km/s)
  flightPathAngleDeg: number; // γ (deg)
  trueAnomalyDeg: number;     // ν (deg)
  accelerationG: number;      // current G loading
  deltaVRemainingKmS: number; // Δv propellant budget remaining
  propellantMassKg: number;   // kg
  totalMassKg: number;        // kg
  ispSeconds: number;         // engine specific impulse
}

export interface AttitudeTelemetry {
  pitchDeg: number;
  yawDeg: number;
  rollDeg: number;
  pitchRateDegS: number;
  yawRateDegS: number;
  rollRateDegS: number;
  mode: 'INERTIAL_HOLD' | 'PROGRADE' | 'RETROGRADE' | 'NORMAL' | 'EARTH_POINTING' | 'SUN_POINTING';
}

export interface GroundStation {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  elevationAngleDeg: number;
  azimuthDeg: number;
  rangeKm: number;
  dopplerShiftKHz: number;
  snrDb: number;
  carrierLocked: boolean;
  frequencyBand: 'X-Band' | 'Ka-Band' | 'S-Band';
}

export interface TrajectoryWayPoint {
  timeOffsetSeconds: number;
  positionKm: Vector3D;
  velocityKmS: Vector3D;
  latitude?: number;
  longitude?: number;
  altitudeKm?: number;
  phaseName: string;
}

export interface ManeuverNode {
  id: string;
  timeToNodeSeconds: number;  // Seconds from now
  deltaVProgradeKmS: number;  // Δv along velocity vector (km/s)
  deltaVNormalKmS: number;    // Δv perpendicular to orbital plane (km/s)
  deltaVRadialKmS: number;    // Δv towards/away from primary body (km/s)
  totalDeltaVKmS: number;
  burnDurationSeconds: number;
  isExecuting: boolean;
  executed: boolean;
}

export interface CelestialBody {
  id: string;
  name: string;
  radiusKm: number;
  color: string;
  massKg: number;
  semiMajorAxisAU: number;
  orbitalPeriodDays: number;
  textureType: 'earth' | 'mars' | 'moon' | 'jupiter' | 'sun';
}

export interface DeepSpaceMission {
  id: string;
  code: string;
  name: string;
  callsign: string;
  targetBody: string;
  primaryBody: string;
  missionElapsedTimeSeconds: number;
  missionDurationDays: number;
  trajectoryStatus: 'NOMINAL' | 'CORRECTION_SCHEDULED' | 'DRIFT_DETECTED' | 'HYPERBOLIC_ESCAPE';
  elements: OrbitalElements;
  targetDistanceKm: number;
  earthDistanceKm: number;
  oneWayLightTimeSeconds: number;
  roundTripLightTimeSeconds: number;
  defaultManeuver: ManeuverNode;
  description: string;
}
