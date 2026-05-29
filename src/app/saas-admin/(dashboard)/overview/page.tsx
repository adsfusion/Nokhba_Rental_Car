import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Users, CreditCard, TrendingUp, Activity } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function OverviewDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') redirect('/dashboard');

  // In the future, we will wire these to real aggregation queries
  const stats = [
    {
      title: "Total Tenants",
      value: "...",
      change: "...",
      icon: Users,
    },
    {
      title: "Active Subscriptions",
      value: "...",
      change: "...",
      icon: CreditCard,
    },
    {
      title: "Monthly Recurring Revenue (MRR)",
      value: "...",
      change: "...",
      icon: TrendingUp,
    },
    {
      title: "System Health",
      value: "100%",
      change: "All systems operational",
      icon: Activity,
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
        <p className="text-slate-500 mt-1 font-medium">High-level metrics and health status for the Nokhba SAAS.</p>
      </div>

      {/* Hero Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-500 font-bold text-sm">{stat.title}</span>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900">
                <stat.icon size={20} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-2">{stat.value}</div>
            <div className="text-sm font-medium text-slate-500">{stat.change}</div>
          </div>
        ))}
      </section>
      
      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Placeholder */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center w-full">
          <TrendingUp className="text-slate-300 mb-4" size={48} />
          <h3 className="font-bold text-lg text-slate-900 mb-1 w-full">Revenue Analytics</h3>
          <p className="text-slate-500 font-medium w-full">Chart integration pending database aggregation.</p>
        </div>
        
        {/* Analytics Sidebar Placeholder */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center w-full">
          <Activity className="text-slate-300 mb-4" size={48} />
          <h3 className="font-bold text-lg text-slate-900 mb-1 w-full">Recent Alerts</h3>
          <p className="text-slate-500 font-medium w-full">System event stream pending.</p>
        </div>
      </section>
    </div>
  );
}