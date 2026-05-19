'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, ArrowLeft, ImagePlus, Trash2, ChevronDown } from 'lucide-react';
import { addVehicle } from '@/lib/actions/vehicles';
import { useNotifications } from '@/components/layout/NotificationProvider';
import type { VehicleStatus } from '@/types';

// ── Moroccan market car data (mirrors EditVehicleForm) ────────────────────────
const carData: Record<string, Record<string, string[]>> = {
  Economy: {
    Dacia:    ['Logan', 'Sandero Stepway'],
    Renault:  ['Clio 5'],
    Peugeot:  ['208'],
    Citroën:  ['C3'],
    Kia:      ['Picanto'],
    Hyundai:  ['i10'],
    Fiat:     ['500'],
  },
  'Mid-size': {
    Peugeot:  ['301'],
    Citroën:  ['C-Elysée'],
    Hyundai:  ['Accent'],
    Renault:  ['Express'],
  },
  SUV: {
    Dacia:      ['Duster'],
    Volkswagen: ['T-Roc'],
    Hyundai:    ['Tucson'],
    Peugeot:    ['2008'],
  },
  Luxury: {
    'Land Rover':    ['Range Rover Vogue', 'Range Rover Evoque'],
    'Mercedes-Benz': ['G-Class G63 AMG', 'C-Class', 'E-Class'],
    BMW:             ['X5 M Competition', '5 Series'],
    Volkswagen:      ['Touareg'],
  },
};

const VEHICLE_TYPES = Object.keys(carData);

const YEARS = [2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

const COLORS = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red', 'Brown', 'Green', 'Yellow', 'Other'];

// ── Shared style tokens ───────────────────────────────────────────────────────
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none transition-colors';
const selectClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none transition-colors appearance-none cursor-pointer';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5';
const sectionClass = 'rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4';
const sectionTitleClass = 'text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2';

// ── Form state type ───────────────────────────────────────────────────────────
type NewVehicle = {
  vehicle_type:         string | null;
  brand:                string;
  model:                string;
  year:                 number | null;
  color:                string | null;
  license_plate:        string;
  vin:                  string | null;
  status:               VehicleStatus;
  mileage:              number;
  fuel_type:            string | null;
  transmission:         string | null;
  daily_rate:           number | null;
  weekly_rate:          number | null;
  monthly_rate:         number | null;
  images:               string[];
  notes:                string | null;
  registration_date:    string | null;
  insurance_expiry:     string | null;
  technical_inspection: string | null;
};

const EMPTY: NewVehicle = {
  vehicle_type:         null,
  brand:                '',
  model:                '',
  year:                 new Date().getFullYear(),
  color:                null,
  license_plate:        '',
  vin:                  null,
  status:               'available',
  mileage:              0,
  fuel_type:            null,
  transmission:         null,
  daily_rate:           null,
  weekly_rate:          null,
  monthly_rate:         null,
  images:               [],
  notes:                null,
  registration_date:    null,
  insurance_expiry:     null,
  technical_inspection: null,
};

export default function AddVehicleForm({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [isPending, startTransition] = useTransition();

  // ── Cascading state ────────────────────────────────────────────────────────
  const [vehicleType,  setVehicleType]  = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [customMake,   setCustomMake]   = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModel,   setCustomModel]   = useState('');

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<NewVehicle>(EMPTY);

  // ── Derived dropdown options ───────────────────────────────────────────────
  const makesForType = useMemo(() => {
    if (!vehicleType || !carData[vehicleType]) return [];
    return [...Object.keys(carData[vehicleType]), 'Other'];
  }, [vehicleType]);

  const modelsForMake = useMemo(() => {
    if (!vehicleType || !selectedMake || selectedMake === 'Other') return [];
    const models = carData[vehicleType]?.[selectedMake];
    return models ? [...models, 'Other'] : [];
  }, [vehicleType, selectedMake]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleTypeChange(type: string) {
    setVehicleType(type);
    setSelectedMake('');
    setCustomMake('');
    setSelectedModel('');
    setCustomModel('');
  }

  function handleMakeChange(make: string) {
    setSelectedMake(make);
    setCustomMake('');
    setSelectedModel('');
    setCustomModel('');
  }

  function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const finalMake  = selectedMake  === 'Other' ? customMake.trim()  : selectedMake;
    const finalModel = selectedModel === 'Other' ? customModel.trim() : selectedModel;

    if (!finalMake)  { addNotification('Validation', 'Please select or enter a Make.', 'error'); return; }
    if (!finalModel) { addNotification('Validation', 'Please select or enter a Model.', 'error'); return; }

    startTransition(async () => {
      try {
        const payload = {
          ...form,
          vehicle_type: vehicleType || null,
          brand:        finalMake,
          model:        finalModel,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await addVehicle(payload as any, tenantSlug);
        addNotification('Vehicle Added', `${finalMake} ${finalModel} has been added to your fleet.`, 'success');
        router.refresh();
        router.push(`/${tenantSlug}/fleet`);
      } catch (err) {
        addNotification('Error', err instanceof Error ? err.message : 'Failed to add vehicle.', 'error');
      }
    });
  }

  return (
    <div className="max-w-[896px] w-full mx-auto space-y-6">

      {/* Back link */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${tenantSlug}/fleet`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Fleet
        </Link>
      </div>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
          <Car size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Vehicle</h1>
          <p className="text-slate-500 text-sm">Register a new vehicle in your fleet.</p>
        </div>
      </div>

      {/* ── Form card ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="font-bold text-slate-900 text-lg">Vehicle Details</h2>
          <p className="text-slate-500 text-sm mt-0.5">Fill in the information below across all sections.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">

          {/* ── SECTION 1: Basic Info ─────────────────────────────────────── */}
          <div className="space-y-4">
            <p className={sectionTitleClass}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">1</span>
              Basic Info
            </p>
            <div className={sectionClass}>

              {/* Vehicle Type */}
              <div className="space-y-1.5">
                <label className={labelClass}>Vehicle Type</label>
                <div className="relative">
                  <select
                    value={vehicleType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">— Select type —</option>
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Make & Model — cascading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Make */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Make / Brand</label>
                  {vehicleType && makesForType.length > 0 ? (
                    <>
                      <div className="relative">
                        <select
                          required
                          value={selectedMake}
                          onChange={(e) => handleMakeChange(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">— Select make —</option>
                          {makesForType.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      {selectedMake === 'Other' && (
                        <input
                          required
                          type="text"
                          placeholder="Type make name…"
                          value={customMake}
                          onChange={(e) => setCustomMake(e.target.value)}
                          className={inputClass + ' mt-2'}
                        />
                      )}
                    </>
                  ) : (
                    <input
                      required
                      type="text"
                      placeholder="e.g. Toyota"
                      value={customMake}
                      onChange={(e) => { setSelectedMake('Other'); setCustomMake(e.target.value); }}
                      className={inputClass}
                    />
                  )}
                </div>

                {/* Model */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Model</label>
                  {selectedMake && selectedMake !== 'Other' && modelsForMake.length > 0 ? (
                    <>
                      <div className="relative">
                        <select
                          required
                          value={selectedModel}
                          onChange={(e) => { setSelectedModel(e.target.value); setCustomModel(''); }}
                          className={selectClass}
                        >
                          <option value="">— Select model —</option>
                          {modelsForMake.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      {selectedModel === 'Other' && (
                        <input
                          required
                          type="text"
                          placeholder="Type model name…"
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                          className={inputClass + ' mt-2'}
                        />
                      )}
                    </>
                  ) : (
                    <input
                      required
                      type="text"
                      placeholder="e.g. Corolla"
                      value={customModel}
                      onChange={(e) => { setSelectedModel('Other'); setCustomModel(e.target.value); }}
                      className={inputClass}
                    />
                  )}
                </div>
              </div>

              {/* Year, Plate, VIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Year — dropdown */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Year</label>
                  <div className="relative">
                    <select
                      required
                      value={form.year ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, year: parseInt(e.target.value) || null }))}
                      className={selectClass}
                    >
                      <option value="">— Year —</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                {/* License Plate */}
                <div className="space-y-1.5">
                  <label className={labelClass}>License Plate</label>
                  <input
                    required
                    type="text"
                    placeholder="ABC-1234"
                    value={form.license_plate}
                    onChange={(e) => setForm((p) => ({ ...p, license_plate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                {/* VIN */}
                <div className="space-y-1.5">
                  <label className={labelClass}>VIN / Chassis</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.vin || ''}
                    onChange={(e) => setForm((p) => ({ ...p, vin: e.target.value || null }))}
                    className={inputClass}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* ── SECTION 2: Technical Specs ────────────────────────────────── */}
          <div className="space-y-4">
            <p className={sectionTitleClass}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">2</span>
              Technical Specs
            </p>
            <div className={sectionClass}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Color — dropdown */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Color</label>
                  <div className="relative">
                    <select
                      value={form.color || ''}
                      onChange={(e) => setForm((p) => ({ ...p, color: e.target.value || null }))}
                      className={selectClass}
                    >
                      <option value="">— Select color —</option>
                      {COLORS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                {/* Mileage */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Current Mileage (km)</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.mileage}
                    onChange={(e) => setForm((p) => ({ ...p, mileage: parseInt(e.target.value) || 0 }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Transmission */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Transmission</label>
                  <div className="relative">
                    <select
                      value={form.transmission || ''}
                      onChange={(e) => setForm((p) => ({ ...p, transmission: e.target.value || null }))}
                      className={selectClass}
                    >
                      <option value="">— Select —</option>
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                {/* Fuel Type */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Fuel Type</label>
                  <div className="relative">
                    <select
                      value={form.fuel_type || ''}
                      onChange={(e) => setForm((p) => ({ ...p, fuel_type: e.target.value || null }))}
                      className={selectClass}
                    >
                      <option value="">— Select —</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Gasoline">Gasoline</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: Legal & Financial ──────────────────────────────── */}
          <div className="space-y-4">
            <p className={sectionTitleClass}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">3</span>
              Legal &amp; Financial
            </p>
            <div className={sectionClass}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Registration Date */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Registration Date</label>
                  <input
                    type="date"
                    value={form.registration_date || ''}
                    onChange={(e) => setForm((p) => ({ ...p, registration_date: e.target.value || null }))}
                    className={`${inputClass} uppercase`}
                  />
                </div>
                {/* Insurance Expiry */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Insurance Expiry</label>
                  <input
                    type="date"
                    value={form.insurance_expiry || ''}
                    onChange={(e) => setForm((p) => ({ ...p, insurance_expiry: e.target.value || null }))}
                    className={`${inputClass} uppercase`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Technical Inspection */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Technical Inspection Date</label>
                  <input
                    type="date"
                    value={form.technical_inspection || ''}
                    onChange={(e) => setForm((p) => ({ ...p, technical_inspection: e.target.value || null }))}
                    className={`${inputClass} uppercase`}
                  />
                </div>
                {/* Daily Rate */}
                <div className="space-y-1.5">
                  <label className={labelClass}>Daily Rate (MAD)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={form.daily_rate ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, daily_rate: parseFloat(e.target.value) || null }))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: Status & Media ─────────────────────────────────── */}
          <div className="space-y-4">
            <p className={sectionTitleClass}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">4</span>
              Status &amp; Media
            </p>
            <div className={sectionClass}>
              {/* Status */}
              <div className="space-y-1.5">
                <label className={labelClass}>Vehicle Status</label>
                <div className="relative">
                  <select
                    required
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as VehicleStatus }))}
                    className={selectClass}
                  >
                    <option value="available">Available</option>
                    <option value="rented">In Use / Rented</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Maintenance sub-fields */}
              {form.status === 'maintenance' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-orange-800 mb-1.5">Expected Return Date</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-orange-800 mb-1.5">Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Broken windshield"
                      value={form.notes || ''}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                      className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              {form.status !== 'maintenance' && (
                <div className="space-y-1.5">
                  <label className={labelClass}>Notes (optional)</label>
                  <textarea
                    rows={3}
                    value={form.notes || ''}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value || null }))}
                    className={`${inputClass} resize-none`}
                    placeholder="Any additional notes about this vehicle…"
                  />
                </div>
              )}

              {/* Photos */}
              <div className="space-y-3 pt-2">
                <label className={labelClass}>Photos</label>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((photo, i) => (
                    <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-all group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-600">
                    <ImagePlus size={24} className="mb-1" />
                    <span className="text-[10px] font-bold">Add Photo</span>
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ── Actions ────────────────────────────────────────────────────── */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link
              href={`/${tenantSlug}/fleet`}
              className="px-5 py-2.5 text-slate-500 hover:text-slate-900 font-semibold transition-colors text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm"
            >
              {isPending ? 'Adding…' : 'Add Vehicle'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
