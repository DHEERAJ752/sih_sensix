export type DriverType = 'normal' | 'emergency';

export type RiskLevel = 'SAFE' | 'CAUTION' | 'CRITICAL' | 'CLEARED';

export type GPSDegradationStatus = 'ACTIVE' | 'DEGRADED' | 'UNAVAILABLE';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface VehicleTelemetry {
  id: string;
  name: string;
  driverType: DriverType;
  latitude: number;
  longitude: number;
  speedKmh: number;        // Speed in km/h
  headingDeg: number;       // Heading in degrees (0 = North, 90 = East, 180 = South, 270 = West)
  accuracyMeters: number;   // Estimated GPS accuracy in meters
  timestamp: number;        // Epoch millis
  altitudeMeters?: number;
  isSimulated?: boolean;
  groupId?: string;
}

export interface VehicleState extends VehicleTelemetry {
  isStale: boolean;
  lastSeenAgoSeconds: number;
  currentRiskLevel: RiskLevel;
  activeAlertReason?: string;
  color?: string;
}

export interface Vector2D {
  x: number; // Easting (meters)
  y: number; // Northing (meters)
}

export interface CPAEvaluation {
  timeToCPASec: number;        // seconds to closest point of approach (t_cpa)
  distanceAtCPAMeters: number; // minimum predicted distance at t_cpa (d_cpa)
  cpaPointSelf: Coordinates;   // position of self at t_cpa
  cpaPointOther: Coordinates;  // position of other vehicle at t_cpa
}

export interface CollisionMetrics {
  sourceVehicleId?: string;
  sourceVehicleName?: string;
  targetVehicleId: string;
  targetVehicleName: string;
  targetDriverType: DriverType;
  distanceMeters: number;
  relativeVelocityKmh: number;      // magnitude of vector relative velocity
  closingSpeedKmh: number;          // rate of decrease in distance (closing speed component)
  timeToCollisionSec: number | null; // TTC based on closing speed or CPA
  cpaDistanceMeters: number;        // CPA distance
  timeToCPASec: number;             // Time to CPA
  safetyRadiusMeters: number;       // Dynamic safety zone radius
  positionConfidence: 'High' | 'Medium' | 'Low';
  confidencePercentage: number;
  riskLevel: RiskLevel;
  cpaPointSelf: Coordinates;
  cpaPointTarget: Coordinates;
  projectedPathSelf: Coordinates[];
  projectedPathTarget: Coordinates[];
  explanation: ExplainableAlert;
  isEmergencyAlert: boolean;
  evaluatedAt: number;
}

export interface ExplainableAlert {
  title: string;
  why: string;
  distance: string;
  closingSpeed: string;
  ttc: string;
  cpaDistance: string;
  safetyRadius: string;
  positionConfidence: string;
  recommendedAction: string;
}
