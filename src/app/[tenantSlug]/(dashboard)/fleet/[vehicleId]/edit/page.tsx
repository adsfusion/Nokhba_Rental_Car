import { notFound } from 'next/navigation';
import { getVehicles } from '@/lib/actions/vehicles';
import { getContracts } from '@/lib/actions/contracts';
import EditVehicleForm from '@/components/fleet/EditVehicleForm';

interface Props {
  params: Promise<{ tenantSlug: string; vehicleId: string }>;
}

export const metadata = { title: 'Edit Vehicle — Nokhba' };

export default async function EditVehiclePage({ params }: Props) {
  const { vehicleId, tenantSlug } = await params;
  const [vehicles, contracts] = await Promise.all([getVehicles(), getContracts()]);
  const vehicle = vehicles.find((v) => v.id === vehicleId);

  if (!vehicle) notFound();

  return (
    <div className="space-y-6">
      <EditVehicleForm vehicle={vehicle} contracts={contracts} tenantSlug={tenantSlug} />
    </div>
  );
}
