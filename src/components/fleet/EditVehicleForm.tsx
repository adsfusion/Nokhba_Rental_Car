'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, ArrowLeft, ImagePlus, Trash2, ClipboardCheck } from 'lucide-react';
import { updateVehicle } from '@/lib/actions/vehicles';
import { useNotifications } from '@/components/layout/NotificationProvider';
import type { Vehicle, Contract } from '@/types';

interface Props {
  vehicle: Vehicle;
  contracts: Contract[];
  tenantSlug: string;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none transition-colors';

export default function EditVehicleForm({ vehicle, contracts, tenantSlug }: Props) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<Vehicle>(vehicle);

  function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, images: [...(prev.images || []), reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setForm((prev) => {
      const images = [...(prev.images || [])];
      images.splice(index, 1);
      return { ...prev, images };
    });
  }



  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateVehicle(vehicle.id, form);
        addNotification('Vehicle Updated', `${form.brand} ${form.model} has been updated.`, 'success');
        router.push(`/${tenantSlug}/fleet`);
        router.refresh();
      } catch (err) {
        addNotification('Error', err instanceof Error ? err.message : 'Failed to update vehicle.', 'error');
      }
    });
  }

  return (
    <>

      <div className="max-w-[896px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/${tenantSlug}/fleet`}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Fleet
          </Link>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              {form.images && form.images.length > 0 ? (
                <img src={form.images[0]} alt={form.brand} className="h-full w-full object-cover rounded-xl" />
              ) : (
                <Car size={24} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-slate-500 text-sm">{vehicle.year} · {vehicle.license_plate}</p>
            </div>
          </div>

          {vehicle.status === 'rented' && (
            <Link
              href={`/${tenantSlug}/fleet/${vehicle.id}/return`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ClipboardCheck size={16} />
              Process Return
            </Link>
          )}
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Edit Vehicle Details</h2>
            <p className="text-slate-500 text-sm mt-0.5">Update the information below.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Make & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Make</label>
                <input required type="text" value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Model</label>
                <input required type="text" value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className={inputClass} />
              </div>
            </div>

            {/* Year & Plate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Year</label>
                <input required type="number" value={form.year || ''}
                  onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                  className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Plate</label>
                <input required type="text" value={form.license_plate}
                  onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                  className={inputClass} />
              </div>
            </div>

            {/* Reg Date & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Registration Date</label>
                <input required type="date" value={form.created_at}
                  onChange={(e) => setForm({ ...form, created_at: e.target.value })}
                  className={`${inputClass} uppercase`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Color</label>
                <input required type="text" value={form.color || ''}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className={inputClass} />
              </div>
            </div>

            {/* Mileage */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Mileage (km)</label>
              <input required type="number" value={form.mileage || 0}
                onChange={(e) => setForm({ ...form, mileage: parseInt(e.target.value) })}
                className={inputClass} />
            </div>

            {/* Type & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle Type</label>
                <select required value={form.fuel_type || ''}
                  onChange={(e) => setForm({ ...form, fuel_type: e.target.value as any })}
                  className={inputClass}>
                  <option value="">— Select —</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Sport">Sport</option>
                  <option value="SUV">SUV</option>
                  <option value="Economy">Economy</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
                <select required value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle['status'] })}
                  className={inputClass}>
                  <option value="available">Available</option>
                  <option value="rented">In Use</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {/* Maintenance fields */}
            {form.status === 'maintenance' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-bold uppercase text-orange-800">Expected Return Date</label>
                  <input required type="date" value={form.updated_at || ''}
                    onChange={(e) => setForm({ ...form, updated_at: e.target.value })}
                    className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase text-orange-800">Reason</label>
                  <input required type="text" placeholder="e.g. Broken windshield"
                    value={form.notes || ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
                </div>
              </div>
            )}

            {/* Photos */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Photos</label>
              <div className="flex flex-wrap gap-3">
                {(form.images || []).map((photo, i) => (
                  <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-all group-hover:opacity-100">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-600">
                  <ImagePlus size={24} className="mb-1" />
                  <span className="text-[10px] font-bold">Add Photo</span>
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)} />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <Link href={`/${tenantSlug}/fleet`}
                className="px-5 py-2.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors text-sm">
                Cancel
              </Link>
              <button type="submit" disabled={isPending}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm">
                {isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
