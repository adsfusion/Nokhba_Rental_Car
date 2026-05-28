import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export function TrialExpiredModal({ tenantName }: { tenantName: string }) {
  return (
    <div className="w-full h-[calc(100vh-120px)] bg-slate-950 rounded-3xl flex flex-col items-center justify-center p-6 text-center border border-amber-500/10">
      <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30">
            <AlertTriangle size={32} />
          </div>
          
          <h1 className="text-2xl font-black text-white tracking-tight mb-3">
            Subscription Expired
          </h1>
          
          <p className="text-slate-400 font-medium leading-relaxed mb-8">
            The subscription or trial period for <strong className="text-white">{tenantName}</strong> has ended. Please upgrade your plan or contact the SAAS administrator to restore access to your dashboard.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button 
              className="w-full bg-amber-500 text-slate-950 py-3.5 rounded-xl font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
            >
              Contact Administrator
            </button>
            <Link 
              href="/login"
              className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-700 transition-colors"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
