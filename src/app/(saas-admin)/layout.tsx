import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/actions/auth';

export default async function SaasAdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();

  if (!profile || profile.role !== 'saas_admin') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-slate-900">Nokhba</span>
          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            Super Admin
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {[
            { label: 'Overview', href: '/saas-admin/overview' },
            { label: 'Agencies', href: '/saas-admin/agencies' },
            { label: 'Packages', href: '/saas-admin/packages' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
