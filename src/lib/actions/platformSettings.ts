'use server';

import { createSupabaseServerClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ── Helper: assert super_admin ───────────────────────────────────────────────
async function assertSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', supabase, user: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') return { error: 'Forbidden', supabase, user: null };
  return { error: null, supabase, user };
}

// ── createPaymentMethod ──────────────────────────────────────────────────────
export async function createPaymentMethod(formData: FormData) {
  const { error, supabase } = await assertSuperAdmin();
  if (error) return { error };

  const type = formData.get('type') as string;
  const label = formData.get('label') as string;

  if (!type || !label) return { error: 'Type and label are required.' };

  // Build details object depending on type
  let details: Record<string, string> = {};
  if (type === 'bank') {
    details = {
      bank_name:      formData.get('bank_name') as string || '',
      account_name:   formData.get('account_name') as string || '',
      account_number: formData.get('account_number') as string || '',
      iban:           formData.get('iban') as string || '',
      swift:          formData.get('swift') as string || '',
      branch:         formData.get('branch') as string || '',
    };
  } else if (type === 'crypto') {
    details = {
      currency:       formData.get('currency') as string || '',
      network:        formData.get('network') as string || '',
      wallet_address: formData.get('wallet_address') as string || '',
    };
  }

  const { error: dbError } = await supabase
    .from('platform_payment_methods')
    .insert({ type, label, details, is_active: true });

  if (dbError) return { error: dbError.message };

  revalidatePath('/saas-admin/settings/payments');
  redirect('/saas-admin/settings/payments');
}

// ── togglePaymentMethod ──────────────────────────────────────────────────────
export async function togglePaymentMethod(id: string, is_active: boolean) {
  const { error, supabase } = await assertSuperAdmin();
  if (error) return { error };

  const { error: dbError } = await supabase
    .from('platform_payment_methods')
    .update({ is_active })
    .eq('id', id);

  if (dbError) return { error: dbError.message };
  revalidatePath('/saas-admin/settings/payments');
}

// ── deletePaymentMethod ──────────────────────────────────────────────────────
export async function deletePaymentMethod(id: string) {
  const { error, supabase } = await assertSuperAdmin();
  if (error) return { error };

  const { error: dbError } = await supabase
    .from('platform_payment_methods')
    .delete()
    .eq('id', id);

  if (dbError) return { error: dbError.message };
  revalidatePath('/saas-admin/settings/payments');
}
