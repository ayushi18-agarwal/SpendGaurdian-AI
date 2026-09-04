import { TransactionAttempt, TrustScore, TrustScoreCategory, TrustScoreBreakdownItem } from '../types';

/**
 * Deterministic Trust Score Engine.
 * Calculates an explainable 0 - 100 trust score from an agent's real audit history.
 * No pseudo-randomness, no unverified ML assertions.
 * 
 * Classifications:
 * - 80 - 100: TRUSTED
 * - 60 - 79: MONITORED
 * - 40 - 59: ELEVATED_RISK
 * - 0 - 39: HIGH_RISK
 */
export function calculateAgentTrustScore(
  agentId: string,
  transactions: TransactionAttempt[],
  baselineAvg = 1000
): TrustScore {
  // Filter transactions for this agent, chronological order (most recent first)
  const agentTxs = transactions
    .filter(t => t.agentId === agentId)
    .slice(0, 30); // Look at up to the last 30 transactions

  if (agentTxs.length === 0) {
    return {
      score: 85,
      category: 'TRUSTED',
      breakdown: [
        { label: 'Initial Baseline Provisioning', points: 85, type: 'positive' },
        { label: 'Awaiting Autonomous Execution Data', points: 0, type: 'positive' },
      ],
      cleanStreak: 0,
    };
  }

  // Base score starting point
  let score = 75;
  const breakdown: TrustScoreBreakdownItem[] = [];
  breakdown.push({ label: 'Baseline Identity Verification', points: 75, type: 'positive' });

  // 1. Calculate Compliant Executed Transactions (+3 per compliant executed transaction, max +20)
  const compliantTxs = agentTxs.filter(t => t.decision === 'ALLOW' && t.status === 'EXECUTED');
  const compliancePoints = Math.min(20, compliantTxs.length * 3);
  if (compliancePoints > 0) {
    score += compliancePoints;
    breakdown.push({
      label: `${compliantTxs.length} Compliant Executed Payments`,
      points: compliancePoints,
      type: 'positive',
    });
  }

  // 2. Clean Streak: consecutive ALLOWs without any risk flags
  let cleanStreak = 0;
  for (const t of agentTxs) {
    if (t.decision === 'ALLOW' && (!t.evaluation.triggeredSignals || t.evaluation.triggeredSignals.length === 0)) {
      cleanStreak++;
    } else {
      break;
    }
  }

  if (cleanStreak >= 5) {
    score += 5;
    breakdown.push({
      label: `${cleanStreak}-Transaction Clean Compliance Streak`,
      points: 5,
      type: 'positive',
    });
  }

  // 3. Deductions for Hard Blocks (-15 per blocked transaction, max -45)
  const blockedTxs = agentTxs.filter(t => t.decision === 'BLOCK');
  if (blockedTxs.length > 0) {
    const penalty = Math.min(45, blockedTxs.length * 15);
    score -= penalty;
    breakdown.push({
      label: `${blockedTxs.length} Blocked Policy Violation(s)`,
      points: -penalty,
      type: 'negative',
    });
  }

  // 4. Deductions for Behavioral Anomalies (velocity, time, amount, cross-agent)
  let anomalyCount = 0;
  agentTxs.forEach(t => {
    const sigs = t.evaluation?.triggeredSignals || [];
    sigs.forEach(s => {
      if (s.key === 'amount_anomaly' || s.key === 'velocity_anomaly' || s.key === 'unusual_time' || s.key === 'cross_agent_anomaly') {
        anomalyCount++;
      }
    });
  });

  if (anomalyCount > 0) {
    const penalty = Math.min(30, anomalyCount * 5);
    score -= penalty;
    breakdown.push({
      label: `${anomalyCount} Behavioral Anomaly Signal(s)`,
      points: -penalty,
      type: 'negative',
    });
  }

  // 5. Deductions for Pending/Required Approvals (-4 each, max -16)
  const approvalTxs = agentTxs.filter(t => t.decision === 'APPROVAL_REQUIRED');
  if (approvalTxs.length > 0) {
    const penalty = Math.min(16, approvalTxs.length * 4);
    score -= penalty;
    breakdown.push({
      label: `${approvalTxs.length} Escalated Review Trigger(s)`,
      points: -penalty,
      type: 'negative',
    });
  }

  // Clamp strictly between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let category: TrustScoreCategory = 'TRUSTED';
  if (finalScore < 40) {
    category = 'HIGH_RISK';
  } else if (finalScore < 60) {
    category = 'ELEVATED_RISK';
  } else if (finalScore < 80) {
    category = 'MONITORED';
  } else {
    category = 'TRUSTED';
  }

  return {
    score: finalScore,
    category,
    breakdown,
    cleanStreak,
  };
}
