import React, { useState } from 'react';
import { Play, Flame, ShieldAlert, CheckCircle2, Clock, Ban, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { TransactionInput } from '../engine/ruleEngine';

export const SimulationPanel: React.FC = () => {
  const { 
    agents, 
    policies, 
    simulateTransaction, 
    simulateCompromiseScenario, 
    isProcessing,
    setInspectingTx 
  } = useStore();

  const [selectedAgentId, setSelectedAgentId] = useState<string>('foodbot');
  const [merchant, setMerchant] = useState<string>('Swiggy');
  const [category, setCategory] = useState<string>('Food & Grocery');
  const [amount, setAmount] = useState<number>(450);
  const [useOffHours, setUseOffHours] = useState<boolean>(false);
  const [isSimulatingBurst, setIsSimulatingBurst] = useState<boolean>(false);

  const currentAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
  const currentPolicy = policies[selectedAgentId];

  // Update default merchant/category when agent changes
  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    const ag = agents.find(a => a.id === agentId);
    if (ag) {
      setMerchant(ag.knownMerchants[0] || 'Swiggy');
      setCategory(ag.category);
      setAmount(Math.round(ag.perTransactionLimit * 0.25));
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let timeStr: string;
    if (useOffHours) {
      const now = new Date();
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const todayIST = new Date(now.getTime() + istOffsetMs).toISOString().slice(0, 10);
      timeStr = `${todayIST}T02:30:00+05:30`;
    } else {
      timeStr = new Date().toISOString();
    }

    const input: TransactionInput = {
      agentId: selectedAgentId,
      merchant,
      category,
      amount: Number(amount) || 100,
      timestamp: timeStr,
    };

    const res = await simulateTransaction(input, 'SIMULATION');
    setInspectingTx(res);
  };

  const [lastSimulatedTx, setLastSimulatedTx] = useState<any>(null);

  // 1. Normal Payment (ALLOW)
  const handleQuickNormal = async () => {
    const input: TransactionInput = {
      agentId: 'foodbot',
      merchant: 'Swiggy',
      category: 'Food & Grocery',
      amount: 450,
      timestamp: new Date().toISOString(),
    };
    const res = await simulateTransaction(input, 'SIMULATION');
    setLastSimulatedTx(res);
  };

  // 2. New Merchant (APPROVAL REQUIRED)
  const handleQuickNewMerchant = async () => {
    const input: TransactionInput = {
      agentId: 'foodbot',
      merchant: 'Artisan Bagel Bar',
      category: 'Food & Grocery',
      amount: 1200,
      timestamp: new Date().toISOString(),
    };
    const res = await simulateTransaction(input, 'SIMULATION');
    setLastSimulatedTx(res);
  };

  // 3. Large Amount (BLOCK: tx limit)
  const handleQuickLargeAmount = async () => {
    const input: TransactionInput = {
      agentId: 'foodbot',
      merchant: 'Swiggy',
      category: 'Food & Grocery',
      amount: 4500, // exceeds per-tx limit ₹2,000
      timestamp: new Date().toISOString(),
    };
    const res = await simulateTransaction(input, 'SIMULATION');
    setLastSimulatedTx(res);
  };

  // 4. Restricted Category (BLOCK: restricted category)
  const handleQuickRestrictedCategory = async () => {
    const input: TransactionInput = {
      agentId: 'foodbot',
      merchant: 'BestBuy Online',
      category: 'Electronics', // Unauthorized for FoodBot
      amount: 1500,
      timestamp: new Date().toISOString(),
    };
    const res = await simulateTransaction(input, 'SIMULATION');
    setLastSimulatedTx(res);
  };

  // 5. Suspicious Burst (Velocity Anomaly)
  const handleQuickBurst = async () => {
    setIsSimulatingBurst(true);
    const now = Date.now();
    let lastRes: any = null;
    // Fire 6 rapid attempts in 10 seconds
    for (let i = 0; i < 6; i++) {
      const input: TransactionInput = {
        agentId: 'foodbot',
        merchant: 'Swiggy',
        category: 'Food & Grocery',
        amount: 350,
        timestamp: new Date(now - (6 - i) * 1000).toISOString(),
      };
      // Skip AI explain for intermediate attempts 0-4 to protect API quota, enrich only the climax
      lastRes = await simulateTransaction(input, 'SIMULATION', false, i < 5);
    }
    setLastSimulatedTx(lastRes);
    setIsSimulatingBurst(false);
  };

  // 🚨 SIMULATE COMPROMISE (FoodBot ₹25,000 Electronics Unknown Merchant 3 AM 7 velocity)
  const handleSimulateCompromise = async () => {
    const climaxTx = await simulateCompromiseScenario();
    setLastSimulatedTx(climaxTx);
    setInspectingTx(climaxTx);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Simulate Transaction Attempt</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                LIVE ENGINE
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Run custom agent requests through the real-time governance firewall
            </p>
          </div>
        </div>

        {/* Quick Demo Scenarios Bar */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              One-Click Scenarios:
            </div>
            {lastSimulatedTx && (
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-slate-400">Last:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  lastSimulatedTx.decision === 'ALLOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  lastSimulatedTx.decision === 'APPROVAL_REQUIRED' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {lastSimulatedTx.decision} (Risk {lastSimulatedTx.riskScore})
                </span>
                <button
                  type="button"
                  onClick={() => setInspectingTx(lastSimulatedTx)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline ml-1 cursor-pointer"
                >
                  Inspect Why
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={handleQuickNormal}
              className="flex items-center space-x-2 px-2.5 py-2 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/70 active:scale-98 border border-emerald-200 text-emerald-800 text-xs font-medium transition-all text-left shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-emerald-900">Normal Payment</div>
                <div className="text-[10px] text-emerald-700 truncate">₹450 Swiggy (ALLOW)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleQuickNewMerchant}
              className="flex items-center space-x-2 px-2.5 py-2 rounded-xl bg-amber-50/80 hover:bg-amber-100/70 active:scale-98 border border-amber-200 text-amber-800 text-xs font-medium transition-all text-left shadow-2xs cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-amber-900">New Merchant</div>
                <div className="text-[10px] text-amber-700 truncate">₹1.2k Unverified (REQ)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleQuickLargeAmount}
              className="flex items-center space-x-2 px-2.5 py-2 rounded-xl bg-rose-50/80 hover:bg-rose-100/70 active:scale-98 border border-rose-200 text-rose-800 text-xs font-medium transition-all text-left shadow-2xs cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-rose-900">Large Amount</div>
                <div className="text-[10px] text-rose-700 truncate">₹4,500 &gt; ₹2k (BLOCK)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleQuickRestrictedCategory}
              className="flex items-center space-x-2 px-2.5 py-2 rounded-xl bg-rose-50/80 hover:bg-rose-100/70 active:scale-98 border border-rose-200 text-rose-800 text-xs font-medium transition-all text-left shadow-2xs cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-rose-900">Restricted Cat</div>
                <div className="text-[10px] text-rose-700 truncate">Electronics (BLOCK)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleQuickBurst}
              disabled={isSimulatingBurst}
              className="flex items-center space-x-2 px-2.5 py-2 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/70 active:scale-98 border border-indigo-200 text-indigo-800 text-xs font-medium transition-all text-left shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-indigo-900">{isSimulatingBurst ? 'Bursting (6 tx)...' : 'Suspicious Burst'}</div>
                <div className="text-[10px] text-indigo-700 truncate">6 tx / 10s velocity</div>
              </div>
            </button>
          </div>
        </div>

        {/* 🚨 CLIMAX DEMO BUTTON */}
        <div className="mt-3">
          <button
            type="button"
            onClick={handleSimulateCompromise}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 active:scale-99 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-red-600/20 border border-red-500 flex items-center justify-center space-x-2 transition-all cursor-pointer group"
          >
            <Flame className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform animate-pulse" />
            <span>🚨 SIMULATE AGENT COMPROMISE SCENARIO (FoodBot ₹25,000 Electronics @ 3 AM)</span>
            <ShieldAlert className="w-4 h-4 text-amber-300" />
          </button>
        </div>

        {/* Custom Form */}
        <form onSubmit={handleCustomSubmit} className="mt-4 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Agent Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target AI Agent
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.status === 'suspended' ? 'SUSPENDED' : a.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Merchant */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merchant / Payee
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Swiggy, Amazon, Zepto"
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Food & Grocery, Electronics"
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between">
            <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={useOffHours}
                onChange={(e) => setUseOffHours(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Simulate off-hours timing (02:30 AM IST)</span>
            </label>

            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Evaluate Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
