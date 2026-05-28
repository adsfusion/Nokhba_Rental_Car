import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createTenant } from "@/lib/actions/tenants";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function NewTenantPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

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
    console.error("🔥 Error fetching plans:", error);
  }

  return (
    <div className="p-8 max-w-[800px] mx-auto w-full">
      <Link href="/saas-admin/tenants" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-8 transition-colors">
        <ArrowLeft size={20} />
        Back to Tenants
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Add New Tenant</h1>
        <p className="text-slate-500 mt-1 font-medium">Create a new agency workspace and assign a subscription plan.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <form action={createTenant} className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-bold text-slate-700">Agency Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              placeholder="e.g. Nokhba Premium"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="slug" className="text-sm font-bold text-slate-700">URL Slug</label>
            <div className="flex items-center">
              <span className="px-4 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-medium text-sm">
                app.nokhba.com/
              </span>
              <input 
                type="text" 
                id="slug" 
                name="slug" 
                required 
                placeholder="nokhba-premium"
                className="w-full px-4 py-3 rounded-r-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">This will be the unique identifier for the agency's dashboard URL.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="subscription_plan_id" className="text-sm font-bold text-slate-700">Subscription Plan</label>
            <select 
              id="subscription_plan_id" 
              name="subscription_plan_id" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900"
            >
              <option value="">Select a plan...</option>
              {plans?.map((plan: any) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.price} {plan.currency} ({plan.billing_period})
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-2 flex justify-end">
            <button 
              type="submit" 
              className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Create Agency
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
