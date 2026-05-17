import { notFound } from 'next/navigation';
import { getPublicContractDetails } from '@/lib/actions/publicContracts';
import { MobileContractFlow } from '@/components/contracts/MobileContractFlow';

export const metadata = {
  title: 'Upload Docs & Sign | Nokhba Rental',
  description: 'Upload your documents and sign your vehicle rental agreement.',
};

export default async function SignContractPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  const contract = await getPublicContractDetails(contractId);

  if (!contract) notFound();

  // Already completed — show a static success screen
  if (contract.status === 'signed' || contract.status === 'completed') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Already Signed</h2>
          <p className="text-slate-400 text-sm">This contract has already been signed and finalized.</p>
        </div>
      </div>
    );
  }

  const client = contract.clients;
  const vehicle = contract.vehicles;
  const total = (contract.daily_rate ?? 0) * (contract.total_days ?? 0) + (contract.deposit_amount ?? 0);

  return (
    <MobileContractFlow
      contractId={contract.id}
      clientId={client?.id ?? ''}
      clientName={client?.full_name ?? 'Client'}
      vehicleBrand={vehicle?.brand ?? ''}
      vehicleModel={vehicle?.model ?? ''}
      vehiclePlate={vehicle?.license_plate ?? ''}
      totalDays={contract.total_days ?? 0}
      startDate={contract.start_date ?? ''}
      endDate={contract.end_date ?? ''}
      totalAmount={total}
      depositAmount={contract.deposit_amount ?? 0}
    />
  );
}
