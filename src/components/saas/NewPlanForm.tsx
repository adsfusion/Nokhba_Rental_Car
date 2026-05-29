"use client";

import { useState, useTransition } from "react";
import { createSubscriptionPlan } from "@/lib/actions/subscriptions";
import { AlertCircle } from "lucide-react";

export function NewPlanForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createSubscriptionPlan(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold">Could not create plan</h4>
            <p className="text-sm mt-1 opacity-90">{error}</p>
          </div>
        </div>
      )}
      <form action={handleSubmit} className="flex flex-col gap-6">
        
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-bold text-slate-700">Plan Name</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            required 
            placeholder="e.g. Starter, Premium, Enterprise, Trial"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="price" className="text-sm font-bold text-slate-700">Price</label>
            <input 
              type="number" 
              id="price" 
              name="price" 
              step="0.01"
              required 
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="currency" className="text-sm font-bold text-slate-700">Currency</label>
            <select 
              id="currency" 
              name="currency" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="MAD">MAD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="billing_period" className="text-sm font-bold text-slate-700">Billing Period</label>
            <select 
              id="billing_period" 
              name="billing_period" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="trial">Trial</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="duration_days" className="text-sm font-bold text-slate-700">Duration (Days)</label>
            <input 
              type="number" 
              id="duration_days" 
              name="duration_days" 
              required 
              defaultValue={30}
              min={1}
              placeholder="e.g. 1, 30, 365"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="max_vehicles" className="text-sm font-bold text-slate-700">Max Vehicles</label>
            <input 
              type="number" 
              id="max_vehicles" 
              name="max_vehicles" 
              required 
              placeholder="e.g. 50"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-slate-50 font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 mt-2 flex justify-end">
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Create Plan"}
          </button>
        </div>

      </form>
    </div>
  );
}
