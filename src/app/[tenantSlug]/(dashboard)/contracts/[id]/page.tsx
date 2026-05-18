import { notFound } from 'next/navigation';
import { getContractById } from '@/lib/actions/contracts';
import { getClientDocumentUrls } from '@/lib/actions/clientDocuments';
import { ContractDetail } from '@/components/contracts/ContractDetail';

type Props = { params: Promise<{ id: string }> };

export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params;
  const contract = await getContractById(id);
  if (!contract) notFound();

  const docUrls = contract.client_id
    ? await getClientDocumentUrls(contract.client_id)
    : {};

  return <ContractDetail contract={contract} docUrls={docUrls} />;
}
