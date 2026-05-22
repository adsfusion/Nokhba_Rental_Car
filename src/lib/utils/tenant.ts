import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '../supabase/server';

export async function getCurrentTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const impersonatedId = cookieStore.get('nokhba_impersonate_tenant_id')?.value;
  
  if (impersonatedId) {
    // If impersonation cookie exists, verify the user is a super_admin
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'super_admin') {
        return impersonatedId;
      }
    }
  }

  // Fallback to normal profile tenant_id
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  return profile?.tenant_id || null;
}
