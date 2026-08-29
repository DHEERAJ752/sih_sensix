# Product Requirements Document (PRD)

## Project Name
**U-COP** — Unified Cooperative Positioning & Collision Safety Platform

## Document Purpose
This PRD defines the scope, features, and technical requirements for a hackathon-ready web application demonstrating GNSS-based cooperative vehicle positioning and real-time collision avoidance using low-cost mobile devices.

---

## 1. Background & Problem Statement

Autonomous and semi-autonomous vehicles typically rely on expensive hardware (LIDAR, proximity sensors) for collision avoidance. This project explores whether **raw positioning data from consumer Android/mobile devices**, shared between nearby vehicles in real time, can provide a low-cost alternative for proximity detection and collision warnings.

Since raw GNSS hardware access requires native Android development, this hackathon build simulates the positioning layer in-browser while implementing the full real-time data-sharing and collision-detection logic as it would function with real GNSS input.

## 2. Objective

Build a **working, demoable web application** that:
- Shares live vehicle position data between multiple devices over the internet
- Calculates collision risk between vehicle pairs using relative motion, not just static distance
- Displays clear, explainable, real-time warnings to drivers
- Demonstrates the concept convincingly to judges within a live demo

## 3. Scope

### In Scope
- Browser Geolocation API for real-device positioning
- Simulated vehicles (keyboard/touch-controlled and preset-path) for reliable demo conditions
- Real-time data sync over the internet (not local-network dependent)
- Vector-based collision detection engine (distance, relative velocity, TTC, CPA)
- Explainable, data-driven collision warnings
- Emergency vehicle detection and advisory
- Group-based vehicle visibility
- Basic navigation, trip recording, and alert history

### Out of Scope
- Raw GNSS/pseudorange/carrier-phase/Doppler measurement processing
- Android-native GNSS APIs
- Accelerometer/gyroscope sensor fusion or dead reckoning
- Production-grade security/auth hardening (hackathon-grade auth is sufficient)

## 4. Target Users

- **Normal drivers** — receive collision and proximity warnings
- **Emergency vehicle drivers** — broadcast priority status to nearby vehicles
- **Hackathon judges** — evaluators observing a live demo

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend / Realtime | Supabase (Auth, Database, Realtime channels) |
| Mapping | Leaflet or Mapbox |
| Positioning | Browser Geolocation API + in-app vehicle simulator |

Architecture must be modular: collision logic, realtime sync, simulation, groups, and trip recording implemented as independent modules, not coupled to UI components.

## 6. Functional Requirements

### 6.1 Authentication
- Login with Name, Password, Driver Type (Normal / Emergency)
- Request browser location permission post-login
- Display GPS accuracy, current speed, heading, last update timestamp

### 6.2 Live Map Dashboard
- Displays: own vehicle, group vehicles, emergency vehicles, destination/route, heading indicators, per-vehicle risk status
- Color coding: Green (safe) / Yellow (caution) / Red (critical) / Emergency icon

### 6.3 Real-Time Positioning
- Track per vehicle: latitude, longitude, speed, heading, accuracy, timestamp
- Sync across devices approximately every 1 second via Supabase Realtime
- Must function over standard internet/cellular connections (no shared-Wi-Fi dependency)
- Display live connection status; mark vehicles "stale" after update timeout

### 6.4 Vehicle Simulator ("Simulation Lab")
- User-controllable vehicles: Car A, Car B, Emergency Vehicle
- Keyboard controls: W/↑ accelerate, S/↓ brake/reverse, A/← left, D/→ right, Space stop
- Touch controls for mobile
- Simulated vehicles must produce real, changing lat/long/speed/heading values consumed by the Collision Engine exactly as real vehicle data would be
- One-click preset scenarios:
  - Safe Drive
  - Head-On Collision (demo-critical — must reliably trigger collision warning)
  - Following Distance
  - Emergency Approach
  - Sudden Stop
  - GPS Loss
  - Network Loss

### 6.5 Collision Engine
Independent module (`CollisionEngine`) computing, per vehicle pair:
- Distance
- Relative position (vector-based)
- Relative velocity (vector-based, using speed + heading of both vehicles)
- Closing speed
- Time To Collision (TTC)
- Closest Point of Approach (CPA) and CPA distance
- Position uncertainty (derived from GPS accuracy)
- Dynamic safety radius (scales with speed and uncertainty)

Must account for data freshness — stale position data reduces confidence in the risk calculation.

### 6.6 Explainable Collision Warnings
Warnings must never be generic. Each must state:
- Reason (in plain language)
- Distance
- Closing speed
- TTC
- CPA distance
- Safety radius
- Position confidence
- Recommended action

Risk state machine: SAFE → CAUTION → CRITICAL → CLEARED

On Caution/Critical: visible alert, audio alert, browser vibration (where supported), with cooldown to prevent alert spam.

### 6.7 Map Collision Visualization
When risk is active, render on map: vehicle direction vectors, projected paths, CPA point, safety radius circles.

### 6.8 Emergency Vehicle Handling
- Visually distinct marker
- Approach alert to nearby normal vehicles including distance, closing speed, estimated arrival, and advisory action

### 6.9 Groups
- Create group / join via code / leave group
- Auto-generated group code (e.g. `UCOP-7F42`) and shareable invite link
- Group members see each other's live position and risk status

### 6.10 Navigation
- Destination search
- Route display with distance and ETA

### 6.11 Trip Recording
- Start / Pause / End trip controls
- Records: route, duration, distance, speed, stops, collision warnings
- Post-trip summary: distance, duration, avg/max speed, stop count, total warnings, critical warnings, computed safety score

### 6.12 Stop/Break Detection
- Configurable stationary-time threshold triggers a stop/break notification

### 6.13 GPS Degradation Handling
- States: Location Active / Degraded / Unavailable
- Displays last known position and last update time
- "GPS Loss / Tunnel" demo scenario included
- Must not claim full GNSS/IMU dead reckoning capability

### 6.14 Alerts History
- Log of all past alerts: time, vehicle, risk level, reason, distance, closing speed, TTC, CPA, safety radius

## 7. Non-Functional Requirements

- **UI**: Light theme, white/light-gray palette, blue/indigo primary accent, risk colors (green/yellow/red) reserved exclusively for risk indication, responsive across desktop/mobile
- **Reliability**: Head-On Collision demo scenario must trigger consistently — this is the centerpiece of the live demo
- **Security**: API keys/secrets via environment variables; `.env.example` provided
- **Documentation**: README covering setup, Supabase configuration, API keys, run/deploy instructions
- **Modularity**: Collision logic, realtime sync, simulation, groups, and trip recording implemented as separable modules

## 8. Application Pages

1. Login
2. Dashboard
3. Live Map
4. Simulation Lab
5. Groups
6. Navigation
7. Trips
8. Alerts
9. Profile / Settings

## 9. Demo Flow (Acceptance Scenario)

1. Login as Driver A
2. Login as Driver B (separate device/tab)
3. Create/Join shared group
4. Open Live Map
5. Start Head-On Collision simulation
6. Vehicles move toward each other; live distance, relative position, closing speed, TTC, and CPA update in real time
7. Risk state transitions Green → Yellow → Red with explainable warning shown
8. Vehicles moved apart; risk clears
9. Emergency Vehicle approach demonstrated
10. GPS Loss scenario demonstrated
11. Trip recorded and summary displayed

## 10. Success Criteria

- All 9 pages functional and navigable
- Real-time sync works across two separate devices over the internet
- Collision Engine outputs are calculated live (not hard-coded) and match the explainable-warning format
- Head-On Collision scenario reliably produces a Red-risk warning during live demo
- Application is visually presentable and stable enough for uninterrupted live demonstration

## 11. Constraints

- Development window: ~20 hours (hackathon time-box)
- Team includes at least one member with no prior coding/web development experience
- No native mobile app development — browser-only implementation
