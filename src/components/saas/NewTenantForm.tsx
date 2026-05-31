"use client";

import { useState, useTransition } from "react";
import { createTenant } from "@/lib/actions/tenants";
import { AlertCircle } from "lucide-react";

export function NewTenantForm({ plans }: { plans: any[] }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createTenant(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Slugification regex: lowercase, hyphenated, no spaces/special chars
    const generatedSlug = newName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .replace(/[\s-]+/g, '-') // replace spaces and multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // trim hyphens from start and end

    setSlug(generatedSlug);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow manual edits to the slug but enforce the same rules
    const newSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    setSlug(newSlug);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold">Could not create tenant</h4>
            <p className="text-sm mt-1 opacity-90">{error}</p>
          </div>
        </div>
      )}
      <form action={handleSubmit} className="flex flex-col gap-6">
        
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-bold text-slate-700">Agency Name</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            required 
            placeholder="e.g. Nokhba Premium"
            value={name}
            onChange={handleNameChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="slug" className="text-sm font-bold text-slate-700">URL Slug</label>
          <div className="flex items-center">
            <span className="px-4 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-medium text-sm">
              app.nokhba.com/
            </span>
            <input 
              type="text" 
              id="slug" 
              name="slug" 
              required 
              placeholder="nokhba-premium"
              value={slug}
              onChange={handleSlugChange}
              className="w-full px-4 py-3 rounded-r-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">This will be the unique identifier for the agency's dashboard URL.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-bold text-slate-700">Admin Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required 
              placeholder="admin@agency.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-bold text-slate-700">Admin Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required 
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-sm font-bold text-slate-700">Phone Number</label>
            <input 
              type="tel" 
              id="phone" 
              name="phone" 
              placeholder="+212 600 000000"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="city" className="text-sm font-bold text-slate-700">City</label>
            <input 
              type="text" 
              id="city" 
              name="city" 
              placeholder="e.g. Casablanca"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="subscription_plan_id" className="text-sm font-bold text-slate-700">Subscription Plan</label>
          <select 
            id="subscription_plan_id" 
            name="subscription_plan_id" 
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900"
          >
            <option value="">Select a plan...</option>
            {plans?.map((plan: any) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - {plan.price} {plan.currency} ({plan.billing_period})
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-slate-100 pt-6 mt-2 flex justify-end">
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Create Agency"}
          </button>
        </div>

      </form>
    </div>
  );
}
