import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  User,
  Volume2,
  Shield,
  Database,
  LogOut,
  Save,
  CheckCircle2,
  Siren,
  Car,
} from 'lucide-react';
import { DriverType } from '../types/vehicle';

export const SettingsPage: React.FC = () => {
  const { user, login, logout, settings, updateSettings, syncStatus } = useApp();

  const [userName, setUserName] = useState(user?.name || 'Driver Alpha');
  const [driverType, setDriverType] = useState<DriverType>(user?.driverType || 'normal');
  const [audioEnabled, setAudioEnabled] = useState(settings.audioEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.vibrationEnabled);
  const [collisionSensitivity, setCollisionSensitivity] = useState(settings.collisionSensitivity);
  const [stopThreshold, setStopThreshold] = useState(settings.stationaryStopThresholdSec);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      audioEnabled,
      vibrationEnabled,
      collisionSensitivity,
      stationaryStopThresholdSec: Number(stopThreshold),
      supabaseUrl,
      supabaseKey,
    });

    if (user && (user.name !== userName || user.driverType !== driverType)) {
      login(userName, undefined, driverType);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
              System Configuration
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Profile & Safety Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure vehicle driver identity, kinematic safety envelopes, audio alert buzzers, and Supabase Realtime synchronization.
          </p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" /> Logout Session
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Driver Profile Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" /> Driver Identity & Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Driver Priority Classification
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDriverType('normal')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    driverType === 'normal'
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" /> Normal
                </button>
                <button
                  type="button"
                  onClick={() => setDriverType('emergency')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    driverType === 'emergency'
                      ? 'bg-rose-600 text-white border-rose-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Siren className="w-3.5 h-3.5" /> Emergency
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Audio & Alert Channels */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-600" /> Alert Feedback & Cooldowns
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <strong className="text-xs text-slate-800 font-bold block">Synthesized Audio Tones</strong>
                <span className="text-[11px] text-slate-500">Web Audio synthesized pings for caution/critical</span>
              </div>
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <strong className="text-xs text-slate-800 font-bold block">Device Haptic Vibration</strong>
                <span className="text-[11px] text-slate-500">Haptic buzzer on supported mobile browsers</span>
              </div>
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Collision Engine Sensitivity & Stop Thresholds */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" /> Kinematic Thresholds & Trip Stop Trigger
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Collision Engine Sensitivity
              </label>
              <select
                value={collisionSensitivity}
                onChange={(e) => setCollisionSensitivity(e.target.value as 'HIGH' | 'NORMAL' | 'LOW')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="HIGH">High (Aggressive Early Warning)</option>
                <option value="NORMAL">Normal (Standard Recommended)</option>
                <option value="LOW">Low (Reduced Sensitivity)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Stationary Break Detection (Seconds)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={stopThreshold}
                onChange={(e) => setStopThreshold(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* 4. Supabase Backend Sync Configuration */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" /> Supabase Realtime Mesh Synchronization
            </h2>
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                syncStatus.hasSupabase
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {syncStatus.hasSupabase ? 'Custom Supabase Connected' : 'Local Mesh Fallback Active'}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Optionally provide your project URL and public Anon Key to sync vehicle positions over global cellular/internet Supabase Realtime channels.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between gap-4 pt-2">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Configuration saved successfully!
            </span>
          ) : (
            <span className="text-xs text-slate-400">Settings automatically persist across browser sessions.</span>
          )}

          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-200 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
