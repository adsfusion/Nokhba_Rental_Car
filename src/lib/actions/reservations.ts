'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '../supabase/server';
import type { Reservation } from '@/types';

export type ReservationWithDetails = Reservation & {
  clients?: any;
  vehicles?: any;
};

export async function getReservations(): Promise<ReservationWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reservations')
    .select('*, clients(*), vehicles(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ReservationWithDetails[];
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
