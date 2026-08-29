import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  FlaskConical,
  Users,
  Navigation,
  FileSpreadsheet,
  Bell,
  Settings,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type PageId =
  | 'dashboard'
  | 'live-map'
  | 'simulation'
  | 'groups'
  | 'navigation'
  | 'trips'
  | 'alerts'
  | 'settings';

interface NavbarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onPageChange }) => {
  const { alertHistory, highestRiskLevel } = useApp();

  const unreadAlerts = alertHistory.length;
  const isHighRisk = highestRiskLevel === 'CRITICAL' || highestRiskLevel === 'CAUTION';

  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live-map' as PageId, label: 'Live Map', icon: MapPin, badge: isHighRisk ? 'RISK' : undefined },
    { id: 'simulation' as PageId, label: 'Simulation Lab', icon: FlaskConical, badge: 'DEMO' },
    { id: 'groups' as PageId, label: 'Groups', icon: Users },
    { id: 'navigation' as PageId, label: 'Navigation', icon: Navigation },
    { id: 'trips' as PageId, label: 'Trips', icon: FileSpreadsheet },
    {
      id: 'alerts' as PageId,
      label: 'Alerts',
      icon: Bell,
      count: unreadAlerts > 0 ? unreadAlerts : undefined,
    },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-4 shrink-0 min-h-[calc(100vh-65px)]">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      item.badge === 'RISK'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {item.count !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom System Status Widget */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Collision Engine
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping-slow" />
              <span className="text-xs font-black text-slate-800">Realtime Active</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Vector CPA & TTC Kinematics active.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge === 'RISK' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                )}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More Options Tab for remaining items */}
        <button
          onClick={() => onPageChange(activePage === 'trips' ? 'alerts' : activePage === 'alerts' ? 'settings' : 'trips')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
            ['trips', 'alerts', 'settings'].includes(activePage)
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 font-medium'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
};
