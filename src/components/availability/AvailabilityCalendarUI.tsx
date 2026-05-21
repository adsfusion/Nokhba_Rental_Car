'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, Plus, Settings, CheckCircle, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/types';

type CalendarEvent = {
  id: string;
  type: 'reservation' | 'contract' | 'maintenance';
  vehicle_id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  clientName: string;
  vehicleName: string;
  refNumber: string;
};

type Props = {
  vehicles: Vehicle[];
  contracts: any[];
  reservations: any[];
  maintenances: any[];
  viewStart: string;
  viewEnd: string;
  tenantSlug: string;
  initialYear: number;
  initialMonth: number;
  initialDay: number;
};

export default function AvailabilityCalendarUI({
  vehicles,
  contracts,
  reservations,
  maintenances,
  tenantSlug,
  initialYear,
  initialMonth,
  initialDay
}: Props) {
  const router = useRouter();

  const allEvents: CalendarEvent[] = useMemo(() => {
    const evMap = new Map<string, CalendarEvent>();
    
    const getVehicleName = (vId: string) => {
      const v = vehicles.find(v => v.id === vId);
      return v ? `${v.brand} ${v.model}` : 'Unknown Vehicle';
    };

    reservations.forEach((r) => {
      evMap.set(r.id, {
        id: r.id,
        type: 'reservation',
        vehicle_id: r.vehicle_id,
        startDate: new Date(r.start_date),
        endDate: new Date(r.end_date),
        status: r.status,
        clientName: r.clients?.full_name || 'Unknown',
        vehicleName: getVehicleName(r.vehicle_id),
        refNumber: r.reference_number || 'RES-XXX'
      });
    });

    contracts.forEach((c) => {
      evMap.set(c.id, {
        id: c.id,
        type: 'contract',
        vehicle_id: c.vehicle_id,
        startDate: new Date(c.start_date),
        endDate: new Date(c.end_date),
        status: c.status,
        clientName: c.clients?.full_name || 'Unknown',
        vehicleName: getVehicleName(c.vehicle_id),
        refNumber: c.contract_number || 'CTR-XXX'
      });
    });

    maintenances.forEach((m) => {
      evMap.set(m.id, {
        id: m.id,
        type: 'maintenance',
        vehicle_id: m.vehicle_id,
        startDate: new Date(m.start_date),
        endDate: new Date(m.end_date),
        status: m.status,
        clientName: '-',
        vehicleName: getVehicleName(m.vehicle_id),
        refNumber: m.reason || 'Maintenance'
      });
    });
    
    return Array.from(evMap.values());
  }, [contracts, reservations, maintenances, vehicles]);

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Brands');

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(vehicles.map(v => v.brand || 'Other').filter(Boolean))).sort();
  }, [vehicles]);

  // Tooltip State
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    customer: '',
    duration: '',
    status: ''
  });

  React.useEffect(() => {
    setCurrentDate(new Date(initialYear, initialMonth, initialDay));
    setIsMounted(true);
  }, [initialYear, initialMonth, initialDay]);

  if (!isMounted || !currentDate) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-50 rounded-2xl border border-slate-200 animate-pulse">
        <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Loading Calendar...</p>
      </div>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  let displayDays: Date[] = [];
  let prefixCount = 0;
  let dateRangeText = '';

  if (viewMode === 'monthly') {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    displayDays = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    prefixCount = firstDayOfMonth;
    dateRangeText = `${new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(year, month, daysInMonth).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } else if (viewMode === 'weekly') {
    const currentDayOfWeek = currentDate.getDay(); // 0 is Sunday
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);
    displayDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
    prefixCount = 0;
    dateRangeText = `${displayDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${displayDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } else if (viewMode === 'daily') {
    displayDays = [currentDate];
    prefixCount = 0;
    dateRangeText = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const prefixCellsArray = Array.from({ length: prefixCount }, (_, i) => i);

  const updateURL = (d: Date) => {
    router.push(`?year=${d.getFullYear()}&month=${d.getMonth()}&day=${d.getDate()}`, { scroll: false });
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'monthly') {
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'weekly') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === 'daily') {
      d.setDate(d.getDate() - 1);
    }
    updateURL(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'monthly') {
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === 'daily') {
      d.setDate(d.getDate() + 1);
    }
    updateURL(d);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // KPI Calculations
  const kpiStart = new Date(currentDate);
  kpiStart.setHours(0, 0, 0, 0);
  const kpiEnd = new Date(currentDate);
  kpiEnd.setHours(23, 59, 59, 999);

  const activeBookings = new Set<string>();
  const activeMaintenance = new Set<string>();

  allEvents.forEach(ev => {
    if (ev.startDate <= kpiEnd && ev.endDate >= kpiStart) {
      if (ev.type === 'maintenance' || ev.status.toLowerCase() === 'maintenance' || ev.status.toLowerCase() === 'unavailable') {
        activeMaintenance.add(ev.vehicle_id);
      } else if (ev.status.toLowerCase() !== 'cancelled') {
        activeBookings.add(ev.vehicle_id);
      }
    }
  });

  const totalVehicles = vehicles.length;
  const uniqueBookedCount = Array.from(activeBookings).filter(id => !activeMaintenance.has(id)).length;
  const maintCount = activeMaintenance.size;
  
  const availableVehicles = Math.max(0, totalVehicles - uniqueBookedCount - maintCount);
  const occupancyRate = totalVehicles > 0 ? Math.round((uniqueBookedCount / totalVehicles) * 100) : 0;

  const handlePillInteraction = (e: React.MouseEvent, ev: CalendarEvent) => {
    setTooltip({
      visible: true,
      x: e.clientX + 10,
      y: e.clientY + 10,
      customer: ev.clientName,
      duration: `${Math.ceil((ev.endDate.getTime() - ev.startDate.getTime()) / (1000 * 60 * 60 * 24))} days (${ev.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} - ${ev.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric'})})`,
      status: ev.status.charAt(0).toUpperCase() + ev.status.slice(1)
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-900" dir="ltr">
      
      {/* Header Actions & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-end gap-4 hidden">
        {/* Intentionally hidden, buttons moved to calendar header */}
      </div>

      {/* Filters Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Brand</span>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-none p-0 text-lg font-semibold text-slate-900 focus:ring-0"
          >
            <option value="All Brands">All Brands</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date Range</span>
          <div className="flex items-center justify-between cursor-pointer">
            <span className="text-lg font-semibold text-slate-900">
              {dateRangeText}
            </span>
            <CalendarIcon size={20} className="text-slate-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col gap-1 justify-center">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</span>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
              <span className="text-xs font-medium text-slate-900">Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <span className="text-xs font-medium text-slate-900">Maintenance</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button 
            onClick={() => router.push(`/${tenantSlug}/reservations/new`)}
            className="bg-slate-900 text-white px-6 py-4 rounded-lg text-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all w-full md:w-auto h-full"
          >
            <Plus size={24} /> Add New Reservation
          </button>
        </div>
      </div>

      {/* Timeline / Calendar View */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={handlePrev} className="p-1 hover:bg-slate-50 rounded transition-colors text-slate-500"><ChevronLeft size={24} /></button>
              <button onClick={handleNext} className="p-1 hover:bg-slate-50 rounded transition-colors text-slate-500"><ChevronRight size={24} /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setViewMode('daily')} className={cn("px-4 py-1.5 rounded text-xs font-medium transition-all", viewMode === 'daily' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Daily</button>
              <button onClick={() => setViewMode('weekly')} className={cn("px-4 py-1.5 rounded text-xs font-medium transition-all", viewMode === 'weekly' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Weekly</button>
              <button onClick={() => setViewMode('monthly')} className={cn("px-4 py-1.5 rounded text-xs font-medium transition-all", viewMode === 'monthly' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Monthly</button>
            </div>
            
            <div className="hidden md:flex gap-4 ml-2 border-l border-slate-200 pl-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-xs font-medium text-slate-500">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs font-medium text-slate-500">Maintenance</span>
              </div>
            </div>
          </div>
        </div>

        {viewMode !== 'daily' && (
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-slate-500 border-r border-slate-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
        )}
        
        {viewMode === 'daily' && (
          <div className="border-b border-slate-200 bg-slate-50 p-2 text-center text-xs font-medium text-slate-500">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
        )}

        <div className={cn("grid", viewMode === 'daily' ? "grid-cols-1" : "grid-cols-7")}>
          {prefixCellsArray.map(idx => (
            <div key={`prefix-${idx}`} className="min-h-[120px] p-2 border-r border-b border-slate-200 bg-white/50"></div>
          ))}

          {displayDays.map((day, idx) => {
            const today = isToday(day);
            const isLastCol = viewMode === 'daily' || (prefixCount + idx + 1) % 7 === 0;

            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);

            const intersectingEvents = allEvents.filter(ev => {
              if (ev.startDate > dayEnd || ev.endDate < dayStart) return false;
              if (selectedCategory !== 'All Brands') {
                const v = vehicles.find(v => v.id === ev.vehicle_id);
                const cat = v?.brand || 'Other';
                if (cat !== selectedCategory) return false;
              }
              return true;
            });
            
            // Safe deduplication for overlapping data
            const uniqueDayEvents: CalendarEvent[] = [];
            const seenVehicles = new Set<string>();
            for (const ev of intersectingEvents) {
              if (!seenVehicles.has(ev.vehicle_id)) {
                uniqueDayEvents.push(ev);
                seenVehicles.add(ev.vehicle_id);
              }
            }

            return (
              <div key={day.toISOString()} className={cn(
                "min-h-[120px] p-2 border-b border-slate-200 flex flex-col gap-1",
                !isLastCol && "border-r border-slate-200"
              )}>
                <span className={cn(
                  "text-xs font-medium mb-1",
                  today ? "text-blue-600 font-bold" : "text-slate-500"
                )}>
                  {day.getDate()} {today && '(Today)'}
                </span>

                {/* Pill Container strictly constrained via max-height */}
                <div className="flex flex-col gap-1 flex-1 max-h-32 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {uniqueDayEvents.map(ev => {
                    const isMaintenance = ev.type === 'maintenance' || ev.status.toLowerCase() === 'maintenance' || ev.status.toLowerCase() === 'unavailable';
                    
                    let pillClass = "bg-blue-600/10 text-blue-600 border-blue-600/20";
                    if (isMaintenance) {
                      pillClass = "bg-slate-100 text-slate-700 border-red-200";
                    } else if (ev.type === 'reservation') {
                      pillClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                    } else if (ev.type === 'contract') {
                      pillClass = "bg-blue-600/10 text-blue-600 border-blue-600/20";
                    }

                    return (
                      <div
                        key={ev.id}
                        onMouseEnter={(e) => handlePillInteraction(e, ev)}
                        onMouseMove={(e) => setTooltip(t => ({ ...t, x: e.clientX + 10, y: e.clientY + 10 }))}
                        onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ev.type === 'reservation') {
                            router.push(`/${tenantSlug}/reservations/${ev.id}/edit`);
                          } else if (ev.type === 'contract') {
                            router.push(`/${tenantSlug}/contracts/${ev.id}/edit`);
                          }
                          // Ignore click for maintenance for now as no edit page is defined
                        }}
                        className={cn("text-[10px] p-1 rounded border truncate cursor-pointer", pillClass)}
                      >
                        {isMaintenance ? "Scheduled Maintenance" : ev.vehicleName}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Daily Occupancy Rate</span>
            <span className="text-3xl font-bold text-slate-900">{occupancyRate}%</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center">
            <Percent className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Vehicles Under Maintenance</span>
            <span className="text-3xl font-bold text-amber-500">{maintCount}</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Settings className="text-amber-500" size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Available Vehicles</span>
            <span className="text-3xl font-bold text-blue-600">{availableVehicles}</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center">
            <CheckCircle className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {tooltip.visible && (
        <div 
          className="fixed z-[100] min-w-[250px] max-w-sm whitespace-nowrap bg-slate-900 text-slate-50 p-4 rounded shadow-xl border border-slate-700 pointer-events-none transition-opacity duration-200"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <h4 className="text-sm font-semibold border-b border-slate-700 mb-2 pb-1">Booking Details</h4>
          <p className="text-xs font-medium opacity-80 mb-1">Customer: {tooltip.customer}</p>
          <p className="text-xs font-medium opacity-80 mb-1">Duration: {tooltip.duration}</p>
          <p className="text-xs font-medium opacity-80">Status: {tooltip.status}</p>
        </div>
      )}
      
    </div>
  );
}
