import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getClients } from '@/lib/actions/clients';
import { getVehicles } from '@/lib/actions/vehicles';
import { getReservations } from '@/lib/actions/reservations';
import NewReservationForm from '@/components/reservations/NewReservationForm';

export default async function NewReservationPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  // Parallel fetch client-side data requirements
  const [clients, vehicles, reservations] = await Promise.all([
    getClients(),
    getVehicles(),
    getReservations(),
  ]);

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
          Create New Reservation
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Input details to reserve a vehicle and track its booking schedule.
        </p>
      </div>

      {/* Main Reservation Form */}
      <NewReservationForm
        clients={clients}
        vehicles={vehicles}
        reservations={reservations}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}
