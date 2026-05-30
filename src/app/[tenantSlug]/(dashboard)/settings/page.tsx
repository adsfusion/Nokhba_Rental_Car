import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 text-sm">Manage your agency preferences and account settings.</p>
      </div>

      <EmptyState
        variant="dashed"
        icon={<Settings size={28} />}
        title="Settings — Coming Soon"
        description="This module is currently under development as part of the Phase 5 roadmap."
        className="min-h-[60vh]"
      />
    </div>
  );
}
