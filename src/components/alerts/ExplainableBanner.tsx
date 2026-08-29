import React from 'react';
import { CollisionMetrics } from '../../types/vehicle';
import { AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, Activity, Zap } from 'lucide-react';

interface ExplainableBannerProps {
  metrics: CollisionMetrics | null;
  onDismiss?: () => void;
}

export const ExplainableBanner: React.FC<ExplainableBannerProps> = ({ metrics, onDismiss }) => {
  if (!metrics || metrics.riskLevel === 'SAFE') return null;

  const isCritical = metrics.riskLevel === 'CRITICAL';
  const isCaution = metrics.riskLevel === 'CAUTION';

  const exp = metrics.explanation;

  const getTheme = () => {
    if (isCritical) {
      return {
        bg: 'bg-rose-50 border-rose-300',
        badgeBg: 'bg-rose-600 text-white',
        titleColor: 'text-rose-900',
        textColor: 'text-rose-800',
        boxBg: 'bg-white border-rose-200',
        accentBar: 'bg-rose-600',
        icon: <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />,
      };
    }
    if (isCaution) {
      return {
        bg: 'bg-amber-50 border-amber-300',
        badgeBg: 'bg-amber-500 text-white',
        titleColor: 'text-amber-900',
        textColor: 'text-amber-800',
        boxBg: 'bg-white border-amber-200',
        accentBar: 'bg-amber-500',
        icon: <AlertTriangle className="w-6 h-6 text-amber-600 animate-bounce" />,
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-300',
      badgeBg: 'bg-emerald-600 text-white',
      titleColor: 'text-emerald-900',
      textColor: 'text-emerald-800',
      boxBg: 'bg-white border-emerald-200',
      accentBar: 'bg-emerald-600',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
    };
  };

  const theme = getTheme();

  return (
    <div className={`w-full rounded-2xl border-2 p-4 shadow-lg transition-all duration-300 ${theme.bg} mb-4 relative overflow-hidden`}>
      {/* Top Accent Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.accentBar}`} />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100">
            {theme.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${theme.badgeBg}`}>
                {metrics.riskLevel} ALERT
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> Target: <strong className="text-slate-800">{metrics.targetVehicleName}</strong>
              </span>
            </div>
            <h3 className={`text-lg font-black tracking-tight mt-0.5 ${theme.titleColor}`}>
              {exp.title}
            </h3>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-white transition"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Why Plain-Language Explanation */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/80 mb-3 shadow-xs">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Kinematic Diagnostic Reason</p>
        <p className={`text-sm font-semibold leading-snug ${theme.textColor}`}>
          {exp.why}
        </p>
      </div>

      {/* Calculated Kinematic Telemetry Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono mb-3">
        <div className={`p-2.5 rounded-xl border ${theme.boxBg}`}>
          <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Distance</div>
          <div className="text-sm font-black text-slate-800 mt-0.5">{exp.distance}</div>
        </div>

        <div className={`p-2.5 rounded-xl border ${theme.boxBg}`}>
          <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Closing Speed</div>
          <div className="text-sm font-black text-indigo-700 mt-0.5">{exp.closingSpeed}</div>
        </div>

        <div className={`p-2.5 rounded-xl border ${theme.boxBg}`}>
          <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">TTC (Time To Collide)</div>
          <div className={`text-sm font-black mt-0.5 ${isCritical ? 'text-rose-600' : 'text-slate-800'}`}>
            {exp.ttc}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border ${theme.boxBg}`}>
          <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">CPA Distance</div>
          <div className="text-sm font-black text-slate-800 mt-0.5">{exp.cpaDistance}</div>
        </div>

        <div className={`p-2.5 rounded-xl border ${theme.boxBg}`}>
          <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Safety Radius</div>
          <div className="text-sm font-black text-slate-800 mt-0.5">{exp.safetyRadius}</div>
        </div>

        <div className={`p-2.5 rounded-xl border ${theme.boxBg}`}>
          <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Position Confidence</div>
          <div className="text-sm font-black text-emerald-700 mt-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-500" />
            {exp.positionConfidence}
          </div>
        </div>
      </div>

      {/* Recommended Driver Action */}
      <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl px-3.5 py-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Action:</span>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-white">{exp.recommendedAction}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 animate-pulse hidden sm:block" />
      </div>
    </div>
  );
};
