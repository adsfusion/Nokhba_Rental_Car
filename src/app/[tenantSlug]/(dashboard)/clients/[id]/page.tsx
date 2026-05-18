import { notFound } from 'next/navigation';
import { getClientById } from '@/lib/actions/clients';
import { getContractsByClientId } from '@/lib/actions/contracts';
import { ClientProfile } from '@/components/clients/ClientProfile';

export const metadata = {
  title: 'Client Profile | Nokhba Rental',
};

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string; tenantSlug: string }>;
}) {
  const { id, tenantSlug } = await params;

  const [client, contracts] = await Promise.all([
    getClientById(id),
    getContractsByClientId(id),
  ]);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ClientProfile client={client} contracts={contracts} tenantSlug={tenantSlug} />
    </div>
  );
}
