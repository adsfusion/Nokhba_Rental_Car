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

  // Convert base64 to buffer
  const base64Data = base64Signature.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const fileName = `${contractId}_signature_${Date.now()}.png`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('signatures')
    .upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error('Signature upload error:', uploadError);
    throw new Error('Failed to upload signature');
  }

  const { data: urlData } = supabase.storage
    .from('signatures')
    .getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from('contracts')
    .update({ 
      signature_url: urlData.publicUrl,
      signed_at: new Date().toISOString(),
      status: 'signed'
    })
    .eq('id', contractId);

  if (updateError) {
    console.error('Contract update error:', updateError);
    throw new Error('Failed to update contract');
  }

  return true;
}
