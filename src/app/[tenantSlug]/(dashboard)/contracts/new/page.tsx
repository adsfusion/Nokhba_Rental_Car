import { Suspense } from 'react';
import { getAvailableVehicles } from '@/lib/actions/vehicles';
import { getClients } from '@/lib/actions/clients';
import { ContractWizard } from '@/components/contracts/ContractWizard';

export default async function NewContractPage() {
  const [availableVehicles, clients] = await Promise.all([getAvailableVehicles(), getClients()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">New Contract</h2>
        <p className="text-slate-500 text-sm">Complete all steps to generate a rental agreement.</p>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-500 text-sm">Loading contract details...</div>}>
        <ContractWizard vehicles={availableVehicles} clients={clients} />
      </Suspense>
    </div>
  );
}
