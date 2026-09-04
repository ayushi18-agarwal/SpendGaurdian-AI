import React from 'react';
import { AlertTriangle, Lock, Eye, X, ShieldAlert, Zap } from 'lucide-react';
import { useStore } from '../store/StoreContext';

interface CompromiseBannerProps {
  onReviewTransactions?: () => void;
}

export const CompromiseBanner: React.FC<CompromiseBannerProps> = ({ onReviewTransactions }) => {
  const { activeCompromiseAlert, dismissCompromiseAlert, suspendAgent, setInspectingTx } = useStore();

  if (!activeCompromiseAlert) return null;

  const { agent, tx } = activeCompromiseAlert;
  const isAlreadySuspended = agent.status === 'suspended';

  const handleSuspend = () => {
    suspendAgent(agent.id);
  };

  const handleReview = () => {
    setInspectingTx(tx);
    if (onReviewTransactions) {
      onReviewTransactions();
    }
  };

  return (
    <div className="bg-rose-600 border border-rose-500 rounded-2xl p-4 sm:p-5 shadow-lg shadow-rose-600/20 text-white relative overflow-hidden transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white text-rose-700">
                CRITICAL THREAT
              </span>
              <h4 className="text-sm sm:text-base font-bold tracking-tight text-white">
                🚨 POSSIBLE AGENT COMPROMISE DETECTED
              </h4>
            </div>
            <p className="text-xs text-rose-100 mt-1 max-w-2xl leading-relaxed">
              <strong className="text-white font-mono">{agent.name}</strong> triggered maximum risk score (<span className="font-mono font-bold text-white">100/100</span>) attempting <span className="font-mono font-bold text-white">₹{tx.amount.toLocaleString('en-IN')}</span> at unverified merchant <span className="font-mono text-white">"{tx.merchant}"</span> in restricted category <span className="font-mono text-white">"{tx.category}"</span> with velocity burst and off-hours execution.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
          <button
            onClick={handleReview}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/30 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Why Inspector</span>
          </button>

          {!isAlreadySuspended ? (
            <button
              onClick={handleSuspend}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold shadow-md transition-all cursor-pointer active:scale-98"
              title="Instantly revoke spending access and freeze this agent"
            >
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>⚡ Activate Emergency Kill-Switch ({agent.name})</span>
            </button>
          ) : (
            <span className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-900/80 text-white text-xs font-mono font-bold border border-rose-300">
              <Lock className="w-3.5 h-3.5" />
              <span>BOT FROZEN (KILL-SWITCH ENGAGED)</span>
            </span>
          )}

          <button
            onClick={dismissCompromiseAlert}
            className="p-1.5 text-rose-200 hover:text-white rounded-lg hover:bg-rose-700/50 transition-colors cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
