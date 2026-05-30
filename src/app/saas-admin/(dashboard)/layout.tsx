import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { SaasSidebar } from "@/components/layout/SaasSidebar";
import { Header } from "@/components/layout/Header";
import { getProfile } from "@/lib/actions/auth";

export default async function SaasAdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();

  if (profile?.role !== 'super_admin') {
    redirect('/dashboard');
  }

  const initials = (profile?.full_name as string | undefined)
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U';

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen bg-surface-container-low overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <SaasSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header
              userName={profile?.full_name as string | undefined}
              userInitials={initials}
            />
            <main className="flex-1 w-full min-w-0 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}