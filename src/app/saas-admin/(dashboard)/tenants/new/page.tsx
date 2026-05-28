import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewTenantForm } from "@/components/saas/NewTenantForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function NewTenantPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') redirect('/dashboard');

  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error("🔥 Error fetching plans:", error);
  }

  return (
    <div className="p-8 max-w-[800px] mx-auto w-full">
      <Link href="/saas-admin/tenants" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-8 transition-colors">
        <ArrowLeft size={20} />
        Back to Tenants
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Add New Tenant</h1>
        <p className="text-slate-500 mt-1 font-medium">Create a new agency workspace and assign a subscription plan.</p>
      </div>

      <NewTenantForm plans={plans || []} />
    </div>
  );
}
