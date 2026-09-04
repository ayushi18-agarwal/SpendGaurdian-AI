import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useStore } from '../store/StoreContext';

export const DecisionChart: React.FC = () => {
  const { metrics } = useStore();

  const data = [
    {
      name: 'ALLOW',
      count: metrics.allowedCount,
      color: '#10b981', // emerald-500
      desc: 'Executed Payments',
    },
    {
      name: 'APPROVAL REQUIRED',
      count: metrics.approvalRequiredCount,
      color: '#f59e0b', // amber-500
      desc: 'Human Review Needed',
    },
    {
      name: 'BLOCK',
      count: metrics.blockedCount,
      color: '#ef4444', // rose-500
      desc: 'Policy / Compromise Hard Block',
    },
  ];

  const total = metrics.totalAttempts || 1;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const pct = Math.round((item.count / total) * 100);
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
            <span className="font-bold text-slate-900">{item.name}</span>
          </div>
          <div className="mt-1.5 text-slate-700">
            <span className="text-slate-900 font-bold text-sm">{item.count}</span> attempts ({pct}%)
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Decision Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic firewall outcomes across all autonomous attempts
          </p>
        </div>
        <div className="text-xs font-mono text-slate-600 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-semibold">
          Total: {metrics.totalAttempts}
        </div>
      </div>

      <div className="h-44 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              width={140}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 mt-1">
        {data.map((d) => (
          <div key={d.name} className="flex flex-col bg-slate-50 border border-slate-100 rounded-lg p-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
              <span className="text-[11px] font-semibold text-slate-700 truncate">{d.name}</span>
            </div>
            <span className="text-xs font-mono text-slate-600 font-bold ml-3.5 mt-0.5">
              {d.count} ({Math.round((d.count / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
