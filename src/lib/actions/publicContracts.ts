'use server';

import { createSupabaseAdminClient } from '../supabase/admin';

export async function getPublicContractDetails(contractId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select(`
      *,
      clients:client_id (*),
      vehicles:vehicle_id (*)
    `)
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    console.error('Error fetching public contract:', contractError);
    return null;
  }

  return contract;
}

export async function submitContractSignature(contractId: string, base64Signature: string) {
  const supabase = createSupabaseAdminClient();

  // Convert base64 data URL to raw buffer — strip any MIME prefix regardless of format
  const base64Data = base64Signature.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Always store as PNG with a deterministic path so old signed-URL references still work
  const filePath = `${contractId}_signature_${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from('signatures')
    .upload(filePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error('Signature upload error:', uploadError);
    throw new Error('Failed to upload signature');
  }

  // Store only the STORAGE PATH — NOT a public URL.
  // The 'signatures' bucket is private; getPublicUrl() would return a URL that
  // 403s at fetch time, silently encoding an HTML error page as base64 and
  // triggering jsPDF "wrong PNG signature" crash on download.
  // We generate a fresh signed URL at PDF-download time via getSignatureSignedUrl().
  const storagePath = `signatures/${filePath}`;

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      signature_url: storagePath,
      signed_at: new Date().toISOString(),
      status: 'signed',
      terms_accepted: true,
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('Contract update error:', updateError);
    throw new Error('Failed to update contract');
  }

  return true;
}

/**
 * Generates a short-lived (60 s) signed URL for a private signature file.
 * Called server-side so the service-role key is never exposed to the browser.
 *
 * @param storagePath  The path stored in contracts.signature_url,
 *                     e.g. "signatures/<contractId>_signature_<ts>.png"
 *                     OR a legacy full public URL (handled gracefully).
 */
export async function getSignatureSignedUrl(storagePath: string): Promise<string> {
  // Legacy rows may still have a full https:// URL stored.  Extract the path
  // segment after "/object/public/signatures/" or return the URL as-is so the
  // existing fetch-with-canvas fallback in signatureToBase64.ts can handle it.
  let filePath = storagePath;
  if (storagePath.startsWith('http')) {
    // Try to extract: …/storage/v1/object/public/signatures/<path>
    const match = storagePath.match(/\/object\/(?:public|sign)\/signatures\/(.+?)(?:\?|$)/);
    if (match) {
      filePath = match[1];
    } else {
      // Unknown legacy format — return as-is and let the canvas re-encoder try
      return storagePath;
    }
  } else if (storagePath.startsWith('signatures/')) {
    filePath = storagePath.replace(/^signatures\//, '');
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from('signatures')
    .createSignedUrl(filePath, 60); // 60-second TTL — enough for PDF generation

  if (error || !data?.signedUrl) {
    console.error('[getSignatureSignedUrl] Failed to create signed URL:', error);
    throw new Error(`Could not generate a signed URL for the signature file: ${error?.message ?? 'unknown error'}`);
  }

  return data.signedUrl;
}

