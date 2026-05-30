import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SaasSettingsPage() {
  return (
    <div className="w-full space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h2>
        <p className="text-slate-500 text-sm">Manage global platform configurations</p>
      </div>

      <EmptyState
        variant="dashed"
        icon={<Settings size={28} />}
        title="Settings Module — Coming Soon"
        description="This module is currently under development. Here you will be able to manage global platform configurations."
        className="min-h-[60vh]"
      />
    </div>
  );
}
