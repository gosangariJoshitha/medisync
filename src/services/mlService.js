/**
 * MediSync Advanced ML Models Simulation Service
 *
 * Implements the 5 Core ML Models mapped to Day 0 -> Mature Learning phases.
 * (Client-side simulation mirroring a real Python Orchids AI backend).
 */

// Helper: Determine maturity phase based on observation time
function getMaturityPhase(daysTracked) {
  if (daysTracked <= 7) return "rule_based";
  if (daysTracked <= 21) return "learning";
  return "mature";
}

/**
 * 🔹 MODEL 1: Medication Adherence Prediction
 * Predicts the chance of missing the next dose.
 */
export function predictAdherenceRisk(
  daysTracked = 14,
  missedDoses = 0,
  snoozeCount = 0,
) {
  const phase = getMaturityPhase(daysTracked);

  // Day 0 - 7: Rule Based
  if (phase === "rule_based") {
    if (missedDoses >= 3) return { riskPercentage: null, riskLabel: "High" };
    if (missedDoses >= 2 || snoozeCount >= 3)
      return { riskPercentage: null, riskLabel: "Medium" };
    return { riskPercentage: null, riskLabel: "Low" };
  }

  // Day 7+: ML Simulation
  let baseScore = 15; // default low baseline risk
  baseScore += missedDoses * 12;
  baseScore += snoozeCount * 4;

  const riskPercentage = Math.min(95, baseScore); // Cap at 95%

  let riskLabel = "Low";
  if (riskPercentage > 65) riskLabel = "High";
  else if (riskPercentage > 35) riskLabel = "Medium";

  // In learning phase, we return % but low confidence (UI might hide raw %)
  return { riskPercentage, riskLabel };
}

/**
 * 🔹 MODEL 2: Patient Behavior Pattern
 * Identifies habit patterns for personalization.
 */
export function analyzeBehaviorPattern(daysTracked = 14, traits = {}) {
  const phase = getMaturityPhase(daysTracked);

  if (phase === "rule_based") {
    return { behaviorType: "Insufficient data", confidence: "None" };
  }

  const { lateNightDoses = 0, missedWeekends = 0 } = traits;

  let behaviorType = "Stable Schedule";
  if (lateNightDoses >= 3) behaviorType = "Night Dose Delayer";
  if (missedWeekends >= 2) behaviorType = "Weekend Irregular";

  const confidence = phase === "learning" ? "Low" : "High";

  return { behaviorType, confidence };
}

/**
 * 🔹 MODEL 3: Smart Reminder Optimization
 * Decides best time and channel based on behavior model.
 */
export function optimizeReminder(daysTracked = 14, originalTime, behaviorType) {
  const phase = getMaturityPhase(daysTracked);

  if (phase === "rule_based" || !originalTime) {
    return { suggestedTime: originalTime, channel: "App Notification" };
  }

  let suggestedTime = originalTime;
  let channel = "App Notification";

  // Optimization Application
  if (behaviorType === "Night Dose Delayer") {
    try {
      // Shift by +30 mins
      const [h, m] = originalTime.split(":").map(Number);
      let date = new Date(2000, 1, 1, h, m);
      date.setMinutes(date.getMinutes() + 30);
      suggestedTime = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    } catch (e) {}
  }

  if (phase === "mature" && behaviorType === "Weekend Irregular") {
    channel = "Voice Chat / SMS"; // Escalate medium
  }

  return { suggestedTime, channel };
}

/**
 * 🔹 MODEL 4: Treatment Effectiveness (Doctor Intelligence)
 * Measures if treatment is providing clinical value.
 */
export function evaluateTreatmentEffectiveness(
  daysTracked = 30,
  adherencePercentage = 90,
  vitalsTrend = { improving: true },
) {
  if (daysTracked <= 14) {
    return { score: null, status: "Insufficient data" };
  }

  if (daysTracked <= 30) {
    if (adherencePercentage > 80 && vitalsTrend.improving)
      return { score: null, status: "Early response observed" };
    return { score: null, status: "Monitoring needed" };
  }

  // Mature ML Score Regression
  let score = adherencePercentage * 0.6 + (vitalsTrend.improving ? 40 : 10);
  score = Math.min(100, Math.round(score));

  let status = "Stable";
  if (score > 80) status = "Improving";
  else if (score < 50) status = "Declining";

  return { score, status };
}

/**
 * 🔹 MODEL 5: Emergency Risk Prediction
 * Safety-critical escalations before SOS is triggered.
 */
export function predictEmergencyRisk(
  consecutiveMissedDoses = 0,
  vitals = null,
) {
  let level = 1;
  let text = "Stable";

  const hasBadVitals = vitals && (vitals.sysBP > 160 || vitals.sugar > 250);

  if (consecutiveMissedDoses >= 3 && hasBadVitals) {
    level = 5;
    text = "Critical - Immediate Action Required";
  } else if (consecutiveMissedDoses >= 2 && hasBadVitals) {
    level = 4;
    text = "High Risk - Escalate to Doctor";
  } else if (consecutiveMissedDoses >= 3 || hasBadVitals) {
    level = 3;
    text = "Attention Needed";
  } else if (consecutiveMissedDoses >= 1) {
    level = 2;
    text = "Monitor Closely";
  }

  return { escalationLevel: level, text };
}

// -----------------------------------------------------
// Legacy Wrappers (Kept to prevent breaking existing App logic)
// -----------------------------------------------------

export function calculateRiskScore(adherenceScore, missedDosesCount) {
  if (adherenceScore < 50 || missedDosesCount > 3) {
    return { level: "Critical", color: "red", score: 90 };
  } else if (adherenceScore < 80 || missedDosesCount > 1) {
    return { level: "Attention", color: "yellow", score: 60 };
  } else {
    return { level: "Stable", color: "green", score: 10 };
  }
}

export function predictAdherence(currentAdherence, trend) {
  const predicted =
    trend === "up"
      ? Math.min(100, currentAdherence + 5)
      : Math.max(0, currentAdherence - 5);
  return Math.round(predicted);
}

export function getSmartMessage(username, streak, adherence) {
  if (streak > 5) {
    return `🔥 You're on fire, ${username}! ${streak} day streak. Keep it up!`;
  } else if (adherence < 50) {
    return `Don't give up, ${username}. Missing doses happens, but let's get back on track today!`;
  } else if (adherence > 90) {
    return `Excellent work, ${username}! Your health is in good hands.`;
  } else {
    return `Welcome back, ${username}. Stay consistent for better health!`;
  }
}
