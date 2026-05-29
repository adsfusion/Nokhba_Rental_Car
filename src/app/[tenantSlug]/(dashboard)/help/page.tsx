import { LifeBuoy } from 'lucide-react';

export default function HelpCenterPage() {
  return (
    <div className="max-w-[896px] mx-auto p-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-sm w-full max-w-md mx-auto">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6">
          <LifeBuoy size={32} className="text-slate-400" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-3 w-full">
          Help Center
        </h1>
        <p className="text-slate-500 w-full leading-relaxed">
          The Help Center is currently under development. Support resources, FAQs, and contact tools will be available here soon.
        </p>
      </div>
    </div>
  );
}
