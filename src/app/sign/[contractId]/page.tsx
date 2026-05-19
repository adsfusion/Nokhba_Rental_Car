import { notFound } from 'next/navigation';
import { getPublicContractDetails } from '@/lib/actions/publicContracts';
import { MobileContractFlow } from '@/components/contracts/MobileContractFlow';
import { Check } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center max-w-[500px] w-full shadow-sm">
          <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-600" />
          </div>
          <div className="space-y-4">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Already Signed
            </h1>
            <p className="text-slate-500 leading-relaxed text-sm">
              This contract has already been signed and finalized. No further action is required from you at this time.
            </p>
          </div>
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
