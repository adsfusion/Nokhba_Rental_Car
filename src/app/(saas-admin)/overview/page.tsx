const STATS = [
  { label: 'Total Tenants', value: '142', trend: '+5 this month', color: 'text-indigo-600' },
  { label: 'Active Users', value: '1,204', trend: '+12%', color: 'text-emerald-600' },
  { label: 'MRR', value: '$84,500', trend: '+8.4%', color: 'text-slate-900' },
  { label: 'System Uptime', value: '99.99%', trend: 'Healthy', color: 'text-teal-600' },
];

export default function SaasOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
        <p className="text-slate-500 text-sm">Super Admin Dashboard for Nokhba Rental SaaS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              {stat.label}
            </p>
            <div className="flex items-end justify-between">
              <h3 className={`text-3xl font-bold tracking-tight ${stat.color}`}>{stat.value}</h3>
              <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
