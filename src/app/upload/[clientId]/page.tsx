import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { MobileUploadPortal } from '@/components/upload/MobileUploadPortal';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Upload Documents | Nokhba Rental',
};

export default async function UploadPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const admin = createSupabaseAdminClient();
  const { data: client } = await admin
    .from('clients')
    .select('id, full_name')
    .eq('id', clientId)
    .maybeSingle();

  if (!client) notFound();

  return (
    <MobileUploadPortal
      clientId={client.id}
      clientName={client.full_name}
    />
  );
}
