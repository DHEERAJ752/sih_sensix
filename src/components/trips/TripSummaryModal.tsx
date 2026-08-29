import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TripRecord } from '../../types/trip';
import { Award, CheckCircle2, AlertTriangle, Clock, Gauge, Navigation, Download, X } from 'lucide-react';

interface TripSummaryModalProps {
  trip: TripRecord | null;
  onClose: () => void;
}

export const TripSummaryModal: React.FC<TripSummaryModalProps> = ({ trip, onClose }) => {
  useEffect(() => {
    if (trip) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Ignored
      }
    }
  }, [trip]);

  if (!trip) return null;

  const score = trip.safetyScore;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trip, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `UCOP_Trip_${trip.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
              Trip Completed & Evaluated
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Safety Telemetry Report
            </h2>
          </div>
        </div>

        {/* Safety Score Highlight Card */}
        <div className="bg-linear-to-br from-indigo-50 to-blue-50/50 rounded-2xl p-5 border border-indigo-100 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Computed Safety Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black text-indigo-700 font-mono">
                {score.overallScore}
              </span>
              <span className="text-lg font-bold text-slate-400">/ 100</span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Evaluated across collision avoidance, smoothness, and speed control.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-indigo-100 min-w-[110px]">
            <span className="text-[10px] uppercase font-bold text-slate-400">Rating Grade</span>
            <span className="text-4xl font-black text-emerald-600 mt-0.5">
              {score.grade}
            </span>
          </div>
        </div>

        {/* Core Metrics 6-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-emerald-600" /> Distance
            </span>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              {(trip.totalDistanceMeters / 1000).toFixed(2)} km
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-600" /> Duration
            </span>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              {formatDuration(trip.durationSeconds)}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-blue-600" /> Average Speed
            </span>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              {trip.averageSpeedKmh.toFixed(1)} km/h
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Max Speed</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              {trip.maxSpeedKmh.toFixed(1)} km/h
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400">Stops / Breaks</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              {trip.stopsCount}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> Warnings
            </span>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              {trip.totalWarningsCount} <span className="text-xs text-rose-600 font-semibold">({trip.criticalWarningsCount} crit)</span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Bars */}
        <div className="space-y-3 mb-6 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Collision Avoidance Safety</span>
              <span>{score.collisionAvoidanceScore}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${score.collisionAvoidanceScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Smooth Driving & Progressive Deceleration</span>
              <span>{score.smoothDrivingScore}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${score.smoothDrivingScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Speed Limit Compliance</span>
              <span>{score.speedComplianceScore}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${score.speedComplianceScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actionable Feedback */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Safety Insights & Driving Feedback
          </h4>
          <div className="space-y-2">
            {score.feedback.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={exportJSON}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export Report JSON
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
          >
            Close & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
