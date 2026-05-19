import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="max-w-[896px] mx-auto p-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-6">
          <CreditCard size={32} className="text-slate-400" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-3">
          Payments
        </h1>
        <p className="text-slate-500 max-w-[448px] mx-auto leading-relaxed">
          This module is currently under development. Relevant features and tools will be available here soon.
        </p>
      </div>
    </div>
  );
}
