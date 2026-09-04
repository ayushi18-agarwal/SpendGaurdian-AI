export type Decision = 'ALLOW' | 'APPROVAL_REQUIRED' | 'BLOCK';

export type TransactionStatus = 
  | 'EXECUTED' 
  | 'PENDING_APPROVAL' 
  | 'BLOCKED' 
  | 'APPROVED' 
  | 'BLOCKED_BY_REVIEWER';

export type SecurityState = 
  | 'NORMAL'       // Level 0: Normal policies apply
  | 'MONITOR'      // Level 1: Flagged for active monitoring
  | 'RESTRICTED'   // Level 2: Effective limit tightened (e.g. 50%), new merchants require approval
  | 'LOCKDOWN'     // Level 3: All transactions require approval, incident logged
  | 'SUSPENDED';   // Level 4: All transactions blocked, kill-switch active

export type TrustScoreCategory = 'TRUSTED' | 'MONITORED' | 'ELEVATED_RISK' | 'HIGH_RISK';

export interface TrustScoreBreakdownItem {
  label: string;
  points: number;
  type: 'positive' | 'negative';
}

export interface TrustScore {
  score: number; // 0 - 100
  category: TrustScoreCategory;
  breakdown: TrustScoreBreakdownItem[];
  cleanStreak: number;
}

export interface AdaptiveState {
  agentId: string;
  state: SecurityState;
  configuredLimit: number;
  adaptiveLimit: number;
  reason: string;
  lastUpdated: string;
  cleanStreak: number;
  transitionHistory: {
    from: SecurityState;
    to: SecurityState;
    reason: string;
    timestamp: string;
  }[];
}

export interface CrossAgentAnomaly {
  id: string;
  timestamp: string;
  merchant: string;
  affectedAgents: string[];
  combinedAmount: number;
  timeWindowSeconds: number;
  transactionIds: string[];
  status: 'ACTIVE' | 'RESOLVED';
}

export interface PolicyConflict {
  id: string;
  agentId: string;
  type: 'LIMIT_CONFLICT' | 'CATEGORY_CONFLICT' | 'MERCHANT_CONFLICT';
  ruleA: string;
  ruleB: string;
  explanation: string;
  appliedResolution: string;
  detectedAt: string;
}

export interface IncidentReport {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  merchant: string;
  amount: number;
  category: string;
  decision: Decision;
  riskScore: number;
  trustScore: number;
  securityState: SecurityState;
  triggeredSignals: string[];
  adaptiveResponse: string;
  actionTaken: string;
  amountProtected: number;
  relatedTransactionIds: string[];
  geminiSummary?: string;
}

export type SignalKey = 
  | 'restricted_category'
  | 'transaction_limit'
  | 'daily_budget'
  | 'new_merchant'
  | 'amount_anomaly'
  | 'velocity_anomaly'
  | 'unusual_time'
  | 'agent_suspended'
  | 'cross_agent_anomaly';

export interface RiskSignal {
  key: SignalKey;
  label: string;
  points: number;
  description: string;
  triggered: boolean;
}

export interface PolicyCheckResult {
  agentAuthorized: boolean;
  categoryAllowed: boolean;
  withinTxLimit: boolean;
  withinDailyBudget: boolean;
  isKnownMerchant: boolean;
  amountAnomaly: boolean;
  velocityAnomaly: boolean;
  timeAnomaly: boolean;
  isSuspended: boolean;
  crossAgentAnomaly?: boolean;
}

export interface EvaluationResult {
  decision: Decision;
  riskScore: number; // 0 - 100
  signals: RiskSignal[];
  triggeredSignals: RiskSignal[];
  reasons: string[];
  isCompromise: boolean;
  checks: PolicyCheckResult;
  evaluatedAt: string;
  explanation?: string;
  adaptiveState?: SecurityState;
  effectiveLimit?: number;
}

export interface Agent {
  id: string;
  name: string;
  category: string;
  dailyLimit: number;
  perTransactionLimit: number;
  newMerchantAction: 'approval_required' | 'block';
  status: 'active' | 'suspended';
  description: string;
  knownMerchants: string[];
  historicalAvg: number;
  avatarColor: string;
}

export interface Policy {
  agentId: string;
  allowedCategories: string[];
  dailyLimit: number;
  perTransactionLimit: number;
  newMerchantAction: 'approval_required' | 'block';
  unusualTimeCheck: boolean;
  velocityThreshold: number; // e.g. 5 attempts in 60s
  lastUpdated?: string;
  naturalLanguagePrompt?: string;
}

export interface TransactionAttempt {
  id: string;
  timestamp: string; // ISO format
  agentId: string;
  agentName: string;
  merchant: string;
  category: string;
  amount: number;
  riskScore: number;
  decision: Decision;
  status: TransactionStatus;
  evaluation: EvaluationResult;
  source: 'AUTONOMOUS_AGENT' | 'SIMULATION' | 'COMPROMISE_SCENARIO' | 'SCRIPTED_TEST' | 'SEED_HISTORY';
  explanation: string;
  paymentId?: string;
  isHistorical?: boolean;
  reviewedAt?: string;
  reviewerAction?: 'APPROVED' | 'BLOCKED_BY_REVIEWER';
  securityState?: SecurityState;
  trustScore?: number;
  incidentId?: string;
}

export interface TestScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  transaction: {
    agentId: string;
    merchant: string;
    category: string;
    amount: number;
    timestamp?: string;
  };
  expectedDecision: Decision;
  expectedSignals: SignalKey[];
  setup?: {
    agentStatus?: 'active' | 'suspended';
    recentAttemptsCountIn60s?: number;
    customDailySpendToday?: number;
  };
}

export interface TestResult {
  scenarioId: string;
  scenarioName: string;
  category: string;
  description: string;
  passed: boolean;
  expectedDecision: Decision;
  actualDecision: Decision;
  expectedSignals: SignalKey[];
  actualSignals: SignalKey[];
  riskScore: number;
  signalsMatch: boolean;
  decisionMatch: boolean;
  details: string;
}
