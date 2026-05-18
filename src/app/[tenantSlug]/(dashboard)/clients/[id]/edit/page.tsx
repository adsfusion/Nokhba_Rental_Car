import { notFound } from 'next/navigation';
import { getClientById } from '@/lib/actions/clients';
import { EditClientPage } from '@/components/clients/EditClientPage';

type Props = { params: Promise<{ id: string }> };

export default async function ClientEditPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();
  return <EditClientPage client={client} />;
}
