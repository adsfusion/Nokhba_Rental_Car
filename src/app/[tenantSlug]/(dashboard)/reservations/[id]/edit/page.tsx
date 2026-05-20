import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getClients } from '@/lib/actions/clients';
import { getVehicles } from '@/lib/actions/vehicles';
import { getReservationById, getReservations } from '@/lib/actions/reservations';
import EditReservationForm from '@/components/reservations/EditReservationForm';

export default async function EditReservationPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; id: string }>;
}) {
  const { tenantSlug, id } = await params;

  // Parallel fetch necessary data context
  const [reservation, clients, vehicles, reservations] = await Promise.all([
    getReservationById(id),
    getClients(),
    getVehicles(),
    getReservations(),
  ]);

  if (!reservation) {
    notFound();
  }

  return (
    <div className="max-w-[896px] mx-auto p-6" dir="ltr">
      {/* Navigation & Header */}
      <div className="mb-8">
        <Link
          href={`/${tenantSlug}/reservations`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4 font-medium"
        >
          <ArrowLeft size={16} />
          Back to Reservations
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Edit Reservation
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Modify the schedule, selected vehicle, client details, or status of this reservation.
        </p>
      </div>

      {/* Main Edit Reservation Form */}
      <EditReservationForm
        reservation={reservation}
        clients={clients}
        vehicles={vehicles}
        reservations={reservations}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}
