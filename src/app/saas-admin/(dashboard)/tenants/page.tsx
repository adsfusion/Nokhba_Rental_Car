import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

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
      subscription_plans (
        name,
        price,
        currency
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("🔥 Error fetching tenants:", error);
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
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No tenants found. Create one to get started.
                </td>
              </tr>
            ) : (
              tenants?.map((tenant: any) => (
                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/saas-admin/tenants/${tenant.id}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                      {tenant.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                    {tenant.slug}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">
                        {tenant.subscription_plans?.name || 'No Plan'}
                      </span>
                      {tenant.subscription_plans && (
                        <span className="text-xs text-slate-500 font-medium">
                          {tenant.subscription_plans.price} {tenant.subscription_plans.currency}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                      tenant.status?.toLowerCase() === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {tenant.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                    {new Date(tenant.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
