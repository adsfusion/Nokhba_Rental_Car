'use server';

import { createSupabaseServerClient } from '../supabase/server';
import { createSupabaseAdminClient } from '../supabase/admin';

export type DocumentType =
  | 'id_front'
  | 'id_back'
  | 'license_front'
  | 'license_back';

async function getTenantId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) throw new Error('No tenant found');
  return profile.tenant_id as string;
}

function storagePath(tenantId: string, clientId: string, type: DocumentType) {
  return `${tenantId}/${clientId}/${type}`;
}

export async function uploadClientDocument(
  clientId: string,
  type: DocumentType,
  formData: FormData
): Promise<string> {
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file provided');

  const tenantId = await getTenantId();
  const supabase = await createSupabaseServerClient();
  const path = storagePath(tenantId, clientId, type);

  const { error } = await supabase.storage
    .from('client-documents')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;
  return path;
}

export async function getClientDocumentUrl(
  clientId: string,
  type: DocumentType
): Promise<string | null> {
  const tenantId = await getTenantId();
  const supabase = await createSupabaseServerClient();
  const path = storagePath(tenantId, clientId, type);

  const { data, error } = await supabase.storage
    .from('client-documents')
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function deleteClientDocument(
  clientId: string,
  type: DocumentType
): Promise<void> {
  const tenantId = await getTenantId();
  const supabase = await createSupabaseServerClient();
  const path = storagePath(tenantId, clientId, type);

  const { error } = await supabase.storage
    .from('client-documents')
    .remove([path]);

  if (error) throw error;
}

// ── Public upload path (no auth) ──────────────────────────────────────────────
// Used by the mobile portal at /upload/[clientId]. The admin client bypasses RLS
// so clients can upload without a Supabase session. The path is constructed with
// a tenant_id fetched by joining clients → tenants, preventing cross-tenant writes.

export async function uploadClientDocumentPublic(
  clientId: string,
  type: DocumentType,
  formData: FormData
): Promise<void> {
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file provided');

  const MAX_BYTES = 15 * 1024 * 1024;
  if (file.size > MAX_BYTES) throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 15 MB.`);

  const mimeOk = file.type.startsWith('image/') || file.type === 'application/pdf';
  if (!mimeOk) throw new Error(`Unsupported file type (${file.type || 'unknown'}). Please upload an image or PDF.`);

  const admin = createSupabaseAdminClient();

  // Resolve tenant_id from the client record (safe — admin client, controlled lookup)
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('tenant_id')
    .eq('id', clientId)
    .maybeSingle();

  if (clientError || !client?.tenant_id) throw new Error('Client not found');

  const path = storagePath(client.tenant_id as string, clientId, type);

  const { error } = await admin.storage
    .from('client-documents')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);
}

export async function getClientDocumentUrls(
  clientId: string
): Promise<Partial<Record<DocumentType, string>>> {
  const ALL: DocumentType[] = ['id_front', 'id_back', 'license_front', 'license_back'];
  const entries = await Promise.all(
    ALL.map(async (type) => {
      const url = await getClientDocumentUrl(clientId, type);
      return [type, url] as [DocumentType, string | null];
    })
  );
  return Object.fromEntries(entries.filter(([, url]) => url !== null)) as Partial<Record<DocumentType, string>>;
}

export async function checkClientDocumentsPublic(
  clientId: string
): Promise<DocumentType[]> {
  const admin = createSupabaseAdminClient();

  const { data: client, error } = await admin
    .from('clients')
    .select('tenant_id')
    .eq('id', clientId)
    .maybeSingle();

  if (error || !client?.tenant_id) return [];

  const prefix = `${client.tenant_id}/${clientId}`;
  const { data: files } = await admin.storage.from('client-documents').list(prefix);
  if (!files?.length) return [];

  const ALL: DocumentType[] = ['id_front', 'id_back', 'license_front', 'license_back'];
  const names = new Set(files.map((f) => f.name));
  return ALL.filter((t) => names.has(t));
}
