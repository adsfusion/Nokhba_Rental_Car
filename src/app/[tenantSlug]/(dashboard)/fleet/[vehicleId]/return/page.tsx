import { notFound, redirect } from 'next/navigation';
import { getVehicles } from '@/lib/actions/vehicles';
import { getContracts } from '@/lib/actions/contracts';
import ReturnVehicleForm from './ReturnVehicleForm';

interface Props {
  params: Promise<{ tenantSlug: string; vehicleId: string }>;
}

export const metadata = { title: 'Process Return — Nokhba' };

export default async function ReturnVehiclePage({ params }: Props) {
  const { vehicleId, tenantSlug } = await params;
  
  // Find the active contract for this vehicle
  const contracts = await getContracts();
  const activeContract = contracts.find(
    (c) => c.vehicle_id === vehicleId && c.status === 'active'
  );

  // If there is no active contract, redirect back to the vehicle page
  if (!activeContract) {
    redirect(`/${tenantSlug}/fleet/${vehicleId}/edit`);
  }

  return (
    <div className="space-y-6">
      <ReturnVehicleForm contract={activeContract} />
    </div>
  );
}
