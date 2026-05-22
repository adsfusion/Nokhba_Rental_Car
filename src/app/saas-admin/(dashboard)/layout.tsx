import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Car, LayoutDashboard, Users, LogOut, CreditCard, Settings } from "lucide-react";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";

export default async function SaasAdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    redirect('/dashboard');
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex font-sans" dir="ltr">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col h-screen z-50">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Car className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="font-display font-bold text-lg leading-tight">Nokhba Rental</h1>
              <p className="text-xs text-slate-400 font-medium">SAAS Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link 
            href="/saas-admin/overview" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <LayoutDashboard size={20} className="group-hover:text-white transition-colors" />
            <span className="font-semibold text-sm">Overview</span>
          </Link>
          
          <Link 
            href="/saas-admin/tenants" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <Users size={20} className="group-hover:text-white transition-colors" />
            <span className="font-semibold text-sm">Tenants</span>
          </Link>

          <Link 
            href="/saas-admin/subscriptions" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <CreditCard size={20} className="group-hover:text-white transition-colors" />
            <span className="font-semibold text-sm">Subscription Plans</span>
          </Link>

          <Link 
            href="/saas-admin/settings" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <Settings size={20} className="group-hover:text-white transition-colors" />
            <span className="font-semibold text-sm">Platform Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <form action={logout}>
            <button type="submit" className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors group">
              <LogOut size={20} />
              <span className="font-semibold text-sm">Sign Out</span>
            </button>
          </form>
        </div>
      </aside>
      
      {/* Main Content Wrapper */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen relative">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex justify-between items-center w-full px-8 py-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Platform Administration</h2>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">Super Administrator</span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}