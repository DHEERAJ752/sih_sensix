import React from 'react';
import {
  HighwayCar,
  CarId,
  HighwayProximityAlert,
  highwaySimEngine,
} from '../../modules/simulation/highwaySimulation';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Gauge,
  CornerUpRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface HighwayControlsProps {
  cars: HighwayCar[];
  isRunning: boolean;
  proximityThreshold: number;
  activeAlerts: HighwayProximityAlert[];
  allPairDistances: {
    pair: [CarId, CarId];
    pairLabel: string;
    distanceMeters: number;
    isWarning: boolean;
  }[];
  selectedCarId: string | null;
  onSelectCar: (carId: string) => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onSpeedChange: (carId: CarId, speed: number) => void;
  onTurnSelect: (carId: CarId, nextEdgeId: string) => void;
  onToggleCarPause: (carId: CarId) => void;
  onThresholdChange: (threshold: number) => void;
}

export const HighwayControls: React.FC<HighwayControlsProps> = ({
  cars,
  isRunning,
  proximityThreshold,
  activeAlerts,
  allPairDistances,
  selectedCarId,
  onSelectCar,
  onToggleRunning,
  onReset,
  onSpeedChange,
  onTurnSelect,
  onToggleCarPause,
  onThresholdChange,
}) => {
  return (
    <div className="space-y-5">
      {/* ── 1. Global Simulation Master Control Panel ── */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-base font-black tracking-tight text-white uppercase">
                Highway Simulation Controls
              </h2>
              {activeAlerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 border border-red-500/40 text-[10px] font-black animate-pulse">
                  ⚠️ {activeAlerts.length} Warning Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              4 autonomous vehicles navigating pure multi-lane highways & elevated flyovers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleRunning}
              className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              {isRunning ? 'Pause Engine' : 'Start Engine'}
            </button>

            <button
              onClick={onReset}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Reset 4 Cars
            </button>
          </div>
        </div>

        {/* Proximity Threshold Configurator Slider */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300">
              Proximity Warning Threshold:
            </span>
            <span className="text-xs font-mono font-black text-amber-400 px-2 py-0.5 bg-slate-800 rounded-lg border border-slate-700">
              {proximityThreshold} meters
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-64">
            <span className="text-[10px] text-slate-500 font-mono">15m</span>
            <input
              type="range"
              min={15}
              max={100}
              step={5}
              value={proximityThreshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-[10px] text-slate-500 font-mono">100m</span>
          </div>
        </div>
      </div>

      {/* ── 2. Individual Car Cards (Car 1, Car 2, Car 3, Car 4) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cars.map((car) => {
          const isSelected = car.id === selectedCarId;
          const availableTurns = highwaySimEngine.getAvailableTurnsForCar(car.id);

          return (
            <div
              key={car.id}
              onClick={() => onSelectCar(car.id)}
              className={`rounded-3xl p-5 border-2 transition-all cursor-pointer bg-white shadow-md relative ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header: Color Badge & Live Speed */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: car.color }}
                  />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      {car.name}
                    </h3>
                    <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                      {car.statusMessage}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Speed</span>
                    <span className="text-base font-black font-mono text-slate-900">
                      {car.speedKmh.toFixed(0)} <span className="text-[10px] text-slate-500">km/h</span>
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCarPause(car.id);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold transition ${
                      car.isPaused
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={car.isPaused ? 'Resume car' : 'Pause car'}
                  >
                    {car.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Speed Slider & Quick Speed Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-indigo-600" /> Speed Control:
                  </span>
                  <span className="font-mono font-bold text-indigo-600">
                    Target: {car.targetSpeedKmh} km/h
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={car.targetSpeedKmh}
                  onChange={(e) => onSpeedChange(car.id, Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSpeedChange(car.id, 0); }}
                    className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                  >
                    🛑 0k
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSpeedChange(car.id, 30); }}
                    className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    30k
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSpeedChange(car.id, 55); }}
                    className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    55k
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSpeedChange(car.id, 75); }}
                    className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 transition"
                  >
                    ⚡ 75k
                  </button>
                </div>
              </div>

              {/* Direction / Intersection Turn Control */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1 truncate">
                    <CornerUpRight className="w-3.5 h-3.5 text-indigo-600" />
                    Upcoming Junction: <span className="text-slate-900 font-black">{car.upcomingNodeName}</span>
                  </span>
                  {car.selectedNextEdgeId && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                      Turn Selected
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {availableTurns.slice(0, 4).map((turn) => {
                    const isTurnSelected = car.selectedNextEdgeId === turn.edgeId;

                    return (
                      <button
                        key={turn.edgeId}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTurnSelect(car.id, turn.edgeId);
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition truncate max-w-[150px] ${
                          isTurnSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                        title={`Turn onto ${turn.edgeName} towards ${turn.targetNodeName}`}
                      >
                        {turn.isUTurn ? '🔄 U-Turn' : `➡️ ${turn.edgeName.split(' ')[0]}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Real-time Proximity Distance Matrix ── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Inter-Car Proximity Distance Matrix
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Threshold: {proximityThreshold}m
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {allPairDistances.map((pairItem, i) => {
            return (
              <div
                key={i}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  pairItem.isWarning
                    ? 'bg-red-50 border-red-300 text-red-900 shadow-sm animate-pulse'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-tight truncate mb-0.5">
                  {pairItem.pairLabel}
                </div>
                <div className={`text-base font-black font-mono ${pairItem.isWarning ? 'text-red-600' : 'text-slate-900'}`}>
                  {pairItem.distanceMeters.toFixed(0)} <span className="text-[9px] font-normal">m</span>
                </div>
                <div className="text-[9px] font-bold mt-0.5 flex items-center justify-center gap-1">
                  {pairItem.isWarning ? (
                    <span className="text-red-600 font-black flex items-center gap-0.5">
                      <ShieldAlert className="w-3 h-3 text-red-600" /> ⚠️ WARNING
                    </span>
                  ) : (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Safe
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
