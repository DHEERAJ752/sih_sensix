import { Coordinates, GPSDegradationStatus } from '../../types/vehicle';

export interface GPSStatusReport {
  status: GPSDegradationStatus;
  statusLabel: string;
  statusColor: string;
  accuracyMeters: number;
  lastFixTimestamp: number | null;
  lastKnownPosition: Coordinates | null;
  message: string;
}

export function evaluateGPSHealth(
  accuracyMeters: number,
  lastFixTimestamp: number | null,
  lastKnownPosition: Coordinates | null,
  isSimulatedLoss: boolean = false
): GPSStatusReport {
  if (isSimulatedLoss) {
    return {
      status: 'DEGRADED',
      statusLabel: 'Location Degraded',
      statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
      accuracyMeters: 28.5,
      lastFixTimestamp,
      lastKnownPosition,
      message: 'Simulated Tunnel/Multipath: Signal degraded (±28.5m). Safety radius dynamically expanded.',
    };
  }

  if (!lastFixTimestamp || !lastKnownPosition) {
    return {
      status: 'UNAVAILABLE',
      statusLabel: 'Location Unavailable',
      statusColor: 'bg-rose-100 text-rose-800 border-rose-300',
      accuracyMeters: 0,
      lastFixTimestamp: null,
      lastKnownPosition: null,
      message: 'No GPS fix acquired. Requesting browser geolocation permission...',
    };
  }

  const ageSeconds = (Date.now() - lastFixTimestamp) / 1000;

  if (ageSeconds > 8) {
    return {
      status: 'UNAVAILABLE',
      statusLabel: 'Signal Lost',
      statusColor: 'bg-rose-100 text-rose-800 border-rose-300',
      accuracyMeters,
      lastFixTimestamp,
      lastKnownPosition,
      message: `No GPS updates for ${ageSeconds.toFixed(0)}s. Retaining last known fix.`,
    };
  }

  if (accuracyMeters > 20 || ageSeconds > 3.5) {
    return {
      status: 'DEGRADED',
      statusLabel: 'Location Degraded',
      statusColor: 'bg-amber-100 text-amber-800 border-amber-300',
      accuracyMeters,
      lastFixTimestamp,
      lastKnownPosition,
      message: `Weak satellite geometry or high accuracy uncertainty (±${accuracyMeters.toFixed(0)}m).`,
    };
  }

  return {
    status: 'ACTIVE',
    statusLabel: 'Location Active',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    accuracyMeters,
    lastFixTimestamp,
    lastKnownPosition,
    message: `High accuracy GNSS fix (±${accuracyMeters.toFixed(1)}m). Real-time safety active.`,
  };
}
