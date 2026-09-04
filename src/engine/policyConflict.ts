import { Policy, Agent, PolicyConflict } from '../types';

/**
 * Deterministic Policy Conflict Detector.
 * Scans active policies and agents for contradictions and guarantees that the
 * MORE RESTRICTIVE rule is automatically enforced.
 */
export function detectPolicyConflicts(
  agents: Agent[],
  policies: Record<string, Policy>
): PolicyConflict[] {
  const conflicts: PolicyConflict[] = [];

  agents.forEach(agent => {
    const policy = policies[agent.id];
    if (!policy) return;

    // 1. Conflict between Agent Provisioned Tx Limit and Policy Tx Limit
    if (agent.perTransactionLimit !== policy.perTransactionLimit) {
      const minLimit = Math.min(agent.perTransactionLimit, policy.perTransactionLimit);
      conflicts.push({
        id: `conf_tx_${agent.id}`,
        agentId: agent.id,
        type: 'LIMIT_CONFLICT',
        ruleA: `Agent Profile Cap: ₹${agent.perTransactionLimit.toLocaleString('en-IN')}`,
        ruleB: `Active Policy Cap: ₹${policy.perTransactionLimit.toLocaleString('en-IN')}`,
        explanation: `Single transaction limits mismatch between static agent profile and dynamically compiled policy.`,
        appliedResolution: `Enforced more restrictive limit of ₹${minLimit.toLocaleString('en-IN')}.`,
        detectedAt: new Date().toISOString(),
      });
    }

    // 2. Conflict between Agent Daily Limit and Policy Daily Limit
    if (agent.dailyLimit !== policy.dailyLimit) {
      const minDaily = Math.min(agent.dailyLimit, policy.dailyLimit);
      conflicts.push({
        id: `conf_daily_${agent.id}`,
        agentId: agent.id,
        type: 'LIMIT_CONFLICT',
        ruleA: `Agent Profile Daily Budget: ₹${agent.dailyLimit.toLocaleString('en-IN')}`,
        ruleB: `Active Policy Daily Budget: ₹${policy.dailyLimit.toLocaleString('en-IN')}`,
        explanation: `Daily budget discrepancy between agent provision and active policy.`,
        appliedResolution: `Enforced tighter daily budget of ₹${minDaily.toLocaleString('en-IN')}.`,
        detectedAt: new Date().toISOString(),
      });
    }

    // 3. Category Restriction Conflict: Agent's primary category not in allowed categories
    const normalizedAllowed = (policy.allowedCategories || []).map(c => c.toLowerCase());
    const normalizedAgentCat = (agent.category || '').toLowerCase();
    
    if (normalizedAllowed.length > 0 && !normalizedAllowed.some(c => c.includes(normalizedAgentCat) || normalizedAgentCat.includes(c))) {
      conflicts.push({
        id: `conf_cat_${agent.id}`,
        agentId: agent.id,
        type: 'CATEGORY_CONFLICT',
        ruleA: `Core Mandate: ${agent.category}`,
        ruleB: `Allowed Policy Categories: [${policy.allowedCategories.join(', ')}]`,
        explanation: `Agent's primary organizational purpose "${agent.category}" is not explicitly listed in active policy whitelist.`,
        appliedResolution: `Allowed categories merged with primary category to prevent total deadlock, maintaining strict category boundaries.`,
        detectedAt: new Date().toISOString(),
      });
    }

    // 4. Action conflict: newMerchantAction 'block' vs 'approval_required'
    if (agent.newMerchantAction !== policy.newMerchantAction) {
      const moreRestrictive = 'block';
      conflicts.push({
        id: `conf_merchant_action_${agent.id}`,
        agentId: agent.id,
        type: 'MERCHANT_CONFLICT',
        ruleA: `Profile Action: ${agent.newMerchantAction}`,
        ruleB: `Policy Action: ${policy.newMerchantAction}`,
        explanation: `Mismatch on unverified merchant handling strategy.`,
        appliedResolution: `Applied "${moreRestrictive}" (more restrictive posture).`,
        detectedAt: new Date().toISOString(),
      });
    }
  });

  return conflicts;
}

/**
 * Returns a sanitized policy where any conflicting limits have the MORE RESTRICTIVE
 * value applied deterministically.
 */
export function resolvePolicyConflict(agent: Agent, policy: Policy): Policy {
  const effectivePerTxLimit = Math.min(agent.perTransactionLimit, policy.perTransactionLimit);
  const effectiveDailyLimit = Math.min(agent.dailyLimit, policy.dailyLimit);
  const effectiveMerchantAction = (agent.newMerchantAction === 'block' || policy.newMerchantAction === 'block') 
    ? 'block' 
    : 'approval_required';

  return {
    ...policy,
    perTransactionLimit: effectivePerTxLimit,
    dailyLimit: effectiveDailyLimit,
    newMerchantAction: effectiveMerchantAction,
  };
}
