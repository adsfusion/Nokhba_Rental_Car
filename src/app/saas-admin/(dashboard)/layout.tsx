import { ReactNode } from "react";

export default function SaasAdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&amp;family=JetBrains+Mono:wght@100..800&amp;display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
      
      <div className="bg-surface text-on-surface custom-scrollbar min-h-screen flex" translate="no">
        {/* Sidebar Navigation */}
        <aside className="fixed inset-y-0 left-0 w-64 bg-surface dark:bg-surface-dim border-r border-outline-variant flex flex-col h-screen py-lg px-md z-50">
          <div className="mb-xl px-sm">
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">FleetCentral</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Admin Console</p>
          </div>
          <nav className="flex-1 space-y-xs">
            {/* Dashboard Active */}
            <a className="flex items-center gap-md px-md py-sm text-primary font-bold border-r-2 border-primary cursor-pointer active:scale-95 transition-all hover:bg-surface-container-low" href="/saas-admin/overview">
              <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
              <span className="font-body-md text-body-md">Dashboard</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-low transition-colors duration-150 cursor-pointer active:scale-95" href="#">
              <span className="material-symbols-outlined" data-icon="group">group</span>
              <span className="font-body-md text-body-md">Tenants</span>
            </a>

            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-low transition-colors duration-150 cursor-pointer active:scale-95" href="#">
              <span className="material-symbols-outlined" data-icon="payments">payments</span>
              <span className="font-body-md text-body-md">Billing</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-low transition-colors duration-150 cursor-pointer active:scale-95" href="#">
              <span className="material-symbols-outlined" data-icon="support_agent">support_agent</span>
              <span className="font-body-md text-body-md">Support</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-container-low transition-colors duration-150 cursor-pointer active:scale-95" href="#">
              <span className="material-symbols-outlined" data-icon="settings">settings</span>
              <span className="font-body-md text-body-md">Settings</span>
            </a>
          </nav>
          <div className="mt-auto border-t border-outline-variant pt-md px-sm">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Admin Avatar" className="w-full h-full object-cover" data-alt="A professional headshot of a corporate executive in a crisp dark suit against a clean, minimalist studio background. The lighting is soft and flattering, emphasizing a mood of confident leadership and professional reliability. The aesthetic is modern and high-end, fitting a premium SaaS dashboard environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAplS5YtAmyalK_ipIgNWxxRkHZiB8KIAKIvHC-4-8BmMe3AdO7pjv54hRGObyrgJ-VoR1On7kGuK-qY741vmZWpCJafGk00TwL0aOV_6LOWBVbHcEDJHcF4onVTRnpFyxXgzMpaz_a973OEadJIP8WlU0P-rSeCTrQt_YBhba5vZ7uF2WYqJgMmdbcd96u2OJYm9Nyy0dVTJ4KJoiSsIgNMKjy9Q2dnjev05nQ9oSZ0NJxdPBEqqaSk7eMrWnX094LnKcrHJ5-quU"/>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm font-bold">Jean Dupont</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Super Admin</span>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main Content Wrapper */}
        <main className="ml-64 flex-1 flex flex-col min-h-screen">
          {/* Top App Bar */}
          <header className="sticky top-0 z-40 bg-surface/60 backdrop-blur-xl border-b border-outline-variant flex justify-between items-center w-full px-lg py-sm">
            <div className="flex items-center gap-lg flex-1">
              <h2 className="font-title-md text-title-md font-semibold text-on-surface">Admin Console</h2>
              <div className="relative max-w-[448px] w-full">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" data-icon="search">search</span>
                <input className="w-full pl-xl pr-md py-xs bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary/5 focus:border-primary transition-all outline-none" placeholder="Rechercher des locataires, véhicules ou transactions..." type="text"/>
              </div>
            </div>
            <div className="flex items-center gap-md">
              <button className="p-xs text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
              </button>
              <button className="p-xs text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined" data-icon="help">help</span>
              </button>
              <div className="h-6 w-px bg-outline-variant mx-xs"></div>
              <button className="p-xs text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
              </button>
            </div>
          </header>
          {children}
        </main>
      </div>
    </>
  );
}