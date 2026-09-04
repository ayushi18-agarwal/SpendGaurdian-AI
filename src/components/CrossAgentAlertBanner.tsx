import React from 'react';
import { AlertTriangle, Users, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CrossAgentAnomaly } from '../types';
import { useStore } from '../store/StoreContext';

interface CrossAgentAlertBannerProps {
  onInspectMerchant?: (merchant: string) => void;
}

export const CrossAgentAlertBanner: React.FC<CrossAgentAlertBannerProps> = ({ onInspectMerchant }) => {
  const { crossAgentAnomalies, resolveCrossAgentAnomaly, agents } = useStore();

  const activeAnomalies = crossAgentAnomalies.filter(a => a.status === 'ACTIVE');

  if (activeAnomalies.length === 0) return null;

  return (
    <div className="space-y-3">
      {activeAnomalies.map(anomaly => {
        const agentNames = anomaly.affectedAgents
          .map(id => agents.find(a => a.id === id)?.name || id)
          .join(', ');

        return (
          <div
            key={anomaly.id}
            className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-sm relative overflow-hidden animate-in fade-in duration-200"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
                  <Users className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                      CROSS_AGENT_SPENDING_ANOMALY
                    </span>
                    <span className="text-xs text-amber-700 font-mono">
                      +20 Risk Points Applied
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-amber-950">
                    Coordinated Supplier Concentration: {anomaly.merchant}
                  </h4>

                  <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
                    <strong>{anomaly.affectedAgents.length} distinct agents</strong> ({agentNames}) 
                    attempted concurrent transactions targeting <strong>{anomaly.merchant}</strong> within {anomaly.timeWindowSeconds} seconds, 
                    reaching a combined expenditure of <strong className="font-mono">₹{anomaly.combinedAmount.toLocaleString('en-IN')}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                {onInspectMerchant && (
                  <button
                    onClick={() => onInspectMerchant(anomaly.merchant)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-semibold transition-colors"
                  >
                    <span>Filter Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => resolveCrossAgentAnomaly(anomaly.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Acknowledge & Clear</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
