'use server';

import { createSupabaseServerClient } from '../supabase/server';
import { createSupabaseAdminClient } from '../supabase/admin';
import { revalidatePath } from 'next/cache';

// ── submitPaymentProof ───────────────────────────────────────────────────────
export async function submitPaymentProof(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Get user's tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, tenants(slug)')
    .eq('id', user.id)
    .single();

  const tenantId = profile?.tenant_id;
  const tenantSlug = (profile?.tenants as any)?.slug;
  if (!tenantId || !tenantSlug) return { error: 'Tenant not found.' };

  const planId           = formData.get('subscription_plan_id') as string;
  const paymentMethodId  = formData.get('payment_method_id') as string | null;
  const amountPaid       = parseFloat(formData.get('amount_paid') as string);
  const currency         = formData.get('currency') as string || 'MAD';
  const notes            = formData.get('notes') as string | null;
  const proofFile        = formData.get('proof_image') as File | null;

  if (!planId || isNaN(amountPaid) || !proofFile) {
    return { error: 'Plan, amount, and proof image are required.' };
  }

  // Upload image to Supabase Storage
  const fileExt  = proofFile.name.split('.').pop();
  const fileName = `${tenantSlug}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(fileName, proofFile, { contentType: proofFile.type, upsert: false });

  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  // Get public URL (signed URL for private bucket)
  const { data: urlData } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(fileName);

  const proofImageUrl = urlData?.publicUrl || fileName;

  // Insert proof record
  const { error: dbError } = await supabase
    .from('payment_proofs')
    .insert({
      tenant_id:            tenantId,
      subscription_plan_id: planId,
      amount_paid:          amountPaid,
      currency,
      payment_method_id:    paymentMethodId || null,
      proof_image_url:      proofImageUrl,
      notes:                notes || null,
      status:               'pending',
    });

  if (dbError) return { error: dbError.message };

  revalidatePath(`/${tenantSlug}/subscription`);
  return { success: true };
}

// ── approvePayment ───────────────────────────────────────────────────────────
export async function approvePayment(proofId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') return { error: 'Forbidden' };

  const { error } = await supabase.rpc('approve_payment_proof', {
    p_proof_id:  proofId,
    p_admin_id:  user.id,
  });

  if (error) return { error: error.message };

  revalidatePath('/saas-admin/subscriptions/payments');
  revalidatePath(`/saas-admin/subscriptions/payments/${proofId}`);
  return { success: true };
}

// ── rejectPayment ────────────────────────────────────────────────────────────
export async function rejectPayment(proofId: string, reason: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') return { error: 'Forbidden' };

  // Get tenant_id from proof
  const { data: proof } = await supabase
    .from('payment_proofs')
    .select('tenant_id')
    .eq('id', proofId)
    .single();

  if (!proof) return { error: 'Proof not found.' };

  // Update proof
  const { error: proofError } = await supabase
    .from('payment_proofs')
    .update({
      status:           'rejected',
      rejection_reason: reason || 'No reason provided.',
      reviewed_by:      user.id,
      reviewed_at:      new Date().toISOString(),
    })
    .eq('id', proofId);

  if (proofError) return { error: proofError.message };

  // Update tenant status to rejected
  const { error: tenantError } = await supabase
    .from('tenants')
    .update({ subscription_status: 'rejected' })
    .eq('id', proof.tenant_id);

  if (tenantError) return { error: tenantError.message };

  revalidatePath('/saas-admin/subscriptions/payments');
  revalidatePath(`/saas-admin/subscriptions/payments/${proofId}`);
  return { success: true };
}

export async function deletePaymentProof(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') return { error: 'Forbidden' };

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('payment_proofs').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/saas-admin/subscriptions/payments');
  return { success: true };
}
