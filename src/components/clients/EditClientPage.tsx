'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { clientSchema, type ClientFormData } from '@/lib/validations/client';
import { updateClient } from '@/lib/actions/clients';
import { useNotifications } from '@/components/layout/NotificationProvider';
import type { Client } from '@/types';

const inputClass =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm';

export function EditClientPage({ client }: { client: Client }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addNotification } = useNotifications();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      clientName: client.full_name ?? '',
      clientPhone: client.phone ?? '',
      clientAddress: client.address ?? '',
      clientBirthDate: '',
      clientBirthPlace: '',
      licenseNumber: client.driver_license_number ?? '',
      licenseDate: client.driver_license_expiry ?? '',
      hasOtherDrivers: false,
    },
  });

  const onSave = (data: ClientFormData) => {
    startTransition(async () => {
      await updateClient(client.id, {
        full_name: data.clientName,
        phone: data.clientPhone,
        address: data.clientAddress,
        driver_license_number: data.licenseNumber,
        driver_license_expiry: data.licenseDate,
      });
      addNotification('Client Updated', 'Client details saved successfully.', 'success');
      router.back();
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Editing</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{client.full_name}</h1>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Client Details</h2>
          <p className="text-xs text-slate-500 mt-0.5">All changes are saved immediately.</p>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
            <input {...register('clientName')} className={inputClass} placeholder="Client Name" />
            {errors.clientName && <p className="text-[10px] text-red-500">{errors.clientName.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</label>
              <input {...register('clientPhone')} className={inputClass} placeholder="Phone Number" />
              {errors.clientPhone && <p className="text-[10px] text-red-500">{errors.clientPhone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</label>
              <input type="date" {...register('clientBirthDate')} className={`${inputClass} uppercase`} />
              {errors.clientBirthDate && <p className="text-[10px] text-red-500">{errors.clientBirthDate.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</label>
            <input {...register('clientAddress')} className={inputClass} placeholder="Address" />
            {errors.clientAddress && <p className="text-[10px] text-red-500">{errors.clientAddress.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Place of Birth</label>
              <input {...register('clientBirthPlace')} className={inputClass} placeholder="City" />
              {errors.clientBirthPlace && <p className="text-[10px] text-red-500">{errors.clientBirthPlace.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Expiry</label>
              <input type="date" {...register('licenseDate')} className={`${inputClass} uppercase`} />
              {errors.licenseDate && <p className="text-[10px] text-red-500">{errors.licenseDate.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Number</label>
            <input {...register('licenseNumber')} className={inputClass} placeholder="Driving License Number" />
            {errors.licenseNumber && <p className="text-[10px] text-red-500">{errors.licenseNumber.message}</p>}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="hasOtherDrivers"
              {...register('hasOtherDrivers')}
              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900/20"
            />
            <label htmlFor="hasOtherDrivers" className="text-sm text-slate-700 font-medium">
              Other drivers authorized to drive
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Upload link info card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Client Upload Portal</p>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs font-mono text-slate-500 flex-1 truncate">/upload/{client.id}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/upload/${client.id}`)}
            className="text-[10px] font-bold px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 transition-colors whitespace-nowrap"
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}
