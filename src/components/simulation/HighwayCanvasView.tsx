import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  HIGHWAY_NODES,
  HIGHWAY_EDGES,
  HighwayCar,
  HighwayProximityAlert,
} from '../../modules/simulation/highwaySimulation';
import {
  Locate,
  Maximize2,
  ShieldAlert,
  Sparkles,
  Eye,
} from 'lucide-react';

interface HighwayCanvasViewProps {
  cars: HighwayCar[];
  activeAlerts: HighwayProximityAlert[];
  selectedCarId: string | null;
  onSelectCar: (carId: string) => void;
  heightClass?: string;
}

export const HighwayCanvasView: React.FC<HighwayCanvasViewProps> = ({
  cars,
  activeAlerts,
  selectedCarId,
  onSelectCar,
  heightClass = 'h-[540px]',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<'overview' | 'follow'>('overview');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const cameraPosRef = useRef<{ x: number; y: number }>({ x: 800, y: 480 });

  const carsRef = useRef(cars);
  carsRef.current = cars;

  const alertsRef = useRef(activeAlerts);
  alertsRef.current = activeAlerts;

  const selectedCarIdRef = useRef(selectedCarId);
  selectedCarIdRef.current = selectedCarId;

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  // ── Handle Canvas Click to Select Car ─────────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dpr = window.devicePixelRatio || 1;
    const centerX = canvas.width / (2 * dpr);
    const centerY = canvas.height / (2 * dpr);

    const cam = cameraPosRef.current;
    const currentMode = viewModeRef.current;
    const effectiveZoom = currentMode === 'overview'
      ? Math.min(canvas.clientWidth / 1680, canvas.clientHeight / 1020) * zoomLevel
      : zoomLevel;

    const worldX = cam.x + (clickX - centerX) / effectiveZoom;
    const worldY = cam.y + (clickY - centerY) / effectiveZoom;

    let closestId: string | null = null;
    let closestDist = 65;

    carsRef.current.forEach((car) => {
      const dist = Math.hypot(car.pos.x - worldX, car.pos.y - worldY);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = car.id;
      }
    });

    if (closestId) {
      onSelectCar(closestId);
      setViewMode('follow');
    }
  }, [zoomLevel, onSelectCar]);

  // ── 60 FPS Canvas Render Loop ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;

    const render = (currentTime: number) => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const activeCars = carsRef.current;
      const currentSelId = selectedCarIdRef.current;
      const currentView = viewModeRef.current;
      const selected = activeCars.find((c) => c.id === currentSelId) || activeCars[0];

      // Determine Target Camera Position and Zoom
      let targetCamX = 800;
      let targetCamY = 480;
      let effectiveZoom = 1.0;

      if (currentView === 'follow' && selected) {
        targetCamX = selected.pos.x;
        targetCamY = selected.pos.y;
        effectiveZoom = zoomLevel * 1.3;
      } else {
        // Overview mode: fits entire 1600x1000 highway network
        targetCamX = 800;
        targetCamY = 480;
        const fitScale = Math.min(displayWidth / 1680, displayHeight / 1020);
        effectiveZoom = fitScale * zoomLevel;
      }

      // Smooth camera interpolation
      cameraPosRef.current.x += (targetCamX - cameraPosRef.current.x) * 0.15;
      cameraPosRef.current.y += (targetCamY - cameraPosRef.current.y) * 0.15;

      const screenW = displayWidth;
      const screenH = displayHeight;

      // ── 1. Clear Canvas (Dark Slate Space Background) ─────────────────────
      ctx.fillStyle = '#090d16'; // High-contrast clean dark highway ground
      ctx.fillRect(0, 0, screenW, screenH);

      ctx.save();
      ctx.translate(screenW / 2, screenH / 2);
      ctx.scale(effectiveZoom, effectiveZoom);
      ctx.translate(-cameraPosRef.current.x, -cameraPosRef.current.y);

      // Subtle Background Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 1600; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1000); ctx.stroke();
      }
      for (let y = 0; y <= 1000; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1600, y); ctx.stroke();
      }

      // ── 2. Draw Ground Highways & Multi-Lane Markings ─────────────────────
      const groundEdges = Object.values(HIGHWAY_EDGES).filter((e) => e.tier !== 'flyover');
      groundEdges.forEach((edge) => {
        const totalWidth = edge.lanes * edge.laneWidth;

        // Outer Asphalt Casing / Curb
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = totalWidth + 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        edge.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Inner Asphalt Road Surface
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = totalWidth;
        ctx.beginPath();
        edge.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Yellow Centerline & White Dashed Lanes
        ctx.strokeStyle = edge.lanes > 2 ? '#fbbf24' : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.setLineDash([14, 16]);
        ctx.beginPath();
        edge.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ── 3. Draw Level 2 Elevated Skyline Flyover (With 3D Drop Shadow) ────
      const flyoverEdges = Object.values(HIGHWAY_EDGES).filter((e) => e.tier === 'flyover');
      flyoverEdges.forEach((edge) => {
        const totalWidth = edge.lanes * edge.laneWidth;

        // 3D Elevated Drop Shadow over ground highway below
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 22;
        ctx.shadowOffsetX = 12;
        ctx.shadowOffsetY = 18;

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = totalWidth + 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        edge.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.restore();

        // Elevated Road Deck
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = totalWidth;
        ctx.beginPath();
        edge.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Cyan Guardrails & Centerline
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        edge.points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ── 4. Draw Highway Junction Hubs ─────────────────────────────────────
      Object.values(HIGHWAY_NODES).forEach((node) => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(node.pos.x, node.pos.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HUB', node.pos.x, node.pos.y);

        // Junction Node Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(node.name, node.pos.x, node.pos.y + 26);
      });

      // ── 5. Draw Active Proximity Warning Lasers (⚠️) ───────────────────────
      const alerts = alertsRef.current;
      alerts.forEach((alert) => {
        const cA = activeCars.find((c) => c.id === alert.carAId);
        const cB = activeCars.find((c) => c.id === alert.carBId);

        if (cA && cB) {
          // Flashing pulsating hazard laser
          const pulseAlpha = 0.5 + Math.sin(currentTime * 0.012) * 0.45;
          ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 8]);
          ctx.beginPath();
          ctx.moveTo(cA.pos.x, cA.pos.y);
          ctx.lineTo(cB.pos.x, cB.pos.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Midpoint Warning ⚠️ Symbol & Distance Badge
          ctx.save();
          ctx.translate(alert.midpoint.x, alert.midpoint.y);

          // Warning Symbol Pill
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.roundRect(-55, -14, 110, 28, 14);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`⚠️ ${alert.distanceMeters}m`, 0, 0);
          ctx.restore();
        }
      });

      // ── 6. Draw 4 Cars, Headlights, & Labels ──────────────────────────────
      activeCars.forEach((car) => {
        const isSelected = car.id === currentSelId;
        const rad = (car.headingDeg * Math.PI) / 180;
        const isBraking = car.speedKmh < 5;
        const isAlertActive = alerts.some((a) => a.carAId === car.id || a.carBId === car.id);

        ctx.save();
        ctx.translate(car.pos.x, car.pos.y);
        ctx.rotate(rad);

        // Headlight Cones (projecting forward in +X direction)
        const lightGradient = ctx.createRadialGradient(15, 0, 5, 85, 0, 65);
        lightGradient.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        lightGradient.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = lightGradient;
        ctx.beginPath();
        ctx.moveTo(12, -8);
        ctx.lineTo(95, -32);
        ctx.lineTo(95, 32);
        ctx.lineTo(12, 8);
        ctx.closePath();
        ctx.fill();

        // Selected Car Glowing Target Ring
        if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, 28, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Warning Hazard Halo
        if (isAlertActive) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(0, 0, 34, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Vehicle Chassis Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(-20 + 3, -11 + 3, 40, 22, 5);
        ctx.fill();

        // Vehicle Body (Length 40 along X, Width 22 along Y, Front at +X)
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(-20, -11, 40, 22, 5);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cabin / Roof
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-8, -8.5, 19, 17, 3);
        ctx.fill();

        // Front Windshield (curved at +X)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(4, -7.5, 6, 15, 2);
        ctx.fill();

        // Rear Window (at -X)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-8, -7, 4, 14, 2);
        ctx.fill();

        // Side Windows
        ctx.fillStyle = '#334155';
        ctx.fillRect(-3, -8.5, 7, 2);
        ctx.fillRect(-3, 6.5, 7, 2);

        // Front Headlights (at +X nose x = 18)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(17, -9, 3, 4);
        ctx.fillRect(17, 5, 3, 4);

        // Rear Brake / Tail Lights (at -X rear x = -20)
        ctx.fillStyle = isBraking ? '#ff0000' : '#b91c1c';
        ctx.fillRect(-20, -9, 3, 4);
        ctx.fillRect(-20, 5, 3, 4);

        // Forward Direction Indicator Arrow inside car
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.moveTo(1, -3);
        ctx.lineTo(7, 0);
        ctx.lineTo(1, 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // ── Floating Car Label & Speed Tag over car ──────────────────────────
        ctx.save();
        ctx.translate(car.pos.x, car.pos.y - 32);

        const tagText = `${car.name} (${car.speedKmh.toFixed(0)}k)`;
        ctx.font = 'bold 11px monospace';
        const textWidth = ctx.measureText(tagText).width;

        ctx.fillStyle = isAlertActive ? '#dc2626' : car.color;
        ctx.beginPath();
        ctx.roundRect(-textWidth / 2 - 8, -11, textWidth + 16, 20, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, 0, -1);
        ctx.restore();
      });

      ctx.restore(); // Restore world transform
      ctx.restore(); // Restore screen scale
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [zoomLevel]);

  const selectedCar = cars.find((c) => c.id === selectedCarId);

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

      {/* Top Left Title & Info Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 text-white font-black text-xs shadow-xl border border-slate-700 backdrop-blur-md">
          <span>Highway Network Canvas (4 Cars)</span>
        </div>

        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          100% Highway-Constrained
        </span>
      </div>

      {/* Top Right View Switcher & Zoom */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {selectedCar && (
          <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700 shadow-2xl text-white">
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

        {/* View Mode Buttons (Overview vs Follow) */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              viewMode === 'overview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Full Highway Network Overview"
          >
            <Eye className="w-3.5 h-3.5" /> Overview
          </button>
          <button
            onClick={() => setViewMode('follow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              viewMode === 'follow'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Follow Active Car"
          >
            <Locate className="w-3.5 h-3.5" /> Follow
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Zoom Buttons */}
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.2))}
            className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-black text-sm flex items-center justify-center"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel(1.0)}
            className="px-2 h-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs flex items-center justify-center"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
            className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-black text-sm flex items-center justify-center"
            title="Zoom Out"
          >
            -
          </button>
        </div>
      </div>

      {/* Active Proximity Alert Overlay at Bottom */}
      {activeAlerts.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-10 animate-in fade-in slide-in-from-bottom duration-300 pointer-events-none">
          <div className="bg-red-950/95 backdrop-blur-md rounded-2xl border-2 border-red-500/80 shadow-2xl p-3 text-white">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-red-400">
                  ⚠️ ACTIVE PROXIMITY WARNING ({activeAlerts.length} Active)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/30 text-red-200 border border-red-500/40 font-black">
                AUTOMATIC SAFETY SEPARATION ACTIVE
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
