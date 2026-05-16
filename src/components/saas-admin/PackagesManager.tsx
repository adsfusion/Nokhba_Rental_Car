'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Edit2, X } from 'lucide-react';
import type { SubscriptionPlan } from '@/types';

const INITIAL_PACKAGES: SubscriptionPlan[] = [
  { id: '1', name: 'Basic Package', max_vehicles: 10, price: 99, currency: 'USD', billing_period: 'monthly', is_active: true },
  { id: '2', name: 'Standard Package', max_vehicles: 20, price: 199, currency: 'USD', billing_period: 'monthly', is_active: true },
  { id: '3', name: 'Gold Package', max_vehicles: 30, price: 299, currency: 'USD', billing_period: 'monthly', is_active: true },
  { id: '4', name: 'VIP Package', max_vehicles: 99999, price: 399, currency: 'USD', billing_period: 'monthly', is_active: true },
];

export function PackagesManager() {
  const [packages, setPackages] = useState(INITIAL_PACKAGES);
  const [editingPkg, setEditingPkg] = useState<SubscriptionPlan | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPkg) return;
    setPackages(packages.map((p) => (p.id === editingPkg.id ? editingPkg : p)));
    setEditingPkg(null);
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-sm font-medium';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Packages</h2>
        <p className="text-slate-500 text-sm">Manage pricing and limits for tenant subscriptions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white border text-center border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{pkg.name}</h3>
              <p className="text-3xl font-bold text-slate-900 mb-4">
                ${pkg.price}
                <span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 mb-6 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100">
                <Car size={16} className="text-slate-400" />
                <span>
                  {pkg.max_vehicles === 99999
                    ? 'Unlimited Cars'
                    : `Up to ${pkg.max_vehicles} Cars`}
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditingPkg(pkg)}
              className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors border border-slate-200 shadow-sm flex items-center justify-center gap-2"
            >
              <Edit2 size={16} /> Edit
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingPkg && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
              onClick={() => setEditingPkg(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200"
            >
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Edit Package</h3>
                  <button
                    type="button"
                    onClick={() => setEditingPkg(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Package Name</label>
                    <input
                      required
                      type="text"
                      value={editingPkg.name}
                      onChange={(e) => setEditingPkg({ ...editingPkg, name: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Min Cars</label>
                      <input
                        required
                        type="number"
                        value={0}
                        onChange={() => {}}
                        disabled
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Max Cars</label>
                      <input
                        type="number"
                        value={editingPkg.max_vehicles === 99999 ? '' : editingPkg.max_vehicles}
                        onChange={(e) =>
                          setEditingPkg({
                            ...editingPkg,
                            max_vehicles: e.target.value === '' ? 99999 : parseInt(e.target.value),
                          })
                        }
                        className={inputClass}
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Monthly Price ($)</label>
                    <input
                      required
                      type="number"
                      value={editingPkg.price}
                      onChange={(e) =>
                        setEditingPkg({ ...editingPkg, price: parseInt(e.target.value) || 0 })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPkg(null)}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
