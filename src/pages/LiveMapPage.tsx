import React from 'react';
import { useApp } from '../context/AppContext';
import { VizagCanvasMap } from '../components/map/VizagCanvasMap';
import { ExplainableBanner } from '../components/alerts/ExplainableBanner';
import { EmergencyAdvisory } from '../components/alerts/EmergencyAdvisory';
import { Crosshair } from 'lucide-react';
import { CollisionMetrics } from '../types/vehicle';

export const LiveMapPage: React.FC = () => {
  const {
    collisionMetrics,
    primaryAlert,
    activeEmergencyAdvisory,
  } = useApp();

  return (
    <div className="space-y-4">
      {/* Top Advisory Banners */}
      <EmergencyAdvisory advisory={activeEmergencyAdvisory} />
      <ExplainableBanner metrics={primaryAlert} />

      {/* Main Full-Size Vizag Canvas Map */}
      <VizagCanvasMap heightClass="h-[calc(100vh-230px)] min-h-[500px]" />

      {/* Kinematic Telemetry Multi-Vehicle Vector Radar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-indigo-600" /> Vector Collision Kinematics Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Live mathematical evaluation of relative motion, closing vectors, TTC, and CPA envelopes.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
            {collisionMetrics.length} Vehicles In Radar Zone
          </span>
        </div>

        {collisionMetrics.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
            No adjacent vehicles within active radar range. Road corridor is clear.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {collisionMetrics.map((m: CollisionMetrics) => {
              const isCritical = m.riskLevel === 'CRITICAL';
              const isCaution = m.riskLevel === 'CAUTION';

              return (
                <div
                  key={m.targetVehicleId}
                  className={`rounded-2xl p-4 border transition-all ${
                    isCritical
                      ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-400'
                      : isCaution
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200 bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {m.targetVehicleName}
                      </span>
                      {m.targetDriverType === 'emergency' && (
                        <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full">
                          EMERGENCY
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-rose-600 text-white animate-pulse'
                          : isCaution
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {m.riskLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mb-2">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">Distance</span>
                      <strong className="text-slate-800 text-xs">{m.distanceMeters.toFixed(1)}m</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">Closing Speed</span>
                      <strong className="text-indigo-700 text-xs">{m.closingSpeedKmh.toFixed(1)} km/h</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">TTC</span>
                      <strong className={`text-xs ${isCritical ? 'text-rose-600' : 'text-slate-800'}`}>
                        {m.timeToCollisionSec ? `${m.timeToCollisionSec.toFixed(1)}s` : 'Safe'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">CPA Distance</span>
                      <strong className="text-slate-800 text-xs">{m.cpaDistanceMeters.toFixed(1)}m</strong>
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-100">
                    <strong>Diagnostic:</strong> {m.explanation.why}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
