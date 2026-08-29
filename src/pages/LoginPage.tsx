import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, User, Lock, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

const ALLOWED_USERS = ['dheeraj', 'nithin', 'bjs', 'lehari', 'pardhu', 'chayy'];
const REQUIRED_PASSWORD = '1234';

export const LoginPage: React.FC = () => {
  const { login } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setError('Please enter your authorized username.');
      return;
    }
    if (!cleanPass) {
      setError('Please enter the security password.');
      return;
    }

    // Verify authorized username
    if (!ALLOWED_USERS.includes(cleanUser)) {
      setError(`Access Denied: "${username}" is not an authorized account. Allowed users: dheeraj, nithin, bjs, lehari, pardhu, chayy.`);
      return;
    }

    // Verify exact password
    if (cleanPass !== REQUIRED_PASSWORD) {
      setError('Invalid password. Please enter the correct password (1234).');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Capitalize first letter for display
      const displayName = cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1);
      const isEmergency = cleanUser === 'pardhu' || cleanUser === 'chayy';
      login(displayName, cleanPass, isEmergency ? 'emergency' : 'normal');
      setIsSubmitting(false);
    }, 450);
  };

  const handleQuickSelect = (userAccount: string) => {
    setUsername(userAccount);
    setPassword(REQUIRED_PASSWORD);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 select-none">
      {/* ── Left Panel: Visual Hero & Highway Network ─────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 overflow-hidden border-r border-indigo-900/40">
        {/* Decorative Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Logo Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40 border border-indigo-300/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-white font-black text-xl tracking-tight leading-tight">U-COP Platform</div>
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              Unified Cooperative Safety OS
            </span>
          </div>
        </div>

        {/* Center SVG Highway Network */}
        <div className="relative z-10 space-y-6">
          <svg viewBox="0 0 420 280" className="w-full max-w-md mx-auto drop-shadow-2xl">
            {/* Night Canvas */}
            <rect width="420" height="280" fill="#090d16" rx="20" />

            {/* Grid */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 40} x2="420" y2={i * 40} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            ))}

            {/* Highway Asphalt */}
            <rect x="0" y="110" width="420" height="70" fill="#1e293b" />
            <rect x="0" y="118" width="420" height="54" fill="#334155" />
            {/* Center dividers */}
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={`d${i}`} x={i * 38 + 4} y="142" width="20" height="5" fill="#fbbf24" rx="2" />
            ))}
            {/* Lanes */}
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={`l${i}`} x={i * 38 + 4} y="130" width="20" height="3" fill="#94a3b8" opacity="0.5" rx="1" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={`r${i}`} x={i * 38 + 4} y="155" width="20" height="3" fill="#94a3b8" opacity="0.5" rx="1" />
            ))}

            {/* Elevated Flyover */}
            <path d="M 90 70 Q 210 80 330 70" stroke="#475569" strokeWidth="20" fill="none" strokeLinecap="round" />
            <path d="M 90 70 Q 210 80 330 70" stroke="#38bdf8" strokeWidth="1.5" fill="none" strokeDasharray="8,8" />
            <path d="M 90 70 Q 210 80 330 70" stroke="rgba(0,0,0,0.6)" strokeWidth="24" fill="none" strokeLinecap="round" style={{ filter: 'blur(6px)' }} transform="translate(6, 12)" />

            {/* Car 1 – Blue */}
            <g transform="translate(80, 127)">
              <rect x="-11" y="-20" width="22" height="40" fill="#2563eb" rx="5" />
              <rect x="-8" y="-10" width="16" height="8" fill="#0f172a" />
              <rect x="-9" y="-20" width="4" height="3" fill="#fff" />
              <rect x="5" y="-20" width="4" height="3" fill="#fff" />
              <path d="M-8,18 L-25,80 L25,80 L8,18Z" fill="rgba(254,240,138,0.18)" />
            </g>

            {/* Car 2 – Amber */}
            <g transform="translate(210, 152) rotate(180)">
              <rect x="-11" y="-20" width="22" height="40" fill="#d97706" rx="5" />
              <rect x="-8" y="-10" width="16" height="8" fill="#0f172a" />
              <rect x="-9" y="-20" width="4" height="3" fill="#fff" />
              <rect x="5" y="-20" width="4" height="3" fill="#fff" />
            </g>

            {/* Car 3 – Green */}
            <g transform="translate(200, 72)">
              <rect x="-8" y="-14" width="16" height="28" fill="#10b981" rx="4" />
              <rect x="-6" y="-6" width="12" height="6" fill="#0f172a" />
            </g>

            {/* Car 4 – Purple */}
            <g transform="translate(340, 130)">
              <rect x="-11" y="-20" width="22" height="40" fill="#9333ea" rx="5" />
              <rect x="-8" y="-10" width="16" height="8" fill="#0f172a" />
            </g>

            {/* Warning badge */}
            <rect x="118" y="132" width="76" height="20" fill="#dc2626" rx="10" />
            <text x="156" y="146" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="monospace">⚠️ 24m</text>
          </svg>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
              Unified Cooperative<br />Collision Avoidance
            </h2>
            <p className="text-sm text-indigo-200/80 leading-relaxed max-w-sm mx-auto">
              Real-time vehicle telemetry, proximity warning audio, and pure highway-constrained kinematics.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['🔒 Secure Auth', '🔊 Proximity Audio', '🛣️ Pure Highway Canvas', '⚡ 60 FPS Physics'].map((feat) => (
              <span key={feat} className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20 backdrop-blur-sm">
                {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-indigo-300/60 text-xs font-medium">
          Smart India Hackathon • SIH 2025
        </div>
      </div>

      {/* ── Right Panel: Login Form & Authorized Accounts ─────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-950">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">U-COP Platform</span>
          </div>

          {/* Form Header */}
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-3xl font-black text-white tracking-tight">
              Sign In to Fleet
            </h1>
            <p className="text-slate-400 text-sm">
              Enter your authorized credentials to access the safety dashboard.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="dheeraj, nithin, bjs, lehari, pardhu, chayy"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium placeholder-slate-600
                             focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter security password (1234)"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-11 pr-12 py-3.5 text-sm font-medium placeholder-slate-600
                             focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold leading-relaxed animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed
                         text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-indigo-500/30
                         transition-all flex items-center justify-center gap-2.5 text-sm mt-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2 a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Authorized Account Selector */}
          <div className="space-y-3 pt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/80" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-slate-950 text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Authorized Team Profiles (Pass: 1234)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'dheeraj', label: '🚗 Dheeraj', role: 'Car Alpha' },
                { name: 'nithin', label: '🚙 Nithin', role: 'Car Beta' },
                { name: 'bjs', label: '👑 BJS', role: 'Fleet Lead' },
                { name: 'lehari', label: '🛡️ Lehari', role: 'Safety Ops' },
                { name: 'pardhu', label: '🚑 Pardhu', role: 'Medic Priority' },
                { name: 'chayy', label: '🚓 Chayy', role: 'Patrol Unit' },
              ].map((acc) => {
                const isSelected = username.toLowerCase() === acc.name;
                return (
                  <button
                    key={acc.name}
                    type="button"
                    onClick={() => handleQuickSelect(acc.name)}
                    className={`py-2 px-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/20 text-white ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{acc.label}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{acc.role}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credentials Requirement Note */}
          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authorized usernames: <strong className="text-slate-200">dheeraj, nithin, bjs, lehari, pardhu, chayy</strong> • Password: <strong className="text-slate-200">1234</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
