import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, CreditCard, MessageSquare, User } from 'lucide-react';
import { PaymentReviewActions } from '@/components/saas/PaymentReviewActions';

export const dynamic = 'force-dynamic';

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'super_admin') redirect('/dashboard');

  const { data: proof } = await supabase
    .from('payment_proofs')
    .select(`
      *,
      tenants(id, name, slug, subscription_status, subscription_end_date),
      subscription_plans(name, price, currency, billing_period, duration_days),
      platform_payment_methods(label, type)
    `)
    .eq('id', id)
    .single();

  if (!proof) notFound();

  const tenant = proof.tenants as any;
  const plan   = proof.subscription_plans as any;
  const method = proof.platform_payment_methods as any;

  const isPending = proof.status === 'pending';

  let displayUrl = proof.proof_image_url;
  if (displayUrl) {
    let filePath = displayUrl;
    if (filePath.includes('/object/public/payment-proofs/')) {
      filePath = filePath.split('/object/public/payment-proofs/')[1];
    }
    const { data: signed } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(filePath, 3600);
      
    if (signed?.signedUrl) {
      displayUrl = signed.signedUrl;
    }
  }

  return (
    <div className="p-8 max-w-[960px] mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <Link href="/saas-admin/subscriptions/payments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Queue
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Proof</h1>
            <p className="text-slate-500 mt-1 font-medium font-mono text-sm">{proof.id}</p>
          </div>
          <span className={`shrink-0 text-sm font-bold px-4 py-2 rounded-full capitalize
            ${proof.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
              proof.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'}`}>
            {proof.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Proof Image */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-900">Payment Proof Image</h2>
          </div>
          <div className="p-6">
            <a href={displayUrl} target="_blank" rel="noopener noreferrer"
              className="block w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt="Payment proof"
                className="w-full h-full object-contain"
              />
            </a>
            <p className="text-xs text-slate-400 text-center mt-3 font-medium">Click image to open full size</p>
          </div>
        </div>

        {/* Right: Details + Actions */}
        <div className="space-y-4">
          {/* Tenant Info */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Building2 size={16} className="text-slate-500" />
              <h2 className="font-bold text-slate-900">Tenant</h2>
            </div>
            <div className="p-6 space-y-3">
              <DetailRow label="Agency" value={tenant?.name} />
              <DetailRow label="Slug" value={tenant?.slug} mono />
              <DetailRow label="Current Status" value={tenant?.subscription_status} badge />
              <DetailRow label="Subscription Ends"
                value={tenant?.subscription_end_date
                  ? new Date(tenant.subscription_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'} />
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <CreditCard size={16} className="text-slate-500" />
              <h2 className="font-bold text-slate-900">Payment Details</h2>
            </div>
            <div className="p-6 space-y-3">
              <DetailRow label="Plan" value={plan?.name} />
              <DetailRow label="Amount" value={`${proof.amount_paid} ${proof.currency}`} highlight />
              <DetailRow label="Via" value={method?.label || '—'} />
              <DetailRow label="Submitted" value={new Date(proof.created_at).toLocaleString('en-GB')} />
              {proof.notes && <DetailRow label="Tenant Note" value={proof.notes} />}
            </div>
          </div>

          {/* Rejection reason (if rejected) */}
          {proof.status === 'rejected' && proof.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
              <MessageSquare size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">Rejection Reason</p>
                <p className="text-sm text-red-700 mt-1">{proof.rejection_reason}</p>
              </div>
            </div>
          )}

          {/* Approve / Reject Actions (only for pending) */}
          {isPending && (
            <PaymentReviewActions proofId={proof.id} tenantName={tenant?.name} planName={plan?.name} />
          )}

          {/* Reviewed by */}
          {proof.reviewed_by && (
            <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
              <User size={14} />
              Reviewed {proof.reviewed_at ? new Date(proof.reviewed_at).toLocaleString('en-GB') : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, badge, highlight }: {
  label: string; value?: string | null; mono?: boolean; badge?: boolean; highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0 pt-0.5">{label}</span>
      {badge ? (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize
          ${value === 'active' ? 'bg-emerald-100 text-emerald-700' :
            value === 'rejected' ? 'bg-red-100 text-red-700' :
            value === 'pending' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-600'}`}>
          {value || '—'}
        </span>
      ) : (
        <span className={`text-sm text-right break-all
          ${mono ? 'font-mono text-slate-500' : ''}
          ${highlight ? 'font-black text-slate-900 text-base' : 'font-semibold text-slate-800'}
        `}>
          {value || '—'}
        </span>
      )}
    </div>
  );
}
