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

  const payload: any = {
    name,
    slug
  };

  if (subscription_plan_id) {
    payload.subscription_plan_id = subscription_plan_id;
  }

  const { error } = await supabase
    .from('tenants')
    .insert(payload);

  if (error) {
    console.error("🔥 Error creating tenant:", error);
    throw new Error(error.message);
  }

  revalidatePath('/saas-admin/tenants');
  redirect('/saas-admin/tenants');
}
