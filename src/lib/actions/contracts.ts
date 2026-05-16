'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../supabase/server';
import type { Contract } from '@/types';

export type ContractWithDetails = Contract & {
  clients?: any;
  vehicles?: any;
};

export async function getContracts(): Promise<ContractWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('*, clients(*), vehicles(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ContractWithDetails[];
}

export async function addContract(
  contract: Omit<Contract, 'id' | 'tenant_id' | 'created_at'>
): Promise<Contract> {
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
    .from('contracts')
    .insert({ ...contract, tenant_id: profile.tenant_id })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/contracts');
  return data as Contract;
}

export async function updateContract(
  id: string,
  updates: Partial<Contract>
): Promise<Contract> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/contracts');
  return data as Contract;
}

export async function getNextContractId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true });

  const seq = (count ?? 0) + 1001;
  return `CTR-${seq.toString().padStart(6, '0')}`;
}
