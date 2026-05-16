'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { addClientSchema, type AddClientFormData } from '@/lib/validations/client';
import { addClient } from '@/lib/actions/clients';
import { useNotifications } from '@/components/layout/NotificationProvider';

type Props = { onClose: () => void };

const inputClass =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm';

export function AddClientModal({ onClose }: Props) {
  const router = useRouter();
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
        addNotification('Client Added', `${data.full_name} has been added to your client list.`, 'success');
        router.refresh();
        onClose();
      } catch (err) {
        addNotification('Error', err instanceof Error ? err.message : 'Failed to add client.', 'error');
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Add New Client</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSave)}
          className="space-y-4 max-h-[70vh] overflow-y-auto px-1 -mx-1"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
            <input {...register('full_name')} className={inputClass} placeholder="Client full name" />
            {errors.full_name && <p className="text-[10px] text-red-500">{errors.full_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</label>
              <input {...register('phone')} className={inputClass} placeholder="+33 6 12 34 56 78" />
              {errors.phone && <p className="text-[10px] text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</label>
              {/* birth_date input */}
              {/* birth_date error */}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</label>
            <input {...register('address')} className={inputClass} placeholder="Full address" />
            {errors.address && <p className="text-[10px] text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Place of Birth</label>
              {/* birth_place input */}
              {/* birth_place error */}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Date</label>
              <input type="date" {...register('driver_license_expiry')} className={`${inputClass} uppercase`} />
              {errors.driver_license_expiry && <p className="text-[10px] text-red-500">{errors.driver_license_expiry.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Number</label>
            <input {...register('driver_license_number')} className={inputClass} placeholder="Driving license number" />
            {errors.driver_license_number && <p className="text-[10px] text-red-500">{errors.driver_license_number.message}</p>}
          </div>

          <div className="pt-6 flex items-center justify-end gap-3 mt-4 border-t border-slate-100">
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
              {isPending ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
