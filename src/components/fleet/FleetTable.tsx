'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Car, ChevronRight, X, Edit2, ClipboardCheck, Trash2, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vehicle, Contract } from '@/types';
import { addVehicle, updateVehicle } from '@/lib/actions/vehicles';
import { useNotifications } from '@/components/layout/NotificationProvider';
import ReturnVehicleModal from './ReturnVehicleModal';

interface FleetTableProps {
  vehicles: Vehicle[];
  contracts: Contract[];
}

type FilterStatus = 'All' | 'available' | 'rented' | 'maintenance';

type NewVehicleForm = {
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | null;
  created_at: string;
  color: string;
  mileage: number;
  images: string[];
  notes?: string;
  transmission: 'automatic' | 'manual' | null;
  daily_rate: number | null;
  weekly_rate: number | null;
  monthly_rate: number | null;
  vin: string | null;
  updated_at?: string;
};

const EMPTY_FORM: NewVehicleForm = { fuel_type: null, transmission: null, daily_rate: null, weekly_rate: null, monthly_rate: null, vin: null,
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  license_plate: '',
  status: 'available',
  // type: 'Luxury',
  created_at: '',
  color: '',
  // removed duplicate mileages
  mileage: 10000,
  images: [],
};

export default function FleetTable({ vehicles, contracts }: FleetTableProps) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [isPending, startTransition] = useTransition();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState<NewVehicleForm>(EMPTY_FORM);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);

  const [returningContractId, setReturningContractId] = useState<string | null>(null);

  const filteredVehicles =
    filterStatus === 'All' ? vehicles : vehicles.filter((v) => v.status === filterStatus);

  const returningContract = contracts.find((c) => c.id === returningContractId) ?? null;

  // ── Add Vehicle ──────────────────────────────────────────────
  function handleAddVehicle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await addVehicle(newVehicle as any);
        setShowAddModal(false);
        setNewVehicle(EMPTY_FORM);
        addNotification('Vehicle Added', `${newVehicle.brand} ${newVehicle.model} has been added to your fleet.`, 'success');
        router.refresh();
      } catch (err) {
        addNotification('Error', err instanceof Error ? err.message : 'Failed to add vehicle.', 'error');
      }
    });
  }

  function handleNewVehicleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVehicle((prev) => ({
          ...prev,
          images: [...prev.images, reader.result as string],
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeNewVehicleImage(index: number) {
    setNewVehicle((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  // ── Update Vehicle ───────────────────────────────────────────
  function handleUpdateVehicle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedVehicle) return;
    startTransition(async () => {
      try {
        await updateVehicle(selectedVehicle.id, selectedVehicle);
        setIsEditingVehicle(false);
        addNotification('Vehicle Updated', `${selectedVehicle.brand} ${selectedVehicle.model} has been updated.`, 'success');
        router.refresh();
      } catch (err) {
        addNotification('Error', err instanceof Error ? err.message : 'Failed to update vehicle.', 'error');
      }
    });
  }

  function handleEditImageUpload(files: FileList | null) {
    if (!files || files.length === 0 || !selectedVehicle) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedVehicle((prev) =>
          prev
            ? { ...prev, images: [...(prev.images || []), reader.result as string] }
            : prev
        );
      };
      reader.readAsDataURL(file);
    });
  }

  function removeEditImage(index: number) {
    setSelectedVehicle((prev) => {
      if (!prev) return prev;
      const images = [...(prev.images || [])];
      images.splice(index, 1);
      return { ...prev, images };
    });
  }

  // ── Process Return ───────────────────────────────────────────
  function handleProcessReturn() {
    if (!selectedVehicle) return;
    const activeContract = contracts.find(
      (c) => c.vehicle_id === selectedVehicle.id && c.status === 'active'
    );
    if (activeContract) {
      setReturningContractId(activeContract.id);
    }
  }

  // ── Status badge helper ──────────────────────────────────────
  function statusBadgeClass(status: string) {
    return cn(
      'inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold',
      status === 'available' && 'border-green-200 bg-green-50 text-green-700',
      status === 'rented' && 'border-blue-200 bg-blue-50 text-blue-700',
      status === 'maintenance' && 'border-amber-200 bg-amber-50 text-amber-700'
    );
  }

  // ── Oil service progress ─────────────────────────────────────
  function oilProgress(v: Vehicle): number {
    const used = (v.mileage || 0) - (v.mileage || 0);
    return Math.min(100, Math.max(0, (used / (v.mileage || 1)) * 100));
  }

  function oilProgressColor(pct: number) {
    if (pct > 90) return 'bg-red-500';
    if (pct > 75) return 'bg-amber-500';
    return 'bg-green-500';
  }

  return (
    <>
      {/* ── Header bar ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Fleet Management</h2>
          <p className="text-sm text-slate-500">Monitor and manage your vehicle inventory with ease.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['All', 'available', 'rented', 'maintenance'] as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                  filterStatus === s
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800"
          >
            <Car size={16} />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Plate / Year</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Mileage</th>
                <th className="hidden px-6 py-4 md:table-cell">Rental Period</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => {
                const activeContract = contracts.find(
                  (c) => c.vehicle_id === vehicle.id && c.status === 'active'
                );
                return (
                  <tr key={vehicle.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                          {vehicle.images && vehicle.images.length > 0 ? (
                            <img
                              src={vehicle.images[0]}
                              alt={vehicle.brand}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Car size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-xs text-slate-500">
                            {vehicle.fuel_type} &bull; {vehicle.color || 'Unspecified'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="mb-1 inline-block rounded bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-600">
                        {vehicle.license_plate}
                      </div>
                      <p className="text-left text-xs text-slate-500">
                        {vehicle.year} &bull; Reg: {vehicle.created_at || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={statusBadgeClass(vehicle.status)}>{vehicle.status}</span>
                      {vehicle.status === 'maintenance' && vehicle.notes && (
                        <div
                          className="max-w-[120px] truncate text-[10px] font-medium text-amber-600"
                          title={vehicle.notes}
                        >
                          {vehicle.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {(vehicle.mileage || 0).toLocaleString()} km
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Next Due:{' '}
                        {vehicle.mileage
                          ? (vehicle.mileage + vehicle.mileage).toLocaleString()
                          : '-'}{' '}
                        km
                      </p>
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      {activeContract ? (
                        <div className="text-xs">
                          <p className="font-semibold text-slate-900">{activeContract.start_date} &rarr;</p>
                          <p className="text-slate-500">{activeContract.end_date}</p>
                        </div>
                      ) : vehicle.status === 'maintenance' && vehicle.updated_at ? (
                        <div className="text-xs">
                          <p className="font-semibold text-orange-600">Expected Return</p>
                          <p className="font-medium text-orange-500">{vehicle.updated_at}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="inline-block rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No vehicles found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Vehicle Modal ────────────────────────────────── */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <form onSubmit={handleAddVehicle} className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Add New Vehicle</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 transition-colors hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Make</label>
                    <input
                      required
                      type="text"
                      value={newVehicle.brand}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, brand: e.target.value }))}
                      placeholder="e.g. BMW"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Model</label>
                    <input
                      required
                      type="text"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, model: e.target.value }))}
                      placeholder="e.g. X5"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Year</label>
                    <input
                      required
                      type="number"
                      value={newVehicle.year || ""}
                      onChange={(e) =>
                        setNewVehicle((p) => ({ ...p, year: parseInt(e.target.value) }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">License Plate (Reg)</label>
                    <input
                      required
                      type="text"
                      value={newVehicle.license_plate}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, license_plate: e.target.value }))}
                      placeholder="ABC-1234"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Reg. Date</label>
                    <input
                      required
                      type="date"
                      value={newVehicle.created_at}
                      onChange={(e) =>
                        setNewVehicle((p) => ({ ...p, created_at: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Color</label>
                    <input
                      required
                      type="text"
                      value={newVehicle.color || ""}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, color: e.target.value }))}
                      placeholder="e.g. Black"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Current KM</label>
                    <input
                      required
                      type="number"
                      value={newVehicle.mileage || 0}
                      onChange={(e) =>
                        setNewVehicle((p) => ({ ...p, mileage: parseInt(e.target.value) }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Oil KM</label>
                    <input
                      required
                      type="number"
                      value={newVehicle.mileage || 0}
                      onChange={(e) =>
                        setNewVehicle((p) => ({
                          ...p,
                          mileage: parseInt(e.target.value),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Oil Interval</label>
                    <input
                      required
                      type="number"
                      value={newVehicle.mileage || 0}
                      onChange={(e) =>
                        setNewVehicle((p) => ({
                          ...p,
                          mileage: parseInt(e.target.value),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Type</label>
                    <select
                      required
                      value={newVehicle.fuel_type || ''}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, fuel_type: e.target.value as any }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    >
                      <option value="Luxury">Luxury</option>
                      <option value="Sport">Sport</option>
                      <option value="SUV">SUV</option>
                      <option value="Economy">Economy</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Status</label>
                    <select
                      required
                      value={newVehicle.status}
                      onChange={(e) => setNewVehicle((p) => ({ ...p, status: e.target.value as any }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    >
                      <option value="available">Available</option>
                      <option value="rented">In Use</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {newVehicle.status === 'maintenance' && (
                  <div className="grid grid-cols-2 gap-4 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                    <div className="col-span-2 space-y-1.5 md:col-span-1">
                      <label className="text-xs font-bold uppercase text-orange-800">Return Date</label>
                      <input
                        required
                        type="date"
                        value={newVehicle.updated_at || ''}
                        onChange={(e) =>
                          setNewVehicle((p) => ({ ...p, updated_at: e.target.value }))
                        }
                        className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-bold uppercase text-orange-800">Reason</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Broken windshield"
                        value={newVehicle.notes || ''}
                        onChange={(e) =>
                          setNewVehicle((p) => ({ ...p, notes: e.target.value }))
                        }
                        className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <label className="text-xs font-bold uppercase text-slate-500">Photos</label>
                  <div className="flex flex-wrap gap-3">
                    {newVehicle.images.map((photo, i) => (
                      <div
                        key={i}
                        className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200"
                      >
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewVehicleImage(i)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-all group-hover:opacity-100"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-600">
                      <ImagePlus size={24} className="mb-1" />
                      <span className="text-[10px] font-bold">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleNewVehicleImageUpload(e.target.files)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {isPending ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Vehicle Detail / Edit Panel ──────────────────────── */}
      {selectedVehicle && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => { setSelectedVehicle(null); setIsEditingVehicle(false); }}
          />
          <div className="fixed bottom-[5vh] left-1/2 top-[5vh] z-50 flex w-full max-w-lg -translate-x-1/2 flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-3xl">
            {/* Panel Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Car size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold leading-tight text-slate-900">
                    {isEditingVehicle
                      ? 'Edit Vehicle'
                      : `${selectedVehicle.brand} ${selectedVehicle.model}`}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    {selectedVehicle.year} &bull; {selectedVehicle.fuel_type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedVehicle(null); setIsEditingVehicle(false); }}
                className="rounded-full bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditingVehicle ? (
                <form id="edit-vehicle-form" onSubmit={handleUpdateVehicle} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Make</label>
                      <input
                        required
                        type="text"
                        value={selectedVehicle.brand}
                        onChange={(e) =>
                          setSelectedVehicle({ ...selectedVehicle, brand: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Model</label>
                      <input
                        required
                        type="text"
                        value={selectedVehicle.model}
                        onChange={(e) =>
                          setSelectedVehicle({ ...selectedVehicle, model: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Year</label>
                      <input
                        required
                        type="number"
                        value={selectedVehicle.year || ""}
                        onChange={(e) =>
                          setSelectedVehicle({ ...selectedVehicle, year: parseInt(e.target.value) })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">License Plate</label>
                      <input
                        required
                        type="text"
                        value={selectedVehicle.license_plate}
                        onChange={(e) =>
                          setSelectedVehicle({ ...selectedVehicle, license_plate: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Reg. Date</label>
                      <input
                        required
                        type="date"
                        value={selectedVehicle.created_at}
                        onChange={(e) =>
                          setSelectedVehicle({ ...selectedVehicle, created_at: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Color</label>
                      <input
                        required
                        type="text"
                        value={selectedVehicle.color || ""}
                        onChange={(e) =>
                          setSelectedVehicle({ ...selectedVehicle, color: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Current KM</label>
                      <input
                        required
                        type="number"
                        value={selectedVehicle.mileage || 0}
                        onChange={(e) =>
                          setSelectedVehicle({
                            ...selectedVehicle,
                            mileage: parseInt(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Oil KM</label>
                      <input
                        required
                        type="number"
                        value={selectedVehicle.mileage || 0}
                        onChange={(e) =>
                          setSelectedVehicle({
                            ...selectedVehicle,
                            mileage: parseInt(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Oil Interval</label>
                      <input
                        required
                        type="number"
                        value={selectedVehicle.mileage || 0}
                        onChange={(e) =>
                          setSelectedVehicle({
                            ...selectedVehicle,
                            mileage: parseInt(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Type</label>
                      <select
                        required
                        value={selectedVehicle.fuel_type || ""}
                        onChange={(e) =>
                          setSelectedVehicle({ ...selectedVehicle, fuel_type: e.target.value as any })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      >
                        <option value="Luxury">Luxury</option>
                        <option value="Sport">Sport</option>
                        <option value="SUV">SUV</option>
                        <option value="Economy">Economy</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500">Status</label>
                      <select
                        required
                        value={selectedVehicle.status}
                        onChange={(e) =>
                          setSelectedVehicle({
                            ...selectedVehicle,
                            status: e.target.value as any as Vehicle['status'],
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      >
                        <option value="available">Available</option>
                        <option value="rented">In Use</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  {selectedVehicle.status === 'maintenance' && (
                    <div className="grid grid-cols-2 gap-4 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                      <div className="col-span-2 space-y-1.5 md:col-span-1">
                        <label className="text-xs font-bold uppercase text-orange-800">Return Date</label>
                        <input
                          required
                          type="date"
                          value={selectedVehicle.updated_at || ''}
                          onChange={(e) =>
                            setSelectedVehicle({
                              ...selectedVehicle,
                              updated_at: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-bold uppercase text-orange-800">Reason</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Scheduled Maintenance"
                          value={selectedVehicle.notes || ''}
                          onChange={(e) =>
                            setSelectedVehicle({
                              ...selectedVehicle,
                              notes: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <label className="text-xs font-bold uppercase text-slate-500">Photos</label>
                    <div className="flex flex-wrap gap-3">
                      {selectedVehicle.images?.map((photo, i) => (
                        <div
                          key={i}
                          className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200"
                        >
                          <img src={photo} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeEditImage(i)}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-all group-hover:opacity-100"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                      <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-600">
                        <ImagePlus size={24} className="mb-1" />
                        <span className="text-[10px] font-bold">Add Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleEditImageUpload(e.target.files)}
                        />
                      </label>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {selectedVehicle.images && selectedVehicle.images.length > 0 && (
                    <div className="-mx-2 flex snap-x gap-3 overflow-x-auto px-2 pb-2">
                      {selectedVehicle.images.map((photo, i) => (
                        <div
                          key={i}
                          className="h-32 w-48 shrink-0 snap-center overflow-hidden rounded-xl border border-slate-200"
                        >
                          <img src={photo} alt="Vehicle" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</p>
                      <span className={statusBadgeClass(selectedVehicle.status)}>
                        {selectedVehicle.status}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Registration</p>
                      <p className="text-sm font-bold text-slate-900">{selectedVehicle.license_plate}</p>
                      <p className="text-xs text-slate-500">{selectedVehicle.created_at}</p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Color</p>
                      <p className="text-sm font-bold text-slate-900">{selectedVehicle.color}</p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Mileage</p>
                      <p className="text-sm font-bold text-slate-900">
                        {selectedVehicle.mileage?.toLocaleString()} km
                      </p>
                    </div>

                    <div className="col-span-2 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Last Oil Change
                          </p>
                          <p className="text-sm font-bold text-slate-900">
                            {selectedVehicle.mileage?.toLocaleString()} km
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Next Due
                          </p>
                          <p className="text-sm font-bold text-slate-900">
                            {(
                              (selectedVehicle.mileage || 0) + (selectedVehicle.mileage || 0)
                            )?.toLocaleString()}{' '}
                            km
                          </p>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={cn('h-full rounded-full', oilProgressColor(oilProgress(selectedVehicle)))}
                          style={{ width: `${oilProgress(selectedVehicle)}%` }}
                        />
                      </div>
                      <p className="text-center text-xs font-medium text-slate-500">
                        {Math.max(
                          0,
                          (selectedVehicle.mileage || 0) + (selectedVehicle.mileage || 0) -
                            (selectedVehicle.mileage || 0)
                        ).toLocaleString()}{' '}
                        km remaining until next service
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50 p-4">
              {isEditingVehicle ? (
                <>
                  <button
                    onClick={() => setIsEditingVehicle(false)}
                    className="px-5 py-2 font-semibold text-slate-600 transition-colors hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="edit-vehicle-form"
                    disabled={isPending}
                    className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  {selectedVehicle.status === 'rented' && (
                    <button
                      onClick={handleProcessReturn}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                    >
                      <ClipboardCheck size={16} />
                      Process Return
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditingVehicle(true)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800"
                  >
                    Close Details
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Return Vehicle Modal ─────────────────────────────── */}
      {returningContract && (
        <ReturnVehicleModal
          isOpen={!!returningContractId}
          onClose={() => setReturningContractId(null)}
          contract={returningContract}
        />
      )}
    </>
  );
}
