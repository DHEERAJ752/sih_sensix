import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CITY_ROADS,
  CITY_BUILDINGS,
  CITY_TREES,
  CITY_RIVER,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  geoToCity,
} from '../../modules/simulation/customCity';
import {
  Locate,
  Compass,
  Maximize2,
  Navigation,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface CityGameViewProps {
  heightClass?: string;
}

export const CityGameView: React.FC<CityGameViewProps> = ({
  heightClass = 'h-[580px]',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    simVehicles,
    selectedSimVehicleId,
    setSelectedSimVehicleId,
    primaryAlert,
    negotiationTransactions,
  } = useApp();

  const [cameraMode, setCameraMode] = useState<'follow' | 'chase' | 'overview'>('follow');
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);

  // Smooth Camera Coordinates (lerped in rAF)
  const cameraPosRef = useRef<{ x: number; y: number }>({ x: 1600, y: 1200 });
  const cameraAngleRef = useRef<number>(0);
  const simVehiclesRef = useRef(simVehicles);
  simVehiclesRef.current = simVehicles;

  const selectedVehicleIdRef = useRef(selectedSimVehicleId);
  selectedVehicleIdRef.current = selectedSimVehicleId;

  const primaryAlertRef = useRef(primaryAlert);
  primaryAlertRef.current = primaryAlert;

  const transactionsRef = useRef(negotiationTransactions);
  transactionsRef.current = negotiationTransactions;

  // ── Handle Canvas Click to Select Car ─────────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const centerX = canvas.width / (2 * (window.devicePixelRatio || 1));
    const centerY = canvas.height / (2 * (window.devicePixelRatio || 1));

    const cam = cameraPosRef.current;
    const zoom = cameraMode === 'overview' ? 0.35 : zoomLevel;

    // Convert screen coordinates to world coordinates
    let worldX: number;
    let worldY: number;

    if (cameraMode === 'chase') {
      const rot = cameraAngleRef.current + Math.PI / 2;
      const dx = (clickX - centerX) / zoom;
      const dy = (clickY - centerY) / zoom;
      const rx = dx * Math.cos(rot) - dy * Math.sin(rot);
      const ry = dx * Math.sin(rot) + dy * Math.cos(rot);
      worldX = cam.x + rx;
      worldY = cam.y + ry;
    } else {
      worldX = cam.x + (clickX - centerX) / zoom;
      worldY = cam.y + (clickY - centerY) / zoom;
    }

    // Find closest vehicle within 50px
    let closestId: string | null = null;
    let closestDist = 50;

    simVehiclesRef.current.forEach((v) => {
      const p = geoToCity(v.latitude, v.longitude);
      const dist = Math.hypot(p.x - worldX, p.y - worldY);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = v.id;
      }
    });

    if (closestId) {
      setSelectedSimVehicleId(closestId);
      setCameraMode('follow');
    }
  }, [cameraMode, zoomLevel, setSelectedSimVehicleId]);

  // ── 60 FPS Game Render Loop ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let waveOffset = 0;

    const render = (currentTime: number) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;
      waveOffset += dt * 30;

      // Handle Canvas Resizing
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Find current selected vehicle position
      const vehicles = simVehiclesRef.current;
      const currentSelectedId = selectedVehicleIdRef.current;
      const selected = vehicles.find((v) => v.id === currentSelectedId) || vehicles[0];

      const targetPos = selected ? geoToCity(selected.latitude, selected.longitude) : { x: 1600, y: 1200 };
      const targetHeading = selected ? selected.headingDeg : 0;

      // ── Smooth Camera Interpolation (Lerp) ────────────────────────────────
      const lerpSpeed = 0.15;
      cameraPosRef.current.x += (targetPos.x - cameraPosRef.current.x) * lerpSpeed;
      cameraPosRef.current.y += (targetPos.y - cameraPosRef.current.y) * lerpSpeed;

      // Smooth Shortest-Angle Rotation for Chase Cam (Fixes Spinning Jitter)
      if (cameraMode === 'chase') {
        const targetRad = (targetHeading * Math.PI) / 180;
        let diff = targetRad - cameraAngleRef.current;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        cameraAngleRef.current += diff * 0.08;
      } else {
        cameraAngleRef.current = 0;
      }

      const screenW = displayWidth;
      const screenH = displayHeight;
      const effectiveZoom = cameraMode === 'overview' ? 0.35 : zoomLevel;

      // ── World Transform ───────────────────────────────────────────────────
      ctx.fillStyle = '#0f172a'; // Deep asphalt space background
      ctx.fillRect(0, 0, screenW, screenH);

      ctx.save();
      ctx.translate(screenW / 2, screenH / 2);
      if (cameraMode === 'chase') {
        ctx.rotate(-cameraAngleRef.current - Math.PI / 2);
      }
      ctx.scale(effectiveZoom, effectiveZoom);
      ctx.translate(-cameraPosRef.current.x, -cameraPosRef.current.y);

      // ── 1. Draw City Ground & District Blocks ─────────────────────────────
      ctx.fillStyle = '#1e293b'; // Slate city block pavement
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Subtle City Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < WORLD_WIDTH; x += 100) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_HEIGHT); ctx.stroke();
      }
      for (let y = 0; y < WORLD_HEIGHT; y += 100) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke();
      }

      // ── 2. Draw Blue River & Water Channel ────────────────────────────────
      ctx.fillStyle = '#0284c7'; // Vibrant river water
      ctx.beginPath();
      ctx.moveTo(CITY_RIVER.points[0].x - CITY_RIVER.width / 2, 0);
      CITY_RIVER.points.forEach((p) => ctx.lineTo(p.x - CITY_RIVER.width / 2, p.y));
      ctx.lineTo(CITY_RIVER.points[CITY_RIVER.points.length - 1].x + CITY_RIVER.width / 2, WORLD_HEIGHT);
      for (let i = CITY_RIVER.points.length - 1; i >= 0; i--) {
        const p = CITY_RIVER.points[i];
        ctx.lineTo(p.x + CITY_RIVER.width / 2, p.y);
      }
      ctx.closePath();
      ctx.fill();

      // Water wave ripple accents
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      for (let y = 50; y < WORLD_HEIGHT; y += 180) {
        const waveX = 1600 + Math.sin((y + waveOffset) * 0.02) * 20;
        ctx.beginPath();
        ctx.arc(waveX, y, 35, 0, Math.PI * 0.8);
        ctx.stroke();
      }

      // ── 3. Draw Ground Roads & Highways ───────────────────────────────────
      CITY_ROADS.filter((r) => r.tier !== 'flyover').forEach((road) => {
        const totalWidth = road.lanes * road.laneWidth;

        // Asphalt Base
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = totalWidth + 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        road.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Dark Asphalt Center Surface
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = totalWidth;
        ctx.beginPath();
        road.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // White / Yellow Lane Dashes
        ctx.strokeStyle = road.lanes > 1 ? '#fbbf24' : '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.setLineDash([14, 16]);
        ctx.beginPath();
        road.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ── 4. Draw Suspension Bridge Spans & Trusses ─────────────────────────
      // Bridge Pillars
      ctx.fillStyle = '#64748b';
      ctx.fillRect(1460, 1100, 30, 160);
      ctx.fillRect(1740, 1100, 30, 160);

      // Bridge Cables
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(1400, 1220);
      ctx.quadraticCurveTo(1600, 1080, 1800, 1220);
      ctx.stroke();

      // ── 5. Draw Buildings & 3D Rooftops ───────────────────────────────────
      CITY_BUILDINGS.forEach((b) => {
        // Building Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(b.x + 14, b.y + 14, b.width, b.height);

        // Building Walls (Isometric Depth)
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Rooftop Surface
        ctx.fillStyle = b.roofColor;
        ctx.fillRect(b.x + 4, b.y + 4, b.width - 8, b.height - 8);

        // Helipad / Hospital Cross
        if (b.hasHelipad) {
          const cx = b.x + b.width / 2;
          const cy = b.y + b.height / 2;
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, 26, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 20px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.isHospital ? '+' : 'H', cx, cy);
        }

        // Building Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.name, b.x + b.width / 2, b.y + b.height - 12);
      });

      // ── 6. Draw Sidewalk & Park Trees ─────────────────────────────────────
      CITY_TREES.forEach((t) => {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(t.x + 4, t.y + 4, t.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner Leaf Highlight
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(t.x - 3, t.y - 3, t.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── 7. Draw Elevated 2-Tier Flyovers (Level 2 Overpasses) ──────────────
      CITY_ROADS.filter((r) => r.tier === 'flyover').forEach((road) => {
        const totalWidth = road.lanes * road.laneWidth;

        // Realistic Elevated Drop Shadow on ground roads below
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 12;
        ctx.shadowOffsetY = 16;

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = totalWidth + 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        road.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.restore();

        // Elevated Concrete Deck Surface
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = totalWidth;
        ctx.beginPath();
        road.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Guardrails & Centerline
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        road.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ── 8. Draw Active Collision Conflict Lasers & Hazard Zones ───────────
      const transList = transactionsRef.current;
      transList.forEach((tx) => {
        const vA = vehicles.find((v) => v.id === tx.vehicleA.id);
        const vB = vehicles.find((v) => v.id === tx.vehicleB.id);

        if (vA && vB) {
          const pA = geoToCity(vA.latitude, vA.longitude);
          const pB = geoToCity(vB.latitude, vB.longitude);

          if (tx.stage === 'COLLISION_AVERTED') {
            // Emerald Safe Divergence Line
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            // Pulsating Hazard Laser
            const pulseAlpha = 0.5 + Math.sin(currentTime * 0.01) * 0.4;
            ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 8]);
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Midpoint Hazard Marker
            const midX = (pA.x + pB.x) / 2;
            const midY = (pA.y + pB.y) / 2;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(midX, midY, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡TTC', midX, midY);
          }
        }
      });

      // ── 9. Draw Vehicles, Headlights, & Collision Visuals ─────────────────
      vehicles.forEach((v) => {
        const p = geoToCity(v.latitude, v.longitude);
        const isSelected = v.id === currentSelectedId;
        const rad = (v.headingDeg * Math.PI) / 180;
        const isEmergency = v.driverType === 'emergency';
        const isBraking = v.speedKmh < 5 || (v.activeManeuverLabel && v.activeManeuverLabel.includes('BRAKE'));

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(rad);

        // Headlight Cones (projecting forward)
        const lightGradient = ctx.createRadialGradient(0, 20, 5, 0, 100, 75);
        lightGradient.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        lightGradient.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = lightGradient;
        ctx.beginPath();
        ctx.moveTo(-10, 15);
        ctx.lineTo(-35, 110);
        ctx.lineTo(35, 110);
        ctx.lineTo(10, 15);
        ctx.closePath();
        ctx.fill();

        // Selected Car Glowing Target Rings
        if (isSelected) {
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, 32, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#a5b4fc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 38, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Vehicle Chassis Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-12 + 3, -22 + 3, 24, 44);

        // Vehicle Body
        ctx.fillStyle = isEmergency ? '#dc2626' : v.color || '#2563eb';
        ctx.beginPath();
        ctx.roundRect(-12, -22, 24, 44, 5);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Windshield (Front & Rear Glass)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-9, -12, 18, 9); // Front Windshield
        ctx.fillRect(-9, 9, 18, 6);  // Rear Glass

        // Headlights (Front White LEDs)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-10, -22, 5, 3);
        ctx.fillRect(5, -22, 5, 3);

        // Brake Lights (Rear Red LEDs - Bright Red when braking)
        ctx.fillStyle = isBraking ? '#ff0000' : '#7f1d1d';
        ctx.fillRect(-10, 20, 5, 3);
        ctx.fillRect(5, 20, 5, 3);

        // Emergency Siren Strobe (Flashing Red/Blue on top)
        if (isEmergency) {
          const strobe = Math.floor((currentTime / 120) % 2) === 0;
          ctx.fillStyle = strobe ? '#ef4444' : '#3b82f6';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // ── Floating Maneuver Banner over vehicle ────────────────────────────
        const isManeuvering = v.activeManeuverLabel && !v.activeManeuverLabel.includes('CRUISING') && !v.activeManeuverLabel.includes('STOPPED');

        if (isManeuvering || isSelected) {
          ctx.save();
          ctx.translate(p.x, p.y - 36);

          const bannerText = isManeuvering ? v.activeManeuverLabel! : `🎯 ${v.name} (${v.speedKmh.toFixed(0)}k)`;
          ctx.font = 'bold 11px monospace';
          const textWidth = ctx.measureText(bannerText).width;

          ctx.fillStyle = isManeuvering ? '#dc2626' : '#4338ca';
          ctx.beginPath();
          ctx.roundRect(-textWidth / 2 - 8, -12, textWidth + 16, 20, 6);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(bannerText, 0, -2);
          ctx.restore();
        }
      });

      ctx.restore(); // Restore world transform

      // ── 10. Draw Minimap Radar in Corner ──────────────────────────────────
      const mmWidth = 180;
      const mmHeight = 135;
      const mmX = screenW - mmWidth - 16;
      const mmY = screenH - mmHeight - 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(mmX, mmY, mmWidth, mmHeight, 12);
      ctx.fill();
      ctx.stroke();

      // Mini map title
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`RADAR (${vehicles.length} CARS)`, mmX + 8, mmY + 14);

      // Mini vehicles
      const mmScaleX = mmWidth / WORLD_WIDTH;
      const mmScaleY = mmHeight / WORLD_HEIGHT;

      vehicles.forEach((v) => {
        const p = geoToCity(v.latitude, v.longitude);
        const mx = mmX + p.x * mmScaleX;
        const my = mmY + p.y * mmScaleY;
        const isSel = v.id === currentSelectedId;

        ctx.fillStyle = isSel ? '#818cf8' : v.driverType === 'emergency' ? '#ef4444' : v.color || '#22c55e';
        ctx.beginPath();
        ctx.arc(mx, my, isSel ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore(); // Final screen restore
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [cameraMode, zoomLevel]);

  const selectedVehicleObj = simVehicles.find((v) => v.id === selectedSimVehicleId);
  const activeAlert = primaryAlert;
  const isAlertActive = activeAlert && (activeAlert.riskLevel === 'CRITICAL' || activeAlert.riskLevel === 'CAUTION');

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClass} rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 select-none`}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Top Center Floating Collision Alert HUD with Live Solution */}
      {isAlertActive && activeAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-[90%] w-[540px] pointer-events-none animate-in fade-in slide-in-from-top duration-300">
          <div className="bg-slate-950/95 backdrop-blur-md rounded-2xl border-2 border-red-500/80 shadow-2xl p-3 text-white">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-red-400">
                  {activeAlert.riskLevel === 'CRITICAL' ? '⚠️ CRITICAL COLLISION RISK' : '⚠️ COLLISION CAUTION'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                TTC: {activeAlert.timeToCollisionSec ? `${activeAlert.timeToCollisionSec.toFixed(1)}s` : 'Imminent'} · Dist: {activeAlert.distanceMeters.toFixed(0)}m
              </span>
            </div>

            <div className="text-xs font-bold text-slate-200 mb-1">
              Target: <span className="text-amber-300">{activeAlert.targetVehicleName}</span> (Closing Speed: {activeAlert.closingSpeedKmh.toFixed(0)} km/h)
            </div>

            {/* Clear Actionable Solution */}
            <div className="text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-xl bg-indigo-950/80 text-cyan-300 border border-indigo-500/40 flex items-start gap-1.5">
              <span className="text-amber-400 shrink-0">💡 SOLUTION:</span>
              <span className="leading-snug">{activeAlert.explanation?.recommendedAction || 'Emergency Braking & Lateral Lane Clearance'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Camera Mode Badges & HUD */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-600/90 text-white font-black text-xs shadow-lg border border-indigo-400/40 backdrop-blur-md">
          <Locate className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
          <span>Tracking: {selectedVehicleObj?.name || 'Car Alpha'}</span>
        </div>

        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-slate-900/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          {simVehicles.length} Cars (100% On-Road)
        </span>
      </div>

      {/* Camera Mode Switcher Buttons */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700 shadow-xl">
        <button
          onClick={() => setCameraMode('follow')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
            cameraMode === 'follow'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Smooth Game Follow"
        >
          <Locate className="w-3.5 h-3.5" /> Follow
        </button>

        <button
          onClick={() => setCameraMode('chase')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
            cameraMode === 'chase'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Dynamic Chase Cam (Rotates with Vehicle)"
        >
          <Navigation className="w-3.5 h-3.5" /> Chase
        </button>

        <button
          onClick={() => setCameraMode('overview')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
            cameraMode === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Metropolis Bird's-Eye Overview"
        >
          <Maximize2 className="w-3.5 h-3.5" /> Overview
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Zoom Controls */}
        <button
          onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.2))}
          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-black text-sm flex items-center justify-center"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-black text-sm flex items-center justify-center"
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* Realtime Speedometer & Cockpit Gauge in Corner */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-2xl text-white">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full ring-2 ring-white/40 shadow-sm"
            style={{ backgroundColor: selectedVehicleObj?.color || '#2563eb' }}
          />
          <div>
            <div className="text-xs font-black leading-tight text-indigo-300">
              {selectedVehicleObj?.name || 'Car Alpha'}
            </div>
            <div className="text-[9px] text-slate-400 font-mono">
              {selectedVehicleObj?.driverType === 'emergency' ? '108 Priority' : 'Civilian Unit'}
            </div>
          </div>
        </div>

        <div className="h-7 w-px bg-slate-800" />

        <div className="text-center font-mono">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Speed</span>
          <span className="text-lg font-black text-emerald-400">
            {selectedVehicleObj?.speedKmh.toFixed(0) || '0'} <span className="text-[10px] text-slate-400">km/h</span>
          </span>
        </div>

        <div className="h-7 w-px bg-slate-800" />

        <div className="text-center font-mono">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Heading</span>
          <span className="text-xs font-black text-indigo-400 flex items-center justify-center gap-1">
            <Compass
              className="w-3.5 h-3.5 text-indigo-400"
              style={{ transform: `rotate(${selectedVehicleObj?.headingDeg || 0}deg)` }}
            />
            {(selectedVehicleObj?.headingDeg || 0).toFixed(0)}°
          </span>
        </div>

        <div className="h-7 w-px bg-slate-800" />

        <div className="text-center font-mono">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Actuation</span>
          <span className="text-xs font-bold text-amber-400 truncate max-w-[110px] block">
            {selectedVehicleObj?.activeManeuverLabel || 'CRUISING'}
          </span>
        </div>
      </div>
    </div>
  );
};
