import { LifeBuoy } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function HelpCenterPage() {
  return (
    <div className="w-full block max-w-[896px] mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Help Center</h1>
        <p className="text-slate-500 text-sm mt-1">Support resources, FAQs, and contact tools.</p>
      </div>

      <EmptyState
        variant="card"
        icon={<LifeBuoy size={28} />}
        title="Help Center — Coming Soon"
        description="The Help Center is currently under development. Support resources, FAQs, and contact tools will be available here soon."
      />
    </div>
  );
}
