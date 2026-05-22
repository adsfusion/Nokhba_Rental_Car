'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../supabase/server';
import type { Reservation } from '@/types';

import { getCurrentTenantId } from '../utils/tenant';

export type ReservationWithDetails = Reservation & {
  clients?: any;
  vehicles?: any;
};

export async function getReservations(tenantSlug?: string): Promise<ReservationWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('Tenant ID required');

  const { data, error } = await supabase
    .from('reservations')
    .select('*, clients(*), vehicles(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ReservationWithDetails[];
}

export async function getReservationById(id: string): Promise<ReservationWithDetails | null> {
  const supabase = await createSupabaseServerClient();
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('Tenant ID required');

  const { data, error } = await supabase
    .from('reservations')
    .select('*, clients(*), vehicles(*)')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching reservation by ID:', error);
    return null;
  }
  return data as ReservationWithDetails;
}

export async function addReservation(
  reservation: Omit<Reservation, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
): Promise<Reservation> {
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
    .from('reservations')
    .insert({ ...reservation, tenant_id: profile.tenant_id })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/reservations');
  return data as Reservation;
}

export async function updateReservation(
  id: string,
  reservation: Partial<Omit<Reservation, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<Reservation> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reservations')
    .update(reservation)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/reservations');
  revalidatePath(`/reservations/${id}/edit`);
  return data as Reservation;
}

export async function deleteReservation(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/reservations');
}
