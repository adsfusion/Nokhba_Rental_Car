'use client';

import { useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { addClientSchema, type AddClientFormData } from '@/lib/validations/client';
import { addClient } from '@/lib/actions/clients';
import { useNotifications } from '@/components/layout/NotificationProvider';

const inputClass =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-slate-500';

export default function NewClientPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const { addNotification } = useNotifications();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddClientFormData>({ resolver: zodResolver(addClientSchema) });

  const onSave = (data: AddClientFormData) => {
    startTransition(async () => {
      try {
        await addClient(data as any);
        addNotification('Client Added', `${data.full_name} has been added successfully.`, 'success');
        router.push(`/${tenantSlug}/clients`);
        router.refresh();
      } catch (err) {
        addNotification('Error', err instanceof Error ? err.message : 'Failed to add client.', 'error');
      }
    });
  };

  return (
    <div className="max-w-[672px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${tenantSlug}/clients`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Clients
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
          <UserPlus size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Client</h1>
          <p className="text-slate-500 text-sm">Register a new client in your rental registry.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-surface-container-lowest border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Client Information</h2>
          <p className="text-slate-500 text-sm mt-0.5">Fill in the details below to register the client.</p>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-6">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className={labelClass}>Full Name</label>
            <input {...register('full_name')} className={inputClass} placeholder="Client full name" />
            {errors.full_name && <p className="text-[11px] text-red-500 mt-1">{errors.full_name.message}</p>}
          </div>

          {/* Phone + License Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className={labelClass}>Phone</label>
              <input {...register('phone')} className={inputClass} placeholder="+33 6 12 34 56 78" />
              {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>License Expiry Date</label>
              <input type="date" {...register('driver_license_expiry')} className={`${inputClass} uppercase`} />
              {errors.driver_license_expiry && (
                <p className="text-[11px] text-red-500 mt-1">{errors.driver_license_expiry.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className={labelClass}>Address</label>
            <input {...register('address')} className={inputClass} placeholder="Full residential address" />
            {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address.message}</p>}
          </div>

          {/* License Number */}
          <div className="space-y-1.5">
            <label className={labelClass}>Driver License Number</label>
            <input
              {...register('driver_license_number')}
              className={inputClass}
              placeholder="Driving license number"
            />
            {errors.driver_license_number && (
              <p className="text-[11px] text-red-500 mt-1">{errors.driver_license_number.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link
              href={`/${tenantSlug}/clients`}
              className="px-5 py-2.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm"
            >
              {isPending ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
