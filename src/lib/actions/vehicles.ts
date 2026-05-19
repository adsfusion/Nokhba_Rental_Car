'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../supabase/server';
import type { Vehicle } from '@/types';

export async function getVehicles(): Promise<Vehicle[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Vehicle[];
}

export async function getAvailableVehicles(): Promise<Vehicle[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Vehicle[];
}

export async function addVehicle(
  vehicle: Omit<Vehicle, 'id' | 'tenant_id' | 'created_at'>,
  tenantSlug?: string
): Promise<Vehicle> {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let tenantId = '';

  // 1. Try to resolve tenant_id using the tenantSlug from page context
  if (tenantSlug) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();
    if (tenant?.id) {
      tenantId = tenant.id;
    }
  }

  // 2. Fallback to user's profile tenant_id
  if (!tenantId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();
    if (profile?.tenant_id) {
      tenantId = profile.tenant_id;
    }
  }

  if (!tenantId) throw new Error('No tenant ID found');

  // Strip columns that don't exist in the current database schema
  const { 
    insurance_expiry, 
    technical_inspection, 
    vehicle_type,
    registration_date,
    ...safeVehicle 
  } = vehicle as any;
  
  const { data, error } = await supabase
    .from('vehicles')
    .insert({ ...safeVehicle, tenant_id: tenantId })
    .select()
    .single();

  if (error) {
    if (error.code === 'P0001') {
      throw new Error('Subscription limit reached. Upgrade your plan to add more vehicles.');
    }
    throw error;
  }

  revalidatePath('/fleet');
  return data as Vehicle;
}

export async function updateVehicle(
  id: string,
  updates: Partial<Vehicle>
): Promise<Vehicle> {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) throw new Error('No tenant ID found');

  // Strip columns that don't exist in the current database schema
  const { 
    insurance_expiry, 
    technical_inspection, 
    vehicle_type,
    registration_date,
    ...safeUpdates 
  } = updates as any;

  const { data, error } = await supabase
    .from('vehicles')
    .update(safeUpdates)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/fleet');
  revalidatePath('/[tenantSlug]/fleet', 'page');
  return data as Vehicle;
}
