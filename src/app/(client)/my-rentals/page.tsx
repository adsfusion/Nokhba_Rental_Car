import { Car } from 'lucide-react';

export default function MyRentalsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Rentals</h2>
        <p className="text-slate-500 text-sm">Manage your current and past vehicle rentals.</p>
      </div>

      <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-sm text-center py-20">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Rentals</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          You don&apos;t have any ongoing rentals at the moment. Contact your agency to start a new
          contract.
        </p>
      </div>
    </div>
  );
}
