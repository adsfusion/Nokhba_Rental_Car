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

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as Client) ?? null;
}

export async function addClient(
  client: Omit<Client, 'id' | 'tenant_id' | 'created_at'>
): Promise<Client> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) throw new Error('No tenant ID found');

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...client, tenant_id: profile.tenant_id })
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) throw new Error('No tenant ID found');

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/clients');
  return data as Client;
}
