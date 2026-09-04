import React from 'react';
import { ArrowUpRight, CheckCircle, Clock, ShieldX, ShieldCheck, Zap } from 'lucide-react';
import { useStore } from '../store/StoreContext';

export const MetricsCards: React.FC = () => {
  const { metrics } = useStore();

  const formatRupees = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Transaction Attempts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold text-slate-600">Total Attempts</span>
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
            {metrics.totalAttempts.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Presented to firewall</div>
        </div>
      </div>

      {/* 2. Executed Payments */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold text-emerald-700">Executed Payments</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600">
            {metrics.executedPayments.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Vol: {formatRupees(metrics.totalExecutedAmount)}
          </div>
        </div>
      </div>

      {/* 3. Allowed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold text-slate-600">Allowed</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
            {metrics.allowedCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-mono font-medium mt-0.5">
            {metrics.totalAttempts > 0 ? Math.round((metrics.allowedCount / metrics.totalAttempts) * 100) : 0}% of attempts
          </div>
        </div>
      </div>

      {/* 4. Approval Required */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold text-amber-700">Approval Required</span>
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-amber-600">
            {metrics.approvalRequiredCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 font-mono font-medium mt-0.5">
            Pending review
          </div>
        </div>
      </div>

      {/* 5. Blocked */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-semibold text-rose-700">Blocked</span>
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
            <ShieldX className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-rose-600">
            {metrics.blockedCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-700 font-mono font-medium mt-0.5">
            Policy / Anomaly
          </div>
        </div>
      </div>

      {/* 6. Amount Protected */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm text-white">
        <div className="flex items-center justify-between text-indigo-100">
          <span className="text-xs font-semibold text-indigo-100">Amount Protected</span>
          <div className="p-1.5 rounded-lg bg-white/10 text-white">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {formatRupees(metrics.amountProtected)}
          </div>
          <div className="text-[11px] text-indigo-200 font-mono mt-0.5">
            Saved from rogue tx
          </div>
        </div>
      </div>
    </div>
  );
};
