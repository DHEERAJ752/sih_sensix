/**
 * Pure Highway & Expressway 4-Car Simulation Engine
 *
 * Mathematically confines exactly 4 cars to a connected 2D Vector Highway Network.
 * Zero map tiles, zero off-road drifting.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface HighwayNode {
  id: string;
  name: string;
  pos: Point2D;
  connectedEdgeIds: string[];
}

export interface HighwayEdge {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  points: Point2D[];
  lengthPx: number;
  lanes: number;
  laneWidth: number;
  speedLimitKmh: number;
  tier: 'ground' | 'flyover' | 'loop' | 'service';
}

export type CarId = 'dheeraj' | 'lehari' | 'pardhu' | 'bjs' | 'nithin' | 'chayy' | 'car-1' | 'car-2' | 'car-3' | 'car-4';

export interface HighwayCar {
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
  pos: Point2D;
  headingDeg: number;
  selectedNextEdgeId: string | null;
  upcomingNodeId: string;
  upcomingNodeName: string;
  statusMessage: string;
  isSeparating: boolean;
}

export interface HighwayProximityAlert {
  carAId: CarId;
  carAName: string;
  carBId: CarId;
  carBName: string;
  distanceMeters: number;
  midpoint: Point2D;
  timestamp: number;
  solutionText: string;
}

export interface HighwaySimState {
  cars: HighwayCar[];
  isRunning: boolean;
  proximityThresholdMeters: number;
  activeAlerts: HighwayProximityAlert[];
  allPairDistances: {
    pair: [CarId, CarId];
    pairLabel: string;
    distanceMeters: number;
    isWarning: boolean;
  }[];
}

// ── 1. Highway Interchange Nodes ─────────────────────────────────────────────
export const HIGHWAY_NODES: Record<string, HighwayNode> = {
  west_terminal: { id: 'west_terminal', name: 'West Expressway Terminal', pos: { x: 120, y: 480 }, connectedEdgeIds: [] },
  clover_west: { id: 'clover_west', name: 'West Interchange Merge', pos: { x: 500, y: 480 }, connectedEdgeIds: [] },
  central_junction: { id: 'central_junction', name: 'Central Grand Crossroad', pos: { x: 800, y: 480 }, connectedEdgeIds: [] },
  clover_east: { id: 'clover_east', name: 'East Interchange Merge', pos: { x: 1100, y: 480 }, connectedEdgeIds: [] },
  east_terminal: { id: 'east_terminal', name: 'East Expressway Terminal', pos: { x: 1480, y: 480 }, connectedEdgeIds: [] },

  north_terminal: { id: 'north_terminal', name: 'North Highway Terminal', pos: { x: 800, y: 100 }, connectedEdgeIds: [] },
  flyover_north: { id: 'flyover_north', name: 'Skyline Flyover (North Entry)', pos: { x: 800, y: 280 }, connectedEdgeIds: [] },
  flyover_south: { id: 'flyover_south', name: 'Skyline Flyover (South Exit)', pos: { x: 800, y: 680 }, connectedEdgeIds: [] },
  south_terminal: { id: 'south_terminal', name: 'South Highway Terminal', pos: { x: 800, y: 860 }, connectedEdgeIds: [] },

  north_west_ring: { id: 'north_west_ring', name: 'North-West Ring Hub', pos: { x: 300, y: 200 }, connectedEdgeIds: [] },
  north_east_ring: { id: 'north_east_ring', name: 'North-East Ring Hub', pos: { x: 1300, y: 200 }, connectedEdgeIds: [] },
  south_east_ring: { id: 'south_east_ring', name: 'South-East Ring Hub', pos: { x: 1300, y: 760 }, connectedEdgeIds: [] },
  south_west_ring: { id: 'south_west_ring', name: 'South-West Ring Hub', pos: { x: 300, y: 760 }, connectedEdgeIds: [] },
};

function computePolylineLength(points: Point2D[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
  }
  return Math.max(50, Math.round(len));
}

// ── 2. Highway Edges ──────────────────────────────────────────────────────────
const RAW_HIGHWAY_EDGES: Omit<HighwayEdge, 'lengthPx'>[] = [
  // East-West Main Expressway (4 Lanes)
  {
    id: 'hwy_west_to_clover',
    name: 'West Coastal Highway (EB)',
    fromNodeId: 'west_terminal',
    toNodeId: 'clover_west',
    points: [{ x: 120, y: 480 }, { x: 300, y: 480 }, { x: 500, y: 480 }],
    lanes: 4,
    laneWidth: 16,
    speedLimitKmh: 75,
    tier: 'ground',
  },
  {
    id: 'hwy_clover_to_central',
    name: 'Central Expressway (West Arm)',
    fromNodeId: 'clover_west',
    toNodeId: 'central_junction',
    points: [{ x: 500, y: 480 }, { x: 650, y: 480 }, { x: 800, y: 480 }],
    lanes: 4,
    laneWidth: 16,
    speedLimitKmh: 70,
    tier: 'ground',
  },
  {
    id: 'hwy_central_to_clover_east',
    name: 'Central Expressway (East Arm)',
    fromNodeId: 'central_junction',
    toNodeId: 'clover_east',
    points: [{ x: 800, y: 480 }, { x: 950, y: 480 }, { x: 1100, y: 480 }],
    lanes: 4,
    laneWidth: 16,
    speedLimitKmh: 70,
    tier: 'ground',
  },
  {
    id: 'hwy_clover_east_to_terminal',
    name: 'East Coastal Highway (EB)',
    fromNodeId: 'clover_east',
    toNodeId: 'east_terminal',
    points: [{ x: 1100, y: 480 }, { x: 1300, y: 480 }, { x: 1480, y: 480 }],
    lanes: 4,
    laneWidth: 16,
    speedLimitKmh: 75,
    tier: 'ground',
  },

  // North-South Expressway & Level 2 Flyover Overpass
  {
    id: 'hwy_north_to_flyover',
    name: 'North Highway Corridor',
    fromNodeId: 'north_terminal',
    toNodeId: 'flyover_north',
    points: [{ x: 800, y: 100 }, { x: 800, y: 190 }, { x: 800, y: 280 }],
    lanes: 4,
    laneWidth: 16,
    speedLimitKmh: 65,
    tier: 'ground',
  },
  {
    id: 'flyover_overpass_main',
    name: 'Skyline Level 2 Flyover Overpass',
    fromNodeId: 'flyover_north',
    toNodeId: 'flyover_south',
    points: [{ x: 800, y: 280 }, { x: 800, y: 480 }, { x: 800, y: 680 }],
    lanes: 4,
    laneWidth: 16,
    speedLimitKmh: 80,
    tier: 'flyover',
  },
  {
    id: 'hwy_flyover_to_south',
    name: 'South Highway Corridor',
    fromNodeId: 'flyover_south',
    toNodeId: 'south_terminal',
    points: [{ x: 800, y: 680 }, { x: 800, y: 770 }, { x: 800, y: 860 }],
    lanes: 4,
    laneWidth: 16,
    speedLimitKmh: 65,
    tier: 'ground',
  },

  // Central Ground North-South Crossroad (Connects underneath flyover)
  {
    id: 'central_north_connector',
    name: 'Central Ground Avenue (North)',
    fromNodeId: 'flyover_north',
    toNodeId: 'central_junction',
    points: [{ x: 800, y: 280 }, { x: 800, y: 380 }, { x: 800, y: 480 }],
    lanes: 2,
    laneWidth: 16,
    speedLimitKmh: 50,
    tier: 'ground',
  },
  {
    id: 'central_south_connector',
    name: 'Central Ground Avenue (South)',
    fromNodeId: 'central_junction',
    toNodeId: 'flyover_south',
    points: [{ x: 800, y: 480 }, { x: 800, y: 580 }, { x: 800, y: 680 }],
    lanes: 2,
    laneWidth: 16,
    speedLimitKmh: 50,
    tier: 'ground',
  },

  // Cloverleaf Loop Ramps
  {
    id: 'clover_ne_loop',
    name: 'Cloverleaf Ramp (North-East Loop)',
    fromNodeId: 'clover_east',
    toNodeId: 'flyover_north',
    points: [
      { x: 1100, y: 480 },
      { x: 1040, y: 380 },
      { x: 920, y: 320 },
      { x: 800, y: 280 },
    ],
    lanes: 2,
    laneWidth: 14,
    speedLimitKmh: 45,
    tier: 'loop',
  },
  {
    id: 'clover_sw_loop',
    name: 'Cloverleaf Ramp (South-West Loop)',
    fromNodeId: 'clover_west',
    toNodeId: 'flyover_south',
    points: [
      { x: 500, y: 480 },
      { x: 560, y: 580 },
      { x: 680, y: 640 },
      { x: 800, y: 680 },
    ],
    lanes: 2,
    laneWidth: 14,
    speedLimitKmh: 45,
    tier: 'loop',
  },

  // Outer Circumferential Ring Highway (Connecting all outer terminals)
  {
    id: 'ring_north_arm',
    name: 'North Outer Ring Expressway',
    fromNodeId: 'north_west_ring',
    toNodeId: 'north_terminal',
    points: [{ x: 300, y: 200 }, { x: 550, y: 150 }, { x: 800, y: 100 }],
    lanes: 3,
    laneWidth: 15,
    speedLimitKmh: 65,
    tier: 'ground',
  },
  {
    id: 'ring_north_east_arm',
    name: 'North-East Ring Expressway',
    fromNodeId: 'north_terminal',
    toNodeId: 'north_east_ring',
    points: [{ x: 800, y: 100 }, { x: 1050, y: 150 }, { x: 1300, y: 200 }],
    lanes: 3,
    laneWidth: 15,
    speedLimitKmh: 65,
    tier: 'ground',
  },
  {
    id: 'ring_east_arm',
    name: 'East Outer Ring Expressway',
    fromNodeId: 'north_east_ring',
    toNodeId: 'east_terminal',
    points: [{ x: 1300, y: 200 }, { x: 1440, y: 340 }, { x: 1480, y: 480 }],
    lanes: 3,
    laneWidth: 15,
    speedLimitKmh: 65,
    tier: 'ground',
  },
  {
    id: 'ring_south_east_arm',
    name: 'South-East Ring Expressway',
    fromNodeId: 'east_terminal',
    toNodeId: 'south_east_ring',
    points: [{ x: 1480, y: 480 }, { x: 1440, y: 620 }, { x: 1300, y: 760 }],
    lanes: 3,
    laneWidth: 15,
    speedLimitKmh: 65,
    tier: 'ground',
  },
  {
    id: 'ring_south_arm',
    name: 'South Outer Ring Expressway',
    fromNodeId: 'south_east_ring',
    toNodeId: 'south_terminal',
    points: [{ x: 1300, y: 760 }, { x: 1050, y: 810 }, { x: 800, y: 860 }],
    lanes: 3,
    laneWidth: 15,
    speedLimitKmh: 65,
    tier: 'ground',
  },
  {
    id: 'ring_south_west_arm',
    name: 'South-West Ring Expressway',
    fromNodeId: 'south_terminal',
    toNodeId: 'south_west_ring',
    points: [{ x: 800, y: 860 }, { x: 550, y: 810 }, { x: 300, y: 760 }],
    lanes: 3,
    laneWidth: 15,
    speedLimitKmh: 65,
    tier: 'ground',
  },
  {
    id: 'ring_west_arm',
    name: 'West Outer Ring Expressway',
    fromNodeId: 'south_west_ring',
    toNodeId: 'west_terminal',
    points: [{ x: 300, y: 760 }, { x: 160, y: 620 }, { x: 120, y: 480 }],
    lanes: 3,
    laneWidth: 15,
    speedLimitKmh: 65,
    tier: 'ground',
  },
  {
    id: 'ring_north_west_arm',
    name: 'North-West Outer Ring Expressway',
    fromNodeId: 'west_terminal',
    toNodeId: 'north_west_ring',
    points: [{ x: 120, y: 480 }, { x: 160, y: 340 }, { x: 300, y: 200 }],
    lanes: 3,
    laneWidth: 15,
    speedLimitKmh: 65,
    tier: 'ground',
  },

  // West & East Diagonal Connectors (Direct diagonal express corridors)
  {
    id: 'diag_nw_to_clover',
    name: 'North-West Diagonal Expressway',
    fromNodeId: 'north_west_ring',
    toNodeId: 'clover_west',
    points: [{ x: 300, y: 200 }, { x: 400, y: 340 }, { x: 500, y: 480 }],
    lanes: 2,
    laneWidth: 15,
    speedLimitKmh: 55,
    tier: 'ground',
  },
  {
    id: 'diag_se_to_clover',
    name: 'South-East Diagonal Expressway',
    fromNodeId: 'clover_east',
    toNodeId: 'south_east_ring',
    points: [{ x: 1100, y: 480 }, { x: 1200, y: 620 }, { x: 1300, y: 760 }],
    lanes: 2,
    laneWidth: 15,
    speedLimitKmh: 55,
    tier: 'ground',
  },
];

export const HIGHWAY_EDGES: Record<string, HighwayEdge> = {};

RAW_HIGHWAY_EDGES.forEach((raw) => {
  const lengthPx = computePolylineLength(raw.points);
  const edge: HighwayEdge = { ...raw, lengthPx };
  HIGHWAY_EDGES[edge.id] = edge;

  if (HIGHWAY_NODES[edge.fromNodeId]) {
    HIGHWAY_NODES[edge.fromNodeId].connectedEdgeIds.push(edge.id);
  }
  if (HIGHWAY_NODES[edge.toNodeId]) {
    HIGHWAY_NODES[edge.toNodeId].connectedEdgeIds.push(edge.id);
  }
});

/**
 * Calculates exact position and heading angle in degrees at fraction progress [0..1]
 */
export function getHighwayPoint(
  edgeId: string,
  progress: number,
  direction: 1 | -1 = 1
): { pos: Point2D; headingDeg: number } {
  const edge = HIGHWAY_EDGES[edgeId];
  if (!edge || edge.points.length === 0) {
    return { pos: { x: 800, y: 480 }, headingDeg: 0 };
  }

  const pts = edge.points;
  if (pts.length === 1) return { pos: pts[0], headingDeg: 0 };

  const effectiveProgress = direction === 1 ? progress : 1.0 - progress;
  const clampedT = Math.max(0, Math.min(1, effectiveProgress));

  const numSegments = pts.length - 1;
  const segIndex = Math.min(Math.floor(clampedT * numSegments), numSegments - 1);
  const localT = (clampedT * numSegments) - segIndex;

  const a = pts[segIndex];
  const b = pts[segIndex + 1];

  const x = a.x + (b.x - a.x) * localT;
  const y = a.y + (b.y - a.y) * localT;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let radians = Math.atan2(dy, dx);
  let headingDeg = ((radians * 180) / Math.PI + 360) % 360;

  if (direction === -1) {
    headingDeg = (headingDeg + 180) % 360;
  }

  return { pos: { x, y }, headingDeg };
}

export interface HighwayTurnOption {
  edgeId: string;
  edgeName: string;
  targetNodeId: string;
  targetNodeName: string;
  isUTurn: boolean;
}

export function getHighwayTurnsAtNode(nodeId: string, currentEdgeId: string): HighwayTurnOption[] {
  const node = HIGHWAY_NODES[nodeId];
  if (!node) return [];

  const options: HighwayTurnOption[] = [];
  node.connectedEdgeIds.forEach((eId) => {
    const edge = HIGHWAY_EDGES[eId];
    if (!edge) return;

    const isUTurn = eId === currentEdgeId;
    const targetNodeId = edge.fromNodeId === nodeId ? edge.toNodeId : edge.fromNodeId;
    const targetNode = HIGHWAY_NODES[targetNodeId];

    options.push({
      edgeId: eId,
      edgeName: edge.name,
      targetNodeId,
      targetNodeName: targetNode ? targetNode.name : targetNodeId,
      isUTurn,
    });
  });

  return options;
}

// ── 3. Initial Cars Spawn Config ─────────────────────────────────────────────
export const INITIAL_HIGHWAY_CARS: {
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
    id: 'dheeraj',
    name: 'Dheeraj',
    label: 'Dheeraj (Blue)',
    color: '#2563eb',
    edgeId: 'hwy_west_to_clover',
    progress: 0.15,
    direction: 1,
    initialSpeedKmh: 55,
  },
  {
    id: 'lehari',
    name: 'Lehari',
    label: 'Lehari (Amber)',
    color: '#d97706',
    edgeId: 'hwy_clover_east_to_terminal',
    progress: 0.8,
    direction: -1,
    initialSpeedKmh: 50,
  },
  {
    id: 'pardhu',
    name: 'Pardhu',
    label: 'Pardhu (Red/Medic)',
    color: '#ef4444',
    edgeId: 'flyover_overpass_main',
    progress: 0.2,
    direction: 1,
    initialSpeedKmh: 65,
  },
  {
    id: 'bjs',
    name: 'BJS',
    label: 'BJS (Purple/Lead)',
    color: '#9333ea',
    edgeId: 'ring_north_arm',
    progress: 0.35,
    direction: 1,
    initialSpeedKmh: 48,
  },
  {
    id: 'nithin',
    name: 'Nithin',
    label: 'Nithin (Green)',
    color: '#10b981',
    edgeId: 'ring_south_arm',
    progress: 0.25,
    direction: 1,
    initialSpeedKmh: 52,
  },
  {
    id: 'chayy',
    name: 'Chayy',
    label: 'Chayy (Cyan/Patrol)',
    color: '#06b6d4',
    edgeId: 'hwy_cross_west_approach',
    progress: 0.4,
    direction: 1,
    initialSpeedKmh: 58,
  },
];

export class HighwaySimulationEngine {
  private cars: Map<CarId, HighwayCar> = new Map();
  private isRunning: boolean = true;
  private proximityThresholdMeters: number = 40; // in meters (approx 80px)
  private activeAlerts: HighwayProximityAlert[] = [];

  constructor() {
    this.resetAllCars();
  }

  public resetAllCars(): void {
    this.cars.clear();
    this.activeAlerts = [];

    INITIAL_HIGHWAY_CARS.forEach((cfg) => {
      const edge = HIGHWAY_EDGES[cfg.edgeId];
      if (!edge) {
        console.error(`Missing edge "${cfg.edgeId}" for car "${cfg.id}"`);
        return;
      }
      const upcomingNodeId = cfg.direction === 1 ? edge.toNodeId : edge.fromNodeId;
      const upcomingNode = HIGHWAY_NODES[upcomingNodeId];
      const point = getHighwayPoint(cfg.edgeId, cfg.progress, cfg.direction);

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
        pos: point.pos,
        headingDeg: point.headingDeg,
        selectedNextEdgeId: null,
        upcomingNodeId,
        upcomingNodeName: upcomingNode ? upcomingNode.name : upcomingNodeId,
        statusMessage: `Cruising on ${edge.name}`,
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
    this.proximityThresholdMeters = Math.max(15, Math.min(100, meters));
  }

  public getProximityThreshold(): number {
    return this.proximityThresholdMeters;
  }

  public setCarSpeed(carId: CarId, speedKmh: number): void {
    const car = this.cars.get(carId);
    if (!car) return;
    const clamped = Math.max(0, Math.min(90, speedKmh));
    car.targetSpeedKmh = clamped;
    car.speedKmh = clamped;
    car.statusMessage = clamped === 0 ? 'Stopped' : `Speed set to ${clamped} km/h`;
  }

  public setCarNextTurn(carId: CarId, nextEdgeId: string): void {
    const car = this.cars.get(carId);
    if (!car) return;
    car.selectedNextEdgeId = nextEdgeId;
    const nextEdge = HIGHWAY_EDGES[nextEdgeId];
    if (nextEdge) {
      car.statusMessage = `Next Turn: ${nextEdge.name}`;
    }
  }

  public toggleCarPause(carId: CarId): void {
    const car = this.cars.get(carId);
    if (!car) return;
    car.isPaused = !car.isPaused;
    car.statusMessage = car.isPaused ? 'Paused' : 'Resumed cruising';
  }

  public getAvailableTurnsForCar(carId: CarId): HighwayTurnOption[] {
    const car = this.cars.get(carId);
    if (!car) return [];
    return getHighwayTurnsAtNode(car.upcomingNodeId, car.currentEdgeId);
  }

  public update(dtSec: number): HighwaySimState {
    if (!this.isRunning) {
      return this.getState();
    }

    const carList = Array.from(this.cars.values());
    const newAlerts: HighwayProximityAlert[] = [];
    const separatingCarIds = new Set<CarId>();
    const METERS_PER_PIXEL = 0.5; // 2 pixels = 1 meter approx

    // ── 1. Proximity Detection Across All 6 Pairs ───────────────────────────
    for (let i = 0; i < carList.length; i++) {
      for (let j = i + 1; j < carList.length; j++) {
        const carA = carList[i];
        const carB = carList[j];

        const distPx = Math.hypot(carA.pos.x - carB.pos.x, carA.pos.y - carB.pos.y);
        const distMeters = distPx * METERS_PER_PIXEL;

        if (distMeters < this.proximityThresholdMeters) {
          separatingCarIds.add(carA.id);
          separatingCarIds.add(carB.id);

          const midX = (carA.pos.x + carB.pos.x) / 2;
          const midY = (carA.pos.y + carB.pos.y) / 2;

          let solutionText = 'Automatic highway separation: decelerating & diverging at junction';
          if (carA.currentEdgeId === carB.currentEdgeId) {
            solutionText = 'Same highway lane proximity: leading car advances, trailing car yields';
          }

          newAlerts.push({
            carAId: carA.id,
            carAName: carA.name,
            carBId: carB.id,
            carBName: carB.name,
            distanceMeters: Math.round(distMeters * 10) / 10,
            midpoint: { x: midX, y: midY },
            timestamp: Date.now(),
            solutionText,
          });
        }
      }
    }

    this.activeAlerts = newAlerts;

    // ── 2. Automatic Safety Separation Actuation (100% on highway) ───────────
    carList.forEach((car) => {
      const isUnderAlert = separatingCarIds.has(car.id);
      car.isSeparating = isUnderAlert;

      if (isUnderAlert) {
        // Slow down smoothly to 20 km/h to maintain highway safety gap
        if (car.speedKmh > 20) {
          car.speedKmh = Math.max(20, car.speedKmh - 20 * dtSec);
        }
      } else {
        // Restore user target speed
        if (Math.abs(car.speedKmh - car.targetSpeedKmh) > 0.5) {
          const diff = car.targetSpeedKmh - car.speedKmh;
          car.speedKmh += Math.sign(diff) * Math.min(Math.abs(diff), 30 * dtSec);
        }
      }
    });

    // ── 3. Highway-Constrained Movement Physics ──────────────────────────────
    carList.forEach((car) => {
      if (car.isPaused || car.speedKmh <= 0.1) return;

      const currentEdge = HIGHWAY_EDGES[car.currentEdgeId];
      if (!currentEdge) return;

      // Speed in pixels per second: (km/h * 1000 / 3600) / METERS_PER_PIXEL
      const speedPxSec = ((car.speedKmh * 1000) / 3600) / METERS_PER_PIXEL;
      const progressDelta = (speedPxSec * dtSec) / currentEdge.lengthPx;

      car.edgeProgress += progressDelta;

      // Reached highway interchange node (progress >= 1.0)
      if (car.edgeProgress >= 1.0) {
        const reachedNodeId = car.upcomingNodeId;
        const reachedNode = HIGHWAY_NODES[reachedNodeId];

        let nextEdgeId: string;

        if (car.selectedNextEdgeId) {
          nextEdgeId = car.selectedNextEdgeId;
          car.selectedNextEdgeId = null;
        } else {
          const availableTurns = getHighwayTurnsAtNode(reachedNodeId, car.currentEdgeId);
          if (availableTurns.length > 0) {
            const forwardTurns = availableTurns.filter((t) => !t.isUTurn);
            const pool = forwardTurns.length > 0 ? forwardTurns : availableTurns;
            const chosen = pool[Math.floor(Math.random() * pool.length)];
            nextEdgeId = chosen.edgeId;
          } else {
            nextEdgeId = car.currentEdgeId;
          }
        }

        const nextEdge = HIGHWAY_EDGES[nextEdgeId];
        if (nextEdge) {
          car.currentEdgeId = nextEdge.id;
          car.edgeProgress = 0.0;
          car.direction = nextEdge.fromNodeId === reachedNodeId ? 1 : -1;

          const newUpcomingNodeId = car.direction === 1 ? nextEdge.toNodeId : nextEdge.fromNodeId;
          const newUpcomingNode = HIGHWAY_NODES[newUpcomingNodeId];
          car.upcomingNodeId = newUpcomingNodeId;
          car.upcomingNodeName = newUpcomingNode ? newUpcomingNode.name : newUpcomingNodeId;
          car.statusMessage = `Turned at ${reachedNode ? reachedNode.name : 'Junction'} → Cruising on ${nextEdge.name}`;
        } else {
          car.edgeProgress = 0.98;
          car.direction = car.direction === 1 ? -1 : 1;
        }
      }

      // Compute exact position strictly from the highway spline
      const point = getHighwayPoint(car.currentEdgeId, car.edgeProgress, car.direction);
      car.pos = point.pos;
      car.headingDeg = point.headingDeg;
    });

    return this.getState();
  }

  public getState(): HighwaySimState {
    const carList = Array.from(this.cars.values());
    const allPairDistances: HighwaySimState['allPairDistances'] = [];
    const METERS_PER_PIXEL = 0.5;

    for (let i = 0; i < carList.length; i++) {
      for (let j = i + 1; j < carList.length; j++) {
        const cA = carList[i];
        const cB = carList[j];
        const distMeters = Math.hypot(cA.pos.x - cB.pos.x, cA.pos.y - cB.pos.y) * METERS_PER_PIXEL;
        allPairDistances.push({
          pair: [cA.id, cB.id],
          pairLabel: `${cA.name} ↔ ${cB.name}`,
          distanceMeters: Math.round(distMeters * 10) / 10,
          isWarning: distMeters < this.proximityThresholdMeters,
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

export const highwaySimEngine = new HighwaySimulationEngine();
