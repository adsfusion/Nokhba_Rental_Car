'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../supabase/server';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getProfile() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single();

  return data;
}

export async function registerTenant(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    redirect(`/register?error=${encodeURIComponent('Name, Email, and Password are required')}`);
  }

  // Generate a URL-friendly slug from the agency name
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    redirect(`/register?error=${encodeURIComponent(authError.message)}`);
  }

  const userId = authData.user?.id;
  if (!userId) {
    redirect(`/register?error=${encodeURIComponent('Failed to create account. Please try again.')}`);
  }

  // Import dynamically or ensure createSupabaseAdminClient is imported at top
  const { createSupabaseAdminClient } = await import('../supabase/admin');
  const adminAuth = createSupabaseAdminClient();

  // Insert into tenants
  const { data: tenantData, error: tenantError } = await adminAuth
    .from('tenants')
    .insert({
      name,
      slug,
      email,
      subscription_status: 'trialing',
      subscription_plan_id: null, // Depending on requirements, they might default to null or a specific plan
    })
    .select('id')
    .single();

  if (tenantError || !tenantData) {
    console.error('Registration Tenant Error:', tenantError);
    // Cleanup auth user
    await adminAuth.auth.admin.deleteUser(userId);
    redirect(`/register?error=${encodeURIComponent('Failed to setup agency environment.')}`);
  }

  // Update into profiles
  // (A database trigger likely created a blank profile already, so we update it)
  const { error: profileError } = await adminAuth
    .from('profiles')
    .update({
      tenant_id: tenantData.id,
      role: 'tenant_admin',
      email,
      full_name: name
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Registration Profile Error:', profileError);
    await adminAuth.from('tenants').delete().eq('id', tenantData.id);
    await adminAuth.auth.admin.deleteUser(userId);
    redirect(`/register?error=${encodeURIComponent('Failed to setup admin profile.')}`);
  }

  redirect(`/register?message=${encodeURIComponent('Account created successfully! Please sign in.')}`);
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) {
    redirect(`/forgot-password?error=${encodeURIComponent('Email is required')}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/forgot-password?message=${encodeURIComponent('Password reset link has been sent to your email.')}`);
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string;
  
  if (!password) {
    redirect(`/reset-password?error=${encodeURIComponent('Password is required')}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/login?message=${encodeURIComponent('Password has been updated successfully. Please sign in.')}`);
}
