'use client';

import { useTransition, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, User, Phone, Mail, MapPin, IdCard, Calendar,
  FileText, Save, Image as ImageIcon, Upload, Trash2, History,
  ExternalLink, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateClient } from '@/lib/actions/clients';
import {
  uploadClientDocument,
  deleteClientDocument,
  getClientDocumentUrl,
  type DocumentType,
} from '@/lib/actions/clientDocuments';
import { useNotifications } from '@/components/layout/NotificationProvider';
import type { Client } from '@/types';
import type { ContractWithDetails } from '@/lib/actions/contracts';

type Props = {
  client: Client;
  contracts: ContractWithDetails[];
};

type EditFields = {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  id_number: string;
  id_expiry_date: string;
  driver_license_number: string;
  driver_license_expiry: string;
  notes: string;
};

const inputClass =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:             { label: 'Draft',             className: 'bg-slate-100 text-slate-600' },
  pending_signature: { label: 'Pending Signature', className: 'bg-amber-100 text-amber-700' },
  active:            { label: 'Active',            className: 'bg-green-100 text-green-700' },
  signed:            { label: 'Signed',            className: 'bg-blue-100 text-blue-700' },
  completed:         { label: 'Completed',         className: 'bg-slate-100 text-slate-500' },
  cancelled:         { label: 'Cancelled',         className: 'bg-red-100 text-red-600' },
};

const DOCUMENT_SLOTS: { key: DocumentType; label: string }[] = [
  { key: 'id_front',       label: 'ID Card — Front' },
  { key: 'id_back',        label: 'ID Card — Back' },
  { key: 'license_front',  label: 'Driver License — Front' },
  { key: 'license_back',   label: 'Driver License — Back' },
];

export function ClientProfile({ client, contracts }: Props) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [isPending, startTransition] = useTransition();

  // Track per-slot loading and signed URL state
  const [docLoading, setDocLoading] = useState<Partial<Record<DocumentType, boolean>>>({});
  const [docUrls, setDocUrls] = useState<Partial<Record<DocumentType, string | null>>>({});
  const fileInputRefs = useRef<Partial<Record<DocumentType, HTMLInputElement | null>>>({});

  const { register, handleSubmit } = useForm<EditFields>({
    defaultValues: {
      full_name:             client.full_name ?? '',
      phone:                 client.phone ?? '',
      email:                 client.email ?? '',
      address:               client.address ?? '',
      city:                  client.city ?? '',
      id_number:             client.id_number ?? '',
      id_expiry_date:        client.id_expiry_date?.slice(0, 10) ?? '',
      driver_license_number: client.driver_license_number ?? '',
      driver_license_expiry: client.driver_license_expiry?.slice(0, 10) ?? '',
      notes:                 client.notes ?? '',
    },
  });

  const onSave = (data: EditFields) => {
    startTransition(async () => {
      try {
        await updateClient(client.id, {
          full_name:             data.full_name,
          phone:                 data.phone,
          email:                 data.email || null,
          address:               data.address || null,
          city:                  data.city || null,
          id_number:             data.id_number || null,
          id_expiry_date:        data.id_expiry_date || null,
          driver_license_number: data.driver_license_number || null,
          driver_license_expiry: data.driver_license_expiry || null,
          notes:                 data.notes || null,
        });
        addNotification('Client Updated', 'Profile saved successfully.', 'success');
        router.refresh();
      } catch (err: any) {
        addNotification('Error', err.message ?? 'Failed to save.', 'error');
      }
    });
  };

  const handleUpload = async (type: DocumentType, file: File) => {
    setDocLoading((p) => ({ ...p, [type]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      await uploadClientDocument(client.id, type, fd);
      const url = await getClientDocumentUrl(client.id, type);
      setDocUrls((p) => ({ ...p, [type]: url }));
      addNotification('Uploaded', `${type.replace('_', ' ')} uploaded.`, 'success');
    } catch (err: any) {
      addNotification('Upload Failed', err.message ?? 'Try again.', 'error');
    } finally {
      setDocLoading((p) => ({ ...p, [type]: false }));
    }
  };

  const handleView = async (type: DocumentType) => {
    if (docUrls[type]) {
      window.open(docUrls[type]!, '_blank');
      return;
    }
    setDocLoading((p) => ({ ...p, [type]: true }));
    try {
      const url = await getClientDocumentUrl(client.id, type);
      if (!url) { addNotification('Not Found', 'No document uploaded yet.', 'error'); return; }
      setDocUrls((p) => ({ ...p, [type]: url }));
      window.open(url, '_blank');
    } catch {
      addNotification('Error', 'Could not load document.', 'error');
    } finally {
      setDocLoading((p) => ({ ...p, [type]: false }));
    }
  };

  const handleDelete = async (type: DocumentType) => {
    setDocLoading((p) => ({ ...p, [type]: true }));
    try {
      await deleteClientDocument(client.id, type);
      setDocUrls((p) => ({ ...p, [type]: null }));
      addNotification('Deleted', `${type.replace('_', ' ')} removed.`, 'success');
    } catch (err: any) {
      addNotification('Delete Failed', err.message ?? 'Try again.', 'error');
    } finally {
      setDocLoading((p) => ({ ...p, [type]: false }));
    }
  };

  const totalRentals = contracts.length;
  const totalSpent = contracts.reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0);
  const lastRental = contracts[0];

  return (
    <>
      {/* Back link */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Clients
      </Link>

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg">
            <User size={36} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate">
              {client.full_name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" /> {client.phone || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-slate-400" /> {client.email || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <IdCard size={14} className="text-slate-400" /> {client.driver_license_number || '—'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rentals</p>
              <p className="text-2xl font-bold text-slate-900">{totalRentals}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Spent</p>
              <p className="text-2xl font-bold text-slate-900">€{totalSpent.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last</p>
              <p className="text-xs font-bold text-slate-900 mt-2" suppressHydrationWarning>
                {lastRental?.created_at
                  ? new Date(lastRental.created_at).toLocaleDateString()
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
            <User size={18} /> Edit Client Details
          </h3>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <input {...register('full_name')} className={inputClass} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</label>
                <input {...register('phone')} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
                <input type="email" {...register('email')} className={inputClass} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <MapPin size={12} /> Address
              </label>
              <input {...register('address')} className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">City</label>
              <input {...register('city')} className={inputClass} />
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">ID Number</label>
                <input {...register('id_number')} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Calendar size={12} /> ID Expiry
                </label>
                <input type="date" {...register('id_expiry_date')} className={`${inputClass} uppercase`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">License Number</label>
                <input {...register('driver_license_number')} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Calendar size={12} /> License Expiry
                </label>
                <input type="date" {...register('driver_license_expiry')} className={`${inputClass} uppercase`} />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Internal Notes</label>
              <textarea {...register('notes')} rows={3} className={inputClass} />
            </div>

            <div className="pt-4 flex justify-end border-t border-slate-100">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                {isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Rental history */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <History size={18} /> Rental History
              <span className="text-xs font-normal text-slate-400 ms-auto">{contracts.length}</span>
            </h3>
            {contracts.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No rentals yet.</div>
            ) : (
              <div className="space-y-3">
                {contracts.map((c) => {
                  const cfg = STATUS_CONFIG[c.status] ?? {
                    label: c.status,
                    className: 'bg-slate-100 text-slate-600',
                  };
                  return (
                    <div key={c.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {c.vehicles?.brand} {c.vehicles?.model}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{c.contract_number}</p>
                        </div>
                        <span
                          className={cn(
                            'text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0',
                            cfg.className
                          )}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                        <span suppressHydrationWarning>
                          {new Date(c.start_date).toLocaleDateString()} →{' '}
                          {new Date(c.end_date).toLocaleDateString()}
                        </span>
                        <span className="font-bold text-slate-700">€{c.total_amount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} /> Documents
              </h3>
              <a
                href={`/upload/${client.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full uppercase tracking-wide hover:bg-slate-900 hover:text-white transition-colors flex items-center gap-1"
              >
                <ExternalLink size={9} />
                Client Link
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DOCUMENT_SLOTS.map((slot) => {
                const loading = docLoading[slot.key];
                const hasUrl = !!docUrls[slot.key];
                return (
                  <div
                    key={slot.key}
                    className="aspect-[3/2] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 px-2 relative group"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin text-slate-400" />
                    ) : (
                      <>
                        <ImageIcon size={18} className={cn('text-slate-300', hasUrl && 'text-green-500')} />
                        <p className="text-[9px] font-bold text-slate-500 text-center leading-tight">
                          {slot.label}
                        </p>
                        {hasUrl ? (
                          <p className="text-[8px] font-bold text-green-600 uppercase tracking-wide">Uploaded</p>
                        ) : null}

                        {/* Hover actions */}
                        <div className="absolute inset-0 bg-slate-900/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {/* Upload */}
                          <button
                            type="button"
                            title="Upload"
                            onClick={() => fileInputRefs.current[slot.key]?.click()}
                            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                          >
                            <Upload size={14} />
                          </button>
                          {/* View */}
                          <button
                            type="button"
                            title="View"
                            onClick={() => handleView(slot.key)}
                            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                          >
                            <ExternalLink size={14} />
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDelete(slot.key)}
                            className="p-1.5 bg-red-500/70 hover:bg-red-500 rounded-lg text-white transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Hidden file input */}
                        <input
                          ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(slot.key, file);
                            e.target.value = '';
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-3 italic">
              Hover a slot to upload, view, or delete. Share the client link so the customer can self-upload via mobile.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
