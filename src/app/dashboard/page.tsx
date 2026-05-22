import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardRedirect() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id, tenants(slug)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login?error=ProfileNotFound');
  }

  if (profile.role === 'super_admin') {
    redirect('/saas-admin/overview');
  }

  // Handle single relation object or array (if array, get first element)
  const tenantData = Array.isArray(profile.tenants) ? profile.tenants[0] : profile.tenants;
  const slug = tenantData?.slug;
  
  if (slug) {
    redirect(`/${slug}/dashboard`);
  } else {
    redirect('/login?error=NoTenantAssigned');
  }
}
