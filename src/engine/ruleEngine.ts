import { 
  Agent, 
  Policy, 
  Decision, 
  EvaluationResult, 
  RiskSignal, 
  SignalKey, 
  PolicyCheckResult,
  SecurityState
} from '../types';

export interface EvaluationContext {
  agent: Agent;
  policy: Policy;
  historicalExecutedAvg: number;
  todayExecutedSpend: number;
  recentAttemptsCountIn60s: number; // number of prior attempts in the 60s window
  isCompromiseOverride?: boolean;
  adaptiveState?: SecurityState;
  adaptiveLimit?: number;
  isCrossAgentAnomaly?: boolean;
}

export interface TransactionInput {
  agentId: string;
  merchant: string;
  category: string;
  amount: number;
  timestamp?: string; // ISO string
}

/**
 * Determines whether a transaction timestamp falls during unusual/off-hours.
 * Allowed normal window: 06:00 through 23:00 local server time.
 * Unusual time: before 06:00 OR after 23:00 local time.
 * 
 * Boundary specifications:
 * - 03:00 local time -> UNUSUAL_TIME (true)
 * - 05:59 local time -> UNUSUAL_TIME (true)
 * - 06:00 local time -> normal (false)
 * - 12:00 local time -> normal (false)
 * - 23:00 local time -> normal (false)
 * - 23:01 local time -> UNUSUAL_TIME (true)
 * 
 * Uses date.getHours() directly on local server time, strictly avoiding getUTCHours().
 */
export function isUnusualTime(isoTimestamp?: string): boolean {
  const date = isoTimestamp ? new Date(isoTimestamp) : new Date();
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // Total minutes from start of day in local time
  const totalMinutes = hours * 60 + minutes;
  const startNormal = 6 * 60;   // 06:00 = 360 min
  const endNormal = 23 * 60;    // 23:00 = 1380 min

  return totalMinutes < startNormal || totalMinutes > endNormal;
}

/**
 * Pure deterministic Rule Engine for Agent Spend Guardian.
 * Zero external calls, zero non-deterministic logic.
 */
export function evaluateTransaction(
  input: TransactionInput,
  context: EvaluationContext
): EvaluationResult {
  const { agent, policy, historicalExecutedAvg, todayExecutedSpend, recentAttemptsCountIn60s } = context;
  const timestamp = input.timestamp || new Date().toISOString();

  // 1. Agent Status check
  const isSuspended = agent.status === 'suspended' || context.adaptiveState === 'SUSPENDED';

  // 2. Category Restriction check
  // Matches normalized allowed categories
  const normalizedCategory = (input.category || '').trim().toLowerCase();
  const allowedCategoriesNorm = (policy.allowedCategories || []).map(c => c.toLowerCase());
  // Also check against agent primary category
  const agentCatNorm = (agent.category || '').toLowerCase();
  
  const categoryAllowed = allowedCategoriesNorm.length === 0 || 
    allowedCategoriesNorm.includes(normalizedCategory) || 
    agentCatNorm.includes(normalizedCategory) ||
    normalizedCategory.includes(agentCatNorm);

  const restrictedCategory = !categoryAllowed;

  // 3. Effective Transaction Limit calculation (Adaptive Response can only tighten, never loosen)
  let effectiveLimit = policy.perTransactionLimit;
  if (context.adaptiveState === 'RESTRICTED') {
    const rawAdaptiveLimit = context.adaptiveLimit !== undefined 
      ? context.adaptiveLimit 
      : Math.round(policy.perTransactionLimit * 0.5);
    effectiveLimit = Math.min(policy.perTransactionLimit, rawAdaptiveLimit);
  } else if (context.adaptiveState === 'LOCKDOWN' && context.adaptiveLimit !== undefined) {
    effectiveLimit = Math.min(policy.perTransactionLimit, context.adaptiveLimit);
  }

  // Transaction Limit check (amount <= effectiveLimit)
  const withinTxLimit = input.amount <= effectiveLimit;
  const txLimitExceeded = !withinTxLimit;

  // 4. Daily Budget check (todayExecutedSpend + amount <= dailyLimit)
  const withinDailyBudget = (todayExecutedSpend + input.amount) <= policy.dailyLimit;
  const dailyBudgetExceeded = !withinDailyBudget;

  // 5. New Merchant check
  const normalizedMerchant = (input.merchant || '').trim().toLowerCase();
  const knownMerchantsNorm = (agent.knownMerchants || []).map(m => m.toLowerCase());
  const isKnownMerchant = knownMerchantsNorm.includes(normalizedMerchant);
  const isNewMerchant = !isKnownMerchant;

  // 6. Amount Anomaly check (amount > 3 * baseline)
  // Baseline is derived only from historical executed average
  const baseline = historicalExecutedAvg > 0 ? historicalExecutedAvg : agent.historicalAvg;
  const isAmountAnomaly = baseline > 0 && input.amount > (3 * baseline);

  // 7. Velocity Anomaly check
  // Exactly 5 attempts in 60s is allowed; the 6th attempt (recent count >= 5 prior attempts) triggers anomaly
  const isVelocityAnomaly = recentAttemptsCountIn60s >= 5;

  // 8. Time Anomaly check
  const timeAnomaly = policy.unusualTimeCheck && isUnusualTime(timestamp);

  // 9. Cross-Agent Anomaly check
  const isCrossAgentAnomaly = Boolean(context.isCrossAgentAnomaly);

  // Assemble Risk Signals
  const signals: RiskSignal[] = [
    {
      key: 'agent_suspended',
      label: 'Agent Suspended',
      points: 100,
      description: 'Agent account is currently suspended due to security governance lock',
      triggered: isSuspended,
    },
    {
      key: 'restricted_category',
      label: 'Restricted Category',
      points: 40,
      description: `Category "${input.category}" is not authorized under ${agent.name}'s mandate`,
      triggered: restrictedCategory,
    },
    {
      key: 'transaction_limit',
      label: 'Transaction Limit Exceeded',
      points: 30,
      description: `Attempted ₹${input.amount.toLocaleString('en-IN')} exceeds single transaction limit of ₹${effectiveLimit.toLocaleString('en-IN')}`,
      triggered: txLimitExceeded,
    },
    {
      key: 'daily_budget',
      label: 'Daily Budget Exceeded',
      points: 30,
      description: `Execution would bring today's spend to ₹${(todayExecutedSpend + input.amount).toLocaleString('en-IN')}, exceeding daily budget of ₹${policy.dailyLimit.toLocaleString('en-IN')}`,
      triggered: dailyBudgetExceeded,
    },
    {
      key: 'new_merchant',
      label: 'New Merchant',
      points: 15,
      description: `Merchant "${input.merchant}" is not in ${agent.name}'s verified supplier registry`,
      triggered: isNewMerchant,
    },
    {
      key: 'amount_anomaly',
      label: 'Behavioral Amount Anomaly',
      points: 25,
      description: `Attempt ₹${input.amount.toLocaleString('en-IN')} exceeds 3x historical average baseline (₹${Math.round(baseline).toLocaleString('en-IN')})`,
      triggered: isAmountAnomaly,
    },
    {
      key: 'velocity_anomaly',
      label: 'Velocity Anomaly',
      points: 25,
      description: `Rapid transaction burst detected (${recentAttemptsCountIn60s + 1} attempts within rolling 60s window)`,
      triggered: isVelocityAnomaly,
    },
    {
      key: 'unusual_time',
      label: 'Unusual Operating Hour',
      points: 10,
      description: `Attempt occurred outside regular operating window (06:00 - 23:00 IST)`,
      triggered: timeAnomaly,
    },
    {
      key: 'cross_agent_anomaly',
      label: 'Cross-Agent Spending Anomaly',
      points: 20,
      description: 'Coordinated spending burst detected across 3+ agents targeting same merchant within 120s',
      triggered: isCrossAgentAnomaly,
    },
  ];

  const triggeredSignals = signals.filter(s => s.triggered);

  // Risk Score calculation: sum of triggered points, capped at 100
  const rawRiskScore = triggeredSignals.reduce((acc, s) => acc + s.points, 0);
  let riskScore = Math.min(100, isSuspended ? 100 : rawRiskScore);

  // Hard Block conditions
  const hasHardBlock = isSuspended || restrictedCategory || txLimitExceeded || dailyBudgetExceeded;

  // Decision logic with Adaptive Response state integration
  let decision: Decision;
  if (hasHardBlock || riskScore >= 80) {
    decision = 'BLOCK';
  } else if (context.adaptiveState === 'LOCKDOWN') {
    // Level 3 Lockdown: All transactions mandate human review
    decision = 'APPROVAL_REQUIRED';
    riskScore = Math.max(riskScore, 45);
  } else if (
    riskScore >= 40 || 
    (isNewMerchant && (policy.newMerchantAction === 'approval_required' || context.adaptiveState === 'RESTRICTED'))
  ) {
    decision = 'APPROVAL_REQUIRED';
  } else {
    decision = 'ALLOW';
  }

  // Compile specific human-readable reasons
  const reasons: string[] = [];
  if (isSuspended) reasons.push('Agent account is currently suspended.');
  if (restrictedCategory) reasons.push(`Unauthorized category "${input.category}".`);
  if (txLimitExceeded) reasons.push(`Amount exceeds ₹${effectiveLimit.toLocaleString('en-IN')} single transaction cap${context.adaptiveState === 'RESTRICTED' ? ' (tightened under RESTRICTED state)' : ''}.`);
  if (dailyBudgetExceeded) reasons.push(`Exceeds daily budget of ₹${policy.dailyLimit.toLocaleString('en-IN')} (Current: ₹${todayExecutedSpend.toLocaleString('en-IN')}).`);
  if (isNewMerchant) reasons.push(`Unverified merchant "${input.merchant}".`);
  if (isAmountAnomaly) reasons.push(`Amount exceeds 3x historical average baseline.`);
  if (isVelocityAnomaly) reasons.push(`Velocity burst exceeds 5 attempts per 60s.`);
  if (timeAnomaly) reasons.push(`Transaction attempted during off-hours.`);
  if (isCrossAgentAnomaly) reasons.push(`Coordinated cross-agent spending anomaly detected.`);
  if (context.adaptiveState === 'LOCKDOWN') reasons.push('All transactions require human approval under security LOCKDOWN.');

  if (reasons.length === 0) {
    reasons.push('Transaction matches all policy thresholds and behavioral baselines.');
  }

  // Detect Compromise
  const isCompromise = context.isCompromiseOverride || (
    riskScore >= 90 && 
    (restrictedCategory || txLimitExceeded) && 
    (isVelocityAnomaly || isNewMerchant || timeAnomaly)
  );

  const checks: PolicyCheckResult = {
    agentAuthorized: !isSuspended && !restrictedCategory,
    categoryAllowed,
    withinTxLimit,
    withinDailyBudget,
    isKnownMerchant,
    amountAnomaly: isAmountAnomaly,
    velocityAnomaly: isVelocityAnomaly,
    timeAnomaly,
    isSuspended,
    crossAgentAnomaly: isCrossAgentAnomaly,
  };

  const defaultExplanation = generateFallbackExplanation(
    decision,
    agent.name,
    input.merchant,
    input.amount,
    reasons,
    isCompromise
  );

  return {
    decision,
    riskScore,
    signals,
    triggeredSignals,
    reasons,
    isCompromise,
    checks,
    evaluatedAt: timestamp,
    explanation: defaultExplanation,
    adaptiveState: context.adaptiveState || 'NORMAL',
    effectiveLimit,
  };
}

/**
 * High-precision deterministic fallback explanation generator
 * Always available even when AI / network is offline.
 */
export function generateFallbackExplanation(
  decision: Decision,
  agentName: string,
  merchant: string,
  amount: number,
  reasons: string[],
  isCompromise?: boolean
): string {
  const formattedAmount = `₹${amount.toLocaleString('en-IN')}`;

  if (isCompromise) {
    return `🚨 Critical compromise alert: ${agentName}'s attempt of ${formattedAmount} at ${merchant} was hard-blocked due to concurrent category violations, velocity burst, and off-hour anomaly.`;
  }

  if (decision === 'BLOCK') {
    const mainReasons = reasons.slice(0, 2).join(' and ').toLowerCase();
    return `${agentName}'s payment of ${formattedAmount} to ${merchant} was blocked because of ${mainReasons || 'critical policy violations'}.`;
  }

  if (decision === 'APPROVAL_REQUIRED') {
    const mainReasons = reasons.slice(0, 2).join(' and ').toLowerCase();
    return `${agentName}'s payment of ${formattedAmount} to ${merchant} requires human authorization due to ${mainReasons || 'an unverified merchant and risk threshold'}.`;
  }

  return `${agentName}'s payment of ${formattedAmount} to ${merchant} was authorized as it fully complies with authorized spending policy and behavioral baselines.`;
}
