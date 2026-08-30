U-COP — Unified Cooperative Positioning & Collision Safety Platform
Smart India Hackathon 2026 | ISRO Problem Statement #25177 | Team SENSIX (Dheeraj, Nithin, Siddardha, Lahari, Pardhu, Chaitanya)

Designed and built a real-time, browser-native vehicle safety platform that simulates cooperative positioning and collision prevention using GNSS-inspired telemetry — without dependency on native hardware integration. The system models live vehicle trajectories, speeds, and positions to predict and warn against potential collisions before they occur, addressing ISRO's challenge of leveraging raw GNSS data for autonomous navigation and proximity detection.

Key Contributions:

Engineered a live vector-based road simulation using HTML5 Canvas, modeling a real-world street network (Visakhapatnam) with multiple road-constrained, independently animated vehicles
Built a 60 FPS multi-vehicle physics simulation featuring forward-oriented kinematics, dynamic headlights, and Web Audio API–driven proximity alerts that scale in urgency with closing distance
Developed a cooperative safety coordination layer handling automated right-of-way negotiation, evasive maneuver suggestions, and priority clearance logic for emergency vehicles
Implemented a real-time trip analytics module with live distance/speed telemetry, stop detection, and an AI-generated post-trip safety grading system (A+ to D)
Architected fleet networking functionality enabling squads to coordinate via unique shareable join codes, with role-based authentication and persistent sessions
Integrated Supabase for real-time multi-device state synchronization, enabling reliable live demonstrations across multiple physical devices

Tech Stack: React 18, TypeScript, Vite, Tailwind CSS, HTML5 Canvas, Web Audio API, Supabase (Realtime)
