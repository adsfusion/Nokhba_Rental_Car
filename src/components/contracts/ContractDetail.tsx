'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Download, Send, Settings, User, Car, Calendar,
  DollarSign, FileImage, FileText, CheckCircle2, Clock, ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ContractWithDetails } from '@/lib/actions/contracts';
import { type DocumentType } from '@/lib/actions/clientDocuments';
import { SignLinkPopover } from './SignLinkPopover';
import { signatureUrlToPngBase64 } from '@/lib/signatureToBase64';
import { getSignatureSignedUrl } from '@/lib/actions/publicContracts';

type Props = {
  contract: ContractWithDetails;
  docUrls: Partial<Record<DocumentType, string>>;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:             { label: 'Draft',             className: 'bg-slate-100 text-slate-600' },
  pending_signature: { label: 'Pending Signature', className: 'bg-amber-100 text-amber-700' },
  active:            { label: 'Active',            className: 'bg-green-100 text-green-700' },
  signed:            { label: 'Signed',            className: 'bg-blue-100 text-blue-700' },
  completed:         { label: 'Completed',         className: 'bg-slate-100 text-slate-500' },
  cancelled:         { label: 'Cancelled',         className: 'bg-red-100 text-red-600' },
};

const DOC_LABELS: Record<DocumentType, string> = {
  id_front:      'ID Card — Front',
  id_back:       'ID Card — Back',
  license_front: 'License — Front',
  license_back:  'License — Back',
};

const ALL_DOC_TYPES: DocumentType[] = ['id_front', 'id_back', 'license_front', 'license_back'];

export function ContractDetail({ contract, docUrls }: Props) {
  const [showSignLink, setShowSignLink] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const statusCfg = STATUS_CONFIG[contract.status] ?? {
    label: contract.status,
    className: 'bg-slate-100 text-slate-600',
  };

  const isSigned = !!contract.signature_url;
  const totalAmount = (contract.daily_rate ?? 0) * (contract.total_days ?? 1);

  // Resolve a short-lived signed URL for the signature preview (and PDF use)
  useEffect(() => {
    if (!contract.signature_url) return;
    let cancelled = false;
    getSignatureSignedUrl(contract.signature_url)
      .then((url) => { if (!cancelled) setSignedPreviewUrl(url); })
      .catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [contract.signature_url]);

  const handleDownloadPDF = async () => {
    if (isPdfLoading) return;
    setIsPdfLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('NOKHBA RENTAL', pageW / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Contract: ${contract.contract_number}`, pageW / 2, y, { align: 'center' });
      y += 6;
      doc.text(`Status: ${statusCfg.label}`, pageW / 2, y, { align: 'center' });
      y += 14;

      // Client
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENT', 20, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      doc.text(`Name: ${contract.clients?.full_name ?? '—'}`, 20, y); y += 5;
      doc.text(`Phone: ${contract.clients?.phone ?? '—'}`, 20, y); y += 5;
      doc.text(`Address: ${contract.clients?.address ?? '—'}`, 20, y); y += 5;
      doc.text(`License: ${contract.clients?.driver_license_number ?? '—'}`, 20, y); y += 12;

      // Vehicle
      doc.setFont('helvetica', 'bold');
      doc.text('VEHICLE', 20, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      doc.text(`${contract.vehicles?.brand ?? ''} ${contract.vehicles?.model ?? ''}`, 20, y); y += 5;
      doc.text(`Year: ${contract.vehicles?.year ?? '—'}`, 20, y); y += 5;
      doc.text(`Plate: ${contract.vehicles?.license_plate ?? '—'}`, 20, y); y += 12;

      // Rental terms
      doc.setFont('helvetica', 'bold');
      doc.text('RENTAL TERMS', 20, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      doc.text(`Start: ${contract.start_date}`, 20, y); y += 5;
      doc.text(`End:   ${contract.end_date}`, 20, y); y += 5;
      doc.text(`Duration: ${contract.total_days} day(s)`, 20, y); y += 5;
      doc.text(`Daily Rate: €${contract.daily_rate}`, 20, y); y += 5;
      doc.text(`Deposit: €${contract.deposit_amount ?? 0}`, 20, y); y += 5;
      doc.text(`Total: €${totalAmount}`, 20, y); y += 12;

      // Signature image:
      // 1. Call getSignatureSignedUrl() — a Server Action that uses the
      //    service-role key to generate a fresh 60-second signed URL from
      //    Supabase Storage (private bucket).  This replaces getPublicUrl()
      //    which returns a URL that 400/403s on private buckets.
      // 2. Pass the signed URL to signatureUrlToPngBase64() which validates
      //    the HTTP response and re-encodes the image to PNG via canvas,
      //    eliminating any jsPDF "wrong PNG signature" crash.
      if (contract.signature_url) {
        const signedUrl = await getSignatureSignedUrl(contract.signature_url);
        const pngDataUrl = await signatureUrlToPngBase64(signedUrl);
        doc.setFont('helvetica', 'bold');
        doc.text('CLIENT SIGNATURE', 20, y);
        y += 6;
        doc.addImage(pngDataUrl, 'PNG', 20, y, 80, 30);
        y += 36;
        if (contract.signed_at) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`Signed: ${new Date(contract.signed_at).toLocaleString()}`, 20, y);
        }
      }

      doc.save(`contract-${contract.contract_number}.pdf`);
    } catch (err: any) {
      // Surface the error to the user with the full diagnostic message
      console.error('[PDF] Download failed:', err);
      alert(`PDF generation failed: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/contracts"
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contract</p>
            <h1 className="text-xl font-black tracking-tight text-slate-900 font-mono">
              {contract.contract_number}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide', statusCfg.className)}>
            {statusCfg.label}
          </span>
          <Link
            href={`/contracts/${contract.id}/edit`}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Settings size={15} /> Edit Contract
          </Link>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <User size={12} /> Client
          </div>
          <p className="text-base font-bold text-slate-900">{contract.clients?.full_name ?? '—'}</p>
          <p className="text-sm text-slate-500">{contract.clients?.phone}</p>
          {contract.clients?.address && (
            <p className="text-sm text-slate-500">{contract.clients.address}</p>
          )}
          {contract.clients?.driver_license_number && (
            <p className="text-xs text-slate-400 font-mono">
              License: {contract.clients.driver_license_number}
            </p>
          )}
        </div>

        {/* Vehicle */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Car size={12} /> Vehicle
          </div>
          <p className="text-base font-bold text-slate-900">
            {contract.vehicles?.brand} {contract.vehicles?.model}
          </p>
          <p className="text-sm text-slate-500">{contract.vehicles?.year}</p>
          {contract.vehicles?.license_plate && (
            <p className="text-xs font-mono text-slate-400 bg-slate-50 border border-slate-200 inline-block px-2 py-0.5 rounded-lg">
              {contract.vehicles.license_plate}
            </p>
          )}
        </div>

        {/* Rental period */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Calendar size={12} /> Rental Period
          </div>
          <p className="text-base font-bold text-slate-900">
            {new Date(contract.start_date).toLocaleDateString()} → {new Date(contract.end_date).toLocaleDateString()}
          </p>
          <p className="text-sm text-slate-500">{contract.total_days} day(s)</p>
        </div>

        {/* Financials */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <DollarSign size={12} /> Financials
          </div>
          <p className="text-base font-bold text-slate-900">€{totalAmount}</p>
          <p className="text-sm text-slate-500">
            €{contract.daily_rate} × {contract.total_days} days
          </p>
          {contract.deposit_amount != null && contract.deposit_amount > 0 && (
            <p className="text-sm text-slate-500">Deposit: €{contract.deposit_amount}</p>
          )}
        </div>
      </div>

      {/* Signature panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Signature</p>
        {isSigned ? (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {signedPreviewUrl ? (
                <img
                  src={signedPreviewUrl}
                  alt="Client signature"
                  className="max-h-24 object-contain"
                />
              ) : previewError ? (
                <p className="text-xs text-red-400 px-2">Could not load signature preview</p>
              ) : (
                <div className="w-40 h-12 animate-pulse bg-slate-200 rounded" />
              )}
            </div>
            {contract.signed_at && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-green-500" />
                Signed {new Date(contract.signed_at).toLocaleString()}
              </p>
            )}
            <button
              onClick={handleDownloadPDF}
              disabled={isPdfLoading}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPdfLoading
                ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
                : <><Download size={15} /> Download PDF</>}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock size={16} />
              <span className="text-sm">Awaiting signature</span>
            </div>
            <button
              onClick={() => setShowSignLink(true)}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Send size={15} /> Send Signature Link
            </button>
          </div>
        )}
      </div>

      {/* Client documents panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
          Client Documents
        </p>
        <div className="grid grid-cols-2 gap-3">
          {ALL_DOC_TYPES.map((type) => {
            const url = docUrls[type];
            const isPdf = url?.includes('.pdf') || url?.toLowerCase().includes('application%2Fpdf');
            return (
              <div
                key={type}
                className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50"
              >
                {url ? (
                  <>
                    {isPdf ? (
                      <div className="h-28 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <FileText size={28} />
                        <p className="text-[10px] font-bold uppercase">PDF</p>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={DOC_LABELS[type]}
                        className="w-full h-28 object-cover"
                      />
                    )}
                    <div className="px-3 py-2 flex items-center justify-between border-t border-slate-200 bg-white">
                      <p className="text-[10px] font-bold text-slate-600 truncate">{DOC_LABELS[type]}</p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink size={10} /> View
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="h-28 flex flex-col items-center justify-center gap-2 text-slate-300">
                    <FileImage size={28} />
                    <p className="text-[10px] font-bold uppercase tracking-wide">Not Uploaded</p>
                  </div>
                )}
                {!url && (
                  <div className="px-3 py-2 border-t border-slate-100 bg-white">
                    <p className="text-[10px] font-bold text-slate-400 truncate">{DOC_LABELS[type]}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Return data panel — shown when contract is completed */}
      {contract.status === 'completed' && contract.returned_at && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Return Details</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {contract.return_mileage != null && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Return Mileage</p>
                <p className="text-sm font-bold text-slate-900">{contract.return_mileage.toLocaleString()} km</p>
              </div>
            )}
            {contract.return_fuel_level && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fuel Level</p>
                <p className="text-sm font-bold text-slate-900">{contract.return_fuel_level}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Returned At</p>
              <p className="text-sm font-bold text-slate-900">
                {new Date(contract.returned_at).toLocaleString()}
              </p>
            </div>
            {contract.return_notes && (
              <div className="col-span-2 md:col-span-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Return Notes</p>
                <p className="text-sm text-slate-700 leading-relaxed">{contract.return_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showSignLink && (
        <SignLinkPopover contractId={contract.id} onClose={() => setShowSignLink(false)} />
      )}
    </div>
  );
}
