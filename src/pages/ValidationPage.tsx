import React from 'react';
import { EngineValidationPanel } from '../components/EngineValidationPanel';
import { Terminal, ShieldCheck, CheckCircle2, Sliders } from 'lucide-react';

export const ValidationPage: React.FC = () => {
  return (
    <div className="space-y-6 py-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Deterministic Engine Validation Suite
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive test harness verifying mathematical invariants, boundary conditions, velocity thresholds, and compromise detection against the live rule engine.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 pt-3.5 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-mono font-semibold">Boundaries Tested</span>
            <span className="text-slate-900 font-bold">Limit exact vs ₹1 above</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-mono font-semibold">Velocity Windows</span>
            <span className="text-slate-900 font-bold">5 vs 6+ attempts / 60s</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-mono font-semibold">Time Enforcements</span>
            <span className="text-slate-900 font-bold">06:00 to 23:00 Window</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-mono font-semibold">Governance States</span>
            <span className="text-slate-900 font-bold">Active vs Suspended Locks</span>
          </div>
        </div>
      </div>

      {/* Main Validation Suite Component */}
      <EngineValidationPanel isFullPage={true} />
    </div>
  );
};
