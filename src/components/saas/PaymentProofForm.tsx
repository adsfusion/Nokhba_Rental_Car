'use client';

import { useState, useTransition, useRef } from 'react';
import { submitPaymentProof } from '@/lib/actions/payments';
import { Building2, Wallet, Upload, ImagePlus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type Plan = { id: string; name: string; price: number; currency: string; billing_period: string; duration_days: number; max_vehicles: number; };
type PaymentMethod = { id: string; type: string; label: string; details: Record<string, string>; };

export function PaymentProofForm({
  tenantSlug,
  plans,
  paymentMethods,
  currentPlanId,
}: {
  tenantSlug: string;
  plans: Plan[];
  paymentMethods: PaymentMethod[];
  currentPlanId: string | null;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId || plans[0]?.id || '');
  const [selectedMethodId, setSelectedMethodId] = useState(paymentMethods[0]?.id || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedPlan   = plans.find(p => p.id === selectedPlanId);
  const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, or WEBP images are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!previewUrl || !fileRef.current?.files?.[0]) {
      setError('Please upload a payment proof image.');
      return;
    }
    setError(null);

    const formData = new FormData(e.currentTarget);
    // Ensure the file is included correctly
    formData.set('proof_image', fileRef.current.files[0]);

    startTransition(async () => {
      const result = await submitPaymentProof(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-12 text-center">
        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
        <h4 className="font-black text-emerald-900 text-2xl mb-2">Proof Submitted!</h4>
        <p className="text-emerald-700 font-medium max-w-sm mx-auto">
          Your payment proof has been submitted successfully. Our team will review it within 24 hours and activate your subscription.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ── Step 1: Choose Plan ──────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">1</span>
            Select Plan to Purchase
          </h4>
        </div>
        <div className="p-6">
          <input type="hidden" name="subscription_plan_id" value={selectedPlanId} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${selectedPlanId === plan.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
              >
                <p className="font-bold text-base">{plan.name}</p>
                <p className={`text-sm font-semibold mt-1 ${selectedPlanId === plan.id ? 'text-slate-300' : 'text-slate-500'}`}>
                  {plan.price} {plan.currency} · {plan.duration_days}d · {plan.max_vehicles} vehicles
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step 2: Payment Method & Account ────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">2</span>
            Choose Payment Channel
          </h4>
        </div>
        <div className="p-6 space-y-4">
          {paymentMethods.length === 0 && (
            <p className="text-slate-500 font-medium text-sm text-center py-4">No payment methods configured. Contact your administrator.</p>
          )}
          {paymentMethods.map(method => (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethodId(method.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${selectedMethodId === method.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${method.type === 'bank' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'}`}>
                {method.type === 'bank' ? <Building2 size={18} /> : <Wallet size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">{method.label}</p>
                {method.type === 'bank' && (
                  <div className="mt-2 space-y-1 text-xs font-medium text-slate-600">
                    {method.details.bank_name    && <p>🏦 Bank: <strong>{method.details.bank_name}</strong></p>}
                    {method.details.account_name && <p>👤 Name: <strong>{method.details.account_name}</strong></p>}
                    {method.details.iban          && <p>💳 IBAN: <strong className="font-mono">{method.details.iban}</strong></p>}
                    {method.details.swift         && <p>🔁 SWIFT: <strong>{method.details.swift}</strong></p>}
                  </div>
                )}
                {method.type === 'crypto' && (
                  <div className="mt-2 space-y-1 text-xs font-medium text-slate-600">
                    {method.details.currency       && <p>🪙 Currency: <strong>{method.details.currency}</strong></p>}
                    {method.details.network        && <p>🔗 Network: <strong>{method.details.network}</strong></p>}
                    {method.details.wallet_address && <p className="break-all">📋 Address: <strong className="font-mono">{method.details.wallet_address}</strong></p>}
                  </div>
                )}
              </div>
            </button>
          ))}
          <input type="hidden" name="payment_method_id" value={selectedMethodId} />
        </div>
      </div>

      {/* ── Step 3: Amount & Notes ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">3</span>
            Enter Transfer Details
          </h4>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="amount_paid" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Amount Paid</label>
            <div className="relative flex items-center">
              <input
                type="number"
                id="amount_paid"
                name="amount_paid"
                required
                step="0.01"
                min="0"
                defaultValue={selectedPlan?.price || ''}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 pr-20"
              />
              <div className="absolute right-3">
                <select name="currency" defaultValue={selectedPlan?.currency || 'MAD'}
                  className="text-xs font-bold text-slate-600 bg-transparent focus:outline-none cursor-pointer">
                  <option value="MAD">MAD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="notes" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Note (Optional)</label>
            <input
              type="text"
              id="notes"
              name="notes"
              placeholder="e.g. Transfer date or reference number"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* ── Step 4: Upload Proof ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">4</span>
            Upload Proof of Payment
          </h4>
        </div>
        <div className="p-6">
          <input
            ref={fileRef}
            type="file"
            name="proof_image"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative w-full max-w-sm mx-auto aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              </div>
              <p className="text-sm text-slate-500 text-center font-medium">{fileName}</p>
              <div className="flex justify-center">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="text-sm font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2 transition-colors">
                  Change image
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-slate-900 transition-colors flex items-center justify-center mb-4">
                <ImagePlus size={26} className="text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-slate-900 mb-1 w-full">Click to upload receipt</p>
              <p className="text-sm text-slate-500 w-full">JPG, PNG or WEBP · Max 5MB</p>
            </button>
          )}
        </div>
      </div>

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending || paymentMethods.length === 0}
        className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : <><Upload size={20} /> Submit Payment Proof</>}
      </button>
    </form>
  );
}
