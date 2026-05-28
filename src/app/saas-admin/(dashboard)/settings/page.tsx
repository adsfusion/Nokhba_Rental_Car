import { Settings } from 'lucide-react';

export default function SaasSettingsPage() {
  return (
    <div className="w-full space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h2>
        <p className="text-slate-500 text-sm">Manage global platform configurations</p>
      </div>

      <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto p-12 text-center min-h-[60vh] bg-white border border-slate-200 rounded-3xl border-dashed">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
          <Settings size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-4 uppercase tracking-wide">Settings Module</h3>
        <p className="text-sm w-full whitespace-normal text-slate-500 leading-relaxed">
          This module is currently under development. Here you will be able to manage global platform configurations.
        </p>
      </div>
    </div>
  );
}
