/**
 * Custom High-Definition Virtual Metropolis Environment
 *
 * Hand-crafted 3200 x 2400 px world containing:
 *  - 4-Lane Express Highways & Cloverleaf Interchange
 *  - Elevated 2-Tier Flyovers with realistic drop shadows
 *  - Grand Suspension Bridge over Blue River/Bay
 *  - Central 5-Way Mega Roundabout
 *  - Dedicated U-Turn Service Roads & Slip Lanes
 *  - Commercial Downtown Skyscraper Blocks & Office Towers
 *  - Hospital Medical Center with Emergency 108 Corridor
 *  - Residential Suburbs & Sidewalk Parks with Trees
 *
 * Vehicles are 100% mathematically locked to paved road splines, bridges, flyovers, and U-turns.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface CityRoadSegment {
  id: string;
  name: string;
  tier: 'ground' | 'bridge' | 'flyover' | 'service';
  lanes: number;
  laneWidth: number; // in pixels (default 24px)
  speedLimitKmh: number;
  points: Point2D[];
  nextSegmentIds: string[];
}

export interface CityBuilding {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roofColor: string;
  hasHelipad?: boolean;
  isHospital?: boolean;
}

export interface CityTree {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface CityRiver {
  points: Point2D[];
  width: number;
}

export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 2400;

// ── City River / Bay ────────────────────────────────────────────────────────
export const CITY_RIVER: CityRiver = {
  width: 220,
  points: [
    { x: 1600, y: 0 },
    { x: 1620, y: 500 },
    { x: 1580, y: 1100 },
    { x: 1650, y: 1700 },
    { x: 1600, y: 2400 },
  ],
};

// ── Handcrafted Complex Road & Highway Network ─────────────────────────────
export const CITY_ROADS: CityRoadSegment[] = [
  // 1. East-West Grand Central Highway (Crossing suspension bridge)
  {
    id: 'hwy-main-eb',
    name: 'Eastbound Coastal Highway',
    tier: 'ground',
    lanes: 2,
    laneWidth: 26,
    speedLimitKmh: 75,
    points: [
      { x: 200, y: 1200 },
      { x: 700, y: 1200 },
      { x: 1100, y: 1200 },
      { x: 1450, y: 1200 }, // Approach bridge
      { x: 1750, y: 1200 }, // Bridge span
      { x: 2100, y: 1200 },
      { x: 2500, y: 1200 },
      { x: 3000, y: 1200 },
    ],
    nextSegmentIds: ['hwy-main-wb', 'clover-ne-loop', 'service-east-uturn'],
  },
  {
    id: 'hwy-main-wb',
    name: 'Westbound Coastal Highway',
    tier: 'ground',
    lanes: 2,
    laneWidth: 26,
    speedLimitKmh: 75,
    points: [
      { x: 3000, y: 1140 },
      { x: 2500, y: 1140 },
      { x: 2100, y: 1140 },
      { x: 1750, y: 1140 }, // Bridge span
      { x: 1450, y: 1140 },
      { x: 1100, y: 1140 },
      { x: 700, y: 1140 },
      { x: 200, y: 1140 },
    ],
    nextSegmentIds: ['hwy-main-eb', 'clover-sw-loop', 'service-west-uturn'],
  },

  // 2. North-South Downtown Expressway
  {
    id: 'exp-downtown-sb',
    name: 'Southbound Downtown Expressway',
    tier: 'ground',
    lanes: 2,
    laneWidth: 26,
    speedLimitKmh: 65,
    points: [
      { x: 900, y: 200 },
      { x: 900, y: 600 },
      { x: 900, y: 1050 }, // Approaching roundabout
      { x: 900, y: 1350 },
      { x: 900, y: 1800 },
      { x: 900, y: 2200 },
    ],
    nextSegmentIds: ['exp-downtown-nb', 'flyover-overpass-sb', 'roundabout-entry-north'],
  },
  {
    id: 'exp-downtown-nb',
    name: 'Northbound Downtown Expressway',
    tier: 'ground',
    lanes: 2,
    laneWidth: 26,
    speedLimitKmh: 65,
    points: [
      { x: 840, y: 2200 },
      { x: 840, y: 1800 },
      { x: 840, y: 1350 },
      { x: 840, y: 1050 },
      { x: 840, y: 600 },
      { x: 840, y: 200 },
    ],
    nextSegmentIds: ['exp-downtown-sb', 'flyover-overpass-nb', 'roundabout-entry-south'],
  },

  // 3. Elevated 2-Tier Flyover (Crossing high above Grand Highway)
  {
    id: 'flyover-overpass-sb',
    name: 'Skyline Flyover (Level 2 Overpass)',
    tier: 'flyover',
    lanes: 2,
    laneWidth: 24,
    speedLimitKmh: 80,
    points: [
      { x: 880, y: 750 },
      { x: 880, y: 1000 },
      { x: 880, y: 1170 }, // Overpass midspan above Hwy
      { x: 880, y: 1340 },
      { x: 880, y: 1550 },
    ],
    nextSegmentIds: ['exp-downtown-sb', 'flyover-ramp-east'],
  },
  {
    id: 'flyover-overpass-nb',
    name: 'Skyline Flyover Northbound',
    tier: 'flyover',
    lanes: 2,
    laneWidth: 24,
    speedLimitKmh: 80,
    points: [
      { x: 860, y: 1550 },
      { x: 860, y: 1340 },
      { x: 860, y: 1170 },
      { x: 860, y: 1000 },
      { x: 860, y: 750 },
    ],
    nextSegmentIds: ['exp-downtown-nb', 'flyover-ramp-west'],
  },

  // 4. Central Grand Roundabout & Ring
  {
    id: 'roundabout-ring',
    name: 'Central 5-Way Grand Roundabout',
    tier: 'ground',
    lanes: 2,
    laneWidth: 26,
    speedLimitKmh: 40,
    points: [
      { x: 2300, y: 600 }, // North
      { x: 2440, y: 660 }, // North-East
      { x: 2500, y: 800 }, // East
      { x: 2440, y: 940 }, // South-East
      { x: 2300, y: 1000 }, // South
      { x: 2160, y: 940 }, // South-West
      { x: 2100, y: 800 }, // West
      { x: 2160, y: 660 }, // North-West
      { x: 2300, y: 600 }, // Loop closure
    ],
    nextSegmentIds: ['roundabout-ring', 'hwy-main-eb', 'hospital-corridor-eb'],
  },

  // 5. Cloverleaf Interchange Loop Ramps
  {
    id: 'clover-ne-loop',
    name: 'Cloverleaf Interchange Loop (North-East)',
    tier: 'ground',
    lanes: 1,
    laneWidth: 22,
    speedLimitKmh: 45,
    points: [
      { x: 960, y: 1200 },
      { x: 1040, y: 1240 },
      { x: 1080, y: 1320 },
      { x: 1040, y: 1400 },
      { x: 950, y: 1420 },
      { x: 900, y: 1360 },
    ],
    nextSegmentIds: ['exp-downtown-sb'],
  },
  {
    id: 'clover-sw-loop',
    name: 'Cloverleaf Interchange Loop (South-West)',
    tier: 'ground',
    lanes: 1,
    laneWidth: 22,
    speedLimitKmh: 45,
    points: [
      { x: 780, y: 1140 },
      { x: 700, y: 1100 },
      { x: 660, y: 1020 },
      { x: 700, y: 940 },
      { x: 790, y: 920 },
      { x: 840, y: 980 },
    ],
    nextSegmentIds: ['exp-downtown-nb'],
  },

  // 6. U-Turn Service Roads & Bypass Slip Lanes
  {
    id: 'service-east-uturn',
    name: 'East Highway U-Turn Service Bypass',
    tier: 'service',
    lanes: 1,
    laneWidth: 22,
    speedLimitKmh: 35,
    points: [
      { x: 2900, y: 1200 },
      { x: 2980, y: 1220 },
      { x: 3040, y: 1170 },
      { x: 2980, y: 1120 },
      { x: 2900, y: 1140 },
    ],
    nextSegmentIds: ['hwy-main-wb'],
  },
  {
    id: 'service-west-uturn',
    name: 'West Highway U-Turn Service Bypass',
    tier: 'service',
    lanes: 1,
    laneWidth: 22,
    speedLimitKmh: 35,
    points: [
      { x: 300, y: 1140 },
      { x: 220, y: 1120 },
      { x: 160, y: 1170 },
      { x: 220, y: 1220 },
      { x: 300, y: 1200 },
    ],
    nextSegmentIds: ['hwy-main-eb'],
  },

  // 7. Hospital & 108 Emergency Green Wave Corridor
  {
    id: 'hospital-corridor-eb',
    name: 'Hospital Emergency Green Wave Corridor',
    tier: 'ground',
    lanes: 2,
    laneWidth: 24,
    speedLimitKmh: 60,
    points: [
      { x: 2300, y: 1000 }, // From roundabout south
      { x: 2300, y: 1400 },
      { x: 2300, y: 1750 }, // Hospital Main Entrance
      { x: 2300, y: 2150 },
    ],
    nextSegmentIds: ['hospital-corridor-wb', 'service-east-uturn'],
  },
  {
    id: 'hospital-corridor-wb',
    name: 'Hospital Return Corridor',
    tier: 'ground',
    lanes: 2,
    laneWidth: 24,
    speedLimitKmh: 60,
    points: [
      { x: 2250, y: 2150 },
      { x: 2250, y: 1750 },
      { x: 2250, y: 1400 },
      { x: 2250, y: 1000 },
    ],
    nextSegmentIds: ['roundabout-ring'],
  },
];

// ── Downtown Buildings & City Landmarks ────────────────────────────────────
export const CITY_BUILDINGS: CityBuilding[] = [
  // Downtown Core (West of river, North of highway)
  { id: 'b-tower-1', name: 'Cyber Heights Tower', x: 450, y: 400, width: 180, height: 180, color: '#1e293b', roofColor: '#334155', hasHelipad: true },
  { id: 'b-tower-2', name: 'Apex Financial Plaza', x: 670, y: 420, width: 140, height: 160, color: '#0f172a', roofColor: '#1e293b' },
  { id: 'b-tower-3', name: 'Tech Hub One', x: 450, y: 640, width: 160, height: 140, color: '#1e293b', roofColor: '#38bdf8' },
  { id: 'b-tower-4', name: 'Metro Trade Center', x: 650, y: 640, width: 160, height: 150, color: '#0f172a', roofColor: '#475569', hasHelipad: true },

  // South Downtown
  { id: 'b-tower-5', name: 'Skyline Condos', x: 450, y: 1450, width: 150, height: 180, color: '#334155', roofColor: '#475569' },
  { id: 'b-tower-6', name: 'Urban Mall & Cineplex', x: 640, y: 1480, width: 180, height: 150, color: '#1e293b', roofColor: '#6366f1' },
  { id: 'b-tower-7', name: 'Convention Center', x: 450, y: 1720, width: 220, height: 160, color: '#0f172a', roofColor: '#0ea5e9', hasHelipad: true },

  // East Side: Hospital Medical City
  { id: 'b-hosp-1', name: 'City Central Trauma Hospital', x: 2380, y: 1650, width: 240, height: 200, color: '#f8fafc', roofColor: '#ef4444', isHospital: true, hasHelipad: true },
  { id: 'b-hosp-2', name: 'Medical Research Wing', x: 2380, y: 1900, width: 200, height: 140, color: '#f1f5f9', roofColor: '#3b82f6', isHospital: true },
  { id: 'b-east-1', name: 'Harbor View Suites', x: 1900, y: 400, width: 150, height: 160, color: '#1e293b', roofColor: '#334155' },
  { id: 'b-east-2', name: 'Oceanic Trade Center', x: 2600, y: 400, width: 180, height: 170, color: '#0f172a', roofColor: '#1e293b', hasHelipad: true },
];

// ── Decorative Sidewalk & Park Trees (Strictly outside road boundaries) ────
export const CITY_TREES: CityTree[] = [
  // West Park
  { x: 300, y: 350, radius: 18, color: '#15803d' },
  { x: 340, y: 380, radius: 16, color: '#16a34a' },
  { x: 320, y: 430, radius: 20, color: '#15803d' },
  { x: 280, y: 480, radius: 18, color: '#22c55e' },
  { x: 340, y: 530, radius: 19, color: '#15803d' },
  { x: 300, y: 600, radius: 17, color: '#16a34a' },
  // River Promenade Trees
  { x: 1420, y: 400, radius: 15, color: '#16a34a' },
  { x: 1420, y: 600, radius: 16, color: '#15803d' },
  { x: 1420, y: 800, radius: 15, color: '#22c55e' },
  { x: 1420, y: 1400, radius: 16, color: '#15803d' },
  { x: 1420, y: 1600, radius: 15, color: '#16a34a' },
  { x: 1420, y: 1800, radius: 17, color: '#15803d' },
  // East River Promenade
  { x: 1780, y: 400, radius: 16, color: '#15803d' },
  { x: 1780, y: 600, radius: 15, color: '#22c55e' },
  { x: 1780, y: 800, radius: 17, color: '#16a34a' },
  { x: 1780, y: 1400, radius: 15, color: '#15803d' },
  { x: 1780, y: 1600, radius: 16, color: '#16a34a' },
  { x: 1780, y: 1800, radius: 18, color: '#15803d' },
  // Roundabout Park Center
  { x: 2300, y: 780, radius: 24, color: '#15803d' },
  { x: 2300, y: 820, radius: 20, color: '#16a34a' },
];

/**
 * Calculates point at fraction t along polyline road points
 */
export function getCityRoadPoint(segment: CityRoadSegment, t: number): { pos: Point2D; headingDeg: number } {
  const pts = segment.points;
  if (pts.length === 0) return { pos: { x: 0, y: 0 }, headingDeg: 0 };
  if (pts.length === 1) return { pos: pts[0], headingDeg: 0 };

  const clampedT = Math.max(0, Math.min(1, t));
  const numSegments = pts.length - 1;
  const segIndex = Math.min(Math.floor(clampedT * numSegments), numSegments - 1);
  const localT = (clampedT * numSegments) - segIndex;

  const a = pts[segIndex];
  const b = pts[segIndex + 1];

  const x = a.x + (b.x - a.x) * localT;
  const y = a.y + (b.y - a.y) * localT;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const radians = Math.atan2(dy, dx);
  const headingDeg = ((radians * 180) / Math.PI + 360) % 360;

  return { pos: { x, y }, headingDeg };
}

/**
 * Convert pixel world coordinates (x, y) to synthetic GNSS (lat, lng) for coordinator
 */
export function cityToGeo(x: number, y: number): { latitude: number; longitude: number } {
  const originLat = 17.7230;
  const originLng = 83.3055;
  const latScale = 0.000018; // approx 2 meters per pixel
  const lngScale = 0.000018;

  return {
    latitude: originLat - (y - WORLD_HEIGHT / 2) * latScale,
    longitude: originLng + (x - WORLD_WIDTH / 2) * lngScale,
  };
}

export function geoToCity(lat: number, lng: number): Point2D {
  const originLat = 17.7230;
  const originLng = 83.3055;
  const latScale = 0.000018;
  const lngScale = 0.000018;

  return {
    x: WORLD_WIDTH / 2 + (lng - originLng) / lngScale,
    y: WORLD_HEIGHT / 2 - (lat - originLat) / latScale,
  };
}

/**
 * Finds the closest point on any paved road segment in the metropolis, optionally aligned with desired heading
 */
export function findClosestCityRoad(
  x: number,
  y: number,
  desiredHeadingDeg?: number
): { road: CityRoadSegment; progress: number; point: Point2D; headingDeg: number } {
  let bestRoad = CITY_ROADS[0];
  let bestProgress = 0.5;
  let bestDist = Infinity;
  let bestPoint = { x: 0, y: 0 };
  let bestHeading = 0;

  for (const road of CITY_ROADS) {
    const samples = 20;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const rp = getCityRoadPoint(road, t);
      const dist = Math.hypot(rp.pos.x - x, rp.pos.y - y);

      let penalty = 0;
      if (desiredHeadingDeg !== undefined) {
        const angleDiff = Math.abs(((rp.headingDeg - desiredHeadingDeg + 540) % 360) - 180);
        penalty = angleDiff * 0.4;
      }

      const totalScore = dist + penalty;
      if (totalScore < bestDist) {
        bestDist = totalScore;
        bestRoad = road;
        bestProgress = t;
        bestPoint = rp.pos;
        bestHeading = rp.headingDeg;
      }
    }
  }

  return {
    road: bestRoad,
    progress: bestProgress,
    point: bestPoint,
    headingDeg: bestHeading,
  };
}
