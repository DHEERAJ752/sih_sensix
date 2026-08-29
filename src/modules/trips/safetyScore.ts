import { SafetyScoreBreakdown, TripPoint, TripStop } from '../../types/trip';

export function computeTripSafetyScore(
  points: TripPoint[],
  _stops: TripStop[],
  cautionWarningsCount: number,
  criticalWarningsCount: number,
  maxSpeedKmh: number,
  _avgSpeedKmh: number
): SafetyScoreBreakdown {
  let smoothDrivingScore = 100;
  let collisionAvoidanceScore = 100;
  let speedComplianceScore = 100;
  const feedback: string[] = [];

  // 1. Collision Penalty
  const collisionPenalty = criticalWarningsCount * 25 + cautionWarningsCount * 8;
  collisionAvoidanceScore = Math.max(0, 100 - collisionPenalty);

  if (criticalWarningsCount > 0) {
    feedback.push(`Encountered ${criticalWarningsCount} critical collision warning(s) — maintain larger defensive buffers.`);
  } else if (cautionWarningsCount > 0) {
    feedback.push(`Encountered ${cautionWarningsCount} proximity caution(s).`);
  } else {
    feedback.push('Flawless collision avoidance — zero hazard warnings triggered!');
  }

  // 2. Speed Compliance Penalty
  if (maxSpeedKmh > 90) {
    speedComplianceScore -= 30;
    feedback.push(`Excessive top speed recorded (${maxSpeedKmh.toFixed(0)} km/h). Keep within city limits.`);
  } else if (maxSpeedKmh > 75) {
    speedComplianceScore -= 15;
    feedback.push(`Moderate high speed recorded (${maxSpeedKmh.toFixed(0)} km/h).`);
  } else {
    feedback.push('Excellent speed compliance throughout the trip.');
  }

  // 3. Smoothness / Jerk evaluation
  let harshBrakingEvents = 0;
  for (let i = 1; i < points.length; i++) {
    const dtSec = (points[i].timestamp - points[i - 1].timestamp) / 1000;
    if (dtSec > 0.3 && dtSec < 3.0) {
      const deltaSpeedMps = ((points[i].speedKmh - points[i - 1].speedKmh) * 1000) / 3600;
      const decel = -deltaSpeedMps / dtSec;
      if (decel > 4.5) {
        harshBrakingEvents++;
      }
    }
  }

  smoothDrivingScore = Math.max(20, 100 - harshBrakingEvents * 12);
  if (harshBrakingEvents > 0) {
    feedback.push(`Detected ${harshBrakingEvents} harsh braking event(s). Apply progressive braking.`);
  } else {
    feedback.push('Smooth driving with gradual deceleration and stable speed maintenance.');
  }

  // Weighted overall score
  const overallScore = Math.round(
    collisionAvoidanceScore * 0.5 +
    smoothDrivingScore * 0.25 +
    speedComplianceScore * 0.25
  );

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 55) grade = 'C';
  else if (overallScore >= 40) grade = 'D';
  else grade = 'F';

  return {
    overallScore,
    smoothDrivingScore: Math.round(smoothDrivingScore),
    collisionAvoidanceScore: Math.round(collisionAvoidanceScore),
    speedComplianceScore: Math.round(speedComplianceScore),
    grade,
    feedback,
  };
}
