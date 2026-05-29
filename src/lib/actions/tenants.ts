'use server';

import { createSupabaseServerClient } from '../supabase/server';
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
  const subscription_plan_id = formData.get('subscription_plan_id') as string;

  if (!name || !slug) {
    throw new Error('Name and Slug are required');
  }

  const payload: Record<string, unknown> = { name, slug };

  if (subscription_plan_id) {
    // ── 1. Fetch plan details ───────────────────────────────────────────────
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('duration_days, max_vehicles')
      .eq('id', subscription_plan_id)
      .single();

    if (planError || !plan) {
      throw new Error('Selected subscription plan not found.');
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

  const { error } = await supabase
    .from('tenants')
    .insert(payload);

  if (error) {
    console.error('🔥 Error creating tenant:', error);
    throw new Error(error.message);
  }

  revalidatePath('/saas-admin/tenants');
  redirect('/saas-admin/tenants');
}
