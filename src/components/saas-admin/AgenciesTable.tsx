'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Briefcase, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agency } from '@/types';

export function AgenciesTable() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', status: 'Active', plan: 'Basic Package' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setAgencies([
      ...agencies,
      {
        id: Math.random().toString(36).slice(2, 11),
        name: form.name,
        email: form.email,
        phone: form.phone,
        status: form.status as 'Active' | 'Inactive',
        plan: form.plan,
        created_at: new Date().toLocaleDateString(),
      },
    ]);
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', status: 'Active', plan: 'Basic Package' });
  };

  const inputClass =
    'w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-slate-900 text-sm focus:outline-none';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Agencies</h2>
          <p className="text-slate-500 text-sm">Manage tenant companies and their subscriptions.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create company
        </button>
      </div>

      {agencies.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm text-center py-20">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Agencies Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Click the button above to register a new tenant company in the system.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-start">Company Name</th>
                  <th className="px-6 py-4 text-start">Contact</th>
                  <th className="px-6 py-4 text-start">Status</th>
                  <th className="px-6 py-4 text-start">Plan / Joined</th>
                  <th className="px-6 py-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{agency.name}</p>
                      <p className="text-xs text-slate-500 font-mono">ID: {agency.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{agency.email}</p>
                      <p className="text-xs text-slate-500">{agency.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2.5 py-1 rounded-full border inline-block',
                          agency.status === 'Active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        )}
                      >
                        {agency.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{agency.plan}</p>
                      <p className="text-xs text-slate-500">{agency.created_at}</p>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-block">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold tracking-tight">Create Tenant Company</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 block">
                    Company Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                    placeholder="Acme Rentals"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 block">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputClass}
                      placeholder="admin@acme.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 block">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={inputClass}
                      placeholder="+33..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 block">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className={inputClass}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 block">Pricing Plan</label>
                    <select
                      value={form.plan}
                      onChange={(e) => setForm({ ...form, plan: e.target.value })}
                      className={inputClass}
                    >
                      <option value="Basic Package">Basic Package</option>
                      <option value="Standard Package">Standard Package</option>
                      <option value="Gold Package">Gold Package</option>
                      <option value="VIP Package">VIP Package</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20"
                  >
                    Create Company
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
