import AddVehicleForm from '@/components/fleet/AddVehicleForm';

export const metadata = { title: 'Add Vehicle — Nokhba' };

export default function NewVehiclePage() {
  return (
    <div className="space-y-6">
      <AddVehicleForm />
    </div>
  );
}
