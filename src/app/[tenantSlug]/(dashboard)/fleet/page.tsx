import { getVehicles } from '@/lib/actions/vehicles';
import { getContracts } from '@/lib/actions/contracts';
import FleetTable from '@/components/fleet/FleetTable';

export default async function FleetPage() {
  let vehicles = [];
  let contracts = [];

  try {
    vehicles = await getVehicles();
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    vehicles = [];
  }

  try {
    contracts = await getContracts();
  } catch (error) {
    console.error('Error fetching contracts:', error);
    contracts = [];
  }

  return (
    <div className="space-y-6">
      <FleetTable vehicles={vehicles || []} contracts={contracts || []} />
    </div>
  );
}
