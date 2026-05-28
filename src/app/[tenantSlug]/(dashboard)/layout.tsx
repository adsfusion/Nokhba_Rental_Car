import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { getProfile } from '@/lib/actions/auth';
import { cookies } from 'next/headers';
import { stopImpersonation } from '@/lib/actions/impersonate';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TrialExpiredModal } from '@/components/saas/TrialExpiredModal';

export default async function TenantLayout({ children, params }: { children: React.ReactNode, params: Promise<{ tenantSlug: string }> }) {
  const profile = await getProfile();
  const { tenantSlug } = await params;

  if (!profile) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const { data: tenantData } = await supabase.from('tenants').select('name, subscription_end_date').eq('slug', tenantSlug).single();
  const tenantName = tenantData?.name || 'Nokhba Rental';

  const isExpired = tenantData?.subscription_end_date 
    ? new Date(tenantData.subscription_end_date) < new Date()
    : false;

  const cookieStore = await cookies();
  const impersonatedId = cookieStore.get('nokhba_impersonate_tenant_id')?.value;
  const isImpersonating = impersonatedId && profile.role === 'super_admin';

  const initials = (profile.full_name as string | undefined)
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U';

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen bg-surface-container-low overflow-hidden">
        
        {isImpersonating && (
          <div className="w-full bg-red-600 text-white px-6 py-2 flex justify-between items-center z-[100] font-bold text-sm shadow-md shrink-0">
            <span>🚨 VIEWING AS {tenantName.toUpperCase()} (IMPERSONATION MODE)</span>
            <form action={stopImpersonation}>
              <button type="submit" className="bg-white text-red-600 px-4 py-1.5 rounded-md hover:bg-red-50 transition-colors shadow-sm text-xs">
                Return to SAAS Admin
              </button>
            </form>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <Sidebar tenantName={tenantName} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header
              userName={profile.full_name as string | undefined}
              userInitials={initials}
            />
            <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative">
              {isExpired ? (
                <TrialExpiredModal tenantName={tenantName} />
              ) : (
                children
              )}
            </main>
          </div>
        </div>
        
      </div>
    </SidebarProvider>
  );
}
