import { Coordinates } from '../../types/vehicle';
import { NavigationRoute, ManeuverStep } from '../../types/navigation';
import { calculateHaversineDistance, calculateBearing } from '../collision/geoMath';

export class NavigationService {
  /**
   * Generates a realistic navigation route polyline and turn-by-turn guidance
   */
  public calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    destinationName: string
  ): NavigationRoute {
    const totalDistanceMeters = calculateHaversineDistance(origin, destination);
    const avgSpeedKmh = 38; // standard urban corridor speed
    const estimatedTimeSeconds = Math.round((totalDistanceMeters / 1000 / avgSpeedKmh) * 3600);

    // Generate intermediate waypoints simulating street grid
    const polyline: Coordinates[] = [origin];
    const steps: ManeuverStep[] = [];

    const numSegments = Math.max(3, Math.min(8, Math.round(totalDistanceMeters / 400)));
    const bearing = calculateBearing(origin, destination);

    steps.push({
      instruction: `Head ${this.bearingToDirection(bearing)} toward ${destinationName}`,
      distanceMeters: Math.round(totalDistanceMeters / numSegments),
      type: 'straight',
      location: origin,
    });

    for (let i = 1; i < numSegments; i++) {
      const frac = i / numSegments;
      // Introduce slight road curves
      const lateralJitter = (Math.sin(frac * Math.PI * 2) * 0.0008);
      const intermediateLat = origin.latitude + (destination.latitude - origin.latitude) * frac + lateralJitter;
      const intermediateLng = origin.longitude + (destination.longitude - origin.longitude) * frac + (lateralJitter * 0.5);

      const pt: Coordinates = { latitude: intermediateLat, longitude: intermediateLng };
      polyline.push(pt);

      if (i === 1) {
        steps.push({
          instruction: 'Turn slight right onto Express Corridor',
          distanceMeters: Math.round(totalDistanceMeters * 0.4),
          type: 'turn-right',
          location: pt,
        });
      } else if (i === Math.floor(numSegments / 2)) {
        steps.push({
          instruction: 'Continue straight through the intersection',
          distanceMeters: Math.round(totalDistanceMeters * 0.3),
          type: 'straight',
          location: pt,
        });
      }
    }

    polyline.push(destination);
    steps.push({
      instruction: `Arrive at destination: ${destinationName}`,
      distanceMeters: 0,
      type: 'arrive',
      location: destination,
    });

    return {
      destinationName,
      destinationCoordinates: destination,
      totalDistanceMeters: Math.round(totalDistanceMeters),
      estimatedTimeSeconds,
      polyline,
      steps,
    };
  }

  private bearingToDirection(deg: number): string {
    if (deg >= 337.5 || deg < 22.5) return 'North';
    if (deg >= 22.5 && deg < 67.5) return 'North-East';
    if (deg >= 67.5 && deg < 112.5) return 'East';
    if (deg >= 112.5 && deg < 157.5) return 'South-East';
    if (deg >= 157.5 && deg < 202.5) return 'South';
    if (deg >= 202.5 && deg < 247.5) return 'South-West';
    if (deg >= 247.5 && deg < 292.5) return 'West';
    return 'North-West';
  }
}

export const navigationService = new NavigationService();
