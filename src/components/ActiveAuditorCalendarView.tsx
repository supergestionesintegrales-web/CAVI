import React, { useState, useMemo } from 'react';
import { RouteStep, Auditor } from '../types';
import { CaviNativeMap } from './CaviNativeMap';
import {
  formatDateToISO,
  formatDateSpanish,
  getStepEffectiveDate,
  isStepInDateRange,
  getDatePresets,
  SPANISH_DAYS,
  SPANISH_MONTHS,
} from '../utils/dateRangeUtils';
import { calculateTotalRouteDistanceKm, formatDistance, estimateTravelTime } from '../utils/geoUtils';

interface ActiveAuditorCalendarViewProps {
  steps: RouteStep[];
  auditors: Auditor[];
  activeAuditorId: string;
  onSelectAuditor: (auditorId: string) => void;
  onToggleStepStatus?: (stepId: string) => void;
  onOpenAuditModal?: (step: RouteStep) => void;
  onOpenAddStep?: (auditorId: string, defaultDay?: string) => void;
  onOpenGpsModal: () => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
  isAuxiliar?: boolean;
  userRole?: string;
}

export const ActiveAuditorCalendarView: React.FC<ActiveAuditorCalendarViewProps> = ({
  steps,
  auditors,
  activeAuditorId,
  onSelectAuditor,
  onToggleStepStatus,
  onOpenAuditModal,
  onOpenAddStep,
  onOpenGpsModal,
  onShowToast,
  isAuxiliar = false,
  userRole,
}) => {
  const isAdmin = userRole ? userRole === 'administrador' : !isAuxiliar;
  const referenceDate = useMemo(() => new Date(), []);
  const presets = useMemo(() => getDatePresets(referenceDate), [referenceDate]);

  // Date Range state (defaults to 'thisWeek' or 'all')
  const [selectedPreset, setSelectedPreset] = useState<'thisWeek' | 'today' | 'next7Days' | 'thisMonth' | 'custom' | 'all'>('thisWeek');
  const [startDate, setStartDate] = useState<string>(presets.thisWeek.start);
  const [endDate, setEndDate] = useState<string>(presets.thisWeek.end);

  // Status & channel sub-filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'revisit_needed' | 'alerts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'calendar_grid' | 'timeline_list'>('calendar_grid');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [highlightedStepId, setHighlightedStepId] = useState<string | null>(null);

  // Active auditor object
  const activeAuditor = useMemo(() => {
    return auditors.find((a) => a.id === activeAuditorId) || auditors[0];
  }, [auditors, activeAuditorId]);

  // All steps for this active auditor
  const auditorAllSteps = useMemo(() => {
    return steps.filter(
      (s) => s.auditorId === activeAuditor.id || (!s.auditorId && activeAuditor.id === 'aud-1')
    );
  }, [steps, activeAuditor]);

  // Steps filtered by date range and search/status
  const filteredSteps = useMemo(() => {
    return auditorAllSteps.filter((step) => {
      // 1. Date Range filter
      if (selectedPreset !== 'all') {
        const inRange = isStepInDateRange(step, startDate, endDate, referenceDate);
        if (!inRange) return false;
      }

      // 2. Status filter
      if (statusFilter === 'completed' && step.status !== 'completed') return false;
      if (statusFilter === 'pending' && step.status !== 'pending' && step.status !== 'in_progress' && step.status) return false;
      if (statusFilter === 'revisit_needed' && step.status !== 'revisit_needed') return false;
      if (statusFilter === 'alerts') {
        const isAlert =
          (step.daysWithoutVisit && step.daysWithoutVisit >= 60) ||
          (step.alertCategory && step.alertCategory !== 'ninguna');
        if (!isAlert) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = step.name.toLowerCase().includes(q);
        const matchCode = step.code.toLowerCase().includes(q);
        const matchAddr = step.address.toLowerCase().includes(q);
        const matchMuni = step.municipality?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchAddr && !matchMuni) return false;
      }

      return true;
    });
  }, [auditorAllSteps, selectedPreset, startDate, endDate, statusFilter, searchQuery, referenceDate]);

  // Group steps by their scheduled calendar date (YYYY-MM-DD)
  const stepsByDate = useMemo(() => {
    const map: Record<string, RouteStep[]> = {};
    filteredSteps.forEach((step) => {
      const d = getStepEffectiveDate(step, referenceDate);
      if (!map[d]) {
        map[d] = [];
      }
      map[d].push(step);
    });

    // Sort dates ascending
    const sortedEntries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    return sortedEntries;
  }, [filteredSteps, referenceDate]);

  // KPIs for the selected date range
  const totalStopsInRange = filteredSteps.length;
  const completedCount = filteredSteps.filter((s) => s.status === 'completed').length;
  const pendingCount = filteredSteps.filter((s) => s.status === 'pending' || s.status === 'in_progress' || !s.status).length;
  const revisitCount = filteredSteps.filter((s) => s.status === 'revisit_needed').length;
  const alertCount = filteredSteps.filter(
    (s) => (s.daysWithoutVisit && s.daysWithoutVisit >= 60) || (s.alertCategory && s.alertCategory !== 'ninguna')
  ).length;
  const gpsCount = filteredSteps.filter((s) => s.hasGps || (s.lat && s.lng)).length;
  const progressPercent = totalStopsInRange > 0 ? Math.round((completedCount / totalStopsInRange) * 100) : 0;

  // Route distance and time on native map
  const routeDistanceKm = useMemo(() => {
    const valid = filteredSteps.filter((s) => s.lat && s.lng);
    return calculateTotalRouteDistanceKm(valid);
  }, [filteredSteps]);

  const routeTime = useMemo(() => {
    return estimateTravelTime(routeDistanceKm);
  }, [routeDistanceKm]);

  // Preset handlers
  const handleApplyPreset = (presetKey: 'thisWeek' | 'today' | 'next7Days' | 'thisMonth' | 'all') => {
    setSelectedPreset(presetKey);
    if (presetKey === 'all') {
      setStartDate('');
      setEndDate('');
      onShowToast('Filtro de Fechas', 'Mostrando todo el ciclo operativo del auditor.', 'info');
      return;
    }
    const p = presets[presetKey];
    setStartDate(p.start);
    setEndDate(p.end);
    onShowToast(`Rango Seleccionado: ${p.label}`, `Filtrando paradas del ${p.start} al ${p.end}.`, 'info');
  };

  const handleCustomStartDateChange = (val: string) => {
    setStartDate(val);
    setSelectedPreset('custom');
  };

  const handleCustomEndDateChange = (val: string) => {
    setEndDate(val);
    setSelectedPreset('custom');
  };

  return (
    <div className="flex flex-col gap-4.5 w-full animate-in fade-in duration-300">
      {/* 1. TOP HEADER: ACTIVE AUDITOR SELECTOR & PROFILE BANNER */}
      <div className="bg-[#171f33] border border-[#222a3d] rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-[#0088ff]/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 bg-[#38bdf8]/10 rounded-full blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Active Auditor Profile */}
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img
                src={activeAuditor.avatar}
                alt={activeAuditor.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#0088ff] shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#4edea3] ring-2 ring-[#171f33]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0088ff]/20 text-[#38bdf8] text-xs font-bold border border-[#0088ff]/40 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  <span>Calendario de Auditor Activo</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#131b2e] text-[#cbd5e1] text-[10px] font-mono border border-[#222a3d]">
                  Auditor activo: {activeAuditor.name}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#131b2e] text-[#38bdf8] text-[10px] font-mono border border-[#222a3d]">
                  {activeAuditor.code}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-headline font-bold text-white mt-1">
                {activeAuditor.name}
              </h2>

              <p className="text-xs text-[#cbd5e1] mt-0.5">
                Programación de rutas e itinerarios sobre nuestro mapa nativo CAVIMAPS
              </p>
            </div>
          </div>

          {/* Quick Auditor Switcher Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            <div className="flex items-center gap-1 bg-[#0b1326] p-1 rounded-2xl border border-[#222a3d] max-w-full overflow-x-auto">
              {auditors.map((aud) => {
                const isCurrent = aud.id === activeAuditor.id;
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => {
                      onSelectAuditor(aud.id);
                      onShowToast(
                        'Auditor Activo',
                        `Visualizando calendario de ${aud.name} (Zona ${aud.zone}).`,
                        'info'
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isCurrent
                        ? 'bg-[#0088ff] text-white shadow-md shadow-[#0088ff]/30'
                        : 'text-[#cbd5e1] hover:text-white hover:bg-[#131b2e]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{aud.name.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-75 font-mono">({aud.zone})</span>
                  </button>
                );
              })}
            </div>

            {onOpenAddStep && isAdmin && (
              <button
                type="button"
                onClick={() => onOpenAddStep(activeAuditor.id)}
                className="px-3 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Agregar Parada</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. DATE RANGE SELECTOR BAR (SELECTOR DE RANGO DE FECHAS) */}
        <div className="mt-5 pt-4 border-t border-[#222a3d] flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Range Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white flex items-center gap-1 mr-1">
                <span className="material-symbols-outlined text-[17px] text-[#38bdf8]">date_range</span>
                <span>Rango de Fechas:</span>
              </span>

              {[
                { key: 'thisWeek', label: 'Esta Semana' },
                { key: 'today', label: 'Hoy' },
                { key: 'next7Days', label: 'Próximos 7 Días' },
                { key: 'thisMonth', label: 'Este Mes' },
                { key: 'all', label: 'Todo el Ciclo' },
              ].map((p) => {
                const isSelected = selectedPreset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleApplyPreset(p.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/40'
                        : 'bg-[#0b1326] text-[#cbd5e1] hover:text-white border border-[#222a3d]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Pickers (Desde / Hasta) */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-[#0b1326] px-2.5 py-1 rounded-xl border border-[#222a3d]">
                <span className="text-[11px] text-[#94a3b8] font-medium">Desde:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleCustomStartDateChange(e.target.value)}
                  className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer [color-scheme:dark]"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[#0b1326] px-2.5 py-1 rounded-xl border border-[#222a3d]">
                <span className="text-[11px] text-[#94a3b8] font-medium">Hasta:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleCustomEndDateChange(e.target.value)}
                  className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer [color-scheme:dark]"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  className="px-2.5 py-1.5 rounded-xl bg-[#0b1326] hover:bg-[#7f1d1d]/30 text-[#fca5a5] hover:text-white border border-[#222a3d] text-xs font-medium transition-colors cursor-pointer"
                  title="Limpiar rango de fechas"
                >
                  ✕ Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Active Range Summary Pill & Search / Sub-filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#0b1326] p-2.5 rounded-2xl border border-[#222a3d]">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-[#0088ff]/15 text-[#38bdf8] font-bold border border-[#0088ff]/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">event_available</span>
                <span>
                  {startDate && endDate
                    ? `${startDate} al ${endDate}`
                    : startDate
                    ? `Desde ${startDate}`
                    : endDate
                    ? `Hasta ${endDate}`
                    : 'Todas las fechas'}
                </span>
              </span>
              <span className="text-white font-medium">
                {totalStopsInRange} {totalStopsInRange === 1 ? 'parada encontrada' : 'paradas encontradas'}
              </span>
            </div>

            {/* Status quick chips */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'completed', label: 'Auditadas' },
                { id: 'pending', label: 'Pendientes' },
                { id: 'revisit_needed', label: 'Re-visitas' },
                { id: 'alerts', label: 'Alertas' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setStatusFilter(chip.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === chip.id
                      ? 'bg-[#0088ff] text-white shadow-xs'
                      : 'text-[#cbd5e1] hover:text-white hover:bg-[#131b2e]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. METRICS CARDS FOR THE SELECTED DATE RANGE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-[#171f33] p-3.5 rounded-2xl border border-[#222a3d] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-[#cbd5e1] font-medium block">Paradas en Rango</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-white">{totalStopsInRange}</span>
            <span className="text-[11px] text-[#94a3b8]">visitas</span>
          </div>
          <span className="text-[10px] text-[#38bdf8] font-mono mt-1">
            {auditorAllSteps.length > 0 ? `${Math.round((totalStopsInRange / auditorAllSteps.length) * 100)}% de su cuota` : '0%'}
          </span>
        </div>

        <div className="bg-[#171f33] p-3.5 rounded-2xl border border-[#222a3d] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-[#cbd5e1] font-medium block">Progreso de Auditoría</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400">{completedCount}</span>
            <span className="text-[11px] text-[#94a3b8]">/ {totalStopsInRange}</span>
          </div>
          <div className="w-full bg-[#0b1326] h-1.5 rounded-full overflow-hidden mt-1.5">
            <div style={{ width: `${progressPercent}%` }} className="bg-emerald-400 h-full" />
          </div>
        </div>

        <div className="bg-[#171f33] p-3.5 rounded-2xl border border-[#222a3d] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-[#cbd5e1] font-medium block">Cobertura GPS CAVIMAPS</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-[#38bdf8]">{gpsCount}</span>
            <span className="text-[11px] text-[#94a3b8]">con georref.</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">verified</span>
            <span>100% Nativo Leaflet</span>
          </span>
        </div>

        <div className="bg-[#171f33] p-3.5 rounded-2xl border border-[#222a3d] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] text-[#cbd5e1] font-medium block">Ruta Estimada (Rango)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-white">{formatDistance(routeDistanceKm)}</span>
          </div>
          <span className="text-[10px] text-[#cbd5e1] font-mono mt-1">
            ~{routeTime} de traslado
          </span>
        </div>

        <div className="bg-[#171f33] p-3.5 rounded-2xl border border-[#222a3d] shadow-sm flex flex-col justify-between col-span-2 sm:col-span-4 lg:col-span-1">
          <span className="text-[11px] text-[#cbd5e1] font-medium block">Alertas en Rango</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-red-400">{alertCount}</span>
            <span className="text-[11px] text-[#94a3b8]">prioritarias</span>
          </div>
          <span className="text-[10px] text-amber-300 font-medium mt-1">
            {alertCount > 0 ? 'Priorizadas en despacho' : 'Sin alertas críticas'}
          </span>
        </div>
      </div>

      {/* 4. MAPA NATIVO CAVIMAPS (NUESTRO PROPIO MAPA - SIN GOOGLE MAPS) */}
      <div className="bg-[#060e20] rounded-3xl border border-[#222a3d] overflow-hidden shadow-2xl relative flex flex-col">
        {/* Native Map Header Ribbon */}
        <div className="p-3 sm:p-4 bg-[#131b2e]/95 backdrop-blur-md border-b border-[#222a3d] flex flex-wrap items-center justify-between gap-2.5 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0088ff]/20 text-[#0088ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">share_location</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Ruta en Mapa Nativo CAVIMAPS</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#4edea3] text-[10px] font-bold border border-[#10b981]/30">
                    Nuestro Mapa Propio
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-[#cbd5e1]">
                Trazado del auditor {activeAuditor.name} para las fechas seleccionadas ({filteredSteps.length} paradas activas)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="px-3 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#38bdf8] text-xs font-bold border border-[#3b4760] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isMapExpanded ? 'close_fullscreen' : 'fit_screen'}
              </span>
              <span>{isMapExpanded ? 'Reducir Mapa' : 'Ampliar en Grande'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenGpsModal}
              className="px-3 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">fullscreen</span>
              <span>Pantalla Completa</span>
            </button>
          </div>
        </div>

        {/* Embedded Leaflet / CARTO Engine */}
        <div className="w-full relative">
          <CaviNativeMap
            height={isMapExpanded ? '720px' : '480px'}
            isExpandedLarge={isMapExpanded}
            onToggleExpandLarge={() => setIsMapExpanded(!isMapExpanded)}
            initialRouteStops={filteredSteps}
            onStopArrival={(stop) => {
              onShowToast(
                'Llegada a Parada',
                `${stop.name} (${stop.municipality || 'La Guajira'}).`,
                'success'
              );
            }}
          />
        </div>
      </div>

      {/* 5. CALENDAR & SCHEDULE SECTION: PARADAS EN EL RANGO DE FECHAS */}
      <div className="bg-[#171f33] border border-[#222a3d] rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        {/* Header with View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222a3d]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Calendario de Paradas del Auditor</span>
              <span className="px-2 py-0.5 rounded-full bg-[#0b1326] text-[#38bdf8] font-mono text-xs font-bold border border-[#222a3d]">
                {totalStopsInRange} PDVs
              </span>
            </h3>
            <p className="text-xs text-[#cbd5e1] mt-0.5">
              Programación cronológica agrupada por fecha dentro del rango seleccionado
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#0b1326] p-1 rounded-xl border border-[#222a3d]">
              <button
                type="button"
                onClick={() => setViewMode('calendar_grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'calendar_grid'
                    ? 'bg-[#0088ff] text-white shadow-xs'
                    : 'text-[#cbd5e1] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
                <span>Por Días</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('timeline_list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'timeline_list'
                    ? 'bg-[#0088ff] text-white shadow-xs'
                    : 'text-[#cbd5e1] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_timeline</span>
                <span>Lista Cronológica</span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredSteps.length === 0 ? (
          <div className="p-8 text-center bg-[#0b1326] rounded-2xl border border-dashed border-[#222a3d] flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#171f33] text-[#94a3b8] flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">event_busy</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                No hay paradas para {activeAuditor.name} en el rango de fechas seleccionado
              </p>
              <p className="text-xs text-[#cbd5e1] mt-0.5">
                Prueba ampliando el rango de fechas con "Esta Semana", "Este Mes" o "Todo el Ciclo".
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('all')}
                className="px-3 py-1.5 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold transition-all cursor-pointer"
              >
                Ver Todo el Ciclo
              </button>
              {onOpenAddStep && isAdmin && (
                <button
                  type="button"
                  onClick={() => onOpenAddStep(activeAuditor.id)}
                  className="px-3 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#38bdf8] text-xs font-bold border border-[#3b4760] transition-all cursor-pointer"
                >
                  + Programar Parada
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Render Steps Grouped By Scheduled Date */
          <div className="space-y-4">
            {stepsByDate.map(([dateKey, daySteps]) => {
              const dayCompletedCount = daySteps.filter((s) => s.status === 'completed').length;
              const formattedDateLabel = formatDateSpanish(dateKey);

              return (
                <div
                  key={dateKey}
                  className="bg-[#0b1326] border border-[#222a3d] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
                >
                  {/* Day Date Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#222a3d]/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#0088ff]/20 text-[#0088ff] font-bold font-mono flex items-center justify-center text-xs">
                        {dateKey.slice(8, 10)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white capitalize flex items-center gap-2">
                          <span>{formattedDateLabel || dateKey}</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-[#131b2e] text-[#38bdf8] border border-[#222a3d]">
                            {daySteps.length} {daySteps.length === 1 ? 'parada' : 'paradas'}
                          </span>
                        </h4>
                        <span className="text-[11px] text-[#cbd5e1] font-mono">
                          {dateKey} · Auditor {activeAuditor.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        {dayCompletedCount}/{daySteps.length} auditadas
                      </span>
                      <div className="w-20 bg-[#131b2e] h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${daySteps.length > 0 ? (dayCompletedCount / daySteps.length) * 100 : 0}%` }}
                          className="bg-emerald-400 h-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stops in this Day */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {daySteps.map((step, idx) => {
                      const isCompleted = step.status === 'completed';
                      const isNotAudited = step.status === 'not_audited';
                      const isRevisit = step.status === 'revisit_needed';
                      const isCurrent = step.status === 'in_progress';
                      const hasAlert =
                        (step.daysWithoutVisit && step.daysWithoutVisit >= 60) ||
                        (step.alertCategory && step.alertCategory !== 'ninguna');

                      return (
                        <div
                          key={step.id}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                            isCompleted
                              ? 'bg-[#131b2e] border-[#10b981]/30'
                              : isNotAudited
                              ? 'bg-[#131b2e] border-[#ef4444]/30'
                              : isRevisit
                              ? 'bg-[#131b2e] border-[#a855f7]/30'
                              : isCurrent
                              ? 'bg-[#1e293b] border-[#f59e0b]/40 ring-1 ring-[#f59e0b]/30'
                              : 'bg-[#131b2e] border-[#222a3d] hover:border-[#0088ff]/40'
                          }`}
                        >
                          <div className="space-y-1.5">
                            {/* Top Line: Badge, Code, Format, GPS */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="w-5 h-5 rounded-md bg-[#1e293b] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="font-mono text-xs font-bold text-white">
                                  {step.time}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    step.format === 'CM'
                                      ? 'bg-[#0284c7] text-white'
                                      : step.format === 'PF'
                                      ? 'bg-[#7c3aed] text-white'
                                      : 'bg-[#0088ff] text-white'
                                  }`}
                                >
                                  {step.code}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                {step.hasGps && (
                                  <span className="px-1.5 py-0.2 rounded bg-[#0088ff]/20 text-[#38bdf8] text-[9px] font-bold flex items-center gap-0.5 border border-[#0088ff]/30">
                                    <span className="material-symbols-outlined text-[10px]">gps_fixed</span>
                                    <span>GPS</span>
                                  </span>
                                )}

                                {isCompleted && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#064e3b] text-[#6ee7b7]">
                                    Auditada
                                  </span>
                                )}
                                {isNotAudited && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#7f1d1d] text-[#fca5a5]">
                                    No auditada
                                  </span>
                                )}
                                {isRevisit && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#581c87] text-[#d8b4fe]">
                                    Re-visita
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Name & Address */}
                            <h5 className="text-xs font-bold text-white leading-snug">
                              {step.name}
                            </h5>

                            <p className="text-[11px] text-[#cbd5e1] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-[#0088ff] shrink-0">
                                location_on
                              </span>
                              <span className="truncate">{step.address} · {step.municipality || 'La Guajira'}</span>
                            </p>

                            {/* Alert notice if any */}
                            {hasAlert && (
                              <div className="p-1.5 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center gap-1.5 text-[10px] text-red-300">
                                <span className="material-symbols-outlined text-[12px] text-red-400">warning</span>
                                <span>{step.daysWithoutVisit ? `${step.daysWithoutVisit} días sin visita` : 'Alerta de campo activa'}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-[#222a3d] flex items-center justify-between gap-2">
                            <span className="text-[10px] text-[#94a3b8] font-mono">
                              Canal: {step.channel || 'Tradicional'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {isAdmin ? (
                                <>
                                  {onOpenAuditModal && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenAuditModal(step)}
                                      className="px-2 py-1 rounded-lg bg-[#0088ff] hover:bg-[#0070d8] text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">rate_review</span>
                                      <span>Auditar</span>
                                    </button>
                                  )}

                                  {onToggleStepStatus && (
                                    <button
                                      type="button"
                                      onClick={() => onToggleStepStatus(step.id)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                        isCompleted
                                          ? 'bg-[#064e3b] text-[#6ee7b7] border-[#10b981]/40'
                                          : isNotAudited
                                          ? 'bg-red-950/50 text-red-300 border-red-900'
                                          : 'bg-[#1e293b] text-[#93c5fd] border-[#334155]'
                                      }`}
                                      title="Ciclar estado"
                                    >
                                      {isCompleted ? '✓ OK' : isNotAudited ? '✕ No' : 'Pendiente'}
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                    isCompleted
                                      ? 'bg-[#064e3b] text-[#6ee7b7] border-[#10b981]/40'
                                      : isNotAudited
                                      ? 'bg-red-950/50 text-red-300 border-red-900'
                                      : 'bg-[#1e293b] text-[#93c5fd] border-[#334155]'
                                  }`}
                                >
                                  {isCompleted ? 'Auditado ✓' : isNotAudited ? 'No Auditado' : 'Pendiente'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
