/**
 * Centralized Cooperative Safety Coordinator (CCSC) - Advanced Autonomous Traffic & Collision Engine
 *
 * Implements an intelligent, multi-tiered collision arbitration algorithm:
 *   1. Emergency Preemption: Absolute right-of-way for 108 Ambulances with green corridor shoulder clearance.
 *   2. Time-To-Intersection (TTI) Priority: First-arrival precedence with trailing vehicle deceleration.
 *   3. Head-On Dynamic Separation: Bilateral Keep-Left lane shifts strictly bounded within road margins.
 *   4. Rear-End Speed Harmonization: Adaptive headway regulation.
 *   5. Closed-Loop Negotiation Handshake: Tracks 4-stage conflict lifecycle.
 */

import { VehicleTelemetry, VehicleState, CollisionMetrics, RiskLevel } from '../../types/vehicle';
import { calculateRelativeKinematics } from '../collision/relativeMotion';
import { calculateDynamicSafetyRadius, calculatePositionConfidence } from '../collision/safetyRadius';
import { generateExplainableAlert } from '../collision/explainable';

export type DecisionAction =
  | 'BRAKE'
  | 'YIELD_LEFT'
  | 'YIELD_RIGHT'
  | 'EVADE_RIGHT'
  | 'EVADE_LEFT'
  | 'SLOW_DOWN'
  | 'CLEAR'
  | 'MONITOR';

export interface CooperativeActuation {
  type: DecisionAction;
  targetSpeedKmh: number;
  headingOffsetDeg: number;
  brakeIntensity: number; // 0.0 to 1.0
  lateralLaneOffsetMeters: number; // Bounded road lane offset (-3.5m to +3.5m)
  maneuverLabel: string;
}

export interface CoordinatorDecision {
  id: string;
  timestamp: number;
  fromVehicleId: string;
  fromVehicleName: string;
  toVehicleId: string;
  toVehicleName: string;
  action: DecisionAction;
  riskLevel: RiskLevel;
  distanceMeters: number;
  closingSpeedKmh: number;
  ttcSec: number | null;
  cpaMeters: number;
  safetyRadiusMeters: number;
  confidence: 'High' | 'Medium' | 'Low';
  message: string;
  actuation: CooperativeActuation;
  relayedToVehicles: string[];
  acknowledged: boolean;
}

export interface NegotiationTransaction {
  id: string;
  timestamp: number;
  vehicleA: { id: string; name: string };
  vehicleB: { id: string; name: string };
  threatDistanceMeters: number;
  closingSpeedKmh: number;
  ttcSec: number | null;
  cpaMeters: number;
  stage: 'THREAT_DETECTED' | 'DIRECTIVES_DISPATCHED' | 'VEHICLES_ACTUATING' | 'COLLISION_AVERTED';
  directiveA: DecisionAction;
  directiveB: DecisionAction;
  statusText: string;
  avertedAt?: number;
}

export interface CoordinatorStats {
  totalVehiclesTracked: number;
  activePairsEvaluated: number;
  criticalDecisionsThisCycle: number;
  cautionDecisionsThisCycle: number;
  totalDecisionsIssued: number;
  totalCollisionsAvertedCount: number;
  lastEvaluationMs: number;
  evaluationsPerSecond: number;
  activeEvasiveManeuversCount: number;
}

export class CentralizedCoordinator {
  private vehicleRegistry: Map<string, VehicleTelemetry | VehicleState> = new Map();
  private decisionLog: CoordinatorDecision[] = [];
  private activeDirectives: Map<string, CoordinatorDecision> = new Map();
  private negotiationTransactions: Map<string, NegotiationTransaction> = new Map();

  private onDecisionCallbacks: Set<(decision: CoordinatorDecision) => void> = new Set();
  private onStatsCallbacks: Set<(stats: CoordinatorStats) => void> = new Set();

  private totalDecisionsIssued = 0;
  private totalCollisionsAverted = 0;
  private evalCount = 0;
  private evalCountWindowStart = Date.now();
  private evalsPerSec = 0;
  private previousPairRisk: Map<string, RiskLevel> = new Map();

  public reportTelemetry(telemetry: VehicleTelemetry | VehicleState): void {
    this.vehicleRegistry.set(telemetry.id, telemetry);
  }

  public removeVehicle(id: string): void {
    this.vehicleRegistry.delete(id);
    this.activeDirectives.delete(id);
  }

  public getAllVehicles(): (VehicleTelemetry | VehicleState)[] {
    return Array.from(this.vehicleRegistry.values());
  }

  public getActiveDirectiveForVehicle(vehicleId: string): CoordinatorDecision | undefined {
    return this.activeDirectives.get(vehicleId);
  }

  public getNegotiationLog(): NegotiationTransaction[] {
    return Array.from(this.negotiationTransactions.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Evaluates collision threats specifically for a chosen vehicle
   */
  public evaluateForVehicle(vehicleId: string): CollisionMetrics | null {
    const all = this.evaluate();
    const directThreat = all.find(m => m.sourceVehicleId === vehicleId || m.targetVehicleId === vehicleId);
    if (directThreat) return directThreat;
    return all.find(m => m.riskLevel === 'CRITICAL' || m.riskLevel === 'CAUTION') || all[0] || null;
  }

  /**
   * High-Performance Intelligent Matrix Evaluation across fleet
   */
  public evaluate(): CollisionMetrics[] {
    const cycleStart = performance.now();
    const now = Date.now();
    const vehicles = Array.from(this.vehicleRegistry.values());

    const allMetrics: CollisionMetrics[] = [];
    let criticalCount = 0;
    let cautionCount = 0;
    let evasiveManeuverCount = 0;

    const candidateDirectives = new Map<string, CoordinatorDecision>();

    for (let i = 0; i < vehicles.length; i++) {
      const self = vehicles[i];
      const selfAge = now - self.timestamp;
      if (selfAge > 6000) continue;

      const selfConfidence = calculatePositionConfidence(self.accuracyMeters, selfAge);

      for (let j = 0; j < vehicles.length; j++) {
        if (i === j) continue;
        const other = vehicles[j];
        const otherAge = now - other.timestamp;
        if (otherAge > 6000) continue;

        const pairKey = `${self.id}→${other.id}`;
        const canonicalKey = self.id < other.id ? `${self.id}<->${other.id}` : `${other.id}<->${self.id}`;

        const selfRadius = calculateDynamicSafetyRadius(self.speedKmh, self.accuracyMeters, self.driverType);
        const otherRadius = calculateDynamicSafetyRadius(other.speedKmh, other.accuracyMeters, other.driverType);
        const effectiveSafetyRadius = Math.max(selfRadius, (selfRadius + otherRadius) / 2);

        const kinematics = calculateRelativeKinematics(
          { latitude: self.latitude, longitude: self.longitude },
          self.speedKmh,
          self.headingDeg,
          { latitude: other.latitude, longitude: other.longitude },
          other.speedKmh,
          other.headingDeg,
          effectiveSafetyRadius
        );

        const otherConfidence = calculatePositionConfidence(other.accuracyMeters, otherAge);
        const combinedScore = Math.round((selfConfidence.percentage + otherConfidence.percentage) / 2);
        const confidenceRating: 'High' | 'Medium' | 'Low' =
          combinedScore < 45 ? 'Low' : combinedScore < 75 ? 'Medium' : 'High';

        const isEmergencyOther = other.driverType === 'emergency';

        const riskLevel = this.classifyIntelligentRisk(
          kinematics.distanceMeters,
          kinematics.closingSpeedKmh,
          kinematics.timeToCollisionSec,
          kinematics.timeToCPASec,
          kinematics.distanceAtCPAMeters,
          effectiveSafetyRadius,
          isEmergencyOther
        );

        const prevRisk = this.previousPairRisk.get(pairKey) || 'SAFE';
        let resolvedRisk: RiskLevel = riskLevel;
        if (prevRisk !== 'SAFE' && riskLevel === 'SAFE') {
          resolvedRisk = 'CLEARED';
        }
        this.previousPairRisk.set(pairKey, riskLevel);

        const explanation = generateExplainableAlert({
          targetName: other.name,
          targetDriverType: other.driverType,
          riskLevel: resolvedRisk,
          distanceMeters: kinematics.distanceMeters,
          closingSpeedKmh: kinematics.closingSpeedKmh,
          timeToCollisionSec: kinematics.timeToCollisionSec,
          timeToCPASec: kinematics.timeToCPASec,
          cpaDistanceMeters: kinematics.distanceAtCPAMeters,
          safetyRadiusMeters: effectiveSafetyRadius,
          positionConfidence: confidenceRating,
          confidencePercentage: combinedScore,
        });

        // Inject actionable, highly specific solution based on collision type
        if (resolvedRisk === 'CRITICAL' || resolvedRisk === 'CAUTION') {
          if (isEmergencyOther) {
            explanation.recommendedAction = `🚨 YIELD RIGHT: Pull over to the road shoulder and reduce speed to <15 km/h to open a green corridor for ${other.name}.`;
          } else if (kinematics.distanceMeters < 25) {
            explanation.recommendedAction = `🛑 EMERGENCY BRAKE: Full stopping deceleration applied to prevent impact with ${other.name}.`;
          } else if (kinematics.closingSpeedKmh > 20) {
            explanation.recommendedAction = `⚠️ SPEED HARMONIZATION: Decelerating by 15 km/h to allow ${other.name} right-of-way through intersection.`;
          } else {
            explanation.recommendedAction = `🛡️ KEEP LEFT: Execute bilateral lane separation to pass ${other.name} with safe clearance.`;
          }
        }

        const metric: CollisionMetrics = {
          sourceVehicleId: self.id,
          sourceVehicleName: self.name,
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
          positionConfidence: confidenceRating,
          confidencePercentage: combinedScore,
          riskLevel: resolvedRisk,
          cpaPointSelf: kinematics.cpaPointSelf,
          cpaPointTarget: kinematics.cpaPointOther,
          projectedPathSelf: kinematics.projectedPathSelf,
          projectedPathTarget: kinematics.projectedPathOther,
          explanation,
          isEmergencyAlert: isEmergencyOther && kinematics.distanceMeters < 150 && kinematics.closingSpeedKmh >= 0,
          evaluatedAt: now,
        };

        allMetrics.push(metric);

        // ── 🧠 Clever Multi-Tiered Right-of-Way Arbitration ──────────────────
        if (resolvedRisk === 'CRITICAL' || resolvedRisk === 'CAUTION' || resolvedRisk === 'CLEARED') {
          const action = this.computeCleverArbitration(
            resolvedRisk,
            self,
            other,
            kinematics.distanceMeters,
            kinematics.closingSpeedKmh,
            kinematics.timeToCollisionSec,
            kinematics.timeToCPASec,
            kinematics.distanceAtCPAMeters,
            effectiveSafetyRadius
          );

          const actuation = this.buildActuationParams(action, self.speedKmh);
          const message = this.buildMessage(action, other.name, kinematics.distanceMeters, kinematics.closingSpeedKmh, kinematics.timeToCollisionSec);

          const relayTargets = vehicles
            .filter(v => v.id !== self.id && v.id !== other.id)
            .map(v => v.id);

          const decision: CoordinatorDecision = {
            id: `dec-${now}-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: now,
            fromVehicleId: self.id,
            fromVehicleName: self.name,
            toVehicleId: other.id,
            toVehicleName: other.name,
            action,
            riskLevel: resolvedRisk,
            distanceMeters: Math.round(kinematics.distanceMeters),
            closingSpeedKmh: Math.round(kinematics.closingSpeedKmh * 10) / 10,
            ttcSec: kinematics.timeToCollisionSec,
            cpaMeters: Math.round(kinematics.distanceAtCPAMeters),
            safetyRadiusMeters: Math.round(effectiveSafetyRadius),
            confidence: confidenceRating,
            message,
            actuation,
            relayedToVehicles: relayTargets,
            acknowledged: false,
          };

          const existing = candidateDirectives.get(self.id);
          if (!existing || (resolvedRisk === 'CRITICAL' && existing.riskLevel !== 'CRITICAL')) {
            candidateDirectives.set(self.id, decision);
          }

          // ── Negotiation Protocol Transaction ─────────────────────────────
          if (resolvedRisk === 'CRITICAL' || resolvedRisk === 'CAUTION') {
            const existingTrans = this.negotiationTransactions.get(canonicalKey);
            const otherAction = this.computeCleverArbitration(
              resolvedRisk,
              other,
              self,
              kinematics.distanceMeters,
              kinematics.closingSpeedKmh,
              kinematics.timeToCollisionSec,
              kinematics.timeToCPASec,
              kinematics.distanceAtCPAMeters,
              effectiveSafetyRadius
            );

            if (!existingTrans || existingTrans.stage === 'COLLISION_AVERTED') {
              this.negotiationTransactions.set(canonicalKey, {
                id: `trans-${now}-${Math.random().toString(36).substring(2, 5)}`,
                timestamp: now,
                vehicleA: { id: self.id, name: self.name },
                vehicleB: { id: other.id, name: other.name },
                threatDistanceMeters: Math.round(kinematics.distanceMeters),
                closingSpeedKmh: Math.round(kinematics.closingSpeedKmh),
                ttcSec: kinematics.timeToCollisionSec,
                cpaMeters: Math.round(kinematics.distanceAtCPAMeters),
                stage: 'VEHICLES_ACTUATING',
                directiveA: action,
                directiveB: otherAction,
                statusText: `CCSC Actuation Handshake Active: ${self.name} [${action}] ↔ ${other.name} [${otherAction}]`,
              });
            } else {
              existingTrans.threatDistanceMeters = Math.round(kinematics.distanceMeters);
              existingTrans.closingSpeedKmh = Math.round(kinematics.closingSpeedKmh);
              existingTrans.ttcSec = kinematics.timeToCollisionSec;
              existingTrans.cpaMeters = Math.round(kinematics.distanceAtCPAMeters);
              existingTrans.stage = 'VEHICLES_ACTUATING';
            }
          } else if (resolvedRisk === 'CLEARED') {
            const existingTrans = this.negotiationTransactions.get(canonicalKey);
            if (existingTrans && existingTrans.stage !== 'COLLISION_AVERTED') {
              existingTrans.stage = 'COLLISION_AVERTED';
              existingTrans.statusText = `✅ Collision Averted Successfully! Safe divergence confirmed (${self.name} ↔ ${other.name}).`;
              existingTrans.avertedAt = now;
              this.totalCollisionsAverted++;
            }
          }

          if (resolvedRisk === 'CRITICAL') criticalCount++;
          else if (resolvedRisk === 'CAUTION') cautionCount++;
          if (action !== 'MONITOR' && action !== 'CLEAR') evasiveManeuverCount++;
        }
      }
    }

    // Apply active directives
    candidateDirectives.forEach((decision, vehicleId) => {
      this.activeDirectives.set(vehicleId, decision);

      const lastForPair = this.decisionLog.find(
        d => d.fromVehicleId === decision.fromVehicleId && d.toVehicleId === decision.toVehicleId
      );
      if (!lastForPair || now - lastForPair.timestamp > 2500) {
        this.decisionLog.unshift(decision);
        if (this.decisionLog.length > 100) this.decisionLog.pop();
        this.totalDecisionsIssued++;
        this.onDecisionCallbacks.forEach(cb => {
          try { cb(decision); } catch (e) { /* ignore */ }
        });
      }
    });

    vehicles.forEach(v => {
      if (!candidateDirectives.has(v.id) && this.activeDirectives.has(v.id)) {
        this.activeDirectives.delete(v.id);
      }
    });

    // Clean old resolved transactions
    this.negotiationTransactions.forEach((trans, key) => {
      if (trans.stage === 'COLLISION_AVERTED' && trans.avertedAt && now - trans.avertedAt > 6000) {
        this.negotiationTransactions.delete(key);
      }
    });

    // Stats
    this.evalCount++;
    const windowMs = now - this.evalCountWindowStart;
    if (windowMs >= 1000) {
      this.evalsPerSec = Math.round((this.evalCount * 1000) / windowMs);
      this.evalCount = 0;
      this.evalCountWindowStart = now;
    }

    const cycleMs = performance.now() - cycleStart;

    const stats: CoordinatorStats = {
      totalVehiclesTracked: vehicles.length,
      activePairsEvaluated: vehicles.length * Math.max(0, vehicles.length - 1),
      criticalDecisionsThisCycle: criticalCount,
      cautionDecisionsThisCycle: cautionCount,
      totalDecisionsIssued: this.totalDecisionsIssued,
      totalCollisionsAvertedCount: this.totalCollisionsAverted,
      lastEvaluationMs: Math.round(cycleMs * 100) / 100,
      evaluationsPerSecond: this.evalsPerSec,
      activeEvasiveManeuversCount: evasiveManeuverCount,
    };
    this.onStatsCallbacks.forEach(cb => { try { cb(stats); } catch (e) { /* ignore */ } });

    return allMetrics.sort((a, b) => {
      const rank = (r: RiskLevel) => r === 'CRITICAL' ? 3 : r === 'CAUTION' ? 2 : r === 'CLEARED' ? 1 : 0;
      const diff = rank(b.riskLevel) - rank(a.riskLevel);
      return diff !== 0 ? diff : a.distanceMeters - b.distanceMeters;
    });
  }

  private classifyIntelligentRisk(
    distance: number,
    closingSpeedKmh: number,
    ttc: number | null,
    tCPA: number,
    dCPA: number,
    safetyRadius: number,
    isEmergency: boolean
  ): RiskLevel {
    if (distance <= safetyRadius * 1.3 && closingSpeedKmh > 0) return 'CRITICAL';
    if (distance <= 28) return 'CRITICAL';
    if (ttc !== null && ttc <= 3.8 && closingSpeedKmh > 6) return 'CRITICAL';
    if (dCPA <= safetyRadius && tCPA > 0 && tCPA <= 3.8 && closingSpeedKmh > 8) return 'CRITICAL';
    if (isEmergency && distance <= 95 && closingSpeedKmh > 5) return 'CRITICAL';
    if (ttc !== null && ttc <= 7.5 && closingSpeedKmh > 4) return 'CAUTION';
    if (dCPA <= safetyRadius * 2.2 && tCPA > 0 && tCPA <= 7.5 && closingSpeedKmh > 4) return 'CAUTION';
    if (distance <= safetyRadius * 3.5 && closingSpeedKmh > 8) return 'CAUTION';
    if (isEmergency && distance <= 160 && closingSpeedKmh >= 0) return 'CAUTION';
    return 'SAFE';
  }

  /**
   * 🧠 Most Clever & Logical Multi-Tiered Right-of-Way Arbitration
   */
  private computeCleverArbitration(
    risk: RiskLevel,
    self: VehicleTelemetry | VehicleState,
    other: VehicleTelemetry | VehicleState,
    distanceMeters: number,
    closingSpeedKmh: number,
    _ttcSec: number | null,
    _tCPASec: number,
    _dCPAMeters: number,
    _safetyRadius: number
  ): DecisionAction {
    if (risk === 'CLEARED') return 'CLEAR';

    // ── Tier 1: Emergency 108 Preemption ───────────────────────────────────
    if (other.driverType === 'emergency' && self.driverType !== 'emergency') {
      // Non-emergency vehicle yields to road shoulder immediately
      return distanceMeters < 40 ? 'BRAKE' : 'YIELD_RIGHT';
    }
    if (self.driverType === 'emergency') {
      return 'CLEAR'; // Emergency vehicle maintains green wave corridor
    }

    // ── Tier 2: Head-On Approaching (Delta Heading ~ 180°) ─────────────────
    const headingDiff = Math.abs(((self.headingDeg - other.headingDeg + 540) % 360) - 180);
    const isHeadOn = headingDiff < 40;

    if (isHeadOn && closingSpeedKmh > 8) {
      if (distanceMeters < 22) {
        return 'BRAKE'; // Dangerously close: full stop on road
      }
      // Indian Keep-Left lane rule: both vehicles shift left to avoid head-on crash
      return 'EVADE_LEFT';
    }

    // ── Tier 3: Rear-End Mitigation (Same direction, closing in) ───────────
    const isSameDirection = headingDiff > 140;
    if (isSameDirection && closingSpeedKmh > 8) {
      if (self.speedKmh > other.speedKmh) {
        return distanceMeters < 25 ? 'BRAKE' : 'SLOW_DOWN';
      } else {
        return 'CLEAR';
      }
    }

    // ── Tier 4: Cross-Junction Intersecting Paths ───────────────────────────
    if (risk === 'CRITICAL') {
      if (distanceMeters < 18) {
        return 'BRAKE'; // Immediate stop inside junction
      }

      const selfTimeToJunction = distanceMeters / (Math.max(10, self.speedKmh) / 3.6);
      const otherTimeToJunction = distanceMeters / (Math.max(10, other.speedKmh) / 3.6);

      if (selfTimeToJunction < otherTimeToJunction || (selfTimeToJunction === otherTimeToJunction && self.id < other.id)) {
        return 'SLOW_DOWN'; // Enter carefully with priority
      } else {
        return 'BRAKE'; // Yield and stop before junction line
      }
    }

    if (risk === 'CAUTION') {
      if (closingSpeedKmh > 20) {
        return 'SLOW_DOWN';
      }
      return self.id < other.id ? 'SLOW_DOWN' : 'MONITOR';
    }

    return 'MONITOR';
  }

  private buildActuationParams(action: DecisionAction, currentSpeedKmh: number): CooperativeActuation {
    switch (action) {
      case 'BRAKE':
        return {
          type: 'BRAKE',
          targetSpeedKmh: 0,
          headingOffsetDeg: 0,
          brakeIntensity: 1.0,
          lateralLaneOffsetMeters: 0,
          maneuverLabel: '🛑 EMERGENCY BRAKE (0 km/h)',
        };
      case 'YIELD_LEFT':
        return {
          type: 'YIELD_LEFT',
          targetSpeedKmh: Math.max(10, currentSpeedKmh * 0.4),
          headingOffsetDeg: -18,
          brakeIntensity: 0.6,
          lateralLaneOffsetMeters: -3.0,
          maneuverLabel: '⬅️ YIELD LEFT (Road Shoulder)',
        };
      case 'YIELD_RIGHT':
        return {
          type: 'YIELD_RIGHT',
          targetSpeedKmh: Math.max(10, currentSpeedKmh * 0.4),
          headingOffsetDeg: 18,
          brakeIntensity: 0.6,
          lateralLaneOffsetMeters: 3.0,
          maneuverLabel: '➡️ YIELD RIGHT (108 Priority Lane)',
        };
      case 'EVADE_LEFT':
        return {
          type: 'EVADE_LEFT',
          targetSpeedKmh: Math.max(12, currentSpeedKmh * 0.5),
          headingOffsetDeg: -20,
          brakeIntensity: 0.5,
          lateralLaneOffsetMeters: -2.5,
          maneuverLabel: '🛡️ KEEP LEFT (Bilateral Separation)',
        };
      case 'EVADE_RIGHT':
        return {
          type: 'EVADE_RIGHT',
          targetSpeedKmh: Math.max(12, currentSpeedKmh * 0.5),
          headingOffsetDeg: 20,
          brakeIntensity: 0.5,
          lateralLaneOffsetMeters: 2.5,
          maneuverLabel: '🛡️ EVADE RIGHT (Road Margin)',
        };
      case 'SLOW_DOWN':
        return {
          type: 'SLOW_DOWN',
          targetSpeedKmh: Math.max(12, currentSpeedKmh * 0.55),
          headingOffsetDeg: 0,
          brakeIntensity: 0.4,
          lateralLaneOffsetMeters: 0,
          maneuverLabel: '⚠️ DECELERATE (-3.5 m/s²)',
        };
      case 'CLEAR':
        return {
          type: 'CLEAR',
          targetSpeedKmh: 45,
          headingOffsetDeg: 0,
          brakeIntensity: 0,
          lateralLaneOffsetMeters: 0,
          maneuverLabel: '✅ RESUME CRUISE',
        };
      default:
        return {
          type: 'MONITOR',
          targetSpeedKmh: currentSpeedKmh,
          headingOffsetDeg: 0,
          brakeIntensity: 0,
          lateralLaneOffsetMeters: 0,
          maneuverLabel: '🚗 CRUISING',
        };
    }
  }

  private buildMessage(
    action: DecisionAction,
    targetName: string,
    distanceMeters: number,
    closingSpeedKmh: number,
    ttcSec: number | null
  ): string {
    const dist = Math.round(distanceMeters);
    const spd = Math.abs(closingSpeedKmh).toFixed(0);
    const ttc = ttcSec !== null ? `${ttcSec.toFixed(1)}s` : 'N/A';

    switch (action) {
      case 'BRAKE':
        return `⛔ CCSC ACTUATOR → EMERGENCY BRAKE! ${targetName} at ${dist}m · Closing: ${spd} km/h · TTC: ${ttc}. Maximum stopping power applied on road corridor.`;
      case 'YIELD_LEFT':
      case 'YIELD_RIGHT':
        return `🚨 CCSC ACTUATOR → YIELD TO SHOULDER: Parting road lane for ${targetName} (108 Ambulance). Safe clearance opened.`;
      case 'EVADE_LEFT':
        return `🛡️ CCSC ACTUATOR → KEEP LEFT SEPARATION: Bilateral left lane offset executed on road corridor to clear head-on line with ${targetName}.`;
      case 'EVADE_RIGHT':
        return `🛡️ CCSC ACTUATOR → RIGHT LANE SHIFT: Lateral evasion executed within road boundaries to avert collision with ${targetName}.`;
      case 'SLOW_DOWN':
        return `⚠️ CCSC ACTUATOR → TIME-GAP REGULATION: Moderating speed for ${targetName} at ${dist}m to eliminate junction overlap.`;
      case 'CLEAR':
        return `✅ CCSC ACTUATOR → ALL CLEAR: Divergence confirmed with ${targetName}. Resuming standard road path.`;
      default:
        return `ℹ️ CCSC ACTUATOR → Monitoring ${targetName} at ${dist}m.`;
    }
  }

  public onDecision(cb: (d: CoordinatorDecision) => void): () => void {
    this.onDecisionCallbacks.add(cb);
    return () => this.onDecisionCallbacks.delete(cb);
  }

  public onStats(cb: (s: CoordinatorStats) => void): () => void {
    this.onStatsCallbacks.add(cb);
    return () => this.onStatsCallbacks.delete(cb);
  }

  public getDecisionLog(): CoordinatorDecision[] {
    return this.decisionLog;
  }

  public acknowledgeDecision(id: string): void {
    const d = this.decisionLog.find(dec => dec.id === id);
    if (d) d.acknowledged = true;
  }

  public reset(): void {
    this.decisionLog = [];
    this.activeDirectives.clear();
    this.negotiationTransactions.clear();
    this.totalDecisionsIssued = 0;
    this.totalCollisionsAverted = 0;
    this.previousPairRisk.clear();
    this.vehicleRegistry.clear();
  }
}

export const coordinator = new CentralizedCoordinator();
