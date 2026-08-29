import React, { useState, useEffect, useRef } from 'react';
import {
  highwaySimEngine,
  HighwaySimState,
  CarId,
} from '../../modules/simulation/highwaySimulation';
import { HighwayCanvasView } from './HighwayCanvasView';
import { HighwayControls } from './HighwayControls';
import { ShieldAlert, Volume2, VolumeX, Radio } from 'lucide-react';
import { ProximitySoundEngine } from '../../modules/audio/proximitySoundEngine';
import { useApp } from '../../context/AppContext';

export const PureHighwaySimulatorView: React.FC = () => {
  const [simState, setSimState] = useState<HighwaySimState>(() => highwaySimEngine.getState());
  const [selectedCarId, setSelectedCarId] = useState<string | null>('dheeraj');
  const [soundMuted, setSoundMuted] = useState(false);

  const { settings } = useApp();
  const soundEngineRef = useRef<ProximitySoundEngine | null>(null);

  // Initialize Sound Engine
  useEffect(() => {
    soundEngineRef.current = new ProximitySoundEngine();
    return () => {
      soundEngineRef.current?.destroy();
    };
  }, []);

  // Sync mute state with settings and local toggle
  useEffect(() => {
    soundEngineRef.current?.setMuted(soundMuted || !settings.audioEnabled);
  }, [soundMuted, settings.audioEnabled]);

  // 60 FPS Physics Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dtSec = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const updatedState = highwaySimEngine.update(dtSec);
      setSimState({ ...updatedState });

      // Proximity sound calculation
      if (updatedState.isRunning) {
        const minDistance = updatedState.allPairDistances.length > 0
          ? Math.min(...updatedState.allPairDistances.map((p) => p.distanceMeters))
          : Infinity;

        // Sound starts at 1.8x proximity threshold (e.g. ~65-75m) and ramps up as distance closes
        const audibleRange = Math.max(50, updatedState.proximityThresholdMeters * 1.8);
        soundEngineRef.current?.update(minDistance, audibleRange);
      } else {
        soundEngineRef.current?.stop();
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleToggleRunning = () => {
    const nextRunning = !simState.isRunning;
    highwaySimEngine.setGlobalRunning(nextRunning);
    if (!nextRunning) {
      soundEngineRef.current?.stop();
    }
    setSimState({ ...highwaySimEngine.getState() });
  };

  const handleReset = () => {
    highwaySimEngine.resetAllCars();
    soundEngineRef.current?.stop();
    setSimState({ ...highwaySimEngine.getState() });
  };

  const handleSpeedChange = (carId: CarId, speed: number) => {
    highwaySimEngine.setCarSpeed(carId, speed);
    setSimState({ ...highwaySimEngine.getState() });
  };

  const handleTurnSelect = (carId: CarId, nextEdgeId: string) => {
    highwaySimEngine.setCarNextTurn(carId, nextEdgeId);
    setSimState({ ...highwaySimEngine.getState() });
  };

  const handleToggleCarPause = (carId: CarId) => {
    highwaySimEngine.toggleCarPause(carId);
    setSimState({ ...highwaySimEngine.getState() });
  };

  const handleThresholdChange = (threshold: number) => {
    highwaySimEngine.setProximityThreshold(threshold);
    setSimState({ ...highwaySimEngine.getState() });
  };

  const minPairDistance = simState.allPairDistances.length > 0
    ? Math.min(...simState.allPairDistances.map((p) => p.distanceMeters))
    : Infinity;

  const isAlarmPlaying = simState.isRunning && !soundMuted && settings.audioEnabled && minPairDistance <= Math.max(50, simState.proximityThresholdMeters * 1.8);

  return (
    <div className="space-y-6">
      {/* Centerpiece: Clean 2D Vector Highway Canvas */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
              Multi-Lane Highway & Overpass Canvas
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Proximity Sound Status / Toggle Button */}
            <button
              onClick={() => setSoundMuted((m) => !m)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition border ${
                soundMuted || !settings.audioEnabled
                  ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  : isAlarmPlaying
                  ? 'bg-amber-500 text-white border-amber-400 animate-pulse shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
              title={soundMuted ? 'Click to Unmute Proximity Audio' : 'Click to Mute Proximity Audio'}
            >
              {soundMuted || !settings.audioEnabled ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Audio Muted</span>
                </>
              ) : isAlarmPlaying ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-white animate-bounce" />
                  <span>Proximity Beep Active ({minPairDistance.toFixed(0)}m)</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Proximity Audio ON</span>
                </>
              )}
            </button>

            {/* Warning / Safe Badge */}
            <div className="text-xs font-mono">
              {simState.activeAlerts.length > 0 ? (
                <span className="text-red-600 font-black flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                  <ShieldAlert className="w-3.5 h-3.5 animate-pulse" /> {simState.activeAlerts.length} Warning(s) Active
                </span>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> All 4 Cars Safely Separated
                </span>
              )}
            </div>
          </div>
        </div>

        <HighwayCanvasView
          cars={simState.cars}
          activeAlerts={simState.activeAlerts}
          selectedCarId={selectedCarId}
          onSelectCar={setSelectedCarId}
          heightClass="h-[540px]"
        />
      </div>

      {/* Speed Sliders, Direction Selection & Distance Matrix */}
      <HighwayControls
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
