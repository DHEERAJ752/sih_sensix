import { DriverType } from '../../types/vehicle';

export interface DynamicSafetyRadiusConfig {
  baseRadiusMeters: number;         // Minimum physical clearance (default: 4m)
  reactionTimeSeconds: number;      // Driver reaction buffer (default: 1.0s)
  brakingDecelerationMps2: number;  // Nominal braking deceleration (default: 5.0 m/s^2)
  gpsUncertaintyWeight: number;     // Weight of GPS accuracy in safety margin (default: 0.8)
  emergencyMultiplier: number;      // Multiplier for emergency vehicles (default: 1.5)
}

export const DEFAULT_SAFETY_CONFIG: DynamicSafetyRadiusConfig = {
  baseRadiusMeters: 4.0,
  reactionTimeSeconds: 1.0,
  brakingDecelerationMps2: 5.0,
  gpsUncertaintyWeight: 0.75,
  emergencyMultiplier: 1.6,
};

/**
 * Computes dynamic safety radius based on vehicle speed, GPS accuracy uncertainty, and vehicle classification.
 * Formula: R_safety = R_base + d_reaction + d_braking_factor + (accuracy * weight)
 */
export function calculateDynamicSafetyRadius(
  speedKmh: number,
  accuracyMeters: number = 3.0,
  driverType: DriverType = 'normal',
  customConfig: Partial<DynamicSafetyRadiusConfig> = {}
): number {
  const config: DynamicSafetyRadiusConfig = { ...DEFAULT_SAFETY_CONFIG, ...customConfig };
  const speedMps = (speedKmh * 1000) / 3600;

  // 1. Reaction distance buffer: d = v * t_reaction
  const reactionBuffer = speedMps * (config.reactionTimeSeconds * 0.4);

  // 2. Braking dynamic buffer: v^2 / (2 * a) scaled for warning envelope
  const brakingBuffer = (speedMps * speedMps) / (2 * config.brakingDecelerationMps2 * 2.5);

  // 3. GPS uncertainty addition
  const clampedAccuracy = Math.min(25, Math.max(1, accuracyMeters));
  const uncertaintyBuffer = clampedAccuracy * config.gpsUncertaintyWeight;

  // Total raw radius
  let radius = config.baseRadiusMeters + reactionBuffer + brakingBuffer + uncertaintyBuffer;

  // Emergency vehicle expansion
  if (driverType === 'emergency') {
    radius *= config.emergencyMultiplier;
  }

  // Clamped between 5m and 60m for sensible visualization & safety buffers
  const finalRadius = Math.max(5.0, Math.min(65.0, radius));
  return Number(finalRadius.toFixed(1));
}

/**
 * Calculates position confidence score and rating from GPS accuracy and data freshness
 */
export function calculatePositionConfidence(
  accuracyMeters: number,
  ageMillis: number
): { confidenceRating: 'High' | 'Medium' | 'Low'; percentage: number } {
  let score = 100;

  // Accuracy penalty
  if (accuracyMeters > 15) {
    score -= 40;
  } else if (accuracyMeters > 8) {
    score -= 20;
  } else if (accuracyMeters > 4) {
    score -= 10;
  }

  // Age / Freshness penalty
  const ageSeconds = ageMillis / 1000;
  if (ageSeconds > 3.0) {
    score -= 50;
  } else if (ageSeconds > 1.5) {
    score -= 25;
  } else if (ageSeconds > 0.8) {
    score -= 10;
  }

  const finalScore = Math.max(10, Math.min(100, Math.round(score)));

  let confidenceRating: 'High' | 'Medium' | 'Low' = 'High';
  if (finalScore < 45) {
    confidenceRating = 'Low';
  } else if (finalScore < 75) {
    confidenceRating = 'Medium';
  }

  return { confidenceRating, percentage: finalScore };
}
