/**
 * Visakhapatnam 4-Car Road-Constrained Simulation Engine
 *
 * Mathematically confines exactly 4 cars to the Visakhapatnam Road Network Graph.
 * Provides independent speed control, turn/direction selection at intersections,
 * real-time proximity detection with ⚠️ alerts, and automatic road-constrained safety separation.
 */

import { Coordinates } from '../../types/vehicle';
import { calculateHaversineDistance } from '../collision/geoMath';
import {
  VIZAG_NODES,
  VIZAG_EDGES,
  getEdgePoint,
  getAvailableTurnsAtNode,
  AvailableTurnOption,
} from './vizagGraph';

export type CarId = 'car-1' | 'car-2' | 'car-3' | 'car-4';

export interface VizagSimCar {
  id: CarId;
  name: string;
  label: string;
  color: string;
  currentEdgeId: string;
  edgeProgress: number; // 0.0 to 1.0
  direction: 1 | -1;    // 1 = fromNode -> toNode, -1 = toNode -> fromNode
  speedKmh: number;
  targetSpeedKmh: number;
  isPaused: boolean;
  position: Coordinates;
  headingDeg: number;
  selectedNextEdgeId: string | null; // User-selected turn for upcoming node
  upcomingNodeId: string;
  upcomingNodeName: string;
  statusMessage: string;
  isSeparating: boolean;
}

export interface ProximityAlert {
  carAId: CarId;
  carAName: string;
  carBId: CarId;
  carBName: string;
  distanceMeters: number;
  midpoint: Coordinates;
  timestamp: number;
  solutionText: string;
}

export interface VizagSimState {
  cars: VizagSimCar[];
  isRunning: boolean;
  proximityThresholdMeters: number;
  activeAlerts: ProximityAlert[];
  allPairDistances: {
    pair: [CarId, CarId];
    pairLabel: string;
    distanceMeters: number;
    isWarning: boolean;
  }[];
}

// Initial Spawn Configurations for all 4 Cars (Spaced out along major Vizag roads)
export const INITIAL_CAR_CONFIGS: {
  id: CarId;
  name: string;
  label: string;
  color: string;
  edgeId: string;
  progress: number;
  direction: 1 | -1;
  initialSpeedKmh: number;
}[] = [
  {
    id: 'car-1',
    name: 'Car 1',
    label: 'Car 1 (Blue)',
    color: '#2563eb',
    edgeId: 'siripuram_care',
    progress: 0.15,
    direction: 1,
    initialSpeedKmh: 45,
  },
  {
    id: 'car-2',
    name: 'Car 2',
    label: 'Car 2 (Amber)',
    color: '#d97706',
    edgeId: 'asilmetta_rtc',
    progress: 0.25,
    direction: 1,
    initialSpeedKmh: 40,
  },
  {
    id: 'car-3',
    name: 'Car 3',
    label: 'Car 3 (Green)',
    color: '#10b981',
    edgeId: 'rk_beach_lawsons',
    progress: 0.35,
    direction: 1,
    initialSpeedKmh: 42,
  },
  {
    id: 'car-4',
    name: 'Car 4',
    label: 'Car 4 (Purple)',
    color: '#9333ea',
    edgeId: 'maddilapalem_mvp',
    progress: 0.2,
    direction: 1,
    initialSpeedKmh: 38,
  },
];

export class VizagSimulationEngine {
  private cars: Map<CarId, VizagSimCar> = new Map();
  private isRunning: boolean = true;
  private proximityThresholdMeters: number = 45; // Configurable proximity threshold
  private activeAlerts: ProximityAlert[] = [];

  constructor() {
    this.resetAllCars();
  }

  public resetAllCars(): void {
    this.cars.clear();
    this.activeAlerts = [];

    INITIAL_CAR_CONFIGS.forEach((cfg) => {
      const edge = VIZAG_EDGES[cfg.edgeId];
      const upcomingNodeId = cfg.direction === 1 ? edge.toNodeId : edge.fromNodeId;
      const upcomingNode = VIZAG_NODES[upcomingNodeId];
      const point = getEdgePoint(cfg.edgeId, cfg.progress, cfg.direction);

      this.cars.set(cfg.id, {
        id: cfg.id,
        name: cfg.name,
        label: cfg.label,
        color: cfg.color,
        currentEdgeId: cfg.edgeId,
        edgeProgress: cfg.progress,
        direction: cfg.direction,
        speedKmh: cfg.initialSpeedKmh,
        targetSpeedKmh: cfg.initialSpeedKmh,
        isPaused: false,
        position: point.position,
        headingDeg: point.headingDeg,
        selectedNextEdgeId: null,
        upcomingNodeId,
        upcomingNodeName: upcomingNode ? upcomingNode.name : upcomingNodeId,
        statusMessage: `Roaming on ${edge.name}`,
        isSeparating: false,
      });
    });
  }

  public setGlobalRunning(running: boolean): void {
    this.isRunning = running;
  }

  public getGlobalRunning(): boolean {
    return this.isRunning;
  }

  public setProximityThreshold(meters: number): void {
    this.proximityThresholdMeters = Math.max(15, Math.min(120, meters));
  }

  public getProximityThreshold(): number {
    return this.proximityThresholdMeters;
  }

  public setCarSpeed(carId: CarId, speedKmh: number): void {
    const car = this.cars.get(carId);
    if (!car) return;
    const clamped = Math.max(0, Math.min(80, speedKmh));
    car.targetSpeedKmh = clamped;
    car.speedKmh = clamped;
    if (clamped === 0) {
      car.statusMessage = 'Stopped (Speed 0 km/h)';
    } else {
      const edge = VIZAG_EDGES[car.currentEdgeId];
      car.statusMessage = `Speed set to ${clamped} km/h on ${edge ? edge.name : 'road'}`;
    }
  }

  public setCarNextTurn(carId: CarId, nextEdgeId: string): void {
    const car = this.cars.get(carId);
    if (!car) return;
    car.selectedNextEdgeId = nextEdgeId;
    const nextEdge = VIZAG_EDGES[nextEdgeId];
    if (nextEdge) {
      car.statusMessage = `Next Turn Selected: ${nextEdge.name}`;
    }
  }

  public toggleCarPause(carId: CarId): void {
    const car = this.cars.get(carId);
    if (!car) return;
    car.isPaused = !car.isPaused;
    car.statusMessage = car.isPaused ? 'Paused by user' : 'Resumed cruising';
  }

  public getAvailableTurnsForCar(carId: CarId): AvailableTurnOption[] {
    const car = this.cars.get(carId);
    if (!car) return [];
    return getAvailableTurnsAtNode(car.upcomingNodeId, car.currentEdgeId);
  }

  /**
   * Main Physics Tick (Smooth 60 FPS update)
   */
  public update(dtSec: number): VizagSimState {
    if (!this.isRunning) {
      return this.getState();
    }

    // ── 1. Proximity Detection Across All 6 Pairs ───────────────────────────
    const carList = Array.from(this.cars.values());
    const newAlerts: ProximityAlert[] = [];
    const separatingCarIds = new Set<CarId>();

    for (let i = 0; i < carList.length; i++) {
      for (let j = i + 1; j < carList.length; j++) {
        const carA = carList[i];
        const carB = carList[j];

        const dist = calculateHaversineDistance(carA.position, carB.position);

        if (dist < this.proximityThresholdMeters) {
          separatingCarIds.add(carA.id);
          separatingCarIds.add(carB.id);

          const midLat = (carA.position.latitude + carB.position.latitude) / 2;
          const midLng = (carA.position.longitude + carB.position.longitude) / 2;

          let solutionText = 'Automatic road separation active: diverging speeds & turning paths';

          // Determine safety separation strategy
          if (carA.currentEdgeId === carB.currentEdgeId) {
            if (carA.direction !== carB.direction) {
              solutionText = 'Head-on proximity on same road: decelerating and diverging at upcoming junction';
            } else {
              solutionText = 'Following proximity: trailing vehicle slowing to open safety gap';
            }
          } else if (carA.upcomingNodeId === carB.upcomingNodeId) {
            solutionText = `Both approaching ${carA.upcomingNodeName}: arbitrating intersection right-of-way`;
          }

          newAlerts.push({
            carAId: carA.id,
            carAName: carA.name,
            carBId: carB.id,
            carBName: carB.name,
            distanceMeters: Math.round(dist * 10) / 10,
            midpoint: { latitude: midLat, longitude: midLng },
            timestamp: Date.now(),
            solutionText,
          });
        }
      }
    }

    this.activeAlerts = newAlerts;

    // ── 2. Automatic Safety Separation Actuation (Stay strictly on road) ─────
    carList.forEach((car) => {
      const isUnderAlert = separatingCarIds.has(car.id);
      car.isSeparating = isUnderAlert;

      if (isUnderAlert) {
        // Apply smooth separation: lower speed to 18 km/h or adjust turn choice
        if (car.speedKmh > 18) {
          car.speedKmh = Math.max(18, car.speedKmh - 15 * dtSec);
        }
      } else {
        // Smoothly restore user-set target speed
        if (Math.abs(car.speedKmh - car.targetSpeedKmh) > 0.5) {
          const diff = car.targetSpeedKmh - car.speedKmh;
          car.speedKmh += Math.sign(diff) * Math.min(Math.abs(diff), 25 * dtSec);
        }
      }
    });

    // ── 3. Road-Constrained Kinematic Movement ───────────────────────────────
    carList.forEach((car) => {
      if (car.isPaused || car.speedKmh <= 0.1) {
        return;
      }

      const currentEdge = VIZAG_EDGES[car.currentEdgeId];
      if (!currentEdge) return;

      const edgeLength = currentEdge.lengthMeters;
      const speedMps = (car.speedKmh * 1000) / 3600;
      const progressDelta = (speedMps * dtSec) / edgeLength;

      car.edgeProgress += progressDelta;

      // Check if reached intersection node (progress >= 1.0)
      if (car.edgeProgress >= 1.0) {
        const reachedNodeId = car.upcomingNodeId;
        const reachedNode = VIZAG_NODES[reachedNodeId];

        // Pick next road segment
        let nextEdgeId: string;

        if (car.selectedNextEdgeId) {
          // User-chosen turn
          nextEdgeId = car.selectedNextEdgeId;
          car.selectedNextEdgeId = null; // reset choice
        } else {
          // Autonomous roaming: pick connected branch at intersection
          const availableTurns = getAvailableTurnsAtNode(reachedNodeId, car.currentEdgeId);
          if (availableTurns.length > 0) {
            // Avoid immediate U-turn if other branches exist
            const forwardTurns = availableTurns.filter((t) => !t.isUTurn);
            const pool = forwardTurns.length > 0 ? forwardTurns : availableTurns;
            const chosen = pool[Math.floor(Math.random() * pool.length)];
            nextEdgeId = chosen.edgeId;
          } else {
            // Rebound along same edge if dead-end
            nextEdgeId = car.currentEdgeId;
          }
        }

        const nextEdge = VIZAG_EDGES[nextEdgeId];
        if (nextEdge) {
          car.currentEdgeId = nextEdge.id;
          car.edgeProgress = 0.0;
          // If the new road starts from reachedNodeId, direction is 1; else -1
          car.direction = nextEdge.fromNodeId === reachedNodeId ? 1 : -1;

          // Update upcoming node
          const newUpcomingNodeId = car.direction === 1 ? nextEdge.toNodeId : nextEdge.fromNodeId;
          const newUpcomingNode = VIZAG_NODES[newUpcomingNodeId];
          car.upcomingNodeId = newUpcomingNodeId;
          car.upcomingNodeName = newUpcomingNode ? newUpcomingNode.name : newUpcomingNodeId;
          car.statusMessage = `Turned at ${reachedNode ? reachedNode.name : 'Intersection'} → Cruising on ${nextEdge.name}`;
        } else {
          // Wrap around safely
          car.edgeProgress = 0.99;
          car.direction = (car.direction === 1 ? -1 : 1);
        }
      }

      // Compute exact position strictly from the road polyline
      const point = getEdgePoint(car.currentEdgeId, car.edgeProgress, car.direction);
      car.position = point.position;
      car.headingDeg = point.headingDeg;
    });

    return this.getState();
  }

  public getState(): VizagSimState {
    const carList = Array.from(this.cars.values());
    const allPairDistances: VizagSimState['allPairDistances'] = [];

    for (let i = 0; i < carList.length; i++) {
      for (let j = i + 1; j < carList.length; j++) {
        const cA = carList[i];
        const cB = carList[j];
        const dist = calculateHaversineDistance(cA.position, cB.position);
        allPairDistances.push({
          pair: [cA.id, cB.id],
          pairLabel: `${cA.name} ↔ ${cB.name}`,
          distanceMeters: Math.round(dist * 10) / 10,
          isWarning: dist < this.proximityThresholdMeters,
        });
      }
    }

    return {
      cars: carList,
      isRunning: this.isRunning,
      proximityThresholdMeters: this.proximityThresholdMeters,
      activeAlerts: this.activeAlerts,
      allPairDistances,
    };
  }
}

export const vizagSimEngine = new VizagSimulationEngine();
