import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  DriverType,
  RiskLevel,
  VehicleTelemetry,
  VehicleState,
  CollisionMetrics,
} from '../types/vehicle';
import { Group } from '../types/group';
import { TripRecord, TripStop } from '../types/trip';
import { NavigationRoute } from '../types/navigation';
import { AlertLogItem } from '../types/alerts';
import { syncService } from '../modules/realtime/syncService';
import { PresenceManager } from '../modules/realtime/presence';
import { browserGeoTracker } from '../modules/geolocation/geoTracker';
import { evaluateGPSHealth, GPSStatusReport } from '../modules/geolocation/degradation';
import { soundEffects } from '../modules/audio/soundEffects';
import { tripRecorder } from '../modules/trips/tripRecorder';
import {
  SimulatedVehicleInstance,
  ControlInput,
} from '../modules/simulation/simulator';
import { PRESET_SCENARIOS, DEFAULT_MAP_CENTER, PresetScenario, generateRandomVizagTraffic } from '../modules/simulation/presets';
import { coordinator, CoordinatorDecision, CoordinatorStats, NegotiationTransaction } from '../modules/simulation/coordinator';
import { STORAGE_KEYS, getStoredCredentials, saveStoredCredentials, resetSupabaseClient } from '../modules/realtime/supabase';

export interface UserSession {
  id: string;
  name: string;
  driverType: DriverType;
}

export interface AppSettings {
  audioEnabled: boolean;
  vibrationEnabled: boolean;
  collisionSensitivity: 'NORMAL' | 'HIGH' | 'LOW';
  stationaryStopThresholdSec: number;
  supabaseUrl: string;
  supabaseKey: string;
}

interface AppContextType {
  // User & Auth
  user: UserSession | null;
  login: (name: string, password?: string, driverType?: DriverType) => void;
  logout: () => void;

  // Self Telemetry & GPS
  selfTelemetry: VehicleTelemetry;
  gpsStatus: GPSStatusReport;
  updateSelfPosition: (pos: Partial<VehicleTelemetry>) => void;
  requestGPSPermission: () => Promise<void>;

  // Remote Vehicles & Realtime
  remoteVehicles: VehicleState[];
  syncStatus: { connected: boolean; hasSupabase: boolean; channel: string | null; isFallbackMode: boolean; lastError: string | null };

  // Collision Engine & Coordinator
  collisionMetrics: CollisionMetrics[];
  highestRiskLevel: RiskLevel;
  primaryAlert: CollisionMetrics | null;
  activeEmergencyAdvisory: CollisionMetrics | null;
  coordinatorDecisions: CoordinatorDecision[];
  coordinatorStats: CoordinatorStats;
  negotiationTransactions: NegotiationTransaction[];
  acknowledgeCoordinatorDecision: (id: string) => void;

  // Group Management
  activeGroup: Group | null;
  createGroup: (name: string) => Group;
  joinGroupByCode: (code: string) => boolean;
  addMemberToGroup: (member: { name: string; driverType?: DriverType; vehicleType?: string; speedKmh?: number }) => void;
  removeMemberFromGroup: (memberId: string) => void;
  leaveGroup: () => void;
  getInviteLink: () => string;

  // Simulation Lab
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  simVehicles: SimulatedVehicleInstance[];
  selectedSimVehicleId: string;
  setSelectedSimVehicleId: (id: string) => void;
  applyScenario: (scenarioId: string) => void;
  randomizeVizagTraffic: (vehicleCount?: number) => void;
  updateSimControls: (controls: ControlInput) => void;
  overrideVehicleHeading: (vehicleId: string, headingDeg: number) => void;
  turnVehicleRelative: (vehicleId: string, deltaDeg: number) => void;
  aimVehicleAtOther: (vehicleId: string, targetVehicleId: string) => void;
  setVehicleSpeedOverride: (vehicleId: string, speedKmh: number) => void;
  resetSimulation: () => void;

  // Navigation
  activeRoute: NavigationRoute | null;
  setActiveRoute: (route: NavigationRoute | null) => void;
  clearRoute: () => void;

  // Trips
  activeTrip: TripRecord | null;
  pastTrips: TripRecord[];
  lastCompletedTrip: TripRecord | null;
  clearLastCompletedTrip: () => void;
  activeStopNotification: TripStop | null;
  dismissStopNotification: () => void;
  startTrip: () => void;
  pauseTrip: () => void;
  resumeTrip: () => void;
  endTrip: () => void;

  // Alerts History
  alertHistory: AlertLogItem[];
  clearAlertHistory: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  audioEnabled: true,
  vibrationEnabled: true,
  collisionSensitivity: 'NORMAL',
  stationaryStopThresholdSec: 15,
  supabaseUrl: '',
  supabaseKey: '',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. User Session — persist authorized session across reloads
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        const ALLOWED_USERS = ['dheeraj', 'nithin', 'bjs', 'lehari', 'pardhu', 'chayy'];
        if (parsed && parsed.name && ALLOWED_USERS.includes(parsed.name.trim().toLowerCase())) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading saved user session:', e);
    }
    return null;
  });

  // 2. Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      const creds = getStoredCredentials();
      const base = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
      return { ...base, supabaseUrl: creds.url, supabaseKey: creds.key };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // 3. Self Vehicle Telemetry (Visakhapatnam by default)
  const [selfTelemetry, setSelfTelemetry] = useState<VehicleTelemetry>(() => ({
    id: 'driver-self',
    name: 'Car Alpha (Self)',
    driverType: 'normal',
    latitude: DEFAULT_MAP_CENTER.latitude,
    longitude: DEFAULT_MAP_CENTER.longitude,
    speedKmh: 0,
    headingDeg: 0,
    accuracyMeters: 4.0,
    timestamp: Date.now(),
    isSimulated: false,
  }));

  // 4. Remote Vehicles
  const [remoteVehicles, setRemoteVehicles] = useState<VehicleState[]>([]);
  const presenceManagerRef = useRef<PresenceManager>(new PresenceManager());

  // 5. GPS Health Status
  const [isSimulatedGpsLoss, setIsSimulatedGpsLoss] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GPSStatusReport>(() =>
    evaluateGPSHealth(4.0, Date.now(), {
      latitude: DEFAULT_MAP_CENTER.latitude,
      longitude: DEFAULT_MAP_CENTER.longitude,
    })
  );

  // 6. Collision & Coordinator State
  const [collisionMetrics, setCollisionMetrics] = useState<CollisionMetrics[]>([]);
  const [highestRiskLevel, setHighestRiskLevel] = useState<RiskLevel>('SAFE');
  const [primaryAlert, setPrimaryAlert] = useState<CollisionMetrics | null>(null);
  const [activeEmergencyAdvisory, setActiveEmergencyAdvisory] = useState<CollisionMetrics | null>(null);
  const [coordinatorDecisions, setCoordinatorDecisions] = useState<CoordinatorDecision[]>([]);
  const [negotiationTransactions, setNegotiationTransactions] = useState<NegotiationTransaction[]>([]);
  const [coordinatorStats, setCoordinatorStats] = useState<CoordinatorStats>({
    totalVehiclesTracked: 0,
    activePairsEvaluated: 0,
    criticalDecisionsThisCycle: 0,
    cautionDecisionsThisCycle: 0,
    totalDecisionsIssued: 0,
    totalCollisionsAvertedCount: 0,
    lastEvaluationMs: 0,
    evaluationsPerSecond: 10,
    activeEvasiveManeuversCount: 0,
  });

  // 7. Group State
  const [activeGroup, setActiveGroup] = useState<Group | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // 8. Simulation Lab State
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [selectedSimVehicleId, setSelectedSimVehicleId] = useState<string>('car-a');
  const simInstancesRef = useRef<Map<string, SimulatedVehicleInstance>>(new Map());
  const [simVehiclesState, setSimVehiclesState] = useState<SimulatedVehicleInstance[]>([]);
  const currentControlsRef = useRef<ControlInput>({ throttle: 0, brake: 0, steer: 0, handbrake: false });

  // 9. Navigation
  const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null);

  // 10. Trips
  const [activeTrip, setActiveTrip] = useState<TripRecord | null>(null);
  const [pastTrips, setPastTrips] = useState<TripRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_TRIPS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [lastCompletedTrip, setLastCompletedTrip] = useState<TripRecord | null>(null);
  const [activeStopNotification, setActiveStopNotification] = useState<TripStop | null>(null);

  // 11. Alerts History
  const [alertHistory, setAlertHistory] = useState<AlertLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_ALERTS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Load a scenario into simulation vehicle instances
  const loadScenario = useCallback((scenario: PresetScenario) => {
    coordinator.reset();
    const map = new Map<string, SimulatedVehicleInstance>();
    scenario.vehicles.forEach((v) => {
      const isAI = v.id !== 'car-a';
      const inst = new SimulatedVehicleInstance({
        id: v.id,
        name: v.name,
        driverType: v.driverType,
        color: v.color,
        initialPos: v.position,
        initialSpeedKmh: v.speedKmh,
        initialHeadingDeg: v.headingDeg,
        isAI,
        road: v.road,
        roadProgress: v.roadProgress,
        roadDirection: v.roadDirection,
      });
      inst.isDegraded = !!v.isDegraded;
      inst.isNetworkLost = !!v.isNetworkLost;
      if (isAI) {
        inst.setTarget(v.speedKmh, v.headingDeg);
      }
      map.set(v.id, inst);
    });
    simInstancesRef.current = map;
    setSimVehiclesState(Array.from(map.values()));
    setIsSimulatedGpsLoss(!!scenario.vehicles.find((v) => v.id === 'car-a' && v.isDegraded));
  }, []);

  const initSimVehicles = useCallback((scenarioIndex: number = 0) => {
    const scenario = PRESET_SCENARIOS[scenarioIndex] || PRESET_SCENARIOS[0];
    loadScenario(scenario);
  }, [loadScenario]);

  // Subscribe to coordinator decisions and stats
  useEffect(() => {
    const unsubDec = coordinator.onDecision(() => {
      setCoordinatorDecisions([...coordinator.getDecisionLog()]);
      setNegotiationTransactions([...coordinator.getNegotiationLog()]);
    });
    const unsubStats = coordinator.onStats((stats) => {
      setCoordinatorStats(stats);
      setNegotiationTransactions([...coordinator.getNegotiationLog()]);
    });
    return () => {
      unsubDec();
      unsubStats();
    };
  }, []);

  // Update sound effects manager settings
  useEffect(() => {
    soundEffects.setMuted(!settings.audioEnabled);
    soundEffects.setVibrationEnabled(settings.vibrationEnabled);
  }, [settings.audioEnabled, settings.vibrationEnabled]);

  // Hook up trip recorder stop notifications
  useEffect(() => {
    tripRecorder.setOnStopDetected((stop) => {
      setActiveStopNotification(stop);
    });
  }, []);

  // Sync service connection lifecycle
  useEffect(() => {
    if (user) {
      const groupId = activeGroup?.id || 'global-fleet';
      syncService.connect(user.id, groupId);

      const unsubscribeTelemetry = syncService.onTelemetry((telemetry) => {
        if (telemetry.id !== user.id) {
          presenceManagerRef.current.updateVehicle(telemetry);
          setRemoteVehicles(presenceManagerRef.current.getAllVehicles());
        }
      });

      return () => {
        unsubscribeTelemetry();
        syncService.disconnect();
      };
    }
  }, [user, activeGroup]);

  // Main Simulation Physics Loop — pure rAF at ~60fps, NO setState inside
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let stateFlushAccum = 0;
    const STATE_FLUSH_INTERVAL = 50; // flush React state at 20fps max

    const loop = (currentTime: number) => {
      const dtSec = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;
      stateFlushAccum += dtSec * 1000;

      if (isSimulating && simInstancesRef.current.size > 0) {
        // ── Physics step ────────────────────────────────────────────────────
        simInstancesRef.current.forEach((vehicle, id) => {
          const controls = id === selectedSimVehicleId ? currentControlsRef.current : undefined;
          vehicle.update(dtSec, controls);
        });

        // ── React state flush (max 20fps) ───────────────────────────────────
        if (stateFlushAccum >= STATE_FLUSH_INTERVAL) {
          stateFlushAccum = 0;

          // Always sync selfTelemetry to the currently selected vehicle
          const activeSelected = simInstancesRef.current.get(selectedSimVehicleId) || simInstancesRef.current.get('car-a');
          if (activeSelected) {
            const telemetry = activeSelected.toTelemetry();
            setSelfTelemetry(telemetry);
            syncService.broadcast(telemetry);
          }

          simInstancesRef.current.forEach((vehicle, id) => {
            if (id !== selectedSimVehicleId && !vehicle.isNetworkLost) {
              const tel = vehicle.toTelemetry();
              presenceManagerRef.current.updateVehicle(tel);
              syncService.broadcast(tel);
            }
          });

          setSimVehiclesState(Array.from(simInstancesRef.current.values()));
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSimulating, selectedSimVehicleId]);

  // Periodic Telemetry Evaluation & Centralized Coordinator Tick (~10Hz / 100ms)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Tick presence manager for staleness
      const currentOthers = presenceManagerRef.current.tick();
      setRemoteVehicles([...currentOthers]);

      // 2. Feed ALL simulated fleet vehicles directly into Centralized Safety Coordinator
      simInstancesRef.current.forEach((v) => {
        coordinator.reportTelemetry(v.toTelemetry());
      });
      currentOthers.forEach((v) => coordinator.reportTelemetry(v));

      // 3. Centralized Coordinator evaluates all pairs
      const metrics = coordinator.evaluate();
      setCollisionMetrics(metrics);
      setCoordinatorDecisions([...coordinator.getDecisionLog()]);
      setNegotiationTransactions([...coordinator.getNegotiationLog()]);

      // 3b. Dispatch cooperative directives to simulated vehicles (Autonomous Fleet Coordination)
      simInstancesRef.current.forEach((vehicle, id) => {
        const activeDirective = coordinator.getActiveDirectiveForVehicle(id) || null;
        vehicle.executeCooperativeDirective(activeDirective);
      });

      // 4. Find threat for the selected vehicle or highest fleet threat
      const selectedThreat = coordinator.evaluateForVehicle(selectedSimVehicleId);
      const emergencyThreat = metrics.find((m) => m.isEmergencyAlert) || null;
      const highestFleetThreat = metrics.find((m) => m.riskLevel === 'CRITICAL' || m.riskLevel === 'CAUTION') || null;

      const activeAlert = selectedThreat && (selectedThreat.riskLevel === 'CRITICAL' || selectedThreat.riskLevel === 'CAUTION')
        ? selectedThreat
        : highestFleetThreat;

      const maxRisk = activeAlert?.riskLevel || 'SAFE';

      setHighestRiskLevel(maxRisk);
      setPrimaryAlert(activeAlert);
      setActiveEmergencyAdvisory(emergencyThreat);

      // 5. Trigger audio/vibration cues on state transition
      if (maxRisk === 'CRITICAL' || maxRisk === 'CAUTION' || maxRisk === 'CLEARED') {
        soundEffects.playRiskAlert(maxRisk);
      }
      if (emergencyThreat && maxRisk !== 'CRITICAL') {
        soundEffects.playEmergencySiren();
      }

      // 6. Log alert history if caution or critical
      if (activeAlert && (activeAlert.riskLevel === 'CRITICAL' || activeAlert.riskLevel === 'CAUTION')) {
        const now = Date.now();
        setAlertHistory((prev) => {
          const recent = prev[0];
          if (recent && recent.vehicleId === activeAlert.targetVehicleId && now - recent.timestamp < 4000) {
            return prev;
          }
          const newLog: AlertLogItem = {
            id: `alert-${now}-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: now,
            vehicleId: activeAlert.targetVehicleId,
            vehicleName: activeAlert.targetVehicleName,
            driverType: activeAlert.targetDriverType,
            riskLevel: activeAlert.riskLevel,
            reason: activeAlert.explanation.why,
            distanceMeters: activeAlert.distanceMeters,
            closingSpeedKmh: activeAlert.closingSpeedKmh,
            ttcSec: activeAlert.timeToCollisionSec,
            cpaDistanceMeters: activeAlert.cpaDistanceMeters,
            safetyRadiusMeters: activeAlert.safetyRadiusMeters,
            positionConfidence: activeAlert.positionConfidence,
            recommendedAction: activeAlert.explanation.recommendedAction,
            locationSelf: { latitude: selfTelemetry.latitude, longitude: selfTelemetry.longitude },
            locationOther: {
              latitude: activeAlert.cpaPointTarget.latitude,
              longitude: activeAlert.cpaPointTarget.longitude,
            },
          };
          const updatedHistory = [newLog, ...prev.slice(0, 49)];
          localStorage.setItem(STORAGE_KEYS.SAVED_ALERTS, JSON.stringify(updatedHistory));
          return updatedHistory;
        });

        if (activeTrip && activeTrip.status === 'ACTIVE') {
          tripRecorder.recordWarning(activeAlert.riskLevel as 'CAUTION' | 'CRITICAL');
        }
      }

      // 7. Update Trip Recorder if active
      if (activeTrip && activeTrip.status === 'ACTIVE') {
        tripRecorder.logPoint(
          { latitude: selfTelemetry.latitude, longitude: selfTelemetry.longitude },
          selfTelemetry.speedKmh,
          selfTelemetry.headingDeg
        );
        setActiveTrip({ ...tripRecorder.getActiveTrip()! });
      }

      // 8. Update GPS health report
      setGpsStatus(
        evaluateGPSHealth(
          selfTelemetry.accuracyMeters,
          selfTelemetry.timestamp,
          { latitude: selfTelemetry.latitude, longitude: selfTelemetry.longitude },
          isSimulatedGpsLoss
        )
      );
    }, 100);

    return () => clearInterval(interval);
  }, [selfTelemetry, isSimulatedGpsLoss, activeTrip]);

  // Auth Functions
  const login = (name: string, _password?: string, driverType: DriverType = 'normal') => {
    const id = `drv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const newSession: UserSession = { id, name, driverType };
    setUser(newSession);
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(newSession));

    setSelfTelemetry((prev) => ({
      ...prev,
      id,
      name,
      driverType,
    }));

    requestGPSPermission();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    browserGeoTracker.stop();
  };

  const requestGPSPermission = async () => {
    try {
      const coords = await browserGeoTracker.startTracking();
      setSelfTelemetry((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: Date.now(),
      }));

      browserGeoTracker.onUpdate((tel) => {
        if (!isSimulating) {
          setSelfTelemetry((prev) => {
            const updated = { ...prev, ...tel, timestamp: Date.now() };
            syncService.broadcast(updated);
            return updated;
          });
        }
      });
    } catch (e) {
      console.warn('Geolocation permission error:', e);
    }
  };

  const updateSelfPosition = (pos: Partial<VehicleTelemetry>) => {
    setSelfTelemetry((prev) => {
      const updated = { ...prev, ...pos, timestamp: Date.now() };
      syncService.broadcast(updated);
      return updated;
    });
  };

  // Group Management
  const createGroup = (name: string): Group => {
    const code = `UCOP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      code,
      name,
      ownerId: user?.id || 'anonymous',
      createdAt: Date.now(),
      members: [
        {
          id: user?.id || 'owner',
          name: user?.name || 'Group Host',
          driverType: user?.driverType || 'normal',
          joinedAt: Date.now(),
          lastActiveAt: Date.now(),
          isOwner: true,
          color: '#2563eb',
          currentRiskLevel: 'SAFE',
        },
      ],
    };
    setActiveGroup(newGroup);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP, JSON.stringify(newGroup));
    return newGroup;
  };

  const joinGroupByCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (!clean || clean.length < 3) return false;
    const formattedCode = clean.startsWith('UCOP-') ? clean : `UCOP-${clean}`;

    const joinedGroup: Group = {
      id: `grp-${formattedCode.toLowerCase()}`,
      code: formattedCode,
      name: `Fleet Squad ${formattedCode}`,
      ownerId: 'peer',
      createdAt: Date.now(),
      members: [
        {
          id: user?.id || 'me',
          name: user?.name || 'Me (Driver)',
          driverType: user?.driverType || 'normal',
          joinedAt: Date.now(),
          lastActiveAt: Date.now(),
          color: '#2563eb',
          currentRiskLevel: 'SAFE',
          isOwner: true,
          speedKmh: 45,
        },
      ],
    };
    setActiveGroup(joinedGroup);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP, JSON.stringify(joinedGroup));
    return true;
  };

  const addMemberToGroup = (member: { name: string; driverType?: DriverType; vehicleType?: string; speedKmh?: number }) => {
    if (!activeGroup) return;

    const colors = ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: member.name,
      driverType: member.driverType || 'normal',
      vehicleType: member.vehicleType || 'Sedan Car',
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
      color: randomColor,
      currentRiskLevel: 'SAFE' as const,
      speedKmh: member.speedKmh !== undefined ? member.speedKmh : Math.floor(30 + Math.random() * 40),
    };

    const updatedGroup: Group = {
      ...activeGroup,
      members: [...activeGroup.members, newMember],
    };

    setActiveGroup(updatedGroup);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP, JSON.stringify(updatedGroup));
  };

  const removeMemberFromGroup = (memberId: string) => {
    if (!activeGroup) return;
    const updatedGroup: Group = {
      ...activeGroup,
      members: activeGroup.members.filter((m) => m.id !== memberId),
    };
    setActiveGroup(updatedGroup);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP, JSON.stringify(updatedGroup));
  };

  const leaveGroup = () => {
    setActiveGroup(null);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_GROUP);
  };

  const getInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://u-cop.app';
    const code = activeGroup?.code || 'UCOP-VIZAG';
    return `${origin}/groups?join=${code}`;
  };

  // Simulation Lab Controls & Real-Time Dynamic Direction Overrides
  const applyScenario = (scenarioId: string) => {
    const scenario = PRESET_SCENARIOS.find((s) => s.id === scenarioId);
    if (scenario) {
      loadScenario(scenario);
      setIsSimulating(true);
    }
  };

  const randomizeVizagTraffic = (vehicleCount: number = 8) => {
    const randomScenario = generateRandomVizagTraffic(vehicleCount);
    loadScenario(randomScenario);
    setIsSimulating(true);
  };

  const overrideVehicleHeading = (vehicleId: string, headingDeg: number) => {
    const inst = simInstancesRef.current.get(vehicleId);
    if (inst) {
      inst.overrideHeading(headingDeg);
      setSimVehiclesState(Array.from(simInstancesRef.current.values()));
    }
  };

  const turnVehicleRelative = (vehicleId: string, deltaDeg: number) => {
    const inst = simInstancesRef.current.get(vehicleId);
    if (inst) {
      inst.turnRelative(deltaDeg);
      setSimVehiclesState(Array.from(simInstancesRef.current.values()));
    }
  };

  const aimVehicleAtOther = (vehicleId: string, targetVehicleId: string) => {
    const source = simInstancesRef.current.get(vehicleId);
    const target = simInstancesRef.current.get(targetVehicleId);
    if (source && target) {
      source.aimAt(target.latitude, target.longitude);
      setSimVehiclesState(Array.from(simInstancesRef.current.values()));
    }
  };

  const setVehicleSpeedOverride = (vehicleId: string, speedKmh: number) => {
    const inst = simInstancesRef.current.get(vehicleId);
    if (inst) {
      inst.setSpeedOverride(speedKmh);
      setSimVehiclesState(Array.from(simInstancesRef.current.values()));
    }
  };

  const acknowledgeCoordinatorDecision = (id: string) => {
    coordinator.acknowledgeDecision(id);
    setCoordinatorDecisions([...coordinator.getDecisionLog()]);
    setNegotiationTransactions([...coordinator.getNegotiationLog()]);
  };

  const updateSimControls = (controls: ControlInput) => {
    currentControlsRef.current = controls;
  };

  const resetSimulation = () => {
    initSimVehicles(0);
    currentControlsRef.current = { throttle: 0, brake: 0, steer: 0, handbrake: false };
  };

  // Trip Recording
  const startTrip = () => {
    const rec = tripRecorder.startTrip(
      user?.id || 'driver',
      user?.name || 'Driver',
      { latitude: selfTelemetry.latitude, longitude: selfTelemetry.longitude }
    );
    setActiveTrip({ ...rec });
    setLastCompletedTrip(null);
  };

  const pauseTrip = () => {
    tripRecorder.pauseTrip();
    if (activeTrip) {
      setActiveTrip({ ...activeTrip, status: 'PAUSED' });
    }
  };

  const resumeTrip = () => {
    tripRecorder.resumeTrip();
    if (activeTrip) {
      setActiveTrip({ ...activeTrip, status: 'ACTIVE' });
    }
  };

  const endTrip = () => {
    const completed = tripRecorder.endTrip();
    if (completed) {
      setLastCompletedTrip(completed);
      setActiveTrip(null);
      setPastTrips((prev) => {
        const updated = [completed, ...prev];
        localStorage.setItem(STORAGE_KEYS.SAVED_TRIPS, JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clearLastCompletedTrip = () => {
    setLastCompletedTrip(null);
  };

  // Live 1-second Trip Duration & Distance Kinematics updater
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== 'ACTIVE') return;

    const timer = setInterval(() => {
      const rec = tripRecorder.getActiveTrip();
      if (rec && rec.status === 'ACTIVE') {
        const now = Date.now();
        rec.durationSeconds = Math.max(1, Math.round((now - rec.startTime) / 1000));

        // Speed in km/h (use self telemetry or default urban cruising speed 48 km/h)
        const currentSpeed = selfTelemetry.speedKmh > 5 ? selfTelemetry.speedKmh : 48;
        const stepMeters = (currentSpeed / 3.6) * 1.0;
        rec.totalDistanceMeters += stepMeters;
        rec.maxSpeedKmh = Math.max(rec.maxSpeedKmh, currentSpeed);

        const hours = rec.durationSeconds / 3600;
        rec.averageSpeedKmh = Number(((rec.totalDistanceMeters / 1000) / hours).toFixed(1));

        setActiveTrip({ ...rec });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTrip?.id, activeTrip?.status, selfTelemetry.speedKmh]);

  const dismissStopNotification = () => {
    setActiveStopNotification(null);
  };

  const clearAlertHistory = () => {
    setAlertHistory([]);
    localStorage.removeItem(STORAGE_KEYS.SAVED_ALERTS);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(updated));
      if (newSettings.supabaseUrl !== undefined || newSettings.supabaseKey !== undefined) {
        saveStoredCredentials(updated.supabaseUrl, updated.supabaseKey);
        resetSupabaseClient();
      }
      return updated;
    });
  };

  // Default init on mount
  useEffect(() => {
    initSimVehicles(0);
  }, [initSimVehicles]);

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        selfTelemetry,
        gpsStatus,
        updateSelfPosition,
        requestGPSPermission,
        remoteVehicles,
        syncStatus: syncService.getStatus(),
        collisionMetrics,
        highestRiskLevel,
        primaryAlert,
        activeEmergencyAdvisory,
        coordinatorDecisions,
        coordinatorStats,
        negotiationTransactions,
        acknowledgeCoordinatorDecision,
        activeGroup,
        createGroup,
        joinGroupByCode,
        addMemberToGroup,
        removeMemberFromGroup,
        leaveGroup,
        getInviteLink,
        isSimulating,
        setIsSimulating,
        simVehicles: simVehiclesState,
        selectedSimVehicleId,
        setSelectedSimVehicleId,
        applyScenario,
        randomizeVizagTraffic,
        updateSimControls,
        overrideVehicleHeading,
        turnVehicleRelative,
        aimVehicleAtOther,
        setVehicleSpeedOverride,
        resetSimulation,
        activeRoute,
        setActiveRoute,
        clearRoute: () => setActiveRoute(null),
        activeTrip,
        pastTrips,
        lastCompletedTrip,
        clearLastCompletedTrip,
        activeStopNotification,
        dismissStopNotification,
        startTrip,
        pauseTrip,
        resumeTrip,
        endTrip,
        alertHistory,
        clearAlertHistory,
        settings,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
