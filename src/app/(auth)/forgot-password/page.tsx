import { Car } from 'lucide-react';
import { forgotPassword } from '@/lib/actions/auth';
import Link from 'next/link';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="w-full max-w-[448px]">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
            <Car className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Reset Password</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">Enter your email and we'll send you a link to reset your password</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        <form action={forgotPassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="agency@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all mt-2"
          >
            Send Reset Link
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Remembered your password?{' '}
            <Link href="/login" className="text-slate-900 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
