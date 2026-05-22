import Link from 'next/link';
import { Car, Users, FileText, Bell } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentTenantId } from '@/lib/utils/tenant';
import { formatCurrency } from '@/lib/utils/format';

export default async function DashboardPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    return <div>Tenant context required</div>;
  }

  // 1. Active Contracts
  const { count: activeContracts } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled')
    .neq('status', 'completed');

  // 2. Available Cars
  const { count: availableCars } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'available');

  // 3. Total Cars
  const { count: totalCars } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  // 4. Revenue MTD
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: monthContracts } = await supabase
    .from('contracts')
    .select('total_amount')
    .eq('tenant_id', tenantId)
    .gte('start_date', startOfMonth);

  const revenue = monthContracts?.reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0) || 0;

  // 5. Recent Activity
  const { data: latestContracts } = await supabase
    .from('contracts')
    .select('id, created_at, clients(first_name, last_name), vehicles(brand, model)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(4);

  const recentActivity = latestContracts?.map(c => ({
    user: c.clients ? `${(c.clients as any).first_name} ${(c.clients as any).last_name}` : 'Unknown Client',
    action: 'signed contract',
    target: c.vehicles ? `${(c.vehicles as any).brand} ${(c.vehicles as any).model}` : 'Unknown Vehicle',
    time: new Date(c.created_at).toLocaleDateString(),
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  })) || [];

  const stats = [
    { label: 'Active Contracts', value: activeContracts?.toString() || '0', trend: 'Current', color: 'text-blue-600' },
    { label: 'Available Cars', value: availableCars?.toString() || '0', trend: `${totalCars || 0} total`, color: 'text-green-600' },
    { label: 'Upcoming Returns', value: '0', trend: 'Today', color: 'text-amber-600' },
    { label: 'Revenue (MTD)', value: formatCurrency(revenue), trend: 'This Month', color: 'text-slate-900' },
  ];

  const inUse = totalCars ? totalCars - (availableCars || 0) : 0;
  const fleetStatus = [
    { label: 'In Use', value: totalCars ? Math.round((inUse / totalCars) * 100) : 0, color: 'bg-blue-500' },
    { label: 'Maintenance', value: 0, color: 'bg-amber-500' },
    { label: 'Available', value: totalCars ? Math.round(((availableCars || 0) / totalCars) * 100) : 0, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 text-sm">
            Welcome back, here&apos;s what&apos;s happening with your fleet today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            Export Reports
          </button>
          <Link
            href={`/${tenantSlug}/fleet`}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
          >
            <Car size={16} />
            Add Vehicle
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className={`text-3xl font-bold tracking-tight ${stat.color}`}>{stat.value}</h3>
              <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest border border-slate-200 rounded-2xl shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Activity</h3>
            <button className="text-sm font-semibold text-slate-500 hover:text-slate-900">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivity.map((activity, i) => (
              <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.bg} ${activity.color}`}>
                  <activity.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-slate-900">{activity.user}</span>{' '}
                    {activity.action}{' '}
                    <span className="font-semibold text-slate-800">{activity.target}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest border border-slate-200 rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Fleet Status</h3>
            <div className="space-y-4">
              {fleetStatus.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-slate-900/20">
            <h3 className="font-bold mb-2">Upgrade to Pro</h3>
            <p className="text-slate-400 text-xs mb-4">
              Unlock premium features like multi-user access and advanced analytics.
            </p>
            <button className="w-full bg-white text-slate-900 font-bold py-2 rounded-xl text-sm hover:bg-slate-100 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
