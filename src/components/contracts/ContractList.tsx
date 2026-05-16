'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileText, PenLine, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contract } from '@/types';
import { EditClientModal } from './EditClientModal';
import { updateContract } from '@/lib/actions/contracts';
import { updateVehicle } from '@/lib/actions/vehicles';
import { useNotifications } from '@/components/layout/NotificationProvider';

import { type ContractWithDetails } from '@/lib/actions/contracts';

type Props = {
  initialContracts: ContractWithDetails[];
};

export function ContractList({ initialContracts }: Props) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [editingContract, setEditingContract] = useState<ContractWithDetails | null>(null);
  const [isPending, startTransition] = useTransition();
  const [returningId, setReturningId] = useState<string | null>(null);

  const handleReturn = (contract: Contract) => {
    setReturningId(contract.id);
    startTransition(async () => {
      await updateContract(contract.id, { status: 'completed' });
      await updateVehicle(contract.vehicle_id, { status: 'available' });
      addNotification('Vehicle Returned', `${(contract as any).vehicles?.brand} ${(contract as any).vehicles?.model} is now available.`, 'success');
      router.refresh();
      setReturningId(null);
    });
  };

  return (
    <>
      {editingContract && (
        <EditClientModal
          contract={editingContract}
          onClose={() => setEditingContract(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Contracts &amp; Agreements
            </h2>
            <p className="text-slate-500 text-sm">Manage your rental agreements and e-signatures.</p>
          </div>
          <Link
            href="/contracts/new"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            New Contract
          </Link>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Active Records</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Filter:</span>
              <select className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none">
                <option>All Status</option>
                <option>Active</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          {initialContracts.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                <FileText size={32} />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">No contracts found</h4>
              <p className="text-slate-500 text-sm max-w-xs">
                You haven&apos;t generated any contracts yet. Click the button above to start your
                first one.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {initialContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Client
                      </p>
                      <p className="text-sm font-bold text-slate-900">{contract.clients?.full_name}</p>
                      <p className="text-xs text-slate-500">{contract.clients?.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Vehicle
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {(contract as any).vehicles?.brand} {(contract as any).vehicles?.model}
                      </p>
                      <p className="text-xs text-slate-500">{(contract as any).vehicles?.year}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Duration
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {contract.total_days} Days
                      </p>
                      <p className="text-xs text-slate-500" suppressHydrationWarning>
                        {new Date(contract.start_date).toLocaleDateString()} to {new Date(contract.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Total
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        EUR{' '}
                        {contract.total_amount}
                      </p>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full inline-block mt-0.5',
                          contract.status === 'completed'
                            ? 'bg-slate-100 text-slate-700 font-bold'
                            : 'bg-green-100 text-green-700'
                        )}
                      >
                        {contract.status === 'completed' ? 'Returned' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setEditingContract(contract)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <PenLine size={16} />
                      Edit Client
                    </button>

                    {contract.status === 'active' && (
                      <button
                        onClick={() => handleReturn(contract)}
                        disabled={isPending && returningId === contract.id}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                      >
                        <ClipboardCheck size={16} />
                        {isPending && returningId === contract.id ? 'Returning…' : 'Return Vehicle'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
