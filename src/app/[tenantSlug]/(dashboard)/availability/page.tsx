import { CalendarCheck } from 'lucide-react';

export default function AvailabilityPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-300">
        <CalendarCheck size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Availability</h2>
      <p className="text-slate-500 text-sm max-w-xs">
        Vehicle availability calendar and scheduling tools are coming soon.
      </p>
    </div>
  );
}
