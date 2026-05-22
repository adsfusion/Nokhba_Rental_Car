import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSubscriptionPlan } from "@/lib/actions/subscriptions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function NewSubscriptionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/saas-admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') redirect('/dashboard');

  return (
    <div className="p-8 max-w-[800px] mx-auto w-full">
      <Link href="/saas-admin/subscriptions" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-8 transition-colors">
        <ArrowLeft size={20} />
        Back to Subscriptions
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Subscription Plan</h1>
        <p className="text-slate-500 mt-1 font-medium">Define a new pricing tier and limits for the platform.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <form action={createSubscriptionPlan} className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-bold text-slate-700">Plan Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              placeholder="e.g. Starter, Premium, Enterprise"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="price" className="text-sm font-bold text-slate-700">Price</label>
              <input 
                type="number" 
                id="price" 
                name="price" 
                step="0.01"
                required 
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="currency" className="text-sm font-bold text-slate-700">Currency</label>
              <select 
                id="currency" 
                name="currency" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="MAD">MAD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="billing_period" className="text-sm font-bold text-slate-700">Billing Period</label>
              <select 
                id="billing_period" 
                name="billing_period" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="max_vehicles" className="text-sm font-bold text-slate-700">Max Vehicles</label>
              <input 
                type="number" 
                id="max_vehicles" 
                name="max_vehicles" 
                required 
                placeholder="e.g. 50"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-2 flex justify-end">
            <button 
              type="submit" 
              className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Create Plan
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
