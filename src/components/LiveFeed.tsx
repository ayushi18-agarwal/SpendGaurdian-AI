import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ShieldX, 
  Bot, 
  ArrowRight, 
  Eye, 
  Sparkles,
  Zap
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { TransactionAttempt, Decision } from '../types';

interface LiveFeedProps {
  onViewAllLedger?: () => void;
  limit?: number;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ onViewAllLedger, limit = 8 }) => {
  const { transactions, setInspectingTx, agents } = useStore();

  const recentTxs = transactions.slice(0, limit);

  const getDecisionBadge = (decision: Decision) => {
    switch (decision) {
      case 'ALLOW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            <span>ALLOW</span>
          </span>
        );
      case 'APPROVAL_REQUIRED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 border border-amber-200 text-amber-700">
            <Clock className="w-3 h-3" />
            <span>APPROVAL</span>
          </span>
        );
      case 'BLOCK':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-50 border border-rose-200 text-rose-700">
            <ShieldX className="w-3 h-3" />
            <span>BLOCK</span>
          </span>
        );
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(isoString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Live Transaction Feed
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            Real-Time Stream
          </span>
        </div>

        {onViewAllLedger && (
          <button
            onClick={onViewAllLedger}
            className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
          >
            <span>View All Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 mt-1">
        {recentTxs.map((tx) => {
          const agent = agents.find(a => a.id === tx.agentId);
          return (
            <div
              key={tx.id}
              onClick={() => setInspectingTx(tx)}
              className="py-2.5 px-2 hover:bg-slate-50/80 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
            >
              {/* Agent & Merchant */}
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[11px] shrink-0 shadow-xs"
                  style={{ backgroundColor: agent?.avatarColor || '#3b82f6' }}
                >
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">{tx.agentName}</span>
                    <span className="text-[10px] text-slate-400">→</span>
                    <span className="text-xs text-slate-700 font-medium truncate">{tx.merchant}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate flex items-center space-x-1">
                    <span>{tx.category}</span>
                    <span>•</span>
                    <span className="font-mono">{formatRelativeTime(tx.timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Amount, Risk & Decision */}
              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900">
                    ₹{tx.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Risk: <span className={tx.riskScore >= 80 ? 'text-rose-600 font-bold' : tx.riskScore >= 40 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>{tx.riskScore}</span>
                  </div>
                </div>

                <div className="hidden sm:block">
                  {getDecisionBadge(tx.decision)}
                </div>

                <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
