'use client';

import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { clientSchema, type ClientFormData } from '@/lib/validations/client';
import { updateClient } from '@/lib/actions/clients';
import { useNotifications } from '@/components/layout/NotificationProvider';
import { type ContractWithDetails } from '@/lib/actions/contracts';

type Props = {
  contract: ContractWithDetails;
  onClose: () => void;
};

export function EditClientModal({ contract, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addNotification } = useNotifications();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      clientName: contract.clients?.full_name || '',
      clientPhone: contract.clients?.phone || '',
      clientAddress: contract.clients?.address || '',
      clientBirthDate: contract.clients?.date_of_birth || '',
      clientBirthPlace: contract.clients?.place_of_birth || '',
      licenseNumber: contract.clients?.driver_license_number || '',
      licenseDate: contract.clients?.driver_license_expiry || '',
      hasOtherDrivers: false, // Moved to extra_data, simplifying for now
    },
  });

  useEffect(() => {
    reset({
      clientName: contract.clients?.full_name || '',
      clientPhone: contract.clients?.phone || '',
      clientAddress: contract.clients?.address || '',
      clientBirthDate: contract.clients?.date_of_birth || '',
      clientBirthPlace: contract.clients?.place_of_birth || '',
      licenseNumber: contract.clients?.driver_license_number || '',
      licenseDate: contract.clients?.driver_license_expiry || '',
      hasOtherDrivers: false,
    });
  }, [contract, reset]);

  const onSave = (data: ClientFormData) => {
    startTransition(async () => {
      if (!contract.client_id) return;
      await updateClient(contract.client_id, {
        full_name: data.clientName,
        phone: data.clientPhone,
        address: data.clientAddress,
        // birth_date: data.clientBirthDate,
        // place_of_birth: data.clientBirthPlace,
        driver_license_number: data.licenseNumber,
        driver_license_expiry: data.licenseDate,
      });
      addNotification('Client Updated', 'Client details have been updated successfully.', 'success');
      router.refresh();
      onClose();
    });
  };

  const inputClass =
    'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
      >
        <h3 className="text-xl font-bold text-slate-900 mb-6">Edit Client Details</h3>
        <form
          onSubmit={handleSubmit(onSave)}
          className="space-y-4 max-h-[70vh] overflow-y-auto px-1 -mx-1"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
            <input {...register('clientName')} className={inputClass} placeholder="Client Name" />
            {errors.clientName && <p className="text-[10px] text-red-500">{errors.clientName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</label>
              <input {...register('clientPhone')} className={inputClass} placeholder="Phone Number" />
              {errors.clientPhone && <p className="text-[10px] text-red-500">{errors.clientPhone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">DOB</label>
              <input type="date" {...register('clientBirthDate')} className={`${inputClass} uppercase`} />
              {errors.clientBirthDate && <p className="text-[10px] text-red-500">{errors.clientBirthDate.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</label>
            <input {...register('clientAddress')} className={inputClass} placeholder="Address" />
            {errors.clientAddress && <p className="text-[10px] text-red-500">{errors.clientAddress.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Place of Birth</label>
              <input {...register('clientBirthPlace')} className={inputClass} placeholder="City" />
              {errors.clientBirthPlace && <p className="text-[10px] text-red-500">{errors.clientBirthPlace.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Date</label>
              <input type="date" {...register('licenseDate')} className={`${inputClass} uppercase`} />
              {errors.licenseDate && <p className="text-[10px] text-red-500">{errors.licenseDate.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Number</label>
            <input {...register('licenseNumber')} className={inputClass} placeholder="Driving License Number" />
            {errors.licenseNumber && <p className="text-[10px] text-red-500">{errors.licenseNumber.message}</p>}
          </div>

          <div className="flex items-center gap-2 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="editHasOtherDrivers"
              {...register('hasOtherDrivers')}
              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900/20"
            />
            <label htmlFor="editHasOtherDrivers" className="text-sm text-slate-700 font-medium">
              Other drivers authorized to drive
            </label>
          </div>

          <div className="pt-6 flex items-center justify-end gap-3 mt-8 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
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
      </motion.div>
    </div>
  );
}
