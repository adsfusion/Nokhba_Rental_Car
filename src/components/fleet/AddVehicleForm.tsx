'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';
import { addVehicle } from '@/lib/actions/vehicles';
import { useNotifications } from '@/components/layout/NotificationProvider';

type NewVehicleForm = {
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | null;
  created_at: string;
  color: string;
  mileage: number;
  images: string[];
  notes?: string;
  transmission: 'automatic' | 'manual' | null;
  daily_rate: number | null;
  weekly_rate: number | null;
  monthly_rate: number | null;
  vin: string | null;
  updated_at?: string;
};

const EMPTY_FORM: NewVehicleForm = {
  fuel_type: null,
  transmission: null,
  daily_rate: null,
  weekly_rate: null,
  monthly_rate: null,
  vin: null,
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  license_plate: '',
  status: 'available',
  created_at: '',
  color: '',
  mileage: 0,
  images: [],
};

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none transition-colors';

export default function AddVehicleForm({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<NewVehicleForm>(EMPTY_FORM);

  function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await addVehicle(form as any);
        addNotification('Vehicle Added', `${form.brand} ${form.model} has been added to your fleet.`, 'success');
        router.push(`/${tenantSlug}/fleet`);
        router.refresh();
      } catch (err) {
        addNotification('Error', err instanceof Error ? err.message : 'Failed to add vehicle.', 'error');
      }
    });
  }

  return (
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

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
          <Car size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Vehicle</h1>
          <p className="text-slate-500 text-sm">Register a new vehicle in your fleet.</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Vehicle Details</h2>
          <p className="text-slate-500 text-sm mt-0.5">Fill in the information below to add the vehicle.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Make & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Make</label>
              <input required type="text" value={form.brand}
                onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                placeholder="e.g. BMW" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Model</label>
              <input required type="text" value={form.model}
                onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                placeholder="e.g. X5" className={inputClass} />
            </div>
          </div>

          {/* Year & Plate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Year</label>
              <input required type="number" value={form.year || ''}
                onChange={(e) => setForm((p) => ({ ...p, year: parseInt(e.target.value) }))}
                className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Plate</label>
              <input required type="text" value={form.license_plate}
                onChange={(e) => setForm((p) => ({ ...p, license_plate: e.target.value }))}
                placeholder="ABC-1234" className={inputClass} />
            </div>
          </div>

          {/* Reg Date & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Registration Date</label>
              <input required type="date" value={form.created_at}
                onChange={(e) => setForm((p) => ({ ...p, created_at: e.target.value }))}
                className={`${inputClass} uppercase`} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Color</label>
              <input required type="text" value={form.color || ''}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                placeholder="e.g. Black" className={inputClass} />
            </div>
          </div>

          {/* Mileage */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Mileage (km)</label>
            <input required type="number" value={form.mileage || 0}
              onChange={(e) => setForm((p) => ({ ...p, mileage: parseInt(e.target.value) }))}
              className={inputClass} />
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle Type</label>
              <select required value={form.fuel_type || ''}
                onChange={(e) => setForm((p) => ({ ...p, fuel_type: e.target.value as any }))}
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
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
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
                  onChange={(e) => setForm((p) => ({ ...p, updated_at: e.target.value }))}
                  className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase text-orange-800">Reason</label>
                <input required type="text" placeholder="e.g. Broken windshield"
                  value={form.notes || ''}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none" />
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Photos</label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((photo, i) => (
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
              {isPending ? 'Adding…' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
