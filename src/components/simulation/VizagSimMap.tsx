import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  VIZAG_NODES,
  VIZAG_EDGES,
  VIZAG_MAP_CENTER,
} from '../../modules/simulation/vizagGraph';
import {
  VizagSimCar,
  ProximityAlert,
} from '../../modules/simulation/vizagSimulation';
import { Locate, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

interface VizagSimMapProps {
  cars: VizagSimCar[];
  activeAlerts: ProximityAlert[];
  selectedCarId: string | null;
  onSelectCar: (carId: string) => void;
  heightClass?: string;
}

// Custom Leaflet Vehicle Marker Factory
function createCarIcon(car: VizagSimCar, isSelected: boolean, isWarning: boolean): L.DivIcon {
  const rotation = car.headingDeg;
  const pulseClass = isWarning ? 'animate-bounce' : '';
  const haloClass = isSelected ? 'ring-4 ring-cyan-400 ring-offset-2' : '';

  const html = `
    <div class="relative flex flex-col items-center select-none transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${pulseClass}" style="width: 80px;">
      <!-- Speed & Name Label Pill -->
      <div class="px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-lg border border-white/40 flex items-center gap-1 mb-1 whitespace-nowrap"
           style="background-color: ${car.color};">
        <span>${car.name}</span>
        <span class="opacity-90 font-mono text-[9px]">(${car.speedKmh.toFixed(0)}k)</span>
      </div>

      <!-- Vehicle Icon Chassis with Heading Arrow -->
      <div class="relative w-8 h-8 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white transition-transform ${haloClass}"
           style="background-color: ${car.color}; transform: rotate(${rotation}deg);">
        <!-- Car Front Light Nose -->
        <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-yellow-300 rounded-full shadow-sm"></div>
        <!-- Direction Arrow -->
        <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 19 21 12 17 5 21 12 2" fill="white"></polygon>
        </svg>
      </div>

      <!-- Active Warning Badge over car -->
      ${isWarning ? `
        <div class="absolute -top-2 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-lg border border-white animate-pulse">
          ⚠️
        </div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-car-marker',
    iconSize: [80, 50],
    iconAnchor: [40, 25],
  });
}

// Custom Warning Midpoint Badge
function createWarningMidpointIcon(alert: ProximityAlert): L.DivIcon {
  const html = `
    <div class="relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-600 text-white shadow-2xl border-2 border-white transform -translate-x-1/2 -translate-y-1/2 select-none animate-pulse">
      <span class="text-sm">⚠️</span>
      <div class="leading-none">
        <div class="text-[10px] font-black tracking-wide uppercase">PROXIMITY WARNING</div>
        <div class="text-[9px] font-mono opacity-90">${alert.carAName} ↔ ${alert.carBName} (${alert.distanceMeters}m)</div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'warning-midpoint-marker',
    iconSize: [180, 40],
    iconAnchor: [90, 20],
  });
}

// Camera Auto-Follower helper
const MapCameraTracker: React.FC<{ targetPosition: { latitude: number; longitude: number } | null }> = ({
  targetPosition,
}) => {
  const map = useMap();

  useEffect(() => {
    if (targetPosition) {
      map.panTo([targetPosition.latitude, targetPosition.longitude], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [targetPosition, map]);

  return null;
};

export const VizagSimMap: React.FC<VizagSimMapProps> = ({
  cars,
  activeAlerts,
  selectedCarId,
  onSelectCar,
  heightClass = 'h-[520px]',
}) => {
  const selectedCar = cars.find((c) => c.id === selectedCarId);
  const mapRef = useRef<L.Map | null>(null);

  const separatingCarIds = new Set<string>();
  activeAlerts.forEach((a) => {
    separatingCarIds.add(a.carAId);
    separatingCarIds.add(a.carBId);
  });

  return (
    <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 select-none`}>
      <MapContainer
        center={[VIZAG_MAP_CENTER.latitude, VIZAG_MAP_CENTER.longitude]}
        zoom={14}
        minZoom={12}
        maxZoom={18}
        zoomControl={false}
        className="w-full h-full"
        ref={mapRef}
      >
        {/* Clean OpenStreetMap base layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* ── 1. Render All Connected Visakhapatnam Road Network Edges ── */}
        {Object.values(VIZAG_EDGES).map((edge) => {
          const latLngs = edge.waypoints.map((w) => [w.latitude, w.longitude] as [number, number]);

          return (
            <React.Fragment key={edge.id}>
              {/* Outer Road Asphalt Casing */}
              <Polyline
                positions={latLngs}
                pathOptions={{
                  color: '#1e293b',
                  weight: 8,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Inner Road Surface */}
              <Polyline
                positions={latLngs}
                pathOptions={{
                  color: '#475569',
                  weight: 5,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                <Tooltip sticky direction="top" className="text-xs font-bold">
                  {edge.name} ({edge.speedLimitKmh} km/h limit)
                </Tooltip>
              </Polyline>
              {/* Center Line Dashes */}
              <Polyline
                positions={latLngs}
                pathOptions={{
                  color: '#fbbf24',
                  weight: 1.5,
                  dashArray: '6, 8',
                  opacity: 0.8,
                }}
              />
            </React.Fragment>
          );
        })}

        {/* ── 2. Render Intersection Nodes (Intersections where cars turn) ── */}
        {Object.values(VIZAG_NODES).map((node) => (
          <CircleMarker
            key={node.id}
            center={[node.position.latitude, node.position.longitude]}
            radius={5}
            pathOptions={{
              fillColor: '#38bdf8',
              fillOpacity: 1,
              color: '#0f172a',
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -5]} className="text-xs font-black">
              🚦 {node.name}
            </Tooltip>
          </CircleMarker>
        ))}

        {/* ── 3. Proximity Warning Lines Between Approaching Cars ── */}
        {activeAlerts.map((alert, idx) => {
          const cA = cars.find((c) => c.id === alert.carAId);
          const cB = cars.find((c) => c.id === alert.carBId);
          if (!cA || !cB) return null;

          return (
            <React.Fragment key={`alert-line-${idx}`}>
              {/* Hazard Line */}
              <Polyline
                positions={[
                  [cA.position.latitude, cA.position.longitude],
                  [cB.position.latitude, cB.position.longitude],
                ]}
                pathOptions={{
                  color: '#ef4444',
                  weight: 4,
                  dashArray: '8, 8',
                  opacity: 0.9,
                }}
              />
              {/* Midpoint Warning Symbol (⚠️) */}
              <Marker
                position={[alert.midpoint.latitude, alert.midpoint.longitude]}
                icon={createWarningMidpointIcon(alert)}
                interactive={false}
              />
            </React.Fragment>
          );
        })}

        {/* ── 4. Render Exactly 4 Cars on the Road Network ── */}
        {cars.map((car) => {
          const isSelected = car.id === selectedCarId;
          const isWarning = separatingCarIds.has(car.id);

          return (
            <Marker
              key={car.id}
              position={[car.position.latitude, car.position.longitude]}
              icon={createCarIcon(car, isSelected, isWarning)}
              eventHandlers={{
                click: () => onSelectCar(car.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -25]} className="text-xs font-bold">
                <div className="text-center">
                  <div className="font-black text-slate-900">{car.name}</div>
                  <div className="text-[10px] text-slate-600">{car.statusMessage}</div>
                  <div className="text-[10px] font-mono text-indigo-600 font-bold">{car.speedKmh.toFixed(0)} km/h</div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Camera Tracker */}
        {selectedCar && <MapCameraTracker targetPosition={selectedCar.position} />}
      </MapContainer>

      {/* Floating Map Controls & Overlays */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 text-white font-black text-xs shadow-xl border border-slate-700 backdrop-blur-md">
          <Navigation className="w-4 h-4 text-teal-400" />
          <span>Visakhapatnam Road Network Graph</span>
        </div>

        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          4 Cars (100% Road-Constrained)
        </span>
      </div>

      {/* Selected Car Quick Banner */}
      {selectedCar && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700 shadow-2xl text-white">
          <Locate className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-400">Tracking: </span>
            <span className="font-black" style={{ color: selectedCar.color }}>
              {selectedCar.name}
            </span>
            <span className="font-mono text-emerald-400 font-bold ml-1.5">
              {selectedCar.speedKmh.toFixed(0)} km/h
            </span>
          </div>
        </div>
      )}

      {/* Active Proximity Alert Overlay at Bottom of Map */}
      {activeAlerts.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-10 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="bg-red-950/95 backdrop-blur-md rounded-2xl border-2 border-red-500/80 shadow-2xl p-3 text-white">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-red-400">
                  ⚠️ ACTIVE PROXIMITY WARNING ({activeAlerts.length} Pair{activeAlerts.length > 1 ? 's' : ''})
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/30 text-red-200 border border-red-500/40 font-black">
                AUTOMATIC SAFETY RESPONSE ENGAGED
              </span>
            </div>

            <div className="space-y-1 mt-1">
              {activeAlerts.map((a, i) => (
                <div key={i} className="text-xs font-bold text-slate-200 flex items-center justify-between bg-black/40 px-2.5 py-1 rounded-xl">
                  <span>
                    🚗 <span className="text-amber-300 font-black">{a.carAName}</span> &{' '}
                    <span className="text-amber-300 font-black">{a.carBName}</span> approaching (<span className="text-red-400 font-mono font-black">{a.distanceMeters}m</span>)
                  </span>
                  <span className="text-[11px] text-cyan-300 font-mono italic">{a.solutionText}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
