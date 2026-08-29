import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Octagon,
  Zap,
  Compass,
  RotateCcw,
  Crosshair,
  Gauge,
} from 'lucide-react';

export const TouchControls: React.FC = () => {
  const {
    updateSimControls,
    simVehicles,
    selectedSimVehicleId,
    setSelectedSimVehicleId,
    overrideVehicleHeading,
    turnVehicleRelative,
    aimVehicleAtOther,
    setVehicleSpeedOverride,
  } = useApp();

  const [isThrottle, setIsThrottle] = useState(false);
  const [isBrake, setIsBrake] = useState(false);
  const [isLeft, setIsLeft] = useState(false);
  const [isRight, setIsRight] = useState(false);
  const [isHandbrake, setIsHandbrake] = useState(false);

  // Target vehicle for collision injection test
  const [interceptTargetId, setInterceptTargetId] = useState<string>('');

  // Sync state to current control inputs
  useEffect(() => {
    updateSimControls({
      throttle: isThrottle ? 1.0 : 0,
      brake: isBrake ? 1.0 : 0,
      steer: isLeft ? -1.0 : isRight ? 1.0 : 0,
      handbrake: isHandbrake,
    });
  }, [isThrottle, isBrake, isLeft, isRight, isHandbrake, updateSimControls]);

  // Keyboard Event Listeners (W, A, S, D, Up, Down, Left, Right, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        setIsThrottle(true);
        e.preventDefault();
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        setIsBrake(true);
        e.preventDefault();
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        setIsLeft(true);
        e.preventDefault();
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        setIsRight(true);
        e.preventDefault();
      } else if (e.key === ' ') {
        setIsHandbrake(true);
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        setIsThrottle(false);
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        setIsBrake(false);
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        setIsLeft(false);
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        setIsRight(false);
      } else if (e.key === ' ') {
        setIsHandbrake(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const selectedVehicle = simVehicles.find((v) => v.id === selectedSimVehicleId) || simVehicles[0];

  // Set default intercept target when fleet changes
  useEffect(() => {
    const other = simVehicles.find((v) => v.id !== selectedSimVehicleId);
    if (other) {
      setInterceptTargetId(other.id);
    }
  }, [selectedSimVehicleId, simVehicles]);

  const otherVehicles = simVehicles.filter((v) => v.id !== selectedSimVehicleId);

  const handleAimAtTarget = () => {
    if (interceptTargetId && selectedVehicle) {
      aimVehicleAtOther(selectedVehicle.id, interceptTargetId);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
      {/* ── 1. Header & Active Car Selection ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Vehicle Teleoperation Cockpit & Real-Time Direction Steer
              </h4>
              <p className="text-[11px] text-slate-500">
                Camera automatically locks onto the selected vehicle. Modify its speed, brake, and degree heading in real time.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 font-bold">
            {simVehicles.length} Units Online
          </span>
        </div>

        {/* Vehicle Selection Chips */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl max-h-[110px] overflow-y-auto">
          {simVehicles.map((v) => {
            const isSelected = v.id === selectedVehicle?.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedSimVehicleId(v.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md font-black ring-2 ring-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 bg-white/40'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-white"
                  style={{ backgroundColor: v.color || '#2563eb' }}
                />
                <span className="truncate max-w-[100px]">{v.name}</span>
                <span className="text-[10px] font-mono opacity-80">({v.speedKmh.toFixed(0)}k)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Live Selected Vehicle Telemetry Card ── */}
      <div className="bg-slate-950 text-white rounded-2xl p-3.5 flex items-center justify-between border border-slate-800 shadow-inner">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/30"
            style={{ backgroundColor: selectedVehicle?.color || '#2563eb' }}
          >
            {selectedVehicle?.driverType === 'emergency' ? '🚑' : '🚗'}
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>{selectedVehicle?.name || 'Selected Car'}</span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {selectedVehicle?.driverType === 'emergency' ? '108 Emergency' : 'Civilian'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Target ID: <strong className="text-slate-300">{selectedVehicle?.id}</strong> · Status: <span className="text-emerald-400">{selectedVehicle?.activeManeuverLabel || 'CRUISING'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-center font-mono">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Live Speed</span>
            <span className="text-base font-black text-emerald-400">{selectedVehicle?.speedKmh.toFixed(0) || '0'} km/h</span>
          </div>
          <div className="h-7 w-px bg-slate-800" />
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Degree Heading</span>
            <span className="text-base font-black text-indigo-400 flex items-center justify-center gap-1">
              <Compass
                className="w-4 h-4 text-indigo-400"
                style={{ transform: `rotate(${selectedVehicle?.headingDeg || 0}deg)` }}
              />
              {(selectedVehicle?.headingDeg || 0).toFixed(0)}°
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. [TOP SECTION]: SPEED & BRAKE CONTROLS ── */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-600" /> Speed & Brake Actuation
          </span>
          <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {(selectedVehicle?.speedKmh || 0).toFixed(0)} km/h
          </span>
        </div>

        {/* Dynamic Speed Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
            <span>0 km/h (Brake)</span>
            <span>30 km/h</span>
            <span>60 km/h</span>
            <span>90 km/h (Max)</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={Math.round(selectedVehicle?.speedKmh || 0)}
            onChange={(e) => {
              if (selectedVehicle) {
                setVehicleSpeedOverride(selectedVehicle.id, Number(e.target.value));
              }
            }}
            className="w-full accent-emerald-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Prominent Emergency Brake & Speed Presets */}
        <div className="grid grid-cols-5 gap-1.5">
          <button
            onClick={() => selectedVehicle && setVehicleSpeedOverride(selectedVehicle.id, 0)}
            className="col-span-2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black transition flex items-center justify-center gap-1 shadow-md shadow-rose-600/20"
          >
            <Octagon className="w-3.5 h-3.5" /> 🛑 EMERGENCY BRAKE
          </button>
          <button
            onClick={() => selectedVehicle && setVehicleSpeedOverride(selectedVehicle.id, 25)}
            className="py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 text-[11px] font-bold transition shadow-2xs"
          >
            🚗 25 km/h
          </button>
          <button
            onClick={() => selectedVehicle && setVehicleSpeedOverride(selectedVehicle.id, 45)}
            className="py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 text-[11px] font-bold transition shadow-2xs"
          >
            🚙 45 km/h
          </button>
          <button
            onClick={() => selectedVehicle && setVehicleSpeedOverride(selectedVehicle.id, 75)}
            className="py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 active:scale-95 text-[11px] font-black transition shadow-2xs"
          >
            ⚡ 75 km/h
          </button>
        </div>
      </div>

      {/* ── 4. [BELOW SPEED]: CHANGE DIRECTION IN DEGREES ── */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-indigo-600" /> Change Direction in Degrees
          </span>
          <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
            Heading: {(selectedVehicle?.headingDeg || 0).toFixed(0)}°
          </span>
        </div>

        {/* Live Heading Slider in Degrees */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
            <span>North (0°)</span>
            <span>East (90°)</span>
            <span>South (180°)</span>
            <span>West (270°)</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={Math.round(selectedVehicle?.headingDeg || 0)}
            onChange={(e) => {
              if (selectedVehicle) {
                overrideVehicleHeading(selectedVehicle.id, Number(e.target.value));
              }
            }}
            className="w-full accent-indigo-600 h-2.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Quick Degree Turns & Cardinal Compass Direction Locks */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => selectedVehicle && turnVehicleRelative(selectedVehicle.id, -45)}
            className="px-2 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs active:scale-95"
            title="Turn 45 degrees left"
          >
            <RotateCcw className="w-3 h-3" /> ↶ -45°
          </button>
          <button
            onClick={() => selectedVehicle && turnVehicleRelative(selectedVehicle.id, 45)}
            className="px-2 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs active:scale-95"
            title="Turn 45 degrees right"
          >
            ↷ +45°
          </button>
          <button
            onClick={() => selectedVehicle && turnVehicleRelative(selectedVehicle.id, 180)}
            className="px-2 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs active:scale-95"
            title="Reverse course 180 degrees"
          >
            🔄 U-Turn 180°
          </button>
          <button
            onClick={() => selectedVehicle && overrideVehicleHeading(selectedVehicle.id, 0)}
            className="px-2 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[11px] font-black transition flex items-center justify-center gap-1 shadow-2xs active:scale-95"
            title="Steer due North (0°)"
          >
            🧭 North (0°)
          </button>
        </div>

        {/* Collision Trajectory Force Intercept */}
        <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
          <select
            value={interceptTargetId}
            onChange={(e) => setInterceptTargetId(e.target.value)}
            className="grow px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
          >
            {otherVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                Target: {v.name} ({v.speedKmh.toFixed(0)} km/h)
              </option>
            ))}
          </select>

          <button
            onClick={handleAimAtTarget}
            disabled={!interceptTargetId}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black shadow-sm transition flex items-center gap-1 active:scale-95 whitespace-nowrap"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>⚔️ Force Intercept</span>
          </button>
        </div>
      </div>

      {/* ── 5. Manual D-Pad & Pedals (Keyboard & Touch) ── */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="text-[10px] text-slate-400 font-mono">
          Manual Driving: <strong>W/A/S/D</strong> or Arrow Keys
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onMouseDown={() => setIsLeft(true)}
            onMouseUp={() => setIsLeft(false)}
            onTouchStart={() => setIsLeft(true)}
            onTouchEnd={() => setIsLeft(false)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition shadow-xs border ${
              isLeft ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border-slate-200'
            }`}
            title="Steer Left"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onMouseDown={() => setIsRight(true)}
            onMouseUp={() => setIsRight(false)}
            onTouchStart={() => setIsRight(true)}
            onTouchEnd={() => setIsRight(false)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition shadow-xs border ${
              isRight ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border-slate-200'
            }`}
            title="Steer Right"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onMouseDown={() => setIsThrottle(true)}
            onMouseUp={() => setIsThrottle(false)}
            onTouchStart={() => setIsThrottle(true)}
            onTouchEnd={() => setIsThrottle(false)}
            className={`px-3 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition shadow-xs border ${
              isThrottle ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
            title="Throttle"
          >
            <ArrowUp className="w-4 h-4 mr-1" /> Gas
          </button>

          <button
            onMouseDown={() => setIsBrake(true)}
            onMouseUp={() => setIsBrake(false)}
            onTouchStart={() => setIsBrake(true)}
            onTouchEnd={() => setIsBrake(false)}
            className={`px-3 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition shadow-xs border ${
              isBrake ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title="Brake"
          >
            <ArrowDown className="w-4 h-4 mr-1" /> Brake
          </button>

          <button
            onMouseDown={() => setIsHandbrake(true)}
            onMouseUp={() => setIsHandbrake(false)}
            onTouchStart={() => setIsHandbrake(true)}
            onTouchEnd={() => setIsHandbrake(false)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition shadow-xs border ${
              isHandbrake ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title="Emergency Handbrake (Space)"
          >
            <Octagon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
