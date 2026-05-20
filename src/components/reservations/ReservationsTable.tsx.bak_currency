'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { PenLine, Trash2, Calendar, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteReservation, type ReservationWithDetails } from '@/lib/actions/reservations';
import { useNotifications } from '@/components/layout/NotificationProvider';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 border-amber-200 text-amber-700' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-green-50 border-green-200 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-50 border-red-200 text-red-600' },
  COMPLETED: { label: 'Completed', className: 'bg-slate-50 border-slate-200 text-slate-500' },
};

type Props = {
  reservations: ReservationWithDetails[];
  tenantSlug: string;
};

export default function ReservationsTable({ reservations, tenantSlug }: Props) {
  const { addNotification } = useNotifications();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteReservation(id);
        addNotification('Success', 'Reservation deleted successfully.', 'success');
      } catch (err: any) {
        console.error('Failed to delete reservation:', err);
        addNotification('Error', err.message || 'Failed to delete reservation.', 'error');
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm" dir="ltr">
      {/* Table Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Active Reservations</h3>
        <span className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 rounded-full px-2.5 py-1">
          {reservations.length} total
        </span>
      </div>

      {/* Row Listing (Matches the premium ContractList style) */}
      <div className="divide-y divide-slate-100">
        {reservations.map((res) => {
          const statusCfg = STATUS_CONFIG[res.status] ?? {
            label: res.status,
            className: 'bg-slate-100 border-slate-200 text-slate-600',
          };

          return (
            <div
              key={res.id}
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
            >
              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 min-w-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Client</p>
                  <p className="text-sm font-bold text-slate-900">{res.clients?.full_name || 'N/A'}</p>
                  <p className="text-xs text-slate-500">{res.clients?.phone || ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Vehicle</p>
                  <p className="text-sm font-bold text-slate-900">
                    {res.vehicles ? `${res.vehicles.brand} ${res.vehicles.model}` : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500">{res.vehicles?.license_plate || ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Dates</p>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    {new Date(res.start_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500 ml-3.5">
                    to {new Date(res.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total</p>
                  <p className="text-sm font-bold text-slate-900">MAD {res.total_amount}</p>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase tracking-wide border',
                      statusCfg.className
                    )}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 md:justify-end">
                <Link
                  href={`/${tenantSlug}/reservations/${res.id}/edit`}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                  title="Edit Reservation"
                >
                  <PenLine size={16} />
                </Link>
                <button
                  onClick={() => handleDelete(res.id)}
                  disabled={isPending}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all disabled:opacity-50"
                  title="Delete Reservation"
                >
                  {isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
