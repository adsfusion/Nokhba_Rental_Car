import { Receipt } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div className="max-w-[896px] mx-auto p-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm w-full max-w-md mx-auto">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-6">
          <Receipt size={32} className="text-slate-400" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-3 w-full">
          Invoices
        </h1>
        <p className="text-slate-500 w-full leading-relaxed">
          This module is currently under development. Relevant features and tools will be available here soon.
        </p>
      </div>
    </div>
  );
}
