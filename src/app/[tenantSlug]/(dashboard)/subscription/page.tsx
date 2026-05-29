import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CheckCircle2, Zap, CreditCard, ArrowUpRight } from 'lucide-react';

export default async function SubscriptionPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;
  const supabase = await createSupabaseServerClient();
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('subscription_status, subscription_end_date, subscription_plans(name)')
    .eq('slug', tenantSlug)
    .single();

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  const status = tenant?.subscription_status || 'trialing';
  const endDate = tenant?.subscription_end_date ? new Date(tenant.subscription_end_date) : null;
  
  const currentPlanName = Array.isArray(tenant?.subscription_plans) 
    ? tenant.subscription_plans[0]?.name 
    : (tenant?.subscription_plans as any)?.name;
  
  let remainingText = '';
  if (status === 'trialing' && endDate) {
    const diffMs = endDate.getTime() - Date.now();
    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      remainingText = `(${hours}h remaining)`;
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24">
      {/* SECTION 1: Status Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Current Status</h2>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-black capitalize flex items-center gap-3">
              {status === 'active' && <CheckCircle2 className="text-emerald-400" />}
              {status === 'trialing' && <Zap className="text-amber-400" />}
              {status} {remainingText && <span className="text-amber-400 text-xl">{remainingText}</span>}
            </span>
          </div>
          {endDate && (
            <p className="mt-2 text-slate-400 font-medium">
              Valid until: {endDate.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* SECTION 2: Package Picker */}
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Available Plans</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <div key={plan.id} className={`bg-white border-2 rounded-3xl p-6 flex flex-col ${currentPlanName === plan.name ? 'border-amber-500 shadow-xl shadow-amber-500/10' : 'border-slate-200 shadow-sm'}`}>
              <h4 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h4>
              <div className="text-3xl font-black text-slate-900 mb-6">
                {plan.price} {plan.currency} <span className="text-sm text-slate-500 font-medium">/{plan.billing_period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-600 font-medium">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  Up to {plan.max_vehicles} Vehicles
                </li>
                <li className="flex items-center gap-3 text-slate-600 font-medium">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  Full Dashboard Access
                </li>
              </ul>
              <button disabled={status === 'pending'} className={`w-full py-3 rounded-xl font-bold transition-all ${currentPlanName === plan.name ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                {currentPlanName === plan.name ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Payment Upload UI */}
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Payment Proof Upload</h3>
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <p className="text-slate-500 mb-6 font-medium">Upload a picture of your bank transfer receipt. Acceptable formats: JPG, PNG.</p>
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="text-slate-400" size={32} />
            </div>
            <p className="font-bold text-slate-900 mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-slate-500">Image file up to 5MB</p>
            <button disabled className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold opacity-50 cursor-not-allowed flex items-center gap-2 mx-auto">
              Upload Proof <ArrowUpRight size={18} />
            </button>
            <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Coming in Phase 3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
