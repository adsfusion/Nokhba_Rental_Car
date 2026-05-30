import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteButton, EditButton } from "@/components/saas-admin/ActionButtons";
import { deleteTenant } from "@/lib/actions/tenants";

export const dynamic = 'force-dynamic';

// ─── Status badge helper ───────────────────────────────────────────────────────
// Computes the badge label + Tailwind classes for every subscription state.
// Trial tenants also show the remaining time computed server-side.

type SubscriptionStatus = 'trialing' | 'pending' | 'active' | 'expired' | 'rejected';

function getStatusBadge(status: SubscriptionStatus, endDate: string | null) {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border tracking-wide';

  switch (status) {
    case 'trialing': {
      const remaining = endDate ? getRemainingTime(endDate) : null;
      const label = remaining ? `Trial · ${remaining}` : 'Trial';
      return {
        className: `${base} bg-amber-500/15 text-amber-400 border-amber-500/30`,
        label,
        dot: '⏳',
      };
    }
    case 'active':
      return {
        className: `${base} bg-emerald-500/15 text-emerald-400 border-emerald-500/30`,
        label: 'Active',
        dot: '●',
      };
    case 'pending':
      return {
        className: `${base} bg-blue-500/15 text-blue-400 border-blue-500/30`,
        label: 'Pending Review',
        dot: '○',
      };
    case 'expired':
      return {
        className: `${base} bg-red-500/15 text-red-400 border-red-500/30`,
        label: 'Expired',
        dot: '✕',
      };
    case 'rejected':
      return {
        className: `${base} bg-rose-500/15 text-rose-400 border-rose-500/30`,
        label: 'Rejected',
        dot: '✕',
      };
    default:
      return {
        className: `${base} bg-slate-500/15 text-slate-400 border-slate-500/30`,
        label: String(status),
        dot: '●',
      };
  }
}

// Returns "18h 22m", "2d 5h", or "Expired" — computed purely server-side
function getRemainingTime(endDateStr: string): string {
  const endDate = new Date(endDateStr);
  const diffMs  = endDate.getTime() - Date.now();

  if (diffMs <= 0) return 'Expired';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days    = Math.floor(totalMinutes / (60 * 24));
  const hours   = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0)  return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default async function TenantsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') redirect('/dashboard');

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      slug,
      created_at,
      subscription_plan_id,
      subscription_status,
      subscription_end_date,
      max_vehicles_limit,
      subscription_plans (
        name,
        price,
        currency
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('🔥 Error fetching tenants:', error);
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tenants</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage all registered agencies on the Nokhba Platform.</p>
        </div>
        <Link
          href="/saas-admin/tenants/new"
          className="bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Add New Tenant
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Tenant Name</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Max Vehicles</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!tenants || tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  No tenants found. Create one to get started.
                </td>
              </tr>
            ) : (
              tenants.map((tenant: any) => {
                const badge = getStatusBadge(
                  (tenant.subscription_status as SubscriptionStatus) ?? 'trialing',
                  tenant.subscription_end_date ?? null,
                );

                return (
                  <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/saas-admin/tenants/${tenant.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {tenant.name}
                      </Link>
                    </td>

                    {/* Slug */}
                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                      {tenant.slug}
                    </td>

                    {/* Plan */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {Array.isArray(tenant.subscription_plans) 
                            ? tenant.subscription_plans[0]?.name 
                            : tenant.subscription_plans?.name || 'No Plan'}
                        </span>
                        {tenant.subscription_plans && (
                          <span className="text-xs text-slate-500 font-medium">
                            {Array.isArray(tenant.subscription_plans) 
                              ? `${tenant.subscription_plans[0]?.price} ${tenant.subscription_plans[0]?.currency}`
                              : `${tenant.subscription_plans.price} ${tenant.subscription_plans.currency}`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Max Vehicles */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200">
                        {tenant.max_vehicles_limit ?? '—'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span className={badge.className}>
                        <span className="text-[10px] leading-none">{badge.dot}</span>
                        {badge.label}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                      {new Date(tenant.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <EditButton href={`/saas-admin/tenants/${tenant.id}`} entityName="Tenant" />
                        <DeleteButton onDelete={deleteTenant.bind(null, tenant.id)} entityName="Tenant" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
