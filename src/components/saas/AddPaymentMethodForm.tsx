'use client';

import { useState, useTransition } from 'react';
import { createPaymentMethod } from '@/lib/actions/platformSettings';
import { Building2, Wallet, AlertCircle } from 'lucide-react';

export function AddPaymentMethodForm() {
  const [type, setType] = useState<'bank' | 'crypto'>('bank');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createPaymentMethod(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      <form action={handleSubmit} className="flex flex-col gap-6">
        {/* Type selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700">Method Type</label>
          <input type="hidden" name="type" value={type} />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setType('bank')}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-bold text-sm transition-all ${type === 'bank' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              <Building2 size={18} /> Bank Transfer
            </button>
            <button type="button" onClick={() => setType('crypto')}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-bold text-sm transition-all ${type === 'crypto' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              <Wallet size={18} /> Cryptocurrency
            </button>
          </div>
        </div>

        {/* Label */}
        <div className="flex flex-col gap-2">
          <label htmlFor="label" className="text-sm font-bold text-slate-700">Display Label</label>
          <input type="text" id="label" name="label" required
            placeholder={type === 'bank' ? 'e.g. CIH Bank — Main Account' : 'e.g. USDT (TRC-20)'}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900" />
        </div>

        {/* Bank-specific fields */}
        {type === 'bank' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'bank_name', label: 'Bank Name', placeholder: 'e.g. CIH Bank' },
              { name: 'account_name', label: 'Account Name', placeholder: 'e.g. Nokhba Technology SARL' },
              { name: 'account_number', label: 'Account Number', placeholder: '0000000000' },
              { name: 'iban', label: 'IBAN', placeholder: 'MA64000...' },
              { name: 'swift', label: 'SWIFT / BIC', placeholder: 'CIHMMAMC' },
              { name: 'branch', label: 'Branch (optional)', placeholder: 'Casablanca - Maarif' },
            ].map(f => (
              <div key={f.name} className="flex flex-col gap-1.5">
                <label htmlFor={f.name} className="text-xs font-bold text-slate-600 uppercase tracking-wide">{f.label}</label>
                <input type="text" id={f.name} name={f.name} placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
            ))}
          </div>
        )}

        {/* Crypto-specific fields */}
        {type === 'crypto' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'currency', label: 'Currency', placeholder: 'e.g. USDT, BTC, ETH' },
              { name: 'network', label: 'Network', placeholder: 'e.g. TRC-20, ERC-20' },
              { name: 'wallet_address', label: 'Wallet Address', placeholder: 'T...' },
            ].map(f => (
              <div key={f.name} className={`flex flex-col gap-1.5 ${f.name === 'wallet_address' ? 'sm:col-span-3' : ''}`}>
                <label htmlFor={f.name} className="text-xs font-bold text-slate-600 uppercase tracking-wide">{f.label}</label>
                <input type="text" id={f.name} name={f.name} placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <button type="submit" disabled={isPending}
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 text-sm">
            {isPending ? 'Saving...' : 'Add Payment Method'}
          </button>
        </div>
      </form>
    </div>
  );
}
