import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Agent, 
  Policy, 
  TransactionAttempt, 
  Decision, 
  TransactionStatus,
  SecurityState,
  AdaptiveState,
  TrustScore,
  CrossAgentAnomaly,
  PolicyConflict,
  IncidentReport
} from '../types';
import { SEEDED_AGENTS, INITIAL_POLICIES, SEED_TRANSACTIONS } from '../data/seedData';
import { evaluateTransaction, EvaluationContext, TransactionInput } from '../engine/ruleEngine';
import { calculateAgentTrustScore } from '../engine/trustEngine';
import { createInitialAdaptiveState, evaluateAdaptiveEscalation } from '../engine/adaptiveEngine';
import { detectCrossAgentAnomaly } from '../engine/crossAgentDetector';
import { detectPolicyConflicts } from '../engine/policyConflict';

interface Metrics {
  totalAttempts: number;
  executedPayments: number;
  allowedCount: number;
  approvalRequiredCount: number;
  blockedCount: number;
  amountProtected: number;
  totalExecutedAmount: number;
}

export interface WhatIfSimulationResult {
  original: {
    allowedCount: number;
    approvalCount: number;
    blockedCount: number;
    totalSpend: number;
    amountProtected: number;
  };
  simulated: {
    allowedCount: number;
    approvalCount: number;
    blockedCount: number;
    totalSpend: number;
    amountProtected: number;
  };
  changedTransactions: {
    id: string;
    merchant: string;
    amount: number;
    category: string;
    timestamp: string;
    originalDecision: Decision;
    simulatedDecision: Decision;
    originalReasons: string[];
    simulatedReasons: string[];
  }[];
}

interface StoreContextType {
  agents: Agent[];
  policies: Record<string, Policy>;
  transactions: TransactionAttempt[];
  adaptiveStates: Record<string, AdaptiveState>;
  trustScores: Record<string, TrustScore>;
  crossAgentAnomalies: CrossAgentAnomaly[];
  policyConflicts: PolicyConflict[];
  incidents: IncidentReport[];
  inspectingTx: TransactionAttempt | null;
  selectedIncident: IncidentReport | null;
  activeCompromiseAlert: { agent: Agent; tx: TransactionAttempt } | null;
  metrics: Metrics;
  apiMode: string;
  isProcessing: boolean;
  
  // Actions
  setInspectingTx: (tx: TransactionAttempt | null) => void;
  setSelectedIncident: (inc: IncidentReport | null) => void;
  dismissCompromiseAlert: () => void;
  suspendAgent: (agentId: string, reason?: string) => void;
  activateAgent: (agentId: string) => void;
  restoreAdaptiveState: (agentId: string) => void;
  resolveCrossAgentAnomaly: (anomalyId: string) => void;
  updatePolicy: (agentId: string, updatedPolicy: Partial<Policy>) => void;
  approveTransaction: (txId: string) => Promise<void>;
  rejectTransaction: (txId: string) => Promise<void>;
  simulateTransaction: (
    input: TransactionInput, 
    source?: 'SIMULATION' | 'COMPROMISE_SCENARIO' | 'AUTONOMOUS_AGENT' | 'SCRIPTED_TEST',
    overrideCompromise?: boolean,
    skipAiEnrich?: boolean
  ) => Promise<TransactionAttempt>;
  simulateCompromiseScenario: () => Promise<TransactionAttempt>;
  runWhatIfSimulation: (policyDraft: Policy, targetAgentId: string) => WhatIfSimulationResult;
  createIncidentReport: (incident: IncidentReport) => void;
  resetToDefaults: () => void;
  
  // Accounting helpers
  getDailyExecutedSpend: (agentId: string, targetDate?: Date) => number;
  getHistoricalExecutedAvg: (agentId: string) => number;
  getAttemptsInLast60Seconds: (agentId: string, refTime?: number) => number;
}

const STORAGE_KEYS = {
  AGENTS: 'asg_agents_v2',
  POLICIES: 'asg_policies_v2',
  TRANSACTIONS: 'asg_transactions_v2',
  ADAPTIVE: 'asg_adaptive_v2',
  CROSS_AGENT: 'asg_cross_agent_v2',
  INCIDENTS: 'asg_incidents_v2',
};

/**
 * Generates a cryptographically strong unique ID using crypto.randomUUID where available.
 */
function generateCryptoSecureId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Initial default incident seed for historical reference
const SEED_INCIDENTS: IncidentReport[] = [
  {
    id: 'INC-1042',
    timestamp: '2026-08-28T21:45:00.000Z',
    agentId: 'travelbot',
    agentName: 'TravelBot',
    merchant: 'Luxury Aviation Charter',
    amount: 145000,
    category: 'Private Charter',
    decision: 'BLOCK',
    riskScore: 95,
    trustScore: 48,
    securityState: 'RESTRICTED',
    triggeredSignals: [
      'Transaction limit exceeded (₹145,000 > ₹20,000)',
      'Behavioral Amount Anomaly (18x baseline)',
      'New unverified merchant',
      'Restricted sub-category'
    ],
    adaptiveResponse: 'Security state escalated to RESTRICTED. Effective spending cap clamped to ₹10,000.',
    actionTaken: 'Transaction blocked deterministically by rule engine. Zero funds disbursed.',
    amountProtected: 145000,
    relatedTransactionIds: ['tx_travel_hist_block_01'],
    geminiSummary: 'TravelBot attempted an unbudgeted ₹1,45,000 private air charter reservation severely exceeding its single transaction cap of ₹20,000. SpendGuardian intervened with an instantaneous block, shielding corporate funds and automatically tightening TravelBot into RESTRICTED posture.'
  }
];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize agents
  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AGENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading agents from storage', e);
    }
    return SEEDED_AGENTS;
  });

  // Initialize policies
  const [policies, setPolicies] = useState<Record<string, Policy>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POLICIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading policies from storage', e);
    }
    return INITIAL_POLICIES;
  });

  // Initialize transactions
  const [transactions, setTransactions] = useState<TransactionAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) {
        const parsed: TransactionAttempt[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed reading transactions from storage', e);
    }
    return SEED_TRANSACTIONS;
  });

  // Initialize Adaptive States
  const [adaptiveStates, setAdaptiveStates] = useState<Record<string, AdaptiveState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADAPTIVE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading adaptive states', e);
    }
    const initial: Record<string, AdaptiveState> = {};
    SEEDED_AGENTS.forEach(agent => {
      const p = INITIAL_POLICIES[agent.id];
      initial[agent.id] = createInitialAdaptiveState(agent.id, p ? p.perTransactionLimit : agent.perTransactionLimit);
    });
    return initial;
  });

  // Initialize Cross-Agent Anomalies
  const [crossAgentAnomalies, setCrossAgentAnomalies] = useState<CrossAgentAnomaly[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CROSS_AGENT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading cross agent anomalies', e);
    }
    return [];
  });

  // Initialize Incidents
  const [incidents, setIncidents] = useState<IncidentReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading incidents', e);
    }
    return SEED_INCIDENTS;
  });

  const [inspectingTx, setInspectingTx] = useState<TransactionAttempt | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [activeCompromiseAlert, setActiveCompromiseAlert] = useState<{ agent: Agent; tx: TransactionAttempt } | null>(null);
  const [apiMode, setApiMode] = useState<string>('HYBRID_MODE');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
    } catch (e) {
      console.error(e);
    }
  }, [agents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(policies));
    } catch (e) {
      console.error(e);
    }
  }, [policies]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADAPTIVE, JSON.stringify(adaptiveStates));
    } catch (e) {
      console.error(e);
    }
  }, [adaptiveStates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CROSS_AGENT, JSON.stringify(crossAgentAnomalies));
    } catch (e) {
      console.error(e);
    }
  }, [crossAgentAnomalies]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(incidents));
    } catch (e) {
      console.error(e);
    }
  }, [incidents]);

  // Check backend health / API mode on mount
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => {
        if (d.mode) setApiMode(d.mode);
      })
      .catch(() => setApiMode('ZERO_KEY_DEMO_MODE'));
  }, []);

  /**
   * CANONICAL ACCOUNTING HELPERS:
   * Rule: Only ALLOW and APPROVED count toward daily spend & baseline.
   * ALL attempts count toward velocity.
   */
  const getDailyExecutedSpend = (agentId: string, targetDate = new Date()): number => {
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const targetYMD = new Date(targetDate.getTime() + istOffsetMs).toISOString().slice(0, 10);
    return transactions
      .filter(t => {
        if (t.agentId !== agentId) return false;
        if (t.status !== 'EXECUTED' && t.status !== 'APPROVED') return false;
        const txDate = new Date(t.timestamp);
        const txYMD = new Date(txDate.getTime() + istOffsetMs).toISOString().slice(0, 10);
        return txYMD === targetYMD;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getHistoricalExecutedAvg = (agentId: string): number => {
    const executed = transactions.filter(
      t => t.agentId === agentId && (t.status === 'EXECUTED' || t.status === 'APPROVED')
    );
    if (executed.length === 0) {
      const ag = agents.find(a => a.id === agentId);
      return ag?.historicalAvg || 1000;
    }
    const sum = executed.reduce((acc, t) => acc + t.amount, 0);
    return Math.round(sum / executed.length);
  };

  const getAttemptsInLast60Seconds = (agentId: string, refTime = Date.now()): number => {
    const windowStart = refTime - 60000;
    return transactions.filter(t => {
      if (t.agentId !== agentId) return false;
      const txTime = new Date(t.timestamp).getTime();
      return txTime >= windowStart && txTime <= refTime;
    }).length;
  };

  // Derive Trust Scores deterministically from transaction history
  const trustScores = useMemo<Record<string, TrustScore>>(() => {
    const scores: Record<string, TrustScore> = {};
    agents.forEach(agent => {
      scores[agent.id] = calculateAgentTrustScore(agent.id, transactions, agent.historicalAvg);
    });
    return scores;
  }, [agents, transactions]);

  // Derive Policy Conflicts deterministically
  const policyConflicts = useMemo<PolicyConflict[]>(() => {
    return detectPolicyConflicts(agents, policies);
  }, [agents, policies]);

  // Global Metrics
  const metrics = useMemo<Metrics>(() => {
    const totalAttempts = transactions.length;
    let executedPayments = 0;
    let allowedCount = 0;
    let approvalRequiredCount = 0;
    let blockedCount = 0;
    let amountProtected = 0;
    let totalExecutedAmount = 0;

    for (const tx of transactions) {
      if (tx.decision === 'ALLOW') {
        allowedCount++;
      } else if (tx.decision === 'APPROVAL_REQUIRED') {
        approvalRequiredCount++;
      } else if (tx.decision === 'BLOCK') {
        blockedCount++;
      }

      if (tx.status === 'EXECUTED' || tx.status === 'APPROVED') {
        executedPayments++;
        totalExecutedAmount += tx.amount;
      } else if (tx.status === 'BLOCKED' || tx.status === 'BLOCKED_BY_REVIEWER') {
        amountProtected += tx.amount;
      }
    }

    return {
      totalAttempts,
      executedPayments,
      allowedCount,
      approvalRequiredCount,
      blockedCount,
      amountProtected,
      totalExecutedAmount,
    };
  }, [transactions]);

  // Suspend Agent (Governance Kill-Switch)
  const suspendAgent = (agentId: string, reason = 'Administrative kill-switch engaged') => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'suspended' } : a));
    
    setAdaptiveStates(prev => {
      const current = prev[agentId] || createInitialAdaptiveState(agentId, 0);
      return {
        ...prev,
        [agentId]: {
          ...current,
          state: 'SUSPENDED',
          adaptiveLimit: 0,
          reason,
          lastUpdated: new Date().toISOString(),
          cleanStreak: 0,
          transitionHistory: [
            {
              from: current.state,
              to: 'SUSPENDED',
              reason,
              timestamp: new Date().toISOString(),
            },
            ...current.transitionHistory,
          ],
        },
      };
    });
  };

  // Restore Suspended Agent
  const activateAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'active' } : a));
    
    setAdaptiveStates(prev => {
      const current = prev[agentId];
      if (!current) return prev;
      const policy = policies[agentId];
      const configured = policy ? policy.perTransactionLimit : 5000;
      return {
        ...prev,
        [agentId]: {
          ...current,
          state: 'MONITOR',
          adaptiveLimit: configured,
          reason: 'Manual administrative restoration. Placed in MONITOR state for safety.',
          lastUpdated: new Date().toISOString(),
          cleanStreak: 0,
          transitionHistory: [
            {
              from: 'SUSPENDED',
              to: 'MONITOR',
              reason: 'Human security officer restored agent with mandatory active monitoring.',
              timestamp: new Date().toISOString(),
            },
            ...current.transitionHistory,
          ],
        },
      };
    });
  };

  // Manual Reset to NORMAL
  const restoreAdaptiveState = (agentId: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'active' } : a));
    
    setAdaptiveStates(prev => {
      const current = prev[agentId];
      const policy = policies[agentId];
      const configured = policy ? policy.perTransactionLimit : 5000;
      return {
        ...prev,
        [agentId]: {
          agentId,
          state: 'NORMAL',
          configuredLimit: configured,
          adaptiveLimit: configured,
          reason: 'Restored to nominal operating parameters by authorized security officer.',
          lastUpdated: new Date().toISOString(),
          cleanStreak: 5,
          transitionHistory: [
            {
              from: current ? current.state : 'MONITOR',
              to: 'NORMAL',
              reason: 'Administrative override: restored to NORMAL.',
              timestamp: new Date().toISOString(),
            },
            ...(current ? current.transitionHistory : []),
          ],
        },
      };
    });
  };

  const resolveCrossAgentAnomaly = (anomalyId: string) => {
    setCrossAgentAnomalies(prev => prev.map(a => a.id === anomalyId ? { ...a, status: 'RESOLVED' } : a));
  };

  const updatePolicy = (agentId: string, updatedPolicy: Partial<Policy>) => {
    setPolicies(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        ...updatedPolicy,
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  const createIncidentReport = (incident: IncidentReport) => {
    setIncidents(prev => [incident, ...prev]);
  };

  const approveTransaction = async (txId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          status: 'APPROVED',
          paymentId: t.paymentId || generateCryptoSecureId('sim_pay_appr'),
          reviewedAt: new Date().toISOString(),
          reviewerAction: 'APPROVED',
          explanation: `${t.explanation} [Approved by human security reviewer]`,
        };
      }
      return t;
    }));

    if (inspectingTx && inspectingTx.id === txId) {
      setInspectingTx(prev => prev ? {
        ...prev,
        status: 'APPROVED',
        paymentId: prev.paymentId || generateCryptoSecureId('sim_pay_appr'),
        reviewedAt: new Date().toISOString(),
        reviewerAction: 'APPROVED',
      } : null);
    }
  };

  const rejectTransaction = async (txId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          status: 'BLOCKED_BY_REVIEWER',
          reviewedAt: new Date().toISOString(),
          reviewerAction: 'BLOCKED_BY_REVIEWER',
          explanation: `${t.explanation} [Denied by human security reviewer]`,
        };
      }
      return t;
    }));

    if (inspectingTx && inspectingTx.id === txId) {
      setInspectingTx(prev => prev ? {
        ...prev,
        status: 'BLOCKED_BY_REVIEWER',
        reviewedAt: new Date().toISOString(),
        reviewerAction: 'BLOCKED_BY_REVIEWER',
      } : null);
    }
  };

  /**
   * WHAT-IF POLICY SIMULATOR:
   * Re-evaluates historical transactions against a draft policy without mutating state.
   */
  const runWhatIfSimulation = (policyDraft: Policy, targetAgentId: string): WhatIfSimulationResult => {
    const agent = agents.find(a => a.id === targetAgentId) || agents[0];
    const historicalTxs = transactions.filter(t => t.agentId === targetAgentId);

    const original = {
      allowedCount: 0,
      approvalCount: 0,
      blockedCount: 0,
      totalSpend: 0,
      amountProtected: 0,
    };

    const simulated = {
      allowedCount: 0,
      approvalCount: 0,
      blockedCount: 0,
      totalSpend: 0,
      amountProtected: 0,
    };

    const changedTransactions: WhatIfSimulationResult['changedTransactions'] = [];

    // Calculate baseline
    const historicalAvg = getHistoricalExecutedAvg(targetAgentId);

    historicalTxs.forEach(tx => {
      // Record original metrics
      if (tx.decision === 'ALLOW') original.allowedCount++;
      else if (tx.decision === 'APPROVAL_REQUIRED') original.approvalCount++;
      else if (tx.decision === 'BLOCK') original.blockedCount++;

      if (tx.status === 'EXECUTED' || tx.status === 'APPROVED') {
        original.totalSpend += tx.amount;
      } else {
        original.amountProtected += tx.amount;
      }

      // Re-evaluate with policyDraft
      const evalContext: EvaluationContext = {
        agent,
        policy: policyDraft,
        historicalExecutedAvg: historicalAvg,
        todayExecutedSpend: 0, // isolated transaction check
        recentAttemptsCountIn60s: 0,
        adaptiveState: 'NORMAL', // baseline comparison
      };

      const simResult = evaluateTransaction({
        agentId: targetAgentId,
        merchant: tx.merchant,
        category: tx.category,
        amount: tx.amount,
        timestamp: tx.timestamp,
      }, evalContext);

      // Record simulated metrics
      if (simResult.decision === 'ALLOW') {
        simulated.allowedCount++;
        simulated.totalSpend += tx.amount;
      } else if (simResult.decision === 'APPROVAL_REQUIRED') {
        simulated.approvalCount++;
      } else {
        simulated.blockedCount++;
        simulated.amountProtected += tx.amount;
      }

      // Check for decision differences
      if (simResult.decision !== tx.decision) {
        changedTransactions.push({
          id: tx.id,
          merchant: tx.merchant,
          amount: tx.amount,
          category: tx.category,
          timestamp: tx.timestamp,
          originalDecision: tx.decision,
          simulatedDecision: simResult.decision,
          originalReasons: tx.evaluation.reasons || [],
          simulatedReasons: simResult.reasons,
        });
      }
    });

    return {
      original,
      simulated,
      changedTransactions,
    };
  };

  /**
   * PRIMARY TRANSACTION SIMULATION ENGINE
   * Complete lifecycle with Cross-Agent detection, Adaptive Response escalation,
   * deterministic evaluation, and incident logging.
   */
  const simulateTransaction = async (
    input: TransactionInput,
    source: 'SIMULATION' | 'COMPROMISE_SCENARIO' | 'AUTONOMOUS_AGENT' | 'SCRIPTED_TEST' = 'SIMULATION',
    overrideCompromise = false,
    skipAiEnrich = false
  ): Promise<TransactionAttempt> => {
    setIsProcessing(true);
    try {
      const agent = agents.find(a => a.id === input.agentId) || agents[0];
      const policy = policies[input.agentId] || INITIAL_POLICIES[input.agentId];
      
      const now = input.timestamp ? new Date(input.timestamp) : new Date();
      const todayExecutedSpend = getDailyExecutedSpend(agent.id, now);
      const historicalExecutedAvg = getHistoricalExecutedAvg(agent.id);
      const recentAttemptsCountIn60s = getAttemptsInLast60Seconds(agent.id, now.getTime());

      // 1. Cross-Agent Spending Anomaly Check
      const crossAgentResult = detectCrossAgentAnomaly(
        {
          agentId: agent.id,
          merchant: input.merchant,
          amount: input.amount,
          timestamp: now.toISOString(),
        },
        transactions
      );

      if (crossAgentResult.isAnomaly && crossAgentResult.anomaly) {
        setCrossAgentAnomalies(prev => [crossAgentResult.anomaly!, ...prev]);
      }

      // 2. Fetch current Adaptive Security State
      const currentAdaptive = adaptiveStates[agent.id] || createInitialAdaptiveState(agent.id, policy.perTransactionLimit);

      const evalContext: EvaluationContext = {
        agent,
        policy,
        historicalExecutedAvg,
        todayExecutedSpend,
        recentAttemptsCountIn60s,
        isCompromiseOverride: overrideCompromise,
        adaptiveState: currentAdaptive.state,
        adaptiveLimit: currentAdaptive.adaptiveLimit,
        isCrossAgentAnomaly: crossAgentResult.isAnomaly,
      };

      // 3. RUN DETERMINISTIC RULE ENGINE (AUTHORITY)
      const evaluation = evaluateTransaction(input, evalContext);

      // Initial status based on deterministic decision
      let status: TransactionStatus;
      if (evaluation.decision === 'ALLOW') {
        status = 'EXECUTED';
      } else if (evaluation.decision === 'APPROVAL_REQUIRED') {
        status = 'PENDING_APPROVAL';
      } else {
        status = 'BLOCKED';
      }

      const txId = generateCryptoSecureId('tx');
      const paymentId = evaluation.decision === 'ALLOW' 
        ? generateCryptoSecureId('sim_pay') 
        : undefined;

      // 4. Current Trust Score
      const agentTrust = trustScores[agent.id] || { score: 75, category: 'MONITORED', breakdown: [], cleanStreak: 0 };

      // 5. Evaluate Adaptive Escalation / Recovery
      const tempTx: TransactionAttempt = {
        id: txId,
        timestamp: now.toISOString(),
        agentId: agent.id,
        agentName: agent.name,
        merchant: input.merchant,
        category: input.category,
        amount: input.amount,
        riskScore: evaluation.riskScore,
        decision: evaluation.decision,
        status,
        evaluation,
        source,
        explanation: evaluation.explanation || '',
        paymentId,
      };

      const escalation = evaluateAdaptiveEscalation(
        currentAdaptive,
        policy,
        agentTrust.score,
        tempTx,
        transactions.filter(t => t.agentId === agent.id)
      );

      if (escalation.changed) {
        setAdaptiveStates(prev => {
          const curr = prev[agent.id] || currentAdaptive;
          return {
            ...prev,
            [agent.id]: {
              ...curr,
              state: escalation.nextState,
              adaptiveLimit: escalation.adaptiveLimit,
              reason: escalation.reason,
              lastUpdated: now.toISOString(),
              cleanStreak: escalation.nextState === curr.state ? curr.cleanStreak + 1 : 0,
              transitionHistory: [
                {
                  from: curr.state,
                  to: escalation.nextState,
                  reason: escalation.reason,
                  timestamp: now.toISOString(),
                },
                ...curr.transitionHistory,
              ],
            },
          };
        });

        if (escalation.nextState === 'SUSPENDED') {
          setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'suspended' } : a));
        }
      }

      // 6. Security Incident Generation
      // Creates formal incident report on high-risk block or compromise
      let generatedIncidentId: string | undefined;
      const isIncidentWorthy = (evaluation.decision === 'BLOCK' && (evaluation.riskScore >= 70 || evaluation.isCompromise || overrideCompromise)) ||
        crossAgentResult.isAnomaly ||
        escalation.nextState === 'LOCKDOWN' ||
        escalation.nextState === 'SUSPENDED';

      if (isIncidentWorthy && source !== 'SCRIPTED_TEST') {
        generatedIncidentId = `INC-${Date.now().toString().slice(-4)}`;
        const initialIncident: IncidentReport = {
          id: generatedIncidentId,
          timestamp: now.toISOString(),
          agentId: agent.id,
          agentName: agent.name,
          merchant: input.merchant,
          amount: input.amount,
          category: input.category,
          decision: evaluation.decision,
          riskScore: evaluation.riskScore,
          trustScore: agentTrust.score,
          securityState: escalation.nextState,
          triggeredSignals: evaluation.triggeredSignals.map(s => s.label),
          adaptiveResponse: escalation.reason,
          actionTaken: evaluation.decision === 'BLOCK' 
            ? 'Blocked by deterministic rule engine. Funds preserved.' 
            : 'Escalated to human review.',
          amountProtected: evaluation.decision === 'BLOCK' ? input.amount : 0,
          relatedTransactionIds: [txId],
        };

        setIncidents(prev => [initialIncident, ...prev]);

        // Asynchronously request Gemini executive briefing for this incident
        fetch('/api/incident/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentId: generatedIncidentId,
            agentId: agent.id,
            agentName: agent.name,
            merchant: input.merchant,
            amount: input.amount,
            category: input.category,
            decision: evaluation.decision,
            riskScore: evaluation.riskScore,
            trustScore: agentTrust.score,
            securityState: escalation.nextState,
            triggeredSignals: evaluation.triggeredSignals.map(s => s.label),
            actionTaken: initialIncident.actionTaken,
            amountProtected: initialIncident.amountProtected,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.summary) {
              setIncidents(prev => prev.map(inc => inc.id === generatedIncidentId ? { ...inc, geminiSummary: data.summary } : inc));
              if (selectedIncident && selectedIncident.id === generatedIncidentId) {
                setSelectedIncident(prev => prev ? { ...prev, geminiSummary: data.summary } : null);
              }
            }
          })
          .catch(() => {
            // Fallback summary is already embedded
          });
      }

      const finalTx: TransactionAttempt = {
        ...tempTx,
        securityState: escalation.nextState,
        trustScore: agentTrust.score,
        incidentId: generatedIncidentId,
      };

      // Prepend to transaction ledger immediately
      setTransactions(prev => [finalTx, ...prev]);

      // Check if compromise banner should be raised
      if (evaluation.isCompromise || overrideCompromise) {
        setActiveCompromiseAlert({ agent, tx: finalTx });
      }

      // Try to enrich transaction explanation asynchronously with Gemini API
      if (!skipAiEnrich && source !== 'SCRIPTED_TEST') {
        fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agent.id,
            agentName: agent.name,
            decision: evaluation.decision,
            riskScore: evaluation.riskScore,
            reasons: evaluation.reasons,
            merchant: input.merchant,
            amount: input.amount,
            isCompromise: evaluation.isCompromise || overrideCompromise,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.explanation) {
              setTransactions(prev => prev.map(t => t.id === txId ? { ...t, explanation: data.explanation } : t));
              if (inspectingTx && inspectingTx.id === txId) {
                setInspectingTx(prev => prev ? { ...prev, explanation: data.explanation } : null);
              }
            }
          })
          .catch(() => {
            // Fallback deterministic explanation is already active
          });
      }

      return finalTx;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * SCRIPTED COMPROMISE DEMO
   * Hardcoded deterministic inputs guaranteed to trigger Risk 100 BLOCK and Compromise Alert.
   */
  const simulateCompromiseScenario = async (): Promise<TransactionAttempt> => {
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(now.getTime() + istOffsetMs).toISOString().slice(0, 10);
    const compromiseTime = `${todayIST}T03:00:00+05:30`;
    const compromiseMs = new Date(compromiseTime).getTime();

    const burstTxs: TransactionAttempt[] = [];
    const foodbot = agents.find(a => a.id === 'foodbot') || agents[0];

    // Inject rapid burst attempts to simulate compromised rogue loop
    for (let i = 6; i >= 1; i--) {
      const burstTime = new Date(compromiseMs - i * 4000).toISOString();
      burstTxs.push({
        id: `tx_burst_${now.getTime()}_${i}`,
        timestamp: burstTime,
        agentId: 'foodbot',
        agentName: 'FoodBot',
        merchant: 'Unknown Electronics Merchant',
        category: 'Electronics',
        amount: 25000,
        riskScore: 100,
        decision: 'BLOCK',
        status: 'BLOCKED',
        source: 'COMPROMISE_SCENARIO',
        explanation: 'Blocked: Rogue velocity burst on unauthorized electronics vendor.',
        evaluation: {
          decision: 'BLOCK',
          riskScore: 100,
          reasons: [
            'Agent compromised velocity burst',
            'Restricted category: Electronics',
            'Transaction limit exceeded (₹25,000 > ₹2,000)',
            'New merchant',
            'Behavioral Amount Anomaly (>30x baseline)',
            'Unusual operating hour (03:00 AM IST)',
          ],
          signals: [
            { key: 'restricted_category', label: 'Restricted Category', points: 40, description: 'Electronics not permitted for FoodBot', triggered: true },
            { key: 'transaction_limit', label: 'Transaction Limit', points: 30, description: '₹25,000 exceeds ₹2,000 limit', triggered: true },
            { key: 'amount_anomaly', label: 'Behavioral Amount Anomaly', points: 25, description: '>30x normal baseline', triggered: true },
            { key: 'velocity_anomaly', label: 'Velocity Anomaly', points: 25, description: '7 attempts in 30 seconds', triggered: true },
            { key: 'new_merchant', label: 'New Merchant', points: 15, description: 'Unknown vendor', triggered: true },
            { key: 'unusual_time', label: 'Unusual Operating Hour', points: 10, description: '03:00 AM IST execution', triggered: true },
          ],
          triggeredSignals: [
            { key: 'restricted_category', label: 'Restricted Category', points: 40, description: 'Electronics not permitted for FoodBot', triggered: true },
            { key: 'transaction_limit', label: 'Transaction Limit', points: 30, description: '₹25,000 exceeds ₹2,000 limit', triggered: true },
            { key: 'amount_anomaly', label: 'Behavioral Amount Anomaly', points: 25, description: '>30x normal baseline', triggered: true },
            { key: 'velocity_anomaly', label: 'Velocity Anomaly', points: 25, description: '7 attempts in 30 seconds', triggered: true },
            { key: 'new_merchant', label: 'New Merchant', points: 15, description: 'Unknown vendor', triggered: true },
            { key: 'unusual_time', label: 'Unusual Operating Hour', points: 10, description: '03:00 AM IST execution', triggered: true },
          ],
          isCompromise: true,
          checks: {
            agentAuthorized: false,
            categoryAllowed: false,
            withinTxLimit: false,
            withinDailyBudget: false,
            isKnownMerchant: false,
            amountAnomaly: true,
            velocityAnomaly: true,
            timeAnomaly: true,
            isSuspended: false,
          },
          evaluatedAt: burstTime,
        },
        securityState: 'SUSPENDED',
        trustScore: 12,
      });
    }

    // Add burst transactions
    setTransactions(prev => [...burstTxs, ...prev]);

    // Primary climax transaction at 03:00 AM IST
    const climaxTx = await simulateTransaction(
      {
        agentId: 'foodbot',
        merchant: 'Unknown Electronics Merchant',
        category: 'Electronics',
        amount: 25000,
        timestamp: compromiseTime,
      },
      'COMPROMISE_SCENARIO',
      true
    );

    // Lock FoodBot into suspended state
    suspendAgent('foodbot', 'Emergency kill-switch engaged: Rogue loop compromise detected.');

    setActiveCompromiseAlert({
      agent: foodbot,
      tx: climaxTx,
    });

    return climaxTx;
  };

  const dismissCompromiseAlert = () => {
    setActiveCompromiseAlert(null);
  };

  const resetToDefaults = () => {
    setAgents(SEEDED_AGENTS);
    setPolicies(INITIAL_POLICIES);
    setTransactions(SEED_TRANSACTIONS);
    const initialAdaptive: Record<string, AdaptiveState> = {};
    SEEDED_AGENTS.forEach(agent => {
      const p = INITIAL_POLICIES[agent.id];
      initialAdaptive[agent.id] = createInitialAdaptiveState(agent.id, p ? p.perTransactionLimit : agent.perTransactionLimit);
    });
    setAdaptiveStates(initialAdaptive);
    setCrossAgentAnomalies([]);
    setIncidents(SEED_INCIDENTS);
    setInspectingTx(null);
    setSelectedIncident(null);
    setActiveCompromiseAlert(null);
    localStorage.removeItem(STORAGE_KEYS.AGENTS);
    localStorage.removeItem(STORAGE_KEYS.POLICIES);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.ADAPTIVE);
    localStorage.removeItem(STORAGE_KEYS.CROSS_AGENT);
    localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
  };

  return (
    <StoreContext.Provider
      value={{
        agents,
        policies,
        transactions,
        adaptiveStates,
        trustScores,
        crossAgentAnomalies,
        policyConflicts,
        incidents,
        inspectingTx,
        selectedIncident,
        activeCompromiseAlert,
        metrics,
        apiMode,
        isProcessing,
        setInspectingTx,
        setSelectedIncident,
        dismissCompromiseAlert,
        suspendAgent,
        activateAgent,
        restoreAdaptiveState,
        resolveCrossAgentAnomaly,
        updatePolicy,
        approveTransaction,
        rejectTransaction,
        simulateTransaction,
        simulateCompromiseScenario,
        runWhatIfSimulation,
        createIncidentReport,
        resetToDefaults,
        getDailyExecutedSpend,
        getHistoricalExecutedAvg,
        getAttemptsInLast60Seconds,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
