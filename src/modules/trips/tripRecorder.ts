import { TripRecord, TripPoint, TripStop } from '../../types/trip';
import { Coordinates } from '../../types/vehicle';
import { calculateHaversineDistance } from '../collision/geoMath';
import { computeTripSafetyScore } from './safetyScore';

export interface TripRecorderConfig {
  stopThresholdSeconds: number; // Duration of 0-speed before marking a stop (default: 15s)
}

export class TripRecorder {
  private activeTrip: TripRecord | null = null;
  private config: TripRecorderConfig;
  private currentStopStart: { time: number; location: Coordinates } | null = null;
  private lastRecordedPoint: TripPoint | null = null;
  private cautionWarningsCount: number = 0;
  private criticalWarningsCount: number = 0;
  private onStopDetected?: (stop: TripStop) => void;

  constructor(config: Partial<TripRecorderConfig> = {}) {
    this.config = {
      stopThresholdSeconds: config.stopThresholdSeconds ?? 15,
    };
  }

  public setOnStopDetected(callback: (stop: TripStop) => void): void {
    this.onStopDetected = callback;
  }

  public startTrip(userId: string, userName: string, initialPos: Coordinates): TripRecord {
    const now = Date.now();
    const initialPoint: TripPoint = {
      latitude: initialPos.latitude,
      longitude: initialPos.longitude,
      speedKmh: 0,
      headingDeg: 0,
      timestamp: now,
    };

    this.activeTrip = {
      id: `trip-${now}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName,
      startTime: now,
      durationSeconds: 0,
      totalDistanceMeters: 0,
      averageSpeedKmh: 0,
      maxSpeedKmh: 0,
      stopsCount: 0,
      totalWarningsCount: 0,
      criticalWarningsCount: 0,
      routePoints: [initialPoint],
      stops: [],
      safetyScore: {
        overallScore: 100,
        smoothDrivingScore: 100,
        collisionAvoidanceScore: 100,
        speedComplianceScore: 100,
        grade: 'A+',
        feedback: ['Trip initialized.'],
      },
      status: 'ACTIVE',
    };

    this.lastRecordedPoint = initialPoint;
    this.currentStopStart = null;
    this.cautionWarningsCount = 0;
    this.criticalWarningsCount = 0;

    return this.activeTrip;
  }

  public logPoint(pos: Coordinates, speedKmh: number, headingDeg: number): void {
    if (!this.activeTrip || this.activeTrip.status !== 'ACTIVE') return;

    const now = Date.now();
    const currentPoint: TripPoint = {
      latitude: pos.latitude,
      longitude: pos.longitude,
      speedKmh,
      headingDeg,
      timestamp: now,
    };

    // Update distance
    if (this.lastRecordedPoint) {
      const deltaMeters = calculateHaversineDistance(this.lastRecordedPoint, currentPoint);
      if (deltaMeters > 1.0) {
        this.activeTrip.totalDistanceMeters += deltaMeters;
      }
    }

    this.activeTrip.routePoints.push(currentPoint);
    this.lastRecordedPoint = currentPoint;

    // Update Max Speed & duration
    this.activeTrip.maxSpeedKmh = Math.max(this.activeTrip.maxSpeedKmh, speedKmh);
    this.activeTrip.durationSeconds = Math.round((now - this.activeTrip.startTime) / 1000);

    // Calculate Average Speed (non-zero or moving average)
    if (this.activeTrip.durationSeconds > 0) {
      const hours = this.activeTrip.durationSeconds / 3600;
      this.activeTrip.averageSpeedKmh = Number(((this.activeTrip.totalDistanceMeters / 1000) / hours).toFixed(1));
    }

    // Stop / Break detection
    if (speedKmh < 1.0) {
      if (!this.currentStopStart) {
        this.currentStopStart = { time: now, location: pos };
      } else {
        const stopDurationSec = (now - this.currentStopStart.time) / 1000;
        if (stopDurationSec >= this.config.stopThresholdSeconds) {
          // Check if this stop was already recorded
          const lastStop = this.activeTrip.stops[this.activeTrip.stops.length - 1];
          if (!lastStop || lastStop.endTime) {
            const newStop: TripStop = {
              id: `stop-${now}`,
              location: this.currentStopStart.location,
              startTime: this.currentStopStart.time,
              durationSeconds: Math.round(stopDurationSec),
              reason: 'Stationary break / Traffic stop',
            };
            this.activeTrip.stops.push(newStop);
            this.activeTrip.stopsCount = this.activeTrip.stops.length;
            if (this.onStopDetected) {
              this.onStopDetected(newStop);
            }
          }
        }
      }
    } else {
      if (this.currentStopStart) {
        const lastStop = this.activeTrip.stops[this.activeTrip.stops.length - 1];
        if (lastStop && !lastStop.endTime) {
          lastStop.endTime = now;
          lastStop.durationSeconds = Math.round((now - lastStop.startTime) / 1000);
        }
        this.currentStopStart = null;
      }
    }
  }

  public recordWarning(riskLevel: 'CAUTION' | 'CRITICAL'): void {
    if (!this.activeTrip || this.activeTrip.status !== 'ACTIVE') return;

    if (riskLevel === 'CRITICAL') {
      this.criticalWarningsCount++;
    } else if (riskLevel === 'CAUTION') {
      this.cautionWarningsCount++;
    }

    this.activeTrip.criticalWarningsCount = this.criticalWarningsCount;
    this.activeTrip.totalWarningsCount = this.criticalWarningsCount + this.cautionWarningsCount;
  }

  public pauseTrip(): void {
    if (this.activeTrip) {
      this.activeTrip.status = 'PAUSED';
    }
  }

  public resumeTrip(): void {
    if (this.activeTrip) {
      this.activeTrip.status = 'ACTIVE';
    }
  }

  public endTrip(): TripRecord | null {
    if (!this.activeTrip) return null;

    const now = Date.now();
    this.activeTrip.endTime = now;
    this.activeTrip.durationSeconds = Math.round((now - this.activeTrip.startTime) / 1000);
    this.activeTrip.status = 'COMPLETED';

    // Compute final safety score breakdown
    this.activeTrip.safetyScore = computeTripSafetyScore(
      this.activeTrip.routePoints,
      this.activeTrip.stops,
      this.cautionWarningsCount,
      this.criticalWarningsCount,
      this.activeTrip.maxSpeedKmh,
      this.activeTrip.averageSpeedKmh
    );

    const completed = { ...this.activeTrip };
    this.activeTrip = null;
    return completed;
  }

  public getActiveTrip(): TripRecord | null {
    return this.activeTrip;
  }
}

export const tripRecorder = new TripRecorder();
