import { Coordinates, Vector2D } from '../../types/vehicle';

export const EARTH_RADIUS_METERS = 6371000; // Earth mean radius in meters

/**
 * Calculates Great-Circle distance between two coordinates using Haversine formula
 */
export function calculateHaversineDistance(p1: Coordinates, p2: Coordinates): number {
  const lat1Rad = (p1.latitude * Math.PI) / 180;
  const lat2Rad = (p2.latitude * Math.PI) / 180;
  const deltaLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const deltaLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates initial bearing from p1 to p2 in degrees [0, 360)
 * 0° = North, 90° = East, 180° = South, 270° = West
 */
export function calculateBearing(p1: Coordinates, p2: Coordinates): number {
  const lat1Rad = (p1.latitude * Math.PI) / 180;
  const lat2Rad = (p2.latitude * Math.PI) / 180;
  const deltaLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLng);

  const bearingRad = Math.atan2(y, x);
  const bearingDeg = (bearingRad * 180) / Math.PI;
  return (bearingDeg + 360) % 360;
}

/**
 * Projects a new coordinate given a starting coordinate, bearing (degrees), and distance (meters)
 */
export function destinationPoint(start: Coordinates, distanceMeters: number, bearingDeg: number): Coordinates {
  const distRatio = distanceMeters / EARTH_RADIUS_METERS;
  const bearingRad = (bearingDeg * Math.PI) / 180;
  const lat1Rad = (start.latitude * Math.PI) / 180;
  const lng1Rad = (start.longitude * Math.PI) / 180;

  const lat2Rad = Math.asin(
    Math.sin(lat1Rad) * Math.cos(distRatio) +
    Math.cos(lat1Rad) * Math.sin(distRatio) * Math.cos(bearingRad)
  );

  const lng2Rad =
    lng1Rad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(distRatio) * Math.cos(lat1Rad),
      Math.cos(distRatio) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
    );

  return {
    latitude: (lat2Rad * 180) / Math.PI,
    longitude: (lng2Rad * 180) / Math.PI,
  };
}

/**
 * Converts a geographic coordinate to a local 2D Cartesian plane (in meters) relative to an origin point.
 * x: Easting (positive = East)
 * y: Northing (positive = North)
 */
export function latLngToLocalCartesian(target: Coordinates, origin: Coordinates): Vector2D {
  const originLatRad = (origin.latitude * Math.PI) / 180;
  const dLat = ((target.latitude - origin.latitude) * Math.PI) / 180;
  const dLng = ((target.longitude - origin.longitude) * Math.PI) / 180;

  const y = dLat * EARTH_RADIUS_METERS;
  const x = dLng * EARTH_RADIUS_METERS * Math.cos(originLatRad);

  return { x, y };
}

/**
 * Converts a local Cartesian offset (in meters) back to geographic coordinates relative to origin.
 */
export function localCartesianToLatLng(offset: Vector2D, origin: Coordinates): Coordinates {
  const originLatRad = (origin.latitude * Math.PI) / 180;
  const dLat = offset.y / EARTH_RADIUS_METERS;
  const dLng = offset.x / (EARTH_RADIUS_METERS * Math.cos(originLatRad));

  return {
    latitude: origin.latitude + (dLat * 180) / Math.PI,
    longitude: origin.longitude + (dLng * 180) / Math.PI,
  };
}

/**
 * Converts speed (km/h) and heading (degrees) into a 2D velocity vector (m/s)
 * x = East velocity, y = North velocity
 */
export function velocityVectorFromHeading(speedKmh: number, headingDeg: number): Vector2D {
  const speedMps = (speedKmh * 1000) / 3600;
  const headingRad = (headingDeg * Math.PI) / 180;

  // Heading: 0° is North (+y), 90° is East (+x)
  const vx = speedMps * Math.sin(headingRad);
  const vy = speedMps * Math.cos(headingRad);

  return { x: vx, y: vy };
}

/**
 * Vector magnitude / Euclidean norm
 */
export function vectorMagnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Dot product of two 2D vectors
 */
export function vectorDot(v1: Vector2D, v2: Vector2D): number {
  return v1.x * v2.x + v1.y * v2.y;
}

/**
 * Subtract vectors: v1 - v2
 */
export function vectorSubtract(v1: Vector2D, v2: Vector2D): Vector2D {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

/**
 * Add vectors: v1 + v2
 */
export function vectorAdd(v1: Vector2D, v2: Vector2D): Vector2D {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

/**
 * Scale vector: v * s
 */
export function vectorScale(v: Vector2D, s: number): Vector2D {
  return { x: v.x * s, y: v.y * s };
}
