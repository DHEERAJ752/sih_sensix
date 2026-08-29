import { ExplainableAlert, RiskLevel, DriverType } from '../../types/vehicle';

export interface ExplainableParams {
  targetName: string;
  targetDriverType: DriverType;
  riskLevel: RiskLevel;
  distanceMeters: number;
  closingSpeedKmh: number;
  timeToCollisionSec: number | null;
  timeToCPASec: number;
  cpaDistanceMeters: number;
  safetyRadiusMeters: number;
  positionConfidence: 'High' | 'Medium' | 'Low';
  confidencePercentage: number;
}

/**
 * Generates explainable, data-driven plain language diagnostic summaries from live mathematical kinematics
 */
export function generateExplainableAlert(params: ExplainableParams): ExplainableAlert {
  const {
    targetName,
    targetDriverType,
    riskLevel,
    distanceMeters,
    closingSpeedKmh,
    timeToCollisionSec,
    timeToCPASec,
    cpaDistanceMeters,
    safetyRadiusMeters,
    positionConfidence,
  } = params;

  // Emergency Vehicle specific diagnostic
  if (targetDriverType === 'emergency') {
    const etaSec = timeToCollisionSec ?? timeToCPASec ?? (closingSpeedKmh > 0 ? (distanceMeters / (closingSpeedKmh / 3.6)) : 0);
    return {
      title: 'EMERGENCY VEHICLE APPROACHING',
      why: `${targetName} (Priority Vehicle) is approaching at ${closingSpeedKmh > 0 ? closingSpeedKmh.toFixed(0) + ' km/h' : 'high speed'} on an active emergency response corridor.`,
      distance: `${distanceMeters.toFixed(1)} m`,
      closingSpeed: `${closingSpeedKmh > 0 ? closingSpeedKmh.toFixed(1) : '0.0'} km/h`,
      ttc: etaSec > 0 ? `${etaSec.toFixed(1)} s` : 'Imminent',
      cpaDistance: `${cpaDistanceMeters.toFixed(1)} m`,
      safetyRadius: `${safetyRadiusMeters.toFixed(1)} m`,
      positionConfidence: `${positionConfidence}`,
      recommendedAction: 'Yield right-of-way immediately / Move to the shoulder or slow down',
    };
  }

  // Critical Collision Risk
  if (riskLevel === 'CRITICAL') {
    let why = '';
    let action = '';

    if (cpaDistanceMeters < safetyRadiusMeters * 0.5) {
      why = `${targetName} is on a direct collision course; projected CPA (${cpaDistanceMeters.toFixed(1)}m) violates critical safety envelope (${safetyRadiusMeters.toFixed(1)}m).`;
      action = 'EMERGENCY BRAKE / Steer clear to avoid impact';
    } else if (closingSpeedKmh > 40) {
      why = `High closing rate (${closingSpeedKmh.toFixed(1)} km/h) with ${targetName}. Time to collision is under ${timeToCollisionSec ?? 2}s.`;
      action = 'Brake hard and maintain defensive lane position';
    } else {
      why = `${targetName} is approaching rapidly and its projected closest approach is inside the safety radius.`;
      action = 'Slow down / Apply brakes immediately';
    }

    return {
      title: 'COLLISION RISK DETECTED',
      why,
      distance: `${distanceMeters.toFixed(1)} m`,
      closingSpeed: `${closingSpeedKmh.toFixed(1)} km/h`,
      ttc: timeToCollisionSec ? `${timeToCollisionSec.toFixed(1)} s` : (timeToCPASec > 0 ? `${timeToCPASec.toFixed(1)} s` : '< 1.0 s'),
      cpaDistance: `${cpaDistanceMeters.toFixed(1)} m`,
      safetyRadius: `${safetyRadiusMeters.toFixed(1)} m`,
      positionConfidence: `${positionConfidence}`,
      recommendedAction: action,
    };
  }

  // Caution Risk
  if (riskLevel === 'CAUTION') {
    return {
      title: 'PROXIMITY CAUTION',
      why: `${targetName} is converging within the extended safety zone (${safetyRadiusMeters.toFixed(1)}m) with positive closing speed (${closingSpeedKmh.toFixed(1)} km/h).`,
      distance: `${distanceMeters.toFixed(1)} m`,
      closingSpeed: `${closingSpeedKmh.toFixed(1)} km/h`,
      ttc: timeToCollisionSec ? `${timeToCollisionSec.toFixed(1)} s` : (timeToCPASec > 0 ? `${timeToCPASec.toFixed(1)} s` : 'N/A'),
      cpaDistance: `${cpaDistanceMeters.toFixed(1)} m`,
      safetyRadius: `${safetyRadiusMeters.toFixed(1)} m`,
      positionConfidence: `${positionConfidence}`,
      recommendedAction: 'Be prepared to brake / Increase following distance',
    };
  }

  // Safe / Cleared
  return {
    title: 'CLEAR PATH',
    why: `All nearby vehicles maintaining safe separation outside the dynamic safety radius.`,
    distance: `${distanceMeters.toFixed(1)} m`,
    closingSpeed: `${closingSpeedKmh.toFixed(1)} km/h`,
    ttc: 'Safe',
    cpaDistance: `${cpaDistanceMeters.toFixed(1)} m`,
    safetyRadius: `${safetyRadiusMeters.toFixed(1)} m`,
    positionConfidence: `${positionConfidence}`,
    recommendedAction: 'Continue driving normally',
  };
}
