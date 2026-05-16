'use client';

import { useRef, useState, useTransition } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { submitContractSignature } from '@/lib/actions/publicContracts';
import { PenLine, RefreshCcw, CheckCircle2 } from 'lucide-react';

export default function MobileSignaturePad({ contractId }: { contractId: string }) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isPending, startTransition] = useTransition();
  const [isSigned, setIsSigned] = useState(false);
  const [error, setError] = useState('');

  const clear = () => {
    sigCanvas.current?.clear();
    setError('');
  };

  const confirmSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
      setError('Please draw your signature before confirming.');
      return;
    }

    const dataURL = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (!dataURL) return;

    startTransition(async () => {
      try {
        await submitContractSignature(contractId, dataURL);
        setIsSigned(true);
      } catch (e: any) {
        setError(e.message || 'Failed to submit signature');
      }
    });
  };

  if (isSigned) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-3xl border border-green-200 shadow-sm text-center">
        <CheckCircle2 size={48} className="text-green-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Signed Successfully</h3>
        <p className="text-sm text-slate-600">Your rental agreement has been finalized.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-inner relative">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
          <PenLine size={64} className="text-slate-900" />
        </div>
        <SignatureCanvas
          ref={sigCanvas}
          penColor="#0f172a"
          canvasProps={{
            className: 'w-full h-[250px] sm:h-[300px] touch-none',
            style: { touchAction: 'none' }
          }}
        />
      </div>

      {error && <p className="text-sm text-red-500 font-bold text-center">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={clear}
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={18} />
          Clear
        </button>
        <button
          onClick={confirmSignature}
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}
