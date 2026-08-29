import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Radio,
  Users,
  Volume2,
  VolumeX,
  Siren,
  Copy,
  Check,
  Globe,
  LogOut,
} from 'lucide-react';

export const TopHeader: React.FC = () => {
  const {
    user,
    logout,
    gpsStatus,
    activeGroup,
    syncStatus,
    settings,
    updateSettings,
    getInviteLink,
    highestRiskLevel,
  } = useApp();

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const link = getInviteLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEmergency = user?.driverType === 'emergency';

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-slate-900 tracking-tight">U-COP</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  v1.0 Safety OS
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:block">
                Unified Cooperative Positioning & Collision Safety Platform
              </span>
            </div>
          </div>

          {/* Quick Risk Indicator on Mobile */}
          <div className="md:hidden">
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                highestRiskLevel === 'CRITICAL'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : highestRiskLevel === 'CAUTION'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {highestRiskLevel}
            </span>
          </div>
        </div>

        {/* Center Pill: GPS Degradation & Health Status */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* GPS Health Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${gpsStatus.statusColor}`}
            title={gpsStatus.message}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{gpsStatus.statusLabel}</span>
            {gpsStatus.accuracyMeters > 0 && (
              <span className="font-mono text-[11px] opacity-80">
                (±{gpsStatus.accuracyMeters.toFixed(1)}m)
              </span>
            )}
          </div>

          {/* Realtime Fleet / Supabase Connection Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-slate-50 border-slate-200 text-xs font-semibold text-slate-700">
            <Globe className={`w-3.5 h-3.5 ${syncStatus.connected ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span>{syncStatus.hasSupabase ? 'Cloud Realtime' : 'Local Fleet Mesh'}</span>
          </div>

          {/* Active Group Code Pill */}
          {activeGroup && (
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-indigo-50/80 border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
              title="Click to copy invite link"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{activeGroup.code}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3 opacity-60" />}
            </button>
          )}
        </div>

        {/* Right Actions: Audio Toggle & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Sound Mute Toggle */}
          <button
            onClick={() => updateSettings({ audioEnabled: !settings.audioEnabled })}
            className={`p-2 rounded-xl border transition ${
              settings.audioEnabled
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}
            title={settings.audioEnabled ? 'Audio Alerts Active (Click to Mute)' : 'Audio Muted (Click to Unmute)'}
          >
            {settings.audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* User Profile Badge + Logout */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded-2xl">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black ${
                    isEmergency ? 'bg-red-600 animate-pulse' : 'bg-indigo-600'
                  }`}
                >
                  {isEmergency ? <Siren className="w-3.5 h-3.5" /> : user.name[0].toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-slate-800 leading-none">
                    {user.name}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase leading-tight mt-0.5">
                    {user.driverType} Driver
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
