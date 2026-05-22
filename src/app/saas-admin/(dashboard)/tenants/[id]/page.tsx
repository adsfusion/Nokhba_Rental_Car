import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { impersonateTenant } from "@/lib/actions/impersonate";

export const dynamic = 'force-dynamic';

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') redirect('/dashboard');

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      slug,
      created_at,
      subscription_plans (
        name,
        price,
        currency,
        max_vehicles
      )
    `)
    .eq('id', id)
    .single();

  if (error || !tenant) {
    redirect('/saas-admin/tenants');
  }

  const plan = Array.isArray(tenant.subscription_plans) ? tenant.subscription_plans[0] : tenant.subscription_plans;

  return (
    <div className="p-8 max-w-[800px] mx-auto w-full">
      <Link href="/saas-admin/tenants" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-8 transition-colors">
        <ArrowLeft size={20} />
        Back to Tenants
      </Link>
      
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{tenant.name}</h1>
          <p className="text-slate-500 mt-1 font-medium font-mono text-sm">/{tenant.slug}</p>
        </div>

        <form action={async () => {
          'use server';
          await impersonateTenant(tenant.id, tenant.slug);
        }}>
          <button 
            type="submit"
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
          >
            <UserCircle2 size={20} />
            Login As Tenant
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Tenant Details</h3>
        
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">ID</p>
            <p className="font-mono text-sm text-slate-900">{tenant.id}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Created At</p>
            <p className="text-sm font-medium text-slate-900">
              {new Date(tenant.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Subscription Plan</p>
            <p className="font-bold text-slate-900">{plan?.name || 'None'}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Max Vehicles</p>
            <p className="text-sm font-medium text-slate-900">{plan?.max_vehicles || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
