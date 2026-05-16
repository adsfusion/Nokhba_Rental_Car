import { getContracts } from '@/lib/actions/contracts';
import { ContractList } from '@/components/contracts/ContractList';

export default async function ContractsPage() {
  const contracts = await getContracts();

  return (
    <div className="space-y-6">
      <ContractList initialContracts={contracts} />
    </div>
  );
}
