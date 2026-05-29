'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { approvePayment, rejectPayment } from '@/lib/actions/payments';
import { useRouter } from 'next/navigation';

export function PaymentReviewActions({
  proofId,
  tenantName,
  planName,
}: {
  proofId: string;
  tenantName?: string;
  planName?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approvePayment(proofId);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleReject() {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectPayment(proofId, rejectReason);
      if (result?.error) {
        setError(result.error);
      } else {
        setShowRejectModal(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 text-sm"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          Approve
        </button>
        <button
          onClick={() => { setShowRejectModal(true); setError(null); }}
          disabled={isPending}
          className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-6 py-3.5 rounded-xl font-bold transition-colors text-sm disabled:opacity-50"
        >
          <XCircle size={16} />
          Reject
        </button>
      </div>

      {/* Approve confirmation hint */}
      <p className="text-xs text-slate-400 font-medium text-center">
        Approving will activate <strong>{tenantName}</strong>'s subscription to the <strong>{planName}</strong> plan.
      </p>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-900">Reject Payment</h3>
              <p className="text-slate-500 text-sm mt-1">
                Please provide a clear reason so the tenant can resubmit correctly.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Rejection Reason</label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. The amount doesn't match the plan price. Please resubmit with the correct amount of 500 MAD."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setError(null); }}
                disabled={isPending}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors text-sm disabled:opacity-50"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
