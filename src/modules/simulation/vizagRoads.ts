/**
 * Visakhapatnam Road Network & Multi-Way Junction Models
 * Real GPS coordinates for major road corridors and 5-6 road intersections in Vizag.
 */

import { Coordinates } from '../../types/vehicle';

export interface RoadSegment {
  id: string;
  name: string;
  waypoints: Coordinates[];
  speedLimitKmh: number;
}

export interface JunctionModel {
  id: string;
  name: string;
  center: Coordinates;
  description: string;
  approachArms: {
    armName: string;
    startPoint: Coordinates;
    headingToCenterDeg: number;
    distanceMeters: number;
  }[];
}

/** Real road waypoints along major Vizag corridors */
export const VIZAG_ROADS: RoadSegment[] = [
  {
    id: 'beach-road',
    name: 'Beach Road (RK Beach to Lawsons Bay)',
    speedLimitKmh: 50,
    waypoints: [
      { latitude: 17.7011, longitude: 83.2976 }, // RK Beach Hotel area
      { latitude: 17.7048, longitude: 83.2989 }, // INS Circars Junction
      { latitude: 17.7085, longitude: 83.3005 }, // Rushikonda turn
      { latitude: 17.7120, longitude: 83.3021 }, // Lawsons Bay Colony
      { latitude: 17.7158, longitude: 83.3045 }, // Dolphins Nose approach
    ],
  },
  {
    id: 'rushikonda-coast',
    name: 'Rushikonda IT Coastal Expressway',
    speedLimitKmh: 60,
    waypoints: [
      { latitude: 17.7650, longitude: 83.3600 }, // Sagar Nagar
      { latitude: 17.7720, longitude: 83.3700 }, // Rushikonda Beach South
      { latitude: 17.7810, longitude: 83.3820 }, // IT SEZ Curve
      { latitude: 17.7890, longitude: 83.3910 }, // Gitam University Gate
      { latitude: 17.7950, longitude: 83.3980 }, // Bheemili Road Link
    ],
  },
  {
    id: 'mvp-double-road',
    name: 'MVP Double Road',
    speedLimitKmh: 40,
    waypoints: [
      { latitude: 17.7325, longitude: 83.3126 }, // MVP Colony top
      { latitude: 17.7295, longitude: 83.3102 },
      { latitude: 17.7265, longitude: 83.3078 },
      { latitude: 17.7230, longitude: 83.3055 }, // Siripuram signal
      { latitude: 17.7200, longitude: 83.3030 },
    ],
  },
  {
    id: 'waltair-au-circuit',
    name: 'Waltair Uplands & AU Campus Circuit',
    speedLimitKmh: 35,
    waypoints: [
      { latitude: 17.7290, longitude: 83.3160 }, // Care Hospital Waltair
      { latitude: 17.7265, longitude: 83.3120 }, // AU Engineering North Gate
      { latitude: 17.7230, longitude: 83.3055 }, // Siripuram Junction
      { latitude: 17.7210, longitude: 83.3020 }, // Dutt Island
      { latitude: 17.7180, longitude: 83.2980 }, // Asilmetta Link
    ],
  },
  {
    id: 'dwaraka-nagar',
    name: 'Dwaraka Nagar Road',
    speedLimitKmh: 40,
    waypoints: [
      { latitude: 17.7319, longitude: 83.3050 }, // Dwaraka Nagar
      { latitude: 17.7290, longitude: 83.3025 },
      { latitude: 17.7260, longitude: 83.3000 },
      { latitude: 17.7225, longitude: 83.2975 },
      { latitude: 17.7190, longitude: 83.2950 }, // Jagadamba Centre
    ],
  },
  {
    id: 'nh16-bypass',
    name: 'NH-16 Bypass (Gajuwaka Direction)',
    speedLimitKmh: 60,
    waypoints: [
      { latitude: 17.6907, longitude: 83.2209 }, // Gajuwaka Junction
      { latitude: 17.6948, longitude: 83.2250 },
      { latitude: 17.6995, longitude: 83.2300 },
      { latitude: 17.7040, longitude: 83.2350 },
      { latitude: 17.7080, longitude: 83.2400 }, // Steel Plant area
    ],
  },
  {
    id: 'jagadamba-to-rk',
    name: 'Jagadamba Rd → RK Beach',
    speedLimitKmh: 45,
    waypoints: [
      { latitude: 17.7176, longitude: 83.3010 }, // Jagadamba Centre
      { latitude: 17.7150, longitude: 83.3020 },
      { latitude: 17.7120, longitude: 83.3025 },
      { latitude: 17.7090, longitude: 83.3010 }, // Towards beach
      { latitude: 17.7050, longitude: 83.2992 }, // RK Beach South
    ],
  },
  {
    id: 'steel-plant-road',
    name: 'Steel Plant Road',
    speedLimitKmh: 50,
    waypoints: [
      { latitude: 17.6870, longitude: 83.2150 }, // Steel Plant Gate 1
      { latitude: 17.6910, longitude: 83.2185 },
      { latitude: 17.6950, longitude: 83.2220 },
      { latitude: 17.6990, longitude: 83.2260 },
      { latitude: 17.7030, longitude: 83.2300 }, // NH bypass merge
    ],
  },
  {
    id: 'rtc-complex',
    name: 'RTC Complex – One Town',
    speedLimitKmh: 35,
    waypoints: [
      { latitude: 17.6980, longitude: 83.2985 }, // One Town
      { latitude: 17.7010, longitude: 83.3000 },
      { latitude: 17.7040, longitude: 83.3010 },
      { latitude: 17.7075, longitude: 83.3025 }, // Near RTC Bus Stand
      { latitude: 17.7110, longitude: 83.3040 }, // Towards Jagadamba
    ],
  },
];

/** City center for default map view: Visakhapatnam */
export const VIZAG_CENTER: Coordinates = {
  latitude: 17.7230,
  longitude: 83.3055,
};

/** Visakhapatnam High-Density Multi-Way Junctions with up to 8 approach vectors */
export const VIZAG_JUNCTIONS: JunctionModel[] = [
  {
    id: 'siripuram-5way',
    name: 'Siripuram 5-Way Mega Junction & Roundabout',
    center: { latitude: 17.7230, longitude: 83.3055 },
    description: 'Bustling 6-8 vehicle convergence between Waltair Main Rd, AU Gate, Dutt Island, VIP Rd, Beach Road, and Asilmetta.',
    approachArms: [
      { armName: 'Waltair Main Rd (North)', startPoint: { latitude: 17.7262, longitude: 83.3068 }, headingToCenterDeg: 205, distanceMeters: 380 },
      { armName: 'AU Engineering Gate (East)', startPoint: { latitude: 17.7238, longitude: 83.3095 }, headingToCenterDeg: 255, distanceMeters: 410 },
      { armName: 'Beach Rd Approach (South-East)', startPoint: { latitude: 17.7202, longitude: 83.3078 }, headingToCenterDeg: 320, distanceMeters: 370 },
      { armName: 'Dutt Island / VIP Rd (South-West)', startPoint: { latitude: 17.7198, longitude: 83.3025 }, headingToCenterDeg: 42, distanceMeters: 420 },
      { armName: 'Asilmetta Link (West)', startPoint: { latitude: 17.7235, longitude: 83.3012 }, headingToCenterDeg: 95, distanceMeters: 450 },
      { armName: 'Maddilapalem Flyover (North-West)', startPoint: { latitude: 17.7260, longitude: 83.3032 }, headingToCenterDeg: 140, distanceMeters: 390 },
      { armName: 'Governor Bungalow Rd (North-North-East)', startPoint: { latitude: 17.7272, longitude: 83.3082 }, headingToCenterDeg: 215, distanceMeters: 480 },
      { armName: 'Pandurangapuram Lane (South-South-West)', startPoint: { latitude: 17.7185, longitude: 83.3045 }, headingToCenterDeg: 15, distanceMeters: 460 },
    ],
  },
  {
    id: 'jagadamba-6way',
    name: 'Jagadamba Commercial 6-Way Crossroad',
    center: { latitude: 17.7176, longitude: 83.3010 },
    description: 'High-density commercial crossing with 6-8 converging approaches from Dwaraka Nagar, RTC Complex, Poorna Market, and Beach Link.',
    approachArms: [
      { armName: 'Dwaraka Nagar (North)', startPoint: { latitude: 17.7215, longitude: 83.3015 }, headingToCenterDeg: 190, distanceMeters: 420 },
      { armName: 'Siripuram Rd (North-East)', startPoint: { latitude: 17.7202, longitude: 83.3042 }, headingToCenterDeg: 230, distanceMeters: 410 },
      { armName: 'Beach Link Rd (East)', startPoint: { latitude: 17.7170, longitude: 83.3055 }, headingToCenterDeg: 275, distanceMeters: 440 },
      { armName: 'Poorna Market Rd (South)', startPoint: { latitude: 17.7138, longitude: 83.3005 }, headingToCenterDeg: 8, distanceMeters: 390 },
      { armName: 'RTC Bus Stand Approach (West)', startPoint: { latitude: 17.7168, longitude: 83.2965 }, headingToCenterDeg: 80, distanceMeters: 460 },
      { armName: 'One Town Old Post (South-West)', startPoint: { latitude: 17.7145, longitude: 83.2980 }, headingToCenterDeg: 45, distanceMeters: 430 },
      { armName: 'Chitralaya Road (North-West)', startPoint: { latitude: 17.7200, longitude: 83.2985 }, headingToCenterDeg: 150, distanceMeters: 380 },
      { armName: 'Maharanipeta Hospital Approach (South-East)', startPoint: { latitude: 17.7140, longitude: 83.3035 }, headingToCenterDeg: 335, distanceMeters: 450 },
    ],
  },
  {
    id: 'maddilapalem-nh',
    name: 'Maddilapalem NH-16 Mega Convergence',
    center: { latitude: 17.7340, longitude: 83.3220 },
    description: 'High-speed highway junction crossing BRTS express corridor, AU campus north gate, and National Highway 16.',
    approachArms: [
      { armName: 'NH-16 Anandapuram (North)', startPoint: { latitude: 17.7380, longitude: 83.3235 }, headingToCenterDeg: 200, distanceMeters: 450 },
      { armName: 'Health City / Hanumanthawaka (East)', startPoint: { latitude: 17.7352, longitude: 83.3270 }, headingToCenterDeg: 260, distanceMeters: 480 },
      { armName: 'MVP Colony Main Arm (South-East)', startPoint: { latitude: 17.7305, longitude: 83.3248 }, headingToCenterDeg: 330, distanceMeters: 420 },
      { armName: 'Siripuram City Corridor (South-West)', startPoint: { latitude: 17.7305, longitude: 83.3185 }, headingToCenterDeg: 40, distanceMeters: 490 },
      { armName: 'RTC Complex BRTS (West)', startPoint: { latitude: 17.7335, longitude: 83.3168 }, headingToCenterDeg: 85, distanceMeters: 510 },
      { armName: 'Resapuvanipalem Lane (North-West)', startPoint: { latitude: 17.7370, longitude: 83.3190 }, headingToCenterDeg: 135, distanceMeters: 430 },
      { armName: 'Isukathota Flyover (North-East)', startPoint: { latitude: 17.7375, longitude: 83.3262 }, headingToCenterDeg: 225, distanceMeters: 470 },
      { armName: 'Pithapuram Colony (South)', startPoint: { latitude: 17.7295, longitude: 83.3215 }, headingToCenterDeg: 5, distanceMeters: 490 },
    ],
  },
  {
    id: 'rushikonda-curve-junction',
    name: 'Rushikonda IT Coastal Convergence',
    center: { latitude: 17.7810, longitude: 83.3820 },
    description: 'High-speed coastal curve with 6-8 vehicles converging at 50-75 km/h along winding hills and seaside roads.',
    approachArms: [
      { armName: 'Gitam University North (North)', startPoint: { latitude: 17.7880, longitude: 83.3890 }, headingToCenterDeg: 220, distanceMeters: 490 },
      { armName: 'Rushikonda Beach South (South-West)', startPoint: { latitude: 17.7740, longitude: 83.3720 }, headingToCenterDeg: 45, distanceMeters: 520 },
      { armName: 'Hill No. 2 IT SEZ (West)', startPoint: { latitude: 17.7830, longitude: 83.3740 }, headingToCenterDeg: 110, distanceMeters: 460 },
      { armName: 'Rushikonda Bay View (East)', startPoint: { latitude: 17.7800, longitude: 83.3895 }, headingToCenterDeg: 280, distanceMeters: 430 },
      { armName: 'Endada Valley Link (South-East)', startPoint: { latitude: 17.7760, longitude: 83.3850 }, headingToCenterDeg: 340, distanceMeters: 470 },
      { armName: 'Thimmapuram Bypass (North-West)', startPoint: { latitude: 17.7865, longitude: 83.3780 }, headingToCenterDeg: 145, distanceMeters: 440 },
    ],
  },
];

/** Get a point at fraction t along a road segment (0=start, 1=end) */
export function getPointOnRoad(road: RoadSegment, t: number): Coordinates {
  const pts = road.waypoints;
  if (pts.length === 0) return pts[0];
  if (t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];

  const idx = Math.floor(t * (pts.length - 1));
  const localT = (t * (pts.length - 1)) - idx;
  const a = pts[idx];
  const b = pts[Math.min(idx + 1, pts.length - 1)];

  return {
    latitude: a.latitude + (b.latitude - a.latitude) * localT,
    longitude: a.longitude + (b.longitude - a.longitude) * localT,
  };
}

/** Heading (degrees) of road at fraction t */
export function getRoadHeading(road: RoadSegment, t: number): number {
  const pts = road.waypoints;
  const idx = Math.min(Math.floor(t * (pts.length - 1)), pts.length - 2);
  const a = pts[idx];
  const b = pts[idx + 1];
  const dLat = b.latitude - a.latitude;
  const dLng = b.longitude - a.longitude;
  const radians = Math.atan2(dLng, dLat);
  return ((radians * 180) / Math.PI + 360) % 360;
}
