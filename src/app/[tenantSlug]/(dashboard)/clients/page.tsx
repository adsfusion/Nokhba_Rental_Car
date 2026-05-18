import { getClients } from '@/lib/actions/clients';
import { ClientTable } from '@/components/clients/ClientTable';

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <ClientTable clients={clients} />
    </div>
  );
}
