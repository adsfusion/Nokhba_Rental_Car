import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function GlobalAvailabilityRedirect() {
  const supabase = await createSupabaseServerClient();
  
  // Fetch the first available tenant for the user
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug')
    .limit(1)
    .single();

  if (tenant) {
    redirect(`/${tenant.slug}/availability`);
  } else {
    // Fallback if no tenant is found in DB, or use the hardcoded one
    redirect('/test-agency/availability');
  }
}
