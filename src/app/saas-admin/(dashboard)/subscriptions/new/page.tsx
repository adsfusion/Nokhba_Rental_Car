import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewPlanForm } from "@/components/saas/NewPlanForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function NewSubscriptionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') redirect('/dashboard');

  return (
    <div className="p-8 max-w-[800px] mx-auto w-full">
      <Link href="/saas-admin/subscriptions" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-8 transition-colors">
        <ArrowLeft size={20} />
        Back to Subscriptions
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Subscription Plan</h1>
        <p className="text-slate-500 mt-1 font-medium">Define a new pricing tier and limits for the platform.</p>
      </div>

      <NewPlanForm />
    </div>
  );
}
