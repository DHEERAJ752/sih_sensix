import React from 'react';
import { CollisionMetrics } from '../../types/vehicle';
import { Siren, ArrowRightCircle } from 'lucide-react';

interface EmergencyAdvisoryProps {
  advisory: CollisionMetrics | null;
}

export const EmergencyAdvisory: React.FC<EmergencyAdvisoryProps> = ({ advisory }) => {
  if (!advisory || !advisory.isEmergencyAlert) return null;

  return (
    <div className="w-full bg-linear-to-r from-red-600 to-rose-700 text-white rounded-2xl p-4 shadow-xl border-2 border-red-400 mb-4 animate-pulse-fast">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white text-red-600 rounded-xl shadow-md">
            <Siren className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-900/80 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-red-300/40">
                PRIORITY SIREN ACTIVE
              </span>
              <span className="text-xs font-bold text-red-100">
                {advisory.targetVehicleName}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
              Emergency Vehicle Approaching
            </h4>
            <p className="text-xs font-medium text-red-100 mt-0.5">
              Distance: <strong className="text-white">{advisory.distanceMeters.toFixed(1)}m</strong> | Closing Speed: <strong className="text-white">{advisory.closingSpeedKmh.toFixed(0)} km/h</strong> | Est. Arrival: <strong className="text-white">{advisory.timeToCPASec > 0 ? advisory.timeToCPASec.toFixed(1) + 's' : '< 2s'}</strong>
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 bg-red-800/80 backdrop-blur-xs rounded-xl px-3 py-2 border border-red-400/50">
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-red-200 block">Advisory Protocol</span>
            <span className="text-xs font-black text-white">YIELD RIGHT-OF-WAY / MOVE ASIDE</span>
          </div>
          <ArrowRightCircle className="w-5 h-5 text-red-200 shrink-0" />
        </div>
      </div>
    </div>
  );
};
