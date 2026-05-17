'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Car,
  Users,
  FileText,
  LayoutDashboard,
  Settings,
  LogOut,
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

const mainNav: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'Fleet', icon: Car, href: '/fleet' },
  { title: 'Clients', icon: Users, href: '/clients' },
  { title: 'Contracts', icon: FileText, href: '/contracts' },
];

const secondaryNav: NavItem[] = [
  { title: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const { open: isOpen, close } = useSidebar();
  const pathname = usePathname();

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
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                N
              </div>
              <span className="font-semibold text-lg tracking-tight">Nokhba Rental</span>
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
            {secondaryNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
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

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
