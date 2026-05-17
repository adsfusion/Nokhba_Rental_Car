'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Download, UserCircle, Car, ShieldCheck, CreditCard, ChevronRight, Check, QrCode, IdCard as IdCardIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import SignatureCanvas from 'react-signature-canvas';
import { generateAdvancedPDF } from '@/lib/pdfGenerator';
import {
  ArrowLeft, Calendar, CheckCircle2, UserPlus, Clock, Phone,
  IdCard, Plus, Trash2, ImagePlus, PenLine, Euro,
  X, User,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { contractSchema, type ContractFormData } from '@/lib/validations/contract';
import { addContract, getNextContractId } from '@/lib/actions/contracts';
import { updateVehicle } from '@/lib/actions/vehicles';
import { submitContractSignature } from '@/lib/actions/publicContracts';
import { uploadClientDocument, type DocumentType } from '@/lib/actions/clientDocuments';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useNotifications } from '@/components/layout/NotificationProvider';
import { SignatureModal } from './SignatureModal';
import { signatureUrlToPngBase64 } from '@/lib/signatureToBase64';
import type { Vehicle, Client } from '@/types';

type Props = { vehicles: Vehicle[]; clients: Client[] };

const STEPS = [
  { id: 1, name: 'Selection', icon: UserPlus },
  { id: 2, name: 'Terms', icon: Calendar },
  { id: 3, name: 'Review', icon: CheckCircle2 },
] as const;

const inputClass =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all text-sm';

export function ContractWizard({ vehicles, clients }: Props) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contractData, setContractData] = useState<ContractFormData | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [contractLink, setContractLink] = useState('');
  
  // Frozen data to preserve state after Next.js revalidation
  const [frozenClient, setFrozenClient] = useState<any>(null);
  const [frozenVehicle, setFrozenVehicle] = useState<any>(null);

  // Visual selection state for Step 1
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Post-submission state
  type SigningMode = 'local' | 'remote' | null;
  const [signingMode, setSigningMode] = useState<SigningMode>(null);
  const [newContractId, setNewContractId] = useState<string | null>(null);
  const [isLocalSignPending, setIsLocalSignPending] = useState(false);
  const localSigRef = useRef<SignatureCanvas>(null);

  // Local 2-step flow: upload docs first, then sign
  const [localStep, setLocalStep] = useState<'upload' | 'sign'>('upload');
  type DocState = 'idle' | 'uploading' | 'done' | 'error';
  const [localDocStates, setLocalDocStates] = useState<Record<DocumentType, DocState>>({
    id_front: 'idle', id_back: 'idle', license_front: 'idle', license_back: 'idle',
  });
  const localFileRefs = useRef<Partial<Record<DocumentType, HTMLInputElement | null>>>({});
  const allLocalDocsDone = Object.values(localDocStates).every((s) => s === 'done');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema) as any,
    defaultValues: {
      contractId: 'CTR-001001',
      clientName: '',
      clientPhone: '',
      clientAddress: '',
      clientBirthDate: '',
      clientBirthPlace: '',
      licenseNumber: '',
      licenseDate: '',
      hasOtherDrivers: false,
      vehicleId: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: new Date().getFullYear(),
      vehiclePlate: '',
      vehicleStartMileage: 0,
      vehicleRegistrationDate: '',
      rentalDurationDays: 1,
      insuranceOption: 'Basic',
      dailyRate: 50,
      deposit: 200,
      paymentMethod: 'Cash',
      signature: '',
      status: 'active' as any,
      initialDamages: [],
    },
  });

  useEffect(() => {
    getNextContractId().then((id) => setValue('contractId', id));
  }, [setValue]);

  const startDateStr = watch('startDate');
  const endDateStr = watch('endDate');

  useEffect(() => {
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
        setValue('rentalDurationDays', diffDays > 0 ? diffDays : 1, { shouldValidate: true });
      }
    }
  }, [startDateStr, endDateStr, setValue]);

  const dailyRate = watch('dailyRate') || 0;
  const deposit = watch('deposit') || 0;
  const rentalDays = watch('rentalDurationDays') || 1;
  const totalRentalPrice = dailyRate * rentalDays + deposit;

  const canProceedFromStep1 = !!selectedClientId && !!selectedVehicleId;

  // Realtime — unlocks PDF the moment the remote client completes the mobile flow
  useEffect(() => {
    if (!isSubmitted || !newContractId) return;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`contract-${newContractId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'contracts', filter: `id=eq.${newContractId}` },
        (payload) => {
          const updated = payload.new as any;
          if ((updated.status === 'signed' || updated.status === 'completed') && updated.signature_url) {
            setContractData((prev) => prev ? { ...prev, signature: updated.signature_url } : prev);
            setSigningMode('remote'); // surface QR screen with unlocked PDF
            addNotification('Contract Signed!', 'Client completed the mobile flow. PDF is now ready.', 'success');
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isSubmitted, newContractId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocalDocUpload = async (type: DocumentType, file: File) => {
    if (!frozenClient?.id) return;
    setLocalDocStates((p) => ({ ...p, [type]: 'uploading' }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      await uploadClientDocument(frozenClient.id, type, fd);
      setLocalDocStates((p) => ({ ...p, [type]: 'done' }));
    } catch {
      setLocalDocStates((p) => ({ ...p, [type]: 'error' }));
    }
  };

  const handleLocalSign = async () => {
    if (!localSigRef.current || localSigRef.current.isEmpty() || !newContractId) return;
    setIsLocalSignPending(true);
    try {
      const dataUrl = localSigRef.current.toDataURL('image/png');
      await submitContractSignature(newContractId, dataUrl);
      setContractData((prev) => prev ? { ...prev, signature: dataUrl } : prev);
      addNotification('Signed!', 'Documents uploaded and contract signed. PDF is now ready.', 'success');
      setSigningMode('remote');
    } catch (err: any) {
      addNotification('Error', err.message || 'Failed to save signature.', 'error');
    } finally {
      setIsLocalSignPending(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setValue('clientName', client.full_name, { shouldValidate: true });
    setValue('clientPhone', client.phone, { shouldValidate: true });
    setValue('clientAddress', client.address ?? '', { shouldValidate: true });
    setValue('clientBirthDate', client.id_expiry_date ?? '', { shouldValidate: true });
    setValue('clientBirthPlace', client.city ?? '', { shouldValidate: true });
    setValue('licenseNumber', client.driver_license_number ?? '', { shouldValidate: true });
    setValue('licenseDate', client.driver_license_expiry ?? '', { shouldValidate: true });
  };

  const handleSelectVehicle = (v: Vehicle) => {
    setSelectedVehicleId(v.id);
    setValue('vehicleId', v.id, { shouldValidate: true });
    setValue('vehicleMake', v.brand, { shouldValidate: true });
    setValue('vehicleModel', v.model, { shouldValidate: true });
    setValue('vehicleYear', v.year ?? new Date().getFullYear(), { shouldValidate: true });
    setValue('vehiclePlate', v.license_plate, { shouldValidate: true });
    setValue('vehicleStartMileage', v.mileage ?? 0, { shouldValidate: true });
    setValue('vehicleRegistrationDate', '', { shouldValidate: true });
  };

  const onFormError = (errors: any) => {
    console.error("Validation Errors:", errors);
    addNotification('Validation Error', 'Please check all required fields before generating the contract.', 'error');
  };

  const onFormSubmit = (data: ContractFormData) => {
    startTransition(async () => {
      try {
        setFrozenClient(clients.find(c => c.id === selectedClientId));
        setFrozenVehicle(vehicles.find(v => v.id === selectedVehicleId));
        
        const newContract = await addContract({
          ...({} as any),
          status: 'pending_signature' as any,
          client_id: selectedClientId!,
          contract_number: data.contractId,
          vehicle_id: data.vehicleId,
          start_date: data.startDate,
          end_date: data.endDate,
          total_days: data.rentalDurationDays,
          daily_rate: data.dailyRate,
          subtotal: data.dailyRate * data.rentalDurationDays,
          total_amount: data.dailyRate * data.rentalDurationDays,
          deposit_amount: data.deposit,
          signature_url: data.signature,
          // Capture vehicle's current odometer reading at contract creation.
          // ProcessReturnModal uses this as the minimum valid return mileage.
          extra_data: {
            vehicle_start_mileage: data.vehicleStartMileage ?? 0,
          },
        });

        await updateVehicle(data.vehicleId, { status: 'rented' });

        setContractData(data);
        setNewContractId(newContract.id);
        setContractLink(
          `${typeof window !== 'undefined' ? window.location.origin : ''}/sign/${newContract.id}`
        );
        setIsSubmitted(true);
        addNotification('Contract Created', `Agreement for ${data.clientName} has been generated.`, 'success');
      } catch (err: any) {
        console.error("DB Submission Error:", err);
        addNotification('Submission Error', err.message || 'Failed to create contract. Please try again.', 'error');
      }
    });
  };


  const downloadPDF = async () => {
    if (!contractData?.signature) {
      addNotification('Not Ready', 'Waiting for client signature before PDF can be generated.', 'error');
      return;
    }
    try {
      if (!contractData || !frozenClient || !frozenVehicle) return;
      setIsPdfLoading(true);

      const rentalDurationDays = Math.ceil(
        (new Date(contractData.endDate).getTime() - new Date(contractData.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) || 1;

      // Use the shared safe utility: validates HTTP status, re-encodes via
      // canvas to guarantee data:image/png;base64 regardless of storage format.
      const signatureBase64 = await signatureUrlToPngBase64(contractData.signature);

      const doc = generateAdvancedPDF({
        clientName: frozenClient?.full_name || frozenClient?.name,
        clientPhone: frozenClient?.phone,
        clientAddress: frozenClient?.address,
        clientBirthDate: frozenClient?.id_expiry_date,
        licenseNumber: frozenClient?.driver_license_number,
        startDate: new Date(contractData.startDate).toLocaleDateString(),
        endDate: new Date(contractData.endDate).toLocaleDateString(),
        rentalDurationDays,
        dailyRate: frozenVehicle?.daily_rate,
        vehicleMake: frozenVehicle?.brand,
        vehicleModel: frozenVehicle?.model,
        vehiclePlate: frozenVehicle?.license_plate,
        vehicleRegistrationDate: frozenVehicle?.year,
        deposit: contractData.deposit || 200,
        vehicleStartMileage: frozenVehicle?.mileage,
        signature: signatureBase64,
      });

      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Contrat_Location_${frozenClient?.full_name || 'Client'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      addNotification('Success', 'PDF downloaded with embedded signature.', 'success');
    } catch (err: any) {
      addNotification('Error', 'PDF generation failed: ' + err.message, 'error');
    } finally {
      setIsPdfLoading(false);
    }
  };

  // ── Screen: Awaiting Docs & Signature ─────────────────────────────────────
  if (isSubmitted && contractData && signingMode === null) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
        <div className="w-24 h-24 bg-amber-50 text-amber-500 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Clock size={44} />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Awaiting Docs &amp; Signature</h2>
          <p className="text-slate-500 mt-2">
            Contract for <span className="font-bold text-slate-800">{contractData.clientName}</span> is pending.
            <br />The PDF will unlock once documents are uploaded and the client signs.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <button
            type="button"
            onClick={() => { setSigningMode('local'); setLocalStep('upload'); }}
            className="p-8 bg-white border-2 border-slate-200 hover:border-slate-900 rounded-2xl text-start flex flex-col gap-3 transition-all group shadow-sm"
          >
            <div className="w-12 h-12 bg-slate-100 group-hover:bg-slate-900 rounded-xl flex items-center justify-center transition-colors">
              <PenLine size={24} className="text-slate-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Client is Present</p>
              <p className="text-sm text-slate-500 mt-1">Upload docs &amp; sign on this device</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSigningMode('remote')}
            className="p-8 bg-white border-2 border-slate-200 hover:border-slate-900 rounded-2xl text-start flex flex-col gap-3 transition-all group shadow-sm"
          >
            <div className="w-12 h-12 bg-slate-100 group-hover:bg-slate-900 rounded-xl flex items-center justify-center transition-colors">
              <QrCode size={24} className="text-slate-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Send to Mobile</p>
              <p className="text-sm text-slate-500 mt-1">Client uploads docs &amp; signs via QR</p>
            </div>
          </button>
        </div>
        <p className="text-[11px] text-slate-400 italic">
          This page listens live — the PDF button will unlock automatically when the client completes the mobile flow.
        </p>
      </div>
    );
  }

  // ── Screen: Local 2-step (Upload → Sign) ──────────────────────────────────
  if (isSubmitted && contractData && signingMode === 'local') {
    const DOC_SLOTS: { key: DocumentType; label: string }[] = [
      { key: 'id_front',      label: 'ID Card — Front' },
      { key: 'id_back',       label: 'ID Card — Back' },
      { key: 'license_front', label: 'Driver License — Front' },
      { key: 'license_back',  label: 'Driver License — Back' },
    ];
    return (
      <div className="max-w-xl mx-auto space-y-6 py-12">
        <button
          type="button"
          onClick={() => setSigningMode(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2', localStep === 'upload' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-400')}>
            1
          </div>
          <div className="flex-1 h-0.5 bg-slate-200" />
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2', localStep === 'sign' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 text-slate-400')}>
            2
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {localStep === 'upload' ? 'Upload Documents' : 'Client Signature'}
          </span>
        </div>

        {/* Step 1: Upload */}
        {localStep === 'upload' && (
          <div className="space-y-4">
            <p className="text-slate-500 text-sm">Upload or photograph all 4 documents before proceeding to the signature.</p>
            <div className="grid grid-cols-2 gap-3">
              {DOC_SLOTS.map((slot) => {
                const state = localDocStates[slot.key];
                return (
                  <div
                    key={slot.key}
                    className={cn(
                      'aspect-[3/2] border-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 px-2 transition-all cursor-pointer relative group',
                      state === 'done'      && 'border-green-400 bg-green-50',
                      state === 'uploading' && 'border-slate-300 bg-slate-50',
                      state === 'error'     && 'border-red-300 bg-red-50',
                      state === 'idle'      && 'border-dashed border-slate-300 bg-slate-50 hover:border-slate-500',
                    )}
                    onClick={() => state !== 'uploading' && localFileRefs.current[slot.key]?.click()}
                  >
                    {state === 'uploading' ? (
                      <Loader2 size={20} className="animate-spin text-slate-400" />
                    ) : state === 'done' ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : (
                      <IdCardIcon size={18} className="text-slate-400" />
                    )}
                    <p className="text-[9px] font-bold text-slate-500 text-center leading-tight">{slot.label}</p>
                    {state === 'done' && <p className="text-[8px] font-bold text-green-600 uppercase tracking-wide">Uploaded</p>}
                    {state === 'error' && <p className="text-[8px] font-bold text-red-500 uppercase tracking-wide">Retry</p>}
                    <input
                      ref={(el) => { localFileRefs.current[slot.key] = el; }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLocalDocUpload(slot.key, file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!allLocalDocsDone}
                onClick={() => setLocalStep('sign')}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Signature <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Sign */}
        {localStep === 'sign' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Client Signature</h2>
              <p className="text-slate-500 text-sm mt-1">Ask the client to sign in the box below.</p>
            </div>
            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-slate-50">
              <p className="absolute top-3 start-3 text-xs text-slate-300 font-medium pointer-events-none select-none">Sign Here</p>
              <SignatureCanvas
                ref={localSigRef}
                penColor="black"
                canvasProps={{ className: 'w-full h-64', style: { touchAction: 'none' } }}
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => localSigRef.current?.clear()}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleLocalSign}
                disabled={isLocalSignPending}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLocalSignPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {isLocalSignPending ? 'Saving…' : 'Confirm Signature'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Screen: Remote QR / PDF Unlock ────────────────────────────────────────
  if (isSubmitted && contractData && signingMode === 'remote') {
    const isSigned = !!contractData.signature;
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
        <div className={cn(
          'w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-xl',
          isSigned ? 'bg-blue-100 text-blue-600 shadow-blue-900/10' : 'bg-amber-50 text-amber-500 shadow-amber-900/10'
        )}>
          {isSigned ? <CheckCircle2 size={48} /> : <Clock size={44} />}
        </div>
        <h2 className="text-3xl font-bold border-b pb-4 text-slate-900">
          {isSigned ? 'Contract Fully Signed!' : 'Waiting for Client…'}
        </h2>

        {isSigned ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
            <CheckCircle2 size={12} /> Signature &amp; Documents Received
          </span>
        ) : (
          <p className="text-slate-500 text-sm">
            Share the QR code or link with{' '}
            <span className="font-bold text-slate-800">{contractData.clientName}</span>.
            <br />The client will upload their documents and sign — this page updates automatically.
          </p>
        )}

        {/* QR code always visible so client can still scan */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm inline-flex flex-col items-center gap-4">
          <QRCodeCanvas value={contractLink || 'https://nokhba.app'} size={200} level="H" className="rounded-xl" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Scan to Upload Docs &amp; Sign
          </p>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          {/* PDF locked until signed */}
          <button
            type="button"
            disabled={!isSigned || isPdfLoading}
            onClick={downloadPDF}
            title={!isSigned ? 'Waiting for client signature' : 'Download signed PDF'}
            className={cn(
              'px-8 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2',
              isSigned
                ? 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            )}
          >
            {isPdfLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isSigned ? 'Download PDF' : 'PDF Locked — Awaiting Signature'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/contracts')}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            Done <ChevronRight size={18} />
          </button>
        </div>

        {!isSigned && (
          <button
            type="button"
            onClick={() => setSigningMode(null)}
            className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Switch to local signing instead
          </button>
        )}
      </div>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">
      {isSignatureModalOpen && (
        <SignatureModal
          onSave={(dataUrl) => {
            setValue('signature', dataUrl, { shouldValidate: true });
            setIsSignatureModalOpen(false);
          }}
          onCancel={() => setIsSignatureModalOpen(false)}
        />
      )}

      {/* Wizard Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 start-0 end-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          {STEPS.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                  step >= s.id
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-400'
                )}
              >
                <s.icon size={18} />
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-widest mt-2',
                  step >= s.id ? 'text-slate-900' : 'text-slate-400'
                )}
              >
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onFormSubmit as any, onFormError)}
        className="bg-surface-container-lowest border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden"
      >
        <div className="p-8">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Selection ─── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* ── Left: Client Picker ── */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        <User size={14} className="text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Select Client</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          {clients.length} registered
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1">
                      {clients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                          <User size={28} className="text-slate-300 mb-2" />
                          <p className="text-sm font-semibold text-slate-500">No clients yet</p>
                          <p className="text-xs text-slate-400 mt-0.5">Add a client from the Clients page first</p>
                        </div>
                      ) : (
                        clients.map((client) => {
                          const isSelected = selectedClientId === client.id;
                          return (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => handleSelectClient(client)}
                              className={cn(
                                'w-full p-4 rounded-2xl border-2 text-start transition-all duration-150',
                                isSelected
                                  ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                  : 'border-slate-100 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm'
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-bold text-sm truncate">{client.full_name}</p>
                                  <p
                                    className={cn(
                                      'text-xs mt-0.5 flex items-center gap-1.5',
                                      isSelected ? 'text-slate-300' : 'text-slate-500'
                                    )}
                                  >
                                    <Phone size={10} />
                                    {client.phone}
                                  </p>
                                  <p
                                    className={cn(
                                      'text-[10px] mt-0.5 flex items-center gap-1.5 font-semibold uppercase tracking-wide',
                                      isSelected ? 'text-slate-400' : 'text-slate-400'
                                    )}
                                  >
                                    <IdCard size={10} />
                                    {client.driver_license_number ?? '—'}
                                  </p>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 size={18} className="text-white shrink-0 mt-0.5" />
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Divider (visible on md+) */}
                  <div className="hidden md:block absolute inset-y-8 left-1/2 w-px bg-slate-100" />

                  {/* ── Right: Vehicle Picker ── */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Car size={14} className="text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Select Vehicle</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          {vehicles.length} available
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1">
                      {vehicles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                          <Car size={28} className="text-slate-300 mb-2" />
                          <p className="text-sm font-semibold text-slate-500">No vehicles available</p>
                          <p className="text-xs text-slate-400 mt-0.5">All vehicles are currently in use or maintenance</p>
                        </div>
                      ) : (
                        vehicles.map((v) => {
                          const isSelected = selectedVehicleId === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleSelectVehicle(v)}
                              className={cn(
                                'w-full p-4 rounded-2xl border-2 text-start transition-all duration-150',
                                isSelected
                                  ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                  : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300 hover:shadow-sm'
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Car
                                      size={16}
                                      className={cn(isSelected ? 'text-slate-300' : 'text-slate-400')}
                                    />
                                    <span
                                      className={cn(
                                        'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md',
                                        isSelected
                                          ? 'bg-white/15 text-white'
                                          : 'bg-slate-200 text-slate-500'
                                      )}
                                    >
                                      {v.fuel_type ?? 'N/A'}
                                    </span>
                                  </div>
                                  <p className="font-bold text-sm">
                                    {v.brand} {v.model}
                                  </p>
                                  <p
                                    className={cn(
                                      'text-xs mt-0.5',
                                      isSelected ? 'text-slate-300' : 'text-slate-400'
                                    )}
                                  >
                                    {v.license_plate} · {v.year}
                                  </p>
                                </div>
                                {isSelected && (
                                  <CheckCircle2 size={18} className="text-white shrink-0 mt-0.5" />
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Selection summary */}
                {(selectedClientId || selectedVehicleId) && (
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    {selectedClientId ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                        <CheckCircle2 size={12} />
                        {clients.find((c) => c.id === selectedClientId)?.full_name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No client selected</span>
                    )}
                    <span className="text-slate-300">+</span>
                    {selectedVehicleId ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                        <CheckCircle2 size={12} />
                        {vehicles.find((v) => v.id === selectedVehicleId)?.brand}{' '}
                        {vehicles.find((v) => v.id === selectedVehicleId)?.model}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No vehicle selected</span>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Step 2: Terms ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Selected pair summary */}
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <User size={14} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{watch('clientName')}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Client</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 shrink-0" />
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Car size={14} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {watch('vehicleMake')} {watch('vehicleModel')}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        {watch('vehiclePlate')} · {watch('vehicleYear')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm transition-all shrink-0"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Clock size={14} /> Pickup Date
                    </label>
                    <input type="date" {...register('startDate')} className={inputClass} />
                    {errors.startDate && (
                      <p className="text-[10px] text-red-500 font-medium">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Clock size={14} /> Return Date
                    </label>
                    <input type="date" {...register('endDate')} className={inputClass} />
                    {errors.endDate && (
                      <p className="text-[10px] text-red-500 font-medium">{errors.endDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Pickup Location
                    </label>
                    <select {...register('pickupLocation')} className={inputClass}>
                      <option value="">— Select location —</option>
                      <optgroup label="Cities">
                        {['Casablanca','Rabat','Marrakech','Fès','Tangier','Agadir','Meknès','Oujda','Tétouan','Salé','El Jadida','Nador','Kénitra','Mohammedia','Beni Mellal','Khouribga','Settat','Safi','Larache','Berkane','Taza','Khémisset','Essaouira','Ouarzazate'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Airports">
                        {['Mohammed V (CMN) — Casablanca','Marrakech Menara (RAK)','Agadir Al Massira (AGA)','Tangier Ibn Battuta (TNG)','Fès–Saïs (FEZ)','Rabat–Salé (RBA)','Nador International (NDR)','Oujda Angads (OUD)','Essaouira–Mogador (ESU)','Ouarzazate (OZZ)','Dakhla (VIL)','Laâyoune Hassan I (EUN)'].map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </optgroup>
                    </select>
                    {errors.pickupLocation && (
                      <p className="text-[10px] text-red-500 font-medium">{errors.pickupLocation.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Return Location
                    </label>
                    <select {...register('returnLocation')} className={inputClass}>
                      <option value="">— Select location —</option>
                      <optgroup label="Cities">
                        {['Casablanca','Rabat','Marrakech','Fès','Tangier','Agadir','Meknès','Oujda','Tétouan','Salé','El Jadida','Nador','Kénitra','Mohammedia','Beni Mellal','Khouribga','Settat','Safi','Larache','Berkane','Taza','Khémisset','Essaouira','Ouarzazate'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Airports">
                        {['Mohammed V (CMN) — Casablanca','Marrakech Menara (RAK)','Agadir Al Massira (AGA)','Tangier Ibn Battuta (TNG)','Fès–Saïs (FEZ)','Rabat–Salé (RBA)','Nador International (NDR)','Oujda Angads (OUD)','Essaouira–Mogador (ESU)','Ouarzazate (OZZ)','Dakhla (VIL)','Laâyoune Hassan I (EUN)'].map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </optgroup>
                    </select>
                    {errors.returnLocation && (
                      <p className="text-[10px] text-red-500 font-medium">{errors.returnLocation.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-slate-200 col-span-1 md:col-span-2">
                    <h4 className="text-sm font-bold text-slate-900 mb-4">Rental Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Contract ID
                        </label>
                        <input
                          {...register('contractId')}
                          readOnly
                          className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed font-medium`}
                        />
                        <p className="text-[10px] text-slate-400">Auto-generated sequential ID</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Duration (Days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          {...register('rentalDurationDays', { valueAsNumber: true })}
                          className={inputClass}
                        />
                        <p className="text-[10px] text-slate-400">Auto-calculated from dates</p>
                        {errors.rentalDurationDays && (
                          <p className="text-[10px] text-red-500">{errors.rentalDurationDays.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Insurance Option
                        </label>
                        <select {...register('insuranceOption')} className={inputClass}>
                          <option value="Basic">Basic</option>
                          <option value="Premium">Premium</option>
                          <option value="Full Coverage">Full Coverage</option>
                        </select>
                        {errors.insuranceOption && (
                          <p className="text-[10px] text-red-500">{errors.insuranceOption.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="hasOtherDrivers"
                      {...register('hasOtherDrivers')}
                      className="mt-1 w-4 h-4 text-slate-900 bg-slate-50 border-slate-300 rounded focus:ring-slate-900/20"
                    />
                    <label htmlFor="hasOtherDrivers" className="text-sm text-slate-700">
                      <span className="font-bold block">Other drivers authorized</span>
                      <span className="text-xs text-slate-500 italic block">
                        List these drivers on a separate sheet with their license number.
                        Required: driver must be at least 21 years old.
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                      <UserPlus size={12} /> Client Details
                    </h4>
                    <p className="text-sm font-bold text-slate-900">{watch('clientName') || 'Not set'}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Phone size={10} /> {watch('clientPhone') || '---'}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                        <IdCard size={10} /> {watch('licenseNumber') || '---'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                      <Car size={12} /> Selected Vehicle
                    </h4>
                    <p className="text-sm font-bold text-slate-900">
                      {watch('vehicleMake')} {watch('vehicleModel')}
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <p className="text-xs text-slate-500 font-medium">{watch('vehiclePlate')} · {watch('vehicleYear')}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl md:col-span-2 shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                      <Calendar size={12} /> Rental Logistics
                    </h4>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Pick-up</p>
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Clock size={10} /> {watch('startDate') || '---'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {watch('pickupLocation') || '---'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Return</p>
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Clock size={10} /> {watch('endDate') || '---'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {watch('returnLocation') || '---'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Contract ID</p>
                        <p className="text-xs font-bold text-slate-700">{watch('contractId') || '---'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Duration</p>
                        <p className="text-xs font-bold text-slate-700">{watch('rentalDurationDays')} Days</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">Insurance</p>
                        <p className="text-xs font-bold text-slate-700">{watch('insuranceOption')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Initial Vehicle Damages */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Car size={18} /> Initial Vehicle Condition
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const current = watch('initialDamages') || [];
                        setValue(
                          'initialDamages',
                          [
                            ...current,
                            { id: Math.random().toString(36).slice(2, 11), type: 'Minor', description: '', photos: [] },
                          ],
                          { shouldValidate: true }
                        );
                      }}
                      className="text-xs font-bold text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={14} />
                      Add Damage
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(!watch('initialDamages') || watch('initialDamages')!.length === 0) ? (
                      <p className="text-sm text-slate-400 text-center py-4 bg-white rounded-xl border border-slate-100 border-dashed">
                        No pre-existing damages reported.
                      </p>
                    ) : (
                      watch('initialDamages')!.map((damage, index) => (
                        <div key={damage.id} className="p-4 bg-white rounded-xl border border-slate-200 relative">
                          <button
                            type="button"
                            onClick={() => {
                              const current = [...(watch('initialDamages') || [])];
                              current.splice(index, 1);
                              setValue('initialDamages', current, { shouldValidate: true });
                            }}
                            className="absolute top-3 end-3 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="grid grid-cols-3 gap-3 mb-3 pe-8">
                            <div className="col-span-1">
                              <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Type</label>
                              <select
                                value={damage.type}
                                onChange={(e) => {
                                  const current = [...(watch('initialDamages') || [])];
                                  current[index].type = e.target.value as 'Minor' | 'Major';
                                  setValue('initialDamages', current, { shouldValidate: true });
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900"
                              >
                                <option value="Minor">Minor</option>
                                <option value="Major">Major</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Description</label>
                              <input
                                type="text"
                                value={damage.description}
                                onChange={(e) => {
                                  const current = [...(watch('initialDamages') || [])];
                                  current[index].description = e.target.value;
                                  setValue('initialDamages', current, { shouldValidate: true });
                                }}
                                placeholder="e.g. Scratch on front bumper"
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block">Photos</label>
                            <div className="flex flex-wrap gap-2">
                              {damage.photos?.map((photo, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={photo} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = [...(watch('initialDamages') || [])];
                                      current[index].photos?.splice(i, 1);
                                      setValue('initialDamages', [...current], { shouldValidate: true });
                                    }}
                                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer">
                                <ImagePlus size={16} className="mb-0.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length === 0) return;
                                    const current = [...(watch('initialDamages') || [])];
                                    if (!current[index].photos) current[index].photos = [];
                                    files.forEach((file) => {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        current[index].photos!.push(reader.result as string);
                                        setValue('initialDamages', [...current], { shouldValidate: true });
                                      };
                                      reader.readAsDataURL(file);
                                    });
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Euro size={18} /> Pricing Details
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Rate (€)</label>
                      <input
                        type="number"
                        {...register('dailyRate', { valueAsNumber: true })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Deposit (€)</label>
                      <input
                        type="number"
                        {...register('deposit', { valueAsNumber: true })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 lg:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Method</label>
                      <select
                        {...register('paymentMethod')}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Transfer">Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="bg-slate-900 rounded-xl p-4 text-white flex justify-between items-center shadow-lg">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Calculation</p>
                        <p className="text-sm font-medium text-slate-300 mt-1">
                          €{dailyRate} × {rentalDays} {rentalDays === 1 ? 'day' : 'days'} + €{deposit} deposit
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Due Now</p>
                        <p className="text-3xl font-bold tracking-tight">€{totalRentalPrice}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <PenLine size={14} /> Client E-Signature
                    </label>
                    {watch('signature') && (
                      <button
                        type="button"
                        onClick={() => setValue('signature', '', { shouldValidate: true })}
                        className="text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
                      >
                        <X size={14} /> Clear Signature
                      </button>
                    )}
                  </div>

                  {watch('signature') ? (
                    <div className="relative bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={watch('signature')} alt="Client Signature" className="max-h-24 object-contain" />
                      <button
                        type="button"
                        onClick={() => setIsSignatureModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Capture New Signature
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      className="w-full h-40 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 transition-colors"
                    >
                      <PenLine size={32} className="mb-3 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700 mb-1">Click to Capture Signature</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        Required to finalize contract
                      </span>
                    </button>
                  )}
                  {errors.signature && (
                    <p className="text-[10px] text-red-500 font-medium">{errors.signature.message}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={step === 1 ? () => router.push('/contracts') : prevStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={18} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <div className="flex flex-col items-end gap-1">
              {step === 1 && !canProceedFromStep1 && (
                <p className="text-[10px] text-slate-400 font-medium">
                  Select both a client and a vehicle to continue
                </p>
              )}
              <button
                type="button"
                onClick={nextStep}
                disabled={step === 1 && !canProceedFromStep1}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2 w-full">
              {Object.keys(errors).length > 0 && (
                <pre className="bg-red-100 text-red-900 p-4 text-xs overflow-auto w-full rounded-xl text-left">
                  {JSON.stringify(errors, null, 2)}
                </pre>
              )}
              <button
                type="submit"
                onClick={handleSubmit(onFormSubmit as any, onFormError)}
                disabled={isPending}
                className="px-8 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-900/10 hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isPending ? 'Generating…' : 'Generate Contract'}
                <CheckCircle2 size={18} />
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
