'use server';

import { createSupabaseServerClient } from '../supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function impersonateTenant(tenantId: string, tenantSlug: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') throw new Error('Forbidden: Only Super Admins can impersonate tenants.');

  // Elegant RLS Bypass: Temporarily bind the Super Admin to the target tenant
  await supabase
    .from('profiles')
    .update({ tenant_id: tenantId })
    .eq('id', user.id);

  // Set the secure impersonation cookie
  const cookieStore = await cookies();
  cookieStore.set('nokhba_impersonate_tenant_id', tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 2, // 2 hours
  });

  redirect(`/${tenantSlug}/dashboard`);
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  cookieStore.delete('nokhba_impersonate_tenant_id');
  redirect('/saas-admin/tenants');
}
