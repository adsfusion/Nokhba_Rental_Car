import { Zap } from 'lucide-react';

export default function SubscriptionPage() {
  return (
    <div className="max-w-[896px] mx-auto p-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6">
          <Zap size={32} className="text-amber-500" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-3">
          Subscription &amp; Billing
        </h1>
        <p className="text-slate-500 mx-auto max-w-[448px] leading-relaxed">
          The Subscription module is under development. Your billing details, plan upgrades, and invoices will be managed here.
        </p>
      </div>
    </div>
  );
}
