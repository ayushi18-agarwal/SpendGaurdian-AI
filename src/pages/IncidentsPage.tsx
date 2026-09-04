import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  ExternalLink, 
  Sparkles, 
  AlertTriangle, 
  X, 
  Filter,
  Search,
  FileText
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { IncidentReport, SecurityState } from '../types';
import { AdaptiveStateBadge } from '../components/AdaptiveStateBadge';
import { AgentTrustBadge } from '../components/AgentTrustBadge';

export const IncidentsPage: React.FC = () => {
  const { incidents, selectedIncident, setSelectedIncident, agents, trustScores, adaptiveStates } = useStore();
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredIncidents = incidents.filter(inc => {
    if (filterAgent !== 'all' && inc.agentId !== filterAgent) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        inc.id.toLowerCase().includes(term) ||
        inc.agentName.toLowerCase().includes(term) ||
        inc.merchant.toLowerCase().includes(term) ||
        inc.category.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalProtected = incidents.reduce((sum, inc) => sum + (inc.amountProtected || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Security Incident Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {incidents.length} LOGGED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enterprise threat intelligence, telemetry audits, and deterministic intervention records
          </p>
        </div>

        {/* Amount Protected metric card */}
        <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Direct Corporate Capital Preserved
            </span>
            <span className="text-base font-extrabold font-mono text-emerald-700">
              ₹{totalProtected.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, agent, merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
          >
            <option value="all">All Agents</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono self-end sm:self-center">
          Showing {filteredIncidents.length} of {incidents.length} incidents
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Incidents Matching Criteria</h4>
            <p className="text-xs text-slate-500">Zero active threat incidents recorded under this view.</p>
          </div>
        ) : (
          filteredIncidents.map(inc => (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    {inc.id}
                  </span>
                  <span className="font-bold text-sm text-slate-900">
                    {inc.agentName}
                  </span>
                  <span className="text-slate-400 font-mono text-xs">•</span>
                  <span className="text-xs text-slate-600">
                    {inc.merchant} ({inc.category})
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(inc.timestamp).toLocaleString()}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Risk {inc.riskScore}/100
                  </span>
                </div>
              </div>

              {/* Core Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Attempted Amount</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{inc.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Capital Shielded</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ₹{inc.amountProtected.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Security State Enforced</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {inc.securityState}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Intervention</span>
                  <span className="font-semibold text-rose-700">
                    {inc.decision}
                  </span>
                </div>
              </div>

              {/* Executive Gemini Summary */}
              {inc.geminiSummary && (
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[10px] uppercase font-mono tracking-wider text-indigo-700 block">
                      AI Executive Briefing
                    </span>
                    <p className="leading-relaxed">{inc.geminiSummary}</p>
                  </div>
                </div>
              )}

              {/* Footer Signals */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {inc.triggeredSignals.slice(0, 3).map((sig, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]"
                    >
                      {sig}
                    </span>
                  ))}
                  {inc.triggeredSignals.length > 3 && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      +{inc.triggeredSignals.length - 3} more signals
                    </span>
                  )}
                </div>

                <span className="text-indigo-600 font-semibold text-xs flex items-center space-x-1">
                  <span>View Full Forensic Audit</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Incident Audit Report: {selectedIncident.id}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      HIGH RISK
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    Deterministic security telemetry & forensic verification
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Executive Briefing Banner */}
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1.5">
                <div className="flex items-center space-x-2 text-indigo-700 text-xs font-mono font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>EXECUTIVE BRIEFING (CFO & COMPLIANCE SUMMARY)</span>
                </div>
                <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed font-medium">
                  {selectedIncident.geminiSummary || (
                    `Incident ${selectedIncident.id}: ${selectedIncident.agentName} attempted an unauthorized transaction of ₹${selectedIncident.amount.toLocaleString('en-IN')} at ${selectedIncident.merchant} (Risk Score: ${selectedIncident.riskScore}/100, Trust: ${selectedIncident.trustScore}). SpendGuardian intervened with ${selectedIncident.decision}, placing the agent in ${selectedIncident.securityState} state and protecting ₹${selectedIncident.amountProtected.toLocaleString('en-IN')} in corporate funds.`
                  )}
                </p>
              </div>

              {/* Core Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Autonomous Agent</span>
                  <span className="font-bold text-slate-900">{selectedIncident.agentName} ({selectedIncident.agentId})</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Target Merchant</span>
                  <span className="font-bold text-slate-900">{selectedIncident.merchant}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Category</span>
                  <span className="font-bold text-slate-900">{selectedIncident.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Attempted Amount</span>
                  <span className="font-mono font-bold text-slate-900">₹{selectedIncident.amount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Funds Protected</span>
                  <span className="font-mono font-bold text-emerald-600">₹{selectedIncident.amountProtected.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Deterministic Decision</span>
                  <span className="font-bold text-rose-600">{selectedIncident.decision}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Risk Score</span>
                  <span className="font-mono font-bold text-rose-600">{selectedIncident.riskScore} / 100</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Trust Score</span>
                  <span className="font-mono font-bold text-slate-700">{selectedIncident.trustScore} / 100</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Adaptive State</span>
                  <span className="font-mono font-bold text-amber-700">{selectedIncident.securityState}</span>
                </div>
              </div>

              {/* Triggered Signals */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Deterministic Trigger Signals
                </h4>
                <div className="space-y-1.5">
                  {selectedIncident.triggeredSignals.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 text-xs text-rose-900 flex items-center space-x-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adaptive Enforcement Action */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700 uppercase text-[11px]">
                  Automated Adaptive Enforcement:
                </span>
                <p className="text-slate-800">{selectedIncident.adaptiveResponse}</p>
                <p className="text-slate-500 text-[11px] font-mono">Action: {selectedIncident.actionTaken}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
