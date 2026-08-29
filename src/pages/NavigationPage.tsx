import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LiveMap } from '../components/map/LiveMap';
import { PRESET_DESTINATIONS, PresetDestination } from '../modules/navigation/places';
import { navigationService } from '../modules/navigation/routeService';
import { Navigation, Search, MapPin, ArrowRight, X } from 'lucide-react';
import { ManeuverStep } from '../types/navigation';

export const NavigationPage: React.FC = () => {
  const { selfTelemetry, activeRoute, setActiveRoute, clearRoute } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredDestinations = PRESET_DESTINATIONS.filter(
    (d: PresetDestination) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectDestination = (dest: PresetDestination) => {
    const route = navigationService.calculateRoute(
      { latitude: selfTelemetry.latitude, longitude: selfTelemetry.longitude },
      dest.coordinates,
      dest.name
    );
    setActiveRoute(route);
  };

  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const firstMatch = filteredDestinations[0] || PRESET_DESTINATIONS[0];
    handleSelectDestination(firstMatch);
  };

  return (
    <div className="space-y-5">
      {/* Top Search & Action Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-600" /> Cooperative Turn Guidance & Routing
            </h1>
            <p className="text-xs text-slate-500">
              Calculate collision-aware routes with distance, ETA, and real-time maneuver steps.
            </p>
          </div>

          {activeRoute && (
            <button
              onClick={clearRoute}
              className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Cancel Navigation
            </button>
          )}
        </div>

        {/* Search Input */}
        <form onSubmit={handleCustomSearchSubmit} className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destination, emergency hospital, or city landmark..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </form>
      </div>

      {/* Main Grid: Map & Route Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map Centerpiece (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Route Guidance Map
              </span>
              {activeRoute && (
                <span className="text-xs font-mono font-bold text-indigo-600">
                  {(activeRoute.totalDistanceMeters / 1000).toFixed(1)} km • ~{Math.round(activeRoute.estimatedTimeSeconds / 60)} mins
                </span>
              )}
            </div>
            <LiveMap heightClass="h-[460px]" />
          </div>
        </div>

        {/* Destination List / Maneuver Steps (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {activeRoute ? (
            /* Active Route Guidance Card */
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-500">Destination</span>
                  <h3 className="text-base font-black text-slate-900">
                    {activeRoute.destinationName}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-indigo-600 font-mono block">
                    {Math.round(activeRoute.estimatedTimeSeconds / 60)} min
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {(activeRoute.totalDistanceMeters / 1000).toFixed(1)} km remaining
                  </span>
                </div>
              </div>

              {/* Turn-by-Turn Steps */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {activeRoute.steps.map((step: ManeuverStep, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <strong className="text-xs text-slate-900 font-bold block">
                        {step.instruction}
                      </strong>
                      {step.distanceMeters > 0 && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          In {step.distanceMeters} meters
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Preset Destinations List */
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 mb-3">
                Suggested Destinations
              </h3>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                {filteredDestinations.map((dest: PresetDestination) => (
                  <button
                    key={dest.id}
                    onClick={() => handleSelectDestination(dest)}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50 hover:border-indigo-200 transition text-left flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-xs text-slate-900 font-bold block">
                          {dest.name}
                        </strong>
                        <span className="text-[11px] text-slate-500 block">{dest.address}</span>
                        <span className="text-[10px] font-black uppercase text-indigo-600 mt-1 inline-block">
                          {dest.category}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
