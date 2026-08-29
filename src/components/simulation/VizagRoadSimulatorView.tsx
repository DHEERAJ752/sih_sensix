import React, { useState, useEffect } from 'react';
import {
  vizagSimEngine,
  VizagSimState,
  CarId,
} from '../../modules/simulation/vizagSimulation';
import { VizagSimMap } from './VizagSimMap';
import { VizagSimControls } from './VizagSimControls';
import { MapPin, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const VizagRoadSimulatorView: React.FC = () => {
  const [simState, setSimState] = useState<VizagSimState>(() => vizagSimEngine.getState());
  const [selectedCarId, setSelectedCarId] = useState<string | null>('car-1');

  // 60 FPS Physics Render Loop for 4-Car Visakhapatnam Graph Navigation
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dtSec = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const updatedState = vizagSimEngine.update(dtSec);
      setSimState({ ...updatedState });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleToggleRunning = () => {
    vizagSimEngine.setGlobalRunning(!simState.isRunning);
    setSimState({ ...vizagSimEngine.getState() });
  };

  const handleReset = () => {
    vizagSimEngine.resetAllCars();
    setSimState({ ...vizagSimEngine.getState() });
  };

  const handleSpeedChange = (carId: CarId, speed: number) => {
    vizagSimEngine.setCarSpeed(carId, speed);
    setSimState({ ...vizagSimEngine.getState() });
  };

  const handleTurnSelect = (carId: CarId, nextEdgeId: string) => {
    vizagSimEngine.setCarNextTurn(carId, nextEdgeId);
    setSimState({ ...vizagSimEngine.getState() });
  };

  const handleToggleCarPause = (carId: CarId) => {
    vizagSimEngine.toggleCarPause(carId);
    setSimState({ ...vizagSimEngine.getState() });
  };

  const handleThresholdChange = (threshold: number) => {
    vizagSimEngine.setProximityThreshold(threshold);
    setSimState({ ...vizagSimEngine.getState() });
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 bg-teal-500/20 rounded-lg border border-teal-400/40 text-teal-300">
                <MapPin className="w-4 h-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-teal-300">
                Visakhapatnam (Vizag) · Connected Road Graph
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Visakhapatnam 4-Car Road Navigation Simulator
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-3xl leading-relaxed">
              4 distinct cars roam continuously along Visakhapatnam's connected road network (Beach Road, Siripuram, Jagadamba, MVP Colony, Maddilapalem). Real-time proximity detection triggers automatic safety separation with 100% on-road confinement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              100% Road-Constrained
            </span>
          </div>
        </div>
      </div>

      {/* Centerpiece: Interactive Leaflet Road Map */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
              Interactive Visakhapatnam Road Network Canvas
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
            {simState.activeAlerts.length > 0 ? (
              <span className="text-red-600 font-black flex items-center gap-1 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                <ShieldAlert className="w-3.5 h-3.5" /> {simState.activeAlerts.length} Warning(s) Active
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5" /> All 4 Cars Safely Separated
              </span>
            )}
          </div>
        </div>

        <VizagSimMap
          cars={simState.cars}
          activeAlerts={simState.activeAlerts}
          selectedCarId={selectedCarId}
          onSelectCar={setSelectedCarId}
          heightClass="h-[520px]"
        />
      </div>

      {/* Comprehensive Controls, Speed Sliders, Direction Choices & Distance Matrix */}
      <VizagSimControls
        cars={simState.cars}
        isRunning={simState.isRunning}
        proximityThreshold={simState.proximityThresholdMeters}
        activeAlerts={simState.activeAlerts}
        allPairDistances={simState.allPairDistances}
        selectedCarId={selectedCarId}
        onSelectCar={setSelectedCarId}
        onToggleRunning={handleToggleRunning}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
        onTurnSelect={handleTurnSelect}
        onToggleCarPause={handleToggleCarPause}
        onThresholdChange={handleThresholdChange}
      />
    </div>
  );
};
