import { RiskLevel, DriverType, Coordinates } from './vehicle';

export interface AlertLogItem {
  id: string;
  timestamp: number;
  vehicleId: string;
  vehicleName: string;
  driverType: DriverType;
  riskLevel: RiskLevel;
  reason: string;
  distanceMeters: number;
  closingSpeedKmh: number;
  ttcSec: number | null;
  cpaDistanceMeters: number;
  safetyRadiusMeters: number;
  positionConfidence: string;
  recommendedAction: string;
  locationSelf: Coordinates;
  locationOther: Coordinates;
}
