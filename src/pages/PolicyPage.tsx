import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Save, 
  Bot, 
  CheckCircle2, 
  ShieldAlert, 
  Sliders, 
  Clock, 
  Lock, 
  Unlock, 
  Plus, 
  X,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { Policy, Agent } from '../types';

export const PolicyPage: React.FC = () => {
  const { 
    agents, 
    policies, 
    updatePolicy, 
    suspendAgent, 
    activateAgent 
  } = useStore();

  const [selectedAgentId, setSelectedAgentId] = useState<string>('foodbot');
  const [naturalLanguageInput, setNaturalLanguageInput] = useState<string>(
    'FoodBot can spend up to ₹5,000 per day on food and grocery purchases. Individual transactions above ₹2,000 require approval. New merchants require approval.'
  );
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Editable structured policy form state
  const currentPolicy = policies[selectedAgentId];
  const currentAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const [dailyLimit, setDailyLimit] = useState<number>(currentPolicy?.dailyLimit || 5000);
  const [perTxLimit, setPerTxLimit] = useState<number>(currentPolicy?.perTransactionLimit || 2000);
  const [newMerchantAction, setNewMerchantAction] = useState<'approval_required' | 'block'>(
    currentPolicy?.newMerchantAction || 'approval_required'
  );
  const [allowedCategories, setAllowedCategories] = useState<string[]>(
    currentPolicy?.allowedCategories || ['Food & Grocery']
  );
  const [newCatInput, setNewCatInput] = useState<string>('');

  // Synchronize when switching agent
  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    const pol = policies[agentId];
    if (pol) {
      setDailyLimit(pol.dailyLimit);
      setPerTxLimit(pol.perTransactionLimit);
      setNewMerchantAction(pol.newMerchantAction);
      setAllowedCategories(pol.allowedCategories);
      setNaturalLanguageInput(
        pol.naturalLanguagePrompt || 
        `${agentId === 'foodbot' ? 'FoodBot' : agentId === 'travelbot' ? 'TravelBot' : 'ProcurementBot'} spending policy up to ₹${pol.dailyLimit.toLocaleString('en-IN')} daily with ₹${pol.perTransactionLimit.toLocaleString('en-IN')} transaction cap.`
      );
    }
  };

  const handleParseWithAI = async () => {
    if (!naturalLanguageInput.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch('/api/policy/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naturalLanguagePolicy: naturalLanguageInput,
          currentAgentId: selectedAgentId,
        }),
      });

      const data = await res.json();
      if (data.dailyLimit) setDailyLimit(Number(data.dailyLimit));
      if (data.perTransactionLimit) setPerTxLimit(Number(data.perTransactionLimit));
      if (data.newMerchantAction) setNewMerchantAction(data.newMerchantAction);
      if (Array.isArray(data.allowedCategories)) setAllowedCategories(data.allowedCategories);

      setSaveSuccessMsg(`Parsed successfully from intent (${data.source || 'AI Compiler'}). Review and save below.`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (e) {
      console.error(e);
      setSaveSuccessMsg('Failed to parse policy via API. Using local fallbacks.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSavePolicy = () => {
    updatePolicy(selectedAgentId, {
      dailyLimit: Number(dailyLimit),
      perTransactionLimit: Number(perTxLimit),
      newMerchantAction,
      allowedCategories,
      naturalLanguagePrompt: naturalLanguageInput,
    });
    setSaveSuccessMsg(`Policy for ${currentAgent.name} saved! The deterministic rule engine is immediately enforcing these rules.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    if (!allowedCategories.includes(newCatInput.trim())) {
      setAllowedCategories(prev => [...prev, newCatInput.trim()]);
    }
    setNewCatInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setAllowedCategories(prev => prev.filter(c => c !== cat));
  };

  const isSuspended = currentAgent.status === 'suspended';

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Spending Policy Governance Compiler
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Express business constraints in plain English. The AI compiles intent into structured rules, enforced deterministically by the firewall.
          </p>
        </div>

        {/* Agent Selector Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => handleSelectAgent(a.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                selectedAgentId === a.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{a.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2.5 animate-fade-in shadow-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Grid: Natural Language on Left, Structured Cards on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Natural Language Policy Editor */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Natural Language Intent</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  AI COMPILER
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                State guidelines for {currentAgent.name} naturally. For example, specify daily limits, single transaction caps, and vendor rules.
              </p>

              <textarea
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                rows={6}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans shadow-2xs placeholder:text-slate-400"
                placeholder="e.g. FoodBot can spend up to ₹5,000 per day on food and grocery purchases..."
              />
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Compiles to structured JSON
              </span>
              <button
                onClick={handleParseWithAI}
                disabled={isParsing}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isParsing ? 'Compiling Intent...' : 'Parse with AI'}</span>
              </button>
            </div>
          </div>

          {/* Agent Governance State Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                <span>Agent Security Lock</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isSuspended ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isSuspended ? 'LOCKED / SUSPENDED' : 'OPERATIONAL / ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              If an agent behaves erratically or is compromised, you can freeze its spending authorization instantly.
            </p>

            <div className="mt-4">
              {isSuspended ? (
                <button
                  onClick={() => activateAgent(currentAgent.id)}
                  className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reactivate {currentAgent.name}</span>
                </button>
              ) : (
                <button
                  onClick={() => suspendAgent(currentAgent.id)}
                  className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Suspend {currentAgent.name}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Structured Rule Cards (Enforced Deterministically) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Structured Deterministic Rules</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    ENFORCED BY FIREWALL
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parameters evaluated mathematically during every transaction attempt
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              {/* Daily Budget & Per-Transaction Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Daily Spend Budget (INR ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">₹</span>
                    <input
                      type="number"
                      min="100"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Hard block if exceeded by today's allowed transactions
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Single Transaction Limit (INR ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">₹</span>
                    <input
                      type="number"
                      min="50"
                      value={perTxLimit}
                      onChange={(e) => setPerTxLimit(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Hard block if single payment exceeds this amount
                  </span>
                </div>
              </div>

              {/* New Merchant Behavior */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unverified / New Merchant Behavior
                </label>
                <select
                  value={newMerchantAction}
                  onChange={(e) => setNewMerchantAction(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs font-medium"
                >
                  <option value="approval_required">
                    Require Human Review (APPROVAL_REQUIRED)
                  </option>
                  <option value="block">
                    Strict Hard Block (BLOCK immediately)
                  </option>
                </select>
              </div>

              {/* Allowed Categories Tag Manager */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Authorized Spending Categories
                </label>
                <div className="flex flex-wrap gap-2 mb-2 p-3 rounded-xl bg-slate-50 border border-slate-200 min-h-[44px]">
                  {allowedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-indigo-400 hover:text-indigo-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {allowedCategories.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No categories defined (Will restrict all attempts)</span>
                  )}
                </div>

                {/* Add Category input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add category (e.g. Travel, Flights, SaaS Subscriptions)..."
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Verified Whitelist Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                <span className="text-slate-800 font-bold">Known Verified Suppliers: </span>
                <span className="text-slate-600">{currentAgent.knownMerchants.join(', ')}</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSavePolicy}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.01]"
              >
                <Save className="w-4 h-4" />
                <span>Save & Enforce Policy for {currentAgent.name}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
