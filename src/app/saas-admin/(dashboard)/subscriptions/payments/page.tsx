import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, XCircle, FileImage, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payment Reviews — SaaS Admin' };

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  icon: Clock,          cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', icon: CheckCircle2,   cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', icon: XCircle,        cls: 'bg-red-100 text-red-700' },
} as const;

export default async function PaymentsQueuePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'super_admin') redirect('/dashboard');

  const { data: proofs } = await supabase
    .from('payment_proofs')
    .select(`
      id, status, amount_paid, currency, created_at, notes,
      tenants(name, slug),
      subscription_plans(name)
    `)
    .order('created_at', { ascending: false });

  const pending  = proofs?.filter(p => p.status === 'pending')  || [];
  const reviewed = proofs?.filter(p => p.status !== 'pending')  || [];

  return (
    <div className="p-8 max-w-[960px] mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <Link href="/saas-admin/subscriptions" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Subscriptions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Review Queue</h1>
            <p className="text-slate-500 mt-1 font-medium">Review and approve or reject tenant payment proofs.</p>
          </div>
          {pending.length > 0 && (
            <span className="bg-amber-500 text-white text-sm font-black px-4 py-2 rounded-full">
              {pending.length} Pending
            </span>
          )}
        </div>
      </div>

      {/* Pending Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Awaiting Review</h2>
        {!pending.length && (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 font-medium">
            No pending proofs. All clear! ✓
          </div>
        )}
        {pending.map(proof => <ProofRow key={proof.id} proof={proof} />)}
      </section>

      {/* Reviewed Section */}
      {reviewed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Reviewed</h2>
          {reviewed.map(proof => <ProofRow key={proof.id} proof={proof} />)}
        </section>
      )}
    </div>
  );
}

function ProofRow({ proof }: { proof: any }) {
  const status = proof.status as keyof typeof STATUS_CONFIG;
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon   = cfg.icon;

  return (
    <Link href={`/saas-admin/subscriptions/payments/${proof.id}`}
      className="bg-white border border-slate-200 rounded-2xl px-6 py-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group">
      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
        <FileImage size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-900 truncate">
            {(proof.tenants as any)?.name || 'Unknown Tenant'}
          </p>
          <span className="text-slate-300">·</span>
          <p className="text-sm text-slate-500 font-medium truncate">
            {(proof.subscription_plans as any)?.name || 'Unknown Plan'}
          </p>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-1">
          {proof.amount_paid} {proof.currency} · Submitted {new Date(proof.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${cfg.cls}`}>
          <Icon size={13} /> {cfg.label}
        </span>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  );
}
