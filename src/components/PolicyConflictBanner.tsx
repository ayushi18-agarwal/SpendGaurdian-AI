import React from 'react';
import { Sliders, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { PolicyConflict } from '../types';
import { useStore } from '../store/StoreContext';

interface PolicyConflictBannerProps {
  onOpenPolicyPage?: () => void;
}

export const PolicyConflictBanner: React.FC<PolicyConflictBannerProps> = ({ onOpenPolicyPage }) => {
  const { policyConflicts, agents } = useStore();

  if (policyConflicts.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {policyConflicts.map(conflict => {
        const agent = agents.find(a => a.id === conflict.agentId);

        return (
          <div
            key={conflict.id}
            className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0 mt-0.5">
                  <Sliders className="w-4 h-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900">
                      POLICY CONFLICT DETECTED
                    </span>
                    <span className="text-xs font-semibold text-indigo-800">
                      {agent?.name || conflict.agentId}
                    </span>
                  </div>

                  <p className="text-xs text-indigo-900 font-medium">
                    {conflict.explanation}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono mt-1">
                    <span className="px-2 py-0.5 rounded bg-white border border-indigo-200 text-slate-700">
                      Rule A: {conflict.ruleA}
                    </span>
                    <span className="text-slate-400">vs</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-indigo-200 text-slate-700">
                      Rule B: {conflict.ruleB}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-800 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resolution Guarantee: {conflict.appliedResolution}</span>
                  </div>
                </div>
              </div>

              {onOpenPolicyPage && (
                <button
                  onClick={onOpenPolicyPage}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 text-xs font-semibold transition-colors shadow-xs shrink-0 self-end sm:self-center"
                >
                  <span>Resolve in Policy Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
