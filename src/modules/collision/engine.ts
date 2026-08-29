import {
  VehicleTelemetry,
  VehicleState,
  CollisionMetrics,
  RiskLevel,
} from '../../types/vehicle';
import { calculateRelativeKinematics } from './relativeMotion';
import { calculateDynamicSafetyRadius, calculatePositionConfidence } from './safetyRadius';
import { generateExplainableAlert } from './explainable';

export interface CollisionEngineOptions {
  cautionTTCThresholdSec?: number;  // default: 5.0s
  criticalTTCThresholdSec?: number; // default: 2.5s
  emergencyAwarenessDistanceMeters?: number; // default: 80m
}

export class CollisionEngine {
  private options: Required<CollisionEngineOptions>;
  private previousRiskLevels: Map<string, RiskLevel> = new Map();

  constructor(options: CollisionEngineOptions = {}) {
    this.options = {
      cautionTTCThresholdSec: options.cautionTTCThresholdSec ?? 5.0,
      criticalTTCThresholdSec: options.criticalTTCThresholdSec ?? 2.5,
      emergencyAwarenessDistanceMeters: options.emergencyAwarenessDistanceMeters ?? 80,
    };
  }

  /**
   * Evaluates collision threat for `self` vehicle against a list of other active vehicles
   */
  public evaluate(self: VehicleTelemetry, others: (VehicleTelemetry | VehicleState)[]): CollisionMetrics[] {
    const now = Date.now();
    const selfAge = now - self.timestamp;
    const selfConfidence = calculatePositionConfidence(self.accuracyMeters, selfAge);

    const metricsList: CollisionMetrics[] = [];

    for (const other of others) {
      // Ignore self
      if (other.id === self.id) continue;

      const otherAge = now - other.timestamp;
      const isStale = otherAge > 4000; // > 4 seconds is stale

      // Combined dynamic safety radius considering both vehicles
      const selfRadius = calculateDynamicSafetyRadius(self.speedKmh, self.accuracyMeters, self.driverType);
      const otherRadius = calculateDynamicSafetyRadius(other.speedKmh, other.accuracyMeters, other.driverType);
      const effectiveSafetyRadius = Math.max(selfRadius, (selfRadius + otherRadius) / 2);

      // Relative kinematics
      const kinematics = calculateRelativeKinematics(
        { latitude: self.latitude, longitude: self.longitude },
        self.speedKmh,
        self.headingDeg,
        { latitude: other.latitude, longitude: other.longitude },
        other.speedKmh,
        other.headingDeg,
        effectiveSafetyRadius
      );

      // Target position confidence
      const otherConfidence = calculatePositionConfidence(other.accuracyMeters, otherAge);
      const combinedConfidenceScore = Math.round((selfConfidence.percentage + otherConfidence.percentage) / 2);
      let combinedConfidenceRating: 'High' | 'Medium' | 'Low' = 'High';
      if (combinedConfidenceScore < 45 || isStale) {
        combinedConfidenceRating = 'Low';
      } else if (combinedConfidenceScore < 75) {
        combinedConfidenceRating = 'Medium';
      }

      // Determine Risk Level
      const isEmergency = other.driverType === 'emergency';
      const riskLevel = this.determineRiskLevel(
        kinematics.distanceMeters,
        kinematics.closingSpeedKmh,
        kinematics.timeToCollisionSec,
        kinematics.timeToCPASec,
        kinematics.distanceAtCPAMeters,
        effectiveSafetyRadius,
        isEmergency
      );

      // Track previous state for transitions
      const prevLevel = this.previousRiskLevels.get(other.id) || 'SAFE';
      let resolvedRiskLevel = riskLevel;
      if (prevLevel !== 'SAFE' && riskLevel === 'SAFE') {
        resolvedRiskLevel = 'CLEARED';
      }
      this.previousRiskLevels.set(other.id, riskLevel);

      // Generate explainable alert
      const explanation = generateExplainableAlert({
        targetName: other.name,
        targetDriverType: other.driverType,
        riskLevel: resolvedRiskLevel,
        distanceMeters: kinematics.distanceMeters,
        closingSpeedKmh: kinematics.closingSpeedKmh,
        timeToCollisionSec: kinematics.timeToCollisionSec,
        timeToCPASec: kinematics.timeToCPASec,
        cpaDistanceMeters: kinematics.distanceAtCPAMeters,
        safetyRadiusMeters: effectiveSafetyRadius,
        positionConfidence: combinedConfidenceRating,
        confidencePercentage: combinedConfidenceScore,
      });

      metricsList.push({
        targetVehicleId: other.id,
        targetVehicleName: other.name,
        targetDriverType: other.driverType,
        distanceMeters: kinematics.distanceMeters,
        relativeVelocityKmh: kinematics.relativeVelocityKmh,
        closingSpeedKmh: kinematics.closingSpeedKmh,
        timeToCollisionSec: kinematics.timeToCollisionSec,
        cpaDistanceMeters: kinematics.distanceAtCPAMeters,
        timeToCPASec: kinematics.timeToCPASec,
        safetyRadiusMeters: effectiveSafetyRadius,
        positionConfidence: combinedConfidenceRating,
        confidencePercentage: combinedConfidenceScore,
        riskLevel: resolvedRiskLevel,
        cpaPointSelf: kinematics.cpaPointSelf,
        cpaPointTarget: kinematics.cpaPointOther,
        projectedPathSelf: kinematics.projectedPathSelf,
        projectedPathTarget: kinematics.projectedPathOther,
        explanation,
        isEmergencyAlert: isEmergency && kinematics.distanceMeters < this.options.emergencyAwarenessDistanceMeters && kinematics.closingSpeedKmh > 0,
        evaluatedAt: now,
      });
    }

    // Sort by threat priority: CRITICAL first, then CAUTION, then closest distance
    return metricsList.sort((a, b) => {
      const rank = (r: RiskLevel) => (r === 'CRITICAL' ? 3 : r === 'CAUTION' ? 2 : r === 'CLEARED' ? 1 : 0);
      const rankDiff = rank(b.riskLevel) - rank(a.riskLevel);
      if (rankDiff !== 0) return rankDiff;
      return a.distanceMeters - b.distanceMeters;
    });
  }

  /**
   * Risk decision matrix combining distance, closing speed, CPA and TTC
   */
  private determineRiskLevel(
    distance: number,
    closingSpeedKmh: number,
    ttc: number | null,
    tCPA: number,
    dCPA: number,
    safetyRadius: number,
    isEmergency: boolean
  ): RiskLevel {
    // Immediate physical safety radius breach
    if (distance <= safetyRadius) {
      return 'CRITICAL';
    }

    // Direct collision trajectory (TTC is low and closing speed is high)
    if (ttc !== null && ttc <= this.options.criticalTTCThresholdSec && closingSpeedKmh > 8) {
      return 'CRITICAL';
    }

    // Predicted CPA is inside the safety radius within imminent horizon
    if (dCPA <= safetyRadius && tCPA > 0 && tCPA <= this.options.criticalTTCThresholdSec && closingSpeedKmh > 10) {
      return 'CRITICAL';
    }

    // Emergency vehicle approaching quickly
    if (isEmergency && distance <= 50 && closingSpeedKmh > 15) {
      return 'CRITICAL';
    }

    // Caution conditions: TTC under caution threshold or CPA encroaching extended safety envelope
    if (ttc !== null && ttc <= this.options.cautionTTCThresholdSec && closingSpeedKmh > 5) {
      return 'CAUTION';
    }

    if (dCPA <= safetyRadius * 1.5 && tCPA > 0 && tCPA <= this.options.cautionTTCThresholdSec && closingSpeedKmh > 5) {
      return 'CAUTION';
    }

    if (distance <= safetyRadius * 2.2 && closingSpeedKmh > 15) {
      return 'CAUTION';
    }

    if (isEmergency && distance <= this.options.emergencyAwarenessDistanceMeters && closingSpeedKmh > 5) {
      return 'CAUTION';
    }

    return 'SAFE';
  }
}
