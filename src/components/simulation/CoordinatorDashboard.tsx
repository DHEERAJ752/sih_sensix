import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CoordinatorDecision } from '../../modules/simulation/coordinator';
import {
  Cpu,
  Radio,
  Dices,
  ShieldCheck,
  Send,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Navigation,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Layers,
} from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const {
    coordinatorStats,
    coordinatorDecisions,
    negotiationTransactions,
    randomizeVizagTraffic,
    applyScenario,
    simVehicles,
    acknowledgeCoordinatorDecision,
  } = useApp();

  const [selectedFleetCount, setSelectedFleetCount] = useState<number>(8);

  const getActionBadge = (action: CoordinatorDecision['action']) => {
    switch (action) {
      case 'BRAKE':
        return 'bg-rose-600 text-white animate-pulse';
      case 'YIELD_LEFT':
      case 'YIELD_RIGHT':
        return 'bg-red-600 text-white animate-bounce';
      case 'EVADE_LEFT':
      case 'EVADE_RIGHT':
        return 'bg-amber-600 text-white font-black';
      case 'SLOW_DOWN':
        return 'bg-amber-500 text-white';
      case 'CLEAR':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  const handleFleetSizeSelect = (count: number) => {
    setSelectedFleetCount(count);
    randomizeVizagTraffic(count);
  };

  return (
    <div className="space-y-5">
      {/* ── 1. Centralized Safety Coordinator Core Matrix ── */}
      <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Cpu className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight">
                  Centralized Cooperative Safety Coordinator (CCSC)
                </span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  100% Collision Aversion Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                Continuous high-throughput star-topology collision negotiation evaluating N×(N-1) directional trajectory vectors across Visakhapatnam roads in &lt;1.5ms.
              </p>
            </div>
          </div>

          {/* Fleet Size Multi-Selector & Randomizer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 justify-between">
              <span className="text-[10px] font-black text-slate-400 px-2 flex items-center gap-1">
                <Sliders className="w-3 h-3" /> Fleet:
              </span>
              {[8, 10, 12, 15, 18].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => handleFleetSizeSelect(cnt)}
                  className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition ${
                    selectedFleetCount === cnt
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cnt} Cars
                </button>
              ))}
            </div>

            <button
              onClick={() => randomizeVizagTraffic(selectedFleetCount)}
              className="px-4 py-2.5 rounded-2xl bg-linear-to-r from-teal-500 via-emerald-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-black text-xs shadow-xl shadow-teal-500/20 transition flex items-center justify-center gap-1.5 border border-teal-300/40 active:scale-95 whitespace-nowrap"
            >
              <Dices className="w-4 h-4" />
              <span>🎲 Spawn Random Vizag Fleet</span>
            </button>
          </div>
        </div>

        {/* Realtime Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-indigo-400" /> Tracked Fleet
            </span>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {coordinatorStats.totalVehiclesTracked} Vehicles
            </div>
            <span className="text-[9px] text-slate-400">Live GNSS telemetry</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" /> Vector Pairs / Cycle
            </span>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              {coordinatorStats.activePairsEvaluated} Pairs
            </div>
            <span className="text-[9px] text-slate-400">{coordinatorStats.evaluationsPerSecond * coordinatorStats.activePairsEvaluated}/sec throughput</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Active Maneuvers
            </span>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
              {coordinatorStats.activeEvasiveManeuversCount} Maneuvers
            </div>
            <span className="text-[9px] text-slate-400">Braking / Swerving / Yielding</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-400" /> Collisions Averted
            </span>
            <div className="text-xl font-black text-teal-400 font-mono mt-0.5">
              {coordinatorStats.totalCollisionsAvertedCount} Averted
            </div>
            <span className="text-[9px] text-slate-400">0 Total Crashes</span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Send className="w-3 h-3 text-rose-400" /> Dispatched Directives
            </span>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {coordinatorStats.totalDecisionsIssued}
            </div>
            <span className="text-[9px] text-slate-400">Latency: {coordinatorStats.lastEvaluationMs}ms</span>
          </div>
        </div>
      </div>

      {/* ── 2. Cooperative Collision Negotiation Protocol Inspector ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Cooperative Collision Request-Response Negotiation Protocol
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Step-by-step transaction log demonstrating how intersecting trajectories are detected, requests are made, and physical evasions are executed.
            </p>
          </div>

          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
            4-Stage Closed-Loop Negotiation
          </span>
        </div>

        {negotiationTransactions.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
            <div className="text-xs font-bold text-slate-700">No Active Conflict Intersections Detected</div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              All vehicles are cruising with safe lateral margins. Choose a high-density scenario below (e.g. <strong>Siripuram 10-Vehicle Swarm</strong>) to view multi-agent collision negotiations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {negotiationTransactions.map((tx) => {
              const isAverted = tx.stage === 'COLLISION_AVERTED';

              return (
                <div
                  key={tx.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isAverted
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-rose-50/60 border-rose-200 ring-1 ring-rose-400/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      isAverted ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'
                    }`}>
                      {isAverted ? '✅ COLLISION AVERTED' : '⚠️ NEGOTIATING EVASION'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      TTC: {tx.ttcSec !== null ? `${tx.ttcSec}s` : 'N/A'} · Dist: {tx.threatDistanceMeters}m
                    </span>
                  </div>

                  {/* Negotiation Handshake Flow */}
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 bg-white/80 p-2 rounded-xl border border-slate-200/70">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>{tx.vehicleA.name}</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700">
                          {tx.directiveA}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700">
                          {tx.directiveB}
                        </span>
                        <span>{tx.vehicleB.name}</span>
                        <span className="w-2 h-2 rounded-full bg-amber-600" />
                      </div>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-700 leading-snug">
                      {tx.statusText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. Live Fleet Actuation & Cooperative Response Matrix ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
          <div>
            <span className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-indigo-600" />
              Live Fleet Actuation Matrix ({simVehicles.length} Vehicles on Visakhapatnam Network)
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Real-time telemetry and maneuver status for all connected vehicles in the active scenario.
            </p>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => applyScenario('metropolis-mega-15car-rush')}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
            >
              Metropolis Swarm (15 Cars)
            </button>
            <button
              onClick={() => applyScenario('metropolis-dual-ambulance-14car')}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
            >
              Dual 108 Sirens (14 Cars)
            </button>
            <button
              onClick={() => applyScenario('metropolis-skyline-flyover')}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
            >
              Skyline Flyovers (10 Cars)
            </button>
            <button
              onClick={() => applyScenario('metropolis-roundabout-swarm')}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition"
            >
              5-Way Roundabout (10 Cars)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
          {simVehicles.map((v) => {
            const isManeuvering = v.activeManeuverLabel && !v.activeManeuverLabel.includes('CRUISING') && !v.activeManeuverLabel.includes('STOPPED');

            return (
              <div
                key={v.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isManeuvering
                    ? 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-400/30'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs"
                      style={{ backgroundColor: v.color || '#2563eb' }}
                    />
                    <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px]">
                      {v.name}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      v.driverType === 'emergency'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}
                  >
                    {v.driverType === 'emergency' ? '108 Priority' : 'Civilian'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-[11px] font-mono text-slate-600 mb-2">
                  <span>Spd: <strong className="text-slate-900">{v.speedKmh.toFixed(0)} km/h</strong></span>
                  <span>Hdg: <strong className="text-slate-900">{v.headingDeg.toFixed(0)}°</strong></span>
                </div>

                {/* Live Cooperative Actuation Pill */}
                <div className={`p-1.5 rounded-xl text-[9px] font-black tracking-wide flex items-center justify-between ${
                  isManeuvering
                    ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  <span>ACTUATION:</span>
                  <span className="truncate max-w-[120px]">{v.activeManeuverLabel || '🚗 CRUISING'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Chronological Real-Time CCSC Directive Stream ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              Live Centralized Directive Broadcast Stream
            </h3>
            <p className="text-xs text-slate-500">
              Direct telemetry packets transmitted to individual vehicles commanding cooperative steering, braking, and lane clearance.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Agent Swarm Resolution</span>
          </div>
        </div>

        {coordinatorDecisions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-indigo-400 mx-auto mb-2 opacity-80" />
            <div className="text-xs font-bold text-slate-700">Centralized Coordinator Monitoring Active Fleet</div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              Select <strong>Siripuram (10 Cars)</strong> or <strong>Jagadamba Mega (12 Cars)</strong> above to observe real-time collision requests and cooperative evasions.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {coordinatorDecisions.slice(0, 18).map((dec) => (
              <div
                key={dec.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  dec.riskLevel === 'CRITICAL'
                    ? 'bg-rose-50/70 border-rose-200 ring-1 ring-rose-500/20'
                    : dec.riskLevel === 'CAUTION'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${getActionBadge(dec.action)}`}>
                      {dec.action} DIRECTIVE
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      CCSC → <span className="text-indigo-600 font-extrabold">{dec.fromVehicleName}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(dec.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {dec.message}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-slate-600">
                    <span>Dist: <strong>{dec.distanceMeters}m</strong></span>
                    <span>•</span>
                    <span>Closing: <strong>{dec.closingSpeedKmh} km/h</strong></span>
                    <span>•</span>
                    <span>TTC: <strong>{dec.ttcSec !== null ? `${dec.ttcSec}s` : 'N/A'}</strong></span>
                    <span>•</span>
                    <span>CPA: <strong>{dec.cpaMeters}m</strong></span>
                    <span>•</span>
                    <span>Confidence: <strong className="text-emerald-700">{dec.confidence}</strong></span>
                  </div>

                  {!dec.acknowledged ? (
                    <button
                      onClick={() => acknowledgeCoordinatorDecision(dec.id)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Acknowledge Alert
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Acknowledged by Vehicle
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
