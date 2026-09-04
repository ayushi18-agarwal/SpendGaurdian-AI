import React, { useState, useMemo } from 'react';
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  FileCode2, 
  Sliders, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Policy, Agent, Decision } from '../types';
import { useStore, WhatIfSimulationResult } from '../store/StoreContext';

interface WhatIfSimulatorProps {
  selectedAgent: Agent;
  draftPolicy: Policy;
  onApplyPolicy: (policy: Policy) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  selectedAgent,
  draftPolicy,
  onApplyPolicy,
}) => {
  const { runWhatIfSimulation, policies } = useStore();
  const [hasRun, setHasRun] = useState(false);

  // Compute simulation result
  const simulationResult = useMemo<WhatIfSimulationResult | null>(() => {
    if (!hasRun) return null;
    return runWhatIfSimulation(draftPolicy, selectedAgent.id);
  }, [hasRun, draftPolicy, selectedAgent.id, runWhatIfSimulation]);

  const handleRun = () => {
    setHasRun(true);
  };

  const getDecisionBadge = (decision: Decision) => {
    switch (decision) {
      case 'ALLOW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ALLOW</span>;
      case 'APPROVAL_REQUIRED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">APPROVAL</span>;
      case 'BLOCK':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">BLOCK</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              What-If Policy Impact Simulator
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
              PRE-DEPLOYMENT TEST
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Backtest this drafted policy against {selectedAgent.name}’s historical ledger without altering production state.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRun}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Historical Impact</span>
          </button>
        </div>
      </div>

      {!hasRun ? (
        <div className="text-center py-8 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Sliders className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-600 font-medium">
            Click "Simulate Historical Impact" to re-evaluate past transactions with current drafted rules:
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-[11px] font-mono text-slate-500">
            <span>Limit: ₹{draftPolicy.perTransactionLimit.toLocaleString('en-IN')}</span>
            <span>•</span>
            <span>Daily: ₹{draftPolicy.dailyLimit.toLocaleString('en-IN')}</span>
            <span>•</span>
            <span>Categories: {draftPolicy.allowedCategories.length}</span>
          </div>
        </div>
      ) : simulationResult ? (
        <div className="space-y-5">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Allowed Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Instant Approvals
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {simulationResult.simulated.allowedCount}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  (was {simulationResult.original.allowedCount})
                </span>
                {simulationResult.simulated.allowedCount !== simulationResult.original.allowedCount && (
                  <span className={`text-xs font-mono font-bold ${
                    simulationResult.simulated.allowedCount > simulationResult.original.allowedCount
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}>
                    {simulationResult.simulated.allowedCount > simulationResult.original.allowedCount ? '+' : ''}
                    {simulationResult.simulated.allowedCount - simulationResult.original.allowedCount}
                  </span>
                )}
              </div>
            </div>

            {/* Approval Required Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Human Review Triggers
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-bold font-mono text-amber-600">
                  {simulationResult.simulated.approvalCount}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  (was {simulationResult.original.approvalCount})
                </span>
                {simulationResult.simulated.approvalCount !== simulationResult.original.approvalCount && (
                  <span className="text-xs font-mono font-bold text-amber-600">
                    {simulationResult.simulated.approvalCount > simulationResult.original.approvalCount ? '+' : ''}
                    {simulationResult.simulated.approvalCount - simulationResult.original.approvalCount}
                  </span>
                )}
              </div>
            </div>

            {/* Hard Blocks Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Hard Intercepts (Blocks)
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-bold font-mono text-rose-600">
                  {simulationResult.simulated.blockedCount}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  (was {simulationResult.original.blockedCount})
                </span>
                {simulationResult.simulated.blockedCount !== simulationResult.original.blockedCount && (
                  <span className="text-xs font-mono font-bold text-rose-600">
                    {simulationResult.simulated.blockedCount > simulationResult.original.blockedCount ? '+' : ''}
                    {simulationResult.simulated.blockedCount - simulationResult.original.blockedCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Diff Table of Changed Transactions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Behavioral Impact Diff ({simulationResult.changedTransactions.length} Transactions Altered)
              </h4>
              {simulationResult.changedTransactions.length > 0 && (
                <span className="text-xs font-mono text-indigo-700 font-semibold">
                  ₹{simulationResult.changedTransactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString('en-IN')} Total Affected Volume
                </span>
              )}
            </div>

            {simulationResult.changedTransactions.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Zero Historical Disruptions:</strong> This drafted policy change produces identical decisions across all {selectedAgent.name} past transactions.
                </span>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {simulationResult.changedTransactions.map(tx => (
                  <div key={tx.id} className="p-3 bg-white hover:bg-slate-50/70 text-xs flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900">{tx.merchant}</span>
                        <span className="text-slate-400 font-mono text-[11px]">•</span>
                        <span className="font-mono font-bold text-slate-800">₹{tx.amount.toLocaleString('en-IN')}</span>
                        <span className="text-slate-400 font-mono text-[11px]">•</span>
                        <span className="text-slate-500">{tx.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {tx.simulatedReasons.join(' • ')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Original</span>
                        {getDecisionBadge(tx.originalDecision)}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <div className="text-left">
                        <span className="text-[10px] text-indigo-600 uppercase font-mono block font-bold">Simulated</span>
                        {getDecisionBadge(tx.simulatedDecision)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => setHasRun(false)}
              className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Simulation</span>
            </button>

            <button
              onClick={() => onApplyPolicy(draftPolicy)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Verified Policy as Live</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
