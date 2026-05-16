export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">Nokhba Rental</span>
          <span className="text-xs text-slate-500">Client Portal</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
