'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../supabase/server';
import type { Client } from '@/types';

export async function getClients(): Promise<Client[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function addClient(
  client: Omit<Client, 'id' | 'tenant_id' | 'created_at'>
): Promise<Client> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/clients');
  return data as Client;
}

export async function updateClient(
  id: string,
  updates: Partial<Client>
): Promise<Client> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/clients');
  return data as Client;
}
