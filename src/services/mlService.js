/**
 * MediSync ML Simulation Service
 * 
 * In a real application, these functions would call a Python/Flask backend 
 * or a TensorFlow.js model. Here, we simulate the logic with advanced heuristics.
 */

// 1. Calculate Risk Score based on adherence history
export function calculateRiskScore(adherenceScore, missedDosesCount) {
    if (adherenceScore < 50 || missedDosesCount > 3) {
        return { level: 'Critical', color: 'red', score: 90 }; // High Risk
    } else if (adherenceScore < 80 || missedDosesCount > 1) {
        return { level: 'Attention', color: 'yellow', score: 60 }; // Medium Risk
    } else {
        return { level: 'Stable', color: 'green', score: 10 }; // Low Risk
    }
}

// 2. Predict Adherence for Next Week (Mock Linear Regression)
export function predictAdherence(currentAdherence, trend) {
    // If trend is positive, predict slight increase, else decrease
    const predicted = trend === 'up' ? Math.min(100, currentAdherence + 5) : Math.max(0, currentAdherence - 5);
    return Math.round(predicted);
}

// 3. Generate Smart Motivational Message (NLP Simulation)
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

// 4. ML-Based Reminder Optimization
export function optimizeReminderTime(medicineName, originalTime) {
    // Mock: Suggest 15 mins later if adherence is low for this med (Simulated)
    return `Suggestion: Take ${medicineName} at ${originalTime} + 15 mins for better adherence.`;
}

// 5. Emergency Risk Prediction
export function predictEmergencyRisk(vitals) {
    if (!vitals) return 'Low';
    // Simple rule-based check
    if (vitals.bpSys > 140 || vitals.sugar > 180) {
        return 'High';
    }
    return 'Low';
}
