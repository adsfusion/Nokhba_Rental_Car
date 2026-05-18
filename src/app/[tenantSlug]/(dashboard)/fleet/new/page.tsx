import AddVehicleForm from '@/components/fleet/AddVehicleForm';

export const metadata = { title: 'Add Vehicle — Nokhba' };

export default async function NewVehiclePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  return (
    <div className="space-y-6">
      <AddVehicleForm tenantSlug={tenantSlug} />
    </div>
  );
}
