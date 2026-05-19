'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, Send, Settings, User, Car, Calendar,
  DollarSign, FileImage, FileText, CheckCircle2, Clock, ExternalLink,
  Loader2, RefreshCw,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { type ContractWithDetails } from '@/lib/actions/contracts';
import { type DocumentType } from '@/lib/actions/clientDocuments';
import { SignLinkPopover } from './SignLinkPopover';
import { signatureUrlToPngBase64 } from '@/lib/signatureToBase64';
import { getSignatureSignedUrl } from '@/lib/actions/publicContracts';
import jsPDF from 'jspdf';

type Props = {
  contract: ContractWithDetails;
  docUrls: Partial<Record<DocumentType, string>>;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
  pending_signature: { label: 'Pending Signature', className: 'bg-amber-100 text-amber-700' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  signed: { label: 'Signed', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-500' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-600' },
};

const DOC_LABELS: Record<DocumentType, string> = {
  id_front: 'ID Card — Front',
  id_back: 'ID Card — Back',
  license_front: 'License — Front',
  license_back: 'License — Back',
};

const ALL_DOC_TYPES: DocumentType[] = ['id_front', 'id_back', 'license_front', 'license_back'];

export function ContractDetail({ contract, docUrls }: Props) {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params?.tenantSlug as string;
  const prefix = tenantSlug ? `/${tenantSlug}` : '';
  const [showSignLink, setShowSignLink] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [localStatus, setLocalStatus] = useState(contract.status);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const statusCfg = STATUS_CONFIG[localStatus] ?? {
    label: localStatus,
    className: 'bg-slate-100 text-slate-600',
  };

  const isSigned = !!contract.signature_url;
  const totalAmount = (contract.daily_rate ?? 0) * (contract.total_days ?? 1);

  // Resolve a short-lived signed URL for the signature preview
  useEffect(() => {
    const sigUrl = contract.signature_url;
    if (!sigUrl) return;
    let cancelled = false;
    const loadSig = async () => {
      try {
        const url = await getSignatureSignedUrl(sigUrl);
        if (!cancelled) setSignedPreviewUrl(url);
        const b64 = await signatureUrlToPngBase64(url);
        if (!cancelled) setSignatureData(b64);
      } catch (err) {
        if (!cancelled) setPreviewError(true);
      }
    };
    loadSig();
    return () => { cancelled = true; };
  }, [contract.signature_url]);

  const handleCompleteContract = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: contractError } = await supabase
        .from('contracts')
        .update({ status: 'completed', returned_at: new Date().toISOString() })
        .eq('id', contract.id);
      if (contractError) throw contractError;

      if (contract.vehicle_id) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({ status: 'available' })
          .eq('id', contract.vehicle_id);
        if (vehicleError) throw vehicleError;
      }

      // Instant UI update — don't wait for server round-trip
      setLocalStatus('completed');
      // Background refresh so server data stays in sync
      router.refresh();
    } catch (err: any) {
      console.error('[Complete Contract] Failed:', err);
      alert(`Failed to complete contract: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (isPdfLoading) return;
    setIsPdfLoading(true);
    try {
      const doc = new jsPDF();

      doc.setFont("helvetica");

      // --- Header ---
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 130, 246);
      doc.text("NOKHBA", 10, 15);
      doc.setTextColor(239, 68, 68);
      doc.text("RENTAL", 45, 15);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Contrat de location de véhicule entre particuliers", 80, 15);

      // Helper for drawing bounding boxes and titles
      const drawBox = (x: number, y: number, w: number, h: number, title: string) => {
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);
        doc.rect(x, y, w, h);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(title, x + 2, y + 4);
        doc.setDrawColor(220, 220, 220);
        doc.line(x, y + 6, x + w, y + 6);
      };

      // Section 1: Le locataire
      drawBox(10, 20, 90, 65, "Le locataire");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Prénom et Nom :", 12, 30);
      doc.text(contract.clients?.full_name || ".......................................................", 38, 30);

      doc.text("Téléphone :", 12, 36);
      doc.text(contract.clients?.phone || ".......................................................", 30, 36);

      doc.text("Adresse :", 12, 42);
      doc.text(contract.clients?.address || ".......................................................", 27, 42);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("(à confirmer par justif. de domicile)", 12, 45);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Permis de conduire no :", 12, 57);
      doc.text(contract.clients?.driver_license_number || ".......................................................", 45, 57);

      doc.rect(12, 67, 3, 3);
      doc.text("d'autres conducteurs sont autorisés à conduire le véhicule", 17, 70);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("lister ces conducteurs sur une feuille séparée", 12, 74);
      doc.text("Le conducteur doit avoir au moins 21 ans et 2 ans de permis.", 12, 81);

      // Section 2: La Location
      drawBox(10, 88, 90, 30, "La Location");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Début de location :", 12, 98);
      doc.text(new Date(contract.start_date).toLocaleDateString() || "......................................", 58, 98);

      doc.text("Fin de location :", 12, 104);
      doc.text(new Date(contract.end_date).toLocaleDateString() || "......................................", 58, 104);

      doc.text("Durée :", 12, 110);
      doc.text(`${contract.total_days || "......"} jour(s)`, 45, 110);

      doc.text("Prix total de la location :", 12, 116);
      doc.text(`${totalAmount} €`, 48, 116);

      // Section 3: Le Propriétaire
      drawBox(105, 20, 95, 25, "Le Propriétaire");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Prénom et Nom :", 107, 30);
      doc.text("NOKHBA RENTAL", 135, 30);
      doc.text("Téléphone(s) :", 107, 36);
      doc.text("+212 6 00 00 00 00", 130, 36);

      // Section 4: Le Véhicule loué
      drawBox(105, 48, 95, 25, "Le Véhicule loué");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Marque et modèle :", 107, 58);
      doc.text(`${contract.vehicles?.brand || ''} ${contract.vehicles?.model || ''}`, 135, 58);
      doc.text("Immatriculation :", 107, 64);
      doc.text(contract.vehicles?.license_plate || "......................................", 132, 64);
      doc.text("Année :", 107, 70);
      doc.text(contract.vehicles?.year?.toString() || "...........................", 150, 70);

      // Section 5: Assurance, Assistance, dépôt de garantie
      drawBox(105, 76, 95, 55, "Assurance, Assistance, dépôt de garantie");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Dépôt de garantie : chèque de", 107, 86);
      doc.text(contract.deposit_amount?.toString() || "............", 152, 86);
      doc.text("€", 170, 86);

      doc.text("En cas d'accident, vol ou panne :", 107, 97);
      doc.text("- le locataire doit prévenir le propriétaire, établir un constat", 107, 100);
      doc.text("amiable en cas d'accident, un dépôt de plainte au commissariat.", 107, 103);
      doc.text("- Prévenez dès que possible l'assurance.", 107, 106);

      // Section 6: État du véhicule avant la location
      drawBox(10, 135, 190, 65, "État du véhicule avant la location");

      // Car Diagram Placeholder
      doc.setDrawColor(200, 200, 200);
      doc.rect(12, 145, 85, 45);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("Schéma carrosserie (Placeholder)", 30, 168);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(0, 0, 0);
      doc.text("noter sur ce schéma les accrocs sur la carrosserie", 22, 195);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Compteur km au départ :", 105, 145);
      // @ts-ignore - dynamic json field
      doc.text(contract.extra_data?.vehicle_start_mileage?.toString() || "................", 145, 145);
      doc.text("km", 165, 145);

      doc.text("Carburant :", 145, 155);
      doc.rect(165, 148, 25, 10);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("Jauge", 172, 154);
      doc.setTextColor(0, 0, 0);

      doc.setFontSize(9);
      doc.text("État extérieur :", 105, 165);
      doc.text(".........................................................................................", 105, 172);

      doc.text("État intérieur :", 105, 185);
      doc.text(".........................................................................................", 105, 192);

      // Section 7: Clauses and signatures
      doc.setDrawColor(150, 150, 150);
      doc.rect(10, 205, 190, 28);

      doc.rect(12, 208, 3, 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Les clauses de location s'appliquent (recommandé).", 17, 211);

      doc.setFontSize(9);
      doc.text("Signature du locataire :", 20, 225);
      // Inject secure signature
      if (signatureData) {
        doc.addImage(signatureData, "PNG", 60, 220, 25, 10);
      }
      doc.text("Signature du propriétaire :", 110, 225);

      // Section 8: Remplir au retour
      doc.rect(10, 238, 190, 50);
      doc.setFillColor(240, 240, 240);
      doc.rect(10, 238, 8, 50, 'F');
      doc.setDrawColor(150, 150, 150);
      doc.rect(10, 238, 190, 50, 'S');

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(150, 150, 150);
      doc.text("remplir au retour", 16, 282, { angle: 90 });

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      doc.text("Date et heure réelles de fin de location :", 20, 245);
      doc.text(contract.returned_at ? new Date(contract.returned_at).toLocaleDateString() : "..........................................", 75, 245);

      doc.text("Compteur km au retour :", 20, 251);
      doc.text(contract.return_mileage?.toString() || "...........................", 55, 251);

      doc.text("Carburant au retour :", 145, 245);
      doc.setDrawColor(200, 200, 200);
      doc.rect(175, 239, 20, 8);
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text(contract.return_fuel_level || "Jauge", 180, 244);
      doc.setTextColor(0, 0, 0);

      doc.setDrawColor(150, 150, 150);
      doc.setFontSize(9);
      doc.text("Compte-rendu final de la location :", 20, 268);

      doc.rect(70, 265, 3, 3);
      doc.text("Aucun dommage - dépôt de garantie restitué.", 75, 268);

      doc.rect(70, 271, 3, 3);
      doc.text("Dommages légers - dépôt de garantie restitué contre paiement.", 75, 274);

      doc.rect(70, 277, 3, 3);
      doc.setFont("helvetica", "bold");
      doc.text("Dommages importants - dépôt de garantie encaissé ou conservé", 75, 280);

      // Native save method! Chrome will respect it because it's synchronous.
      doc.save(`NOKHBA-CTR-${contract.contract_number || 'Contract'}.pdf`);
    } catch (err: any) {
      console.error('[PDF] Download failed:', err);
      alert(`PDF generation failed: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="max-w-[896px] mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href={`${prefix}/contracts`}
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
            href={`${prefix}/contracts/${contract.id}/edit`}
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
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadPDF}
                disabled={isPdfLoading}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPdfLoading
                  ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
                  : <><Download size={15} /> Download PDF</>}
              </button>
              {localStatus === 'signed' && (
                <button
                  onClick={handleCompleteContract}
                  disabled={isCompleting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCompleting
                    ? <><Loader2 size={15} className="animate-spin" /> Completing…</>
                    : <><RefreshCw size={15} /> Complete Contract</>}
                </button>
              )}
            </div>
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
      {localStatus === 'completed' && contract.returned_at && (
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