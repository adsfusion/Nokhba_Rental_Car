import { createSupabaseServerClient } from '@/lib/supabase/server';
import { type Vehicle, type Contract, type Reservation } from '@/types';
import { redirect } from 'next/navigation';
import { ClientCalendarWrapper } from '@/components/availability/ClientCalendarWrapper';

import { getProfile } from '@/lib/actions/auth';

export default async function AvailabilityPage(props: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await props.params;
  const searchParams = await props.searchParams;
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  const tenantId = profile.tenant_id;
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();

  if (searchParams.year && searchParams.month) {
    const pYear = parseInt(searchParams.year as string, 10);
    const pMonth = parseInt(searchParams.month as string, 10);
    const pDay = searchParams.day ? parseInt(searchParams.day as string, 10) : 1;
    if (!isNaN(pYear) && !isNaN(pMonth)) {
      year = pYear;
      month = pMonth;
      if (!isNaN(pDay)) day = pDay;
    }
  }

  // Window: 1 month before requested to 2 months after requested
  const viewStart = new Date(year, month - 1, 1);
  const viewEnd = new Date(year, month + 2, 0);

  const viewStartStr = viewStart.toISOString().split('T')[0];
  const viewEndStr = viewEnd.toISOString().split('T')[0];

  const [vehiclesRes, contractsRes, reservationsRes, maintenanceRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('*')
      .eq('tenant_id', tenantId)
      .neq('status', 'inactive')
      .order('brand', { ascending: true }),
    supabase
      .from('contracts')
      .select('*, clients(*)')
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelled')
      .lte('start_date', viewEndStr)
      .gte('end_date', viewStartStr),
    supabase
      .from('reservations')
      .select('*, clients(*)')
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelled')
      .lte('start_date', viewEndStr)
      .gte('end_date', viewStartStr),
    supabase
      .from('vehicle_maintenance')
      .select('*')
      .eq('tenant_id', tenantId)
      .lte('start_date', viewEndStr)
      .gte('end_date', viewStartStr)
  ]);

  const vehicles = vehiclesRes.data as Vehicle[] || [];
  const contracts = contractsRes.data || [];
  const reservations = reservationsRes.data || [];
  const maintenances = maintenanceRes.data || [];

  if (contractsRes.error) console.error("🔥 DIAGNOSTIC - CONTRACTS DB ERROR:", contractsRes.error);
  if (reservationsRes.error) console.error("🔥 DIAGNOSTIC - RESERVATIONS DB ERROR:", reservationsRes.error);
  if (maintenanceRes.error) console.error("🔥 DIAGNOSTIC - MAINTENANCE DB ERROR:", maintenanceRes.error);

  console.log("🔥 DIAGNOSTIC - PAGE.TSX FETCHED:", { contracts: contracts.length, reservations: reservations.length, maintenances: maintenances.length });

  return (
    <div className="px-4 md:px-6 lg:px-8 pb-8 max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
          Fleet Availability
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Operational command center for tracking reservations and active rentals.
        </p>
      </div>

      <ClientCalendarWrapper 
        vehicles={vehicles}
        contracts={contracts}
        reservations={reservations}
        maintenances={maintenances}
        viewStart={viewStartStr}
        viewEnd={viewEndStr}
        tenantSlug={resolvedParams.tenantSlug}
        initialYear={year}
        initialMonth={month}
        initialDay={day}
      />
    </div>
  );
}
