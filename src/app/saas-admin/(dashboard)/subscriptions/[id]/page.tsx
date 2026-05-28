import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') redirect('/dashboard');

  const { data: plan, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !plan) {
    redirect('/saas-admin/subscriptions');
  }

  return (
    <div className="p-8 max-w-[800px] mx-auto w-full">
      <Link href="/saas-admin/subscriptions" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-8 transition-colors">
        <ArrowLeft size={20} />
        Back to Subscriptions
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{plan.name} Plan</h1>
        <p className="text-slate-500 mt-1 font-medium font-mono text-sm">ID: {plan.id}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Plan Configuration</h3>
        
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Price</p>
            <p className="font-mono font-bold text-lg text-slate-900">{plan.price} {plan.currency}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Billing Period</p>
            <p className="text-sm font-medium text-slate-900 capitalize">{plan.billing_period}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Max Vehicles</p>
            <p className="font-bold text-slate-900">{plan.max_vehicles}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
              plan.is_active
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {plan.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <button disabled className="bg-slate-100 text-slate-400 px-6 py-3 rounded-xl font-bold cursor-not-allowed">
            Edit Form Not Implemented Yet
          </button>
        </div>
      </div>
    </div>
  );
}
