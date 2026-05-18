'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Camera, CheckCircle2, Loader2, AlertCircle, IdCard, Car,
  ArrowLeft, PenLine, RefreshCcw, RotateCcw, FileText, ChevronRight,
} from 'lucide-react';
import { uploadClientDocumentPublic, checkClientDocumentsPublic, type DocumentType } from '@/lib/actions/clientDocuments';
import { submitContractSignature } from '@/lib/actions/publicContracts';
import { cn } from '@/lib/utils';

type DocStep = { step: number; key: DocumentType; label: string; sublabel: string };
const DOC_STEPS: DocStep[] = [
  { step: 1, key: 'id_front',      label: 'ID Card',        sublabel: 'Front Side' },
  { step: 2, key: 'id_back',       label: 'ID Card',        sublabel: 'Back Side' },
  { step: 3, key: 'license_front', label: 'Driver License', sublabel: 'Front Side' },
  { step: 4, key: 'license_back',  label: 'Driver License', sublabel: 'Back Side' },
];

type DocState = 'idle' | 'uploading' | 'done' | 'error';

export type MobileContractFlowProps = {
  contractId: string;
  clientId: string;
  clientName: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  totalDays: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  depositAmount: number;
};

export function MobileContractFlow({
  contractId,
  clientId,
  clientName,
  vehicleBrand,
  vehicleModel,
  vehiclePlate,
  totalDays,
  totalAmount,
}: MobileContractFlowProps) {
  const [step, setStep] = useState(1);
  const [initializing, setInitializing] = useState(true);
  const [docStates, setDocStates] = useState<Record<DocumentType, DocState>>({
    id_front: 'idle', id_back: 'idle', license_front: 'idle', license_back: 'idle',
  });
  const [docErrors, setDocErrors] = useState<Partial<Record<DocumentType, string>>>({});
  const [previews, setPreviews] = useState<Partial<Record<DocumentType, string>>>({});
  const [signPending, setSignPending] = useState(false);
  const [signError, setSignError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    checkClientDocumentsPublic(clientId)
      .then((existing) => {
        if (existing.length === 4) {
          setDocStates({ id_front: 'done', id_back: 'done', license_front: 'done', license_back: 'done' });
          setStep(5);
        }
      })
      .finally(() => setInitializing(false));
  }, [clientId]);

  const handleFile = useCallback(
    async (type: DocumentType, file: File) => {
      setPreviews((p) => ({ ...p, [type]: URL.createObjectURL(file) }));
      setDocStates((p) => ({ ...p, [type]: 'uploading' }));
      setDocErrors((p) => { const n = { ...p }; delete n[type]; return n; });
      try {
        const fd = new FormData();
        fd.append('file', file);
        await uploadClientDocumentPublic(clientId, type, fd);
        setDocStates((p) => ({ ...p, [type]: 'done' }));
      } catch (err: any) {
        setDocStates((p) => ({ ...p, [type]: 'error' }));
        setPreviews((p) => { const n = { ...p }; delete n[type]; return n; });
        setDocErrors((p) => ({ ...p, [type]: err.message || 'Upload failed. Tap to retry.' }));
      }
    },
    [clientId]
  );

  const handleSign = async () => {
    if (sigRef.current?.isEmpty()) {
      setSignError('Please draw your signature first.');
      return;
    }
    const dataUrl = sigRef.current?.getTrimmedCanvas().toDataURL('image/png');
    if (!dataUrl) return;
    setSignPending(true);
    setSignError('');
    try {
      await submitContractSignature(contractId, dataUrl);
      setStep(6);
    } catch (e: any) {
      setSignError(e.message || 'Failed to submit. Try again.');
    } finally {
      setSignPending(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-white/40" />
      </div>
    );
  }

  // ── Step 7: Success ───────────────────────────────────────────────────────
  if (step === 7) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-[384px] text-center space-y-5">
          <div className="w-24 h-24 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={44} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">All Done!</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your documents are uploaded, your signature has been captured, and you have agreed to the rental terms. You can close this page.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2.5">
            {[
              '4 documents uploaded securely',
              'Signature captured & contract signed',
              'Rental terms accepted',
            ].map((line) => (
              <p key={line} className="text-slate-300 text-sm flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-green-400 shrink-0" />
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const docStep = step >= 1 && step <= 4 ? DOC_STEPS[step - 1] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-10 pb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Nokhba Rental</p>
        <h1 className="text-xl font-black tracking-tight">{vehicleBrand} {vehicleModel}</h1>
        <p className="text-slate-400 text-sm">{vehiclePlate} · {totalDays} day{totalDays !== 1 ? 's' : ''}</p>
      </div>

      {/* Step progress */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>Step {step} of 6</span>
          <span className="font-bold text-white">
            {step <= 4 ? 'Upload Documents' : step === 5 ? 'Signature' : 'Terms & Conditions'}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                s < step ? 'bg-green-500' : s === step ? 'bg-white' : 'bg-white/20'
              )}
            />
          ))}
        </div>
      </div>

      <div className="px-5 flex-1 flex flex-col">

        {/* ── Steps 1–4: Document upload ────────────────────────────────────── */}
        {docStep && (() => {
          const { key, label, sublabel } = docStep;
          const state = docStates[key];
          const preview = previews[key];
          const errMsg = docErrors[key];
          const isUploading = state === 'uploading';
          const imgInputId = `img-${key}`;
          const pdfInputId = `pdf-${key}`;

          return (
            <div className="flex-1 flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-black tracking-tight">{label}</h2>
                <p className="text-slate-400 text-sm mt-0.5">{sublabel}</p>
              </div>

              {/* Preview / placeholder */}
              <div
                className={cn(
                  'w-full rounded-2xl border-2 border-dashed overflow-hidden transition-all flex items-center justify-center',
                  state === 'done'      && 'border-green-500/50 bg-green-950/20',
                  state === 'error'     && 'border-red-500/40 bg-red-950/20',
                  state === 'uploading' && 'border-white/20 bg-white/5',
                  state === 'idle'      && 'border-white/20 bg-white/5',
                )}
                style={{ minHeight: '180px', aspectRatio: '3/2' }}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 size={32} className="animate-spin text-white/40" />
                    <p className="text-sm text-slate-400">Uploading…</p>
                  </div>
                ) : preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 text-white/20">
                    {step <= 2 ? <IdCard size={48} /> : <Car size={48} />}
                    <p className="text-sm font-semibold">{label} — {sublabel}</p>
                  </div>
                )}
              </div>

              {state === 'done' && (
                <p className="text-sm text-green-400 font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} /> Uploaded successfully
                </p>
              )}
              {errMsg && (
                <p className="text-sm text-red-400 font-semibold flex items-start gap-2 leading-snug">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" /> {errMsg}
                </p>
              )}

              {/* Upload controls */}
              {!isUploading && (
                <div className="space-y-3">
                  <label
                    htmlFor={imgInputId}
                    className={cn(
                      'w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-base cursor-pointer transition-all active:scale-[0.98] select-none',
                      state === 'done'  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : state === 'error' ? 'bg-red-500 text-white'
                        : 'bg-white text-slate-900'
                    )}
                  >
                    {state === 'done' ? <RotateCcw size={20} /> : <Camera size={20} />}
                    {state === 'done' ? 'Retake Photo' : state === 'error' ? 'Retry' : 'Tap to Scan / Take Photo'}
                    <input
                      id={imgInputId}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(key, file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  <label
                    htmlFor={pdfInputId}
                    className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 border border-white/10 bg-white/5 cursor-pointer transition-all active:bg-white/10 select-none"
                  >
                    <FileText size={16} />
                    Upload PDF instead
                    <input
                      id={pdfInputId}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(key, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-auto pb-8 flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold transition-all disabled:opacity-20 flex items-center justify-center gap-2 active:bg-white/20"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={state !== 'done'}
                  className="flex-[2] py-4 bg-white text-slate-900 rounded-2xl font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── Step 5: Signature ─────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="flex-1 flex flex-col gap-5 pb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Sign the Contract</h2>
              <p className="text-slate-400 text-sm mt-0.5">Draw your signature in the box below.</p>
            </div>

            {/* Rental summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Rental Summary</p>
              {[
                ['Client',   clientName],
                ['Vehicle',  `${vehicleBrand} ${vehicleModel} · ${vehiclePlate}`],
                ['Duration', `${totalDays} day${totalDays !== 1 ? 's' : ''}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/10 pt-2 mt-1">
                <span className="text-slate-400">Total (incl. deposit)</span>
                <span className="font-bold text-lg">€{totalAmount}</span>
              </div>
            </div>

            {/* Signature canvas */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <p className="px-4 pt-3 pb-1 text-xs text-slate-400 font-medium select-none pointer-events-none">
                Sign here ↓
              </p>
              <SignatureCanvas
                ref={sigRef}
                penColor="#0f172a"
                canvasProps={{
                  className: 'w-full h-[200px]',
                  style: { touchAction: 'none' },
                }}
              />
            </div>

            {signError && (
              <p className="text-sm text-red-400 font-bold flex items-center gap-1.5">
                <AlertCircle size={14} /> {signError}
              </p>
            )}

            <div className="mt-auto flex gap-3">
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={signPending}
                className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold transition-all disabled:opacity-20 flex items-center justify-center gap-2 active:bg-white/20"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                type="button"
                onClick={() => { sigRef.current?.clear(); setSignError(''); }}
                disabled={signPending}
                className="px-5 py-4 bg-white/10 text-white rounded-2xl font-bold transition-all disabled:opacity-20 active:bg-white/20"
              >
                <RefreshCcw size={18} />
              </button>
              <button
                type="button"
                onClick={handleSign}
                disabled={signPending}
                className="flex-[2] py-4 bg-white text-slate-900 rounded-2xl font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {signPending ? <Loader2 size={18} className="animate-spin" /> : <PenLine size={18} />}
                {signPending ? 'Saving…' : 'Confirm & Sign'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 6: Terms & Conditions ────────────────────────────────────── */}
        {step === 6 && (
          <div className="flex-1 flex flex-col gap-5 pb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Terms &amp; Conditions</h2>
              <p className="text-slate-400 text-sm mt-0.5">Please confirm before completing.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
              {[
                '4 documents uploaded securely',
                'Signature captured & contract signed',
              ].map((line) => (
                <p key={line} className="text-slate-300 text-sm flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-green-400 shrink-0" /> {line}
                </p>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-slate-300 leading-relaxed">
              <p className="font-bold text-white mb-2">Rental Agreement Terms</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                By checking the box below, you confirm that you have reviewed the vehicle condition, agree to return it in the same state, and accept full responsibility for any damage, fines, or violations incurred during the rental period.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-white/30 accent-green-500 cursor-pointer shrink-0"
              />
              <span className="text-sm text-slate-200 leading-relaxed">
                J&apos;ai lu et j&apos;accepte les conditions de location / I have read and agree to the rental terms.
              </span>
            </label>

            <div className="mt-auto flex gap-3">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:bg-white/20"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(7)}
                disabled={!termsAccepted}
                className="flex-[2] py-4 bg-white text-slate-900 rounded-2xl font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Complete <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
