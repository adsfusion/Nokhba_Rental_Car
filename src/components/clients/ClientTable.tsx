'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, Users, User, Phone, IdCard, ArrowRight } from 'lucide-react';
import type { Client } from '@/types';

type Props = { clients: Client[] };

export function ClientTable({ clients }: Props) {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string | undefined;
  const prefix = tenantSlug ? `/${tenantSlug}` : '';

  return (
    <>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clients</h2>
            <p className="text-slate-500 text-sm">Manage your registered rental clients.</p>
          </div>
          <Link
            href={`${prefix}/clients/new`}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            Add Client
          </Link>
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
                <Link
                  key={client.id}
                  href={`${prefix}/clients/${client.id}`}
                  className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/70 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
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
                        {client.driver_license_number ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                        City
                      </p>
                      <p className="text-sm text-slate-700">{client.city ?? '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      {client.created_at ? new Date(client.created_at).toLocaleDateString() : '---'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                      View Profile
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
