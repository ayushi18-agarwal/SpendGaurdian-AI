import { TransactionAttempt, CrossAgentAnomaly } from '../types';

/**
 * Evaluates whether a new candidate transaction triggers a Cross-Agent Spending Anomaly.
 * 
 * Rule:
 * 3 or more different agents transacting with the same merchant within 120 seconds
 * AND combined amount > ₹20,000.
 */
export function detectCrossAgentAnomaly(
  candidate: {
    agentId: string;
    merchant: string;
    amount: number;
    timestamp?: string;
  },
  recentTransactions: TransactionAttempt[]
): {
  isAnomaly: boolean;
  anomaly?: CrossAgentAnomaly;
  affectedAgentIds: string[];
  combinedAmount: number;
} {
  const candidateTime = candidate.timestamp ? new Date(candidate.timestamp).getTime() : Date.now();
  const windowMs = 120 * 1000; // 120 seconds
  const normalizedCandidateMerchant = candidate.merchant.trim().toLowerCase();

  // Find recent transactions with same merchant in window
  const windowTxs = recentTransactions.filter(tx => {
    const txTime = new Date(tx.timestamp).getTime();
    const timeDiff = Math.abs(candidateTime - txTime);
    const sameMerchant = tx.merchant.trim().toLowerCase() === normalizedCandidateMerchant;
    return sameMerchant && timeDiff <= windowMs;
  });

  // Collect unique agents involved
  const agentSet = new Set<string>();
  agentSet.add(candidate.agentId);
  windowTxs.forEach(tx => agentSet.add(tx.agentId));

  const totalAmount = candidate.amount + windowTxs.reduce((sum, tx) => sum + tx.amount, 0);

  // Trigger condition: >= 3 unique agents AND combined amount > 20,000
  if (agentSet.size >= 3 && totalAmount > 20000) {
    const affectedAgentIds = Array.from(agentSet);
    const relatedTxIds = windowTxs.map(tx => tx.id);

    const anomaly: CrossAgentAnomaly = {
      id: `caa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date(candidateTime).toISOString(),
      merchant: candidate.merchant,
      affectedAgents: affectedAgentIds,
      combinedAmount: totalAmount,
      timeWindowSeconds: 120,
      transactionIds: relatedTxIds,
      status: 'ACTIVE',
    };

    return {
      isAnomaly: true,
      anomaly,
      affectedAgentIds,
      combinedAmount: totalAmount,
    };
  }

  return {
    isAnomaly: false,
    affectedAgentIds: Array.from(agentSet),
    combinedAmount: totalAmount,
  };
}
