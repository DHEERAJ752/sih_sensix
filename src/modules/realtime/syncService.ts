import { VehicleTelemetry } from '../../types/vehicle';
import { getSupabaseClient } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type TelemetryCallback = (telemetry: VehicleTelemetry) => void;
export type PresenceCallback = (userIds: string[]) => void;
export type NetworkErrorCallback = (error: string | null) => void;

export class SyncService {
  private currentGroupId: string | null = null;
  private currentUserId: string | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private telemetryCallbacks: Set<TelemetryCallback> = new Set();
  private presenceCallbacks: Set<PresenceCallback> = new Set();
  private errorCallbacks: Set<NetworkErrorCallback> = new Set();
  private isConnected: boolean = false;
  private isFallbackMode: boolean = false;
  private lastNetworkError: string | null = null;
  private lastBroadcastTime: number = 0;
  private minBroadcastIntervalMs: number = 750; // ~1 second broadcast cadence

  constructor() {
    this.initLocalBroadcast();
    this.initNetworkListeners();
  }

  private initLocalBroadcast(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('ucop_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'TELEMETRY') {
            const telemetry: VehicleTelemetry = event.data.payload;
            if (telemetry && telemetry.id !== this.currentUserId) {
              this.notifyTelemetry(telemetry);
            }
          }
        };
      } catch (e) {
        console.warn('Local BroadcastChannel fallback active:', e);
      }
    }
  }

  private initNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setNetworkError(null);
        if (this.currentUserId && this.currentGroupId) {
          this.connect(this.currentUserId, this.currentGroupId);
        }
      });

      window.addEventListener('offline', () => {
        this.setNetworkError('Browser is offline. Switched to zero-latency Local Fleet Mesh.');
        this.isFallbackMode = true;
        this.isConnected = true;
      });
    }
  }

  public connect(userId: string, groupId: string = 'global'): void {
    this.currentUserId = userId;
    this.currentGroupId = groupId;

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const channelName = `ucop-group-${groupId}`;
        if (this.supabaseChannel) {
          try {
            this.supabaseChannel.unsubscribe();
          } catch (err) {
            console.debug('Previous channel cleanup notice:', err);
          }
        }

        this.supabaseChannel = supabase.channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: userId },
          },
        });

        this.supabaseChannel
          .on('broadcast', { event: 'telemetry' }, (payload) => {
            if (payload.payload && payload.payload.id !== this.currentUserId) {
              this.notifyTelemetry(payload.payload as VehicleTelemetry);
            }
          })
          .on('presence', { event: 'sync' }, () => {
            if (this.supabaseChannel) {
              try {
                const presenceState = this.supabaseChannel.presenceState();
                const activeUserIds = Object.keys(presenceState);
                this.presenceCallbacks.forEach((cb) => cb(activeUserIds));
              } catch (e) {
                console.debug('Presence sync notice:', e);
              }
            }
          })
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              this.isConnected = true;
              this.isFallbackMode = false;
              this.setNetworkError(null);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              const msg = err ? err.message : `Realtime ${status.toLowerCase()}`;
              console.warn(`Supabase ${status}, failing over to local mesh:`, msg);
              this.isFallbackMode = true;
              this.isConnected = true;
              this.setNetworkError(`Cloud channel ${status.toLowerCase()}. Local Fleet Mesh active.`);
            }
          });
      } else {
        // No Supabase client configured -> run smoothly in Local Fleet Mesh
        this.isConnected = true;
        this.isFallbackMode = true;
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Network exception';
      console.warn('Realtime connection exception caught, fallback active:', errMsg);
      this.isFallbackMode = true;
      this.isConnected = true;
      this.setNetworkError(`Network exception: ${errMsg}. Local Fleet Mesh active.`);
    }
  }

  public broadcast(telemetry: VehicleTelemetry, force: boolean = false): void {
    const now = Date.now();
    if (!force && now - this.lastBroadcastTime < this.minBroadcastIntervalMs) {
      return;
    }
    this.lastBroadcastTime = now;

    // 1. Supabase Realtime broadcast (with exception suppression)
    if (this.supabaseChannel && this.isConnected && !this.isFallbackMode) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'telemetry',
          payload: telemetry,
        }).catch((err) => {
          console.debug('Supabase broadcast packet dropped:', err);
        });
      } catch (err) {
        console.debug('Supabase send exception:', err);
      }
    }

    // 2. BroadcastChannel cross-tab bus (always active for zero failure risk)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'TELEMETRY',
          payload: telemetry,
        });
      } catch (err) {
        console.debug('BroadcastChannel send notice:', err);
      }
    }
  }

  public injectExternalTelemetry(telemetry: VehicleTelemetry): void {
    this.notifyTelemetry(telemetry);
  }

  public onTelemetry(callback: TelemetryCallback): () => void {
    this.telemetryCallbacks.add(callback);
    return () => this.telemetryCallbacks.delete(callback);
  }

  public onPresence(callback: PresenceCallback): () => void {
    this.presenceCallbacks.add(callback);
    return () => this.presenceCallbacks.delete(callback);
  }

  public onError(callback: NetworkErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  private setNetworkError(error: string | null): void {
    this.lastNetworkError = error;
    this.errorCallbacks.forEach((cb) => {
      try {
        cb(error);
      } catch (e) {
        console.error('Error in network error callback:', e);
      }
    });
  }

  private notifyTelemetry(telemetry: VehicleTelemetry): void {
    this.telemetryCallbacks.forEach((cb) => {
      try {
        cb(telemetry);
      } catch (err) {
        console.error('Error in telemetry callback:', err);
      }
    });
  }

  public disconnect(): void {
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.unsubscribe();
      } catch (e) {
        console.debug('Channel disconnect notice:', e);
      }
      this.supabaseChannel = null;
    }
    this.isConnected = false;
  }

  public getStatus(): {
    connected: boolean;
    hasSupabase: boolean;
    channel: string | null;
    isFallbackMode: boolean;
    lastError: string | null;
  } {
    return {
      connected: this.isConnected,
      hasSupabase: getSupabaseClient() !== null && !this.isFallbackMode,
      channel: this.currentGroupId,
      isFallbackMode: this.isFallbackMode,
      lastError: this.lastNetworkError,
    };
  }
}

// Global Singleton for sync service
export const syncService = new SyncService();
