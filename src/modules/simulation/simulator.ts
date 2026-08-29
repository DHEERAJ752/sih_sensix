import { Coordinates, DriverType, VehicleTelemetry } from '../../types/vehicle';
import { destinationPoint } from '../collision/geoMath';
import { RoadSegment, getRoadHeading } from './vizagRoads';
import { CityRoadSegment, getCityRoadPoint, cityToGeo, geoToCity, findClosestCityRoad, CITY_ROADS } from './customCity';
import { CoordinatorDecision } from './coordinator';

export interface SimVehicleConfig {
  id: string;
  name: string;
  driverType: DriverType;
  color: string;
  initialPos: Coordinates;
  initialSpeedKmh: number;
  initialHeadingDeg: number;
  maxSpeedKmh?: number;
  accelerationMps2?: number;
  decelerationMps2?: number;
  turnRateDegPerSec?: number;
  isAI?: boolean;
  road?: RoadSegment;
  cityRoad?: CityRoadSegment;
  roadProgress?: number;
  roadDirection?: 1 | -1;
  junctionId?: string;
}

export interface ControlInput {
  throttle: number; // 0 to 1
  brake: number;    // 0 to 1
  steer: number;    // -1 (full left) to +1 (full right)
  handbrake: boolean;
}

export class SimulatedVehicleInstance {
  public id: string;
  public name: string;
  public driverType: DriverType;
  public color: string;
  public latitude: number;
  public longitude: number;
  public speedKmh: number;
  public headingDeg: number;
  public accuracyMeters: number = 3.0;
  public isDegraded: boolean = false;
  public isNetworkLost: boolean = false;
  public lastUpdate: number = Date.now();
  public isAI: boolean = false;

  // Active Cooperative Maneuver State
  public activeManeuverLabel: string = '🚗 CRUISING';
  public currentDirective: CoordinatorDecision | null = null;
  private evasiveHeadingOffsetDeg: number = 0;
  public baseSpeedKmh: number;

  // Road Navigation for AI
  public road?: RoadSegment;
  public cityRoad?: CityRoadSegment;
  public roadProgress: number = 0;
  public roadDirection: 1 | -1 = 1;

  // Target state
  public targetSpeedKmh: number;
  private targetHeadingDeg: number;

  private maxSpeedKmh: number;
  private accelerationMps2: number;
  private decelerationMps2: number;
  private turnRateDegPerSec: number;

  constructor(config: SimVehicleConfig) {
    this.id = config.id;
    this.name = config.name;
    this.driverType = config.driverType;
    this.color = config.color;
    this.latitude = config.initialPos.latitude;
    this.longitude = config.initialPos.longitude;
    this.speedKmh = config.initialSpeedKmh;
    this.baseSpeedKmh = config.initialSpeedKmh;
    this.headingDeg = config.initialHeadingDeg;
    this.targetSpeedKmh = config.initialSpeedKmh;
    this.targetHeadingDeg = config.initialHeadingDeg;
    this.isAI = config.isAI ?? false;
    this.road = config.road;
    this.cityRoad = config.cityRoad;
    this.roadProgress = config.roadProgress ?? 0;
    this.roadDirection = config.roadDirection ?? 1;

    // Ensure vehicle has an initial valid city road
    if (!this.cityRoad && !this.road) {
      const p = geoToCity(this.latitude, this.longitude);
      const match = findClosestCityRoad(p.x, p.y, this.headingDeg);
      this.cityRoad = match.road;
      this.roadProgress = match.progress;
    }

    this.maxSpeedKmh = config.maxSpeedKmh ?? (config.driverType === 'emergency' ? 95 : 85);
    this.accelerationMps2 = config.accelerationMps2 ?? (config.driverType === 'emergency' ? 7.0 : 5.0);
    this.decelerationMps2 = config.decelerationMps2 ?? 9.0;
    this.turnRateDegPerSec = config.turnRateDegPerSec ?? 60;
  }

  /**
   * Receives and executes cooperative actuation commands from Centralized Coordinator
   */
  public executeCooperativeDirective(directive: CoordinatorDecision | null): void {
    this.currentDirective = directive;

    if (!directive || directive.action === 'MONITOR' || directive.action === 'CLEAR') {
      this.activeManeuverLabel = this.speedKmh < 1 ? '🛑 STOPPED' : '🚗 CRUISING';
      this.evasiveHeadingOffsetDeg = 0;
      this.targetSpeedKmh = this.baseSpeedKmh;
      return;
    }

    const { actuation } = directive;
    this.activeManeuverLabel = actuation.maneuverLabel;

    // 1. Actuate target speed (Immediate braking if commanded)
    this.targetSpeedKmh = actuation.targetSpeedKmh;

    // 2. Actuate lateral evasive steering (strictly bounded to stay on paved road)
    this.evasiveHeadingOffsetDeg = actuation.headingOffsetDeg;

    // 3. If emergency brake, immediately apply strong stopping power
    if (actuation.type === 'BRAKE') {
      this.speedKmh = Math.max(0, this.speedKmh - 8.5);
    }
  }

  /**
   * Real-time User Direction Override: Snaps to the closest paved road in that direction
   * (Vehicles remain 100% confined to roads)
   */
  public overrideHeading(headingDeg: number): void {
    const p = geoToCity(this.latitude, this.longitude);
    const match = findClosestCityRoad(p.x, p.y, headingDeg);

    this.cityRoad = match.road;
    this.roadProgress = match.progress;
    this.headingDeg = match.headingDeg;
    this.targetHeadingDeg = match.headingDeg;
    this.evasiveHeadingOffsetDeg = 0;

    const geo = cityToGeo(match.point.x, match.point.y);
    this.latitude = geo.latitude;
    this.longitude = geo.longitude;
    this.lastUpdate = Date.now();
  }

  /**
   * Relative heading turn (e.g. +45°, -45°, 180° U-turn)
   */
  public turnRelative(deltaDeg: number): void {
    this.overrideHeading(this.headingDeg + deltaDeg);
  }

  /**
   * Aims this vehicle directly at target coordinates (creates direct intercept vector on road)
   */
  public aimAt(targetLat: number, targetLng: number): void {
    const dLat = targetLat - this.latitude;
    const dLng = targetLng - this.longitude;
    const rad = Math.atan2(dLng, dLat);
    const heading = ((rad * 180) / Math.PI + 360) % 360;
    this.overrideHeading(Math.round(heading));
  }

  /**
   * Real-time User Speed Override: Immediately sets speed and locks cruising speed
   */
  public setSpeedOverride(speedKmh: number): void {
    const clamped = Math.max(0, Math.min(this.maxSpeedKmh, speedKmh));
    this.speedKmh = clamped;
    this.targetSpeedKmh = clamped;
    this.baseSpeedKmh = clamped;
    this.activeManeuverLabel = clamped === 0 ? '🛑 EMERGENCY BRAKE' : '🚗 CRUISING';
    this.lastUpdate = Date.now();
  }

  public update(dtSec: number, controls?: ControlInput): void {
    if (controls) {
      // ── Player-controlled vehicle ────────────────────────────────────────
      if (controls.throttle > 0) {
        const deltaSpeed = (this.accelerationMps2 * controls.throttle * dtSec * 3600) / 1000;
        this.speedKmh = Math.min(this.maxSpeedKmh, this.speedKmh + deltaSpeed);
        this.baseSpeedKmh = this.speedKmh;
        this.targetSpeedKmh = this.speedKmh;
      }

      if (controls.brake > 0) {
        const deltaBrake = (this.decelerationMps2 * controls.brake * dtSec * 3600) / 1000;
        this.speedKmh = Math.max(0, this.speedKmh - deltaBrake);
        this.baseSpeedKmh = this.speedKmh;
        this.targetSpeedKmh = this.speedKmh;
      }

      if (controls.handbrake) {
        this.speedKmh = 0;
        this.baseSpeedKmh = 0;
        this.targetSpeedKmh = 0;
        this.activeManeuverLabel = '🛑 EMERGENCY STOP';
      }

      // If idle (no throttle/brake pressed), maintain user-set cruising speed
      if (controls.throttle === 0 && controls.brake === 0 && !controls.handbrake) {
        const speedDiff = this.targetSpeedKmh - this.speedKmh;
        if (Math.abs(speedDiff) > 0.1) {
          const rate = speedDiff > 0 ? this.accelerationMps2 : this.decelerationMps2;
          const deltaKmh = (rate * dtSec * 3600) / 1000;
          this.speedKmh = Math.max(0, Math.min(this.maxSpeedKmh,
            this.speedKmh + Math.sign(speedDiff) * Math.min(Math.abs(deltaKmh), Math.abs(speedDiff))
          ));
        }
      }

      if (controls.steer !== 0 && this.speedKmh > 0.5) {
        const speedFactor = Math.min(1.2, Math.max(0.4, this.speedKmh / 35));
        const turn = controls.steer * this.turnRateDegPerSec * speedFactor * dtSec;
        this.overrideHeading(this.headingDeg + turn);
      }

    } else {
      // ── Autonomous AI Fleet Vehicle ──────────────────────────────────────
      const speedDiff = this.targetSpeedKmh - this.speedKmh;
      if (Math.abs(speedDiff) > 0.1) {
        const accelRate = speedDiff > 0 ? this.accelerationMps2 : this.decelerationMps2 * 1.8;
        const deltaKmh = (accelRate * dtSec * 3600) / 1000;
        this.speedKmh = Math.max(0, Math.min(this.maxSpeedKmh,
          this.speedKmh + Math.sign(speedDiff) * Math.min(Math.abs(deltaKmh), Math.abs(speedDiff))
        ));
      }

      let nominalHeading = this.targetHeadingDeg;
      if (this.cityRoad) {
        const rp = getCityRoadPoint(this.cityRoad, this.roadProgress);
        nominalHeading = rp.headingDeg;
      } else if (this.road) {
        const roadHeading = getRoadHeading(this.road, this.roadProgress);
        nominalHeading = this.roadDirection === 1 ? roadHeading : (roadHeading + 180) % 360;
      }

      // Lateral evasive offset combined with nominal heading (strictly bounded)
      const effectiveTargetHeading = (nominalHeading + this.evasiveHeadingOffsetDeg + 360) % 360;

      const headingDiff = ((effectiveTargetHeading - this.headingDeg + 540) % 360) - 180;
      if (Math.abs(headingDiff) > 0.2) {
        const maxTurn = this.turnRateDegPerSec * 1.5 * dtSec;
        const turn = Math.sign(headingDiff) * Math.min(Math.abs(headingDiff), maxTurn);
        this.headingDeg = (this.headingDeg + turn + 360) % 360;
      }
    }

    // ── Kinematic position integration & Continuous Road Confinement ────────
    if (this.speedKmh > 0.05) {
      const distanceMeters = ((this.speedKmh * 1000) / 3600) * dtSec;

      if (!this.cityRoad && !this.road) {
        const p = geoToCity(this.latitude, this.longitude);
        const match = findClosestCityRoad(p.x, p.y, this.headingDeg);
        this.cityRoad = match.road;
        this.roadProgress = match.progress;
      }

      if (this.cityRoad) {
        // Continuous Spline Progress on Custom Metropolis Network (100% on asphalt)
        const approxRoadLengthMeters = 2400;
        const progressDelta = (distanceMeters / approxRoadLengthMeters) * this.roadDirection;
        this.roadProgress += progressDelta;

        if (this.roadProgress >= 1.0) {
          // Advance to connected next road segment or reverse smoothly
          if (this.cityRoad.nextSegmentIds && this.cityRoad.nextSegmentIds.length > 0) {
            const nextId = this.cityRoad.nextSegmentIds[Math.floor(Math.random() * this.cityRoad.nextSegmentIds.length)];
            const nextRoad = CITY_ROADS.find(r => r.id === nextId);
            if (nextRoad) {
              this.cityRoad = nextRoad;
              this.roadProgress = 0.02;
            } else {
              this.roadProgress = 0.98;
              this.roadDirection = -1;
            }
          } else {
            this.roadProgress = 0.98;
            this.roadDirection = -1;
          }
        } else if (this.roadProgress <= 0.0) {
          this.roadProgress = 0.02;
          this.roadDirection = 1;
        }

        const pointInfo = getCityRoadPoint(this.cityRoad, this.roadProgress);
        const geo = cityToGeo(pointInfo.pos.x, pointInfo.pos.y);
        this.latitude = geo.latitude;
        this.longitude = geo.longitude;
        this.headingDeg = (pointInfo.headingDeg + this.evasiveHeadingOffsetDeg + 360) % 360;

      } else if (this.road) {
        const approxRoadLengthMeters = 2200;
        const progressDelta = (distanceMeters / approxRoadLengthMeters) * this.roadDirection;
        this.roadProgress += progressDelta;

        if (this.roadProgress >= 1.0) {
          this.roadProgress = 1.0;
          this.roadDirection = -1;
          this.headingDeg = (this.headingDeg + 180) % 360;
        } else if (this.roadProgress <= 0.0) {
          this.roadProgress = 0.0;
          this.roadDirection = 1;
          this.headingDeg = (this.headingDeg + 180) % 360;
        }

        const nextPos = destinationPoint(
          { latitude: this.latitude, longitude: this.longitude },
          distanceMeters,
          this.headingDeg
        );
        this.latitude = nextPos.latitude;
        this.longitude = nextPos.longitude;
      }
    }

    this.lastUpdate = Date.now();
  }

  public setTarget(speedKmh: number, headingDeg: number): void {
    this.targetSpeedKmh = speedKmh;
    this.baseSpeedKmh = speedKmh;
    this.targetHeadingDeg = headingDeg;
  }

  public teleport(pos: Coordinates, speedKmh: number, headingDeg: number): void {
    this.latitude = pos.latitude;
    this.longitude = pos.longitude;
    this.speedKmh = speedKmh;
    this.baseSpeedKmh = speedKmh;
    this.headingDeg = headingDeg;
    this.targetSpeedKmh = speedKmh;
    this.targetHeadingDeg = headingDeg;
    this.evasiveHeadingOffsetDeg = 0;
    this.activeManeuverLabel = '🚗 CRUISING';
    this.lastUpdate = Date.now();
  }

  public toTelemetry(): VehicleTelemetry {
    return {
      id: this.id,
      name: this.name,
      driverType: this.driverType,
      latitude: this.latitude,
      longitude: this.longitude,
      speedKmh: Number(this.speedKmh.toFixed(1)),
      headingDeg: Number(this.headingDeg.toFixed(1)),
      accuracyMeters: this.isDegraded ? 28.0 : this.accuracyMeters,
      timestamp: this.lastUpdate,
      isSimulated: true,
    };
  }
}
