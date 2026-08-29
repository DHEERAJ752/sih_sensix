import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TripSummaryModal } from '../components/trips/TripSummaryModal';
import { TripRecord } from '../types/trip';
import {
  FileSpreadsheet,
  Play,
  Pause,
  Square,
  Award,
  ChevronRight,
} from 'lucide-react';

export const TripsPage: React.FC = () => {
  const {
    activeTrip,
    pastTrips,
    lastCompletedTrip,
    clearLastCompletedTrip,
    startTrip,
    pauseTrip,
    resumeTrip,
    endTrip,
  } = useApp();

  const [inspectTrip, setInspectTrip] = useState<TripRecord | null>(null);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  const activeOrLastTrip = inspectTrip || lastCompletedTrip;

  const handleCloseModal = () => {
    setInspectTrip(null);
    clearLastCompletedTrip();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Trip Modal Inspector */}
      {activeOrLastTrip && (
        <TripSummaryModal
          trip={activeOrLastTrip}
          onClose={handleCloseModal}
        />
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
              Telemetry Recorder
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Trip Recorder & Safety Evaluator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Log routes, kinematic speeds, stationary break durations, and collision hazard events to compute an objective Safety Driving Score.
          </p>
        </div>

        {/* Start / Control Buttons */}
        {!activeTrip ? (
          <button
            onClick={startTrip}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-200 transition flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Start New Trip
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {activeTrip.status === 'PAUSED' ? (
              <button
                onClick={resumeTrip}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Resume
              </button>
            ) : (
              <button
                onClick={pauseTrip}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </button>
            )}

            <button
              onClick={endTrip}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> End & Evaluate Trip
            </button>
          </div>
        )}
      </div>

      {/* Active Trip Live HUD Card */}
      {activeTrip && (
        <div className="bg-linear-to-br from-emerald-50 via-white to-blue-50/50 rounded-3xl p-6 border-2 border-emerald-300 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping-slow" />
              <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                Trip In Progress ({activeTrip.status})
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              ID: {activeTrip.id}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
              <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                {formatDuration(activeTrip.durationSeconds)}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Distance</span>
              <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                {(activeTrip.totalDistanceMeters / 1000).toFixed(2)} km
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Average Speed</span>
              <div className="text-lg font-black text-indigo-700 font-mono mt-0.5">
                {activeTrip.averageSpeedKmh.toFixed(1)} km/h
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Hazard Warnings</span>
              <div className="text-lg font-black text-rose-600 font-mono mt-0.5">
                {activeTrip.totalWarningsCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past Trips History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-900">
            Recorded Trip History
          </h2>
          <span className="text-xs font-mono font-bold text-slate-500">
            {pastTrips.length} completed trips
          </span>
        </div>

        {pastTrips.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No trips recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click &quot;Start New Trip&quot; to begin tracking your driving route and safety score.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastTrips.map((trip: TripRecord) => (
              <div
                key={trip.id}
                onClick={() => setInspectTrip(trip)}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/50 hover:border-indigo-200 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-center min-w-[65px]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Score</span>
                    <span className="text-xl font-black text-indigo-700 font-mono">
                      {trip.safetyScore.overallScore}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-black text-slate-900">
                        {new Date(trip.startTime).toLocaleDateString()} at {new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Grade {trip.safetyScore.grade}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                      <span>{(trip.totalDistanceMeters / 1000).toFixed(2)} km</span>
                      <span>•</span>
                      <span>{formatDuration(trip.durationSeconds)}</span>
                      <span>•</span>
                      <span>Avg {trip.averageSpeedKmh.toFixed(0)} km/h</span>
                      <span>•</span>
                      <span className="text-rose-600 font-bold">{trip.totalWarningsCount} warnings</span>
                    </div>
                  </div>
                </div>

                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  View Full Report <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
