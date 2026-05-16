import { getPublicContractDetails } from '@/lib/actions/publicContracts';
import MobileSignaturePad from '@/components/contracts/MobileSignaturePad';
import { Car, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Sign Contract | Nokhba Rental',
  description: 'Review and sign your vehicle rental agreement.',
};

export default async function SignContractPage({ params }: { params: { contractId: string } }) {
  const { contractId } = await params;
  const contract = await getPublicContractDetails(contractId);

  if (!contract) {
    notFound();
  }

  const client = contract.clients;
  const vehicle = contract.vehicles;

  if (contract.status === 'signed') {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Already Signed</h2>
          <p className="text-slate-500">This contract has already been signed and finalized.</p>
        </div>
      </main>
    );
  }

  const total = contract.daily_rate * contract.total_days + (contract.deposit_amount || 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="w-full max-w-md mx-auto bg-white min-h-screen sm:min-h-0 sm:my-8 sm:rounded-[2rem] sm:shadow-2xl sm:shadow-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] sm:rounded-t-[2rem]">
          <h1 className="text-2xl font-black tracking-tight mb-1">NOKHBA</h1>
          <p className="text-slate-400 text-sm font-medium">Rental Agreement</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Welcome Message */}
          <div>
            <h2 className="text-xl font-bold text-slate-900">Hello, {client?.full_name}</h2>
            <p className="text-slate-500 text-sm mt-1">
              Please review your rental details and sign below.
            </p>
          </div>

          {/* Rental Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Rental Summary
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-700">
                <Car size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-900">{vehicle?.brand} {vehicle?.model}</p>
                <p className="text-xs text-slate-500">{vehicle?.license_plate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-700">
                <Calendar size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-900">{contract.total_days} Days</p>
                <p className="text-xs text-slate-500">{contract.start_date} to {contract.end_date}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-700">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-900">{total} EUR Total</p>
                <p className="text-xs text-slate-500">Includes {contract.deposit_amount} EUR deposit</p>
              </div>
            </div>
          </div>

          {/* Terms Snippet */}
          <div className="flex gap-3 bg-blue-50 text-blue-900 p-4 rounded-2xl text-sm leading-relaxed">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>
              By signing below, you agree to the agency's terms and conditions. The vehicle must be returned in the same condition with the same fuel level.
            </p>
          </div>

          {/* Signature Area */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Your Signature</h3>
            <MobileSignaturePad contractId={contract.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
