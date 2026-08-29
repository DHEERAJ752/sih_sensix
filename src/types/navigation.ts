import { Coordinates } from './vehicle';

export interface ManeuverStep {
  instruction: string;
  distanceMeters: number;
  type: 'straight' | 'turn-left' | 'turn-right' | 'u-turn' | 'arrive';
  location: Coordinates;
}

export interface NavigationRoute {
  destinationName: string;
  destinationCoordinates: Coordinates;
  totalDistanceMeters: number;
  estimatedTimeSeconds: number;
  polyline: Coordinates[];
  steps: ManeuverStep[];
}
