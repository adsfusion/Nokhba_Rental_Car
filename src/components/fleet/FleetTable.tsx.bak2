'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Car, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vehicle, Contract } from '@/types';

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

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Plate / Year</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Mileage</th>
                <th className="hidden px-6 py-4 md:table-cell">Rental Period</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => {
                const activeContract = safeContracts.find(
                  (c) =>
                    c.vehicle_id === vehicle.id &&
                    c.status !== 'completed' &&
                    c.status !== 'cancelled'
                );
                return (
                  <tr key={vehicle.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                          {vehicle.images && vehicle.images.length > 0 ? (
                            <img
                              src={vehicle.images[0]}
                              alt={vehicle.brand || 'Vehicle'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Car size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {vehicle.brand || '—'} {vehicle.model || '—'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {vehicle.vehicle_type || vehicle.fuel_type || '—'} &bull; {vehicle.color || 'Unspecified'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="mb-1 inline-block rounded bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-600">
                        {vehicle.license_plate || '—'}
                      </div>
                      <p className="text-left text-xs text-slate-500">
                        {vehicle.year || '—'} &bull; Reg:{' '}
                        {formatDate(vehicle.registration_date)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={statusBadgeClass(vehicle.status || 'available')}>{vehicle.status || 'available'}</span>
                      {vehicle.status === 'maintenance' && vehicle.notes && (
                        <div
                          className="max-w-[120px] truncate text-[10px] font-medium text-amber-600"
                          title={vehicle.notes}
                        >
                          {vehicle.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {(vehicle.mileage || 0).toLocaleString()} km
                      </p>
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      {vehicle.status === 'rented' && activeContract ? (
                        <div className="text-xs">
                          <p className="font-semibold text-slate-900">{formatDate(activeContract.start_date)} &rarr;</p>
                          <p className="text-slate-500">{formatDate(activeContract.end_date)}</p>
                        </div>
                      ) : vehicle.status === 'maintenance' && vehicle.updated_at ? (
                        <div className="text-xs">
                          <p className="font-semibold text-orange-600">Expected Return</p>
                          <p className="font-medium text-orange-500">{formatDate(vehicle.updated_at)}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`${prefix}/fleet/${vehicle.id}/edit`}
                        className="inline-block rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No vehicles found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
