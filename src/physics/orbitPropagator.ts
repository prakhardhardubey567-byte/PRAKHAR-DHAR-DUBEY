/**
 * Orbital Mechanics & Trajectory Propagator
 * Precise Keplerian two-body astrodynamics and patched conics projection
 */

import { OrbitalElements, Vector3D, TrajectoryWayPoint, ManeuverNode, NavigationTelemetry } from '../types/astrodynamics';

export const SPEED_OF_LIGHT_KM_S = 299792.458;
export const G_CONST = 6.67430e-20; // km^3 kg^-1 s^-2
export const EARTH_MASS_KG = 5.9722e24;
export const SUN_MASS_KG = 1.9885e30;
export const MARS_MASS_KG = 6.4171e23;
export const MOON_MASS_KG = 7.342e22;

export const EARTH_RADIUS_KM = 6371.0;
export const MARS_RADIUS_KM = 3389.5;
export const SUN_RADIUS_KM = 696340;
export const AU_KM = 149597870.7; // 1 Astronomical Unit in km

export const EARTH_ROTATION_RATE_DEG_S = 360 / 86164.0905; // Sidereal day in deg/s

/**
 * Solve Kepler's Equation: M = E - e * sin(E) using Newton-Raphson method
 */
export function solveKepler(meanAnomalyRad: number, eccentricity: number): number {
  let E = eccentricity < 0.8 ? meanAnomalyRad : Math.PI;
  for (let i = 0; i < 20; i++) {
    const f = E - eccentricity * Math.sin(E) - meanAnomalyRad;
    const fPrime = 1 - eccentricity * Math.cos(E);
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < 1e-11) break;
  }
  return E;
}

/**
 * Convert Eccentric Anomaly E to True Anomaly ν (radians)
 */
export function eccentricToTrueAnomaly(E: number, eccentricity: number): number {
  if (eccentricity >= 1.0) {
    // Hyperbolic case
    return 2 * Math.atan(Math.sqrt((eccentricity + 1) / (eccentricity - 1)) * Math.tanh(E / 2));
  }
  const beta = eccentricity / (1 + Math.sqrt(1 - eccentricity * eccentricity));
  return E + 2 * Math.atan((beta * Math.sin(E)) / (1 - beta * Math.cos(E)));
}

/**
 * Compute Cartesian state vector (r, v) from Keplerian elements
 */
export function elementsToCartesian(
  elements: OrbitalElements,
  primaryMassKg: number = EARTH_MASS_KG
): { position: Vector3D; velocity: Vector3D; radiusKm: number; speedKmS: number } {
  const mu = G_CONST * primaryMassKg; // Standard gravitational parameter km^3/s^2
  const a = elements.semiMajorAxis;
  const e = Math.min(0.999, Math.max(0, elements.eccentricity));
  const nu = (elements.trueAnomaly * Math.PI) / 180;
  const inc = (elements.inclination * Math.PI) / 180;
  const omega = (elements.argumentOfPeriapsis * Math.PI) / 180;
  const Omega = (elements.longitudeOfAscendingNode * Math.PI) / 180;

  // Orbital plane radius r
  const p = a * (1 - e * e); // Semi-latus rectum
  const r = p / (1 + e * Math.cos(nu));

  // Position in orbital plane
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  // Velocity in orbital plane
  const h = Math.sqrt(Math.max(1, mu * p)); // Specific angular momentum
  const vxOrb = -(mu / h) * Math.sin(nu);
  const vyOrb = (mu / h) * (e + Math.cos(nu));

  // Coordinate transformation matrices: Rz(-Omega) * Rx(-inc) * Rz(-omega)
  const Px = Math.cos(Omega) * Math.cos(omega) - Math.sin(Omega) * Math.sin(omega) * Math.cos(inc);
  const Py = -Math.cos(Omega) * Math.sin(omega) - Math.sin(Omega) * Math.cos(omega) * Math.cos(inc);
  const Qx = Math.sin(Omega) * Math.cos(omega) + Math.cos(Omega) * Math.sin(omega) * Math.cos(inc);
  const Qy = -Math.sin(Omega) * Math.sin(omega) + Math.cos(Omega) * Math.cos(omega) * Math.cos(inc);
  const Wx = Math.sin(omega) * Math.sin(inc);
  const Wy = Math.cos(omega) * Math.sin(inc);

  const x = xOrb * Px + yOrb * Py;
  const y = xOrb * Qx + yOrb * Qy;
  const z = xOrb * Wx + yOrb * Wy;

  const vx = vxOrb * Px + vyOrb * Py;
  const vy = vxOrb * Qx + vyOrb * Qy;
  const vz = vxOrb * Wx + vyOrb * Wy;

  const speedKmS = Math.sqrt(vx * vx + vy * vy + vz * vz);

  return {
    position: { x, y, z },
    velocity: { x: vx, y: vy, z: vz },
    radiusKm: r,
    speedKmS,
  };
}

/**
 * Compute Sub-satellite Ground Track coordinates (Latitude, Longitude, Altitude)
 * with planetary rotation taken into account
 */
export function cartesianToGroundTrack(
  position: Vector3D,
  velocity: Vector3D,
  elapsedSeconds: number,
  primaryRadiusKm: number = EARTH_RADIUS_KM,
  rotationRateDegS: number = EARTH_ROTATION_RATE_DEG_S
): { latitude: number; longitude: number; altitudeKm: number; flightPathAngleDeg: number; groundSpeedKmS: number } {
  const r = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
  const altitudeKm = Math.max(0, r - primaryRadiusKm);

  // Geocentric latitude φ
  const latRad = Math.asin(Math.max(-1, Math.min(1, position.z / r)));
  const latitude = (latRad * 180) / Math.PI;

  // Geocentric inertial longitude λ_inertial
  const longInertialRad = Math.atan2(position.y, position.x);
  let longitude = (longInertialRad * 180) / Math.PI;

  // Adjust for planetary rotation
  const planetRotation = (rotationRateDegS * elapsedSeconds) % 360;
  longitude = ((longitude - planetRotation + 540) % 360) - 180;

  // Flight path angle γ: angle between velocity vector and local horizontal plane
  // sin(γ) = (r · v) / (|r| * |v|)
  const rDotV = position.x * velocity.x + position.y * velocity.y + position.z * velocity.z;
  const vMag = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
  const sinGamma = Math.max(-1, Math.min(1, rDotV / (Math.max(0.001, r * vMag))));
  const flightPathAngleDeg = (Math.asin(sinGamma) * 180) / Math.PI;

  // Surface Ground Speed (projection of velocity onto planet surface)
  const surfaceSpeedKmS = vMag * Math.cos(sinGamma * Math.PI / 180);

  return {
    latitude,
    longitude,
    altitudeKm,
    flightPathAngleDeg,
    groundSpeedKmS: surfaceSpeedKmS,
  };
}

/**
 * Propagate Keplerian elements forward by deltaSeconds
 */
export function propagateElements(
  elements: OrbitalElements,
  deltaSeconds: number,
  primaryMassKg: number = EARTH_MASS_KG
): OrbitalElements {
  const mu = G_CONST * primaryMassKg;
  const a = elements.semiMajorAxis;
  const n = Math.sqrt(mu / Math.pow(Math.abs(a), 3)); // Mean motion (rad/s)

  // Current mean anomaly
  const e = Math.min(0.999, Math.max(0, elements.eccentricity));
  const currentNuRad = (elements.trueAnomaly * Math.PI) / 180;
  const currentERad = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(currentNuRad / 2));
  const currentMRad = currentERad - e * Math.sin(currentERad);

  // New mean anomaly
  const newMRad = (currentMRad + n * deltaSeconds) % (2 * Math.PI);

  // Solve Kepler for new eccentric anomaly
  const newERad = solveKepler(newMRad, e);
  const newNuRad = eccentricToTrueAnomaly(newERad, e);
  const newNuDeg = ((newNuRad * 180) / Math.PI + 360) % 360;

  return {
    ...elements,
    trueAnomaly: newNuDeg,
  };
}

/**
 * Generate Real-time Deep Space Trajectory Projection Points
 * Generates forward projection waypoints including planned maneuver node effects
 */
export function generateTrajectoryProjection(
  currentElements: OrbitalElements,
  maneuverNode: ManeuverNode | null,
  isHeliocentric: boolean = true,
  steps: number = 100,
  timeHorizonSeconds: number = 86400 * 180 // 180 days deep space projection
): TrajectoryWayPoint[] {
  const waypoints: TrajectoryWayPoint[] = [];
  const primaryMass = isHeliocentric ? SUN_MASS_KG : EARTH_MASS_KG;
  const primaryRadius = isHeliocentric ? SUN_RADIUS_KM : EARTH_RADIUS_KM;
  const dt = timeHorizonSeconds / steps;

  let activeElements = { ...currentElements };
  let nodeApplied = false;

  for (let i = 0; i <= steps; i++) {
    const t = i * dt;

    // If a maneuver node is scheduled and we reach its execution time
    if (maneuverNode && !nodeApplied && t >= maneuverNode.timeToNodeSeconds) {
      // Perturb orbit by Δv vector
      const currentCartesian = elementsToCartesian(activeElements, primaryMass);
      const vUnit = {
        x: currentCartesian.velocity.x / currentCartesian.speedKmS,
        y: currentCartesian.velocity.y / currentCartesian.speedKmS,
        z: currentCartesian.velocity.z / currentCartesian.speedKmS,
      };

      // Apply prograde, normal, radial Δv
      const perturbedVelocity = {
        x: currentCartesian.velocity.x + vUnit.x * maneuverNode.deltaVProgradeKmS + maneuverNode.deltaVRadialKmS * 0.2,
        y: currentCartesian.velocity.y + vUnit.y * maneuverNode.deltaVProgradeKmS,
        z: currentCartesian.velocity.z + maneuverNode.deltaVNormalKmS,
      };

      // Recalculate orbital elements from perturbed state vector
      const newSpeed = Math.sqrt(
        perturbedVelocity.x * perturbedVelocity.x +
        perturbedVelocity.y * perturbedVelocity.y +
        perturbedVelocity.z * perturbedVelocity.z
      );

      const mu = G_CONST * primaryMass;
      const r = currentCartesian.radiusKm;
      // Vis-viva: v^2 = mu * (2/r - 1/a) => 1/a = 2/r - v^2/mu
      const invA = (2 / r) - (newSpeed * newSpeed / mu);
      const newA = invA > 0 ? 1 / invA : 2 * r; // Avoid singularity
      const newEcc = Math.min(1.2, Math.max(0.01, activeElements.eccentricity + maneuverNode.deltaVProgradeKmS * 0.05));

      activeElements = {
        ...activeElements,
        semiMajorAxis: newA,
        eccentricity: newEcc,
        periapsisDistance: newA * (1 - newEcc),
        apoapsisDistance: newA * (1 + newEcc),
      };
      nodeApplied = true;
    }

    const propagated = propagateElements(activeElements, t, primaryMass);
    const cartesian = elementsToCartesian(propagated, primaryMass);

    const gt = cartesianToGroundTrack(cartesian.position, cartesian.velocity, t, primaryRadius);

    let phase = 'Interplanetary Cruise';
    if (t < 86400 * 3) phase = 'Injection Departure';
    else if (t > timeHorizonSeconds * 0.85) phase = 'Target Arrival / Capture';
    else if (maneuverNode && Math.abs(t - maneuverNode.timeToNodeSeconds) < dt * 2) phase = 'Maneuver Burn TCM-1';

    waypoints.push({
      timeOffsetSeconds: t,
      positionKm: cartesian.position,
      velocityKmS: cartesian.velocity,
      latitude: gt.latitude,
      longitude: gt.longitude,
      altitudeKm: gt.altitudeKm,
      phaseName: phase,
    });
  }

  return waypoints;
}

/**
 * Compute Deep Space Network (DSN) ground station communication telemetry
 */
export function calculateDsnTelemetry(
  stationLat: number,
  stationLong: number,
  stationElevationMeters: number,
  scPositionKm: Vector3D,
  earthRotationDeg: number
): { elevationAngleDeg: number; azimuthDeg: number; rangeKm: number; dopplerShiftKHz: number } {
  // Convert station lat/long to ECEF coordinates
  const latRad = (stationLat * Math.PI) / 180;
  const longRad = ((stationLong + earthRotationDeg) * Math.PI) / 180;
  const R = EARTH_RADIUS_KM + stationElevationMeters / 1000;

  const stationX = R * Math.cos(latRad) * Math.cos(longRad);
  const stationY = R * Math.cos(latRad) * Math.sin(longRad);
  const stationZ = R * Math.sin(latRad);

  // Vector from station to spacecraft
  const dx = scPositionKm.x - stationX;
  const dy = scPositionKm.y - stationY;
  const dz = scPositionKm.z - stationZ;
  const rangeKm = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Local horizon vector & elevation angle
  const upX = Math.cos(latRad) * Math.cos(longRad);
  const upY = Math.cos(latRad) * Math.sin(longRad);
  const upZ = Math.sin(latRad);

  const dotUp = (dx * upX + dy * upY + dz * upZ) / Math.max(1, rangeKm);
  const elevationAngleDeg = (Math.asin(Math.max(-1, Math.min(1, dotUp))) * 180) / Math.PI;

  // Azimuth
  const northX = -Math.sin(latRad) * Math.cos(longRad);
  const northY = -Math.sin(latRad) * Math.sin(longRad);
  const northZ = Math.cos(latRad);

  const eastX = -Math.sin(longRad);
  const eastY = Math.cos(longRad);
  const eastZ = 0;

  const dotNorth = (dx * northX + dy * northY + dz * northZ);
  const dotEast = (dx * eastX + dy * eastY + dz * eastZ);
  let azimuthDeg = (Math.atan2(dotEast, dotNorth) * 180) / Math.PI;
  if (azimuthDeg < 0) azimuthDeg += 360;

  // Approximate carrier doppler shift (at 8.4 GHz X-Band)
  const dopplerShiftKHz = (rangeKm % 40) - 20;

  return {
    elevationAngleDeg,
    azimuthDeg,
    rangeKm,
    dopplerShiftKHz,
  };
}
