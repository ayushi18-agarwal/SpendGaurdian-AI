import React, { useState } from 'react';
import { 
  Shield, 
  Eye, 
  Lock, 
  AlertOctagon, 
  ShieldAlert, 
  RotateCcw, 
  X, 
  ChevronRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { SecurityState, AdaptiveState } from '../types';
import { useStore } from '../store/StoreContext';

interface AdaptiveStateBadgeProps {
  adaptiveState?: AdaptiveState;
  agentId: string;
  agentName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AdaptiveStateBadge: React.FC<AdaptiveStateBadgeProps> = ({
  adaptiveState,
  agentId,
  agentName = 'Agent',
  size = 'md',
}) => {
  const { restoreAdaptiveState } = useStore();
  const [showModal, setShowModal] = useState(false);

  const state: SecurityState = adaptiveState?.state || 'NORMAL';
  const configuredLimit = adaptiveState?.configuredLimit || 5000;
  const adaptiveLimit = adaptiveState?.adaptiveLimit ?? configuredLimit;
  const cleanStreak = adaptiveState?.cleanStreak || 0;
  const reason = adaptiveState?.reason || 'Nominal execution state.';
  const history = adaptiveState?.transitionHistory || [];

  const getStyle = (s: SecurityState) => {
    switch (s) {
      case 'NORMAL':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'NORMAL',
          level: 'L0',
          icon: Shield,
        };
      case 'MONITOR':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          label: 'MONITOR',
          level: 'L1',
          icon: Eye,
        };
      case 'RESTRICTED':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'RESTRICTED',
          level: 'L2',
          icon: Lock,
        };
      case 'LOCKDOWN':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-200',
          dot: 'bg-orange-500',
          label: 'LOCKDOWN',
          level: 'L3',
          icon: AlertOctagon,
        };
      case 'SUSPENDED':
      default:
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          label: 'SUSPENDED',
          level: 'L4',
          icon: ShieldAlert,
        };
    }
  };

  const style = getStyle(state);
  const Icon = style.icon;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        title="Adaptive Response Security Posture (Click to view controls)"
        className={`inline-flex items-center space-x-1.5 rounded-lg border font-mono font-medium transition-all hover:shadow-xs cursor-pointer ${
          style.bg
        } ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        <span className="font-bold">{style.level}</span>
        <span className="font-semibold">{style.label}</span>
        {state === 'RESTRICTED' && (
          <span className="text-[10px] bg-white/70 px-1 py-0.2 rounded font-sans font-bold text-amber-900">
            50% Cap
          </span>
        )}
      </button>

      {/* Adaptive Security Posture Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl border ${style.bg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Adaptive Security Posture
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {agentName} ({agentId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Posture Overview Card */}
            <div className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Current Level
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs border ${style.bg}`}>
                      {style.level}: {style.label}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Effective Tx Limit
                  </span>
                  <p className="text-sm font-bold font-mono text-slate-900 mt-1">
                    ₹{adaptiveLimit.toLocaleString('en-IN')}{' '}
                    {state === 'RESTRICTED' && (
                      <span className="text-xs font-normal text-amber-700">
                        (Configured: ₹{configuredLimit.toLocaleString('en-IN')})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Status explanation */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong>Current State Driver:</strong> {reason}
              </div>

              {/* Safe recovery progress */}
              {state !== 'NORMAL' && state !== 'SUSPENDED' && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span>Clean Recovery Progress:</span>
                    <span>{cleanStreak} / 5 compliant transactions</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-blue-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${Math.min(100, (cleanStreak / 5) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Executing 5 consecutive compliant transactions automatically de-escalates this agent down one security level.
                  </p>
                </div>
              )}

              {state === 'SUSPENDED' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <strong>Permanent Kill-Switch Lock:</strong> Suspended agents never automatically de-escalate. Human security officer review is strictly required to unfreeze autonomous spending.
                </div>
              )}
            </div>

            {/* Escalation Hierarchy Legend */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Adaptive Hierarchy Rules
              </h4>
              <div className="space-y-1.5 text-[11px] font-mono text-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="w-16 font-bold text-emerald-700">L0 NORMAL</span>
                  <span>Full configured limits. Standard evaluation.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-16 font-bold text-blue-700">L1 MONITOR</span>
                  <span>Telemetry heightened. Limits unchanged.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-16 font-bold text-amber-700">L2 RESTRICT</span>
                  <span>Effective limit halved (50%). New merchants require approval.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-16 font-bold text-orange-700">L3 LOCKDOWN</span>
                  <span>All transactions mandate human approval. Incident filed.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-16 font-bold text-rose-700">L4 SUSPEND</span>
                  <span>Autonomous kill-switch engaged. 100% hard block.</span>
                </div>
              </div>
            </div>

            {/* Transition History */}
            {history.length > 0 && (
              <div className="p-6 max-h-48 overflow-y-auto space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Recent State Transitions
                </h4>
                {history.slice(0, 5).map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                      <span>{t.from} → {t.to}</span>
                      <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-800 text-[11px]">{t.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {state !== 'NORMAL' ? (
                <button
                  onClick={() => {
                    restoreAdaptiveState(agentId);
                    setShowModal(false);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Restore to NORMAL</span>
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
