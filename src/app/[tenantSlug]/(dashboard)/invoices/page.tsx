import { Receipt } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function InvoicesPage() {
  return (
    <div className="max-w-[896px] mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Invoices</h1>
        <p className="text-slate-500 text-sm mt-1">View and manage your billing history.</p>
      </div>

      <EmptyState
        variant="card"
        icon={<Receipt size={28} />}
        title="Invoices — Coming Soon"
        description="This module is currently under development. Relevant features and tools will be available here soon."
      />
    </div>
  );
}
