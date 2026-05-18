import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-300">
        <CreditCard size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h2>
      <p className="text-slate-500 text-sm max-w-xs">
        Payment tracking and financial reporting is coming soon.
      </p>
    </div>
  );
}
