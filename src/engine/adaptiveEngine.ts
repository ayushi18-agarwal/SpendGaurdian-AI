import { SecurityState, AdaptiveState, Policy, TransactionAttempt } from '../types';

/**
 * Initializes default adaptive state for an agent.
 */
export function createInitialAdaptiveState(agentId: string, configuredLimit: number): AdaptiveState {
  return {
    agentId,
    state: 'NORMAL',
    configuredLimit,
    adaptiveLimit: configuredLimit,
    reason: 'Initial nominal operating state. All policies active.',
    lastUpdated: new Date().toISOString(),
    cleanStreak: 0,
    transitionHistory: [
      {
        from: 'NORMAL',
        to: 'NORMAL',
        reason: 'Agent provisioned under standard governance baseline.',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Evaluates whether an agent should escalate or recover its security state
 * based on transaction history, trust score, and recent signals.
 * 
 * Hierarchy (Strict Monotonic Restriction):
 * NORMAL (0) < MONITOR (1) < RESTRICTED (2) < LOCKDOWN (3) < SUSPENDED (4)
 */
export function evaluateAdaptiveEscalation(
  currentState: AdaptiveState,
  policy: Policy,
  trustScore: number,
  lastTransaction: TransactionAttempt,
  recentAgentTransactions: TransactionAttempt[]
): {
  nextState: SecurityState;
  reason: string;
  adaptiveLimit: number;
  changed: boolean;
} {
  const current = currentState.state;

  // RULE: If already SUSPENDED, NEVER automatically recover.
  // Suspended state requires explicit human restoration.
  if (current === 'SUSPENDED') {
    return {
      nextState: 'SUSPENDED',
      reason: 'Agent remains suspended under explicit governance lock.',
      adaptiveLimit: 0,
      changed: false,
    };
  }

  // Count recent anomalies in last 5 transactions
  const recent5 = recentAgentTransactions.slice(0, 5);
  let recentAnomalies = 0;
  let recentBlocks = 0;
  let hasVelocity = false;
  let hasCrossAgent = false;

  recent5.forEach(t => {
    if (t.decision === 'BLOCK') recentBlocks++;
    t.evaluation?.triggeredSignals?.forEach(s => {
      if (s.key === 'amount_anomaly' || s.key === 'velocity_anomaly' || s.key === 'unusual_time') recentAnomalies++;
      if (s.key === 'velocity_anomaly') hasVelocity = true;
      if (s.key === 'cross_agent_anomaly') hasCrossAgent = true;
    });
  });

  // Check for confirmed compromise or critical risk >= 90
  if (lastTransaction.evaluation.isCompromise || lastTransaction.riskScore >= 95) {
    return {
      nextState: 'SUSPENDED',
      reason: 'Critical compromise detected; hard policy violation & high-velocity breach.',
      adaptiveLimit: 0,
      changed: current !== 'SUSPENDED',
    };
  }

  // Check for LOCKDOWN triggers (Level 3):
  // Severe velocity abuse, trust score < 40, or repeated blocked attempts
  if (trustScore < 40 || recentBlocks >= 2 || (hasVelocity && recentAnomalies >= 3)) {
    if (current !== 'LOCKDOWN' && current !== 'SUSPENDED') {
      return {
        nextState: 'LOCKDOWN',
        reason: 'Multiple high-risk policy violations and critical trust score deterioration (<40).',
        adaptiveLimit: Math.round(policy.perTransactionLimit * 0.25),
        changed: true,
      };
    }
  }

  // Check for RESTRICTED triggers (Level 2):
  // Multiple anomalies, velocity burst, cross-agent anomaly, or trust score < 60
  if (hasCrossAgent || hasVelocity || recentAnomalies >= 2 || trustScore < 60) {
    if (current === 'NORMAL' || current === 'MONITOR') {
      return {
        nextState: 'RESTRICTED',
        reason: hasCrossAgent 
          ? 'Coordinated cross-agent anomaly detected with shared supplier.' 
          : 'Multiple behavioral anomalies and velocity burst detected.',
        adaptiveLimit: Math.round(policy.perTransactionLimit * 0.5), // 50% cap
        changed: true,
      };
    }
  }

  // Check for MONITOR triggers (Level 1):
  // Single anomaly or trust score < 80
  if (recentAnomalies >= 1 || trustScore < 80) {
    if (current === 'NORMAL') {
      return {
        nextState: 'MONITOR',
        reason: 'Single behavioral deviation detected. Increased telemetry active.',
        adaptiveLimit: policy.perTransactionLimit,
        changed: true,
      };
    }
  }

  // ================= RECOVERY LOGIC =================
  // If current is MONITOR, RESTRICTED, or LOCKDOWN, check clean streak
  // Requires 5 consecutive clean transactions to step down one level
  const cleanStreak = currentState.cleanStreak;

  if (cleanStreak >= 5) {
    if (current === 'LOCKDOWN') {
      return {
        nextState: 'RESTRICTED',
        reason: `5 consecutive compliant transactions executed. De-escalated to RESTRICTED.`,
        adaptiveLimit: Math.round(policy.perTransactionLimit * 0.5),
        changed: true,
      };
    } else if (current === 'RESTRICTED') {
      return {
        nextState: 'MONITOR',
        reason: `5 consecutive compliant transactions executed. De-escalated to MONITOR.`,
        adaptiveLimit: policy.perTransactionLimit,
        changed: true,
      };
    } else if (current === 'MONITOR') {
      return {
        nextState: 'NORMAL',
        reason: `5 consecutive compliant transactions executed. Full recovery to NORMAL.`,
        adaptiveLimit: policy.perTransactionLimit,
        changed: true,
      };
    }
  }

  // No state change
  return {
    nextState: current,
    reason: currentState.reason,
    adaptiveLimit: current === 'RESTRICTED' 
      ? Math.round(policy.perTransactionLimit * 0.5) 
      : current === 'LOCKDOWN' 
        ? Math.round(policy.perTransactionLimit * 0.25)
        : current === 'SUSPENDED' 
          ? 0 
          : policy.perTransactionLimit,
    changed: false,
  };
}
