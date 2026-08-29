import { Coordinates, Vector2D } from '../../types/vehicle';
import {
  calculateHaversineDistance,
  latLngToLocalCartesian,
  localCartesianToLatLng,
  velocityVectorFromHeading,
  vectorMagnitude,
  vectorDot,
  vectorSubtract,
  vectorAdd,
  vectorScale,
} from './geoMath';

export interface RelativeMotionResult {
  distanceMeters: number;
  relativePositionVector: Vector2D; // r = p2 - p1 (meters)
  relativeVelocityVector: Vector2D; // v_rel = v2 - v1 (m/s)
  relativeVelocityKmh: number;      // ||v_rel|| in km/h
  closingSpeedKmh: number;          // Closing speed in km/h (positive means approaching)
  closingSpeedMps: number;
  timeToCPASec: number;             // Time to closest point of approach (seconds)
  distanceAtCPAMeters: number;      // Distance at CPA (meters)
  timeToCollisionSec: number | null;// Estimated TTC (seconds)
  cpaPointSelf: Coordinates;        // Geo-coord of vehicle 1 at CPA
  cpaPointOther: Coordinates;       // Geo-coord of vehicle 2 at CPA
  projectedPathSelf: Coordinates[]; // Projected path over next 5s
  projectedPathOther: Coordinates[];// Projected path over next 5s
}

/**
 * Calculates full vector-based relative kinematics between vehicle 1 (self) and vehicle 2 (other)
 */
export function calculateRelativeKinematics(
  pos1: Coordinates,
  speedKmh1: number,
  headingDeg1: number,
  pos2: Coordinates,
  speedKmh2: number,
  headingDeg2: number,
  safetyRadiusMeters: number = 10
): RelativeMotionResult {
  const distanceMeters = calculateHaversineDistance(pos1, pos2);

  // Use pos1 as the origin for local 2D tangent plane
  const p1: Vector2D = { x: 0, y: 0 };
  const p2: Vector2D = latLngToLocalCartesian(pos2, pos1);

  // Relative position vector: r = p2 - p1
  const r: Vector2D = vectorSubtract(p2, p1);
  const rMag = vectorMagnitude(r);

  // Velocities in m/s
  const v1 = velocityVectorFromHeading(speedKmh1, headingDeg1);
  const v2 = velocityVectorFromHeading(speedKmh2, headingDeg2);

  // Relative velocity vector: v_rel = v2 - v1
  const vRel = vectorSubtract(v2, v1);
  const vRelMag = vectorMagnitude(vRel); // m/s
  const relativeVelocityKmh = (vRelMag * 3600) / 1000;

  // Closing speed: - (r · v_rel) / ||r||
  // Positive value means the distance is decreasing (closing in)
  let closingSpeedMps = 0;
  if (rMag > 0.001) {
    closingSpeedMps = -vectorDot(r, vRel) / rMag;
  }
  const closingSpeedKmh = (closingSpeedMps * 3600) / 1000;

  // CPA Calculation
  // r(t) = r + v_rel * t
  // Minimized at t_cpa = - (r · v_rel) / ||v_rel||^2
  let tCPA = 0;
  let dCPA = distanceMeters;

  if (vRelMag > 0.1) {
    const vRelSq = vRelMag * vRelMag;
    tCPA = -vectorDot(r, vRel) / vRelSq;

    if (tCPA < 0) {
      // Closest approach was in the past; vehicles are currently diverging
      tCPA = 0;
      dCPA = distanceMeters;
    } else {
      // Future CPA offset: r_cpa = r + v_rel * tCPA
      const rCPA = vectorAdd(r, vectorScale(vRel, tCPA));
      dCPA = vectorMagnitude(rCPA);
    }
  } else {
    // Relative speed is negligible (stationary or identical velocities)
    tCPA = 0;
    dCPA = distanceMeters;
  }

  // Self and Other positions at CPA
  const p1CPA_offset = vectorScale(v1, Math.max(0, tCPA));
  const p2CPA_offset = vectorAdd(p2, vectorScale(v2, Math.max(0, tCPA)));

  const cpaPointSelf = localCartesianToLatLng(p1CPA_offset, pos1);
  const cpaPointOther = localCartesianToLatLng(p2CPA_offset, pos1);

  // Time To Collision (TTC) Calculation
  let timeToCollisionSec: number | null = null;

  // If vehicles are closing and predicted CPA distance enters the safety envelope
  if (closingSpeedMps > 0.5) {
    if (dCPA <= safetyRadiusMeters * 1.5 && tCPA > 0 && tCPA <= 15) {
      timeToCollisionSec = Number(tCPA.toFixed(1));
    } else if (distanceMeters <= safetyRadiusMeters * 2) {
      // Direct range closing
      const directTTC = distanceMeters / closingSpeedMps;
      if (directTTC > 0 && directTTC <= 15) {
        timeToCollisionSec = Number(directTTC.toFixed(1));
      }
    }
  }

  // Generate Projected Trajectory Polylines for map rendering (1s to 5s into the future)
  const projectionHorizons = [1, 2, 3, 4, 5];
  const projectedPathSelf: Coordinates[] = [pos1];
  const projectedPathOther: Coordinates[] = [pos2];

  for (const t of projectionHorizons) {
    const off1 = vectorScale(v1, t);
    const off2 = vectorAdd(p2, vectorScale(v2, t));
    projectedPathSelf.push(localCartesianToLatLng(off1, pos1));
    projectedPathOther.push(localCartesianToLatLng(off2, pos1));
  }

  return {
    distanceMeters: Number(distanceMeters.toFixed(1)),
    relativePositionVector: r,
    relativeVelocityVector: vRel,
    relativeVelocityKmh: Number(relativeVelocityKmh.toFixed(1)),
    closingSpeedKmh: Number(closingSpeedKmh.toFixed(1)),
    closingSpeedMps: Number(closingSpeedMps.toFixed(2)),
    timeToCPASec: Number(tCPA.toFixed(1)),
    distanceAtCPAMeters: Number(dCPA.toFixed(1)),
    timeToCollisionSec,
    cpaPointSelf,
    cpaPointOther,
    projectedPathSelf,
    projectedPathOther,
  };
}
