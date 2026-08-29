import React from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause, Square, AlertTriangle, Clock, Gauge, Navigation } from 'lucide-react';

export const TripHUD: React.FC = () => {
  const { activeTrip, pauseTrip, resumeTrip, endTrip, activeStopNotification, dismissStopNotification } = useApp();

  if (!activeTrip) return null;

  const isPaused = activeTrip.status === 'PAUSED';

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Stationary Stop Detection Popup */}
      {activeStopNotification && (
        <div className="fixed bottom-24 right-4 z-40 bg-amber-500 text-white rounded-2xl p-3.5 shadow-2xl border-2 border-amber-300 flex items-center gap-3 animate-bounce max-w-sm">
          <Clock className="w-6 h-6 shrink-0" />
          <div className="text-xs">
            <strong className="block font-bold">Stop / Stationary Break Detected</strong>
            <span>Vehicle stopped for {activeStopNotification.durationSeconds}s. Break logged.</span>
          </div>
          <button
            onClick={dismissStopNotification}
            className="text-xs font-black bg-amber-700 hover:bg-amber-800 px-2.5 py-1 rounded-lg"
          >
            OK
          </button>
        </div>
      )}

      {/* Floating Active Trip HUD */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-2xl border-2 border-indigo-500/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Trip Status Indicator */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-ping-slow'}`} />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Trip Recording {isPaused ? '(PAUSED)' : '(ACTIVE)'}
              </span>
              <div className="flex items-center gap-3 font-mono text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  {formatDuration(activeTrip.durationSeconds)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  {(activeTrip.totalDistanceMeters / 1000).toFixed(2)} km
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-600" />
                  {activeTrip.averageSpeedKmh.toFixed(0)} avg km/h
                </span>
              </div>
            </div>
          </div>

          {/* Warnings & Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                {activeTrip.totalWarningsCount} Warnings
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {activeTrip.stopsCount} Stops
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isPaused ? (
                <button
                  onClick={resumeTrip}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume
                </button>
              ) : (
                <button
                  onClick={pauseTrip}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                </button>
              )}

              <button
                onClick={endTrip}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Finish Trip
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
