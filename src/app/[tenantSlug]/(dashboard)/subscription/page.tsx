import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CheckCircle2, Zap, Clock, XCircle } from 'lucide-react';
import { PaymentProofForm } from '@/components/saas/PaymentProofForm';

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, subscription_status, subscription_end_date, subscription_plan_id, subscription_plans(name)')
    .eq('slug', tenantSlug)
    .single();

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .neq('billing_period', 'trial')
    .order('price', { ascending: true });

  const { data: paymentMethods } = await supabase
    .from('platform_payment_methods')
    .select('*')
    .eq('is_active', true);

  // Existing proofs for this tenant
  const { data: myProofs } = await supabase
    .from('payment_proofs')
    .select('id, status, amount_paid, currency, created_at, rejection_reason, subscription_plans(name)')
    .eq('tenant_id', tenant?.id || '')
    .order('created_at', { ascending: false })
    .limit(5);

  const status = tenant?.subscription_status || 'trialing';
  const endDate = tenant?.subscription_end_date ? new Date(tenant.subscription_end_date) : null;

  const currentPlanName = Array.isArray(tenant?.subscription_plans)
    ? tenant?.subscription_plans[0]?.name
    : (tenant?.subscription_plans as any)?.name;

  let remainingText = '';
  if (status === 'trialing' && endDate) {
    const diffMs = endDate.getTime() - Date.now();
    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      remainingText = `${hours}h remaining`;
    }
  }

  const hasPendingProof = myProofs?.some(p => p.status === 'pending');

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24">

      {/* ── STATUS BANNER ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10 w-full">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Current Subscription Status</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className={`inline-flex items-center gap-2.5 text-2xl font-black capitalize px-5 py-2.5 rounded-2xl
              ${status === 'active'   ? 'bg-emerald-500/20 text-emerald-400' : ''}
              ${status === 'trialing' ? 'bg-amber-500/20 text-amber-400' : ''}
              ${status === 'pending'  ? 'bg-blue-500/20 text-blue-400' : ''}
              ${status === 'expired'  ? 'bg-red-500/20 text-red-400' : ''}
              ${status === 'rejected' ? 'bg-rose-500/20 text-rose-400' : ''}
            `}>
              {status === 'active'   && <CheckCircle2 size={22} />}
              {status === 'trialing' && <Zap size={22} />}
              {status === 'pending'  && <Clock size={22} />}
              {status === 'expired'  && <XCircle size={22} />}
              {status === 'rejected' && <XCircle size={22} />}
              {status}
              {remainingText && <span className="text-amber-400 text-base font-semibold">· {remainingText}</span>}
            </span>
            {currentPlanName && (
              <span className="text-slate-400 font-medium text-sm">
                Plan: <span className="text-white font-bold">{currentPlanName}</span>
              </span>
            )}
            {endDate && (
              <span className="text-slate-400 font-medium text-sm">
                Valid until: <span className="text-white font-bold">{endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </span>
            )}
          </div>
          {status === 'pending' && (
            <p className="mt-4 text-sm text-blue-300 font-medium bg-blue-500/10 px-4 py-2.5 rounded-xl inline-block">
              ⏳ Your payment proof is under review. You will be notified once it's approved.
            </p>
          )}
          {status === 'rejected' && (
            <p className="mt-4 text-sm text-rose-300 font-medium bg-rose-500/10 px-4 py-2.5 rounded-xl inline-block">
              ❌ Your payment was rejected. Please resubmit a corrected proof below.
            </p>
          )}
        </div>
      </div>

      {/* ── AVAILABLE PLANS ───────────────────────────────────────────────── */}
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Available Plans</h3>
        {!plans?.length ? (
          <p className="text-slate-500 font-medium">No plans available. Please contact support.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const isCurrent = currentPlanName === plan.name;
              return (
                <div key={plan.id} className={`bg-white rounded-3xl p-6 flex flex-col border-2 transition-all
                  ${isCurrent ? 'border-amber-400 shadow-xl shadow-amber-500/10' : 'border-slate-200 shadow-sm'}`}>
                  {isCurrent && (
                    <span className="self-start bg-amber-400 text-amber-950 text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                      Current
                    </span>
                  )}
                  <h4 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h4>
                  <div className="text-3xl font-black text-slate-900 mb-1">
                    {plan.price} <span className="text-base font-semibold text-slate-500">{plan.currency}</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-6 capitalize">
                    {plan.billing_period} · {plan.duration_days} days · {plan.max_vehicles} vehicles
                  </p>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Up to {plan.max_vehicles} Vehicles
                    </li>
                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Full Dashboard Access
                    </li>
                    <li className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> {plan.duration_days}-Day Access Period
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PAYMENT PROOF UPLOAD ──────────────────────────────────────────── */}
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Submit Payment Proof</h3>
        <p className="text-slate-500 font-medium mb-6">
          Transfer to one of our accounts below and upload your receipt. Your access will be activated within 24 hours of approval.
        </p>

        {hasPendingProof ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
            <Clock size={40} className="text-blue-400 mx-auto mb-4" />
            <h4 className="font-black text-blue-900 text-xl mb-2">Proof Under Review</h4>
            <p className="text-blue-700 font-medium">Your payment proof has been submitted and is being reviewed by our team. We'll notify you once it's processed.</p>
          </div>
        ) : (
          <PaymentProofForm
            tenantSlug={tenantSlug}
            plans={plans?.filter(p => p.billing_period !== 'trial') || []}
            paymentMethods={paymentMethods || []}
            currentPlanId={tenant?.subscription_plan_id || null}
          />
        )}
      </div>

      {/* ── MY PREVIOUS SUBMISSIONS ───────────────────────────────────────── */}
      {myProofs && myProofs.length > 0 && (
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">My Submissions</h3>
          <div className="space-y-3">
            {myProofs.map(proof => {
              const planName = Array.isArray(proof.subscription_plans)
                ? proof.subscription_plans[0]?.name
                : (proof.subscription_plans as any)?.name;
              return (
                <div key={proof.id} className="bg-white border border-slate-200 rounded-2xl px-6 py-5 flex items-center gap-4 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">{planName || 'Unknown Plan'}</p>
                      <span className="text-slate-300">·</span>
                      <p className="text-sm text-slate-500">{proof.amount_paid} {proof.currency}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      {new Date(proof.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {proof.rejection_reason && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">Reason: {proof.rejection_reason}</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full capitalize
                    ${proof.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      proof.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'}`}>
                    {proof.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
