import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ShieldX, 
  Eye, 
  Check, 
  Ban, 
  Bot, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { TransactionAttempt, Decision, TransactionStatus } from '../types';

export const LedgerPage: React.FC = () => {
  const { 
    transactions, 
    agents, 
    setInspectingTx, 
    approveTransaction, 
    rejectTransaction 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          tx.id.toLowerCase().includes(q) ||
          tx.agentName.toLowerCase().includes(q) ||
          tx.merchant.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          tx.explanation.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Agent
      if (agentFilter !== 'all' && tx.agentId !== agentFilter) return false;

      // Decision
      if (decisionFilter !== 'all' && tx.decision !== decisionFilter) return false;

      // Risk Level
      if (riskFilter === 'low' && tx.riskScore >= 40) return false;
      if (riskFilter === 'medium' && (tx.riskScore < 40 || tx.riskScore >= 80)) return false;
      if (riskFilter === 'high' && tx.riskScore < 80) return false;

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [transactions, searchQuery, agentFilter, decisionFilter, riskFilter, sortOrder]);

  const getDecisionBadge = (decision: Decision) => {
    switch (decision) {
      case 'ALLOW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>ALLOW</span>
          </span>
        );
      case 'APPROVAL_REQUIRED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 border border-amber-200 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>APPROVAL REQ</span>
          </span>
        );
      case 'BLOCK':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-50 border border-rose-200 text-rose-700">
            <ShieldX className="w-3 h-3 text-rose-600" />
            <span>BLOCK</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'EXECUTED':
        return <span className="text-[10px] font-mono font-bold text-emerald-600">EXECUTED</span>;
      case 'APPROVED':
        return <span className="text-[10px] font-mono font-bold text-teal-600">APPROVED (HUMAN)</span>;
      case 'PENDING_APPROVAL':
        return <span className="text-[10px] font-mono font-bold text-amber-600 animate-pulse">PENDING REVIEW</span>;
      case 'BLOCKED':
        return <span className="text-[10px] font-mono font-bold text-rose-600">BLOCKED (ENGINE)</span>;
      case 'BLOCKED_BY_REVIEWER':
        return <span className="text-[10px] font-mono font-bold text-red-600">DENIED (HUMAN)</span>;
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Immutable Decision Ledger & Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all autonomous transaction attempts, risk point calculations, and human interventions.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-slate-500 shrink-0">
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 font-semibold text-slate-700">
            {filteredTransactions.length} of {transactions.length} Records
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by merchant, agent, category, or Tx ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Agent */}
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          >
            <option value="all">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Decision */}
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          >
            <option value="all">All Decisions</option>
            <option value="ALLOW">ALLOW</option>
            <option value="APPROVAL_REQUIRED">APPROVAL REQUIRED</option>
            <option value="BLOCK">BLOCK</option>
          </select>

          {/* Risk Level */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk (0-39)</option>
            <option value="medium">Medium Risk (40-79)</option>
            <option value="high">High / Critical (80-100)</option>
          </select>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors"
            title="Toggle sort timestamp"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp (UTC)</th>
                <th className="py-3 px-4 font-semibold">Agent</th>
                <th className="py-3 px-4 font-semibold">Merchant & Category</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Risk Score</th>
                <th className="py-3 px-4 font-semibold">Decision</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredTransactions.map((tx) => {
                const agent = agents.find(a => a.id === tx.agentId);
                const isPending = tx.status === 'PENDING_APPROVAL';

                return (
                  <tr
                    key={tx.id}
                    onClick={() => setInspectingTx(tx)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      <div>{new Date(tx.timestamp).toISOString().slice(0, 10)}</div>
                      <div className="text-[10px] text-slate-400">{new Date(tx.timestamp).toISOString().slice(11, 19)}</div>
                    </td>

                    {/* Agent */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: agent?.avatarColor || '#4f46e5' }}
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-slate-900">{tx.agentName}</span>
                      </div>
                    </td>

                    {/* Merchant & Category */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 truncate max-w-[160px]">{tx.merchant}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{tx.category}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        tx.riskScore >= 80 ? 'text-rose-700 bg-rose-50 border-rose-200' :
                        tx.riskScore >= 40 ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}>
                        {tx.riskScore}
                      </span>
                    </td>

                    {/* Decision */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getDecisionBadge(tx.decision)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(tx.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => approveTransaction(tx.id)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center space-x-1 shadow-xs transition-colors"
                              title="Approve & Execute Payment"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => rejectTransaction(tx.id)}
                              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center space-x-1 shadow-xs transition-colors"
                              title="Deny & Block Transaction"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Block</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setInspectingTx(tx)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                            title="Inspect decision reasons"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
