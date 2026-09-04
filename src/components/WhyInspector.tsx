import React, { useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Bot, 
  Calendar, 
  Sparkles, 
  DollarSign, 
  Check, 
  Ban, 
  Clock 
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { TransactionAttempt, Decision } from '../types';

export const WhyInspector: React.FC = () => {
  const { 
    inspectingTx, 
    setInspectingTx, 
    approveTransaction, 
    rejectTransaction, 
    agents 
  } = useStore();

  // Close on Escape key
  useEffect(() => {
    if (!inspectingTx) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectingTx(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectingTx, setInspectingTx]);

  if (!inspectingTx) return null;

  const tx = inspectingTx;
  const agent = agents.find(a => a.id === tx.agentId);
  const evalData = tx.evaluation;
  const isPending = tx.status === 'PENDING_APPROVAL';

  const getDecisionBadge = (decision: Decision) => {
    switch (decision) {
      case 'ALLOW':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ALLOW</span>
          </span>
        );
      case 'APPROVAL_REQUIRED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 border border-amber-200 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>APPROVAL REQUIRED</span>
          </span>
        );
      case 'BLOCK':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 border border-rose-200 text-rose-700">
            <ShieldX className="w-3.5 h-3.5 text-rose-600" />
            <span>BLOCK</span>
          </span>
        );
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-rose-700 bg-rose-50 border-rose-200';
    if (score >= 40) return 'text-amber-800 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={() => setInspectingTx(null)}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3.5">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
              style={{ backgroundColor: agent?.avatarColor || '#4f46e5' }}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{tx.agentName}</h3>
                <span className="text-xs font-mono text-slate-500 px-2 py-0.5 rounded-full bg-white border border-slate-200">
                  {tx.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated: {new Date(tx.timestamp).toLocaleString('en-IN', { timeZone: 'UTC' })} UTC
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {getDecisionBadge(tx.decision)}
            <button
              onClick={() => setInspectingTx(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Key Transaction Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Attempted Amount</span>
              <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                ₹{tx.amount.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Merchant</span>
              <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                {tx.merchant}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Category</span>
              <div className="text-sm font-medium text-slate-700 truncate mt-0.5">
                {tx.category}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Status</span>
              <div className="text-xs font-mono font-bold mt-1 text-slate-800">
                {tx.status}
              </div>
            </div>
          </div>

          {/* AI / Deterministic Explanation Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 relative overflow-hidden">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Guardian Decision Explanation</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {tx.explanation || evalData.explanation || 'Transaction evaluated against all governance policies.'}
            </p>
            <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center space-x-2">
              <span>● Grounded strictly in deterministic engine telemetry</span>
              {tx.paymentId && <span>• Payment ID: {tx.paymentId}</span>}
            </div>
          </div>

          {/* Core Checks Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Policy Checks */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span>Deterministic Policy Checks</span>
                <span className="text-[10px] text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-full">AUTHORITY</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Category Authorization</span>
                  {evalData.checks.categoryAllowed ? (
                    <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Authorized</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-rose-700 font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Restricted (+40)</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Single Transaction Limit</span>
                  {evalData.checks.withinTxLimit ? (
                    <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Within Cap</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-rose-700 font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Limit Exceeded (+30)</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Daily Spend Budget</span>
                  {evalData.checks.withinDailyBudget ? (
                    <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Within Budget</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-rose-700 font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Budget Exceeded (+30)</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-600">Merchant Registry</span>
                  {evalData.checks.isKnownMerchant ? (
                    <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Whitelist</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-amber-700 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>New Merchant (+15)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Behavioral Checks */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span>Behavioral Baseline Checks</span>
                <span className="text-[10px] text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-full">INTELLIGENCE</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Behavioral Amount Anomaly (&gt;3x avg)</span>
                  {!evalData.checks.amountAnomaly ? (
                    <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Normal</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-amber-700 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Spike Detected (+25)</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Velocity (60s Window)</span>
                  {!evalData.checks.velocityAnomaly ? (
                    <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Normal Rate (&le;5)</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-rose-700 font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Burst Detected (+25)</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Operating Hours (06:00-23:00)</span>
                  {!evalData.checks.timeAnomaly ? (
                    <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Standard Window</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-amber-700 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Off-Hours (+10)</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-600">Agent Account Status</span>
                  {!evalData.checks.isSuspended ? (
                    <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-rose-700 font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Suspended (+100)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Points Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                Risk Score Formulation
              </span>
              <div className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getRiskColor(evalData.riskScore)}`}>
                Risk Score: {evalData.riskScore} / 100
              </div>
            </div>

            {evalData.triggeredSignals.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                {evalData.triggeredSignals.map((signal) => (
                  <div key={signal.key} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 last:border-b-0">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span className="text-slate-800 font-medium">{signal.label}</span>
                      <span className="text-[11px] text-slate-500 hidden sm:inline">({signal.description})</span>
                    </div>
                    <span className="font-mono font-bold text-rose-600">+{signal.points} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-emerald-700 py-1 flex items-center space-x-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero adverse signals triggered. Clean execution score (0 pts).</span>
              </div>
            )}
          </div>

          {/* Pending Approval Action Bar */}
          {isPending && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div>
                <h4 className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>ACTION REQUIRED: HUMAN REVIEW</span>
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Decide whether to execute this autonomous transaction or enforce a security block.
                </p>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => rejectTransaction(tx.id)}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Deny & Block</span>
                </button>
                <button
                  onClick={() => approveTransaction(tx.id)}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Execute</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            onClick={() => setInspectingTx(null)}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
