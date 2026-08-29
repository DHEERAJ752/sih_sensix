import React from 'react';
import { useApp } from '../context/AppContext';
import { VizagCanvasMap } from '../components/map/VizagCanvasMap';
import { ExplainableBanner } from '../components/alerts/ExplainableBanner';
import { EmergencyAdvisory } from '../components/alerts/EmergencyAdvisory';
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  Radio,
  Users,
  Compass,
  Gauge,
  Play,
  FlaskConical,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { PageId } from '../components/layout/Navbar';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    selfTelemetry,
    remoteVehicles,
    collisionMetrics,
    highestRiskLevel,
    primaryAlert,
    activeEmergencyAdvisory,
    activeGroup,
    gpsStatus,
    activeTrip,
    startTrip,
    applyScenario,
  } = useApp();

  return (
    <div className="space-y-5">
      {/* 1. Active Emergency Advisory Banner */}
      <EmergencyAdvisory advisory={activeEmergencyAdvisory} />

      {/* 2. Explainable Warning Banner (Kinematic breakdown) */}
      <ExplainableBanner metrics={primaryAlert} />

      {/* 3. Top Telemetry Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Risk Status Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              System Risk Level
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-lg font-black uppercase tracking-tight ${
                  highestRiskLevel === 'CRITICAL'
                    ? 'text-rose-600 animate-pulse'
                    : highestRiskLevel === 'CAUTION'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {highestRiskLevel}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              {collisionMetrics.length} vehicle pairs scanned
            </span>
          </div>

          <div
            className={`p-3 rounded-2xl ${
              highestRiskLevel === 'CRITICAL'
                ? 'bg-rose-50 text-rose-600'
                : highestRiskLevel === 'CAUTION'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {highestRiskLevel === 'CRITICAL' ? (
              <Flame className="w-6 h-6 animate-pulse" />
            ) : highestRiskLevel === 'CAUTION' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
        </div>

        {/* Speed & Heading Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Vehicle Kinematics
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-900 font-mono">
                {selfTelemetry.speedKmh.toFixed(0)}
              </span>
              <span className="text-xs font-semibold text-slate-500">km/h</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Compass className="w-3.5 h-3.5 text-indigo-600" /> Heading {selfTelemetry.headingDeg.toFixed(0)}°
            </span>
          </div>

          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        {/* GPS Health Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              GPS Positioning
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm font-black text-slate-900">
                {gpsStatus.statusLabel}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
              Accuracy: ±{selfTelemetry.accuracyMeters.toFixed(1)}m
            </span>
          </div>

          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        {/* Fleet Peers Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Connected Fleet
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-indigo-600 font-mono">
                {remoteVehicles.length}
              </span>
              <span className="text-xs font-semibold text-slate-500">peers active</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Group: <strong>{activeGroup ? activeGroup.code : 'Global Fleet'}</strong>
            </span>
          </div>

          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. Live Map Centerpiece */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" /> Live Cooperative Safety Map
            </h2>
            <p className="text-xs text-slate-500">
              Real-time GNSS positioning, dynamic safety envelopes, and projected trajectory vectors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!activeTrip && (
              <button
                onClick={startTrip}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Trip
              </button>
            )}

            <button
              onClick={() => onNavigate('simulation')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5" /> Simulation Lab
            </button>
          </div>
        </div>

        <VizagCanvasMap heightClass="h-[460px]" />
      </div>

      {/* 5. Bottom Split: Quick Demo Launcher & Active Peer Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Demo Trigger Box */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-900">
              Live Demo Quick Launcher
            </h3>
            <button
              onClick={() => onNavigate('simulation')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              All Scenarios <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-3">
            Trigger preset multi-vehicle scenarios to demonstrate instant collision detection:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                applyScenario('head-on-collision');
                onNavigate('live-map');
              }}
              className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/80 transition text-left flex items-start gap-2.5"
            >
              <Flame className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-rose-900 font-bold block">Head-On Collision</strong>
                <span className="text-[11px] text-rose-700">Guaranteed intersecting path</span>
              </div>
            </button>

            <button
              onClick={() => {
                applyScenario('emergency-approach');
                onNavigate('live-map');
              }}
              className="p-3 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-100/80 transition text-left flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-red-900 font-bold block">Emergency Approach</strong>
                <span className="text-[11px] text-red-700">Priority siren advisory</span>
              </div>
            </button>

            <button
              onClick={() => {
                applyScenario('following-distance');
                onNavigate('live-map');
              }}
              className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/80 transition text-left flex items-start gap-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-amber-900 font-bold block">Following Distance</strong>
                <span className="text-[11px] text-amber-700">Tailgating risk zone</span>
              </div>
            </button>

            <button
              onClick={() => {
                applyScenario('safe-drive');
                onNavigate('live-map');
              }}
              className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/80 transition text-left flex items-start gap-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-emerald-900 font-bold block">Safe Cruising</strong>
                <span className="text-[11px] text-emerald-700">Parallel safe lanes</span>
              </div>
            </button>
          </div>
        </div>

        {/* Active Nearby Vehicles Table */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-900">
              Active Nearby Fleet Roster
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              {remoteVehicles.length} vehicles
            </span>
          </div>

          {remoteVehicles.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-500">No other vehicles broadcasting nearby.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Launch a scenario from the Simulation Lab or connect a 2nd tab to see live peers!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {remoteVehicles.map((v) => {
                const metric = collisionMetrics.find((m) => m.targetVehicleId === v.id);
                const risk = metric?.riskLevel || 'SAFE';

                return (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: v.color || '#2563eb' }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-800 font-bold">{v.name}</strong>
                          {v.driverType === 'emergency' && (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-black uppercase">
                              AMB
                            </span>
                          )}
                          {v.isStale && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-black uppercase">
                              STALE ({v.lastSeenAgoSeconds}s)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Speed: {v.speedKmh.toFixed(0)} km/h • Heading: {v.headingDeg.toFixed(0)}°
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {metric && (
                        <span className="font-mono font-bold text-indigo-700 block">
                          {metric.distanceMeters.toFixed(1)}m away
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                          risk === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : risk === 'CAUTION'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {risk}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
