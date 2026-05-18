import { notFound } from 'next/navigation';
import { getContractById } from '@/lib/actions/contracts';
import { EditContractPage } from '@/components/contracts/EditContractPage';

type Props = { params: Promise<{ id: string }> };

export default async function ContractEditPage({ params }: Props) {
  const { id } = await params;
  const contract = await getContractById(id);
  if (!contract) notFound();
  return <EditContractPage contract={contract} />;
}
