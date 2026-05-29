'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Car,
  Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/actions/auth';
import { useSidebar } from './SidebarContext';

type NavItem = {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
};

export function SaasSidebar() {
  const { open: isOpen, close } = useSidebar();
  const pathname = usePathname();
  
  const mainNav: NavItem[] = [
    { title: 'Overview', icon: LayoutDashboard, href: `/saas-admin/overview` },
    { title: 'Tenants', icon: Users, href: `/saas-admin/tenants` },
    { title: 'Subscription Plans', icon: CreditCard, href: `/saas-admin/subscriptions` },
    { title: 'Payment Reviews', icon: Banknote, href: `/saas-admin/subscriptions/payments` },
    { title: 'Platform Settings', icon: Settings, href: `/saas-admin/settings` },
  ];

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
      />

      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-50 w-64 bg-surface-container-lowest border-e border-slate-200 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                <Car size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight truncate leading-tight">Nokhba Rental</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SAAS Admin</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Main Menu
            </p>
            {mainNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg transition-all group',
                    isActive
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={18}
                      className={cn(
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'
                      )}
                    />
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                        isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-1">
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-2"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
