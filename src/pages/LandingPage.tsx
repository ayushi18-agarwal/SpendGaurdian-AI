import React from 'react';
import { 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Zap, 
  FileCode2, 
  Sliders, 
  Bot, 
  Database, 
  ShieldAlert, 
  Sparkles,
  Server
} from 'lucide-react';

interface LandingPageProps {
  onLaunchDashboard: () => void;
  onOpenPolicy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchDashboard, onOpenPolicy }) => {
  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 overflow-hidden shadow-sm">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>REAL-TIME AUTONOMOUS PAYMENT GOVERNANCE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Agent Spend Guardian
          </h1>

          <p className="text-lg sm:text-xl font-semibold text-indigo-700 mt-3 italic">
            “Razorpay gives AI agents the ability to pay. Agent Spend Guardian gives businesses the ability to trust them.”
          </p>

          <p className="text-sm sm:text-base text-slate-600 mt-5 leading-relaxed">
            Traditional fraud systems ask: <em>“Is this credit card transaction fraudulent?”</em><br />
            Agent Spend Guardian asks: <strong className="text-slate-900">“Is this AI agent authorized to make this specific transaction, and does it match the human's stated intent and the agent's normal behavior?”</strong>
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onLaunchDashboard}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-all hover:scale-[1.02]"
            >
              <span>Open Security Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenPolicy}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-sm font-semibold transition-colors"
            >
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Define Policies</span>
            </button>
          </div>
        </div>
      </div>

      {/* Core Architectural Principle Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-indigo-50/70 border border-indigo-100 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider mb-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>Core Architectural Guarantee</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          “AI understands intent. Deterministic logic enforces it.”
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-3xl leading-relaxed">
          The LLM is <strong>never</strong> permitted to make the final financial decision or authorize money movement. 
          AI compiles human natural-language policies into structured rules and generates human-readable explanations. 
          A 100% deterministic TypeScript rule engine retains absolute mathematical authority over every transaction.
        </p>
      </div>

      {/* 5-Step Architecture Flow Diagram */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            How Agent Spend Guardian Works
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            End-to-end lifecycle between autonomous AI execution and payment infrastructure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-indigo-600 mb-1">STEP 01</div>
              <div className="font-bold text-slate-900 text-sm">Human Intent</div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Business sets spending limits & vendor policies in plain conversational English.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] font-mono font-semibold text-slate-500">
              Plain Text
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-indigo-600 mb-1">STEP 02</div>
              <div className="font-bold text-slate-900 text-sm">AI Compiler</div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Model converts human prose into strict, schema-validated JSON constraints.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] font-mono font-semibold text-indigo-600">
              Structured JSON
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-indigo-50/80 border-2 border-indigo-400 flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-xs font-mono font-bold text-indigo-700 mb-1">STEP 03 (CORE)</div>
              <div className="font-bold text-slate-900 text-sm">Deterministic Firewall</div>
              <p className="text-[11px] text-slate-700 mt-2 leading-relaxed">
                Rule engine evaluates agent authorization, velocity, daily spend, and off-hour anomalies.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-200 text-[10px] font-mono text-indigo-800 font-bold">
              ALLOW / REQ / BLOCK
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-indigo-600 mb-1">STEP 04</div>
              <div className="font-bold text-slate-900 text-sm">Explainability</div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                AI crafts a concise 1-2 sentence explanation strictly grounded in deterministic rule telemetry.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] font-mono font-semibold text-indigo-600">
              Audit Explanation
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-indigo-600 mb-1">STEP 05</div>
              <div className="font-bold text-slate-900 text-sm">Execution / Ledger</div>
              <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                Payment triggers in test-mode or halts for human review; decision is permanently recorded in ledger.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] font-mono font-semibold text-emerald-700">
              Immutable Audit
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
            <Bot className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Agent Authorization</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Ensures autonomous agents never drift into unauthorized categories (e.g. FoodBot buying electronics).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Behavioral Intelligence</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Flags volume anomalies (&gt;3x baseline), rapid burst loops (&gt;5 tx / 60s), and odd operating hours.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Compromise Defense</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Instantly flags hijacked or prompt-injected agents, triggers critical alerts, and enables one-click suspension.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-3">
            <Database className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Human Governance</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Full auditability with Why Inspector and human-in-the-loop approvals for unverified merchants.
          </p>
        </div>
      </div>
    </div>
  );
};
