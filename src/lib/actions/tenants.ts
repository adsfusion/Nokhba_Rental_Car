'use server';

import { createSupabaseServerClient } from '../supabase/server';
import { createSupabaseAdminClient } from '../supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createTenant(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') throw new Error('Forbidden');

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const phone = formData.get('phone') as string;
  const city = formData.get('city') as string;
  const subscription_plan_id = formData.get('subscription_plan_id') as string;

  if (!name || !slug || !email || !password) {
    return { error: 'Name, Slug, Email, and Password are required' };
  }

  const adminAuth = createSupabaseAdminClient();

  // 1. Create Auth User bypassing normal signup
  const { data: authData, error: authError } = await adminAuth.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error('🔥 Error creating auth user:', authError);
    return { error: authError?.message || 'Failed to create admin user' };
  }

  const authUserId = authData.user.id;

  const payload: Record<string, unknown> = { 
    name, 
    slug,
    email,
    phone,
    city
  };

  if (subscription_plan_id) {
    // ── 1. Fetch plan details ───────────────────────────────────────────────
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('duration_days, max_vehicles')
      .eq('id', subscription_plan_id)
      .single();

    if (planError || !plan) {
      await adminAuth.auth.admin.deleteUser(authUserId); // cleanup
      return { error: 'Selected subscription plan not found.' };
    }

    const durationDays: number = plan.duration_days ?? 30;
    const maxVehicles: number  = plan.max_vehicles  ?? 5;

    // ── 2. Compute end date — EXACT millisecond arithmetic ──────────────────
    // Formula: Date.now() + duration_days × 24h × 60m × 60s × 1000ms
    const subscriptionEndDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    );

    // ── 3. Set status: 1-day plan = 'trialing', anything longer = 'active' ──
    const subscriptionStatus = durationDays === 1 ? 'trialing' : 'active';

    // ── 4. Build full payload ───────────────────────────────────────────────
    payload.subscription_plan_id  = subscription_plan_id;
    payload.subscription_end_date = subscriptionEndDate.toISOString();
    payload.subscription_status   = subscriptionStatus;
    payload.max_vehicles_limit    = maxVehicles;
  }

  // 2. Create Tenant Row
  // Use admin client to ensure we can select the inserted row reliably without RLS blocking
  const { data: tenantData, error: tenantError } = await adminAuth
    .from('tenants')
    .insert(payload)
    .select('id')
    .single();

  if (tenantError || !tenantData) {
    console.error('🔥 Error creating tenant:', tenantError);
    await adminAuth.auth.admin.deleteUser(authUserId); // cleanup
    return { error: tenantError?.message || 'Failed to create tenant in database' };
  }

  // 3. Update Profile Row linked to Auth ID and Tenant ID
  // (A database trigger likely created a blank profile already, so we update it)
  const { error: profileError } = await adminAuth
    .from('profiles')
    .update({
      tenant_id: tenantData.id,
      role: 'tenant_admin',
      email,
      phone,
      full_name: name
    })
    .eq('id', authUserId);

  if (profileError) {
    console.error('🔥 Error creating profile:', profileError);
    // Best effort cleanup. If profile fails, tenant might be orphaned. 
    // Ideally use a database function for atomicity, but this works for now.
    await adminAuth.from('tenants').delete().eq('id', tenantData.id);
    await adminAuth.auth.admin.deleteUser(authUserId);
    return { error: profileError.message || 'Failed to create admin profile' };
  }

  revalidatePath('/saas-admin/tenants');
  redirect('/saas-admin/tenants');
}

export async function deleteTenant(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') return { error: 'Forbidden' };

  // Use Admin Client to bypass RLS for deletion operations
  const admin = createSupabaseAdminClient();

  // Cascade delete dependent records first
  const { error: ppErr } = await admin.from('payment_proofs').delete().eq('tenant_id', id);
  if (ppErr) return { error: `Failed to delete payment proofs: ${ppErr.message}` };

  const { error: profErr } = await admin.from('profiles').delete().eq('tenant_id', id);
  if (profErr) return { error: `Failed to delete profiles: ${profErr.message}` };

  const { error } = await admin.from('tenants').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') return { error: 'Cannot delete this tenant because it has linked records in other tables.' };
    return { error: error.message };
  }

  revalidatePath('/saas-admin/tenants');
  return { success: true };
}
