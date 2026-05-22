import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SubscriptionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/saas-admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') redirect('/dashboard');

  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error("🔥 Error fetching subscription plans:", error);
  }

  return (
    <div className="p-8 max-w-[1440px] mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subscription Plans</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage pricing tiers and vehicle limits for tenants.</p>
        </div>
        <Link 
          href="/saas-admin/subscriptions/new" 
          className="bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Create New Plan
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Plan Name</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Billing Period</th>
              <th className="px-6 py-4">Max Vehicles</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {plans?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No subscription plans found. Create one to get started.
                </td>
              </tr>
            ) : (
              plans?.map((plan: any) => (
                <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900">{plan.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-bold">
                    {plan.price} {plan.currency}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium capitalize">
                    {plan.billing_period}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                    {plan.max_vehicles}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                      plan.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
