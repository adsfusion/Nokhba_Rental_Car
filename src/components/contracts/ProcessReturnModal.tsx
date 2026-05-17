'use client';

import { useState, useTransition } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Fuel, Gauge, FileText, CheckCircle2, X } from 'lucide-react';
import { processContractReturn } from '@/lib/actions/contracts';
import { useNotifications } from '@/components/layout/NotificationProvider';
import { type ContractWithDetails } from '@/lib/actions/contracts';

type Props = {
  contract: ContractWithDetails;
  onClose: () => void;
};

const FUEL_OPTIONS = ['Empty', '1/4', '1/2', '3/4', 'Full'] as const;

const inputClass =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm';

export function ProcessReturnModal({ contract, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addNotification } = useNotifications();

  const startMileage = (contract.extra_data?.vehicle_start_mileage as number | undefined) ?? 0;
  const [returnMileage, setReturnMileage] = useState<string>(startMileage > 0 ? String(startMileage) : '');
  const [fuelLevel, setFuelLevel] = useState<string>('Full');
  const [returnNotes, setReturnNotes] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const mileageNum = Number(returnMileage);
    if (!returnMileage || isNaN(mileageNum)) {
      setError('Please enter the return mileage.');
      return;
    }
    if (mileageNum < startMileage) {
      setError(`Return mileage must be ≥ start mileage (${startMileage} km).`);
      return;
    }
    setError('');

    startTransition(async () => {
      await processContractReturn(contract.id, contract.vehicle_id, {
        return_mileage: mileageNum,
        return_fuel_level: fuelLevel,
        return_notes: returnNotes,
      });
      addNotification(
        'Vehicle Returned',
        `${contract.vehicles?.brand} ${contract.vehicles?.model} is now available.`,
        'success'
      );
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 overflow-y-auto pointer-events-none">
        <div className="flex min-h-full items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pointer-events-auto bg-white rounded-3xl w-full max-w-md shadow-2xl my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Process Return</h3>
                <p className="text-xs text-slate-500 mt-0.5">{contract.contract_number}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 space-y-5 mt-4">
              {/* Vehicle summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {contract.vehicles?.brand} {contract.vehicles?.model}
                  </p>
                  <p className="text-xs text-slate-500">
                    {contract.clients?.full_name} · {contract.total_days} days
                  </p>
                </div>
              </div>

              {/* Return Mileage */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Gauge size={12} /> Return Mileage (km)
                </label>
                <input
                  type="number"
                  min={startMileage}
                  value={returnMileage}
                  onChange={(e) => { setReturnMileage(e.target.value); setError(''); }}
                  placeholder={startMileage > 0 ? `Min: ${startMileage} km` : 'e.g. 45000'}
                  className={inputClass}
                />
                {startMileage > 0 && (
                  <p className="text-[10px] text-slate-400">Start mileage: {startMileage.toLocaleString()} km</p>
                )}
              </div>

              {/* Fuel Level */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Fuel size={12} /> Fuel Level at Return
                </label>
                <div className="flex gap-2">
                  {FUEL_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFuelLevel(opt)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                        fuelLevel === opt
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Return Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText size={12} /> Return Notes (optional)
                </label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={3}
                  placeholder="Any damage, observations, or notes…"
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 font-semibold">{error}</p>
              )}

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={15} />
                  {isPending ? 'Processing…' : 'Confirm Return'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
