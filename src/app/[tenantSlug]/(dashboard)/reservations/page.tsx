import { Calendar, Plus } from 'lucide-react';
import Link from 'next/link';
import { getReservations } from '@/lib/actions/reservations';
import ReservationsTable from '@/components/reservations/ReservationsTable';

export default async function ReservationsPage({
  params
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const reservations = await getReservations(tenantSlug);

  return (
    <div className="max-w-[1200px] mx-auto p-6" dir="ltr">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-5 border-b border-slate-100 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Reservations</h1>
          <p className="text-slate-500 text-sm mt-1">Manage booking requests and vehicle scheduling.</p>
        </div>
        <Link
          href={`/${tenantSlug}/reservations/new`}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Reservation
        </Link>
      </div>

      {/* Conditionally Render Empty State or Reservations Table */}
      {reservations.length === 0 ? (
        <div className="border border-slate-200 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center bg-white shadow-sm w-full max-w-md mx-auto">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-6">
            <Calendar size={28} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2 w-full">No reservations found</h3>
          <p className="text-slate-500 w-full text-sm leading-relaxed mb-6">
            Create booking slots, block vehicle availability, and schedule client reservations.
          </p>
          <Link
            href={`/${tenantSlug}/reservations/new`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <Plus size={16} />
            Create Reservation
          </Link>
        </div>
      ) : (
        <ReservationsTable reservations={reservations} tenantSlug={tenantSlug} />
      )}
    </div>
  );
}
