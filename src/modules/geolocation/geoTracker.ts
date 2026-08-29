import { Coordinates, VehicleTelemetry } from '../../types/vehicle';
import { calculateBearing, calculateHaversineDistance } from '../collision/geoMath';
import { DEFAULT_MAP_CENTER } from '../simulation/presets';

export type GeoUpdateCallback = (telemetry: Partial<VehicleTelemetry>, rawPos?: GeolocationPosition) => void;
export type GeoErrorCallback = (error: GeolocationPositionError | Error) => void;

export class BrowserGeoTracker {
  private watchId: number | null = null;
  private lastPosition: Coordinates | null = null;
  private lastTimestamp: number = 0;
  private lastHeading: number = 0;
  private updateCallbacks: Set<GeoUpdateCallback> = new Set();
  private errorCallbacks: Set<GeoErrorCallback> = new Set();

  public startTracking(): Promise<Coordinates> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        const fallback = DEFAULT_MAP_CENTER;
        this.lastPosition = fallback;
        this.lastTimestamp = Date.now();
        this.notifyUpdate({
          latitude: fallback.latitude,
          longitude: fallback.longitude,
          speedKmh: 0,
          headingDeg: 0,
          accuracyMeters: 5.0,
          timestamp: this.lastTimestamp,
        });
        resolve(fallback);
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      };

      // First one-shot request
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.handlePosition(pos);
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          console.warn('Initial geolocation failed, using fallback:', err.message);
          const fallback = DEFAULT_MAP_CENTER;
          this.lastPosition = fallback;
          this.lastTimestamp = Date.now();
          this.notifyUpdate({
            latitude: fallback.latitude,
            longitude: fallback.longitude,
            speedKmh: 0,
            headingDeg: 0,
            accuracyMeters: 8.0,
            timestamp: this.lastTimestamp,
          });
          resolve(fallback);
        },
        options
      );

      // Continuous watcher
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
      }

      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.handlePosition(pos),
        (err) => {
          this.errorCallbacks.forEach((cb) => cb(err));
        },
        options
      );
    });
  }

  private handlePosition(pos: GeolocationPosition): void {
    const currentCoords: Coordinates = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
    const now = pos.timestamp || Date.now();

    // Speed calculation
    let speedKmh = 0;
    if (pos.coords.speed !== null && pos.coords.speed >= 0) {
      speedKmh = pos.coords.speed * 3.6;
    } else if (this.lastPosition && this.lastTimestamp > 0) {
      const dtHours = (now - this.lastTimestamp) / 3600000;
      if (dtHours > 0) {
        const distKm = calculateHaversineDistance(this.lastPosition, currentCoords) / 1000;
        speedKmh = Math.min(120, distKm / dtHours);
      }
    }

    // Heading calculation
    let heading = this.lastHeading;
    if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
      heading = pos.coords.heading;
    } else if (this.lastPosition && speedKmh > 2) {
      const dist = calculateHaversineDistance(this.lastPosition, currentCoords);
      if (dist > 1.5) {
        heading = calculateBearing(this.lastPosition, currentCoords);
      }
    }

    this.lastPosition = currentCoords;
    this.lastTimestamp = now;
    this.lastHeading = heading;

    this.notifyUpdate(
      {
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        speedKmh: Number(speedKmh.toFixed(1)),
        headingDeg: Number(heading.toFixed(1)),
        accuracyMeters: Number((pos.coords.accuracy || 4.5).toFixed(1)),
        timestamp: now,
        altitudeMeters: pos.coords.altitude ?? undefined,
      },
      pos
    );
  }

  public onUpdate(callback: GeoUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  public onError(callback: GeoErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  private notifyUpdate(telemetry: Partial<VehicleTelemetry>, rawPos?: GeolocationPosition): void {
    this.updateCallbacks.forEach((cb) => cb(telemetry, rawPos));
  }

  public stop(): void {
    if (this.watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  public getLastPosition(): Coordinates | null {
    return this.lastPosition;
  }
}

export const browserGeoTracker = new BrowserGeoTracker();
