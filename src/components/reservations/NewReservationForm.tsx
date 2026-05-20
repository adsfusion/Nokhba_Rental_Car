'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Calendar, AlertCircle } from 'lucide-react';
import { addReservation } from '@/lib/actions/reservations';
import { useNotifications } from '@/components/layout/NotificationProvider';
import type { Client, Vehicle, Reservation } from '@/types';

// ── Shared style tokens ───────────────────────────────────────────────────────
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none transition-colors';
const selectClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none transition-colors appearance-none cursor-pointer';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5';

interface Props {
  clients: Client[];
  vehicles: Vehicle[];
  reservations: Reservation[];
  tenantSlug: string;
}

// ── Timezone-safe local date string builder ────────────────────────────────────
function toLocalDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function NewReservationForm({ clients, vehicles, reservations, tenantSlug }: Props) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<'PENDING' | 'CONFIRMED'>('PENDING');
  const [notes, setNotes] = useState('');

  // Hydration-safe initial local dates on client mount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setStartDate(toLocalDateString(now));
    setEndDate(toLocalDateString(tomorrow));
    setIsMounted(true);
  }, []);

  // Format date state string for input binding, handling timezone suffix removal
  const formatForInput = (val: string) => {
    if (!val) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return val;
    }
    const date = new Date(val);
    return isNaN(date.getTime()) ? '' : toLocalDateString(date);
  };


  // 1. Reactive overlap filter for vehicles
  const availableVehicles = useMemo(() => {
    if (!startDate || !endDate) {
      // If dates aren't set, display all vehicles
      return vehicles;
    }

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    if (isNaN(startMs) || isNaN(endMs) || startMs >= endMs) {
      return [];
    }

    return vehicles.filter((vehicle) => {
      // Find any overlapping reservation for THIS vehicle that is PENDING or CONFIRMED
      const hasOverlap = reservations.some((res) => {
        if (res.vehicle_id !== vehicle.id) return false;
        if (res.status !== 'PENDING' && res.status !== 'CONFIRMED') return false;

        const resStartMs = new Date(res.start_date).getTime();
        const resEndMs = new Date(res.end_date).getTime();

        // (new_start_date < existing_end_date) && (new_end_date > existing_start_date)
        return startMs < resEndMs && endMs > resStartMs;
      });

      return !hasOverlap;
    });
  }, [startDate, endDate, vehicles, reservations]);

  // 2. Auto-calculate price
  useEffect(() => {
    if (!startDate || !endDate || !vehicleId) {
      return;
    }

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    if (isNaN(startMs) || isNaN(endMs) || startMs >= endMs) {
      setTotalAmount('');
      return;
    }

    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
    if (!selectedVehicle) {
      setTotalAmount('');
      return;
    }

    const diffTime = endMs - startMs;
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const dailyRate = selectedVehicle.daily_rate || 0;
    
    setTotalAmount(diffDays * dailyRate);
  }, [startDate, endDate, vehicleId, vehicles]);

  // Clear selected vehicle if it becomes unavailable due to date change
  useEffect(() => {
    if (vehicleId && !availableVehicles.some((v) => v.id === vehicleId)) {
      setVehicleId('');
    }
  }, [availableVehicles, vehicleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || !vehicleId || !startDate || !endDate || totalAmount === '') {
      addNotification('Error', 'Please fill in all required fields.', 'error');
      return;
    }

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    if (startMs >= endMs) {
      addNotification('Error', 'End Date must be after Start Date.', 'error');
      return;
    }

    startTransition(async () => {
      try {
        await addReservation({
          client_id: clientId,
          vehicle_id: vehicleId,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          total_amount: Number(totalAmount),
          status,
          notes: notes || null,
        });

        addNotification('Success', 'Reservation created successfully.', 'success');
        router.push(`/${tenantSlug}/reservations`);
      } catch (err: any) {
        console.error('Failed to create reservation:', err);
        addNotification('Error', err.message || 'Failed to create reservation.', 'error');
      }
    });
  };

  return (
    <form dir="ltr" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Client Select */}
          <div className="space-y-1.5 md:col-span-12">
            <label className={labelClass}>Client</label>
            <div className="relative">
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className={selectClass}
              >
                <option value="">— Select Client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5 md:col-span-6">
            <label className={labelClass}>Start Date</label>
            {isMounted ? (
              <input
                required
                type="date"
                value={formatForInput(startDate)}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            ) : (
              <input
                disabled
                type="date"
                className={inputClass}
              />
            )}
          </div>

          {/* End Date */}
          <div className="space-y-1.5 md:col-span-6">
            <label className={labelClass}>End Date</label>
            {isMounted ? (
              <input
                required
                type="date"
                value={formatForInput(endDate)}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            ) : (
              <input
                disabled
                type="date"
                className={inputClass}
              />
            )}
          </div>

          {/* Vehicle Select */}
          <div className="space-y-1.5 md:col-span-8">
            <label className={labelClass}>Vehicle</label>
            <div className="relative">
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={!startDate || !endDate}
                className={selectClass}
              >
                {!startDate || !endDate ? (
                  <option value="">— Set Dates First —</option>
                ) : (
                  <>
                    <option value="">— Select Available Vehicle —</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.license_plate}) — MAD {v.daily_rate}/day
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            {startDate && endDate && availableVehicles.length === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 mt-1">
                <AlertCircle size={12} />
                <span>No available vehicles for these dates.</span>
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="space-y-1.5 md:col-span-4">
            <label className={labelClass}>Total Amount (MAD)</label>
            <input
              required
              type="number"
              min={0}
              step="any"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          {/* Status Select */}
          <div className="space-y-1.5 md:col-span-12">
            <label className={labelClass}>Status</label>
            <div className="relative">
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as 'PENDING' | 'CONFIRMED')}
                className={selectClass}
              >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 md:col-span-12">
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Any additional details or requirements..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href={`/${tenantSlug}/reservations`}
          className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors rounded-xl text-sm font-semibold"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition-colors rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving...' : 'Create Reservation'}
        </button>
      </div>
    </form>
  );
}
