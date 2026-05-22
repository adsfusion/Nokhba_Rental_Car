'use server';

import { createSupabaseServerClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createSubscriptionPlan(formData: FormData) {
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
  const max_vehicles = parseInt(formData.get('max_vehicles') as string, 10);
  const price = parseFloat(formData.get('price') as string);
  const currency = formData.get('currency') as string;
  const billing_period = formData.get('billing_period') as string;

  if (!name || isNaN(max_vehicles) || isNaN(price) || !currency || !billing_period) {
    throw new Error('All fields are required');
  }

  const { error } = await supabase
    .from('subscription_plans')
    .insert({
      name,
      max_vehicles,
      price,
      currency,
      billing_period,
      is_active: true
    });

  if (error) {
    console.error("🔥 Error creating subscription plan:", error);
    throw new Error(error.message);
  }

  revalidatePath('/saas-admin/subscriptions');
  redirect('/saas-admin/subscriptions');
}
