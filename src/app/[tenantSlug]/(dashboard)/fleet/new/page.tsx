import { createSupabaseServerClient } from '@/lib/supabase/server';
import AddVehicleForm from '@/components/fleet/AddVehicleForm';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Vehicle — Nokhba' };

export default async function NewVehiclePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const supabase = await createSupabaseServerClient();

  // ── Server-side vehicle limit check ─────────────────────────────────────────
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, max_vehicles_limit, subscription_status, subscription_plans(name)')
    .eq('slug', tenantSlug)
    .single();

  let isAtLimit = false;
  let currentCount = 0;
  let vehicleLimit = 0;

  if (tenant) {
    vehicleLimit = tenant.max_vehicles_limit ?? 0;
    const { count } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id);
    currentCount = count ?? 0;
    isAtLimit = currentCount >= vehicleLimit;
  }

  // ── If at limit, show blocker immediately — don't render the form ────────────
  if (isAtLimit) {
    const planName = Array.isArray(tenant?.subscription_plans)
      ? tenant?.subscription_plans[0]?.name
      : (tenant?.subscription_plans as any)?.name ?? 'Current Plan';

    return (
      <div className="max-w-[900px] w-full mx-auto px-4 py-8 space-y-6">
        {/* Back link */}
        <Link
          href={`/${tenantSlug}/fleet`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Fleet
        </Link>

        {/* Blocker card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {/* Top accent strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

          <div className="flex flex-col items-center text-center px-10 py-16 gap-6">
            {/* Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center">
                <ShieldAlert size={44} className="text-amber-500" />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Limit
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-2 max-w-lg">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Fleet Limit Reached
              </h1>
              <p className="text-slate-500 text-base leading-relaxed">
                Your <span className="font-bold text-slate-700">{planName}</span> plan allows a maximum of{' '}
                <span className="font-bold text-slate-700">{vehicleLimit} vehicle{vehicleLimit !== 1 ? 's' : ''}</span>.
                You currently have <span className="font-bold text-slate-700">{currentCount}</span>.
                Upgrade your plan to unlock more fleet capacity.
              </p>
            </div>

            {/* Stats pill */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-full px-5 py-2.5 text-sm font-bold text-slate-600">
              <span className="text-red-500">{currentCount}</span>
              <span className="text-slate-300">/</span>
              <span>{vehicleLimit} vehicles used</span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
              <Link
                href={`/${tenantSlug}/subscription`}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition-all hover:shadow-lg text-sm"
              >
                <Zap size={16} className="text-amber-400" />
                Upgrade Plan
              </Link>
              <Link
                href={`/${tenantSlug}/fleet`}
                className="px-8 py-3.5 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-sm"
              >
                Back to Fleet
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Under limit: show the normal form ───────────────────────────────────────
  return (
    <div className="space-y-6">
      <AddVehicleForm tenantSlug={tenantSlug} />
    </div>
  );
}
