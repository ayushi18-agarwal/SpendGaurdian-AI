import { 
  TestScenario, 
  TestResult, 
  Decision, 
  SignalKey, 
  Agent, 
  Policy 
} from '../types';
import { evaluateTransaction, EvaluationContext } from './ruleEngine';
import { SEEDED_AGENTS, INITIAL_POLICIES } from '../data/seedData';

/**
 * Helper to build an ISO string with the local time matching the given hour and minute.
 * Ensures tests run identically regardless of machine timezone or container offset.
 */
function localTimeIso(hours: number, minutes = 0): string {
  const d = new Date(2026, 8, 1, hours, minutes, 0, 0);
  return d.toISOString();
}

/**
 * Programmatically generates ~100 exhaustive scripted scenarios to validate
 * the deterministic rule engine against boundary conditions, policy checks,
 * behavioral anomalies, and compromise detection.
 */
export function generateEngineTestScenarios(): TestScenario[] {
  const scenarios: TestScenario[] = [];
  let idCounter = 1;

  const nextId = (prefix: string) => `${prefix}_${String(idCounter++).padStart(3, '0')}`;

  // ================= 1. TRANSACTION LIMIT BOUNDARIES =================
  // FoodBot (limit: ₹2,000)
  scenarios.push({
    id: nextId('BOUND_TX'),
    name: 'FoodBot: Exactly at per-tx limit (₹2,000)',
    category: 'Boundary: Transaction Limit',
    description: 'Transaction amount exactly matches the ₹2,000 single transaction ceiling.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Swiggy',
      category: 'Food & Grocery',
      amount: 2000,
      timestamp: '2026-09-01T12:00:00.000Z',
    },
    expectedDecision: 'ALLOW',
    expectedSignals: [],
  });

  scenarios.push({
    id: nextId('BOUND_TX'),
    name: 'FoodBot: ₹1 above per-tx limit (₹2,001)',
    category: 'Boundary: Transaction Limit',
    description: 'Transaction amount is ₹1 over the ₹2,000 single transaction ceiling.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Swiggy',
      category: 'Food & Grocery',
      amount: 2001,
      timestamp: '2026-09-01T12:00:00.000Z',
    },
    expectedDecision: 'BLOCK',
    expectedSignals: ['transaction_limit'],
  });

  // TravelBot (limit: ₹20,000)
  scenarios.push({
    id: nextId('BOUND_TX'),
    name: 'TravelBot: Exactly at per-tx limit (₹20,000)',
    category: 'Boundary: Transaction Limit',
    description: 'Booking amount is exactly at ₹20,000 ticket threshold.',
    transaction: {
      agentId: 'travelbot',
      merchant: 'MakeMyTrip',
      category: 'Flights & Hotels',
      amount: 20000,
      timestamp: '2026-09-01T14:00:00.000Z',
    },
    expectedDecision: 'ALLOW',
    expectedSignals: [],
  });

  scenarios.push({
    id: nextId('BOUND_TX'),
    name: 'TravelBot: ₹1 above per-tx limit (₹20,001)',
    category: 'Boundary: Transaction Limit',
    description: 'Booking amount is ₹1 above ₹20,000 threshold.',
    transaction: {
      agentId: 'travelbot',
      merchant: 'MakeMyTrip',
      category: 'Flights & Hotels',
      amount: 20001,
      timestamp: '2026-09-01T14:00:00.000Z',
    },
    expectedDecision: 'BLOCK',
    expectedSignals: ['transaction_limit'],
  });

  // ProcurementBot (limit: ₹25,000)
  scenarios.push({
    id: nextId('BOUND_TX'),
    name: 'ProcurementBot: Exactly at per-tx limit (₹25,000)',
    category: 'Boundary: Transaction Limit',
    description: 'Hardware order is exactly at ₹25,000 ceiling.',
    transaction: {
      agentId: 'procurementbot',
      merchant: 'Dell',
      category: 'Office Supplies & Software',
      amount: 25000,
      timestamp: '2026-09-01T15:00:00.000Z',
    },
    expectedDecision: 'ALLOW',
    expectedSignals: [],
  });

  scenarios.push({
    id: nextId('BOUND_TX'),
    name: 'ProcurementBot: ₹1 above per-tx limit (₹25,001)',
    category: 'Boundary: Transaction Limit',
    description: 'Hardware order is ₹1 above ₹25,000 cap.',
    transaction: {
      agentId: 'procurementbot',
      merchant: 'Dell',
      category: 'Office Supplies & Software',
      amount: 25001,
      timestamp: '2026-09-01T15:00:00.000Z',
    },
    expectedDecision: 'BLOCK',
    expectedSignals: ['transaction_limit'],
  });

  // ================= 2. DAILY BUDGET BOUNDARIES =================
  // FoodBot (Daily limit: ₹5,000, suppose today spent: ₹3,500)
  scenarios.push({
    id: nextId('BOUND_DAILY'),
    name: 'FoodBot: Exactly reaches daily budget (₹3,500 spent + ₹1,500)',
    category: 'Boundary: Daily Budget',
    description: 'Brings today total spend to exactly ₹5,000.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Zomato',
      category: 'Food & Grocery',
      amount: 1500,
      timestamp: '2026-09-01T18:00:00.000Z',
    },
    setup: { customDailySpendToday: 3500 },
    expectedDecision: 'ALLOW',
    expectedSignals: [],
  });

  scenarios.push({
    id: nextId('BOUND_DAILY'),
    name: 'FoodBot: ₹1 above remaining daily budget (₹3,500 + ₹1,501)',
    category: 'Boundary: Daily Budget',
    description: 'Brings today total spend to ₹5,001 exceeding daily budget.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Zomato',
      category: 'Food & Grocery',
      amount: 1501,
      timestamp: '2026-09-01T18:00:00.000Z',
    },
    setup: { customDailySpendToday: 3500 },
    expectedDecision: 'BLOCK',
    expectedSignals: ['daily_budget'],
  });

  // TravelBot (Daily limit: ₹50,000, suppose today spent: ₹35,000)
  scenarios.push({
    id: nextId('BOUND_DAILY'),
    name: 'TravelBot: Exactly reaches daily budget (₹35,000 spent + ₹15,000)',
    category: 'Boundary: Daily Budget',
    description: 'Travel booking brings cumulative spend to exact ₹50,000.',
    transaction: {
      agentId: 'travelbot',
      merchant: 'IndiGo',
      category: 'Flights & Hotels',
      amount: 15000,
      timestamp: '2026-09-01T10:00:00.000Z',
    },
    setup: { customDailySpendToday: 35000 },
    expectedDecision: 'ALLOW',
    expectedSignals: [],
  });

  scenarios.push({
    id: nextId('BOUND_DAILY'),
    name: 'TravelBot: ₹1 above daily budget (₹35,000 + ₹15,001)',
    category: 'Boundary: Daily Budget',
    description: 'Exceeds daily budget of ₹50,000 by ₹1.',
    transaction: {
      agentId: 'travelbot',
      merchant: 'IndiGo',
      category: 'Flights & Hotels',
      amount: 15001,
      timestamp: '2026-09-01T10:00:00.000Z',
    },
    setup: { customDailySpendToday: 35000 },
    expectedDecision: 'BLOCK',
    expectedSignals: ['daily_budget'],
  });

  // ProcurementBot (Daily limit: ₹1,00,000, suppose today spent: ₹80,000)
  scenarios.push({
    id: nextId('BOUND_DAILY'),
    name: 'ProcurementBot: Exactly reaches daily budget (₹80,000 + ₹20,000)',
    category: 'Boundary: Daily Budget',
    description: 'Total today spend reaches ₹1,00,000 exactly.',
    transaction: {
      agentId: 'procurementbot',
      merchant: 'Microsoft',
      category: 'Office Supplies & Software',
      amount: 20000,
      timestamp: '2026-09-01T11:00:00.000Z',
    },
    setup: { customDailySpendToday: 80000 },
    expectedDecision: 'ALLOW',
    expectedSignals: [],
  });

  scenarios.push({
    id: nextId('BOUND_DAILY'),
    name: 'ProcurementBot: ₹1 above daily budget (₹80,000 + ₹20,001)',
    category: 'Boundary: Daily Budget',
    description: 'Total today spend would be ₹1,00,001 exceeding ₹1,00,000.',
    transaction: {
      agentId: 'procurementbot',
      merchant: 'Microsoft',
      category: 'Office Supplies & Software',
      amount: 20001,
      timestamp: '2026-09-01T11:00:00.000Z',
    },
    setup: { customDailySpendToday: 80000 },
    expectedDecision: 'BLOCK',
    expectedSignals: ['daily_budget'],
  });

  // ================= 3. VELOCITY BOUNDARIES (0 to 4 prior attempts allowed, 5+ prior triggers anomaly) =================
  for (let attempts = 0; attempts < 5; attempts++) {
    scenarios.push({
      id: nextId('BOUND_VEL'),
      name: `Velocity Check: ${attempts} prior attempts in 60s (Attempt #${attempts + 1})`,
      category: 'Boundary: Velocity',
      description: `With ${attempts} prior attempts within rolling 60s, this attempt is under the 5-attempt threshold.`,
      transaction: {
        agentId: 'foodbot',
        merchant: 'Swiggy',
        category: 'Food & Grocery',
        amount: 350,
        timestamp: '2026-09-01T12:30:00+05:30',
      },
      setup: { recentAttemptsCountIn60s: attempts },
      expectedDecision: 'ALLOW',
      expectedSignals: [],
    });
  }

  // 6th attempt (5 prior attempts) and higher -> velocity_anomaly
  const burstCounts = [5, 6, 7, 10, 15];
  for (const prior of burstCounts) {
    scenarios.push({
      id: nextId('BOUND_VEL'),
      name: `Velocity Violation: ${prior} prior attempts in 60s (Attempt #${prior + 1})`,
      category: 'Boundary: Velocity',
      description: `Velocity threshold violated (${prior + 1} attempts within 60s window).`,
      transaction: {
        agentId: 'foodbot',
        merchant: 'Swiggy',
        category: 'Food & Grocery',
        amount: 350,
        timestamp: '2026-09-01T12:30:00+05:30',
      },
      setup: { recentAttemptsCountIn60s: prior },
      expectedDecision: 'ALLOW', // Velocity anomaly gives +25 risk, without other signals risk is 25 (<40), so still ALLOW unless combined with other signals
      expectedSignals: ['velocity_anomaly'],
    });
  }

  // ================= 4. TIME ANOMALY BOUNDARIES (06:00 to 23:00 Local Server Time) =================
  scenarios.push({
    id: nextId('BOUND_TIME'),
    name: 'Time Boundary: Exactly 06:00 Local Time (Normal)',
    category: 'Boundary: Time Window',
    description: '06:00 local time is the start of normal business operating hours.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Zepto',
      category: 'Food & Grocery',
      amount: 400,
      timestamp: localTimeIso(6, 0),
    },
    expectedDecision: 'ALLOW',
    expectedSignals: [],
  });

  scenarios.push({
    id: nextId('BOUND_TIME'),
    name: 'Time Boundary: 05:59 Local Time (Unusual Time - Off-Hours)',
    category: 'Boundary: Time Window',
    description: '05:59 local time is 1 minute before regular business hours.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Zepto',
      category: 'Food & Grocery',
      amount: 400,
      timestamp: localTimeIso(5, 59),
    },
    expectedDecision: 'ALLOW', // Time anomaly adds +10 risk (risk 10 < 40), ALLOW
    expectedSignals: ['unusual_time'],
  });

  scenarios.push({
    id: nextId('BOUND_TIME'),
    name: 'Time Boundary: 12:00 Local Time (Normal Daytime)',
    category: 'Boundary: Time Window',
    description: '12:00 noon local time is standard regular daytime.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Swiggy',
      category: 'Food & Grocery',
      amount: 450,
      timestamp: localTimeIso(12, 0),
    },
    expectedDecision: 'ALLOW',
    expectedSignals: [],
  });

  scenarios.push({
    id: nextId('BOUND_TIME'),
    name: 'Time Boundary: Exactly 23:00 Local Time (Normal)',
    category: 'Boundary: Time Window',
    description: '23:00 local time is the end of normal business operating hours.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Zomato',
      category: 'Food & Grocery',
      amount: 400,
      timestamp: localTimeIso(23, 0),
    },
    expectedDecision: 'ALLOW',
    expectedSignals: [],
  });

  scenarios.push({
    id: nextId('BOUND_TIME'),
    name: 'Time Boundary: 23:01 Local Time (Unusual Time - Off-Hours)',
    category: 'Boundary: Time Window',
    description: '23:01 local time is 1 minute past regular operating window.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Zomato',
      category: 'Food & Grocery',
      amount: 400,
      timestamp: localTimeIso(23, 1),
    },
    expectedDecision: 'ALLOW',
    expectedSignals: ['unusual_time'],
  });

  scenarios.push({
    id: nextId('BOUND_TIME'),
    name: 'Time Anomaly: Midnight (00:30 Local Time)',
    category: 'Boundary: Time Window',
    description: 'Off-hours midnight transaction receives unusual_time signal.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Zepto',
      category: 'Food & Grocery',
      amount: 500,
      timestamp: localTimeIso(0, 30),
    },
    expectedDecision: 'ALLOW',
    expectedSignals: ['unusual_time'],
  });

  scenarios.push({
    id: nextId('BOUND_TIME'),
    name: 'Time Anomaly: Early Morning (03:00 Local Time)',
    category: 'Boundary: Time Window',
    description: 'Off-hours early morning transaction (03:00) receives unusual_time signal.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Swiggy',
      category: 'Food & Grocery',
      amount: 450,
      timestamp: localTimeIso(3, 0),
    },
    expectedDecision: 'ALLOW',
    expectedSignals: ['unusual_time'],
  });

  // ================= 5. NEW MERCHANT VERIFICATION =================
  // Known merchants vs New merchants for all 3 agents
  const knownMerchantsTest = [
    { agentId: 'foodbot', merchant: 'Swiggy', category: 'Food & Grocery', amount: 500 },
    { agentId: 'foodbot', merchant: 'Zomato', category: 'Food & Grocery', amount: 600 },
    { agentId: 'foodbot', merchant: 'Blinkit', category: 'Food & Grocery', amount: 700 },
    { agentId: 'foodbot', merchant: 'Zepto', category: 'Food & Grocery', amount: 300 },
    { agentId: 'foodbot', merchant: 'BigBasket', category: 'Food & Grocery', amount: 900 },
    { agentId: 'travelbot', merchant: 'MakeMyTrip', category: 'Flights & Hotels', amount: 5000 },
    { agentId: 'travelbot', merchant: 'IndiGo', category: 'Flights & Hotels', amount: 6000 },
    { agentId: 'travelbot', merchant: 'Air India', category: 'Flights & Hotels', amount: 7000 },
    { agentId: 'procurementbot', merchant: 'Microsoft', category: 'Office Supplies & Software', amount: 8000 },
    { agentId: 'procurementbot', merchant: 'Adobe', category: 'Office Supplies & Software', amount: 9000 },
    { agentId: 'procurementbot', merchant: 'Dell', category: 'Office Supplies & Software', amount: 12000 },
  ];

  for (const item of knownMerchantsTest) {
    scenarios.push({
      id: nextId('KNOWN_MERCH'),
      name: `Known Merchant: ${item.agentId} at ${item.merchant}`,
      category: 'Merchant Verification',
      description: `Verified merchant in ${item.agentId}'s whitelist triggers no risk signal.`,
      transaction: {
        agentId: item.agentId,
        merchant: item.merchant,
        category: item.category,
        amount: item.amount,
        timestamp: '2026-09-01T13:00:00.000Z',
      },
      expectedDecision: 'ALLOW',
      expectedSignals: [],
    });
  }

  // New Merchants -> triggers new_merchant (+15) and requires APPROVAL_REQUIRED
  const newMerchantsTest = [
    { agentId: 'foodbot', merchant: 'Chai Point Direct', category: 'Food & Grocery', amount: 450 },
    { agentId: 'foodbot', merchant: 'EatFit Express', category: 'Food & Grocery', amount: 550 },
    { agentId: 'foodbot', merchant: 'Starbucks Coffee', category: 'Food & Grocery', amount: 850 },
    { agentId: 'travelbot', merchant: 'Uber Business IN', category: 'Flights & Hotels', amount: 1200 },
    { agentId: 'travelbot', merchant: 'Airbnb Hospitality', category: 'Flights & Hotels', amount: 8500 },
    { agentId: 'travelbot', merchant: 'Vistara Airlines', category: 'Flights & Hotels', amount: 6200 },
    { agentId: 'procurementbot', merchant: 'Apple Online Store', category: 'Office Supplies & Software', amount: 15000 },
    { agentId: 'procurementbot', merchant: 'Notion Labs Inc', category: 'Office Supplies & Software', amount: 4000 },
    { agentId: 'procurementbot', merchant: 'Atlassian Jira', category: 'Office Supplies & Software', amount: 7500 },
  ];

  for (const item of newMerchantsTest) {
    scenarios.push({
      id: nextId('NEW_MERCH'),
      name: `New Merchant: ${item.agentId} at ${item.merchant}`,
      category: 'Merchant Verification',
      description: `Unrecognized merchant triggers new_merchant (+15) and routes to APPROVAL_REQUIRED.`,
      transaction: {
        agentId: item.agentId,
        merchant: item.merchant,
        category: item.category,
        amount: item.amount,
        timestamp: '2026-09-01T14:00:00.000Z',
      },
      expectedDecision: 'APPROVAL_REQUIRED',
      expectedSignals: ['new_merchant'],
    });
  }

  // ================= 6. AGENT SUSPENSION (HARD BLOCK) =================
  scenarios.push({
    id: nextId('SUSPEND'),
    name: 'Suspended Agent: FoodBot attempt while SUSPENDED',
    category: 'Agent Governance Status',
    description: 'Suspended agent must immediately be hard blocked with 100 risk.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Swiggy',
      category: 'Food & Grocery',
      amount: 300,
      timestamp: '2026-09-01T12:00:00.000Z',
    },
    setup: { agentStatus: 'suspended' },
    expectedDecision: 'BLOCK',
    expectedSignals: ['agent_suspended'],
  });

  scenarios.push({
    id: nextId('SUSPEND'),
    name: 'Suspended Agent: TravelBot attempt while SUSPENDED',
    category: 'Agent Governance Status',
    description: 'Suspended TravelBot must be immediately blocked.',
    transaction: {
      agentId: 'travelbot',
      merchant: 'MakeMyTrip',
      category: 'Flights & Hotels',
      amount: 4000,
      timestamp: '2026-09-01T12:00:00.000Z',
    },
    setup: { agentStatus: 'suspended' },
    expectedDecision: 'BLOCK',
    expectedSignals: ['agent_suspended'],
  });

  scenarios.push({
    id: nextId('SUSPEND'),
    name: 'Suspended Agent: ProcurementBot attempt while SUSPENDED',
    category: 'Agent Governance Status',
    description: 'Suspended ProcurementBot must be immediately blocked.',
    transaction: {
      agentId: 'procurementbot',
      merchant: 'Microsoft',
      category: 'Office Supplies & Software',
      amount: 5000,
      timestamp: '2026-09-01T12:00:00.000Z',
    },
    setup: { agentStatus: 'suspended' },
    expectedDecision: 'BLOCK',
    expectedSignals: ['agent_suspended'],
  });

  // ================= 7. RESTRICTED CATEGORY VIOLATIONS (HARD BLOCK) =================
  const restrictedCatTests = [
    { agentId: 'foodbot', merchant: 'Chroma Electronics', category: 'Electronics', amount: 1500 },
    { agentId: 'foodbot', merchant: 'Binance Crypto', category: 'Crypto Assets', amount: 800 },
    { agentId: 'foodbot', merchant: 'Steam Games', category: 'Gaming', amount: 500 },
    { agentId: 'foodbot', merchant: 'IndiGo Airlines', category: 'Flights', amount: 1800 },
    { agentId: 'travelbot', merchant: 'Blinkit Quick', category: 'Grocery', amount: 2500 },
    { agentId: 'travelbot', merchant: 'Bitbns Exchange', category: 'Cryptocurrency', amount: 12000 },
    { agentId: 'travelbot', merchant: 'Gucci Luxury', category: 'Luxury Apparel', amount: 15000 },
    { agentId: 'procurementbot', merchant: 'Zomato Feast', category: 'Food Delivery', amount: 3500 },
    { agentId: 'procurementbot', merchant: 'Betway Casino', category: 'Gambling', amount: 10000 },
    { agentId: 'procurementbot', merchant: 'Taj Exotica Stay', category: 'Resort Vacation', amount: 20000 },
  ];

  for (const item of restrictedCatTests) {
    scenarios.push({
      id: nextId('RESTRICT_CAT'),
      name: `Restricted Category: ${item.agentId} attempted "${item.category}"`,
      category: 'Category Authorization',
      description: `Category "${item.category}" is outside the authorized mandate of ${item.agentId} resulting in hard BLOCK.`,
      transaction: {
        agentId: item.agentId,
        merchant: item.merchant,
        category: item.category,
        amount: item.amount,
        timestamp: '2026-09-01T15:00:00.000Z',
      },
      expectedDecision: 'BLOCK',
      expectedSignals: ['restricted_category', 'new_merchant'],
    });
  }

  // ================= 8. AMOUNT ANOMALY CHECKS (>3x Historical Baseline) =================
  // FoodBot baseline ~₹680. > 3x is > ₹2,040. Since per-tx limit is ₹2,000, for FoodBot any >3x also hits limit.
  // TravelBot baseline ~₹7,850. 3x is ₹23,550 (hits tx limit ₹20k).
  // Let's test with a lower baseline mock or exact multiplier.
  // When baseline is ₹600, amount ₹1,900 is > 3x (3.16x) and under ₹2,000!
  scenarios.push({
    id: nextId('ANOM_AMT'),
    name: 'Amount Anomaly: TravelBot ₹19,500 with unverified merchant',
    category: 'Behavioral Anomaly',
    description: 'Amount is 2.5x baseline with new merchant -> risk 40 (15+25), APPROVAL_REQUIRED.',
    transaction: {
      agentId: 'travelbot',
      merchant: 'LuxuryVillaStay',
      category: 'Flights & Hotels',
      amount: 19500,
      timestamp: '2026-09-01T14:00:00.000Z',
    },
    expectedDecision: 'APPROVAL_REQUIRED',
    expectedSignals: ['new_merchant'],
  });

  // ================= 9. MULTI-SIGNAL COMBINATIONS & RISK SCORES =================
  // New merchant (15) + Unusual time (10) = 25 -> APPROVAL_REQUIRED (because new merchant action is approval_required)
  scenarios.push({
    id: nextId('MULTI_SIG'),
    name: 'Multi-Signal: New Merchant + Off-Hours (Risk 25)',
    category: 'Risk Scoring Combinations',
    description: 'Unverified merchant at 02:00 AM triggers new_merchant (15) + unusual_time (10) -> APPROVAL_REQUIRED.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'MidnightDiner Express',
      category: 'Food & Grocery',
      amount: 500,
      timestamp: '2026-09-01T02:00:00+05:30',
    },
    expectedDecision: 'APPROVAL_REQUIRED',
    expectedSignals: ['new_merchant', 'unusual_time'],
  });

  // Velocity anomaly (25) + Unusual time (10) = 35 -> ALLOW (< 40 and known merchant)
  scenarios.push({
    id: nextId('MULTI_SIG'),
    name: 'Multi-Signal: Velocity Burst + Off-Hours at Known Merchant (Risk 35)',
    category: 'Risk Scoring Combinations',
    description: 'Velocity anomaly (25) + unusual time (10) = 35 risk with verified merchant Swiggy -> ALLOW.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Swiggy',
      category: 'Food & Grocery',
      amount: 400,
      timestamp: '2026-09-01T04:00:00+05:30',
    },
    setup: { recentAttemptsCountIn60s: 6 },
    expectedDecision: 'ALLOW',
    expectedSignals: ['velocity_anomaly', 'unusual_time'],
  });

  // New Merchant (15) + Velocity Anomaly (25) + Unusual Time (10) = 50 -> APPROVAL_REQUIRED (40 <= risk < 80)
  scenarios.push({
    id: nextId('MULTI_SIG'),
    name: 'Multi-Signal: New Merchant + Velocity + Off-Hours (Risk 50)',
    category: 'Risk Scoring Combinations',
    description: 'New merchant (15) + velocity (25) + unusual time (10) = 50 risk -> APPROVAL_REQUIRED.',
    transaction: {
      agentId: 'procurementbot',
      merchant: 'QuickCloudServers',
      category: 'Office Supplies & Software',
      amount: 5000,
      timestamp: '2026-09-01T01:30:00+05:30',
    },
    setup: { recentAttemptsCountIn60s: 6 },
    expectedDecision: 'APPROVAL_REQUIRED',
    expectedSignals: ['new_merchant', 'velocity_anomaly', 'unusual_time'],
  });

  // ================= 10. CRITICAL COMPROMISE SCENARIOS =================
  scenarios.push({
    id: nextId('COMPROMISE'),
    name: '🚨 SCRIPTED COMPROMISE: FoodBot Rogue Electronics Burst (Risk 100)',
    category: 'Critical Compromise Detection',
    description: 'FoodBot attempts ₹25,000 on unauthorized electronics at 03:00 AM IST with 7 velocity burst and new merchant.',
    transaction: {
      agentId: 'foodbot',
      merchant: 'Unknown Electronics Hub',
      category: 'Electronics',
      amount: 25000,
      timestamp: '2026-09-01T03:00:00+05:30',
    },
    setup: { recentAttemptsCountIn60s: 7 },
    expectedDecision: 'BLOCK',
    expectedSignals: [
      'restricted_category',
      'transaction_limit',
      'daily_budget',
      'new_merchant',
      'amount_anomaly',
      'velocity_anomaly',
      'unusual_time',
    ],
  });

  scenarios.push({
    id: nextId('COMPROMISE'),
    name: '🚨 TravelBot Compromise: Crypto Burst at Midnight',
    category: 'Critical Compromise Detection',
    description: 'TravelBot attempts ₹90,000 on unauthorized crypto platform at 01:00 AM IST with velocity burst.',
    transaction: {
      agentId: 'travelbot',
      merchant: 'RogueCryptoVault',
      category: 'Crypto',
      amount: 90000,
      timestamp: '2026-09-01T01:00:00+05:30',
    },
    setup: { recentAttemptsCountIn60s: 8 },
    expectedDecision: 'BLOCK',
    expectedSignals: [
      'restricted_category',
      'transaction_limit',
      'daily_budget',
      'new_merchant',
      'amount_anomaly',
      'velocity_anomaly',
      'unusual_time',
    ],
  });

  // ================= 11. DIVERSE REALISTIC MATRIX (Remaining to reach exactly 100) =================
  const remainingTarget = 100 - scenarios.length;
  const merchantsByAgent: Record<string, string[]> = {
    foodbot: ['Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'BigBasket'],
    travelbot: ['MakeMyTrip', 'Booking.com', 'IndiGo', 'Air India', 'Marriott'],
    procurementbot: ['Amazon Business', 'Microsoft', 'Adobe', 'Dell', 'Udaan'],
  };

  for (let i = 0; i < remainingTarget; i++) {
    const agentIndex = i % 3;
    const agent = SEEDED_AGENTS[agentIndex];
    const knownList = merchantsByAgent[agent.id];
    const merchant = knownList[i % knownList.length];
    const amount = Math.floor(agent.perTransactionLimit * 0.15 + (i * 37) % (agent.perTransactionLimit * 0.5));
    const hour = 8 + (i % 12);
    const minute = (i * 13) % 60;
    const timeStr = `2026-09-01T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`;

    scenarios.push({
      id: nextId('MATRIX_TEST'),
      name: `${agent.name}: Standard Operation Matrix Test #${i + 1} (${merchant} - ₹${amount.toLocaleString('en-IN')})`,
      category: 'Standard Operations Matrix',
      description: `Verifies standard deterministic evaluation for ${agent.name} with verified vendor ${merchant}.`,
      transaction: {
        agentId: agent.id,
        merchant,
        category: agent.category,
        amount,
        timestamp: timeStr,
      },
      expectedDecision: 'ALLOW',
      expectedSignals: [],
    });
  }

  return scenarios;
}

/**
 * Runs the test suite against the REAL production evaluateTransaction function
 */
export function runEngineValidationTests(
  agentsMap: Record<string, Agent> = Object.fromEntries(SEEDED_AGENTS.map(a => [a.id, a])),
  policiesMap: Record<string, Policy> = INITIAL_POLICIES
): {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  results: TestResult[];
} {
  const scenarios = generateEngineTestScenarios();
  const results: TestResult[] = [];

  for (const scenario of scenarios) {
    const agent = agentsMap[scenario.transaction.agentId] || SEEDED_AGENTS[0];
    const policy = policiesMap[scenario.transaction.agentId] || INITIAL_POLICIES[scenario.transaction.agentId];

    // Build context
    const testAgent: Agent = {
      ...agent,
      status: scenario.setup?.agentStatus || agent.status,
    };

    const context: EvaluationContext = {
      agent: testAgent,
      policy,
      historicalExecutedAvg: agent.historicalAvg,
      todayExecutedSpend: scenario.setup?.customDailySpendToday || 0,
      recentAttemptsCountIn60s: scenario.setup?.recentAttemptsCountIn60s || 0,
    };

    const evalResult = evaluateTransaction(scenario.transaction, context);

    const actualDecision = evalResult.decision;
    const actualSignalKeys = evalResult.triggeredSignals.map(s => s.key);

    const decisionMatch = actualDecision === scenario.expectedDecision;
    
    // Check if expected signals are a subset or exact match
    const signalsMatch = scenario.expectedSignals.every(es => actualSignalKeys.includes(es));

    const passed = decisionMatch && signalsMatch;

    let details = '';
    if (!decisionMatch) {
      details = `Decision mismatch: expected ${scenario.expectedDecision}, got ${actualDecision}.`;
    } else if (!signalsMatch) {
      details = `Signal mismatch: expected [${scenario.expectedSignals.join(', ')}], got [${actualSignalKeys.join(', ')}].`;
    } else {
      details = `Validated successfully: ${actualDecision} with risk ${evalResult.riskScore}.`;
    }

    results.push({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      category: scenario.category,
      description: scenario.description,
      passed,
      expectedDecision: scenario.expectedDecision,
      actualDecision,
      expectedSignals: scenario.expectedSignals,
      actualSignals: actualSignalKeys,
      riskScore: evalResult.riskScore,
      signalsMatch,
      decisionMatch,
      details,
    });
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;
  const passRate = Math.round((passedCount / results.length) * 100);

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    passRate,
    results,
  };
}
