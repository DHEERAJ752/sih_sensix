/**
 * Visakhapatnam (Vizag) Connected Road Network Graph
 *
 * Real GPS coordinates for major road corridors and connected multi-way intersections in Vizag.
 * Represented as a connected graph of Nodes (Intersections) and Edges (Road Segments).
 * All vehicle movement is mathematically constrained to graph edges.
 */

import { Coordinates } from '../../types/vehicle';
import { calculateHaversineDistance } from '../collision/geoMath';

export interface GraphNode {
  id: string;
  name: string;
  position: Coordinates;
  connectedEdgeIds: string[];
}

export interface GraphEdge {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  waypoints: Coordinates[];
  lengthMeters: number;
  speedLimitKmh: number;
  lanes: number;
}

// ── 1. Visakhapatnam Intersection Nodes ──────────────────────────────────────
export const VIZAG_NODES: Record<string, GraphNode> = {
  siripuram: {
    id: 'siripuram',
    name: 'Siripuram 5-Way Circle',
    position: { latitude: 17.7230, longitude: 83.3055 },
    connectedEdgeIds: [],
  },
  jagadamba: {
    id: 'jagadamba',
    name: 'Jagadamba Centre',
    position: { latitude: 17.7176, longitude: 83.3010 },
    connectedEdgeIds: [],
  },
  rk_beach: {
    id: 'rk_beach',
    name: 'RK Beach / Submarine Museum',
    position: { latitude: 17.7135, longitude: 83.3180 },
    connectedEdgeIds: [],
  },
  lawsons_bay: {
    id: 'lawsons_bay',
    name: 'Lawsons Bay Colony Junction',
    position: { latitude: 17.7275, longitude: 83.3320 },
    connectedEdgeIds: [],
  },
  mvp_colony: {
    id: 'mvp_colony',
    name: 'MVP Colony Double Road',
    position: { latitude: 17.7380, longitude: 83.3250 },
    connectedEdgeIds: [],
  },
  maddilapalem: {
    id: 'maddilapalem',
    name: 'Maddilapalem NH-16 Junction',
    position: { latitude: 17.7340, longitude: 83.3220 },
    connectedEdgeIds: [],
  },
  asilmetta: {
    id: 'asilmetta',
    name: 'Asilmetta Flyover Junction',
    position: { latitude: 17.7225, longitude: 83.2980 },
    connectedEdgeIds: [],
  },
  rtc_complex: {
    id: 'rtc_complex',
    name: 'RTC Complex / Dwaraka Nagar',
    position: { latitude: 17.7260, longitude: 83.2995 },
    connectedEdgeIds: [],
  },
  care_waltair: {
    id: 'care_waltair',
    name: 'Care Hospital / Waltair Uplands',
    position: { latitude: 17.7290, longitude: 83.3160 },
    connectedEdgeIds: [],
  },
  au_north_gate: {
    id: 'au_north_gate',
    name: 'AU Engineering North Gate',
    position: { latitude: 17.7300, longitude: 83.3210 },
    connectedEdgeIds: [],
  },
  au_in_circuit: {
    id: 'au_in_circuit',
    name: 'AU Campus In-Circle',
    position: { latitude: 17.7270, longitude: 83.3185 },
    connectedEdgeIds: [],
  },
  vip_road: {
    id: 'vip_road',
    name: 'VIP Road Junction',
    position: { latitude: 17.7210, longitude: 83.3025 },
    connectedEdgeIds: [],
  },
  maharanipeta: {
    id: 'maharanipeta',
    name: 'Maharanipeta / KGH Hospital',
    position: { latitude: 17.7110, longitude: 83.3040 },
    connectedEdgeIds: [],
  },
  collectorate: {
    id: 'collectorate',
    name: 'Collector Office Beach Link',
    position: { latitude: 17.7080, longitude: 83.3090 },
    connectedEdgeIds: [],
  },
  rk_beach_south: {
    id: 'rk_beach_south',
    name: 'RK Beach South (Novotel)',
    position: { latitude: 17.7020, longitude: 83.2980 },
    connectedEdgeIds: [],
  },
  kailasagiri_foothill: {
    id: 'kailasagiri_foothill',
    name: 'Kailasagiri Foothill (Tenneti Park)',
    position: { latitude: 17.7520, longitude: 83.3480 },
    connectedEdgeIds: [],
  },
  seethammadhara: {
    id: 'seethammadhara',
    name: 'Seethammadhara Junction',
    position: { latitude: 17.7420, longitude: 83.3100 },
    connectedEdgeIds: [],
  },
  gurudwara: {
    id: 'gurudwara',
    name: 'Gurudwara Junction',
    position: { latitude: 17.7330, longitude: 83.3050 },
    connectedEdgeIds: [],
  },
  dutt_island: {
    id: 'dutt_island',
    name: 'Dutt Island Circle',
    position: { latitude: 17.7205, longitude: 83.3020 },
    connectedEdgeIds: [],
  },
  pandurangapuram: {
    id: 'pandurangapuram',
    name: 'Pandurangapuram Beach Approach',
    position: { latitude: 17.7160, longitude: 83.3120 },
    connectedEdgeIds: [],
  },
};

// ── 2. Connected Road Edges ───────────────────────────────────────────────────
function computePolylineLength(waypoints: Coordinates[]): number {
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    total += calculateHaversineDistance(waypoints[i], waypoints[i + 1]);
  }
  return Math.max(50, Math.round(total));
}

const RAW_EDGES: Omit<GraphEdge, 'lengthMeters'>[] = [
  // 1. Siripuram <-> Care Waltair (Waltair Main Road)
  {
    id: 'siripuram_care',
    name: 'Waltair Main Road',
    fromNodeId: 'siripuram',
    toNodeId: 'care_waltair',
    waypoints: [
      { latitude: 17.7230, longitude: 83.3055 },
      { latitude: 17.7250, longitude: 83.3090 },
      { latitude: 17.7272, longitude: 83.3125 },
      { latitude: 17.7290, longitude: 83.3160 },
    ],
    speedLimitKmh: 45,
    lanes: 2,
  },
  // 2. Care Waltair <-> AU North Gate
  {
    id: 'care_au_gate',
    name: 'Waltair Uplands Link',
    fromNodeId: 'care_waltair',
    toNodeId: 'au_north_gate',
    waypoints: [
      { latitude: 17.7290, longitude: 83.3160 },
      { latitude: 17.7295, longitude: 83.3185 },
      { latitude: 17.7300, longitude: 83.3210 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 3. AU North Gate <-> Maddilapalem (AU Campus Road)
  {
    id: 'au_gate_maddilapalem',
    name: 'AU Campus Road',
    fromNodeId: 'au_north_gate',
    toNodeId: 'maddilapalem',
    waypoints: [
      { latitude: 17.7300, longitude: 83.3210 },
      { latitude: 17.7320, longitude: 83.3215 },
      { latitude: 17.7340, longitude: 83.3220 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 4. Maddilapalem <-> MVP Colony (MVP Main Road)
  {
    id: 'maddilapalem_mvp',
    name: 'MVP Main Road',
    fromNodeId: 'maddilapalem',
    toNodeId: 'mvp_colony',
    waypoints: [
      { latitude: 17.7340, longitude: 83.3220 },
      { latitude: 17.7360, longitude: 83.3235 },
      { latitude: 17.7380, longitude: 83.3250 },
    ],
    speedLimitKmh: 45,
    lanes: 2,
  },
  // 5. MVP Colony <-> Lawsons Bay (MVP Double Road Link)
  {
    id: 'mvp_lawsons',
    name: 'MVP Double Road Link',
    fromNodeId: 'mvp_colony',
    toNodeId: 'lawsons_bay',
    waypoints: [
      { latitude: 17.7380, longitude: 83.3250 },
      { latitude: 17.7345, longitude: 83.3280 },
      { latitude: 17.7310, longitude: 83.3305 },
      { latitude: 17.7275, longitude: 83.3320 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 6. Lawsons Bay <-> Kailasagiri Foothill (Beach Road North)
  {
    id: 'lawsons_kailasagiri',
    name: 'Beach Road North (Kailasagiri Link)',
    fromNodeId: 'lawsons_bay',
    toNodeId: 'kailasagiri_foothill',
    waypoints: [
      { latitude: 17.7275, longitude: 83.3320 },
      { latitude: 17.7350, longitude: 83.3370 },
      { latitude: 17.7440, longitude: 83.3425 },
      { latitude: 17.7520, longitude: 83.3480 },
    ],
    speedLimitKmh: 60,
    lanes: 2,
  },
  // 7. RK Beach <-> Lawsons Bay (Coastal Beach Road)
  {
    id: 'rk_beach_lawsons',
    name: 'Visakhapatnam Beach Road (Central)',
    fromNodeId: 'rk_beach',
    toNodeId: 'lawsons_bay',
    waypoints: [
      { latitude: 17.7135, longitude: 83.3180 },
      { latitude: 17.7180, longitude: 83.3225 },
      { latitude: 17.7225, longitude: 83.3270 },
      { latitude: 17.7275, longitude: 83.3320 },
    ],
    speedLimitKmh: 50,
    lanes: 2,
  },
  // 8. RK Beach South <-> Collectorate (Beach Road South)
  {
    id: 'rk_south_collectorate',
    name: 'RK Beach South Corridor',
    fromNodeId: 'rk_beach_south',
    toNodeId: 'collectorate',
    waypoints: [
      { latitude: 17.7020, longitude: 83.2980 },
      { latitude: 17.7050, longitude: 83.3035 },
      { latitude: 17.7080, longitude: 83.3090 },
    ],
    speedLimitKmh: 45,
    lanes: 2,
  },
  // 9. Collectorate <-> RK Beach (Coastal Beach Road)
  {
    id: 'collectorate_rk_beach',
    name: 'Beach Road (Submarine Museum Stretch)',
    fromNodeId: 'collectorate',
    toNodeId: 'rk_beach',
    waypoints: [
      { latitude: 17.7080, longitude: 83.3090 },
      { latitude: 17.7105, longitude: 83.3135 },
      { latitude: 17.7135, longitude: 83.3180 },
    ],
    speedLimitKmh: 50,
    lanes: 2,
  },
  // 10. Siripuram <-> Pandurangapuram (Beach Connection)
  {
    id: 'siripuram_pandurangapuram',
    name: 'Pandurangapuram Link Road',
    fromNodeId: 'siripuram',
    toNodeId: 'pandurangapuram',
    waypoints: [
      { latitude: 17.7230, longitude: 83.3055 },
      { latitude: 17.7195, longitude: 83.3085 },
      { latitude: 17.7160, longitude: 83.3120 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 11. Pandurangapuram <-> RK Beach
  {
    id: 'pandurangapuram_rk_beach',
    name: 'Submarine Museum Approach',
    fromNodeId: 'pandurangapuram',
    toNodeId: 'rk_beach',
    waypoints: [
      { latitude: 17.7160, longitude: 83.3120 },
      { latitude: 17.7145, longitude: 83.3150 },
      { latitude: 17.7135, longitude: 83.3180 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 12. Siripuram <-> Dutt Island
  {
    id: 'siripuram_dutt',
    name: 'VIP Road (North Section)',
    fromNodeId: 'siripuram',
    toNodeId: 'dutt_island',
    waypoints: [
      { latitude: 17.7230, longitude: 83.3055 },
      { latitude: 17.7218, longitude: 83.3038 },
      { latitude: 17.7205, longitude: 83.3020 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 13. Dutt Island <-> VIP Road Junction
  {
    id: 'dutt_vip',
    name: 'VIP Road Central',
    fromNodeId: 'dutt_island',
    toNodeId: 'vip_road',
    waypoints: [
      { latitude: 17.7205, longitude: 83.3020 },
      { latitude: 17.7210, longitude: 83.3025 },
    ],
    speedLimitKmh: 35,
    lanes: 2,
  },
  // 14. VIP Road <-> Asilmetta
  {
    id: 'vip_asilmetta',
    name: 'Asilmetta Link Road',
    fromNodeId: 'vip_road',
    toNodeId: 'asilmetta',
    waypoints: [
      { latitude: 17.7210, longitude: 83.3025 },
      { latitude: 17.7218, longitude: 83.3000 },
      { latitude: 17.7225, longitude: 83.2980 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 15. Asilmetta <-> RTC Complex
  {
    id: 'asilmetta_rtc',
    name: 'Dwaraka Nagar South',
    fromNodeId: 'asilmetta',
    toNodeId: 'rtc_complex',
    waypoints: [
      { latitude: 17.7225, longitude: 83.2980 },
      { latitude: 17.7242, longitude: 83.2988 },
      { latitude: 17.7260, longitude: 83.2995 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 16. RTC Complex <-> Gurudwara
  {
    id: 'rtc_gurudwara',
    name: 'Dwaraka Nagar Main Road',
    fromNodeId: 'rtc_complex',
    toNodeId: 'gurudwara',
    waypoints: [
      { latitude: 17.7260, longitude: 83.2995 },
      { latitude: 17.7295, longitude: 83.3022 },
      { latitude: 17.7330, longitude: 83.3050 },
    ],
    speedLimitKmh: 45,
    lanes: 2,
  },
  // 17. Gurudwara <-> Seethammadhara
  {
    id: 'gurudwara_seethammadhara',
    name: 'Seethammadhara North Road',
    fromNodeId: 'gurudwara',
    toNodeId: 'seethammadhara',
    waypoints: [
      { latitude: 17.7330, longitude: 83.3050 },
      { latitude: 17.7375, longitude: 83.3075 },
      { latitude: 17.7420, longitude: 83.3100 },
    ],
    speedLimitKmh: 45,
    lanes: 2,
  },
  // 18. Seethammadhara <-> Maddilapalem
  {
    id: 'seethammadhara_maddilapalem',
    name: 'National Highway 16 Connector',
    fromNodeId: 'seethammadhara',
    toNodeId: 'maddilapalem',
    waypoints: [
      { latitude: 17.7420, longitude: 83.3100 },
      { latitude: 17.7380, longitude: 83.3160 },
      { latitude: 17.7340, longitude: 83.3220 },
    ],
    speedLimitKmh: 55,
    lanes: 2,
  },
  // 19. Asilmetta <-> Jagadamba
  {
    id: 'asilmetta_jagadamba',
    name: 'Jagadamba Commercial Link',
    fromNodeId: 'asilmetta',
    toNodeId: 'jagadamba',
    waypoints: [
      { latitude: 17.7225, longitude: 83.2980 },
      { latitude: 17.7200, longitude: 83.2995 },
      { latitude: 17.7176, longitude: 83.3010 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 20. Jagadamba <-> Maharanipeta
  {
    id: 'jagadamba_maharanipeta',
    name: 'KGH Hospital Road',
    fromNodeId: 'jagadamba',
    toNodeId: 'maharanipeta',
    waypoints: [
      { latitude: 17.7176, longitude: 83.3010 },
      { latitude: 17.7145, longitude: 83.3025 },
      { latitude: 17.7110, longitude: 83.3040 },
    ],
    speedLimitKmh: 35,
    lanes: 2,
  },
  // 21. Maharanipeta <-> Collectorate
  {
    id: 'maharanipeta_collectorate',
    name: 'Maharanipeta Beach Approach',
    fromNodeId: 'maharanipeta',
    toNodeId: 'collectorate',
    waypoints: [
      { latitude: 17.7110, longitude: 83.3040 },
      { latitude: 17.7095, longitude: 83.3065 },
      { latitude: 17.7080, longitude: 83.3090 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 22. Siripuram <-> Jagadamba (Direct City Artery)
  {
    id: 'siripuram_jagadamba',
    name: 'Siripuram – Jagadamba Artery',
    fromNodeId: 'siripuram',
    toNodeId: 'jagadamba',
    waypoints: [
      { latitude: 17.7230, longitude: 83.3055 },
      { latitude: 17.7202, longitude: 83.3032 },
      { latitude: 17.7176, longitude: 83.3010 },
    ],
    speedLimitKmh: 45,
    lanes: 2,
  },
  // 23. Care Waltair <-> AU In-Campus Circuit
  {
    id: 'care_au_circuit',
    name: 'AU South Gate Link',
    fromNodeId: 'care_waltair',
    toNodeId: 'au_in_circuit',
    waypoints: [
      { latitude: 17.7290, longitude: 83.3160 },
      { latitude: 17.7280, longitude: 83.3172 },
      { latitude: 17.7270, longitude: 83.3185 },
    ],
    speedLimitKmh: 35,
    lanes: 2,
  },
  // 24. AU In-Campus Circuit <-> Siripuram
  {
    id: 'au_circuit_siripuram',
    name: 'AU Main Campus Road',
    fromNodeId: 'au_in_circuit',
    toNodeId: 'siripuram',
    waypoints: [
      { latitude: 17.7270, longitude: 83.3185 },
      { latitude: 17.7250, longitude: 83.3120 },
      { latitude: 17.7230, longitude: 83.3055 },
    ],
    speedLimitKmh: 40,
    lanes: 2,
  },
  // 25. Maddilapalem <-> Siripuram (BRTS Express Artery)
  {
    id: 'maddilapalem_siripuram',
    name: 'BRTS Express Artery (Maddilapalem – Siripuram)',
    fromNodeId: 'maddilapalem',
    toNodeId: 'siripuram',
    waypoints: [
      { latitude: 17.7340, longitude: 83.3220 },
      { latitude: 17.7285, longitude: 83.3135 },
      { latitude: 17.7230, longitude: 83.3055 },
    ],
    speedLimitKmh: 50,
    lanes: 2,
  },
];

// Initialize Graph with bidirectional edge bindings
export const VIZAG_EDGES: Record<string, GraphEdge> = {};

RAW_EDGES.forEach((raw) => {
  const lengthMeters = computePolylineLength(raw.waypoints);
  const edge: GraphEdge = { ...raw, lengthMeters };
  VIZAG_EDGES[edge.id] = edge;

  // Bind to nodes
  if (VIZAG_NODES[edge.fromNodeId]) {
    VIZAG_NODES[edge.fromNodeId].connectedEdgeIds.push(edge.id);
  }
  if (VIZAG_NODES[edge.toNodeId]) {
    VIZAG_NODES[edge.toNodeId].connectedEdgeIds.push(edge.id);
  }
});

// ── 3. Helper Functions for Road-Constrained Kinematics ───────────────────────

/**
 * Calculates exact latitude, longitude, and heading angle at progress fraction t [0..1]
 * Direction: 1 = from fromNode to toNode; -1 = from toNode to fromNode
 */
export function getEdgePoint(
  edgeId: string,
  progress: number,
  direction: 1 | -1 = 1
): { position: Coordinates; headingDeg: number } {
  const edge = VIZAG_EDGES[edgeId];
  if (!edge) {
    return { position: { latitude: 17.7230, longitude: 83.3055 }, headingDeg: 0 };
  }

  const pts = edge.waypoints;
  if (pts.length === 0) {
    return { position: { latitude: 17.7230, longitude: 83.3055 }, headingDeg: 0 };
  }
  if (pts.length === 1) {
    return { position: pts[0], headingDeg: 0 };
  }

  // Handle direction
  const effectiveProgress = direction === 1 ? progress : 1.0 - progress;
  const clampedProgress = Math.max(0, Math.min(1, effectiveProgress));

  const numSegments = pts.length - 1;
  const segIndex = Math.min(Math.floor(clampedProgress * numSegments), numSegments - 1);
  const localT = (clampedProgress * numSegments) - segIndex;

  const a = pts[segIndex];
  const b = pts[segIndex + 1];

  const latitude = a.latitude + (b.latitude - a.latitude) * localT;
  const longitude = a.longitude + (b.longitude - a.longitude) * localT;

  const dLat = b.latitude - a.latitude;
  const dLng = b.longitude - a.longitude;
  let radians = Math.atan2(dLng, dLat);
  let headingDeg = ((radians * 180) / Math.PI + 360) % 360;

  if (direction === -1) {
    headingDeg = (headingDeg + 180) % 360;
  }

  return { position: { latitude, longitude }, headingDeg };
}

/**
 * Gets all valid outgoing road choices from an intersection node
 */
export interface AvailableTurnOption {
  edgeId: string;
  edgeName: string;
  targetNodeId: string;
  targetNodeName: string;
  isUTurn: boolean;
  headingDeg: number;
}

export function getAvailableTurnsAtNode(
  nodeId: string,
  currentEdgeId: string
): AvailableTurnOption[] {
  const node = VIZAG_NODES[nodeId];
  if (!node) return [];

  const options: AvailableTurnOption[] = [];

  node.connectedEdgeIds.forEach((eId) => {
    const edge = VIZAG_EDGES[eId];
    if (!edge) return;

    const isUTurn = eId === currentEdgeId;
    const targetNodeId = edge.fromNodeId === nodeId ? edge.toNodeId : edge.fromNodeId;
    const targetNode = VIZAG_NODES[targetNodeId];

    // Initial heading leaving this node
    const direction: 1 | -1 = edge.fromNodeId === nodeId ? 1 : -1;
    const point = getEdgePoint(eId, 0.05, direction);

    options.push({
      edgeId: eId,
      edgeName: edge.name,
      targetNodeId,
      targetNodeName: targetNode ? targetNode.name : targetNodeId,
      isUTurn,
      headingDeg: point.headingDeg,
    });
  });

  return options;
}

/**
 * Default Center of Vizag map
 */
export const VIZAG_MAP_CENTER: Coordinates = {
  latitude: 17.7230,
  longitude: 83.3055,
};
