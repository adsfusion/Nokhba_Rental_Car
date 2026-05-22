'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../supabase/server';
import type { Contract } from '@/types';

import { getCurrentTenantId } from '../utils/tenant';

export type ContractWithDetails = Contract & {
  clients?: any;
  vehicles?: any;
};

export async function getContracts(): Promise<ContractWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('Tenant ID required');

  const { data, error } = await supabase
    .from('contracts')
    .select('*, clients(*), vehicles(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ContractWithDetails[];
}

export async function getContractsByClientId(
  clientId: string
): Promise<ContractWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('Tenant ID required');

  const { data, error } = await supabase
    .from('contracts')
    .select('*, clients(*), vehicles(*)')
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId)
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

export async function getContractById(id: string): Promise<ContractWithDetails | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('*, clients(*), vehicles(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as ContractWithDetails | null;
}

export async function processContractReturn(
  contractId: string,
  vehicleId: string,
  data: { return_mileage: number; return_fuel_level: string; return_notes: string }
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  await supabase
    .from('contracts')
    .update({
      status: 'completed',
      returned_at: new Date().toISOString(),
      return_mileage: data.return_mileage,
      return_fuel_level: data.return_fuel_level,
      return_notes: data.return_notes || null,
    })
    .eq('id', contractId);

  await supabase
    .from('vehicles')
    .update({ status: 'available', mileage: data.return_mileage })
    .eq('id', vehicleId);

  revalidatePath('/contracts');
}

export async function getNextContractId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true });

  const seq = (count ?? 0) + 1001;
  return `CTR-${seq.toString().padStart(6, '0')}`;
}

export async function updateContractStatus(id: string, status: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  
  const { data: contract } = await supabase
    .from('contracts')
    .select('vehicle_id, status')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('contracts')
    .update({ status })
    .eq('id', id);

  if (error) throw error;

  if (contract?.vehicle_id && (status === 'completed' || status === 'cancelled' || status === 'COMPLETED' || status === 'CANCELLED')) {
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', contract.vehicle_id);
  }

  revalidatePath('/contracts');
}

export async function deleteContract(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  
  const { data: contract } = await supabase
    .from('contracts')
    .select('vehicle_id, status')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id);

  if (error) throw error;

  if (contract?.vehicle_id && (contract.status === 'active' || contract.status === 'signed' || contract.status === 'pending_signature')) {
    await supabase
      .from('vehicles')
      .update({ status: 'available' })
      .eq('id', contract.vehicle_id);
  }

  revalidatePath('/contracts');
}
