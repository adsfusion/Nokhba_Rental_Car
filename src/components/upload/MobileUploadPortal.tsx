'use client';

import { useState, useCallback } from 'react';
import {
  Camera, CheckCircle2, Loader2, AlertCircle, IdCard, Car,
  ArrowLeft, ChevronRight, FileText, RotateCcw,
} from 'lucide-react';
import { uploadClientDocumentPublic, type DocumentType } from '@/lib/actions/clientDocuments';
import { cn } from '@/lib/utils';

type DocStep = { step: number; key: DocumentType; label: string; sublabel: string };
const DOC_STEPS: DocStep[] = [
  { step: 1, key: 'id_front',      label: 'ID Card',        sublabel: 'Front Side' },
  { step: 2, key: 'id_back',       label: 'ID Card',        sublabel: 'Back Side' },
  { step: 3, key: 'license_front', label: 'Driver License', sublabel: 'Front Side' },
  { step: 4, key: 'license_back',  label: 'Driver License', sublabel: 'Back Side' },
];

type DocState = 'idle' | 'uploading' | 'done' | 'error';
type Props = { clientId: string; clientName: string };

export function MobileUploadPortal({ clientId, clientName }: Props) {
  const [step, setStep] = useState(1);
  const [docStates, setDocStates] = useState<Record<DocumentType, DocState>>({
    id_front: 'idle', id_back: 'idle', license_front: 'idle', license_back: 'idle',
  });
  const [docErrors, setDocErrors] = useState<Partial<Record<DocumentType, string>>>({});
  const [previews, setPreviews] = useState<Partial<Record<DocumentType, string>>>({});

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

  // ── Step 5: Success ───────────────────────────────────────────────────────
  if (step === 5) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-[672px] w-full mx-auto p-6 md:p-8 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center space-y-5">
            <div className="w-24 h-24 bg-green-50 border-2 border-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={44} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Documents Uploaded!</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              The rental agency has received your documents. You can close this page.
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-2.5 mt-4">
              {DOC_STEPS.map(({ label, sublabel }) => (
                <p key={`${label}-${sublabel}`} className="text-slate-700 text-sm flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                  {label} — {sublabel}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const docStep = DOC_STEPS[step - 1];
  const { key, label, sublabel } = docStep;
  const state = docStates[key];
  const preview = previews[key];
  const errMsg = docErrors[key];
  const isUploading = state === 'uploading';
  const imgInputId = `img-${key}`;
  const pdfInputId = `pdf-${key}`;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center py-0 sm:py-10 px-0 sm:px-4">
      <div className="w-full max-w-[672px] bg-slate-950 text-white flex flex-col sm:rounded-3xl shadow-none sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-[800px]">
        {/* Header */}
        <div className="px-5 pt-10 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Nokhba Rental</p>
          <h1 className="text-xl font-black tracking-tight">{clientName}</h1>
          <p className="text-slate-400 text-sm">Document Upload</p>
        </div>

        {/* Progress */}
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Step {step} of 4</span>
            <span className="font-bold text-white">Upload Documents</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
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

        <div className="px-5 flex-1 flex flex-col gap-5">
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
              {step === 4 ? 'Finish' : 'Next'} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
