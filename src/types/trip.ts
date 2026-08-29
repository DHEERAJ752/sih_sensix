import { Coordinates } from './vehicle';

export interface TripPoint {
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDeg: number;
  timestamp: number;
}

export interface TripStop {
  id: string;
  location: Coordinates;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  reason?: string;
}

export interface SafetyScoreBreakdown {
  overallScore: number; // 0 - 100
  smoothDrivingScore: number; // 0 - 100
  collisionAvoidanceScore: number; // 0 - 100
  speedComplianceScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string[];
}

export interface TripRecord {
  id: string;
  userId: string;
  userName: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  totalDistanceMeters: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  stopsCount: number;
  totalWarningsCount: number;
  criticalWarningsCount: number;
  routePoints: TripPoint[];
  stops: TripStop[];
  safetyScore: SafetyScoreBreakdown;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}
