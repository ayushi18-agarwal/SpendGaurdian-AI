import React, { useState } from 'react';
import { StoreProvider, useStore } from './store/StoreContext';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { LedgerPage } from './pages/LedgerPage';
import { PolicyPage } from './pages/PolicyPage';
import { ValidationPage } from './pages/ValidationPage';
import { LandingPage } from './pages/LandingPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { WhyInspector } from './components/WhyInspector';
import { Shield, Lock, Terminal } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'incidents' | 'ledger' | 'policy' | 'validation' | 'landing'>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Top Sleek Header */}
      <Header activeTab={activeTab} onSelectTab={(t: any) => setActiveTab(t)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigateToLedger={() => setActiveTab('ledger')}
            onNavigateToPolicy={() => setActiveTab('policy')}
            onNavigateToValidation={() => setActiveTab('validation')}
          />
        )}

        {activeTab === 'incidents' && <IncidentsPage />}

        {activeTab === 'ledger' && <LedgerPage />}

        {activeTab === 'policy' && <PolicyPage />}

        {activeTab === 'validation' && <ValidationPage />}

        {activeTab === 'landing' && (
          <LandingPage
            onLaunchDashboard={() => setActiveTab('dashboard')}
            onOpenPolicy={() => setActiveTab('policy')}
          />
        )}
      </main>

      {/* Why Inspector Modal Overlay */}
      <WhyInspector />

      {/* Sleek Modern Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">Agent Spend Guardian</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-[11px] text-slate-500">v1.0.0 (Deterministic Firewall Engine)</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center space-x-1.5 text-slate-600 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero LLM Authority in Payment Core</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Razorpay AI Governance Layer</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
