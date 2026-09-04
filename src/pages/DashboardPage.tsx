import React from 'react';
import { MetricsCards } from '../components/MetricsCards';
import { SimulationPanel } from '../components/SimulationPanel';
import { DecisionChart } from '../components/DecisionChart';
import { LiveFeed } from '../components/LiveFeed';
import { CompromiseBanner } from '../components/CompromiseBanner';
import { EngineValidationPanel } from '../components/EngineValidationPanel';
import { useStore } from '../store/StoreContext';
import { Bot, Shield, AlertTriangle, ArrowRight } from 'lucide-react';

interface DashboardPageProps {
  onNavigateToLedger: () => void;
  onNavigateToPolicy: () => void;
  onNavigateToValidation: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToLedger,
  onNavigateToPolicy,
  onNavigateToValidation,
}) => {
  const { agents, policies } = useStore();

  return (
    <div className="space-y-6 py-4">
      {/* 🚨 Critical Compromise Alert Banner if triggered */}
      <CompromiseBanner onReviewTransactions={onNavigateToLedger} />

      {/* Top Metrics Cards (Attempts, Executed, Allowed, Approval Required, Blocked, Amount Protected) */}
      <MetricsCards />

      {/* Main Grid: Simulation & Decision Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top: Interactive Simulator */}
        <div className="lg:col-span-7">
          <SimulationPanel />
        </div>

        {/* Right / Top: Recharts Decision Distribution Chart */}
        <div className="lg:col-span-5">
          <DecisionChart />
        </div>
      </div>

      {/* Second Row: Active Agents Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Governed AI Agent Registry</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                3 AGENTS ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomous agents currently provisioned with spending policies and baseline tracking
            </p>
          </div>
          <button
            onClick={onNavigateToPolicy}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center space-x-1 transition-colors"
          >
            <span>Edit Policies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {agents.map((agent) => {
            const policy = policies[agent.id];
            const isSuspended = agent.status === 'suspended';

            return (
              <div 
                key={agent.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSuspended 
                    ? 'bg-rose-50/50 border-rose-200' 
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs"
                      style={{ backgroundColor: agent.avatarColor }}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>{agent.name}</span>
                        {isSuspended && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                            SUSPENDED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                        {agent.category}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Daily Limit</span>
                    <div className="text-slate-900 font-bold">
                      ₹{policy ? policy.dailyLimit.toLocaleString('en-IN') : agent.dailyLimit.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Single Tx Cap</span>
                    <div className="text-slate-900 font-bold">
                      ₹{policy ? policy.perTransactionLimit.toLocaleString('en-IN') : agent.perTransactionLimit.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Kill Switch Controls */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
                  <div className="text-[10px] text-slate-500 font-medium">
                    Known: {agent.knownMerchants.length} | <span className="text-indigo-600 font-mono font-bold">Avg: ₹{agent.historicalAvg}</span>
                  </div>
                  {isSuspended ? (
                    <button
                      onClick={() => useStore().activateAgent(agent.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                      title="Unfreeze agent"
                    >
                      Unfreeze
                    </button>
                  ) : (
                    <button
                      onClick={() => useStore().suspendAgent(agent.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-colors cursor-pointer"
                      title="Instantly freeze this agent"
                    >
                      ⚡ Kill-Switch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Third Row: Live Feed & Engine Validation Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Feed */}
        <div className="lg:col-span-6">
          <LiveFeed onViewAllLedger={onNavigateToLedger} limit={6} />
        </div>

        {/* Engine Validation Panel */}
        <div className="lg:col-span-6">
          <EngineValidationPanel isFullPage={false} />
        </div>
      </div>
    </div>
  );
};
