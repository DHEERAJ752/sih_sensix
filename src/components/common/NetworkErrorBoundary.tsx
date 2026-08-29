import { Component, ErrorInfo, ReactNode } from 'react';
import { WifiOff, RotateCcw, ShieldAlert, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
  errorStack: string | null;
  isOffline: boolean;
}

export class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
      errorStack: null,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering error occurred',
      errorStack: error.stack || null,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('NetworkErrorBoundary caught an exception:', error, errorInfo);
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  handleOnline = () => {
    this.setState({ isOffline: false });
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: null, errorStack: null });
    window.location.reload();
  };

  handleClearAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans select-none">
          <div className="max-w-md w-full bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 text-center">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black text-white tracking-tight">
              Safety Kernel Auto-Recovered
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {this.state.errorMessage || 'An isolated rendering exception was safely caught by the fault-tolerant boundary.'}
            </p>

            {this.state.errorStack && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-500 text-left max-h-24 overflow-y-auto">
                {this.state.errorStack.slice(0, 300)}...
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Quick Reload
              </button>

              <button
                onClick={this.handleClearAndReset}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Clear Stale Cache & Relaunch
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Offline Notification Pill */}
        {this.state.isOffline && (
          <div className="bg-amber-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md sticky top-0 z-50">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Browser network offline. Operating in zero-latency Local Fleet Mesh fallback.</span>
          </div>
        )}
        {this.props.children}
      </>
    );
  }
}
