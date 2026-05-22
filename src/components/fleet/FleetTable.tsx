'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Car, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vehicle, Contract } from '@/types';
import { formatCurrency } from '@/lib/utils/format';

interface FleetTableProps {
  vehicles: Vehicle[];
  contracts: Contract[];
}

type FilterStatus = 'All' | 'available' | 'rented' | 'maintenance';

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    let dateVal = new Date(dateString);
    
    // Specifically handle local date parsing for simple YYYY-MM-DD strings without timezones
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      dateVal = new Date(dateString + 'T00:00:00');
    }

    if (isNaN(dateVal.getTime())) {
      return '—';
    }
    
    return dateVal.toLocaleDateString('fr-MA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return '—';
  }
}

export default function FleetTable({ vehicles, contracts }: FleetTableProps) {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const prefix = tenantSlug ? `/${tenantSlug}` : '';

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');

  const safeVehicles = vehicles || [];
  const safeContracts = contracts || [];

  const filteredVehicles =
    filterStatus === 'All' ? safeVehicles : safeVehicles.filter((v) => v.status === filterStatus);

  function statusBadgeClass(status: string) {
    return cn(
      'inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold',
      status === 'available' && 'border-green-200 bg-green-50 text-green-700',
      status === 'rented' && 'border-blue-200 bg-blue-50 text-blue-700',
      status === 'maintenance' && 'border-amber-200 bg-amber-50 text-amber-700'
    );
  }

  return (
    <>
      {/* ── Header bar ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Fleet Management</h2>
          <p className="text-sm text-slate-500">Monitor and manage your vehicle inventory with ease.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['All', 'available', 'rented', 'maintenance'] as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                  filterStatus === s
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <Link
            href={`${prefix}/fleet/new`}
            className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800"
          >
            <Car size={16} />
            Add Vehicle
          </Link>
        </div>
      </div>

      {/* ── Fleet Grid ────────────────────────────────────────── */}
      {filteredVehicles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          No vehicles found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const activeContract = safeContracts.find(
              (c) =>
                c.vehicle_id === vehicle.id &&
                c.status !== 'completed' &&
                c.status !== 'cancelled'
            );
            return (
              <Link
                key={vehicle.id}
                href={`${prefix}/fleet/${vehicle.id}/edit`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              >
                {/* Top Image Area */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-400">
                      <Car size={40} className="text-slate-500 opacity-60" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute right-3 top-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase backdrop-blur-md shadow-sm border',
                        vehicle.status === 'available' && 'bg-emerald-500/90 text-white border-emerald-400/20',
                        vehicle.status === 'rented' && 'bg-violet-600/90 text-white border-violet-500/20',
                        vehicle.status === 'maintenance' && 'bg-amber-500/90 text-white border-amber-400/20',
                        (vehicle.status !== 'available' && vehicle.status !== 'rented' && vehicle.status !== 'maintenance') && 'bg-slate-500/90 text-white border-slate-400/20'
                      )}
                    >
                      {vehicle.status || 'available'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 transition-colors">
                        {vehicle.brand || '—'} {vehicle.model || '—'}{' '}
                        <span className="font-normal text-slate-400">({vehicle.year || '—'})</span>
                      </h3>
                      <p className="mt-1 font-mono text-xs font-semibold text-slate-500">
                        License: {vehicle.license_plate || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Optional Metadata - Transmission & Fuel / Color */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {vehicle.vehicle_type && (
                      <span className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                        {vehicle.vehicle_type}
                      </span>
                    )}
                    {vehicle.transmission && (
                      <span className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                        {vehicle.transmission}
                      </span>
                    )}
                    {vehicle.fuel_type && (
                      <span className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                        {vehicle.fuel_type}
                      </span>
                    )}
                    {vehicle.color && (
                      <span className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                        {vehicle.color}
                      </span>
                    )}
                  </div>

                  {/* Info: Rental Period / Maintenance details */}
                  {vehicle.status === 'rented' && activeContract && (
                    <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-xs">
                      <p className="font-semibold text-violet-900">Rented Until</p>
                      <p className="mt-0.5 font-medium text-violet-700">
                        {formatDate(activeContract.start_date)} &rarr; {formatDate(activeContract.end_date)}
                      </p>
                    </div>
                  )}

                  {vehicle.status === 'maintenance' && (
                    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/40 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-amber-900">Maintenance</p>
                        {vehicle.updated_at && (
                          <span className="font-medium text-amber-700">
                            Expected: {formatDate(vehicle.updated_at)}
                          </span>
                        )}
                      </div>
                      {vehicle.notes && (
                        <p className="mt-1 font-medium text-amber-600 italic">
                          &ldquo;{vehicle.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Filler element if no status messages, to push the footer down */}
                  <div className="mt-auto" />

                  {/* Card Footer */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mileage</p>
                      <p className="mt-0.5 font-semibold text-slate-700">
                        {(vehicle.mileage || 0).toLocaleString()} km
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Rate</p>
                      <p className="mt-0.5 font-bold text-slate-900">
                        {vehicle.daily_rate ? formatCurrency(vehicle.daily_rate) : '—'}{' '}
                        <span className="text-xs font-normal text-slate-500">/ day</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
