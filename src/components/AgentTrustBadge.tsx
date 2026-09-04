import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Activity, ChevronRight, X } from 'lucide-react';
import { TrustScore, TrustScoreCategory } from '../types';

interface AgentTrustBadgeProps {
  trustScore?: TrustScore;
  agentName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AgentTrustBadge: React.FC<AgentTrustBadgeProps> = ({
  trustScore = { score: 85, category: 'TRUSTED', breakdown: [], cleanStreak: 0 },
  agentName = 'Agent',
  size = 'md',
}) => {
  const [showModal, setShowModal] = useState(false);
  const { score, category, breakdown, cleanStreak } = trustScore;

  const getTheme = (cat: TrustScoreCategory) => {
    switch (cat) {
      case 'TRUSTED':
        return {
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'TRUSTED',
          border: 'border-emerald-300',
          barColor: 'bg-emerald-500',
          icon: ShieldCheck,
        };
      case 'MONITORED':
        return {
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          label: 'MONITORED',
          border: 'border-blue-300',
          barColor: 'bg-blue-500',
          icon: Activity,
        };
      case 'ELEVATED_RISK':
        return {
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'ELEVATED RISK',
          border: 'border-amber-300',
          barColor: 'bg-amber-500',
          icon: AlertTriangle,
        };
      case 'HIGH_RISK':
      default:
        return {
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: 'HIGH RISK',
          border: 'border-rose-300',
          barColor: 'bg-rose-500',
          icon: ShieldAlert,
        };
    }
  };

  const theme = getTheme(category);
  const Icon = theme.icon;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        title="Click to view explainable trust score breakdown"
        className={`inline-flex items-center space-x-1.5 rounded-lg border font-mono font-medium transition-all hover:shadow-xs cursor-pointer ${
          theme.badgeBg
        } ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
        <span className="font-bold">{score}</span>
        <span className="text-[10px] uppercase opacity-85">/100</span>
        <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded-md bg-white/70">
          {theme.label}
        </span>
      </button>

      {/* Trust Score Breakdown Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl border ${theme.badgeBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {agentName} Trust Telemetry
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Deterministic behavioral trust score calculation
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

            {/* Score Hero */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Trust Rating
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-extrabold font-mono text-slate-900">
                      {score}
                    </span>
                    <span className="text-slate-400 font-mono text-sm">/ 100</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${theme.badgeBg}`}>
                      {theme.label}
                    </span>
                  </div>
                </div>

                {cleanStreak > 0 && (
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Clean Streak
                    </span>
                    <p className="text-sm font-bold text-emerald-600 font-mono">
                      {cleanStreak} compliant txs
                    </p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mt-3">
                <div
                  className={`h-full ${theme.barColor} transition-all duration-500`}
                  style={{ width: `${score}%` }}
                />
              </div>

              {/* Tiers legend */}
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-slate-500 mt-2 text-center">
                <span className="text-rose-600 font-medium">0-39 High Risk</span>
                <span className="text-amber-600 font-medium">40-59 Elevated</span>
                <span className="text-blue-600 font-medium">60-79 Monitored</span>
                <span className="text-emerald-600 font-medium">80-100 Trusted</span>
              </div>
            </div>

            {/* Explainable Factor Breakdown */}
            <div className="p-6 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Explainable Score Breakdown
              </h4>
              
              <div className="space-y-2">
                {breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="text-slate-700 font-medium">{item.label}</span>
                    <span
                      className={`font-mono font-bold ${
                        item.points > 0
                          ? 'text-emerald-600'
                          : item.points < 0
                          ? 'text-rose-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.points > 0 ? `+${item.points}` : item.points}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                <strong>Governance Rule:</strong> Agent Trust Scores are calculated 100% deterministically from verified ledger events (compliant payments, velocity spikes, anomalous amounts, and hard policy blocks). No opaque machine learning weights are used.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
