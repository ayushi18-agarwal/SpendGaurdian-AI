import React from 'react';
import { Shield, ShieldAlert, CheckCircle2, RotateCcw, Sparkles, Terminal, Activity, FileText, Database } from 'lucide-react';
import { useStore } from '../store/StoreContext';

interface HeaderProps {
  activeTab?: string;
  currentTab?: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, currentTab, onSelectTab }) => {
  const selectedTab = activeTab || currentTab || 'dashboard';
  const { apiMode, resetToDefaults, metrics, agents, incidents } = useStore();
  const suspendedCount = agents.filter(a => a.status === 'suspended').length;

  const navItems = [
    { id: 'dashboard', label: 'Security Console', icon: Activity },
    { id: 'incidents', label: 'Incidents', icon: ShieldAlert, badge: incidents.length > 0 ? incidents.length : undefined },
    { id: 'ledger', label: 'Decision Ledger', icon: Database, badge: metrics.totalAttempts },
    { id: 'policy', label: 'Policy Engine', icon: FileText },
    { id: 'validation', label: 'Engine Validation', icon: Terminal, badge: '100 Tests' },
    { id: 'landing', label: 'Architecture & Overview', icon: Sparkles },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-slate-900">Agent Spend Guardian</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  FIREWALL v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 tracking-normal hidden sm:block">
                Autonomous Payment Governance & Risk Intelligence
              </p>
            </div>
          </div>

          {/* System Protected Indicator */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-medium shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>● SYSTEM PROTECTED</span>
            </div>

            {suspendedCount > 0 && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>{suspendedCount} AGENT SUSPENDED</span>
              </div>
            )}

            <div className="text-[11px] font-mono text-slate-600 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-medium">
              {apiMode === 'ZERO_KEY_DEMO_MODE' ? 'ZERO-KEY DEMO MODE' : 'HYBRID AI + DETERMINISTIC'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={resetToDefaults}
              title="Reset state to deterministic baseline"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-1.5 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer active:scale-98 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-indigo-200/70 text-indigo-800 font-bold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
