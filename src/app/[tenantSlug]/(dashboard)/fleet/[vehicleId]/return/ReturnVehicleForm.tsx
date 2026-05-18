'use client';

import { useState, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, ImagePlus, ArrowLeft } from 'lucide-react';
import type { ContractWithDetails as Contract } from '@/lib/actions/contracts';
import { updateContract } from '@/lib/actions/contracts';
import { updateVehicle } from '@/lib/actions/vehicles';

export type Damage = any;

interface ReturnVehicleFormProps {
  contract: Contract;
}

export default function ReturnVehicleForm({ contract }: ReturnVehicleFormProps) {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const [isPending, startTransition] = useTransition();

  const startMileage = ((contract.extra_data as any)?.vehicle_start_mileage || 0) || 0;
  const [returnMileage, setReturnMileage] = useState<number>(startMileage);
  const [returnFuelLevel, setReturnFuelLevel] = useState<string>('Full');
  const [returnCondition, setReturnCondition] = useState<string>('Good');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [returnDamages, setReturnDamages] = useState<Damage[]>([]);
  const [checklist, setChecklist] = useState({ mileage: false, fuel: false, condition: false });

  const isMileageInvalid = returnMileage < startMileage;
  const isDisabled =
    isMileageInvalid || !checklist.mileage || !checklist.fuel || !checklist.condition || isPending;

  function handleConfirmReturn() {
    startTransition(async () => {
      await updateContract(contract.id, {
        status: 'completed',
        notes: returnNotes,
      });

      await updateVehicle(contract.vehicle_id, {
        status: 'available',
        mileage: returnMileage,
      });

      router.push(`/${tenantSlug}/fleet/${contract.vehicle_id}/edit`);
      router.refresh();
    });
  }

  function addDamage() {
    const newDamage: Damage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Minor',
      description: '',
      photos: [],
    };
    setReturnDamages((prev) => [...prev, newDamage]);
  }

  function removeDamage(index: number) {
    setReturnDamages((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDamage(index: number, updates: Partial<Damage>) {
    setReturnDamages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }

  function removePhoto(damageIndex: number, photoIndex: number) {
    setReturnDamages((prev) => {
      const next = [...prev];
      const photos = [...(next[damageIndex].photos || [])];
      photos.splice(photoIndex, 1);
      next[damageIndex] = { ...next[damageIndex], photos };
      return next;
    });
  }

  function handlePhotoUpload(damageIndex: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReturnDamages((prev) => {
          const next = [...prev];
          const photos = [...(next[damageIndex].photos || []), reader.result as string];
          next[damageIndex] = { ...next[damageIndex], photos };
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="max-w-[672px] mx-auto space-y-6">
      <Link
        href={`/${tenantSlug}/fleet/${contract.vehicle_id}/edit`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Vehicle
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-surface-container-lowest bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 p-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Process Return
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {contract.vehicles?.brand} {contract.vehicles?.model} — Contract #{contract.contract_number}
          </p>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Return Mileage */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Return Mileage (km)
              </label>
              <input
                type="number"
                value={returnMileage}
                onChange={(e) => setReturnMileage(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:border-slate-900 focus:outline-none transition-colors"
              />
              {isMileageInvalid && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  Must be ≥ {startMileage} km
                </p>
              )}
            </div>

            {/* Fuel Level */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Fuel Level
              </label>
              <select
                value={returnFuelLevel}
                onChange={(e) => setReturnFuelLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:border-slate-900 focus:outline-none transition-colors"
              >
                <option value="Empty">Empty (0)</option>
                <option value="1/4">1/4</option>
                <option value="1/2">1/2</option>
                <option value="3/4">3/4</option>
                <option value="Full">Full</option>
              </select>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Condition
            </label>
            <select
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:border-slate-900 focus:outline-none transition-colors"
            >
              <option value="Good">Good (No new damages)</option>
              <option value="Minor">Minor Damage</option>
              <option value="Major">Major Damage</option>
            </select>
          </div>

          {/* Damages */}
          <div className="border-t border-slate-100 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Reported Damages
              </label>
              <button
                type="button"
                onClick={addDamage}
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-200"
              >
                <Plus size={14} />
                Add Damage
              </button>
            </div>

            <div className="space-y-4">
              {returnDamages.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center text-sm text-slate-400">
                  No damages reported.
                </p>
              ) : (
                returnDamages.map((damage, index) => (
                  <div
                    key={damage.id}
                    className="relative rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <button
                      onClick={() => removeDamage(index)}
                      className="absolute right-3 top-3 text-slate-400 transition-colors hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                      <div className="sm:col-span-1">
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Type
                        </label>
                        <select
                          value={damage.type}
                          onChange={(e) =>
                            updateDamage(index, { type: e.target.value as 'Minor' | 'Major' })
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs focus:border-slate-900 focus:outline-none"
                        >
                          <option value="Minor">Minor</option>
                          <option value="Major">Major</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Description
                        </label>
                        <input
                          type="text"
                          value={damage.description}
                          onChange={(e) => updateDamage(index, { description: e.target.value })}
                          placeholder="e.g. Scratch on front bumper"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Photos
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {damage.photos?.map((photo: any, i: number) => (
                          <div
                            key={i}
                            className="group relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200"
                          >
                            <img src={photo} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(index, i)}
                              className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-all group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-slate-400 hover:bg-white">
                          <ImagePlus size={16} className="mb-0.5" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(index, e.target.files)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="border-t border-slate-100 pt-6">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Additional Notes
            </label>
            <textarea
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              rows={3}
              placeholder="Any other comments..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm bg-slate-50 focus:border-slate-900 focus:outline-none transition-colors"
            />
          </div>

          {/* Confirmation Checklist */}
          <div className="space-y-3 border-t border-slate-100 pt-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Confirmation Checklist
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition-colors hover:bg-slate-100">
              <input
                type="checkbox"
                checked={checklist.mileage}
                onChange={(e) => setChecklist({ ...checklist, mileage: e.target.checked })}
                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">
                Mileage checked and verified against dashboard
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition-colors hover:bg-slate-100">
              <input
                type="checkbox"
                checked={checklist.fuel}
                onChange={(e) => setChecklist({ ...checklist, fuel: e.target.checked })}
                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">
                Fuel level confirmed and matches report
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition-colors hover:bg-slate-100">
              <input
                type="checkbox"
                checked={checklist.condition}
                onChange={(e) => setChecklist({ ...checklist, condition: e.target.checked })}
                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">
                Vehicle exterior and interior condition inspected
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex justify-end gap-3">
          <Link
            href={`/${tenantSlug}/fleet/${contract.vehicle_id}/edit`}
            className="px-6 py-2.5 font-semibold text-slate-500 hover:text-slate-900 transition-colors text-sm rounded-xl"
          >
            Cancel
          </Link>
          <button
            onClick={handleConfirmReturn}
            disabled={isDisabled}
            className="rounded-xl bg-slate-900 px-8 py-2.5 font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-50 transition-all text-sm"
          >
            {isPending ? 'Processing...' : 'Confirm Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
