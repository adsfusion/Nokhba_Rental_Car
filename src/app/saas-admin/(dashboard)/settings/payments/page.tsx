import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Building2, Wallet, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { togglePaymentMethod, deletePaymentMethod } from '@/lib/actions/platformSettings';
import { AddPaymentMethodForm } from '@/components/saas/AddPaymentMethodForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payment Settings — SaaS Admin' };

export default async function PaymentSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'super_admin') redirect('/dashboard');

  const { data: methods } = await supabase
    .from('platform_payment_methods')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 max-w-[960px] mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <Link href="/saas-admin/settings" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Settings
        </Link>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Methods</h1>
        <p className="text-slate-500 mt-1 font-medium">Configure bank accounts and crypto wallets where tenants should send payments.</p>
      </div>

      {/* Existing Methods */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Methods</h2>
        {!methods?.length && (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 font-medium">
            No payment methods configured yet.
          </div>
        )}
        {methods?.map((m) => (
          <div key={m.id} className="bg-white border border-slate-200 rounded-2xl px-6 py-5 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${m.type === 'bank' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'}`}>
              {m.type === 'bank' ? <Building2 size={22} /> : <Wallet size={22} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900">{m.label}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                {m.type === 'bank'
                  ? `${m.details?.bank_name || ''} · IBAN: ${m.details?.iban || '—'}`
                  : `${m.details?.currency || ''} · ${m.details?.network || ''} · ${m.details?.wallet_address?.slice(0, 16)}…`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {m.is_active ? 'Active' : 'Inactive'}
              </span>
              <form action={async () => { 'use server'; await togglePaymentMethod(m.id, !m.is_active); }}>
                <button type="submit" className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                  {m.is_active ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
                </button>
              </form>
              <form action={async () => { 'use server'; await deletePaymentMethod(m.id); }}>
                <button type="submit" className="p-2 rounded-lg hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Method Form */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Plus size={14} /> Add New Method
        </h2>
        <AddPaymentMethodForm />
      </div>
    </div>
  );
}
