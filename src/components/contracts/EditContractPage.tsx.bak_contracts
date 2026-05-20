'use client';

import { useTransition, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2, PenLine, RefreshCcw, Send } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { updateContract } from '@/lib/actions/contracts';
import { submitContractSignature } from '@/lib/actions/publicContracts';
import { useNotifications } from '@/components/layout/NotificationProvider';
import { SignLinkPopover } from './SignLinkPopover';
import { type ContractWithDetails } from '@/lib/actions/contracts';

type EditFields = {
  start_date: string;
  end_date: string;
  daily_rate: number;
  deposit_amount: number;
  notes: string;
};

const inputClass =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm';

export function EditContractPage({ contract }: { contract: ContractWithDetails }) {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const prefix = tenantSlug ? `/${tenantSlug}` : '';
  const [isPending, startTransition] = useTransition();
  const { addNotification } = useNotifications();

  const { register, handleSubmit, watch } = useForm<EditFields>({
    defaultValues: {
      start_date: contract.start_date?.slice(0, 10) ?? '',
      end_date: contract.end_date?.slice(0, 10) ?? '',
      daily_rate: contract.daily_rate ?? 0,
      deposit_amount: contract.deposit_amount ?? 0,
      notes: contract.notes ?? '',
    },
  });

  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const dailyRate = watch('daily_rate') || 0;
  const totalDays =
    startDate && endDate
      ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
      : contract.total_days;

  const onSave = (data: EditFields) => {
    startTransition(async () => {
      await updateContract(contract.id, {
        start_date: data.start_date,
        end_date: data.end_date,
        total_days: totalDays,
        daily_rate: Number(data.daily_rate),
        deposit_amount: Number(data.deposit_amount),
        subtotal: Number(data.daily_rate) * totalDays,
        total_amount: Number(data.daily_rate) * totalDays,
        notes: data.notes || null,
        signature_url: null,
        signed_at: null,
        status: 'pending_signature',
      });
      addNotification('Contract Updated', 'Signature invalidated — client must re-sign.', 'info');
      router.push(`${prefix}/contracts/${contract.id}`);
    });
  };

  return (
    <div className="max-w-[672px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`${prefix}/contracts/${contract.id}`)}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Editing Contract</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 font-mono">{contract.contract_number}</h1>
        </div>
        <span className="ms-auto text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
          Editing invalidates signature
        </span>
      </div>

      {/* Contract form card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Rental Terms</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {contract.clients?.full_name} · {contract.vehicles?.brand} {contract.vehicles?.model}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</label>
              <input type="date" {...register('start_date')} className={`${inputClass} uppercase`} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">End Date</label>
              <input type="date" {...register('end_date')} className={`${inputClass} uppercase`} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Rate (€)</label>
              <input type="number" min="0" step="0.01" {...register('daily_rate', { valueAsNumber: true })} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Deposit (€)</label>
              <input type="number" min="0" step="0.01" {...register('deposit_amount', { valueAsNumber: true })} className={inputClass} />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recalculated Total</p>
              <p className="text-xs text-slate-500 mt-0.5">€{dailyRate} × {totalDays} {totalDays === 1 ? 'day' : 'days'}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">€{(Number(dailyRate) * totalDays).toFixed(0)}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes</label>
            <textarea {...register('notes')} rows={3} placeholder="Optional internal notes…" className={inputClass} />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push(`${prefix}/contracts/${contract.id}`)}
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

      {/* Signature section */}
      <SignatureSectionPage contractId={contract.id} onSigned={() => router.push(`${prefix}/contracts/${contract.id}`)} />
    </div>
  );
}

function SignatureSectionPage({ contractId, onSigned }: { contractId: string; onSigned: () => void }) {
  const [tab, setTab] = useState<'local' | 'remote' | null>(null);
  const [signPending, setSignPending] = useState(false);
  const [signError, setSignError] = useState('');
  const [showPopover, setShowPopover] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);
  const { addNotification } = useNotifications();

  const handleSign = async () => {
    if (sigRef.current?.isEmpty()) { setSignError('Please draw your signature first.'); return; }
    const dataUrl = sigRef.current?.getTrimmedCanvas().toDataURL('image/png');
    if (!dataUrl) return;
    setSignPending(true);
    setSignError('');
    try {
      await submitContractSignature(contractId, dataUrl);
      addNotification('Contract Signed', 'Signature captured successfully.', 'success');
      onSigned();
    } catch (e: unknown) {
      setSignError(e instanceof Error ? e.message : 'Failed to save signature.');
    } finally {
      setSignPending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Capture Signature</p>
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setTab(tab === 'local' ? null : 'local')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === 'local' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Client is Present
        </button>
        <button
          type="button"
          onClick={() => setTab(tab === 'remote' ? null : 'remote')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === 'remote' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Send size={14} className="inline mr-1.5" />
          Send Remote Link
        </button>
      </div>

      {tab === 'local' && (
        <div className="space-y-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
            <p className="px-3 pt-2 pb-1 text-[10px] text-slate-400 font-medium">Sign here ↓</p>
            <SignatureCanvas
              ref={sigRef}
              penColor="#0f172a"
              canvasProps={{ className: 'w-full h-[180px]', style: { touchAction: 'none' } }}
            />
          </div>
          {signError && (
            <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> {signError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { sigRef.current?.clear(); setSignError(''); }}
              disabled={signPending}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <RefreshCcw size={14} /> Clear
            </button>
            <button
              type="button"
              onClick={handleSign}
              disabled={signPending}
              className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {signPending ? <Loader2 size={14} className="animate-spin" /> : <PenLine size={14} />}
              {signPending ? 'Saving…' : 'Confirm Signature'}
            </button>
          </div>
        </div>
      )}

      {tab === 'remote' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Share the link so the client can sign remotely from their device.</p>
          <button
            type="button"
            onClick={() => setShowPopover(true)}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            Show QR Code &amp; Link
          </button>
        </div>
      )}

      {showPopover && <SignLinkPopover contractId={contractId} onClose={() => setShowPopover(false)} />}
    </div>
  );
}
