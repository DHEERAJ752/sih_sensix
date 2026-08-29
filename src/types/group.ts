import { DriverType, RiskLevel } from './vehicle';

export interface GroupMember {
  id: string;
  name: string;
  driverType: DriverType;
  vehicleType?: string;
  joinedAt: number;
  lastActiveAt: number;
  isOwner?: boolean;
  color: string;
  currentRiskLevel: RiskLevel;
  speedKmh?: number;
}

export interface Group {
  id: string;
  code: string; // e.g. UCOP-7F42
  name: string;
  ownerId: string;
  createdAt: number;
  members: GroupMember[];
}
