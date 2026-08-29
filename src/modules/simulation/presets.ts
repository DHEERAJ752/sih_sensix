import { Coordinates } from '../../types/vehicle';
import { VIZAG_ROADS, VIZAG_CENTER, RoadSegment } from './vizagRoads';
import { CITY_ROADS, cityToGeo, getCityRoadPoint, CityRoadSegment } from './customCity';

export interface ScenarioVehicleInit {
  id: string;
  name: string;
  driverType: 'normal' | 'emergency';
  color: string;
  position: Coordinates;
  speedKmh: number;
  headingDeg: number;
  isDegraded?: boolean;
  isNetworkLost?: boolean;
  road?: RoadSegment;
  cityRoad?: CityRoadSegment;
  roadProgress?: number;
  roadDirection?: 1 | -1;
  pixelPos?: { x: number; y: number };
}

export interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  vehicles: ScenarioVehicleInit[];
  autoRunDurationSec?: number;
  instructions: string;
  locationName?: string;
  isCustomCity?: boolean;
}

export const DEFAULT_MAP_CENTER: Coordinates = VIZAG_CENTER;

export const PRESET_SCENARIOS: PresetScenario[] = [
  // ── Custom Metropolis 15-Car Game Scenarios ──────────────────────────────
  {
    id: 'metropolis-mega-15car-rush',
    name: '15-Vehicle Metropolis Rush Hour Swarm',
    badge: '15-Car Mega Swarm',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-300',
    description: '15 vehicles simultaneously cruise across the 4-lane expressway, level-2 flyovers, suspension bridge, and 5-way roundabout with graceful collision aversion.',
    instructions: 'Observe continuous high-throughput collision negotiation ($210\\text{ vector pairs/cycle}$) with graceful lateral lane separations and speed harmonization.',
    locationName: 'U-COP Grand Metropolis Grid',
    isCustomCity: true,
    vehicles: [
      { id: 'car-a', name: 'Car Alpha (Player)', driverType: 'normal', color: '#2563eb', position: cityToGeo(350, 1200), pixelPos: { x: 350, y: 1200 }, speedKmh: 55, headingDeg: 90, cityRoad: CITY_ROADS[0], roadProgress: 0.08, roadDirection: 1 },
      { id: 'car-b', name: 'Car Beta (Oncoming)', driverType: 'normal', color: '#d97706', position: cityToGeo(2800, 1140), pixelPos: { x: 2800, y: 1140 }, speedKmh: 52, headingDeg: 270, cityRoad: CITY_ROADS[1], roadProgress: 0.1, roadDirection: 1 },
      { id: 'car-c', name: 'Car Gamma (Expressway)', driverType: 'normal', color: '#10b981', position: cityToGeo(950, 1200), pixelPos: { x: 950, y: 1200 }, speedKmh: 60, headingDeg: 90, cityRoad: CITY_ROADS[0], roadProgress: 0.3, roadDirection: 1 },
      { id: 'car-d', name: 'Car Delta (Bridge Span)', driverType: 'normal', color: '#8b5cf6', position: cityToGeo(1600, 1200), pixelPos: { x: 1600, y: 1200 }, speedKmh: 48, headingDeg: 90, cityRoad: CITY_ROADS[0], roadProgress: 0.52, roadDirection: 1 },
      { id: 'car-e', name: 'Car Epsilon (Downtown Exp)', driverType: 'normal', color: '#06b6d4', position: cityToGeo(900, 400), pixelPos: { x: 900, y: 400 }, speedKmh: 50, headingDeg: 180, cityRoad: CITY_ROADS[2], roadProgress: 0.15, roadDirection: 1 },
      { id: 'car-f', name: 'Car Zeta (Skyline Flyover)', driverType: 'normal', color: '#f59e0b', position: cityToGeo(880, 850), pixelPos: { x: 880, y: 850 }, speedKmh: 65, headingDeg: 180, cityRoad: CITY_ROADS[4], roadProgress: 0.2, roadDirection: 1 },
      { id: 'car-g', name: 'Car Eta (Flyover North)', driverType: 'normal', color: '#ec4899', position: cityToGeo(860, 1450), pixelPos: { x: 860, y: 1450 }, speedKmh: 65, headingDeg: 0, cityRoad: CITY_ROADS[5], roadProgress: 0.1, roadDirection: 1 },
      { id: 'car-h', name: 'Car Theta (Roundabout)', driverType: 'normal', color: '#14b8a6', position: cityToGeo(2300, 600), pixelPos: { x: 2300, y: 600 }, speedKmh: 35, headingDeg: 90, cityRoad: CITY_ROADS[6], roadProgress: 0.05, roadDirection: 1 },
      { id: 'car-i', name: 'Car Iota (Roundabout East)', driverType: 'normal', color: '#6366f1', position: cityToGeo(2500, 800), pixelPos: { x: 2500, y: 800 }, speedKmh: 35, headingDeg: 180, cityRoad: CITY_ROADS[6], roadProgress: 0.28, roadDirection: 1 },
      { id: 'car-j', name: 'Car Kappa (Roundabout South)', driverType: 'normal', color: '#84cc16', position: cityToGeo(2300, 1000), pixelPos: { x: 2300, y: 1000 }, speedKmh: 35, headingDeg: 270, cityRoad: CITY_ROADS[6], roadProgress: 0.52, roadDirection: 1 },
      { id: 'car-k', name: 'Car Lambda (Roundabout West)', driverType: 'normal', color: '#a855f7', position: cityToGeo(2100, 800), pixelPos: { x: 2100, y: 800 }, speedKmh: 35, headingDeg: 0, cityRoad: CITY_ROADS[6], roadProgress: 0.76, roadDirection: 1 },
      { id: 'car-l', name: 'Car Mu (Clover Loop)', driverType: 'normal', color: '#f43f5e', position: cityToGeo(960, 1200), pixelPos: { x: 960, y: 1200 }, speedKmh: 42, headingDeg: 135, cityRoad: CITY_ROADS[7], roadProgress: 0.15, roadDirection: 1 },
      { id: 'car-m', name: 'Car Nu (Service East)', driverType: 'normal', color: '#0284c7', position: cityToGeo(2950, 1200), pixelPos: { x: 2950, y: 1200 }, speedKmh: 32, headingDeg: 135, cityRoad: CITY_ROADS[9], roadProgress: 0.2, roadDirection: 1 },
      { id: 'car-n', name: 'Car Xi (Westbound Hwy)', driverType: 'normal', color: '#eab308', position: cityToGeo(2100, 1140), pixelPos: { x: 2100, y: 1140 }, speedKmh: 56, headingDeg: 270, cityRoad: CITY_ROADS[1], roadProgress: 0.4, roadDirection: 1 },
      { id: 'car-emergency', name: 'Metropolis 108 Ambulance (Priority)', driverType: 'emergency', color: '#dc2626', position: cityToGeo(2300, 1950), pixelPos: { x: 2300, y: 1950 }, speedKmh: 82, headingDeg: 0, cityRoad: CITY_ROADS[12], roadProgress: 0.15, roadDirection: 1 },
    ],
  },
  {
    id: 'metropolis-dual-ambulance-14car',
    name: 'Dual 108 Sirens Emergency Corridor (14 Cars)',
    badge: '14-Car Dual Sirens',
    badgeColor: 'bg-red-100 text-red-700 border-red-300',
    description: 'Two 108 Emergency Ambulances race down the main avenues at 80 km/h while 12 civilian cars gracefully part to the road shoulders.',
    instructions: 'Watch civilian vehicles execute bilateral YIELD_LEFT and YIELD_RIGHT maneuvers to open green waves for both ambulances.',
    locationName: 'Hospital Trauma Emergency Grid',
    isCustomCity: true,
    vehicles: [
      { id: 'car-a', name: 'Car Alpha (Player)', driverType: 'normal', color: '#2563eb', position: cityToGeo(2300, 1400), pixelPos: { x: 2300, y: 1400 }, speedKmh: 42, headingDeg: 180, cityRoad: CITY_ROADS[11], roadProgress: 0.3, roadDirection: 1 },
      { id: 'car-b', name: 'Car Beta', driverType: 'normal', color: '#d97706', position: cityToGeo(2300, 1600), pixelPos: { x: 2300, y: 1600 }, speedKmh: 40, headingDeg: 180, cityRoad: CITY_ROADS[11], roadProgress: 0.45, roadDirection: 1 },
      { id: 'car-c', name: 'Car Gamma', driverType: 'normal', color: '#10b981', position: cityToGeo(2250, 1700), pixelPos: { x: 2250, y: 1700 }, speedKmh: 40, headingDeg: 0, cityRoad: CITY_ROADS[12], roadProgress: 0.35, roadDirection: 1 },
      { id: 'car-d', name: 'Car Delta', driverType: 'normal', color: '#8b5cf6', position: cityToGeo(2250, 1450), pixelPos: { x: 2250, y: 1450 }, speedKmh: 38, headingDeg: 0, cityRoad: CITY_ROADS[12], roadProgress: 0.55, roadDirection: 1 },
      { id: 'car-e', name: 'Car Epsilon', driverType: 'normal', color: '#06b6d4', position: cityToGeo(1100, 1200), pixelPos: { x: 1100, y: 1200 }, speedKmh: 55, headingDeg: 90, cityRoad: CITY_ROADS[0], roadProgress: 0.35, roadDirection: 1 },
      { id: 'car-f', name: 'Car Zeta', driverType: 'normal', color: '#f59e0b', position: cityToGeo(1500, 1200), pixelPos: { x: 1500, y: 1200 }, speedKmh: 50, headingDeg: 90, cityRoad: CITY_ROADS[0], roadProgress: 0.48, roadDirection: 1 },
      { id: 'car-g', name: 'Car Eta', driverType: 'normal', color: '#ec4899', position: cityToGeo(2100, 1140), pixelPos: { x: 2100, y: 1140 }, speedKmh: 52, headingDeg: 270, cityRoad: CITY_ROADS[1], roadProgress: 0.4, roadDirection: 1 },
      { id: 'car-h', name: 'Car Theta', driverType: 'normal', color: '#14b8a6', position: cityToGeo(900, 800), pixelPos: { x: 900, y: 800 }, speedKmh: 48, headingDeg: 180, cityRoad: CITY_ROADS[2], roadProgress: 0.35, roadDirection: 1 },
      { id: 'car-i', name: 'Car Iota', driverType: 'normal', color: '#6366f1', position: cityToGeo(840, 1600), pixelPos: { x: 840, y: 1600 }, speedKmh: 50, headingDeg: 0, cityRoad: CITY_ROADS[3], roadProgress: 0.3, roadDirection: 1 },
      { id: 'car-j', name: 'Car Kappa', driverType: 'normal', color: '#84cc16', position: cityToGeo(2300, 700), pixelPos: { x: 2300, y: 700 }, speedKmh: 35, headingDeg: 90, cityRoad: CITY_ROADS[6], roadProgress: 0.1, roadDirection: 1 },
      { id: 'car-k', name: 'Car Lambda', driverType: 'normal', color: '#a855f7', position: cityToGeo(2440, 940), pixelPos: { x: 2440, y: 940 }, speedKmh: 33, headingDeg: 225, cityRoad: CITY_ROADS[6], roadProgress: 0.4, roadDirection: 1 },
      { id: 'car-l', name: 'Car Mu', driverType: 'normal', color: '#f43f5e', position: cityToGeo(880, 1100), pixelPos: { x: 880, y: 1100 }, speedKmh: 65, headingDeg: 180, cityRoad: CITY_ROADS[4], roadProgress: 0.4, roadDirection: 1 },
      { id: 'car-emergency-1', name: 'Metropolis 108 Ambulance A', driverType: 'emergency', color: '#dc2626', position: cityToGeo(2300, 2100), pixelPos: { x: 2300, y: 2100 }, speedKmh: 82, headingDeg: 0, cityRoad: CITY_ROADS[12], roadProgress: 0.05, roadDirection: 1 },
      { id: 'car-emergency-2', name: 'Metropolis 108 Ambulance B', driverType: 'emergency', color: '#b91c1c', position: cityToGeo(500, 1200), pixelPos: { x: 500, y: 1200 }, speedKmh: 80, headingDeg: 90, cityRoad: CITY_ROADS[0], roadProgress: 0.12, roadDirection: 1 },
    ],
  },
  {
    id: 'metropolis-skyline-flyover',
    name: 'Skyline Elevated Flyover & Cloverleaf (10 Cars)',
    badge: 'Multi-Tier Flyover',
    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    description: 'High-speed multi-tier interchange with elevated flyovers crossing over ground highways and cloverleaf loop ramps.',
    instructions: 'Watch vehicles merge onto flyovers and execute speed harmonization at interchange merges.',
    locationName: 'Level 2 Skyline Overpass & Cloverleaf',
    isCustomCity: true,
    vehicles: [
      { id: 'car-a', name: 'Car Alpha (Player)', driverType: 'normal', color: '#2563eb', position: cityToGeo(880, 800), pixelPos: { x: 880, y: 800 }, speedKmh: 65, headingDeg: 180, cityRoad: CITY_ROADS[4], roadProgress: 0.1, roadDirection: 1 },
      { id: 'car-b', name: 'Car Beta (Overpass North)', driverType: 'normal', color: '#d97706', position: cityToGeo(860, 1500), pixelPos: { x: 860, y: 1500 }, speedKmh: 65, headingDeg: 0, cityRoad: CITY_ROADS[5], roadProgress: 0.1, roadDirection: 1 },
      { id: 'car-c', name: 'Car Gamma (Ground Hwy)', driverType: 'normal', color: '#10b981', position: cityToGeo(600, 1200), pixelPos: { x: 600, y: 1200 }, speedKmh: 60, headingDeg: 90, cityRoad: CITY_ROADS[0], roadProgress: 0.2, roadDirection: 1 },
      { id: 'car-d', name: 'Car Delta (Clover Loop)', driverType: 'normal', color: '#8b5cf6', position: cityToGeo(960, 1200), pixelPos: { x: 960, y: 1200 }, speedKmh: 42, headingDeg: 135, cityRoad: CITY_ROADS[7], roadProgress: 0.15, roadDirection: 1 },
      { id: 'car-e', name: 'Car Epsilon (Ground Hwy WB)', driverType: 'normal', color: '#06b6d4', position: cityToGeo(1200, 1140), pixelPos: { x: 1200, y: 1140 }, speedKmh: 58, headingDeg: 270, cityRoad: CITY_ROADS[1], roadProgress: 0.6, roadDirection: 1 },
      { id: 'car-f', name: 'Car Zeta (South Clover)', driverType: 'normal', color: '#f59e0b', position: cityToGeo(780, 1140), pixelPos: { x: 780, y: 1140 }, speedKmh: 40, headingDeg: 225, cityRoad: CITY_ROADS[8], roadProgress: 0.15, roadDirection: 1 },
      { id: 'car-g', name: 'Car Eta (Downtown SB)', driverType: 'normal', color: '#ec4899', position: cityToGeo(900, 1600), pixelPos: { x: 900, y: 1600 }, speedKmh: 50, headingDeg: 180, cityRoad: CITY_ROADS[2], roadProgress: 0.7, roadDirection: 1 },
      { id: 'car-h', name: 'Car Theta', driverType: 'normal', color: '#14b8a6', position: cityToGeo(840, 1000), pixelPos: { x: 840, y: 1000 }, speedKmh: 52, headingDeg: 0, cityRoad: CITY_ROADS[3], roadProgress: 0.6, roadDirection: 1 },
      { id: 'car-i', name: 'Car Iota', driverType: 'normal', color: '#6366f1', position: cityToGeo(2300, 600), pixelPos: { x: 2300, y: 600 }, speedKmh: 35, headingDeg: 90, cityRoad: CITY_ROADS[6], roadProgress: 0.05, roadDirection: 1 },
      { id: 'car-emergency', name: 'Metropolis 108 Ambulance', driverType: 'emergency', color: '#dc2626', position: cityToGeo(880, 600), pixelPos: { x: 880, y: 600 }, speedKmh: 82, headingDeg: 180, cityRoad: CITY_ROADS[4], roadProgress: 0.05, roadDirection: 1 },
    ],
  },
  {
    id: 'vizag-beach-head-on',
    name: 'Beach Road Coastline Corridor (2 Cars)',
    badge: 'Head-On 2-Car',
    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    description: 'Direct head-on collision path along coastal road with bilateral keep-left avoidance.',
    instructions: 'Observe vehicles execute cooperative left lane evasion and stopping.',
    locationName: 'Beach Road Corridor',
    isCustomCity: false,
    vehicles: [
      { id: 'car-a', name: 'Car Alpha (Player)', driverType: 'normal', color: '#2563eb', position: { latitude: 17.7050, longitude: 83.2989 }, speedKmh: 38, headingDeg: 28, road: VIZAG_ROADS[0], roadProgress: 0.25, roadDirection: 1 },
      { id: 'car-b', name: 'Car Beta (Approaching)', driverType: 'normal', color: '#d97706', position: { latitude: 17.7085, longitude: 83.3005 }, speedKmh: 38, headingDeg: 208, road: VIZAG_ROADS[0], roadProgress: 0.55, roadDirection: -1 },
    ],
  },
];

/**
 * Dynamically spawns up to 15-18 vehicles randomly across valid road segments in the custom metropolis
 */
export function generateRandomMetropolisTraffic(vehicleCount: number = 15): PresetScenario {
  const count = Math.max(6, Math.min(18, vehicleCount));
  const scenarioId = `metropolis-swarm-${Date.now()}`;

  const vehicleConfigs: ScenarioVehicleInit[] = [];
  const greekLetters = [
    'Alpha (Player)', 'Beta', 'Gamma', 'Delta', 'Epsilon',
    'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
    'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron',
    'Pi', 'Rho', '108 Ambulance'
  ];
  const palette = [
    '#2563eb', '#d97706', '#10b981', '#8b5cf6', '#06b6d4',
    '#f59e0b', '#ec4899', '#14b8a6', '#6366f1', '#84cc16',
    '#a855f7', '#f43f5e', '#0284c7', '#eab308', '#10b981',
    '#ec4899', '#3b82f6', '#dc2626'
  ];

  for (let i = 0; i < count; i++) {
    const isSelf = i === 0;
    const isEmergency = i === count - 1;
    const road = CITY_ROADS[i % CITY_ROADS.length];
    const progress = (0.05 + (i * 0.14)) % 0.92;
    const roadPoint = getCityRoadPoint(road, progress);

    vehicleConfigs.push({
      id: isSelf ? 'car-a' : isEmergency ? 'car-emergency' : `car-${String.fromCharCode(98 + i)}`,
      name: isEmergency ? 'Metropolis 108 Ambulance (Priority)' : `Car ${greekLetters[i] || (i + 1)}`,
      driverType: isEmergency ? 'emergency' : 'normal',
      color: isEmergency ? '#dc2626' : palette[i] || '#6366f1',
      position: cityToGeo(roadPoint.pos.x, roadPoint.pos.y),
      pixelPos: roadPoint.pos,
      speedKmh: isEmergency ? 80 : 40 + Math.floor(Math.random() * 25),
      headingDeg: Math.round(roadPoint.headingDeg),
      cityRoad: road,
      roadProgress: progress,
      roadDirection: 1,
    });
  }

  return {
    id: scenarioId,
    name: `Custom Metropolis Swarm (${count} Vehicles)`,
    badge: `${count}-Car Mega Swarm`,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: `Dynamic ${count}-vehicle simulation running across highways, elevated flyovers, suspension bridges, and roundabouts in the custom metropolis.`,
    instructions: `All ${count} vehicles are locked to paved road splines with zero off-road movement. Central Coordinator negotiates collision avoidance in real time.`,
    locationName: 'U-COP Grand Metropolis',
    isCustomCity: true,
    vehicles: vehicleConfigs,
  };
}

export function generateRandomVizagTraffic(vehicleCount: number = 15): PresetScenario {
  return generateRandomMetropolisTraffic(vehicleCount);
}
