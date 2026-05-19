import { getVehicles } from '@/lib/actions/vehicles';
import { getContracts, type ContractWithDetails } from '@/lib/actions/contracts';
import FleetTable from '@/components/fleet/FleetTable';
import type { Vehicle } from '@/types';

export default async function FleetPage() {
  let vehicles: Vehicle[] = [];
  let contracts: ContractWithDetails[] = [];

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
      <FleetTable vehicles={vehicles} contracts={contracts} />
    </div>
  );
}
