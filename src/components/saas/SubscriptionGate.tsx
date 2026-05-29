import { AlertTriangle, Clock, XCircle, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";

interface SubscriptionGateProps {
  status: 'expired' | 'trialing' | 'pending' | 'rejected';
  tenantSlug: string;
  tenantName: string;
  rejectionReason?: string;
  remainingTime?: string | null;
}

export function SubscriptionGate({ status, tenantSlug, tenantName, rejectionReason, remainingTime }: SubscriptionGateProps) {
  let content;

  if (status === 'pending') {
    content = {
      icon: <Clock size={32} className="animate-pulse" />,
      title: "Payment Under Review",
      description: "Your payment proof was received and is currently being reviewed by our team. You'll be notified once approved.",
      glowColor: "bg-blue-500/10 border-blue-500/30",
      iconContainer: "bg-blue-500/20 text-blue-500 border-blue-500/30",
      primaryCta: { text: "View Submission", href: `/${tenantSlug}/subscription` },
      secondaryCta: null,
    };
  } else if (status === 'rejected') {
    content = {
      icon: <XCircle size={32} />,
      title: "Payment Rejected",
      description: rejectionReason ? `Reason: ${rejectionReason}` : "Your recent payment proof was rejected. Please review and submit a new proof of payment.",
      glowColor: "bg-rose-500/10 border-rose-500/30",
      iconContainer: "bg-rose-500/20 text-rose-500 border-rose-500/30",
      primaryCta: { text: "Re-upload Proof", href: `/${tenantSlug}/subscription`, className: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20" },
      secondaryCta: { text: "Contact Support", href: `mailto:support@nokhba.com` },
    };
  } else {
    // expired or expired trial
    content = {
      icon: <AlertTriangle size={32} />,
      title: "Subscription Expired",
      description: `The subscription or trial period for ${tenantName} has ended. Please upgrade your plan to restore full access to your dashboard.`,
      glowColor: "bg-amber-500/10 border-amber-500/30",
      iconContainer: "bg-amber-500/20 text-amber-500 border-amber-500/30",
      primaryCta: { text: "Upgrade Now", href: `/${tenantSlug}/subscription`, className: "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20" },
      secondaryCta: { text: "Return to Login", href: "/login" },
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className={`max-w-md w-full mx-4 bg-slate-900 border rounded-3xl p-8 shadow-2xl relative overflow-hidden ${content.glowColor}`}>
        
        {/* Glow Effect */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 blur-3xl rounded-full pointer-events-none ${content.glowColor.split(' ')[0]}`} />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${content.iconContainer}`}>
            {content.icon}
          </div>
          
          <h1 className="text-2xl font-black text-white tracking-tight mb-3">
            {content.title}
          </h1>
          
          <p className="text-slate-400 font-medium leading-relaxed mb-8">
            {content.description}
          </p>

          <div className="flex flex-col gap-3 w-full">
            <Link 
              href={content.primaryCta.href}
              className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${content.primaryCta.className || 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            >
              {content.title === "Subscription Expired" && <CreditCard size={18} />}
              {content.primaryCta.text}
              {content.title === "Subscription Expired" && <ChevronRight size={18} />}
            </Link>
            
            {content.secondaryCta && (
              <Link 
                href={content.secondaryCta.href}
                className="w-full bg-slate-800/50 text-slate-300 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                {content.secondaryCta.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
