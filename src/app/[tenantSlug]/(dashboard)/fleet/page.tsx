import { getVehicles } from '@/lib/actions/vehicles';
import { getContracts } from '@/lib/actions/contracts';
import FleetTable from '@/components/fleet/FleetTable';

export default async function FleetPage() {
  const [vehicles, contracts] = await Promise.all([getVehicles(), getContracts()]);

  return (
    <div className="space-y-6">
      <FleetTable vehicles={vehicles} contracts={contracts} />
    </div>
  );
}
