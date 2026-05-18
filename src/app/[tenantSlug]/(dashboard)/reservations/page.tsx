import { BookMarked } from 'lucide-react';

export default function ReservationsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-300">
        <BookMarked size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reservations</h2>
      <p className="text-slate-500 text-sm max-w-xs">
        Advance booking and reservation management is coming soon.
      </p>
    </div>
  );
}
