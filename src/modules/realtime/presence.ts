import { VehicleTelemetry, VehicleState, RiskLevel } from '../../types/vehicle';

export class PresenceManager {
  private vehicles: Map<string, VehicleState> = new Map();
  private staleTimeoutMs: number = 3500; // 3.5s timeout marks stale
  private purgeTimeoutMs: number = 25000; // 25s removes inactive vehicle

  public updateVehicle(telemetry: VehicleTelemetry, riskLevel: RiskLevel = 'SAFE'): VehicleState {
    const existing = this.vehicles.get(telemetry.id);
    const updated: VehicleState = {
      ...telemetry,
      isStale: false,
      lastSeenAgoSeconds: 0,
      currentRiskLevel: riskLevel,
      color: existing?.color || this.assignColor(telemetry.id, telemetry.driverType),
    };
    this.vehicles.set(telemetry.id, updated);
    return updated;
  }

  public tick(): VehicleState[] {
    const now = Date.now();
    const result: VehicleState[] = [];

    for (const [id, vehicle] of this.vehicles.entries()) {
      const ageMs = now - vehicle.timestamp;
      if (ageMs > this.purgeTimeoutMs) {
        this.vehicles.delete(id);
        continue;
      }

      vehicle.lastSeenAgoSeconds = Number((ageMs / 1000).toFixed(1));
      vehicle.isStale = ageMs > this.staleTimeoutMs;
      result.push(vehicle);
    }

    return result;
  }

  public getVehicle(id: string): VehicleState | undefined {
    return this.vehicles.get(id);
  }

  public getAllVehicles(): VehicleState[] {
    return Array.from(this.vehicles.values());
  }

  public removeVehicle(id: string): void {
    this.vehicles.delete(id);
  }

  public clear(): void {
    this.vehicles.clear();
  }

  private assignColor(id: string, driverType: string): string {
    if (driverType === 'emergency') return '#dc2626'; // Red for emergency
    const palette = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2', '#4f46e5'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
    }
    return palette[Math.abs(hash) % palette.length];
  }
}
