'use client';

import { useState } from 'react';
import { Plus, Users, User, Phone, IdCard } from 'lucide-react';
import type { Client } from '@/types';
import { AddClientModal } from './AddClientModal';

type Props = { clients: Client[] };

export function ClientTable({ clients }: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <>
      {isAddOpen && <AddClientModal onClose={() => setIsAddOpen(false)} />}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clients</h2>
            <p className="text-slate-500 text-sm">Manage your registered rental clients.</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            Add Client
          </button>
        </div>

        <div className="bg-surface-container-lowest border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">
              Client Registry{' '}
              <span className="text-slate-400 font-normal text-sm">({clients.length})</span>
            </h3>
          </div>

          {clients.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                <Users size={32} />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">No clients yet</h4>
              <p className="text-slate-500 text-sm max-w-xs">
                Add your first client to start building your rental registry.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <User size={20} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                        Name
                      </p>
                      <p className="text-sm font-bold text-slate-900">{client.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                        Phone
                      </p>
                      <p className="text-sm text-slate-700 flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        {client.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                        License
                      </p>
                      <p className="text-sm text-slate-700 flex items-center gap-1.5">
                        <IdCard size={12} className="text-slate-400" />
                        {client.driver_license_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                        Location
                      </p>
                      <p className="text-sm text-slate-700">{''}</p>
                    </div>
                  </div>

                  <div className="text-end">
                    <p className="text-[10px] text-slate-400">
                      {client.created_at ? new Date(client.created_at).toLocaleDateString() : '---'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
