import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { Coordinates, VehicleState } from '../../types/vehicle';
import { Locate, Layers, Compass, Shield, Radio, Maximize2 } from 'lucide-react';

interface LiveMapProps {
  centerOverride?: Coordinates;
  zoomLevel?: number;
  heightClass?: string;
  showControls?: boolean;
}

// ─── SVG-based vehicle icon builder with Maneuver HUD & Selection Glow ───
function buildVehicleIconHtml(
  name: string,
  headingDeg: number,
  speedKmh: number,
  color: string,
  riskColor: string,
  isEmergency: boolean,
  isStale: boolean,
  isSelf: boolean,
  isSelected: boolean,
  maneuverLabel?: string
): string {
  const emoji = isEmergency ? '🚑' : '🚗';
  const size = isSelected ? 42 : isSelf ? 36 : 30;
  const opacity = isStale ? 0.5 : 1;

  // Maneuver pill banner on top
  const isManeuvering = maneuverLabel && !maneuverLabel.includes('CRUISING') && !maneuverLabel.includes('STOPPED');
  const maneuverPill = isManeuvering
    ? `<div style="position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:#dc2626;color:white;font-size:8.5px;font-weight:900;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.4);animation:pulse 1s infinite;border:1px solid #fca5a5">${maneuverLabel}</div>`
    : isSelected
    ? `<div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:#4338ca;color:#ffffff;font-size:8.5px;font-weight:900;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px rgba(67,56,202,0.5);border:1.5px solid #a5b4fc">🎯 TRACKED: ${name.substring(0, 8)}</div>`
    : '';

  // Glowing Selection Halo
  const selectedHalo = isSelected
    ? `<circle cx="18" cy="18" r="17.5" fill="none" stroke="#6366f1" stroke-width="4" stroke-dasharray="4,2" opacity="0.95"/>
       <circle cx="18" cy="18" r="21" fill="none" stroke="#818cf8" stroke-width="1.5" opacity="0.6"/>`
    : riskColor !== color
    ? `<circle cx="18" cy="18" r="16" fill="none" stroke="${riskColor}" stroke-width="3.5" opacity="0.9"/>`
    : '';

  return `<div style="position:relative;width:${size + 28}px;height:${size + 32}px;display:flex;align-items:center;justify-content:center;opacity:${opacity};cursor:pointer">
    ${maneuverPill}
    <!-- Heading arrow -->
    <div style="position:absolute;top:-3px;left:50%;transform:translateX(-50%) rotate(${headingDeg}deg);transform-origin:center bottom;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:15px solid ${color};filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35))"></div>
    <!-- Vehicle circle -->
    <svg width="${size}" height="${size}" viewBox="0 0 36 36" style="position:absolute;top:10px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3))">
      <circle cx="18" cy="18" r="17" fill="${color}"/>
      ${selectedHalo}
      <circle cx="18" cy="18" r="15" fill="${color}"/>
      <text x="18" y="23" text-anchor="middle" font-size="14">${emoji}</text>
    </svg>
    <!-- Speed tag -->
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.92);color:white;font-family:monospace;font-size:9.5px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;border:1px solid rgba(255,255,255,0.15)">
      ${name.substring(0, 6)} · ${speedKmh.toFixed(0)}k
    </div>
  </div>`;
}

function fitMapToFleet(
  map: L.Map,
  positions: [number, number][]
): void {
  if (positions.length === 0) return;
  if (positions.length === 1) {
    map.panTo(positions[0], { animate: true, duration: 0.25, easeLinearity: 0.25 });
    return;
  }
  const bounds = L.latLngBounds(positions);
  map.fitBounds(bounds.pad(0.35), { animate: true, maxZoom: 18, duration: 0.35 });
}

export const LiveMap: React.FC<LiveMapProps> = ({
  centerOverride,
  zoomLevel = 17,
  heightClass = 'h-[540px]',
  showControls = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const safetyCirclesRef = useRef<Map<string, L.Circle>>(new Map());
  const projectedPathsRef = useRef<Map<string, L.Polyline>>(new Map());
  const cpaMarkersRef = useRef<L.Marker[]>([]);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const tripBreadcrumbRef = useRef<L.Polyline | null>(null);

  const lastPosRef = useRef<Map<string, [number, number, number, number]>>(new Map());
  const lastPanRef = useRef<[number, number]>([0, 0]);

  const followModeRef = useRef<'selected-car' | 'fit-fleet' | 'free'>('selected-car');
  const [followMode, _setFollowMode] = useState<'selected-car' | 'fit-fleet' | 'free'>('selected-car');
  const setFollowMode = (mode: 'selected-car' | 'fit-fleet' | 'free') => {
    followModeRef.current = mode;
    _setFollowMode(mode);
  };

  const [showSafetyRadii, setShowSafetyRadii] = useState(true);
  const [showProjectedPaths, setShowProjectedPaths] = useState(true);
  const [mapLayerType, setMapLayerType] = useState<'streets' | 'satellite'>('streets');
  const userInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    selfTelemetry,
    remoteVehicles,
    collisionMetrics,
    activeRoute,
    activeTrip,
    highestRiskLevel,
    simVehicles,
    selectedSimVehicleId,
    setSelectedSimVehicleId,
  } = useApp();

  // Switch to selected-car tracking automatically when user selects a car
  useEffect(() => {
    setFollowMode('selected-car');
  }, [selectedSimVehicleId]);

  // ── 1. Initialize Leaflet Map with Smooth Physics ─────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = [
      centerOverride?.latitude ?? selfTelemetry.latitude,
      centerOverride?.longitude ?? selfTelemetry.longitude,
    ];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      renderer: L.canvas(),
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
      inertia: true,
      inertiaDeceleration: 3000,
    });

    const tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 20,
        subdomains: 'abcd',
        keepBuffer: 4,
        updateWhenIdle: false,
        updateWhenZooming: false,
        errorTileUrl:
          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="%23f8fafc"/></svg>',
      }
    );
    tileLayer.on('tileerror', () => {});
    tileLayer.addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const onUserInteraction = () => {
      setFollowMode('free');
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
      userInteractionTimeoutRef.current = setTimeout(() => {
        // Resume auto follow after 5s of user idle
        setFollowMode('selected-car');
      }, 5000);
    };

    map.on('dragstart', onUserInteraction);
    map.on('zoomstart', onUserInteraction);

    mapInstanceRef.current = map;

    return () => {
      if (userInteractionTimeoutRef.current) clearTimeout(userInteractionTimeoutRef.current);
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ── 2. Tile Layer swap ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.eachLayer((layer) => { if (layer instanceof L.TileLayer) map.removeLayer(layer); });

    const url = mapLayerType === 'streets'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const newLayer = L.tileLayer(url, { maxZoom: 19, keepBuffer: 4 });
    newLayer.on('tileerror', () => {});
    newLayer.addTo(map);
  }, [mapLayerType]);

  // ── 3. Render Loop with rAF ───────────────────────────────────────────────
  const renderScheduledRef = useRef(false);

  const scheduleRender = useCallback(() => {
    if (renderScheduledRef.current) return;
    renderScheduledRef.current = true;
    requestAnimationFrame(() => {
      renderScheduledRef.current = false;
      doRender();
    });
  }, []);

  const selfTelemetryRef = useRef(selfTelemetry);
  const remoteVehiclesRef = useRef(remoteVehicles);
  const collisionMetricsRef = useRef(collisionMetrics);
  const highestRiskRef = useRef(highestRiskLevel);
  const showSafetyRadiiRef = useRef(showSafetyRadii);
  const showProjectedPathsRef = useRef(showProjectedPaths);
  const simVehiclesRef = useRef(simVehicles);
  const selectedVehicleIdRef = useRef(selectedSimVehicleId);

  useEffect(() => { selfTelemetryRef.current = selfTelemetry; scheduleRender(); }, [selfTelemetry, scheduleRender]);
  useEffect(() => { remoteVehiclesRef.current = remoteVehicles; scheduleRender(); }, [remoteVehicles, scheduleRender]);
  useEffect(() => { collisionMetricsRef.current = collisionMetrics; scheduleRender(); }, [collisionMetrics, scheduleRender]);
  useEffect(() => { highestRiskRef.current = highestRiskLevel; }, [highestRiskLevel]);
  useEffect(() => { showSafetyRadiiRef.current = showSafetyRadii; scheduleRender(); }, [showSafetyRadii, scheduleRender]);
  useEffect(() => { showProjectedPathsRef.current = showProjectedPaths; scheduleRender(); }, [showProjectedPaths, scheduleRender]);
  useEffect(() => { simVehiclesRef.current = simVehicles; scheduleRender(); }, [simVehicles, scheduleRender]);
  useEffect(() => { selectedVehicleIdRef.current = selectedSimVehicleId; scheduleRender(); }, [selectedSimVehicleId, scheduleRender]);

  function doRender() {
    const map = mapInstanceRef.current;
    if (!map) return;

    const self = selfTelemetryRef.current;
    const others = remoteVehiclesRef.current;
    const metrics = collisionMetricsRef.current;
    const riskLevel = highestRiskRef.current;
    const showRadii = showSafetyRadiiRef.current;
    const simList = simVehiclesRef.current;
    const currentSelectedId = selectedVehicleIdRef.current;

    const allPositions: [number, number][] = [];
    let selectedPos: [number, number] = [self.latitude, self.longitude];

    // ── Render Self (Car Alpha) ─────────────────────────────────────────────
    const selfPos: [number, number] = [self.latitude, self.longitude];
    allPositions.push(selfPos);

    const isSelfSelected = currentSelectedId === 'car-a' || currentSelectedId === self.id;
    if (isSelfSelected) selectedPos = selfPos;

    const selfSim = simList.find(v => v.id === 'car-a');
    const selfManeuver = selfSim?.activeManeuverLabel;

    const selfLast = lastPosRef.current.get('self');
    const selfMoved = !selfLast
      || Math.abs(selfLast[0] - self.latitude) > 0.000005
      || Math.abs(selfLast[1] - self.longitude) > 0.000005
      || Math.abs(selfLast[2] - self.headingDeg) > 0.5
      || Math.abs(selfLast[3] - self.speedKmh) > 0.5
      || isSelfSelected;

    if (selfMoved) {
      lastPosRef.current.set('self', [self.latitude, self.longitude, self.headingDeg, self.speedKmh]);

      const riskBorderColor = riskLevel === 'CRITICAL' ? '#ef4444' : riskLevel === 'CAUTION' ? '#f59e0b' : '#2563eb';
      const selfIconHtml = buildVehicleIconHtml(
        self.name, self.headingDeg, self.speedKmh,
        self.driverType === 'emergency' ? '#dc2626' : '#2563eb',
        riskBorderColor, self.driverType === 'emergency', false, true, isSelfSelected, selfManeuver
      );

      let selfMarker = markersRef.current.get('self');
      if (!selfMarker) {
        const icon = L.divIcon({ html: selfIconHtml, className: '', iconSize: [64, 64], iconAnchor: [32, 32] });
        selfMarker = L.marker(selfPos, { icon, zIndexOffset: isSelfSelected ? 3000 : 1000 }).addTo(map);
        selfMarker.on('click', () => setSelectedSimVehicleId('car-a'));
        markersRef.current.set('self', selfMarker);
      } else {
        selfMarker.setLatLng(selfPos);
        const icon = L.divIcon({ html: selfIconHtml, className: '', iconSize: [64, 64], iconAnchor: [32, 32] });
        selfMarker.setIcon(icon);
        selfMarker.setZIndexOffset(isSelfSelected ? 3000 : 1000);
      }

      if (showRadii) {
        const selfRadiusMeters = metrics[0]?.safetyRadiusMeters || 8.0;
        const circleColor = riskLevel === 'CRITICAL' ? '#ef4444' : riskLevel === 'CAUTION' ? '#f59e0b' : '#3b82f6';
        let selfCircle = safetyCirclesRef.current.get('self');
        if (!selfCircle) {
          selfCircle = L.circle(selfPos, { radius: selfRadiusMeters, color: circleColor, fillColor: circleColor, fillOpacity: 0.1, weight: 2, dashArray: '5,5' }).addTo(map);
          safetyCirclesRef.current.set('self', selfCircle);
        } else {
          selfCircle.setLatLng(selfPos);
          selfCircle.setRadius(selfRadiusMeters);
          selfCircle.setStyle({ color: circleColor, fillColor: circleColor });
        }
      } else {
        const c = safetyCirclesRef.current.get('self');
        if (c) { map.removeLayer(c); safetyCirclesRef.current.delete('self'); }
      }
    }

    // ── Render Remote Vehicles (Fleet) ──────────────────────────────────────
    const activeIds = new Set<string>();

    for (const vehicle of others) {
      if (vehicle.id === self.id) continue;
      activeIds.add(vehicle.id);

      const vPos: [number, number] = [vehicle.latitude, vehicle.longitude];
      allPositions.push(vPos);

      const isThisSelected = currentSelectedId === vehicle.id;
      if (isThisSelected) selectedPos = vPos;

      const simInst = simList.find(v => v.id === vehicle.id);
      const maneuver = simInst?.activeManeuverLabel;

      const vLast = lastPosRef.current.get(vehicle.id);
      const vMoved = !vLast
        || Math.abs(vLast[0] - vehicle.latitude) > 0.000005
        || Math.abs(vLast[1] - vehicle.longitude) > 0.000005
        || Math.abs(vLast[2] - vehicle.headingDeg) > 0.5
        || Math.abs(vLast[3] - vehicle.speedKmh) > 0.5
        || isThisSelected;

      if (vMoved) {
        lastPosRef.current.set(vehicle.id, [vehicle.latitude, vehicle.longitude, vehicle.headingDeg, vehicle.speedKmh]);
        const metric = metrics.find((m) => m.targetVehicleId === vehicle.id);
        const risk = metric?.riskLevel || 'SAFE';
        const baseColor = (vehicle as VehicleState).color || (vehicle.driverType === 'emergency' ? '#dc2626' : '#d97706');
        const riskBorderColor = risk === 'CRITICAL' ? '#ef4444' : risk === 'CAUTION' ? '#f59e0b' : baseColor;
        const isStale = (vehicle as VehicleState).isStale || false;

        const vIconHtml = buildVehicleIconHtml(vehicle.name, vehicle.headingDeg, vehicle.speedKmh, baseColor, riskBorderColor, vehicle.driverType === 'emergency', isStale, false, isThisSelected, maneuver);
        const icon = L.divIcon({ html: vIconHtml, className: '', iconSize: [60, 64], iconAnchor: [30, 32] });

        let marker = markersRef.current.get(vehicle.id);
        if (!marker) {
          marker = L.marker(vPos, { icon, zIndexOffset: isThisSelected ? 3000 : 800 }).addTo(map);
          marker.on('click', () => setSelectedSimVehicleId(vehicle.id));
          markersRef.current.set(vehicle.id, marker);
        } else {
          marker.setLatLng(vPos);
          marker.setIcon(icon);
          marker.setZIndexOffset(isThisSelected ? 3000 : 800);
        }

        if (showRadii) {
          const remoteRadius = metric?.safetyRadiusMeters || 7.0;
          const circleColor = risk === 'CRITICAL' ? '#ef4444' : risk === 'CAUTION' ? '#f59e0b' : baseColor;
          let circle = safetyCirclesRef.current.get(vehicle.id);
          if (!circle) {
            circle = L.circle(vPos, { radius: remoteRadius, color: circleColor, fillColor: circleColor, fillOpacity: 0.08, weight: 1.5, dashArray: '4,4' }).addTo(map);
            safetyCirclesRef.current.set(vehicle.id, circle);
          } else {
            circle.setLatLng(vPos);
            circle.setRadius(remoteRadius);
            circle.setStyle({ color: circleColor, fillColor: circleColor });
          }
        } else {
          const c = safetyCirclesRef.current.get(vehicle.id);
          if (c) { map.removeLayer(c); safetyCirclesRef.current.delete(vehicle.id); }
        }
      }
    }

    markersRef.current.forEach((m, id) => {
      if (id !== 'self' && !activeIds.has(id)) {
        map.removeLayer(m); markersRef.current.delete(id); lastPosRef.current.delete(id);
      }
    });
    safetyCirclesRef.current.forEach((c, id) => {
      if (id !== 'self' && !activeIds.has(id)) {
        map.removeLayer(c); safetyCirclesRef.current.delete(id);
      }
    });

    // ── Camera Tracking with Smooth Interpolation ───────────────────────────
    const mode = followModeRef.current;
    if (mode === 'selected-car') {
      const [prevLat, prevLng] = lastPanRef.current;
      const movedEnough =
        Math.abs(prevLat - selectedPos[0]) > 0.00001 ||
        Math.abs(prevLng - selectedPos[1]) > 0.00001;

      if (movedEnough) {
        lastPanRef.current = selectedPos;
        map.panTo(selectedPos, { animate: true, duration: 0.2, easeLinearity: 0.25, noMoveStart: true });
      }
    } else if (mode === 'fit-fleet') {
      fitMapToFleet(map, allPositions);
    }
  }

  // ── 4. Projected Trajectories & CPA markers ───────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    cpaMarkersRef.current.forEach((m) => map.removeLayer(m));
    cpaMarkersRef.current = [];

    if (!showProjectedPaths) {
      projectedPathsRef.current.forEach((p) => map.removeLayer(p));
      projectedPathsRef.current.clear();
      return;
    }

    const currentPathKeys = new Set<string>();

    collisionMetrics.forEach((metric) => {
      const isRisk = metric.riskLevel === 'CRITICAL' || metric.riskLevel === 'CAUTION';

      const updatePath = (key: string, coords: Coordinates[], color: string) => {
        if (coords.length < 2) return;
        currentPathKeys.add(key);
        const latlngs: [number, number][] = coords.map((p) => [p.latitude, p.longitude]);
        let line = projectedPathsRef.current.get(key);
        if (!line) {
          line = L.polyline(latlngs, { color, weight: 2.5, dashArray: '6,5', opacity: 0.8 }).addTo(map);
          projectedPathsRef.current.set(key, line);
        } else {
          line.setLatLngs(latlngs);
          line.setStyle({ color });
        }
      };

      updatePath(`proj-self-${metric.targetVehicleId}`, metric.projectedPathSelf, isRisk ? '#ef4444' : '#6366f1');
      updatePath(`proj-target-${metric.targetVehicleId}`, metric.projectedPathTarget, isRisk ? '#f97316' : '#f59e0b');

      if (isRisk && metric.timeToCPASec > 0 && metric.timeToCPASec < 8) {
        const cpaPos: [number, number] = [metric.cpaPointSelf.latitude, metric.cpaPointSelf.longitude];
        const cpaHtml = `<div style="position:relative;display:flex;align-items:center;justify-content:center">
          <div style="width:14px;height:14px;background:#dc2626;border-radius:50%;border:2px solid white;box-shadow:0 0 8px #dc262688"></div>
          <div style="position:absolute;top:-20px;background:#1e1b4b;color:white;font-size:9px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;font-family:monospace">
            ⚠ ${metric.cpaDistanceMeters}m · ${metric.timeToCPASec}s
          </div>
        </div>`;
        const cpaIcon = L.divIcon({ html: cpaHtml, className: '', iconSize: [14, 14], iconAnchor: [7, 7] });
        const m = L.marker(cpaPos, { icon: cpaIcon, zIndexOffset: 2000 }).addTo(map);
        cpaMarkersRef.current.push(m);
      }
    });

    projectedPathsRef.current.forEach((p, key) => {
      if (!currentPathKeys.has(key)) { map.removeLayer(p); projectedPathsRef.current.delete(key); }
    });
  }, [collisionMetrics, showProjectedPaths]);

  // ── 5. Navigation route ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (activeRoute && activeRoute.polyline.length > 1) {
      const latlngs: [number, number][] = activeRoute.polyline.map((p) => [p.latitude, p.longitude]);
      if (!routePolylineRef.current) {
        routePolylineRef.current = L.polyline(latlngs, { color: '#4f46e5', weight: 5, opacity: 0.9, lineJoin: 'round' }).addTo(map);
      } else {
        routePolylineRef.current.setLatLngs(latlngs);
      }
    } else if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
  }, [activeRoute]);

  // ── 6. Trip breadcrumb ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (activeTrip && activeTrip.routePoints.length > 1) {
      const latlngs: [number, number][] = activeTrip.routePoints.map((p) => [p.latitude, p.longitude]);
      if (!tripBreadcrumbRef.current) {
        tripBreadcrumbRef.current = L.polyline(latlngs, { color: '#10b981', weight: 3, opacity: 0.7, dashArray: '3,5' }).addTo(map);
      } else {
        tripBreadcrumbRef.current.setLatLngs(latlngs);
      }
    } else if (tripBreadcrumbRef.current) {
      map.removeLayer(tripBreadcrumbRef.current);
      tripBreadcrumbRef.current = null;
    }
  }, [activeTrip]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setFollowMode('fit-fleet');
    const self = selfTelemetryRef.current;
    const others = remoteVehiclesRef.current;
    const all = [[self.latitude, self.longitude] as [number, number], ...others.map(v => [v.latitude, v.longitude] as [number, number])];
    fitMapToFleet(map, all);
  };

  const handleFocusSelected = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setFollowMode('selected-car');
    const simList = simVehiclesRef.current;
    const target = simList.find(v => v.id === selectedSimVehicleId) || selfTelemetryRef.current;
    map.flyTo([target.latitude, target.longitude], 18, { duration: 0.3 });
  };

  const selectedVehicleObj = simVehicles.find(v => v.id === selectedSimVehicleId);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-100`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Follow Mode Badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-md border ${
          followMode === 'selected-car'
            ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300/40'
            : followMode === 'fit-fleet'
            ? 'bg-slate-900 text-white border-slate-800'
            : 'bg-white/90 text-slate-700 border-slate-200'
        }`}>
          <Locate className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
          {followMode === 'selected-car'
            ? `Tracking: ${selectedVehicleObj?.name || 'Selected Car'}`
            : followMode === 'fit-fleet'
            ? `Junction Fleet View (${simVehicles.length} Cars)`
            : 'Free Cam (Move Map)'}
        </div>
      </div>

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button
            onClick={handleFocusSelected}
            title="Lock & Track Selected Vehicle"
            className={`p-2.5 rounded-xl shadow-md border transition flex items-center justify-center ${
              followMode === 'selected-car'
                ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400/40'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Locate className="w-5 h-5" />
          </button>

          <button
            onClick={handleRecenter}
            title="Frame All Junction Vehicles"
            className={`p-2.5 rounded-xl shadow-md border transition flex items-center justify-center ${
              followMode === 'fit-fleet'
                ? 'bg-indigo-600 text-white border-indigo-700'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowSafetyRadii((prev) => !prev)}
            title="Toggle Safety Radii"
            className={`p-2.5 rounded-xl shadow-md border transition flex items-center justify-center ${
              showSafetyRadii ? 'bg-white text-indigo-600 border-indigo-200' : 'bg-white/70 text-slate-400 border-slate-200'
            }`}
          >
            <Shield className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowProjectedPaths((prev) => !prev)}
            title="Toggle Trajectory Vectors"
            className={`p-2.5 rounded-xl shadow-md border transition flex items-center justify-center ${
              showProjectedPaths ? 'bg-white text-indigo-600 border-indigo-200' : 'bg-white/70 text-slate-400 border-slate-200'
            }`}
          >
            <Radio className="w-5 h-5" />
          </button>

          <button
            onClick={() => setMapLayerType((prev) => (prev === 'streets' ? 'satellite' : 'streets'))}
            title="Toggle Map Style"
            className="p-2.5 rounded-xl shadow-md border bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50 transition flex items-center justify-center"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Speed / Heading HUD */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-lg">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400">Tracked Target</span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-2xs"
              style={{ backgroundColor: selectedVehicleObj?.color || '#2563eb' }}
            />
            <span className="text-xs font-black text-indigo-900 truncate max-w-[110px]">
              {selectedVehicleObj?.name || 'Car Alpha'}
            </span>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-slate-200 mx-1" />

        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400">Speed</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black text-slate-900 font-mono">
              {(selectedVehicleObj?.speedKmh ?? selfTelemetry.speedKmh).toFixed(0)}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">km/h</span>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-slate-200 mx-1" />

        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400">Heading</span>
          <div className="flex items-center gap-1">
            <Compass
              className="w-3.5 h-3.5 text-indigo-600"
              style={{ transform: `rotate(${selectedVehicleObj?.headingDeg ?? selfTelemetry.headingDeg}deg)`, transition: 'transform 0.2s ease' }}
            />
            <span className="text-xs font-bold text-slate-800 font-mono">
              {(selectedVehicleObj?.headingDeg ?? selfTelemetry.headingDeg).toFixed(0)}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
