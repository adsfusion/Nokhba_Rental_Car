'use server';

import { createSupabaseServerClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createSubscriptionPlan(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') return { error: 'Forbidden' };

  const name = formData.get('name') as string;
  const max_vehicles = parseInt(formData.get('max_vehicles') as string, 10);
  const price = parseFloat(formData.get('price') as string);
  const currency = formData.get('currency') as string;
  const billing_period = formData.get('billing_period') as string;
  const duration_days = parseInt(formData.get('duration_days') as string, 10);

  if (!name || isNaN(max_vehicles) || isNaN(price) || !currency || !billing_period || isNaN(duration_days)) {
    return { error: 'All fields are required and must be valid.' };
  }

  const { error } = await supabase
    .from('subscription_plans')
    .insert({
      name,
      max_vehicles,
      price,
      currency,
      billing_period,
      duration_days,
      is_active: true
    });

  if (error) {
    console.error("🔥 Error creating subscription plan:", error);
    return { error: error.message || 'Failed to create subscription plan in database.' };
  }

  revalidatePath('/saas-admin/subscriptions');
  redirect('/saas-admin/subscriptions');
}

export async function deleteSubscriptionPlan(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') return { error: 'Forbidden' };

  const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/saas-admin/subscriptions');
  return { success: true };
}
