import React from 'react';
import { PRESET_SCENARIOS, PresetScenario } from '../../modules/simulation/presets';
import { useApp } from '../../context/AppContext';
import { Play, Flame, Shield, Siren, AlertTriangle, Radio, WifiOff } from 'lucide-react';

interface ScenarioCardsProps {
  onScenarioSelected?: (scenario: PresetScenario) => void;
}

export const ScenarioCards: React.FC<ScenarioCardsProps> = ({ onScenarioSelected }) => {
  const { applyScenario, setIsSimulating } = useApp();

  const handleLaunch = (scenario: PresetScenario) => {
    applyScenario(scenario.id);
    setIsSimulating(true);
    if (onScenarioSelected) {
      onScenarioSelected(scenario);
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'head-on-collision':
        return <Flame className="w-5 h-5 text-rose-600" />;
      case 'emergency-approach':
        return <Siren className="w-5 h-5 text-red-600" />;
      case 'following-distance':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'safe-drive':
        return <Shield className="w-5 h-5 text-emerald-600" />;
      case 'gps-loss':
        return <Radio className="w-5 h-5 text-slate-600" />;
      case 'network-loss':
        return <WifiOff className="w-5 h-5 text-purple-600" />;
      default:
        return <Play className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {PRESET_SCENARIOS.map((scenario) => {
        const isCoreDemo = scenario.id === 'head-on-collision';

        return (
          <div
            key={scenario.id}
            className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 bg-white hover:shadow-md flex flex-col justify-between ${
              isCoreDemo
                ? 'border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  {getIcon(scenario.id)}
                </div>
                <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${scenario.badgeColor}`}>
                  {scenario.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {scenario.name}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {scenario.description}
              </p>

              <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Demo Objective</span>
                <p className="text-xs text-slate-700 font-medium">
                  {scenario.instructions}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {scenario.vehicles.length} Active Vehicles
              </span>
              <button
                onClick={() => handleLaunch(scenario)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                  isCoreDemo
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Launch Scenario
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
