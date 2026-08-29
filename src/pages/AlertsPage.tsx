import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, ShieldAlert, AlertTriangle, Trash2, Download, Search, Siren } from 'lucide-react';
import { AlertLogItem } from '../types/alerts';

export const AlertsPage: React.FC = () => {
  const { alertHistory, clearAlertHistory } = useApp();

  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlerts = alertHistory.filter((alert: AlertLogItem) => {
    const matchesFilter = filterLevel === 'ALL' || alert.riskLevel === filterLevel;
    const matchesSearch =
      alert.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportAlertsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alertHistory, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `UCOP_Alerts_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-rose-600">
              Audit & Safety Log
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Hazard Alerts & Warning Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete chronological record of all kinematic collision warnings, relative motion breaches, and emergency advisories.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {alertHistory.length > 0 && (
            <>
              <button
                onClick={exportAlertsJSON}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" /> Export Log
              </button>

              <button
                onClick={clearAlertHistory}
                className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'CRITICAL', 'CAUTION'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterLevel === lvl
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl === 'ALL' ? 'All Alerts' : lvl}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by vehicle or reason..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Alerts Timeline List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No alert logs recorded</h3>
            <p className="text-xs text-slate-400 mt-1">
              Collision warnings will be recorded here when vehicles trigger proximity cautions.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert: AlertLogItem) => {
            const isCritical = alert.riskLevel === 'CRITICAL';
            const isEmergency = alert.driverType === 'emergency';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-3xl p-5 border transition shadow-xs ${
                  isCritical ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-2xl ${
                        isCritical
                          ? 'bg-rose-100 text-rose-600'
                          : isEmergency
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {isCritical ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : isEmergency ? (
                        <Siren className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black text-slate-900">
                          {alert.vehicleName}
                        </strong>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isCritical
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {alert.riskLevel}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString()} • {new Date(alert.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                    Confidence: <strong>{alert.positionConfidence}</strong>
                  </span>
                </div>

                {/* Diagnostic Reason */}
                <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3">
                  {alert.reason}
                </p>

                {/* Kinematic Numbers 5-Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">Distance</span>
                    <strong className="text-slate-800 text-xs">{alert.distanceMeters.toFixed(1)} m</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">Closing Speed</span>
                    <strong className="text-indigo-600 text-xs">{alert.closingSpeedKmh.toFixed(1)} km/h</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">TTC</span>
                    <strong className={`text-xs ${isCritical ? 'text-rose-600' : 'text-slate-800'}`}>
                      {alert.ttcSec ? `${alert.ttcSec.toFixed(1)} s` : 'N/A'}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">CPA Distance</span>
                    <strong className="text-slate-800 text-xs">{alert.cpaDistanceMeters.toFixed(1)} m</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">Safety Radius</span>
                    <strong className="text-slate-800 text-xs">{alert.safetyRadiusMeters.toFixed(1)} m</strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
