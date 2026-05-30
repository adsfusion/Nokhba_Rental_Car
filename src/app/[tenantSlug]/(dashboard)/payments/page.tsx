import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PaymentsPage() {
  return (
    <div className="max-w-[896px] mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Payments</h1>
        <p className="text-slate-500 text-sm mt-1">Track transactions and payment records.</p>
      </div>

      <EmptyState
        variant="card"
        icon={<CreditCard size={28} />}
        title="Payments — Coming Soon"
        description="This module is currently under development. Relevant features and tools will be available here soon."
      />
    </div>
  );
}
