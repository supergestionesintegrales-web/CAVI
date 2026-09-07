import React, { useState, useMemo } from 'react';
import { FloatingPoint, Auditor, FormatType } from '../types';

interface AlertPointsAssignmentPoolProps {
  floatingPoints: FloatingPoint[];
  auditors: Auditor[];
  onAssignPoint: (id: string, auditorId: string, day: string) => void;
  onAutoAssignAll: () => void;
  onDeletePoint?: (id: string) => void;
  onOpenAddModal: () => void;
  onReloadSampleAlertPoints?: () => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
}

export const AlertPointsAssignmentPool: React.FC<AlertPointsAssignmentPoolProps> = ({
  floatingPoints,
  auditors,
  onAssignPoint,
  onAutoAssignAll,
  onDeletePoint,
  onOpenAddModal,
  onReloadSampleAlertPoints,
  onShowToast,
}) => {
  // Local state for assignments (selected auditor and day per point)
  const [selectedAuditorMap, setSelectedAuditorMap] = useState<Record<string, string>>({});
  const [selectedDayMap, setSelectedDayMap] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'alerts' | '2_3_meses' | 'mas_3_meses' | 'norte' | 'centro' | 'sur'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to get recommended auditor for a point based on zone/municipality
  const getRecommendedAuditor = (point: FloatingPoint): Auditor => {
    const text = `${point.zone || ''} ${point.municipality || ''} ${point.address || ''}`.toLowerCase();
    if (text.includes('centro') || text.includes('maicao') || text.includes('albania')) {
      return auditors[1] || auditors[0]; // Kleyder (Centro)
    }
    if (text.includes('sur') || text.includes('san juan') || text.includes('villanueva') || text.includes('fonseca')) {
      return auditors[2] || auditors[0]; // Jose (Sur)
    }
    return auditors[0]; // Samuel (Norte)
  };

  // Helper to get recommended day based on antiquity
  const getRecommendedDay = (days: number = 0): string => {
    if (days >= 90) return 'lunes';
    if (days >= 75) return 'martes';
    if (days >= 60) return 'miércoles';
    return 'jueves';
  };

  // Counters
  const countAlerts = useMemo(() => {
    return floatingPoints.filter((p) => p.alertCategory && p.alertCategory !== 'ninguna').length;
  }, [floatingPoints]);

  const countBetween2And3Months = useMemo(() => {
    return floatingPoints.filter((p) => (p.daysWithoutVisit || 0) >= 60 && (p.daysWithoutVisit || 0) < 90).length;
  }, [floatingPoints]);

  const countMoreThan3Months = useMemo(() => {
    return floatingPoints.filter((p) => (p.daysWithoutVisit || 0) >= 90).length;
  }, [floatingPoints]);

  // Filtered points
  const filteredPoints = useMemo(() => {
    return floatingPoints.filter((p) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        const matchAddr = (p.address || '').toLowerCase().includes(q);
        const matchMuni = (p.municipality || '').toLowerCase().includes(q);
        const matchDesc = (p.alertDescription || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchAddr && !matchMuni && !matchDesc) return false;
      }

      // Filter tabs
      const days = p.daysWithoutVisit || 0;
      if (activeFilter === 'alerts') {
        return !!p.alertCategory && p.alertCategory !== 'ninguna';
      }
      if (activeFilter === '2_3_meses') {
        return days >= 60 && days < 90;
      }
      if (activeFilter === 'mas_3_meses') {
        return days >= 90;
      }
      if (activeFilter === 'norte') {
        return p.zone === 'Norte' || p.municipality?.toLowerCase().includes('riohacha') || p.municipality?.toLowerCase().includes('manaure') || p.municipality?.toLowerCase().includes('uribia');
      }
      if (activeFilter === 'centro') {
        return p.zone === 'Centro' || p.municipality?.toLowerCase().includes('maicao') || p.municipality?.toLowerCase().includes('albania');
      }
      if (activeFilter === 'sur') {
        return p.zone === 'Sur' || p.municipality?.toLowerCase().includes('san juan') || p.municipality?.toLowerCase().includes('villanueva') || p.municipality?.toLowerCase().includes('fonseca');
      }

      return true;
    });
  }, [floatingPoints, activeFilter, searchQuery]);

  const handleAssignSingle = (point: FloatingPoint) => {
    const recommendedAud = getRecommendedAuditor(point);
    const auditorId = selectedAuditorMap[point.id] || recommendedAud.id;
    const recommendedDay = getRecommendedDay(point.daysWithoutVisit || 0);
    const day = selectedDayMap[point.id] || recommendedDay;

    onAssignPoint(point.id, auditorId, day);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Stat Cards */}
      <div className="bg-[#171f33] border border-[#222a3d] rounded-2xl p-4 sm:p-5 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dc2626]/20 border border-[#dc2626]/40 text-[#f87171] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">notification_important</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-headline font-bold text-base sm:text-lg text-white">
                  Bandeja de Asignación de Puntos Críticos y Alertas
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#dc2626]/30 text-[#fca5a5] text-xs font-bold border border-[#dc2626]/50">
                  {floatingPoints.length} pendientes
                </span>
              </div>
              <p className="text-xs text-[#cbd5e1] mt-0.5">
                Puntos de venta rezagados sin visita (2 a 3 meses y más) o con incidencias operativas en La Guajira listos para despacho.
              </p>
            </div>
          </div>

          {/* Quick Global Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={onAutoAssignAll}
              disabled={floatingPoints.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0088ff] hover:from-[#1d4ed8] hover:to-[#0070d8] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
              title="Distribuye automáticamente todos los puntos según zona geográfica y SLA"
            >
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              <span>⚡ Asignación Inteligente CAVI</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-3 py-2 rounded-xl bg-[#1e293b] hover:bg-[#2d3a58] text-[#fcd34d] text-xs font-bold border border-[#f59e0b]/40 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_alert</span>
              <span>+ Nuevo Punto</span>
            </button>

            {onReloadSampleAlertPoints && floatingPoints.length === 0 && (
              <button
                type="button"
                onClick={onReloadSampleAlertPoints}
                className="px-3 py-2 rounded-xl bg-[#131b2e] hover:bg-[#1e293b] text-[#38bdf8] text-xs font-bold border border-[#38bdf8]/40 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">replay</span>
                <span>Restablecer Puntos de Prueba</span>
              </button>
            )}
          </div>
        </div>

        {/* STATS METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-200 dark:border-[#222a3d]">
          <div className="bg-white dark:bg-[#131b2e] p-3 rounded-xl border border-slate-200 dark:border-[#222a3d] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-[#cbd5e1] block">Total Pendientes</span>
            <span className="text-xl font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
              {floatingPoints.length} PDVs
            </span>
            <span className="text-[10px] text-slate-500 dark:text-[#94a3b8] block mt-0.5">En espera de ruta</span>
          </div>

          <div className="bg-amber-50/70 dark:bg-[#131b2e] p-3 rounded-xl border border-amber-300 dark:border-[#f59e0b]/30 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-amber-900 dark:text-[#fcd34d] block">Sin Visita 2-3 Meses</span>
            <span className="text-xl font-mono font-bold text-amber-800 dark:text-[#fcd34d] mt-0.5 block">
              {countBetween2And3Months} PDVs
            </span>
            <span className="text-[10px] text-amber-700/90 dark:text-[#fcd34d]/80 block mt-0.5 font-medium">60 a 90 días en mora</span>
          </div>

          <div className="bg-red-50/70 dark:bg-[#131b2e] p-3 rounded-xl border border-red-300 dark:border-[#dc2626]/30 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-red-900 dark:text-[#f87171] block">Críticos &gt;3 Meses</span>
            <span className="text-xl font-mono font-bold text-red-800 dark:text-[#f87171] mt-0.5 block">
              {countMoreThan3Months} PDVs
            </span>
            <span className="text-[10px] text-red-700/90 dark:text-[#f87171]/80 block mt-0.5 font-medium">&gt;90 días sin visita (Alerta)</span>
          </div>

          <div className="bg-sky-50/70 dark:bg-[#131b2e] p-3 rounded-xl border border-sky-300 dark:border-[#38bdf8]/30 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-sky-900 dark:text-[#38bdf8] block">Alertas Operativas</span>
            <span className="text-xl font-mono font-bold text-sky-800 dark:text-[#38bdf8] mt-0.5 block">
              {countAlerts} PDVs
            </span>
            <span className="text-[10px] text-sky-700/90 dark:text-[#38bdf8]/80 block mt-0.5 font-medium">Stock, precios o SLA</span>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#131b2e] p-3 rounded-2xl border border-slate-200 dark:border-[#222a3d] shadow-sm">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {[
            { key: 'all', label: `Todos (${floatingPoints.length})` },
            { key: '2_3_meses', label: `⏱️ 2-3 Meses (${countBetween2And3Months})` },
            { key: 'mas_3_meses', label: `🔴 >3 Meses (${countMoreThan3Months})` },
            { key: 'alerts', label: `🚨 Alertas (${countAlerts})` },
            { key: 'norte', label: 'Zona Norte' },
            { key: 'centro', label: 'Zona Centro' },
            { key: 'sur', label: 'Zona Sur' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeFilter === f.key
                  ? 'bg-[#0088ff] text-white shadow-sm shadow-[#0088ff]/40'
                  : 'bg-slate-100 dark:bg-[#171f33] text-slate-800 dark:text-[#cbd5e1] hover:bg-slate-200 dark:hover:bg-[#1e293b] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-500 dark:text-[#94a3b8]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por PDV, código o municipio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#171f33] border border-slate-300 dark:border-[#2d3a58] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder-[#94a3b8] focus:outline-none focus:border-[#0088ff] font-medium"
          />
        </div>
      </div>

      {/* POINTS LIST GRID */}
      {filteredPoints.length === 0 ? (
        <div className="bg-white dark:bg-[#171f33] border border-slate-200 dark:border-[#222a3d] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#10b981]/20 text-[#059669] dark:text-[#34d399] flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">verified</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white">
              {floatingPoints.length === 0
                ? '¡No hay puntos críticos pendientes de asignar!'
                : 'Ningún punto coincide con los filtros seleccionados'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#cbd5e1] max-w-md mx-auto mt-1">
              {floatingPoints.length === 0
                ? 'Todos los puntos con alertas y aquellos con más de 2 meses sin visita han sido despachados a las hojas de ruta de los auditores.'
                : 'Intenta cambiar el término de búsqueda o seleccionar la pestaña "Todos".'}
            </p>
          </div>
          {floatingPoints.length === 0 && onReloadSampleAlertPoints && (
            <button
              type="button"
              onClick={onReloadSampleAlertPoints}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-[#2d3a58] text-[#0070d8] dark:text-[#38bdf8] text-xs font-bold border border-blue-200 dark:border-[#38bdf8]/40 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">replay</span>
              <span>Cargar Puntos con Alertas (Demostración La Guajira)</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPoints.map((point) => {
            const recommendedAud = getRecommendedAuditor(point);
            const selectedAudId = selectedAuditorMap[point.id] || recommendedAud.id;
            const recommendedDay = getRecommendedDay(point.daysWithoutVisit || 0);
            const selectedDay = selectedDayMap[point.id] || recommendedDay;

            const days = point.daysWithoutVisit || 0;
            const isMoreThan3Months = days >= 90;
            const is2To3Months = days >= 60 && days < 90;

            return (
              <div
                key={point.id}
                className={`bg-white dark:bg-[#171f33] rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3.5 transition-all hover:shadow-md ${
                  isMoreThan3Months
                    ? 'border-2 border-red-500/80 border-l-8 border-l-red-600'
                    : is2To3Months
                    ? 'border-2 border-amber-500/80 border-l-8 border-l-amber-500'
                    : 'border border-slate-200 dark:border-[#222a3d]'
                }`}
              >
                {/* Point Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                          point.format === 'CM'
                            ? 'bg-[#0284c7] text-white'
                            : point.format === 'PF'
                            ? 'bg-[#7c3aed] text-white'
                            : 'bg-[#0088ff] text-white'
                        }`}
                      >
                        {point.code}
                      </span>
                      <h3 className="font-headline font-bold text-base text-slate-900 dark:text-white truncate" title={point.name}>
                        {point.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                        point.priority === 'Urgente'
                          ? 'bg-red-600 text-white shadow-sm'
                          : point.priority === 'Alta'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {point.priority}
                    </span>
                  </div>

                  {/* Location & Municipality */}
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-[#cbd5e1] mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[16px] text-[#0088ff]">location_on</span>
                      <span className="text-slate-800 dark:text-slate-200">{point.address}</span>
                    </span>
                    {point.municipality && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#131b2e] text-slate-800 dark:text-[#93c5fd] font-bold text-[10px] border border-slate-200 dark:border-[#2d3a58]">
                        📍 {point.municipality} (Zona {point.zone || 'La Guajira'})
                      </span>
                    )}
                  </div>

                  {/* VITAL: ANTIGÜEDAD Y ALERTA VISUAL CALLOUT */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-[#2d3a58] space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Urgency Pill */}
                      {days > 0 && (
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isMoreThan3Months
                              ? 'bg-red-600 text-white shadow-sm'
                              : is2To3Months
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isMoreThan3Months ? 'error' : 'schedule'}
                          </span>
                          <span>
                            {days} días sin visita (~{(days / 30).toFixed(1)} meses)
                          </span>
                        </div>
                      )}

                      {point.lastVisitDate && (
                        <span className="text-xs text-slate-700 dark:text-[#94a3b8] font-medium">
                          Última auditoría: <strong className="text-slate-900 dark:text-white font-bold">{point.lastVisitDate}</strong>
                        </span>
                      )}
                    </div>

                    {/* Alert Description */}
                    {point.alertDescription && (
                      <div className="text-xs text-red-900 dark:text-[#fca5a5] bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900/50 font-semibold leading-snug flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-red-600 dark:text-[#f87171] shrink-0 mt-0.5">
                          warning
                        </span>
                        <span>{point.alertDescription}</span>
                      </div>
                    )}

                    {point.details && !point.alertDescription && (
                      <p className="text-xs text-slate-700 dark:text-[#cbd5e1] leading-tight">
                        {point.details}
                      </p>
                    )}
                  </div>
                </div>

                {/* ASSIGNMENT CONTROLS BAR */}
                <div className="pt-3 border-t border-slate-200 dark:border-[#222a3d] space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Auditor Selector */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-900 dark:text-[#cbd5e1] mb-1 tracking-wide">
                        Asignar a Auditor:
                      </label>
                      <select
                        value={selectedAudId}
                        onChange={(e) =>
                          setSelectedAuditorMap((prev) => ({
                            ...prev,
                            [point.id]: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-300 dark:border-[#2d3a58] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#0088ff]"
                      >
                        {auditors.map((aud) => (
                          <option key={aud.id} value={aud.id}>
                            {aud.name} · Zona {aud.zone} {aud.id === recommendedAud.id ? '(Sugerido)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Day Selector */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-900 dark:text-[#cbd5e1] mb-1 tracking-wide">
                        Día de Ruta:
                      </label>
                      <select
                        value={selectedDay}
                        onChange={(e) =>
                          setSelectedDayMap((prev) => ({
                            ...prev,
                            [point.id]: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-300 dark:border-[#2d3a58] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#0088ff]"
                      >
                        <option value="lunes">Lunes (Prioridad Alta)</option>
                        <option value="martes">Martes</option>
                        <option value="miércoles">Miércoles</option>
                        <option value="jueves">Jueves</option>
                        <option value="viernes">Viernes</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-slate-700 dark:text-[#94a3b8] font-mono font-bold">
                      {point.sla}
                    </span>

                    <div className="flex items-center gap-2">
                      {onDeletePoint && (
                        <button
                          type="button"
                          onClick={() => onDeletePoint(point.id)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-[#1e293b] dark:text-[#cbd5e1] dark:hover:text-[#f87171] border border-slate-200 dark:border-transparent transition-colors cursor-pointer"
                          title="Descartar este punto de la lista"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAssignSingle(point)}
                        className="px-4 py-2 rounded-xl bg-[#0088ff] hover:bg-[#0070d8] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0088ff]/30 active:scale-95 transition-all cursor-pointer"
                        title="Asignar e incorporar inmediatamente a la hoja de ruta"
                      >
                        <span className="material-symbols-outlined text-[16px]">person_add</span>
                        <span>Asignar a Ruta</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
